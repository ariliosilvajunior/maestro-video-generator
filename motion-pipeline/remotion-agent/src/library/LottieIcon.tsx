import React, { useEffect, useState } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  staticFile,
  delayRender,
  continueRender,
  cancelRender,
} from "remotion";
import { Lottie, type LottieAnimationData } from "@remotion/lottie";
import { Palette, SPR, SNAP_DUR } from "./design";

// ─── LottieIcon (V8 — designer-grade animated accent) ────────────────────────
// Frame-accurate, deterministic Lottie playback (@remotion/lottie seeks by frame,
// so it renders identically on macOS and Linux — no screenshot-mode caveat).
//
// The richer sibling of IconDraw: multi-element, properly-eased designer motion
// instead of a single SVG path draw-on. Assets are authored white in
// public/lottie/ and RECOLOURED here to the active V8 palette accent, so they
// stay on-brand across ember/voltage/acid/royal. Pulls in real LottieFiles /
// After-Effects (Bodymovin) exports too — any .json placed in public/lottie/.
//
// Brand rules it keeps: ONE palette per video (we tint to it), V8 snap entrance,
// accent glow. Counts as the scene's "icon" slot — still subject to the 15-word
// cap and complement rule (it carries no words, so it's complement-safe by design).

const hexToRgb01 = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// Deep-recolour every Lottie colour property (`c`) to the target rgb, preserving
// alpha. Handles both static ({a:0,k:[r,g,b,a]}) and keyframed colours.
const recolour = (node: unknown, rgb: [number, number, number]): unknown => {
  if (Array.isArray(node)) return node.map((n) => recolour(n, rgb));
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (key === "c" && v && typeof v === "object") {
        const cp = v as { a?: number; k?: unknown };
        if (Array.isArray(cp.k) && cp.k.every((x) => typeof x === "number")) {
          const arr = cp.k as number[];
          cp.k = [rgb[0], rgb[1], rgb[2], arr[3] ?? 1];
        } else if (Array.isArray(cp.k)) {
          cp.k = (cp.k as Array<{ s?: number[] }>).map((kf) =>
            kf && Array.isArray(kf.s) ? { ...kf, s: [rgb[0], rgb[1], rgb[2], kf.s[3] ?? 1] } : kf
          );
        }
      } else {
        recolour(v, rgb);
      }
    }
  }
  return node;
};

export const LottieIcon: React.FC<{
  src: string; // path under public/, e.g. "lottie/pulse-ring.json"
  palette: Palette;
  tint?: "accent" | "accent2" | "ink"; // which palette colour to recolour to (default accent)
  delay?: number; // frames before entrance
  size?: number; // px (square)
  loop?: boolean; // default true
  glow?: boolean; // accent drop-shadow, default true
}> = ({ src, palette, tint = "accent", delay = 0, size = 360, loop = true, glow = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender(`lottie:${src}`));
  const [data, setData] = useState<LottieAnimationData | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(staticFile(src))
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        const rgb = hexToRgb01(palette[tint]);
        setData(recolour(json, rgb) as LottieAnimationData);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, tint, palette.accent]);

  if (!data) return null;

  const local = Math.max(frame - delay, 0);
  // V8 snap entrance (matches IconDraw / library grammar): confident settle, no bounce.
  const enter = spring({ frame: local, fps, config: SPR.snap, durationInFrames: SNAP_DUR });
  const scale = interpolate(enter, [0, 1], [0.88, 1]);
  const opacity = frame >= delay ? interpolate(enter, [0, 1], [0, 1]) : 0;

  return (
    <div
      style={{
        width: size,
        height: size,
        opacity,
        transform: `scale(${scale})`,
        filter: glow ? `drop-shadow(0 0 18px ${palette[tint]}88)` : undefined,
      }}
    >
      <Lottie animationData={data} loop={loop} style={{ width: size, height: size }} />
    </div>
  );
};
