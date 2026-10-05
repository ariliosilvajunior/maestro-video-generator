import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { Palette, TIMING } from "./design";

// V8 impact stinger for the first frames of a scene — place as the FIRST
// child of every Sequence that starts at a b-roll cut-back. Radial speed
// streaks shooting outward + quick flash. Pair with the CameraRig zoom-whip
// entrance (automatic) and, for hero scenes, HeroCascade's chromatic split.
export const Stinger: React.FC<{ palette: Palette; mH: number }> = ({ palette, mH }) => {
  const frame = useCurrentFrame();
  if (frame > TIMING.stingerFrames) return null;

  const flash = interpolate(frame, [0, 1, TIMING.stingerFrames], [0.7, 0.35, 0], {
    extrapolateRight: "clamp",
  });
  const streakLen = interpolate(frame, [0, TIMING.stingerFrames - 1], [260, 30], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <div style={{ position: "absolute", width: 1080, height: mH, pointerEvents: "none", zIndex: 50 }}>
      {Array.from({ length: 14 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540,
            top: mH * 0.48,
            width: streakLen,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${palette.accent}cc)`,
            transform: `rotate(${(i / 14) * 360}deg) translateX(${130 + frame * 32}px)`,
            transformOrigin: "left center",
            opacity: flash,
          }}
        />
      ))}
      <div style={{ position: "absolute", inset: 0, background: palette.ink, opacity: flash * 0.22 }} />
    </div>
  );
};
