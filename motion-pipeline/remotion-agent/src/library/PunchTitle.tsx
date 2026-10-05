import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Palette, TYPE, SPR, SNAP_DUR } from "./design";

// Headline: lines SNAP in staggered (V8 — confident settle, no bounce, no
// skew wobble) with an underline that draws on as follow-through.
// `accentWords` (lowercase) get the accent color + glow.
export const PunchTitle: React.FC<{
  lines: string[];
  palette: Palette;
  delay?: number; // frames
  size?: "mega" | "title";
  accentWords?: string[];
  underline?: boolean;
}> = ({ lines, palette, delay = 0, size = "title", accentWords = [], underline = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const type = TYPE[size];
  const accents = accentWords.map((w) => w.toLowerCase());

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {lines.map((line, li) => {
        const local = frame - delay - li * 3;
        const s = spring({ frame: Math.max(local, 0), fps, config: SPR.snap, durationInFrames: SNAP_DUR });
        const y = interpolate(s, [0, 1], [40, 0]);
        return (
          <div
            key={li}
            style={{
              ...type,
              opacity: local >= 0 ? s : 0,
              transform: `translateY(${y}px) scale(${interpolate(s, [0, 1], [0.88, 1])})`,
              textAlign: "center",
              textShadow: "0 6px 30px rgba(0,0,0,0.6)",
            }}
          >
            {line.split(" ").map((word, wi) => {
              const isAccent = accents.includes(word.toLowerCase().replace(/[.,!?]/g, ""));
              return (
                <span
                  key={wi}
                  style={{
                    color: isAccent ? palette.accent : palette.ink,
                    textShadow: isAccent ? `0 0 26px ${palette.accent}99` : undefined,
                  }}
                >
                  {word}
                  {wi < line.split(" ").length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        );
      })}
      {underline && (
        <div
          style={{
            height: 7,
            width: interpolate(
              spring({ frame: Math.max(frame - delay - lines.length * 3 - 2, 0), fps, config: SPR.settle, durationInFrames: 18 }),
              [0, 1],
              [0, 230]
            ),
            marginTop: 14,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${palette.accent}, ${palette.accent2})`,
            boxShadow: `0 0 18px ${palette.accent}88`,
          }}
        />
      )}
    </div>
  );
};
