import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useVideoConfig, useCurrentFrame } from "remotion";
import {
  PremiumTheme, PremiumBg, PremiumLabel, PremiumAsset, PremiumEvidence, PremiumFrame,
  PremiumKineticCaption, PremiumOpeningHook, PremiumSplitGraphics,
  PremiumSplitFlow, PremiumFullGraphics, usePremPalette, SERIF,
  sectionWindows, assertSectionGrammar,
} from "../library";

/* FramedWordReveal — §5b (avatarcap), WINDOWED instead of full-bleed (06/10/2026 fix).
   This avatar's HeyGen "look" is landscape-trained (1280x720) and was force-cropped to
   9:16 at generation time — the body already spans edge-to-edge in the native file at
   gesture-reaching heights (0px margin confirmed by a frame-by-frame scan of the whole
   clip), so a FULL-BLEED avatar display (PremiumAvatarCaption) unavoidably reads as
   asymmetric/cropped (one shoulder flush to the edge, the other with margin — exactly
   what the owner caught). The bottom-60%-panel PremiumFrame treatment used everywhere
   ELSE in this video does NOT have this problem (it shows the native width 1:1, no extra
   zoom/crop), so §5b here reuses that same windowed treatment instead of full-bleed —
   avatar in the bottom panel, the big word-by-word reveal in the top panel (same spoken-
   line-verbatim contract as PremiumAvatarCaption, suppress the burned subtitle the same
   way) — structurally avoids the full-bleed edge-touching look without touching the
   shared library (keeps the blast radius to this one video). */
const FramedWordReveal: React.FC<{
  w: { from: number; durationInFrames: number };
  avatarSrc: string;
  text: string;
  timings?: number[];
  size?: number;
}> = ({ w, avatarSrc, text, timings, size = 46 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence {...w}>
      <PremiumFrame avatarSrc={avatarSrc} muted trimBefore={w.from} inset>
        <FramedWordRevealInner text={text} timings={timings} durFrames={w.durationInFrames} fps={fps} size={size} />
      </PremiumFrame>
    </Sequence>
  );
};
const FramedWordRevealInner: React.FC<{ text: string; timings?: number[]; durFrames: number; fps: number; size: number }> = ({
  text, timings, durFrames, fps, size,
}) => {
  const P = usePremPalette();
  const frame = useCurrentFrame();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const nw = Math.max(1, words.length);
  const startFr = (i: number) => (timings && timings[i] != null ? timings[i] * fps : (i * durFrames) / nw);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 80px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "center",
        columnGap: "0.26em", rowGap: "0.08em", maxWidth: "100%",
        fontFamily: SERIF, fontWeight: 800, fontSize: size, textTransform: "uppercase",
        textAlign: "center", lineHeight: 1.14, letterSpacing: "0.005em" }}>
        {words.map((wd, i) => {
          const s = startFr(i);
          const t = Math.min(1, Math.max(0, (frame - s) / 6));
          const e = 1 - Math.pow(1 - t, 3);
          const act = Math.min(1, Math.max(0, (frame - s) / 12));
          return (
            <span key={i} style={{ display: "inline-block", color: act < 1 ? (P.goldLt ?? P.gold) : P.ink,
              opacity: e, transform: `translateY(${(1 - e) * 14}px) scale(${0.9 + 0.1 * e})` }}>{wd}</span>
          );
        })}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MediacaoAutismo — Fase 5 (motion graphics + merge).
   Script: professor de AEE, PEI/laudo não ensinam a mediação pedagógica diária
   (Fernanda Chiote, baseado em Vigotsky). Estilo premium-classic, paleta
   recursos-cognitivos (azul #2B4872 / verde-água #56CAC9), copiado de
   PremiumSectionRef.tsx (QCR-147).
   ════════════════════════════════════════════════════════════════════════════ */

const AVATAR = "MediacaoAutismo.mp4";
const A = (n: string) => `assets/MediacaoAutismo/${n}_cut.png`;

export const MediacaoAutismo: React.FC = () => {
  const { fps } = useVideoConfig();

  // ORDERED SECTION IDS — honest TYPE tags (prefix before ":").
  assertSectionGrammar([
    "opening:peiNaoEnsina",       // 1
    "avatarcap:barreirasMetas",   // 2
    "heroAsset:handsHeart",       // 3
    "heroAsset:antiqueBook",      // 4
    "evidence:livroChiote",       // 5
    "heroAsset:ideaCore",         // 6
    "avatarcap:gestosEcolalia",   // 7
    "caption:crianceViraAutismo", // 8
    "heroAsset:openDoor",         // 9
    "heroAsset:bridgeHands",      // 10
    "split:intencional",          // 11
    "full:apostaPotencial",       // 12
    "heroAsset:patienceLoop",     // 13
    "split:papelVsPratica",       // 14
    "heroAsset:saveFollow",       // 15
    "heroAsset:commentFlow",      // 16
  ]);

  // GAP-FREE windows, snapped to SRT sentence boundaries.
  const W = sectionWindows(fps, [
    0, 11.6, 18.0, 23.3, 28.3, 32.9, 35.8, 43.7, 49.0, 55.0, 57.5,
    61.144, 66.741, 72.268, 80.836, 89.059, 95.554,
  ]);

  // PHASE-8 SUBTITLE SUPPRESSION windows (§3b/§5b): W[1] 11.6-18.0 (avatarcap),
  // W[6] 35.8-43.7 (avatarcap), W[7] 43.7-49.0 (caption reveal).
  // caption_windows.json = [[11.6,18.0],[35.8,43.7],[43.7,49.0]]

  return (
    <PremiumTheme palette="recursos-cognitivos">
      <AbsoluteFill style={{ background: "#000" }}>
        <PremiumBg frame={false} />
        <Audio src={staticFile(AVATAR)} />

        {/* §1 OPENING HOOK — real news article (evidence) + bold-claim headline */}
        <PremiumOpeningHook
          w={W[0]} avatarSrc={AVATAR}
          evidence={{ src: "refs/NoticiasMediacao.png", domain: "noticias.recursoscognitivos.com.br",
            stamp: "REAL", kicker: "A MATÉRIA QUE INSPIROU ISSO", motion: "zoom", zoomTo: 1.4 }}
          headline={{ lines: [[{ t: "O PEI E O LAUDO" }], [{ t: "NÃO ENSINAM ISSO", accent: true }]],
            cy: 792, textColor: "#FFFFFF", accentColor: "#56CAC9", size: 58 }}
          inset
        />

        {/* §5b avatarcap — barreiras/metas/diagnóstico — windowed (avatar bottom panel, no full-bleed crop) */}
        <FramedWordReveal w={W[1]} avatarSrc={AVATAR}
          text="Eles descrevem barreiras, metas, diagnóstico, mas tem uma coisa que nenhum documento faz por você:"
          timings={[0, 0.68, 1.36, 2.04, 2.72, 3.4, 3.7, 4.0, 4.3, 4.6, 4.9, 5.2, 5.5, 5.8, 6.1]} />

        {/* §4 heroAsset — mãos formando coração: dar sentido sem palavras */}
        <Sequence {...W[2]}>
          <AbsoluteFill>
            <PremiumBg />
            <PremiumLabel top={150} size={38}>SENTIDO SEM PALAVRAS</PremiumLabel>
            <PremiumAsset src={A("beat05_hands_heart")} size={460} cx={540} cy={1000} delay={6} driftPhase={0.3} />
          </AbsoluteFill>
        </Sequence>

        {/* §4 heroAsset — livro antigo: um capítulo inteiro (exempt adjacency w/ prior heroAsset) */}
        <Sequence {...W[3]}>
          <AbsoluteFill>
            <PremiumBg />
            <PremiumLabel top={150} size={38}>UM CAPÍTULO INTEIRO</PremiumLabel>
            <PremiumAsset src={A("beat06_antique_book")} size={460} cx={540} cy={1000} delay={6} driftPhase={0.6} />
          </AbsoluteFill>
        </Sequence>

        {/* §2-style evidence (mid-video) — a capa real do livro da Fernanda Chiote */}
        <Sequence {...W[4]}>
          <PremiumFrame avatarSrc={AVATAR} muted trimBefore={W[4].from} inset>
            <PremiumEvidence src="refs/LivroChiote.jpg" domain="Fernanda Chiote — o livro"
              stamp="O RECURSO" motion="scroll" scroll={850} durFrames={W[4].durationInFrames} />
          </PremiumFrame>
        </Sequence>

        {/* §4 heroAsset — ideia-núcleo: "a ideia é simples e muda tudo" */}
        <Sequence {...W[5]}>
          <AbsoluteFill>
            <PremiumBg />
            <PremiumLabel top={150} size={38}>UMA IDEIA SÓ</PremiumLabel>
            <PremiumAsset src={A("beat08_idea_core")} size={460} cx={540} cy={1000} delay={6} driftPhase={0.5} />
          </AbsoluteFill>
        </Sequence>

        {/* §5b avatarcap — gestos/repetições/ecolalia — windowed (avatar bottom panel, no full-bleed crop) */}
        <FramedWordReveal w={W[6]} avatarSrc={AVATAR}
          text="O desenvolvimento da criança autista depende de como você interpreta os gestos, as repetições, a ecolalia dela."
          timings={[0, 0.44, 0.88, 1.32, 1.76, 2.2, 2.675, 3.15, 3.625, 4.1, 4.575, 5.05, 5.525, 6.0, 6.475, 6.95, 7.425]} size={42} />

        {/* §3b caption reveal — a criança vira só o autismo (aviso duro) */}
        <Sequence {...W[7]}>
          <PremiumKineticCaption reveal
            text="Se você só vê isso como sintoma do diagnóstico, a criança vira só o autismo."
            timings={[0, 0.367, 0.733, 1.1, 1.467, 1.833, 2.2, 2.567, 2.933, 3.3, 3.633, 3.967, 4.3, 4.633, 4.967]}
            durFrames={W[7].durationInFrames} />
        </Sequence>

        {/* §4 heroAsset — porta entreaberta: "você abre a porta" */}
        <Sequence {...W[8]}>
          <AbsoluteFill>
            <PremiumBg />
            <PremiumLabel top={150} size={38}>UMA PORTA NOVA</PremiumLabel>
            <PremiumAsset src={A("beat11_open_door")} size={430} cx={540} cy={1000} delay={6} driftPhase={0.4} />
          </AbsoluteFill>
        </Sequence>

        {/* §4 heroAsset — mãos + ponte de luz: "mediação pedagógica" (nomeia o termo) */}
        <Sequence {...W[9]}>
          <AbsoluteFill>
            <PremiumBg />
            <PremiumLabel top={150} size={38}>MEDIAÇÃO PEDAGÓGICA</PremiumLabel>
            <PremiumAsset src={A("beat12_bridge_hands")} size={460} cx={540} cy={1000} delay={6} driftPhase={0.7} />
          </AbsoluteFill>
        </Sequence>

        {/* §5 SPLIT GRAPHICS — alvo com flecha: mediação intencional (contraste com o dia a dia) */}
        <PremiumSplitGraphics w={W[10]} avatarSrc={AVATAR} assets={[A("splitA_target")]} inset />

        {/* §6 FULL GRAPHICS — semente brotando + seta ascendente: aposta no que a criança quase consegue */}
        <Sequence {...W[11]}>
          <PremiumFullGraphics assets={[A("fullA_seed"), A("fullA_sat")]} />
        </Sequence>

        {/* §4 heroAsset — relógio-de-paciência: segura a aposta mesmo sem resposta no tempo esperado */}
        <Sequence {...W[12]}>
          <AbsoluteFill>
            <PremiumBg />
            <PremiumLabel top={150} size={38}>NO TEMPO DELA</PremiumLabel>
            <PremiumAsset src={A("beat14_patience_loop")} size={430} cx={540} cy={1000} delay={6} driftPhase={0.5} />
          </AbsoluteFill>
        </Sequence>

        {/* §5 SPLIT FLOW (variante) — papel do plano x ampulheta da mediação diária e paciente */}
        <PremiumSplitFlow w={W[13]} avatarSrc={AVATAR} assets={[A("splitB_paper"), A("splitB_hourglass")]} inset />

        {/* §4 heroAsset — CTA: salva + segue */}
        <Sequence {...W[14]}>
          <AbsoluteFill>
            <PremiumBg />
            <PremiumLabel top={150} size={38}>SALVA E SEGUE</PremiumLabel>
            <PremiumAsset src={A("beat17_save_follow")} size={430} cx={540} cy={1000} delay={6} driftPhase={0.3} />
          </AbsoluteFill>
        </Sequence>

        {/* §4 heroAsset — CTA: comenta a palavra-chave -> DM -> livro */}
        <Sequence {...W[15]}>
          <AbsoluteFill>
            <PremiumBg />
            <PremiumLabel top={150} size={38}>CHEGA NO SEU DIRECT</PremiumLabel>
            <PremiumAsset src={A("beat18_comment_flow")} size={520} cx={540} cy={1000} delay={6} driftPhase={0.6} />
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>
    </PremiumTheme>
  );
};
