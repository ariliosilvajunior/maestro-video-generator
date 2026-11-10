import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";

export const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

// 09/11/2026, dono: "mantenha as mesmas cores e formatos dos botões do sistema original, não altere isso nunca".
// Cores medidas nos prints reais (pasta "Prints do Sistema"): azul #2b4872, azul2 #3e69b7, tealSis #56cac9,
// botões Pré-visualizar #17a2b8, Visualizar #343a40, Editar #2b4872, Ativado #28a745, Excluir #dc3545, aba ativa #f0f0f0.
export const C = { side: "#212529", top: "#212429", fundo: "#ced4da", cab: "#212529", ciano: "#17a2b8", cinza: "#343a40", azul: "#2b4872", azul2: "#3e69b7",
  tealSis: "#56cac9", abaAtiva: "#f0f0f0", verde: "#28a745", verm: "#dc3545", marca: "#0E2A47", teal: "#2EC4C9" };
export const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const lerp = (f: number, a: number[], b: number[]) => interpolate(f, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

export const Botao: React.FC<{ cor: string; texto: string; w?: number; press?: number }> = ({ cor, texto, w = 102, press = 0 }) => (
  <div style={{ width: w, height: 38, background: cor, color: "#fff", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 500, transform: `scale(${1 - press * 0.08})`, filter: `brightness(${1 - press * 0.2})` }}>{texto}</div>
);

export const Foto: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h} viewBox="0 0 200 240">
    <defs>
      <linearGradient id="fd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eef1f4" /><stop offset="1" stopColor="#d9dee4" /></linearGradient>
    </defs>
    <rect width="200" height="240" fill="url(#fd)" />
    <path d="M20 240 C25 185 60 170 100 170 C140 170 175 185 180 240 Z" fill="#1f7a4d" />
    <path d="M78 168 L100 198 L122 168 Z" fill="#163a2a" />
    <rect x="86" y="140" width="28" height="34" fill="#e8b996" />
    <ellipse cx="100" cy="105" rx="40" ry="48" fill="#f0c4a2" />
    <path d="M60 98 C58 62 80 50 102 50 C128 50 144 66 140 100 C134 80 122 74 100 76 C82 76 68 82 60 98 Z" fill="#4a3426" />
    <circle cx="86" cy="106" r="4" fill="#3b2a20" /><circle cx="114" cy="106" r="4" fill="#3b2a20" />
    <path d="M86 128 Q100 138 114 128" stroke="#a8644a" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

export const Menu = ["Usuários", "Escolas", "Supervisores", "Professores SALA", "Disciplinas/Componentes", "Turmas", "Alunos", "Chamada AEE", "Atividades Comuns", "Atividades Cognitivas", "Manutenção ACI/PEI's", "Ano Letivo", "Mural de Documentos", "Assinaturas"];

export const Moldura: React.FC<{ children: React.ReactNode; ativo?: string }> = ({ children, ativo = "Alunos" }) => (
  <AbsoluteFill style={{ background: C.fundo }}>
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 262, background: C.side, color: "#fff", paddingLeft: 28 }}>
      <Img src={staticFile("logo.png")} style={{ width: 200, marginTop: 30 }} />
      <div style={{ fontSize: 13, marginTop: 64, marginBottom: 14, fontWeight: 500 }}>Menu Principal</div>
      {Menu.map((m) => (
        <div key={m} style={{ fontSize: 15, height: 41, display: "flex", alignItems: "center", gap: 12, opacity: 0.95, color: m === ativo ? C.teal : "#fff" }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: m === ativo ? C.teal : "#fff", opacity: 0.85 }} />{m}
        </div>
      ))}
      <div style={{ fontSize: 13, marginTop: 22, fontWeight: 500 }}>Recursos IA</div>
      <div style={{ fontSize: 15, marginTop: 16 }}>▤&nbsp; Relatório Aluno</div>
    </div>
    <div style={{ position: "absolute", left: 262, right: 0, top: 0, height: 62, background: C.top, color: "#bbb", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", left: 16, width: 48, height: 34, borderRadius: 4, background: "#343a40", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>☰</div>
      Versão BETA
    </div>
    <div style={{ position: "absolute", left: 262, right: 0, top: 62, bottom: 0 }}>{children}</div>
  </AbsoluteFill>
);

/** Cursor que anda entre pontos [frame, x, y] e mostra um anel em cada frame de `cliques`. */
export const Cursor: React.FC<{ f: number; pontos: [number, number, number][]; cliques: number[] }> = ({ f, pontos, cliques }) => {
  const fs = pontos.map((p) => p[0]);
  const x = lerp(f, fs, pontos.map((p) => p[1]));
  const y = lerp(f, fs, pontos.map((p) => p[2]));
  return (
    <>
      {cliques.map((c) => {
        const t = f - c;
        if (t < 0 || t > 14) return null;
        return <div key={c} style={{ position: "absolute", left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: 30, border: `4px solid ${C.teal}`, opacity: 1 - t / 14, transform: `scale(${0.3 + t / 10})` }} />;
      })}
      <svg style={{ position: "absolute", left: x - 4, top: y - 2, filter: "drop-shadow(0 3px 4px rgba(0,0,0,.4))" }} width="34" height="40" viewBox="0 0 24 28">
        <path d="M2 2 L2 22 L7.5 17 L11 25 L14.5 23.5 L11 16 L18 16 Z" fill="#fff" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </>
  );
};

/** Legenda da marca: itens [início, fim, texto]. */
export const Legenda: React.FC<{ f: number; fps: number; itens: [number, number, string][] }> = ({ f, fps, itens }) => {
  const atual = itens.find(([a, b]) => f >= a && f < b);
  if (!atual) return null;
  const [a, b, texto] = atual;
  const ent = spring({ frame: f - a, fps, config: { damping: 15 } });
  const sai = lerp(f, [b - 8, b], [1, 0]);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, display: "flex", justifyContent: "center", fontFamily, opacity: Math.min(ent, sai) }}>
      <div style={{ background: C.marca, color: "#fff", fontSize: 46, fontWeight: 700, padding: "18px 40px", borderRadius: 18, borderBottom: `6px solid ${C.teal}`, transform: `translateY(${(1 - ent) * 40}px)`, boxShadow: "0 18px 40px rgba(0,0,0,.35)" }}>{texto}</div>
    </div>
  );
};

/** Encerramento: logo + frase + site, a partir do frame `inicio`. */
export const Final: React.FC<{ f: number; fps: number; inicio: number; frase: string }> = ({ f, fps, inicio, frase }) => {
  const g = f - inicio;
  if (g < 0) return null;
  const s = spring({ frame: g, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: C.marca, opacity: lerp(g, [0, 8], [0, 1]), alignItems: "center", justifyContent: "center", fontFamily, color: "#fff" }}>
      <Img src={staticFile("logo.png")} style={{ width: 620, transform: `scale(${0.8 + 0.2 * s})` }} />
      <div style={{ fontSize: 50, fontWeight: 600, marginTop: 40, opacity: lerp(g, [10, 20], [0, 1]) }}>{frase}</div>
      <div style={{ fontSize: 32, marginTop: 18, color: C.teal, opacity: lerp(g, [18, 28], [0, 1]) }}>recursoscognitivos.com.br</div>
    </AbsoluteFill>
  );
};

