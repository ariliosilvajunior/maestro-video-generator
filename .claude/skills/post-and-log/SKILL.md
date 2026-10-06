---
name: post-and-log
description: Phase 12 of the Maestro Video Generator pipeline — BROWSER posting (runs AFTER Phase 11 settled the comment→DM CTA). Publish the finished video LIVE via the browser (post-browser-manual) to Instagram, then append the run to pipeline-log.csv. Optional Metricool fallback for Instagram (config.posting.metricool.enabled) if the browser session isn't logged in. Facebook/TikTok/YouTube Shorts are OPTIONAL Metricool-only networks, each off by default (config.posting.metricool.networks.<network>) — posted in the same Metricool call when enabled. Triggers — "post this video", "publish to reels", "distribute and log".
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: post-and-log (Phase 12 — Post + Log)

> **PLATFORM = Instagram is the always-on default (house rule).** Facebook, TikTok and YouTube Shorts
> are OPTIONAL, each gated by its own `config.posting.metricool.networks.<network>` toggle (default
> `false` — do not post to a disabled network). X/Twitter is NEVER a posting target, no toggle exists
> for it. (Where a queued source link came from is input, not output — it does not change the posting
> target.) Full field-level mechanics for the optional networks: `how-to-post-videos.md` §"Facebook /
> TikTok / YouTube Shorts".

> **ORDER: the comment→DM CTA is settled in Phase 11 BEFORE this phase** — at the END OF CREATION
> (`maestro-video-pipeline`), well before the video ever reaches the post-queue. With
> `config.manychat.enabled` the ManyChat automation (`manage-comment-dm`) is armed + verified LIVE
> (`resource_cta.status == "live"`); without it the step is skipped and the status is `"manual"` (you
> deliver links by hand). `/post-now` only re-runs Phase 11 as a defensive fallback for entries whose
> status is neither. By the time you post here, the CTA keyword in the caption is backed either by the
> live automation or by you. If Phase 11 could NOT settle the CTA (dead session / unresolvable resource),
> the run is HELD (either the build never got enqueued, or `/post-now`'s fallback released it back to
> `ready`) and you must NOT reach this phase — never publish a video whose resource link isn't settled.
> Just confirm `resource_cta.status in {"live","manual"}` (when `enabled`) before posting; if it's
> neither, go back and finish Phase 11.

**Default posting = BROWSER (house rule).** Browser posting (`post-browser-manual`) publishes
Instagram Reels via the platform's own web uploader to your account (`config.posting.instagram_handle`).

> **🛑 METRICOOL FALLBACK POLICY — read before any fallback:**
> Metricool is OPTIONAL (`config.posting.metricool.enabled`, default off). A Metricool brand with NO
> Instagram account connected ACCEPTS an IG schedule (returns an id) but publishes nothing — a real
> account lost a week of reels to exactly that phantom "posted". RULE:
> - **Instagram → Metricool fallback ONLY on a brand that actually has Instagram connected
>   (`config.posting.metricool.blog_id` / `.user_id`), and ONLY if the resulting reel is verified LIVE
>   (feed/oembed read-back of a real shortcode).** NEVER count a Metricool *schedule* as posted. If no IG
>   path can be verified LIVE → **HOLD the run** (see Step 2 + the move-to-posted gate below); do NOT
>   move-to-posted.
> - **Facebook/TikTok/YouTube (when their `config.posting.metricool.networks.<network>` toggle is
>   `true`) → Metricool is the ONLY path (no browser automation exists for them), same brand/call as the
>   Instagram fallback.** Each one failing to verify live does NOT block Instagram's move-to-posted gate
>   (see below) — it fires its own alert and gets logged `FAILED` (retry later), independent of Instagram.
> - **X/Twitter is never a posting target** — no browser attempt, no Metricool call, ever.
>
> **ALERT ON INSTAGRAM COOKIE/LOGIN FAILURE.** Whenever the Instagram saved cookie/login session fails —
> `restore_session.py instagram --check` exits non-zero, the `--liveness` gate lands on the dead marker,
> OR a login wall / account-chooser appears at post time — **immediately fire the alert**:
> ```bash
> python3 post-pipeline/alert.py --platform instagram --run <RunName> \
>   --reason "<what failed + what fallback was used>"
> ```
> (delivered per `config.notify.*`; always logged to `alerts.log`). Then proceed only with an ALLOWED,
> VERIFIABLE fallback (Metricool, if enabled, on the IG-connected brand, only if a LIVE reel can be
> confirmed) — otherwise HOLD.

> **LIVE PUBLISH IS THE DEFAULT. "POSTED" = VERIFIED LIVE, NOT "SCHEDULE ACCEPTED".**
> Browser posts publish immediately (public). Never fake green — the run counts as "posted"
> ONLY after Instagram is verified **live** (move-to-posted gates on Instagram only — see below):
> - **Browser:** read back the live URL (the reel shortcode tops the profile grid + portrait verified).
> - **Metricool:** a scheduled post (`draft:false, autoPublish:true`) is **NOT** "posted" — it is only a
>   *schedule*. It counts only after you confirm the post actually **published live** (the reel shortcode
>   is live on `@<your-handle>` via feed API). A returned Metricool `id` alone is NEVER proof of a
>   live post. **A future-dated schedule that has not published yet does NOT satisfy the move-to-posted
>   gate.**
> - **Each enabled optional network (Facebook/TikTok/YouTube) gets the same "schedule id ≠ live" rule,
>   verified independently** (FB reel on the Page, TikTok video on the account, YouTube Short on the
>   channel) — log each as `LIVE`/`FAILED` in its own place (Step 3), but a FAILED optional network
>   does not HOLD the whole run the way a failed Instagram does.

## INPUTS
- The finished final video (QC-passed when `config.qc.enabled`) — prefer the LOCAL high-res `<downloads>/<VideoName>_music.mp4` (NOT a litterbox copy).
- The Instagram caption (in `config.brand.language`).

## OUTPUTS
- 1 LIVE browser post (IG Reel) + a new row in `pipeline-log.csv`.
- The final stays in `<downloads>` (the pipeline never deletes it).

## PROCEDURE

### Step 0 (PRE) — PRE-FIRST-POST DUP RE-CHECK (mandatory, QCR-216 — run IMMEDIATELY before the first platform post)
A start-of-run dup-guard is NOT enough. The next-videos queue + Playwright browser + platforms are SHARED,
so a PARALLEL session can be finishing the SAME run (its per-run state is isolated from yours). An
`in_progress` run idle ~10 min at Phase 12 is NOT necessarily crashed — the other session may be mid-post
(Phase 12 browser posting takes 10–15 min). A real incident: the run's log row didn't exist at run-start,
so the guard passed, but the parallel session wrote it 4 minutes later — BEFORE the first post — and BOTH
sessions posted → duplicates on every platform. Fix: re-run the guard right before posting, not just at start.
```bash
# RIGHT BEFORE the first platform post (and again before resuming any held Phase-12 run):
grep -i "<source_url_shortcode>\|<Name>_avatar" pipeline-log.csv && echo "ALREADY LOGGED → ABORT POST"
python3 maestro_state.py show 2>/dev/null | grep -E '"status".*(completed|done)' && echo "RUN ALREADY COMPLETED → ABORT POST"
python3 next-videos-pipeline/next_videos.py list 2>/dev/null | grep -i "<source_url_shortcode>" || echo "(no longer queued — likely already done by a parallel session)"
```
**If the run is already in `pipeline-log.csv`, OR its state status is `completed`/`done`, OR it has been
removed from the queue → a parallel session already posted it. ABORT — do NOT post, do NOT log, do NOT call
`next_videos.py done`.** If you posted before discovering this (race), DELETE your duplicates and keep the
already-logged copies (Metricool: `DELETE /scheduler/posts/<id>`; browser: post → ⋯ → Delete), leaving
exactly one copy per platform. Never resume a Phase-12 run without this re-check. See `active-rules.md` QCR-216.

### Step 0a — BUILD-CONFORMANCE PRE-POST GATE (mandatory, QCR-181 — run BEFORE any post)
A finished `_music.mp4` can still be a structurally-wrong build (a real run once posted with NO §1 headline + a silent premium→hand-drawn downgrade). Block those before they go live:
```bash
python3 motion-pipeline/check_opening_headline.py \
  --tsx motion-pipeline/remotion-agent/src/compositions/<Name>.tsx \
  --state pipeline-runs/<Name>.json
```
Exit 0 = PASS, proceed. **Exit 1 = STOP, do NOT post.** Either §1 renders no clickbait headline (re-build §1 with `<PremiumOpeningHook>`/`<HeadlineHook>`/`<PillHeadline>` and re-render), or the brief was premium-classic but the build silently downgraded to hand-drawn because the image provider was unavailable without alerting you (fire `python3 post-pipeline/alert.py --platform images --run <Name> --reason "…"` + `maestro_state.py set --field images_alert_sent=true`, then re-run the gate). The fallback build may still post once the downgrade is declared+alerted — it just may never be silent.

### Step 0 — Browser readiness check (decides browser vs Metricool fallback)
```bash
python3 browser-post-pipeline/restore_session.py instagram --check
```
`--check` is a **cheap cookie-presence pre-filter only** — exit 0 does NOT prove the session is valid
server-side. **The AUTHORITATIVE readiness test is the in-browser `--liveness` gate run in
`post-browser-manual` Step 1.5** (navigate Instagram's live_url, DEAD if it redirects to the dead_marker).
Treat the gate's verdict — not `--check` — as final.
- `--check` exit **0** + liveness **ALIVE** → run the **BROWSER path** (Step 1).
- `--check` exit **2/3**, OR liveness **DEAD**, OR a login wall at post time → the Instagram session
  lapsed. **(a) fire the alert** (`python3 post-pipeline/alert.py --platform instagram --run <Name>
  --reason ...`), then **(b)** apply the fallback per the policy (Step 2):
  - **Instagram** → Metricool fallback ONLY when `config.posting.metricool.enabled`, ONLY on the
    IG-connected brand (`config.posting.metricool.blog_id`), AND ONLY if the reel is confirmed LIVE (feed
    read-back). If IG cannot be verified live by ANY path (browser dead + no working IG Metricool brand)
    → **HOLD the run** (do NOT move-to-posted; see the gate below). NEVER schedule IG on a brand that has
    no Instagram and NEVER treat a Metricool schedule as a live IG post.
  Never silently skip without the alert.

### Step 1 — BROWSER post (Instagram only), LIVE
Follow **`.claude/skills/post-browser-manual/SKILL.md`** exactly (it has the Instagram UI steps).
1. Stage the file: `cp <downloads>/<VideoName>_music.mp4 ".upload-tmp/"` (MCP can't read `<downloads>`).
2. Restore cookies (`restore_session.py instagram --snippet` → `browser_run_code`), navigate to the uploader, VERIFY logged-in.
3. Upload → fill the Instagram caption → **publish for real** ("Share").
4. **VERIFY LIVE (mandatory):** share AT MOST ONCE (QCR-214 idempotency protocol in `post-browser-manual`
   — baseline the reels grid first, never blind-repost). Wait for "Your reel has been shared"; confirm
   it tops the profile's reels grid AND that **exactly one** copy of this video is live (delete any
   duplicate down to one 9:16 copy).
5. Re-save the session (`storageState({path})`) so cookies stay fresh.
- **Account target:** Instagram = `config.posting.instagram_handle` (the saved session must belong to that account).

### Step 2 — METRICOOL (Instagram: FALLBACK only if the browser session is gone; Facebook/TikTok/YouTube: the ONLY path, whenever their toggle is `true`)
If Step 0 / a post-time login wall shows the Instagram browser session is gone and re-login isn't
possible, fire the alert, then post via Metricool. Whatever Instagram's path ends up being, ALSO
include every network whose toggle is `true` in the SAME call (one `providers` array, one `media`,
one `publicationDate` — see `how-to-post-videos.md` for the full multi-network payload):

| Platform | When | blogId / userId | Connected? |
|----------|------|-----------------|------------|
| Instagram | Metricool fallback only (browser session dead) | `config.posting.metricool.blog_id` / `.user_id` | ✅ must have Instagram `@<your-handle>` connected — verify in Metricool before the first fallback |
| Facebook | `config.posting.metricool.networks.facebook == true` | same blog/user id | ✅ must have the Facebook Page connected — verify before the first post |
| TikTok | `config.posting.metricool.networks.tiktok == true` | same blog/user id | ✅ must have the TikTok account connected — verify before the first post |
| YouTube | `config.posting.metricool.networks.youtube == true` | same blog/user id | ✅ must have the YouTube channel connected — verify before the first post |

**🛑 A network missing from the brand accepts the schedule and publishes NOTHING for it — the OTHER
networks in the same call still go through.** Never add a network to `providers` without first
verifying it's connected in the Metricool UI. Host on litterbox, then make the Metricool call at
`$SCHEDULE_TIME` (`saveExternalMediaFiles:true`, `draft:false, autoPublish:true`):
```bash
PUBLIC_URL=$(curl -F "reqtype=fileupload" -F "time=72h" -F "fileToUpload=@<downloads>/<VideoName>_music.mp4" https://litterbox.catbox.moe/resources/internals/api.php)
curl -sI "$PUBLIC_URL" | grep content-length   # MUST be > 0 (fallback uguu.se if litterbox 500s — see how-to-post-videos.md §1b)
MC_AUTH=$(python3 -c 'import sys; sys.path.insert(0,"."); from lib.api_keys import resolve_key; print(resolve_key("metricool"))')   # keys.md ## Metricool
MC_BLOG=$(python3 -c 'import sys; sys.path.insert(0,"."); from lib import config; print(config.get("posting.metricool.blog_id"))')
MC_USER=$(python3 -c 'import sys; sys.path.insert(0,"."); from lib import config; print(config.get("posting.metricool.user_id"))')
MC_URL="https://app.metricool.com/api/v2/scheduler/posts?blogId=$MC_BLOG&userId=$MC_USER"
SCHEDULE_TIME=$(python3 post-pipeline/compute_next_slot.py --auth "$MC_AUTH")   # near-now (now+5min) for a real publish; ids + timezone from config
# POST the multi-network payload to MC_URL at $SCHEDULE_TIME, autoPublish:true, draft:false
# (full JSON — providers + instagramData/facebookData/tiktokData/youtubeData — in how-to-post-videos.md).
```
**MANDATORY after any Metricool post — confirm EACH posted network published LIVE (a returned id is NOT proof):**
- **Instagram:** confirm the reel shortcode is live on `@<your-handle>` (Metricool post detail /
  IG feed API). If it did not publish → **HOLD the whole run** (do NOT move-to-posted).
- **Facebook / TikTok / YouTube (whichever were enabled):** confirm each independently (FB Page reel,
  TikTok video on the account, YouTube Short on the channel). A FAILED optional network does NOT hold
  the run — fire its alert, log it `FAILED` (Step 3), and leave it for a manual re-check; Instagram's
  own live status is still what gates move-to-posted.

Schedule **near-now** (not a multi-hour-deep slot) so the litterbox 72h host doesn't expire before
publish, and so every enabled network can be verified within the run. This is the safety net for
Instagram, not the default; for Facebook/TikTok/YouTube it's simply the only path. X/Twitter is never
part of this call.

### 🛑 MOVE-TO-POSTED GATE (MANDATORY before Steps 3 & 4)
**Steps 3 (log row) and 4 (queue-done) are the irreversible "move to posted".** They run ONLY when the
video is confirmed **LIVE on Instagram** (the platform the pipeline exists to feed):
- **PASS (move-to-posted allowed):** you hold a real, verified-live IG reel — a shortcode confirmed live
  on `@<your-handle>` (browser grid read-back OR Metricool published-and-oembed/feed-confirmed).
- **FAIL → HOLD:** IG browser share failed/stuck/vanished, OR the only IG attempt was a Metricool
  *schedule* not yet confirmed published, OR IG had no valid path at all. Then: keep the run in BOTH
  queues (`post-queue.jsonl` back to `ready` via `post_queue.py release`, `next-videos.jsonl` stays
  `in_progress`), do NOT log a "posted" row, do NOT mark completed. Fire the alert and leave it for a
  later `/post-now` retry. The final stays in `<downloads>` either way.

This gate exists because a real account once treated a Metricool IG *schedule* on a no-IG brand as
live and lost a week of reels. Never again — **schedule ≠ posted; only a verified live IG reel unlocks
Steps 3–4.**

### Step 3 — Log
Append the run to `pipeline-log.csv` (script_topic feeds the exact-duplicate check) — ONLY after the
Instagram post is verified **live** (per the move-to-posted gate above; a Metricool schedule is not
"live"). Record the live URL / live-confirmed status. Note in the row if the run is HELD.
Also record each ENABLED optional network's outcome: `tiktok_status` / `youtube_status` columns
(`LIVE` or `FAILED`), and Facebook's status in `notes` (e.g. `fb=LIVE`) since there's no dedicated
column for it — see `how-to-post-videos.md` for the exact column reference. A `FAILED` optional
network still gets logged (does not block Step 3/4) — just note it so a manual re-check can catch it.

### Step 4 — Remove from the next-videos queue (queued link runs only) — ONLY IF IG IS LIVE
Only after the move-to-posted gate PASSED (IG confirmed live), the log row is written, AND
`resource_cta.status` is `"live"` or `"manual"` (or `enabled:false`), remove this run from the next-videos
queue so it never runs again:
```bash
python3 next-videos-pipeline/next_videos.py done --run "$MAESTRO_RUN"
```
This is a **no-op for manual topic/transcript runs** (they were never queued — no matching `run_name`).
Do this ONLY on full completion; a held / not-yet-posted run must stay `in_progress` in the queue (do NOT
call `done`). Spec: `next-videos-pipeline/NEXT_VIDEOS_INSTRUCTIONS.md`.

### Step 5 — The final stays local (no archive, no cleanup)
After a verified live post, the final `<downloads>/<Name>_music.mp4` stays in `<downloads>`; archive it
wherever you like (optional) — the pipeline never deletes your media. Optionally tidy only the
browser-upload staging copy: `find .upload-tmp -maxdepth 1 -name '<Name>*' -delete 2>/dev/null || true`
(`find -delete`, not a multi-glob `rm -f` — zsh aborts the whole `rm` line if any glob has no match).
KEEP: `pipeline-runs/`, `pipeline-log.csv`, ledgers, the comp `.tsx`, the Remotion project's
`public/assets/<Name>/` + `public/refs/`. See `how-to-post-videos.md` → "FINAL STEP".

## DEPENDENCIES
- Browser: Playwright MCP + saved cookies `.claude/auth/instagram-storage-state.json`; helper `browser-post-pipeline/restore_session.py`; skill `post-browser-manual`.
- Alerts: `post-pipeline/alert.py` (delivered per `config.notify.*`; always logged to `alerts.log`). Fire on any Instagram cookie/login failure.
- Metricool (optional — `config.posting.metricool.enabled`; `X-Mc-Auth` token in keys.md `## Metricool` via `lib/api_keys.py`; `config.posting.metricool.blog_id` / `.user_id` = the brand with your networks connected). Required for the Instagram fallback AND the only path for Facebook/TikTok/YouTube when `config.posting.metricool.networks.<network>` is `true`. **Needs an Advanced/Custom Metricool plan — the API has no access on Free/Starter.** litterbox.catbox.moe, curl.

## Comment-CTA in the IG caption (resource is shared on ~every video)
The run state → `resource_cta.enabled` is `true` for essentially every video, so the **Instagram
caption MUST include the comment-CTA** using `resource_cta.keyword`, e.g. *"💬 Comenta **<KEYWORD>** que eu
te mando o link no seu direct!"*. Without the keyword in the caption/video, no one knows what to comment.
**The CTA was settled in Phase 11 (BEFORE this post)** — `status == "live"` means the ManyChat automation
for this keyword + resource link is already running; `status == "manual"` means ManyChat is disabled and
you answer the comments by hand. Confirm one of the two here; if it's neither, finish Phase 11
(`manage-comment-dm`) before publishing so no commenter is missed.

## RULES
- **PLATFORM = Instagram is the always-on default (house rule).** Facebook/TikTok/YouTube are OPTIONAL,
  each gated by its own `config.posting.metricool.networks.<network>` toggle (default off — never post
  to a disabled one). X/Twitter is never a posting target, no exceptions.
- BROWSER is the default for Instagram. **Metricool:** Instagram's fallback only when
  `config.posting.metricool.enabled` and only on a brand with Instagram connected; the ONLY path for
  any enabled Facebook/TikTok/YouTube toggle, same brand, same call. Never post Instagram twice
  (browser AND Metricool).
- A FAILED optional network (Facebook/TikTok/YouTube) never HOLDs the run or blocks Instagram's
  move-to-posted — log it `FAILED`, alert, move on. Instagram staying unverified DOES hold the run,
  same as always.
- **🛑 "POSTED" = VERIFIED LIVE, NOT "SCHEDULE ACCEPTED".** A Metricool scheduled post (returned `id`) is NOT a live post. A run only moves-to-posted (Steps 3–4: log row, queue-done) after Instagram is confirmed **live** (real reel shortcode on `@<your-handle>`). IG not verified live → **HOLD** (keep the run in both queues).
- **NEVER schedule Instagram on a Metricool brand without Instagram connected** — the post silently never publishes (a real account lost a week of reels this way). IG Metricool only on the IG-connected brand, verified live.
- **IG: share at most once, never blind-repost (QCR-214).** Baseline the reels grid before Share; before any repost (vanished share / square crop) reconcile the grid first; if a copy is already live the share succeeded → do NOT re-share; if two are live, delete down to one 9:16 copy. A lingering "Sharing" spinner is not a failure.
- **Alert on ANY Instagram cookie/login failure** (`alert.py --platform instagram`) before applying its fallback.
- When `resource_cta.enabled`, the IG caption MUST carry the `resource_cta.keyword` comment-CTA (see above).
- Live publish is the default; draft/hold ONLY on explicit request.
- Browser posts go live immediately (no 2h-gap scheduling — that spacing applies only to the Metricool fallback via `compute_next_slot.py`, `config.posting.metricool.gap_hours`).
- Verify media URL content-length > 0 before any Metricool post. Never fake green — only log Instagram once verified **live** (a schedule id is not live).
