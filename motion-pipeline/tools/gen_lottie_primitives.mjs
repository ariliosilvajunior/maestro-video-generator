#!/usr/bin/env node
/**
 * gen_lottie_primitives.mjs — reproducible, license-clean Lottie asset generator.
 *
 * Emits clean single-colour (white) Lottie shape animations into the Remotion
 * project's public/lottie/. `LottieIcon` recolours them to the active V8 palette
 * accent at render time, so these stay on-brand across ember/voltage/acid/royal.
 *
 * WHY hand-authored (not downloaded): $0, no licensing ambiguity, deterministic,
 * and version-controlled. These are richer than IconDraw's single-path draw-on
 * (multi-element, properly eased) while staying in the V8 "designed, not stock" lane.
 *
 * Run:  node motion-pipeline/tools/gen_lottie_primitives.mjs
 * Out:  motion-pipeline/remotion-agent/public/lottie/*.json + manifest.json
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "remotion-agent", "public", "lottie");
mkdirSync(OUT, { recursive: true });

const FR = 30; // internal lottie fps (Remotion remaps to comp fps)
const LOOP = 60; // 2s seamless loop
const SIZE = 200; // square canvas; LottieIcon sizes the container
const WHITE = [1, 1, 1, 1]; // recoloured at runtime

// ── low-level Lottie builders ────────────────────────────────────────────────
const k = (v) => ({ a: 0, k: v }); // static prop
// animated scalar/array prop with smooth bezier ease between keyframes
const anim = (kfs) => ({
  a: 1,
  k: kfs.map((kf, i) => {
    const out = { t: kf.t, s: kf.s };
    if (i < kfs.length - 1) {
      out.i = { x: [0.4], y: [1] };
      out.o = { x: [0.2], y: [0] };
    }
    return out;
  }),
});
const linear = (kfs) => ({
  a: 1,
  k: kfs.map((kf, i) => {
    const out = { t: kf.t, s: kf.s };
    if (i < kfs.length - 1) {
      out.i = { x: [1], y: [1] };
      out.o = { x: [0], y: [0] };
    }
    return out;
  }),
});

const stroke = (w) => ({ ty: "st", c: k(WHITE), o: k(100), w: k(w), lc: 2, lj: 2, nm: "stroke" });
const fill = () => ({ ty: "fl", c: k(WHITE), o: k(100), r: 1, nm: "fill" });
const grTransform = (extra = {}) => ({
  ty: "tr",
  p: k([0, 0]),
  a: k([0, 0]),
  s: k([100, 100]),
  r: k(0),
  o: k(100),
  ...extra,
});
const ellipse = (d) => ({ ty: "el", p: k([0, 0]), s: k([d, d]), nm: "el" });

// a layer (ty 4 = shape) with optional transform overrides on ks
const layer = (ind, shapes, ks = {}) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm: `l${ind}`,
  sr: 1,
  ks: {
    o: k(100),
    r: k(0),
    p: k([SIZE / 2, SIZE / 2, 0]),
    a: k([0, 0, 0]),
    s: k([100, 100, 100]),
    ...ks,
  },
  ao: 0,
  shapes,
  ip: 0,
  op: LOOP,
  st: 0,
  bm: 0,
});

const doc = (nm, layers) => ({
  v: "5.7.4",
  fr: FR,
  ip: 0,
  op: LOOP,
  w: SIZE,
  h: SIZE,
  nm,
  ddd: 0,
  assets: [],
  layers,
  markers: [],
});

const save = (name, data) => {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data));
  return name;
};

// ── primitives ───────────────────────────────────────────────────────────────

// pulse-ring: 3 concentric stroked rings expanding + fading, staggered (sonar).
function pulseRing() {
  const ring = (ind, delay) => {
    const grp = { ty: "gr", nm: "ring", it: [ellipse(60), stroke(8), grTransform()] };
    return layer(ind, [grp], {
      s: anim([
        { t: delay, s: [20, 20, 100] },
        { t: delay + 45, s: [150, 150, 100] },
      ]),
      o: anim([
        { t: delay, s: [0] },
        { t: delay + 6, s: [100] },
        { t: delay + 45, s: [0] },
      ]),
    });
  };
  return doc("pulse-ring", [ring(1, 0), ring(2, 20), ring(3, 40)]);
}

// orbit-dots: 4 dots rotating around centre (seamless 360° loop) + a still core.
function orbitDots() {
  const R = 62;
  const dot = (ind, angleDeg) => {
    const a = (angleDeg * Math.PI) / 180;
    const grp = {
      ty: "gr",
      nm: "dot",
      it: [ellipse(20), fill(), grTransform({ p: k([Math.cos(a) * R, Math.sin(a) * R]) })],
    };
    // rotate the whole layer for a perfectly seamless spin
    return layer(ind, [grp], {
      r: linear([
        { t: 0, s: [0] },
        { t: LOOP, s: [360] },
      ]),
    });
  };
  const core = layer(5, [{ ty: "gr", nm: "core", it: [ellipse(26), stroke(6), grTransform()] }], {
    s: anim([
      { t: 0, s: [90, 90, 100] },
      { t: 30, s: [110, 110, 100] },
      { t: 60, s: [90, 90, 100] },
    ]),
  });
  return doc("orbit-dots", [dot(1, 0), dot(2, 90), dot(3, 180), dot(4, 270), core]);
}

// arrow-flow: 3 chevrons streaming rightward, staggered fade (directional flow).
function arrowFlow() {
  // chevron ">" as a stroked open path in a 200 box, centred at origin
  const chevron = () => ({
    ty: "sh",
    nm: "chev",
    ks: k({
      c: false,
      v: [
        [-18, -26],
        [16, 0],
        [-18, 26],
      ],
      i: [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      o: [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    }),
  });
  const arrow = (ind, x, delay) => {
    const grp = { ty: "gr", nm: "arrow", it: [chevron(), stroke(12), grTransform({ p: k([x, 0]) })] };
    return layer(ind, [grp], {
      o: anim([
        { t: delay % LOOP, s: [0] },
        { t: (delay + 10) % LOOP || 10, s: [100] },
        { t: (delay + 30) % LOOP || 30, s: [0] },
      ]),
    });
  };
  return doc("arrow-flow", [arrow(1, -52, 0), arrow(2, 0, 12), arrow(3, 52, 24)]);
}

// scan-sweep: a glowing bar sweeping top→bottom with edge brackets (tech scan).
function scanSweep() {
  const bar = layer(
    1,
    [
      {
        ty: "gr",
        nm: "bar",
        it: [{ ty: "rc", p: k([0, 0]), s: k([150, 8]), r: k(4), nm: "rc" }, fill(), grTransform()],
      },
    ],
    {
      p: linear([
        { t: 0, s: [SIZE / 2, 40, 0] },
        { t: 30, s: [SIZE / 2, 160, 0] },
        { t: 60, s: [SIZE / 2, 40, 0] },
      ]),
      o: anim([
        { t: 0, s: [20] },
        { t: 15, s: [100] },
        { t: 30, s: [20] },
        { t: 45, s: [100] },
        { t: 60, s: [20] },
      ]),
    }
  );
  // static corner frame for a "viewport" feel
  const frame = layer(2, [
    { ty: "gr", nm: "frame", it: [{ ty: "rc", p: k([0, 0]), s: k([168, 168]), r: k(16), nm: "rc" }, stroke(5), grTransform()] },
  ], { o: k(45) });
  return doc("scan-sweep", [bar, frame]);
}

const built = [
  { gen: pulseRing, key: "pulse-ring", use: "accent ring behind a number/icon; processing/active state" },
  { gen: orbitDots, key: "orbit-dots", use: "AI / thinking / agents working; orbiting system" },
  { gen: arrowFlow, key: "arrow-flow", use: "progression, leads-to, pipeline/flow direction" },
  { gen: scanSweep, key: "scan-sweep", use: "analysis, scanning, security/inspection feel" },
];

const manifest = { generated_by: "gen_lottie_primitives.mjs", fps: FR, loop_frames: LOOP, size: SIZE, recolour: "white→palette accent at runtime via LottieIcon", assets: {} };
for (const b of built) {
  save(b.key, b.gen());
  manifest.assets[b.key] = { file: `lottie/${b.key}.json`, use: b.use, recommended_size: 360 };
}
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("Wrote", built.length, "Lottie primitives + manifest to", OUT);
for (const b of built) console.log("  -", b.key);
