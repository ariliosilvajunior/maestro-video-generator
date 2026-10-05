import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Palette, TYPE, SPR, SNAP_DUR } from "./design";

export type TimedWord = {
  text: string;
  at: number; // ABSOLUTE seconds in the full video when this word is SPOKEN (from SRT)
  accent?: boolean; // accent color + glow + the ONE allowed bouncy pop
};

// Speech-synced keyword bursts: each keyword snaps in at the exact moment
// its concept is spoken. V8: non-accent words use the SNAP settle (damping
// 200, 5 frames, scale 0.92→1 — zero bounce); ONLY `accent` words get the
// bouncy ACCENT spring. Ration: at most one accent word per scene.
// `sceneStartSec` = absolute second the parent <Sequence> starts.
export const KineticWords: React.FC<{
  words: TimedWord[];
  sceneStartSec: number;
  palette: Palette;
  size?: "mega" | "title";
  maxWidth?: number;
}> = ({ words, sceneStartSec, palette, size = "title", maxWidth = 940 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const type = TYPE[size];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "baseline",
        // px units: em would resolve against the container's default font size
        gap: `6px ${Math.round(type.fontSize * 0.26)}px`,
        maxWidth,
        textAlign: "center",
      }}
    >
      {words.map((w, i) => {
        const startFrame = Math.round((w.at - sceneStartSec) * fps);
        const local = frame - startFrame;
        const s = w.accent
          ? spring({ frame: Math.max(local, 0), fps, config: SPR.accent, durationInFrames: 14 })
          : spring({ frame: Math.max(local, 0), fps, config: SPR.snap, durationInFrames: SNAP_DUR });
        const visible = local >= 0;
        const yKick = interpolate(s, [0, 1], [w.accent ? 34 : 24, 0]);
        const scale = interpolate(s, [0, 1], [w.accent ? 1.35 : 0.92, 1]);
        const color = w.accent ? palette.accent : palette.ink;
        return (
          <span
            key={i}
            style={{
              ...type,
              display: "inline-block",
              color,
              opacity: visible ? s : 0,
              transform: `translateY(${yKick}px) scale(${scale})`,
              textShadow: w.accent
                ? `0 0 22px ${palette.accent}aa, 0 0 60px ${palette.accent}44`
                : `0 4px 24px rgba(0,0,0,0.55)`,
              whiteSpace: "pre",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
