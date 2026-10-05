import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Palette, TYPE, SPR, SNAP_DUR } from "./design";

// Spring number ticker with overshoot + glow pulse on settle.
export const CountUp: React.FC<{
  to: number;
  palette: Palette;
  delay?: number; // frames
  prefix?: string;
  suffix?: string;
  label?: string;
  decimals?: number;
}> = ({ to, palette, delay = 0, prefix = "", suffix = "", label, decimals = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(frame - delay, 0);

  const s = spring({ frame: local, fps, config: SPR.settle, durationInFrames: 36 });
  const value = (to * s).toFixed(decimals);
  const settled = s > 0.98;
  const pulse = settled ? 1 + Math.sin((frame - delay) * 0.25) * 0.015 : 1;
  // CountUp is usually the scene's ONE accent moment — the number itself
  // already animates (ticker + glow pulse), so the container snaps in clean.
  const entrance = spring({ frame: local, fps, config: SPR.snap, durationInFrames: SNAP_DUR });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: frame >= delay ? entrance : 0,
        transform: `scale(${interpolate(entrance, [0, 1], [0.9, 1]) * pulse})`,
      }}
    >
      <div
        style={{
          ...TYPE.stat,
          color: palette.accent,
          textShadow: `0 0 30px ${palette.accent}99, 0 0 90px ${palette.accent}33`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {prefix}
        {value}
        {suffix}
      </div>
      {label && (
        <div style={{ ...TYPE.label, color: palette.dim, marginTop: 8 }}>{label}</div>
      )}
    </div>
  );
};
