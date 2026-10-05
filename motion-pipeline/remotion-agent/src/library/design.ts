import { Easing, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

// ─── Fonts (V8) ──────────────────────────────────────────────────────────────
// Anton: condensed ultra-bold display — all headlines/stats. Weight 400 only.
// Space Grotesk: labels, kickers, supporting copy.
// Bundled locally in public/fonts/ — no network fetch at render time
// (runtime Google Fonts loads caused delayRender page-load timeouts).
loadFont({ family: "Anton", url: staticFile("fonts/Anton-Regular.ttf"), weight: "400" });
loadFont({ family: "Space Grotesk", url: staticFile("fonts/SpaceGrotesk.ttf") });
export const FONTS = {
  display: "Anton",
  text: "Space Grotesk",
} as const;

// ─── Palettes ────────────────────────────────────────────────────────────────
// Pick ONE palette per video. Never mix accents across palettes in one video.
export const PALETTES = {
  ember: {
    bg: "#0b0608",
    bgGlow: "#2a0e12",
    ink: "#fff7f2",
    accent: "#ff5c38",
    accent2: "#ffb020",
    dim: "rgba(255,247,242,0.42)",
    line: "rgba(255,92,56,0.35)",
  },
  voltage: {
    bg: "#05070f",
    bgGlow: "#0d1530",
    ink: "#f2f7ff",
    accent: "#00e5ff",
    accent2: "#a78bfa",
    dim: "rgba(242,247,255,0.42)",
    line: "rgba(0,229,255,0.35)",
  },
  acid: {
    bg: "#060a06",
    bgGlow: "#0e2012",
    ink: "#f4fff6",
    accent: "#00ffa3",
    accent2: "#eaff00",
    dim: "rgba(244,255,246,0.42)",
    line: "rgba(0,255,163,0.35)",
  },
  royal: {
    bg: "#0a0712",
    bgGlow: "#1b1033",
    ink: "#f6f2ff",
    accent: "#a78bfa",
    accent2: "#ff7ad9",
    dim: "rgba(167,139,250,0.42)",
    line: "rgba(167,139,250,0.35)",
  },
} as const;

export type Palette = (typeof PALETTES)[keyof typeof PALETTES];

// ─── Type scale (motion area is 1080w × ~438px usable) ──────────────────────
// Anton is condensed: same point size fills less width than Arial Black,
// so sizes are bumped vs V7. Hierarchy through SIZE not through more words.
export const TYPE = {
  mega: {
    fontSize: 132,
    fontWeight: 400,
    letterSpacing: "0em",
    lineHeight: 0.94,
    fontFamily: FONTS.display,
    textTransform: "uppercase" as const,
  },
  title: {
    fontSize: 96,
    fontWeight: 400,
    letterSpacing: "0.01em",
    lineHeight: 0.98,
    fontFamily: FONTS.display,
    textTransform: "uppercase" as const,
  },
  label: {
    fontSize: 32,
    fontWeight: 600,
    letterSpacing: "0.24em",
    lineHeight: 1.1,
    fontFamily: FONTS.text,
    textTransform: "uppercase" as const,
  },
  kicker: {
    fontSize: 34,
    fontWeight: 600,
    letterSpacing: "0.34em",
    lineHeight: 1.1,
    fontFamily: FONTS.text,
    textTransform: "uppercase" as const,
  },
  stat: {
    fontSize: 150,
    fontWeight: 400,
    letterSpacing: "0em",
    lineHeight: 1,
    fontFamily: FONTS.display,
  },
} as const;

// ─── Springs (V8 vocabulary) ─────────────────────────────────────────────────
// SNAP is the house default for ALL entrances (research-verified: Remotion's
// official TikTok template + Onda both use heavily-damped no-overshoot
// settles — bounce everywhere reads amateur). Pair with SNAP_DUR frames.
// ACCENT (the old bouncy punch) is RATIONED: at most ONE accent moment per
// scene — the hero number, the one keyword. Never two bouncy elements at once.
export const SPR = {
  snap: { damping: 200 },                            // DEFAULT entrance: confident settle, zero bounce
  accent: { damping: 14, stiffness: 220, mass: 0.8 },// rationed: max ONE per scene
  punch: { damping: 14, stiffness: 220, mass: 0.8 }, // back-compat alias of accent (old comps)
  settle: { damping: 26, stiffness: 170, mass: 1 },  // secondary elements, draw-ons
  soft: { damping: 200 },                            // drifts, no overshoot
  pop: { damping: 10, stiffness: 300, mass: 0.6 },   // tiny accents (icon pops)
} as const;

export const SNAP_DUR = 5; // frames — snap entrances settle in ~0.2s @25fps

// ─── Easings ─────────────────────────────────────────────────────────────────
export const EASE = {
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  inOutStrong: Easing.bezier(0.83, 0, 0.17, 1),
  whip: Easing.bezier(0.85, 0, 0.15, 1),
} as const;

// ─── Velocity-matched overshoot (Dan Ebberts' AE expression, ported) ────────
// For a DELIBERATE overshoot hit: run a clamped base animation, then add this
// on top after it ends. amp = the animation's velocity at its end frame
// (finite difference × fps), so fast moves overshoot more — that's what makes
// it read pro instead of a canned bounce.
//   const base = interpolate(frame, [0, 8], [0, 300], {extrapolateRight: "clamp", easing: EASE.outExpo});
//   const x = base + overshoot(vAtEnd(f => ...), frame - 8, fps);
export const overshoot = (
  velocity: number, // px/second at the moment the base animation ends
  framesSinceEnd: number,
  fps: number,
  freq = 3, // oscillations per second
  decay = 6 // higher = dies faster
): number => {
  if (framesSinceEnd <= 0 || velocity === 0) return 0;
  const t = framesSinceEnd / fps;
  const w = freq * Math.PI * 2;
  return (velocity * Math.sin(t * w)) / Math.exp(decay * t) / w;
};

// ─── Timing constants (fps 25) ───────────────────────────────────────────────
export const TIMING = {
  entranceFrames: 6,  // snap entrances (V8 — was 12)
  exitFrames: 8,      // ~0.3s exit before a b-roll cut
  stingerFrames: 7,   // impact flash on cut-back from b-roll
  chromaticFrames: 8, // RGB split collapse on scene open
} as const;
