import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import {
  HandDrawnFrame, HeadlineHook, EvidenceReveal, FullFrameAvatar,
  IdeaProcessFlow, IdeaSpotlight, IdeaRadialSystem, IdeaStatBurst, IdeaGridRepeat, IdeaCycleLoop,
  assertVariety,
} from "../library";

/* ════════════════════════════════════════════════════════════════════════════
   HandDrawnGrammarRef — a real PT-BR script through the 6-section grammar, with a
   DISTINCT, line-MATCHED motion idea per beat. Demo topic: "O Claude Code virou um
   estúdio de animação" (a sample narration).

   Each motion beat below uses a DIFFERENT mechanism, chosen to ILLUSTRATE its line:

     §4  flow      "Você escreve o roteiro, o Claude anima, e sai o vídeo"
                   → IdeaProcessFlow  (a sequence → linear L→R pipeline)
     §5  spotlight "Cada cena vira um componente que se anima sozinho"
                   → IdeaSpotlight    (ONE element waking up — scan sweep + pulse)
     §6  radial    "Um core que conecta roteiro, design, render e publicação"
                   → IdeaRadialSystem (a hub connecting many — centrifugal spokes)
     §4' burst     "Dez vezes mais rápido que editar na mão"
                   → IdeaStatBurst    (a number → 10x bursting with sparks)
     §5' grid      "E cada vídeo sai com a mesma identidade"
                   → IdeaGridRepeat   (sameness → tiled identical cards)
     §6' loop      "Roteiro → render → no ar, no automático"
                   → IdeaCycleLoop    (automation → a dot orbiting a closed ring)

   None repeats; each mirrors the sentence. `assertVariety` fails the render if any
   two adjacent motion beats reuse a mechanism. Sections 5/5' & 6/6' bake NO text
   (meaning via motion alone; Phase-8 burns subtitles). §4/§4' carry a short title.
   ──────────────────────────────────────────────────────────────────────────── */

const AVATAR = "sample_avatar.mp4";

// VARIETY GUARD — the ordered motion mechanisms for this video. Throws if any repeat.
assertVariety(["processFlow", "spotlight", "radialSystem", "statBurst", "gridRepeat", "cycleLoop"]);

export const HandDrawnGrammarRef: React.FC = () => {
  const { fps } = useVideoConfig();
  const F = (s: number) => Math.round(s * fps);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <HandDrawnFrame avatarSrc={AVATAR}>
        {/* 1 — headline */}
        <Sequence from={0} durationInFrames={F(3)}>
          <HeadlineHook kicker="CLAUDE CODE" lead={["VIROU UM", "ESTÚDIO"]} accent="DE ANIMAÇÃO" live />
        </Sequence>

        {/* 2 — real evidence */}
        <Sequence from={F(3)} durationInFrames={F(4)}>
          <EvidenceReveal
            kicker="É UM COMANDO SÓ"
            src="refs/sample_page.png"
            domain="example.com"
            focus={{ fx: 200, fy: 262 }}
            focusR={{ rx: 158, ry: 40 }}
            stamp="1 COMANDO"
            caption="VÍDEO FEITO COM CÓDIGO"
          />
        </Sequence>

        {/* 5 — SPOTLIGHT: one component animates itself (split, no text) */}
        <Sequence from={F(14.5)} durationInFrames={F(3.5)}>
          <IdeaSpotlight icon="play" />
        </Sequence>

        {/* 5' — GRID: every video, same identity (split, no text) */}
        <Sequence from={F(28.5)} durationInFrames={F(3)}>
          <IdeaGridRepeat icon="play" cols={3} rows={2} />
        </Sequence>
      </HandDrawnFrame>

      {/* 3 — avatar lands a line */}
      <Sequence from={F(7)} durationInFrames={F(3.5)}>
        <FullFrameAvatar avatarSrc={AVATAR} trimBeforeFrames={F(7)} />
      </Sequence>

      {/* 4 — FLOW: roteiro → anima → vídeo (full, titled) */}
      <Sequence from={F(10.5)} durationInFrames={F(4)}>
        <IdeaProcessFlow
          full
          kicker="COMO FUNCIONA"
          headline={[{ text: "VOCÊ ESCREVE," }, { text: "O CLAUDE ANIMA", accent: true }]}
          icons={["doc", "gear", "play"]}
        />
      </Sequence>

      {/* 6 — RADIAL: a core connecting roteiro/design/render/publish (full, no text) */}
      <Sequence from={F(18)} durationInFrames={F(4)}>
        <IdeaRadialSystem center="bolt" satellites={["doc", "gear", "rocket", "check"]} full />
      </Sequence>

      {/* ── repeat 3→6 (payoff) ── */}
      <Sequence from={F(22)} durationInFrames={F(3)}>
        <FullFrameAvatar avatarSrc={AVATAR} trimBeforeFrames={F(22)} />
      </Sequence>

      {/* 4' — BURST: 10x faster (full, titled) */}
      <Sequence from={F(25)} durationInFrames={F(3.5)}>
        <IdeaStatBurst full kicker="O RESULTADO" headline={[{ text: "MAIS RÁPIDO", accent: true }]} to={10} suffix="x" />
      </Sequence>

      {/* 6' — LOOP: roteiro → render → no ar, no automático (full, no text) */}
      <Sequence from={F(31.5)} durationInFrames={F(4)}>
        <IdeaCycleLoop icons={["doc", "gear", "play", "rocket"]} full />
      </Sequence>
    </AbsoluteFill>
  );
};
