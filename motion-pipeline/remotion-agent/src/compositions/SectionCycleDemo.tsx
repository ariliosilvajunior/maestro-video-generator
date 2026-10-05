import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import {
  HandDrawnFrame,
  HeadlineHook,
  EvidenceReveal,
  FullFrameAvatar,
  FullMotionFrame,
  SplitGraphicMotion,
  FullGraphicFrame,
} from "../library";

/* ════════════════════════════════════════════════════════════════════════════
   SectionCycleDemo — the hand-drawn 6-SECTION GRAMMAR, one full cycle
   plus a repeat of 3→6 to prove the loop.

     1  HeadlineHook       0.0– 3.0s  headline (as it is)                 [in frame]
     2  EvidenceReveal     3.0– 7.0s  real screenshot proof (as it is)    [in frame]
     3  FullFrameAvatar    7.0–10.5s  avatar only, subtitles only, no gfx [overlay]
     4  FullMotionFrame   10.5–14.5s  motion + text, NO avatar            [overlay]
     5  SplitGraphicMotion14.5–18.0s  split: avatar BELOW, gfx ABOVE,     [in frame]
                                       NO text — graphics only
     6  FullGraphicFrame  18.0–22.0s  fullscreen motion, gfx/icons only,  [overlay]
                                       NO text, no avatar
     ── repeat 3→6 ──
     3  FullFrameAvatar   22.0–25.0s
     4  FullMotionFrame   25.0–28.5s
     5  SplitGraphicMotion28.5–31.5s
     6  FullGraphicFrame  31.5–35.5s

   WIRING: sections 1,2,5 are CHILDREN of <HandDrawnFrame> (top-40% paper panel,
   avatar in the bottom 60%). Sections 3,4,6 are OVERLAY siblings placed AFTER the
   frame (they cover the full 1080×1920). The HandDrawnFrame avatar carries the
   narration AUDIO continuously; overlays are muted + trimBefore-synced where they
   show the avatar. NO baked text anywhere — Phase-8 burns subtitles over the lot.
   ──────────────────────────────────────────────────────────────────────────── */

const AVATAR = "sample_avatar.mp4";

export const SectionCycleDemo: React.FC = () => {
  const { fps } = useVideoConfig();
  const F = (s: number) => Math.round(s * fps);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <HandDrawnFrame avatarSrc={AVATAR}>
        {/* 1 — headline */}
        <Sequence from={0} durationInFrames={F(3)}>
          <HeadlineHook
            kicker="UMA SKILL SÓ"
            lead={["O CLAUDE CODE", "VIRA UM ESTÚDIO"]}
            accent="DE ANIMAÇÃO"
            live
          />
        </Sequence>

        {/* 2 — real evidence */}
        <Sequence from={F(3)} durationInFrames={F(4)}>
          <EvidenceReveal
            kicker="A SKILL É REAL"
            src="refs/sample_page.png"
            domain="example.com"
            focus={{ fx: 200, fy: 262 }}
            focusR={{ rx: 158, ry: 40 }}
            stamp="1 COMANDO"
            caption="VÍDEO FEITO COM CÓDIGO"
          />
        </Sequence>

        {/* 5 — split: graphics above, avatar below, NO text */}
        <Sequence from={F(14.5)} durationInFrames={F(3.5)}>
          <SplitGraphicMotion icons={["doc", "gear", "play"]} />
        </Sequence>

        {/* 5 (repeat) */}
        <Sequence from={F(28.5)} durationInFrames={F(3)}>
          <SplitGraphicMotion icons={["bolt", "gear", "rocket"]} />
        </Sequence>
      </HandDrawnFrame>

      {/* 3 — avatar only (overlay) */}
      <Sequence from={F(7)} durationInFrames={F(3.5)}>
        <FullFrameAvatar avatarSrc={AVATAR} trimBeforeFrames={F(7)} />
      </Sequence>

      {/* 4 — motion + text, no avatar (overlay) */}
      <Sequence from={F(10.5)} durationInFrames={F(4)}>
        <FullMotionFrame
          kicker="COMO FUNCIONA"
          lines={[{ text: "TUDO VIRA" }, { text: "CÓDIGO", accent: true }]}
          steps={[
            { icon: "doc", label: "ROTEIRO" },
            { icon: "gear", label: "REMOTION" },
            { icon: "play", label: "VÍDEO" },
          ]}
          stat={{ to: 100, suffix: "%" }}
          tail="SEM EDITOR"
        />
      </Sequence>

      {/* 6 — fullscreen graphics only, NO text (overlay) */}
      <Sequence from={F(18)} durationInFrames={F(4)}>
        <FullGraphicFrame center="bolt" satellites={["doc", "gear", "rocket", "check"]} />
      </Sequence>

      {/* ── repeat 3→6 ── */}
      <Sequence from={F(22)} durationInFrames={F(3)}>
        <FullFrameAvatar avatarSrc={AVATAR} trimBeforeFrames={F(22)} />
      </Sequence>

      <Sequence from={F(25)} durationInFrames={F(3.5)}>
        <FullMotionFrame
          kicker="O RESULTADO"
          lines={[{ text: "MOTION" }, { text: "AUTOMÁTICO", accent: true }]}
          stat={{ to: 10, suffix: "x" }}
          tail="MAIS RÁPIDO"
        />
      </Sequence>

      <Sequence from={F(31.5)} durationInFrames={F(4)}>
        <FullGraphicFrame center="rocket" satellites={["doc", "play", "gear", "bolt", "check"]} />
      </Sequence>
    </AbsoluteFill>
  );
};
