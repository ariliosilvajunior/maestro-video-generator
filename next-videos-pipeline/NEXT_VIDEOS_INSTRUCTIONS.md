# NEXT-VIDEOS QUEUE — Phase-0 Dispatch

A FIFO queue of **source video links to run the pipeline from**. It sits in front of Phase 1
so the pipeline is **link-first**; when the queue is empty, **niche discovery** (`discover-pipeline/discover_sources.py --enqueue`,
YouTube search driven by `config.discovery.*` from `/setup`) feeds it first; only if that finds nothing does the run stop and
ask the user for a link or a topic.

## The three rules (what the repo must do)

1. **Bare link in → enqueue only.** When this repo receives a video link **and nothing else**
   (one or more YouTube/Instagram/TikTok URLs, no other task), do NOT run anything — append each
   link to the queue and stop:
   ```bash
   python3 next-videos-pipeline/next_videos.py add "<URL>"
   ```
   Acknowledge ("queued — N in line") and end the turn. (A link **with** an explicit
   "run/execute/gera agora" instruction may jump the queue with `add --front` and then dispatch.)

   **This is enforced automatically by the `UserPromptSubmit` hook** (`.claude/hooks/detect-video-link.sh`):
   a bare-link message is auto-detected, the hook runs `next_videos.py add` itself (so the link is stored
   even before the agent acts), and injects context telling the agent to confirm + STOP rather than run the
   pipeline. A link with other text gets soft guidance and the agent decides. The hook never turns a pasted
   link into an immediate run + live post — do not change that.

   **Side-effect — CREATOR CAPTURE.** Saving a link also records WHO made the video. The same hook fires a
   background `creators-pipeline/creators.py capture "<URL>"` per saved link: it resolves the author's @handle
   via `yt-dlp --skip-download -J` (no login), dedups, and stores them in `creators.jsonl` (repo root) if new.
   It's detached (never delays the prompt), idempotent, and flock-atomic. Catch-up / safety net for any missed
   link: `python3 creators-pipeline/creators.py backfill --from-queue`. Full spec:
   `creators-pipeline/CREATORS_INSTRUCTIONS.md`.

2. **Pipeline execution → dispatch the next in line (Stage 0, BEFORE Phase 1).** Every "run the
   pipeline / create a video / execute maestro video generator" trigger first checks this queue:
   - Queue NON-EMPTY → **claim the next link and run it as a link-driven run**
     (`generate-video-from-link`). Phase 1 (`choose-video-topic`) is SKIPPED.
   - Queue EMPTY → **run niche discovery first** (`python3 discover-pipeline/discover_sources.py --enqueue`; exit 3/5 = nothing found /
     not configured) and re-dispatch; still empty → **STOP and ask the user for a link or a topic.** A link they give → `add --front` and
     dispatch; a topic/transcript → Phase 1 (`choose-video-topic`) packages it as the topic seed → Phase 2.
     Never invent a topic outside the configured niche.

3. **Fully done → remove from the queue.** Only after the video is posted, logged to `pipeline-log.csv`,
   and the CTA is `live` (or `manual` when `config.manychat.enabled` is false), the entry is deleted:
   ```bash
   python3 next-videos-pipeline/next_videos.py done --run "$MAESTRO_RUN"
   ```
   (No-op for manual-topic runs, which were never in the queue.)

## Storage

`next-videos.jsonl` at the **repo root** — one JSON object per line:
```json
{"url": "...", "status": "queued", "added_at": "...", "run_name": null, "claimed_at": null, "note": ""}
```
Status flow: `queued` —(claim)→ `in_progress` —(done)→ removed; `in_progress` —(release)→ `queued`.

**Never hand-edit `next-videos.jsonl`.** Always go through `next_videos.py` — it takes an
exclusive `flock` and writes atomically (temp-file + `os.replace`), the same concurrency-safe
pattern as `maestro_state.py` (QCR-173). Two parallel runs can `claim` without grabbing the same link.

## Commands

| Command | Use |
|---|---|
| `add "<url>" [--front] [--note "..."] [--respin]` | Enqueue. An EXACT link already in the queue is a no-op. An **already-posted** link (in `pipeline-log.csv`) is NOT refused — it's queued and flagged **`respin=true`** so the run re-spins it with a brand-new hook + storytelling. `--front` jumps the line; `--respin` forces respin even on a fresh link; `--allow-dup` bypasses the in-queue dup check. |
| `peek` | Print the next queued URL (no claim). Empty string ⇒ queue empty ⇒ run niche discovery (`discover_sources.py --enqueue`), then ask the user if still empty. |
| `has-next` | Exit 0 if a queued entry exists, exit 1 if empty (use in `if` for the dispatch branch). |
| `count` | Number of active (queued + in_progress) entries. |
| `claim --run <Name>` | Atomically take the oldest **queued** entry → `in_progress`, stamp the run name, print its URL. |
| `respin --run <Name>` (or `--url`) | Print `true`/`false` (exit 0/1) — is the matching entry an already-posted RE-SPIN? Stage 0 checks this after `claim` to tell the link run to write a totally new spin. |
| `done --run <Name>` (or `--url`) | Remove the entry — call after the run is fully posted + logged + CTA live/manual. |
| `release --run <Name>` (or `--url`) | Flip an `in_progress` entry back to `queued` (abandon / retry next run). |
| `list` | Human-readable queue dump (▶ RUNNING vs #n queued; `[RESPIN]` tag on re-spun links). |

## Stage-0 dispatch (exact flow for the orchestrator)

```bash
NEXT_URL=$(python3 next-videos-pipeline/next_videos.py peek)
if [ -n "$NEXT_URL" ]; then
  # 1) agent derives a PascalCase <Name> from the URL/topic
  export MAESTRO_RUN=<Name>
  # 2) ATOMICALLY claim it (this is the real source_url; concurrency-safe)
  SRC=$(python3 next-videos-pipeline/next_videos.py claim --run "$MAESTRO_RUN")
  # 3) record provenance so Phase 12 can remove it on completion
  python3 maestro_state.py init --note "queued link run" --field source_url="$SRC" --field queue_url="$SRC"
  # 4) run the LINK-DRIVEN front end (generate-video-from-link Steps 1-3) on "$SRC",
  #    then hand off to Phase 2.5 → 12 exactly as a normal link run.
else
  # queue empty → python3 discover-pipeline/discover_sources.py --enqueue  (niche discovery), re-dispatch;
  # still empty → STOP and ask the user for a link (→ add --front) or a topic/transcript (→ Phase 1 → Phase 2).
  :
fi
```

`maestro_state` stamps `queue_url` on the run. Phase 12 (`post-and-log`) reads `$MAESTRO_RUN` and calls
`done --run "$MAESTRO_RUN"`; the queue entry whose `run_name` matches is removed. A manual-topic run never set
`queue_url`, so its `done` call simply removes nothing.

## Failure / hold semantics

- **Hard blocker mid-run** (2FA/captcha, dead key, or — when `config.qc.enabled` — QC still below
  `config.qc.threshold` after `config.qc.max_iterations`): leave the entry `in_progress`. The run is
  resumable via its `MAESTRO_RUN` (`maestro_state.py show`) — finishing it later calls `done` and removes it. To
  deliberately abandon or push a link to the back, use `release`.
- **Build-but-don't-post / hold**: the entry stays `in_progress` and is NOT removed (it isn't done).
  Resume + post later → then `done`. Do not `done` a held run.
- **Already posted → RE-SPIN**: `add` does NOT refuse a URL already in `pipeline-log.csv`. It queues it and
  sets **`respin=true`**. When dispatched, the link run (`generate-video-from-link` Step 3) must be very
  creative — a **brand-new hook + different storytelling angle + different beat order** on the same underlying
  topic/resource — so the result reads as a totally new video, not a repost. Stage 0 reads the flag with
  `next_videos.py respin --run` and stamps `respin` into the run state. (Only an EXACT link still waiting in
  the queue is a no-op — no point running the same un-posted link twice.)
