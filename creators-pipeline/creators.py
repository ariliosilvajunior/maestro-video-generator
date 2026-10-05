#!/usr/bin/env python3
"""
creators.py — the CREATOR STORAGE for the Maestro Video Generator / Maestro Video Generator repo.

WHAT (house rule): whenever a source video link is saved to the
NEXT-VIDEOS QUEUE (`next_videos.py add`), we ALSO resolve WHO made that video (the
creator's Instagram/YouTube/TikTok profile) and remember them. Over time this builds a
deduped roster of the creators we reproduce from — `creators.jsonl` — so we can later do
other things with it (outreach, credit, dashboards, source-quality scoring, etc.).

For NOW the requirement is only: on each saved link, get the creator, check if they are
already in storage, and add them if not. This file is that mechanism.

WHY a separate manager (decoupled from `next_videos.py`): resolving a creator means a
yt-dlp NETWORK call (slow, can fail, IP-block risk). The queue `add` must stay fast,
offline, and atomic. So creator capture is its OWN step that runs AFTER the link is
queued — never inside the queue's flock. The storage write here uses the SAME atomic
`flock` + temp-file + os.replace pattern as `next_videos.py` / `maestro_state.py` (QCR-173),
so concurrent runs never corrupt `creators.jsonl`.

HOW we get the creator from a bare reel/short permalink (validated on the live
queue): `yt-dlp --skip-download -J <URL>` returns metadata with NO cookies / no login —
`channel` = the @handle (canonical key), `uploader` = display name, `uploader_id` =
numeric platform id. Metadata-only: the video is NOT downloaded.

IP-BLOCK CARE: a single `capture` is one request — fine. `backfill` (many URLs) SPACES
requests with a jittered sleep (default ~7s) so we never hammer the platform.

STORAGE: `creators.jsonl` at the repo root — one JSON object per line:
  {"username", "display_name", "platform", "uploader_id", "profile_url",
   "first_seen_at", "last_seen_at", "video_count", "source_urls": [...], "note"}
Dedup key: (platform, username) — fallback (platform, uploader_id) when no handle.

USAGE:
    # resolve only (no save) — for testing / inspection
    python3 creators-pipeline/creators.py resolve "https://www.instagram.com/reel/DYhyUs1CIkG"

    # the real step: resolve + dedup + save (run right after next_videos.py add)
    python3 creators-pipeline/creators.py capture "https://www.instagram.com/reel/DYhyUs1CIkG"

    # is a creator already stored?
    python3 creators-pipeline/creators.py has nateherkai

    # one-shot: capture every link currently in the next-videos queue (spaced requests)
    python3 creators-pipeline/creators.py backfill --from-queue

    python3 creators-pipeline/creators.py list        # human-readable roster
    python3 creators-pipeline/creators.py count        # number of distinct creators

Library use:
    import creators
    info = creators.resolve(url)          # {username, display_name, platform, ...} or None
    status, total = creators.capture(url) # ("new"|"seen"|"unresolved", distinct_count)
"""
import argparse, json, os, sys, re, subprocess, time, random

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)                          # repo root (parent of creators-pipeline/)
sys.path.insert(0, REPO)
from lib.locking import flock as _flock, atomic_write_text  # noqa: E402
from lib.jsonl import read_jsonl as _read_rows  # noqa: E402  (tolerates garbled lines)
from lib.timeutil import now_iso as _now  # noqa: E402

STORE = os.path.join(REPO, "creators.jsonl")          # the creator roster, at the repo root
QUEUE = os.path.join(REPO, "next-videos.jsonl")       # next-videos queue (for --from-queue backfill)


# ── atomic locked read-modify-write (flock/atomic write live in lib/locking.py) ──────
def _atomic_write(path, rows):
    atomic_write_text(path, "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows))


# ── platform + url helpers ───────────────────────────────────────────────────
def _platform_from_url(url):
    u = (url or "").lower()
    if "instagram.com" in u:
        return "instagram"
    if "tiktok.com" in u:
        return "tiktok"
    if "youtube.com" in u or "youtu.be" in u:
        return "youtube"
    return "unknown"


def _profile_url(platform, username, fallback=""):
    if fallback and fallback not in ("NA", "None", ""):
        return fallback
    if not username:
        return ""
    if platform == "instagram":
        return f"https://www.instagram.com/{username}"
    if platform == "tiktok":
        return f"https://www.tiktok.com/@{username}"
    if platform == "youtube":
        return f"https://www.youtube.com/@{username}"
    return ""


# ── creator resolution via yt-dlp (metadata only, NO download) ───────────────
def resolve(url, socket_timeout=30):
    """Resolve a video URL -> creator info dict, or None if it can't be resolved.

    Uses `yt-dlp --skip-download -J` (no cookies, metadata only). Returns:
      {username, display_name, platform, uploader_id, profile_url, source_url}
    `username` is the @handle (yt-dlp `channel`); falls back to a slugged display name
    or the numeric id so we never lose a creator just because a handle field was empty.
    """
    platform = _platform_from_url(url)
    cmd = ["yt-dlp", "--no-warnings", "--skip-download", "--no-playlist",
           "--socket-timeout", str(socket_timeout), "-J", url]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=socket_timeout + 30)
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"[creators] yt-dlp failed for {url}: {e}", file=sys.stderr)
        return None
    if res.returncode != 0 or not res.stdout.strip():
        print(f"[creators] could not resolve {url}: "
              f"{res.stderr.strip()[-200:]}", file=sys.stderr)
        return None
    try:
        meta = json.loads(res.stdout.strip().splitlines()[0])
    except (json.JSONDecodeError, IndexError):
        print(f"[creators] bad metadata json for {url}", file=sys.stderr)
        return None

    if platform == "unknown":
        platform = (meta.get("extractor_key") or "").lower() or "unknown"

    def clean(v):
        v = (v or "").strip()
        return "" if v in ("NA", "None") else v

    channel = clean(meta.get("channel"))
    uploader = clean(meta.get("uploader"))
    uploader_id = clean(str(meta.get("uploader_id") or ""))
    channel_url = clean(meta.get("channel_url")) or clean(meta.get("uploader_url"))

    # username = the @handle. Prefer `channel` (IG/TikTok handle); else a slug of the
    # display name; else the numeric id (so a creator is never dropped).
    username = channel
    if not username and uploader:
        username = re.sub(r"[^a-z0-9._]", "", uploader.lower().replace(" ", ""))
    if not username:
        username = uploader_id
    if not username:
        return None
    username = username.lstrip("@").lower()

    return {
        "username": username,
        "display_name": uploader or channel or username,
        "platform": platform,
        "uploader_id": uploader_id,
        "profile_url": _profile_url(platform, username, channel_url),
        "source_url": url,
    }


# ── dedup key + storage ──────────────────────────────────────────────────────
def _key(platform, username, uploader_id):
    if username:
        return f"{platform}:{username}"
    return f"{platform}:id:{uploader_id}"


def _find(rows, platform, username, uploader_id):
    k = _key(platform, username, uploader_id)
    for r in rows:
        if _key(r.get("platform", ""), r.get("username", ""), r.get("uploader_id", "")) == k:
            return r
    return None


def has(platform, username):
    """True if (platform, username) is already stored. platform may be '' to match any."""
    username = (username or "").lstrip("@").lower()
    for r in _read_rows(STORE):
        if r.get("username", "").lower() == username and (not platform or r.get("platform") == platform):
            return True
    return False


def save(info, note=""):
    """Insert a NEW creator or update an existing one with a fresh source_url/last_seen.
    Returns 'new' if first time seen, else 'seen'."""
    outcome = {"status": "seen"}

    def mut(rows):
        existing = _find(rows, info["platform"], info["username"], info.get("uploader_id", ""))
        if existing is None:
            rows.append({
                "username": info["username"],
                "display_name": info["display_name"],
                "platform": info["platform"],
                "uploader_id": info.get("uploader_id", ""),
                "profile_url": info.get("profile_url", ""),
                "first_seen_at": _now(),
                "last_seen_at": _now(),
                "video_count": 1,
                "source_urls": [info.get("source_url", "")] if info.get("source_url") else [],
                "note": note or "",
            })
            outcome["status"] = "new"
        else:
            src = info.get("source_url", "")
            srcs = existing.setdefault("source_urls", [])
            if src and src not in srcs:
                srcs.append(src)
            existing["video_count"] = len(srcs) or existing.get("video_count", 1)
            existing["last_seen_at"] = _now()
            # backfill any field that was previously empty
            for fld in ("display_name", "uploader_id", "profile_url"):
                if not existing.get(fld) and info.get(fld):
                    existing[fld] = info[fld]
            outcome["status"] = "seen"
        return rows

    with _flock(STORE):
        rows = _read_rows(STORE)
        rows = mut(rows)
        _atomic_write(STORE, rows)
    return outcome["status"]


def capture(url, note=""):
    """Resolve a URL's creator, then dedup-save it. Returns (status, distinct_count).
    status: 'new' | 'seen' | 'unresolved'."""
    info = resolve(url)
    if info is None:
        return ("unresolved", count())
    status = save(info, note=note)
    return (status, count())


def count():
    return len(_read_rows(STORE))


# ── CLI ──────────────────────────────────────────────────────────────────────
def cmd_resolve(a):
    info = resolve(a.url)
    if info is None:
        print("UNRESOLVED"); return 1
    print(json.dumps(info, ensure_ascii=False, indent=2)); return 0


def cmd_capture(a):
    status, total = capture(a.url, note=a.note or "")
    if status == "unresolved":
        print(f"UNRESOLVED (creator not found): {a.url}  [{total} creators stored]"); return 1
    label = "NEW creator stored" if status == "new" else "already stored (seen again)"
    print(f"{label}: {a.url}  [{total} distinct creators]"); return 0


def cmd_has(a):
    sys.exit(0 if has(a.platform or "", a.username) else 1)


def cmd_count(a):
    print(count()); return 0


def cmd_list(a):
    rows = _read_rows(STORE)
    if not rows:
        print("(no creators stored yet)"); return 0
    print(f"{len(rows)} distinct creators:")
    for r in sorted(rows, key=lambda x: (x.get("platform", ""), x.get("username", ""))):
        n = r.get("video_count", len(r.get("source_urls", [])))
        print(f"  @{r.get('username','?'):<22} {r.get('display_name','') :<24} "
              f"{r.get('platform',''):<10} {n} vid(s)  {r.get('profile_url','')}")
    return 0


def cmd_backfill(a):
    # Gather URLs: from the next-videos queue (active entries) and/or explicit args.
    urls = []
    if a.from_queue:
        for e in _read_rows(QUEUE):
            if e.get("status") in ("queued", "in_progress") and e.get("url"):
                urls.append(e["url"])
    urls.extend(a.urls or [])
    # de-dup the URL list while preserving order
    seen, ordered = set(), []
    for u in urls:
        if u not in seen:
            seen.add(u); ordered.append(u)
    if not ordered:
        print("nothing to backfill (queue empty and no URLs given)"); return 0

    print(f"backfilling {len(ordered)} URL(s) — spacing ~{a.space}s/request to avoid IP blocks\n")
    new = seen_again = bad = 0
    for i, u in enumerate(ordered):
        status, total = capture(u, note=a.note or "")
        tag = {"new": "NEW ", "seen": "seen", "unresolved": "FAIL"}[status]
        print(f"  [{i+1}/{len(ordered)}] {tag}  {u}")
        if status == "new":
            new += 1
        elif status == "seen":
            seen_again += 1
        else:
            bad += 1
        if i < len(ordered) - 1:  # space all but the last request
            time.sleep(a.space + random.uniform(0, a.jitter))
    print(f"\ndone: {new} new, {seen_again} repeat, {bad} unresolved  "
          f"[{count()} distinct creators total]")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("resolve"); p.add_argument("url"); p.set_defaults(fn=cmd_resolve)

    p = sub.add_parser("capture"); p.add_argument("url"); p.add_argument("--note", default="")
    p.set_defaults(fn=cmd_capture)

    p = sub.add_parser("has"); p.add_argument("username")
    p.add_argument("--platform", default=""); p.set_defaults(fn=cmd_has)

    sub.add_parser("count").set_defaults(fn=cmd_count)
    sub.add_parser("list").set_defaults(fn=cmd_list)

    p = sub.add_parser("backfill")
    p.add_argument("urls", nargs="*", help="explicit URLs (in addition to --from-queue)")
    p.add_argument("--from-queue", action="store_true", help="capture every active next-videos entry")
    p.add_argument("--space", type=float, default=7.0, help="base seconds between requests (default 7)")
    p.add_argument("--jitter", type=float, default=3.0, help="random extra 0..N seconds (default 3)")
    p.add_argument("--note", default="")
    p.set_defaults(fn=cmd_backfill)

    a = ap.parse_args()
    sys.exit(a.fn(a))


if __name__ == "__main__":
    main()
