import React from "react";
import { useVideoConfig, useCurrentFrame, interpolate, AbsoluteFill, OffthreadVideo, staticFile, Sequence } from "remotion";
import {
  HD, useSnapHD, useBounceHD, DrawPath, MarkerHighlight, HandWord,
  HandArrow, ScreenshotCard, PaperBg, FlowDiagram, HD_ICONS, StatCountUp, HandUnderline,
} from "./handdrawn";
import type { FlowStep } from "./handdrawn";

/* ── sectionWindows ─ GAP-FREE section scheduling (house rule). NEVER author a Sequence as
   `durationInFrames={F(t2-t1)}` — `Math.round((t2-t1)*fps)` (round of the SPAN) can be 1 frame
   SHORTER than `F(t2)-F(t1)` (difference of the rounded frame positions) when the start rounds
   down and the end rounds up, leaving a 1-frame GAP before the next overlay → the always-on
   frame-behind (avatar) flashes through for that frame. Pass the ORDERED boundary times (seconds)
   and get back per-section `{from, durationInFrames}` computed as FRAME DIFFERENCES, so
   `from + durationInFrames === next.from` EXACTLY (zero gaps). `bleed` (default 1) extends each
   window by N extra frames so consecutive FULL-FRAME OVERLAYS always overlap by ≥1 frame — a
   belt-and-suspenders that also covers any future off-by-one. Use `bleed:0` for split children
   that must NOT extend past their boundary.
   Usage:
     const W = sectionWindows(fps, [0, 2.5, 5, 7.5, ...]);   // N+1 marks → N windows
     <Sequence {...W[0]}>…</Sequence>  <Sequence {...W[1]}>…</Sequence> … */
export const sectionWindows = (
  fps: number, marks: number[], opts?: { bleed?: number },
): { from: number; durationInFrames: number }[] => {
  const F = (s: number) => Math.round(s * fps);
  // bleed default 0: frame-difference already makes from+dur===next.from EXACTLY (zero gap, zero
  // overlap) — the clean handoff. (A +1 bleed adds a 1-frame overlap that makes the OLD section
  // linger 1 frame; only use bleed>0 if you specifically want overlap.)
  const bleed = opts?.bleed ?? 0;
  const out: { from: number; durationInFrames: number }[] = [];
  for (let i = 0; i < marks.length - 1; i++) {
    const from = F(marks[i]);
    out.push({ from, durationInFrames: F(marks[i + 1]) - from + bleed });
  }
  return out;
};

/* ── Held ─ NO-BLANK continuation wrapper (house rule). PROBLEM: when ONE motion idea is "held" across several consecutive section
   windows (e.g. a radial system or CTA cycle spanning W[9]→W[10]→…), each new <Sequence>
   resets the child's internal clock to frame 0, so the idea REPLAYS its entrance from blank
   paper — its icons/strokes (delay 6–32f) haven't drawn yet, exposing the bare ruled-paper
   floor for ~0.2–0.3s at every internal "held" boundary. FIX: wrap the CONTINUATION window's
   content in <Held> — it nests a `<Sequence from={-preload}>` so the child's useCurrentFrame()
   is PRE-ADVANCED past the entrance (default 40f ≈ 1.6s, clears every Idea*'s longest entrance),
   making the held scene render fully-drawn from its first frame — a seamless continuation of the
   previous window, never a blank re-draw. Use ONLY on a window that CONTINUES the same idea the
   PREVIOUS window already drew in; never on a fresh first appearance (which SHOULD draw in). */
export const Held: React.FC<{ preload?: number; children: React.ReactNode }> = ({
  preload = 40, children,
}) => (
  <Sequence from={-Math.abs(preload)} layout="none">
    {children}
  </Sequence>
);

/* ════════════════════════════════════════════════════════════════════════════
   SECTION COMPONENTS — the section-by-section pipeline (owner rebuild)

   Every video is assembled from named, self-contained SECTIONS. Each section
   encapsulates its OWN choreography + timing; the caller supplies only CONTENT
   (copy, a screenshot, a data point). This is the "very section-by-section
   oriented logic" — the system imposes the grammar, the script fills the words.

     SECTION 1  <HeadlineHook>     — the clickbait headline of the OVERALL view.
     SECTION 2  <EvidenceReveal>   — a real screenshot + a hard data point: the
                                     real-life PROOF of what the avatar is saying.

   Both live on the hand-drawn paper frame (HandDrawnFrame, top-40% motion area).
   Drop them inside <Sequence> blocks. No caller coordinates required — each
   section self-annotates (circles/underlines/arrows draw themselves on the key
   thing). NO emoji. Honors: ≤15 words on screen, one bounce accent, complement
   rule (distil — never transcribe the narration).
   ════════════════════════════════════════════════════════════════════════════ */

// Rough on-screen width of hand-font text (Trebuchet ~0.55em advance).
const estW = (text: string, size: number) => Math.max(60, text.length * size * 0.55);

// Subtle "alive" breathing for a held block.
const useBreathe = (amp = 0.01, hz = 2.0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return 1 + amp * Math.sin((frame / fps) * hz * Math.PI);
};

// ── A sketchy ellipse drawn around a LOCAL box (no full-frame coords needed) ──
const CircleAround: React.FC<{ w: number; h: number; delay?: number; stroke?: string; pad?: number }> = ({
  w, h, delay = 0, stroke = HD.accent, pad = 18,
}) => {
  const W = w + pad * 2;
  const H = h + pad * 2;
  const cx = W / 2, cy = H / 2, rx = W / 2 - 3, ry = H / 2 - 3;
  const k = 0.5523;
  const d = `M ${cx + rx} ${cy}
    C ${cx + rx} ${cy - ry * k}, ${cx + rx * k} ${cy - ry}, ${cx} ${cy - ry}
    C ${cx - rx * k} ${cy - ry}, ${cx - rx} ${cy - ry * k}, ${cx - rx} ${cy}
    C ${cx - rx} ${cy + ry * k}, ${cx - rx * k} ${cy + ry}, ${cx} ${cy + ry}
    C ${cx + rx * k} ${cy + ry}, ${cx + rx} ${cy + ry * k}, ${cx + rx + 10} ${cy - 5}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ position: "absolute", left: -pad, top: -pad, overflow: "visible", pointerEvents: "none" }}>
      <DrawPath d={d} delay={delay} dur={16} len={Math.PI * (rx + ry) * 1.25} strokeWidth={8} stroke={stroke} />
    </svg>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 1 — HeadlineHook  (0–3.0s, the clickbait headline of the whole video)

   A news-desk clickbait headline that states the VIDEO THEME in one breath:
   a live kicker chip, 1-2 ink lead lines, ONE marker-red accent line (highlight
   swipe + self-drawing circle + wavy underline), the whole block breathing.
   This is what makes the viewer stop in the first 2 seconds.

   Props (content only):
     kicker     short label ("VAZOU", "UMA SKILL SÓ", "CLAUDE CODE")
     lead       1-2 ink lines (the setup)            e.g. ["O CLAUDE CODE","VIRA UM ESTÚDIO"]
     accent     the ONE highlighted payoff line      e.g. "DE ANIMAÇÃO"
     live       pulsing red dot on the kicker (news/"AGORA" feel) — default true
   ════════════════════════════════════════════════════════════════════════════ */
export const HeadlineHook: React.FC<{
  kicker: string;
  lead: string[];
  accent: string;
  live?: boolean;
  size?: number;       // ONE size for ALL headline words (equal-sized). Default 84.
  instant?: boolean;   // full headline visible at frame 0; default ON
  fullFrame?: boolean; // true = own paper bg, center in WHOLE frame; false (default) = center in its
                       // container (the HandDrawnFrame TOP PANEL → split, avatar stays below)
}> = ({ kicker, lead, accent, live = true, size = 84, instant = true, fullFrame = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const breathe = useBreathe(0.008, 1.6);
  const dot = 0.5 + 0.5 * Math.abs(Math.sin((frame / fps) * Math.PI * 1.4));
  const accentW = estW(accent, size);
  // With `instant`, the TEXT is fully drawn at frame 0; the detail effects (highlight
  // swipe, self-drawing circle, wavy underline) still animate on for polish.
  const eff = (d: number) => (instant ? Math.max(0, d - 8) : d);
  const CAPS = { textTransform: "uppercase" as const };

  // The whole headline block — ONE phrase, ALL CAPS, all words the SAME size.
  // In-panel (Section 1, default): sits LOW, near the split line, with a generous safe
  // margin from the borders (house rule). Full-frame title card: stays centered.
  const block = (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: fullFrame ? "center" : "flex-end", textAlign: "center",
      padding: fullFrame ? "0 116px" : "0 116px 96px",
      transform: `scale(${breathe})`, transformOrigin: fullFrame ? "50% 50%" : "50% 100%" }}>
      {/* kicker tag REMOVED (house rule) — headline only, no little label above. */}

      {/* the phrase — every line the SAME size, uppercase, centered */}
      <div style={{ lineHeight: 1.08 }}>
        {lead.map((ln, i) => (
          <div key={i} style={{ ...CAPS, marginBottom: 10 }}>
            <HandWord delay={instant ? 0 : 4 + i * 5} size={size} instant={instant}>{ln}</HandWord>
          </div>
        ))}

        {/* accent line — SAME size, marker-red, with draw-on detail FX */}
        <div style={{ ...CAPS, position: "relative", display: "inline-block", marginTop: 6 }}>
          <MarkerHighlight delay={eff(4 + lead.length * 5 + 10)} width={accentW} height={Math.round(size * 0.4)} />
          <HandWord delay={instant ? 0 : 4 + lead.length * 5 + 4} size={size} color={HD.accent} bounce instant={instant}>{accent}</HandWord>
          <CircleAround w={accentW} h={size * 1.14} delay={eff(4 + lead.length * 5 + 14)} pad={22} />
          <svg width={accentW + 40} height={70} viewBox={`0 0 ${accentW + 40} 70`}
            style={{ position: "absolute", left: -6, top: size + 8 }}>
            <DrawPath d={`M 0 30 C ${accentW * 0.3} 50, ${accentW * 0.6} 8, ${accentW} 30`}
              delay={eff(4 + lead.length * 5 + 20)} dur={12} len={accentW * 1.15} strokeWidth={8} stroke={HD.accent} />
          </svg>
        </div>
      </div>
    </div>
  );

  // fullFrame = a centered title-card opening (paper bg, centered in the whole 1080×1920);
  // otherwise a transparent block centered in its container (e.g. a HandDrawnFrame panel).
  if (fullFrame) {
    return (
      <AbsoluteFill style={{ background: HD.paper }}>
        <PaperBg mH={height} width={width} />
        {block}
      </AbsoluteFill>
    );
  }
  return block;
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 2 — EvidenceReveal  (the real-life proof)

   The avatar makes a claim → this section SHOWS the real thing: a live-captured
   screenshot (site / app / GitHub repo / pricing / news / logo) framed in a
   browser card with corner "evidence tape", a self-drawing circle on the key
   region, an arrow, and a hand-drawn STAMP carrying the hard data point
   (stars, price, a command, a headline). Real captures only — assets in
   public/refs/ via skill `capture-references`. NO AI generation.

   Props (content only):
     kicker    label ("PROVA REAL", "A SKILL", "OLHA O REPO")
     src       "refs/<Name>.png" (from prepare_reference_shot.py)
     domain    fake URL-bar text ("remotion.dev", "github.com/anthropics")
     focus     {fx, fy} = point on the card to circle (card-local px); default center-low
     focusR    {rx, ry} circle radii (default 130 x 48)
     stamp     the hard data point shown on the red sticker ("50k ★", "1 COMANDO")
     caption   one distilled line under the card (optional)
     fit       "cover" (pages) | "contain" (logos)
   ════════════════════════════════════════════════════════════════════════════ */
export const EvidenceReveal: React.FC<{
  kicker: string;
  src: string;
  domain?: string;
  focus?: { fx: number; fy: number };
  focusR?: { rx: number; ry: number };
  stamp?: string;
  caption?: string;
  fit?: "cover" | "contain";
  // MOTION PROTOCOL (house rule): "scroll" (default) / "zoom" (2nd beat) / "static".
  motion?: "scroll" | "zoom" | "static";
  scroll?: number; zoomTo?: number; durFrames?: number;
}> = ({ kicker, src, domain = "", focus, focusR = { rx: 168, ry: 60 }, stamp, caption, fit = "cover",
        motion = "scroll", scroll = 1000, zoomTo = 2.4, durFrames = 100 }) => {
  const { width, height } = useVideoConfig();
  // FULL-FRAME big card (house rule).
  // SPLIT top-panel card (house rule): the screenshot sits in the
  // UPPER part of the split (avatar below, from the frame); width-bound so the
  // important top-of-page content is fully visible. Rendered as a HandDrawnFrame child.
  const cardW = 1008, cardH = 594;
  const cardLeft = Math.round((width - cardW) / 2);
  const cardTop = 78;
  const f = focus ?? { fx: cardW * 0.5, fy: 46 + (cardH - 46) * 0.4 };
  const stampSnap = useSnapHD(20);
  const stampB = useBounceHD(22);
  const breathe = useBreathe(0.006, 1.4);

  // stamp lives at the card's top-right, rotated like a slapped-on sticker
  const stampScale = interpolate(stampB, [0, 1], [0.6, 1]);
  const stampOpacity = interpolate(stampSnap, [0, 1], [0, 1]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* no own bg — this renders in the HandDrawnFrame top panel (avatar shows below) */}
      {/* kicker */}
      <div style={{ position: "absolute", left: 40, top: 22 }}>
        <HandWord delay={0} size={30} color={HD.paper} weight={700}>
          <span style={{ background: HD.accent, padding: "8px 18px", borderRadius: 5, letterSpacing: "0.16em",
            transform: "rotate(-1.5deg)", display: "inline-block" }}>{kicker}</span>
        </HandWord>
      </div>

      {/* the evidence card (breathing slightly), with corner tape */}
      <div style={{ position: "absolute", left: cardLeft, top: cardTop, transform: `scale(${breathe})`, transformOrigin: "50% 40%" }}>
        {/* tape — two rotated translucent strips pinning the card */}
        <div style={{ position: "absolute", left: 26, top: -16, width: 120, height: 34, background: "rgba(242,183,5,0.55)",
          transform: "rotate(-7deg)", border: "1px solid rgba(27,26,23,0.18)", zIndex: 5 }} />
        <div style={{ position: "absolute", right: 26, top: -16, width: 120, height: 34, background: "rgba(242,183,5,0.55)",
          transform: "rotate(6deg)", border: "1px solid rgba(27,26,23,0.18)", zIndex: 5 }} />
        <ScreenshotCard src={src} domain={domain} delay={4} width={cardW} height={cardH} fit={fit} tilt={-1.2}
          motion={motion} scroll={scroll} zoomTo={zoomTo} durFrames={durFrames}
          focusLocal={{ x: f.fx, y: f.fy - 46 }} />
      </div>

      {/* fixed circle + arrow ONLY in static mode (in scroll/zoom the content moves, so a fixed
          marker would drift off the element — the motion itself is the highlight). */}
      {motion === "static" && (
        <svg width={width} height={cardTop + cardH + 120} viewBox={`0 0 ${width} ${cardTop + cardH + 120}`}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          {(() => {
            const cx = cardLeft + f.fx, cy = cardTop + f.fy, rx = focusR.rx, ry = focusR.ry, k = 0.5523;
            const d = `M ${cx + rx} ${cy}
              C ${cx + rx} ${cy - ry * k}, ${cx + rx * k} ${cy - ry}, ${cx} ${cy - ry}
              C ${cx - rx * k} ${cy - ry}, ${cx - rx} ${cy - ry * k}, ${cx - rx} ${cy}
              C ${cx - rx} ${cy + ry * k}, ${cx - rx * k} ${cy + ry}, ${cx} ${cy + ry}
              C ${cx + rx * k} ${cy + ry}, ${cx + rx} ${cy + ry * k}, ${cx + rx + 10} ${cy - 5}`;
            return <DrawPath d={d} delay={26} dur={16} len={Math.PI * (rx + ry) * 1.25} strokeWidth={8} stroke={HD.accent} />;
          })()}
        </svg>
      )}
      {motion === "static" && (
        <HandArrow x1={cardLeft + cardW - 30} y1={cardTop - 36} x2={cardLeft + f.fx + focusR.rx - 10} y2={cardTop + f.fy - focusR.ry - 8}
          delay={34} w={width} h={cardTop + cardH + 120} />
      )}

      {/* the data STAMP (hard number / proof), slapped on top-right */}
      {stamp && (
        <div style={{ position: "absolute", right: 36, top: cardTop - 40, whiteSpace: "nowrap",
          transform: `scale(${stampScale}) rotate(-9deg)`, opacity: stampOpacity, transformOrigin: "100% 100%", zIndex: 8 }}>
          <div style={{ background: HD.accent, color: HD.paper, fontFamily: HD.font, fontWeight: 700,
            fontSize: 40, lineHeight: 1, padding: "12px 20px", borderRadius: 10, whiteSpace: "nowrap",
            boxShadow: "5px 6px 0 rgba(27,26,23,0.22)", border: "3px solid #1b1a17" }}>{stamp}</div>
        </div>
      )}

      {/* caption-below-the-screenshot REMOVED (house rule). `caption` prop ignored. */}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 3 — FullFrameAvatar  (the breather, after the evidence)

   The avatar pulls back to fill the ENTIRE 1080×1920 frame — no paper, no motion
   graphics, no b-roll. Just the person talking, carried by the normal burned
   subtitles (added in Phase 8 over the whole video). A deliberate pace change that
   lets a key line land after the dense headline + evidence beats.

   HOW IT'S WIRED (important): the hand-drawn frame clips its children to the top
   40%, so a full-frame avatar can't live inside it. Instead this is an OVERLAY —
   a SIBLING <Sequence> placed AFTER <HandDrawnFrame> at the composition root. The
   base HandDrawnFrame keeps the avatar AUDIO playing continuously; this overlay
   shows the full-frame (different crop) of the SAME video, MUTED and time-synced
   via `trimBefore` so the lips match the base audio. During its window it covers
   everything → full-frame avatar. No motion is scheduled in the paper area here.

   NO TEXT — the avatar frame carries ZERO baked text. Subtitles are added later in
   Phase 8 (burned over the whole video); the motion composition never contains them
   (house rule). The ONLY text on this frame is the Phase-8 subtitle.

   ZOOM-PUNCH (house rule): every avatar-only beat opens full-frame
   then does a FAST zoom-in (~0.3s) to a tighter, more intimate framing and HOLDS
   there — a deliberate energy bump that re-grabs attention on the breather. Toward
   the face (origin 50%/38%). Disable with `zoom={false}` if ever needed.

   Props:
     avatarSrc          the same avatar file as HandDrawnFrame
     trimBeforeFrames   = the wrapping <Sequence>'s `from` (keeps it synced to audio)
     zoom               fast punch-in on entry (default true)
     zoomTo             held scale after the punch (default 1.16)
   ════════════════════════════════════════════════════════════════════════════ */
export const FullFrameAvatar: React.FC<{
  avatarSrc: string;
  trimBeforeFrames: number;
  zoom?: boolean;
  zoomTo?: number;
  direction?: "in" | "out";   // "in" = full→zoomed (default); "out" = zoomed→full
}> = ({ avatarSrc, trimBeforeFrames, zoom = true, zoomTo = 1.16, direction = "in" }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  // fast punch over frames 2→9 (~0.28s @25fps), easeOutCubic, then HOLD.
  // "in": 1.0 → zoomTo (punch in). "out": zoomTo → 1.0 (pull back to full frame).
  const t = interpolate(frame, [2, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = 1 - Math.pow(1 - t, 3);
  const from = direction === "out" ? zoomTo : 1;
  const to = direction === "out" ? 1 : zoomTo;
  const scale = zoom ? interpolate(eased, [0, 1], [from, to]) : 1;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(avatarSrc)}
        muted
        trimBefore={trimBeforeFrames}
        style={{ width, height, objectFit: "cover", transform: `scale(${scale})`, transformOrigin: "50% 38%" }}
      />
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION (frame mode) — BrollGraphicFrame  (full-frame b-roll, graphic elements only)

   A real stock b-roll clip fills the WHOLE frame, with ONLY graphic elements on top
   (a kicker, ONE big marker word, a sub-line, self-drawing annotation) — NO avatar.
   The narration audio keeps playing from the base HandDrawnFrame (voiceover over the
   b-roll). A dark scrim keeps the text legible on busy footage. Overlay sibling.

   Props:
     src     b-roll mp4 in public/ (stock clip from select_stock_brolls.py)
     kicker  small label chip (optional)
     bigWord the ONE graphic headline word/phrase (accent)
     sub     a small distilled line under it (optional)
     scrim   0..1 darken amount (default 0.42)
   ════════════════════════════════════════════════════════════════════════════ */
export const BrollGraphicFrame: React.FC<{
  src: string; kicker?: string; bigWord: string; sub?: string; scrim?: number;
}> = ({ src, kicker, bigWord, sub, scrim = 0.42 }) => {
  const { width, height } = useVideoConfig();
  const bw = estW(bigWord, 104);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(src)} muted style={{ width, height, objectFit: "cover" }} />
      <AbsoluteFill style={{ background:
        `linear-gradient(180deg, rgba(15,16,22,${scrim * 0.85}) 0%, rgba(15,16,22,${scrim * 0.15}) 38%, rgba(15,16,22,${scrim}) 100%)` }} />
      <div style={{ position: "absolute", inset: 0, paddingTop: 150, paddingLeft: 110, paddingRight: 60 }}>
        {kicker && (
          <div style={{ marginBottom: 24 }}>
            <HandWord delay={0} size={30} color={HD.paper} weight={700}>
              <span style={{ background: HD.accent, padding: "8px 18px", borderRadius: 5, letterSpacing: "0.16em",
                transform: "rotate(-1.5deg)", display: "inline-block" }}>{kicker}</span>
            </HandWord>
          </div>
        )}
        <div style={{ position: "relative", display: "inline-block" }}>
          <MarkerHighlight delay={12} width={bw} height={40} />
          <HandWord delay={4} size={104} color={HD.paper} bounce>{bigWord}</HandWord>
          <CircleAround w={bw} h={112} delay={16} pad={24} />
        </div>
        {sub && (
          <div style={{ marginTop: 40 }}>
            <HandWord delay={22} size={48} color={HD.paper} weight={600}>{sub}</HandWord>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION (frame mode) — FullMotionFrame  (full-frame motion: text + graphic elements)

   The hand-drawn motion area expands to the WHOLE 1080×1920 frame — NO avatar, NO
   b-roll. Pure motion: a kicker, an animated headline, a FlowDiagram built node-by-
   node, a count-up stat, self-drawing annotations. The narration audio keeps playing
   from the base HandDrawnFrame. Overlay sibling. The richest graphic moment.

   Props:
     kicker   small label chip (optional)
     lines    headline lines [{text, accent?}] (one accent line)
     steps    optional FlowDiagram steps (3 line-icon nodes)
     stat     optional {to, suffix} count-up
     tail     optional closing accent line
   ════════════════════════════════════════════════════════════════════════════ */
export const FullMotionFrame: React.FC<{
  kicker?: string;
  lines: { text: string; accent?: boolean }[];
  steps?: FlowStep[];
  stat?: { to: number; suffix?: string };
  tail?: string;
}> = ({ kicker, lines, steps, stat, tail }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: HD.paper }}>
      <PaperBg mH={height} width={width} />
      {/* symmetric safe margin (house rule) */}
      <div style={{ position: "absolute", inset: 0, paddingTop: 140, paddingLeft: 110, paddingRight: 110, paddingBottom: 96, boxSizing: "border-box" }}>
        {kicker && (
          <div style={{ marginBottom: 22 }}>
            <HandWord delay={0} size={32} color={HD.paper} weight={700}>
              <span style={{ background: HD.accent, padding: "8px 18px", borderRadius: 5, letterSpacing: "0.16em",
                transform: "rotate(-1.5deg)", display: "inline-block" }}>{kicker}</span>
            </HandWord>
          </div>
        )}
        {lines.map((ln, i) => (
          <div key={i} style={{ marginBottom: 8, position: "relative", display: "block" }}>
            {ln.accent ? (
              <span style={{ position: "relative", display: "inline-block" }}>
                <MarkerHighlight delay={6 + i * 5 + 8} width={estW(ln.text, 92)} height={36} />
                <HandWord delay={6 + i * 5} size={92} color={HD.accent} bounce>{ln.text}</HandWord>
                <HandUnderline width={estW(ln.text, 92)} delay={6 + i * 5 + 14} top={96} />
              </span>
            ) : (
              <HandWord delay={6 + i * 5} size={72}>{ln.text}</HandWord>
            )}
          </div>
        ))}
        {steps && (
          <div style={{ position: "relative", marginTop: 110, height: 210 }}>
            {/* resolve HD_ICONS KEYS ("doc") → paths, but pass real paths through
                unchanged (?? fallback) so both calling styles work. */}
            <FlowDiagram delay={28} width={width - 240} top={0}
              steps={steps.map((s) => ({ ...s, icon: (HD_ICONS as Record<string, string>)[s.icon] ?? s.icon }))} />
          </div>
        )}
        {stat && (
          <div style={{ marginTop: steps ? 24 : 64 }}>
            <StatCountUp delay={36} to={stat.to} suffix={stat.suffix ?? ""} />
          </div>
        )}
        {tail && (
          <div style={{ marginTop: stat ? 80 : 64, position: "relative", display: "inline-block" }}>
            <MarkerHighlight delay={48} width={estW(tail, 64)} height={30} />
            <HandWord delay={42} size={64} color={HD.accent} bounce>{tail}</HandWord>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION (frame mode) — BrollFrame  (full-frame b-roll ONLY, no motion)

   Just a relevant stock b-roll clip filling the whole frame, carried by the normal
   Phase-8 subtitles. NO motion graphics, NO avatar. The clip MUST be chosen for
   relevance to the line being spoken. (The richer "b-roll + motion graphics" look is
   `BrollGraphicFrame`, a separate/later mode.)

   NO TEXT — b-roll only. The ONLY text on this frame is the Phase-8 burned subtitle
   (added later over the whole video); the motion comp never bakes any text here.

   Props:
     src    b-roll mp4 in public/ (relevant stock clip)
     scrim  0..1 bottom darken so the later Phase-8 subtitle stays legible (default 0.3)
   ════════════════════════════════════════════════════════════════════════════ */
export const BrollFrame: React.FC<{ src: string; scrim?: number }> = ({ src, scrim = 0.3 }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(src)} muted style={{ width, height, objectFit: "cover" }} />
      {scrim > 0 && (
        <AbsoluteFill style={{ background:
          `linear-gradient(180deg, transparent 0%, transparent 64%, rgba(0,0,0,${scrim}) 100%)` }} />
      )}
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION (frame mode) — AvatarMotionFrame  (full-frame avatar + motion graphics)

   The avatar fills the WHOLE frame (full bleed) and motion graphics float in the
   HEADROOM above the head — a kicker chip + ONE marker word + a self-drawing circle.
   Distinct from the SPLIT mode (paper panel top + avatar bottom). The narration
   audio comes from the base HandDrawnFrame; this overlay is muted + trimBefore-synced.

   The floating kicker + word ARE legit motion graphics (they belong here). There is
   NO baked subtitle text — subtitles are added later in the Phase-8 burn.

   Props:
     avatarSrc, trimBeforeFrames   (= the wrapping Sequence's `from`, keeps lips synced)
     kicker         small label chip (optional)
     word           the ONE floating marker word
   ════════════════════════════════════════════════════════════════════════════ */
export const AvatarMotionFrame: React.FC<{
  avatarSrc: string; trimBeforeFrames: number; kicker?: string; word: string;
}> = ({ avatarSrc, trimBeforeFrames, kicker, word }) => {
  const { width, height } = useVideoConfig();
  const ww = estW(word, 96);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(avatarSrc)} muted trimBefore={trimBeforeFrames}
        style={{ width, height, objectFit: "cover" }} />
      {/* legibility scrim: darken the top headroom + a touch at the very bottom */}
      <AbsoluteFill style={{ background:
        "linear-gradient(180deg, rgba(15,16,22,0.62) 0%, rgba(15,16,22,0.16) 20%, transparent 34%, transparent 80%, rgba(0,0,0,0.34) 100%)" }} />
      {/* motion graphics float in the headroom ABOVE the head (top ~14%) — symmetric
          safe margin (house rule) */}
      <div style={{ position: "absolute", top: 70, left: 100, right: 100 }}>
        {kicker && (
          <div style={{ marginBottom: 16 }}>
            <HandWord delay={0} size={30} color={HD.paper} weight={700}>
              <span style={{ background: HD.accent, padding: "8px 18px", borderRadius: 5, letterSpacing: "0.16em",
                transform: "rotate(-1.5deg)", display: "inline-block" }}>{kicker}</span>
            </HandWord>
          </div>
        )}
        <div style={{ position: "relative", display: "inline-block" }}>
          <MarkerHighlight delay={12} width={ww} height={38} />
          <HandWord delay={4} size={96} color={HD.paper} bounce>{word}</HandWord>
          <CircleAround w={ww} h={104} delay={16} pad={22} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   GRAPHICS-ONLY VOCABULARY (NO WORDS) — building blocks for Sections 5 & 6.

   The owner's grammar adds two TEXT-FREE motion modes: a split panel
   (avatar below, graphics above) and a full-frame graphic. These carry meaning
   through ICON + MOTION alone — line-icon badges, self-drawing connectors, and
   looping pulse rings. They render ZERO words: the only on-screen text in the
   whole video is the Phase-8 burned subtitle. Keeps the hand-drawn brand
   (paper + ink + ONE marker-red accent), NO emoji (HD_ICONS line icons only).
   ════════════════════════════════════════════════════════════════════════════ */

// A rounded icon badge = a FlowNode box WITHOUT its label (line icon only).
// After the snap entrance it keeps a gentle continuous FLOAT (per-badge phase from
// `delay`) so the diagram never freezes — restraint-level life, not bounce.
export const IconBadge: React.FC<{
  x: number; y: number; icon: string; delay?: number; size?: number; accent?: boolean;
}> = ({ x, y, icon, delay = 0, size = 140, accent = false }) => {
  const snap = useSnapHD(delay);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const col = accent ? HD.accent : HD.ink;
  const iconSize = Math.round(size * 0.46);
  // gentle bob: ±4px, ~0.5Hz, phased off the entrance delay so badges drift out of sync
  const floatY = frame > delay ? Math.sin((frame / fps) * Math.PI + delay * 0.6) * 4 : 0;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2 + floatY, width: size, height: size,
      transform: `scale(${interpolate(snap, [0, 1], [0.6, 1])}) rotate(-1.2deg)`, opacity: interpolate(snap, [0, 1], [0, 1]),
      borderRadius: size * 0.16, background: "#ffffff", border: `5px solid ${col}`,
      display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "5px 6px 0 rgba(27,26,23,0.18)" }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
    </div>
  );
};

// Flow dots travelling along a straight A→B segment on a loop — the "data is
// moving through the system" signature. Dots fade in/out at the ends. Starts only
// AFTER the connector has drawn (`delay`). Deterministic (frame-driven).
export const FlowDots: React.FC<{
  x1: number; y1: number; x2: number; y2: number; delay?: number; count?: number; period?: number; stroke?: string; r?: number;
}> = ({ x1, y1, x2, y2, delay = 0, count = 3, period = 1.4, stroke = HD.accent, r = 7 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const local = frame - delay;
  if (local <= 0) return null;
  const base = (local / fps) / period;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const t = (base + i / count) % 1;
        const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
        const fade = Math.sin(Math.PI * t); // 0 at ends, 1 mid-path
        return <circle key={i} cx={x} cy={y} r={r} fill={stroke} opacity={0.85 * fade} />;
      })}
    </svg>
  );
};

// A concentric pulse ring that scales out + fades on a deterministic loop.
export const PulseRing: React.FC<{
  cx: number; cy: number; r?: number; delay?: number; stroke?: string; period?: number; phase?: number;
}> = ({ cx, cy, r = 120, delay = 0, stroke = HD.accent, period = 1.6, phase = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const local = Math.max(0, frame - delay);
  const tt = ((local / fps) / period + phase) % 1;
  const scale = 0.5 + tt * 1.05;
  const opacity = (1 - tt) * 0.5 * (frame > delay ? 1 : 0);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <circle cx={cx} cy={cy} r={r * scale} fill="none" stroke={stroke} strokeWidth={5} opacity={opacity} />
    </svg>
  );
};

type IconKey = keyof typeof HD_ICONS;

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 5 — SplitGraphicMotion  (split screen: motion ABOVE, avatar BELOW; NO text)

   A CHILD of <HandDrawnFrame> (renders in the top-40% paper panel; the avatar shows
   in the bottom 60% from the frame itself). The panel holds ONLY graphic visual
   elements — a row of line-icon badges wired by self-drawing arrows, pulse rings on
   the accent node, a draw-on circle. NO words. The narration audio plays from the
   base HandDrawnFrame; subtitles are burned later in Phase 8 (house rule).

   Props (content only): which icons to wire (defaults are a sensible 3-step flow).
   ════════════════════════════════════════════════════════════════════════════ */
export const SplitGraphicMotion: React.FC<{
  icons?: IconKey[];
  accentIndex?: number;
}> = ({ icons = ["doc", "gear", "rocket"], accentIndex }) => {
  const { width } = useVideoConfig();
  const panelH = 768;                 // top 40% of 1920
  const cy = Math.round(panelH * 0.52);
  const n = icons.length;
  const acc = accentIndex ?? n - 1;
  const spread = 300;
  const cx = width / 2;
  const xs = icons.map((_, i) => cx + (i - (n - 1) / 2) * spread);
  return (
    <AbsoluteFill>
      {/* pulse rings behind the accent node */}
      <PulseRing cx={xs[acc]} cy={cy} r={108} delay={6} period={1.7} />
      <PulseRing cx={xs[acc]} cy={cy} r={108} delay={6} period={1.7} phase={0.5} />
      {/* self-drawing connectors + arrowheads between badges */}
      <svg width={width} height={panelH} viewBox={`0 0 ${width} ${panelH}`} style={{ position: "absolute", inset: 0 }}>
        {xs.slice(0, -1).map((x, i) => (
          <React.Fragment key={i}>
            <DrawPath d={`M ${x + 78} ${cy} L ${xs[i + 1] - 78} ${cy}`} delay={10 + i * 6} dur={6} len={spread} strokeWidth={6} stroke={HD.ink} />
            <DrawPath d={`M ${xs[i + 1] - 78} ${cy} L ${xs[i + 1] - 98} ${cy - 12} M ${xs[i + 1] - 78} ${cy} L ${xs[i + 1] - 98} ${cy + 12}`} delay={14 + i * 6} dur={4} len={48} strokeWidth={6} stroke={HD.ink} />
          </React.Fragment>
        ))}
      </svg>
      {/* flow dots travelling along each connector (system "working") */}
      {xs.slice(0, -1).map((x, i) => (
        <FlowDots key={i} x1={x + 78} y1={cy} x2={xs[i + 1] - 78} y2={cy} delay={20 + i * 6} count={2} period={1.3} />
      ))}
      {/* icon badges (NO labels) */}
      {icons.map((ic, i) => (
        <IconBadge key={i} x={xs[i]} y={cy} icon={HD_ICONS[ic]} delay={4 + i * 6} accent={i === acc} size={140} />
      ))}
      {/* draw-on circle accent on the accent node */}
      <div style={{ position: "absolute", left: xs[acc] - 78, top: cy - 78, width: 156, height: 156 }}>
        <CircleAround w={156} h={156} delay={24} pad={10} />
      </div>
    </AbsoluteFill>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION 6 — FullGraphicFrame  (FULLSCREEN motion, graphics/icons only; NO text, NO avatar)

   A full-frame OVERLAY sibling (placed AFTER <HandDrawnFrame>). The whole 1080×1920
   becomes a hand-drawn "system diagram": a big accent CORE icon with concentric pulse
   rings, satellite line-icon badges arranged in a ring and wired to the core by
   self-drawing connectors, and a draw-on circle on the core. ZERO words — pure graphic
   storytelling. Narration audio continues from the base HandDrawnFrame; Phase-8
   subtitles burn over the top later (house rule).

   Props (content only): the core icon + the satellite icons.
   ════════════════════════════════════════════════════════════════════════════ */
export const FullGraphicFrame: React.FC<{
  center?: IconKey;
  satellites?: IconKey[];
}> = ({ center = "bolt", satellites = ["doc", "gear", "rocket", "check"] }) => {
  const { width, height } = useVideoConfig();
  const cx = width / 2, cy = Math.round(height * 0.42);
  const R = 360;
  const n = satellites.length;
  const pts = satellites.map((_, i) => {
    const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang), ang };
  });
  return (
    <AbsoluteFill style={{ background: HD.paper }}>
      <PaperBg mH={height} width={width} />
      {/* concentric pulse rings radiating from the core */}
      <PulseRing cx={cx} cy={cy} r={170} delay={4} period={2.0} />
      <PulseRing cx={cx} cy={cy} r={170} delay={4} period={2.0} phase={0.33} />
      <PulseRing cx={cx} cy={cy} r={170} delay={4} period={2.0} phase={0.66} />
      {/* self-drawing connectors core → satellites */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        {pts.map((p, i) => {
          const sx = cx + 96 * Math.cos(p.ang), sy = cy + 96 * Math.sin(p.ang);
          const ex = p.x - 86 * Math.cos(p.ang), ey = p.y - 86 * Math.sin(p.ang);
          return <DrawPath key={i} d={`M ${sx} ${sy} L ${ex} ${ey}`} delay={12 + i * 5} dur={7} len={R} strokeWidth={6} stroke={HD.ink} />;
        })}
      </svg>
      {/* flow dots pulsing OUT from the core along each spoke (energy radiating) */}
      {pts.map((p, i) => {
        const sx = cx + 96 * Math.cos(p.ang), sy = cy + 96 * Math.sin(p.ang);
        const ex = p.x - 86 * Math.cos(p.ang), ey = p.y - 86 * Math.sin(p.ang);
        return <FlowDots key={i} x1={sx} y1={sy} x2={ex} y2={ey} delay={24 + i * 5} count={2} period={1.5} />;
      })}
      {/* satellite badges */}
      {pts.map((p, i) => (
        <IconBadge key={i} x={p.x} y={p.y} icon={HD_ICONS[satellites[i]]} delay={16 + i * 5} size={150} />
      ))}
      {/* the CORE icon (accent) + draw-on circle */}
      <IconBadge x={cx} y={cy} icon={HD_ICONS[center]} delay={6} size={200} accent />
      <div style={{ position: "absolute", left: cx - 112, top: cy - 112, width: 224, height: 224 }}>
        <CircleAround w={224} h={224} delay={28} pad={12} />
      </div>
    </AbsoluteFill>
  );
};
