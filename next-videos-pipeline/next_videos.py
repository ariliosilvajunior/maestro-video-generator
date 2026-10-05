#!/usr/bin/env python3
"""
next_videos.py — the NEXT-VIDEOS QUEUE for the Maestro Video Generator / Maestro Video Generator repo.

WHAT (house rule): a FIFO queue of SOURCE VIDEO LINKS to run the
pipeline from. When the repo receives a bare video link (and nothing else) the link
is ENQUEUED here, NOT run. Each pipeline execution DISPATCHES the next queued link as
a link-driven run (`generate-video-from-link`). When the queue is EMPTY the pipeline stops
and asks for a link or a manual topic (there is no scraper). An entry is REMOVED (`done`) only after its
video is fully posted + logged + the ManyChat CTA is live.

WHY a script (not a plain text file): the repo runs CONCURRENT pipelines (QCR-173). A raw
`>> file` append + manual delete would race two runs onto the same link or lose an entry.
This mirrors `maestro_state.py`: every mutation takes an exclusive `flock` on a sidecar
`<file>.lock` and writes atomically (temp-file + os.replace).

STORAGE: `next-videos.jsonl` at the repo root — one JSON object per line:
  {"url", "status", "added_at", "run_name", "claimed_at", "note"}
  status flow:  queued --(claim)--> in_progress --(done)--> removed
                in_progress --(release)--> queued   (abandon/retry)

LIFECYCLE / who calls what:
  - Intake (bare link)      -> `add <url>`                    (root CLAUDE.md routing rule)
  - Stage 0 dispatch        -> `peek` / `has-next` then `claim --run <Name>`
                               (orchestrator `maestro-video-pipeline`, BEFORE Phase 1)
  - Phase 12 completion     -> `done --run <Name>`            (`post-and-log`, after log + CTA live)
  - Hard blocker / abandon  -> `release --run <Name>`         (orchestrator escalation)

USAGE:
    python3 next-videos-pipeline/next_videos.py add "https://www.youtube.com/shorts/abc123"
    python3 next-videos-pipeline/next_videos.py add "<url>" --front --note "owner priority"
    python3 next-videos-pipeline/next_videos.py peek                 # next URL (no claim); empty if none
    python3 next-videos-pipeline/next_videos.py has-next             # exit 0 if any queued, else exit 1
    python3 next-videos-pipeline/next_videos.py count                # number queued
    python3 next-videos-pipeline/next_videos.py claim --run MyVideo  # take oldest queued -> in_progress, print URL
    python3 next-videos-pipeline/next_videos.py done --run MyVideo   # remove the entry (video fully done)
    python3 next-videos-pipeline/next_videos.py release --run MyVideo # flip back to queued (abandon/retry)
    python3 next-videos-pipeline/next_videos.py list                 # human-readable dump

Library use:
    import next_videos
    url = next_videos.claim("MyVideo")     # atomic; "" if queue empty
    next_videos.done(run="MyVideo")
"""
import argparse, json, os, sys, re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)                       # repo root (parent of next-videos-pipeline/)
sys.path.insert(0, REPO)
from lib.locking import flock as _flock, atomic_write_text  # noqa: E402
from lib.jsonl import read_jsonl as _read_entries  # noqa: E402  (skips blank/corrupt lines)
from lib.timeutil import now_iso as _now  # noqa: E402

QUEUE = os.path.join(REPO, "next-videos.jsonl")    # the queue file, at the repo root
LOG_CSV = os.path.join(REPO, "pipeline-log.csv")   # for "already posted" dedup


# ── atomic locked read-modify-write (flock/atomic write live in lib/locking.py) ──────
def _atomic_write(path, entries):
    atomic_write_text(path, "".join(json.dumps(e, ensure_ascii=False) + "\n" for e in entries))


def _update(mutator):
    """Atomic, locked read-modify-write of the queue. `mutator(entries) -> entries`."""
    with _flock(QUEUE):
        entries = _read_entries(QUEUE)
        entries = mutator(entries)
        _atomic_write(QUEUE, entries)
    return entries


# ── url normalization + dedup ───────────────────────────────────────────────
_TRACKING = re.compile(r"(?:^|&)(igshid|igsh|utm_[a-z]+|si|feature|app|fbclid|gclid)=[^&]*", re.I)


def normalize_url(url):
    """Light, lossless-enough normalization for dedup: trim, drop fragment + tracking params,
    strip a trailing slash. Keeps the meaningful path + video id."""
    u = (url or "").strip()
    u = u.split("#", 1)[0]
    if "?" in u:
        base, q = u.split("?", 1)
        q = _TRACKING.sub("", q).lstrip("&")
        u = base + (("?" + q) if q else "")
    if u.endswith("/"):
        u = u[:-1]
    return u


def _video_id(url):
    """Best-effort id token (last meaningful path segment / ?v=) for substring dedup vs the CSV."""
    u = normalize_url(url)
    m = re.search(r"[?&]v=([A-Za-z0-9_\-]+)", u)
    if m:
        return m.group(1)
    seg = u.split("?", 1)[0].rstrip("/").split("/")
    return seg[-1] if seg else u


def _looks_like_url(url):
    return bool(re.match(r"https?://", (url or "").strip(), re.I))


def already_posted(url):
    """True if the normalized URL or its video id already appears in pipeline-log.csv."""
    if not os.path.exists(LOG_CSV):
        return False
    try:
        text = open(LOG_CSV, encoding="utf-8", errors="ignore").read()
    except OSError:
        return False
    if normalize_url(url) in text:
        return True
    vid = _video_id(url)
    # only trust the id-substring match for real (long) ids — a short token like "123"
    # is a substring of unrelated timestamps/ids and would false-positive.
    return len(vid) >= 8 and vid in text


def _active(entries):
    """Entries that still count as 'in the queue' (queued or in_progress)."""
    return [e for e in entries if e.get("status") in ("queued", "in_progress")]


# ── library API ─────────────────────────────────────────────────────────────
RESPIN_NOTE = ("RESPIN — already posted; reproduce with a BRAND-NEW hook + storytelling "
               "angle so it reads as a totally new video, not a repost")


def add(url, front=False, note="", allow_dup=False, respin=None):
    """Enqueue a link. Returns ('added'|'added-respin'|'dup-queue'|'invalid', count_active).

    A link that was ALREADY POSTED (present in pipeline-log.csv) is NO LONGER refused
    (house rule). It is queued anyway and flagged `respin=True`, which tells
    the link-driven run to be very creative — a fresh hook + different storytelling — so the
    re-run reads as a totally new spin instead of a duplicate. An EXACT link already waiting
    in the queue (queued/in_progress) is still a no-op ('dup-queue') — no point running it twice.
    `respin`: None = auto (True iff already posted); pass True/False to force."""
    if not _looks_like_url(url):
        return ("invalid", len(_active(_read_entries(QUEUE))))
    nurl = normalize_url(url)
    # auto-respin whenever the video was already posted, unless explicitly overridden
    is_respin = bool(already_posted(url)) if respin is None else bool(respin)
    result = {"status": None}

    def mut(entries):
        if not allow_dup:
            for e in _active(entries):
                if normalize_url(e.get("url", "")) == nurl:
                    result["status"] = "dup-queue"
                    return entries
        entry = {"url": nurl, "status": "queued", "added_at": _now(),
                 "run_name": None, "claimed_at": None, "respin": is_respin,
                 "note": note or (RESPIN_NOTE if is_respin else "")}
        if front:
            entries.insert(0, entry)
        else:
            entries.append(entry)
        result["status"] = "added-respin" if is_respin else "added"
        return entries

    entries = _update(mut)
    return (result["status"], len(_active(entries)))


def is_respin(run=None, url=None):
    """True if the matching queue entry is flagged as a RESPIN (already-posted re-run).
    Used by Stage 0 after `claim` to tell the link run to produce a brand-new creative spin."""
    for e in _read_entries(QUEUE):
        if _match(e, run, url):
            return bool(e.get("respin"))
    return False


def peek():
    """The next URL to run (oldest queued), without claiming it. '' if none."""
    for e in _read_entries(QUEUE):
        if e.get("status") == "queued":
            return e.get("url", "")
    return ""


def count():
    return len(_active(_read_entries(QUEUE)))


def has_next():
    return any(e.get("status") == "queued" for e in _read_entries(QUEUE))


def claim(run):
    """Atomically take the OLDEST queued entry -> in_progress, stamp run_name + claimed_at.
    Returns the URL, or '' if the queue has no queued entry. in_progress entries are left
    alone (assumed actively running / resumable via their MAESTRO_RUN)."""
    grabbed = {"url": ""}

    def mut(entries):
        for e in entries:
            if e.get("status") == "queued":
                e["status"] = "in_progress"
                e["run_name"] = run
                e["claimed_at"] = _now()
                grabbed["url"] = e.get("url", "")
                break
        return entries

    _update(mut)
    return grabbed["url"]


def _match(e, run=None, url=None):
    if run and e.get("run_name") == run:
        return True
    if url and normalize_url(e.get("url", "")) == normalize_url(url):
        return True
    return False


def done(run=None, url=None):
    """Remove the matching entry (video fully posted + logged + CTA live). Returns # removed."""
    removed = {"n": 0}

    def mut(entries):
        kept = []
        for e in entries:
            if _match(e, run, url):
                removed["n"] += 1
            else:
                kept.append(e)
        return kept

    _update(mut)
    return removed["n"]


def release(run=None, url=None):
    """Flip the matching entry back to queued (abandon/retry). Returns # released."""
    n = {"n": 0}

    def mut(entries):
        for e in entries:
            if _match(e, run, url) and e.get("status") == "in_progress":
                e["status"] = "queued"
                e["run_name"] = None
                e["claimed_at"] = None
                n["n"] += 1
        return entries

    _update(mut)
    return n["n"]


# ── CLI ──────────────────────────────────────────────────────────────────────
def cmd_add(a):
    respin = True if a.respin else None
    status, n = add(a.url, front=a.front, note=a.note or "", allow_dup=a.allow_dup, respin=respin)
    if status == "invalid":
        print(f"NOT A URL: {a.url!r} — nothing queued"); return 2
    if status == "dup-queue":
        print(f"already queued (no-op): {a.url}  [{n} in line]"); return 0
    where = "FRONT" if a.front else "back"
    if status == "added-respin":
        print(f"queued at {where} as RESPIN: {a.url}  [{n} in line]\n"
              f"  (already posted — the run will use a BRAND-NEW hook + storytelling so it reads "
              f"as a totally new video, not a repost)"); return 0
    print(f"queued at {where}: {a.url}  [{n} in line]"); return 0


def cmd_respin(a):
    if not (a.run or a.url):
        sys.exit("ERROR: respin needs --run or --url")
    r = is_respin(run=a.run, url=a.url)
    print("true" if r else "false")
    return 0 if r else 1


def cmd_peek(a):
    print(peek()); return 0


def cmd_has_next(a):
    sys.exit(0 if has_next() else 1)


def cmd_count(a):
    print(count()); return 0


def cmd_claim(a):
    url = claim(a.run)
    print(url); return 0 if url else 0  # empty print => caller falls back to scrape


def cmd_done(a):
    if not (a.run or a.url):
        sys.exit("ERROR: done needs --run or --url")
    n = done(run=a.run, url=a.url)
    print(f"removed {n} entr{'y' if n == 1 else 'ies'} from queue"); return 0


def cmd_release(a):
    if not (a.run or a.url):
        sys.exit("ERROR: release needs --run or --url")
    n = release(run=a.run, url=a.url)
    print(f"released {n} entr{'y' if n == 1 else 'ies'} back to queued"); return 0


def cmd_list(a):
    entries = _read_entries(QUEUE)
    act = _active(entries)
    if not act:
        print("(queue empty — paste a link or hand the agent a topic to start a run)"); return 0
    print(f"{len(act)} in queue (+{len(entries) - len(act)} done/other in file):")
    for i, e in enumerate(entries):
        if e.get("status") not in ("queued", "in_progress"):
            continue
        tag = "▶ RUNNING" if e.get("status") == "in_progress" else f"  #{i+1}"
        spin = " [RESPIN]" if e.get("respin") else ""
        run = f" run={e['run_name']}" if e.get("run_name") else ""
        note = f"  — {e['note']}" if e.get("note") else ""
        print(f"{tag}{spin}  {e.get('url','')}{run}{note}")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("add"); p.add_argument("url")
    p.add_argument("--front", action="store_true", help="jump the queue (run this next)")
    p.add_argument("--note", default=""); p.add_argument("--allow-dup", action="store_true")
    p.add_argument("--respin", action="store_true",
                   help="force RESPIN mode (brand-new hook + storytelling) even if not already posted")
    p.set_defaults(fn=cmd_add)

    sub.add_parser("peek").set_defaults(fn=cmd_peek)
    sub.add_parser("has-next").set_defaults(fn=cmd_has_next)
    sub.add_parser("count").set_defaults(fn=cmd_count)
    sub.add_parser("list").set_defaults(fn=cmd_list)

    p = sub.add_parser("respin"); p.add_argument("--run"); p.add_argument("--url")
    p.set_defaults(fn=cmd_respin)

    p = sub.add_parser("claim"); p.add_argument("--run", required=True); p.set_defaults(fn=cmd_claim)
    p = sub.add_parser("done"); p.add_argument("--run"); p.add_argument("--url"); p.set_defaults(fn=cmd_done)
    p = sub.add_parser("release"); p.add_argument("--run"); p.add_argument("--url"); p.set_defaults(fn=cmd_release)

    a = ap.parse_args()
    sys.exit(a.fn(a))


if __name__ == "__main__":
    main()
