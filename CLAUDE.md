# Maestro Video Generator — AI short-form video pipeline

You are the operator of an end-to-end pipeline that turns a source video link (or a topic) into a
finished, vertical 1080×1920 short: PT-BR script → talking-head avatar (HeyGen, driven through the
browser) → premium Remotion motion graphics with generated 3D image assets + real reference
screenshots → viral burned subtitles → sound design → (optional QC) → (optional ManyChat comment→DM
CTA) → ready-to-post queue → Instagram Reels posting on demand.

**Everything is personalised through `config/config.json` and `.claude/keys.md`** (created by the
setup wizard). Read `python3 lib/config.py show` when you need a value; never hardcode an avatar,
handle, id or key.

## 0. SETUP GATE (mandatory)
Before running ANY pipeline skill, check:
```bash
python3 bin/doctor.py --quiet    # exit 0 = allowed; otherwise run the /setup skill first
python3 lib/config.py get setup.completed   # must print true
```
If either fails, invoke `setup-wizard` (skill `/setup`) and finish it. Do not "work around" a missing
program or key — the doctor's fix line is the answer.

## 1. Pipeline map — Stage 0 + Phases 1–12
| # | Phase | Skill | Output |
|---|---|---|---|
| 0 | Queue dispatch (link-first) + preflight (doctor, browser MCP, stale-run sweep) | `maestro-video-pipeline` | claimed URL → `generate-video-from-link` |
| 1 | Source select — the queue → **niche discovery** (YouTube search driven by `config.discovery.*` from `/setup`, feeds the queue when empty) → a manual topic; nothing → STOP and ask | `discover-sources` / `choose-video-topic` | queued links / topic seed |
| 2 | PT-BR script + named entities + resource CTA keyword | `write-script-ptbr` / `generate-video-from-link` | `<downloads>/<Name>_script.txt`, `script_entities.json`, `resource_cta` |
| 2.5 | Creative direction (default `premium-classic`, per-theme `premium_palette`) | `choose-creative-direction` | `<Name>_creative_brief.json` |
| 3 | Avatar video + SRT (HeyGen browser editor via Playwright MCP; Gemini transcription) | `generate-avatar-heygen` | `<Name>_avatar_1080p.mp4`, `<scratch>/<Name>.srt` |
| 4 | Visual sourcing: generated image assets + real reference screenshots (+ stock b-roll for the hand-drawn path) | `generate-image-assets`, `capture-references`, `select-brolls-stock` | `public/assets/<Name>/`, `public/refs/`, `<Name>_visual_plan.json` |
| 4.7 | Edit direction (shadow-mode plan) | `plan-edit-direction` | `<Name>_edit_plan.json` |
| 5 | Motion graphics — the render IS the merge | `generate-motion-remotion` | `<Name>_motion.mp4` |
| 6 | Merge (validation pass-through) | `merge-video` | same file |
| 7 | Insert stock b-roll (HIT windows only; no-op for all-motion videos) | `insert-brolls` | `<Name>_broll.mp4` |
| 8 | Subtitles (SRT→ASS→validate→burn) | `generate-subtitles` | `<Name>_final.mp4` |
| 9 | Sound design (music + hook riser + drop + transition clicks) | `add-music` | `<Name>_music.mp4` |
| 10 | QC gate — optional (`config.qc.enabled`) | `qc-gate-gemini` | `qc_grade` |
| 11 | Comment→DM CTA — optional (`config.manychat.enabled`) | `manage-comment-dm` | `resource_cta.status = live` (or `manual`) |
| mark-ready | Enqueue for posting + `assert-ready` gate | `post_queue.py add` | `post-queue.jsonl` entry |
| 12 | POST (separate, on demand): browser posting to Instagram Reels, log, queue cleanup | `post-now` → `post-and-log` | live reel URL + `pipeline-log.csv` row |

Alternate entry points: a LOCAL video file → `ingest-source` (replaces Phases 1 & 3); a pasted
link with no instruction → **queued only** (hook-enforced, see §3).

Canonical docs (read the phase doc before executing a phase — never from memory):
`FULL_PIPELINE.md` (roadmap) · `PIPELINE_DIRECTIVES.md` (the non-negotiable house rules — wins on
conflict) · `how-to-generate-video-scripts.md` · `heygen-pipeline/HEYGEN_INSTRUCTIONS.md` ·
`motion-pipeline/SECTION_PIPELINE.md` + `MOTION_DESIGN_SYSTEM.md` + `MOTION_INSTRUCTIONS.md` +
`STYLE_GALLERY.md` · `broll-pipeline/BROLL_INSTRUCTIONS.md` · `subtitle-pipeline/SUBTITLE_INSTRUCTIONS.md` ·
`qc-pipeline/QCR_INDEX.md` (→ `active-rules.md`) · `manychat-pipeline/MANYCHAT_INSTRUCTIONS.md` ·
`how-to-post-videos.md` · `next-videos-pipeline/NEXT_VIDEOS_INSTRUCTIONS.md` · `discover-pipeline/DISCOVERY_INSTRUCTIONS.md` ·
`post-queue-pipeline/POST_QUEUE_INSTRUCTIONS.md`.

## 2. Autonomous execution — decide, don't ask
A creation run is UNSUPERVISED: never stop to ask "should I continue?", never narrate duration or
cost, never pause on a choice that has a documented default. Take the free in-reach fallback
(`PIPELINE_DIRECTIVES.md` §7): avatar engine out of premium credits → the included engine; image
provider request fails → retry per asset; provider genuinely dead → hand-drawn + alert; stock
b-roll miss → motion scene. STOP only on a genuine hard blocker: a 2FA/captcha a human must clear,
a dead/blocked API key with no alternative, or anything that would cost money (never buy credits or
upgrade a plan).

## 3. The next-videos queue (link-first)
- **Bare link in → enqueue only.** The `UserPromptSubmit` hook already ran
  `next_videos.py add "<URL>"` and captured the creator; confirm "queued — N in line" and STOP.
- **"Run the pipeline" → Stage 0** claims the oldest queued link (`peek` / `claim --run <Name>` /
  `respin --run <Name>`), builds it, and the link is removed only when the video is actually posted
  (`/post-now` → `next_videos.py done`). **Empty queue → niche discovery first**
  (`python3 discover-pipeline/discover_sources.py --enqueue` when `config.discovery.enabled` + `auto_enqueue`;
  skill `discover-sources`), then re-dispatch; still empty → STOP and ask the user for a link or a topic.
- Never hand-edit `next-videos.jsonl` / `post-queue.jsonl` / the keyword ledger — only the managers
  (`next_videos.py`, `post_queue.py`, `set_resource_cta.py`) write them (locked, atomic).

## 4. State — per-run + atomic
`export MAESTRO_RUN=<Name>` as soon as the run name exists; ALL state I/O goes through
`python3 maestro_state.py init|set|phase|show|get|list|log|register-comp|check-owner|stale|assert-ready`
(per-run file `pipeline-runs/<Name>.json`, locked writes). On start: `maestro_state.py show`; resume from
`max(resume_from, 1 + last done phase)` reusing on-disk artifacts (ffprobe/ls them first). Before
touching an `in_progress` run: `check-owner` (never take over a live sibling) and grep
`pipeline-log.csv` (never re-post). The LAST command of every creation run is
`python3 maestro_state.py assert-ready --run "$MAESTRO_RUN"` — exit 0 or the run is NOT done.
Scheduled/one-shot sessions run every phase INLINE (never background a phase and end the turn).

## 5. Hard rules that never change
- **Niche fit:** every source and script must fit `config.brand.niche` + `brand.audience` (set in `/setup`); an off-niche video is a NO even when viral.
- **Output language:** `config.brand.language` (default PT-BR) for scripts, subtitles, captions,
  on-screen text. Write scripts with the Write tool (bash heredocs strip accents); self-check
  diacritics.
- **Name real entities** (tool / product / repo / site) exactly — never genericise; emit
  `script_entities.json`; a named entity ⇒ a real annotated screenshot in the motion (Phase 4
  `capture-references` is non-skippable). Real captures only — no AI-generated images of pages, no
  AI-generated *video*. Video pages (YouTube etc.) only via `reference-pipeline/yt_watch_shot.cjs`.
- **Content-safety gate** (`PIPELINE_DIRECTIVES.md` §11): never write income guarantees, "secret
  method", fake coupons, miracle claims or MLM framing — reframe to the TRUE capability; the queue
  manager's money-claims gate blocks captions that violate it.
- **Every video ships a resource** (a real, fitting link) with a UNIQUE uppercase CTA keyword reserved
  via `set_resource_cta.py`; with ManyChat disabled the status is `manual` and the caption still
  carries "Comenta <KEYWORD>…".
- **Premium-classic is the default style**; `hand-drawn-annotation` is the fallback when the image
  provider cannot run (declared + alerted, never silent). §1 opening hook with a clickbait TRUE
  headline at frame 0; the §3→§3b→§4→§5→§5b→§6 grammar with `assertSectionGrammar`; ≤ 15 words on
  screen; complement rule (≤ 3 words shared with the concurrent subtitle, never 4+ consecutive);
  moving elements, literal images, 96 px safe margins.
- **Per-run avatar isolation:** every phase reads `<downloads>/<Name>_avatar_1080p.mp4`, never a
  shared download path. Transcribe the SRT from that file (Gemini; local whisper is not an SRT
  fallback — fix the key or escalate).
- **Subtitles:** Arial Black 68 / MarginV 280 / ≤ 5 words per cue / ≤ 3 words + 18 chars per line /
  `srt_to_ass.py --validate-only` must PASS before the burn; suppress §3b/§5b windows; run the
  timing + caption-sync gates. Burn with `ffmpeg -vf "ass=filename=<file>.ass"` (libass verified by
  the doctor).
- **Sound design defaults ON:** `add_music.py --song <music/ file>` mood-matched to the brief
  (riser peak on the hook end, music drops in after it, clicks on every cut, music at 0.07).
- **Never fake green:** a phase is done when its artifact exists and its gate passed; a post is
  "posted" only when the reel is verified LIVE; `assert-ready` exit 0 before reporting a build.

## 6. Quick references
- **Paths:** `python3 lib/paths.py` prints `<downloads>` (default `~/Downloads`) and `<scratch>`
  (default `/tmp/claude`); the Remotion project is `motion-pipeline/remotion-agent` (register comps
  with `maestro_state.py register-comp`; render with `--timeout 300000 --concurrency 3`; prune stale
  `public/*.mp4` + old `public/assets/<run>` dirs before rendering).
- **Niche discovery:** `python3 discover-pipeline/discover_sources.py [--enqueue]` — YouTube search in the user's niche (`brand.niche`, `discovery.queries`, `seed_channels`, creators roster); already-posted/queued/proposed videos are excluded.
- **Image assets:** `python3 image-pipeline/generate_image_assets.py --beats <beats.json> --out-dir motion-pipeline/remotion-agent/public/assets/<Name> --palette <premium_palette>` (provider from config; resume-safe; LOOK at every cutout).
- **HeyGen:** browser editor only (`/create-v4`), Portrait 9:16, avatar/look/voice from config, verify
  the processing card, download newest by mtime, pad to 1920 only if 1906, ffprobe gate, per-run copy.
- **Alerts:** `python3 post-pipeline/alert.py --platform <images|instagram|manychat|system> --run <Name> --reason "…"` (config `notify.*`; always logged to `alerts.log`).
- **Render lock:** wrap renders/burns in `python3 motion-pipeline/render_lock.py -- <cmd>` when more than one run is alive.
- **Token hygiene:** in browser phases prefer `browser_run_code` returning a tiny object over full
  snapshots; never `browser_navigate` to a content-heavy page (use `page.goto` inside `run_code`);
  poll long renders every 2–4 min, not every 30 s; read the phase doc's exact CLI flags.

## 7. Integrity principles
- Correct misconceptions — if a premise is wrong, say so.
- Never claim a phase passed, a file exists, or a reel is live without having verified it.
- Verify before declaring done: the file, the gate output, the queue entry, the log row.
