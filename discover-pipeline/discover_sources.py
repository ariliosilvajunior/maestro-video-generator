#!/usr/bin/env python3
"""discover_sources.py — NICHE-AWARE SOURCE DISCOVERY (Phase 1, the "scraping" phase).

Finds fresh, high-performing YouTube videos in YOUR niche to reproduce, using nothing but
yt-dlp (no API key, no login, $0). Three sources, all configured in config.json `discovery.*`
by the setup wizard:

  1. search queries   discovery.queries        — PT + EN phrases that describe the niche
  2. seed channels    discovery.seed_channels  — creators you want to reproduce from (@handle / URL / UC id)
  3. creators roster  creators.jsonl           — YouTube authors of links you pasted before
                                                 (discovery.use_creators_roster)

Every candidate is filtered (age, views, duration, language, excluded keywords), de-duplicated
against the next-videos queue, pipeline-log.csv and the discovery ledger, scored by view velocity
(views per day) and printed as a ranked table. With --enqueue the top `discovery.per_run` links go
into next-videos.jsonl, where Stage 0 claims them exactly like a pasted link.

USAGE
  python3 discover-pipeline/discover_sources.py                       # dry-run: ranked candidates
  python3 discover-pipeline/discover_sources.py --enqueue             # feed the queue (Stage 0 does this when the queue is empty)
  python3 discover-pipeline/discover_sources.py --limit 10 --json
  python3 discover-pipeline/discover_sources.py --queries "agentes de IA" "claude code tutorial" --max-age-days 14
  python3 discover-pipeline/discover_sources.py --channels @somecreator https://www.youtube.com/@another

EXIT CODES
  0 = candidates found (and enqueued when asked)   3 = nothing passed the filters
  4 = yt-dlp missing                                5 = discovery disabled / nothing configured
"""
import argparse
import concurrent.futures as cf
import datetime as dt
import json
import math
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, REPO)
sys.path.insert(0, os.path.join(REPO, "next-videos-pipeline"))
from lib import config as _cfg  # noqa: E402
from lib.locking import atomic_write_text  # noqa: E402

LEDGER = os.path.join(HERE, "discovered-ledger.json")
QUEUE = os.path.join(REPO, "next-videos.jsonl")
LOG_CSV = os.path.join(REPO, "pipeline-log.csv")
CREATORS = os.path.join(REPO, "creators.jsonl")

PT_WORDS = {"de", "que", "não", "para", "com", "uma", "você", "como", "mais", "isso", "está", "fazer", "vídeo",
            "aqui", "seu", "sua", "também", "muito", "tudo", "agora", "por", "dos", "das", "nesse", "esse", "essa"}
EN_WORDS = {"the", "and", "you", "this", "that", "with", "for", "how", "your", "are", "what", "have", "from",
            "will", "can", "just", "about", "video", "here", "not", "into", "using", "build", "make"}
ES_WORDS = {"que", "para", "con", "una", "cómo", "esto", "más", "está", "hacer", "aquí", "también", "muy", "todo",
            "ahora", "los", "las", "este", "esta", "pero", "porque"}


def log(msg):
    print(f"[discover] {msg}", flush=True)


# ───────────────────────────── yt-dlp helpers ─────────────────────────────
def _ytdlp():
    return os.environ.get("YTDLP") or shutil.which("yt-dlp")


def _run_json(args, timeout=90):
    """Run yt-dlp with -j and return a list of dicts (one per output line). Never raises."""
    cmd = [_ytdlp(), "--no-warnings", "--ignore-errors", "--skip-download", "-j"] + args
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        log(f"timeout: {' '.join(args)[:80]}")
        return []
    out = []
    for line in r.stdout.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return out


def search(query, depth, newest_first):
    prefix = f"ytsearchdate{depth}:" if newest_first else f"ytsearch{depth}:"
    return _run_json(["--flat-playlist", prefix + query])


def channel_url(ref):
    """Normalise @handle / UC id / URL into a channel /videos URL."""
    ref = ref.strip()
    if not ref:
        return ""
    if ref.startswith("@"):
        return f"https://www.youtube.com/{ref}/videos"
    if re.fullmatch(r"UC[\w-]{20,}", ref):
        return f"https://www.youtube.com/channel/{ref}/videos"
    if ref.startswith("http"):
        ref = ref.rstrip("/")
        if not re.search(r"/(videos|shorts|streams)$", ref):
            ref += "/videos"
        return ref
    return f"https://www.youtube.com/@{ref}/videos"


def channel_videos(ref, limit):
    url = channel_url(ref)
    if not url:
        return []
    return _run_json(["--flat-playlist", "--playlist-end", str(limit), url])


def details(url):
    d = _run_json(["--no-playlist", url], timeout=60)
    return d[0] if d else None


# ───────────────────────────── filters / scoring ─────────────────────────────
def video_id(url_or_id):
    m = re.search(r"(?:v=|/shorts/|youtu\.be/|/watch/)([\w-]{11})", url_or_id or "")
    if m:
        return m.group(1)
    return url_or_id if re.fullmatch(r"[\w-]{11}", url_or_id or "") else ""


def canonical(vid):
    return f"https://www.youtube.com/watch?v={vid}"


def detect_language(text):
    words = re.findall(r"[a-záàâãéêíóôõúç]+", (text or "").lower())
    if not words:
        return "?"
    pt = sum(w in PT_WORDS for w in words)
    en = sum(w in EN_WORDS for w in words)
    es = sum(w in ES_WORDS for w in words)
    best = max((pt, "pt"), (en, "en"), (es, "es"))
    return best[1] if best[0] else "?"


def age_days(entry):
    ts = entry.get("timestamp")
    if ts:
        return max(0.0, (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromtimestamp(ts, dt.timezone.utc)).total_seconds() / 86400)
    up = entry.get("upload_date")
    if up and re.fullmatch(r"\d{8}", str(up)):
        d = dt.datetime.strptime(str(up), "%Y%m%d").replace(tzinfo=dt.timezone.utc)
        return max(0.0, (dt.datetime.now(dt.timezone.utc) - d).total_seconds() / 86400)
    return None


def score(entry, opts):
    views = entry.get("view_count") or 0
    age = entry.get("_age_days")
    velocity = views / max(age or 1.0, 1.0)
    s = 1.0 * math.log10(views + 1) + 1.5 * math.log10(velocity + 1)
    likes = entry.get("like_count") or 0
    if views and likes:
        s += min(0.5, 10.0 * likes / views)          # engagement bonus (capped)
    if entry.get("_source", "").startswith("channel:"):
        s += 0.6                                      # you asked for this creator explicitly
    if opts["prefer_shorts"] and (entry.get("duration") or 0) <= 60:
        s += 0.4
    s += 0.2 * (entry.get("_hits", 1) - 1)            # surfaced by several queries
    return round(s, 3)


def known_ids():
    """Video ids already in the queue, already posted (pipeline-log.csv) or already proposed (ledger)."""
    seen = {}
    if os.path.exists(QUEUE):
        for line in open(QUEUE, encoding="utf-8"):
            try:
                e = json.loads(line)
            except json.JSONDecodeError:
                continue
            v = video_id(e.get("url", ""))
            if v:
                seen[v] = "queue"
    if os.path.exists(LOG_CSV):
        for v in re.findall(r"(?:v=|/shorts/|youtu\.be/)([\w-]{11})", open(LOG_CSV, encoding="utf-8", errors="ignore").read()):
            seen.setdefault(v, "posted")
    for v in load_ledger().get("seen", {}):
        seen.setdefault(v, "proposed")
    return seen


def load_ledger():
    try:
        return json.load(open(LEDGER, encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"seen": {}}


def save_ledger(ledger):
    ledger.setdefault("seen", {})
    ledger["updated_at"] = dt.datetime.now().isoformat(timespec="seconds")
    atomic_write_text(LEDGER, json.dumps(ledger, ensure_ascii=False, indent=1) + "\n")


def roster_channels():
    """YouTube creators captured in creators.jsonl (authors of links you pasted)."""
    out = []
    if not os.path.exists(CREATORS):
        return out
    for line in open(CREATORS, encoding="utf-8"):
        try:
            r = json.loads(line)
        except json.JSONDecodeError:
            continue
        if r.get("platform") == "youtube" and (r.get("profile_url") or r.get("username")):
            out.append(r.get("profile_url") or "@" + r["username"])
    return out


# ───────────────────────────── main ─────────────────────────────
def gather(opts):
    """Return {video_id: flat entry} from queries + channels."""
    cands = {}

    def take(entries, source):
        for e in entries:
            vid = video_id(e.get("url") or e.get("id") or "")
            if not vid or e.get("live_status") in ("is_live", "is_upcoming"):
                continue
            cur = cands.get(vid)
            if cur:
                cur["_hits"] = cur.get("_hits", 1) + 1
                continue
            e = dict(e)
            e["_source"] = source
            e["_hits"] = 1
            cands[vid] = e

    for q in opts["queries"]:
        take(search(q, opts["search_depth"], newest_first=False), f"query:{q}")
        take(search(q, opts["search_depth"], newest_first=True), f"query:{q}")
        log(f"query {q!r}: {len(cands)} candidates so far")
    for ch in opts["channels"]:
        take(channel_videos(ch, opts["channel_depth"]), f"channel:{ch}")
        log(f"channel {ch!r}: {len(cands)} candidates so far")
    return cands


def cheap_filter(e, opts):
    dur = e.get("duration")
    if dur is not None and not (opts["min_duration_s"] <= dur <= opts["max_duration_s"]):
        return "duration"
    views = e.get("view_count")
    if views is not None and views < opts["min_views"]:
        return "views"
    title = (e.get("title") or "").lower()
    for kw in opts["exclude_keywords"]:
        if kw and kw.lower() in title:
            return f"excluded:{kw}"
    return ""


def full_filter(e, opts):
    reason = cheap_filter(e, opts)
    if reason:
        return reason
    if (e.get("view_count") or 0) < opts["min_views"]:
        return "views"
    age = e.get("_age_days")
    if age is None:
        return "undated"
    if age > opts["max_age_days"]:
        return "too-old"
    text = f"{e.get('title', '')} {(e.get('description') or '')[:600]}"
    for kw in opts["exclude_keywords"]:
        if kw and kw.lower() in text.lower():
            return f"excluded:{kw}"
    lang = (e.get("language") or "").split("-")[0].lower() or detect_language(text)
    e["_lang"] = lang
    if opts["languages"] and lang not in opts["languages"] and lang != "?":
        return f"lang:{lang}"
    return ""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--queries", nargs="*", help="override config discovery.queries")
    ap.add_argument("--channels", nargs="*", help="override config discovery.seed_channels")
    ap.add_argument("--no-roster", action="store_true", help="ignore creators.jsonl even if discovery.use_creators_roster")
    ap.add_argument("--limit", type=int, default=None, help="rows to show (default discovery.per_run × 4)")
    ap.add_argument("--enqueue", action="store_true", help="add the top discovery.per_run (or --top) links to next-videos.jsonl")
    ap.add_argument("--top", type=int, default=None, help="how many to enqueue (default discovery.per_run)")
    ap.add_argument("--max-age-days", type=int, default=None)
    ap.add_argument("--min-views", type=int, default=None)
    ap.add_argument("--max-duration-s", type=int, default=None)
    ap.add_argument("--search-depth", type=int, default=None, help="results per query per sort (default 15)")
    ap.add_argument("--max-details", type=int, default=25, help="candidates to fetch full metadata for (~3-5 s each, 8 in parallel)")
    ap.add_argument("--include-seen", action="store_true", help="re-propose videos already in the ledger")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args()

    if not _ytdlp():
        print("ERROR: yt-dlp not found — install it (brew install yt-dlp / pip install -U yt-dlp)", file=sys.stderr)
        return 4
    if a.quiet:
        globals()["log"] = lambda m: None

    g = lambda k, d=None: _cfg.get(f"discovery.{k}", d)  # noqa: E731
    if not g("enabled", True) and not (a.queries or a.channels):
        print("discovery is disabled in config (discovery.enabled=false) — pass --queries/--channels to run anyway", file=sys.stderr)
        return 5
    queries = a.queries if a.queries is not None else list(g("queries", []) or [])
    channels = a.channels if a.channels is not None else list(g("seed_channels", []) or [])
    if not a.no_roster and g("use_creators_roster", True):
        for c in roster_channels():
            if c not in channels:
                channels.append(c)
    if not queries and not channels:
        print("nothing to search: fill discovery.queries and/or discovery.seed_channels (the /setup niche step)", file=sys.stderr)
        return 5
    opts = {
        "queries": queries, "channels": channels,
        "search_depth": a.search_depth or int(g("search_depth", 15)), "channel_depth": int(g("channel_depth", 20)),
        "max_age_days": a.max_age_days or int(g("max_age_days", 30)),
        "min_views": a.min_views if a.min_views is not None else int(g("min_views", 5000)),
        "min_duration_s": int(g("min_duration_s", 20)),
        "max_duration_s": a.max_duration_s or int(g("max_duration_s", 900)),
        "languages": [str(x).lower()[:2] for x in (g("languages", ["pt", "en"]) or [])],
        "exclude_keywords": [str(x) for x in (g("exclude_keywords", []) or [])],
        "prefer_shorts": bool(g("prefer_shorts", False)),
        "per_run": int(g("per_run", 3)),
    }
    log(f"niche: {_cfg.get('brand.niche', '') or '(brand.niche empty)'} | {len(queries)} queries, {len(channels)} channels, "
        f"≤{opts['max_age_days']}d, ≥{opts['min_views']} views, {opts['min_duration_s']}–{opts['max_duration_s']}s, langs {opts['languages']}")

    cands = gather(opts)
    if not cands:
        log("no candidates returned by yt-dlp (network? query too narrow?)")
        return 3
    seen = known_ids()
    pool = []
    for vid, e in cands.items():
        if vid in seen and not (a.include_seen and seen[vid] == "proposed"):
            continue
        if cheap_filter(e, opts):
            continue
        pool.append(e)
    pool.sort(key=lambda e: (e.get("view_count") or 0), reverse=True)
    pool = pool[: a.max_details]
    log(f"{len(cands)} candidates → {len(pool)} to inspect (after dedupe + cheap filters)")

    kept, rejected = [], {}
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(details, canonical(video_id(e.get("url") or e.get("id")))): e for e in pool}
        for fut in cf.as_completed(futs):
            base = futs[fut]
            try:
                d = fut.result()
            except Exception:  # noqa: BLE001
                d = None
            if not d:
                rejected["no-metadata"] = rejected.get("no-metadata", 0) + 1
                continue
            e = dict(base)
            for k in ("title", "description", "duration", "view_count", "like_count", "upload_date", "timestamp",
                      "language", "channel", "channel_id", "channel_follower_count", "tags"):
                if d.get(k) is not None:
                    e[k] = d[k]
            e["_age_days"] = age_days(e)
            why = full_filter(e, opts)
            if why:
                rejected[why.split(":")[0]] = rejected.get(why.split(":")[0], 0) + 1
                continue
            e["_score"] = score(e, opts)
            kept.append(e)
    kept.sort(key=lambda e: e["_score"], reverse=True)
    log(f"kept {len(kept)}; rejected {dict(sorted(rejected.items()))}")
    if not kept:
        return 3

    limit = a.limit or opts["per_run"] * 4
    rows = kept[:limit]
    ledger = load_ledger()
    for e in rows:
        vid = video_id(e.get("url") or e.get("id"))
        ledger["seen"].setdefault(vid, {"first_seen": dt.datetime.now().isoformat(timespec="seconds"),
                                        "title": e.get("title"), "channel": e.get("channel"), "enqueued": False})
    if a.json:
        print(json.dumps([{
            "rank": i + 1, "score": e["_score"], "url": canonical(video_id(e.get("url") or e.get("id"))),
            "title": e.get("title"), "channel": e.get("channel"), "views": e.get("view_count"),
            "age_days": round(e["_age_days"], 1), "duration_s": e.get("duration"), "lang": e.get("_lang"),
            "source": e["_source"]} for i, e in enumerate(rows)], ensure_ascii=False, indent=1))
    else:
        print(f"\n{'#':>2}  {'score':>6}  {'views':>9}  {'age':>5}  {'dur':>5}  {'lang':<4}  {'channel':<24}  title")
        for i, e in enumerate(rows, 1):
            print(f"{i:>2}  {e['_score']:>6.2f}  {e.get('view_count') or 0:>9,}  {e['_age_days']:>4.0f}d  {e.get('duration') or 0:>4.0f}s  "
                  f"{(e.get('_lang') or '?'):<4}  {(e.get('channel') or '')[:24]:<24}  {(e.get('title') or '')[:70]}")
            print(f"{'':>2}  {canonical(video_id(e.get('url') or e.get('id')))}   ← {e['_source'][:60]}")

    if a.enqueue:
        import next_videos  # noqa: E402  (next-videos-pipeline on sys.path)
        n = a.top or opts["per_run"]
        added = 0
        for e in rows:
            if added >= n:
                break
            url = canonical(video_id(e.get("url") or e.get("id")))
            status, count = next_videos.add(url, note=f"discovery: {e['_source'][:80]} | {(e.get('title') or '')[:60]}")
            if status in ("added", "added-respin"):
                added += 1
                ledger["seen"][video_id(url)]["enqueued"] = True
                log(f"enqueued ({status}) [{count} in line]: {url}  {(e.get('title') or '')[:60]}")
            else:
                log(f"skipped ({status}): {url}")
        log(f"{added} link(s) enqueued → Stage 0 will claim them (python3 next-videos-pipeline/next_videos.py list)")
    save_ledger(ledger)
    return 0


if __name__ == "__main__":
    sys.exit(main())
