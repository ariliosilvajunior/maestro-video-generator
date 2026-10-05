---
name: generate-video-from-link
description: Generate a full Maestro Video Generator video from a specific YouTube or Instagram link used as inspiration. Downloads the source, transcribes it (any language, auto-detected), rewrites the script into a MORE clickbait PT-BR version that keeps the SAME hook idea and structure, then hands off to the orchestrator for the rest of the 12-phase pipeline. Triggers — "generate a video from this link", "gera um vídeo desse link", "make a video based on this reel/short", "use this video as inspiration", "produz um vídeo a partir de [URL]", any time the user hands a YouTube/Instagram URL and asks for a video.
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: generate-video-from-link

Replaces **Phase 1 (Source select)** and **Phase 2 (Write Script)** of the Maestro Video Generator
pipeline with a **link-driven** front end, then hands off **unchanged to the
current orchestrator** for everything from Phase 2.5 onward (Creative Direction →
HeyGen → Visual Sourcing → Motion → Merge → B-Rolls → Insert → Subtitles → Music →
QC (optional) → CTA → mark-ready; posting later via `/post-now`).

> **CRITICAL — this is a FRONT END ONLY, not its own pipeline.** After Step 3 you
> hand off to **`maestro-video-pipeline`** and obey **`PIPELINE_DIRECTIVES.md`** as the
> single source of truth. Do NOT run a hand-picked subset of phases from this file —
> doing so skips the creative-director layer (Phase 2.5), real reference screenshots
> + keyed image assets (Stage 4), and the PREMIUM-CLASSIC default, producing an
> outdated, simpler video. This skill's job ends when the PT-BR script is written.

Use this **every time the user gives a specific YouTube or Instagram URL** and
asks to produce a video from it. The source video is INSPIRATION — you reproduce
its hook idea and structure, not its exact words, and rewrite into a punchier,
more-clickbait **Brazilian-Portuguese** script.
Paths: `<scratch>` = `paths.tmp` (default `/tmp/claude`), `<downloads>` = `paths.downloads` (default `~/Downloads`) — `python3 lib/paths.py` prints both.

## When to use vs. the queue vs. a manual topic
**The next-videos queue sits in front of this skill.** Distinguish:
- **Bare link, nothing else** (the user pastes a URL with no other instruction) → DO **NOT** run this
  skill. **Enqueue it and stop:** `python3 next-videos-pipeline/next_videos.py add "<URL>"`, confirm
  "queued — N in line", end the turn. The link runs on the NEXT pipeline execution. (Spec:
  `next-videos-pipeline/NEXT_VIDEOS_INSTRUCTIONS.md`.)
- **Pipeline execution that DISPATCHES a queued link** (Stage 0 of `maestro-video-pipeline` claimed the
  next URL) → THIS skill runs on the claimed `source_url`. The claim already stamped `queue_url` in the
  run state — Phase 12 (`/post-now`) removes it from the queue on completion.
- **Link + an explicit "run/execute/gera agora" instruction** → may jump the queue:
  `next_videos.py add "<URL>" --front`, then dispatch (Stage 0) so it runs immediately. Still flows
  through the same claim → run → `done`-on-completion path.
- User says "get a script / pick a script" (no link) **and the queue is empty** → run niche discovery (`discover-sources`) to fill the queue from the user's niche; nothing found → ask the user for a link or a topic.
  `choose-video-topic` asks the user for a link or a topic (a topic/transcript starts at Phase 2). If the
  queue is non-empty, the queued link wins.

## INPUTS
- One or more YouTube (incl. `/shorts/`) or Instagram (`/reel/`, `/p/`) URLs.

## OUTPUTS (Phase 1–2 portion; later phases append their own)
- `<scratch>/<Name>_source.mp4` — downloaded source video.
- `<scratch>/<Name>_src.txt` + `_src.json` — verbatim source transcript + detected language.
- `<downloads>/<Name>_script.txt` AND `<scratch>/heygen_script.txt` — the rewritten clickbait PT-BR script that Phase 3 (HeyGen) reads.

## TOOLING
- **Download:** `yt-dlp` (`python3 bin/doctor.py` checks it). Works for YouTube AND Instagram with NO cookies / no special keys.
- **Transcription:** **Gemini** everywhere. For the SOURCE, use `link-pipeline/transcribe_gemini.py` (`gemini-2.5-flash`, auto-detects language — validated on Hindi + PT-BR sources). For the OUR-audio SRT (Phase 3), use `subtitle-pipeline/transcribe_gemini_srt.py`. One Gemini key: `.claude/keys.md` `## Gemini` (env `GEMINI_API_KEY`). **Visuals follow the orchestrator default (PREMIUM-CLASSIC: keyed images from the image provider + real reference screenshots; hand-drawn/stock = fallback) — NO AI-generated video.**

## WORKFLOW

### Step 1 — Download the source
```bash
python3 link-pipeline/download_source.py "<URL>" --output-dir <scratch> --name <Name>
```
`<Name>` = a short PascalCase tag for this run (e.g. `RoboChines`, `EditarVideoIA`).

> **CONCURRENCY — set `MAESTRO_RUN` NOW (QCR-173).** As soon as `<Name>` exists, `export MAESTRO_RUN=<Name>`
> in EVERY bash call for this run and do ALL pipeline-state I/O through `maestro_state.py` (atomic, per-run →
> writes `pipeline-runs/<Name>.json`, never the shared `pipeline-state.json`). Initialise it:
> `MAESTRO_RUN=<Name> python3 maestro_state.py init --note "link run from <URL>" --field source_url=<URL>`.
> This is what lets two link runs execute in parallel without clobbering each other's `resource_cta` /
> phases / keyword reservation. Full rules: `PIPELINE_DIRECTIVES.md` §6.
>
> **If this run came from the QUEUE (Stage 0 dispatch), also stamp `queue_url`:**
> `... --field source_url=<URL> --field queue_url=<URL>`. That is what lets Phase 12 (`post-and-log`)
> remove this exact link from `next-videos.jsonl` (`next_videos.py done --run <Name>`) once it's fully
> posted + logged + CTA live/manual. (A non-queue link run omits `queue_url` — nothing to remove.)

### Step 2 — Transcribe the source (any language)
```bash
python3 link-pipeline/transcribe_gemini.py <scratch>/<Name>_source.mp4 \
    --output-dir <scratch> --name <Name>_src
```
Reads `<scratch>/<Name>_src.json` → `{language, transcript}`. The agent READS the
transcript to understand the hook, structure, and core message. Source language
does not matter — output is always PT-BR.

### Step 3 — Rewrite into a MORE clickbait PT-BR script (agent-authored)

> **FIRST, check RESPIN mode.** If this run was dispatched from the queue, read whether the
> link is an already-posted re-spin:
> `python3 next-videos-pipeline/next_videos.py respin --run "$MAESTRO_RUN"` (prints `true`/`false`;
> or read `respin` from `maestro_state.py show`). A link is flagged `respin=true` automatically when
> its URL is already in `pipeline-log.csv` (already-posted links are NOT refused; they are queued to
> be re-spun).
>
> - **`respin=false` (default, fresh link)** → follow the rules below verbatim: KEEP the source's
>   hook idea + beat structure, just punch it up.
> - **`respin=true` (already-posted re-spin)** → **DO NOT keep the same hook or structure.** Be very
>   creative: invent a **completely NEW hook concept**, a **different storytelling angle**, and a
>   **different beat order/framing** so the result reads as a TOTALLY NEW video, not a repost of the
>   one already on the channel. Same underlying topic/tool/resource and the same gettable artifact
>   (the resource CTA), but a fresh creative wrapper — a new cold-open, a new emotional angle
>   (e.g. flip from "olha que incrível" to "quase ninguém percebeu que…" / from a how-to to a
>   warning/story/myth-bust), new numbers/stakes framing, a new §1 clickbait headline. Treat the
>   source video as loose inspiration for the TOPIC only, not a template for the hook. The rest of
>   the rules below (PT-BR, length, CTA, entity preservation, GET-test resource) still apply.

This is the creative core. **In the default (`respin=false`) case**, keep the source's
**hook idea** and **beat structure**, but punch it up for virality. **In RESPIN mode, override
the "same hook / same structure" rules with a brand-new spin per the box above.** Follow the rules
in `write-script-ptbr` / `how-to-generate-video-scripts.md`:
- **Same hook concept** as the source (e.g. "you won't believe this was made by AI",
  "Elon Musk just got humiliated by China") — sharpened, more curiosity-gap.
- **Same structure / beat order** as the source (hook → reveal → how/why → payoff → CTA).
- "Change some words" = keep the skeleton, swap in stronger verbs, bigger stakes,
  tighter numbers, a harder open and a save/share close.
- **CONTENT-SAFETY / PLATFORM-POLICY GATE (canonical `PIPELINE_DIRECTIVES.md` §11).**
  **MORE clickbait ≠ scammier — only truthfully punchier.** Many source reels are AI/money creators;
  the rewrite MUST NOT inherit or amplify an "easy money" / get-rich-quick / guaranteed-income angle. NEVER
  write earnings/income guarantees ("ganhe R$X", "renda garantida", "fique rico", "dinheiro fácil", "sem
  trabalhar"), no-risk-profit claims, "método secreto/infalível", fake/secret coupons (QCR-165/177), miracle
  health claims, impersonation, or MLM framing — even if the SOURCE used them. **Reframe** to the real tool +
  TRUE capability ("faça R$10 mil/mês com IA" → "essa IA cria um app funcional em 10 minutos"); make §1 the
  boldest TRUE angle (death/end · shock · curiosity gap · FOMO · big number), never a financial promise. If
  the source's whole premise is a scam with no honest resource under it, **skip it** (Stage 0: take the next
  queue link; `next_videos.py release --run "$MAESTRO_RUN"` then re-dispatch) and log `maestro_state.py set --field safety_note="…"`.
- Output language: **PT-BR obrigatório** (`config.brand.language`, default `pt-BR`). Proper accents (the agent
  self-verifies diacritics before Phase 3 — there is no automated gate). Numbers written out, no
  English jargon, no URLs, no emojis, no stage directions (TTS-safe).
- End with a **save/share** CTA ("salva esse vídeo…", "comenta…"). NEVER "se inscreva"
  or "link na bio". You MAY keep a source engagement hook (e.g. "comment your favorite
  emoji") if the source used one.
- **Hard limit 2520 chars**; aim ~900–1700 chars (~1 min). Match the source's length band.
- **Write with the Write tool, NEVER bash heredoc/echo** (bash strips UTF-8 accents).

Save to `<downloads>/<Name>_script.txt`, then publish the canonical copy:
```bash
mkdir -p <scratch> && cp <downloads>/<Name>_script.txt <scratch>/heygen_script.txt
wc -m <scratch>/heygen_script.txt   # must be <= 2520
```

### Step 4 — Hand off to the current orchestrator (Phase 2.5 → 12)
**Do NOT enumerate or hand-pick phases here.** Hand the run to **`maestro-video-pipeline`**,
which reads **`PIPELINE_DIRECTIVES.md`** (single source of truth) + `FULL_PIPELINE.md` +
`qc-pipeline/active-rules.md` and runs the full, up-to-date stage chain. Read each
stage's `SKILL.md` before running it (never from memory). The orchestrator owns the
current architecture — this front end must not freeze an older phase list:

- **Phase 2.5 `choose-creative-direction`** — emits `<Name>_creative_brief.json`. The
  ENFORCED default style is **PREMIUM-CLASSIC** (`PIPELINE_DIRECTIVES.md` §1); hand-drawn
  is the automatic fallback. The link front end does NOT skip this stage.
- **FULL SECTION GRAMMAR applies to LINK runs (it is the SAME Phase-5 motion build).** Copy
  `src/compositions/PremiumSectionRef.tsx`: §1 hook → §3 avatar → §3b caption → §4 motion+text →
  §5 split → §5b avatar+caption → §6 full (repeat §3→§6), `assertSectionGrammar` guard. In
  particular: **§3b uses `reveal` (the spoken line WORD-BY-WORD, active word gold)** — not the
  2-word `groups` distillation; **§5b = `PremiumAvatarCaption`** (avatar + floating word-by-word
  caption in the empty zone, auto-fit + platform safe margins); §3b/§5b windows are suppressed in
  Phase 8. Owned by `SECTION_PIPELINE.md` + `generate-motion-remotion` SKILL (the link run obeys them verbatim).
- **§1 OPENING HOOK (variant V3 is the default) — applies to LINK runs too.**
  The motion phase builds §1 as the MERGED **moving screenshot (top split) + `PillHeadline`
  banner at the center/split line** (black pill, ALL-CAPS, white text + one yellow accent on
  the key number/brand). There is no standalone headline section before it. This is owned by
  `PIPELINE_DIRECTIVES.md` §2b + `generate-motion-remotion` SKILL §1 (both entry points converge on the
  motion phase) — drop `<PremiumOpeningHook>` as §1; ref comp `src/compositions/OpeningHookRef.tsx`.
  **HEADLINE = MAXIMUM CLICKBAIT:** since link runs already rewrite the script MORE clickbait, make the §1
  pill headline the boldest TRUE angle too — death/end · shock · curiosity gap · FOMO · big number ·
  authority shock; avoid tame verbs. E.g. `ESQUECE O PROMPT` → `O PROMPT MORREU`. Clickbait the framing,
  never fabricate. Formulas: `PIPELINE_DIRECTIVES.md` §2b SECTION 1.
- **Phase 2 entity preservation (already in scope here):** when the source names a real
  tool/product/company/repo/site, your rewritten script MUST keep that name (no
  genericization) and the run emits `<scratch>/script_entities.json` so Stage 2.5 sets
  `reference_capture=true` (`PIPELINE_DIRECTIVES.md` §2).
- **Phase 2 comment-CTA — EVERY VIDEO SHIPS A RESOURCE LINK (applies to LINK runs too):**
  apply the **GET-TEST** (`write-script-ptbr` rule 11): if the video already hands the viewer a gettable
  artifact (repo / tool / agent / skill / template / app / product page) → use it. **If NOT** (a platform
  feature, a company merely discussed, opinion/news), DO NOT disable — run **MANDATORY web research** driven
  by what the video describes until you find a REAL resource that fits the script PERFECTLY, then enable with
  that. `resource_cta.enabled` is effectively ALWAYS true (`disable` is last-resort only). Write it with the
  helper, never by hand:
  `python3 manychat-pipeline/set_resource_cta.py enable --name … --kind … --keyword <UNIQUE> [--link …] --video <Name>`,
  and embed *"Comenta '<KEYWORD>' …"* in the rewritten script. This feeds the **Comment→DM phase** below.
- **Stage 4 Visual Sourcing** — `generate-image-assets` (keyed images from the image provider,
  premium default) + `capture-references` (real screenshots of any named entity) +
  `select-brolls-stock` for remaining windows (fallback path). NON-SKIPPABLE when the brief flags refs.
- Stages 5–11 (Motion → Merge → Insert → Subtitles → Music → QC (optional) → **Comment→DM (Phase 11)**)
  run exactly as the orchestrator defines them. **ORDER: `manage-comment-dm` runs at the END of creation, BEFORE
  the video is enqueued** — with `config.manychat.enabled` it arms + verifies the ManyChat automation LIVE (a hard
  ManyChat blocker HOLDS the build); with it off it stamps `resource_cta.status="manual"` (you DM the link by hand).
  Either way the first commenters get the resource.
- Use the same `<Name>` for all render artifacts.
- Reuse the Phase-3 SRT (of OUR HeyGen audio) for subtitles — do NOT re-transcribe the source.
- **BUILD-THEN-ENQUEUE — a link-driven run does NOT post at the end.** It builds the video through Phase 9
  (Sound Design) → Phase 10 (QC when enabled) → Phase 11 (CTA armed or stamped manual) → **mark ready-to-post**:
  `post_queue.py add --run "$MAESTRO_RUN" --video <downloads>/${MAESTRO_RUN}_music.mp4 --source-url "$SRC"
  --queue-url "$SRC" --cta-json '<resource_cta from state>'` → `maestro_state.py assert-ready --run "$MAESTRO_RUN"`
  (must exit 0) → STOP. **Do NOT run `post-and-log` here; do NOT delete the media (the pipeline never does);
  do NOT `next_videos.py done`.** Publishing happens LATER via the **`/post-now`** skill (posts IG Reels ONLY +
  logs + removes the run from both queues). To post this build immediately, run `/post-now` (or
  `/post-now --run "$MAESTRO_RUN"`) right after the build. (Governing: `maestro-video-pipeline` SKILL
  "POSTING IS SEPARATED" block.)
- The run is logged to `pipeline-log.csv` by `/post-now` at posting time (`maestro_state.py log`). In the
  `script_topic`/notes, record the source URL so dedup and provenance are preserved.

## MULTIPLE LINKS
If the user gives several URLs, run Steps 1–3 for each (producing one script per link),
then run the pipeline once per script. Confirm scope with the user before launching
multiple full end-to-end builds (each is long; posting stays a separate `/post-now` step).

## KNOWN BLOCKERS / NOTES
- **No AI-generated VIDEO:** transcription (source + OUR audio) is Gemini. Stage 4 visuals follow the
  orchestrator's current default: PREMIUM-CLASSIC composes keyed **images** from the image provider (real
  keyed stills, animated in code — distinct from AI-generated *video* b-roll, which is banned) + real
  reference screenshots; the hand-drawn / stock-b-roll path is the automatic fallback. Do NOT downgrade
  this front end to "stock-only" — that decision belongs to `PIPELINE_DIRECTIVES.md` §1, not this file.
- **Instagram private/age-gated** content may need cookies — not required for public reels.
- Keys live in `.claude/keys.md` (see `.claude/keys.md.example`). Gemini key auto-resolved by `transcribe_gemini.py` via `lib/api_keys.py`.

## OUTPUT LOCATION
Final deliverables (finished video, QC report when QC is enabled) go to `<downloads>` (`paths.downloads`, default `~/Downloads`).
