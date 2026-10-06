import React from "react";
import { AbsoluteFill, Sequence, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
// FONT (house rule): Proxima-Nova-style geometric sans, ALL CAPS — replaced the
// Cormorant serif. Proxima Nova is a paid Adobe font with no installable file here, so we use
// Montserrat (its standard free twin, near-identical letterforms).
// BUNDLED LOCALLY (QCR-275/295 fix): previously loaded via `@remotion/google-fonts/Montserrat`,
// which made 45–90 runtime network requests PER render tab (a full weight/subset matrix). That
// hammering starved/crashed the compositor tabs ("Could not extract frame from compositor: Request
// closed" → a bogus font delayRender timeout that --timeout does NOT clear), non-deterministically
// killing premium renders mid-way (a render once crashed at frame 827, then at 101). Now the Montserrat
// variable TTF is bundled in public/fonts/ and loaded via @remotion/fonts (like Anton) — ZERO
// network fetch at render time. Same family name "Montserrat" so nothing downstream changes.
import { loadFont } from "@remotion/fonts";
loadFont({ family: "Montserrat", url: staticFile("fonts/Montserrat-Bold.ttf"), weight: "700" });
loadFont({ family: "Montserrat", url: staticFile("fonts/Montserrat-Bold.ttf"), weight: "800" });

/* ════════════════════════════════════════════════════════════════════════════
   PREMIUM / CLASSIC motion system (house rule) — an editorial,
   museum-quality look for the asset scenes: a thin gold-rule frame, a bold
   Proxima-Nova-style geometric sans (Montserrat), ALL CAPS (house rules — replaced the Cormorant serif; the kicker tag above the headline was
   removed), and PURPOSEFUL MOVING motion (elements TRAVEL / flow / build / count —
   not just fade-in then sit or pulse; still NO bouncy AI-slop springs). Built to
   COMPOSE 2–5 elements per scene, not one big object.

   ── THEME-DRIVEN PALETTE (house rule) ────────────────────────
   The font + background COLOR CONCEPT now varies per VIDEO THEME. Pick a palette
   with <PremiumTheme palette="charcoal-gold"> at the composition root; every
   premium component reads it through context (usePremPalette). The creative brief
   (Phase 2.5) chooses the palette id from the topic theme (see PREMIUM_PALETTES).

   ── BIG SCREENSHOTS (house rule) ─────────────────────────────
   PremiumEvidence renders FULL-FRAME by default (cardW = width-132 ≈ 948,
   image ≈ 60% of frame height) so the text inside a captured screenshot is
   readable on a phone. Geometry constants mirror reference-pipeline/
   prepare_reference_shot.py (CARD_W / CARD_H / BAR_H) so the draw-on circle
   still lands on the real element.

   Assets = generated greenscreen renders → chroma_key cutouts in public/assets/<run>/.
   ════════════════════════════════════════════════════════════════════════════ */

export const PROXIMA = "Montserrat";
/** @deprecated name kept for back-compat — the value is now Montserrat (Proxima-Nova-style
 *  geometric sans), used ALL CAPS. No longer a serif. */
export const SERIF = PROXIMA;

/* ── Palette type ─ `cream` = background, `gold` = accent (names kept for
   back-compat; values vary per theme). `vignette` = radial edge tint, `sheen` =
   top highlight. The screenshot CARD always stays light (real screenshots are
   light docs) via the CARD_* constants below, regardless of theme. */
export type PremPalette = {
  cream: string; ink: string; inkSoft: string;
  gold: string; goldLt: string;
  line: string; shadow: string; vignette: string; sheen: string;
  dark?: boolean;
};

/* The screenshot card is theme-independent (screenshots are light). */
const CARD = { bg: "#ffffff", bar: "#f3efe6", barLine: "rgba(33,30,24,0.12)", ink: "#5b554b" };

/* ── PREMIUM_PALETTES — one color concept per VIDEO THEME ─────────────────────
   The creative brief maps the topic to one of these ids (see SKILL). */
export const PREMIUM_PALETTES: Record<string, PremPalette> = {
  // money · finance · luxury · timeless · "make money" — DEFAULT (warm marble + antique gold)
  "marble-gold": {
    cream: "#f3efe6", ink: "#211e18", inkSoft: "#5b554b", gold: "#a9854a", goldLt: "#c8a560",
    line: "rgba(33,30,24,0.16)", shadow: "rgba(33,30,24,0.26)", vignette: "rgba(33,30,24,0.11)", sheen: "rgba(255,253,248,0.5)",
  },
  // AI · tech · power · "the future" · dramatic reveals (deep charcoal + warm gold) — DARK
  "charcoal-gold": {
    cream: "#1b1a18", ink: "#f1ece1", inkSoft: "#b9b0a0", gold: "#c9a45c", goldLt: "#e6c884",
    line: "rgba(241,236,225,0.16)", shadow: "rgba(0,0,0,0.5)", vignette: "rgba(0,0,0,0.45)", sheen: "rgba(255,255,255,0.06)", dark: true,
  },
  // data · SaaS · trust · corporate · analytics (midnight navy + azure) — DARK
  "midnight-azure": {
    cream: "#0f1622", ink: "#eef4fb", inkSoft: "#9fb2c8", gold: "#5fa6da", goldLt: "#8fcaf0",
    line: "rgba(238,244,251,0.14)", shadow: "rgba(0,0,0,0.5)", vignette: "rgba(0,0,0,0.5)", sheen: "rgba(255,255,255,0.05)", dark: true,
  },
  // growth · health · nature · productivity · "save time" (ivory + deep emerald) — LIGHT
  "ivory-emerald": {
    cream: "#f0efe6", ink: "#18261e", inkSoft: "#4f5e54", gold: "#2f7d5b", goldLt: "#57a982",
    line: "rgba(24,38,30,0.16)", shadow: "rgba(24,38,30,0.24)", vignette: "rgba(24,38,30,0.10)", sheen: "rgba(255,255,250,0.5)",
  },
  // luxury · fashion · beauty · lifestyle · creators (soft rose + bordeaux) — LIGHT
  "bordeaux-rose": {
    cream: "#f5ebe8", ink: "#2a1418", inkSoft: "#6e4a50", gold: "#9c3b52", goldLt: "#c2697e",
    line: "rgba(42,20,24,0.15)", shadow: "rgba(42,20,24,0.24)", vignette: "rgba(42,20,24,0.10)", sheen: "rgba(255,252,250,0.5)",
  },
  // engineering · hardware · crypto · industry · "build" (slate + copper) — DARK
  "slate-copper": {
    cream: "#17161a", ink: "#efe7dc", inkSoft: "#b0a596", gold: "#c2703a", goldLt: "#e0925a",
    line: "rgba(239,231,220,0.15)", shadow: "rgba(0,0,0,0.5)", vignette: "rgba(0,0,0,0.45)", sheen: "rgba(255,255,255,0.05)", dark: true,
  },
  // BRAND — Recursos Cognitivos (education · AEE · institutional). Exact hex from the brand manual
  // (azul escuro #2B4872 / azul #3E69B7 / verde-água #56CAC9); ink carries the mandatory 80%-blue
  // rule, verde-água is the "chamada de atenção" accent — never substitute these two hues. — LIGHT
  "recursos-cognitivos": {
    cream: "#f7fafc", ink: "#2b4872", inkSoft: "#4c6b8f", gold: "#56cac9", goldLt: "#8addda",
    line: "rgba(43,72,114,0.16)", shadow: "rgba(43,72,114,0.26)", vignette: "rgba(43,72,114,0.11)", sheen: "rgba(255,253,250,0.5)",
  },
};

/* default = marble-gold; PREM kept as the named default export (back-compat). */
export const PREM = PREMIUM_PALETTES["marble-gold"];

const PaletteContext = React.createContext<PremPalette>(PREM);
export const usePremPalette = () => React.useContext(PaletteContext);

/* Wrap a composition root to apply a theme palette to every premium component.
   `palette` is a PREMIUM_PALETTES id (from the creative brief); unknown → default. */
export const PremiumTheme: React.FC<{ palette?: string; children: React.ReactNode }> = ({ palette, children }) => {
  const p = (palette && PREMIUM_PALETTES[palette]) || PREM;
  return <PaletteContext.Provider value={p}>{children}</PaletteContext.Provider>;
};

// slow ease-out fade + rise (the default premium entrance)
export const useFadeRise = (delay = 0, dur = 20, rise = 42) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const e = 1 - Math.pow(1 - t, 3);
  return { opacity: e, y: interpolate(e, [0, 1], [rise, 0]) };
};

// themed background + subtle vignette + thin gold double-rule editorial frame
export const PremiumBg: React.FC<{ frame?: boolean }> = ({ frame = true }) => {
  const P = usePremPalette();
  const { width, height } = useVideoConfig();
  const m = 56;
  return (
    <AbsoluteFill style={{ background: P.cream }}>
      <AbsoluteFill style={{ background: `radial-gradient(125% 85% at 50% 36%, transparent 52%, ${P.vignette} 100%)` }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${P.sheen}, transparent 30%)` }} />
      {frame && (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }} viewBox={`0 0 ${width} ${height}`}>
          <rect x={m} y={m} width={width - 2 * m} height={height - 2 * m} fill="none" stroke={P.gold} strokeWidth={1.6} opacity={0.7} />
          <rect x={m + 8} y={m + 8} width={width - 2 * m - 16} height={height - 2 * m - 16} fill="none" stroke={P.gold} strokeWidth={0.8} opacity={0.45} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

// small-caps serif label + optional centered hairline rule
export const PremiumLabel: React.FC<{ children: React.ReactNode; delay?: number; size?: number; color?: string; rule?: boolean; top: number }> = ({
  children, delay = 0, size = 32, color, rule = true, top,
}) => {
  const P = usePremPalette();
  const c = color ?? P.gold;
  const f = useFadeRise(delay, 18, 22);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: f.opacity, transform: `translateY(${f.y}px)`, padding: "0 96px", boxSizing: "border-box" }}>
      <div style={{ fontFamily: PROXIMA, fontWeight: 600, fontSize: size, letterSpacing: "0.34em", textTransform: "uppercase", color: c }}>{children}</div>
      {rule && <div style={{ width: 66, height: 1.5, background: c, margin: "14px auto 0", opacity: 0.8 }} />}
    </div>
  );
};

// large elegant serif display line (e.g. the "50%" / hero word)
export const PremiumDisplay: React.FC<{ children: React.ReactNode; delay?: number; size?: number; color?: string; top: number; italic?: boolean }> = ({
  children, delay = 0, size = 220, color, top, italic = false,
}) => {
  const P = usePremPalette();
  const c = color ?? P.ink;
  const f = useFadeRise(delay, 22, 36);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: f.opacity, transform: `translateY(${f.y}px)`, padding: "0 90px", boxSizing: "border-box" }}>
      <span style={{ fontFamily: PROXIMA, fontWeight: 800, fontStyle: italic ? "italic" : "normal", fontSize: size, color: c, lineHeight: 0.98, letterSpacing: "0.005em", textTransform: "uppercase" }}>{children}</span>
    </div>
  );
};

// a keyed asset with refined motion: fade-rise + slow parallax drift + soft shadow.
export const PremiumAsset: React.FC<{
  src: string; size: number; cx: number; cy: number; delay?: number; rot?: number; depth?: number; driftPhase?: number;
}> = ({ src, size, cx, cy, delay = 0, rot = 0, depth = 0, driftPhase = 0 }) => {
  const P = usePremPalette();
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const f = useFadeRise(delay, 22, 34);
  const drift = Math.sin((frame / fps) * Math.PI * 0.55 + driftPhase) * (6 - depth * 2);
  const sc = 1 - depth * 0.16;
  return (
    <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size,
      opacity: f.opacity * (1 - depth * 0.45), transform: `translateY(${f.y + drift}px)` }}>
      <Img src={staticFile(src)} style={{ width: size, height: "auto",
        transform: `scale(${sc}) rotate(${rot}deg)`,
        filter: `drop-shadow(0 24px 30px ${P.shadow})${depth ? ` blur(${depth * 2.2}px)` : ""}` }} />
    </div>
  );
};

// an elegant thin ascending line that draws itself, with a soft area fill + end node.
export const PremiumGraph: React.FC<{ points: [number, number][]; delay?: number; w: number; h: number; color?: string }> = ({
  points, delay = 0, w, h, color,
}) => {
  const P = usePremPalette();
  const c = color ?? P.gold;
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const e = 1 - Math.pow(1 - t, 3);
  const d = points.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
  const len = points.reduce((a, p, i) => i ? a + Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0, 0);
  const last = points[points.length - 1];
  const area = `${d} L ${last[0]} ${points[0][1] + 200} L ${points[0][0]} ${points[0][1] + 200} Z`;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} viewBox={`0 0 ${w} ${h}`}>
      <path d={area} fill={c} opacity={0.07 * e} />
      <path d={d} fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - e)} opacity={0.9} />
      {e > 0.96 && <circle cx={last[0]} cy={last[1]} r={7} fill={c} />}
    </svg>
  );
};

/* A premium IMAGE-ICON (a greenscreen-keyed generated object — NOT a code-drawn line
   icon) with a small-caps serif label. */
export const PremiumImageIcon: React.FC<{ src: string; x: number; y: number; size: number; label?: string; delay?: number }> = ({
  src, x, y, size, label, delay = 0,
}) => {
  const P = usePremPalette();
  const f = useFadeRise(delay, 20, 28);
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, opacity: f.opacity, transform: `translateY(${f.y}px)` }}>
      <Img src={staticFile(src)} style={{ width: size, height: size, objectFit: "contain", filter: `drop-shadow(0 16px 22px ${P.shadow})` }} />
      {label && <div style={{ position: "absolute", top: size + 14, left: -30, right: -30, textAlign: "center",
        fontFamily: PROXIMA, fontSize: 26, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: P.inkSoft }}>{label}</div>}
    </div>
  );
};

/* A premium step FLOW built from IMAGE-ICONS connected by thin gold connectors. */
export const PremiumFlow: React.FC<{ items: { src: string; label: string }[]; cy: number; size?: number; delay?: number }> = ({
  items, cy, size = 200, delay = 0,
}) => {
  const P = usePremPalette();
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const n = items.length, cx = width / 2;
  const spread = Math.min(340, (width - 320) / Math.max(1, n - 1));
  const xs = items.map((_, i) => cx + (i - (n - 1) / 2) * spread);
  return (
    <>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }} viewBox={`0 0 ${width} ${height}`}>
        {xs.slice(0, -1).map((x, i) => {
          const x1 = x + size * 0.42, xe = xs[i + 1] - size * 0.42, len = xe - x1;
          const t = interpolate(frame - (delay + 14 + i * 8), [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const e = 1 - Math.pow(1 - t, 3);
          // a gold pulse that TRAVELS along the connector on a loop — purposeful MOVEMENT
          // (house rule).
          const period = 40, trav = (((frame - (delay + 18 + i * 8)) % period) + period) % period / period;
          return (
            <g key={i} opacity={0.75}>
              <line x1={x1} y1={cy} x2={x1 + len * e} y2={cy} stroke={P.gold} strokeWidth={1.6} />
              {e > 0.92 && <path d={`M ${xe - 13} ${cy - 6} L ${xe} ${cy} L ${xe - 13} ${cy + 6}`} fill="none" stroke={P.gold} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />}
              {e > 0.95 && <circle cx={x1 + len * trav} cy={cy} r={7} fill={P.goldLt} opacity={0.9 - 0.5 * Math.abs(trav - 0.5)} />}
            </g>
          );
        })}
      </svg>
      {items.map((it, i) => <PremiumImageIcon key={i} src={it.src} x={xs[i]} y={cy} size={size} label={it.label} delay={delay + i * 8} />)}
    </>
  );
};

/* ── PremiumFrame ─ themed-paper TOP 40% (motion panel) + avatar BOTTOM 60%.
   `muted` + `trimBefore` (house rule): when each split section
   wraps its OWN windowed PremiumFrame (instead of one continuous frame behind everything),
   pass `muted` (audio comes from a single continuous <Audio>) and `trimBefore={window.from}`
   (so the avatar lips stay synced to that audio). This decouples the avatar VISUAL from the
   AUDIO so the avatar-frame only exists during split windows → a coverage gap can NEVER expose
   the split between full-frame sections (the structural fix for the "split-screen leak"). */
export const PremiumFrame: React.FC<{ avatarSrc: string; children: React.ReactNode; muted?: boolean; trimBefore?: number }> = ({ avatarSrc, children, muted, trimBefore }) => {
  const P = usePremPalette();
  const { width, height } = useVideoConfig();
  const mH = Math.round(height * 0.4);
  const videoH = height - mH;
  return (
    <AbsoluteFill style={{ background: P.cream, isolation: "isolate" }}>
      <div style={{ position: "absolute", left: 0, top: mH, width, height: videoH, overflow: "hidden" }}>
        <OffthreadVideo src={staticFile(avatarSrc)} muted={muted} trimBefore={trimBefore} style={{ width, height: videoH, objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width, height: mH, overflow: "hidden" }}>
        <AbsoluteFill style={{ background: P.cream }} />
        <AbsoluteFill style={{ background: `radial-gradient(130% 120% at 50% 30%, transparent 55%, ${P.vignette} 100%)` }} />
        <svg width={width} height={mH} style={{ position: "absolute", inset: 0 }} viewBox={`0 0 ${width} ${mH}`}>
          <line x1={56} y1={mH - 26} x2={width - 56} y2={mH - 26} stroke={P.gold} strokeWidth={1.2} opacity={0.5} />
        </svg>
        {children}
      </div>
      <div style={{ position: "absolute", left: 0, top: mH - 28, width, height: 56,
        background: `linear-gradient(to bottom, ${P.cream} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

/* ── PremiumHeadline ─ Section 1: centered serif headline, ALL CAPS, all words the
   SAME size, full at frame 0; a gold kicker chip + thin rule. */
export const PremiumHeadline: React.FC<{ kicker?: string; lead: string[]; accent: string; size?: number }> = ({
  lead, accent, size = 82,
}) => {
  const P = usePremPalette();
  // NO kicker chip above the headline (house rule).
  // Sits LOW in the top panel, near the split line, with a generous safe margin from the
  // borders (house rule).
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-end", textAlign: "center", padding: "0 116px 64px" }}>
      {lead.map((ln, i) => (
        <div key={i} style={{ fontFamily: PROXIMA, fontWeight: 800, fontSize: size, letterSpacing: "0.01em",
          textTransform: "uppercase", color: P.ink, lineHeight: 1.05 }}>{ln}</div>
      ))}
      <div style={{ fontFamily: PROXIMA, fontWeight: 800, fontSize: size, letterSpacing: "0.01em",
        textTransform: "uppercase", color: P.gold, lineHeight: 1.05 }}>{accent}</div>
      <div style={{ width: 74, height: 3, background: P.gold, marginTop: 18, opacity: useFadeRise(8, 16).opacity }} />
    </div>
  );
};

/* ── PremiumEvidence ─ Section 2: a REAL screenshot in the UPPER (top-40%) panel of a
   SPLIT screen — the avatar shows in the bottom 60% (house rule).
   Rendered as a CHILD of <PremiumFrame> (the top panel). The card fills the panel WIDTH
   and the screenshot is shown WIDTH-BOUND + top-anchored, so NOTHING is cropped
   horizontally — the important top-of-page content is always fully visible and readable.
   Geometry (CARD_W/CARD_H/BAR_H) mirrors prepare_reference_shot.py so the circle lands
   on the real element. (`split` prop kept for back-compat; the layout is always split now.) */
export const PremiumEvidence: React.FC<{
  src: string; domain?: string; focus?: { fx: number; fy: number }; focusR?: { rx: number; ry: number };
  stamp?: string; caption?: string; kicker?: string; split?: boolean;
  // MOTION PROTOCOL (house rule): the screenshot MOVES by default.
  //  "scroll" (DEFAULT) — the page scrolls down inside the card (needs a full-page capture).
  //  "zoom"            — aggressive push from the just-opened page INTO the focus (no scroll). 2nd beat.
  //  "static"         — no motion (exception: nothing relevant below the hero / a fixed proof).
  motion?: "scroll" | "zoom" | "static";
  scroll?: number;      // px to scroll (scroll mode) — from prepare_reference_shot
  zoomTo?: number;      // target scale (zoom mode)
  durFrames?: number;   // beat length in frames (to time the motion across the whole sequence)
  showCircle?: boolean; // override (default: off for scroll, on for zoom/static)
}> = ({ src, domain = "", focus, focusR, stamp, caption, kicker,
        motion = "scroll", scroll = 1100, zoomTo = 1.6, durFrames = 100, showCircle }) => {
  const P = usePremPalette();
  const { width, height } = useVideoConfig();
  const f = useFadeRise(4, 22, 30);
  const fr = useCurrentFrame();
  const panelH = Math.round(height * 0.4);           // the top split panel (frame child)

  const cardLeft = 36, cardW = width - 72;           // ≈ 1008
  const barH = 46, imgH = 548, cardH = barH + imgH;  // 594 — fits the 768 panel
  const cardTop = kicker ? 54 : 30;
  const fR = focusR ?? { rx: 150, ry: 52 };
  const pt = focus ?? { fx: cardW * 0.5, fy: barH + imgH * 0.4 };
  const ifx = pt.fx, ify = pt.fy - barH;             // focus in image-local coords
  const rx = fR.rx, ry = fR.ry, k = 0.5523;

  // ── motion of the screenshot inside the card window ──
  const sm = (p: number) => { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); };
  let layerT = "none", curScale = 1;
  if (motion === "scroll") {
    // SLOWER + SMOOTHER scroll (house rule): the page used to race the FULL distance
    // starting at frame 0 — while the card was still entering — which read as fast/jumpy. Now it
    // (1) holds still briefly so the card settles, then (2) GLIDES a SHORTER distance over the rest of
    // the beat with the same gentle smoothstep ease → a calm, readable scroll instead of a whoosh.
    // Same beat length, less travel ⇒ fewer px/frame ⇒ clearly slower; top content also stays readable
    // longer. Tune with the two constants below (raise SCROLL_FACTOR toward 1 for more travel/faster,
    // raise SCROLL_DELAY for a longer settle).
    const SCROLL_DELAY = 14;     // frames the card holds still after entering, before any scroll
    const SCROLL_FACTOR = 0.58;  // travel ~58% of the requested px over the beat (slower glide)
    const p = sm((fr - SCROLL_DELAY) / Math.max(1, durFrames - SCROLL_DELAY));
    layerT = `translateY(${-scroll * SCROLL_FACTOR * p}px)`;
  } else if (motion === "zoom") {
    const e = sm((fr - 8) / (durFrames - 8));
    curScale = 1 + (zoomTo - 1) * e;
    // CENTER on the element (ifx,ify), but CLAMP the visible region into the image so NO blank
    // edge ever shows (a near-edge element ends as-centered-as-possible, never off in white space).
    const rw = cardW / zoomTo, rh = imgH / zoomTo;
    let rx0 = ifx - rw / 2; rx0 = Math.max(0, Math.min(cardW - rw, rx0));
    const ry0 = Math.max(0, ify - rh / 2);
    const endTx = -rx0 * zoomTo, endTy = -ry0 * zoomTo;
    layerT = `translate(${endTx * e}px, ${endTy * e}px) scale(${curScale})`;
  }
  const circleOn = showCircle ?? (motion !== "scroll");

  // ellipse circle in IMAGE-LOCAL coords (lives inside the moving layer → tracks the element)
  const ex = ifx, ey = ify;
  const d = `M ${ex + rx} ${ey} C ${ex + rx} ${ey - ry * k}, ${ex + rx * k} ${ey - ry}, ${ex} ${ey - ry} C ${ex - rx * k} ${ey - ry}, ${ex - rx} ${ey - ry * k}, ${ex - rx} ${ey} C ${ex - rx} ${ey + ry * k}, ${ex - rx * k} ${ey + ry}, ${ex} ${ey + ry} C ${ex + rx * k} ${ey + ry}, ${ex + rx} ${ey + ry * k}, ${ex + rx + 8} ${ey - 4}`;
  const ringLen = Math.PI * (rx + ry) * 1.25;
  const draw = interpolate(fr - (motion === "zoom" ? 30 : 22), [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {kicker && <div style={{ position: "absolute", left: 0, right: 0, top: 12, textAlign: "center",
        fontFamily: PROXIMA, fontWeight: 700, fontSize: 24, letterSpacing: "0.28em", textTransform: "uppercase", color: P.gold }}>{kicker}</div>}
      <div style={{ position: "absolute", left: cardLeft, top: cardTop, width: cardW, height: cardH,
        opacity: f.opacity, transform: `translateY(${f.y}px)`, borderRadius: 8, overflow: "hidden",
        background: CARD.bg, border: `2px solid ${P.gold}`, boxShadow: `0 16px 30px ${P.shadow}` }}>
        <div style={{ height: barH, background: CARD.bar, borderBottom: `1px solid ${CARD.barLine}`, display: "flex", alignItems: "center", padding: "0 18px" }}>
          <div style={{ display: "flex", gap: 7, marginRight: 14 }}>
            {["#e0655a", "#e7b14b", "#5fa66a"].map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c, opacity: 0.85 }} />)}
          </div>
          <div style={{ fontFamily: PROXIMA, fontSize: 20, letterSpacing: "0.08em", color: CARD.ink }}>{domain}</div>
        </div>
        <div style={{ position: "relative", width: cardW, height: imgH, overflow: "hidden", background: "#fff" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: cardW, transform: layerT, transformOrigin: "0 0" }}>
            <Img src={staticFile(src)} style={{ width: cardW, height: "auto", display: "block" }} />
            {circleOn && (
              <svg width={cardW} height={3000} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
                <path d={d} fill="none" stroke={P.gold} strokeWidth={4 / curScale} strokeLinecap="round"
                  strokeDasharray={ringLen} strokeDashoffset={ringLen * (1 - (1 - Math.pow(1 - draw, 3)))} />
              </svg>
            )}
          </div>
        </div>
      </div>
      {stamp && <div style={{ position: "absolute", right: 44, top: cardTop - 14, whiteSpace: "nowrap",
        fontFamily: PROXIMA, fontWeight: 800, fontSize: 34, letterSpacing: "0.05em", textTransform: "uppercase", color: P.cream, background: P.gold,
        padding: "9px 18px", borderRadius: 4, transform: "rotate(-4deg)", transformOrigin: "100% 50%", boxShadow: `0 8px 18px ${P.shadow}` }}>{stamp}</div>}
      {/* caption-below-the-screenshot REMOVED (house rule). The `caption` prop is now ignored; the burned subtitle carries the line. */}
    </div>
  );
};

/* ── PremiumKineticCaption ─ a NEW full-frame section (house rule): a solid
   THEME-PALETTE background with the narration popping up 2–3 words at a time, BIG and centered,
   in the Proxima-style sans (PROXIMA / Montserrat), with a SUBTLE fade-up "show up" effect.
   No avatar, no screenshot — a pure kinetic-caption breather. Placed AFTER the full-frame avatar.
   The frame behind keeps the audio; this is a full-frame OVERLAY sibling.

   ── VERBATIM WORD-BY-WORD REVEAL (house rule) ─────────────────
   Pass `reveal` to show the EXACT spoken sentence (verbatim `text`) as if it were the real
   subtitle of that beat: the full sentence is laid out wrapped + centered, and each word
   REVEALS one at a time (fade + rise + pop), accumulating until the whole line is visible.
   Layout is pre-allocated so words light up IN PLACE (no reflow jank). The just-revealed
   "active" word briefly tints to the accent then settles. Word timing comes from `timings`
   (per-word start times in SECONDS relative to this section's start — exact audio sync) when
   given, else words distribute EVENLY across `durFrames` (the section window == the spoken
   sentence's duration, so even pacing ≈ natural). Default size drops to 76 so a full sentence
   fits + wraps; override with `size`.
   COMPLEMENT-RULE EXCEPTION: this mode is the ONE place §3b text MAY equal the narration
   verbatim — it is allowed BECAUSE §3b suppresses the burned bottom subtitle for its window
   (suppress_windows.py), so there is still only ONE set of text on screen (no double-subtitle).
   Still tag the beat "caption:" — the grammar guard is unchanged. */
const chunkWords = (s: string, n: number) => {
  const w = s.trim().split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < w.length; i += n) out.push(w.slice(i, i + n).join(" "));
  return out.length ? out : [""];
};
export const PremiumKineticCaption: React.FC<{
  text?: string; groups?: string[]; wordsPerGroup?: number; durFrames?: number;
  size?: number; bg?: string; color?: string; accent?: boolean;
  reveal?: boolean; timings?: number[];
}> = ({ text = "", groups, wordsPerGroup = 2, durFrames = 50, size, bg, color, accent = false, reveal = false, timings }) => {
  const P = usePremPalette();
  const { fps } = useVideoConfig();
  const fr = useCurrentFrame();
  const ink = color ?? (accent ? P.gold : P.ink);

  // ── VERBATIM word-by-word reveal: the exact spoken sentence, revealed word by word ──
  if (reveal) {
    const fontSize = size ?? 76;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const nw = Math.max(1, words.length);
    // per-word start frame: exact from `timings` (seconds), else evenly across the window
    const startFr = (i: number) =>
      timings && timings[i] != null ? timings[i] * fps : (i * durFrames) / nw;
    const active = accent ? P.goldLt : P.gold; // brief tint on the just-revealed word
    return (
      <AbsoluteFill style={{ background: bg ?? P.cream }}>
        {!bg && <PremiumBg frame={false} />}
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 96px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "center",
            columnGap: "0.28em", rowGap: "0.06em", maxWidth: "100%",
            fontFamily: PROXIMA, fontWeight: 800, fontSize, textTransform: "uppercase",
            textAlign: "center", lineHeight: 1.12, letterSpacing: "0.005em" }}>
            {words.map((w, i) => {
              const s = startFr(i);
              const t = Math.min(1, Math.max(0, (fr - s) / 6));   // ~6-frame pop-in
              const e = 1 - Math.pow(1 - t, 3);                   // ease-out cubic
              const act = Math.min(1, Math.max(0, (fr - s) / 12)); // active→settle tint
              return (
                <span key={i} style={{ display: "inline-block", color: act < 1 ? active : ink,
                  opacity: e, transform: `translateY(${(1 - e) * 14}px) scale(${0.9 + 0.1 * e})` }}>{w}</span>
              );
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // ── DISTILLED group mode (default, unchanged): 2–3-word punches in sequence ──
  const fontSize = size ?? 132;
  const gs = groups ?? chunkWords(text, wordsPerGroup);
  const n = Math.max(1, gs.length);
  const per = durFrames / n;
  const idx = Math.max(0, Math.min(n - 1, Math.floor(fr / per)));
  const local = fr - idx * per;
  // subtle "show up": fade + rise + a touch of scale, ease-out cubic over ~7 frames
  const t = Math.min(1, Math.max(0, local / 7));
  const e = 1 - Math.pow(1 - t, 3);
  return (
    <AbsoluteFill style={{ background: bg ?? P.cream }}>
      {!bg && <PremiumBg frame={false} />}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 100px", boxSizing: "border-box" }}>
        <div style={{ fontFamily: PROXIMA, fontWeight: 800, fontSize, textTransform: "uppercase",
          color: ink, textAlign: "center", lineHeight: 1.03, letterSpacing: "0.005em",
          opacity: e, transform: `translateY(${(1 - e) * 28}px) scale(${0.965 + 0.035 * e})` }}>{gs[idx]}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   OPENING HOOK (house rule) — §1 is now a
   SPLIT opening: the real MOVING screenshot (PremiumEvidence zoom/scroll) in the
   top panel + avatar below + a PillHeadline banner inserted at the CENTER / split
   line. This REPLACES the old standalone headline §1 (PremiumHeadline) merged with
   the first evidence beat — see SECTION_PIPELINE.md / PIPELINE_DIRECTIVES.md §2b.
   ════════════════════════════════════════════════════════════════════════════ */

export type PillSeg = { t: string; accent?: boolean };

/* PillHeadline — viral black rounded-pill banner, heavy ALL-CAPS sans, snap-pops in.
   Approved template (owner refs IMG_5634/IMG_5635): black pill, white text with ONE
   yellow accent word (the key number/brand). textColor/accentColor overridable. */
export const PillHeadline: React.FC<{
  lines: PillSeg[][]; cy?: number; textColor?: string; accentColor?: string;
  size?: number; delay?: number; pill?: string;
}> = ({ lines, cy = 792, textColor = "#FFFFFF", accentColor = "#F2E63B", size = 74, delay = 6, pill = "#0b0b0b" }) => {
  const { fps } = useVideoConfig();
  const fr = useCurrentFrame();
  const s = spring({ frame: fr - delay, fps, config: { damping: 16, mass: 0.7, stiffness: 150 } });
  const scale = interpolate(s, [0, 1], [0.84, 1]);
  const op = interpolate(fr - delay, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = interpolate(s, [0, 1], [26, 0]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start" }}>
      <div style={{
        position: "absolute", top: cy, left: "50%",
        transform: `translate(-50%,-50%) translateY(${rise}px) scale(${scale})`,
        opacity: op, maxWidth: 960,
      }}>
        <div style={{ background: pill, borderRadius: 32, padding: "20px 44px",
          boxShadow: "0 14px 40px rgba(0,0,0,0.55)", textAlign: "center" }}>
          {lines.map((ln, i) => (
            <div key={i} style={{ fontFamily: SERIF, fontWeight: 800, fontSize: size, lineHeight: 1.02,
              letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap", color: textColor }}>
              {ln.map((seg, j) => (
                <span key={j} style={{ color: seg.accent ? accentColor : textColor }}>
                  {seg.t}{j < ln.length - 1 ? " " : ""}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* PremiumOpeningHook — the §1 beat. Drop ONE of these as the FIRST section (in a time
   window w from sectionWindows). Renders the split (PremiumEvidence in the top panel +
   avatar below) AND the PillHeadline overlay at the center/split line, as two sibling
   Sequences on the same window w. headline.lines uses PillSeg ([{t}, {t,accent:true}]). */
export const PremiumOpeningHook: React.FC<{
  w: { from: number; durationInFrames: number };
  avatarSrc: string;
  evidence: { src: string; domain?: string; stamp?: string; kicker?: string;
    motion?: "scroll" | "zoom" | "static"; zoomTo?: number; scroll?: number;
    focus?: { fx: number; fy: number }; focusR?: { rx: number; ry: number } };
  headline: { lines: PillSeg[][]; cy?: number; textColor?: string; accentColor?: string; size?: number };
}> = ({ w, avatarSrc, evidence, headline }) => (
  <>
    <Sequence {...w}>
      <PremiumFrame avatarSrc={avatarSrc} muted trimBefore={w.from}>
        <PremiumEvidence src={evidence.src} domain={evidence.domain} stamp={evidence.stamp}
          kicker={evidence.kicker} motion={evidence.motion ?? "zoom"} zoomTo={evidence.zoomTo ?? 1.5}
          scroll={evidence.scroll} durFrames={w.durationInFrames}
          focus={evidence.focus} focusR={evidence.focusR} />
      </PremiumFrame>
    </Sequence>
    <Sequence {...w}>
      <PillHeadline lines={headline.lines} cy={headline.cy ?? 792} textColor={headline.textColor ?? "#FFFFFF"}
        accentColor={headline.accentColor ?? "#F2E63B"} size={headline.size ?? 74} />
    </Sequence>
  </>
);

/* ════════════════════════════════════════════════════════════════════════════
   §5 / §6 GRAPHICS-ONLY SECTIONS (QCR-147)
   ────────────────────────────────────────────────────────────────────────────
   The premium path had NO §5 (split graphics) or distinct §6 (full graphics)
   section component, so authors improvised a single full-frame HeroScene for both
   §4 and "§6" and NEVER built §5 — collapsing every video into the §3b-caption ↔
   §4-hero ping-pong the owner caught. These two components restore the missing
   sections so the §3→§3b→§4→§5→§6 cycle can actually be authored in premium-classic.
   Both bake ZERO text (the Phase-8 burned subtitle carries the words); the variety
   comes from GRAPHICS + MOTION (drawing rings + an orbiting node + keyed assets).
   ════════════════════════════════════════════════════════════════════════════ */

// concentric gold rings that DRAW themselves (staggered) + a node ORBITING the outer ring —
// the moving graphics vocabulary shared by §5 and §6 (no text, pure motion).
export const PremRings: React.FC<{ cx: number; cy: number; r?: number; rings?: number; orbit?: boolean; delay?: number }> = ({
  cx, cy, r = 220, rings = 3, orbit = true, delay = 0,
}) => {
  const P = usePremPalette();
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig();
  const a = (frame / fps) * Math.PI * 0.7;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} viewBox={`0 0 ${width} ${height}`}>
      {Array.from({ length: rings }).map((_, i) => {
        const rr = r * (0.5 + (i * 0.5) / Math.max(1, rings - 1));
        const len = 2 * Math.PI * rr;
        const t = interpolate(frame - (delay + i * 6), [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const e = 1 - Math.pow(1 - t, 3);
        return <circle key={i} cx={cx} cy={cy} r={rr} fill="none" stroke={P.gold} strokeWidth={1.4} opacity={0.4}
          strokeDasharray={len} strokeDashoffset={len * (1 - e)} />;
      })}
      {orbit && <circle cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={8} fill={(P.goldLt ?? P.gold)} opacity={0.9} />}
    </svg>
  );
};

/* §5 SPLIT GRAPHICS — avatar BELOW (windowed PremiumFrame) + graphics-only in the TOP
   panel: a central keyed asset on drawing rings + up to two satellite image-icons. NO
   text. Tag the beat "split:<concept>". Wraps its OWN windowed PremiumFrame (QCR-109). */
export const PremiumSplitGraphics: React.FC<{
  w: { from: number; durationInFrames: number };
  avatarSrc: string;
  assets: string[];   // 1–3 keyed cutout srcs — graphics only, NO labels/text
  cy?: number;        // panel-relative center (the top-40% panel)
}> = ({ w, avatarSrc, assets, cy = 330 }) => {
  const cx = 540;
  const main = assets[0];
  const sats = assets.slice(1, 3);
  return (
    <Sequence {...w}>
      <PremiumFrame avatarSrc={avatarSrc} muted trimBefore={w.from}>
        <PremRings cx={cx} cy={cy} r={200} rings={3} />
        {main && <PremiumAsset src={main} size={300} cx={cx} cy={cy} delay={4} driftPhase={0.4} />}
        {sats.map((s, i) => (
          <PremiumImageIcon key={i} src={s} size={128} delay={10 + i * 6}
            x={cx + (i === 0 ? -250 : 250)} y={cy + (i === 0 ? -118 : 118)} />
        ))}
      </PremiumFrame>
    </Sequence>
  );
};

/* §5 SPLIT FLOW (variant, QCR-292/293) — a SECOND, visually-distinct §5 split-graphics beat
   so two §5 recurrences in one video don't look identical (the radial rings-orbit of
   PremiumSplitGraphics vs. this LEFT→RIGHT process flow). Avatar BELOW (windowed PremiumFrame,
   QCR-109) + graphics-only in the TOP-40% panel: a HORIZONTAL row of 2–3 keyed assets
   connected by the SAME strong TRAVELING GOLD-RAIL connector as PremiumFullFlow (continuous
   gold rail ≥3.6px + underglow + a moving pulse TRAIN + right-pointing chevrons in each gap —
   a moving element, house rule not static). HORIZONTAL is the RIGHT
   orientation for the wide-short 1080×768 panel (unlike the tall §6, which flows vertically):
   a left→right row fills the panel width and reads as a natural pipeline. ZERO baked text
   (§5 rule — PremiumAsset only, no labels). Tag the beat "split:<concept>". */
export const PremiumSplitFlow: React.FC<{
  w: { from: number; durationInFrames: number };
  avatarSrc: string;
  assets: string[];   // 2–3 keyed cutout srcs — graphics only, NO labels/text (§5 rule)
  cy?: number;        // panel-relative center (the top-40% panel), default 330
}> = ({ w, avatarSrc, assets, cy = 330 }) => {
  return (
    <Sequence {...w}>
      <PremiumFrame avatarSrc={avatarSrc} muted trimBefore={w.from}>
        <SplitFlowGraphics assets={assets} cy={cy} />
      </PremiumFrame>
    </Sequence>
  );
};

/* Inner render of the §5 horizontal flow — lives INSIDE the PremiumFrame top-40% panel
   (1080 wide × 768 tall). Kept as its own component so the connector math can read
   useCurrentFrame within the Sequence's local timeline. NO text (§5 rule). */
const SplitFlowGraphics: React.FC<{ assets: string[]; cy: number }> = ({ assets, cy }) => {
  const P = usePremPalette();
  const { width } = useVideoConfig();
  const frame = useCurrentFrame();
  const items = assets.slice(0, 3);
  const n = Math.max(1, items.length);
  const gold = P.gold, goldLt = P.goldLt ?? P.gold;

  // ── Node geometry (HORIZONTAL) ── a left→right row across the wide panel. Panel is
  // 1080 wide × 768 tall; keep everything within ≥96px side margins AND inside the top-40%
  // panel band (roughly y 150–620) so nothing spills into the avatar's bottom-60% zone.
  const MARGIN = 96;
  const cx = width / 2;                                   // 540
  // 2 nodes → 240, 3 nodes → 200 (both leave ≥96px side margins with the X spread below).
  const size = n >= 3 ? 200 : n === 2 ? 240 : 232;
  const R = size * 0.46;                                  // connector endpoints sit just past each node
  // X spread: outer nodes clear the side margins. usable half-width = cx - MARGIN - size/2.
  // 3 → -300/0/+300, 2 → -230/+230, 1 → center. Guard: outerX + size/2 + drift ≤ width-MARGIN.
  const half = cx - MARGIN - size / 2;                   // max |x offset| a node center may take
  const spread = n >= 3 ? Math.min(300, half) : n === 2 ? Math.min(230, half) : 0;
  const xs = items.map((_, i) => (n === 1 ? cx : cx + (i - (n - 1) / 2) * ((2 * spread) / Math.max(1, n - 1))));
  // Gentle vertical S so the row isn't a dead-flat line (adds depth); tiny, stays in the panel band.
  const YAMP = 26;
  const ys = items.map((_, i) => (n === 1 ? cy : cy + (i % 2 === 0 ? -YAMP : YAMP)));

  // ── ONE CONTINUOUS FLOW RAIL threading LEFT→RIGHT through the whole node row ──
  // A single smooth gold rail runs from the first node across through the last, sampled on a
  // monotone-X smoothstep curve through (xs, ys) so it gently rises/falls between nodes. Soft
  // underglow, a MOVING TRAIN of pulses travelling RIGHTWARD, and a RIGHT-pointing chevron in
  // every inter-node gap. Nodes render ON TOP so the rail reads as passing behind/through them.
  const x0 = xs[0] - R, xN = xs[n - 1] + R;              // rail spans from just left of first → right of last node
  const railPts: [number, number][] = [];
  const NS = 90;
  for (let s = 0; s <= NS; s++) {
    const gx = x0 + ((xN - x0) * s) / NS;
    let gy = ys[0];
    if (gx <= xs[0]) gy = ys[0];
    else if (gx >= xs[n - 1]) gy = ys[n - 1];
    else {
      for (let j = 0; j < n - 1; j++) {
        if (gx >= xs[j] && gx <= xs[j + 1]) {
          const f2 = (gx - xs[j]) / (xs[j + 1] - xs[j]);
          const sm = f2 * f2 * (3 - 2 * f2);            // smoothstep for a soft curve between node rail points
          gy = ys[j] + (ys[j + 1] - ys[j]) * sm;
          break;
        }
      }
    }
    railPts.push([gx, gy]);
  }
  // draw-in progress across the whole rail
  const t = interpolate(frame - 12, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const e = 1 - Math.pow(1 - t, 3);
  const drawn = Math.max(1, Math.round(NS * e));
  const d = railPts.slice(0, drawn + 1).map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const railAt = (u: number) => railPts[Math.min(railPts.length - 1, Math.max(0, Math.round(u * NS)))];
  // moving TRAIN of pulses travelling RIGHTWARD along the full rail
  const period = 70;
  const phase = (((frame % period) + period) % period) / period;
  const pulses = [0, 0.28, 0.56, 0.84].map((off) => {
    const u = ((phase + off) % 1 + 1) % 1;
    const p = railAt(u);
    return { px: p[0], py: p[1], u };
  });
  // a RIGHT-pointing chevron in every inter-node GAP (mid-point of the two rail points)
  const chevrons = xs.slice(0, -1).map((x, i) => {
    const mx = (xs[i] + xs[i + 1]) / 2;
    const p = railAt((mx - x0) / (xN - x0));
    const ce = interpolate(frame - (18 + i * 6), [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return { mx: p[0], my: p[1], ce };
  });

  const mH = 768;   // top-40% panel height (0.4 × 1920) — SVG viewBox for the panel

  return (
    <>
      {/* ── DEPTH: a faint WIDE back-glow behind the horizontal flow so the panel isn't empty.
          A soft horizontal gold halo hugging the row — palette-driven, NO rings (stays distinct
          from PremiumSplitGraphics' radial rings). ── */}
      <svg width={width} height={mH} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} viewBox={`0 0 ${width} ${mH}`}>
        <defs>
          <radialGradient id="psf-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={goldLt} stopOpacity={0.14} />
            <stop offset="55%" stopColor={gold} stopOpacity={0.05} />
            <stop offset="100%" stopColor={gold} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={cx} cy={cy} rx={spread + size * 0.62} ry={YAMP + size * 0.6}
          fill="url(#psf-halo)" opacity={interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      </svg>

      {/* ── the flow rail (underglow + bright rail + chevrons + moving pulse train) ── */}
      <svg width={width} height={mH} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} viewBox={`0 0 ${width} ${mH}`}>
        {/* soft underglow rail (wide, low-opacity) → reads as energy */}
        <path d={d} fill="none" stroke={goldLt} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" opacity={0.20 * e} />
        {/* the rail — thick + bright */}
        <path d={d} fill="none" stroke={gold} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
        {/* RIGHT-pointing chevrons in each gap */}
        {chevrons.map((c, i) => c.ce > 0.2 && (
          <path key={i} d={`M ${c.mx - 11} ${c.my - 13} L ${c.mx + 11} ${c.my} L ${c.mx - 11} ${c.my + 13}`}
            fill="none" stroke={gold} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.95 * c.ce} />
        ))}
        {/* moving train of pulses travelling rightward */}
        {e > 0.6 && pulses.map((pu, k) => (
          <g key={k}>
            <circle cx={pu.px} cy={pu.py} r={13 - k * 1.5} fill={goldLt} opacity={0.98 - k * 0.16} />
            <circle cx={pu.px} cy={pu.py} r={(13 - k * 1.5) + 7} fill={goldLt} opacity={0.22 - k * 0.03} />
          </g>
        ))}
      </svg>

      {/* nodes render ON TOP of the rail */}
      {items.map((s, i) => (
        <PremiumAsset key={i} src={s} size={size} cx={xs[i]} cy={ys[i]} delay={4 + i * 6} driftPhase={0.3 + i * 0.5} />
      ))}
    </>
  );
};

/* §6 FULL GRAPHICS — fullscreen graphics-only system diagram: a core keyed asset on
   drawing rings with satellites radiating around it. NO text, NO avatar. Distinct from
   §4 HeroScene (which carries a serif label + a single asset). Tag the beat "full:<concept>". */
export const PremiumFullGraphics: React.FC<{
  assets: string[];   // 1–4 keyed cutout srcs — graphics only, NO labels/text
  cy?: number;
}> = ({ assets, cy = 960 }) => {
  const cx = 540;
  const main = assets[0];
  const sats = assets.slice(1, 4);
  return (
    <AbsoluteFill>
      <PremiumBg />
      <PremRings cx={cx} cy={cy} r={330} rings={4} />
      {main && <PremiumAsset src={main} size={450} cx={cx} cy={cy} delay={4} driftPhase={0.5} />}
      {sats.map((s, i) => {
        const ang = -Math.PI / 2 + ((i + 1) * (Math.PI * 2)) / (sats.length + 1);
        return <PremiumImageIcon key={i} src={s} size={148} delay={12 + i * 6}
          x={cx + Math.cos(ang) * 360} y={cy + Math.sin(ang) * 360} />;
      })}
    </AbsoluteFill>
  );
};

/* §6 FULL FLOW (variant, QCR-292) — a SECOND, visually-distinct §6 full-graphics beat so
   two §6 recurrences in one video don't look identical (the radial rings-orbit of
   PremiumFullGraphics vs. this TOP→BOTTOM process flow). Fullscreen, graphics-only, NO
   avatar, ZERO baked text (§6 rule): a VERTICAL SERPENTINE column of 2–4 keyed assets
   connected by the SAME TRAVELING GOLD PULSE connector as PremiumFlow (a moving element,
   house rule — not static). Reoriented HORIZONTAL→VERTICAL:
   a left→right row only occupied a thin band and left the bottom half of the tall 1080×1920
   frame empty (fought the 9:16 aspect). A top→bottom column spans the tall axis (nodes
   from y≈360 to y≈1560), FILLS the frame, and still reads as a process (top-to-bottom is a
   natural pipeline reading order). The rail snakes on a gentle S-curve so it fills the
   width too. Tag the beat "full:<concept>". Distinct from PremiumFullGraphics (rings-orbit). */
export const PremiumFullFlow: React.FC<{
  assets: string[];   // 2–4 keyed cutout srcs — graphics only, NO labels/text (§6 rule)
  cy?: number;        // kept for API back-compat; the vertical flow ignores it (spans the frame)
}> = ({ assets }) => {
  const P = usePremPalette();
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const items = assets.slice(0, 4);
  const n = Math.max(1, items.length);

  // ── Node geometry (VERTICAL) ── stack nodes down the tall axis so the flow spans the
  // whole 1920 frame (no empty half). Nodes run top→bottom from ~y360 to ~y1560 (≈1200px of
  // vertical travel); the X of each node alternates around center on a gentle S-curve so the
  // rail snakes down and fills the width too — dynamic, and clearly NOT the radial rings.
  const MARGIN = 96;
  const cx = width / 2;
  // Substantial but they must clear the ≥96px side margins even with the S-curve X offset.
  const size = n >= 4 ? 248 : n === 3 ? 260 : 256;
  // Y band: spread across the tall frame. 4 → ~360/760/1160/1560, 3 → ~440/960/1480, 2 → 620/1300.
  const yTop = n >= 4 ? 360 : n === 3 ? 440 : 620;
  const yBot = n >= 4 ? 1560 : n === 3 ? 1480 : 1300;
  const ys = items.map((_, i) => (n === 1 ? (yTop + yBot) / 2 : yTop + ((yBot - yTop) * i) / (n - 1)));
  // Serpentine X: alternate cx-XOFF / cx+XOFF (a little wider outer pair) so the rail bows
  // side to side. All offsets keep node+drift inside the side margins (size/2 + XOFF + drift
  // ≤ cx - MARGIN → with cx=540, size≈250: 125 + 190 + 6 = 321 ≤ 444 ✓).
  const XOFF = 190, XOFF_IN = 150;
  const xs = items.map((_, i) => {
    if (n === 1) return cx;
    const off = i % 2 === 0 ? -XOFF : XOFF;                 // outer swing on the ends
    // pull the INTERIOR nodes in a touch so the snake reads as a smooth S, not a hard zigzag
    const isInterior = i > 0 && i < n - 1;
    const mag = isInterior ? XOFF_IN : XOFF;
    return cx + (off < 0 ? -mag : mag);
  });

  // connector endpoints sit JUST OUTSIDE each node's visual half-extent (vertically) so the
  // rail + chevrons live in the GAP between stacked nodes, never buried behind the bodies.
  const R = size * 0.46;
  const gold = P.gold, goldLt = P.goldLt ?? P.gold;

  return (
    <AbsoluteFill>
      <PremiumBg />
      {/* ── DEPTH: a faint TALL back-glow behind the vertical flow so the frame isn't empty.
          A soft vertical gold halo hugging the column — palette-driven, NO rings (stays
          distinct from PremiumFullGraphics' radial rings). ── */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id="pff-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={goldLt} stopOpacity={0.14} />
            <stop offset="55%" stopColor={gold} stopOpacity={0.05} />
            <stop offset="100%" stopColor={gold} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={cx} cy={(yTop + yBot) / 2} rx={XOFF + size * 0.62} ry={(yBot - yTop) / 2 + size * 0.62}
          fill="url(#pff-halo)" opacity={interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      </svg>

      {/* ── ONE CONTINUOUS FLOW RAIL threading TOP→BOTTOM through the whole node column ──
          A single smooth gold rail runs from the first node down through the last, sampled on
          a monotone-Y smoothstep S-curve through (xs, ys) so it snakes side to side. Soft
          underglow, a MOVING TRAIN of pulses travelling DOWNWARD the full height, and a
          DOWN-pointing chevron in every inter-node gap. Nodes render ON TOP so the rail reads
          as passing behind/through them. Rail X is offset a touch off each node center so it
          stays in the clear channel beside the bodies. */}
      {(() => {
        const y0 = ys[0] - R, yN = ys[n - 1] + R;              // rail spans from just above first→below last node
        // smooth rail as a polyline sampled from a monotone-y path through (xs, ys),
        // extended slightly past the end nodes. Linear-interp between per-node points with a
        // smoothstep ease → soft S-curve; deterministic (no Math.random).
        const railPts: [number, number][] = [];
        const NS = 90;
        for (let s = 0; s <= NS; s++) {
          const gy = y0 + ((yN - y0) * s) / NS;
          let gx = xs[0];
          if (gy <= ys[0]) gx = xs[0];
          else if (gy >= ys[n - 1]) gx = xs[n - 1];
          else {
            for (let j = 0; j < n - 1; j++) {
              if (gy >= ys[j] && gy <= ys[j + 1]) {
                const f2 = (gy - ys[j]) / (ys[j + 1] - ys[j]);
                // smoothstep for a soft S between node rail points
                const sm = f2 * f2 * (3 - 2 * f2);
                gx = xs[j] + (xs[j + 1] - xs[j]) * sm;
                break;
              }
            }
          }
          railPts.push([gx, gy]);
        }
        // draw-in progress down the whole rail
        const t = interpolate(frame - 12, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const e = 1 - Math.pow(1 - t, 3);
        const drawn = Math.max(1, Math.round(NS * e));
        const d = railPts.slice(0, drawn + 1).map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
        const railAt = (u: number) => railPts[Math.min(railPts.length - 1, Math.max(0, Math.round(u * NS)))];
        // moving TRAIN of pulses travelling DOWNWARD along the full rail
        const period = 70;
        const phase = (((frame % period) + period) % period) / period;
        const pulses = [0, 0.28, 0.56, 0.84].map((off) => {
          const u = ((phase + off) % 1 + 1) % 1;
          const p = railAt(u);
          return { px: p[0], py: p[1], u };
        });
        // a DOWN-pointing chevron in every inter-node GAP (mid-point of the two rail points)
        const chevrons = ys.slice(0, -1).map((y, i) => {
          const my = (ys[i] + ys[i + 1]) / 2;
          const p = railAt((my - y0) / (yN - y0));
          const ce = interpolate(frame - (18 + i * 6), [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return { mx: p[0], my: p[1], ce };
        });
        return (
          <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} viewBox={`0 0 ${width} ${height}`}>
            {/* soft underglow rail (wide, low-opacity) → reads as energy */}
            <path d={d} fill="none" stroke={goldLt} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" opacity={0.20 * e} />
            {/* the rail — thick + bright */}
            <path d={d} fill="none" stroke={gold} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
            {/* DOWN-pointing chevrons in each gap */}
            {chevrons.map((c, i) => c.ce > 0.2 && (
              <path key={i} d={`M ${c.mx - 13} ${c.my - 11} L ${c.mx} ${c.my + 11} L ${c.mx + 13} ${c.my - 11}`}
                fill="none" stroke={gold} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.95 * c.ce} />
            ))}
            {/* moving train of pulses travelling downward */}
            {e > 0.6 && pulses.map((pu, k) => (
              <g key={k}>
                <circle cx={pu.px} cy={pu.py} r={13 - k * 1.5} fill={goldLt} opacity={0.98 - k * 0.16} />
                <circle cx={pu.px} cy={pu.py} r={(13 - k * 1.5) + 7} fill={goldLt} opacity={0.22 - k * 0.03} />
              </g>
            ))}
          </svg>
        );
      })()}
      {items.map((s, i) => (
        <PremiumAsset key={i} src={s} size={size} cx={xs[i]} cy={ys[i]} delay={4 + i * 6} driftPhase={0.3 + i * 0.5} />
      ))}
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   §5b AVATAR + FLOATING CAPTION (house rule) — sits BETWEEN §5 and §6.
   The avatar in its ORIGINAL full frame (not the split paper frame) with BIG Proxima-Nova
   word-by-word subtitles that pop in the EMPTY part of the frame — the region the avatar
   does NOT cover. For a talking-head the free zone is the TOP (above the head); pass `zone`
   per video after LOOKING at the avatar frame ("top" | "bottom" | "left" | "right").
   Words reveal one at a time (fade + rise + pop), the just-revealed word tints gold; a soft
   scrim only inside the caption zone guarantees legibility over the video.
   Tag the beat "avatarcap:<concept>". Suppress its burned subtitle window in Phase 8
   (the floating caption IS the subtitle here). */
export const PremiumAvatarCaption: React.FC<{
  w: { from: number; durationInFrames: number };
  avatarSrc: string;
  text: string;                                   // the exact spoken line (word-by-word)
  zone?: "top" | "bottom" | "left" | "right";     // where the avatar is NOT (choose per video)
  size?: number;
  timings?: number[];                             // optional per-word start seconds (exact sync)
}> = ({ w, avatarSrc, text, zone = "top", size, timings }) => {
  const P = usePremPalette();
  const { width, height, fps } = useVideoConfig();
  const fr = useCurrentFrame();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const nw = Math.max(1, words.length);
  const side = zone === "left" || zone === "right";

  // ── PLATFORM SAFE MARGINS (house rule) ──────────────────────────────────
  // The universal safe zone across TikTok / IG a real run / YT Shorts / FB a real run is 900×1400 centered
  // in 1080×1920 → ~90px sides, ~260px top, ~260px bottom (Shorts/IG eat MORE at the bottom).
  // So a top caption MUST start ≥260px down or the platform status bar / TikTok "For You" tabs /
  // Shorts header / profile chrome trims it. We use 264 top, 360 bottom (extra for Shorts/IG),
  // 96 sides.  Source: kreatli/adaptlypost safe-zone guides 2026.
  const SAFE_TOP = 264, SAFE_BOTTOM = 360, SAFE_SIDE = 96;

  // ── HARD SAFE RECTANGLE per zone (px). The caption MUST stay inside this box — it can NEVER
  //    reach the avatar (the last word once covered the face) NOR the platform UI margins. ──
  const BOXW = side ? 372 : 1080 - 2 * SAFE_SIDE;                    // usable width (888 top/bottom)
  const BOXH = side ? 1920 - SAFE_TOP - SAFE_BOTTOM - 80 : 400;     // usable height
  // AUTO-FIT: pick the LARGEST font (≤ max) whose text still fits inside BOXH, so a long
  // sentence SHRINKS instead of spilling out of (or being clipped by) the zone. Deterministic —
  // estimates wrapping by GREEDY word packing (words wrap as whole units, never mid-word), which
  // matches the real layout far better than naive char/line division (that under-counted lines
  // and let the last line clip onto the avatar — house rule ).
  const maxS = size ?? (side ? 72 : 96), minS = side ? 30 : 40;
  const CW = 0.82, GAP = 0.26, LH = 1.12;          // char-width / column-gap / REAL rendered line-height (× fontSize)
                                                   // CW raised 0.74→0.82: bold all-caps Proxima/Montserrat-800 caps
                                                   // (M/N/H/W) advance ≈0.82em — 0.74 under-counted wraps, picking a
                                                   // font too big so the extra wrap line overflowed the fixed-height
                                                   // box. LH is the ACTUAL render line-height (lineHeight:1.08 + rowGap),
                                                   // not the old 1.24 guess.
  const lineCountAt = (s: number) => {
    const gap = GAP * s;
    let lines = 1, cur = 0;
    for (const wd of words) {
      const ww = Math.max(1, wd.length) * CW * s;
      if (cur > 0 && cur + gap + ww > BOXW) { lines++; cur = ww; }
      else cur += (cur > 0 ? gap : 0) + ww;
    }
    return lines;
  };
  // LONGEST SINGLE WORD (chars) — a word can NEVER wrap, so it must fit BOXW on its own or it
  // overflows BOTH borders (QCR-234 — PdfMcp "RECONHECIMENTO" clipped L+R). The old
  // fit only checked HEIGHT, so one wide all-caps word stayed at max size and spilled sideways.
  const maxWordChars = Math.max(1, ...words.map((wd) => wd.length));
  const fitSize = (() => {
    for (let s = maxS; s >= minS; s -= 2) {
      // BUDGET ONE EXTRA LINE beyond the estimate (QCR-228 — a real run "ACERTA ISSO" bottom-line
      // clip). The greedy width model can still under-count wraps for wide all-caps
      // strings; since the box is `overflow:hidden` with a FIXED height, an undercount guillotines
      // the bottom line. Reserving (lines+1) absorbs that error — worst case the text is one notch
      // smaller, which is invisible vs. a chopped-off final line.
      // ALSO require the widest single word to fit BOXW (QCR-234) — else a long word overflows sideways.
      const heightOk = (lineCountAt(s) + 1) * s * LH <= BOXH;
      const widthOk = maxWordChars * CW * s <= BOXW;
      if (heightOk && widthOk) return s;
    }
    return minS;
  })();
  const fontSize = fitSize;

  // caption box per zone — INSIDE the platform safe margins (top ≥264, bottom ≥360, sides 96)
  // AND clear of the avatar. overflow:hidden is a HARD backstop so nothing ever escapes the box.
  const box: React.CSSProperties =
    zone === "top"    ? { left: SAFE_SIDE, right: SAFE_SIDE, top: SAFE_TOP, height: BOXH, alignItems: "flex-start" } :
    zone === "bottom" ? { left: SAFE_SIDE, right: SAFE_SIDE, bottom: SAFE_BOTTOM, height: BOXH, alignItems: "flex-end" } :
    zone === "left"   ? { left: SAFE_SIDE, top: SAFE_TOP, width: BOXW, height: BOXH, alignItems: "center" } :
                        { right: SAFE_SIDE, top: SAFE_TOP, width: BOXW, height: BOXH, alignItems: "center" };
  const scrim =
    zone === "top"    ? "linear-gradient(180deg, rgba(0,0,0,0.64) 0%, rgba(0,0,0,0.30) 55%, transparent 100%)" :
    zone === "bottom" ? "linear-gradient(0deg, rgba(0,0,0,0.64) 0%, rgba(0,0,0,0.30) 55%, transparent 100%)" :
    zone === "left"   ? "linear-gradient(90deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)" :
                        "linear-gradient(270deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)";
  const scrimBox: React.CSSProperties =
    zone === "top"    ? { left: 0, right: 0, top: 0, height: SAFE_TOP + BOXH + 60 } :
    zone === "bottom" ? { left: 0, right: 0, bottom: 0, height: SAFE_BOTTOM + BOXH + 60 } :
    zone === "left"   ? { left: 0, top: 0, bottom: 0, width: 520 } :
                        { right: 0, top: 0, bottom: 0, width: 520 };

  const startFr = (i: number) => (timings && timings[i] != null ? timings[i] * fps : (i * w.durationInFrames * 0.72) / nw);

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(avatarSrc)} muted trimBefore={w.from}
        style={{ width, height, objectFit: "cover" }} />
      <div style={{ position: "absolute", ...scrimBox, background: scrim, pointerEvents: "none" }} />
      <div style={{ position: "absolute", ...box, display: "flex", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignContent: side ? "center" : box.alignItems as any,
          alignItems: "baseline", justifyContent: "center", columnGap: "0.26em", rowGap: "0.04em",
          width: "100%", fontFamily: PROXIMA, fontWeight: 800, fontSize, textTransform: "uppercase",
          textAlign: "center", lineHeight: 1.08, letterSpacing: "0.004em" }}>
          {words.map((wd, i) => {
            const s = startFr(i);
            const t = Math.min(1, Math.max(0, (fr - s) / 6));
            const e = 1 - Math.pow(1 - t, 3);
            const next = startFr(i + 1);
            const isActive = fr >= s && (i + 1 >= nw || fr < next);
            const col = t <= 0 ? "transparent" : isActive ? (P.goldLt ?? "#e6c884") : "#ffffff";
            return (
              <span key={i} style={{ display: "inline-block", color: col,
                opacity: e, transform: `translateY(${(1 - e) * 18}px) scale(${0.8 + e * 0.2})`,
                textShadow: "0 4px 18px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.9)",
                WebkitTextStroke: "1.5px rgba(0,0,0,0.55)" }}>{wd}</span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
