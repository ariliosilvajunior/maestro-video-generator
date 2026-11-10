// Propaganda 1 — "Ficha do aluno" (09/11/2026). Vertical 1080x1920, 30 s.
// Estilo pedido pelo dono: o apresentador muda de posição (skill propaganda-rc §2b, layouts L1–L5) + motion graphics.
// Telas recriadas a partir dos prints TL22–TL31 com dados FICTÍCIOS (LGPD). Avatar: recorte em fundo verde (alpha webm).
import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Cursor, Foto, Menu, ease, fontFamily, lerp } from "../kit/kit";
import palavras from "../../public/prop1/words.json";

const FPS = 30;
const s = (seg: number) => Math.round(seg * FPS);
export const DURACAO_FICHA = s(30);

type Layout = "L1" | "L2" | "L3" | "L4" | "L5";
// [início em s, layout, cena]
const SEG: [number, Layout, string][] = [
  [0, "L1", "pergunta"],
  [3.4, "L2", "dor"],
  [7.3, "L3", "lista"],
  [11.0, "L4", "abas"],
  [15.6, "L3", "contador"],
  [20.4, "L5", "pasta"],
  [22.2, "L2", "frase"],
  [25.3, "L4", "cta"],
  [28.4, "L5", "final"],
];
const segAtual = (f: number) => {
  let i = 0;
  for (let k = 0; k < SEG.length; k++) if (f >= s(SEG[k][0])) i = k;
  return { i, ini: s(SEG[i][0]), fim: i + 1 < SEG.length ? s(SEG[i + 1][0]) : DURACAO_FICHA, layout: SEG[i][1], cena: SEG[i][2] };
};

const CORRIGE: Record<string, string> = { recursos: "Recursos", "cognitivos,": "Cognitivos," };

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

// ---------------------------------------------------------------- telas recriadas (1920x1080, dados fictícios)
const ALUNOS = [
  ["2026041", "Lucas Andrade Silva", "E.M. Jardim das Flores"],
  ["2026058", "Marina Costa Rocha", "E.M. Jardim das Flores"],
  ["2026063", "Pedro Henrique Lima", "E.E. Monte Verde"],
  ["2026077", "Sofia Martins Duarte", "E.E. Monte Verde"],
];
const Barra: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 262, background: C.side, color: "#fff", paddingLeft: 28, fontFamily }}>
    <Img src={staticFile("logo.png")} style={{ width: 200, marginTop: 30 }} />
    <div style={{ fontSize: 13, marginTop: 50, marginBottom: 12, fontWeight: 500 }}>Menu Principal</div>
    {Menu.slice(0, 12).map((m) => (
      <div key={m} style={{ fontSize: 15, height: 40, display: "flex", alignItems: "center", gap: 12, color: m === "Alunos" ? C.teal : "#fff" }}>
        <span style={{ width: 14, height: 14, borderRadius: 3, background: m === "Alunos" ? C.teal : "#fff", opacity: 0.85 }} />{m}
      </div>
    ))}
  </div>
);
const Topo: React.FC = () => (
  <div style={{ position: "absolute", left: 262, right: 0, top: 0, height: 62, background: C.top, color: "#bbb", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontFamily }}>Versão BETA</div>
);

const TelaLista: React.FC<{ f: number }> = ({ f }) => {
  const hl = lerp(f, [s(8.6), s(9.0)], [0, 1]);
  return (
    <div style={{ position: "absolute", width: 1920, height: 1080, background: C.fundo, fontFamily, overflow: "hidden" }}>
      <Barra /><Topo />
      <div style={{ position: "absolute", left: 290, right: 30, top: 86, display: "flex", gap: 14 }}>
        {["Todas as escolas…", "Todas as turmas…", "Ativo"].map((t, k) => (
          <div key={k} style={{ flex: k === 2 ? 0.6 : 1, height: 46, background: "#fff", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 16, color: "#555", fontSize: 18 }}>{t}</div>
        ))}
        <div style={{ width: 150, height: 46, background: C.azul, color: "#fff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>+ Novo Aluno</div>
      </div>
      <div style={{ position: "absolute", left: 290, right: 30, top: 160, background: "#fff", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ display: "flex", background: C.cab, color: "#fff", fontSize: 19, fontWeight: 600, height: 54, alignItems: "center", paddingLeft: 20 }}>
          <span style={{ width: 200 }}>Matrícula</span><span style={{ width: 520 }}>Nome do aluno</span><span style={{ flex: 1 }}>Escola</span><span style={{ width: 230 }}>Ações</span>
        </div>
        {ALUNOS.map((a, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", height: 104, paddingLeft: 20, fontSize: 21, color: "#222", borderBottom: "1px solid #e3e6ea",
            background: k === 0 ? `rgba(46,196,201,${0.18 * hl})` : "#fff" }}>
            <span style={{ width: 200 }}>{a[0]}</span><span style={{ width: 520, fontWeight: k === 0 ? 600 : 400 }}>{a[1]}</span><span style={{ flex: 1 }}>{a[2]}</span>
            <span style={{ width: 230, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ background: C.ciano, color: "#fff", borderRadius: 3, textAlign: "center", fontSize: 15, padding: "5px 0", width: 190 }}>Pré-visualizar</span>
              <span style={{ background: C.cinza, color: "#fff", borderRadius: 3, textAlign: "center", fontSize: 15, padding: "5px 0", width: 190, transform: k === 0 ? `scale(${1 - 0.08 * lerp(f, [s(9.0), s(9.15), s(9.3)], [0, 1, 0])})` : undefined }}>Visualizar</span>
            </span>
          </div>
        ))}
      </div>
      <Cursor f={f} pontos={[[s(7.4), 1500, 900], [s(8.8), 1745, 296], [s(10.8), 1745, 296]]} cliques={[s(9.05)]} />
    </div>
  );
};

const ABAS = ["01 - Ficha/Aluno", "02 - Entrevista/Responsável", "03 - Concordância", "04 - Atestado/Presença", "05 - Estudo/Caso", "06 - Rastreio",
  "07 - Plano/Trabalho", "08 - Avaliação/PAPE", "09 - PDI/PAEE", "10 - ACI/PEI", "11 - ACI.PEI/Ass.Prof", "12 - Avaliação/Prof.AEE", "13 - Chamada",
  "14 - AtaAEE/Reunião", "15 - Monitor/Intérprete", "16 - Parecer/1ºSemestre", "17 - Parecer/2ºSemestre", "18 - Dashboard/Aulas", "19 - Dashboard/Rastreio",
  "20 - Relatório/Rastreio", "21 - Terminalidade", "22 - Plano/Adaptação", "24 - Checklist/Prof.AEE", "Documentos"];

const TelaFicha: React.FC<{ f: number; acesas: number }> = ({ f, acesas }) => (
  <div style={{ position: "absolute", width: 1920, height: 1080, background: C.fundo, fontFamily, overflow: "hidden" }}>
    <Barra /><Topo />
    <div style={{ position: "absolute", left: 290, right: 30, top: 80, display: "flex", flexWrap: "wrap", gap: 6 }}>
      {ABAS.map((a, k) => {
        const on = k < acesas;
        return <div key={a} style={{ padding: "8px 14px", fontSize: 16, borderRadius: 3, color: "#fff", background: on ? C.teal : C.azul,
          boxShadow: on ? `0 0 18px ${C.teal}` : "none", transform: `scale(${on ? 1.04 : 1})` }}>{a}</div>;
      })}
    </div>
    <div style={{ position: "absolute", left: 290, top: 270, width: 1150, height: 760, background: "#fff", borderRadius: 4, padding: 30 }}>
      <div style={{ textAlign: "center", fontSize: 30, fontWeight: 600, color: "#222" }}>Informações Pessoais</div>
      {[["Nome do Aluno", "Lucas Andrade Silva"], ["Data de nascimento", "14/03/2016"], ["Escola", "E.M. Jardim das Flores"], ["Turma", "4º ano B — Sala 12"], ["Atendimento AEE", "Terça e quinta, 14h"]].map(([r, v], k) => (
        <div key={r} style={{ marginTop: 26, opacity: lerp(f, [s(11.2) + k * 4, s(11.5) + k * 4], [0, 1]) }}>
          <div style={{ fontSize: 19, fontWeight: 600, color: "#333" }}>{r}</div>
          <div style={{ marginTop: 8, height: 50, border: "1px solid #ced4da", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 16, fontSize: 22, color: "#222" }}>{v}</div>
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 1470, top: 270, width: 420, height: 520, background: "#fff", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 22 }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: "#222", marginBottom: 18 }}>Foto do Aluno</div>
      <Foto w={300} h={360} />
    </div>
  </div>
);

const TelaInicio: React.FC = () => (
  <div style={{ position: "absolute", width: 1920, height: 1080, background: C.fundo, fontFamily, overflow: "hidden" }}>
    <Barra /><Topo />
    <div style={{ position: "absolute", left: 300, right: 40, top: 100, height: 90, background: C.azul, color: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 600 }}>Seja bem-vindo ao Recursos Cognitivos!</div>
    {[["ALUNOS", "38", C.azul], ["ESCOLAS", "2", C.azul], ["TURMAS", "14", C.teal]].map(([t, n, cor], k) => (
      <div key={t} style={{ position: "absolute", left: 300 + k * 540, top: 230, width: 510, height: 170, background: cor, color: "#fff", borderRadius: 6, padding: 24 }}>
        <div style={{ fontSize: 22, opacity: 0.9 }}>{t}</div><div style={{ fontSize: 60, fontWeight: 700 }}>{n}</div>
      </div>
    ))}
  </div>
);

// Janela da tela, escalada e com moldura
const Janela: React.FC<{ children: React.ReactNode; x: number; y: number; w: number; foco?: [number, number, number] }> = ({ children, x, y, w, foco }) => {
  // foco = [cx, cy, zoom] em pixels da tela 1920x1080
  const z = foco ? foco[2] : 1;
  const h = (w / 1920) * 1080;
  const esc = (w / 1920) * z;
  const ox = foco ? w / 2 - foco[0] * esc : 0;
  const oy = foco ? h / 2 - foco[1] * esc : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 26, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.55), 0 0 0 3px rgba(46,196,201,.5)" }}>
      <div style={{ position: "absolute", left: ox, top: oy, width: 1920, height: 1080, transform: `scale(${esc})`, transformOrigin: "0 0" }}>{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------- apresentador (recorte em fundo verde)
const Apresentador: React.FC<{ f: number; layout: Layout; desde: number }> = ({ f, layout, desde }) => {
  const { fps } = useVideoConfig();
  if (layout === "L5") return null;
  const pop = spring({ frame: f - desde, fps, config: { damping: 13, stiffness: 160 } });
  const pos: Record<string, { w: number; x: number; y: number }> = {
    L1: { w: 820, x: 130, y: 1920 - 820 + 20 },
    L2: { w: 1500, x: -210, y: 1920 - 1500 + 40 },
    L3: { w: 1000, x: 40, y: 1920 - 1000 + 30 },
    L4: { w: 560, x: -30, y: 1920 - 560 + 10 },
  };
  const p = pos[layout];
  return (
    <div style={{ position: "absolute", left: p.x, top: p.y + (1 - pop) * 160, width: p.w, height: p.w, opacity: Math.min(1, pop * 1.4),
      filter: "drop-shadow(0 20px 40px rgba(0,0,0,.45))" }}>
      <OffthreadVideo src={staticFile("prop1/avatar_alpha.webm")} transparent muted style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

// ---------------------------------------------------------------- legenda cinética (1–2 palavras)
const Legenda: React.FC<{ f: number; y: number; cor?: string }> = ({ f, y, cor = "#fff" }) => {
  const { fps } = useVideoConfig();
  const t = f / FPS;
  const ps = (palavras as [string, number, number][]).map(([p, a, b]) => [CORRIGE[p] ?? p, a, b] as [string, number, number]);
  const idx = ps.findIndex(([, a], k) => t >= a - 0.05 && (k + 1 >= ps.length || t < ps[k + 1][1] - 0.05));
  if (idx < 0 || t > ps[ps.length - 1][2] + 0.4) return null;
  const ini = idx % 2 === 0 ? idx : idx - 1;
  const grupo = ps.slice(ini, ini + 2);
  const pop = spring({ frame: f - Math.round(ps[ini][1] * FPS), fps, config: { damping: 12, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", justifyContent: "center", gap: 22, fontFamily, transform: `scale(${0.85 + 0.15 * pop})` }}>
      {grupo.map(([p], k) => (
        <span key={k} style={{ fontSize: 86, fontWeight: 700, color: ini + k === idx ? C.teal : cor, textShadow: "0 6px 18px rgba(0,0,0,.7), 0 0 2px #000", letterSpacing: -1 }}>{p}</span>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- cenas de motion
const CartaoPergunta: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const e = spring({ frame: f - 4, fps, config: { damping: 14 } });
  const docs = [["📁", "Ficha do aluno", -330, 380], ["📄", "Estudo de caso", 300, 330], ["✉️", "PEI no e-mail", -260, 720], ["❓", "Parecer?", 320, 690]];
  return (
    <>
      {docs.map(([ic, txt, dx, y], k) => {
        const a = spring({ frame: f - 10 - k * 9, fps, config: { damping: 11 } });
        const balanca = Math.sin((f + k * 20) / 9) * 6;
        return (
          <div key={k} style={{ position: "absolute", left: 540 + (dx as number) * a - 170, top: (y as number) + (1 - a) * 300, width: 340, padding: "22px 20px", background: "#fff", borderRadius: 18,
            transform: `rotate(${(k % 2 ? 7 : -8) + balanca}deg) scale(${a})`, boxShadow: "0 20px 50px rgba(0,0,0,.4)", fontFamily, fontSize: 32, fontWeight: 600, color: C.marca, display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 46 }}>{ic}</span>{txt}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 90, right: 90, top: 120, background: "#fff", borderRadius: 28, padding: "30px 36px", fontFamily, transform: `translateY(${(1 - e) * -220}px)`, opacity: e,
        boxShadow: "0 24px 60px rgba(0,0,0,.45)", display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: C.teal, color: "#fff", fontSize: 44, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>?</div>
        <div>
          <div style={{ fontSize: 28, color: "#667" }}>Todo professor de AEE já perguntou:</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: "#111", marginTop: 6 }}>"Cadê a ficha desse aluno?"</div>
        </div>
      </div>
    </>
  );
};

const PillsAbas: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const itens: [string, number][] = [["Entrevista", 12.0], ["Estudo de caso", 12.9], ["Rastreio", 14.1], ["PEI", 14.9]];
  return (
    <>
      {itens.map(([t, ts], k) => {
        const a = spring({ frame: f - s(ts), fps, config: { damping: 12, stiffness: 180 } });
        if (f < s(ts)) return null;
        return (
          <div key={t} style={{ position: "absolute", right: 60, top: 760 + k * 150, padding: "22px 40px", background: k % 2 ? C.teal : "#fff", color: k % 2 ? "#fff" : C.marca,
            fontFamily, fontSize: 52, fontWeight: 700, borderRadius: 60, transform: `translateX(${(1 - a) * 700}px) rotate(${(1 - a) * 12}deg)`, boxShadow: "0 18px 40px rgba(0,0,0,.4)" }}>✓ {t}</div>
        );
      })}
    </>
  );
};

const Contador: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const n = Math.round(lerp(f, [s(17.2), s(18.3)], [0, 24]));
  const a = spring({ frame: f - s(17.2), fps, config: { damping: 10 } });
  if (f < s(17.0)) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontFamily, color: "#fff", transform: `scale(${a})` }}>
      <span style={{ fontSize: 210, fontWeight: 800, color: C.teal, textShadow: "0 0 40px rgba(46,196,201,.6)" }}>+{Math.max(n, 0)}</span>
      <span style={{ fontSize: 80, fontWeight: 700, marginLeft: 18 }}>abas</span>
      <div style={{ fontSize: 44, fontWeight: 500, opacity: lerp(f, [s(18.9), s(19.3)], [0, 1]) }}>ligadas ao <b style={{ color: C.teal }}>mesmo aluno</b></div>
    </div>
  );
};

const PastaUnica: React.FC<{ f: number; ini: number }> = ({ f, ini }) => {
  const { fps } = useVideoConfig();
  const g = f - ini;
  const nomes = ["Entrevista", "Estudo de caso", "Rastreio", "PEI", "Chamada", "Parecer"];
  const ab = spring({ frame: g - 26, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ fontFamily }}>
      {nomes.map((n, k) => {
        const ang = (k / nomes.length) * Math.PI * 2;
        const t = lerp(g, [k * 2, 16 + k * 2], [0, 1]);
        const x = 540 + Math.cos(ang) * 470 * (1 - t) - 140;
        const y = 860 + Math.sin(ang) * 640 * (1 - t) - 50;
        return <div key={n} style={{ position: "absolute", left: x, top: y, width: 280, padding: "18px 0", textAlign: "center", background: "#fff", color: C.marca, borderRadius: 14, fontSize: 32, fontWeight: 700,
          transform: `scale(${1 - 0.6 * t}) rotate(${(1 - t) * (k % 2 ? 20 : -20)}deg)`, opacity: 1 - lerp(g, [14 + k * 2, 18 + k * 2], [0, 1]), boxShadow: "0 14px 30px rgba(0,0,0,.35)" }}>{n}</div>;
      })}
      <div style={{ position: "absolute", left: 540 - 200, top: 760, width: 400, height: 300, transform: `scale(${0.6 + 0.4 * spring({ frame: g, fps, config: { damping: 14 } })})` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 170, height: 60, background: "#f5b942", borderRadius: "16px 16px 0 0" }} />
        <div style={{ position: "absolute", left: 0, top: 40, width: 400, height: 260, background: "#fbc95a", borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: C.marca }}>Lucas · Ficha</div>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 360, background: "#fff", borderRadius: 24, padding: 30, display: "flex", gap: 26, transform: `translateY(${(1 - ab) * 600}px) scale(${0.7 + 0.3 * ab})`, opacity: ab,
        boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <Foto w={190} h={228} />
        <div style={{ fontSize: 30, color: "#222", lineHeight: 1.55 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.marca }}>Lucas Andrade Silva</div>
          <div>Turma: 4º ano B — Sala 12</div><div>AEE: terça e quinta, 14h</div>
          <div style={{ color: C.verde, fontWeight: 700 }}>✓ PEI · Rastreio · Parecer em dia</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Frase: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const a = spring({ frame: f - s(22.3), fps, config: { damping: 12 } });
  const b = spring({ frame: f - s(23.8), fps, config: { damping: 12 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontFamily, fontWeight: 800, lineHeight: 1.05 }}>
      <div style={{ fontSize: 130, color: "#fff", transform: `scale(${a})`, textDecoration: "line-through", textDecorationColor: C.verm, textDecorationThickness: 12 }}>PAPEL</div>
      <div style={{ fontSize: 150, color: C.teal, transform: `scale(${b})`, textShadow: "0 0 50px rgba(46,196,201,.5)" }}>ALUNO</div>
    </div>
  );
};

const BotaoBio: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const a = spring({ frame: f - s(26.4), fps, config: { damping: 10 } });
  const pulso = 1 + 0.05 * Math.sin(f / 4);
  if (f < s(26.3)) return null;
  return (
    <div style={{ position: "absolute", right: 70, top: 1250, padding: "34px 50px", background: C.teal, color: "#fff", fontFamily, fontSize: 56, fontWeight: 800, borderRadius: 80,
      transform: `scale(${a * pulso})`, boxShadow: "0 0 0 10px rgba(46,196,201,.25), 0 20px 50px rgba(0,0,0,.45)" }}>👉 Link na bio</div>
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
  const { ini, layout, cena } = segAtual(f);
  const flash = interpolate(f - ini, [0, 3], [0.35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoomLeve = lerp(f - ini, [0, 140], [1, 1.06]);
  const acesas = cena === "abas" ? [12.0, 12.9, 14.1, 14.9].filter((t) => f >= s(t)).length * 3 + 1 : Math.round(lerp(f, [s(15.6), s(18.3)], [12, 24]));
  return (
    <AbsoluteFill style={{ background: C.marca, fontFamily }}>
      <Fundo f={f} />
      {cena === "pergunta" && <CartaoPergunta f={f - ini} />}
      {cena === "lista" && <Janela x={40} y={170} w={1000} foco={[1200, 330, 1.35 * zoomLeve]}><TelaLista f={f} /></Janela>}
      {cena === "abas" && <Janela x={-420} y={140} w={1700} foco={[1000, 300, 1.25 * zoomLeve]}><TelaFicha f={f} acesas={acesas} /></Janela>}
      {cena === "contador" && <Janela x={40} y={150} w={1000} foco={[1100, 220, 1.6]}><TelaFicha f={f} acesas={acesas} /></Janela>}
      {cena === "pasta" && <PastaUnica f={f} ini={ini} />}
      {cena === "cta" && <Janela x={40} y={180} w={1000} foco={[1095, 250, 1.28 * zoomLeve]}><TelaInicio /></Janela>}
      {cena === "final" && <Final f={f} ini={ini} />}
      {cena === "abas" && <PillsAbas f={f} />}
      {cena === "contador" && <Contador f={f} />}
      {cena === "frase" && <Frase f={f} />}
      <Apresentador f={f} layout={layout} desde={ini} />
      {cena === "cta" && <BotaoBio f={f} />}
      {cena !== "final" && cena !== "contador" && cena !== "frase" && <Legenda f={f} y={layout === "L1" ? 1010 : layout === "L2" ? 300 : layout === "L4" ? 1180 : layout === "L5" ? 200 : 900} />}
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      <Audio src={staticFile("prop1/narracao.mp3")} />
      <Audio src={staticFile("prop1/musica.mp3")} volume={(fr) => (fr < s(28.3) ? 0.06 : interpolate(fr, [s(28.3), s(28.8), s(29.4), s(30)], [0.06, 0.25, 0.25, 0], { extrapolateRight: "clamp" }))} />
    </AbsoluteFill>
  );
};
