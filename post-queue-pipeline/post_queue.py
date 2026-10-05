#!/usr/bin/env python3
"""
post_queue.py — the POST QUEUE for the Maestro Video Generator / Maestro Video Generator repo.

WHAT (house rule): posting is SEPARATED from video creation. The full
pipeline (`maestro-video-pipeline`) now STOPS after building the finished `_music.mp4` and
ENQUEUES that ready-to-post video here instead of posting it. Publishing happens LATER,
on its own schedule, when the user runs the `/post-now` skill — which pops the next
ready video from THIS queue (its ManyChat CTA already armed, or `manual` when ManyChat is
disabled), posts it to Instagram Reels, logs it, and removes it from the queue.

This is the OUTPUT queue (finished videos ready to publish). It is DISTINCT from
`next-videos.jsonl` (the INPUT queue of source links to build videos FROM). The lifecycle:
    next-videos.jsonl (source link) --[full pipeline builds video]--> post-queue.jsonl (ready mp4)
    post-queue.jsonl --[/post-now publishes]--> live on IG + logged + removed from BOTH queues.

WHY a script (not a plain file): the repo runs CONCURRENT work (QCR-173). Mirrors
`next_videos.py` / `maestro_state.py`: every mutation takes an exclusive `flock` on a sidecar
`<file>.lock` and writes atomically (temp-file + os.replace), so two builders enqueuing or
two `/post-now` invocations claiming never race onto the same entry or lose one.

STORAGE: `post-queue.jsonl` at the repo root — one JSON object per line:
  {"run_name","video_path","status","added_at","claimed_at","caption","title",
   "resource_cta","source_url","queue_url","note"}
  status flow:  ready --(claim)--> posting --(done)--> removed
                posting --(release)--> ready   (abandon/retry a failed post)

LIFECYCLE / who calls what:
  - Pipeline end (Phase 10 mark-ready) -> `add --run <Name> --video <path> ...`
                                          (orchestrator `maestro-video-pipeline`, replaces post)
  - `/post-now` dispatch               -> `peek` / `has-next` then `claim` (oldest ready -> posting)
  - `/post-now` success                -> `done --run <Name>`  (after live + logged + CTA)
  - `/post-now` failure / hold         -> `release --run <Name>` (flip back to ready)

USAGE:
    python3 post-queue-pipeline/post_queue.py add --run ReelDZ9 \
        --video ~/Downloads/ReelDZ9_music.mp4 \
        [--caption "..."] [--title "..."] [--source-url URL] [--queue-url URL] \
        [--cta-json '{"keyword":"NVIDIA","link":"https://build.nvidia.com","kind":"tool",...}'] \
        [--note "..."] [--front]
    python3 post-queue-pipeline/post_queue.py peek [--json]   # next ready run_name (or full JSON)
    python3 post-queue-pipeline/post_queue.py has-next        # exit 0 if any ready, else exit 1
    python3 post-queue-pipeline/post_queue.py count           # number ready+posting
    python3 post-queue-pipeline/post_queue.py list            # human-readable dump
    python3 post-queue-pipeline/post_queue.py get --run ReelDZ9   # full JSON of one entry
    python3 post-queue-pipeline/post_queue.py claim [--by pid] # oldest ready -> posting, print its JSON
    python3 post-queue-pipeline/post_queue.py done --run ReelDZ9    # remove (fully posted)
    python3 post-queue-pipeline/post_queue.py release --run ReelDZ9 # posting -> ready (retry)

Library use:
    import post_queue
    entry = post_queue.claim()          # dict; None if nothing ready
    post_queue.done(run="ReelDZ9")
"""
import argparse, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)                        # repo root (parent of post-queue-pipeline/)
sys.path.insert(0, REPO)
from lib.locking import flock as _flock, atomic_write_text  # noqa: E402
from lib.jsonl import read_jsonl as _read_entries  # noqa: E402  (skips blank/corrupt lines)
from lib.timeutil import now_iso as _now  # noqa: E402

sys.path.insert(0, HERE)
import money_claims_gate  # noqa: E402  money-claims gate — codifies PIPELINE_DIRECTIVES §11

QUEUE = os.path.join(REPO, "post-queue.jsonl")      # the post queue file, at the repo root

ACTIVE = ("ready", "posting")


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


def _active(entries):
    return [e for e in entries if e.get("status") in ACTIVE]


# ── library API ─────────────────────────────────────────────────────────────
def add(run, video, caption="", title="", source_url="", queue_url="",
        resource_cta=None, note="", front=False):
    """Enqueue a finished video as ready-to-post. Idempotent on run_name: re-adding the same
    run UPDATES its fields (a rebuild refreshes video_path/caption) instead of duplicating.
    Returns ('added'|'updated'|'invalid', count_active)."""
    if not run or not video:
        return ("invalid", len(_active(_read_entries(QUEUE))))
    result = {"status": None}

    def mut(entries):
        for e in entries:
            if e.get("run_name") == run and e.get("status") in ACTIVE:
                # refresh fields on re-enqueue (don't duplicate an already-queued run)
                e.update({"video_path": video, "caption": caption or e.get("caption", ""),
                          "title": title or e.get("title", ""),
                          "source_url": source_url or e.get("source_url", ""),
                          "queue_url": queue_url or e.get("queue_url", ""),
                          "resource_cta": resource_cta if resource_cta is not None else e.get("resource_cta"),
                          "note": note or e.get("note", ""), "updated_at": _now()})
                result["status"] = "updated"
                return entries
        entry = {"run_name": run, "video_path": video, "status": "ready",
                 "added_at": _now(), "claimed_at": None, "caption": caption,
                 "title": title, "resource_cta": resource_cta,
                 "source_url": source_url, "queue_url": queue_url, "note": note}
        if front:
            entries.insert(0, entry)
        else:
            entries.append(entry)
        result["status"] = "added"
        return entries

    entries = _update(mut)
    return (result["status"], len(_active(entries)))


def peek(as_json=False):
    """The next entry to post (oldest ready), without claiming it. '' / None if none."""
    for e in _read_entries(QUEUE):
        if e.get("status") == "ready":
            return e if as_json else e.get("run_name", "")
    return None if as_json else ""


def count():
    return len(_active(_read_entries(QUEUE)))


def has_next():
    return any(e.get("status") == "ready" for e in _read_entries(QUEUE))


def get(run):
    for e in _read_entries(QUEUE):
        if e.get("run_name") == run:
            return e
    return None


def claim(by=""):
    """Atomically take the OLDEST ready entry -> posting, stamp claimed_at (+ optional poster id).
    Returns the entry dict, or None if nothing is ready. posting entries are left alone
    (assumed actively being published by another /post-now)."""
    grabbed = {"e": None}

    def mut(entries):
        for e in entries:
            if e.get("status") == "ready":
                e["status"] = "posting"
                e["claimed_at"] = _now()
                if by:
                    e["posting_by"] = by
                grabbed["e"] = dict(e)
                break
        return entries

    _update(mut)
    return grabbed["e"]


def done(run):
    """Remove the matching entry (video fully posted + logged + CTA live/manual). Returns # removed."""
    removed = {"n": 0}

    def mut(entries):
        kept = []
        for e in entries:
            if e.get("run_name") == run:
                removed["n"] += 1
            else:
                kept.append(e)
        return kept

    _update(mut)
    return removed["n"]


def release(run):
    """Flip a posting entry back to ready (abandon/retry a failed post). Returns # released."""
    n = {"n": 0}

    def mut(entries):
        for e in entries:
            if e.get("run_name") == run and e.get("status") == "posting":
                e["status"] = "ready"
                e["claimed_at"] = None
                e.pop("posting_by", None)
                n["n"] += 1
        return entries

    _update(mut)
    return n["n"]


# ── CLI ──────────────────────────────────────────────────────────────────────
def _parse_cta(s):
    if not s:
        return None
    try:
        return json.loads(s)
    except json.JSONDecodeError as e:
        sys.exit(f"ERROR: --cta-json is not valid JSON: {e}")


def cmd_add(a):
    # Gate de money-claims (§11): recusa enfileirar caption/título com
    # promessa de dinheiro ou formato de golpe. Enforcement de CÓDIGO do que antes era só
    # instrução ao modelo. Escape-hatch consciente e logado: --allow-money-claim.
    _mc = money_claims_gate.find_money_claims(f"{a.caption or ''}\n{a.title or ''}")
    if _mc and not getattr(a, "allow_money_claim", False):
        print("BLOCKED: money-claim no texto (§11) — NAO enfileirado:")
        for h in _mc:
            print(f"  - {h['label']}  <{h['match']}>")
        print("  Revise a copy (reframe honesto do §11). Se for intencional, --allow-money-claim.")
        return 2
    if _mc:
        print(f"WARN: money-claim liberado via --allow-money-claim: {[h['label'] for h in _mc]}")
    status, n = add(a.run, a.video, caption=a.caption or "", title=a.title or "",
                    source_url=a.source_url or "", queue_url=a.queue_url or "",
                    resource_cta=_parse_cta(a.cta_json), note=a.note or "", front=a.front)
    if status == "invalid":
        print("ERROR: add needs --run and --video"); return 2
    where = "FRONT" if a.front else "back"
    verb = "updated in place" if status == "updated" else f"queued at {where}"
    print(f"{verb}: {a.run} -> {a.video}  [{n} ready/posting in line]")
    return 0


def cmd_peek(a):
    e = peek(as_json=a.json)
    if a.json:
        print(json.dumps(e, ensure_ascii=False) if e else "")
    else:
        print(e or "")
    return 0


def cmd_has_next(a):
    sys.exit(0 if has_next() else 1)


def cmd_count(a):
    print(count()); return 0


def cmd_get(a):
    e = get(a.run)
    print(json.dumps(e, ensure_ascii=False) if e else "")
    return 0 if e else 1


def cmd_claim(a):
    e = claim(by=a.by or "")
    print(json.dumps(e, ensure_ascii=False) if e else "")
    return 0 if e else 1   # exit 1 => nothing to post (caller reports "queue empty")


def cmd_done(a):
    n = done(a.run)
    print(f"removed {n} entr{'y' if n == 1 else 'ies'} from post-queue"); return 0


def cmd_release(a):
    n = release(a.run)
    print(f"released {n} entr{'y' if n == 1 else 'ies'} back to ready"); return 0


def cmd_stale(a):
    """STUCK-POSTING DETECTOR — a `posting` entry whose claim is older than
    --max-age seconds (default 3600) means a /post-now session died mid-post. It wedges the
    queue forever (claim skips `posting`). RECOVERY IS NOT AUTOMATIC on purpose: the post may
    or may not have gone live before the death — the recovering agent MUST first grep
    `pipeline-log.csv` for the run (QCR-120): row present -> `done --run <Name>` (it posted);
    absent -> verify the IG profile has no such reel, then `release --run <Name>` to retry.
    Prints one JSON row per stuck entry; exit 0 always (empty output = none)."""
    import datetime
    try:
        threshold = float(a.max_age)
    except (TypeError, ValueError):
        threshold = 3600.0
    now = datetime.datetime.now()
    for e in _read_entries(QUEUE):
        if e.get("status") != "posting":
            continue
        claimed = e.get("claimed_at")
        age = None
        if claimed:
            try:
                age = (now - datetime.datetime.fromisoformat(claimed)).total_seconds()
            except Exception:
                age = None
        if age is not None and age < threshold:
            continue
        print(json.dumps({"run": e.get("run_name"), "claimed_at": claimed,
                          "age_s": round(age, 1) if age is not None else None,
                          "posting_by": e.get("posting_by"),
                          "video_path": e.get("video_path")}, ensure_ascii=False))
    return 0


def cmd_list(a):
    entries = _read_entries(QUEUE)
    act = _active(entries)
    if not act:
        print("(post-queue empty — nothing waiting to post)"); return 0
    print(f"{len(act)} ready/posting (+{len(entries) - len(act)} done/other in file):")
    for i, e in enumerate(entries):
        if e.get("status") not in ACTIVE:
            continue
        tag = "▶ POSTING" if e.get("status") == "posting" else f"  #{i+1} READY"
        cta = e.get("resource_cta") or {}
        kw = f" cta={cta.get('keyword')}" if cta.get("keyword") else ""
        src = f" src={e['source_url']}" if e.get("source_url") else ""
        note = f"  — {e['note']}" if e.get("note") else ""
        print(f"{tag}  {e.get('run_name','?')}  {e.get('video_path','?')}{kw}{src}{note}")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("add")
    p.add_argument("--run", required=True)
    p.add_argument("--video", required=True, help="absolute path to the finished _music.mp4")
    p.add_argument("--caption", default=""); p.add_argument("--title", default="")
    p.add_argument("--source-url", dest="source_url", default="")
    p.add_argument("--queue-url", dest="queue_url", default="")
    p.add_argument("--cta-json", dest="cta_json", default="",
                   help="resource_cta as a JSON object (keyword/link/kind/opening_dm/…)")
    p.add_argument("--note", default=""); p.add_argument("--front", action="store_true")
    p.add_argument("--allow-money-claim", dest="allow_money_claim", action="store_true",
                   help="override consciente do gate de money-claims (§11) — logado como WARN")
    p.set_defaults(fn=cmd_add)

    p = sub.add_parser("peek"); p.add_argument("--json", action="store_true"); p.set_defaults(fn=cmd_peek)
    sub.add_parser("has-next").set_defaults(fn=cmd_has_next)
    sub.add_parser("count").set_defaults(fn=cmd_count)
    sub.add_parser("list").set_defaults(fn=cmd_list)

    p = sub.add_parser("get"); p.add_argument("--run", required=True); p.set_defaults(fn=cmd_get)
    p = sub.add_parser("claim"); p.add_argument("--by", default=""); p.set_defaults(fn=cmd_claim)
    p = sub.add_parser("done"); p.add_argument("--run", required=True); p.set_defaults(fn=cmd_done)
    p = sub.add_parser("release"); p.add_argument("--run", required=True); p.set_defaults(fn=cmd_release)
    p = sub.add_parser("stale"); p.add_argument("--max-age", dest="max_age", default=3600); p.set_defaults(fn=cmd_stale)

    a = ap.parse_args()
    sys.exit(a.fn(a))


if __name__ == "__main__":
    main()
