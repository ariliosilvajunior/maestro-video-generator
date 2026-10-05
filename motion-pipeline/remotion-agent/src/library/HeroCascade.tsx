import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Palette, FONTS, TIMING } from "./design";

// THE hero moment: one word/short phrase cascades in letter-by-letter with
// squash & stretch, rotation overshoot, and a chromatic RGB split that
// collapses over the first 8 frames. This is the rationed showpiece —
// use for AT MOST 1-2 hero words per VIDEO (the topic word, the payoff).
// Everything else snaps. If two scenes both use HeroCascade, cut one.
export const HeroCascade: React.FC<{
  text: string; // short — counts toward the 15-word cap
  palette: Palette;
  delay?: number; // frames
  fontSize?: number;
  accent?: boolean; // accent color instead of ink
  chromatic?: boolean; // RGB split on entrance (default true)
}> = ({ text, palette, delay = 0, fontSize = 150, accent = false, chromatic = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - delay;
  const ab = chromatic
    ? interpolate(local, [0, TIMING.chromaticFrames], [12, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const letters = text.toUpperCase().split("");
  const row = (color: string, dx: number, blend?: React.CSSProperties["mixBlendMode"]) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        transform: `translateX(${dx}px)`,
        mixBlendMode: blend,
      }}
    >
      {letters.map((ch, i) => {
        const ll = local - i * 1.7;
        const s = spring({ frame: Math.max(ll, 0), fps, config: { damping: 11, stiffness: 260, mass: 0.7 }, durationInFrames: 16 });
        // squash & stretch: tall while falling, squash on impact, settle
        const scaleY = interpolate(s, [0, 0.55, 0.78, 1], [1.45, 1.18, 0.86, 1]);
        const scaleX = interpolate(s, [0, 0.55, 0.78, 1], [0.72, 0.9, 1.12, 1]);
        const rot = interpolate(s, [0, 0.7, 1], [-9, 3, 0]);
        return (
          <span
            key={i}
            style={{
              fontFamily: FONTS.display,
              fontSize,
              lineHeight: 0.95,
              textTransform: "uppercase",
              color,
              opacity: ll >= 0 ? Math.min(s * 1.6, 1) : 0,
              display: "inline-block",
              transform: `translateY(${interpolate(s, [0, 1], [-80, 0])}px) rotate(${rot}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
              transformOrigin: "bottom center",
              textShadow: blend ? undefined : "0 8px 34px rgba(0,0,0,0.65)",
              whiteSpace: "pre",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );

  return (
    <div style={{ position: "relative", width: "100%", height: fontSize * 1.05 }}>
      {ab > 0.5 && row("rgba(255,0,60,0.8)", -ab, "screen")}
      {ab > 0.5 && row("rgba(0,229,255,0.8)", ab, "screen")}
      {row(accent ? palette.accent : palette.ink, 0)}
    </div>
  );
};
