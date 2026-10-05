import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Palette, SPR, SNAP_DUR } from "./design";

// Glass card with a shine sweep across it after entrance.
export const GlassCard: React.FC<{
  palette: Palette;
  delay?: number; // frames
  children: React.ReactNode;
  padding?: string;
}> = ({ palette, delay = 0, children, padding = "22px 44px" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(frame - delay, 0);

  const s = spring({ frame: local, fps, config: SPR.snap, durationInFrames: SNAP_DUR });
  const shineX = interpolate(local, [12, 34], [-200, 700], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding,
        borderRadius: 22,
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(14px)",
        border: `1.5px solid ${palette.line}`,
        boxShadow: `0 14px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)`,
        opacity: frame >= delay ? s : 0,
        transform: `translateY(${interpolate(s, [0, 1], [26, 0])}px) scale(${interpolate(s, [0, 1], [0.94, 1])})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          left: shineX,
          width: 90,
          height: "200%",
          transform: "rotate(18deg)",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
};
