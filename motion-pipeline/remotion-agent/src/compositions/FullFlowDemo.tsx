import React from "react";
import { AbsoluteFill } from "remotion";
import { PremiumTheme, PremiumFullFlow } from "../library/premium";

// Verification demo for the §6 variant PremiumFullFlow (QCR-292) on the bundled sample assets.
export const FullFlowDemo: React.FC = () => (
  <AbsoluteFill>
    <PremiumTheme palette="slate-copper">
      <PremiumFullFlow
        assets={[
          "assets/sample/coin_cut.png",
          "assets/sample/clock_cut.png",
          "assets/sample/lock_cut.png",
          "assets/sample/robot_cut.png",
        ]}
      />
    </PremiumTheme>
  </AbsoluteFill>
);
