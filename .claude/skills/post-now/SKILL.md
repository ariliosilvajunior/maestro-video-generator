---
name: post-now
description: Publish the NEXT ready-to-post video from the post-queue (house rule — posting is separated from creation). The full pipeline BUILDS videos, settles their comment→DM CTA (Phase 11 — ManyChat automation LIVE when config.manychat.enabled, else stamped "manual"), and enqueues them into post-queue.jsonl; this skill is the posting half — it pops the next ready video, posts it to Instagram Reels ONLY, logs it, and removes it from both queues (the final stays in <downloads>). It only re-runs Phase 11 as a defensive fallback for queue entries whose resource_cta.status is neither live nor manual. Triggers — "/post-now", "post now", "post the next video", "publish the next reel in line", "post the queue".
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: post-now (Posting half of the split pipeline)

> **House rule — posting is SEPARATED from video creation.** `maestro-video-pipeline` builds a video,
> settles its comment→DM CTA (Phase 11: the ManyChat automation is armed LIVE when
> `config.manychat.enabled`; otherwise the step is skipped and `resource_cta.status` is stamped
> `"manual"` — you deliver links by hand), and STOPS at the mark-ready step, enqueuing the finished
> `_music.mp4` into `post-queue.jsonl` (via `post-queue-pipeline/post_queue.py`). **This skill is the
> posting half.** It runs on YOUR schedule (whenever `/post-now` is invoked), fully decoupled from when
> videos were made. It reuses the existing, battle-tested `post-and-log` (Phase 12) skill — it is a thin
> orchestrator over the post-queue, not a new posting implementation. Why the split: a video isn't
> finished until its CTA is settled, independent of when it actually publishes.

## WHAT IT DOES (per video)
Pop the next ready video → (defensive check: the CTA must be `live` or `manual`) → post to IG
Reels → log → remove from BOTH queues. **Platform = Instagram ONLY** (YouTube, TikTok and X are
not posting targets). The final stays in `<downloads>` — the pipeline never deletes your media.
Posting is live/irreversible, but that is the whole point of this command — no re-confirm.

## INVOCATION
- `/post-now` — post the **single** next ready video (oldest in line).
- `/post-now --count N` (or "post the next N") — post the next N ready videos, one after another.
- `/post-now --all` — drain the queue (post every ready video). Use with care.
- `/post-now --run <Name>` — post a SPECIFIC queued run by name (jumps the line).
- `/post-now --list` / "what's in the post queue" — just show the queue, post nothing.

## PROCEDURE

### Step 0 — Guard + inspect
```bash
cd "<repo-root>"                                        # the directory holding maestro_state.py + config/ (post-and-log stages from the repo)
python3 post-queue-pipeline/post_queue.py stale         # STUCK-POSTING SWEEP (PIPELINE_DIRECTIVES §12d)
python3 post-queue-pipeline/post_queue.py list          # show what's waiting
```
**`stale` non-empty** = a previous `/post-now` session died mid-post (claim >1h old) and wedged that
entry (claim skips `posting` forever). Recover FIRST, in QCR-120 order (double-post is the risk — the
post may have gone live before the death): (1) `grep "<Name>" pipeline-log.csv` — row exists → it DID
post: `post_queue.py done --run <Name>` + state `completed` (+ idempotent Phase-11 re-run if the CTA
is neither live nor manual). (2) No row → check the `@<your-handle>` profile via Playwright for a reel
matching the topic — none → `post_queue.py release --run <Name>` (back to ready; it retries below);
found → write the missing log row (`maestro_state.py log`), then `done`. Full procedure: skill
`recover-stalled-runs` Step 2. This session also runs INLINE-ONLY (§12a — never background the post +
end the turn).

If `--list` was requested, stop here and report the list. If the queue is empty (`has-next` exits 1),
report **"nothing ready to post"** and stop — this is a normal end state, not an error.

### Step 1 — Claim the next ready video (atomic)
```bash
# default (next in line): flips oldest ready -> posting and prints the full entry JSON
ENTRY=$(python3 post-queue-pipeline/post_queue.py claim --by "$$")
# --run <Name> variant (specific): ENTRY=$(python3 post-queue-pipeline/post_queue.py get --run <Name>)
#   then flip it: the entry must be status ready; if two sessions might race, prefer the default claim.
[ -z "$ENTRY" ] && { echo "post-queue empty — nothing to post"; exit 0; }
```
Parse from `$ENTRY` (JSON): `run_name`, `video_path`, `source_url`, `queue_url`, `resource_cta`.
```bash
export MAESTRO_RUN=<run_name>          # restores the run state (pipeline-runs/<run_name>.json)
```
`manage-comment-dm` and `post-and-log` both read the run STATE (not the queue entry) for the caption,
keyword, link, opening-DM, etc. — the queue entry is the pointer; the state is the source of truth.

### Step 2 — Verify the file is real (deterministic, $0)
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name \
  -of csv=p=0 "<video_path>"        # expect h264,1080,1920
```
Missing / wrong → try `<downloads>/<run_name>_music.mp4`; still missing → **release + escalate**:
`python3 post-queue-pipeline/post_queue.py release --run <run_name>` and tell the user the build's media
is missing (it must be rebuilt). Do NOT fabricate a post.

### Step 3 — Verify the CTA is settled (defensive fallback ONLY — normally already done in creation)
**Phase 11 runs at the end of `maestro-video-pipeline`, BEFORE the video is enqueued — so for any normal
build, `resource_cta.status` is already `"live"` (ManyChat enabled) or `"manual"` (ManyChat disabled) by
the time you reach this step.** Check the run state first:
```bash
python3 manychat-pipeline/set_resource_cta.py show   # reads resource_cta from pipeline-runs/$MAESTRO_RUN.json
```
- **`resource_cta.status` in `{live, manual}`** (the expected case) → **skip this step entirely**, go
  straight to Step 4. Do NOT re-touch ManyChat.
- **`resource_cta.status` is neither `live` nor `manual`** (an entry that never went through Phase 11)
  → run the fallback:
  - `config.manychat.enabled` **false** → stamp it manual (`python3 manychat-pipeline/set_resource_cta.py
    set-status --status manual`) and continue — you deliver the link by hand.
  - `config.manychat.enabled` **true** → invoke the **`manage-comment-dm`** skill for `MAESTRO_RUN` now. It
    restores the ManyChat session, creates the dedicated `[<KEYWORD>]` automation from `resource_cta`,
    sets it LIVE, verifies (name == keyword, LIVE), and stamps `resource_cta.status="live"`.
  - **Hard ManyChat blocker** (dead session that can't self-heal / unresolvable link): **HOLD** — release
    the entry back to ready (`post_queue.py release --run <run_name>`) and escalate. NEVER post without the
    CTA settled (EVERY-VIDEO-SHIPS-A-RESOURCE, `PIPELINE_DIRECTIVES.md` §8). The video stays queued for a
    later retry.

### Step 4 — Post + Log (Phase 12)
Invoke the **`post-and-log`** skill for `MAESTRO_RUN`. It runs its pre-post structural gate, posts LIVE via
the browser (`post-browser-manual`) to **Instagram Reels ONLY** (Metricool fallback only when
`config.posting.metricool.enabled` and only on a Metricool brand that actually has Instagram connected;
a lapsed browser session fires `post-pipeline/alert.py --platform instagram`). It then applies the
**🛑 move-to-posted gate: the log row + `next_videos.py done` run ONLY when Instagram is confirmed
LIVE** (a real reel shortcode on `@<your-handle>` — a Metricool *schedule* is NOT live). If IG is not
verified live, `post-and-log` **HOLDs**: no log-posted row, run stays in the next-videos queue. Either
way the final stays in `<downloads>` (nothing is deleted).

### Step 5 — Remove from the post-queue (only after a VERIFIED LIVE Instagram reel)
```bash
# ONLY if post-and-log confirmed a LIVE IG reel (shortcode verified on @<your-handle>):
python3 post-queue-pipeline/post_queue.py done --run <run_name>
```
**"posted" here means a verified-live IG reel, NOT a Metricool schedule.** On ANY failure/HOLD in Step
3/4 — including IG that could only be *scheduled* (not confirmed published), IG browser share that didn't
land, or no valid IG path — call `release` (not `done`) so the video returns to `ready` for a later
`/post-now` retry. **Never `done` a run whose Instagram reel is not confirmed live.**

### Step 6 — Report
Report per video: run name, live IG Reel URL, the CTA keyword and whether its DM is automated (`live`)
or delivered by hand (`manual`), and where the final sits in `<downloads>`.
For `--count N` / `--all`, loop Steps 1–5 and report a summary table at the end.

## STATE / IDEMPOTENCY NOTES
- `claim` is atomic (`flock`) — two concurrent `/post-now` never grab the same entry; the second gets the
  next ready (or empty). A crashed `/post-now` leaves its entry in `posting`; `release --run <Name>` (or a
  human) returns it to `ready`.
- `post-and-log` carries its own QCR-120 dup-post guard (greps `pipeline-log.csv` before posting) — if the
  run was somehow already posted, it will NOT double-post; in that case just `post_queue.py done` it.
- The run STATE (`pipeline-runs/<Name>.json`) must exist (creation wrote it). If it's gone, the caption /
  resource_cta can't be reconstructed → escalate rather than post a caption-less reel.

## RELATION TO THE OTHER SKILLS
- **`maestro-video-pipeline`** — builds the video, settles the CTA (Phase 11), then ends at the mark-ready
  step by calling `post_queue.py add` with `resource_cta.status` already `"live"` or `"manual"`. Never posts.
- **`manage-comment-dm`** — mechanics unchanged; normally invoked by `maestro-video-pipeline` (Phase 11,
  end of creation) when `config.manychat.enabled`. This skill only invokes it as the Step-3 **defensive
  fallback** for queue entries whose CTA is neither live nor manual.
- **`post-and-log`** — unchanged; invoked here as Step 4 (Phase 12), incl. its log row + queue-done.
- **`post_queue.py`** — the ready-to-post queue manager (`post-queue-pipeline/`), mirrors `next_videos.py`.
