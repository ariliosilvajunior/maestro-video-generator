# FULL_PIPELINE.md — Pipeline Roadmap (Stage 0 + Phases 1–12)

> This file is the **roadmap**: canonical phase numbering, the stage→doc map, and cross-phase
> troubleshooting. **The detailed step-by-step procedures live in the per-phase docs/skills listed
> below** — read the phase doc before executing a phase; never execute from memory. Where any doc
> disagrees with `PIPELINE_DIRECTIVES.md`, that file wins (§0 authority matrix).
>
> Canonical homes of the detailed rules:
> - Script rules → **`how-to-generate-video-scripts.md`**
> - Posting implementation + `pipeline-log.csv` columns → **`how-to-post-videos.md`**
> - QC upload/decision loop (only when `config.qc.enabled`) → **`qc-pipeline/QC_INSTRUCTIONS.md`**
> - QCR rules → **`qc-pipeline/QCR_INDEX.md`** (mandatory pre-run read, 1 line/rule) → full entries per phase in `qc-pipeline/active-rules.md`

## Overview

End-to-end automated pipeline: source link (next-videos queue or a manual topic) → PT-BR script → HeyGen avatar
(`config.avatar.*`) → premium Remotion motion graphics → stock b-roll → viral subtitles → sound design →
QC gate (**optional**, `config.qc.enabled`, default off) → **Phase 11 arms the comment→DM CTA** (`manage-comment-dm`
— **optional**, `config.manychat.enabled`; when off the CTA is stamped `"manual"` and you deliver links by hand) →
**mark ready-to-post (enqueue into `post-queue.jsonl`) → STOP.**
Publishing is a SEPARATE step: **`/post-now`** posts live to **Instagram Reels** (browser posting via the
Playwright MCP with the saved session is the default; Metricool is an optional fallback,
`config.posting.metricool.enabled`), plus any OPTIONAL Facebook/TikTok/YouTube Shorts toggle enabled
(`config.posting.metricool.networks.*`, off by default, Metricool-only) + logs. Build ~25–40 min; posting on your own schedule.
All keys live in `.claude/keys.md` (see `.claude/keys.md.example`); `python3 bin/doctor.py` verifies them —
**never hardcode keys in docs**.
**Content sources:** the next-videos queue (links you paste), **niche discovery** (`discover-pipeline/discover_sources.py` —
YouTube search driven by the niche you set in `/setup`, `config.discovery.*`; it feeds the queue automatically when it is empty),
or a manual topic/transcript you give. Nothing found anywhere → the run stops and asks you.

**Paths:** `<downloads>` = `paths.downloads` (default `~/Downloads`) holds the render artifacts; `<scratch>` =
`paths.tmp` / `MAESTRO_TMPDIR` (default `/tmp/claude`) holds transient files. `python3 lib/paths.py` prints both.
The Remotion project lives inside the repo at `motion-pipeline/remotion-agent` (`MAESTRO_REMOTION` overrides).

**Suffix chain:** `<Name>_avatar_1080p.mp4` → `_motion.mp4` → `_broll.mp4` → `_final.mp4` → `_music.mp4`

## Canonical phases (SAME numbering as CLAUDE.md and every skill)

| # | Phase | Skill | Detailed doc | Output |
|---|-------|-------|--------------|--------|
| **0** | **Preflight + queue dispatch** (link-first) | `maestro-video-pipeline` (Stage 0) | `next-videos-pipeline/NEXT_VIDEOS_INSTRUCTIONS.md` | Preflight: `python3 bin/doctor.py --quiet` (exit 0) + browser MCP tools callable + `python3 maestro_state.py stale` sweep. Then `peek`: claimed URL → run via `generate-video-from-link`; **empty queue → STOP and ask the user for a link or a topic** (no scraper; a topic starts at Phase 1 → 2) |
| 1 | Source select — a queued link, **niche discovery** (YouTube search in your niche) or a manual topic/transcript | `discover-sources` / `choose-video-topic` | its `SKILL.md` | the topic seed for Phase 2 (transcript + hook idea + named entities) |
| 2 | Write PT-BR Script (+ resource CTA + entities) | `write-script-ptbr` | **`how-to-generate-video-scripts.md`** (canonical rules) | `<scratch>/heygen_script.txt` + `script_entities.json` + `resource_cta` |
| 2.5 | Creative Direction (default **premium-classic**) | `choose-creative-direction` | `motion-pipeline/STYLE_GALLERY.md` | `<Name>_creative_brief.json` |
| 3 | HeyGen Avatar (+SRT via Gemini) — BROWSER + PLAYWRIGHT ONLY | `generate-avatar-heygen` | `heygen-pipeline/HEYGEN_INSTRUCTIONS.md` | `<Name>_avatar_1080p.mp4` (per-run copy, QCR-180) + `<scratch>/<Name>.srt` |
| 4 | Visual Sourcing: refs + keyed image assets + stock b-roll (NO AI-generated video) | `capture-references` + `generate-image-assets` + `select-brolls-stock` | `broll-pipeline/BROLL_INSTRUCTIONS.md` + the 3 SKILL.md | `public/refs/*` + `public/assets/<Name>/` + `<Name>_broll_manifest.json` + `<Name>_visual_plan.json` |
| 5 | Motion Graphics (render IS the merge) | `generate-motion-remotion` | `motion-pipeline/MOTION_INSTRUCTIONS.md` + `SECTION_PIPELINE.md` (grammar) + `MOTION_DESIGN_SYSTEM.md` | `<Name>_motion.mp4` |
| 6 | Merge (pass-through validation) | `merge-video` | — (checkpoint only) | same `_motion.mp4` |
| 7 | Insert B-Rolls (HITs only) | `insert-brolls` | `broll-pipeline/BROLL_INSTRUCTIONS.md` | `<Name>_broll.mp4` |
| 8 | Subtitles (SRT→ASS→burn; the QCR-180 audio↔subtitle gate calls Gemini and runs only when `config.qc.enabled`) | `generate-subtitles` | `subtitle-pipeline/SUBTITLE_INSTRUCTIONS.md` | `<Name>_final.mp4` |
| 9 | Sound Design (music + hook riser + drop + clicks, all default ON) | `add-music` | the `add-music` SKILL.md; script `add_music.py` | `<Name>_music.mp4` |
| 10 | QC Gate — **optional** (`config.qc.enabled`, default `false`) | `qc-gate-gemini` | `qc-pipeline/QC_INSTRUCTIONS.md` · `PIPELINE_DIRECTIVES.md` §0 | Off: no-op, stamps `qc_grade="DISABLED"`, no Gemini call, advances to 11. On: graded loop with `config.qc.threshold` (default 75) and `config.qc.max_iterations` (default 3). |
| 11 | **Arm Comment→DM CTA** — **optional** (`config.manychat.enabled`, default `false`) | `manage-comment-dm` | `manychat-pipeline/MANYCHAT_INSTRUCTIONS.md` | On: creates the dedicated `[<KEYWORD>]` ManyChat automation, Go Live, verify, stamp `resource_cta.status="live"`; runs HERE, before enqueue; a hard ManyChat blocker → **HOLD THE BUILD** (don't enqueue), escalate. Off: skip the automation, stamp `resource_cta.status="manual"` (the keyword + link still go in the caption; you DM the link by hand or with any other tool). |
| **mark-ready** | **MARK READY-TO-POST — END of the creation pipeline** | `post_queue.py add` | `post-queue-pipeline/POST_QUEUE_INSTRUCTIONS.md` | Enqueue `_music.mp4` into `post-queue.jsonl`, `maestro_state.py phase --num 11 --run-status ready_to_post`, then `maestro_state.py assert-ready` (exit 0), then STOP. **Leaves the file on disk; does NOT post, does NOT delete anything, does NOT `next_videos done`.** |
| **12** | **POSTING — separate `/post-now` skill** | **`post-now`** → invokes `post-and-log` | `.claude/skills/post-now/SKILL.md` | Run `/post-now` to pop the next ready video (CTA `live` or `manual`) → post IG Reels ONLY (browser-first; Metricool optional fallback) → `pipeline-log.csv` row → `next_videos.py done` + `post_queue.py done`. After a verified live post the final stays in `<downloads>`; archive it wherever you like (optional) — the pipeline never deletes your media. |

**Alternate entry points:** a provided LOCAL video file → Phase 0-ingest (`ingest-source` skill) replaces
Phase 3 (the file IS the footage); a provided URL with "gera agora" → `generate-video-from-link` starts at
Phase 2 (Steps 1–3), then Phase 2.5 onward. A **bare link with no instruction only ENQUEUES**
(`next_videos.py add`) — hook-enforced. A manual topic/transcript starts at Phase 1 (`choose-video-topic`
packages it as the topic seed) → Phase 2.

**RENDER-WAIT PARALLELISM:** during the Phase-3 HeyGen render wait (15–30 min, server-side), run the
avatar-independent work — Phase 4a image assets → Phase 4b reference captures → Phase-11 link research
(+ the ManyChat session pre-check when `config.manychat.enabled`) — polling the render cheaply every ~3–4 min.
Details in the `maestro-video-pipeline` skill. Saves 10–20 min/run; the avatar-dependent steps (SRT, windows,
motion) keep their order and gates.

## State (resume) — per-run + atomic

`export MAESTRO_RUN=<Name>` as soon as the name exists; ALL state I/O via `maestro_state.py`
(`init|set|phase|show|get|list|log|register-comp|check-owner|stale|assert-ready`) → `pipeline-runs/<Name>.json`.
Shared files (`pipeline-log.csv`, keyword ledger, Root.tsx) only via the locked writers
(`maestro_state.py log` / `set_resource_cta.py` / `maestro_state.py register-comp`).
On start: `maestro_state.py show`; resume from `max(resume_from, 1 + max(done phase))`, reusing on-disk
artifacts (ffprobe/ls them first). **Before resuming any `in_progress` run:** `maestro_state.py check-owner`
(QCR-222 — never take over a live sibling) + grep `pipeline-log.csv` for the run (QCR-120 dup-post guard).
Full rules: `PIPELINE_DIRECTIVES.md` §6 + the orchestrator skill.

## Triggers

"run the full pipeline" · "create and post a new video" · "execute maestro video generator pipeline" ·
"do everything end to end" · "get a script and make a video" → `maestro-video-pipeline` (Stage 0 first).
Precondition for every run: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

## Credentials

All keys live in `.claude/keys.md` (see `.claude/keys.md.example`); `python3 bin/doctor.py` verifies them.
Sections used: HeyGen (browser login, `## HeyGen`) · Gemini (`## Gemini`, env `GEMINI_API_KEY` — transcription
+ optional QC) · the image provider (`config.images.provider` = fal / google / openai — `## fal` / `## OpenAI` /
the Gemini key) · Pexels / Pixabay / Coverr (stock b-roll) · Metricool (`## Metricool`, optional posting fallback).
Browser sessions (Instagram, ManyChat) live in `.claude/auth/*-storage-state.json`.

## Cross-phase troubleshooting

| Problem | Solution |
|---------|----------|
| Setup incomplete / a phase refuses to start | `config/config.json → setup.completed` must be `true` — run `/setup`; `python3 bin/doctor.py` lists what is missing |
| HeyGen login expired | Re-login with `<HEYGEN_EMAIL>` / `<HEYGEN_PASSWORD>` from `.claude/keys.md` (`## HeyGen`): "Continue with email" → "Use password instead" |
| Avatar IV 0 credits | Click "Switch to Avatar III" (`config.avatar.engine_fallback`, $0 included) and continue — viable-fallback-first, never ask/buy |
| Voice Clone selected | MUST switch to the PRO voice (`config.avatar.voice`) |
| Transcription fails | Check the `## Gemini` key (env `GEMINI_API_KEY`); 429 = quota — wait or raise the quota; rerun `transcribe_gemini_srt.py`. Local `whisper` CLI is FORBIDDEN for the SRT — escalate instead |
| Remotion render fails / font timeout | `--timeout 300000` is MANDATORY (QCR-275); check `@remotion/*` versions match in `package.json` |
| Remotion "composition not found" | Composition must be registered in `src/Root.tsx` (`maestro_state.py register-comp`); the project is `motion-pipeline/remotion-agent` (`python3 lib/paths.py` prints the resolved path) |
| ffmpeg "ass" filter error | Your ffmpeg must include libass — `python3 bin/doctor.py` checks this; point `MAESTRO_FFMPEG` / `paths.ffmpeg` at a libass-enabled build |
| Subtitles overlap face (motion) | MarginV=280 + Font ≤68; max 18 chars/visual line (QCR-008); `srt_to_ass.py --validate-only` must PASS |
| B-roll window with no acceptable stock clip | That window becomes a hand-drawn MOTION scene — NO AI-generated-video fallback |
| B-roll output corrupt H.264 | Kill orphan ffmpeg (`pgrep -fl "ffmpeg.*<Name>_broll"`, `kill -9`), delete output, re-run |
| Image provider request fails mid-batch | Retry per asset / resume the batch (`generate-image-assets`); only a dead key / exhausted quota / outage after retries downgrades to hand-drawn — and then `python3 post-pipeline/alert.py --platform images --run <Name> --reason "..."` + state `images_fallback` / `images_alert_sent` (`PIPELINE_DIRECTIVES.md` §1) |
| litterbox/catbox upload fails (Metricool fallback only) | See hosting rules in `how-to-post-videos.md` (litterbox → uguu fallback; NEVER permanent catbox) |
| Metricool post stuck PENDING | Wait until scheduled time + 2–5 min; a Metricool *schedule* is NOT a live post — verify the reel is live or HOLD |
