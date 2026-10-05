import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import {
  HandDrawnFrame, useHandDrawnLayout, HeadlineHook, EvidenceReveal, FullFrameAvatar,
  HD, HandWord, MarkerHighlight, HandUnderline, FlowDiagram, HD_ICONS, StatCountUp,
} from "../library";

/* ════════════════════════════════════════════════════════════════════════════
   HAND-DRAWN ANNOTATION — THE FALLBACK MOTION TEMPLATE
   Phase 5 builds a hand-drawn video by COPYING this file and
   swapping the PT-BR copy per script — keep the structure and the hand-drawn grammar.
   Toolkit: src/library/handdrawn.tsx + src/library/sections.tsx.

   ── MANDATORY OPENING — EVERY video starts with: ──
     SECTION 1  <HeadlineHook>     0.0–3.0s    the clickbait headline of the OVERALL view
     SECTION 2  <EvidenceReveal>   ~3.0–7.0s   a REAL screenshot of the thing + a data stamp
     SECTION 3  <FullFrameAvatar>  ~7.0–11.0s  avatar fills the WHOLE frame, normal subtitles,
                                               NO motion, NO b-roll (the breather)
   Then SECTION 4 (mechanism), 5 (payoff/CTA). See motion-pipeline/SECTION_PIPELINE.md.

   ARCHITECTURE: <HandDrawnFrame> clips its children to the top 40%, so the full-frame
   breather can't live inside it. It's an OVERLAY — a sibling <Sequence> AFTER
   <HandDrawnFrame> at the root <AbsoluteFill>. The base frame keeps the avatar AUDIO
   playing the whole time; the overlay shows the full-frame, muted, trimBefore-synced
   crop. No motion is scheduled in the paper area during the breather window.

   Rules that still apply: visual-plan no-overlap, complement-not-transcribe (≤3 words
   shared w/ narration), ≤15 words on screen, one bounce accent per section. NO emoji.
   ──────────────────────────────────────────────────────────────────────────── */

// Per-video: set to the avatar file copied into public/ by Phase 3.
const AVATAR = "sample_avatar.mp4";

export const HandDrawnTemplate: React.FC = () => {
  const { fps, width } = useVideoConfig();
  const { padTop } = useHandDrawnLayout();
  const F = (s: number) => Math.round(s * fps);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <HandDrawnFrame avatarSrc={AVATAR}>
        {/* ══ SECTION 1 (0–3.0s) — clickbait headline of the overall view (MANDATORY) ══ */}
        <Sequence from={0} durationInFrames={F(3)}>
          <HeadlineHook
            kicker="UMA SKILL SÓ"
            lead={["O CLAUDE CODE", "VIRA UM ESTÚDIO"]}
            accent="DE ANIMAÇÃO"
            live
          />
        </Sequence>

        {/* ══ SECTION 2 (3.0–7.0s) — real-life evidence: live screenshot + data stamp (MANDATORY) ══ */}
        <Sequence from={F(3)} durationInFrames={F(4)}>
          <EvidenceReveal
            kicker="A SKILL É REAL"
            src="refs/sample_page.png"          // ← per-video: real capture via skill capture-references
            domain="example.com"
            focus={{ fx: 200, fy: 262 }}     // circle the proof region (here: the npx install command)
            focusR={{ rx: 158, ry: 40 }}
            stamp="1 COMANDO"                // the hard data point on the red sticker
            caption="VÍDEO FEITO COM CÓDIGO"
          />
        </Sequence>

        {/* 7.0–11.0s : paper area intentionally EMPTY — the SECTION 3 full-frame overlay owns the frame */}

        {/* ── SECTION 4 (11.0–16.0s) — mechanism / how it works (FlowDiagram) ── */}
        <Sequence from={F(11)} durationInFrames={F(5)}>
          <div style={{ position: "absolute", inset: 0, paddingTop: padTop - 24, paddingLeft: 130, paddingRight: 60 }}>
            <FlowDiagram delay={2} width={width} top={padTop - 30} steps={[
              { icon: HD_ICONS.doc, label: "TEXTO" },
              { icon: HD_ICONS.play, label: "CENA" },
              { icon: HD_ICONS.check, label: "PRONTO" },
            ]} />
            <div style={{ marginTop: 158, position: "relative", display: "inline-block" }}>
              <MarkerHighlight delay={26} width={500} height={32} />
              <HandWord delay={20} size={70} color={HD.accent} bounce>VOCÊ SÓ ESCREVE</HandWord>
              <HandUnderline width={500} delay={30} top={84} />
            </div>
          </div>
        </Sequence>

        {/* ── SECTION 5a (16.0–18.0s) — payoff / stat ── */}
        <Sequence from={F(16)} durationInFrames={F(2)}>
          <div style={{ position: "absolute", inset: 0, paddingTop: padTop - 10, paddingLeft: 130, paddingRight: 60 }}>
            <StatCountUp delay={2} to={10} suffix="X" />
            <div style={{ marginTop: 4 }}><HandWord delay={14} size={44} weight={600}>MAIS RÁPIDO</HandWord></div>
          </div>
        </Sequence>

        {/* ── SECTION 5b (18.0–22.0s) — CTA ── */}
        <Sequence from={F(18)} durationInFrames={F(4)}>
          <HeadlineHook kicker="SALVA ISSO" lead={["TESTA O"]} accent="REMOTION HOJE" live={false} size={88} />
        </Sequence>
      </HandDrawnFrame>

      {/* ══ SECTION 3 (7.0–11.0s) — full-frame avatar breather (overlay; no motion, no b-roll) ══ */}
      <Sequence from={F(7)} durationInFrames={F(4)}>
        {/* NO baked text — subtitles are burned in Phase 8 over the whole video. */}
        <FullFrameAvatar
          avatarSrc={AVATAR}
          trimBeforeFrames={F(7)}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
