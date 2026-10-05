#!/usr/bin/env python3
"""
select_stock_brolls.py — Phase 4 stock b-roll selector (multi-source, $0).

The ONLY b-roll source is real stock footage (an A/B test showed stock passed QC 100/100 at $0
while AI-generated b-roll scored lower and cost money). For each candidate
b-roll window it queries free stock-video APIs for a vertical clip that matches the
agent-written keywords, downloads the best fit, and extracts a review frame. Emits a manifest
in the EXACT format insert_brolls.py consumes.

ANTI-REPETITION (house rules "same b-rolls keep repeating across videos"):
  Root cause was structural, not a source problem:
    1. QCR-032 made the pick DETERMINISTIC by always taking the lowest-id clip for a query.
       Same query => same single clip, forever, across every video.
    2. Nothing remembered which clips were already used across runs.
    3. A narrow AI/Claude vocabulary produced the same handful of queries every time.
  Fix (keeps the QCR-032 dry-run==real-run invariant):
    - A persistent USED-CLIP LEDGER (broll-used-ledger.json) records every clip id ever
      inserted, keyed as "<source>:<id>".
    - The pick is still fully deterministic, but it takes the lowest-id clip NOT in the
      ledger. The ledger is loaded once at run start and frozen for the run, so the dry-run
      and the real run (and any --only-window re-run) still resolve to the SAME clip — the
      file you reviewed is the file that gets inserted. Only a real (non-dry) HIT appends to
      the ledger on disk. Intra-video dedup is automatic too (a clip used by window 1 is
      excluded for window 2 in the same run).
    - MULTI-SOURCE rotation: Pexels -> Pixabay -> Coverr (whichever have keys). Tripling the
      pool makes exhaustion (which would force a repeat) effectively impossible.

FALLBACK-TO-MOTION (the key behavior): a window with no acceptable FRESH clip is a MISS — it
is OMITTED from the manifest and reported. The agent then builds a normal MOTION scene over
that window (the no-overlap protocol fills it), so a missed b-roll is replaced by motion, never
left empty, and never an old repeat. There is NO AI generation in the default path.

Two-step agent workflow (mirrors the old fal.ai dry-run → prompts flow):
  1. Write <Name>_broll_queries.json: a JSON array, one element per window (plan order),
     each element a list of 1-4 simple English search phrases for that window's beat.
     WRITE VARIED queries — the more distinct the vocabulary across videos, the deeper the
     fresh pool. Avoid reusing "artificial intelligence"/"coding" on every video.
  2. Run this script with --plan-file + --queries-file. Review the extracted frames; for any
     clip that is off-topic, shows a human face, or has on-screen text, re-run that single
     window with --only-window N and better --queries, or drop it (→ motion fallback).

Sources (all free, commercial OK, no attribution required for Pexels/Coverr; Pixabay asks a
credit but is fine for our use):
  - Pexels   : key in .claude/keys.md "## Pexels".   orientation=portrait, true 1080x1920.
  - Pixabay  : key in .claude/keys.md "## Pixabay".  no orientation param -> client-side filter.
  - Coverr   : key in .claude/keys.md "## Coverr".   curated, less "stocky".
The CDN download links require a browser User-Agent (else HTTP 403).
"""
import argparse, json, os, re, subprocess, sys, time, urllib.parse, urllib.request, urllib.error

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 broll-pipeline"
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from lib.api_keys import resolve_key as _resolve_key  # noqa: E402
from lib.ffmpeg import find_ffmpeg as _find_ffmpeg  # noqa: E402
from lib.paths import maestro_tmp, downloads  # noqa: E402
LEDGER_PATH = os.path.join(HERE, "broll-used-ledger.json")
LEDGER_CAP = 4000  # keep the most recent N ids; older ones may resurface (rare, harmless)

PEXELS_SEARCH = "https://api.pexels.com/videos/search"
PIXABAY_SEARCH = "https://pixabay.com/api/videos/"
COVERR_SEARCH = "https://api.coverr.co/videos"

# Source preference order. A source is enabled only if its key resolves.
SOURCE_ORDER = ["pexels", "pixabay", "coverr"]


# ─── Keys ────────────────────────────────────────────────────────────────────

def resolve_key(service, cli_key=None):
    """Resolve an API key for a service: CLI / env / .claude/keys.md (`## <Service>` section)."""
    return _resolve_key(service, cli_key)


# ─── Used-clip ledger ────────────────────────────────────────────────────────

def load_ledger():
    try:
        d = json.load(open(LEDGER_PATH, encoding="utf-8"))
        return set(d.get("used", []))
    except Exception:
        return set()


def save_ledger(used):
    ordered = list(used)[-LEDGER_CAP:]
    try:
        json.dump({"used": ordered, "count": len(ordered)},
                  open(LEDGER_PATH, "w"), indent=0)
    except Exception as e:
        print(f"    WARN: could not write ledger {LEDGER_PATH}: {e}")


def ledger_key(c):
    return f"{c['source']}:{c['id']}"


# ─── HTTP ────────────────────────────────────────────────────────────────────

def _get_json(url, headers=None, retries=3, tag=""):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers or {"User-Agent": UA})
            return json.load(urllib.request.urlopen(req, timeout=30))
        except urllib.error.HTTPError as e:
            print(f"    [{tag}] HTTP {e.code} (attempt {attempt+1})")
            if e.code == 401 and attempt == 0:
                print(f"    {tag}: key rejected (401).")
                return None
            time.sleep(3 * (attempt + 1))
        except Exception as e:
            print(f"    [{tag}] error {e} (attempt {attempt+1})")
            time.sleep(3 * (attempt + 1))
    return None


# ─── Per-source search (returns NORMALISED candidates) ───────────────────────
# normalised candidate = {source, id, duration, width, height, download, page}

def pick_pexels_file(v):
    """Best portrait file: prefer exact 1080x1920, else smallest height>=1920, else tallest."""
    pf = [f for f in v.get("video_files", []) if f["height"] > f["width"]]
    if not pf:
        return None
    exact = [f for f in pf if f["width"] == 1080 and f["height"] == 1920]
    if exact:
        return exact[0]
    big = sorted([f for f in pf if f["height"] >= 1920], key=lambda f: f["height"])
    return big[0] if big else max(pf, key=lambda f: f["height"])


def search_pexels(key, query, dur, per_page=60):
    url = PEXELS_SEARCH + "?" + urllib.parse.urlencode(
        {"query": query, "orientation": "portrait", "size": "medium", "per_page": per_page})
    data = _get_json(url, headers={"Authorization": key, "User-Agent": UA}, tag=f"pexels:{query}")
    out = []
    for v in (data or {}).get("videos", []):
        f = pick_pexels_file(v)
        if not f or v.get("duration", 0) < dur:
            continue
        out.append({"source": "pexels", "id": v["id"], "duration": float(v["duration"]),
                    "width": f["width"], "height": f["height"], "download": f["link"],
                    "page": v.get("url")})
    return out


def search_pixabay(key, query, dur, per_page=60):
    # Pixabay has no orientation param for video -> filter portrait client-side.
    url = PIXABAY_SEARCH + "?" + urllib.parse.urlencode(
        {"key": key, "q": query, "per_page": per_page, "safesearch": "true"})
    data = _get_json(url, tag=f"pixabay:{query}")
    out = []
    for h in (data or {}).get("hits", []):
        vids = h.get("videos", {})
        # prefer large/medium portrait file
        best = None
        for size in ("large", "medium", "small", "tiny"):
            f = vids.get(size)
            if f and f.get("height", 0) > f.get("width", 0) and f.get("url"):
                best = f
                break
        if not best or h.get("duration", 0) < dur:
            continue
        out.append({"source": "pixabay", "id": h["id"], "duration": float(h["duration"]),
                    "width": best["width"], "height": best["height"], "download": best["url"],
                    "page": h.get("pageURL")})
    return out


def search_coverr(key, query, dur, per_page=50):
    # Coverr Content API. Auth via api_key query param. Search results DON'T include `urls`,
    # so the mp4 is built from base_filename (verified pattern, CDN HEAD 200). Portrait is the
    # `is_vertical` flag; `duration` arrives as a STRING (must cast before comparing).
    url = COVERR_SEARCH + "?" + urllib.parse.urlencode(
        {"query": query, "page_size": per_page, "api_key": key})
    data = _get_json(url, tag=f"coverr:{query}")
    out = []
    for v in (data or {}).get("hits", []):
        base = v.get("base_filename")
        try:
            d = float(v.get("duration") or 0)
        except (TypeError, ValueError):
            d = 0.0
        w = v.get("max_width") or 0
        ht = v.get("max_height") or 0
        portrait = v.get("is_vertical") or (ht > w)
        if not base or not portrait or d < dur:
            continue
        dl = f"https://cdn.coverr.co/videos/{base}/1080p.mp4"
        out.append({"source": "coverr", "id": v.get("id"), "duration": d,
                    "width": w, "height": ht, "download": dl,
                    "page": f"https://coverr.co/videos/{v.get('slug')}" if v.get("slug") else None})
    return out


SEARCHERS = {"pexels": search_pexels, "pixabay": search_pixabay, "coverr": search_coverr}


def gather_fresh(enabled, keys, qlist, dur, used):
    """Try each query across each enabled source (in preference order); return the first
    deterministic FRESH candidate (lowest id not in the ledger). None if nothing fresh."""
    for q in qlist:
        for src in enabled:
            cands = SEARCHERS[src](keys[src], q, dur)
            cands.sort(key=lambda c: (c["id"] if isinstance(c["id"], int) else str(c["id"])))
            for c in cands:
                if ledger_key(c) not in used:
                    return q, c
    return None, None


# ─── Media helpers ───────────────────────────────────────────────────────────

def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r, open(dest, "wb") as fh:
        fh.write(r.read())
    return os.path.getsize(dest)


def extract_frame(video, png, at=1.0):
    ff = _find_ffmpeg()
    subprocess.run([ff, "-y", "-ss", str(at), "-i", video, "-frames:v", "1", png],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def load_windows(plan_file):
    d = json.load(open(plan_file, encoding="utf-8"))
    return d.get("broll_windows", [])


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Multi-source stock b-roll selector (Phase 4).")
    ap.add_argument("--plan-file", required=True, help="visual plan json with broll_windows[]")
    ap.add_argument("--queries-file", required=True, help="json array, one [queries...] list per window")
    ap.add_argument("--video-name", required=True)
    ap.add_argument("--output-dir", default=downloads())
    ap.add_argument("--api-key", default=None, help="Pexels key (else env/keys.md)")
    ap.add_argument("--sources", default="auto",
                    help="comma list of pexels,pixabay,coverr or 'auto' (all with a key)")
    ap.add_argument("--only-window", type=int, default=0, help="re-run a single 1-based window index")
    ap.add_argument("--drop-window", type=int, default=0,
                    help="agent rejected this 1-based window (face/text/off-topic) → remove its clip "
                         "from the manifest so the window becomes a MOTION scene. No search/download.")
    ap.add_argument("--frame-dir", default=maestro_tmp(), help="where to write review frames")
    ap.add_argument("--dry-run", action="store_true", help="search only, no download, no ledger write")
    ap.add_argument("--ignore-ledger", action="store_true",
                    help="debug: do NOT exclude previously-used clips (allows repeats)")
    args = ap.parse_args()

    # Resolve keys for each requested source.
    want = SOURCE_ORDER if args.sources == "auto" else [s.strip() for s in args.sources.split(",")]
    keys = {}
    for src in want:
        k = resolve_key("pexels", args.api_key) if src == "pexels" else resolve_key(src)
        if k:
            keys[src] = k
    enabled = [s for s in SOURCE_ORDER if s in keys]
    if not enabled:
        print("FATAL: no usable source key. Add Pexels (and optionally Pixabay/Coverr) to "
              ".claude/keys.md, or pass --api-key.")
        sys.exit(2)
    print(f"Sources enabled (in order): {', '.join(enabled)}"
          + ("" if "pexels" in enabled else "  [WARN: pexels missing]"))

    windows = load_windows(args.plan_file)
    name = args.video_name

    # --drop-window: agent rejected this window's clip → remove from manifest → it becomes motion.
    if args.drop_window:
        mpath = os.path.join(args.output_dir, f"{name}_broll_manifest.json")
        if not os.path.exists(mpath):
            print(f"FATAL: no manifest at {mpath} to drop from."); sys.exit(2)
        man = json.load(open(mpath, encoding="utf-8"))
        idx = args.drop_window - 1
        if idx < 0 or idx >= len(windows):
            print(f"FATAL: --drop-window {args.drop_window} out of range (1..{len(windows)})."); sys.exit(2)
        target = float(windows[idx]["insert_at"])
        before = len(man["brolls"])
        man["brolls"] = [b for b in man["brolls"] if abs(b["insert_at"] - target) > 0.01]
        json.dump(man, open(mpath, "w"), indent=2)
        clip = os.path.join(args.output_dir, f"{name}_stock_{args.drop_window}.mp4")
        if os.path.exists(clip):
            os.remove(clip)
        print(f"DROPPED window {args.drop_window} @ {target}s "
              f"({before}->{len(man['brolls'])} brolls). Build a MOTION scene over {target}s in Phase 5.")
        sys.exit(0)

    queries = json.load(open(args.queries_file, encoding="utf-8"))
    if len(queries) != len(windows):
        print(f"WARN: {len(queries)} query-sets for {len(windows)} windows — using min().")
    os.makedirs(args.frame_dir, exist_ok=True)
    os.makedirs(args.output_dir, exist_ok=True)

    # Used-clip ledger (frozen for this run → dry-run == real run). Empty set if --ignore-ledger.
    used = set() if args.ignore_ledger else load_ledger()
    ledger_start = len(used)

    manifest_path = os.path.join(args.output_dir, f"{name}_broll_manifest.json")
    if args.only_window and os.path.exists(manifest_path):
        manifest = json.load(open(manifest_path, encoding="utf-8"))
        # seed `used` with clips already in this manifest so a re-run won't duplicate them
        for b in manifest.get("brolls", []):
            if b.get("source") and b.get("clip_id") is not None:
                used.add(f"{b['source']}:{b['clip_id']}")
    else:
        manifest = {"video_name": name, "source": "stock-multi",
                    "main_video": os.path.join(args.output_dir, f"{name}_motion.mp4"),
                    "brolls": []}

    report, misses = [], []
    hits = 0
    n = min(len(windows), len(queries))
    for i in range(n):
        idx = i + 1
        if args.only_window and idx != args.only_window:
            continue
        w = windows[i]
        qlist = queries[i] if isinstance(queries[i], list) else [str(queries[i])]
        dur = float(w.get("duration", 5.0))
        beat = w.get("beat", "")

        q, c = gather_fresh(enabled, keys, qlist, dur, used)
        if not c:
            misses.append(w.get("insert_at"))
            report.append(f"W{idx} @ {w.get('insert_at')}s  MISS — no FRESH portrait>= {dur}s clip "
                          f"for {qlist} across [{','.join(enabled)}]  -> build a MOTION scene")
            continue

        # Reserve this clip immediately so later windows in THIS run can't reuse it.
        used.add(ledger_key(c))

        if args.dry_run:
            hits += 1
            report.append(f"W{idx} @ {w.get('insert_at')}s  would use {c['source']} id={c['id']} "
                          f"q='{q}' {c['width']}x{c['height']} dur={c['duration']}s")
            continue

        dest = os.path.join(args.output_dir, f"{name}_stock_{idx}.mp4")
        sz = download(c["download"], dest)
        frame = os.path.join(args.frame_dir, f"{name}_stockframe_{idx}.png")
        extract_frame(dest, frame, at=min(1.0, c["duration"] / 2))
        entry = {"file": dest, "insert_at": float(w["insert_at"]), "duration": dur,
                 "prompt": f"{c['source'].upper()} stock (q='{q}', id={c['id']}): {beat}",
                 "context": beat, "source": c["source"], "clip_id": c["id"],
                 "clip_url": c.get("page"),
                 # back-compat: keep pexels_id when the source is pexels
                 "pexels_id": c["id"] if c["source"] == "pexels" else None,
                 "pexels_url": c.get("page") if c["source"] == "pexels" else None}
        manifest["brolls"] = [b for b in manifest["brolls"] if abs(b["insert_at"] - entry["insert_at"]) > 0.01]
        manifest["brolls"].append(entry)
        hits += 1
        report.append(f"W{idx} @ {w['insert_at']}s  HIT  {c['source']} id={c['id']} q='{q}' "
                      f"{c['width']}x{c['height']} clipdur={c['duration']}s {sz/1e6:.1f}MB  frame={frame}")

    manifest["brolls"].sort(key=lambda b: b["insert_at"])
    if not args.dry_run:
        json.dump(manifest, open(manifest_path, "w"), indent=2)
        if not args.ignore_ledger:
            save_ledger(used)

    print("\n".join(report))
    print("\n" + "=" * 60)
    scanned = n if not args.only_window else 1
    print(f"STOCK SELECTION {'(dry-run) ' if args.dry_run else ''}— {hits} HIT / "
          f"{len(misses)} MISS of {scanned} window(s) scanned  |  sources=[{','.join(enabled)}]")
    if not args.ignore_ledger:
        print(f"Ledger: {ledger_start} known used clips at start"
              + ("" if args.dry_run else f" -> {len(used)} after this run  ({LEDGER_PATH})"))
    if misses:
        print(f"MISS windows (insert_at, build MOTION scenes over these): {misses}")
    if not args.dry_run:
        print(f"Manifest: {manifest_path}")
        print("AGENT: review each frame above. Reject any clip with a human FACE, on-screen TEXT,")
        print("or that is off-topic -> re-run that window (--only-window N --queries-file with new")
        print("keywords) or remove it from the manifest so its window becomes a MOTION scene.")
    print("=" * 60)


if __name__ == "__main__":
    main()
