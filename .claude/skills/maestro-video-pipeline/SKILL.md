---
name: maestro-video-pipeline
description: Orchestrator for the full Maestro Video Generator video pipeline (Stage 0 preflight + queue dispatch + Phases 1–12). Invokes each per-stage skill in sequence, resumable per-stage via the per-run state (pipeline-runs/<Name>.json) so a single stage failure never forces a restart from Phase 1. Triggers — "run the full pipeline", "create and post a new video", "execute maestro video generator pipeline", "do everything end to end", "generate video from a topic".
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: maestro-video-pipeline (Orchestrator)

Runs Stage 0 + Phases 1–12 by invoking each per-stage skill in order. **Never execute a stage from memory — open that stage's SKILL.md first.** Read `PIPELINE_DIRECTIVES.md` (the single source of truth for the non-negotiable house rules — **PREMIUM-CLASSIC default with hand-drawn fallback (§1)**, mandatory tool-naming + real reference screenshots; **QC is optional (§0, `config.qc.enabled`)**) + `FULL_PIPELINE.md` + `qc-pipeline/QCR_INDEX.md` at start (open full `active-rules.md` entries per phase as you reach it). Where any doc disagrees with `PIPELINE_DIRECTIVES.md`, that file wins.

**Paths:** `<downloads>` = `paths.downloads` (default `~/Downloads`) — render artifacts; `<scratch>` = `paths.tmp` / `MAESTRO_TMPDIR` (default `/tmp/claude`) — transient files; `python3 lib/paths.py` prints both. The Remotion project is `motion-pipeline/remotion-agent` inside the repo (nothing to link — `MAESTRO_REMOTION` overrides only if you moved it). Alerts: `python3 post-pipeline/alert.py --platform <images|instagram|manychat|system> --run <Name> --reason "..."` (delivered per `config.notify.*`, always logged to `alerts.log`).

> **DEFAULT = PREMIUM-CLASSIC.** Stage 2.5 emits `style_id: premium-classic` by default; Stage 4 runs **`generate-image-assets`** (the image provider — `config.images.provider`: fal / google / openai — → chroma-keyed IMAGES: objects + image-icons, generated fresh per topic, landing in `public/assets/<run>/`) + `capture-references`; Stage 5 composes premium multi-element scenes (`premium.tsx`); there is NO stock b-roll in premium (the premium scenes ARE the content). **Keyed still *images* are ALLOWED and distinct from AI-generated *video* b-roll, which stays banned** — these are real keyed still objects, animated in code. **Hand-drawn-annotation is the automatic FALLBACK** (image provider unavailable — key invalid / quota / outage after the per-asset retries → build hand-drawn, alert + stamp the state per `PIPELINE_DIRECTIVES.md` §1, never block); the hand-drawn / stock-b-roll machinery below describes the FALLBACK path.

## EXECUTION CONTRACT — scheduled one-shot session (MANDATORY, §12)

> This skill usually runs in a SCHEDULED session that DIES the moment the turn ends. Three rules
> (full rationale: `PIPELINE_DIRECTIVES.md` §12 — written after a batch of overnight builds orphaned):
> 1. **ALL phases run INLINE — never in a background subagent, and NEVER end the turn with any phase
>    unfinished.** "Aguardo o subagente / serei notificado" as a final message = the run dies right
>    there (background subagents are killed with the session). Poll long waits inline (§12a).
> 2. **Phase 11 (`manage-comment-dm`) runs IN THE MAIN SESSION**, synchronously — a subagent may lack
>    the Playwright MCP tools and cannot share the browser (the burned-build case, §12b).
> 3. **The LAST command of the run is `python3 maestro_state.py assert-ready --run "$MAESTRO_RUN"`** — exit 0
>    or the run is NOT done (fix it in this turn; success reports without it are fake-green, §12c).
>    A held/blocked run reports the HOLD explicitly instead.

## Stage 0 — PREFLIGHT + NEXT-VIDEOS QUEUE DISPATCH (BEFORE Phase 1)

**The pipeline is link-first; an EMPTY queue is fed by niche discovery (`discover-sources`, config `discovery.*` from `/setup`).** Before Stage 1, check the next-videos queue
(`next-videos.jsonl`, managed by `next-videos-pipeline/next_videos.py` — full spec
`next-videos-pipeline/NEXT_VIDEOS_INSTRUCTIONS.md`). This is the SELECTION step; Phases 2–12 are unchanged.

**0-pre (§12b+§12d — run ALL THREE before claiming anything):**
1. **DOCTOR — is the environment sane?** `python3 bin/doctor.py --quiet` must exit 0 (setup completed, keys
   present, ffmpeg with libass, Remotion deps). Non-zero → fix what it prints (or run `/setup`); claim NOTHING.
2. **PREFLIGHT — can this session even finish a build?** Playwright/browser MCP tools must be callable
   (Phase 3 HeyGen needs them; Phase 11 ManyChat too when `config.manychat.enabled`). Missing → claim NOTHING, fire
   `python3 post-pipeline/alert.py --platform system --run scheduler --reason "build session has no Playwright MCP"`
   and STOP — never spend a build the session cannot finish.
3. **STALE-RUN RECOVERY SWEEP** — `python3 maestro_state.py stale` (dead-PID orphans only; live siblings
   are excluded). Non-empty → run skill **`recover-stalled-runs`** INLINE first (finish/reconcile/abandon
   each orphan — it never posts), THEN continue below. A 1c mid-build resume becomes THIS session's run
   (skip claiming a new link). This sweep composes with — does not weaken — "ALWAYS START FROM 0" (§12d).

```bash
NEXT_URL=$(python3 next-videos-pipeline/next_videos.py peek)
if [ -n "$NEXT_URL" ]; then
  # QUEUE NON-EMPTY → LINK-DRIVEN RUN
  #  1) derive a PascalCase <Name> from the URL/topic
  export MAESTRO_RUN=<Name>
  #  2) atomically claim the link (concurrency-safe; this IS the source_url)
  SRC=$(python3 next-videos-pipeline/next_videos.py claim --run "$MAESTRO_RUN")
  #  2b) is this an already-posted RE-SPIN? (then the rewrite needs a brand-new hook + storytelling)
  RESPIN=$(python3 next-videos-pipeline/next_videos.py respin --run "$MAESTRO_RUN")   # prints true|false; EXITS 1 when false (documented) — never chain it with && / set -e
  #  3) stamp provenance so Phase 12 removes it on completion (+ respin so Step 3 rewrites fresh)
  python3 maestro_state.py init --note "queued link run" --field source_url="$SRC" --field queue_url="$SRC" --field respin="$RESPIN"
  #  4) run `generate-video-from-link` Steps 1–3 on "$SRC", then continue Phase 2.5 → 12.
  #     If respin=true, Step 3 produces a TOTALLY NEW spin (different hook + storytelling), not a faithful reproduction.
else
  # QUEUE EMPTY → NICHE DISCOVERY first (Phase 1 "scraping": YouTube search in the user's niche, config discovery.*)
  if [ "$(python3 lib/config.py get discovery.enabled)" = "true" ] && [ "$(python3 lib/config.py get discovery.auto_enqueue)" = "true" ]; then
    python3 discover-pipeline/discover_sources.py --enqueue    # 0 = enqueued · 3 = nothing passed the filters · 5 = not configured
    NEXT_URL=$(python3 next-videos-pipeline/next_videos.py peek)  # re-dispatch: claim it exactly as above
  fi
  : # still empty → STOP and ask the user for a link or a topic (see below). Never invent a topic.
fi
```

- **Queue NON-EMPTY** → run **`generate-video-from-link`** on the claimed URL (its Steps 1–3 replace
  Stages 1–2), then hand off to Stage 2.5 onward. **Stage 1 `choose-video-topic` is SKIPPED.**
- **Queue EMPTY** → **niche discovery first** when `config.discovery.enabled` + `auto_enqueue`: `python3 discover-pipeline/discover_sources.py --enqueue`
  (skill `discover-sources`; YouTube search driven by the niche captured in `/setup`), then re-run the dispatch above. Exit 3/5
  (nothing found / not configured) or discovery disabled → **STOP and ask the user** for a link or a topic: "The next-videos queue is empty. Paste a
  YouTube/Instagram link to produce from, or give me a topic (a one-liner or a transcript)." A link they give →
  `next_videos.py add "<URL>" --front` and re-run the dispatch above; a topic/transcript → **Stage 1
  `choose-video-topic`** packages it as the topic seed → Stage 2. Never guess a topic.
- The link is claimed **atomically** (`claim` flips the entry to `in_progress` under `flock` and stamps
  `run_name`), so two parallel pipeline runs never grab the same link — they take successive entries.
- **Removal happens in Stage 12**, NOT here: the entry is only deleted once the video is posted +
  logged + CTA live/manual (see the Stage-12 row + "Queue removal on completion" below).

## Stage → Skill → Output suffix

| # | Stage | Skill | Output |
|---|-------|-------|--------|
| 0 | **Preflight + queue dispatch** | `bin/doctor.py --quiet` · browser MCP check · `maestro_state.py stale` · **`next_videos.py peek`/`claim`/`respin`** | If a link is queued → claim it + route to `generate-video-from-link` (Stage 1 skipped). If empty → STOP and ask the user for a link or a topic. **If `respin` returns `true` (the link was already posted), the link run rewrites a BRAND-NEW hook + storytelling so it reads as a totally new video.** |
| 1 | Source select — niche discovery when the queue is empty, or a manual topic/transcript the user gave | `discover-sources` / `choose-video-topic` | `<downloads>/<Name>_topic_seed.json` (transcript + hook + entities) |
| 2 | Write PT-BR Script | `write-script-ptbr` | `<Name>_script.txt` + `<scratch>/heygen_script.txt` + `script_entities.json` + `resource_cta` |
| 2.5 | **Creative Direction** | **`choose-creative-direction`** | `<Name>_creative_brief.json` (per-video style brief — **ENFORCED default = `premium-classic`**; `hand-drawn-annotation` is the auto FALLBACK when the image provider can't run; `premium-snap` a narrow opt-in alternate; see `PIPELINE_DIRECTIVES.md` §1) |
| 3 | HeyGen Avatar (+SRT) | `generate-avatar-heygen` | `<Name>_avatar_1080p.mp4` (per-run copy) + `<scratch>/<Name>.srt` |
| 4 | **Visual Sourcing (Image assets + Refs + Stock B-Rolls)** | **`generate-image-assets` (4a) → `capture-references` (4b, if `references[]` non-empty) → `select-brolls-stock` (fallback path)** | `public/assets/<Name>/*.png` (keyed heroes) + `public/refs/*.png` (REF assets) + `<Name>_broll_manifest.json` (HITS) + `<Name>_visual_plan.json` (REF/HIT/MISS windows) |
| 5 | Motion Graphics | `generate-motion-remotion` | `<Name>_motion.mp4` (render = merge) — **builds MOTION scenes over MISS windows; leaves HIT windows empty** |
| 6 | Merge | `merge-video` | `<Name>_motion.mp4` (validate pass-through) |
| 7 | Insert B-Rolls | `insert-brolls` | `<Name>_broll.mp4` (inserts HIT clips only; MISS windows already show motion) |
| 8 | Subtitles | `generate-subtitles` | `<Name>_final.mp4` — the Step-0 QCR-180 audio↔subtitle gate calls Gemini and runs ONLY when `config.qc.enabled`; otherwise burn subtitles without it |
| 9 | Sound Design (music + hook riser + drop + transition clicks) | `add-music` | `<Name>_music.mp4` |
| 10 | QC Gate — **optional** (`config.qc.enabled`, default `false`) | `qc-gate-gemini` | Off: no-op, stamps `qc_grade="DISABLED"`, advances to 11, no Gemini call. On: graded loop, `config.qc.threshold` (75) / `config.qc.max_iterations` (3); still below threshold after the last iteration = HOLD. |
| 11 | **Arm Comment→DM CTA — end of creation, optional** (`config.manychat.enabled`, default `false`) | `manage-comment-dm` | **On:** creates the dedicated `[<KEYWORD>]` ManyChat automation, sets it LIVE, verifies, stamps `resource_cta.status="live"`. Runs HERE, at the end of creation — NOT from `/post-now`. A hard ManyChat blocker (dead session / unresolvable link) **HOLDS THE CREATION RUN** (state stays `in_progress`/`failed`, nothing is enqueued) and escalates — same class as a HeyGen 2FA/dead-key blocker. **Off:** skip the automation and stamp `python3 manychat-pipeline/set_resource_cta.py set-status --status manual` (the locked writer) — the keyword + link still go in the caption; you DM the link by hand (or with any other tool). Never enqueue a video whose CTA is neither armed nor stamped manual. |
| **mark-ready** | **MARK READY-TO-POST — END of the creation pipeline** | `post_queue.py add` | Once Phase 11 has stamped `resource_cta.status` (`live` or `manual`), **enqueue the finished video for later posting** and STOP — the pipeline does NOT post. `python3 post-queue-pipeline/post_queue.py add --run "$MAESTRO_RUN" --video <downloads>/${MAESTRO_RUN}_music.mp4 --source-url "$SRC" --queue-url "$QURL" --cta-json '<resource_cta from state>'`, then `maestro_state.py phase --num 11 --name mark-ready-to-post --status done --run-status ready_to_post`, **then the §12c gate: `python3 maestro_state.py assert-ready --run "$MAESTRO_RUN"` — MUST exit 0 before the final report (exit 4 = not done, fix in this turn)**. **Leave `_music.mp4` on disk — the pipeline never deletes your media.** |
| **12** | **POSTING — stays in the separate `/post-now` skill** | **`post-now`** (invokes `post-and-log` only) | The creation run ends at the mark-ready step, CTA already live/manual. Publishing (post IG Reels ONLY → log → remove from BOTH queues) happens LATER when you run **`/post-now`**, which pops the next ready video from `post-queue.jsonl`. `/post-now` accepts `resource_cta.status` ∈ {`live`, `manual`} and re-runs `manage-comment-dm` only as a defensive fallback (ManyChat enabled + status neither). This decouples WHEN videos are made from WHEN they post. See the `post-now` SKILL.md. |

Suffix chain: `_motion` → `_broll` → `_final` → `_music`.

> ### POSTING IS SEPARATED FROM CREATION — the CTA is armed IN creation
> **This orchestrator CREATES videos and arms (or hand-stamps) their comment→DM CTA — it never posts.** After
> Phase 9 (Sound Design) it runs Phase 10 (QC when enabled) → **Phase 11 = `manage-comment-dm`** (arm the CTA
> LIVE when `config.manychat.enabled`; else stamp `manual`) → **mark-ready** (enqueue the `_music.mp4` into
> `post-queue.jsonl` via `post_queue.py add`, carrying `resource_cta.status`) and STOPS. Only Phase 12 (Post+Log)
> is handled by the **`/post-now`** skill on your schedule. Why: the CTA is part of what makes a video "finished",
> not part of "publishing" — a build isn't done until its resource DM is armed, independent of when it goes live.
> Consequences for THIS skill:
> - **DO run `manage-comment-dm` (Phase 11) at the end of a build**, right after Phase 10, before enqueueing.
>   Do **NOT** run `post-and-log` here — that stays in `/post-now`.
> - With ManyChat enabled, a hard ManyChat blocker (dead session / unresolvable link) during Phase 11 **HOLDS THE
>   BUILD** — do NOT enqueue a video whose CTA isn't armed; leave the run `in_progress`/`failed` and escalate (same
>   class of hard blocker as HeyGen 2FA/dead API key — see `PIPELINE_DIRECTIVES.md` §7 viable-fallback-first:
>   there is no fallback for a dead ManyChat session, so this really does stop the run). With ManyChat disabled
>   nothing here can block: stamp `manual` and enqueue.
> - Do **NOT** delete `<downloads>/<Name>_music.mp4` — `/post-now` needs the file, and the pipeline never
>   deletes your media anyway.
> - Do **NOT** call `next_videos.py done` here — the source link stays `in_progress` until `/post-now`
>   actually posts it (that is where `next_videos.py done` runs). The build being enqueued is NOT "done".
> - "Build but don't post" is the DEFAULT for every run (creation ≠ posting) — but creation DOES require the
>   CTA to be resolved. A run that should be posted immediately: build it (CTA arms automatically), then run
>   `/post-now` (or `/post-now --run <Name>`).

## RENDER-WAIT PARALLELISM (speed — the HeyGen render is 15–30 min of idle wait; USE it)

As soon as the Phase-3 **Submit is confirmed** (processing card visible — QCR-096), do NOT idle-poll.
The render is SERVER-SIDE (navigating the browser away is safe; you return to `/projects`/the draft-id
URL to download, QCR-138). While polling cheaply every ~3–4 min (targeted `browser_run_code` status
check, never a full snapshot), execute the avatar-INDEPENDENT work in this order:

1. **Phase 4a — `generate-image-assets`** (the image-provider batch): needs only the script beats. Longest
   independent task — start it first.
2. **Phase 4b — `capture-references`**: needs only `script_entities.json`/URLs.
3. **Phase 11-prep**: resolve/verify the resource link (web research if needed). When `config.manychat.enabled`,
   also `manychat-pipeline/restore_session.py --check` — Phase 11 runs later in THIS SAME pipeline, so a dead
   ManyChat session is a build-HOLD blocker; discovering it here (during the HeyGen wait, before Phase 11 actually
   runs) saves 20+ min of late failure. **Local `--check` can false-positive "healthy" on a server-side-dead
   session — do a live `browser_navigate` to `app.manychat.com/<ACCOUNT_ID>/dashboard`
   (`config.manychat.account_id`) if in doubt, don't trust the cookie-expiry check alone.**

**What MUST wait for the avatar:** transcription/SRT, visual-plan windows, caption windows, the motion
composition timings, and (stock path only) b-roll window resolution. When the render completes:
download → pad → per-run copy (QCR-180) → transcribe → Phase 5 with assets/refs/link already staged.
Typical saving: **10–20 min/run** with zero quality change (same gates, same order of dependent steps).

> **QUEUE REMOVAL ON COMPLETION (done by `/post-now`, not this pipeline).** A queued link-driven run's source
> link stays `in_progress` in `next-videos.jsonl` through the ENTIRE build — the creation pipeline never removes
> it. It is removed ONLY when the video is actually posted, and that happens in the **`/post-now`** skill: after
> the live post + log row + `resource_cta.status` ∈ {`live`, `manual`}, `/post-now` calls
> `python3 next-videos-pipeline/next_videos.py done --run "$MAESTRO_RUN"` AND `post_queue.py done --run "$MAESTRO_RUN"`.
> A manual-topic run never had a `queue_url`, so its `next_videos done` removes nothing (its `post_queue` entry is
> still removed). Until then both queues hold the run; `release --run <Name>` on either queue requeues/abandons it.

**COMMENT→DM chain (resolved AND armed in creation; REQUIRED for ~every video).** Chain: Phase 2 picks/finds the resource + reserves the UNIQUE keyword (`set_resource_cta.py enable` — GET-test + mandatory web research rules = **`how-to-generate-video-scripts.md`**, canonical) → Phase 4 backfills `resource_cta.link` → **Phase 10 (QC, optional)** → **Phase 11 (`manage-comment-dm`) creates the dedicated `[<KEYWORD>]` automation, goes LIVE + verifies + stamps `status=live` (ManyChat on) — or stamps `status=manual` (ManyChat off)** → **mark-ready enqueues into `post-queue.jsonl` carrying the CTA** → **`/post-now` posts with the CTA in the caption**. Full spec: **`manychat-pipeline/MANYCHAT_INSTRUCTIONS.md`**. Hard ManyChat blocker (dead session / unresolvable link) → creation HOLDS the run (never enqueues) + escalates; never ships a video without its resource resolved.

**B-ROLL = STOCK ONLY, $0 (no AI-generated video).** Stage-4 selection BEFORE motion; MISS → hand-drawn MOTION scene, never empty, never AI video. Spec: `broll-pipeline/BROLL_INSTRUCTIONS.md`.

**CREATIVE-DIRECTOR layer (Stage 2.5).** `choose-creative-direction` emits `<Name>_creative_brief.json` from `motion-pipeline/STYLE_GALLERY.md` (registry). **DEFAULT = `premium-classic`; `hand-drawn-annotation` = auto fallback; `premium-snap` = narrow alternate** — full rules in `PIPELINE_DIRECTIVES.md` §1. Downstream reads the brief as a CONTRACT; `references[]` non-empty ⇒ `capture-references` MUST run (never genericize a named tool, §2). (When QC is enabled the Gemini QC grade stays FINAL on visual quality.) Brief path recorded in state (resume-safe).

## Resumability (per-run state, concurrency-safe)
- **CONCURRENCY (QCR-173):** `export MAESTRO_RUN=<run_name>` as soon as the run name is fixed (after Phase 1/2),
  and do ALL state I/O via `maestro_state.py` (atomic, per-run → `pipeline-runs/<run>.json`, never the shared
  `pipeline-state.json`; never an inline `python3 -c` heredoc). This lets a second pipeline run in parallel
  without clobbering this one. `maestro_state.py list` shows every in-flight run. `set_resource_cta.py` (ledger),
  `maestro_state.py log` (pipeline-log.csv) and `maestro_state.py register-comp` (Root.tsx) are the locked writers
  for the shared files. Full rules: `PIPELINE_DIRECTIVES.md` §6.
- On start: `maestro_state.py show` (resolves `pipeline-runs/$MAESTRO_RUN.json`). If `status` is `failed`/`in_progress`,
  resume from `resume_from` (the stage number), reusing prior outputs by suffix. A clean start sets `resume_from: 1`.
- **OWNERSHIP LOCK — NEVER take over a LIVE sibling's run (MANDATORY, QCR-222).** Do NOT "helpfully"
  resume/finish an `in_progress` run just because it LOOKS idle (e.g. parked ~10 min at Phase 12) — a sibling
  session may be actively mid-post (browser posting takes 10–15 min), and double-owning it duplicates posts
  (several real runs were double-posted exactly this way). Two safeguards: **(1) Stage-0 `peek`
  already SKIPS queue entries marked `▶ RUNNING`/`in_progress` and returns the next QUEUED link — TRUST IT:
  dispatch the link `peek` gives you; never reach past it to grab the RUNNING entry.** **(2) Before touching ANY
  `in_progress` run, run `python3 maestro_state.py check-owner --run <Name>` — exit 3 / `owned:true` means a sibling
  wrote its state < 180 s ago (live, mid-post) → DO NOT touch it; pick the next queued link instead. Only exit 0
  / `owned:false` (no heartbeat or stale > 180 s) is genuinely safe to resume.** Every `maestro_state.py` write
  stamps `heartbeat_ts`+`worker_pid`, so freshness is authoritative. The DUP-POST GUARD below stays as the
  last-line cleanup defense, but the real fix is not double-owning a live run in the first place.
- **DUP-POST GUARD (MANDATORY, QCR-120):** BEFORE resuming an `in_progress`/`failed` run, ALSO grep `pipeline-log.csv` for a row matching this run's `run_name`/`source_url`/`topic`. The state file and the log can DESYNC — a prior attempt can FINISH and POST (writing the log row) while the state was left at an early `resume_from` (e.g. 3). If a matching log row exists with `*_status` = `scheduled(...) draft:false autoPublish:true`, the topic is ALREADY posted: do NOT re-run Phases 3–12 and do NOT re-post. **BUT before marking completed, check the CTA:** if `resource_cta.enabled == true` and `resource_cta.status` is neither `"live"` nor `"manual"`, the post happened but the comment→DM automation is NOT live (should not occur since ManyChat is armed in Phase 11 BEFORE the Phase-12 post — but a crash between the two could leave it) — run **Phase 11 (`manage-comment-dm`)** now (it is IDEMPOTENT: creating/verifying the dedicated automation for the same keyword + link is safe; with ManyChat off, stamp `manual`). THEN mark state `completed` and stop (or, if a better build is wanted, build but HOLD before posting and never schedule a second set). This prevents the same topic being posted twice ~minutes apart (a real double-build once did) while still ensuring a posted-but-not-DM'd run finishes the CTA.
- **RESUME RECONCILIATION (MANDATORY, QCR-170):** `resume_from` and `phases[]` can DESYNC — a prior session can mark phases 3/4/5 `done` in `phases[]` (and leave their artifacts on disk: `public/<run>.mp4`, `public/refs/*`, `public/assets/<run>/*`, `src/compositions/<run>.tsx`) yet leave `resume_from` stale at an earlier number. On resume the effective restart point = `max(resume_from, 1 + max(phase# whose status=='done' in phases[]))`. BEFORE re-running ANY phase, CHECK its on-disk artifact exists + is valid (ffprobe the avatar; ls refs/assets/tsx) and REUSE it instead of regenerating — else you burn a duplicate HeyGen render / image batch. **And when you reuse a prior `.tsx` that was never rendered, RE-DERIVE its `sectionWindows([...])` from the CURRENT SRT** (snap §3b/§5b caption windows to spoken lines, rebuild `caption_windows.json` per QCR-158) — an unrendered prior tsx's eyeballed timings are NOT trustworthy.
- After EACH stage: append/update its entry in `phases[]` with `{phase, name, status, timestamp, output}` and set `resume_from` to the next stage. Set top-level `status` to `in_progress` while running, `completed`/`failed` at the end.
- A single stage failure updates `status:failed` + `failure_reason` + `resume_from:<that stage>` — it must NEVER force a restart from Phase 1 when a later stage breaks.

## Known blockers to pre-check (re-verify live, don't assume)
- Service keys (HeyGen browser login, Gemini, the image provider, Metricool, Pexels/Pixabay/Coverr) live in `.claude/keys.md` (see `.claude/keys.md.example`); `python3 bin/doctor.py` verifies them — run it (`--quiet`) in Stage 0-pre and re-verify a key before its stage if in doubt.
- **Visual-plan protocol (MANDATORY):** the agent first decides candidate b-roll windows from the SRT and writes them into `<downloads>/<Name>_visual_plan.json`. **Stage 4 (`select-brolls-stock`) then resolves each window to HIT (stock clip found) or MISS.** Stage 5 builds the composition from the RESOLVED plan: HIT windows = empty gaps (b-roll covers them), MISS windows = MOTION scenes (motion fills them). Stage 7 inserts only the HIT clips. This keeps motion and b-rolls from ever overlapping AND guarantees no window is ever empty.
- **S0 HEADLINE protocol (MANDATORY):** every video opens with the `HeadlineBanner` scene 0–3.0s (clickbait theme headline, ≤8 words + kicker, TRUE to content, enters frame 0 — `MOTION_DESIGN_SYSTEM.md` §2.6); the hook b-roll window starts at **3.0s** (not 1.5s), body windows ~9-32s. Semantic-gate the selected topic (relevance + recency + virality of the source; an exact duplicate in `pipeline-log.csv` is the only rejection) before scripting.
- **Stage 5 motion quality bar (100x EXPLAINER — see `PIPELINE_DIRECTIVES.md` §3):** build **premium-classic (DEFAULT) by copying `src/compositions/PremiumSectionRef.tsx`** (full §1→§3→§3b→§4→§5→§5b→§6 grammar + `assertSectionGrammar` + §1 clickbait + §3b word-by-word reveal; §1 reference `OpeningHookRef.tsx`); hand-drawn from `handdrawn.tsx` / `HandDrawnTemplate.tsx` / `HandDrawnGrammarRef.tsx` ONLY on the image-provider fallback. **Every scene draws an annotation ON THE KEY THING being said** (`CircleAnno`/`HandArrow`/`HandUnderline`/`MarkerHighlight`) — never a static title alone. **Step/how-to/sequence beats use `FlowDiagram` + `HD_ICONS`** (line icons, NO emoji) building node-by-node. **If the brief `references[]` is non-empty, ≥1 scene MUST embed an annotated real `ScreenshotCard`** of the named tool (Vox/Cleo-Abram move — assets from `capture-references` in `public/refs/`); a generic abstract stock clip in its place is a directive VIOLATION. Numbers use `StatCountUp`; Lottie accents where they reinforce. The old static title+icon+card look AND generic-kinetic-text-over-bokeh are BELOW the bar. Max 15 words/scene (hard cap). **Complement rule (MANDATORY):** motion text complements the narration, never transcribes it — ≤3 words shared with the concurrent SRT segment, never 4+ consecutive (MOTION_DESIGN_SYSTEM.md §2.5).
- **b-roll = STOCK-FIRST (fallback path):** Stage 4 uses agent-written ENGLISH keyword queries — dry-run `select_stock_brolls.py` first, write a `<Name>_broll_queries.json` (one keyword list per window), run it, then **`Read` each `<scratch>/<Name>_stockframe_N.png` and reject any clip with a human FACE, on-screen TEXT, or that is off-topic.** Re-run a bad window with `--only-window N` and better keywords, or drop it → that window becomes a hand-drawn MOTION scene in Stage 5. Pexels/Pixabay/Coverr are free ($0), true 1080x1920 real footage. **NO AI-generated video** — misses ALWAYS go to motion.
- **Entity-extraction protocol (MANDATORY — `PIPELINE_DIRECTIVES.md` §2):** in Stage 2 the script MUST preserve any real tool/product/company/repo/site named in the source (NO "agentes de IA" genericization of a named tool — the style-drift failure) and emit `<scratch>/script_entities.json`. Stage 2.5 DERIVES `reference_capture` from it (non-empty ⇒ `true` + populate `references[]`); Stage 4 then runs `capture-references` for each entry. The chain **script-names-tool → brief-flags-it → Stage-4-captures-it → motion-embeds-it** is NON-SKIPPABLE when the source names a real thing (→ QC-checks-it too, when QC is enabled).
- **Reference capture is NON-SKIPPABLE when the brief flags it (Stage 4, skill `capture-references`):** read the creative_brief — if `reference_capture` is `true` / `references[]` is non-empty, you MUST run `capture-references` for EACH entry (research canonical URL → Playwright MCP screenshot → `reference-pipeline/prepare_reference_shot.py` → annotated `ScreenshotCard` in that window's motion scene, OR a full-frame `_ref.mp4` HIT) BEFORE building motion. Order within Stage 4: image assets (4a) + resolve REF windows (4b), then `select-brolls-stock` for the remaining windows (fallback path), then MISS→motion. Real captures only ($0, no AI). LOOK at each screenshot (right page, loaded, no cookie/login wall). A capture that fails escalates — it is never silently skipped, and the tool name is never dropped to avoid it.
- **Stage 9 music:** default volume 0.07 (0.12 was too loud). Tracks come from `music/` — pick the one whose filename mood matches the brief (`music_mood`), e.g. `music/light-friendly-01.mp3`.
- **Stage 10 QC — optional (`PIPELINE_DIRECTIVES.md` §0).** `config.qc.enabled: false` (default): `qc-gate-gemini` is a no-op — stamp `qc_grade="DISABLED"`, `phase --status skipped --resume-next 11`, go to Phase 11; no Gemini grade, no threshold, no fix+retry loop; the QCR-180 audio↔subtitle gate (Phase 8 + Phase 10) also stays off. `true`: run the graded loop from `qc-pipeline/QC_INSTRUCTIONS.md` with `config.qc.threshold` / `config.qc.max_iterations`; still below threshold after the last iteration → HOLD (report it, never enqueue).
- **Stage 3 (HeyGen) — BROWSER + PLAYWRIGHT ONLY:** the only way to create the avatar is the AI Studio editor (`/create-v4`) driven by Playwright MCP — it uses the subscription credits (no extra cost). **ONE avatar per repo: `config.avatar.*`** — look `config.avatar.look` (fallback `config.avatar.fallback_look`), voice `config.avatar.voice` — never switch avatars mid-run. There is no other generation path — never attempt one; if a render is slow, wait it out or escalate. **PER-RUN AVATAR ISOLATION (QCR-180):** `rm -f` the shared `<downloads>/Quick-Avatar-Video-1080p.mp4` before download, then after the ffprobe gate `cp` it to the per-run `<downloads>/<Name>_avatar_1080p.mp4`; Stages 3 (SRT) and 5 (motion) read that per-run file, NEVER the shared path (the shared path is overwritten by concurrent/later runs → the subtitles-from-another-run's-audio defect). See the `generate-avatar-heygen` skill / `heygen-pipeline/HEYGEN_INSTRUCTIONS.md`.
- **Transcription** (Stages 4/8): `python3 subtitle-pipeline/transcribe_gemini_srt.py <video> --output-dir <scratch> --name <VideoName>` — **Gemini** timestamped SRT (key auto-read from `.claude/keys.md` `## Gemini` / env `GEMINI_API_KEY`). The local `whisper` CLI remains FORBIDDEN. If Gemini transcription fails (429 = quota — wait or raise it), escalate — never fall back to local whisper without explicit user approval.

## Output location
Intermediate renders and every final deliverable (final video, QC report when QC is enabled) go to `<downloads>` (`paths.downloads`, default `~/Downloads`). The pipeline never deletes them.

## Language
All script/subtitle/caption content: **PT-BR obrigatório** (`config.brand.language`, default `pt-BR`).
