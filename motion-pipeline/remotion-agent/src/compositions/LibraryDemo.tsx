import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import {
  PALETTES, AmbientBg, CameraRig, KineticWords, PunchTitle,
  CountUp, DrawBars, IconDraw, GlassCard, Stinger, TYPE,
} from "../library";

const P = PALETTES.voltage;

const SceneShell: React.FC<{ mH: number; seed: string; children: React.ReactNode; exit?: boolean; dur?: number }> = ({
  mH, seed, children, exit, dur,
}) => (
  <div style={{ position: "absolute", width: 1080, height: mH, overflow: "hidden" }}>
    <AmbientBg mH={mH} palette={P} seed={seed} />
    <Stinger palette={P} mH={mH} />
    <CameraRig seed={seed} exit={exit} durationInFrames={dur}>
      <div
        style={{
          position: "absolute", width: 1080, height: mH,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "flex-start", gap: 26,
          paddingTop: mH * 0.38, paddingBottom: mH * 0.05, boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </CameraRig>
  </div>
);

// brain-circuit icon (100x100 viewBox)
const BRAIN = "M50 18 C36 18 28 28 28 38 C20 40 16 48 18 56 C14 62 18 72 26 74 C28 82 38 86 46 82 L50 80 L54 82 C62 86 72 82 74 74 C82 72 86 62 82 56 C84 48 80 40 72 38 C72 28 64 18 50 18 Z M50 30 L50 70 M38 44 L50 50 L62 42";

const Scene1: React.FC<{ mH: number; dur: number }> = ({ mH, dur }) => (
  <SceneShell mH={mH} seed="s1" exit dur={dur}>
    <PunchTitle lines={["PEDIRAM PARA", "DESACELERAR"]} palette={P} accentWords={["desacelerar"]} size="title" />
    <IconDraw path={BRAIN} palette={P} delay={14} size={120} />
  </SceneShell>
);

const Scene2: React.FC<{ mH: number; startSec: number }> = ({ mH, startSec }) => (
  <SceneShell mH={mH} seed="s2">
    <KineticWords
      sceneStartSec={startSec}
      palette={P}
      size="title"
      words={[
        { text: "A", at: startSec + 0.2 },
        { text: "IA", at: startSec + 0.45, accent: true },
        { text: "MELHORA", at: startSec + 0.9 },
        { text: "A", at: startSec + 1.3 },
        { text: "SI", at: startSec + 1.5 },
        { text: "MESMA", at: startSec + 1.8, accent: true },
      ]}
    />
    <GlassCard palette={P} delay={58}>
      <div style={{ ...TYPE.label, color: P.ink }}>SEM INTERVENÇÃO HUMANA</div>
    </GlassCard>
  </SceneShell>
);

const Scene3: React.FC<{ mH: number; dur: number }> = ({ mH, dur }) => (
  <SceneShell mH={mH} seed="s3" exit dur={dur}>
    <CountUp to={97} suffix="%" label="RITMO DA CORRIDA" palette={P} delay={4} />
    <DrawBars
      palette={P}
      delay={26}
      width={700}
      bars={[
        { label: "2024", value: 45 },
        { label: "2025", value: 72 },
        { label: "2026", value: 97, accent: true },
      ]}
    />
  </SceneShell>
);

export const LibraryDemo: React.FC = () => {
  const { fps, height, width } = useVideoConfig();
  const mH = Math.round(height * 0.4);
  const s1 = 4 * fps;
  const s2 = 4 * fps;
  const s3 = 4 * fps;

  return (
    <AbsoluteFill style={{ background: P.bg }}>
      {/* bottom 60% placeholder (avatar video in real comps) */}
      <div style={{ position: "absolute", left: 0, top: mH, width, height: height - mH, background: "#101418" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width, height: mH, overflow: "hidden" }}>
        <Sequence from={0} durationInFrames={s1}><Scene1 mH={mH} dur={s1} /></Sequence>
        <Sequence from={s1} durationInFrames={s2}><Scene2 mH={mH} startSec={4} /></Sequence>
        <Sequence from={s1 + s2} durationInFrames={s3}><Scene3 mH={mH} dur={s3} /></Sequence>
      </div>
      <div style={{ position: "absolute", left: 0, top: mH - 30, width, height: 60, background: `linear-gradient(to bottom, ${P.bg} 0%, transparent 100%)`, pointerEvents: "none", zIndex: 10 }} />
    </AbsoluteFill>
  );
};
