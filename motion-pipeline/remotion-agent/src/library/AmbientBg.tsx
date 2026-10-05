import React, { useMemo } from "react";
import { useCurrentFrame, random, interpolate } from "remotion";
import { noise2D } from "@remotion/noise";
import { Palette } from "./design";

// Living background: noise-driven aurora blobs + drifting particles +
// film grain + vignette. Nothing is ever static.
export const AmbientBg: React.FC<{
  mH: number;
  palette: Palette;
  seed?: string;
  intensity?: number; // 0..1, default 1
}> = ({ mH, palette, seed = "bg", intensity = 1 }) => {
  const frame = useCurrentFrame();
  const t = frame / 25;

  const blobX = noise2D(seed + "x", t * 0.07, 0) * 220;
  const blobY = noise2D(seed + "y", 0, t * 0.07) * 90;
  const blob2X = noise2D(seed + "x2", t * 0.05, 7) * 260;
  const breathe = 1 + noise2D(seed + "s", t * 0.1, 3) * 0.12;

  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: random(seed + "px" + i) * 1080,
        y: random(seed + "py" + i),
        size: 1.5 + random(seed + "ps" + i) * 3.5,
        speed: 14 + random(seed + "pv" + i) * 30,
        drift: (random(seed + "pd" + i) - 0.5) * 40,
        alpha: 0.15 + random(seed + "pa" + i) * 0.45,
      })),
    [seed]
  );

  return (
    <div style={{ position: "absolute", width: 1080, height: mH, overflow: "hidden", background: palette.bg }}>
      {/* aurora blobs */}
      <div
        style={{
          position: "absolute",
          left: 200 + blobX,
          top: -160 + blobY,
          width: 900,
          height: 700,
          transform: `scale(${breathe})`,
          background: `radial-gradient(ellipse at center, ${palette.bgGlow} 0%, transparent 62%)`,
          opacity: 0.9 * intensity,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -350 + blob2X,
          top: mH * 0.3,
          width: 800,
          height: 600,
          background: `radial-gradient(ellipse at center, ${palette.accent}14 0%, transparent 60%)`,
          opacity: intensity,
        }}
      />
      {/* particles drifting upward */}
      {particles.map((p, i) => {
        const y = ((p.y * (mH + 80) - t * p.speed) % (mH + 80) + (mH + 80)) % (mH + 80) - 40;
        const x = p.x + Math.sin(t * 0.8 + i) * p.drift * 0.3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: i % 4 === 0 ? palette.accent : palette.ink,
              opacity: p.alpha * intensity,
              boxShadow: i % 4 === 0 ? `0 0 ${p.size * 3}px ${palette.accent}` : "none",
            }}
          />
        );
      })}
      {/* scanline-ish grain (cheap, deterministic) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,${0.012 + (frame % 2) * 0.006}) 0px, transparent 2px, transparent 4px)`,
          mixBlendMode: "overlay",
        }}
      />
      {/* vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 45%, transparent 50%, ${palette.bg} 130%)`,
          opacity: interpolate(intensity, [0, 1], [0.4, 0.85]),
        }}
      />
    </div>
  );
};
