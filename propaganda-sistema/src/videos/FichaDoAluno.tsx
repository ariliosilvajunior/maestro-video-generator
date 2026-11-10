// Propaganda 1 — "Ficha do aluno". Vertical 1080x1920, ~33,5 s.
// 09/11/2026, dono: sem avatar ("o áudio nada a ver com a fala do avatar… melhor retirar"), fala sem siglas (por extenso)
// e as telas com as MESMAS cores e formatos de botão do sistema real — nunca alterar (destaque só por fora: anel, seta).
// Dinâmica sem apresentador: a tela muda de posição/tamanho a cada 3–5 s + motion graphics no tempo da fala.
// Telas recriadas a partir dos prints TL22–TL31 com dados FICTÍCIOS (LGPD).
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Cursor, Foto, Menu, fontFamily, lerp } from "../kit/kit";
import palavras from "../../public/prop1/words.json";

const FPS = 30;
export const s = (seg: number) => Math.round(seg * FPS);
export const DURACAO_FICHA = s(33.5);

// [início em s, cena]
export const SEG: [number, string][] = [
  [0, "pergunta"], [3.45, "dor"], [9.3, "lista"], [13.0, "abasA"], [16.8, "abasB"], [20.3, "contador"],
  [23.85, "pasta"], [25.4, "frase"], [28.9, "cta"], [31.6, "final"],
];
export const segAtual = (f: number) => {
  let i = 0;
  for (let k = 0; k < SEG.length; k++) if (f >= s(SEG[k][0])) i = k;
  return { ini: s(SEG[i][0]), cena: SEG[i][1] };
};
const CORRIGE: Record<string, string> = { recursos: "Recursos", "cognitivos,": "Cognitivos,", plano: "Plano", educacional: "Educacional", individualizado: "Individualizado", "individualizado,": "Individualizado," };

// ---------------------------------------------------------------- fundo da marca (vivo)
export const Fundo: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 20%, #16406b 0%, ${C.marca} 55%, #071a2e 100%)`, overflow: "hidden" }}>
    {[0, 1, 2, 3].map((k) => (
      <div key={k} style={{ position: "absolute", width: 520 + k * 120, height: 520 + k * 120, borderRadius: "50%",
        left: 540 + Math.sin(f / (70 + k * 13) + k) * 380 - (260 + k * 60), top: 400 + k * 380 + Math.cos(f / (90 + k * 11)) * 140 - (260 + k * 60),
        background: k % 2 ? C.teal : "#2b6cb0", opacity: 0.12, filter: "blur(60px)" }} />
    ))}
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1.5px, transparent 1.5px)", backgroundSize: "36px 36px", transform: `translateY(${(f * 0.6) % 36}px)` }} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- telas recriadas (cores e botões do sistema real)
const ALUNOS = [
  ["2026041", "Lucas Andrade Silva", "E.M. Jardim das Flores"],
  ["2026058", "Marina Costa Rocha", "E.M. Jardim das Flores"],
  ["2026063", "Pedro Henrique Lima", "E.E. Monte Verde"],
];
const Barra: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 262, background: C.side, color: "#fff", paddingLeft: 28, fontFamily }}>
    <Img src={staticFile("logo.png")} style={{ width: 200, marginTop: 30 }} />
    <div style={{ fontSize: 13, marginTop: 50, marginBottom: 12, fontWeight: 500 }}>Menu Principal</div>
    {Menu.slice(0, 12).map((m) => (
      <div key={m} style={{ fontSize: 15, height: 40, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 14, height: 14, borderRadius: 3, background: "#fff", opacity: 0.85 }} />{m}
      </div>
    ))}
  </div>
);
const Topo: React.FC = () => (
  <div style={{ position: "absolute", left: 262, right: 0, top: 0, height: 62, background: C.top, color: "#bbb", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontFamily }}>
    <div style={{ position: "absolute", left: 18, width: 48, height: 34, borderRadius: 4, background: C.cinza, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>☰</div>
    Versão BETA
  </div>
);
const Bt: React.FC<{ cor: string; t: string; w?: number; press?: number }> = ({ cor, t, w = 210, press = 0 }) => (
  <span style={{ display: "block", background: cor, color: "#fff", borderRadius: 4, textAlign: "center", fontSize: 17, padding: "7px 0", width: w,
    transform: `scale(${1 - 0.06 * press})`, filter: `brightness(${1 - 0.18 * press})` }}>{t}</span>
);

export const TelaLista: React.FC<{ f: number }> = ({ f }) => {
  const press = lerp(f, [s(11.75), s(11.9), s(12.05)], [0, 1, 0]);
  return (
    <div style={{ position: "absolute", width: 1920, height: 1080, background: C.fundo, fontFamily, overflow: "hidden" }}>
      <Barra /><Topo />
      <div style={{ position: "absolute", left: 290, right: 30, top: 84, display: "flex", gap: 12 }}>
        {["Todas as escolas…", "Todas as turmas…", "Ativo"].map((t, k) => (
          <div key={k} style={{ flex: k === 2 ? 0.6 : 1, height: 46, background: "#fff", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 16, color: "#555", fontSize: 18 }}>{t}</div>
        ))}
        <div style={{ width: 120, height: 46, background: C.azul, color: "#fff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>▼ Filtrar</div>
      </div>
      <div style={{ position: "absolute", left: 290, right: 30, top: 142, display: "flex", gap: 12 }}>
        <div style={{ flex: 1, height: 44, background: "#fff", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 16, color: "#888", fontSize: 18 }}>Nome do aluno contém…</div>
        <div style={{ width: 150, height: 44, background: C.azul, color: "#fff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⬇ Download</div>
        <div style={{ width: 160, height: 44, background: C.azul, color: "#fff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>+ Novo Aluno</div>
      </div>
      <div style={{ position: "absolute", left: 290, right: 30, top: 198, background: "#fff", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ display: "flex", background: C.cab, color: "#fff", fontSize: 19, fontWeight: 600, height: 52, alignItems: "center", paddingLeft: 20 }}>
          <span style={{ width: 200 }}>Matrícula</span><span style={{ width: 520 }}>Nome Aluno</span><span style={{ flex: 1 }}>Escola</span><span style={{ width: 240 }}>Ações</span>
        </div>
        {ALUNOS.map((a, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", height: 262, paddingLeft: 20, fontSize: 21, color: "#222", borderBottom: "1px solid #e3e6ea", background: k % 2 ? "#fff" : "#ececec" }}>
            <span style={{ width: 200 }}>{a[0]}</span><span style={{ width: 520 }}>{a[1]}</span><span style={{ flex: 1 }}>{a[2]}</span>
            <span style={{ width: 240, display: "flex", flexDirection: "column", gap: 8 }}>
              <Bt cor={C.ciano} t="Pré-visualizar" /><Bt cor={C.cinza} t="Visualizar" press={k === 0 ? press : 0} /><Bt cor={C.azul} t="Editar" />
              <Bt cor={C.verde} t="Ativado" /><Bt cor={C.verm} t="Excluir" />
            </span>
          </div>
        ))}
      </div>
      <Cursor f={f} pontos={[[s(9.4), 1400, 950], [s(11.5), 1750, 330], [s(12.9), 1750, 330]]} cliques={[s(11.85)]} />
    </div>
  );
};

const ABAS = ["01 - Ficha/Aluno", "02 - Entrevista/Responsável", "03 - Concordância", "04 - Atestado/Presença", "05 - Estudo/Caso", "06 - Rastreio",
  "07 - Plano/Trabalho", "08 - Avaliação/PAPE", "09 - PDI/PAEE", "10 - ACI/PEI", "11 - ACI.PEI/Ass.Prof", "12 - Avaliação/Prof.AEE", "13 - Chamada",
  "14 - AtaAEE/Reunião", "15 - Monitor/Intérprete", "16 - Parecer/1ºSemestre", "17 - Parecer/2ºSemestre", "18 - Dashboard/Aulas", "19 - Dashboard/Rastreio",
  "20 - Relatório/Rastreio", "21 - Terminalidade", "22 - Plano/Adaptação", "24 - Checklist/Prof.AEE", "Documentos"];

// posição de cada aba (largura pelo tamanho do texto, quebra de linha a 1600 px) — o foco da câmera vai até a aba citada
const POS_ABAS = (() => {
  let x = 290, y = 84; const out: { x: number; y: number; w: number }[] = [];
  for (const a of ABAS) { const w = Math.round(a.length * 9.4 + 32); if (x + w > 1890) { x = 290; y += 42; } out.push({ x, y, w }); x += w; }
  return out;
})();
export const centroAba = (k: number) => [POS_ABAS[k].x + POS_ABAS[k].w / 2, POS_ABAS[k].y + 21] as const;
// anel por FORA da aba citada (não muda cor nem formato do botão)
export const TelaFicha: React.FC<{ f: number; citada: number }> = ({ f, citada }) => (
  <div style={{ position: "absolute", width: 1920, height: 1080, background: C.fundo, fontFamily, overflow: "hidden" }}>
    <Barra /><Topo />
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      {ABAS.map((a, k) => {
        const ativa = k === 0;
        const anel = k === citada ? 0.5 + 0.5 * Math.abs(Math.sin(f / 5)) : 0;
        const p = POS_ABAS[k];
        return <div key={a} style={{ position: "absolute", left: p.x, top: p.y, width: p.w, height: 42, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
          whiteSpace: "nowrap", fontSize: 17, borderRadius: "4px 4px 0 0", color: ativa ? "#212529" : "#fff", background: ativa ? C.abaAtiva : C.azul,
          border: "1px solid rgba(255,255,255,.08)", zIndex: k === citada ? 2 : 1,
          boxShadow: k === citada ? `0 0 0 5px rgba(46,196,201,${anel}), 0 0 30px rgba(46,196,201,${anel})` : "none" }}>{a}</div>;
      })}
    </div>
    <div style={{ position: "absolute", left: 290, top: 300, width: 1150, height: 740, background: "#fff", borderRadius: 4, padding: 30 }}>
      <div style={{ textAlign: "center", fontSize: 30, fontWeight: 600, color: "#222" }}>Informações Pessoais</div>
      {[["Nome do Aluno", "Lucas Andrade Silva"], ["Data de nascimento", "14/03/2016"], ["Escola", "E.M. Jardim das Flores"], ["Turma", "4º ano B — Sala 12"]].map(([r, v]) => (
        <div key={r} style={{ marginTop: 26 }}>
          <div style={{ fontSize: 19, fontWeight: 600, color: "#333" }}>{r}</div>
          <div style={{ marginTop: 8, height: 50, border: "1px solid #ced4da", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 16, fontSize: 22, color: "#222" }}>{v}</div>
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 1470, top: 300, width: 420, height: 520, background: "#fff", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 22 }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: "#222", marginBottom: 18 }}>Foto do Aluno</div>
      <Foto w={300} h={360} />
    </div>
  </div>
);

const Icone: React.FC<{ tipo: string }> = ({ tipo }) => (
  <svg width="74" height="60" viewBox="0 0 74 60" style={{ position: "absolute", right: 24, bottom: 22 }}>
    {tipo === "escola" ? (<g fill="#fff"><path d="M37 4 L70 20 H4 Z" /><rect x="8" y="24" width="8" height="24" /><rect x="23" y="24" width="8" height="24" /><rect x="43" y="24" width="8" height="24" /><rect x="58" y="24" width="8" height="24" /><rect x="4" y="50" width="66" height="7" /></g>)
      : (<g fill="#fff"><circle cx="37" cy="16" r="10" /><path d="M20 56 C20 38 54 38 54 56 Z" /><circle cx="14" cy="22" r="7" /><path d="M2 54 C2 40 24 40 24 50 Z" /><circle cx="60" cy="22" r="7" /><path d="M50 50 C50 40 72 40 72 54 Z" /></g>)}
  </svg>
);
const Cartao: React.FC<{ t: string; n: string; cor: string; x: number; y: number; w: number; ic: string }> = ({ t, n, cor, x, y, w, ic }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: 160, background: cor, color: "#fff", borderRadius: 14, padding: "20px 24px", boxSizing: "border-box" }}>
    <div style={{ fontSize: 20, opacity: 0.85 }}>{t}</div><div style={{ fontSize: 46, fontWeight: 400, marginTop: 4 }}>{n}</div><Icone tipo={ic} />
  </div>
);
export const TelaInicio: React.FC = () => (
  <div style={{ position: "absolute", width: 1920, height: 1080, background: C.fundo, fontFamily, overflow: "hidden" }}>
    <Barra /><Topo />
    <div style={{ position: "absolute", left: 300, right: 40, top: 96, height: 92, background: C.azul, color: "#fff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 400 }}>Seja bem vindo ao Recursos Cognitivos!</div>
    <Cartao t="ALUNOS" n="38" cor={C.azul} x={300} y={212} w={515} ic="pessoas" />
    <Cartao t="ESCOLAS" n="2" cor={C.azul2} x={835} y={212} w={515} ic="escola" />
    <Cartao t="TURMAS" n="14" cor={C.tealSis} x={1370} y={212} w={510} ic="pessoas" />
    <Cartao t="SUPERVISORES" n="3" cor={C.azul} x={300} y={392} w={780} ic="pessoas" />
    <Cartao t="PROFESSORES SALA" n="17" cor={C.azul2} x={1100} y={392} w={780} ic="pessoas" />
    <div style={{ position: "absolute", left: 300, right: 40, top: 574, height: 180, background: "#fff", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#222" }}>
      <div style={{ fontSize: 30 }}>Sistema de Assinaturas</div><div style={{ fontSize: 18, color: "#666", marginTop: 4 }}>Gerencie suas assinaturas com praticidade!</div>
      <span style={{ marginTop: 14, background: C.azul, color: "#fff", borderRadius: 4, padding: "8px 26px", fontSize: 20 }}>Acessar</span>
    </div>
  </div>
);

// Pré-visualização do Aluno (mesmo formato do modal real), dados fictícios
export const Previa: React.FC = () => (
  <div style={{ width: 860, background: "#fff", borderRadius: 8, fontFamily, color: "#222", boxShadow: "0 30px 80px rgba(0,0,0,.5)", overflow: "hidden" }}>
    <div style={{ display: "flex", justifyContent: "space-between", padding: "22px 30px", borderBottom: "1px solid #e3e6ea", fontSize: 32, fontWeight: 500 }}>Pré-visualização do Aluno<span style={{ color: "#999" }}>×</span></div>
    <div style={{ display: "flex", gap: 28, padding: 30 }}>
      <div style={{ border: "1px solid #e3e6ea", padding: 6 }}><Foto w={210} h={252} /></div>
      <div style={{ fontSize: 27, lineHeight: 1.6 }}>
        {[["Nome", "Lucas Andrade Silva"], ["Avaliação", "Por parecer"], ["Turno Sala", "Vespertino/Tarde"], ["Turma", "4º ano B - SALA 12"], ["Matrícula", "2026041"]].map(([k, v]) => (
          <div key={k}><b>{k}:</b> {v}</div>
        ))}
      </div>
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 30px 26px" }}><span style={{ background: "#6c757d", color: "#fff", borderRadius: 4, padding: "10px 26px", fontSize: 24 }}>Fechar</span></div>
  </div>
);

// Janela da tela: posição/tamanho/inclinação mudam por cena (a dinâmica sem apresentador)
export const Janela: React.FC<{ children: React.ReactNode; x: number; y: number; w: number; foco: [number, number, number]; h?: number; rot?: number; entrou?: number }> = ({ children, x, y, w, foco, h, rot = 0, entrou = 1 }) => {
  const hh = h ?? (w / 1920) * 1080;
  const esc = (w / 1920) * foco[2];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: hh, borderRadius: 26, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.55), 0 0 0 3px rgba(46,196,201,.5)",
      transform: `perspective(1600px) rotateY(${rot}deg) translateY(${(1 - entrou) * 260}px) scale(${0.9 + 0.1 * entrou})`, opacity: Math.min(1, entrou * 1.5) }}>
      <div style={{ position: "absolute", left: Math.min(0, Math.max(w - 1920 * esc, w / 2 - foco[0] * esc)), top: Math.min(0, Math.max(hh - 1080 * esc, hh / 2 - foco[1] * esc)),
        width: 1920, height: 1080, transform: `scale(${esc})`, transformOrigin: "0 0" }}>{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------- legenda cinética (respeita a frase)
const PEQUENAS = new Set(["e", "o", "a", "no", "na", "do", "da", "de", "num", "ao", "com", "em", "os", "as"]);
const GRUPOS: { pal: [string, number, number][]; ini: number; fim: number }[] = (() => {
  const ps: [string, number, number][] = [];
  for (const [p, a, b] of palavras as [string, number, number][]) {
    if (p.startsWith("-") && ps.length) { const u = ps[ps.length - 1]; ps[ps.length - 1] = [u[0] + p, u[1], b]; continue; }
    ps.push([CORRIGE[p] ?? p, a, b]);
  }
  const out: [string, number, number][][] = [];
  let g: [string, number, number][] = [];
  ps.forEach((w, k) => {
    g.push(w);
    const pont = /[.,?!;:]$/.test(w[0]);
    const ultimaPequena = PEQUENAS.has(w[0].toLowerCase()) && k + 1 < ps.length;
    if (pont || (g.length >= 2 && !ultimaPequena) || g.length >= 3) { out.push(g); g = []; }
  });
  if (g.length) out.push(g);
  for (let k = 0; k < out.length - 1; k++) {
    const dur = out[k + 1][0][1] - out[k][0][1];
    if (dur < 0.5 && out[k].length + out[k + 1].length <= 4) { out[k] = [...out[k], ...out[k + 1]]; out.splice(k + 1, 1); k--; }
  }
  return out.map((gr, k) => ({ pal: gr, ini: gr[0][1], fim: k + 1 < out.length ? out[k + 1][0][1] : gr[gr.length - 1][2] + 0.4 }));
})();
const limpa = (p: string) => p.replace(/[.,?!;:]+$/, "");

export const Legenda: React.FC<{ f: number; y: number; desde: number }> = ({ f, y, desde }) => {
  const { fps } = useVideoConfig();
  const t = f / FPS;
  const g = GRUPOS.find((x) => t >= x.ini - 0.05 && t < x.fim - 0.05);
  if (!g || Math.round(g.ini * FPS) < desde - 1) return null;
  const pop = spring({ frame: f - Math.round(g.ini * FPS), fps, config: { damping: 12, stiffness: 220 } });
  const atual = g.pal.reduce((acc, [, a], k) => (t >= a - 0.05 ? k : acc), 0);
  const total = g.pal.map(([p]) => limpa(p)).join(" ").length;
  const tam = total > 22 ? 58 : total > 16 ? 68 : 86;
  return (
    <div style={{ position: "absolute", left: 96, right: 96, top: y, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, fontFamily, transform: `scale(${0.85 + 0.15 * pop})` }}>
      {g.pal.map(([p], k) => (
        <span key={k} style={{ fontSize: tam, fontWeight: 700, color: k === atual ? C.teal : "#fff", textShadow: "0 6px 18px rgba(0,0,0,.7), 0 0 2px #000", letterSpacing: -1 }}>{limpa(p)}</span>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- cenas de motion
const CartaoPergunta: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const e = spring({ frame: f - 4, fps, config: { damping: 14 } });
  const docs: [string, string, number, number][] = [["📁", "Ficha do aluno", -300, 560], ["📄", "Estudo de caso", 280, 640], ["✉️", "Plano no e-mail", -260, 1010], ["❓", "Parecer?", 290, 1090]];
  return (
    <>
      {docs.map(([ic, txt, dx, y], k) => {
        const a = spring({ frame: f - 10 - k * 9, fps, config: { damping: 11 } });
        const balanca = Math.sin((f + k * 20) / 9) * 6;
        return (
          <div key={k} style={{ position: "absolute", left: 540 + dx * a - 215, top: y + (1 - a) * 300, width: 430, whiteSpace: "nowrap", padding: "26px 22px", background: "#fff", borderRadius: 18,
            transform: `rotate(${(k % 2 ? 7 : -8) + balanca}deg) scale(${a})`, boxShadow: "0 20px 50px rgba(0,0,0,.4)", fontFamily, fontSize: 36, fontWeight: 600, color: C.marca, display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 50 }}>{ic}</span>{txt}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 80, right: 80, top: 190, background: "#fff", borderRadius: 28, padding: "34px 38px", fontFamily, transform: `translateY(${(1 - e) * -220}px)`, opacity: e,
        boxShadow: "0 24px 60px rgba(0,0,0,.45)", display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ width: 100, height: 100, borderRadius: 50, background: C.teal, color: "#fff", fontSize: 50, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>?</div>
        <div>
          <div style={{ fontSize: 30, color: "#667" }}>Todo professor do atendimento especializado já perguntou:</div>
          <div style={{ fontSize: 46, fontWeight: 700, color: "#111", marginTop: 6 }}>"Cadê a ficha desse aluno?"</div>
        </div>
      </div>
    </>
  );
};

// "dor": busca que não acha nada
const Busca: React.FC<{ f: number; ini: number }> = ({ f, ini }) => {
  const { fps } = useVideoConfig();
  const texto = "parecer do Lucas";
  const n = Math.round(lerp(f, [s(7.1), s(7.9)], [0, texto.length]));
  const mail = spring({ frame: f - s(6.45), fps, config: { damping: 11 } });
  const res = spring({ frame: f - s(8.2), fps, config: { damping: 10 } });
  const ent = spring({ frame: f - ini, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ fontFamily }}>
      {["📄", "📁", "✉️", "📄", "📁", "📄"].map((ic, k) => (
        <div key={k} style={{ position: "absolute", left: 120 + ((k * 173 + (f - ini) * (2 + k)) % 860), top: 980 + Math.sin((f + k * 30) / 12) * 260 + k * 60, fontSize: 90, opacity: 0.55,
          transform: `rotate(${(f * (k % 2 ? 2 : -2)) % 360}deg)` }}>{ic}</div>
      ))}
      <div style={{ position: "absolute", left: 80, right: 80, top: 520, background: "#fff", borderRadius: 50, padding: "30px 40px", fontSize: 48, color: "#222", display: "flex", gap: 20, alignItems: "center",
        boxShadow: "0 24px 60px rgba(0,0,0,.45)", transform: `scale(${ent})` }}>🔍 <span>{texto.slice(0, n)}<span style={{ opacity: Math.round(f / 8) % 2 ? 1 : 0 }}>|</span></span></div>
      {f >= s(6.4) && f < s(8.15) && <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: "20px 30px", fontSize: 40, color: C.marca, fontWeight: 600, transform: `scale(${mail}) rotate(-3deg)`, boxShadow: "0 18px 40px rgba(0,0,0,.4)" }}>✉️ Caixa de entrada (238)</div>
      </div>}
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontSize: 64, fontWeight: 800, color: "#ff6b6b", transform: `scale(${res})`, textShadow: "0 6px 18px rgba(0,0,0,.6)" }}>0 resultados</div>
    </AbsoluteFill>
  );
};

export const Pilulas: React.FC<{ f: number; itens: [string, number][]; top: number }> = ({ f, itens, top }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {itens.map(([t, ts], k) => {
        if (f < s(ts)) return null;
        const a = spring({ frame: f - s(ts), fps, config: { damping: 12, stiffness: 180 } });
        return (
          <div key={t} style={{ position: "absolute", right: 140, top: top + k * 118, maxWidth: 800, padding: "20px 36px", background: k % 2 ? C.teal : "#fff", color: k % 2 ? "#fff" : C.marca,
            fontFamily, fontSize: t.length > 18 ? 38 : 50, fontWeight: 700, borderRadius: 60, transform: `translateX(${(1 - a) * 700}px) rotate(${(1 - a) * 12}deg)`, boxShadow: "0 18px 40px rgba(0,0,0,.4)" }}>✓ {t}</div>
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
    <div style={{ position: "absolute", left: 0, right: 0, top: 1060, textAlign: "center", fontFamily, color: "#fff", transform: `scale(${a})` }}>
      <span style={{ fontSize: 220, fontWeight: 800, color: C.teal, textShadow: "0 0 40px rgba(46,196,201,.6)" }}>+{Math.max(n, 0)}</span>
      <span style={{ fontSize: 84, fontWeight: 700, marginLeft: 18 }}>abas</span>
      <div style={{ fontSize: 50, fontWeight: 500, opacity: lerp(f, [s(21.9), s(22.3)], [0, 1]) }}>ligadas ao <b style={{ color: C.teal }}>mesmo aluno</b></div>
    </div>
  );
};

const PastaUnica: React.FC<{ f: number; ini: number }> = ({ f, ini }) => {
  const { fps } = useVideoConfig();
  const g = f - ini;
  const nomes = ["Entrevista", "Estudo de caso", "Rastreio", "Plano Educacional", "Chamada", "Parecer"];
  const ab = spring({ frame: g - 19, fps, config: { damping: 12 } });
  const somePasta = lerp(g, [13, 20], [0, 1]);
  return (
    <AbsoluteFill style={{ fontFamily }}>
      {nomes.map((n, k) => {
        const ang = (k / nomes.length) * Math.PI * 2;
        const t = lerp(g, [k * 2, 14 + k * 2], [0, 1]);
        return <div key={n} style={{ position: "absolute", left: 540 + Math.cos(ang) * 360 * (1 - t) - 160, top: 900 + Math.sin(ang) * 400 * (1 - t) - 50, width: 320, padding: "18px 0", textAlign: "center",
          background: "#fff", color: C.marca, borderRadius: 14, fontSize: 32, fontWeight: 700, transform: `scale(${1 - 0.6 * t}) rotate(${(1 - t) * (k % 2 ? 20 : -20)}deg)`,
          opacity: 1 - lerp(g, [12 + k * 2, 16 + k * 2], [0, 1]), boxShadow: "0 14px 30px rgba(0,0,0,.35)" }}>{n}</div>;
      })}
      <div style={{ position: "absolute", left: 540 - 200, top: 800, width: 400, height: 300, transform: `scale(${(0.6 + 0.4 * spring({ frame: g, fps, config: { damping: 14 } })) * (1 - 0.4 * somePasta)})`, opacity: 1 - somePasta }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 170, height: 60, background: "#f5b942", borderRadius: "16px 16px 0 0" }} />
        <div style={{ position: "absolute", left: 0, top: 40, width: 400, height: 260, background: "#fbc95a", borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: C.marca }}>Lucas · Ficha</div>
      </div>
      <div style={{ position: "absolute", left: 110, top: 560, transform: `translateY(${(1 - ab) * 500}px) scale(${0.7 + 0.3 * ab})`, opacity: ab }}><Previa /></div>
    </AbsoluteFill>
  );
};

const Frase: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const a = spring({ frame: f - s(26.6), fps, config: { damping: 12 } });
  const b = spring({ frame: f - s(28.25), fps, config: { damping: 12 } });
  const risco = lerp(f, [s(26.85), s(26.85) + 8], [0, 100]);
  const relogio = (f - s(25.4)) * 6;
  return (
    <AbsoluteFill style={{ fontFamily, alignItems: "center" }}>
      <div style={{ position: "absolute", top: 520, width: 300, height: 300, borderRadius: 150, border: "14px solid #fff", opacity: 0.9 }}>
        <div style={{ position: "absolute", left: 136, top: 40, width: 14, height: 110, background: C.teal, borderRadius: 7, transformOrigin: "7px 110px", transform: `rotate(${relogio}deg)` }} />
        <div style={{ position: "absolute", left: 136, top: 70, width: 14, height: 80, background: "#fff", borderRadius: 7, transformOrigin: "7px 80px", transform: `rotate(${relogio / 12}deg)` }} />
      </div>
      <div style={{ position: "absolute", top: 940, textAlign: "center", fontWeight: 800, lineHeight: 1.05 }}>
        <div style={{ fontSize: 140, color: "#fff", transform: `scale(${a})`, position: "relative", display: "inline-block" }}>PAPEL
          <div style={{ position: "absolute", left: 0, top: "52%", height: 16, width: `${risco}%`, background: C.verm, borderRadius: 8 }} /></div>
        <div style={{ fontSize: 56, color: "#fff", fontWeight: 600, marginTop: 20, opacity: lerp(f, [s(27.25), s(27.45)], [0, 1]) }}>mais tempo com o seu</div>
        <div style={{ fontSize: 160, color: C.teal, transform: `scale(${b})`, textShadow: "0 0 50px rgba(46,196,201,.5)" }}>ALUNO</div>
      </div>
    </AbsoluteFill>
  );
};

export const BotaoBio: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  if (f < s(30.45)) return null;
  const a = spring({ frame: f - s(30.5), fps, config: { damping: 10 } });
  const pulso = 1 + 0.05 * Math.sin(f / 4);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1240, display: "flex", justifyContent: "center" }}>
      <div style={{ padding: "36px 56px", background: C.teal, color: "#fff", fontFamily, fontSize: 60, fontWeight: 800, borderRadius: 80,
        transform: `scale(${a * pulso})`, boxShadow: "0 0 0 10px rgba(46,196,201,.25), 0 20px 50px rgba(0,0,0,.45)" }}>👉 Link na bio</div>
    </div>
  );
};

export const Final: React.FC<{ f: number; ini: number }> = ({ f, ini }) => {
  const { fps } = useVideoConfig();
  const g = f - ini;
  const sp = spring({ frame: g, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily, color: "#fff" }}>
      <Img src={staticFile("logo.png")} style={{ width: 760, transform: `scale(${0.8 + 0.2 * sp})`, opacity: sp }} />
      <div style={{ fontSize: 58, fontWeight: 700, marginTop: 50, textAlign: "center", opacity: lerp(g, [8, 16], [0, 1]) }}>A ficha do aluno<br />num lugar só.</div>
      <div style={{ fontSize: 40, marginTop: 30, color: C.teal, opacity: lerp(g, [14, 22], [0, 1]) }}>recursoscognitivos.com.br</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- vídeo
export const FichaDoAluno: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { ini, cena } = segAtual(f);
  const entrou = ini === 0 ? 1 : spring({ frame: f - ini, fps, config: { damping: 15, stiffness: 140 } });
  const flash = ini === 0 ? 0 : interpolate(f - ini, [0, 3], [0.12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zl = lerp(f - ini, [0, 150], [1, 1.06]);
  const citadaA = ([[14.2, 1], [14.9, 4], [16.0, 5]] as [number, number][]).reduce((acc, [t, k]) => (f >= s(t) ? k : acc), -1);
  const citadaB = ([[16.9, 9], [19.1, 12], [19.6, 15]] as [number, number][]).reduce((acc, [t, k]) => (f >= s(t) ? k : acc), 9);
  const focoLista: [number, number, number] = [lerp(f, [s(10.4), s(11.1)], [760, 1640]), 430, 2.0];
  const focoAba = (marcas: [number, number][], z: number): [number, number, number] => {
    // segura na aba até a palavra seguinte; a câmera só anda nos 0,25 s antes de cada palavra
    const ts: number[] = [], xs: number[] = [], ys: number[] = [];
    marcas.forEach(([t, k], i) => {
      const [cx, cy] = centroAba(k);
      if (i > 0) { const [px, py] = centroAba(marcas[i - 1][1]); ts.push(s(t - 0.25)); xs.push(px); ys.push(py); }
      ts.push(s(t)); xs.push(cx); ys.push(cy);
    });
    return [lerp(f, ts, xs), lerp(f, ts, ys) + 60, z];
  };
  const legY: Record<string, number> = { pergunta: 1350, dor: 300, lista: 1300, abasA: 1460, abasB: 300, contador: 860, pasta: 1380, frase: 300, cta: 1060 };
  return (
    <AbsoluteFill style={{ background: C.marca, fontFamily }}>
      <Fundo f={f} />
      {cena === "pergunta" && <CartaoPergunta f={f - ini + 75} />}
      {cena === "dor" && <Busca f={f} ini={ini} />}
      {cena === "lista" && <Janela x={40} y={220} w={1000} h={1000} foco={focoLista} entrou={entrou}><TelaLista f={f} /></Janela>}
      {cena === "abasA" && <Janela x={40} y={160} w={1000} h={760} foco={focoAba([[13.0, 1], [14.9, 4], [16.0, 5]], 2.6)} rot={-8} entrou={entrou}><TelaFicha f={f} citada={citadaA} /></Janela>}
      {cena === "abasA" && <Pilulas f={f} itens={[["Entrevista", 14.2], ["Estudo de caso", 14.9], ["Rastreio", 16.0]]} top={1000} />}
      {cena === "abasB" && <Janela x={40} y={820} w={1000} h={760} foco={focoAba([[16.8, 9], [19.1, 12], [19.6, 15]], 2.6)} rot={8} entrou={entrou}><TelaFicha f={f} citada={citadaB} /></Janela>}
      {cena === "abasB" && <Pilulas f={f} itens={[["Plano Educacional Individualizado", 16.9], ["Chamada", 19.1], ["Parecer", 19.6]]} top={430} />}
      {cena === "contador" && <Janela x={140} y={220} w={800} h={450} foco={[960, 540, 1.0]} entrou={entrou}><TelaFicha f={f} citada={-1} /></Janela>}
      {cena === "contador" && <Contador f={f} />}
      {cena === "pasta" && <PastaUnica f={f} ini={ini} />}
      {cena === "frase" && <Frase f={f} />}
      {cena === "cta" && <Janela x={40} y={190} w={1000} h={675} foco={[1100, 540, 1.2]} entrou={entrou}><TelaInicio /></Janela>}
      {cena === "cta" && <BotaoBio f={f} />}
      {cena === "final" && <Final f={f} ini={ini} />}
      {cena !== "final" && cena !== "contador" && !(cena === "frase" && f >= s(26.6)) && <Legenda f={f} desde={ini} y={legY[cena] ?? 1300} />}
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      <Audio src={staticFile("prop1/narracao.mp3")} />
      {/* 09/11/2026, dono: propaganda sem música, só efeitos (whoosh nas trocas, pop nas pílulas, cliques, ding) */}
      <Audio src={staticFile("prop1/efeitos.wav")} volume={0.55} />
    </AbsoluteFill>
  );
};
