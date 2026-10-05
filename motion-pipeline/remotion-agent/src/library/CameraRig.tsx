import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { noise2D } from "@remotion/noise";
import { EASE, TIMING } from "./design";

// Wraps a scene's CONTENT (not its background) in a virtual camera:
// 1) snap zoom-whip entrance (scale 1.12 -> 1 in 6 frames, NO bounce — V8)
// 2) layered handheld: low-freq drift + high-freq micro-jitter + ±0.3° roll
// 3) continuous imperceptible push-in so nothing ever feels frozen
// 4) optional exit push (use when the scene ends at a b-roll cut)
export const CameraRig: React.FC<{
  children: React.ReactNode;
  seed?: string;
  durationInFrames?: number; // needed when exit=true
  exit?: boolean;
  driftAmount?: number; // px, default 6
}> = ({ children, seed = "cam", durationInFrames, exit = false, driftAmount = 6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const enterP = interpolate(frame, [0, TIMING.entranceFrames], [0, 1], {
    extrapolateRight: "clamp",
    easing: EASE.outExpo,
  });
  const scaleIn = interpolate(enterP, [0, 1], [1.12, 1]);

  // layered handheld: drift octave + micro-jitter octave + subtle roll
  const dx = noise2D(seed + "dx", t * 0.3, 0) * driftAmount + noise2D(seed + "jx", t * 2.1, 5) * 1.4;
  const dy = noise2D(seed + "dy", 0, t * 0.3) * driftAmount + noise2D(seed + "jy", 9, t * 2.1) * 1.4;
  const roll = noise2D(seed + "rz", t * 0.18, 2) * 0.3; // degrees
  const slowZoom = 1 + Math.min(t * 0.004, 0.06); // imperceptible push-in

  let exitScale = 1;
  let exitOpacity = 1;
  if (exit && durationInFrames) {
    const exitStart = durationInFrames - TIMING.exitFrames;
    const p = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE.whip,
    });
    exitScale = 1 + p * 0.1;
    exitOpacity = 1 - p;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${dx}px, ${dy}px) rotate(${roll}deg) scale(${scaleIn * slowZoom * exitScale})`,
        opacity: exitOpacity,
      }}
    >
      {children}
    </div>
  );
};
