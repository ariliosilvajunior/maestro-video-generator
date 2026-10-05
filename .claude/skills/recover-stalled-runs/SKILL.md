---
name: recover-stalled-runs
description: Finish ORPHANED pipeline runs — builds whose scheduled session died mid-run (dead worker_pid, stale heartbeat) leaving a finished or half-finished video stuck at status in_progress, never enqueued to the post-queue. Detects them deterministically (maestro_state.py stale), then finishes each one (Phase 11 CTA arm/stamp + mark-ready enqueue, or mid-build resume, or QCR-120 already-posted reconcile, or abandon+release). Never posts anything (PIPELINE_DIRECTIVES §12). Triggers — "/recover-stalled-runs", "recover stalled runs", "finish orphan builds", "retoma os runs órfãos", "sweep stale runs"; also invoked as the Stage-0 sweep of maestro-video-pipeline and referenced by /post-now Step 0.
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: recover-stalled-runs (finish orphaned builds — the recovery half of §12)

> **WHY:** scheduled one-shot build sessions die at turn end. Sessions that ended their turn with phases
> still running in background subagents, or that hit a missing-tool blocker at Phase 11, leave FULLY/MOSTLY
> BUILT videos orphaned at `status=in_progress` — CTA never armed, never enqueued, invisible. This skill is
> the standing janitor: every orphan is either FINISHED into the post-queue, reconciled as already-posted, or
> loudly abandoned. It NEVER publishes (posting stays exclusively in `/post-now`).
> Full policy: `PIPELINE_DIRECTIVES.md` §12 (12d is this skill's contract).
> Paths: `<downloads>` = `paths.downloads` (default `~/Downloads`; `python3 lib/paths.py` prints it).

## HARD RULES
- **NEVER touch a run a live sibling owns.** `maestro_state.py stale` already excludes fresh-heartbeat /
  live-PID runs; do not lower `--max-age` below 1800 and do not hand-pick runs it didn't list.
  When in doubt: `python3 maestro_state.py check-owner --run <Name>` — exit 3 = hands off.
- **NEVER post.** The terminal state of a recovered run here is `ready_to_post` + an ACTIVE
  `post-queue.jsonl` entry (or `completed`/`abandoned` per triage). `/post-now` publishes later.
- **Everything runs INLINE in this session** (§12a — no background subagents, no turn-end waits).
- **Every recovery is logged**: `maestro_state.py set --field recovery_note="<what+why> (recovered <date>)"`.

## PROCEDURE

### Step 0 — Detect (deterministic, $0)
```bash
# from the repo root
python3 maestro_state.py stale          # one JSON row per orphan; empty = nothing to do (normal, stop)
```
Each row carries the triage inputs: `resume_from`, `last_phase*`, `cta_status`, `music_exists`.

### Step 1 — Triage each orphan IN THIS ORDER (first match wins)

**1a. Already posted (QCR-120 desync)** — `grep "<Name>" pipeline-log.csv` finds a row:
the prior session posted before dying. If `resource_cta.enabled` and `cta_status` is neither `live` nor
`manual`, run Phase 11 now (idempotent — the ManyChat arm when `config.manychat.enabled`, else stamp
`resource_cta.status="manual"`), then `maestro_state.py set --field status=completed` + `post_queue.py done
--run <Name>` (clears any leftover queue entry) + `next_videos.py done --run <Name>`. Done.

**1b. Fully built (`music_exists: true` and `resume_from >= 10`)** — finish the last mile:
```bash
export MAESTRO_RUN=<Name>
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name -of csv=p=0 \
  <downloads>/<Name>_music.mp4                      # expect h264,1080,1920 — else treat as 1c/1d
```
1. **Phase 11** — with `config.manychat.enabled`: skill `manage-comment-dm` (idempotent; runs in THIS
   session, needs Playwright MCP — no browser tools in this session → do NOT guess: fire
   `python3 post-pipeline/alert.py --platform manychat --run <Name> --reason "no browser MCP in recovery session"`
   and leave this run for the next sweep). On success `resource_cta.status == "live"`. With ManyChat off:
   stamp `python3 manychat-pipeline/set_resource_cta.py set-status --status manual` (the locked writer; no browser needed).
2. **mark-ready** — the same enqueue the orchestrator does:
   `python3 post-queue-pipeline/post_queue.py add --run "$MAESTRO_RUN" --video <downloads>/${MAESTRO_RUN}_music.mp4 --source-url "<state.source_url>" --queue-url "<state.queue_url>" --cta-json '<resource_cta from state>'`
   then `python3 maestro_state.py phase --num 11 --name mark-ready-to-post --status done --run-status ready_to_post`.
3. **Gate:** `python3 maestro_state.py assert-ready --run "$MAESTRO_RUN"` — must exit 0 (§12c).

**1c. Mid-build (`resume_from < 10`) with valid artifacts** — resume per the orchestrator's
QCR-170 RESUME RECONCILIATION (effective restart = `max(resume_from, 1 + last done phase)`; verify
each on-disk artifact before reuse, re-derive caption windows from the CURRENT SRT when reusing an
unrendered `.tsx`). Run the remaining phases INLINE through mark-ready + assert-ready, exactly as
1b ends. Only do this when the heavy artifacts survive (avatar mp4 / motion tsx / broll mp4);
rebuilding a phase-2-only orphan from scratch is 1d's job, not a resume.

**1d. Unrecoverable** (artifacts gone from `<downloads>`, corrupt avatar, no valid restart point):
```bash
python3 next-videos-pipeline/next_videos.py release --run <Name>    # requeue the source link
python3 maestro_state.py set --run <Name> --field status=abandoned \
  --field recovery_note="unrecoverable: <why> (swept <date>)"
```
The link gets rebuilt fresh by a future scheduled run. Never delete the state file (audit trail).

### Step 2 — Stuck `posting` claims (post-queue side)
```bash
python3 post-queue-pipeline/post_queue.py stale     # posting claims older than 1h = dead /post-now
```
Per row, QCR-120 ORDER (the post may have gone live before the death — double-post is the risk):
1. `grep "<Name>" pipeline-log.csv` → row exists → it posted: `post_queue.py done --run <Name>` +
   state `completed` (+ Phase-11 idempotent re-arm/stamp if the CTA is neither live nor manual).
2. No row → LOOK at the IG profile (`config.posting.instagram_handle`) via Playwright for a reel matching
   the topic — none → `post_queue.py release --run <Name>` (back to ready; /post-now retries later).
   Found one → treat as posted: write the missing log row (`maestro_state.py log`), then `done`.

### Step 3 — Report + alert
- Summarize per run: recovered→enqueued / completed (was posted) / resumed / abandoned (+why).
- If ANYTHING was swept, notify (one message, not per-run):
  `python3 post-pipeline/alert.py --platform system --run recovery-sweep --reason "<N> orphan(s): <names+outcomes>"`
  (delivered per `config.notify.*`, always logged to `alerts.log`) — orphans mean a session died abnormally;
  you should know it keeps happening even though the work self-healed.

## When invoked as the Stage-0 sweep (from `maestro-video-pipeline`)
Same procedure, two scope notes: a 1c mid-build resume BECOMES that session's run (do not also start
a new build); 1a/1b/1d are quick chores — do them, then continue Stage 0 normally (claim the next
link, build from 0). This composes with, and does not weaken, the "ALWAYS START FROM 0" rule — see the
scope note in `PIPELINE_DIRECTIVES.md` §12d.
