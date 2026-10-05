import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { HandDrawnFrame, HeadlineHook, EvidenceReveal, FullFrameAvatar } from "../library";

/* ════════════════════════════════════════════════════════════════════════════
   SectionDemo — the SECTION-BY-SECTION pipeline, built up to Section 3.
   Topic: Claude Code vira um estúdio de motion design com a skill Remotion.
   Avatar: sample_avatar.mp4. Evidence: refs/sample_page.png (real runs: skill capture-references).

     SECTION 1  0.0–3.0s   HeadlineHook    — clickbait headline of the whole video
     SECTION 2  3.0–7.0s   EvidenceReveal  — REAL remotion.dev screenshot + "1 COMANDO"
     SECTION 3  7.0–11.5s  FullFrameAvatar — avatar fills the WHOLE frame, normal subtitles,
                                             NO motion, NO b-roll (the breather)

   Section 3 is an OVERLAY sibling AFTER <HandDrawnFrame> (which keeps the avatar
   audio playing); the overlay shows the full-frame, muted, trimBefore-synced crop.
   ──────────────────────────────────────────────────────────────────────────── */

const AVATAR = "sample_avatar.mp4";

export const SectionDemo: React.FC = () => {
  const { fps } = useVideoConfig();
  const F = (s: number) => Math.round(s * fps);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <HandDrawnFrame avatarSrc={AVATAR}>
        {/* ── SECTION 1 — clickbait headline (the overall view), split frame ── */}
        <Sequence from={0} durationInFrames={F(3)}>
          <HeadlineHook
            kicker="UMA SKILL SÓ"
            lead={["O CLAUDE CODE", "VIRA UM ESTÚDIO"]}
            accent="DE ANIMAÇÃO"
            live
          />
        </Sequence>
        {/* ── SECTION 2 — real evidence in the UPPER panel (SPLIT), avatar below.
            Width-bound so the important top content is fully visible. Frame CHILD. ── */}
        <Sequence from={F(3)} durationInFrames={F(4)}>
          <EvidenceReveal
            kicker="A SKILL É REAL"
            src="refs/sample_page.png"
            domain="example.com"
            motion="scroll"
            scroll={1100}
            durFrames={F(4)}
            stamp="1 COMANDO"
            caption="VÍDEO FEITO COM CÓDIGO"
          />
        </Sequence>
      </HandDrawnFrame>

      {/* ── SECTION 3 — full-frame avatar breather (no motion, no b-roll) ── */}
      <Sequence from={F(7)} durationInFrames={F(4.5)}>
        <FullFrameAvatar
          avatarSrc={AVATAR}
          trimBeforeFrames={F(7)}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
