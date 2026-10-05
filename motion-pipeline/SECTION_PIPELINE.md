# SECTION PIPELINE — section-by-section motion logic

> Every video is assembled from **named, ordered SECTIONS**. Each section has ONE job, its own
> hard-coded choreography + timing, and accepts **content only** (copy, a screenshot, a number).
> The system imposes the grammar; the script fills the words. This is how "every video is amazing":
> the quality lives in the section components, not in per-video improvisation.
>
> Built on the hand-drawn paper frame (`HandDrawnFrame`, top-40% motion / bottom-60% avatar).
> Sections are reusable components in `motion-pipeline/remotion-agent/src/library/sections.tsx`.
> This file is subordinate to `PIPELINE_DIRECTIVES.md` and (when QC is enabled) the Gemini QC gate (both FINAL).

---

## The section order (canonical)

Every video opens with sections **1 → 2 → 3 → 3b → 4 → 5 → 5b → 6**, then **repeats 3 → 3b → 4 → 5 → 5b → 6**
in a loop until the script ends. Sections 1 & 2 fire ONCE (the opening); 3–6 are the
repeating body cycle. The variety across 3–6 (avatar / caption-card / motion+text / split-graphics /
avatar+floating-caption / full-graphics) is what keeps a long video visually fresh without improvisation.

> **CONTENT-DRIVEN EDIT DIRECTION (Phase 4.7 — SHADOW-MODE).** The fixed cycle above is the
> proven default. A parallel model is being canary-rolled: instead of a fixed
> cycle, each beat's **edit style** is chosen by what its phrase needs, with **no style repeating within a
> window of 4** ("4 edit styles in a row / 4 apart"). Palette + rule: **`motion-pipeline/EDIT_STYLES.md`**;
> planned by the **`plan-edit-direction`** skill into `<Name>_edit_plan.json`; gated by `verify_edit_plan.py`
> (pre-render) and `assertEditFlow` (render backstop, `src/library/motionideas.tsx` — distance-4). **In
> shadow-mode the plan is emitted + validated but does NOT drive the build** (the fixed cycle + this file
> stay authoritative) until the canary promotes it (3–5 real runs at QC≥75). See EDIT_STYLES.md → Rollout.

**§5b — sits BETWEEN §5 and §6.** The avatar in its ORIGINAL full
frame (not the split paper frame) with BIG Proxima-Nova word-by-word subtitles popping in the EMPTY
part of the frame (the region the avatar does NOT cover). Component `PremiumAvatarCaption`; pass
`zone` ("top" | "bottom" | "left" | "right") chosen per video AFTER LOOKING at the avatar frame (for
a centered talking-head the free zone is "top", above the head). Tag the beat `avatarcap:<concept>`
and suppress its burned subtitle window in Phase 8 (the floating caption IS the subtitle). The
component **AUTO-FITS** the font (conservative word-wrap estimate + a hard `overflow:hidden`
backstop) so even a long line shrinks to stay inside the safe zone and **can NEVER reach the
avatar** (a real run once had the last word covering the face). Still prefer a short
line (a ~2–3.5s narration beat) so the type stays big.
**PLATFORM SAFE MARGINS (house rule):** the caption box honors the universal
9:16 safe zone (900×1400 centered in 1080×1920 — TikTok/IG Reels/YT Shorts/FB Reels) → top
inset **264px**, bottom **360px** (Shorts/IG eat more at the bottom), sides **96px**, so the
platform status bar / "For You" tabs / Shorts header / profile chrome NEVER trim it. These are
baked into `PremiumAvatarCaption` (`SAFE_TOP`/`SAFE_BOTTOM`/`SAFE_SIDE`). Verified with a
900×1400 overlay. Apply the same safe band to ANY top/edge text in other sections.

**GAP-FREE SCHEDULING — MANDATORY (fixes the "flash to full-frame avatar between sections" bug).** NEVER author a section as `durationInFrames={F(t2-t1)}`. `Math.round((t2-t1)*fps)` (round of the SPAN) can be **1 frame shorter** than `F(t2)-F(t1)` (difference of the rounded positions) when the start rounds down and the end rounds up — that leaves a **1-frame GAP** before the next full-frame overlay, and the always-on `PremiumFrame`/`HandDrawnFrame` behind flashes its avatar through it (the "edit-error" feel). FIX: schedule with FRAME DIFFERENCES via `sectionWindows(fps, [t0, t1, t2, …])` (exported from `../library`) → each window's `from + durationInFrames === next.from` EXACTLY (zero gaps), with a default `+1` bleed so consecutive overlays always overlap. Author the ordered boundary times ONCE; spread the returned `{from, durationInFrames}` into each `<Sequence>`.

**PACING (house rule): a NEW screen every ~2.5 SECONDS** — cap every section at ≤2.5s; split any narration span >2.5s into back-to-back beats so the screen transitions at least every 2.5s (fast-paced). **FRESH IMAGE PER MOTION BEAT: every motion beat shows a NEW concept via a NEW keyed image (`generate-image-assets`) generated for that beat — NEVER reuse an asset across beats.** In a
real video the boundaries still snap to the narration's sentence timings, but the target rhythm is ~2s.

| # | Section | Job | Layout | Text? | Component | Status |
|---|---------|-----|--------|-------|-----------|--------|
| **1** | **Headline Hook** | Clickbait headline of the OVERALL view — stop the scroll in <2s | in-frame (paper top, avatar below) | yes | `HeadlineHook` | ✅ BUILT |
| **2** | **Evidence Reveal** | Real-life PROOF: a live screenshot + a hard data point. **SPLIT — screenshot in the UPPER panel, avatar below; ANIMATED (scroll/zoom), width-bound** | in-frame (top panel) | yes | `EvidenceReveal` / `PremiumEvidence` | ✅ BUILT |
| **3** | **Full-Frame Avatar** | Avatar fills the WHOLE frame. Subtitles only — NO motion, NO b-roll, NO extra visual elements | overlay (full-frame) | subtitles only | `FullFrameAvatar` | ✅ BUILT |
| **3b** | **Kinetic Caption** | A solid **theme-PALETTE-color background** with the EXACT spoken line revealed **WORD-BY-WORD (DEFAULT = `reveal` mode)** — each word pops in (fade-up), the just-revealed word tints GOLD, the rest white, accumulating into the full sentence — in the Proxima-style sans, BIG + centered. No avatar, no screenshot. Comes RIGHT AFTER the full-frame avatar. **`groups={[...]}` (2–3 distilled words) is the EXCEPTION — use ONLY for a very short CTA, NEVER for normal §3b beats** (a real run wrongly used groups everywhere). | overlay (full-frame) | yes (the words ARE the section) | `PremiumKineticCaption` (pass `reveal text="…"`) | ✅ BUILT |
| **4** | **Full Motion + Text** | Pure motion graphics carrying TEXT — headline + flow diagram + stat. NO avatar | overlay (full-frame) | yes | `FullMotionFrame` | ✅ BUILT |
| **5** | **Split Graphics** | Split screen: avatar BELOW, motion ABOVE. Motion area is GRAPHICS ONLY (icons/connectors/rings) — **NO text** | in-frame (paper top, avatar below) | none (subtitles burn later) | `SplitGraphicMotion` | ✅ BUILT |
| **5b** | **Avatar + Floating Caption (NEW)** | Avatar in its ORIGINAL full frame + BIG Proxima word-by-word subtitles popping in the EMPTY zone the avatar does NOT cover (analyze the frame → pick `zone`). Active word tints gold; a soft scrim in the zone keeps it legible | overlay (full-frame avatar) | yes (the floating caption IS the subtitle) | `PremiumAvatarCaption` | ✅ BUILT |
| **6** | **Full Graphics** | Fullscreen motion, GRAPHICS/ICONS ONLY — **NO text at all**, no avatar. Hand-drawn system diagram (core + satellites + pulse rings) | overlay (full-frame) | none (subtitles burn later) | `FullGraphicFrame` | ✅ BUILT |

> **Text rule:** sections 5 & 6 bake ZERO words. The only on-screen text the viewer
> reads during them is the Phase-8 burned subtitle (added over the whole video). The
> motion in 5 & 6 communicates through ICON + MOTION alone (HD_ICONS line icons, NO emoji).
>
> **Wiring rule — ROBUST, no continuous avatar-frame (QCR-109 — kills the
> "split-screen leak" between full-frame sections):** do NOT render one `PremiumFrame`/`HandDrawnFrame`
> CONTINUOUSLY behind everything (a 1-frame coverage gap then flashes its avatar). Instead:
> 1. one continuous `<Audio src={staticFile(avatar)}/>` at the root carries the narration;
> 2. a themed `<PremiumBg frame={false}/>` (or `PaperBg`) FLOOR sits at the bottom of the z-stack — any gap reveals the theme bg, NEVER the avatar;
> 3. each SPLIT section (1, 2, 5) wraps its OWN windowed `<PremiumFrame muted trimBefore={w.from}>` (the avatar VISUAL exists ONLY in split + `FullFrameAvatar` windows);
> 4. full-frame sections (3, 3b, 4, 5b, 6) are opaque overlays (§5b carries its OWN full-frame avatar via `<OffthreadVideo muted trimBefore={w.from}>`, like §3);
> 5. author ALL sections in TIME order in JSX (so the `sectionWindows` +1 bleed overlap always resolves to the LATER section).
> Reference: `src/compositions/PremiumSectionRef.tsx`. `PremiumFrame` accepts `muted`+`trimBefore`.

## SECTION 3b — Kinetic Caption (DEFAULT = `reveal`)

A full-frame **palette-color** card. **DEFAULT = `reveal` mode: the EXACT spoken line revealed
WORD-BY-WORD** — each word pops in (fade + 14px rise), the just-revealed word tints GOLD, earlier words
stay white, accumulating into the whole sentence — BIG + centered in the Proxima-style sans
(`PROXIMA`/Montserrat, ALL CAPS). No avatar, no graphics — a clean kinetic breather right after the
full-frame avatar. Background = the video's `premium_palette`; the continuous `<Audio>` keeps narration.
Pass **`reveal text="<the exact spoken line>"`** (optionally `timings={[…]}` for per-word audio sync).

**`groups={[...]}` (2–3 distilled words, all-gold) is the EXCEPTION** — use ONLY for a very short
punch like a CTA, NEVER for a normal §3b beat. (A real run wrongly used
`groups` on every §3b — it showed only a 2-word distillation AND suppressed the subtitle, so most of
the sentence's text was lost. `reveal` shows the full line, so it is the correct default.)

**SUPPRESS the burned subtitle during this section (QCR-109):** the big
caption IS the subtitle here — the small bottom subtitle would be redundant. The composition emits the
caption windows to `<Name>_caption_windows.json` (seconds, e.g. `[[13.8,18.7],[42.7,45.2]]`); Phase 8
runs `subtitle-pipeline/suppress_windows.py in.ass out.ass --windows-file <Name>_caption_windows.json`
to drop the Dialogue lines overlapping those windows BEFORE burning.

```tsx
{/* DEFAULT — word-by-word reveal of the EXACT spoken line (overlay sibling after FullFrameAvatar) */}
<Sequence {...W[2]}>
  <PremiumKineticCaption reveal text="É de graça e roda sozinho" durFrames={W[2].durationInFrames} />
</Sequence>
{/* EXCEPTION (short CTA only): groups={["É DE GRAÇA","E RODA","SOZINHO"]} */}
```
Props: `text` (auto-split by `wordsPerGroup`, default 2) **or** `groups[]` (explicit 2–3-word chunks);
`durFrames` (the beat); `size` (default 132); `bg`/`color` overrides; `accent` (gold text). Keep groups
to 2–3 words so the type stays BIG; long lines wrap centered.

### 3b VARIANT — VERBATIM word-by-word reveal

When you want the **exact spoken sentence** shown as if it were the real subtitle of that beat —
not a distilled 2–3-word punch — pass **`reveal`** with the verbatim `text`. The full sentence is
laid out wrapped + centered and each word **reveals one at a time** (fade + 14px rise + pop, ~6
frames), accumulating until the whole line is on screen; layout is pre-allocated so words light up
**in place** (no reflow jank), and the just-revealed "active" word briefly tints to the accent then
settles. Default `size` drops to **76** so a full sentence fits + wraps (override with `size`).

```tsx
{/* verbatim reveal — exact line, word by word, evenly paced across the beat */}
<Sequence {...W[7]}>
  <PremiumKineticCaption reveal text="A frase exata aparece palavra por palavra" durFrames={W[7].durationInFrames} />
</Sequence>
{/* exact AUDIO sync (optional): timings = per-word START times in SECONDS, relative to the
    section start. Omit and words distribute EVENLY across durFrames (the window == the spoken
    sentence's duration, so even pacing ≈ natural). */}
<PremiumKineticCaption reveal text="…" timings={[0, 0.4, 0.9, 1.3]} durFrames={W[7].durationInFrames} />
```

Extra `reveal` props: `reveal` (turns it on, uses `text`), `timings?: number[]` (per-word start
seconds for exact sync; absent → even). `groups`/`wordsPerGroup` are ignored in reveal mode.

**COMPLEMENT-RULE EXCEPTION:** this is the ONE place §3b text MAY equal the narration verbatim. The
[Complement Rule](#) (motion text shares ≤3 words with narration, never the spoken line verbatim) is
RELAXED here **because §3b already suppresses the burned bottom subtitle for its window** — so there
is still only ONE set of text on screen at a time (no double-subtitle, which is what the rule guards
against). Still tag the beat **`caption:`** (the `assertSectionGrammar` guard is unchanged) and still
emit the window to `<Name>_caption_windows.json` so Phase 8 suppresses the burned subtitle there.
>
> **Reference build — PREMIUM-CLASSIC (DEFAULT, QCR-147): `src/compositions/PremiumSectionRef.tsx`.**
> The canonical premium template: it already calls **`assertSectionGrammar`** + includes §5
> `PremiumSplitGraphics` + §6 `PremiumFullGraphics`, so copying its wiring inherits the full
> §3→§3b→§4→§5→§6 cycle and the render HARD-FAILS on the caption↔hero ping-pong. Render-verified.
> Copy it and swap the per-section content
> (script copy, palette, fresh keyed assets, ref screenshot) — keep the section order + the
> `assertSectionGrammar([...])` call with honest `type:` ids (`opening:`/`avatar:`/`caption:`/
> `heroAsset:`/`split:`/`full:`/`evidence:`; NEVER tag a §6 as `heroAsset:`).
>
> **Reference build — HAND-DRAWN (older 6-section grammar, `assertVariety` only):**
> `src/compositions/SectionCycleDemo.tsx` (id `SectionCycleDemo`, 35.5s). NOTE: the hand-drawn
> path still uses bare motion-idea ids, so `assertSectionGrammar`'s split:/full: presence floor
> does not yet apply there (premium is the active default).

---

## MOTION IDEAS — match + variety

A SECTION is a CANVAS (full-frame / split-over-avatar / titled). What plays ON that
canvas is a **MOTION IDEA**. The first cut reused ONE idea (icon badges wired by lines +
pulse rings) for every motion beat, so the sections all looked the same. **That is a
defect.** Two HARD rules now govern every motion beat (sections 4, 5, 6 and their repeats):

1. **MATCH** — the motion must ILLUSTRATE the exact line being spoken in that beat. Pick
   the idea whose *mechanism mirrors the sentence's meaning* — a sequence → flow, a number
   → burst, a hub → radial, a loop → cycle, sameness → grid, one thing → spotlight. A
   generic icon set that doesn't track the words is a directive VIOLATION.
2. **VARIETY + GRAMMAR** — **NO motion idea repeats, AND the full §3→§3b→§4→§5→§6 cycle
   must be present.** Wire **`assertSectionGrammar([...ids])`** (in `motionideas.tsx`, exported
   from `../library`) into every comp — it supersedes `assertVariety` (calls it internally) and
   THROWS at render time when: (a) two adjacent beats share a section TYPE (id prefix — no
   `caption→caption`, no `heroAsset→heroAsset`); (b) a ≥12-beat video has ZERO `split:` or
   ZERO `full:` sections; (c) 4+ consecutive beats are only `caption`/`heroAsset` (the
   **caption↔hero PING-PONG**).

> **QCR-147 — the caption↔hero ping-pong.** Two shipped renders
> collapsed into `§3b caption → §4 hero → §3b caption → …`
> with **§5 split-graphics NEVER appearing** ("after kinetic caption + full-motion it goes back
> to caption instead of split graphics"). Root cause was twofold: (1) the premium toolkit had
> NO §5/§6 section component, so authors improvised one full-frame `HeroScene` for §4 *and* §6
> and never built §5; (2) `assertVariety` compared FULL id strings, so `caption:a`→`caption:b`
> and `heroAsset:x`→`heroAsset:y` passed. FIX: added `PremiumSplitGraphics` (§5) + `PremiumFullGraphics`
> (§6) to `premium.tsx`, and `assertSectionGrammar` (type-aware adjacency + §5/§6 presence floor +
> anti-ping-pong). **Tag ids honestly** — §5 = `split:…`, §6 = `full:…`; NEVER tag a §6 as `heroAsset:`.

### The registry (`src/library/motionideas.tsx`, exported from `../library`)

| Idea | Component | Distinct motion signature | Use when the line is about… |
|------|-----------|---------------------------|------------------------------|
| Process Flow | `IdeaProcessFlow` | linear L→R, connectors draw + dots travel | a sequence / steps / "how it works" / pipeline |
| Spotlight | `IdeaSpotlight` | ONE card zooms in + internal scan-sweep | "this one thing" / focus / "comes alive" / a single element |
| Radial System | `IdeaRadialSystem` | centrifugal hub + spokes + radiating dots | "connects everything" / a core / a system |
| Stat Burst | `IdeaStatBurst` | one big number counts up + radiating sparks | a quantity / "10x" / "%" / speed |
| Grid Repeat | `IdeaGridRepeat` | tiled IDENTICAL cards stagger-fill | sameness / "every one" / consistency / "mesma identidade" |
| Cycle Loop | `IdeaCycleLoop` | a dot ORBITS a closed ring + rotation arrows | automation / loops / "no automático" / end-to-end |
| **Hero Asset** | `IdeaHeroAsset` / `CutoutAsset` | a REAL 3D keyed cutout (image-provider render, chroma-keyed) springs in, bobs, wobbles, glows + shine lines/sparkles | a CONCRETE OBJECT a 3D render depicts better than a line icon — money(coin), the AI(robot), privacy(lock), an ad(megaphone), a product/trophy/rocket |

> **Hero Asset (chroma-green render → chroma-key):** generate a topic-relevant 3D object on a solid
> chroma-green background with your image provider (`config.images.provider`), key the green out
> (`image-pipeline/chroma_key.py`), and drop it in as `<IdeaHeroAsset src="assets/<run>/<beat>_cut.png" .../>`.
> See the `generate-image-assets` skill. MIX with line-icons (hero cutouts for concrete objects, line icons
> for abstract/flow beats). In `assertVariety`, give each object its OWN id (`heroAsset:coin` ≠ `heroAsset:robot`).
> Reference: the bundled placeholder cutouts `public/assets/sample/{robot,coin,clock,lock}_cut.png` used by the demos.

Each idea takes **content only** + `full` (renders its own paper bg, for sections 4 & 6) or
no `full` (transparent over the `HandDrawnFrame` top panel, for section 5), and an optional
`headline`/`kicker` (text-bearing section 4) or omitted (ZERO text, sections 5 & 6 — meaning
via motion alone; Phase-8 burns the subtitle). Add new ideas to `MOTION_IDEAS` as the library
grows; keep each mechanism VISUALLY distinct from the others.

> **Reference build (6 distinct line-matched ideas, no repeats):**
> `src/compositions/HandDrawnGrammarRef.tsx` (id `HandDrawnGrammarRef`, 35.5s). Beats:
> §4 flow → §5 spotlight → §6 radial → §4' burst → §5' grid → §6' loop — each mirrors its
> PT-BR line. Rendered + 6-beat frame-verified. This is the pattern Phase 5 (`generate-motion-remotion`) MUST follow:
> classify each beat's meaning → pick the matching idea → never repeat a mechanism.

Reference build wiring both flagship sections: `src/compositions/SectionDemo.tsx`
(id `SectionDemo`; uses the bundled `sample_avatar.mp4` and the placeholder refs `refs/sample_page.png` +
`refs/sample_repo.png`). Render + frame-verify it after any change to `sections.tsx`.

---

## SECTION 1 — Opening Hook = MOVING SCREENSHOT + PILL HEADLINE  (0.0 – ~4.6s, MANDATORY)

> **§1 = variant V3 (the default).** The headline and the first evidence beat are
> **ONE opening beat**: the real **MOVING screenshot** in the top split panel + avatar below + a
> **`PillHeadline` banner at the CENTER / split line**. (The older standalone headline-only
> `HeadlineHook` component stays in the library for back-compat but is NOT the §1 default; a
> standalone `EvidenceReveal` is SECTION 2, used for additional proof beats in the body.)

**Job:** prove + headline in one shot — the moving screenshot is the credibility, the pill is the
clickbait thesis. Enters at frame 0 (visual hook <2s). Carries 0–~4.6s.

**Look:** top-40% panel = a real captured screenshot (`PremiumEvidence` premium / `EvidenceReveal`
hand-drawn) that MOVES (zoom or scroll); bottom 60% = avatar. Over the split line sits a
**`PillHeadline`**: a **black rounded pill, heavy ALL-CAPS sans (`SERIF`/Montserrat 800), WHITE text
with ONE YELLOW (`#F2E63B`) accent word** on the key number/brand,
snap-pops in. Default banner center `cy≈792`.

**Premium (drop-in):**
```tsx
<PremiumOpeningHook
  w={W[0]} avatarSrc={AVATAR}
  evidence={{ src:"refs/Proof.png", domain:"...", stamp:"$500", kicker:"É real",
    motion:"zoom", zoomTo:1.5, focus:{fx,fy}, focusR:{rx,ry} }}
  headline={{ lines:[[{t:"UMA IA EXIGIU"}],[{t:"US$500", accent:true}]],
    cy:792, textColor:"#FFFFFF", accentColor:"#F2E63B" }}
/>
```
Reference comp: `src/compositions/OpeningHookRef.tsx` (id `OpeningHookRef`; variant V3 is the default). The screenshot MOTION protocol
(scroll default / zoom with `--focus` / static exception) is in `generate-motion-remotion` SKILL.

**Copy rules (one formula per video — vary for feed-freshness):**
curiosity gap · bold claim · number promise · warning · news-style.
- ≤8 words across both pill lines, exactly ONE yellow accent (the key number/brand).
- **Complement rule:** the pill is a DISTILLED summary — ≤3 words shared with the first spoken
  sentence, never the spoken opening verbatim.
- **Truth rule:** every claim must be true of the video. Bold ≠ false.
- **Reference chain:** §1's screenshot satisfies the mandatory real-screenshot rule when the topic
  names a real tool. Additional evidence beats slot into the body when several real things are named.

---

## SECTION 2 — Evidence Reveal  (the real-life proof)

**Job:** the avatar makes a claim → this section SHOWS the real thing so the viewer believes it.
A live-captured screenshot framed in a browser card with a self-drawing circle on the exact region
the narration is about, and a **STAMP** carrying the hard data point (stars, price, a command, "OFICIAL").
**Use whenever the script names a real thing.**

**SPLIT — screenshot in the UPPER panel (important part visible, avatar
below):** render Section 2 as a **CHILD of `<HandDrawnFrame>`/`<PremiumFrame>`** (it sits in the
top-40% panel; the avatar shows in the bottom 60% and carries the audio). The card fills the panel
WIDTH (cardW 1008) and shows the screenshot **width-bound + top-anchored** (CSS `width:100%`,
`height:auto`, top-clipped) so NOTHING is cropped horizontally — the important top-of-page content is
always fully visible and readable. The card geometry is mirrored in `reference-pipeline/prepare_reference_shot.py`
(CARD_W 1008 / CARD_H 594 / BAR_H 46) so `--focus` prints the exact `focus`/`focusR` that lands the
circle on the real element (its `visible:false` warns if the element is below the top window → recapture scrolled/tighter).

The screenshot **MOVES**: `motion="scroll"` (DEFAULT — needs a full-page
capture; pass `scroll` from `prepare_reference_shot.py` + `durFrames`), `motion="zoom"` (the 2ND beat —
aggressive push into `focus`, no scroll, `zoomTo`), or `motion="static"` (EXCEPTION — nothing below the
hero / a fixed proof; keeps the draw-on circle+arrow). Cadence with multiple beats: 1st scroll, 2nd zoom.

```tsx
{/* CHILD of the frame — sits in the top panel, avatar shows below */}
<HandDrawnFrame avatarSrc={AVATAR}>
  <Sequence from={0} durationInFrames={F(3)}>{/* Section 1 headline */}</Sequence>

  {/* evidence #1 — SCROLL (default): page scrolls; circle auto-hidden */}
  <Sequence from={F(3)} durationInFrames={F(4)}>
    <EvidenceReveal kicker="A SKILL É REAL" src="refs/sample_page.png" domain="example.com"
      motion="scroll" scroll={1100} durFrames={F(4)}
      stamp="1 COMANDO" caption="VÍDEO FEITO COM CÓDIGO" />
  </Sequence>

  {/* evidence #2 — ZOOM into the exact detail (no scroll) */}
  <Sequence from={F(7)} durationInFrames={F(4)}>
    <EvidenceReveal kicker="OLHA O DETALHE" src="refs/sample_page.png" domain="example.com"
      motion="zoom" zoomTo={2.4} durFrames={F(4)}
      focus={{ fx: 300, fy: 250 }} focusR={{ rx: 220, ry: 64 }}
      stamp="AQUI" caption="UM COMANDO SÓ" />
  </Sequence>
</HandDrawnFrame>
{/* premium: <PremiumEvidence ... /> identical props, also a PremiumFrame child */}
```

**Evidence kinds it shows (all REAL captures — NO AI generation):**
site homepage · app screenshot · **GitHub repo** (stars circled) · platform logo (`fit="contain"`) ·
pricing page (the price circled) · news headline · a research/benchmark screenshot.

**Sourcing (non-skippable when the script names a real entity — `PIPELINE_DIRECTIVES.md` §2):**
1. Find the canonical URL (WebSearch if unsure).
2. Capture live: Playwright MCP `browser_resize(1280,860)` → `browser_navigate(url)` →
   `browser_take_screenshot(png)`. **LOOK at the image** — right page, loaded, no cookie/login wall.
3. `python3 reference-pipeline/prepare_reference_shot.py <shot>.png --name <PascalCase>` → `public/refs/`.
4. Wire `<EvidenceReveal src="refs/<Name>.png" .../>`. Set `focus` on the proof region; `stamp` = the number.

**Rules:** real captures only; public pages only (never log in); circle the SPECIFIC proof
(the command / the price / the stars), not the whole page; one card per section; PT-BR copy;
40/60 layout + safe zone respected; legible on a phone. An un-annotated screenshot is a wasted beat.

**Multiple evidence beats are encouraged** when several real things are named (e.g. the tool's site
AND its GitHub) — stack 2–3 `EvidenceReveal` sequences back-to-back.

---

## SECTION 3 — Full-Frame Avatar  (the breather, right after the evidence)

**Job:** after the dense headline + evidence beats, the avatar **pulls back to fill the ENTIRE
1080×1920 frame** — no paper, no motion graphics, no b-roll. Just the person talking, carried by the
**normal burned subtitles** (Phase 8, over the whole video). A deliberate pace change that lets a key
line land and gives the eye a rest.

```tsx
// ROOT must be <AbsoluteFill>; this is an OVERLAY sibling AFTER <HandDrawnFrame>.
<Sequence from={F(7)} durationInFrames={F(4)}>
  <FullFrameAvatar
    avatarSrc="<video-name>.mp4"
    trimBeforeFrames={F(7)}     // = this Sequence's `from` — keeps the avatar synced to the base audio
    // PRODUCTION: omit sampleCaption — Phase 8 burns the real subtitles. (sampleCaption is DEMO-only.)
  />
</Sequence>
```

**Why an overlay (read this before building):** `HandDrawnFrame` clips its children to the top 40%,
so a full-frame avatar cannot live inside it. `FullFrameAvatar` is a **sibling `<Sequence>` placed
AFTER `<HandDrawnFrame>` at the root `<AbsoluteFill>`**. The base `HandDrawnFrame` keeps the avatar
**audio** playing continuously; the overlay shows the full-frame (a different crop of the SAME video),
**muted** and time-synced via `trimBefore` so the lips match the base audio. During its window it
covers the frame → full-frame avatar. **No motion scene is scheduled in the paper area** during this
window (leave it empty in the visual plan).

**Rules:**
- NO motion graphics, NO b-roll, NO paper — only the avatar + the normal subtitle.
- `trimBeforeFrames` MUST equal the wrapping Sequence's `from` (else the lips desync from the audio).
- Subtitles come from the **Phase-8 burn** over the whole video — the motion comp adds NONE in
  production. `sampleCaption` exists ONLY to preview the look in standalone demos.
- Keep it short (≈3–5s) — it's a breather, not the whole video. Use it for ONE landing line.

---

## Component contracts (content-only props)

`HeadlineHook`  — `{ kicker, lead: string[], accent, live?, leadSize?, accentSize? }`
`EvidenceReveal` — `{ kicker, src, domain?, focus?{fx,fy}, focusR?{rx,ry}, stamp?, caption?, fit? }`

Self-annotating: both sections draw their own circles/underlines/arrows — the caller never passes
full-frame coordinates except the `focus` point on the evidence card. Add a new section by writing a
new component in `sections.tsx`, exporting it from `library/index.ts`, and slotting it in order.

---

## Universal rules (every section, style-agnostic)
- Top 40% paper motion / bottom 60% avatar; fps 25; ≤15 words on screen at once.
- ONE bounce accent per section; snap-settle everything else; nothing static >1.5s (breathe).
- Complement rule: ≤3 words shared with the concurrent subtitle, never 4+ consecutive.
- NO emoji (`HD_ICONS` line icons only); NO AI-generated images/video; real captures + real stock only.
- (When QC is enabled) Gemini QC (Phase 10) stays the FINAL authority on quality.

---

## Additional rules (validated on a full-pipeline run at QC 100/100)

- **Section 1 headline = CENTERED IN THE TOP PANEL (split kept):** `HeadlineHook` renders
  the FULL headline at frame 0 (`instant`), **ALL CAPS**, **all words the SAME size** (single `size`
  prop, default 84 — no separate lead/accent sizes), **centered horizontally AND vertically within the
  top-40% paper panel** (the "upper part"). It stays a **CHILD of `<HandDrawnFrame>`** so the SPLIT is
  preserved — the avatar shows in the bottom 60% during the headline. The accent word stays marker-red
  with draw-on detail FX (highlight/circle/underline), same size as the rest. `fullFrame` (default
  FALSE) centers in its container; pass `fullFrame={true}` only for a full-frame title-card overlay.
  `instant={false}` for the old element-by-element draw-on. (`HandWord` gained an `instant` prop.)
- **Section 3 avatar ZOOM-PUNCH (default ON) + DIRECTION:** every `FullFrameAvatar` beat
  fast-zooms (~0.3s, easeOutCubic, origin 50%/38%) then HOLDS. `direction="in"` (default) = full→zoomed
  punch-in; `direction="out"` = zoomed→full pull-back. **Alternate per avatar occurrence — #1 in, #2 OUT,
  #3 in** (house rule). Props `zoom` (default true) / `zoomTo` (1.16) / `direction`. (QCR-081)
- **Screenshot CIRCLE TARGETING (mandatory):** the EvidenceReveal / ScreenshotCard draw-on circle MUST
  ring the ACTUAL main element (hero/logo/price/headline), never empty space. Compute the exact
  `focus={fx,fy}` + `focusR={rx,ry}` with `reference-pipeline/prepare_reference_shot.py --focus "sx,sy"
  --focus-size "w,h"` (LOOK at the capture, read off the element's pixel). (QCR-082)
- **Semantic icons:** `HD_ICONS` now has `coin, eye, cursor, ad, loader, lock` (+ the originals) so a
  motion idea can depict the concrete thing being said. NO emoji. (QCR-083)
- **Reference build:** `src/compositions/HandDrawnGrammarRef.tsx` — the hand-drawn grammar with distinct
  line-matched motion ideas (no adjacent repeats). On a REAL ~60s narration the same grammar produced
  12 sections, 7 distinct line-matched motion ideas, avatar zoom ×3 (alternating in/out) and a targeted
  screenshot circle on the named tool's hero — that is the target shape of a full-length build.
- **QC + validation for this grammar:** grade with the GRAMMAR-AWARE reference card (QC_INSTRUCTIONS
  QCR-085) and run `validate_subtitles.py --section-grammar` (QCR-084) — the stock 40/60 card / 1450
  threshold false-flag the full-frame sections.

---

## PREMIUM / CLASSIC style + MULTI-ELEMENT concepts

The young/glossy look (bright marker red, sparkles, one big cartoon object centered) reads
LOW-EFFORT. Premium motion beats use the **premium system** (`src/library/premium.tsx`) instead:

- **Assets = premium/classic, NOT glossy cartoon.** Generate them with editorial descriptors —
  "antique / matte / brushed metal / marble / museum-quality / soft studio lighting / minimalist /
  muted luxe palette / fine detail / product render". (e.g. a classical MARBLE BUST for intelligence,
  an ANTIQUE embossed coin for money, a matte black+gold padlock for privacy.) Still generated on chroma green → `image-pipeline/chroma_key.py`.
- **Compose 2–5 ELEMENTS per scene, with hierarchy + depth** — a hero asset + a depth element
  (smaller, blurred, lower opacity) + a vector accent (an ascending line / orbit ring / shield +
  blocked tokens) + refined serif type. NEVER one big object alone — that's the low-effort tell.
- **Look:** warm marble-paper bg + a thin gold double-rule editorial frame, Cormorant Garamond serif
  (small-caps letter-spaced labels + large display numerals + italic accents), muted antique-gold palette.
- **Motion:** RESTRAINED — slow fade-rise + gentle parallax drift + line draw-ons. NO bouncy springs,
  NO sparkles, NO marker highlights. Restraint reads premium.

Toolkit (`premium.tsx`, exported): `PremiumBg` · `PremiumLabel` · `PremiumDisplay` · `PremiumAsset`
(refined motion + `depth` for layering) · `PremiumGraph` · `useFadeRise` · `PREM` palette · `SERIF`.
Reference comps (each scene a distinct premium concept composed from the toolkit): `PremiumSectionRef.tsx`,
`PremiumOpeningDemo.tsx`, `SplitFlowDemo.tsx`, `FullFlowDemo.tsx`. Typical concepts: a coin + stack + revenue line +
"50%" for money; a marble bust + orbit + "pensando…" for AI; a padlock + shield + blocked code tokens for privacy.

### Premium — IMAGE-ICONS replace line icons
House rule: instead of ready-made code icons in motions, generate images. So in the PREMIUM
style, the per-element graphics are NOT code-drawn `HD_ICONS` line icons — they are keyed
IMAGES from the image provider too. Generate a cohesive premium icon set (matte antique gold, minimalist,
on green → `image-pipeline/chroma_key.py`) with `generate-image-assets` into `public/assets/icons/` (optional, once) and compose them with:
- `PremiumImageIcon` (a keyed image + small-caps serif label + soft shadow), and
- `PremiumFlow` (a row of image-icons joined by thin gold drawing connectors) — the premium
  replacement for `FlowDiagram` (e.g. doc → key → coin, "No automático").
No icon set ships with the package — generate yours once with `generate-image-assets` into
`public/assets/icons/` (e.g. doc · gear · hourglass · eye · cursor · key, plus hero objects like coin/stack/bust/
lock/megaphone); `public/assets/sample/` holds 4 placeholder cutouts (robot/coin/clock/lock) for the demos. When the model puts the object on a studio/gray backdrop instead of green, RE-PROMPT with
"the ENTIRE background is one solid flat pure chroma green, nothing else" and regenerate.
