# PIPELINE DIRECTIVES — Single Source of Truth (Maestro Video Generator)

> **READ THIS FIRST, EVERY RUN.** These are the NON-NEGOTIABLE house rules of the pipeline.
> Where any `SKILL.md`, `*_INSTRUCTIONS.md`, `CLAUDE.md`, or `STYLE_GALLERY.md` disagrees with
> this file, **THIS FILE WINS** and the conflicting doc must be corrected (fix the source doc).

This file exists because of a real failure (a **style-drift run**): the run used a retired dark
`premium-snap` style instead of the mandated default, set `reference_capture=false`, genericized the
named tool ("Anijam" → "agentes de IA"), captured ZERO real screenshots, and still passed QC 94/100.
Every directive below closes one hole that let that happen. The brief is **advisory to creative
taste; this file is enforced on process.**

**Paths used below:** `<downloads>` = `paths.downloads` (default `~/Downloads`), `<scratch>` = `paths.tmp` /
`MAESTRO_TMPDIR` (default `/tmp/claude`); `python3 lib/paths.py` prints both. The Remotion project is
`motion-pipeline/remotion-agent` inside the repo. Alerts go through `python3 post-pipeline/alert.py
--platform <images|instagram|manychat|system> --run <Name> --reason "..."` (delivered per `config.notify.*`;
always appended to `alerts.log`).

---

## 0. Hierarchy of authority

> ### QC / GEMINI REVIEW IS OPTIONAL — `config.qc.enabled` (default `false`)
> **Phase 10 (`qc-gate-gemini`) and every Gemini-API review/grading gate run ONLY when `config.qc.enabled`
> is `true`.**
> - **`false` (default):** Phase 10 is a no-op pass-through — it stamps `qc_grade="DISABLED"` and advances
>   to Phase 11. Do **NOT** call Gemini `generateContent` to grade a video: there is no grade, no threshold,
>   no fix+retry loop, no iteration cap, and no "grade below threshold" hard-blocker. The deterministic
>   **QCR-180 audio↔subtitle gate ALSO calls Gemini, so it is off too** (Phase 8 Step 0 and Phase 10 Step 0)
>   — you lose that wrong-avatar build-defect net; accepted by design. The pipeline runs **Phase 9 (Sound
>   Design) → Phase 10 (no-op) → Phase 11 → mark-ready**.
> - **`true`:** the graded loop in `qc-pipeline/QC_INSTRUCTIONS.md` runs with `config.qc.threshold`
>   (default 75) and `config.qc.max_iterations` (default 3); a video still below threshold after the last
>   iteration is a hard blocker — report the HOLD, never ship it.
> - Gemini is ALWAYS used for **transcription** (Phase 3 SRT + link-source transcription) — that is content
>   generation, not review, and is independent of this switch. One Gemini key: `.claude/keys.md` `## Gemini`
>   (env `GEMINI_API_KEY`); 429 = quota — wait or raise the quota; never fall back to local whisper for the SRT.
> - Any doc line that says "Gemini QC is FINAL / ≥75 / grade / iterate" applies **only when QC is enabled**.

1. **(When QC is enabled) the Gemini QC grade is FINAL** on visual quality — nothing re-judges it. When QC
   is disabled nothing gates the run on a score.
2. **This `PIPELINE_DIRECTIVES.md` is FINAL on PROCESS / directive compliance** — style default,
   tool-naming, reference screenshots, no AI-generated video. These are not creative judgment calls.
3. `STYLE_GALLERY.md` is the registry of selectable styles; the brief records resolved fields from it.

### 0b. Conflict-resolution matrix (which doc wins on a disagreement)

| Topic | CANONICAL source (wins) | Everything else |
|---|---|---|
| House rules / process compliance | **this file** | must be corrected to match |
| §1→§3→§3b→§4→§5→§5b→§6 section grammar (full spec) | `motion-pipeline/SECTION_PIPELINE.md` | CLAUDE.md / MOTION_DESIGN_SYSTEM carry summaries + pointers |
| Motion design bar (V8 springs, fonts, layout) | `motion-pipeline/MOTION_DESIGN_SYSTEM.md` | wins over `MOTION_INSTRUCTIONS.md` on conflict |
| HeyGen procedure | `heygen-pipeline/HEYGEN_INSTRUCTIONS.md` | CLAUDE.md quick-ref is a summary |
| Subtitle parameters | `subtitle-pipeline/SUBTITLE_INSTRUCTIONS.md` | CLAUDE.md quick-ref is a summary |
| B-roll procedure | `broll-pipeline/BROLL_INSTRUCTIONS.md` | — |
| QC procedure + QCR rules | `qc-pipeline/QC_INSTRUCTIONS.md` + `qc-pipeline/active-rules.md` (index: `qc-pipeline/QCR_INDEX.md`) | — |
| Script rules (Phase 2) | `how-to-generate-video-scripts.md` | — |
| Posting implementation + log columns (Phase 12) | `how-to-post-videos.md` | — |
| ManyChat comment→DM | `manychat-pipeline/MANYCHAT_INSTRUCTIONS.md` | — |
| Queue (Stage 0) | `next-videos-pipeline/NEXT_VIDEOS_INSTRUCTIONS.md` | — |
| Phase numbering | Stage 0 + Phases 1–12 (CLAUDE.md / FULL_PIPELINE.md roadmap / skills — all aligned) | any other numbering is stale |

---

## 1. DEFAULT STYLE — PREMIUM-CLASSIC (ENFORCED)
- **Every video is built in `premium-classic`** (STYLE_GALLERY §3.05): editorial museum look — warm
  marble-paper base, a thin GOLD double-rule frame, Cormorant Garamond serif (small-caps labels +
  large display + italic), a muted antique-gold palette, RESTRAINED motion (slow fade-rise + gentle
  parallax + line draw-ons — NO bounce/sparkle/marker). Toolkit `src/library/premium.tsx` (exported
  from `../library`): `PremiumFrame` (marble top 40% + avatar bottom 60%), `PremiumHeadline` (§1),
  `PremiumEvidence` (§2, real screenshot in a gold-framed card), `PremiumBg`, `PremiumLabel`,
  `PremiumDisplay`, `PremiumAsset`, `PremiumGraph`, `PremiumImageIcon`, `PremiumFlow`.
- **Per-element graphics are keyed IMAGES from the image provider (objects + an image-icon set), NOT
  code-drawn `HD_ICONS`.** Built FRESH PER VIDEO from the topic: run the `generate-image-assets`
  skill (premium prompts → `public/assets/<run>/`; an optional icon set generated once into
  `public/assets/icons/`) for THAT script's concepts, key them (`image-pipeline/chroma_key.py`), and
  compose each beat as a MULTI-ELEMENT scene (2–5 elements: hero + depth element + vector accent + serif
  type). Provider = `config.images.provider` (fal / google / openai). There is NO pre-made premium scene
  library — the shipped demos are EXAMPLES of the technique, not reusables. References:
  `PremiumSectionRef.tsx` (structure), `OpeningHookRef.tsx` (§1), `PremiumOpeningDemo.tsx`
  (frame+headline+evidence), `SplitFlowDemo.tsx` / `FullFlowDemo.tsx` (split / full graphics beats).
- **FALLBACK to `hand-drawn-annotation` — automatic, never blocks the run, but NEVER SILENT (QCR-181):** if
  the image provider is unavailable (key invalid, quota exhausted, outage — *after* the per-asset retries of
  `generate-image-assets`; a single transient error is NOT a fallback trigger, see §7) OR a beat genuinely
  has nothing a premium image depicts, build that part / the whole video in hand-drawn-annotation (toolkit
  `src/library/handdrawn.tsx`, models `HandDrawnTemplate.tsx` + `HandDrawnGrammarRef.tsx`) and continue.
  Hand-drawn remains a fully-supported, QC-passing style — the resilient safety net, not the default.
  **BUT when a `premium-classic` brief downgrades to hand-drawn because the image provider is unavailable,
  you MUST, before continuing:** (1) **fire the alert** so the key/quota gets fixed for the next run —
  `python3 post-pipeline/alert.py --platform images --run <Name> --reason "<why premium couldn't run>"`;
  (2) **stamp the state** — `python3 maestro_state.py set --field images_fallback="<reason>"` AND
  `python3 maestro_state.py set --field images_alert_sent=true`. Why: a real run once posted an old-looking
  hand-drawn video with NO notification precisely because this was "log and continue" only. The pre-post
  gate `motion-pipeline/check_opening_headline.py` BLOCKS a premium→hand-drawn downgrade that did not alert.
  (A dead image-provider credential is the documented "dead/blocked credential" hard-blocker class — alert,
  don't degrade in silence.)
- **§1 OPENING HEADLINE IS MANDATORY IN BOTH STYLES (QCR-181):** whether premium or hand-drawn fallback, §1
  MUST render a clickbait headline at frame 0 — premium `<PremiumOpeningHook headline=…>` (PillHeadline) or
  hand-drawn `<HeadlineHook lead=[…] accent=…>` / `<PillHeadline>`. An `EvidenceReveal`/`PremiumEvidence`
  screenshot card with only a `kicker` is NOT a headline (that is the blank-first-frame defect).
  `assertSectionGrammar` throws if §1 is not tagged `opening:`, and `check_opening_headline.py` blocks a
  build that renders no headline component.
- **Feed-freshness** = vary the FRESHNESS DIALS (`hook_archetype`, `headline_formula`, `pacing`,
  `motion_intensity`, which objects/icons get generated and how scenes are composed) WITHIN premium —
  not by swapping styles. `premium-snap` and the 4 candidate V8 styles stay narrow/unselectable per
  STYLE_GALLERY.

---

## 2. TOOL-NAMING + REAL REFERENCE SCREENSHOTS (MANDATORY)
This is the chain that must NEVER break when the source names a real thing:

**script-names-tool → brief-flags-it → Stage-4-captures-it → motion-embeds-it → QC-checks-it (when QC is enabled).**

1. **NAME real entities (Phase 2, hard gate, no genericization).** If the topic seed (the link transcript /
   manual topic / hook) names ANY real tool / product / app / model / company / GitHub repo / website
   (e.g. "Anijam", "Claude Code", "Cursor", "Banana Skill"), the PT-BR script MUST name it explicitly. You
   MAY NOT generalize it into "agentes de IA" / "a própria IA" / "uma ferramenta". Genericizing a named tool
   is a directive violation. Phase 2 emits `<scratch>/script_entities.json` (+ `<downloads>/<Name>_entities.json`)
   = a JSON array of `{entity, kind, url_hint}` — `[]` ONLY when the topic names nothing real.
2. **`reference_capture` is DERIVED, not judged (Phase 2.5).** If `script_entities.json` is
   non-empty, `reference_capture` MUST be `true` and the brief MUST carry a `references[]` array of
   `{entity, kind, url_hint, what_to_highlight}`. You may set it `false` ONLY when the entities list
   is `[]`.
3. **Capture is NON-SKIPPABLE (Phase 4).** When `references[]` is non-empty, `capture-references`
   MUST run for EACH entry BEFORE motion: research the canonical URL → Playwright screenshot →
   `reference-pipeline/prepare_reference_shot.py` → asset in `public/refs/`. A capture failure
   escalates; it is never silently skipped.
4. **Motion MUST embed it (Phase 5).** At least ONE scene MUST render an annotated `ScreenshotCard`
   of the real captured page (marked up with `CircleAnno`/`HandArrow` on the relevant part). A
   generic abstract stock clip (bokeh / ink swirl / wireframe) in place of a real screenshot for a
   named-tool beat is a directive violation, NOT a creative choice.
5. **QC enforces it (Phase 10, when `config.qc.enabled`).** The Gemini gate receives a NAMED ENTITIES
   ground-truth list; if it is non-empty and no real annotated `ScreenshotCard` appears, checklist #14 = NO
   and a `REFERENCE_MISSING` deduction applies.

---

## 2b. MANDATORY STRUCTURE — 6-SECTION REPEATING GRAMMAR
**Every video OPENS with SECTION 1 (the merged moving-screenshot + pill-headline hook, below), then
runs the repeating body cycle — avatar breather → kinetic caption → motion+text → split-graphics →
avatar+floating-caption (§5b) → full-graphics, plus extra evidence beats when several real things are
named — until the script ends.**
(§1 IS the screenshot+headline opening — there is no separate standalone-headline section; §3–§6 are
the body cycle, which is why the numbering starts the body at §3.)
A SECTION is a CANVAS; what plays on it is a MOTION IDEA (see §2c). Components in
`src/library/premium.tsx` (premium DEFAULT) + `src/library/motionideas.tsx` (the `assertSectionGrammar` guard); spec `motion-pipeline/SECTION_PIPELINE.md`;
**STRUCTURE + LOOK model (premium DEFAULT) = `src/compositions/PremiumSectionRef.tsx`** — it wires the full §1→§3→§3b→§4→§5→§5b→§6 grammar, calls `assertSectionGrammar`, and carries the §1 clickbait headline + §3b word-by-word reveal + §5b avatar-caption + safe margins. (HAND-DRAWN FALLBACK models `HandDrawnGrammarRef.tsx` / `HandDrawnTemplate.tsx` / `SectionCycleDemo.tsx` — used ONLY when premium asset-gen can't run; the hand-drawn path lacks §5b + the §3b reveal.)
The opening (section 1) is NON-NEGOTIABLE; only CONTENT varies per video:
1. **SECTION 1 — OPENING HOOK = MOVING SCREENSHOT + PILL HEADLINE (0–~4.6s) — variant V3 is the default.**
   §1 is a **SPLIT**: the real **MOVING screenshot** (`PremiumEvidence` zoom/scroll — premium; or `EvidenceReveal` hand-drawn) in the
   TOP panel + avatar below, with a **`PillHeadline` banner inserted at the CENTER / split line** — a **black rounded pill, heavy ALL-CAPS
   sans (Montserrat/`SERIF`), WHITE text with ONE YELLOW (`#F2E63B`) accent word** on the key number/brand. **The headline lives INSIDE
   the first moving-screenshot beat — there is no `HeadlineHook`/`PremiumHeadline`-only section before it.** Premium: drop
   **`<PremiumOpeningHook w avatarSrc evidence headline>`** (library, `src/library/premium.tsx`) — it renders the split evidence + the
   pill overlay on the same window.
   **HEADLINE = MAXIMUM CLICKBAIT (tame headlines are the common failure).** ≤8 words, ALL-CAPS, TRUE to
   content but written for the STRONGEST scroll-stop. Pick the most provocative honest angle and push it hard. Use one of these
   formulas: **(a) Death/end** — "O PROMPT MORREU", "O FIM DO [X]"; **(b) Shock claim** — "A IA AGORA TRABALHA SOZINHA",
   "NINGUÉM MAIS PRECISA DIGITAR"; **(c) Curiosity gap / secret** — "O TRUQUE QUE NINGUÉM TE CONTA", "O QUE A [MARCA] ESCONDE";
   **(d) Loss/FOMO** — "VOCÊ TÁ FAZENDO ERRADO", "TÁ PERDENDO DINHEIRO COM ISSO"; **(e) Big number / extreme** — "10X MAIS RÁPIDO",
   "EM 30 SEGUNDOS"; **(f) Authority shock** — "O CRIADOR DO [X] MATOU O [Y]". The YELLOW accent word carries the punch (the
   number / brand / shock word). **AVOID tame verbs** ("esquece o…", "conheça…", "veja…") — lead with the boldest TRUE claim.
   Example upgrade: tame `ESQUECE O PROMPT` → clickbait `O PROMPT MORREU` / `O CRIADOR DO CLAUDE CODE MATOU O PROMPT`.
   Never fabricate a claim the video doesn't support — clickbait the framing, not the facts.
   This is where the reference-screenshot chain (§2) is realised AT THE OPENING; a named-tool video whose §1 lacks a real moving screenshot
   is a directive violation. Reference comp: `src/compositions/OpeningHookRef.tsx` (variant V3 = the default). Additional evidence beats
   (when several real things are named) follow later in the body as normal evidence sections.
3. **SECTION 3 — `FullFrameAvatar` (~7.0–11.0s):** the breather — the avatar fills the WHOLE frame,
   normal Phase-8 subtitles, NO motion, NO b-roll. Built as an OVERLAY (root `<AbsoluteFill>`, sibling
   `<Sequence>` after `<HandDrawnFrame>`, `trimBeforeFrames` = the Sequence `from`); leave the paper
   area empty and schedule no b-roll in this window.
4. **SECTION 4 — full-frame MOTION + TEXT, no avatar:** a motion idea with `full` + short kicker/headline.
5. **SECTION 5 — SPLIT (avatar below, motion above), GRAPHICS ONLY, no text:** a motion idea as a `HandDrawnFrame` child (top-40% panel).
5b. **SECTION 5b — AVATAR + FLOATING CAPTION — sits BETWEEN §5 and §6:** the avatar in its ORIGINAL full frame
   (not the split paper) with BIG Proxima word-by-word subtitles popping in the EMPTY part of the frame the avatar does NOT cover. Premium: drop
   **`<PremiumAvatarCaption w avatarSrc text zone>`** (`src/library/premium.tsx`) — LOOK at the avatar frame and pass `zone` ("top"|"bottom"|"left"|"right";
   for a centered talking-head = "top", above the head). The component AUTO-FITS the font so a long line never spills onto the avatar, and honors the
   PLATFORM SAFE MARGINS (universal 900×1400 safe zone → top 264px / bottom 360px / sides 96px) so the platform status bar / tabs / Shorts header /
   profile chrome never trim it. Tag the beat `avatarcap:<concept>`. Like §3b, its floating caption IS the subtitle, so **SUPPRESS its burned subtitle
   window in Phase 8** — add its `[start,end]` (seconds) to `<Name>_caption_windows.json` alongside the §3b kinetic-caption windows. Keep the line short.
6. **SECTION 6 — full-frame MOTION, GRAPHICS/ICONS ONLY, no text, no avatar:** a motion idea with `full`, no title.
Sections 5 & 6 bake ZERO words (only the Phase-8 subtitle shows). Enforced in `generate-motion-remotion` (MANDATORY STRUCTURE block) + the
`assertSectionGrammar([...])` render guard (QCR-147 — throws if §5/§6 are skipped or the rhythm collapses into a caption↔hero ping-pong) + QC (when enabled).

## 2c. MOTION IDEAS — MATCH the line + VARY the mechanism
Each motion beat (sections 4, 5, 6 + repeats) hosts ONE idea from `MOTION_IDEAS` (`src/library/motionideas.tsx`).
TWO HARD RULES: (1) **MATCH** — pick the idea whose mechanism mirrors the spoken line's meaning
(`IdeaProcessFlow` sequence · `IdeaSpotlight` one-thing · `IdeaRadialSystem` hub · `IdeaStatBurst` number ·
`IdeaGridRepeat` sameness · `IdeaCycleLoop` loop/automation); (2) **VARIETY + GRAMMAR** — NO idea repeats and
the full §3→§3b→§4→§5→§5b→§6 cycle must appear; **`assertSectionGrammar([...ids])`** (supersedes `assertVariety`,
QCR-147) THROWS at render if two adjacent beats share a section TYPE, if a ≥12-beat video skips `split:`/`full:`,
or if it collapses into the caption↔hero ping-pong. Tag ids honestly by type (`caption:`/`heroAsset:`/`split:`/`full:`/`avatarcap:`). Reusing one idea
across sections (a rejected cut did exactly this) is a DIRECTIVE VIOLATION. Verify (at QC when enabled, otherwise by eye): one frame per
motion beat, no two alike, each matches its line.

## 3. THE 100x MOTION BAR (premium explainer, not kinetic text)
A video must read like a Vox / Cleo-Abram / Kurzgesagt explainer, NOT generic kinetic text over an
abstract background. Mandatory, enforced in `generate-motion-remotion` + `MOTION_DESIGN_SYSTEM.md`:
- **Annotate the KEY thing in every scene** — `CircleAnno` / `HandArrow` / `HandUnderline` /
  `MarkerHighlight` on the word/number/object the narration is about. Never a static title alone.
- **Real reference `ScreenshotCard`** of the named tool in ≥1 scene (see §2) — the single biggest
  credibility/quality lever and the thing the style-drift run skipped.
- **`FlowDiagram` + `HD_ICONS`** (line icons, NO emoji) for any step / how-to / sequence content,
  built node-by-node.
- **Real, relevant footage over generic filler** — for a named tool, prefer a real screenshot/site
  clip over abstract bokeh; stock b-roll must be on-topic, never random.
- **`StatCountUp`** for numbers; **Lottie accents** (`public/lottie/`) where they reinforce a beat.
- Snap-settle entrances, ONE bounce accent per scene; ≤15 words on screen; complement rule (≤3 words
  shared with the concurrent subtitle, never 4+ consecutive). 40/60 layout, S0 headline 0–3s.

---

## 4. NO AI-GENERATED VIDEO — footage and screenshots are REAL
Moving visuals are REAL only: hand-drawn / premium Remotion motion + real stock footage (Pexels/Pixabay/Coverr)
+ real captured screenshots. **AI-generated *video* b-roll is banned** — a b-roll window with no stock clip
becomes a motion scene, never a generated clip. Reference screenshots are real captures, never generated.
The ONLY generated visual element is the keyed still IMAGE from the image provider (§1 — objects/icons that are
then animated in code); everything else is real. Transcription is Gemini (`subtitle-pipeline/transcribe_gemini_srt.py`).
Do NOT re-introduce AI video generation.

---

## 4b. SPACED SCHEDULING — 2-HOUR GAP BETWEEN VIDEOS (Metricool fallback only)
This rule applies when Phase 12 posts through the OPTIONAL Metricool fallback (`config.posting.metricool.enabled`;
the default browser post publishes immediately and needs no slot). Phase 12 must NOT schedule at a raw `now+5min`.
Before scheduling, query Metricool for ALL future-scheduled posts on the brand (`config.posting.metricool.blog_id` /
`.user_id`) and place this video **at least `config.posting.metricool.gap_hours` (default 2) hours AFTER the latest
one** (empty queue → `now+5min`). This makes several back-to-back runs (e.g. you saw 3 Instagram references and
fired the pipeline 3×) space out across the day in healthy intervals instead of going live minutes apart. The slot
is computed by `post-pipeline/compute_next_slot.py --auth "$MC_AUTH"` (auth token from `.claude/keys.md`
`## Metricool` via `lib/api_keys.py`; blog/user ids default to the config values; returns `latest_future_post + gap`,
or `now+5min`; gap override `--gap-hours N`; fails safe to `now+5min` on any query error so a hiccup never blocks a
post). Posting platform = Instagram ONLY. **A Metricool *schedule* is NOT a live post — verify the reel is live or
HOLD the run**, and only post IG on a Metricool brand that actually has Instagram connected. **This applies
identically to BOTH entry points** — "run the pipeline from 0" (`maestro-video-pipeline`) and link /
reference-video runs (`generate-video-from-link`); both converge on `post-and-log`, which is where the rule lives.

---

## 5. ENFORCEMENT MAP (where each directive is gated in code/docs)
| Directive | Producer | Enforcer / gate |
|-----------|----------|-----------------|
| Premium-classic default (copy `PremiumSectionRef.tsx`) | `choose-creative-direction` step 3 (emits `premium-classic`) | `generate-motion-remotion` step 0 (reads brief `style_id`; premium-classic default, hand-drawn ONLY on the image-provider-unavailable fallback) + step 5 conformance gate + `assertSectionGrammar` render guard + `check_opening_headline.py` (blocks a silent downgrade) |
| Tool naming | `write-script-ptbr` RULES (hard gate) → `script_entities.json` | Phase 2.5 derives `reference_capture`; QC #14 (when enabled) |
| Reference screenshots | `choose-creative-direction` `references[]` | `maestro-video-pipeline` Stage 4 (`capture-references` non-skippable) + motion step 0/3 + step 5 grep + QC `REFERENCE_MISSING` (when enabled) |
| 100x motion | `MOTION_DESIGN_SYSTEM.md` §0/§3 | `generate-motion-remotion` step 3 + step 5 |
| No AI video | root `CLAUDE.md` | this file §4; b-roll is stock-only |
| 2h-gap spaced scheduling (Metricool fallback) | this file §4b | `post-pipeline/compute_next_slot.py` (queries Metricool) called by `post-and-log` Step 2 + `how-to-post-videos.md` (canonical posting doc); both entry points converge on `post-and-log` |
| CTA armed BEFORE posting AND before enqueue (§8a) | this file §8a | `maestro-video-pipeline` stage table (Phase 11 at the end of creation → mark-ready enqueue → [separately] `/post-now` Phase 12 post) + `manage-comment-dm` (runs before enqueue; HOLDS THE BUILD on hard fail when `config.manychat.enabled`) + `post-and-log` (confirms `resource_cta.status` ∈ {`live`, `manual`} before publishing) + `maestro_state.py assert-ready` |
| Every video ships a resource link (§8b) | `choose-video-topic` (resource-bearing bias) + `write-script-ptbr` (GET-test → mandatory web research) | `manage-comment-dm` Step 1 (mandatory research, near-zero skip) + `MANYCHAT_INSTRUCTIONS.md` enabled-is-always-true |
| Next-videos queue: link-first, empty = niche discovery, then ask (§9) | **`UserPromptSubmit` hook `.claude/hooks/detect-video-link.sh`** (bare link → auto `next_videos.py add` + "do not run"; link+text → soft guidance) + root `CLAUDE.md` intake rule | `maestro-video-pipeline` Stage 0 (peek/claim before Phase 1; empty → ask the user) + `choose-video-topic` (manual-topic intake) + `post-and-log` Step 4 (`done` on completion) + `next-videos-pipeline/NEXT_VIDEOS_INSTRUCTIONS.md` |
| Content-safety gate (§11) | `write-script-ptbr` / `choose-video-topic` / `generate-video-from-link` Step 3 | `post_queue.py add` money-claims gate (refuses scam-shaped caption/title; `--allow-money-claim` is a logged escape hatch) |

If you ever find yourself rationalizing away one of these ("the topic is abstract so I'll skip the
screenshot", "I'll vary the style to avoid repetition"), STOP — that is the exact drift this file
exists to prevent. Vary the dials, name the tool, capture the screenshot, build hand-drawn.

---

## 6. CONCURRENCY — MULTIPLE PIPELINE RUNS AT ONCE (QCR-173)
More than one pipeline can run in parallel (separate agent sessions, or one session finishing an orphan
while another starts). They MUST NOT share a single mutable state file. A real failure: one run's
`resource_cta` got overwritten by a concurrent run and its keyword reservation was rolled back, because
every phase did a NON-atomic read-modify-write on the SINGLE shared `pipeline-state.json` +
`keyword-ledger.json`. Fixed with per-run state + atomic locking. **Every run MUST follow this:**

### 6a. Set `MAESTRO_RUN` ONCE, as soon as the run name exists — then state is isolated
- Link runs (`generate-video-from-link`): right after Step 1 picks `<Name>`, `export MAESTRO_RUN=<Name>`.
- Topic runs (`maestro-video-pipeline` from a manual topic): right after Phase 1/2 fixes the run name, `export MAESTRO_RUN=<Name>`.
- With `MAESTRO_RUN` set, **all state lives in `pipeline-runs/<Name>.json`** (gitignored) — never the shared
  `pipeline-state.json`. Two runs = two files = zero clobber. With `MAESTRO_RUN` UNSET, everything falls back
  to the legacy single `pipeline-state.json` (unchanged single-run behaviour), so this is backward-compatible.

### 6b. NEVER hand-write state/ledger/log with inline `python3 -c`/heredoc — use `maestro_state.py`
All state I/O goes through the atomic, `flock`'d helper `maestro_state.py` (repo root). It does locked
read-modify-write + atomic temp-rename so parallel writers never lose updates (verified: 12 workers ×
40 writes = 480/480; 8 runs racing one keyword → exactly 1 winner):
```
export MAESTRO_RUN=<Name>
python3 maestro_state.py init  --note "link run from <url>" --field source_url=<url>
python3 maestro_state.py phase --num 3 --name generate-avatar-heygen --status done --output "…" --resume-next 4
python3 maestro_state.py set   --field auto_post=true
python3 maestro_state.py show                 # this run only
python3 maestro_state.py path                 # -> pipeline-runs/<Name>.json (use to target the right file)
python3 maestro_state.py list                 # all in-flight runs + status
python3 maestro_state.py log   --row-json '[…]'   # ATOMIC append to pipeline-log.csv (never a raw >> )
python3 maestro_state.py register-comp --name <Name> --duration 1778   # LOCKED idempotent Root.tsx insert
```
- The keyword **ledger is GLOBAL** (uniqueness is repo-wide) — `set_resource_cta.py` reserves under an
  exclusive lock, so the reservation can't be rolled back by a concurrent run. Keep using it (never hand-edit
  the ledger). It is MAESTRO_RUN-aware: it writes `resource_cta` into THIS run's per-run state file.
- `pipeline-log.csv` and `Root.tsx` are also shared — append the log via `maestro_state.py log` and register the
  Remotion composition via `maestro_state.py register-comp` (both locked) instead of `>>` / a raw `Edit`, so two
  runs writing at the same second don't interleave/corrupt them.

### 6c. Per-run is automatic for the rest
Render artifacts (`<downloads>/<Name>_*.mp4`), assets (`public/assets/<Name>/`), refs, the `<Name>` Remotion
composition id, and the `<Name>` HeyGen draft are ALREADY namespaced by run name — keep every artifact prefixed
with the run's `<Name>` and collisions can't happen. Stage uploads under `.upload-tmp/<Name>_…`.

### 6d. Browser & sessions
Each agent session is its own process with its own Playwright MCP + browser profile, so concurrent runs do NOT
share one browser — drive each run's own browser normally. The ONE shared surface is the saved cookie files in
`.claude/auth/*.json`: when re-saving a session, write to a temp path then `mv` (atomic rename) so two runs
re-saving the same platform never half-write. Don't run two pipelines inside ONE session/browser.

### 6e. Orphan guard (QCR-120 still applies, now per-run)
On resume, read `pipeline-runs/<Name>.json` (via `maestro_state.py show`), and STILL grep `pipeline-log.csv` for an
already-posted row before re-posting. `maestro_state.py list` surfaces every in-flight/abandoned run so a
finished-but-unposted orphan is visible instead of silently clobbering a live run.

---

## 7. VIABLE-FALLBACK-FIRST — solve with resources at hand, never ask, never spend
The pipeline runs **UNSUPERVISED, end-to-end** — the user is NOT watching and cannot answer a mid-run question.
So when a phase hits a limit or error, the agent's job is to **find the viable solution with the resources already
at its disposal and keep going**, not to stop and ask. This closes a real failure: Avatar IV showed "24 credits
needed, 1 remaining", and the run ESCALATED instead of clicking the **"Switch to Avatar III"** button sitting in the
same dialog — the obvious, free, in-reach answer.

**The rule:**
1. **A limit/exhaustion on ONE option is NOT a hard blocker while a viable alternative exists.** Before escalating,
   look for the documented free fallback and TAKE IT automatically: premium engine out → cheaper engine; primary
   source rate-limited/empty → next free source; preferred style unavailable → documented fallback style.
2. **NEVER spend money, buy credits, or upgrade a plan to get past a problem.** Do not click "Get credits", "Upgrade",
   "Add seats", or any paid path. Use only what the subscription/free tier already provides. If the only way forward
   costs money, THAT is when you escalate (and never auto-purchase).
3. **Decide the sensible default and continue — silently.** Do not narrate the limit as a question ("should I switch?"),
   do not pause for confirmation. Log the fallback you took in the run state (`maestro_state.py set`) and move on.
4. **A TRUE hard blocker is only when EVERY viable in-reach path is exhausted** (or the sole path needs payment / a
   2FA-captcha a human must clear). Only then escalate and WAIT. *(When QC is enabled, a grade still below
   `config.qc.threshold` after `config.qc.max_iterations` is a hard blocker too.)*

**Canonical fallbacks (each is $0 and in-reach — take automatically, never ask):**
| Situation | Viable fallback (take it) | Only-then hard blocker |
|-----------|---------------------------|------------------------|
| HeyGen **Avatar IV** out of credits ("Switch to Avatar III" offered) | Click **Switch to Avatar III** (`config.avatar.engine_fallback`) — same avatar look/voice, native 1080×1920, $0, QC-passes (QCR-154/QCR-182) | Avatar III ALSO can't submit, or `VOICE_QUOTA_EXCEEDED`, or 2FA/captcha at login |
| **Image provider** request fails (transient error, timeout, one bad/off-count asset) | **Retry per asset** — the batch is resumable per beat (`generate-image-assets`); re-roll only the failed asset, simplify its prompt on a timeout. A single blip never collapses the video to hand-drawn (QCR-133) | n/a |
| **Image provider** auth/quota dead (key invalid, quota exhausted, outage after retries) | Build **hand-drawn-annotation** + alert (`alert.py --platform images`, state `images_fallback`/`images_alert_sent`, §1), then continue | n/a — hand-drawn always ships |
| Stock b-roll **MISS** (no clip / source empty / rate-limited) | That window becomes a **hand-drawn MOTION** scene | n/a — motion always fills |

This is a PROCESS directive (authority level 2, §0): it governs the escalate-vs-continue decision and overrides any
"WAIT IT OUT or escalate" / "dead credential = stop" phrasing in a SKILL.md or INSTRUCTIONS.md that does not account
for an available fallback. When in doubt between asking and taking a free in-reach option: **take the option.**

---

## 8. EVERY VIDEO SHIPS A RESOURCE LINK + CTA ARMED BEFORE POSTING
Two coupled, non-negotiable rules so every reel gives its audience something to GET, and so even the first
commenters receive it:

### 8a. The comment→DM CTA is armed at the END of creation — BEFORE the reel is posted and BEFORE it is even enqueued
The comment→DM step (`manage-comment-dm`) is **Phase 11 — it runs at the end of the creation pipeline
(`maestro-video-pipeline`), right after Phase 10 and right BEFORE the mark-ready enqueue — never from `/post-now`.**
Why: a video isn't finished until its resource DM is armed, independent of when it actually posts. The ManyChat
automation triggers on **"any post or reel"** account-wide, so it does NOT need the new reel to exist, and all its
inputs are known well before this phase runs (keyword from Phase 2, link from Phase 4). Arming + verifying it LIVE
guarantees the automation is already running the instant the reel eventually publishes, so **the very first
comments get the resource link**.
- Sequence: **Phase 9 Sound Design → Phase 10 (QC, optional) → Phase 11 `manage-comment-dm` (create dedicated
  automation → Go Live → verify → stamp `resource_cta.status=live`) → mark-ready (enqueue into
  `post-queue.jsonl`, CTA already live) → [later, separately] `/post-now` runs Phase 12 `post-and-log`
  (publish + caption carries the keyword).**
- **`config.manychat.enabled: true`** — everything in `manage-comment-dm` applies. A hard ManyChat blocker (dead
  session / unresolvable link) **HOLDS THE BUILD** (the video is never enqueued). This is the ONE exception to
  "additive, never blocks a build": because it runs inside creation, it CAN block creation — by design.
- **`config.manychat.enabled: false` (default)** — the CTA is still chosen in Phase 2 (keyword + resource link)
  and written into the caption; Phase 11 skips the automation and stamps `resource_cta.status="manual"` — you
  deliver the links by hand (or with any other tool). `maestro_state.py assert-ready` and `/post-now` accept
  `resource_cta.status` ∈ {`live`, `manual`}.
- **"Build but don't post" hold interaction:** a standing "hold/don't post" instruction ONLY affects the SEPARATE
  `/post-now` publish step (Phase 12) — Phase 11 is part of CREATION and always runs to completion regardless of
  posting intent. There is never a reason to skip the CTA "because it won't publish yet" — the video may sit
  enqueued for any length of time, and its CTA should already be armed when `/post-now` eventually publishes it.

### 8b. No video from this repo lacks a resource link — mandatory web research + biased selection
`resource_cta.enabled` is **effectively ALWAYS true** — whether or not the ManyChat automation is on. The GET-test
(Phase 2) only classifies what the video naturally hands over. The rule for when the source does NOT already name a
gettable artifact:
1. **Phase 1 (`choose-video-topic`) biases selection** toward topics that map cleanly to a concrete gettable
   resource (tool/repo/agent/skill/app/product/guide), so the CTA fits organically — not a platform feature or
   pure news/opinion where the only "link" is a homepage.
2. **Phase 2 (`write-script-ptbr`) runs MANDATORY web research** when no gettable artifact is named: `WebSearch`
   driven by **what the video DESCRIBES** (the capability/need the script promises), iterating queries until it
   finds a REAL, accessible resource that fits the script **PERFECTLY**, then weaves it in and enables the CTA.
   The fit bar is strict — a viewer who comments must get exactly what the video promised; never bolt on a loosely
   related link.
3. **`disable` is last-resort only** (near-zero) — used solely when research genuinely finds no fitting resource,
   and it MUST be logged loudly so the gap is visible.
The link itself resolves in Phase 4 (`capture-references`) → Phase 11 Step 1 fallback (user-supplied → Phase-4
capture → **mandatory research**). An unresolvable link after exhaustive research HOLDS the build (per §8a).

---

## 9. NEXT-VIDEOS QUEUE — LINK-FIRST; QUEUE EMPTY = NICHE DISCOVERY, THEN ASK
A FIFO queue of **source video links to run the pipeline from** sits in front of Phase 1. The repo is
**link-first**: it produces from queued links. **When nothing is queued, niche discovery runs first** (`python3 discover-pipeline/discover_sources.py --enqueue` — YouTube search driven by `config.discovery.*` + `brand.niche`, captured in the setup phase; skill `discover-sources`); only when that finds nothing does the run STOP and ask the user for a link or a topic. This lets you drop links throughout the day and have them produced one-by-one on
each pipeline execution.

- **Storage:** `next-videos.jsonl` (repo root). **Manager:** `next-videos-pipeline/next_videos.py` —
  `flock`-atomic read-modify-write, the SAME concurrency-safe pattern as `maestro_state.py` (§6/QCR-173), so two
  parallel runs never `claim` the same link. **Never hand-edit the file.** Full spec:
  `next-videos-pipeline/NEXT_VIDEOS_INSTRUCTIONS.md`.

### 9a. Bare link in → ENQUEUE ONLY (run nothing)
When the repo receives a video link **and nothing else** (no other task/question), do NOT start the pipeline.
`python3 next-videos-pipeline/next_videos.py add "<URL>"` for each URL, reply "queued — N in line", end the
turn. `add` is a no-op only for an EXACT link already in the live queue. **An already-posted link (in
`pipeline-log.csv`) is NOT refused — it is queued and flagged `respin=true`, so the run re-spins it with a
brand-new hook + storytelling (see §9b).** A link **with** an explicit "run/execute/gera agora" instruction may
`add --front` (jump the line) and then dispatch.

**ENFORCED BY THE `UserPromptSubmit` HOOK (`.claude/hooks/detect-video-link.sh`).** A bare social-link message
is auto-detected and the hook itself runs `next_videos.py add` (storage is guaranteed) and injects context telling
the agent to confirm + STOP — never run the pipeline. A link accompanied by other text gets soft guidance
(enqueue-or-handle, never auto-run) and the agent judges. The hook never auto-runs the pipeline off a pasted link —
do not change that.

### 9b. Pipeline execution → Stage-0 dispatch (BEFORE Phase 1)
Every "run the pipeline / create a video / execute maestro video generator" trigger first runs `next_videos.py peek`.
**Non-empty → `claim --run <Name>` and run that link via `generate-video-from-link`; the claim stamps `queue_url`
on the run via `maestro_state.py`.** **Empty → run niche discovery (`discover-sources`) when `config.discovery.enabled` + `auto_enqueue`, then re-dispatch; still empty → STOP and ask the user for a link or a topic** (no invented topics): a link they give → `add "<URL>" --front` and dispatch; a topic/transcript → Phase 1 (`choose-video-topic`)
packages it as the topic seed → Phase 2. Owned by `maestro-video-pipeline` Stage 0.

**RE-SPIN branch (already-posted links):** right after `claim`, Stage 0 runs
`next_videos.py respin --run "$MAESTRO_RUN"` (prints `true`/`false`) and stamps `respin` into the run state. When
`respin=true` (the link was already posted), `generate-video-from-link` Step 3 must NOT reproduce the same hook
+ structure — it invents a **completely new hook, a different storytelling angle, and a different beat order**
on the same underlying topic/resource, so the re-run reads as a totally new video, not a repost. `respin=false`
(fresh link) keeps the faithful "same hook idea + same structure, punched up" rewrite.

### 9c. Fully done → remove from queue (Phase 12 only)
The entry is deleted ONLY when the video is posted + logged to `pipeline-log.csv` + `resource_cta.status` is
`live` (or `manual` when ManyChat is off). Phase 12 (`post-and-log` Step 4) calls `next_videos.py done --run "$MAESTRO_RUN"`
(no-op for manual-topic runs, which never set `queue_url`). A **held** ("build but don't post") or **crashed** run
stays `in_progress` and is NOT removed — resume it via its `MAESTRO_RUN`; the queue advances only on real
completion. `release --run <Name>` deliberately requeues/abandons a link. This guarantees a link is never lost
and never produced twice.

---

## 10. LOCAL OUTPUT — finals stay in `<downloads>`; archive optionally; the pipeline never deletes your media

- Every render artifact of a run lives in `<downloads>` (`paths.downloads`, default `~/Downloads`):
  `<Name>_avatar_1080p.mp4` / `_motion` / `_broll` / `_final` / `_music.mp4` plus the `<Name>_*` sidecars
  (visual plan, manifests, script copy). Transient files live in `<scratch>`.
- After a verified live post (`/post-now`), the posted final (`<Name>_music.mp4`, or `_final.mp4` when Phase 9
  was skipped) **stays in `<downloads>`**. Archive it wherever you like (external disk, NAS, cloud storage) —
  optional and manual; record the location in the run state (`maestro_state.py set --field archive_url=<…>`) if you want it in the audit trail.
- **The pipeline never deletes your media.** No phase removes `<downloads>/<Name>_*`, `.upload-tmp/<Name>*` or
  `<scratch>/<Name>*` — clean up by hand when you want the space back. KEEP the repo state (`pipeline-runs/`,
  `pipeline-log.csv`, ledgers), the composition `.tsx`, and `public/assets/<Name>/` + `public/refs/` inside the
  Remotion project — they are needed for re-renders (QCR-098 pool).
- HELD runs ("build but don't post") behave the same — everything stays local.

---

## 11. CONTENT-SAFETY / PLATFORM-POLICY GATE — no "easy money" or scam-shaped videos

**Runs in the SCRIPT-CHOOSING phase (topic selection + Phase 2 script writing + the link-rewrite Step 3).**
The videos teach REAL AI tools/capabilities with honest framing. A reel that reads as a get-rich-quick /
guaranteed-income scam — or otherwise trips Instagram's Community Guidelines / deceptive-content policy —
risks a shadow-flag, takedown, or account strike. A removed reel converts zero, so this gate protects the
whole account. It is ON by default for EVERY run and applies to the chosen TOPIC and the rewritten HOOK/SCRIPT.

**FORBIDDEN framings (never write, even when the SOURCE reel used them — the rewrite must strip them):**
- Guaranteed / fast / passive income or specific earnings: "ganhe R$X por dia/mês", "renda garantida",
  "fique rico", "dinheiro fácil", "lucro garantido", "sem esforço/sem trabalhar", "largue seu emprego".
- No-risk investment or financial-return promises; crypto/trading "sure profit".
- "Método secreto/infalível", "segredo que ninguém te conta", "hack que os bancos/gurus escondem".
- Fake or "secret" coupons / fabricated discount codes (integrity-fail, QCR-165/177); fabricated stats.
- Miracle health / beauty / weight-loss claims; impersonation or fabricated authority/endorsement.
- Anything deceptive, MLM/pyramid-shaped, or overpromising a result the linked resource can't deliver.

**BEHAVIOUR — reframe first, reject only if the premise IS the scam:**
1. **REFRAME (default).** Most queue links are legit ("this AI builds a working app in 10 min", "this agent
   automates X"). Keep the real tool + genuine capability; delete the money-scam wrapper. Convert
   "faça R$10 mil/mês com IA sem trabalhar" → the honest, TRUE capability ("essa IA cria um app funcional
   em 10 minutos"). Clickbait the CURIOSITY / impact of a TRUE fact (§2b SECTION-1 formulas), NEVER a
   financial guarantee. A borderline claim leans safe: drop the number, soften to what's verifiably true.
2. **REJECT (skip the topic)** only when the entire premise IS the scam and there's no honest capability or
   gettable resource under it → pick the next queue link (Stage 0), or for a manual topic tell the user.
3. **LOG it:** `python3 maestro_state.py set --field safety_note="reframed|skipped: <why>"` so the decision is
   auditable. This composes with the EVERY-VIDEO-SHIPS-A-RESOURCE rule (§8): the honest resource is still
   required — a legit tool/link is exactly what keeps the reframed video truthful.

**Where gated:** `how-to-generate-video-scripts.md` rule 12 (canonical script rule) · `write-script-ptbr`
SKILL · `choose-video-topic` SKILL (selection) · `generate-video-from-link` Step 3 (the clickbait rewrite
must pass this gate — MORE clickbait ≠ scammier, only truthfully punchier) · `post_queue.py add` (code gate on
the caption/title; `--allow-money-claim` is a deliberate, logged escape hatch).

---

## 12. SCHEDULED-SESSION EXECUTION CONTRACT — never die with work in flight

**WHY:** in a real batch of 10 overnight scheduled builds, 4 became silent orphans. Root cause in all silent
cases: the build session delegated late phases (8/9/11) to **background subagents and ended its turn** saying
"I'll be notified when it completes". Scheduled sessions are ONE-SHOT: when the turn ends, the session process
EXITS and every background subagent dies with it. The video was fully built on disk but the run stayed
`in_progress` forever — CTA never armed, never enqueued, invisible until a human audited the state. A 4th run
failed Phase 11 for lack of browser MCP tools AFTER the whole build was already paid for. This section makes
both failure shapes structurally impossible.

### 12a. ALL PHASES RUN INLINE — ending the turn is the LAST thing a creation run does
- **NEVER run a pipeline phase in a background subagent / background task** and NEVER end the turn while
  ANY phase is unfinished. "Aguardo o subagente" / "serei notificado na conclusão" is a FORBIDDEN final
  state — in a scheduled one-shot session that sentence is the moment the run dies.
- Long waits (HeyGen render, ffmpeg, uploads) are POLLED INLINE in the same turn (the RENDER-WAIT
  PARALLELISM section already structures this) — the turn stays open until `mark-ready` is stamped.
- Parallelism WITHIN the turn (fanning out Phase-4 asset work while polling the render) remains fine.
  The rule is about turn LIFETIME, not about doing things concurrently inside it.

### 12b. FAIL-FAST PREFLIGHT — verify the session can finish BEFORE spending a build
At Stage 0, BEFORE claiming a link, verify the tools the LAST phases need are present in THIS session:
- **Environment sane?** `python3 bin/doctor.py --quiet` must exit 0 (setup completed, keys present, ffmpeg
  with libass, Remotion deps). Non-zero → fix what it prints (or run `/setup`); claim nothing.
- **Browser MCP present?** Playwright MCP tools (`browser_navigate` etc.) must be callable — Phase 3
  (HeyGen) and, when `config.manychat.enabled`, Phase 11 (ManyChat) need them. Missing → do NOT start a build
  that cannot finish: report the broken session env, fire `python3 post-pipeline/alert.py --platform system
  --run scheduler --reason "build session has no Playwright MCP"` and STOP (claim nothing).
- **Orphans?** `python3 maestro_state.py stale` — the recovery sweep of §12d runs before the new build.
- **Phase 11 runs IN THE MAIN SESSION**, synchronously — never delegated to a subagent (a subagent may
  lack MCP tools and cannot share the browser session; this is how a full build once got burned).
- The Phase-11-prep check during the HeyGen wait (live ManyChat dashboard check) stays mandatory when
  `config.manychat.enabled`.

### 12c. END-OF-RUN ASSERT (deterministic, zero-trust)
The LAST command of every creation run is:
```bash
python3 maestro_state.py assert-ready --run "$MAESTRO_RUN"   # exit 0 = genuinely done
```
It verifies `status=='ready_to_post'` + `resource_cta.status` ∈ {`live`, `manual`} (`live` required when
`config.manychat.enabled`) + an ACTIVE `post-queue.jsonl` entry. **Exit 4 = the run is NOT done** — fix the
missing piece in THIS turn; a final report claiming success without a passing assert-ready is fake-green. (A
held/blocked run reports the HOLD explicitly instead — never a success message.)

### 12d. STALE-RUN RECOVERY SWEEP (Stage 0) — orphans get finished, not abandoned
**Scope note vs "ALWAYS START FROM 0":** that rule stands — a bare "run pipeline" never ADOPTS a stale run as
its own run. This sweep is DIFFERENT: it FINISHES orphans as a Stage-0 chore, THEN still starts the new build
from 0.
- Stage 0 runs `python3 maestro_state.py stale` (in_progress/failed + DEAD worker_pid + heartbeat >30 min).
  A LIVE sibling is never touched (`check-owner` semantics still apply — `stale` already excludes them).
- Per stale run, triage in this order (full procedure: skill **`recover-stalled-runs`**):
  1. `pipeline-log.csv` already has the run's row → it actually posted; stamp `completed` (QCR-120).
  2. `music_exists` + `resume_from>=10` → finish it: Phase 11 (`manage-comment-dm`, idempotent — or the
     `manual` stamp when ManyChat is off) → mark-ready enqueue → `assert-ready`. Cost: minutes, saves a full build.
  3. Mid-build (`resume_from<10`) with valid artifacts (QCR-170 reconciliation) → resume from
     `resume_from` and run it to mark-ready INLINE (this becomes this session's run; the queue link it
     claimed stays claimed by it — do NOT also start a second build in the same session).
  4. Unrecoverable (artifacts gone) → `next_videos.py release --run <Name>` + state `abandoned` + note.
- The sweep NEVER posts anything (posting stays exclusively in `/post-now`).
- `/post-now` Step 0 additionally sweeps `post_queue.py stale` (stuck `posting` claims >1h): log-row
  present → `done`; absent → verify no live reel on the IG profile (`config.posting.instagram_handle`), then
  `release` (QCR-120 order).

**Where gated:** `maestro-video-pipeline` SKILL (Stage-0 preflight + sweep + 12a/12b/12c) · `recover-stalled-runs`
SKILL (canonical recovery procedure) · `post-now` SKILL Step 0 (stuck-posting sweep) · `maestro_state.py stale` /
`assert-ready` · `post_queue.py stale` · `bin/doctor.py --quiet` (deterministic detectors).
