import React from "react";
import {
  AbsoluteFill, Img, OffthreadVideo, staticFile, useVideoConfig, useCurrentFrame, interpolate, spring,
} from "remotion";

/* ════════════════════════════════════════════════════════════════════════════
   HAND-DRAWN ANNOTATION — the DEFAULT pipeline motion style.
   Friendly Vox/Cleo-Abram + Kurzgesagt notebook explainer: the screen is "marked
   up live" — arrows, circles, underlines DRAW THEMSELVES (stroke-dashoffset),
   flat-vector callouts build element-by-element, marker highlights swipe under key
   words. Off-white paper base, near-black ink, ONE marker-red accent. Friendly
   rounded sans. Promoted from Variant08 (the owner-approved winner).

   Reusable toolkit — import from "../library". Build a video by composing these
   inside <HandDrawnFrame avatarSrc=...>. See compositions/HandDrawnTemplate.tsx.
   ════════════════════════════════════════════════════════════════════════════ */

// ── Palette tokens ───────────────────────────────────────────────────────────
export const HD = {
  paper: "#f5f2e9", // warm off-white notebook paper
  ink: "#1b1a17", // near-black ink
  accent: "#e23b2e", // marker red (the ONE accent)
  accent2: "#f2b705", // highlighter yellow (sparing)
  dim: "rgba(27,26,23,0.42)",
  font: "'Trebuchet MS', 'Comic Sans MS', Verdana, sans-serif",
} as const;

// ── Springs ──────────────────────────────────────────────────────────────────
export const useSnapHD = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200, stiffness: 200, mass: 0.6 } });
};
export const useBounceHD = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 9, stiffness: 170, mass: 0.8 } });
};

// ── Notebook paper background: faint ruled lines + red margin + vignette ──────
export const PaperBg: React.FC<{ mH: number; width: number }> = ({ mH, width }) => {
  const lines: React.ReactNode[] = [];
  const gap = 64;
  for (let y = gap; y < mH; y += gap) {
    lines.push(<line key={y} x1={0} y1={y} x2={width} y2={y} stroke="rgba(27,26,23,0.06)" strokeWidth={2} />);
  }
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: HD.paper }} />
      <svg width={width} height={mH} style={{ position: "absolute", inset: 0 }} viewBox={`0 0 ${width} ${mH}`}>
        {lines}
        <line x1={96} y1={0} x2={96} y2={mH} stroke="rgba(226,59,46,0.18)" strokeWidth={3} />
      </svg>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(120% 90% at 50% 30%, transparent 55%, rgba(27,26,23,0.10) 100%)" }} />
    </AbsoluteFill>
  );
};

// ── Draw-on stroke: any SVG path reveals itself via dashoffset ───────────────
export const DrawPath: React.FC<{
  d: string; delay?: number; dur?: number; stroke?: string; strokeWidth?: number; len?: number; cap?: "round" | "butt" | "square"; fill?: string;
}> = ({ d, delay = 0, dur = 12, stroke = HD.accent, strokeWidth = 7, len = 600, cap = "round", fill = "none" }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={cap} strokeLinejoin="round"
      strokeDasharray={len} strokeDashoffset={len * (1 - t)} />
  );
};

// ── Marker-scribble highlight swiping under a word ───────────────────────────
export const MarkerHighlight: React.FC<{ delay?: number; color?: string; width: number; height?: number }> = ({
  delay = 0, color = HD.accent2, width, height = 26,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, bottom: 2, width: width * t, height, background: color, opacity: 0.55, borderRadius: 6, transform: "rotate(-0.8deg)", zIndex: -1 }} />
  );
};

// ── A word that snap-pops in (element-by-element builds) ──────────────────────
// `instant`: render FULLY VISIBLE at frame 0 (no pop-in) — for the
// headline that must be readable the instant the video lands. Detail effects
// (highlight/circle/underline) still animate on top of the already-visible text.
export const HandWord: React.FC<{
  children: React.ReactNode; delay?: number; color?: string; size: number; bounce?: boolean; weight?: number; instant?: boolean;
}> = ({ children, delay = 0, color = HD.ink, size, bounce = false, weight = 700, instant = false }) => {
  const snap = useSnapHD(delay);
  const b = useBounceHD(delay);
  const scale = instant ? 1 : (bounce ? interpolate(b, [0, 1], [0.85, 1]) : interpolate(snap, [0, 1], [0.85, 1]));
  const opacity = instant ? 1 : interpolate(snap, [0, 1], [0, 1]);
  return (
    <span style={{ display: "inline-block", fontFamily: HD.font, fontWeight: weight, fontSize: size, color, lineHeight: 1.04, letterSpacing: "-0.01em", transform: `scale(${scale})`, opacity, textShadow: "0 2px 0 rgba(27,26,23,0.10)" }}>
      {children}
    </span>
  );
};

// ── Hand-drawn circle annotation (sketchy ellipse that draws itself) ─────────
export const CircleAnno: React.FC<{ cx: number; cy: number; rx: number; ry: number; delay?: number; w: number; h: number; stroke?: string }> = ({
  cx, cy, rx, ry, delay = 0, w, h, stroke = HD.accent,
}) => {
  const k = 0.5523;
  const d = `M ${cx + rx} ${cy}
    C ${cx + rx} ${cy - ry * k}, ${cx + rx * k} ${cy - ry}, ${cx} ${cy - ry}
    C ${cx - rx * k} ${cy - ry}, ${cx - rx} ${cy - ry * k}, ${cx - rx} ${cy}
    C ${cx - rx} ${cy + ry * k}, ${cx - rx * k} ${cy + ry}, ${cx} ${cy + ry}
    C ${cx + rx * k} ${cy + ry}, ${cx + rx} ${cy + ry * k}, ${cx + rx + 8} ${cy - 4}`;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} viewBox={`0 0 ${w} ${h}`}>
      <DrawPath d={d} delay={delay} dur={16} len={Math.PI * (rx + ry) * 1.2} strokeWidth={8} stroke={stroke} />
    </svg>
  );
};

// ── Curved hand-drawn arrow (body + arrowhead) pointing from→to ──────────────
export const HandArrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; delay?: number; w: number; h: number; stroke?: string }> = ({
  x1, y1, x2, y2, delay = 0, w, h, stroke = HD.accent,
}) => {
  const mx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - 40;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} viewBox={`0 0 ${w} ${h}`}>
      <DrawPath d={`M ${x1} ${y1} Q ${mx} ${cy}, ${x2} ${y2}`} delay={delay} dur={11} len={Math.hypot(x2 - x1, y2 - y1) * 1.4} strokeWidth={7} stroke={stroke} />
      <DrawPath d={`M ${x2 - 24} ${y2 - 6} L ${x2} ${y2} L ${x2 - 8} ${y2 - 26}`} delay={delay + 10} dur={5} len={90} strokeWidth={7} stroke={stroke} />
    </svg>
  );
};

// ── Self-drawing wavy underline ──────────────────────────────────────────────
export const HandUnderline: React.FC<{ width: number; delay?: number; stroke?: string; y?: number; top?: number }> = ({ width, delay = 0, stroke = HD.accent, y = 40, top = 60 }) => (
  <svg width={width} height={80} style={{ position: "absolute", left: 0, top }} viewBox={`0 0 ${width} 80`}>
    <DrawPath d={`M 0 ${y} C ${width * 0.3} ${y + 18}, ${width * 0.6} ${y - 22}, ${width} ${y}`} delay={delay} dur={12} len={width * 1.1} strokeWidth={8} stroke={stroke} />
  </svg>
);

// ── Flat-vector line icons (24x24) for flow nodes — NO emoji (pipeline rule) ──
export const HD_ICONS = {
  doc: "M7 3 h7 l4 4 v14 h-15 z M14 3 v4 h4 M9 12 h7 M9 15 h7 M9 18 h4",
  play: "M9 6 L18 12 L9 18 Z",
  rocket: "M12 3 C15 6 15.5 11 12 15 C8.5 11 9 6 12 3 Z M9.5 14 l-2.5 4 l3.2 -1.2 M14.5 14 l2.5 4 l-3.2 -1.2",
  bolt: "M13 2 L5 13 h6 l-1 9 l9 -13 h-6 z",
  gear: "M12 8.5 a3.5 3.5 0 1 0 0.1 0 M12 2 v3 M12 19 v3 M4 12 h-2 M22 12 h-2 M6 6 l-1.5 -1.5 M19.5 19.5 l-1.5 -1.5 M18 6 l1.5 -1.5 M4.5 19.5 l1.5 -1.5",
  check: "M5 13 l5 5 l9 -12",
  // semantic icons — for matching concrete concepts, NO emoji
  coin: "M12 3 a9 9 0 1 0 0.1 0 M12 7.5 v9 M10 9.5 h3.5 a1.8 1.8 0 0 1 0 3.6 h-3 a1.8 1.8 0 0 0 0 3.6 h3.5",
  eye: "M2 12 C5.5 6.5 18.5 6.5 22 12 C18.5 17.5 5.5 17.5 2 12 Z M12 9 a3 3 0 1 0 0.1 0",
  cursor: "M5 3 L19 11 L12.5 12.5 L16 20 L13 21 L9.5 13.5 L5 18 Z",
  ad: "M3 10.5 v3 l11 5 V5.5 z M14 8 a4.5 4.5 0 0 1 0 8 M5 13.5 v3.5 h3 v-2.7",
  loader: "M12 2.5 v4.5 M12 17 v4.5 M2.5 12 h4.5 M17 12 h4.5 M5.3 5.3 l3.2 3.2 M15.5 15.5 l3.2 3.2 M18.7 5.3 l-3.2 3.2 M8.5 15.5 l-3.2 3.2",
  lock: "M6.5 10.5 v-2.5 a5.5 5.5 0 0 1 11 0 v2.5 M5 10.5 h14 v10 h-14 z M12 14 v3",
} as const;

export const FlowNode: React.FC<{ x: number; iconPath: string; label: string; delay: number; accent?: boolean }> = ({ x, iconPath, label, delay, accent = false }) => {
  const snap = useSnapHD(delay);
  const col = accent ? HD.accent : HD.ink;
  return (
    <div style={{ position: "absolute", left: x - 50, top: 0, width: 100, textAlign: "center", transform: `scale(${interpolate(snap, [0, 1], [0.7, 1])})`, opacity: interpolate(snap, [0, 1], [0, 1]) }}>
      <div style={{ width: 96, height: 96, margin: "0 auto", borderRadius: 20, background: "#ffffff", border: `4px solid ${col}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "4px 5px 0 rgba(27,26,23,0.18)", transform: "rotate(-1.2deg)" }}>
        <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath} />
        </svg>
      </div>
      <div style={{ marginTop: 10, fontFamily: HD.font, fontWeight: 700, fontSize: 26, color: col, letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
};

export type FlowStep = { icon: string; label: string };
export const FlowDiagram: React.FC<{ delay: number; width: number; top: number; steps: FlowStep[] }> = ({ delay, width, top, steps }) => {
  const cx = width / 2;
  const spread = 280;
  const xs = steps.length === 3 ? [cx - spread, cx, cx + spread] : steps.map((_, i) => cx + (i - (steps.length - 1) / 2) * spread);
  return (
    <div style={{ position: "absolute", left: 0, top, width, height: 140 }}>
      <svg width={width} height={140} style={{ position: "absolute", inset: 0 }} viewBox={`0 0 ${width} 140`}>
        {xs.slice(0, -1).map((x, i) => (
          <React.Fragment key={i}>
            <DrawPath d={`M ${x + 60} 48 L ${xs[i + 1] - 60} 48`} delay={delay + 8 + i * 6} dur={6} len={spread} strokeWidth={6} stroke={HD.ink} />
            <DrawPath d={`M ${xs[i + 1] - 60} 48 L ${xs[i + 1] - 78} 36 M ${xs[i + 1] - 60} 48 L ${xs[i + 1] - 78} 60`} delay={delay + 13 + i * 6} dur={4} len={50} strokeWidth={6} stroke={HD.ink} />
          </React.Fragment>
        ))}
      </svg>
      {steps.map((s, i) => (
        <FlowNode key={i} x={xs[i]} iconPath={s.icon} label={s.label} delay={delay + i * 6} accent={i === steps.length - 1} />
      ))}
    </div>
  );
};

// ── Big count-up stat (0 → `to`) with hand-drawn circle annotation ───────────
export const StatCountUp: React.FC<{ delay: number; to?: number; suffix?: string; size?: number }> = ({ delay, to = 100, suffix = "%", size = 150 }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const val = Math.round(interpolate(frame - delay, [0, 16], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const b = useBounceHD(delay);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <span style={{ display: "inline-block", fontFamily: HD.font, fontWeight: 700, fontSize: size, color: HD.accent, lineHeight: 0.92, transform: `scale(${interpolate(b, [0, 1], [0.8, 1])})`, textShadow: "0 3px 0 rgba(27,26,23,0.12)" }}>
        {val}{suffix}
      </span>
      <CircleAnno cx={155} cy={92} rx={185} ry={102} delay={delay + 16} w={width} h={260} />
    </div>
  );
};

// ── ScreenshotCard: a REAL reference screenshot in a hand-drawn browser frame ─
// For showing GitHub repos / company sites / logos / news / pricing pages captured
// live (skill `capture-references`). Pair with CircleAnno / HandArrow to mark up
// the relevant part — the Vox/Cleo-Abram "annotate a real screenshot" move.
// Image goes in public/refs/<name>.png (via prepare_reference_shot.py).
export const ScreenshotCard: React.FC<{
  src: string; // "refs/<name>.png" under public/
  delay?: number;
  width?: number;
  height?: number;
  domain?: string; // shown in the fake URL bar (e.g. "github.com/anthropics")
  tilt?: number; // degrees, default slight hand-drawn rotation
  fit?: "cover" | "contain"; // cover for pages, contain for logos
  // MOTION PROTOCOL (house rule): "scroll" (default in evidence) / "zoom" / "static".
  // When motion is set, the image is width-bound and animates inside the window.
  motion?: "scroll" | "zoom" | "static";
  scroll?: number; zoomTo?: number; durFrames?: number; focusLocal?: { x: number; y: number };
}> = ({ src, delay = 0, width = 660, height = 392, domain = "", tilt = -1.2, fit = "cover",
        motion = "static", scroll = 900, zoomTo = 1.6, durFrames = 100, focusLocal }) => {
  const snap = useSnapHD(delay);
  const scale = interpolate(snap, [0, 1], [0.9, 1]);
  const opacity = interpolate(snap, [0, 1], [0, 1]);
  const barH = 46, imgH = height - barH;
  const fr = useCurrentFrame();
  const sm = (p: number) => { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); };
  let layerT = "none";
  if (motion === "scroll") {
    // SLOWER + SMOOTHER scroll (house rule): settle briefly, then glide a SHORTER
    // distance over the same beat (fewer px/frame ⇒ clearly slower, less jumpy). Mirrors PremiumEvidence.
    const SCROLL_DELAY = 14;     // frames held still before any scroll
    const SCROLL_FACTOR = 0.58;  // travel ~58% of the requested px (slower glide)
    const p = sm((fr - SCROLL_DELAY) / Math.max(1, durFrames - SCROLL_DELAY));
    layerT = `translateY(${-scroll * SCROLL_FACTOR * p}px)`;
  } else if (motion === "zoom") {
    const e = sm((fr - 8) / (durFrames - 8));
    const fx = focusLocal?.x ?? width / 2, fy = focusLocal?.y ?? imgH * 0.4;
    const zf = 1 + (zoomTo - 1) * e;
    // clamp the visible region into the image so a near-edge element never shows blank space
    const rw = width / zoomTo, rh = imgH / zoomTo;
    let rx0 = fx - rw / 2; rx0 = Math.max(0, Math.min(width - rw, rx0));
    const ry0 = Math.max(0, fy - rh / 2);
    layerT = `translate(${(-rx0 * zoomTo) * e}px, ${(-ry0 * zoomTo) * e}px) scale(${zf})`;
  }
  return (
    <div style={{ width, transform: `scale(${scale}) rotate(${tilt}deg)`, opacity, borderRadius: 16, overflow: "hidden", background: "#fff", border: `3px solid ${HD.ink}`, boxShadow: "7px 9px 0 rgba(27,26,23,0.20)" }}>
      <div style={{ height: barH, background: "#ece8dd", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, borderBottom: `2px solid ${HD.ink}` }}>
        <div style={{ display: "flex", gap: 7 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: "1.5px solid rgba(0,0,0,0.22)" }} />
          ))}
        </div>
        {domain ? (
          <div style={{ flex: 1, marginLeft: 10, height: 26, borderRadius: 13, background: "#fff", border: `1.5px solid rgba(27,26,23,0.22)`, display: "flex", alignItems: "center", padding: "0 14px", fontFamily: HD.font, fontSize: 16, color: HD.dim, whiteSpace: "nowrap", overflow: "hidden" }}>{domain}</div>
        ) : null}
      </div>
      <div style={{ position: "relative", width, height: imgH, overflow: "hidden", background: fit === "contain" ? "#fff" : "#f6f6f4" }}>
        {motion === "static" ? (
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: "top center" }} />
        ) : (
          <div style={{ position: "absolute", left: 0, top: 0, width, transform: layerT, transformOrigin: "0 0" }}>
            <Img src={staticFile(src)} style={{ width, height: "auto", display: "block" }} />
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sticky-tab kicker (rotated marker pill) ──────────────────────────────────
export const Kicker: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <div style={{ position: "relative", marginBottom: 18, height: 56 }}>
    <HandWord delay={delay} size={30} color={HD.paper} weight={700}>
      <span style={{ background: HD.accent, padding: "8px 18px", borderRadius: 4, letterSpacing: "0.18em", transform: "rotate(-1.5deg)", display: "inline-block" }}>{children}</span>
    </HandWord>
  </div>
);

// ── Full-frame layout: paper motion area (top 40%) + avatar (bottom 60%) ──────
// Pass the per-video avatar file name (in public/) as avatarSrc. Children =
// the motion <Sequence> blocks (built from the components above).
export const HandDrawnFrame: React.FC<{ avatarSrc: string; children: React.ReactNode }> = ({ avatarSrc, children }) => {
  const { width, height } = useVideoConfig();
  const mH = Math.round(height * 0.4);
  const videoH = height - mH;
  // isolation:isolate keeps the feather's zIndex:10 INSIDE this frame — without it the
  // feather leaks to the root stacking context and paints OVER full-frame overlay sections
  // (the "white line" bug).
  return (
    <AbsoluteFill style={{ background: HD.paper, isolation: "isolate" }}>
      <div style={{ position: "absolute", left: 0, top: mH, width, height: videoH, overflow: "hidden" }}>
        <OffthreadVideo src={staticFile(avatarSrc)} style={{ width, height: videoH, objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width, height: mH, overflow: "hidden" }}>
        <PaperBg mH={mH} width={width} />
        {children}
      </div>
      <div style={{ position: "absolute", left: 0, top: mH - 30, width, height: 60, background: `linear-gradient(to bottom, ${HD.paper} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// Convenience: motion-area height + standard top padding for scene content.
export const useHandDrawnLayout = () => {
  const { height } = useVideoConfig();
  const mH = Math.round(height * 0.4);
  return { mH, padTop: Math.round(mH * 0.28) };
};
