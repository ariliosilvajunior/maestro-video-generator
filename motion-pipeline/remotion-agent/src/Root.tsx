import React from "react";
import { Composition } from "remotion";

// ─────────────────────────────────────────────────────────────────────────
// Root.tsx — registers the REFERENCE compositions the pipeline copies from.
//
// Every real video gets its own `src/compositions/<Name>.tsx` and is appended
// here by `python3 maestro_state.py register-comp --name <Name> --duration <sec>`
// (locked + idempotent). That helper relies on TWO anchors — keep both intact:
//   • import anchor   = the LAST `from "./compositions/..."` line below
//   • register anchor = the final `</>` line at the bottom
//
// All demos use the bundled placeholder `public/sample_avatar.mp4` (40 s) and
// the sample assets in `public/assets/sample/` + `public/refs/sample_*.png`,
// so `npx remotion render src/index.ts PremiumSectionRef out.mp4` works on a
// fresh install (this is what `bin/smoke_test.py` renders).
// ─────────────────────────────────────────────────────────────────────────

import { PremiumSectionRef } from "./compositions/PremiumSectionRef";
import { OpeningHookRef } from "./compositions/OpeningHookRef";
import { PremiumOpeningDemo } from "./compositions/PremiumOpeningDemo";
import { HandDrawnTemplate } from "./compositions/HandDrawnTemplate";
import { HandDrawnGrammarRef } from "./compositions/HandDrawnGrammarRef";
import { SectionCycleDemo } from "./compositions/SectionCycleDemo";
import { SectionDemo } from "./compositions/SectionDemo";
import { RefShotDemo } from "./compositions/RefShotDemo";
import { LibraryDemo } from "./compositions/LibraryDemo";
import { LottieDemoV8 } from "./compositions/LottieDemoV8";
import { SplitFlowDemo } from "./compositions/SplitFlowDemo";
import { FullFlowDemo } from "./compositions/FullFlowDemo";
import { MotionLabBlur, MotionLabType, MotionLabStinger, MotionLabParallax, MotionLabFps } from "./compositions/MotionLabV8";
import { MediacaoAutismo } from "./compositions/MediacaoAutismo";

const FPS = 25;
const W = 1080;
const H = 1920;
const sec = (s: number) => Math.round(s * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── CANONICAL REFERENCES (copy these) ─────────────────────────────── */}
      <Composition id="PremiumSectionRef" component={PremiumSectionRef} durationInFrames={sec(33)} fps={FPS} width={W} height={H} />
      <Composition id="OpeningHookRef" component={OpeningHookRef} durationInFrames={sec(4.616)} fps={FPS} width={W} height={H} defaultProps={{ variant: "V3" }} />
      <Composition id="HandDrawnTemplate" component={HandDrawnTemplate} durationInFrames={sec(22)} fps={FPS} width={W} height={H} />
      <Composition id="HandDrawnGrammarRef" component={HandDrawnGrammarRef} durationInFrames={sec(35.5)} fps={FPS} width={W} height={H} />

      {/* ── DEMOS / REGRESSION RENDERS ────────────────────────────────────── */}
      <Composition id="PremiumOpeningDemo" component={PremiumOpeningDemo} durationInFrames={sec(10)} fps={FPS} width={W} height={H} />
      <Composition id="SectionCycleDemo" component={SectionCycleDemo} durationInFrames={sec(35.5)} fps={FPS} width={W} height={H} />
      <Composition id="SectionDemo" component={SectionDemo} durationInFrames={sec(11.5)} fps={FPS} width={W} height={H} />
      <Composition id="RefShotDemo" component={RefShotDemo} durationInFrames={sec(6)} fps={FPS} width={W} height={H} />
      <Composition id="LibraryDemo" component={LibraryDemo} durationInFrames={sec(12)} fps={FPS} width={W} height={H} />
      <Composition id="LottieDemoV8" component={LottieDemoV8} durationInFrames={sec(12)} fps={FPS} width={W} height={H} />
      <Composition id="SplitFlowDemo" component={SplitFlowDemo} durationInFrames={75} fps={FPS} width={W} height={H} />
      <Composition id="FullFlowDemo" component={FullFlowDemo} durationInFrames={75} fps={FPS} width={W} height={H} />
      <Composition id="MotionLabBlur" component={MotionLabBlur} durationInFrames={sec(4)} fps={FPS} width={W} height={768} />
      <Composition id="MotionLabType" component={MotionLabType} durationInFrames={sec(4)} fps={FPS} width={W} height={768} />
      <Composition id="MotionLabStinger" component={MotionLabStinger} durationInFrames={sec(4)} fps={FPS} width={W} height={768} />
      <Composition id="MotionLabParallax" component={MotionLabParallax} durationInFrames={sec(4)} fps={FPS} width={W} height={768} />
      <Composition id="MotionLabFps25" component={MotionLabFps} durationInFrames={sec(4)} fps={25} width={W} height={768} />
      <Composition id="MotionLabFps50" component={MotionLabFps} durationInFrames={200} fps={50} width={W} height={768} />
      <Composition id="MediacaoAutismo" component={MediacaoAutismo} durationInFrames={Math.round(95.56 * 25)} fps={25} width={1080} height={1920} />
    </>
  );
};
