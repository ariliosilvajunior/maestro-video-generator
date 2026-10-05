import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { Palette, FONTS } from "./design";

// Depth kit (V8): fills the flat frame with a 3-layer parallax space driven
// by the same handheld noise as CameraRig. Topic-flexible via `ghostWord` —
// pass the video's number/keyword ("10X", "GRÁTIS", "API") or null for none.
//   - deep layer  (×-0.5): huge outline ghost word
//   - mid layer   (×-0.25): perspective grid floor
//   - fg layer    (×1.8): floating geometric chips (strongest depth cue)
// Children are NOT wrapped — render ParallaxStage as a sibling UNDER your
// content, directly above AmbientBg. Layers use the scene seed for variety.
export const ParallaxStage: React.FC<{
  mH: number;
  palette: Palette;
  seed?: string;
  ghostWord?: string | null; // ≤6 chars reads best; null disables
  ghostTop?: number; // px, default 140
  grid?: boolean;
  floaters?: boolean;
}> = ({ mH, palette, seed = "px", ghostWord = null, ghostTop = 140, grid = true, floaters = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const camX = noise2D(seed + "sx", t * 0.25, 0) * 26;
  const camY = noise2D(seed + "sy", 0, t * 0.25) * 12;

  const layer = (depth: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    transform: `translateX(${camX * depth}px) translateY(${camY * depth}px)`,
  });

  return (
    <div style={{ position: "absolute", width: 1080, height: mH, overflow: "hidden", pointerEvents: "none" }}>
      {ghostWord && (
        <div style={{ ...layer(-0.5), top: ghostTop, textAlign: "center" }}>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 320,
              lineHeight: 0.9,
              textTransform: "uppercase",
              color: "transparent",
              WebkitTextStroke: `2px ${palette.line}`,
              opacity: 0.55,
            }}
          >
            {ghostWord}
          </span>
        </div>
      )}
      {grid && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: mH * 0.66,
            height: mH * 0.38,
            backgroundImage: `linear-gradient(${palette.line} 1px, transparent 1px), linear-gradient(90deg, ${palette.line} 1px, transparent 1px)`,
            backgroundSize: "90px 90px",
            transform: `translateX(${camX * -0.25}px) translateY(${camY * -0.25}px) rotateX(64deg)`,
            transformOrigin: "center top",
            opacity: 0.45,
            maskImage: "linear-gradient(180deg, transparent, black 35%)",
            WebkitMaskImage: "linear-gradient(180deg, transparent, black 35%)",
          }}
        />
      )}
      {floaters && (
        <div style={{ ...layer(1.8) }}>
          <div
            style={{
              position: "absolute",
              left: 90,
              top: mH * 0.18,
              width: 64,
              height: 64,
              borderRadius: 16,
              border: `2px solid ${palette.accent}`,
              opacity: 0.55,
              transform: `rotate(${10 + t * 8}deg)`,
              boxShadow: `0 0 22px ${palette.accent}55`,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 100,
              top: mH * 0.68,
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: `${palette.accent2}30`,
              border: `2px solid ${palette.accent2}`,
              opacity: 0.6,
            }}
          />
        </div>
      )}
    </div>
  );
};
