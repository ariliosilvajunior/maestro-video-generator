# POST QUEUE — ready-to-post videos

Posting is **separated** from video creation. The full pipeline (`maestro-video-pipeline`) BUILDS videos,
arms their comment→DM CTA (**Phase 11** — the ManyChat automation when `config.manychat.enabled`, otherwise
stamped `resource_cta.status="manual"` for hand delivery), and at **mark-ready** enqueues the finished
`_music.mp4` here. Publishing is a separate on-demand step: the **`/post-now`** skill pops the next ready video
and posts it.

Two DIFFERENT queues (don't confuse them):
| Queue | File | Holds | Fed by | Drained by |
|-------|------|-------|--------|------------|
| INPUT — source links | `next-videos.jsonl` | YouTube/IG links to BUILD videos FROM | bare-link intake (links you paste) | Stage-0 `claim` (build) → removed on real post |
| OUTPUT — ready videos | `post-queue.jsonl` | finished `_music.mp4` ready to PUBLISH (CTA already `live`/`manual`) | pipeline mark-ready step (after Phase 11) `post_queue.py add` | `/post-now` (`claim` → post → `done`) |

Manager: `post-queue-pipeline/post_queue.py` — flock-atomic, concurrency-safe (mirrors `next_videos.py` /
`maestro_state.py`). One JSON object per line; status `ready → posting → (removed)`.
`<downloads>` = `paths.downloads` (default `~/Downloads`; `python3 lib/paths.py` prints it).

## Commands
```bash
# ENQUEUE (pipeline mark-ready step, after Phase 11 — the ONLY place that adds; idempotent per run_name):
python3 post-queue-pipeline/post_queue.py add --run <Name> --video <downloads>/<Name>_music.mp4 \
    [--source-url URL] [--queue-url URL] [--cta-json '{"keyword":"X","link":"https://…","kind":"tool"}'] \
    [--caption "…"] [--title "…"] [--note "…"] [--front] [--allow-money-claim]

# INSPECT:
python3 post-queue-pipeline/post_queue.py list          # human-readable
python3 post-queue-pipeline/post_queue.py count          # number ready+posting
python3 post-queue-pipeline/post_queue.py has-next       # exit 0 if any ready
python3 post-queue-pipeline/post_queue.py peek [--json]  # next ready run_name (or full JSON)
python3 post-queue-pipeline/post_queue.py get --run <Name>   # one entry's full JSON

# /post-now uses these:
python3 post-queue-pipeline/post_queue.py claim [--by <id>]  # oldest ready -> posting, prints JSON
python3 post-queue-pipeline/post_queue.py done --run <Name>     # remove (fully posted)
python3 post-queue-pipeline/post_queue.py release --run <Name>  # posting -> ready (retry a failed post)
python3 post-queue-pipeline/post_queue.py stale [--max-age 3600] # posting claims older than 1h (dead /post-now)
```

## Notes
- The queue entry is a POINTER (`run_name` + `video_path`) + convenience metadata. The authoritative
  caption / keyword / link live in the run STATE (`pipeline-runs/<Name>.json`) — `/post-now` sets
  `MAESTRO_RUN=<Name>` and lets `post-and-log` read the state. `/post-now` accepts `resource_cta.status` ∈
  {`live`, `manual`}; it re-runs `manage-comment-dm` only when `config.manychat.enabled` is true and the
  status is neither (a defensive fallback for an entry that never completed Phase 11).
- `add` is idempotent on `run_name`: re-enqueuing a rebuilt run UPDATES its `video_path` in place (no dup).
- `add` runs the content-safety gate (`PIPELINE_DIRECTIVES.md` §11) on `--caption`/`--title` in code and
  REFUSES scam-shaped money claims (exit 2, prints the matches) — fix the copy; `--allow-money-claim` is a
  deliberate, logged escape hatch, not a default.
- A crashed `/post-now` leaves its entry in `posting`; `release --run <Name>` returns it to `ready`
  (`stale` lists such claims; follow the QCR-120 order — check `pipeline-log.csv` / the live profile before releasing).
- The SOURCE link in `next-videos.jsonl` is removed by `/post-now` (via `next_videos.py done`) only when
  the built video is actually posted — NOT when it is enqueued here.
- After a verified live post the final stays in `<downloads>`; archive it wherever you like (optional) —
  the pipeline never deletes your media.
