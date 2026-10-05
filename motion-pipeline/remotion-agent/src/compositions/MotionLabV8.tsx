import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import { CameraMotionBlur, Trail } from "@remotion/motion-blur";
import { noise2D } from "@remotion/noise";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadArchivo } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceGrotesk";
import { PALETTES, TYPE, SPR, AmbientBg } from "../library";

const anton = loadAnton();
const archivo = loadArchivo();
const space = loadSpace();

const P = PALETTES.voltage;
const MH = 768; // real motion area height in the pipeline

// ─── Split-screen harness: V7 (current) left, V8 (candidate) right ──────────
const Split: React.FC<{
  left: React.ReactNode;
  right: React.ReactNode;
  leftLabel?: string;
  rightLabel?: string;
}> = ({ left, right, leftLabel = "V7 ATUAL", rightLabel = "V8 TESTE" }) => (
  <AbsoluteFill style={{ background: P.bg }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 540, height: MH, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -270, width: 1080, height: MH, transform: "scale(0.5)", transformOrigin: "center top" }}>
        {left}
      </div>
    </div>
    <div style={{ position: "absolute", left: 540, top: 0, width: 540, height: MH, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -270, width: 1080, height: MH, transform: "scale(0.5)", transformOrigin: "center top" }}>
        {right}
      </div>
    </div>
    <div style={{ position: "absolute", left: 539, top: 0, width: 2, height: MH, background: "rgba(255,255,255,0.35)", zIndex: 99 }} />
    <div style={{ position: "absolute", left: 16, top: 12, fontFamily: "Arial", fontWeight: 700, fontSize: 26, color: "#fff", opacity: 0.7, zIndex: 99 }}>{leftLabel}</div>
    <div style={{ position: "absolute", right: 16, top: 12, fontFamily: "Arial", fontWeight: 700, fontSize: 26, color: "#0f0", opacity: 0.85, zIndex: 99 }}>{rightLabel}</div>
  </AbsoluteFill>
);

// ════════════════════════════════════════════════════════════════════════════
// TEST 1 — MOTION BLUR: fast whip-in slide + punch scale, with vs without
// CameraMotionBlur. Loops every 30 frames so any extracted frame shows motion.
// ════════════════════════════════════════════════════════════════════════════
const WhipContent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame % 30;

  // hard whip: slides 900px in 7 frames with strong ease-out
  const x = interpolate(local, [0, 7], [-900, 0], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.12, 0.9, 0.25, 1),
  });
  const punch = spring({ frame: Math.max(local - 8, 0), fps, config: SPR.punch, durationInFrames: 12 });

  return (
    <AbsoluteFill>
      <AmbientBg mH={MH} palette={P} seed={"t1"} />
      <div style={{ position: "absolute", top: 230, width: 1080, textAlign: "center", transform: `translateX(${x}px)` }}>
        <span style={{ ...TYPE.title, color: P.ink }}>VELOCIDADE</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 420,
          width: 1080,
          textAlign: "center",
          opacity: local >= 8 ? 1 : 0,
          transform: `scale(${interpolate(punch, [0, 1], [2.2, 1])})`,
        }}
      >
        <span style={{ ...TYPE.stat, fontSize: 110, color: P.accent, textShadow: `0 0 30px ${P.accent}99` }}>10X</span>
      </div>
    </AbsoluteFill>
  );
};

export const MotionLabBlur: React.FC = () => (
  <Split
    left={<WhipContent />}
    right={
      <CameraMotionBlur shutterAngle={250} samples={7}>
        <WhipContent />
      </CameraMotionBlur>
    }
    leftLabel="SEM BLUR"
    rightLabel="CAMERA MOTION BLUR"
  />
);

// ════════════════════════════════════════════════════════════════════════════
// TEST 2 — TYPE & LETTER CHOREOGRAPHY
// Left: current KineticWords style (Arial Black, whole-word spring pop).
// Right: Anton font, per-letter cascade with anticipation, rotation overshoot,
// squash & stretch on landing.
// ════════════════════════════════════════════════════════════════════════════
const WordPopV7: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = ["AGENTES", "DE", "IA"];
  return (
    <AbsoluteFill>
      <AmbientBg mH={MH} palette={P} seed={"t2a"} />
      <div style={{ position: "absolute", top: 280, width: 1080, display: "flex", justifyContent: "center", gap: 28 }}>
        {words.map((w, i) => {
          const local = frame - i * 6;
          const s = spring({ frame: Math.max(local, 0), fps, config: SPR.punch, durationInFrames: 14 });
          return (
            <span
              key={i}
              style={{
                ...TYPE.title,
                color: i === 2 ? P.accent : P.ink,
                opacity: local >= 0 ? s : 0,
                display: "inline-block",
                transform: `translateY(${interpolate(s, [0, 1], [34, 0])}px) scale(${interpolate(s, [0, 1], [1.35, 1])})`,
                textShadow: i === 2 ? `0 0 22px ${P.accent}aa` : "0 4px 24px rgba(0,0,0,0.55)",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const LetterCascadeV8: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words: { t: string; accent?: boolean }[] = [{ t: "AGENTES" }, { t: "DE" }, { t: "IA", accent: true }];
  let letterIndex = 0;
  return (
    <AbsoluteFill>
      <AmbientBg mH={MH} palette={P} seed={"t2b"} />
      <div style={{ position: "absolute", top: 270, width: 1080, display: "flex", justifyContent: "center", gap: 34 }}>
        {words.map((w, wi) => (
          <span key={wi} style={{ display: "inline-flex" }}>
            {w.t.split("").map((ch, ci) => {
              const idx = letterIndex++;
              const local = frame - idx * 1.6;
              const s = spring({ frame: Math.max(local, 0), fps, config: { damping: 11, stiffness: 260, mass: 0.7 }, durationInFrames: 16 });
              // squash & stretch: stretch tall while falling, squash on impact, settle
              const scaleY = interpolate(s, [0, 0.55, 0.78, 1], [1.45, 1.18, 0.86, 1]);
              const scaleX = interpolate(s, [0, 0.55, 0.78, 1], [0.72, 0.9, 1.12, 1]);
              const rot = interpolate(s, [0, 0.7, 1], [-9, 3, 0]);
              return (
                <span
                  key={ci}
                  style={{
                    fontFamily: anton.fontFamily,
                    fontSize: 96,
                    lineHeight: 0.98,
                    color: w.accent ? P.accent : P.ink,
                    opacity: local >= 0 ? Math.min(s * 1.6, 1) : 0,
                    display: "inline-block",
                    transform: `translateY(${interpolate(s, [0, 1], [-70, 0])}px) rotate(${rot}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
                    transformOrigin: "bottom center",
                    textShadow: w.accent ? `0 0 26px ${P.accent}aa` : "0 6px 28px rgba(0,0,0,0.6)",
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        ))}
      </div>
      {/* follow-through: underline whips in after letters land */}
      <div
        style={{
          position: "absolute",
          top: 400,
          left: 540 - interpolate(spring({ frame: Math.max(frame - 22, 0), fps, config: SPR.settle, durationInFrames: 18 }), [0, 1], [0, 170]),
          width: interpolate(spring({ frame: Math.max(frame - 22, 0), fps, config: SPR.settle, durationInFrames: 18 }), [0, 1], [0, 340]),
          height: 8,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${P.accent}, ${P.accent2})`,
          boxShadow: `0 0 18px ${P.accent}88`,
        }}
      />
      <div style={{ position: "absolute", top: 460, width: 1080, textAlign: "center", fontFamily: space.fontFamily, fontWeight: 500, fontSize: 30, letterSpacing: "0.3em", color: P.dim, opacity: interpolate(frame, [26, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        SEM CÓDIGO
      </div>
    </AbsoluteFill>
  );
};

export const MotionLabType: React.FC = () => (
  <Split left={<WordPopV7 />} right={<LetterCascadeV8 />} leftLabel="ARIAL BLACK / WORD POP" rightLabel="ANTON / LETTER CASCADE" />
);

// ════════════════════════════════════════════════════════════════════════════
// TEST 3 — STINGER: current flash+ring vs chromatic aberration + zoom whip
// Loops every 35 frames.
// ════════════════════════════════════════════════════════════════════════════
const StingerSceneV7: React.FC = () => {
  const frame = useCurrentFrame() % 35;
  const flash = interpolate(frame, [0, 2, 7], [0.85, 0.4, 0], { extrapolateRight: "clamp" });
  const ring = interpolate(frame, [0, 7], [0.2, 1.6], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <AmbientBg mH={MH} palette={P} seed={"t3a"} />
      <div style={{ position: "absolute", top: 300, width: 1080, textAlign: "center" }}>
        <span style={{ ...TYPE.title, color: P.ink }}>NOVO RECURSO</span>
      </div>
      <div style={{ position: "absolute", inset: 0, background: P.ink, opacity: flash * 0.35 }} />
      <div
        style={{
          position: "absolute",
          left: 540 - 300 * ring,
          top: MH * 0.55 - 300 * ring,
          width: 600 * ring,
          height: 600 * ring,
          borderRadius: "50%",
          border: `3px solid ${P.accent}`,
          opacity: flash,
        }}
      />
    </AbsoluteFill>
  );
};

const StingerSceneV8: React.FC = () => {
  const raw = useCurrentFrame() % 35;
  const frame = raw;
  // zoom whip: starts at 1.45 scale, slams to 1 in 6 frames
  const zoom = interpolate(frame, [0, 6], [1.45, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.1, 0.9, 0.2, 1) });
  // chromatic aberration: rgb split that collapses over 8 frames
  const ab = interpolate(frame, [0, 8], [14, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const flash = interpolate(frame, [0, 1, 6], [0.7, 0.35, 0], { extrapolateRight: "clamp" });
  const title = (color: string, dx: number, blend?: React.CSSProperties["mixBlendMode"]) => (
    <div
      style={{
        position: "absolute",
        top: 300,
        width: 1080,
        textAlign: "center",
        transform: `translateX(${dx}px)`,
        mixBlendMode: blend,
      }}
    >
      <span style={{ ...TYPE.title, color }}>NOVO RECURSO</span>
    </div>
  );
  return (
    <AbsoluteFill>
      <AmbientBg mH={MH} palette={P} seed={"t3b"} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})` }}>
        {ab > 0.5 && title("rgba(255,0,60,0.85)", -ab, "screen")}
        {ab > 0.5 && title("rgba(0,229,255,0.85)", ab, "screen")}
        {title(P.ink, 0)}
      </div>
      {/* radial speed streaks */}
      {frame < 7 &&
        Array.from({ length: 14 }, (_, i) => {
          const ang = (i / 14) * Math.PI * 2;
          const len = interpolate(frame, [0, 6], [240, 30], { extrapolateRight: "clamp" });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 540,
                top: MH * 0.5,
                width: len,
                height: 3,
                background: `linear-gradient(90deg, transparent, ${P.accent}cc)`,
                transform: `rotate(${(ang * 180) / Math.PI}deg) translateX(${120 + frame * 30}px)`,
                transformOrigin: "left center",
                opacity: flash,
              }}
            />
          );
        })}
      <div style={{ position: "absolute", inset: 0, background: P.ink, opacity: flash * 0.22 }} />
    </AbsoluteFill>
  );
};

export const MotionLabStinger: React.FC = () => (
  <Split left={<StingerSceneV7 />} right={<StingerSceneV8 />} leftLabel="FLASH + ANEL" rightLabel="CHROMATIC + ZOOM WHIP" />
);

// ════════════════════════════════════════════════════════════════════════════
// TEST 4 — DEPTH: flat scene vs 3D perspective parallax layers
// ════════════════════════════════════════════════════════════════════════════
const FlatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: SPR.punch, durationInFrames: 16 });
  return (
    <AbsoluteFill>
      <AmbientBg mH={MH} palette={P} seed={"t4a"} />
      <div style={{ position: "absolute", top: 300, width: 1080, textAlign: "center", opacity: s, transform: `scale(${interpolate(s, [0, 1], [1.2, 1])})` }}>
        <span style={{ ...TYPE.title, color: P.ink }}>
          CLAUDE <span style={{ color: P.accent }}>CODE</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};

const ParallaxScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const s = spring({ frame, fps, config: SPR.punch, durationInFrames: 16 });
  const camX = noise2D("cam4x", t * 0.25, 0) * 30;
  const camY = noise2D("cam4y", 0, t * 0.25) * 14;
  const layer = (depth: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    transform: `translateX(${camX * depth}px) translateY(${camY * depth}px) scale(${1 + 0.04 * depth})`,
  });
  return (
    <AbsoluteFill style={{ perspective: 900 }}>
      <AmbientBg mH={MH} palette={P} seed={"t4b"} />
      {/* deep layer: big dim outline word, moves least */}
      <div style={{ ...layer(-0.6), top: 220, textAlign: "center" }}>
        <span style={{ ...TYPE.mega, fontSize: 210, color: "transparent", WebkitTextStroke: `2px ${P.line}`, opacity: 0.7 }}>CODE</span>
      </div>
      {/* mid grid floor */}
      <div
        style={{
          ...layer(-0.3),
          top: MH * 0.62,
          height: MH * 0.4,
          backgroundImage: `linear-gradient(${P.line} 1px, transparent 1px), linear-gradient(90deg, ${P.line} 1px, transparent 1px)`,
          backgroundSize: "90px 90px",
          transform: `${(layer(-0.3).transform as string)} rotateX(64deg)`,
          transformOrigin: "center top",
          opacity: 0.5,
          maskImage: "linear-gradient(180deg, transparent, black 30%)",
        }}
      />
      {/* hero layer */}
      <div style={{ ...layer(1), top: 300, textAlign: "center", opacity: s }}>
        <span style={{ ...TYPE.title, color: P.ink, display: "inline-block", transform: `scale(${interpolate(s, [0, 1], [1.2, 1])})` }}>
          CLAUDE <span style={{ color: P.accent, textShadow: `0 0 30px ${P.accent}99` }}>CODE</span>
        </span>
      </div>
      {/* foreground floaters: move MOST = strongest depth cue */}
      <div style={{ ...layer(2.2), top: 0 }}>
        <div style={{ position: "absolute", left: 120, top: 160, width: 70, height: 70, borderRadius: 18, border: `2px solid ${P.accent}`, opacity: 0.65, transform: `rotate(${12 + t * 6}deg)`, boxShadow: `0 0 24px ${P.accent}55` }} />
        <div style={{ position: "absolute", right: 110, top: 480, width: 46, height: 46, borderRadius: "50%", background: `${P.accent2}33`, border: `2px solid ${P.accent2}`, opacity: 0.7 }} />
      </div>
    </AbsoluteFill>
  );
};

export const MotionLabParallax: React.FC = () => (
  <Split left={<FlatScene />} right={<ParallaxScene />} leftLabel="FLAT" rightLabel="PARALLAX 3 CAMADAS" />
);

// ════════════════════════════════════════════════════════════════════════════
// TEST 5 — FPS: continuous fast motion, registered at 25fps and 50fps.
// Also doubles as a Trail (object motion trail) demo.
// ════════════════════════════════════════════════════════════════════════════
export const MotionLabFps: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps; // seconds — identical motion regardless of fps
  const x = 540 + Math.sin(t * 2.4) * 380;
  const y = 300 + Math.cos(t * 3.1) * 140;
  const slideX = ((t * 700) % 1800) - 360;
  return (
    <AbsoluteFill style={{ background: P.bg }}>
      <AmbientBg mH={MH} palette={P} seed={"t5"} />
      <Trail layers={5} lagInFrames={0.5} trailOpacity={0.35}>
        <div
          style={{
            position: "absolute",
            left: x - 40,
            top: y - 40,
            width: 80,
            height: 80,
            borderRadius: 22,
            background: P.accent,
            boxShadow: `0 0 40px ${P.accent}99`,
          }}
        />
      </Trail>
      <div style={{ position: "absolute", top: 540, left: slideX, whiteSpace: "nowrap" }}>
        <span style={{ ...TYPE.title, fontSize: 64, color: P.ink, opacity: 0.9 }}>MOVIMENTO CONTÍNUO •</span>
      </div>
      <div style={{ position: "absolute", top: 60, width: 1080, textAlign: "center", fontFamily: archivo.fontFamily, fontSize: 40, color: P.accent }}>
        {fps} FPS
      </div>
    </AbsoluteFill>
  );
};
