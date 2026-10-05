import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Palette, SPR, EASE } from "./design";

// Strokes an SVG path on (strokeDashoffset) with a glow, then breathes.
// `path` must be a single SVG path in a 100x100 viewBox.
export const IconDraw: React.FC<{
  path: string;
  palette: Palette;
  delay?: number; // frames
  size?: number;
  strokeWidth?: number;
  pathLength?: number; // tune if draw looks off; default 400
}> = ({ path, palette, delay = 0, size = 150, strokeWidth = 5, pathLength = 400 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(frame - delay, 0);

  const draw = interpolate(local, [0, 26], [pathLength, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.outExpo,
  });
  const pop = spring({ frame: local, fps, config: SPR.pop, durationInFrames: 12 });
  const breathe = 1 + Math.sin(local * 0.12) * 0.03;

  return (
    <div
      style={{
        width: size,
        height: size,
        opacity: frame >= delay ? 1 : 0,
        transform: `scale(${interpolate(pop, [0, 1], [0.6, 1]) * breathe})`,
        filter: `drop-shadow(0 0 16px ${palette.accent}88)`,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <path
          d={path}
          fill="none"
          stroke={palette.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={draw}
        />
      </svg>
    </div>
  );
};
