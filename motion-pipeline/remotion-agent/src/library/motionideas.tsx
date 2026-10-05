import React from "react";
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, Img, staticFile, spring } from "remotion";
import {
  HD, useSnapHD, DrawPath, HandWord, MarkerHighlight, HandUnderline, HD_ICONS, PaperBg, CircleAnno,
} from "./handdrawn";
import { IconBadge, PulseRing, FlowDots } from "./sections";

/* ════════════════════════════════════════════════════════════════════════════
   MOTION IDEAS — a registry of DISTINCT motion mechanisms (house rule)

   THE PROBLEM THIS SOLVES: the first cut reused ONE visual idea (icon badges wired
   by lines + pulse rings) for every motion section, so the sections all looked the
   same. Two hard rules now govern motion:

     1. MATCH — the motion must ILLUSTRATE the exact line being spoken in that beat,
        not a generic icon set. Pick the idea whose mechanism mirrors the sentence's
        meaning (a sequence → flow, a number → burst, a hub → radial, a loop → cycle).
     2. VARIETY — NO motion idea repeats within a single video. Each motion beat uses
        a DIFFERENT mechanism from the one before it. (See `pickIdeas` for the picker.)

   Each idea is a self-contained component with its OWN distinct motion signature:
     IdeaProcessFlow   linear L→R progression  → sequences / "how it works" / steps
     IdeaSpotlight     ONE element wakes up     → "this one thing", focus, comes alive
     IdeaRadialSystem  centrifugal hub+spokes   → "connects everything", a core/system
     IdeaStatBurst     a single number bursts    → quantities, speed, "10x", "%"
     IdeaGridRepeat    tiled identical fill      → sameness, "every one", consistency
     IdeaCycleLoop     a dot orbits a ring       → automation, loops, "no automático"

   CANVAS vs IDEA: the SECTION decides the canvas (full-frame / split-panel-over-avatar
   / titled). The IDEA fills it. `full` → renders its own paper bg (sections 4 & 6).
   no `full` → transparent overlay for the top panel of <HandDrawnFrame> (section 5).
   `headline` present → text-bearing (section 4). Omitted → ZERO text (sections 5 & 6),
   meaning carried by motion alone; the only words are the Phase-8 burned subtitle.
   ════════════════════════════════════════════════════════════════════════════ */

export type IconKey = keyof typeof HD_ICONS;
export type Line = { text: string; accent?: boolean };
type Common = { full?: boolean; kicker?: string; headline?: Line[] };

const estW = (t: string, s: number) => Math.max(60, t.length * s * 0.55);

// Optional title block (kicker chip + 1-2 headline lines) — section-4 text usage.
const Title: React.FC<{ kicker?: string; lines?: Line[] }> = ({ kicker, lines }) => {
  if (!lines || lines.length === 0) return null;
  return (
    <div style={{ position: "absolute", top: 150, left: 120, right: 70 }}>
      {kicker && (
        <div style={{ marginBottom: 20 }}>
          <HandWord delay={0} size={32} color={HD.paper} weight={700}>
            <span style={{ background: HD.accent, padding: "8px 18px", borderRadius: 5, letterSpacing: "0.16em", transform: "rotate(-1.5deg)", display: "inline-block" }}>{kicker}</span>
          </HandWord>
        </div>
      )}
      {lines.map((ln, i) => (
        <div key={i} style={{ marginBottom: 6, position: "relative", display: "block" }}>
          {ln.accent ? (
            <span style={{ position: "relative", display: "inline-block" }}>
              <MarkerHighlight delay={6 + i * 5 + 8} width={estW(ln.text, 88)} height={34} />
              <HandWord delay={6 + i * 5} size={88} color={HD.accent} bounce>{ln.text}</HandWord>
              <HandUnderline width={estW(ln.text, 88)} delay={6 + i * 5 + 14} top={92} />
            </span>
          ) : (
            <HandWord delay={6 + i * 5} size={70}>{ln.text}</HandWord>
          )}
        </div>
      ))}
    </div>
  );
};

const Canvas: React.FC<{ full?: boolean; children: React.ReactNode }> = ({ full, children }) => {
  const { width, height } = useVideoConfig();
  if (full) {
    return (
      <AbsoluteFill style={{ background: HD.paper }}>
        <PaperBg mH={height} width={width} />
        {children}
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill>{children}</AbsoluteFill>; // transparent over the HandDrawnFrame panel
};

// Focal vertical centre: 360 in the split panel, lower when a title sits on top.
const useCY = (full?: boolean, hasTitle?: boolean) => {
  const { height } = useVideoConfig();
  if (!full) return 360;
  return hasTitle ? Math.round(height * 0.58) : Math.round(height * 0.42);
};

// near-full sketchy circle path (for the loop ring)
const circlePath = (cx: number, cy: number, r: number) => {
  const k = 0.5523;
  return `M ${cx + r} ${cy}
    C ${cx + r} ${cy - r * k}, ${cx + r * k} ${cy - r}, ${cx} ${cy - r}
    C ${cx - r * k} ${cy - r}, ${cx - r} ${cy - r * k}, ${cx - r} ${cy}
    C ${cx - r} ${cy + r * k}, ${cx - r * k} ${cy + r}, ${cx} ${cy + r}
    C ${cx + r * k} ${cy + r}, ${cx + r} ${cy + r * k}, ${cx + r} ${cy}`;
};

/* ── IDEA 1 — Process Flow ─ linear L→R sequence; connectors draw, dots travel ── */
export const IdeaProcessFlow: React.FC<Common & { icons?: IconKey[]; accentIndex?: number }> = ({
  icons = ["doc", "gear", "play"], accentIndex, full, kicker, headline,
}) => {
  const { width } = useVideoConfig();
  const cy = useCY(full, !!headline);
  const n = icons.length, acc = accentIndex ?? n - 1;
  const sz = full ? 150 : 126, spread = full ? 300 : 250, cx = width / 2;
  const xs = icons.map((_, i) => cx + (i - (n - 1) / 2) * spread);
  const half = sz * 0.56;
  return (
    <Canvas full={full}>
      <Title kicker={kicker} lines={headline} />
      <svg width={width} height={cy + 220} viewBox={`0 0 ${width} ${cy + 220}`} style={{ position: "absolute", inset: 0 }}>
        {xs.slice(0, -1).map((x, i) => (
          <React.Fragment key={i}>
            <DrawPath d={`M ${x + half} ${cy} L ${xs[i + 1] - half} ${cy}`} delay={10 + i * 6} dur={6} len={spread} strokeWidth={6} stroke={HD.ink} />
            <DrawPath d={`M ${xs[i + 1] - half} ${cy} L ${xs[i + 1] - half - 20} ${cy - 12} M ${xs[i + 1] - half} ${cy} L ${xs[i + 1] - half - 20} ${cy + 12}`} delay={14 + i * 6} dur={4} len={48} strokeWidth={6} stroke={HD.ink} />
          </React.Fragment>
        ))}
      </svg>
      {xs.slice(0, -1).map((x, i) => (
        <FlowDots key={i} x1={x + half} y1={cy} x2={xs[i + 1] - half} y2={cy} delay={20 + i * 6} count={2} period={1.3} />
      ))}
      {icons.map((ic, i) => (
        <IconBadge key={i} x={xs[i]} y={cy} icon={HD_ICONS[ic]} delay={4 + i * 6} accent={i === acc} size={sz} />
      ))}
    </Canvas>
  );
};

/* ── IDEA 2 — Spotlight ─ ONE element wakes up: zoom-in + internal scan sweep ──── */
export const IdeaSpotlight: React.FC<Common & { icon?: IconKey }> = ({ icon = "play", full, kicker, headline }) => {
  const { width } = useVideoConfig();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cy = useCY(full, !!headline), cx = width / 2;
  const snap = useSnapHD(6);
  const S = full ? 320 : 250;
  const t = ((Math.max(0, frame - 16) / fps) / 1.6) % 1;
  const scanTop = t * S;
  return (
    <Canvas full={full}>
      <Title kicker={kicker} lines={headline} />
      <PulseRing cx={cx} cy={cy} r={S * 0.62} delay={6} period={1.8} />
      <PulseRing cx={cx} cy={cy} r={S * 0.62} delay={6} period={1.8} phase={0.5} />
      <div style={{ position: "absolute", left: cx - S / 2, top: cy - S / 2, width: S, height: S, borderRadius: S * 0.14,
        background: "#fff", border: `6px solid ${HD.accent}`, boxShadow: "6px 8px 0 rgba(27,26,23,0.20)",
        transform: `scale(${interpolate(snap, [0, 1], [0.5, 1])}) rotate(-1.2deg)`, opacity: interpolate(snap, [0, 1], [0, 1]), overflow: "hidden" }}>
        {frame > 16 && <div style={{ position: "absolute", left: 0, top: scanTop, width: S, height: 5, background: HD.accent2, opacity: 0.65 }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={S * 0.42} height={S * 0.42} viewBox="0 0 24 24" fill="none" stroke={HD.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={HD_ICONS[icon]} /></svg>
        </div>
      </div>
      <CircleAnno cx={cx} cy={cy} rx={S * 0.66} ry={S * 0.66} delay={22} w={width} h={cy + S} />
    </Canvas>
  );
};

/* ── IDEA 3 — Radial System ─ centrifugal hub + satellites + radiating dots ───── */
export const IdeaRadialSystem: React.FC<Common & { center?: IconKey; satellites?: IconKey[] }> = ({
  center = "bolt", satellites = ["doc", "gear", "rocket", "check"], full, kicker, headline,
}) => {
  const { width } = useVideoConfig();
  const cx = width / 2, cy = useCY(full, !!headline);
  const R = full ? 340 : 230, n = satellites.length;
  const core = full ? 200 : 150, sat = full ? 150 : 112;
  const pts = satellites.map((_, i) => {
    const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang), ang };
  });
  return (
    <Canvas full={full}>
      <Title kicker={kicker} lines={headline} />
      <PulseRing cx={cx} cy={cy} r={core * 0.85} delay={4} period={2.0} />
      <PulseRing cx={cx} cy={cy} r={core * 0.85} delay={4} period={2.0} phase={0.33} />
      <PulseRing cx={cx} cy={cy} r={core * 0.85} delay={4} period={2.0} phase={0.66} />
      <svg width={width} height={cy + R + 160} viewBox={`0 0 ${width} ${cy + R + 160}`} style={{ position: "absolute", inset: 0 }}>
        {pts.map((p, i) => {
          const sx = cx + core * 0.5 * Math.cos(p.ang), sy = cy + core * 0.5 * Math.sin(p.ang);
          const ex = p.x - sat * 0.5 * Math.cos(p.ang), ey = p.y - sat * 0.5 * Math.sin(p.ang);
          return <DrawPath key={i} d={`M ${sx} ${sy} L ${ex} ${ey}`} delay={12 + i * 5} dur={7} len={R} strokeWidth={6} stroke={HD.ink} />;
        })}
      </svg>
      {pts.map((p, i) => {
        const sx = cx + core * 0.5 * Math.cos(p.ang), sy = cy + core * 0.5 * Math.sin(p.ang);
        const ex = p.x - sat * 0.5 * Math.cos(p.ang), ey = p.y - sat * 0.5 * Math.sin(p.ang);
        return <FlowDots key={i} x1={sx} y1={sy} x2={ex} y2={ey} delay={24 + i * 5} count={2} period={1.5} />;
      })}
      {pts.map((p, i) => (
        <IconBadge key={i} x={p.x} y={p.y} icon={HD_ICONS[satellites[i]]} delay={16 + i * 5} size={sat} />
      ))}
      <IconBadge x={cx} y={cy} icon={HD_ICONS[center]} delay={6} size={core} accent />
    </Canvas>
  );
};

/* ── IDEA 4 — Stat Burst ─ a single big number counts up + radiating sparks ────── */
export const IdeaStatBurst: React.FC<Common & { to?: number; suffix?: string }> = ({ to = 10, suffix = "x", full, kicker, headline }) => {
  const { width } = useVideoConfig();
  const frame = useCurrentFrame();
  const cx = width / 2, cy = useCY(full, !!headline);
  const val = Math.round(interpolate(frame - 10, [0, 18], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const numSize = full ? 300 : 220;
  const r0 = full ? 230 : 175, r1 = full ? 300 : 235;
  return (
    <Canvas full={full}>
      <Title kicker={kicker} lines={headline} />
      <PulseRing cx={cx} cy={cy} r={full ? 250 : 190} delay={6} period={1.9} />
      <svg width={width} height={cy + r1 + 100} viewBox={`0 0 ${width} ${cy + r1 + 100}`} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <DrawPath key={i} d={`M ${cx + r0 * Math.cos(a)} ${cy + r0 * Math.sin(a)} L ${cx + r1 * Math.cos(a)} ${cy + r1 * Math.sin(a)}`} delay={26 + i} dur={4} len={r1 - r0 + 10} strokeWidth={6} stroke={HD.accent} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: cy - numSize * 0.56, textAlign: "center" }}>
        <span style={{ fontFamily: HD.font, fontWeight: 700, fontSize: numSize, color: HD.accent, lineHeight: 0.9, textShadow: "0 4px 0 rgba(27,26,23,0.14)" }}>{val}{suffix}</span>
      </div>
    </Canvas>
  );
};

/* ── IDEA 5 — Grid Repeat ─ tiled IDENTICAL cards stagger-fill (sameness) ───────── */
export const IdeaGridRepeat: React.FC<Common & { icon?: IconKey; cols?: number; rows?: number; accentCell?: number }> = ({
  icon = "play", cols = 3, rows = 2, accentCell, full, kicker, headline,
}) => {
  const { width } = useVideoConfig();
  const cx = width / 2, cy = useCY(full, !!headline);
  const cell = full ? 150 : 120, gap = full ? 44 : 32;
  const gw = cols * cell + (cols - 1) * gap, gh = rows * cell + (rows - 1) * gap;
  const x0 = cx - gw / 2 + cell / 2, y0 = cy - gh / 2 + cell / 2;
  const acc = accentCell ?? Math.floor((cols * rows) / 2);
  return (
    <Canvas full={full}>
      <Title kicker={kicker} lines={headline} />
      {Array.from({ length: cols * rows }).map((_, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        return <IconBadge key={i} x={x0 + c * (cell + gap)} y={y0 + r * (cell + gap)} icon={HD_ICONS[icon]} delay={6 + i * 3} accent={i === acc} size={cell} />;
      })}
    </Canvas>
  );
};

/* ── IDEA 6 — Cycle Loop ─ a dot orbits a closed ring (automation / loop) ───────── */
export const IdeaCycleLoop: React.FC<Common & { icons?: IconKey[] }> = ({ icons = ["doc", "gear", "play", "rocket"], full, kicker, headline }) => {
  const { width } = useVideoConfig();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cx = width / 2, cy = useCY(full, !!headline);
  const R = full ? 290 : 205, n = icons.length, sat = full ? 122 : 100;
  const pts = icons.map((_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const t = ((Math.max(0, frame - 22) / fps) / 2.4) % 1;
  const ang = -Math.PI / 2 + t * Math.PI * 2;
  const dx = cx + R * Math.cos(ang), dy = cy + R * Math.sin(ang);
  // two rotation-hint arrowheads on the ring
  const ah = (a: number) => {
    const px = cx + R * Math.cos(a), py = cy + R * Math.sin(a);
    const tx = -Math.sin(a), ty = Math.cos(a); // tangent (CW)
    return `M ${px - tx * 18 - Math.cos(a) * 12} ${py - ty * 18 - Math.sin(a) * 12} L ${px} ${py} L ${px - tx * 18 + Math.cos(a) * 12} ${py - ty * 18 + Math.sin(a) * 12}`;
  };
  return (
    <Canvas full={full}>
      <Title kicker={kicker} lines={headline} />
      <svg width={width} height={cy + R + 160} viewBox={`0 0 ${width} ${cy + R + 160}`} style={{ position: "absolute", inset: 0 }}>
        <DrawPath d={circlePath(cx, cy, R)} delay={8} dur={22} len={2 * Math.PI * R} strokeWidth={6} stroke={HD.ink} />
        <DrawPath d={ah(Math.PI * 0.25)} delay={26} dur={4} len={70} strokeWidth={6} stroke={HD.ink} />
        <DrawPath d={ah(Math.PI * 1.25)} delay={28} dur={4} len={70} strokeWidth={6} stroke={HD.ink} />
        {frame > 24 && <circle cx={dx} cy={dy} r={15} fill={HD.accent} />}
      </svg>
      {pts.map((p, i) => (
        <IconBadge key={i} x={p.x} y={p.y} icon={HD_ICONS[icons[i]]} delay={14 + i * 5} size={sat} accent={i === 0} />
      ))}
    </Canvas>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   THE REGISTRY — id → {component, fits}. `fits` lists the semantic cues a beat's
   line should carry for this idea to MATCH. The picker enforces VARIETY (no repeat).
   ════════════════════════════════════════════════════════════════════════════ */
/* ── CutoutAsset ─ a real keyed PNG (generated greenscreen → chroma_key) as an animated
   graphic: springs in with a 3D flip, then bobs + wobbles + glows. The on-brand way to
   drop a topic-relevant 3D object (coin, robot, lock, megaphone…) into a hand-drawn scene.
   Assets live in public/assets/<run>/*.png (see image-pipeline/generate_image_assets.py). ── */
export const CutoutAsset: React.FC<{ src: string; size?: number; cx?: number; cy?: number; glow?: string; delay?: number }> = ({
  src, size = 540, cx, cy, glow = "rgba(242,183,5,0.5)", delay = 0,
}) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const fps = useVideoConfig().fps;
  const t = Math.max(0, frame - delay) / fps;
  const enter = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 120, mass: 0.9 } });
  const sc = interpolate(enter, [0, 1], [0.25, 1]);
  const rotY = interpolate(enter, [0, 1], [-55, 0]) + Math.sin(t * Math.PI * 0.5) * 8;
  const bob = Math.sin(t * Math.PI * 1.1) * 14;
  const X = cx ?? width / 2, Y = cy ?? Math.round(height * 0.5);
  return (
    <div style={{ position: "absolute", left: X - size / 2, top: Y - size / 2 + bob, width: size, height: size, perspective: 900 }}>
      <Img src={staticFile(src)} style={{ width: size, height: "auto",
        transform: `rotateY(${rotY}deg) scale(${sc})`,
        filter: `drop-shadow(0 14px 24px rgba(120,90,0,0.4)) drop-shadow(0 0 30px ${glow})` }} />
    </div>
  );
};

const Sparkle: React.FC<{ x: number; y: number; s: number; delay: number; phase: number }> = ({ x, y, s, delay, phase }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tw = 0.35 + 0.65 * Math.abs(Math.sin((frame / fps) * Math.PI * 1.6 + phase));
  return (
    <svg width={s * 2.4} height={s * 2.4} viewBox="-12 -12 24 24" style={{ position: "absolute", left: x - s * 1.2, top: y - s * 1.2, opacity: (frame > delay ? 1 : 0) * tw }}>
      <path d="M0 -10 C1 -3 3 -1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3 -1 -1 -3 0 -10 Z" fill={HD.accent2} stroke={HD.accent} strokeWidth={1.2} />
    </svg>
  );
};

/* ── IDEA — Hero Asset ─ a generated 3D cutout as the centerpiece (shine lines +
   sparkles), with an optional title. Use when a beat names a CONCRETE OBJECT/thing a
   3D render depicts better than a line icon (a coin, a robot, a lock, a megaphone). ── */
export const IdeaHeroAsset: React.FC<Common & { src: string; glow?: string; size?: number }> = ({
  src, glow, size = 520, full, kicker, headline,
}) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const cx = width / 2, cy = useCY(full, !!headline);
  return (
    <Canvas full={full}>
      <Title kicker={kicker} lines={headline} />
      {/* radiating shine lines behind the asset */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 + frame * 0.004;
          const r0 = size * 0.58, r1 = size * 0.72 + Math.sin(frame * 0.08 + i) * 12;
          return <DrawPath key={i} d={`M ${cx + r0 * Math.cos(a)} ${cy + r0 * Math.sin(a)} L ${cx + r1 * Math.cos(a)} ${cy + r1 * Math.sin(a)}`}
            delay={10 + i} dur={5} len={90} strokeWidth={6} stroke={HD.accent2} />;
        })}
      </svg>
      <CutoutAsset src={src} size={size} cx={cx} cy={cy} glow={glow} delay={4} />
      <Sparkle x={cx - size * 0.5} y={cy - size * 0.36} s={24} delay={14} phase={0} />
      <Sparkle x={cx + size * 0.52} y={cy - size * 0.28} s={19} delay={20} phase={1.6} />
      <Sparkle x={cx + size * 0.46} y={cy + size * 0.42} s={22} delay={18} phase={3.0} />
      <Sparkle x={cx - size * 0.46} y={cy + size * 0.46} s={17} delay={24} phase={4.2} />
    </Canvas>
  );
};

export const MOTION_IDEAS = {
  processFlow: { Component: IdeaProcessFlow, fits: ["sequence", "steps", "how it works", "primeiro/depois", "pipeline", "process", "A → B → C"] },
  heroAsset: { Component: IdeaHeroAsset, fits: ["a concrete object", "a real thing a 3D render depicts", "coin/robot/lock/product", "hero object", "um objeto concreto"] },
  spotlight: { Component: IdeaSpotlight, fits: ["one thing", "this", "focus", "comes alive", "single element", "destaque", "um componente"] },
  radialSystem: { Component: IdeaRadialSystem, fits: ["connects", "hub", "core", "system", "everything", "central", "conecta", "tudo"] },
  statBurst: { Component: IdeaStatBurst, fits: ["number", "x faster", "%", "quantity", "speed", "10x", "mais rápido", "metric"] },
  gridRepeat: { Component: IdeaGridRepeat, fits: ["sameness", "every", "consistency", "identical", "all of them", "mesma identidade", "cada vídeo"] },
  cycleLoop: { Component: IdeaCycleLoop, fits: ["loop", "cycle", "automated", "repeats", "again and again", "no automático", "end to end"] },
} as const;
export type IdeaId = keyof typeof MOTION_IDEAS;

// The SECTION TYPE of a beat = the id prefix before the first ":" (e.g. "caption:agents"
// → "caption", "heroAsset:robot" → "heroAsset"). Colon-less ids (older bare motion-idea
// ids like "processFlow") are their own type. This is how the grammar guards tell §3b
// (caption) / §4 (heroAsset / motion) / §5 (split) / §6 (full) apart from the id list.
export const sectionTypeOf = (id: string): string => id.split(":")[0];

// Variety guard (LENIENT — back-compat, called at module load by ~29 legacy comps): throw
// only if two ADJACENT beats reuse the EXACT same id. Different 3D OBJECTS adjacent (e.g.
// "heroAsset:robot"→"heroAsset:coin") are intentionally allowed — they don't look alike.
// The STRICTER section-TYPE rules live in assertSectionGrammar (new comps opt into them);
// do NOT tighten this function or every legacy top-level assertVariety() call breaks the bundle.
export const assertVariety = (ids: string[]): void => {
  for (let i = 1; i < ids.length; i++) {
    if (ids[i] === ids[i - 1]) {
      throw new Error(`Motion variety violation: idea "${ids[i]}" repeats back-to-back at beat ${i}. Pick a different mechanism that matches the line.`);
    }
  }
};

// Section-grammar guard (QCR-147): the documented body cycle is
// §3 avatar → §3b caption → §4 motion+text → §5 split-graphics → §6 full-graphics (repeat).
// Real builds had collapsed into a §3b-caption ↔ §4-hero PING-PONG with §5 split-graphics
// NEVER appearing — exactly the "after caption + full-motion it goes back to caption instead
// of split graphics" defect. This is the STRICT guard new comps call (supersedes assertVariety):
//   - exact-dup adjacency (via assertVariety), PLUS same section-TYPE adjacency (no caption→
//     caption, no split→split…). heroAsset→heroAsset is EXEMPT (different 3D objects are fine).
//   - ≥12 beats  → must contain at least one "split:" AND one "full:" graphics-only section.
//   - 8–11 beats → must contain at least one graphics-only ("split:" or "full:") breather.
//   - never 4+ consecutive beats drawn ONLY from {caption, heroAsset} (the ping-pong itself).
export const assertSectionGrammar = (ids: string[]): void => {
  assertVariety(ids);
  // §1 MUST be the OPENING HOOK that carries the clickbait headline (QCR-181). Every
  // compliant comp tags ids[0] "opening:..."; a past regression tagged it
  // "evidence:certnews" (a screenshot card + tiny kicker, no headline) and frame 0 shipped
  // blank with no headline. A non-"opening" §1 is forbidden — the opening-hook component
  // (PremiumOpeningHook / HeadlineHook + PillHeadline) is what renders the headline at frame 0.
  if (sectionTypeOf(ids[0]) !== "opening") {
    throw new Error(`Section grammar violation: §1 (ids[0]="${ids[0]}") is type "${sectionTypeOf(ids[0])}", not "opening". The first beat MUST be the OPENING HOOK that shows the clickbait headline at frame 0 — tag it "opening:<concept>" and render <PremiumOpeningHook> (premium) or <HeadlineHook>/<PillHeadline> (hand-drawn). A bare evidence/avatar/motion §1 drops the headline (a known defect). (QCR-181)`);
  }
  for (let i = 1; i < ids.length; i++) {
    const t = sectionTypeOf(ids[i]), p = sectionTypeOf(ids[i - 1]);
    if (t === p && t !== "heroAsset") {
      throw new Error(`Section grammar violation: two "${t}" sections back-to-back at beat ${i} ("${ids[i - 1]}" → "${ids[i]}"). The cycle forbids the same section TYPE twice in a row (no caption→caption, no split→split). Break it with a different section. (QCR-147)`);
    }
  }
  const n = ids.length;
  const types = ids.map(sectionTypeOf);
  const has = (t: string) => types.includes(t);
  if (n >= 12) {
    if (!has("split")) {
      throw new Error(`Section grammar violation: a ${n}-beat video with ZERO "split:" sections. The cycle §3→§3b→§4→§5→§6 requires at least one §5 SPLIT-GRAPHICS beat (avatar BELOW + graphics-only ABOVE, no baked text — use <PremiumSplitGraphics>). Tag it "split:<concept>". This is the exact caption↔hero ping-pong defect (QCR-147).`);
    }
    if (!has("full")) {
      throw new Error(`Section grammar violation: a ${n}-beat video with ZERO "full:" sections. The cycle needs at least one §6 FULL-GRAPHICS beat (fullscreen graphics/diagram, no text, no avatar — use <PremiumFullGraphics>). Tag it "full:<concept>" — do NOT tag a §6 as "heroAsset:" (that hid §6 inside §4 and is why §6 silently vanished). (QCR-147)`);
    }
  } else if (n >= 8 && !has("split") && !has("full")) {
    throw new Error(`Section grammar violation: a ${n}-beat video with no graphics-only breather. Add at least one §5 "split:" or §6 "full:" section. (QCR-147)`);
  }
  let run = 0;
  for (let i = 0; i < n; i++) {
    run = (types[i] === "caption" || types[i] === "heroAsset") ? run + 1 : 0;
    if (run >= 4) {
      throw new Error(`Section grammar violation: ${run}+ consecutive caption/full-motion beats ending at beat ${i} — the caption↔hero ping-pong. Insert a structural section (§5 split-graphics, §3 avatar, §2 evidence) so the rhythm isn't only captions and hero scenes. (QCR-147)`);
    }
  }
};

/* ════════════════════════════════════════════════════════════════════════════
   assertEditFlow — the CONTENT-DRIVEN edit-flow guard (house rule).
   ────────────────────────────────────────────────────────────────────────────
   The edit is no longer a pre-established cycle: each beat's STYLE is chosen from a
   free palette (see motion-pipeline/EDIT_STYLES.md) by what the SCRIPT phrase needs —
   strong phrase → `phrase`/`avatarcap`, named object → `hero`, process → `flow`,
   system → `full`, explanation → `split`, number → `stat`, proof → `evidence`, …
   The ONLY structural rules:
     1. §1 (ids[0]) is the FIXED opening hook — `opening:…` (the clickbait headline at
        frame 0; check_opening_headline.py still enforces a real headline component).
     2. NO edit style repeats within ANY window of 4 beats — style[i] must differ from
        style[i-1], [i-2] AND [i-3] (so a style needs ≥3 other beats before it returns:
        "A X Y Z A"). This keeps every 4 consecutive beats visually distinct → dynamic.
        (Tightened from window-of-3 → window-of-4 on, owner: "4 edit styles in a
        row / 4 apart". A no-image-provider fallback with a thin no-asset palette relaxes to 3.)
   `editStyleOf(id)` = the prefix before ":" (same as sectionTypeOf). Tag each beat
   `style:concept`. Palette + rule spec: `motion-pipeline/EDIT_STYLES.md`. The Python
   pre-render gate `verify_edit_plan.py` enforces the SAME rule on the edit plan — they agree.
   assertSectionGrammar (the old fixed cycle) stays for legacy comps. */
export const editStyleOf = sectionTypeOf;

export const EDIT_STYLE_IDS = [
  "opening", "phrase", "avatarcap", "hero", "split", "full", "flow", "stat", "evidence", "avatar",
] as const;

const ASSET_STYLES = new Set(["hero", "split", "full", "flow"]);

export const assertEditFlow = (ids: string[]): void => {
  assertVariety(ids); // back-compat: no EXACT id repeated back-to-back
  const n = ids.length;
  if (n === 0) throw new Error("Edit-flow violation: empty beat list.");
  if (editStyleOf(ids[0]) !== "opening") {
    throw new Error(`Edit-flow violation: §1 (ids[0]="${ids[0]}") is "${editStyleOf(ids[0])}", not "opening". The FIRST beat MUST be the fixed opening hook — tag it "opening:<concept>" and render <PremiumOpeningHook>/<PillHeadline> (the clickbait headline at frame 0). Everything AFTER §1 is free, content-driven.`);
  }
  // CANARY VERDICT (— measured on 6 QC 75–100 comps): a hard window-of-4 is DISPROVEN.
  // ALL 6 QC-passing videos violate it, so it is UNCORRELATED with QC, and 70% of the violations are
  // `hero` repeating with a DIFFERENT object each time — a deliberate, QC-exempt pattern (assertSectionGrammar
  // already exempts heroAsset adjacency; different objects carry the variety). Forcing distance on `hero`
  // would push object-naming phrases onto non-literal styles → QCR-006 risk. So the HARD rule is only:
  //   §1 opening · no same-style ADJACENT (except `hero`, object-varied) · richness.
  // The wider "4 in a row" is kept as an ADVISORY the planner + verify_edit_plan WARN on (a nudge toward
  // variety WHERE the content allows), NOT a throw. The genuine variety win is animation DEPTH per style
  // (hero/split/full each still have ONE animation) — see EDIT_STYLES.md variety-debt. (QCR-292)
  const styles = ids.map(editStyleOf);
  const distinct = new Set(styles);
  const noHf = !styles.some((s) => ASSET_STYLES.has(s));
  const DISTANCE_EXEMPT = new Set(["hero"]); // object-varied + animation-depth carry its variety
  // HARD: no NON-hero style twice ADJACENT (the proven rule — mirrors assertSectionGrammar's hero exemption).
  for (let i = 1; i < n; i++) {
    const s = styles[i];
    if (s === styles[i - 1] && !DISTANCE_EXEMPT.has(s)) {
      throw new Error(`Edit-flow violation: style "${s}" repeats back-to-back at beat ${i} ("${ids[i - 1]}" → "${ids[i]}"). No non-hero style twice in a row — pick a different edit style that fits this phrase (EDIT_STYLES.md). (no-adjacent)`);
    }
  }
  // The wider "4-in-a-row" window is ADVISORY only (verify_edit_plan.py WARNs) — the canary (QCR-292) showed
  // a hard window rejects QC-passing videos. Enforce it here only once animation-depth exists to satisfy it.
  // richness: ≥6-beat video uses ≥4 distinct styles; ≥10-beat uses ≥5 (≥3 in a no-image-provider fallback).
  const minDistinct = noHf ? 3 : (n >= 10 ? 5 : 4);
  if (n >= 6 && distinct.size < minDistinct) {
    throw new Error(`Edit-flow violation: a ${n}-beat video uses only ${distinct.size} distinct edit styles (${[...distinct].join(", ")}). Content-driven editing should pull from ≥${minDistinct} styles — re-classify the beats and use more of the palette (EDIT_STYLES.md). (richness)`);
  }
};
