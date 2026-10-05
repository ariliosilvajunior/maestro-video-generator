import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useVideoConfig } from "remotion";
import {
  PremiumTheme, PremiumBg, PremiumLabel, PremiumAsset, FullFrameAvatar,
  PremiumKineticCaption, PremiumOpeningHook, PremiumSplitGraphics, PremiumFullGraphics,
  PremiumAvatarCaption,
  sectionWindows, assertSectionGrammar,
} from "../library";

/* ════════════════════════════════════════════════════════════════════════════
   PremiumSectionRef — THE CANONICAL PREMIUM-CLASSIC REFERENCE (QCR-147).
   COPY THIS COMP'S WIRING to build a real premium video, then swap the per-section
   content (script copy, palette, assets, ref screenshot). It is intentionally the
   "factory default" so the correct structure is inherited automatically:

     • it calls `assertSectionGrammar([...ids])` at the top — the render HARD-FAILS
       if the build collapses into the caption↔hero ping-pong or skips §5/§6;
     • it includes §5 `PremiumSplitGraphics` (avatar below + graphics-only above) and
       §6 `PremiumFullGraphics` (fullscreen graphics-only) — the sections that used to
       silently vanish;
     • the section ids are tagged HONESTLY by TYPE: opening: / avatar: / caption: /
       heroAsset: / split: / full: / evidence:  (NEVER tag a §6 as heroAsset:).

   Section grammar (§5b sits between §5 and §6):
   §1 hook → §3 avatar → §3b caption → §4 hero → §5 split → §5b avatar+floating-caption → §6 full,
   then repeat the WHOLE body cycle §3→§3b→§4→§5→§5b→§6 (sections 3 THROUGH 6 — every cycle
   restarts at the §3 avatar breather and ends at §6 full-graphics; "§3→§6" = 3 through 6, NOT a jump).
   §5b = the avatar in its ORIGINAL full frame with BIG Proxima word-by-word
   subtitles popping in the EMPTY part of the frame (pass `zone` after LOOKING at the avatar).
   A new screen every ~2.5s.
   ════════════════════════════════════════════════════════════════════════════ */

const AVATAR = "sample_avatar.mp4"; // SWAP: your video's avatar mp4 in public/ (e.g. "<Name>.mp4")

// §4 full-frame hero scene: serif label + one drifting keyed asset (DARK palette → add a Glow).
const HeroScene: React.FC<{ label?: string; src: string; size?: number; cy?: number; driftPhase?: number }> = ({
  label, src, size = 460, cy = 980, driftPhase = 0.6,
}) => (
  <AbsoluteFill>
    <PremiumBg />
    {label && <PremiumLabel top={150} size={42}>{label}</PremiumLabel>}
    <PremiumAsset src={src} size={size} cx={540} cy={cy} delay={6} driftPhase={driftPhase} />
  </AbsoluteFill>
);

export const PremiumSectionRef: React.FC = () => {
  const { fps } = useVideoConfig();
  const A = (n: string) => `assets/sample/${n}_cut.png`; // SWAP: `assets/<Name>/${n}_cut.png` — your run's freshly generated cutouts

  // ORDERED SECTION IDS — tag each beat by its TYPE. assertSectionGrammar THROWS if:
  // adjacent same-type (except heroAsset), a ≥12-beat video has no split:/full:, or 4+
  // consecutive caption/heroAsset (the ping-pong). Keep the cycle §3→§3b→§4→§5→§5b→§6.
  assertSectionGrammar([
    "opening:hook", "avatar:in1", "caption:one", "heroAsset:robot", "split:flow", "avatarcap:explain", "full:system",
    "avatar:in2", "caption:two", "heroAsset:coin", "split:grid", "avatarcap:recap", "full:orbit", "caption:cta",
  ]);

  // GAP-FREE windows — boundary times snapped to SRT sentences.
  // §5b (avatarcap) beats get ~3.5s so the word-by-word reveal has room to land.
  const W = sectionWindows(fps, [
    0, 3.0, 5.0, 7.0, 9.0, 11.0, 14.5, 16.5, 18.5, 20.5, 22.5, 24.5, 28.0, 30.0, 33.0,
  ]);

  // PHASE-8 SUBTITLE SUPPRESSION (QCR-109/QCR-147): the §3b kinetic-caption AND §5b avatar-
  // floating-caption beats show the line BIG as the caption, so DROP the burned bottom subtitle
  // in those windows. Write these [start,end] seconds to ~/Downloads/<Name>_caption_windows.json
  // and run subtitle-pipeline/suppress_windows.py before the Phase-8 burn:
  //   §3b → W[2] 5.0–7.0, W[8] 18.5–20.5, W[13] 30.0–33.0
  //   §5b → W[5] 11.0–14.5, W[11] 24.5–28.0
  // i.e. caption_windows.json = [[5,7],[11,14.5],[18.5,20.5],[24.5,28],[30,33]]
  //
  // WORD-SYNC (MANDATORY, QCR-192): every §3b `reveal` and §5b `PremiumAvatarCaption` below MUST
  // pass an explicit `timings={[…]}` (per-word seconds from the window start) so the reveal lands
  // on the spoken word — WITHOUT it the words even-spread and drift ±1-2s. Do NOT hand-type them:
  //   1. Phase 3 emits ~/Downloads/<Name>_word_timings.json (whisper word alignment).
  //   2. Snap the sectionWindows([...]) boundaries to REAL phrase starts from that file.
  //   3. python3 subtitle-pipeline/caption_sync.py derive --words <Name>_word_timings.json \
  //        --boundaries "<your boundary csv>" --caption-indices "2,5,8,11,13"   → prints text+timings.
  // The caption-sync gate (caption_sync.py check) BLOCKS a timings-less/paraphrased/drifting build.

  return (
    <PremiumTheme palette="charcoal-gold">
      <AbsoluteFill style={{ background: "#000" }}>
        <PremiumBg frame={false} />     {/* themed FLOOR (a gap reveals this, never the avatar) */}
        <Audio src={staticFile(AVATAR)} /> {/* single continuous narration */}

        {/* §1 OPENING HOOK — moving screenshot split + black-pill headline */}
        <PremiumOpeningHook
          w={W[0]} avatarSrc={AVATAR}
          evidence={{ src: "refs/sample_page.png", domain: "example.com", stamp: "REAL",
            kicker: "É real", motion: "scroll", scroll: 1200 }}
          headline={{ lines: [[{ t: "TROQUE PELA" }], [{ t: "MANCHETE", accent: true }]],
            cy: 792, textColor: "#FFFFFF", accentColor: "#F2E63B", size: 60 }}
        />

        {/* §3 avatar */}
        <Sequence {...W[1]}><FullFrameAvatar avatarSrc={AVATAR} trimBeforeFrames={W[1].from} direction="in" /></Sequence>
        {/* §3b kinetic caption — DEFAULT = `reveal` (the EXACT spoken line, word-by-word, active
            word gold) on the single palette-color bg. Suppress its burned subtitle in Phase 8.
            (Use `groups={[...]}` ONLY for a very short punch like a CTA — NOT for normal §3b beats.) */}
        <Sequence {...W[2]}><PremiumKineticCaption reveal text="A frase inteira aparece palavra por palavra"
          timings={[0, 0.3, 0.7, 1.0, 1.4, 1.8]}  /* QCR-192: per-word secs from window start — from caption_sync.py derive */
          durFrames={W[2].durationInFrames} /></Sequence>
        {/* §4 motion + text (one labeled hero asset) */}
        <Sequence {...W[3]}><HeroScene label="LEGENDA CURTA" src={A("robot")} size={460} cy={980} /></Sequence>
        {/* §5 SPLIT GRAPHICS — avatar below + graphics-only above, NO text */}
        <PremiumSplitGraphics w={W[4]} avatarSrc={AVATAR} assets={[A("robot"), A("coin"), A("clock")]} />
        {/* §5b AVATAR + FLOATING CAPTION — full-frame avatar, BIG word-by-word Proxima subtitles
            in the EMPTY zone (this avatar's free space = TOP, above the head). */}
        <Sequence {...W[5]}><PremiumAvatarCaption w={W[5]} avatarSrc={AVATAR} zone="top"
          text="A legenda aparece palavra por palavra no espaço livre da tela"
          timings={[0, 0.4, 0.8, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0, 3.3]} /* QCR-192: from caption_sync.py derive */ /></Sequence>
        {/* §6 FULL GRAPHICS — fullscreen system diagram, NO text, NO avatar */}
        <Sequence {...W[6]}><PremiumFullGraphics assets={[A("robot"), A("coin"), A("clock"), A("lock")]} /></Sequence>

        {/* repeat the WHOLE body cycle §3 → §3b → §4 → §5 → §5b → §6 (sections 3 through 6) */}
        <Sequence {...W[7]}><FullFrameAvatar avatarSrc={AVATAR} trimBeforeFrames={W[7].from} direction="out" /></Sequence>
        <Sequence {...W[8]}><PremiumKineticCaption reveal text="Aqui a frase exata aparece palavra por palavra"
          timings={[0, 0.3, 0.6, 1.0, 1.3, 1.6, 1.9]} durFrames={W[8].durationInFrames} /></Sequence>
        <Sequence {...W[9]}><HeroScene label="OUTRA LEGENDA" src={A("coin")} size={460} cy={980} /></Sequence>
        <PremiumSplitGraphics w={W[10]} avatarSrc={AVATAR} assets={[A("coin"), A("lock"), A("clock")]} />
        {/* §5b again — same avatar, captions in the TOP free zone */}
        <Sequence {...W[11]}><PremiumAvatarCaption w={W[11]} avatarSrc={AVATAR} zone="top"
          text="E aqui o segundo ciclo mostra a mesma estrutura nova"
          timings={[0, 0.35, 0.7, 1.05, 1.4, 1.75, 2.1, 2.45, 2.8]} /></Sequence>
        <Sequence {...W[12]}><PremiumFullGraphics assets={[A("clock"), A("robot"), A("coin")]} /></Sequence>
        {/* §3b CTA */}
        <Sequence {...W[13]}><PremiumKineticCaption groups={["SALVA", "O VÍDEO"]} durFrames={W[13].durationInFrames} accent /></Sequence>
      </AbsoluteFill>
    </PremiumTheme>
  );
};
