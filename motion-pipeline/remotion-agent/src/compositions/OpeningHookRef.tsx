import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useVideoConfig, useCurrentFrame, spring, interpolate } from "remotion";
import { PremiumTheme, PremiumFrame, PremiumEvidence, PremiumBg, SERIF, sectionWindows } from "../library";

const AVATAR = "sample_avatar.mp4";

/* PillHeadline — viral black rounded-pill banner, heavy ALL-CAPS sans (yellow or white),
   modeled on viral short-form reference templates. Pops in with a snap-settle,
   centered horizontally, placed at a configurable vertical center (cy). One word can be accented. */
type Seg = { t: string; accent?: boolean };
const PillHeadline: React.FC<{
  lines: Seg[][]; cy: number; textColor: string; accentColor?: string;
  size?: number; delay?: number; pill?: string;
}> = ({ lines, cy, textColor, accentColor = "#F2E63B", size = 74, delay = 6, pill = "#0b0b0b" }) => {
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
        <div style={{
          background: pill, borderRadius: 32, padding: "20px 44px",
          boxShadow: "0 14px 40px rgba(0,0,0,0.55)", textAlign: "center",
        }}>
          {lines.map((ln, i) => (
            <div key={i} style={{
              fontFamily: SERIF, fontWeight: 800, fontSize: size, lineHeight: 1.02,
              letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap",
              color: textColor, display: "block",
            }}>
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

type V = {
  src: string; domain: string; stamp: string; kicker: string;
  motion: "zoom" | "static"; focus: { fx: number; fy: number }; focusR: { rx: number; ry: number };
  lines: Seg[][]; textColor: string; accentColor?: string; cy: number; size?: number;
};

const PROOF = { src: "refs/sample_page.png", domain: "example.com", stamp: "$500",
  focus: { fx: 428, fy: 191 }, focusR: { rx: 294, ry: 53 } };
const GUI = { src: "refs/sample_pricing.png", domain: "example.com/pricing", stamp: "Plano Pro",
  focus: { fx: 528, fy: 399 }, focusR: { rx: 278, ry: 51 } };

export const VARIANTS: Record<string, V> = {
  // V1 — YELLOW pill, proof screenshot zoom, banner on the split line
  V1: { ...PROOF, kicker: "É real", motion: "zoom", cy: 792, textColor: "#F2E63B",
    lines: [[{ t: "IA DO GOOGLE" }], [{ t: "EXIGIU US$500" }]] },
  // V2 — WHITE pill, proof zoom, banner on the split line
  V2: { ...PROOF, kicker: "É real", motion: "zoom", cy: 792, textColor: "#FFFFFF",
    lines: [[{ t: "UMA IA PEDIU" }], [{ t: "500 DÓLARES" }]] },
  // V3 — WHITE pill + YELLOW accent on the number, proof zoom, split line
  V3: { ...PROOF, kicker: "É real", motion: "zoom", cy: 792, textColor: "#FFFFFF", accentColor: "#F2E63B",
    lines: [[{ t: "UMA IA EXIGIU" }], [{ t: "US$500", accent: true }]] },
  // V4 — YELLOW pill, proof zoom, banner HIGHER (over the screenshot)
  V4: { ...PROOF, kicker: "É real", motion: "zoom", cy: 470, textColor: "#F2E63B", size: 70,
    lines: [[{ t: "IA DO GOOGLE" }], [{ t: "COBROU US$500" }]] },
  // V5 — YELLOW pill, GEMINI UI zoom, banner just below the split line
  V5: { ...GUI, kicker: "O modelo", motion: "zoom", cy: 812, textColor: "#F2E63B", size: 70,
    lines: [[{ t: "GEMINI TRAVOU" }], [{ t: "E COBROU US$500" }]] },
};

export const OpeningHookRef: React.FC<{ variant?: string }> = ({ variant = "V1" }) => {
  const { fps } = useVideoConfig();
  const v = VARIANTS[variant] || VARIANTS.V1;
  const W = sectionWindows(fps, [0, 4.616]);
  return (
    <PremiumTheme palette="charcoal-gold">
      <AbsoluteFill style={{ background: "#000" }}>
        <PremiumBg frame={false} />
        <Audio src={staticFile(AVATAR)} />
        {/* split: moving screenshot in the top panel + avatar below */}
        <Sequence {...W[0]}>
          <PremiumFrame avatarSrc={AVATAR} muted trimBefore={W[0].from}>
            <PremiumEvidence kicker={v.kicker} src={v.src} domain={v.domain}
              motion={v.motion} zoomTo={1.5} durFrames={W[0].durationInFrames}
              focus={v.focus} focusR={v.focusR} stamp={v.stamp} />
          </PremiumFrame>
        </Sequence>
        {/* headline pill inserted at the center / split line */}
        <Sequence {...W[0]}>
          <PillHeadline lines={v.lines} cy={v.cy} textColor={v.textColor}
            accentColor={v.accentColor} size={v.size} />
        </Sequence>
      </AbsoluteFill>
    </PremiumTheme>
  );
};
