import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import {
  PALETTES, AmbientBg, ParallaxStage, CameraRig, PunchTitle,
  CountUp, GlassCard, Stinger, IconDraw, LottieIcon, TYPE,
} from "../library";

// Demo / regression composition for the V8.2 Lottie integration.
// Proves: @remotion/lottie renders deterministically in the V8 frame, primitives
// recolour to the palette accent, and LottieIcon sits naturally beside the
// hand-rolled library (IconDraw etc.). Render → extract frames → eyeball.

const P = PALETTES.voltage;

const SceneShell: React.FC<{ mH: number; seed: string; ghost: string; children: React.ReactNode; exit?: boolean; dur?: number; stinger?: boolean }> = ({
  mH, seed, ghost, children, exit, dur, stinger,
}) => (
  <div style={{ position: "absolute", width: 1080, height: mH, overflow: "hidden" }}>
    <AmbientBg mH={mH} palette={P} seed={seed} />
    <ParallaxStage mH={mH} palette={P} seed={seed} ghostWord={ghost} />
    {stinger ? <Stinger palette={P} mH={mH} /> : null}
    <CameraRig seed={seed} exit={exit} durationInFrames={dur}>
      <div
        style={{
          position: "absolute", width: 1080, height: mH,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "flex-start", gap: 24,
          paddingTop: mH * 0.34, paddingBottom: mH * 0.05, boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </CameraRig>
  </div>
);

// Scene 1 — orbit-dots (AI/processing) next to a hand-rolled IconDraw, to show
// the new Lottie sibling sits beside the old library cleanly.
const ROCKET = "M50 14 C64 26 66 46 58 64 L42 64 C34 46 36 26 50 14 Z M42 64 L34 78 L46 70 M58 64 L66 78 L54 70 M50 40 a5 5 0 1 0 0.1 0";
const Scene1: React.FC<{ mH: number; dur: number }> = ({ mH, dur }) => (
  <SceneShell mH={mH} seed="s1" ghost="2.0" exit dur={dur}>
    <PunchTitle lines={["MOTION", "EM OUTRO NÍVEL"]} palette={P} accentWords={["nível"]} size="title" />
    <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
      <LottieIcon src="lottie/orbit-dots.json" palette={P} delay={10} size={170} />
      <IconDraw path={ROCKET} palette={P} delay={16} size={150} />
    </div>
  </SceneShell>
);

// Scene 2 — scan-sweep (accent2 tint) + arrow-flow as a "pipeline/flow" beat.
const Scene2: React.FC<{ mH: number; dur: number }> = ({ mH, dur }) => (
  <SceneShell mH={mH} seed="s2" ghost="FLOW" exit dur={dur} stinger>
    <PunchTitle lines={["PIPELINE", "AUTOMÁTICO"]} palette={P} accentWords={["automático"]} size="title" />
    <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
      <LottieIcon src="lottie/scan-sweep.json" palette={P} tint="accent2" delay={12} size={180} />
      <LottieIcon src="lottie/arrow-flow.json" palette={P} delay={18} size={200} />
    </div>
    <GlassCard palette={P} delay={50}>
      <div style={{ ...TYPE.label, color: P.ink }}>DO ROTEIRO AO POST</div>
    </GlassCard>
  </SceneShell>
);

// Scene 3 — THE real use case: pulse-ring composited BEHIND a CountUp number.
const Scene3: React.FC<{ mH: number; dur: number }> = ({ mH, dur }) => (
  <SceneShell mH={mH} seed="s3" ghost="100" dur={dur} stinger>
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 30 }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0 }}>
        <LottieIcon src="lottie/pulse-ring.json" palette={P} delay={2} size={520} glow={false} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <CountUp to={100} suffix="%" label="DETERMINÍSTICO" palette={P} delay={6} />
      </div>
    </div>
  </SceneShell>
);

export const LottieDemoV8: React.FC = () => {
  const { fps, height, width } = useVideoConfig();
  const mH = Math.round(height * 0.4);
  const s = 4 * fps;

  return (
    <AbsoluteFill style={{ background: P.bg }}>
      <div style={{ position: "absolute", left: 0, top: mH, width, height: height - mH, background: "#101418" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width, height: mH, overflow: "hidden" }}>
        <Sequence from={0} durationInFrames={s}><Scene1 mH={mH} dur={s} /></Sequence>
        <Sequence from={s} durationInFrames={s}><Scene2 mH={mH} dur={s} /></Sequence>
        <Sequence from={s * 2} durationInFrames={s}><Scene3 mH={mH} dur={s} /></Sequence>
      </div>
      <div style={{ position: "absolute", left: 0, top: mH - 30, width, height: 60, background: `linear-gradient(to bottom, ${P.bg} 0%, transparent 100%)`, pointerEvents: "none", zIndex: 10 }} />
    </AbsoluteFill>
  );
};
