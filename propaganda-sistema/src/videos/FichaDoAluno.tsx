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
const s = (seg: number) => Math.round(seg * FPS);
export const DURACAO_FICHA = s(33.5);

// [início em s, cena]
const SEG: [number, string][] = [
  [0, "pergunta"], [4.0, "dor"], [9.3, "lista"], [13.0, "abasA"], [16.8, "abasB"], [20.3, "contador"],
  [23.85, "pasta"], [25.4, "frase"], [28.9, "cta"], [31.6, "final"],
];
const segAtual = (f: number) => {
  let i = 0;
  for (let k = 0; k < SEG.length; k++) if (f >= s(SEG[k][0])) i = k;
  return { ini: s(SEG[i][0]), cena: SEG[i][1] };
};
const CORRIGE: Record<string, string> = { recursos: "Recursos", "cognitivos,": "Cognitivos,", plano: "Plano", educacional: "Educacional", individualizado: "Individualizado", "individualizado,": "Individualizado," };

// ---------------------------------------------------------------- fundo da marca (vivo)
const Fundo: React.FC<{ f: number }> = ({ f }) => (
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

const TelaLista: React.FC<{ f: number }> = ({ f }) => {
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

// anel por FORA da aba citada (não muda cor nem formato do botão)
const TelaFicha: React.FC<{ f: number; citada: number }> = ({ f, citada }) => (
  <div style={{ position: "absolute", width: 1920, height: 1080, background: C.fundo, fontFamily, overflow: "hidden" }}>
    <Barra /><Topo />
    <div style={{ position: "absolute", left: 290, right: 30, top: 84, display: "flex", flexWrap: "wrap", gap: 0 }}>
      {ABAS.map((a, k) => {
        const ativa = k === 0;
        const anel = k === citada ? 0.5 + 0.5 * Math.abs(Math.sin(f / 5)) : 0;
        return <div key={a} style={{ padding: "9px 15px", fontSize: 17, borderRadius: "4px 4px 0 0", color: ativa ? "#212529" : "#fff", background: ativa ? C.abaAtiva : C.azul,
          border: "1px solid rgba(255,255,255,.08)", position: "relative", zIndex: k === citada ? 2 : 1,
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

const TelaInicio: React.FC = () => (
  <div style={{ position: "absolute", width: 1920, height: 1080, background: C.fundo, fontFamily, overflow: "hidden" }}>
    <Barra /><Topo />
    <div style={{ position: "absolute", left: 300, right: 40, top: 100, height: 90, background: C.azul, color: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 600 }}>Seja bem vindo ao Recursos Cognitivos!</div>
    {[["ALUNOS", "38", C.azul], ["ESCOLAS", "2", C.azul2], ["TURMAS", "14", C.tealSis]].map(([t, n, cor], k) => (
      <div key={t} style={{ position: "absolute", left: 300 + k * 536, top: 220, width: 512, height: 170, background: cor, color: "#fff", borderRadius: 6, padding: 24 }}>
        <div style={{ fontSize: 22, opacity: 0.9 }}>{t}</div><div style={{ fontSize: 60, fontWeight: 600 }}>{n}</div>
      </div>
    ))}
    {[["SUPERVISORES", "3", C.azul], ["PROFESSORES SALA", "17", C.azul2]].map(([t, n, cor], k) => (
      <div key={t} style={{ position: "absolute", left: 300 + k * 804, top: 410, width: 780, height: 170, background: cor, color: "#fff", borderRadius: 6, padding: 24 }}>
        <div style={{ fontSize: 22, opacity: 0.9 }}>{t}</div><div style={{ fontSize: 60, fontWeight: 600 }}>{n}</div>
      </div>
    ))}
  </div>
);

// Pré-visualização do Aluno (mesmo formato do modal real), dados fictícios
const Previa: React.FC = () => (
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
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 30px 26px" }}><span style={{ background: C.cinza, color: "#fff", borderRadius: 4, padding: "10px 26px", fontSize: 24 }}>Fechar</span></div>
  </div>
);

// Janela da tela: posição/tamanho/inclinação mudam por cena (a dinâmica sem apresentador)
const Janela: React.FC<{ children: React.ReactNode; x: number; y: number; w: number; foco: [number, number, number]; h?: number; rot?: number; entrou?: number }> = ({ children, x, y, w, foco, h, rot = 0, entrou = 1 }) => {
  const hh = h ?? (w / 1920) * 1080;
  const esc = (w / 1920) * foco[2];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: hh, borderRadius: 26, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.55), 0 0 0 3px rgba(46,196,201,.5)",
      transform: `perspective(1600px) rotateY(${rot}deg) translateY(${(1 - entrou) * 260}px) scale(${0.9 + 0.1 * entrou})`, opacity: Math.min(1, entrou * 1.5) }}>
      <div style={{ position: "absolute", left: w / 2 - foco[0] * esc, top: hh / 2 - foco[1] * esc, width: 1920, height: 1080, transform: `scale(${esc})`, transformOrigin: "0 0" }}>{children}</div>
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
  return out.map((gr, k) => ({ pal: gr, ini: gr[0][1], fim: k + 1 < out.length ? out[k + 1][0][1] : gr[gr.length - 1][2] + 0.4 }));
})();
const limpa = (p: string) => p.replace(/[.,?!;:]+$/, "");

const Legenda: React.FC<{ f: number; y: number; desde: number }> = ({ f, y, desde }) => {
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
          <div key={k} style={{ position: "absolute", left: 540 + dx * a - 190, top: y + (1 - a) * 300, width: 380, padding: "26px 22px", background: "#fff", borderRadius: 18,
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
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontSize: 64, fontWeight: 800, color: "#ff6b6b", transform: `scale(${res})`, textShadow: "0 6px 18px rgba(0,0,0,.6)" }}>0 resultados</div>
    </AbsoluteFill>
  );
};

const Pilulas: React.FC<{ f: number; itens: [string, number][]; top: number }> = ({ f, itens, top }) => {
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
  const ab = spring({ frame: g - 22, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ fontFamily }}>
      {nomes.map((n, k) => {
        const ang = (k / nomes.length) * Math.PI * 2;
        const t = lerp(g, [k * 2, 14 + k * 2], [0, 1]);
        return <div key={n} style={{ position: "absolute", left: 540 + Math.cos(ang) * 470 * (1 - t) - 160, top: 900 + Math.sin(ang) * 400 * (1 - t) - 50, width: 320, padding: "18px 0", textAlign: "center",
          background: "#fff", color: C.marca, borderRadius: 14, fontSize: 32, fontWeight: 700, transform: `scale(${1 - 0.6 * t}) rotate(${(1 - t) * (k % 2 ? 20 : -20)}deg)`,
          opacity: 1 - lerp(g, [12 + k * 2, 16 + k * 2], [0, 1]), boxShadow: "0 14px 30px rgba(0,0,0,.35)" }}>{n}</div>;
      })}
      <div style={{ position: "absolute", left: 540 - 200, top: 800, width: 400, height: 300, transform: `scale(${(0.6 + 0.4 * spring({ frame: g, fps, config: { damping: 14 } })) * (1 - 0.6 * ab)})`, opacity: 1 - ab }}>
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
        <div style={{ fontSize: 160, color: C.teal, transform: `scale(${b})`, textShadow: "0 0 50px rgba(46,196,201,.5)" }}>ALUNO</div>
      </div>
    </AbsoluteFill>
  );
};

const BotaoBio: React.FC<{ f: number }> = ({ f }) => {
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

const Final: React.FC<{ f: number; ini: number }> = ({ f, ini }) => {
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
  const legY: Record<string, number> = { pergunta: 1350, dor: 300, lista: 1300, abasA: 1460, abasB: 300, contador: 860, pasta: 1380, frase: 300, cta: 1060 };
  return (
    <AbsoluteFill style={{ background: C.marca, fontFamily }}>
      <Fundo f={f} />
      {cena === "pergunta" && <CartaoPergunta f={f - ini + 75} />}
      {cena === "dor" && <Busca f={f} ini={ini} />}
      {cena === "lista" && <Janela x={40} y={220} w={1000} h={1000} foco={[1180, 430, 1.4 * zl]} entrou={entrou}><TelaLista f={f} /></Janela>}
      {cena === "abasA" && <Janela x={40} y={160} w={1000} h={760} foco={[1000, 150, 1.8 * zl]} rot={-8} entrou={entrou}><TelaFicha f={f} citada={citadaA} /></Janela>}
      {cena === "abasA" && <Pilulas f={f} itens={[["Entrevista", 14.2], ["Estudo de caso", 14.9], ["Rastreio", 16.0]]} top={1000} />}
      {cena === "abasB" && <Janela x={40} y={820} w={1000} h={760} foco={[1000, 165, 1.8 * zl]} rot={8} entrou={entrou}><TelaFicha f={f} citada={citadaB} /></Janela>}
      {cena === "abasB" && <Pilulas f={f} itens={[["Plano Educacional Individualizado", 16.9], ["Chamada", 19.1], ["Parecer", 19.6]]} top={430} />}
      {cena === "contador" && <Janela x={140} y={180} w={800} h={560} foco={[1090, 300, 0.95]} entrou={entrou}><TelaFicha f={f} citada={-1} /></Janela>}
      {cena === "contador" && <Contador f={f} />}
      {cena === "pasta" && <PastaUnica f={f} ini={ini} />}
      {cena === "frase" && <Frase f={f} />}
      {cena === "cta" && <Janela x={40} y={170} w={1000} h={760} foco={[1095, 360, 1.08 * zl]} entrou={entrou}><TelaInicio /></Janela>}
      {cena === "cta" && <BotaoBio f={f} />}
      {cena === "final" && <Final f={f} ini={ini} />}
      {cena !== "final" && cena !== "contador" && !(cena === "frase" && f >= s(26.6)) && <Legenda f={f} desde={ini} y={legY[cena] ?? 1300} />}
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      <Audio src={staticFile("prop1/narracao.mp3")} />
      <Audio src={staticFile("prop1/musica.mp3")} volume={(fr) => (fr < s(31.6) ? 0.06 : interpolate(fr, [s(31.6), s(32.1), s(32.9), s(33.5)], [0.06, 0.25, 0.25, 0], { extrapolateRight: "clamp" }))} />
    </AbsoluteFill>
  );
};
