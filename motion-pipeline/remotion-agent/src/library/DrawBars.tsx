import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Palette, TYPE, SPR, EASE } from "./design";

export type Bar = { label: string; value: number; accent?: boolean };

// Horizontal bars that draw on with a glowing tip and staggered entrances.
export const DrawBars: React.FC<{
  bars: Bar[];
  palette: Palette;
  delay?: number; // frames
  width?: number;
  barHeight?: number;
}> = ({ bars, palette, delay = 0, width = 760, barHeight = 44 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const max = Math.max(...bars.map((b) => b.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width }}>
      {bars.map((b, i) => {
        const local = Math.max(frame - delay - i * 7, 0);
        const appear = spring({ frame: local, fps, config: SPR.settle, durationInFrames: 14 });
        const fill = interpolate(local, [6, 34], [0, b.value / max], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.outExpo,
        });
        const color = b.accent ? palette.accent : palette.accent2;
        const filledW = fill * (width - 150);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              opacity: appear,
              transform: `translateX(${interpolate(appear, [0, 1], [-40, 0])}px)`,
            }}
          >
            <div style={{ ...TYPE.label, fontSize: 28, color: palette.dim, width: 132, textAlign: "right" }}>
              {b.label}
            </div>
            <div style={{ position: "relative", flex: 1, height: barHeight }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: barHeight / 2,
                  background: "rgba(255,255,255,0.07)",
                  border: `1px solid ${palette.line}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: barHeight,
                  width: filledW,
                  borderRadius: barHeight / 2,
                  background: `linear-gradient(90deg, ${color}55, ${color})`,
                  boxShadow: `0 0 22px ${color}66`,
                }}
              />
              {/* glowing tip */}
              {fill > 0.02 && (
                <div
                  style={{
                    position: "absolute",
                    left: filledW - 6,
                    top: barHeight / 2 - 9,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 24px ${color}, 0 0 60px ${color}88`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
