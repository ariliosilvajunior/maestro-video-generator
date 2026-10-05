import React from "react";
import { PremiumTheme, PremiumSplitFlow } from "../library/premium";

// Verification demo for the §5 variant PremiumSplitFlow (QCR-292/293) on the bundled sample assets.
export const SplitFlowDemo: React.FC = () => (
  <PremiumTheme palette="slate-copper">
    <PremiumSplitFlow
      w={{ from: 0, durationInFrames: 75 }}
      avatarSrc="sample_avatar.mp4"
      assets={[
        "assets/sample/robot_cut.png",
        "assets/sample/coin_cut.png",
        "assets/sample/lock_cut.png",
      ]}
    />
  </PremiumTheme>
);
