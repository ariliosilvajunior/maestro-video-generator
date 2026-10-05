# Motion Design System (V8 — premium bar)

This document defines the MANDATORY quality bar for every motion composition, plus the
**visual-plan protocol** that keeps motion graphics and b-rolls from ever overlapping.
It supersedes the "Quality Standard (V4+)" section of MOTION_INSTRUCTIONS.md where they
conflict. Library code lives at `motion-pipeline/remotion-agent/src/library/`.

**V8** replaced the V7 bar after a verified deep-research study + rendered
A/B tests. The core shift: **restraint
reads premium, bounce reads amateur.** Snap settles by default, ONE accent moment per
scene, motion blur on fast moves, Anton display type, parallax depth.

---

## 0. STYLE — PREMIUM-CLASSIC is the DEFAULT; HAND-DRAWN is the FALLBACK

> ⚠️ **CURRENT DEFAULT.** The pipeline's DEFAULT motion style
> is **PREMIUM-CLASSIC** — build by copying `src/compositions/PremiumSectionRef.tsx`, which
> carries the full §1→§3→§3b→§4→§5→§5b→§6 grammar (§1 clickbait headline · §3b word-by-word
> reveal · §5b avatar+floating-caption · §5/§6 graphics · `assertSectionGrammar`). The canonical
> structure spec is `SECTION_PIPELINE.md` (authoritative). **HAND-DRAWN ANNOTATION (below) is now
> the FALLBACK** — used only when image-asset generation can't run; it lacks §5b + the §3b reveal.
> Everything in §0 below describes that fallback look.

### 0.1 HAND-DRAWN ANNOTATION (FALLBACK)

**The hand-drawn fallback style**
("Variant08", chosen from a 10-way reference-driven study of top viral Shorts — Cleo
Abram / Kurzgesagt / Vox lineage). Build a video in this style ONLY as the fallback / when a creative
brief explicitly selects another. **The V8 premium-dark kinetic look in §2–§5 below
is now the ALTERNATE style — read it for the universal grammar, but the DEFAULT visual
language is hand-drawn.**

### The look
Friendly notebook explainer: warm off-white **paper** base, near-black **ink**, ONE
**marker-red** accent (+ sparing highlighter-yellow). The screen is "marked up live" —
arrows, circles and underlines **draw themselves** (stroke-dashoffset), flat-vector
callouts build element-by-element, marker highlights swipe under key words. Friendly
rounded sans (Trebuchet). Snap-settle entrances; exactly ONE bounce accent per scene.

### How to build it (do NOT hand-roll — use the toolkit)
- **Toolkit:** `src/library/handdrawn.tsx` (exported from `../library`). Components:
  `HandDrawnFrame` (paper motion area top-40% + avatar bottom-60% + feather — pass
  `avatarSrc`), `Kicker`, `HandWord`, `MarkerHighlight`, `CircleAnno`, `HandArrow`,
  `HandUnderline`, `FlowDiagram`+`HD_ICONS` (NO emoji — use these line icons),
  `StatCountUp`, `ScreenshotCard` (REAL reference screenshots in a browser card — pair with
  `CircleAnno`/`HandArrow` to mark up the relevant part; assets from skill `capture-references`
  → `public/refs/`), `PaperBg`, `DrawPath`, plus `HD` palette tokens + `useHandDrawnLayout`.

> **Reference screenshots:** when a beat names a specific real thing (GitHub repo,
> company site, logo, pricing page, news headline, platform page), prefer showing the REAL page —
> capture it live (skill `capture-references`) and mark it up with draw-on annotations. This is
> the on-brand Vox/Cleo-Abram move and beats generic stock. Real captures only — no AI generation.
- **Template (COPY THIS):** `src/compositions/HandDrawnTemplate.tsx` is the canonical
  reference. Build a new video by copying it and swapping the PT-BR copy per script —
  keep the structure, the 4 beats, and the hand-drawn grammar.
- **Palette:** `HD = { paper:#f5f2e9, ink:#1b1a17, accent:#e23b2e, accent2:#f2b705 }`.
  ONE accent (marker-red); yellow highlighter only to underline a key word.
- **Grammar (the 100x EXPLAINER bar — Vox / Cleo-Abram / Kurzgesagt; see `PIPELINE_DIRECTIVES.md` §3):**
  snap-settle (`useSnapHD`) is the default entrance; exactly ONE `useBounceHD` accent per scene
  (the hero word / number). **Every scene draws an annotation ON THE KEY THING being said** —
  `CircleAnno` / `HandArrow` / `HandUnderline` / `MarkerHighlight` — never a static title alone.
  **When the script NAMES a real tool/site/repo/news (brief `references[]` non-empty), at least one
  scene MUST show that real thing in an annotated `ScreenshotCard`** (live capture via skill
  `capture-references` → `public/refs/`); a generic abstract stock clip in its place is a directive
  VIOLATION, not a creative choice. **Step / how-to / sequence beats use `FlowDiagram` + `HD_ICONS`**
  (line icons, NO emoji) building node-by-node. Numbers use `StatCountUp`; add Lottie accents where
  they reinforce a beat. Friendly hand sans only. **NO emoji — `HD_ICONS` line icons only.**

### What still applies (style-agnostic — from the sections below)
The Visual-Plan no-overlap protocol (§1), the S0 clickbait HEADLINE 0–3.0s (§2.6),
the COMPLEMENT rule (§2.5, ≤3 words shared with narration), the ≤15-words-on-screen
cap, frame layout (top 40% motion / bottom 60% avatar), fps 25, and the QC checklist
(§3, adapted: paper base instead of dark, marker accent instead of neon) ALL still
apply to hand-drawn videos. (When QC is enabled) Gemini QC remains the FINAL authority.

### Structure — the 6-SECTION REPEATING GRAMMAR + MOTION IDEAS
The hand-drawn FALLBACK is built section-by-section (the PREMIUM default's order incl. §3b/§5b is in `SECTION_PIPELINE.md`). Hand-drawn order **1 → 2 → 3 → 4 → 5 → 6,
then repeat 3 → 4 → 5 → 6** (1 Headline + 2 Evidence fire once; 3 AvatarOnly / 4 Motion+Text /
5 SplitGraphics-noText / 6 FullGraphics-noText repeat). A SECTION is a CANVAS; what plays on it
is a MOTION IDEA. **Two HARD rules on every motion beat:** (1) MATCH — pick the idea whose
mechanism mirrors the spoken line; (2) VARIETY — `assertVariety([...ids])` THROWS if two adjacent
beats reuse a mechanism. Ideas registry (`src/library/motionideas.tsx`): `IdeaProcessFlow` /
`IdeaSpotlight` / `IdeaRadialSystem` / `IdeaStatBurst` / `IdeaGridRepeat` / `IdeaCycleLoop`.
Full spec: `motion-pipeline/SECTION_PIPELINE.md`. This SUPERSEDES any "Section 4 = FlowDiagram /
Section 5 = payoff-CTA" wording elsewhere.

### Reference renders
- `HandDrawnGrammarRef` — the 6-section grammar with 6 DISTINCT line-matched motion ideas (the structure to copy).
- `HandDrawnTemplate` — toolkit/look reference for the hand-drawn style. Render + 4-frame check after any handdrawn library change.

---

## 1. The Visual-Plan Protocol (NO-OVERLAP — mandatory)

**Problem it solves:** b-rolls replace the FULL frame (trim+concat in `insert_brolls.py`).
Any motion scene playing during a b-roll window is covered — wasted render, and scenes
reappear chopped mid-animation after the cut. Without this protocol, ~40% of motion content
was destroyed this way in early runs.

**Solution:** decide the b-roll windows BEFORE building the motion composition, then
schedule motion scenes ONLY in the gaps. One artifact drives both phases.

### Step order inside Phase 4 (after the SRT exists)

1. Read the SRT. Pick the 4 candidate b-roll windows FIRST (same rules `select_stock_brolls.py` uses):
   - Window 1 (hook) at **3.0s** — right after the S0 HEADLINE scene (0–3.0s, §2.6);
     windows 2-4 at SRT sentence boundaries within ~9-32s.
   - 5.0s each, ≥2s gap between windows, last window ends ≥1s before video end.
2. Write `<downloads>/<VideoName>_visual_plan.json`:

```json
{
  "video_name": "<VideoName>",
  "duration_s": 51.14,
  "broll_windows": [
    {"insert_at": 3.0,  "duration": 5.0, "beat": "what is spoken during this window"},
    {"insert_at": 12.5, "duration": 5.0, "beat": "..."},
    {"insert_at": 19.5, "duration": 5.0, "beat": "..."},
    {"insert_at": 26.5, "duration": 5.0, "beat": "..."}
  ],
  "motion_segments": [
    {"start": 0.0,  "end": 3.0,  "scene": "S0", "beat": "HEADLINE BANNER — clickbait theme headline (HeadlineBanner, §2.6; enters frame 0, QC needs a hook <2s)"},
    {"start": 8.0,  "end": 12.5, "scene": "S1", "beat": "..."},
    {"start": 17.5, "end": 19.5, "scene": "S2", "beat": "..."},
    {"start": 24.5, "end": 26.5, "scene": "S3", "beat": "..."},
    {"start": 31.5, "end": 51.1, "scene": "S4+", "beat": "split into 2-3 scenes if >8s"}
  ]
}
```

3. Build the composition with `<Sequence>` blocks matching `motion_segments` EXACTLY —
   **no Sequence may overlap a broll_window**. Leave the motion layer empty during
   b-roll windows (the frame is replaced anyway).
4. Stock selection (Phase 4, BEFORE motion) passes the SAME file: `select_stock_brolls.py ... --plan-file <plan.json>`.
   The script uses these windows verbatim (skips auto slot-picking), so motion and
   b-roll can never drift apart.

### Scene boundary rules
- **S0 (0–3.0s) is ALWAYS the HEADLINE BANNER scene** (`HeadlineBanner`, §2.6) — the
  clickbait theme headline enters at frame 0 and exits via `CameraRig exit` into the
  hook b-roll at 3.0s. Doubled from 1.5s (research: viewers read on-screen
  text slower than creators assume; 3s = the algorithmic retention checkpoint window).
- Every segment that starts at a b-roll cut-back MUST open with `<Stinger>` (radial
  streaks + flash) — the CameraRig zoom-whip entrance is automatic. Makes the hard
  cut feel like an edit decision.
- Every segment that ends at a b-roll window MUST exit via `CameraRig exit` (push +
  fade in the last 8 frames). Never let a scene get chopped mid-animation.
- Segments shorter than 1.5s get ONE element only (a title punch, a stat) — no cards.
- Gaps >8s between b-rolls: split into 2 scenes rather than letting one idle.

---

## 2. The Library (use it — do not hand-roll equivalents)

`import { ... } from "../library"` — all components are fps-aware and deterministic.

| Component | What it does | When to use |
|-----------|--------------|-------------|
| `PALETTES` | 4 curated palettes (ember/voltage/acid/royal) | Pick ONE per video. Never mix accents across palettes. |
| `FONTS` | Anton (display) + Space Grotesk (text) via Google Fonts | Used by TYPE automatically. NEVER Arial/Arial Black in V8. |
| `AmbientBg` | noise-driven aurora + drifting particles + grain + vignette | Every scene background. Vary `seed` per scene. |
| `ParallaxStage` | **V8** 3-layer depth: ghost outline word (×-0.5) + grid floor (×-0.25) + fg floaters (×1.8) | Sibling ABOVE AmbientBg, UNDER content. `ghostWord` = the video's number/keyword ("10X", "GRÁTIS") — topic-flexible. Use in 2+ scenes per video so the frame never reads flat. |
| `CameraRig` | snap zoom-whip entrance (1.12→1, 6f, NO bounce) + layered handheld (drift + micro-jitter + ±0.3° roll) + slow push, optional exit | Wrap every scene's content. `exit` when scene ends at a b-roll window. |
| `MotionBlurWrap` | **V8** cinematic motion blur (CameraMotionBlur, shutter 200°, 6 samples) | Wrap scene content that has FAST motion (HeroCascade, slides, big punches). NOT on slow scenes — costs ~6× render of wrapped content. |
| `Stinger` | **V8** radial speed streaks + flash (7 frames) | FIRST child of every Sequence starting at a b-roll cut-back. |
| `HeroCascade` | **V8** letter-by-letter cascade with squash & stretch + chromatic RGB split | THE showpiece. **Max 1-2 uses per VIDEO** — the topic word or the payoff word. Always inside MotionBlurWrap. |
| `KineticWords` | **speech-synced** keyword bursts (absolute SRT timestamps) — snap settles; `accent: true` word gets the ONE bouncy pop | **Keyword bursts ONLY** (see §2.5) — 3-6 distilled keywords, NEVER the spoken sentence verbatim. Max ONE accent word per scene. |
| `HeadlineBanner` | **V8.1** S0 clickbait headline: kicker chip (pulsing live-dot + label) + Anton headline lines + shine sweep + underline draw-on. Snap entrances from frame 0. | **MANDATORY in S0 (0–3.0s)** — the video-theme headline (§2.6). Never in other scenes. |
| `PunchTitle` | snap-settle title lines + drawing underline (follow-through), accent words | Scene headlines. |
| `CountUp` | number ticker with glow pulse (snap container) | Any number in the script. Counts as the scene's accent moment. |
| `DrawBars` | bars that draw on with glowing tips, staggered | Comparisons, progressions, "X vs Y". |
| `IconDraw` | strokeDashoffset SVG draw-on with glow + breathe | Hand-crafted 100x100-viewBox paths only, NEVER emoji. Simple single-path marks. |
| `LottieIcon` | **V8.2** designer-grade Lottie animation, auto-recoloured to the palette accent, frame-accurate + deterministic (renders identically on macOS) | Richer than IconDraw — multi-element, properly-eased motion (orbiting dots, pulsing rings, flow arrows, scans). Use for the scene's ONE icon/accent moment, or composite a `pulse-ring` BEHIND a CountUp number. See §2.7. |
| `GlassCard` | glass card with shine sweep (snap entrance) | Supporting one-liner (counts toward 15-word cap). |
| `overshoot()` | velocity-matched overshoot helper (Ebberts formula) | Optional, for custom deliberate hits — amplitude derives from motion speed. |

### 2.1 SPRING GRAMMAR (V8 — the anti-slop rule)
Research-verified: premium systems (Remotion's official TikTok template, Onda) use
heavily-damped settles, NOT bounce. Bounce everywhere is AI-slop signature.

- **Default for EVERY entrance:** `SPR.snap` (`{damping: 200}`) + `durationInFrames: SNAP_DUR` (5)
  with scale 0.88-0.94→1 and a 24-40px rise. Confident settle, zero wobble.
- **`SPR.accent` (bouncy) is RATIONED: at most ONE accent moment per scene** — the hero
  number, the one keyword (`accent: true` in KineticWords), or a HeroCascade. Two bouncy
  elements in the same scene = automatic fail.
- `HeroCascade` (squash & stretch + chromatic): **max 1-2 per VIDEO.** If two scenes
  both want it, cut one.
- Springs are beat-timeable: use `durationInFrames` to hit cuts; never let physics
  dictate scene rhythm.

### 2.2 MOTION BLUR (V8)
- Wrap scenes containing fast motion (HeroCascade, slide-ins, whip entrances at
  cut-backs) in `MotionBlurWrap`. This is what makes fast moves read cinematic
  instead of strobing at 25fps.
- Do NOT wrap slow/idle scenes (drift, breathing, CountUp holds) — wasted render time.
- Budget: blur multiplies the wrapped content's render cost by ~`samples` (6). With
  2-3 blurred scenes per video, Phase 4 render roughly doubles. Acceptable.

### 2.5 COMPLEMENT RULE — no double subtitling (MANDATORY)
Burned subtitles already transcribe every spoken word at the bottom of the frame.
Motion graphics that repeat the same words are double subtitling — the viewer reads
the identical text twice. **Motion text must always be a VISUAL COMPLEMENT of the
narration, never a transcription of it.**

- A motion scene may share **at most 3 words** with the sentence spoken during it,
  and **never 4+ consecutive words** of that sentence.
- Prefer: distilled punch titles (a conclusion, a label, a category), brand names,
  numbers (`CountUp`), comparisons (`DrawBars`), icons (`IconDraw`), one-line
  takeaways (`GlassCard`) — things the narration does NOT spell out letter-for-letter.
- **KineticWords is a KEYWORD BURST**: 3-6 distilled keywords (brands, numbers,
  concept nouns — reworded/abstracted, NOT the sentence's words in order). Each
  keyword still pops speech-synced (`at` = absolute second the CONCEPT is spoken,
  ±0.3s tolerance), but the full spoken phrase must never be reproduced.
  Full-sentence word-by-word transcription is FORBIDDEN.
- `HeroCascade` text and `ParallaxStage` ghostWord also count toward the shared-word
  budget — pick abstracted/distilled words for them too.
- Self-check before rendering: for every scene, read the SRT segment(s) playing under
  it and count shared/consecutive words. If a scene fails, distill harder.

`at` timestamps remain ABSOLUTE seconds; pass the Sequence's start second as
`sceneStartSec`. The 15-word hard cap counts ALL words a KineticWords block leaves
on screen (HeroCascade + GlassCard words count too; ParallaxStage ghostWord does not —
it's texture, but keep it ≤6 chars).

### 2.6 THE HEADLINE RULE — S0 clickbait theme banner (MANDATORY)

Every video opens with a **HeadlineBanner** scene from 0 to 3.0s: a news-style
clickbait headline that states the VIDEO THEME. Research basis (verified, see
`docs/headline-banner-research.md`): ~90% of recall impact lands in the
first 6 seconds; on-screen text that gets viewers reading lifts view time and recall;
the headline doubles as algorithm-readable topical text and serves sound-off viewers.

- **Timing:** enters at FRAME 0 (kicker chip, then headline lines snapped in by ~0.4s —
  the QC gate requires a visual hook <2s). Holds with shine sweep + breathing, exits
  via `CameraRig exit` into the hook b-roll at 3.0s. Duration doubled from 1.5s:
  viewers read on-screen text slower than creators assume, and 0-3s is
  the retention checkpoint the headline must carry.
- **Copy:** ≤8 words across max 2 lines + a 1-2 word kicker (`AGORA`, `VAZOU`,
  `BOMBA`, `URGENTE`, or a niche label like `CLAUDE CODE`). Pick ONE formula:
  curiosity gap (`ISSO APOSENTA O PROGRAMADOR?`), bold claim (`A IA QUE TRABALHA
  SOZINHA`), number promise (`3 AGENTES QUE FAZEM TUDO`), warning (`PARE DE USAR
  IA ASSIM`), or news-style (kicker `VAZOU` + `CLAUDE CODE DE GRAÇA`). Exactly one
  accent word highlighted.
- **Complement rule applies (§2.5):** the headline is a DISTILLED summary of the
  theme, never the spoken opening sentence — ≤3 words shared with the concurrent SRT.
- **Mismatch rule (verified pitfall):** the headline is functionally a second title;
  platforms enforce against overlays that promise what the video doesn't deliver.
  Every claim in the headline MUST be true of the video. Bold ≠ false.
- Pair with `AmbientBg` + `ParallaxStage` (ghostWord = the theme's keyword) so S0
  has depth. No HeroCascade in S0 (save the showpiece for the payoff).

### 2.7 LOTTIE — designer-grade animated accents (V8.2)

Deep-research verdict: **keep Remotion, enrich it with Lottie** — don't replace the pipeline.
Lottie animations render INSIDE Remotion via the first-party `@remotion/lottie`
package (frame-accurate, deterministic — no macOS screenshot-mode caveat). This is
the highest-payoff, lowest-risk motion upgrade: multi-element, professionally-eased
motion that `IconDraw`'s single-path draw-on cannot match.

- **Component:** `LottieIcon` (`src/library/LottieIcon.tsx`). Props: `src`
  (`"lottie/<key>.json"`), `palette`, `tint` (`accent`|`accent2`|`ink`, default
  accent), `delay`, `size`, `loop` (default true), `glow` (default true).
- **On-brand by construction:** assets are authored WHITE and recoloured to the
  active palette at render time, so they obey the ONE-palette-per-video rule
  automatically. Entrance is the V8 `SPR.snap` settle; glow matches the library.
- **Asset bank:** `public/lottie/` + `manifest.json`. Starter primitives (regen
  with `node motion-pipeline/tools/gen_lottie_primitives.mjs`):
  - `pulse-ring` — sonar rings; composite BEHIND a CountUp/number (`glow={false}`,
    large `size`, `position:absolute` behind, see `LottieDemoV8` Scene 3).
  - `orbit-dots` — AI / agents / processing.
  - `arrow-flow` — progression, pipeline, "leads-to".
  - `scan-sweep` — analysis, scanning, security/inspection.
- **Drop in real assets:** any LottieFiles or After-Effects (Bodymovin export)
  `.json` placed in `public/lottie/` works the same way — add it to `manifest.json`.
  Prefer single/low-colour assets so the accent recolour reads clean; verify the
  asset is licensed for commercial use.
- **Rules it still obeys:** counts as the scene's icon/accent slot (don't also add
  an IconDraw + a HeroCascade in the same scene — spring grammar §2.1). It carries
  NO words, so it's complement-safe (§2.5) and free against the 15-word cap.
- **Reference:** `src/compositions/LottieDemoV8.tsx` (id `LottieDemoV8`) — render
  and frame-check after any library change.
- **Status:** ADDITIVE / opt-in. Default renders are unchanged until a Lottie scene
  ships through a real pipeline video and passes the QC≥75 gate with QC enabled (same
  promotion discipline as the Creative-Director styles).

### Known pitfall
Flex `gap` in `em` units resolves against the CONTAINER font size (16px), not the
spans' — use px (already fixed inside the library; don't regress in custom code).
`MotionBlurWrap` children must be absolutely positioned (library components are).

---

## 3. Quality bar (checklist — verify on extracted frames before accepting a render)

1. **Complement, not transcript (§2.5):** no scene mirrors the concurrent subtitle
   text — ≤3 shared words, never 4+ consecutive. KineticWords only as distilled
   keyword bursts (still speech-synced to concepts).
2. **Spring grammar (§2.1):** snap settles by default; max ONE accent moment per
   scene; HeroCascade max 1-2 per video. Wobble everywhere = fail.
3. **MOVING elements, not static/pulse (HARD):** each beat has ≥1
   element in continuous purposeful TRANSLATION while on screen — travel along a path, flow between
   nodes, orbit, cascade in one-by-one, count up, sweep/scan. Fade-in-then-hold or breathe/pulse-ONLY
   is a DEFECT (pulse/breathe may ACCENT but is never the primary motion). Verify by extracting ≥2
   frames per beat and confirming an element actually MOVED (not just opacity/scale). Nothing static >1.5s.
4. **Depth:** at least 2 scenes use `ParallaxStage` (ghost word / grid / floaters) —
   the frame must never read as type floating in a void.
5. **Motion blur (§2.2):** fast scenes wrapped in `MotionBlurWrap`; slow scenes not.
6. **Choreography:** every scene has entrance (≤0.25s snap, staggered children), held
   life (ambient motion), and exit (if it ends at a b-roll cut).
7. **One palette**, Anton display type (TYPE.title/mega — NEVER Arial), hierarchy
   through size. Kickers/labels in Space Grotesk (TYPE.kicker/label).
8. **≤15 words** visible at once (house rule — unchanged).
9. **Stinger at every b-roll cut-back**, CameraRig exit into every b-roll window.
10. Safe zone respected: content inside paddingTop mH×0.38 / paddingBottom mH×0.05.
11. No emoji, no stock-looking icons — `IconDraw` paths, `LottieIcon` (palette-
    recoloured, §2.7), or nothing.
12. **S0 = HeadlineBanner (§2.6):** clickbait theme headline 0–3.0s, enters frame 0,
    ≤8 words, one formula, true to the content, exits into the 3.0s hook b-roll.

The old V7 look (bouncy pops everywhere, Arial Black, flat dark void background) is
BELOW the bar. If two consecutive scenes use the same layout + same components, change one.

---

## 4. Scene recipe (how to compose a V8 scene)

```tsx
<Sequence from={startF} durationInFrames={durF}>
  <AmbientBg mH={MH} palette={P} seed="s2" />
  <ParallaxStage mH={MH} palette={P} seed="s2" ghostWord="10X" />
  <Stinger palette={P} mH={MH} />            {/* only at b-roll cut-backs */}
  <MotionBlurWrap enabled={sceneHasFastMotion}>
    <CameraRig seed="s2" exit durationInFrames={durF}>
      {/* content: PunchTitle / KineticWords / CountUp / HeroCascade (rationed) */}
    </CameraRig>
  </MotionBlurWrap>
</Sequence>
```

Topic flexibility: the agent picks `ghostWord`, HeroCascade word, accent keyword,
and palette from the SCRIPT (the topic's number, product name, or payoff word) —
the system imposes grammar, not content.

## 5. Reference demo

`src/compositions/LibraryDemo.tsx` (12s, palette voltage) exercises the core
components; `src/compositions/MotionLabV8.tsx` (ids `MotionLabBlur` / `MotionLabType` /
`MotionLabStinger` / `MotionLabParallax` / `MotionLabFps`) is the V8 look reference
(chromatic open + parallax + cascade + blur). Render after library
changes: 4-frame visual check (0.3s, 2s, 6.5s, 10.5s).
