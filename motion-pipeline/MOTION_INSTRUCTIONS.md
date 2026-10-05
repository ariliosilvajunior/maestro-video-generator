# Motion Graphics Pipeline — Complete Instructions

> **STRUCTURE: Read `SECTION_PIPELINE.md` FIRST.** Every
> hand-drawn video follows the 6-SECTION REPEATING GRAMMAR (1 Headline → 2 Evidence → 3
> AvatarOnly → 4 Motion+Text → 5 SplitGraphics-noText → 6 FullGraphics-noText, then repeat
> 3→6). Each motion beat hosts ONE MOTION IDEA from `src/library/motionideas.tsx`, chosen to
> MATCH the spoken line, and **no idea repeats** (`assertVariety` throws if it does). This
> supersedes the older "Section 4 = FlowDiagram / Section 5 = payoff" wording below.

> **V7+: Read `MOTION_DESIGN_SYSTEM.md` FIRST.** It defines (1) the
> **visual-plan protocol** — b-roll windows are decided BEFORE the composition is built
> and motion scenes are scheduled ONLY in the gaps (b-rolls replace the full frame, so
> anything else gets covered/chopped) — and (2) the premium library at
> `motion-pipeline/remotion-agent/src/library/` (AmbientBg, CameraRig, Stinger,
> speech-synced KineticWords, PunchTitle, CountUp, DrawBars, IconDraw, GlassCard),
> which is MANDATORY. Where this file's "Quality Standard (V4+)" conflicts with the
> design system, the design system wins.

## Overview

This pipeline adds animated motion graphics to the **top 40%** of the video frame using **Remotion** (React-based programmatic video). The bottom 60% shows the original HeyGen avatar video. Motion graphics are synced to the video's transcript content, creating professional data-viz and kinetic typography overlays.

**This step runs AFTER HeyGen video generation and BEFORE subtitles.**

---

## Prerequisites

| Tool | Path / Install | Purpose |
|------|---------------|---------|
| **Node.js 18+** | System | Remotion runtime |
| **Remotion project** | `motion-pipeline/remotion-agent/` | Motion graphics codebase (run `npm install` there once; `python3 bin/doctor.py` checks it) |
| **@remotion/noise** | Installed in project | Procedural noise for organic animations |
| **transcribe_gemini_srt.py** | `subtitle-pipeline/transcribe_gemini_srt.py` (Gemini API) | Transcribe video to understand content (the local `whisper` CLI is never used for the SRT). |

---

## Architecture

### Video Frame Layout (1080×1920)
```
┌─────────────────────┐
│   MOTION GRAPHICS   │ ← Top 40% (768px) — animated overlays
│    (Remotion)        │
│                      │
├──── feather blend ───┤ ← 60px gradient for smooth transition
│                      │
│   AVATAR VIDEO       │ ← Bottom 60% (1152px) — HeyGen footage
│   (OffthreadVideo)   │   Original quality, no zoom
│                      │
│   SUBTITLES HERE     │ ← MarginV=440 from bottom (at ~pixel 1480)
│                      │
└─────────────────────┘
```

### Key Constants
| Constant | Value | Purpose |
|----------|-------|---------|
| `MOTION_RATIO` | `0.4` | Top 40% = motion graphics |
| `motionH` | `768px` | Height of motion area (1920 × 0.4) |
| `SAFE_TOP` | `0.38` | Content starts at 292px from top (clears all platform UIs) |
| `BOTTOM_PAD` | `0.05` | 5% bottom padding prevents clipping |
| `fps` | `25` | Matches HeyGen output |
| `AVATAR_ZOOM` | **NONE** | No CSS zoom — use original HeyGen video at native quality |

### Usable Content Space
- Top safe zone: `mH × 0.38` = 292px from top of motion area
- Bottom padding: `mH × 0.05` = 38px from bottom of motion area
- **Usable vertical space: ~438px** for all content (titles + icons + cards + CTAs)

---

## Pipeline Steps

### Step 1: Transcribe Video via Gemini (never the local whisper CLI for the SRT)

```bash
python3 "subtitle-pipeline/transcribe_gemini_srt.py" <downloads>/<VideoName>_avatar_1080p.mp4 --output-dir <scratch> --name VideoName
```
(gemini-2.5-flash sentence-level timestamped SRT — ~10s. Run from the repo root; Gemini key auto-read from `.claude/keys.md` `## Gemini` or `GEMINI_API_KEY`.)

Parse the `.srt` to understand the video content — topics, key phrases, narrative arc. This informs what scenes to create.

### Step 2: Analyze Transcript & Plan Scenes

Read the transcript and divide it into **scenes** that match the video's narrative flow:

- For **short videos (30-60s)**: 5 scenes, ~6-12s each
- For **longer videos (60-120s)**: 8-10 scenes, ~10-13s each

Each scene should match a distinct topic or narrative beat from the transcript.

**HARD RULE — max 15 words on screen per scene.** Count EVERY word visible at once in the motion area (title + card labels + icon labels + counters). Viewers are also reading the burned subtitles below; more than 15 words in the motion zone is unreadable on a phone. Prefer 1 short title (3-6 words) + 2-4 labels of 1-3 words each. If a beat needs more text, split it into two scenes or cut words — never shrink the font to fit more.

**HARD RULE — COMPLEMENT, NOT TRANSCRIPT (no double subtitling).** The burned subtitles already transcribe every spoken word. Motion text must be a VISUAL COMPLEMENT of the narration — a distilled title, a brand name, a number, a comparison, an icon — never a repetition of the sentence being spoken. Per scene: max 3 words shared with the concurrent SRT segment(s), never 4+ consecutive words of the spoken sentence. KineticWords full-sentence transcription is FORBIDDEN — use it only as a speech-synced keyword burst (3-6 distilled keywords). Full rule: `MOTION_DESIGN_SYSTEM.md` §2.5. Before rendering, check every scene's text against the SRT segments playing under it.

**MANDATORY before planning scenes — write the visual plan (no-overlap protocol):**
Pick the 4 b-roll windows FIRST (hook at 3.0s — right after the S0 headline — + 3 at
sentence boundaries in ~9-32s, 5s each, ≥2s gaps) and write
`<downloads>/<VideoName>_visual_plan.json` with `broll_windows` + `motion_segments`
(exact schema in `MOTION_DESIGN_SYSTEM.md` §1). Motion scenes are scheduled ONLY
inside `motion_segments` — never across a b-roll window. Phase 4 (`select-brolls-stock`) consumes the same
file via `select_stock_brolls.py --plan-file`.

**Scene planning template (each scene = one motion_segment):**
```
Scene 0 (0-3.0s):   HEADLINE BANNER — clickbait theme headline (HeadlineBanner,
                    MOTION_DESIGN_SYSTEM.md §2.6; enters frame 0 — QC needs a hook <2s)
Scene 1 (8-12.5s):  [TOPIC] — [library components: KineticWords/PunchTitle/DrawBars/...]
...                  (gaps 3-8s etc. are b-roll windows — leave the motion layer empty)
```
Scenes starting at a b-roll cut-back open with `<Stinger>`; scenes ending at a b-roll
window exit via `CameraRig exit`.

### Step 3: Create Remotion Composition

Create a new `.tsx` file in `motion-pipeline/remotion-agent/src/compositions/`.

**Naming convention:** `<VideoName>.tsx` (PascalCase, no underscores — e.g. `AgentesGratis.tsx`)

#### Mandatory File Structure

```tsx
import React, { useMemo } from "react";
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, spring, Sequence, Easing,
  random, OffthreadVideo, staticFile,
} from "remotion";
import { noise2D } from "@remotion/noise";

// 1. DESIGN TOKENS (colors, springs, constants)
// 2. SceneLayout wrapper (enforces safe zones + flex)
// 3. Background primitives (gradients, particles)
// 4. Content primitives (cards, rings, bars, icons)
// 5. SVG icon paths
// 6. Scene components (Scene1_Name, Scene2_Name, etc.)
// 7. Main composition export
```

#### SceneLayout — MANDATORY Wrapper

Every scene MUST use this wrapper. It enforces the safe zone architecture:

```tsx
const SceneLayout: React.FC<{
  mH: number;
  bg: React.ReactNode;
  children: React.ReactNode;
}> = ({ mH, bg, children }) => (
  <div style={{ position: "absolute", width: 1080, height: mH, overflow: "hidden" }}>
    {bg}
    <div style={{
      position: "absolute", width: 1080, height: mH,
      display: "flex", flexDirection: "column", alignItems: "center",
      paddingTop: mH * 0.38,
      paddingBottom: mH * 0.05,
      boxSizing: "border-box",
    }}>
      {children}
    </div>
  </div>
);
```

#### Main Composition Structure

```tsx
export const CompositionName: React.FC = () => {
  const { fps, width, height } = useVideoConfig();
  const motionH = Math.round(height * 0.4);
  const videoH = height - motionH;

  return (
    <AbsoluteFill style={{ background: "#060d0a" }}>
      {/* Video layer — bottom 60% (original quality, no zoom) */}
      <div style={{ position: "absolute", left: 0, top: motionH, width, height: videoH, overflow: "hidden" }}>
        <OffthreadVideo src={staticFile("video-name.mp4")} style={{ width, height: videoH, objectFit: "cover" }} />
      </div>
      {/* Motion layer — top 40% */}
      <div style={{ position: "absolute", left: 0, top: 0, width, height: motionH, overflow: "hidden" }}>
        <Sequence from={0} durationInFrames={s1}><Scene1 mH={motionH} /></Sequence>
        {/* ... more scenes ... */}
      </div>
      {/* Feather blend */}
      <div style={{ position: "absolute", left: 0, top: motionH - 30, width, height: 60, background: "linear-gradient(to bottom, #060d0a 0%, transparent 100%)", pointerEvents: "none", zIndex: 10 }} />
    </AbsoluteFill>
  );
};
```

### Step 4: Copy Source Video to Public Folder

```bash
cp <downloads>/<VideoName>_avatar_1080p.mp4 motion-pipeline/remotion-agent/public/video-name.mp4
```

The `staticFile("video-name.mp4")` call in the composition reads from this folder.

### Step 5: Register in Root.tsx

The pipeline does this for you with `python3 maestro_state.py register-comp --name <VideoName> --duration <seconds>` (a locked insert into `motion-pipeline/remotion-agent/src/Root.tsx`; `--duration` = the audio length in seconds). Doing it by hand means adding the import and `<Composition>` to `motion-pipeline/remotion-agent/src/Root.tsx`:

```tsx
import { CompositionName } from "./compositions/CompositionName";

// Inside RemotionRoot:
// CRITICAL: Use Math.ceil + 25 frames (1s buffer) to prevent video cutoff.
// Get exact duration via: ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video.mp4
<Composition
  id="CompositionName"
  component={CompositionName}
  durationInFrames={Math.ceil(EXACT_DURATION_SECONDS * 25) + 25}
  fps={25}
  width={1080}
  height={1920}
/>
```

### Step 6: Render

```bash
cd motion-pipeline/remotion-agent && npx remotion render src/index.ts CompositionName <downloads>/VideoName_motion.mp4 --codec h264 --crf 16 --timeout 300000 --concurrency 3
```

- `--crf 16` = high quality (lower = better, 18 is also good)
- `--timeout 300000 --concurrency 3` are MANDATORY (QCR-275 / QCR-249): the default 30s `delayRender` times out on font loading mid-render, and a heavy frame starves a render tab at concurrency 2 — see `generate-motion-remotion` step 4
- Output goes to `<downloads>/` (never the project root)
- Rendering 2683 frames (107s) takes ~2 min; 823 frames (33s) takes ~30s

### Step 7: Frame Verification (MANDATORY)

**After every render, you MUST extract and visually inspect frames before proceeding.** This prevents avatar sizing/positioning bugs from reaching the final output.

```bash
# Extract 3 frames at different points (early, mid, late)
ffmpeg -y -i <downloads>/VideoName_motion.mp4 \
  -ss 5 -frames:v 1 <scratch>/frame_check_5s.png \
  -ss 25 -frames:v 1 <scratch>/frame_check_25s.png \
  -ss 40 -frames:v 1 <scratch>/frame_check_40s.png
```

Then use the `Read` tool on each PNG to visually verify:

**Checklist (ALL must pass):**
| Check | Expected | Fail Action |
|-------|----------|-------------|
| **Person visible** | Person clearly visible in the bottom 60% area | Check video file and objectFit |
| **No head clipping** | Full head visible, not cut at top or bottom | Verify video dimensions match |
| **Motion/video boundary** | Clean transition between motion area and video | Check feather blend gradient |
| **No face obscured** | Subtitles won't cover the person's face at final MarginV | Verify subtitle zone is below face |

**If any check fails:** Verify the video file and composition settings. Do NOT proceed to subtitles until all checks pass.

**CRITICAL DESIGN RULE:** Subtitles go BELOW the face (chest/chin level), NOT above the head. The avatar video is shown at original quality with no zoom — `objectFit: "cover"` handles framing automatically.

---

## Quality Standard (V4+)

Every composition MUST include:

### Visual Elements
- **Aurora gradient backgrounds** — animated multi-color radial gradients with noise-driven motion
- **Floating particles** — procedural particle systems using `random('seed')` with deterministic seeds
- **Real SVG icon drawing** — hand-crafted SVG paths with strokeDashoffset animation (NEVER emoji)
- **Glass cards** — `backdrop-filter: blur()` + semi-transparent backgrounds + subtle borders
- **Neon glow effects** — multi-layer `boxShadow` / `filter: drop-shadow()` with color-matched glows

### Animation Principles
- **Spring physics on ALL movements** — `spring()` with tuned damping/mass configs
- **Staggered timing** — 3-8 frame delays between sequential elements
- **Cinematic easing** — `Easing.bezier(0.16, 1, 0.3, 1)` for smooth deceleration
- **Always clamp** — `extrapolateLeft: "clamp", extrapolateRight: "clamp"` on every `interpolate()`

### Spring Presets
| Name | Config | Use Case |
|------|--------|----------|
| smooth | `{ damping: 200 }` | Professional reveals |
| snappy | `{ damping: 20, stiffness: 200 }` | UI elements |
| bouncy | `{ damping: 8 }` | Playful entrances |
| elastic | `{ damping: 5, stiffness: 300 }` | Extreme overshoot |
| heavy | `{ damping: 15, stiffness: 80, mass: 2 }` | Weighted movement |

### Size Minimums (Phone Readability)
| Element | Minimum |
|---------|---------|
| Title text | 52-60px |
| Subtitle/description | 22px |
| Icon labels | 16-18px |
| Icon circles | 100-120px diameter |
| SVG icons | 48-56px |
| Glass card text (primary) | 22px |
| Card text (secondary) | 16px |
| Progress bar labels | 18px |
| Counter numbers | 48px |
| NEVER any text below | 16px |
| Words visible at once (per scene) | **15 max — hard cap** (split the scene rather than exceed) |

### Language
**ALL text MUST be in `config.brand.language` (default pt-BR — Brazilian Portuguese).** Never English unless explicitly requested.

---

## Layout Architecture (MANDATORY)

### Content Layer Rules
- Background effects (grids, particles, blobs): `position: absolute`
- All visible content: `display: flex; flexDirection: column; alignItems: center`
- Horizontal groups: `display: flex; justifyContent: center; gap: 12-40px`
- **NEVER** use `position: absolute` with manual pixel math for content layout
- **NEVER** use `marginTop: "auto"` — it pushes elements to the container edge where they clip
- Use fixed `marginTop: 16-24px` between content groups

### Vertical Budget
Before writing a scene, calculate total height:
- Title block: ~80-90px
- Icon group (with label): ~150-170px
- Progress ring (with label): ~120-130px
- Glass card CTA: ~56-64px
- Progress bar (with label): ~50px
- Gap between groups: 16-24px each
- **Total must be ≤ 438px** (usable vertical space)

### FORBIDDEN (Zero Tolerance)
- `marginTop: "auto"` — causes clipping
- Full-frame color overlays (flash, fade-to-white) — looks like rendering bug
- `transform: scale()` on content wrapper divs — causes edge clipping
- CSS animations, CSS transitions, Tailwind animate classes
- RGB channel duplication for glitch effects
- `Math.random()` — use `random('seed')` from Remotion
- Emoji as icons
- `interface` for props typing — use `type`
- Font sizes below 16px
- Manual pixel math for content positioning

---

## Scene Design Patterns

### Pattern 1: Title + Card Grid (2×2 or Vertical List)
Best for: listing professions, tools, features
```
Title (52-60px) + subtitle (22px)
↓ marginTop: 18-20px
Flex grid (gap: 12px, width: 760px)
  → Card 1 (h: 58-62px, icon + label)
  → Card 2
  → Card 3
  → Card 4
```

### Pattern 2: Title + Stat Rings Row
Best for: percentage data, progress indicators
```
Title + subtitle
↓ marginTop: 22px
Flex row (gap: 36-40px)
  → Ring 1 (radius: 40, label below)
  → Ring 2
  → Ring 3
```

### Pattern 3: Title + Icon Pair (Converging)
Best for: comparisons, Human+AI fusion
```
Title + subtitle
↓ marginTop: 20px
Flex row (animated gap)
  → Left icon (110px circle + label)
  → Plus/VS badge
  → Right icon (110px circle + label)
↓ marginTop: 22px
CTA card (glass card with accent text)
```

### Pattern 4: Title + Progress Bars
Best for: skill levels, tech specs, rankings
```
Title + subtitle
↓ marginTop: 20px
Flex column (gap: 12-14px, width: 740px)
  → Bar 1 (label + fill + percentage)
  → Bar 2
  → Bar 3
  → Bar 4
```

### Pattern 5: Title + Central Icon + CTA
Best for: emotional moments, reveals, focus points
```
Title + subtitle
↓ marginTop: 18px
Central icon (120px circle with glow)
↓ marginTop: 18px
CTA card (quote or statement)
```

---

## Reference Compositions

Reference compositions demonstrating the rules and patterns (all shipped in `src/compositions/`):

| File | Theme |
|------|-------|
| `PremiumSectionRef.tsx` | Premium-classic canonical (copy this — DEFAULT) |
| `OpeningHookRef.tsx` | §1 opening hook reference (moving screenshot + pill headline; variant V3 is the default) |
| `PremiumOpeningDemo.tsx` | `<PremiumTheme>` + full-frame `PremiumEvidence` wiring |
| `SplitFlowDemo.tsx` / `FullFlowDemo.tsx` | §5 `PremiumSplitFlow` / §6 `PremiumFullFlow` animation-depth variants |
| `HandDrawnGrammarRef.tsx` / `SectionCycleDemo.tsx` | Hand-drawn 6-section grammar (fallback look) |
| `HandDrawnTemplate.tsx` | Hand-drawn toolkit reference |
| `SectionDemo.tsx` / `RefShotDemo.tsx` | Flagship sections on the sample avatar / annotated real-screenshot card |
| `LibraryDemo.tsx` / `LottieDemoV8.tsx` / `MotionLabV8.tsx` | V8 library demos (core components / Lottie accents / blur, type, stinger, parallax, fps labs) |

---

## Remotion Gotchas

| Issue | Solution |
|-------|----------|
| `useCurrentFrame()` in Sequence returns LOCAL frame | Local to the Sequence start, not global |
| `evolvePath()` fails on SVG arcs | Use `strokeDasharray`/`strokeDashoffset` instead |
| All `@remotion/*` versions must match | Check package.json for version consistency |
| `interpolate()` extrapolates by default | Always add `extrapolateLeft/Right: "clamp"` |
| `<AbsoluteFill>` stacking | LAST child renders ON TOP |
| `random()` needs string seed | `random('uniqueSeed')` — NEVER `Math.random()` |
