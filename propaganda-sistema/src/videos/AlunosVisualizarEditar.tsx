/** Propaganda 01 (03/11/2026): lista de alunos → Pré-visualizar (foto) → Fechar → Editar (ficha). Dados e foto FICTÍCIOS. */
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Botao, C, Cursor, Final, Foto, Legenda, Moldura, fontFamily, lerp } from "../kit/kit";

// Tempos (30 fps)
const T = { cliquePre: 58, fechar: 178, cliqueEditar: 222, ficha: 232, fim: 420 };

// ---------- tela 1: lista ----------
const Alunos = [["6948254", "Ana Clara Menezes"], ["7100002", "Lucas Andrade Souza"], ["6948365", "Pedro Henrique Lima"], ["6786062", "Beatriz Fontes Ramos"]];

const Lista: React.FC<{ f: number }> = ({ f }) => {
  const busca = "Lucas".slice(0, Math.max(0, Math.floor((f - 8) / 4)));
  const pressPre = f >= T.cliquePre - 2 && f <= T.cliquePre + 4 ? 1 : 0;
  const pressEd = f >= T.cliqueEditar - 2 && f <= T.cliqueEditar + 4 ? 1 : 0;
  const campo = (t: string, w: number) => (
    <div style={{ width: w, height: 42, background: "#fff", borderRadius: 4, display: "flex", alignItems: "center", padding: "0 18px", fontSize: 17, justifyContent: "space-between" }}>{t}<span style={{ fontSize: 11 }}>▼</span></div>
  );
  return (
    <div style={{ padding: "18px 14px", fontFamily }}>
      <div style={{ display: "flex", gap: 12 }}>
        {campo("Todas as escolas...", 620)}{campo("Todas as turmas...", 620)}{campo("Ativo", 240)}
        <div style={{ width: 100, height: 42, background: C.azul, color: "#fff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>Filtrar</div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <div style={{ flex: 1, height: 40, background: "#fff", border: "2px solid #8ab4f8", borderRadius: 4, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 18, color: busca ? "#222" : "#999" }}>
          {busca || "Nome do aluno contém..."}{f > 8 && f < 40 && Math.floor(f / 8) % 2 === 0 ? "|" : ""}
        </div>
        <div style={{ width: 136, height: 40, background: C.azul, color: "#fff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>⬇ Download</div>
        <div style={{ width: 144, height: 40, background: C.azul, color: "#fff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>+ Novo Aluno</div>
      </div>
      <div style={{ marginTop: 10, background: "#fff" }}>
        <div style={{ height: 50, background: C.cab, color: "#fff", display: "flex", alignItems: "center", fontSize: 17, fontWeight: 600 }}>
          <span style={{ width: 240, paddingLeft: 12 }}>Matrícula</span><span style={{ width: 556 }}>Nome Aluno</span><span style={{ width: 556 }}>Escola</span><span>Ações</span>
        </div>
        {Alunos.map(([m, n], i) => {
          const destaque = i === 1 ? lerp(f, [30, 44], [0, 1]) : 0;
          return (
            <div key={m} style={{ height: 159, display: "flex", alignItems: "center", fontSize: 17, background: i % 2 ? "#ececec" : "#fff", borderTop: "1px solid #ddd", boxShadow: destaque ? `inset 6px 0 0 ${C.teal}` : "none" }}>
              <span style={{ width: 240, paddingLeft: 12 }}>{m}</span><span style={{ width: 556, fontWeight: destaque > 0.5 ? 600 : 400 }}>{n}</span><span style={{ width: 556 }}>Escola Estadual Modelo</span>
              <div style={{ display: "grid", gridTemplateColumns: "102px 102px", gap: "10px 10px" }}>
                <div style={{ gridColumn: "1 / span 2" }}><Botao cor={C.ciano} texto="Pré-visualizar" w={214} press={i === 1 ? pressPre : 0} /></div>
                <Botao cor={C.cinza} texto="Visualizar" /><Botao cor={C.azul} texto="Editar" press={i === 1 ? pressEd : 0} />
                <Botao cor={C.verde} texto="Ativado" /><Botao cor={C.verm} texto="Excluir" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- tela 2: pré-visualização ----------
const Modal: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const abre = spring({ frame: f - T.cliquePre - 2, fps, config: { damping: 16, stiffness: 140 } });
  const fecha = lerp(f, [T.fechar + 2, T.fechar + 14], [1, 0]);
  const vis = Math.min(abre, fecha);
  if (vis <= 0.001) return null;
  const dados = [["Nome", "Lucas Andrade Souza"], ["Avaliação", "Por Nota"], ["Atendimento", "Quarta-feira - 13:00 às 13:50"], ["Turno AEE", "Matutino/Manhã"], ["Turno Sala", "Vespertino/Tarde"], ["Turma", "109 - SALA 06"], ["Sala", "06"], ["Contato Responsável", "(51) 90000-0000"], ["Matrícula", "7100002"]];
  const pressF = f >= T.fechar - 2 && f <= T.fechar + 3 ? 1 : 0;
  return (
    <AbsoluteFill style={{ background: `rgba(0,0,0,${0.5 * vis})`, fontFamily }}>
      <div style={{ position: "absolute", left: 552, top: 26, width: 800, height: 700, background: "#fff", borderRadius: 4, opacity: vis, transform: `translateY(${(1 - vis) * -40}px) scale(${0.94 + 0.06 * vis})` }}>
        <div style={{ height: 68, borderBottom: "1px solid #e5e5e5", display: "flex", alignItems: "center", padding: "0 16px", fontSize: 25, justifyContent: "space-between" }}>Pré-visualização do Aluno<span style={{ color: "#888" }}>✕</span></div>
        <div style={{ display: "flex", padding: "16px 30px", gap: 30 }}>
          <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 10, transform: `scale(${spring({ frame: f - T.cliquePre - 8, fps, config: { damping: 12 } })})` }}><Foto w={200} h={300} /></div>
          <div style={{ fontSize: 17, lineHeight: "40px" }}>
            {dados.map(([k, v], i) => (
              <div key={k} style={{ opacity: lerp(f, [T.cliquePre + 10 + i * 4, T.cliquePre + 18 + i * 4], [0, 1]), transform: `translateX(${lerp(f, [T.cliquePre + 10 + i * 4, T.cliquePre + 18 + i * 4], [20, 0])}px)` }}><b>{k}:</b> <span style={{ color: "#555" }}>{v}</span></div>
            ))}
          </div>
        </div>
        <div style={{ padding: "4px 30px", fontSize: 17, lineHeight: "25px", opacity: lerp(f, [T.cliquePre + 50, T.cliquePre + 60], [0, 1]) }}>
          <b>Necessidades do Aluno:</b><br /><span style={{ color: "#444" }}>Recomenda-se a organização de atividades em duplas e/ou pequenos grupos, promovendo interação, socialização, cooperação e aprendizagem colaborativa.</span>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 78, borderTop: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 20 }}>
          <Botao cor="#6c757d" texto="Fechar" w={82} press={pressF} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- tela 3: ficha (Editar) ----------
const Abas = ["01 - Ficha/Aluno", "02 - Entrevista/Responsável", "03 - Concordância", "04 - Atestado/Presença", "05 - Estudo/Caso", "06 - Rastreio", "07 - Plano/Trabalho", "08 - Avaliação/PAPE", "09 - PDI/PAEE", "10 - ACI/PEI", "11 - ACI.PEI/Ass.Prof", "12 - Avaliação/Prof.AEE", "13 - Chamada", "14 - AtaAEE/Reunião", "15 - Monitor/Intérpreter", "16 - Parecer/1ºSemestre", "17 - Parecer/2ºSemestre", "18 - Dashboard/Aulas", "19 - Dashboard/Rastreio", "20 - Relatório/Rastreio", "21 - Terminalidade", "22 - Plano/Adaptação", "24 - Checklist/Prof.AEE", "Documentos", "Relatório das Avaliações"];

const Ficha: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const g = f - T.ficha;
  const campo = (rot: string, valor: string, w: number, i: number, cinza = false) => {
    const n = Math.max(0, Math.min(valor.length, Math.floor((g - 20 - i * 5) * 1.6)));
    return (
      <div style={{ width: w }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{rot}</div>
        <div style={{ height: 38, border: "1px solid #ced4da", borderRadius: 4, background: cinza ? "#e9ecef" : "#fff", display: "flex", alignItems: "center", padding: "0 12px", fontSize: 16, color: "#444", boxShadow: n > 0 && n < valor.length ? `0 0 0 3px ${C.teal}55` : "none" }}>{valor.slice(0, n)}</div>
      </div>
    );
  };
  return (
    <div style={{ padding: "12px 14px", fontFamily, background: "#f1f3f5", height: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", width: 1540 }}>
        {Abas.map((a, i) => (
          <div key={a} style={{ height: 39, padding: "0 16px", display: "flex", alignItems: "center", fontSize: 16, background: i === 0 ? "#fff" : C.azul, color: i === 0 ? "#222" : "#fff", borderRight: "1px solid #ffffff22", opacity: lerp(g, [i * 0.6, 6 + i * 0.6], [0, 1]) }}>{a}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        <div style={{ width: 1198 }}>
          <div style={{ background: "#fff", borderRadius: 6, padding: "14px 16px 24px" }}>
            <div style={{ textAlign: "center", fontSize: 21, fontWeight: 600, marginBottom: 14 }}>Informações Pessoais</div>
            <div style={{ display: "flex", gap: 12 }}>{campo("ID", "283", 186, 0, true)}{campo("Nome do Aluno", "Lucas Andrade Souza", 772, 1)}{campo("Telefone Aluno", "(00) 00000-0000", 186, 2)}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>{campo("Data de nascimento", "12/03/2011", 186, 3)}{campo("Idade atual", "15", 186, 4, true)}{campo("Gênero", "Masculino", 282, 5)}{campo("Etnia", "Pardo", 282, 6)}{campo("Estado Civil", "Solteiro", 186, 7)}</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 6, padding: "14px 16px 24px", marginTop: 16 }}>
            <div style={{ textAlign: "center", fontSize: 21, fontWeight: 600, marginBottom: 14 }}>Informações dos responsáveis</div>
            <div style={{ display: "flex", gap: 12 }}>{campo("Nome do pai", "Marcos Souza", 380, 8)}{campo("Nome da mãe", "Ana Paula Andrade", 380, 9)}{campo("Nome do Responsável", "Ana Paula Andrade", 380, 10)}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>{campo("E-mail do responsável", "responsavel@exemplo.com", 380, 11)}{campo("Telefone responsável", "(51) 90000-0000", 380, 12)}{campo("Telefone responsável 2", "(51) 90000-0001", 380, 13)}</div>
          </div>
        </div>
        <div style={{ width: 380, background: "#fff", borderRadius: 6, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 21, fontWeight: 600, marginBottom: 14 }}>Foto do Aluno</div>
          <div style={{ transform: `scale(${spring({ frame: g - 12, fps, config: { damping: 13 } })})` }}><Foto w={348} h={420} /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}><Botao cor={C.verm} texto="Remover" w={96} /><Botao cor={C.azul} texto="Alterar" w={80} /></div>
        </div>
      </div>
    </div>
  );
};

const pontos: [number, number, number][] = [
  [0, 1250, 760], [26, 1000, 152], [44, 1000, 152], [T.cliquePre - 4, 1741, 425], [T.cliquePre + 30, 1741, 425],
  [T.fechar - 6, 1291, 687], [T.fechar + 10, 1291, 687], [T.cliqueEditar - 4, 1798, 472], [T.ficha + 10, 1798, 472], [T.ficha + 40, 1250, 420],
];
const legendas: [number, number, string][] = [[6, 54, "Encontre o aluno em segundos"], [62, 200, "Tudo dele num clique"], [T.ficha + 6, T.fim - 4, "Ficha completa com os documentos do AEE"]];

export const AlunosVisualizarEditar: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const naFicha = f >= T.ficha;
  // câmera: leve aproximação em cada momento
  const zoom = naFicha ? lerp(f, [T.ficha, T.fim], [1.0, 1.06]) : lerp(f, [0, T.cliquePre - 6, T.cliquePre + 6, T.fechar], [1.0, 1.0, 1.0, 1.0]);
  const origem = naFicha ? "0% 30%" : f < T.cliquePre ? "100% 35%" : "60% 40%";
  const troca = lerp(f, [T.ficha - 6, T.ficha + 8], [0, 1]);
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: origem }}>
        <Moldura>
          {!naFicha || troca < 1 ? <div style={{ opacity: 1 - troca }}><Lista f={f} /></div> : null}
          {troca > 0 ? <div style={{ position: "absolute", inset: 0, opacity: troca, transform: `translateY(${(1 - troca) * 30}px)` }}><Ficha f={f} fps={fps} /></div> : null}
        </Moldura>
        <Modal f={f} fps={fps} />
        {f < T.fim ? <Cursor f={f} pontos={pontos} cliques={[T.cliquePre, T.fechar, T.cliqueEditar]} /> : null}
      </AbsoluteFill>
      <Legenda f={f} fps={fps} itens={legendas} />
      <Final f={f} fps={fps} inicio={T.fim} frase="Tudo do aluno do AEE em um só lugar." />
    </AbsoluteFill>
  );
};
