import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import {
  HD, HandDrawnFrame, useHandDrawnLayout, Kicker, HandWord, ScreenshotCard, CircleAnno, HandArrow,
} from "../library";

/* Verifies the reference-capture path: a REAL screenshot (captured live via
   Playwright → prepared into public/refs/<Name>.png; here the bundled sample_repo.png) shown in a
   hand-drawn browser card and MARKED UP with a draw-on circle + arrow. */

const AVATAR = "sample_avatar.mp4";

export const RefShotDemo: React.FC = () => {
  const { fps, width } = useVideoConfig();
  const { mH, padTop } = useHandDrawnLayout();
  const F = (s: number) => Math.round(s * fps);

  return (
    <HandDrawnFrame avatarSrc={AVATAR}>
      <Sequence from={0} durationInFrames={F(6)}>
        <div style={{ position: "absolute", inset: 0, paddingTop: padTop * 0.5, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 14 }}>
            <Kicker delay={0}>OPEN SOURCE</Kicker>
          </div>
          <div style={{ position: "relative" }}>
            <ScreenshotCard src="refs/sample_repo.png" domain="github.com/sample-org" delay={6} width={640} height={372} />
            {/* draw-on circle highlighting the star count (right column) + arrow */}
            <CircleAnno cx={470} cy={232} rx={150} ry={52} delay={30} w={640} h={420} />
            <HandArrow x1={250} y1={400} x2={400} y2={250} delay={42} w={640} h={420} />
          </div>
          <div style={{ marginTop: 18 }}>
            <HandWord delay={18} size={56} color={HD.accent} bounce>12 MIL ESTRELAS</HandWord>
          </div>
        </div>
      </Sequence>
    </HandDrawnFrame>
  );
};
