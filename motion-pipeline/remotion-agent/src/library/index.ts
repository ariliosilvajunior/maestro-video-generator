export { PALETTES, TYPE, SPR, EASE, TIMING, FONTS, SNAP_DUR, overshoot } from "./design";
export type { Palette } from "./design";
export { AmbientBg } from "./AmbientBg";
export { CameraRig } from "./CameraRig";
export { KineticWords } from "./KineticWords";
export type { TimedWord } from "./KineticWords";
export { PunchTitle } from "./PunchTitle";
export { CountUp } from "./CountUp";
export { DrawBars } from "./DrawBars";
export type { Bar } from "./DrawBars";
export { IconDraw } from "./IconDraw";
export { GlassCard } from "./GlassCard";
export { Stinger } from "./Stinger";
// V8 additions
export { HeroCascade } from "./HeroCascade";
export { ParallaxStage } from "./ParallaxStage";
export { MotionBlurWrap } from "./MotionBlurWrap";
// V8.1: S0 clickbait headline banner
export { HeadlineBanner } from "./HeadlineBanner";
// V8.2: Lottie designer-grade animated accents (richer IconDraw sibling)
export { LottieIcon } from "./LottieIcon";
// DEFAULT STYLE: Hand-Drawn Annotation toolkit (owner-approved Variant08)
export {
  HD, useSnapHD, useBounceHD, PaperBg, DrawPath, MarkerHighlight, HandWord,
  CircleAnno, HandArrow, HandUnderline, HD_ICONS, FlowNode, FlowDiagram,
  StatCountUp, Kicker, ScreenshotCard, HandDrawnFrame, useHandDrawnLayout,
} from "./handdrawn";
export type { FlowStep } from "./handdrawn";
// SECTION-BY-SECTION pipeline (rebuild): named sections, content-only props
export {
  HeadlineHook, EvidenceReveal, FullFrameAvatar, BrollGraphicFrame, FullMotionFrame,
  BrollFrame, AvatarMotionFrame,
  // GRAPHICS-ONLY sections (house grammar): split panel + full-frame, NO text
  SplitGraphicMotion, FullGraphicFrame,
  // shared graphics-only vocabulary (reused by motion ideas)
  IconBadge, PulseRing, FlowDots,
  // GAP-FREE section scheduling (house rule)
  sectionWindows,
  // NO-BLANK continuation wrapper (house rule)
  Held,
} from "./sections";

// MOTION IDEAS (house rule): distinct, beat-matched motion mechanisms
// so no two sections look alike. Pick by MEANING, never repeat back-to-back.
export {
  IdeaProcessFlow, IdeaSpotlight, IdeaRadialSystem, IdeaStatBurst, IdeaGridRepeat, IdeaCycleLoop,
  IdeaHeroAsset, CutoutAsset,
  MOTION_IDEAS, assertVariety,
  // GRAMMAR GUARD (QCR-147): enforce the §3→§3b→§4→§5→§6 cycle so a video
  // can't collapse into the caption↔hero ping-pong (§5 split-graphics silently skipped).
  assertSectionGrammar, sectionTypeOf,
  // CONTENT-DRIVEN EDIT FLOW (house rule): free per-beat style selection, §1 fixed,
  // no style repeats within a window of 3. Replaces the fixed cycle for new comps.
  assertEditFlow, editStyleOf, EDIT_STYLE_IDS,
} from "./motionideas";
export type { IdeaId, Line } from "./motionideas";

// PREMIUM / CLASSIC style (house rule): editorial marble+gold look,
// Cormorant serif, RESTRAINED motion; per-element graphics are generated greenscreen-
// keyed IMAGES (PremiumImageIcon/PremiumFlow), NOT code-drawn line icons.
export {
  PREM, SERIF, useFadeRise, PremiumBg, PremiumLabel, PremiumDisplay,
  PremiumAsset, PremiumGraph, PremiumImageIcon, PremiumFlow,
  PremiumFrame, PremiumHeadline, PremiumEvidence, PremiumKineticCaption,
  // THEME-DRIVEN PALETTE (house rule): per-video color concept.
  PREMIUM_PALETTES, PremiumTheme, usePremPalette,
  // OPENING HOOK (house rule): §1 = moving screenshot
  // split + black-pill headline at the center/split line. Replaces standalone §1 headline.
  PillHeadline, PremiumOpeningHook,
  // §5/§6 GRAPHICS-ONLY SECTIONS (QCR-147): the missing premium split-graphics
  // (avatar below + graphics above) + full-graphics sections. Restore the §3→§3b→§4→§5→§6
  // cycle so videos stop collapsing into the caption↔hero ping-pong. NO baked text.
  PremRings, PremiumSplitGraphics, PremiumFullGraphics,
  // §5/§6 FLOW VARIANTS (QCR-292/293): visually-distinct 2nd §5/§6 recurrences (traveling
  // gold-rail process flow) so two §5s or §6s in one video don't look identical.
  PremiumSplitFlow, PremiumFullFlow,
  // §5b AVATAR + FLOATING CAPTION (house rule): full-frame avatar with BIG
  // Proxima word-by-word subtitles in the empty part of the frame. Sits between §5 and §6.
  PremiumAvatarCaption,
} from "./premium";
export type { PremPalette, PillSeg } from "./premium";
