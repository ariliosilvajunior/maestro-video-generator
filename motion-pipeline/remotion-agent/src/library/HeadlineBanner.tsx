import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Palette, TYPE, SPR, SNAP_DUR, EASE } from "./design";

// HeadlineBanner (V8.1): the S0 clickbait headline.
// A news-style banner that states the video's theme as a curiosity-gap
// headline in the first frames. Kicker chip (pulsing live-dot + label)
// snaps in at frame 0, headline lines snap in staggered right behind it,
// then the banner holds with breathing + a shine sweep so it never reads
// static. Designed for the 0–3s S0 scene (75 frames @25fps).
//
// Copy rules (MOTION_DESIGN_SYSTEM.md §2.6): headline = distilled clickbait
// summary of the VIDEO THEME (curiosity gap / bold claim / number), NEVER
// the spoken opening sentence (complement rule §2.5 applies — ≤3 shared
// words with the concurrent SRT). Max 8 words across both lines.
export const HeadlineBanner: React.FC<{
  kicker: string; // 1-2 words, e.g. "BOMBA", "AGORA", "VAZOU", "URGENTE"
  lines: string[]; // 1-2 headline lines, ≤8 words total
  palette: Palette;
  accentWords?: string[]; // highlighted words (lowercase match)
  delay?: number; // frames
}> = ({ kicker, lines, palette, accentWords = [], delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Normalize both sides so "graça?" matches "graça" regardless of punctuation
  const accents = accentWords.map((w) => w.toLowerCase().replace(/[.,!?]/g, ""));
  const local = frame - delay;

  // Kicker chip: snap in at frame 0 — the QC hook gate needs visuals <2s,
  // so nothing in this component may idle before entering.
  const kickerS = spring({ frame: Math.max(local, 0), fps, config: SPR.snap, durationInFrames: SNAP_DUR });

  // Live-dot pulse (held life)
  const pulse = 0.55 + 0.45 * Math.sin(local / 5);

  // Banner breathing after settle (nothing static >1.5s)
  const breathe = 1 + 0.008 * Math.sin(local / 11);

  // Shine sweep across the banner strip, starts after the settle
  const shineX = interpolate(local, [18, 50], [-340, 1100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.outExpo,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        transform: `scale(${breathe})`,
      }}
    >
      {/* Kicker chip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 26px",
          borderRadius: 999,
          background: `linear-gradient(90deg, ${palette.accent}26, ${palette.accent}0d)`,
          border: `1.5px solid ${palette.line}`,
          opacity: local >= 0 ? kickerS : 0,
          transform: `translateY(${interpolate(kickerS, [0, 1], [26, 0])}px) scale(${interpolate(kickerS, [0, 1], [0.9, 1])})`,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: palette.accent,
            boxShadow: `0 0 ${10 + 10 * pulse}px ${palette.accent}`,
            opacity: 0.6 + 0.4 * pulse,
          }}
        />
        <span style={{ ...TYPE.kicker, fontSize: 30, color: palette.accent }}>{kicker}</span>
      </div>

      {/* Headline lines on a banner strip */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, overflow: "hidden", padding: "6px 30px" }}>
        {lines.map((line, li) => {
          const lLocal = local - 2 - li * 3;
          const s = spring({ frame: Math.max(lLocal, 0), fps, config: SPR.snap, durationInFrames: SNAP_DUR });
          return (
            <div
              key={li}
              style={{
                ...TYPE.title,
                opacity: lLocal >= 0 ? s : 0,
                transform: `translateY(${interpolate(s, [0, 1], [38, 0])}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
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
        {/* Shine sweep (held life on the headline block) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: shineX,
            width: 130,
            height: "100%",
            background: `linear-gradient(105deg, transparent, ${palette.ink}14, transparent)`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Underline bar — draws on as follow-through */}
      <div
        style={{
          height: 8,
          width: interpolate(
            spring({ frame: Math.max(local - 2 - lines.length * 3 - 2, 0), fps, config: SPR.settle, durationInFrames: 18 }),
            [0, 1],
            [0, 300]
          ),
          borderRadius: 4,
          background: `linear-gradient(90deg, ${palette.accent}, ${palette.accent2})`,
          boxShadow: `0 0 18px ${palette.accent}88`,
        }}
      />
    </div>
  );
};
