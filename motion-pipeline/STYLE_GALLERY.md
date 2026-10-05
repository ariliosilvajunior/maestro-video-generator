# Style Gallery (the frozen, QC-vetted style registry)

This document is the **frozen registry of the named visual STYLE identities** the
per-video `creative_brief` is allowed to pick from. It is the safety mechanism that
makes per-video variety NOT weaken the Gemini QC gate: every style here is an
individually-vetted, pre-frozen config — not a free-form prompt. The creative-director
layer chooses ONE `style_id` per video; the style fixes the palette, motion intensity,
headline formula, subtitle pack, music mood, and pacing, and it ships a
`QC_GROUND_TRUTH_NOTE` that is injected verbatim into the Gemini prompt so the grader
knows what is INTENTIONAL design vs. what is genuine slop.

> **DEFAULT:** the ENFORCED DEFAULT style is **PREMIUM-CLASSIC** (§3.05). **HAND-DRAWN-ANNOTATION**
> (§3.0) is the automatic FALLBACK when image-asset generation can't run; it has its OWN frozen
> envelope (paper palette + hand sans + draw-on grammar) defined in `MOTION_DESIGN_SYSTEM.md`
> §0 and built from `src/library/handdrawn.tsx`. The V8 styles below remain available
> as ALTERNATES (selectable only when their `when_to_use` matches AND `status: active`).

> **This file does NOT relax any V8 rule.** It supersedes nothing in
> `MOTION_DESIGN_SYSTEM.md`. Every style below inherits ALL hard V8 rules unchanged
> (§ "INVARIANTS — true for every style"). A style only changes *taste dials inside the
> frozen envelope*; it never opens the envelope. Where any style row appears to conflict
> with `MOTION_DESIGN_SYSTEM.md`, the design system wins and the style is mis-specified —
> fix the row, never the system.

---

## 0. How the creative_brief uses this gallery

1. Phase 2/4 emits a `creative_brief` with a chosen `style_id` (matched from
   `when_to_use` against the script's topic shape).
2. The brief MAY ONLY name a style whose `status: active` (see § ACTIVATION GATE).
   A `candidate` style is documented but MUST NOT be selected until promoted.
3. The chosen style's frozen row drives Phase 4 (motion intensity dials), Phase 8
   (subtitle pack), Phase 9 (music mood), and the S0 headline formula in Phase 4.
4. The style's `QC_GROUND_TRUTH_NOTE` is appended to the QCR-013 ground-truth text part
   in the Phase 10 Gemini call (when QC is enabled) — so style-intentional energy is graded as a feature,
   never as slop.
5. The ENFORCED DEFAULT for EVERY topic shape is **PREMIUM-CLASSIC** (§3.05 — copy `PremiumSectionRef.tsx`). **HAND-DRAWN-ANNOTATION** (§3.0) is the auto FALLBACK only (when image-asset generation can't run); it lacks §5b + the §3b word-by-word reveal.

---

## 1. INVARIANTS — true for EVERY style (non-negotiable, inherited from V8)

Every style — active or candidate — keeps the hard V8 rules. A style that breaks any of
these is invalid and must be cut, not shipped:

- **40 / 60 layout** — top 40% (768px) motion, bottom 60% (1152px) avatar. Never moved.
- **15-word hard cap** — ≤15 words visible at once per scene (counts HeroCascade +
  GlassCard; ghostWord is texture, ≤6 chars, excluded). `MOTION_DESIGN_SYSTEM.md` §3.8.
- **Complement rule** — motion text COMPLEMENTS narration: ≤3 shared words with the
  concurrent SRT segment, never 4+ consecutive. No full-sentence KineticWords. §2.5.
- **Mandatory S0 HeadlineBanner 0–3.0s** — every video opens with the clickbait theme
  headline, enters frame 0, ≤8 words + kicker, ONE formula, TRUE to content. §2.6.
- **No emoji, no stock icons** — `IconDraw` paths, `HD_ICONS` line icons (hand-drawn), or `LottieIcon` — never emoji. §3.11.
- **Library-only components** — only `motion-pipeline/remotion-agent/src/library/`
  components (incl. the `handdrawn` toolkit). No hand-rolled equivalents. §2.
- **Fonts:** premium-classic (DEFAULT) uses Proxima/Montserrat ALL-CAPS; the hand-drawn FALLBACK uses its frozen hand sans (Trebuchet); the V8 ALTERNATE
  styles use Anton (display) + Space Grotesk (text). Never Arial/Arial Black. §2.

> **Style-envelope override:** the HAND-DRAWN-ANNOTATION fallback style has its
> OWN frozen envelope — paper palette (`HD`: paper/ink/marker-red), hand sans, and draw-on
> grammar (`MOTION_DESIGN_SYSTEM.md` §0). For hand-drawn videos the "Anton/Space-Grotesk
> fonts", "Anton display", and "approved palette pairs / one-tonal-pivot" rows below are
> REPLACED by the hand-drawn frozen tokens. All OTHER invariants (40/60 layout, 15-word cap,
> complement rule, S0 headline, no-emoji, library-only, PT-BR, one avatar, QC-final) hold
> unchanged for every style including hand-drawn.
- **PT-BR obrigatório** (`config.brand.language`, default `pt-BR`) — all headline / motion / subtitle / caption text in Brazilian
  Portuguese. No exceptions, no English mode.
- **ONE avatar per repo** (`config.avatar.*`) — never switch avatars mid-run.
- **(When QC is enabled) Gemini QC stays FINAL authority** — the style note explains intent; it NEVER excuses
  a grade below `config.qc.threshold` (default 75), NEVER overrides Gemini, NEVER "fakes green". The threshold gate is
  untouched.

What a style is ALLOWED to vary (the frozen envelope): palette (from the approved pairs),
motion-intensity dials (snap damping, MotionBlurWrap count, parallax layers, accent
budget, HeroCascade count), default headline formula, subtitle personality pack, music
mood, and pacing. Nothing else.

---

## 2. Motion-intensity presets (the only three dial settings)

`motion_intensity` is a single token (`low|med|high`) that expands to a frozen dial set.
Phase 4 reads these EXACTLY — no improvising between presets.

| preset | snapDamping | MotionBlurWrap scenes | parallaxLayers | accent budget / scene | max HeroCascade / video |
|--------|-------------|------------------------|----------------|-----------------------|--------------------------|
| **low**  | 220 (slowest settle, near-zero overshoot) | 0 | 3 (full depth, held)        | 0–1 (mostly 0)                       | 1 |
| **med**  | 200 (V8 default snap)                      | 1 | 2                            | 1 (the V8 default ONE accent)        | 1–2 |
| **high** | 180 (snappier settle, still no wobble)     | 2 | 3 (parallax every scene)     | 1 + one extra accent moment allowed  | 2 |

Notes that bind all presets:
- Even `high` keeps **SNAP as the default entrance** (`SPR.snap`). "More accents" means
  one extra *rationed* `SPR.accent` moment, NOT bounce everywhere — bounce everywhere is
  still AI-slop and still fails. §2.1.
- `parallaxLayers` maps to `ParallaxStage` depth usage: 1 = ghost word only on hero
  scenes; 2 = ghost + grid in 2+ scenes; 3 = ghost + grid + fg floaters, used widely.
- HeroCascade is ALWAYS inside `MotionBlurWrap`; a style with 0 MotionBlurWrap scenes
  (low) caps HeroCascade at 1 and wraps just that one.

---

## 3. The styles (frozen rows)

### 3.0 HAND-DRAWN-ANNOTATION  — `style_id: hand-drawn-annotation`  — **status: active — FALLBACK** (the resilient fallback behind the premium-classic default)

The fallback look (winner of a 10-way reference study). Friendly Vox/Cleo-Abram
notebook explainer — paper base, marker-red accent, draw-on arrows/circles/underlines, flat
step diagrams, hand sans. Built from `src/library/handdrawn.tsx`; model on
`src/compositions/HandDrawnTemplate.tsx`. Full spec: `MOTION_DESIGN_SYSTEM.md` §0.

```json
{
  "style_id": "hand-drawn-annotation",
  "status": "active",
  "when_to_use": "FALLBACK — explainers, how-it-works, AI/tool walkthroughs, comparisons; selected automatically when image-asset generation can't run (or images.provider is none)",
  "toolkit": "src/library/handdrawn.tsx (HandDrawnFrame, Kicker, HandWord, MarkerHighlight, CircleAnno, HandArrow, HandUnderline, FlowDiagram+HD_ICONS, StatCountUp)",
  "palette": "HD paper (paper #f5f2e9, ink #1b1a17, marker-red #e23b2e accent, highlighter-yellow #f2b705 sparing)",
  "motion_intensity": "med (snap-settle default, ONE bounce accent/scene; every scene marks up the page with >=1 draw-on annotation)",
  "headline_formula": "curiosity-gap or bold-claim — kicker + circled/highlighted accent word",
  "subtitle_personality": "clean-pop (white + yellow highlight, motion caps) — unchanged; subtitles sit over the avatar, not the paper",
  "music_mood": "light / friendly / curious",
  "pacing": "balanced, build-element-by-element"
}
```

**QC_GROUND_TRUTH_NOTE (inject verbatim):** "Style = HAND-DRAWN-ANNOTATION. This is a
deliberate notebook/explainer aesthetic: warm off-white PAPER motion area (top 40%), near-black
ink, ONE marker-red accent, hand sans (Trebuchet), and draw-on annotations (arrows, circles,
underlines, step diagrams that build element-by-element). The light paper base, hand-drawn
strokes, and friendly font are INTENTIONAL premium design (Vox/Cleo-Abram/Kurzgesagt lineage) —
grade them as a feature, NOT as low-effort, off-brand, or 'not dark/neon'. Snap-settle is the
base entrance with ONE bounce accent per scene. The 40/60 layout, 0–3s S0 headline, complement
rule (≤3 shared words), 15-word cap, no-emoji (line icons only), and PT-BR all still hold —
penalize only real violations of those, never the hand-drawn aesthetic itself."

---

### 3.05 PREMIUM-CLASSIC  — `style_id: premium-classic`  — **status: active — ENFORCED DEFAULT**

Editorial / museum-quality look. A themed-paper base + a thin gold double-rule frame, Cormorant
Garamond serif (small-caps letter-spaced labels, large display numerals, italic accents), and
RESTRAINED motion (slow fade-rise + gentle parallax + line draw-ons — NO bouncy springs, NO sparkles,
NO marker highlights). The per-element graphics are **keyed IMAGES from your image provider** (`generate-image-assets`; premium
objects + an image-icon set), NOT code-drawn line icons. Every beat COMPOSES 2–5 elements (hero +
depth element + vector accent + serif type) — never one big object.

**THEME-DRIVEN PALETTE — the brief field `premium_palette` (REQUIRED).**
The background + serif color concept varies per VIDEO THEME. Valid ids (`PREMIUM_PALETTES` in
`src/library/premium.tsx`), the only allowed values for `premium_palette`:

| `premium_palette` | Theme | Look |
|---|---|---|
| `marble-gold` (DEFAULT) | money · finance · luxury · timeless | warm marble + antique gold (LIGHT) |
| `charcoal-gold` | AI · tech · power · dramatic | deep charcoal + warm gold (DARK) |
| `midnight-azure` | data · SaaS · corporate · trust | midnight navy + azure (DARK) |
| `ivory-emerald` | growth · health · nature · productivity | ivory + deep emerald (LIGHT) |
| `bordeaux-rose` | luxury · fashion · beauty · lifestyle | soft rose + bordeaux (LIGHT) |
| `slate-copper` | engineering · hardware · crypto · industry | slate + copper (DARK) |

The motion phase wraps the comp root in `<PremiumTheme palette={brief.premium_palette}>`; unknown → `marble-gold`.

**SCREENSHOTS in the UPPER panel:** Section 2 `PremiumEvidence` is a
SPLIT card — the screenshot fills the top-40% panel WIDTH (a `PremiumFrame` CHILD; avatar below),
shown width-bound + top-anchored so the important top-of-page content is fully visible and NOTHING is
cropped horizontally. Geometry (CARD_W 1008 / CARD_H 594 / BAR_H 46) mirrored in `prepare_reference_shot.py`.

```json
{
  "style_id": "premium-classic",
  "status": "active",
  "when_to_use": "premium / editorial / luxury-fintech topics, or whenever a refined classic look is wanted (NOT young/clickbaity). Assets = antique/matte/marble/brass keyed cutouts via generate-image-assets -> image-pipeline/chroma_key.py; icons too are generated images, not HD_ICONS.",
  "palette": "marble+antique-gold (PREM tokens in premium.tsx)",
  "premium_palette": "marble-gold (per-theme: charcoal-gold | midnight-azure | ivory-emerald | bordeaux-rose | slate-copper)",
  "motion_intensity": "low (restrained)",
  "headline_formula": "calm bold-claim or curiosity-gap (serif, centered)",
  "subtitle_personality": "clean (white + subtle), no neon",
  "music_mood": "elegant / cinematic-ambient",
  "pacing": "slow-balanced"
}
```

**Toolkit:** `src/library/premium.tsx` (exported from `../library`): `PremiumTheme` (palette wrapper) ·
`PremiumFrame` · `PremiumHeadline` · `PremiumEvidence` (full-frame) · `PremiumBg` · `PremiumLabel` ·
`PremiumDisplay` · `PremiumAsset` · `PremiumGraph` · `PremiumImageIcon` · `PremiumFlow` · `PREMIUM_PALETTES` · `PREM` · `SERIF`.
Assets: `generate-image-assets` skill (premium prompts → `public/assets/<run>/`; optionally generate an icon set once into `public/assets/icons/`).
Reference comps: `PremiumSectionRef` · `PremiumOpeningDemo` · `SplitFlowDemo` · `FullFlowDemo`.

**QC_GROUND_TRUTH_NOTE (inject verbatim):** "Style = PREMIUM-CLASSIC. Editorial museum look —
marble paper + thin gold rule frame, Cormorant serif, antique-gold palette, RESTRAINED motion.
Per-element graphics are real keyed IMAGES (image-provider renders; premium objects + image-icons),
composed 2–5 per scene — this is intentional premium taste, NOT low-effort and NOT 'stock'. Calm
slow motion and the absence of bounce/sparkle are the design; do not penalize them."

---

### 3.1 PREMIUM-SNAP  — `style_id: premium-snap`  — **status: active** (V8 ALTERNATE)

The validated V8 baseline (the previous default, now an alternate). Dark premium kinetic;
what every other V8-family style is measured against.

```json
{
  "style_id": "premium-snap",
  "status": "active",
  "when_to_use": "NARROW ALTERNATE ONLY — dark-premium-hype topics with NO page/step/diagram/named-tool to draw, where hand-drawn is a genuinely poor fit AND the topic shape demands it; NOT a default and NOT a variety pick (premium-classic §3.05 is the ENFORCED default; hand-drawn §3.0 is the fallback — see PIPELINE_DIRECTIVES.md §1)",
  "palette": "voltage",
  "palette_pair": "ember+voltage",
  "motion_intensity": "med",
  "headline_formula": "curiosity-gap or bold-claim (pick per script)",
  "subtitle_personality": "clean-pop (white + yellow highlight, Arial Black 68, motion caps)",
  "music_mood": "epic / ambient",
  "pacing": "balanced"
}
```

**QC_GROUND_TRUTH_NOTE (inject verbatim):** "Style = PREMIUM-SNAP. Restraint is the
design: snap settles by default, at most ONE accent moment per scene, balanced pacing.
This is the validated V8 baseline — grade against the standard V8 bar. Calm, confident
motion is INTENTIONAL premium taste here, not low-effort; do not penalize the absence of
rapid cuts or extra bounce."

---

### 3.2 KINETIC-RAPID-FIRE  — `style_id: kinetic-rapid-fire`  — **status: candidate**

High-energy announcement style. Built for breakthroughs and "this just dropped".

```json
{
  "style_id": "kinetic-rapid-fire",
  "status": "candidate",
  "when_to_use": "announcements, breakthroughs, 'acabou de sair', launches, hype reveals, version drops",
  "palette": "voltage",
  "palette_pair": "voltage+royal",
  "accent_palette_note": "acid used ONLY as the single accent tone (keyword pops / accent word) — never as a second base",
  "motion_intensity": "high",
  "headline_formula": "bold-claim",
  "subtitle_personality": "impact-hit (white + yellow highlight, punchier 5-word/seg cadence, motion caps)",
  "music_mood": "dark-trap / epic",
  "pacing": "rapid-fire",
  "hero_cascade_count": 2,
  "motion_blur_scenes": 2,
  "parallax": "every scene"
}
```

**QC_GROUND_TRUTH_NOTE (inject verbatim):** "Style = KINETIC-RAPID-FIRE. Fast cuts,
parallax on every scene, up to TWO HeroCascade moments, and a per-scene accent pop are
INTENTIONAL design for this announcement style — grade the energy as a feature, not as
slop or chaos. The rapid pacing is deliberate; do not penalize density or speed.
SNAP is still the base entrance (no random bounce), the 15-word cap and complement rule
(≤3 shared words) still hold, and PT-BR + the 0–3s S0 HeadlineBanner are still present —
penalize only ACTUAL violations of those, never the intended high-energy pacing itself."

---

### 3.3 CINEMATIC-SLOW-BURN  — `style_id: cinematic-slow-burn`  — **status: candidate**

Contemplative, held-frame style. For topics that need gravity, not hype.

```json
{
  "style_id": "cinematic-slow-burn",
  "status": "candidate",
  "when_to_use": "ethics, privacy, safety, philosophy, 'o lado sombrio', reflective / contemplative topics",
  "palette": "royal",
  "palette_pair": "voltage+royal",
  "ember_accent_note": "ember allowed as the single warm accent tone for emphasis words only",
  "motion_intensity": "low",
  "headline_formula": "curiosity-gap",
  "subtitle_personality": "calm-serif-feel (white + restrained yellow highlight, slower reveal cadence, motion caps)",
  "music_mood": "ambient / tension",
  "pacing": "slow-reveal",
  "hero_cascade_count": 1,
  "motion_blur_scenes": 0,
  "parallax": "heavy (3-layer depth held across scenes)"
}
```

**QC_GROUND_TRUTH_NOTE (inject verbatim):** "Style = CINEMATIC-SLOW-BURN. Long holds,
near-zero accents (0–1 per scene), NO motion blur, and slow reveals are INTENTIONAL
design for this contemplative style — the deliberate calm and minimal motion are a
feature, NOT a sign of a static/low-effort video. The 'nothing static >1.5s' bar is met
through ambient drift, parallax depth, and breathing — not through cuts or pops; grade
that as premium restraint. Do not penalize the slow pacing or the absence of energy.
The 0–3s S0 HeadlineBanner, 15-word cap, complement rule, and PT-BR all still hold."

---

### 3.4 DATA-CLARITY  — `style_id: data-clarity`  — **status: candidate**

Structured, evidence-forward style. For tutorials and comparisons where numbers lead.

```json
{
  "style_id": "data-clarity",
  "status": "candidate",
  "when_to_use": "tutorials, step-by-steps, comparisons ('X vs Y'), benchmarks, 'em N passos', anything number-driven",
  "palette": "voltage",
  "palette_pair": "ember+voltage",
  "motion_intensity": "med",
  "component_emphasis": "DrawBars + CountUp + IconDraw forward; structured grid layout (ParallaxStage grid floor visible)",
  "headline_formula": "number-promise",
  "subtitle_personality": "clean-pop (white + yellow highlight, Arial Black 68, motion caps)",
  "music_mood": "ambient-tech",
  "pacing": "balanced",
  "accent_note": "restrained — CountUp / DrawBars count as the scene's ONE accent; no extra pops"
}
```

**QC_GROUND_TRUTH_NOTE (inject verbatim):** "Style = DATA-CLARITY. The structured grid,
prominent DrawBars / CountUp / IconDraw, and restrained accents are INTENTIONAL design
for this tutorial/comparison style — clarity and structure are the point, so grade the
clean, ordered look as a feature, not as 'flat' or 'too simple'. Numbers and bars
carrying the visual load is correct here. Complement rule still applies (bars/numbers
must not just retranscribe the narration), 15-word cap, PT-BR, and the 0–3s S0
HeadlineBanner all hold — penalize only real violations of those."

---

### 3.5 BOLD-WARNING  — `style_id: bold-warning`  — **status: candidate**

Alarm/controversy style. Hot accent, urgent pacing — for risk and "pare de usar".

```json
{
  "style_id": "bold-warning",
  "status": "candidate",
  "when_to_use": "controversy, risk, 'cuidado', 'pare de usar', scams, danger, 'o problema com X', strong-opinion takes",
  "palette": "ember",
  "palette_pair": "ember+voltage",
  "approved_warm_accent": "ember hot tone as accent; OR the mono-ink + voltage pair when a colder warning read is wanted",
  "motion_intensity": "high",
  "hot_accent": "the single accent color runs hot (ember red/orange) on the warning word",
  "headline_formula": "warning",
  "subtitle_personality": "impact-hit (white + yellow highlight, punchy cadence, motion caps)",
  "music_mood": "tension",
  "pacing": "rapid-fire",
  "hero_cascade_count": 2,
  "motion_blur_scenes": 2
}
```

**QC_GROUND_TRUTH_NOTE (inject verbatim):** "Style = BOLD-WARNING. The hot ember accent,
urgent rapid-fire pacing, and up to two HeroCascade hits are INTENTIONAL design for this
warning/controversy style — the alarm energy is a feature, not slop. The warning headline
formula and tension music are by design. The headline claim MUST still be TRUE of the
video (no false-promise overlay), SNAP stays the base entrance, and the 15-word cap,
complement rule (≤3 shared words), PT-BR, and the 0–3s S0 HeadlineBanner all hold —
penalize only actual rule violations or any headline claim the video does not deliver,
never the intended urgency itself."

---

## 4. ACTIVATION GATE — how a style becomes selectable

A style is selectable by the `creative_brief` ONLY when `status: active`. A style is
documented as `candidate` until it earns promotion.

**Promotion rule:** a `candidate` style is promoted to `active` only after it passes
**1–2 real test renders** through the Gemini QC (Phase 10 with `config.qc.enabled: true`) at **≥ `config.qc.threshold`** (default 75, unchanged). The test render is a full, real pipeline run on a representative topic for
that style's `when_to_use` shape — not a mock, not a frame check, not a self-graded pass.

- **PREMIUM-CLASSIC is `active`** — the ENFORCED DEFAULT (§3.05; reference render `PremiumSectionRef`).
- **HAND-DRAWN-ANNOTATION is `active`** — the FALLBACK (winner of a 10-way reference study; reference
  render `HandDrawnTemplate` verified on-brand).
- **PREMIUM-SNAP is `active` (alternate)** — the previously-validated V8 baseline; remains
  selectable but is no longer the default.
- **KINETIC-RAPID-FIRE, CINEMATIC-SLOW-BURN, DATA-CLARITY, BOLD-WARNING are `candidate`**.
  The brief MUST NOT select any of them until promoted.
- **The brief must read `status` before selecting.** If it would pick a `candidate`
  style, it falls back to PREMIUM-CLASSIC (the default) instead and logs the intended
  style for a future promotion run.
- **Promotion is recorded here:** when a candidate passes its 1–2 QC-≥75 test renders,
  flip its `status` to `active` in this file and note the passing grade. Gemini
  remains the FINAL authority on whether a test render passed — never self-certify a
  promotion, never override a sub-75 grade to force promotion.
- **Demotion:** if an `active` (non-default) style later produces repeated sub-75 grades
  on-shape, demote it back to `candidate` and re-vet. PREMIUM-SNAP is never demoted.

---

## 5. Approved palette pairs + the single-tonal-pivot rule

Styles may only draw from the three approved harmonious palette pairs. These are the ONLY
combinations a style row may name; any other pairing is invalid.

| pair | base palette | accent palette | reads as |
|------|--------------|----------------|----------|
| **ember + voltage** | ember | voltage | warm body, electric-blue accent — premium, energetic |
| **voltage + royal** | voltage | royal | electric body, deep-purple accent — bold, announcement |
| **acid + royal** | acid | royal | acid-green body, royal accent — sharp, distinct (reserve for variety beats) |

**Single-tonal-pivot-per-video rule:** within a single video you pick ONE base palette
and AT MOST ONE accent tone from its approved pair — a single tonal pivot. You never mix
accents across more than that one pair, and you never introduce a third palette. This is
the V8 "one palette per video, never mix accents across palettes" rule (§2 PALETTES /
§3.7) expressed as the per-style envelope: base + one approved accent, nothing more. The
accent tone is what the ONE rationed accent moment per scene uses (the hero number, the
accent keyword, or the HeroCascade word).

---

## 6. Status summary

- **PREMIUM-CLASSIC** — `active`, the ENFORCED DEFAULT (§3.05).
- **HAND-DRAWN-ANNOTATION** — `active`, the FALLBACK (§3.0). Its frozen envelope (paper palette +
  hand sans + draw-on grammar, `handdrawn` toolkit) overrides the V8 font/palette invariants for
  hand-drawn videos; all other invariants + the QC threshold gate are unchanged.
- **PREMIUM-SNAP** — `active`, narrow ALTERNATE (inherited V8 validation).
- **KINETIC-RAPID-FIRE, CINEMATIC-SLOW-BURN, DATA-CLARITY, BOLD-WARNING** — `candidate`, each pending
  1–2 test renders at QC ≥ `config.qc.threshold` (default 75). All styles inherit the full V8 invariant
  set; none relaxes a hard rule or the QC gate.
