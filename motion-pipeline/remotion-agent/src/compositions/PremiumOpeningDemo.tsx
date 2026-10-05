import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { PremiumFrame, PremiumHeadline, PremiumEvidence, PremiumKineticCaption, PremiumTheme, FullFrameAvatar } from "../library";

/* PremiumOpeningDemo — the template, now with the NEW kinetic-caption section and
   2-second sections. Order:
     1  Headline                 0–2s   (split: headline upper, avatar below)
     2a Evidence — SCROLL        2–4s   (screenshot scrolls)
     2b Evidence — ZOOM          4–6s   (subtle zoom into the element)
     3  Full-frame avatar        6–8s   (breather, fast zoom)
     3b Kinetic Caption (NEW)    8–10s  (palette-color bg, words pop 2–3 at a time, Proxima, fade-up) */

const AVATAR = "sample_avatar.mp4";

export const PremiumOpeningDemo: React.FC = () => {
  const { fps } = useVideoConfig();
  const F = (s: number) => Math.round(s * fps);
  const D = F(2);
  return (
    <PremiumTheme palette="charcoal-gold">
      <AbsoluteFill style={{ background: "#000" }}>
        <PremiumFrame avatarSrc={AVATAR}>
          {/* 1 — headline */}
          <Sequence from={0} durationInFrames={D}>
            <PremiumHeadline lead={["Ganhe enquanto"]} accent="a IA pensa" />
          </Sequence>
          {/* 2a — evidence SCROLL */}
          <Sequence from={F(2)} durationInFrames={D}>
            <PremiumEvidence kicker="É real" src="refs/sample_page.png" domain="example.com"
              motion="scroll" scroll={900} durFrames={D} stamp="Olha" caption="Página real" />
          </Sequence>
          {/* 2b — evidence ZOOM (subtle, onto the headline element) */}
          <Sequence from={F(4)} durationInFrames={D}>
            <PremiumEvidence kicker="O detalhe" src="refs/sample_page.png" domain="example.com"
              motion="zoom" zoomTo={1.5} durFrames={D}
              focus={{ fx: 159, fy: 337 }} focusR={{ rx: 138, ry: 96 }} stamp="Aqui" caption="No detalhe" />
          </Sequence>
        </PremiumFrame>
        {/* 3 — full-frame avatar breather */}
        <Sequence from={F(6)} durationInFrames={D}>
          <FullFrameAvatar avatarSrc={AVATAR} trimBeforeFrames={F(6)} />
        </Sequence>
        {/* 3b — NEW kinetic caption: palette bg, words pop 2–3 at a time, Proxima, fade-up */}
        <Sequence from={F(8)} durationInFrames={D}>
          <PremiumKineticCaption text="É de graça e roda sozinho" wordsPerGroup={2} durFrames={D} />
        </Sequence>
      </AbsoluteFill>
    </PremiumTheme>
  );
};
