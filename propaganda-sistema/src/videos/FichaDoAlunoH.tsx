// Propaganda 1 — "Ficha do aluno", versão HORIZONTAL em tela cheia (1920x1080) para o YouTube (dono, 10/11/2026:
// "a versão tela cheia para YouTube" — não o vertical com laterais desfocadas). Mesma narração, mesmos efeitos e as
// mesmas telas do sistema (cores e botões reais), com o enquadramento pensado para 16:9: a tela ocupa a largura e as
// animações ficam ao lado.
import React from "react";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Foto, fontFamily, lerp } from "../kit/kit";
import { BotaoBio as _b, Final, Fundo, Janela, Legenda, Previa, TelaFicha, TelaInicio, TelaLista, centroAba, s, segAtual } from "./FichaDoAluno";

void _b;

const Pergunta: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const e = spring({ frame: f - 4, fps, config: { damping: 14 } });
  const docs: [string, string, number, number][] = [["📁", "Ficha do aluno", 220, 470], ["📄", "Estudo de caso", 1270, 430], ["✉️", "Plano no e-mail", 330, 700], ["❓", "Parecer?", 1220, 680]];
  return (
    <>
      {docs.map(([ic, txt, x, y], k) => {
        const a = spring({ frame: f - 10 - k * 9, fps, config: { damping: 11 } });
        return (
          <div key={k} style={{ position: "absolute", left: x, top: y + (1 - a) * 260, width: 430, whiteSpace: "nowrap", padding: "26px 24px", background: "#fff", borderRadius: 18,
            transform: `rotate(${(k % 2 ? 6 : -7) + Math.sin((f + k * 20) / 9) * 5}deg) scale(${a})`, boxShadow: "0 20px 50px rgba(0,0,0,.4)", fontFamily, fontSize: 38, fontWeight: 600,
            color: C.marca, display: "flex", gap: 14, alignItems: "center" }}><span style={{ fontSize: 50 }}>{ic}</span>{txt}</div>
        );
      })}
      <div style={{ position: "absolute", left: 420, right: 420, top: 110, background: "#fff", borderRadius: 28, padding: "30px 40px", fontFamily, transform: `translateY(${(1 - e) * -200}px)`, opacity: e,
        boxShadow: "0 24px 60px rgba(0,0,0,.45)", display: "flex", gap: 26, alignItems: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: C.teal, color: "#fff", fontSize: 50, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>?</div>
        <div><div style={{ fontSize: 30, color: "#667" }}>Todo professor do atendimento especializado já perguntou:</div>
          <div style={{ fontSize: 50, fontWeight: 700, color: "#111", marginTop: 6 }}>"Cadê a ficha desse aluno?"</div></div>
      </div>
    </>
  );
};

const Busca: React.FC<{ f: number; ini: number }> = ({ f, ini }) => {
  const { fps } = useVideoConfig();
  const texto = "parecer do Lucas";
  const n = Math.round(lerp(f, [s(7.1), s(7.9)], [0, texto.length]));
  const mail = spring({ frame: f - s(6.45), fps, config: { damping: 11 } });
  const res = spring({ frame: f - s(8.2), fps, config: { damping: 10 } });
  const ent = spring({ frame: f - ini, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ fontFamily }}>
      {["📄", "📁", "✉️", "📄", "📁", "📄", "✉️", "📄"].map((ic, k) => (
        <div key={k} style={{ position: "absolute", left: 80 + ((k * 233 + (f - ini) * (2 + k)) % 1760), top: 620 + Math.sin((f + k * 30) / 12) * 160 + (k % 3) * 60, fontSize: 90, opacity: 0.5,
          transform: `rotate(${(f * (k % 2 ? 2 : -2)) % 360}deg)` }}>{ic}</div>
      ))}
      <div style={{ position: "absolute", left: 460, right: 460, top: 250, background: "#fff", borderRadius: 50, padding: "28px 40px", fontSize: 50, color: "#222", display: "flex", gap: 20, alignItems: "center",
        boxShadow: "0 24px 60px rgba(0,0,0,.45)", transform: `scale(${ent})` }}>🔍 <span>{texto.slice(0, n)}<span style={{ opacity: Math.round(f / 8) % 2 ? 1 : 0 }}>|</span></span></div>
      {f >= s(6.4) && f < s(8.15) && <div style={{ position: "absolute", left: 0, right: 0, top: 430, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: "20px 30px", fontSize: 42, color: C.marca, fontWeight: 600, transform: `scale(${mail}) rotate(-3deg)`, boxShadow: "0 18px 40px rgba(0,0,0,.4)" }}>✉️ Caixa de entrada (238)</div>
      </div>}
      <div style={{ position: "absolute", left: 0, right: 0, top: 430, textAlign: "center", fontSize: 70, fontWeight: 800, color: "#ff6b6b", transform: `scale(${res})`, textShadow: "0 6px 18px rgba(0,0,0,.6)" }}>0 resultados</div>
    </AbsoluteFill>
  );
};

const Pilulas: React.FC<{ f: number; itens: [string, number][]; x: number; top: number }> = ({ f, itens, x, top }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {itens.map(([t, ts], k) => {
        if (f < s(ts)) return null;
        const a = spring({ frame: f - s(ts), fps, config: { damping: 12, stiffness: 180 } });
        return (
          <div key={t} style={{ position: "absolute", left: x, top: top + k * 130, maxWidth: 600, padding: "22px 36px", background: k % 2 ? C.teal : "#fff", color: k % 2 ? "#fff" : C.marca,
            fontFamily, fontSize: t.length > 18 ? 36 : 50, fontWeight: 700, borderRadius: 60, transform: `translateY(${(1 - a) * 120}px) scale(${0.6 + 0.4 * a})`, opacity: Math.min(1, a * 1.5),
            boxShadow: "0 18px 40px rgba(0,0,0,.4)" }}>✓ {t}</div>
        );
      })}
    </>
  );
};

const Contador: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  if (f < s(20.4)) return null;
  const n = Math.round(lerp(f, [s(20.5), s(21.1)], [0, 20]));
  const a = spring({ frame: f - s(20.4), fps, config: { damping: 10 } });
  return (
    <div style={{ position: "absolute", left: 1140, width: 720, top: 300, textAlign: "center", fontFamily, color: "#fff", transform: `scale(${a})` }}>
      <span style={{ fontSize: 230, fontWeight: 800, color: C.teal, textShadow: "0 0 40px rgba(46,196,201,.6)" }}>+{Math.max(n, 0)}</span>
      <span style={{ fontSize: 90, fontWeight: 700, marginLeft: 16 }}>abas</span>
      <div style={{ fontSize: 54, fontWeight: 500, opacity: lerp(f, [s(21.9), s(22.3)], [0, 1]) }}>ligadas ao <b style={{ color: C.teal }}>mesmo aluno</b></div>
    </div>
  );
};

const Pasta: React.FC<{ f: number; ini: number }> = ({ f, ini }) => {
  const { fps } = useVideoConfig();
  const g = f - ini;
  const nomes = ["Entrevista", "Estudo de caso", "Rastreio", "Plano Educacional", "Chamada", "Parecer"];
  const ab = spring({ frame: g - 19, fps, config: { damping: 12 } });
  const some = lerp(g, [13, 20], [0, 1]);
  return (
    <AbsoluteFill style={{ fontFamily }}>
      {nomes.map((n, k) => {
        const ang = (k / nomes.length) * Math.PI * 2;
        const t = lerp(g, [k * 2, 14 + k * 2], [0, 1]);
        return <div key={n} style={{ position: "absolute", left: 960 + Math.cos(ang) * 680 * (1 - t) - 160, top: 470 + Math.sin(ang) * 300 * (1 - t) - 40, width: 320, padding: "18px 0", textAlign: "center",
          background: "#fff", color: C.marca, borderRadius: 14, fontSize: 32, fontWeight: 700, transform: `scale(${1 - 0.6 * t}) rotate(${(1 - t) * (k % 2 ? 20 : -20)}deg)`,
          opacity: 1 - lerp(g, [12 + k * 2, 16 + k * 2], [0, 1]), boxShadow: "0 14px 30px rgba(0,0,0,.35)" }}>{n}</div>;
      })}
      <div style={{ position: "absolute", left: 760, top: 340, width: 400, height: 300, transform: `scale(${(0.6 + 0.4 * spring({ frame: g, fps, config: { damping: 14 } })) * (1 - 0.4 * some)})`, opacity: 1 - some }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 170, height: 60, background: "#f5b942", borderRadius: "16px 16px 0 0" }} />
        <div style={{ position: "absolute", left: 0, top: 40, width: 400, height: 260, background: "#fbc95a", borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: C.marca }}>Lucas · Ficha</div>
      </div>
      <div style={{ position: "absolute", left: 530, top: 160, transform: `translateY(${(1 - ab) * 400}px) scale(${0.7 + 0.3 * ab})`, opacity: ab }}><Previa /></div>
    </AbsoluteFill>
  );
};

const Frase: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const a = spring({ frame: f - s(26.6), fps, config: { damping: 12 } });
  const b = spring({ frame: f - s(28.25), fps, config: { damping: 12 } });
  const risco = lerp(f, [s(26.85), s(26.85) + 8], [0, 100]);
  const r = (f - s(25.4)) * 6;
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <div style={{ position: "absolute", left: 300, top: 290, width: 380, height: 380, borderRadius: 190, border: "16px solid #fff", opacity: 0.9 }}>
        <div style={{ position: "absolute", left: 174, top: 50, width: 16, height: 140, background: C.teal, borderRadius: 8, transformOrigin: "8px 140px", transform: `rotate(${r}deg)` }} />
        <div style={{ position: "absolute", left: 174, top: 90, width: 16, height: 100, background: "#fff", borderRadius: 8, transformOrigin: "8px 100px", transform: `rotate(${r / 12}deg)` }} />
      </div>
      <div style={{ position: "absolute", left: 860, top: 230, fontWeight: 800, lineHeight: 1.05 }}>
        <div style={{ fontSize: 150, color: "#fff", transform: `scale(${a})`, transformOrigin: "left center", position: "relative", display: "inline-block" }}>PAPEL
          <div style={{ position: "absolute", left: 0, top: "52%", height: 16, width: `${risco}%`, background: C.verm, borderRadius: 8 }} /></div>
        <div style={{ fontSize: 58, color: "#fff", fontWeight: 600, marginTop: 20, opacity: lerp(f, [s(27.25), s(27.45)], [0, 1]) }}>mais tempo com o seu</div>
        <div style={{ fontSize: 180, color: C.teal, transform: `scale(${b})`, transformOrigin: "left center", textShadow: "0 0 50px rgba(46,196,201,.5)" }}>ALUNO</div>
      </div>
    </AbsoluteFill>
  );
};

const Bio: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  if (f < s(30.45)) return null;
  const a = spring({ frame: f - s(30.5), fps, config: { damping: 10 } });
  return (
    <div style={{ position: "absolute", right: 120, top: 700, padding: "34px 56px", background: C.teal, color: "#fff", fontFamily, fontSize: 60, fontWeight: 800, borderRadius: 80,
      transform: `scale(${a * (1 + 0.05 * Math.sin(f / 4))})`, boxShadow: "0 0 0 10px rgba(46,196,201,.25), 0 20px 50px rgba(0,0,0,.45)" }}>👉 Link na descrição</div>
  );
};

export const FichaDoAlunoH: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { ini, cena } = segAtual(f);
  const entrou = ini === 0 ? 1 : spring({ frame: f - ini, fps, config: { damping: 15, stiffness: 140 } });
  const flash = ini === 0 ? 0 : interpolate(f - ini, [0, 3], [0.12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const citadaA = ([[14.2, 1], [14.9, 4], [16.0, 5]] as [number, number][]).reduce((acc, [t, k]) => (f >= s(t) ? k : acc), -1);
  const citadaB = ([[16.9, 9], [19.1, 12], [19.6, 15]] as [number, number][]).reduce((acc, [t, k]) => (f >= s(t) ? k : acc), 9);
  const focoAba = (marcas: [number, number][], z: number): [number, number, number] => {
    const ts: number[] = [], xs: number[] = [], ys: number[] = [];
    marcas.forEach(([t, k], i) => {
      const [cx, cy] = centroAba(k);
      if (i > 0) { const [px, py] = centroAba(marcas[i - 1][1]); ts.push(s(t - 0.25)); xs.push(px); ys.push(py); }
      ts.push(s(t)); xs.push(cx); ys.push(cy);
    });
    return [lerp(f, ts, xs), lerp(f, ts, ys) + 140, z];
  };
  const focoLista: [number, number, number] = [lerp(f, [s(10.4), s(11.1)], [900, 1500]), 480, 1.55];
  return (
    <AbsoluteFill style={{ background: C.marca, fontFamily }}>
      <Fundo f={f} />
      {cena === "pergunta" && <Pergunta f={f - ini + 75} />}
      {cena === "dor" && <Busca f={f} ini={ini} />}
      {cena === "lista" && <Janela x={160} y={90} w={1600} h={800} foco={focoLista} entrou={entrou}><TelaLista f={f} /></Janela>}
      {cena === "abasA" && <Janela x={80} y={90} w={1160} h={800} foco={focoAba([[13.0, 1], [14.9, 4], [16.0, 5]], 2.2)} rot={-7} entrou={entrou}><TelaFicha f={f} citada={citadaA} /></Janela>}
      {cena === "abasA" && <Pilulas f={f} itens={[["Entrevista", 14.2], ["Estudo de caso", 14.9], ["Rastreio", 16.0]]} x={1330} top={230} />}
      {cena === "abasB" && <Janela x={680} y={90} w={1160} h={800} foco={focoAba([[16.8, 9], [19.1, 12], [19.6, 15]], 2.2)} rot={7} entrou={entrou}><TelaFicha f={f} citada={citadaB} /></Janela>}
      {cena === "abasB" && <Pilulas f={f} itens={[["Plano Educacional Individualizado", 16.9], ["Chamada", 19.1], ["Parecer", 19.6]]} x={80} top={230} />}
      {cena === "contador" && <Janela x={100} y={200} w={960} h={540} foco={[960, 540, 1.0]} entrou={entrou}><TelaFicha f={f} citada={-1} /></Janela>}
      {cena === "contador" && <Contador f={f} />}
      {cena === "pasta" && <Pasta f={f} ini={ini} />}
      {cena === "frase" && <Frase f={f} />}
      {cena === "cta" && <Janela x={160} y={90} w={1600} h={760} foco={[1100, 450, 1.2]} entrou={entrou}><TelaInicio /></Janela>}
      {cena === "cta" && <Bio f={f} />}
      {cena === "final" && <Final f={f} ini={ini} />}
      {cena !== "final" && cena !== "contador" && !(cena === "frase" && f >= s(26.6)) && <Legenda f={f} desde={ini} y={cena === "pergunta" ? 900 : 925} />}
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      <Audio src={staticFile("prop1/narracao.mp3")} />
      <Audio src={staticFile("prop1/efeitos.wav")} volume={0.55} />
    </AbsoluteFill>
  );
};

void Foto;
