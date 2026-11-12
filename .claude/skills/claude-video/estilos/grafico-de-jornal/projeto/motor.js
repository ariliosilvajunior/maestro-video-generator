// editorial-paper, versão autoral. Um relógio só: render(t) desenha o quadro inteiro a partir do tempo.
// Sem Math.random, sem Date.now, sem timers. Mesmo t, mesma imagem. Loop de 10 s.

// ---------------------------------------------------------------- variáveis do estilo
const W = 1920, H = 1080, DUR = 10;
const COR = { papel: '#FFF1E5', tinta: '#1A1A1A', regua: '#E3D3C3', apagado: '#6B5E55', azul: '#0F5499' };
const MARGEM = 120;                                     // 12 colunas, margens de 120 px, calha de 32 px
const SERIFA = "'Playfair Display'", SANS = "'Inter'";
const MANCHETE_PX = 116, MANCHETE_Y = 132, MANCHETE_ALT = 156;   // manchete Playfair 700 dentro de uma máscara
const MANCHETES = [['Cinco', 'no', 'páreo'], ['Uma', 'dispara']];
const ESPACO = 30;                                      // entre palavras da manchete

// o gráfico
const LINHAS = [                                        // etapas de um vídeo do canal; v0 = antes, v1 = depois do disparo
  { nome: 'Roteiro', v0: 58, v1: 52, s0: 0, s1: 1 },
  { nome: 'Edição',  v0: 46, v1: 42, s0: 1, s1: 2 },
  { nome: 'Thumb',   v0: 37, v1: 33, s0: 2, s1: 3 },
  { nome: 'Motion',  v0: 29, v1: 74, s0: 3, s1: 0, heroi: true },
  { nome: 'Título',  v0: 21, v1: 18, s0: 4, s1: 4 },
];
const HEROI = LINHAS[3];
const GANHO = HEROI.v1 - HEROI.v0;                      // +45
const X0 = 420, LARGO = 1210, ESTREITO = 740;            // onde as barras começam; largura do gráfico aberto / com a chamada
const LINHA0 = 392, PASSO = 112, BARRA = 72;            // primeira linha, passo entre linhas, altura da barra
const GRADE = [0, 20, 40, 60, 80], GRADE_TOPO = 368, GRADE_BASE = 944, ROTULO_Y = 960;
const CHAMADA_X = 1300, CHAMADA_Y = 360, CHAMADA_ALT = 340, CHAMADA_PX = 280;   // 280 px: o número cabe dentro da margem direita
const ROTULO_CHAMADA = 'pontos a mais', FANTASMA = 'era ' + HEROI.v0;

// ---------------------------------------------------------------- utilidades
const ease = (() => { const c = {}; return n => c[n] || (c[n] = gsap.parseEase(n)); })();
const seg = (t, ini, dur, curva) => ease(curva || 'power3.out')(Math.min(1, Math.max(0, (t - ini) / dur)));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mistura = (a, b, p) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * p)).join(',')})`;
const TINTA = hex(COR.tinta), AZUL = hex(COR.azul), REGUA = hex(COR.regua), APAGADO = hex(COR.apagado);
const linhaY = s => LINHA0 + s * PASSO;

// gerador com semente (nunca Math.random num render)
function semente(s) { let a = s >>> 0; return () => { a = (a + 0x9E3779B9) | 0; let x = a ^ (a >>> 16); x = Math.imul(x, 0x21F0AAAD); x ^= x >>> 15; x = Math.imul(x, 0x735A2D97); x ^= x >>> 15; return (x >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- grão de papel (desenhado uma vez, estático)
const grao = document.createElement('canvas'); grao.width = W; grao.height = H;
{
  const g = grao.getContext('2d'), r = semente(19);
  for (let i = 0; i < 80000; i++) {
    g.fillStyle = r() < 0.6 ? 'rgba(107,94,85,0.09)' : 'rgba(255,255,255,0.30)';
    g.fillRect(r() * W, r() * H, 1 + (r() < 0.2 ? 1 : 0), 1);
  }
  g.strokeStyle = 'rgba(107,94,85,0.06)'; g.lineWidth = 1;
  for (let i = 0; i < 220; i++) {                       // fibras
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 8 + r() * 16;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
}

// ---------------------------------------------------------------- texto
const cv = document.getElementById('cv'), c = cv.getContext('2d');
const F = {
  manchete: `700 ${MANCHETE_PX}px ${SERIFA}`,
  valor: `900 54px ${SERIFA}`, posicao: `900 48px ${SERIFA}`, grande: `900 ${CHAMADA_PX}px ${SERIFA}`,
  rotulo: `500 32px ${SANS}`, tique: `500 26px ${SANS}`,
};
let med = null;
function medir() {
  med = { manchete: [], digito: {} };
  c.font = F.manchete; c.letterSpacing = `${-0.02 * MANCHETE_PX}px`;
  MANCHETES.forEach((ms, i) => { let x = 0; med.manchete[i] = ms.map(w => { const p = x; x += c.measureText(w).width + ESPACO; return p; }); });
  c.letterSpacing = '0px';
  // dígitos com avanço fixo (o maior), para o número contar sem tremer
  for (const f of ['valor', 'grande', 'posicao']) { c.font = F[f]; const ws = [...'0123456789'].map(d => c.measureText(d).width); med.digito[f] = (Math.max(...ws) + c.measureText('0').width) / 2; }
}
function texto(s, x, y, fonte, cor, tracking) {
  c.font = fonte; c.letterSpacing = tracking ? `${tracking}px` : '0px'; c.fillStyle = cor; c.textBaseline = 'alphabetic'; c.fillText(s, x, y);
}
// número com dígitos em avanço fixo; devolve a largura
function numero(s, x, y, f, cor) {
  c.font = F[f]; c.letterSpacing = '0px'; c.fillStyle = cor; c.textBaseline = 'alphabetic';
  let dx = 0;
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') { const w = c.measureText(ch).width; c.fillText(ch, x + dx + (med.digito[f] - w) / 2, y); dx += med.digito[f]; }
    else { c.fillText(ch, x + dx, y); dx += c.measureText(ch).width; }
  }
  return dx;
}
function larguraNumero(s, f) { c.font = F[f]; let dx = 0; for (const ch of s) dx += (ch >= '0' && ch <= '9') ? med.digito[f] : c.measureText(ch).width; return dx; }

// ---------------------------------------------------------------- cenas
function manchetes(t) {
  c.save(); c.beginPath(); c.rect(MARGEM, MANCHETE_Y, 1400, MANCHETE_ALT); c.clip();
  const base = MANCHETE_Y + 112;
  // manchete 1: sai por cima a partir de 0,25 s e volta por baixo às 6,35 s
  MANCHETES[0].forEach((w, k) => {
    const sai = seg(t, 0.25 + 0.04 * k, 0.35, 'power2.in'), entra = seg(t, 6.35 + 0.06 * k, 0.7, 'expo.out');
    const dy = t < 6.35 ? -sai * MANCHETE_ALT : (1 - entra) * MANCHETE_ALT;
    texto(w, MARGEM + med.manchete[0][k], base + dy, F.manchete, COR.tinta, -0.02 * MANCHETE_PX);
  });
  // manchete 2: entra por baixo às 0,55 s e sai por cima às 5,4 s
  MANCHETES[1].forEach((w, k) => {
    const entra = seg(t, 0.55 + 0.06 * k, 0.7, 'expo.out'), sai = seg(t, 5.4 + 0.04 * k, 0.35, 'power2.in');
    const dy = t < 5.4 ? (1 - entra) * MANCHETE_ALT : -sai * MANCHETE_ALT;
    texto(w, MARGEM + med.manchete[1][k], base + dy, F.manchete, COR.tinta, -0.02 * MANCHETE_PX);
  });
  c.restore();
}

function moldura() {
  c.fillStyle = COR.tinta; c.fillRect(MARGEM, 104, 84, 10);            // barrinha de tinta
  c.fillRect(MARGEM, 318, W - 2 * MARGEM, 2);                          // fio de tinta sob a manchete
  c.fillStyle = COR.regua; c.fillRect(MARGEM, 1012, W - 2 * MARGEM, 2);   // fio apagado na base
}

function grafico(t) {
  // o eixo faz zoom para caber a líder (60 → 80) e volta; o gráfico estreita para abrir a chamada e alarga de novo
  const max = 60 + 20 * seg(t, 1.1, 1.2, 'power3.inOut') - 20 * seg(t, 6.0, 1.0, 'power3.inOut');
  const larg = LARGO - (LARGO - ESTREITO) * (seg(t, 1.0, 1.1, 'power3.inOut') - seg(t, 5.75, 1.1, 'power3.inOut'));
  const X = v => X0 + v / max * larg;

  // linhas de grade: deslizam com o zoom; a que entra pela direita aparece conforme cabe
  for (const v of GRADE) {
    const x = X(v), vis = v === 0 ? 1 : clamp((X0 + larg + 140 - x) / 140, 0, 1);
    c.globalAlpha = vis;
    c.fillStyle = v === 0 ? COR.tinta : COR.regua; c.fillRect(x - (v === 0 ? 1.5 : 1), GRADE_TOPO, v === 0 ? 3 : 2, GRADE_BASE - GRADE_TOPO);
    c.font = F.tique; c.textAlign = 'center'; c.fillStyle = COR.apagado; c.textBaseline = 'alphabetic'; c.fillText(String(v), x, ROTULO_Y + 20);
    c.textAlign = 'left'; c.globalAlpha = 1;
  }

  // posições 1 a 5 (fixas)
  for (let i = 0; i < 5; i++) numero(String(i + 1), MARGEM, linhaY(i) + 52, 'posicao', COR.apagado);

  // barras
  const pH = seg(t, 0.7, 1.6, 'power2.inOut'), pO = seg(t, 0.85, 1.4, 'power2.inOut');   // disparo da herói / recuo das outras
  const foco = seg(t, 4.2, 0.6, 'power2.inOut') - seg(t, 5.3, 0.4, 'power2.inOut');       // as outras apagam
  const azul = clamp(1 - seg(t, 7.0, 0.1, 'none') + seg(t, 9.4, 0.4, 'power2.inOut'), 0, 1);   // a herói volta a ser azul no fim
  const ordem = LINHAS.slice().sort((a, b) => (a.heroi ? 1 : 0) - (b.heroi ? 1 : 0));          // a herói desenha por cima
  for (const l of ordem) {
    const cresce = l.heroi ? pH : pO;
    const recolhe = seg(t, 5.7 + 0.06 * (4 - l.s1), 1.2, 'power2.inOut');
    const volta = seg(t, 7.4 + 0.08 * l.s0, 1.4, 'power2.inOut');
    const v = l.v0 + (l.v1 - l.v0) * cresce - l.v1 * recolhe + l.v0 * volta;
    // reordenação: a azul sobe primeiro, as outras descem logo atrás; às 7,05 s a ordem volta (com as barras vazias)
    const atraso = l.heroi ? 0 : 0.06 + 0.04 * l.s1;
    const pK = seg(t, 2.5 + atraso, 0.9, l.heroi ? 'back.inOut(1.3)' : 'power3.inOut') - (t >= 7.05 ? 1 : 0);
    const y = linhaY(l.s0 + (l.s1 - l.s0) * pK);
    const w = Math.max(0, X(v) - X0 - 1.5);
    const cor = l.heroi ? mistura(TINTA, AZUL, azul) : mistura(TINTA, APAGADO, foco);
    const corBarra = l.heroi ? cor : mistura(TINTA, REGUA, foco);
    c.fillStyle = corBarra; c.fillRect(X0 + 1.5, y, w, BARRA);
    // valor logo depois da barra (some quando a barra está quase vazia)
    c.globalAlpha = clamp((v - 1.5) / 6, 0, 1);
    numero(String(Math.round(v)), X0 + w + 20, y + 54, 'valor', cor);
    c.globalAlpha = 1;
    // o nome da etapa dentro de uma máscara: cai fora enquanto o gráfico esvazia e volta com a ordem original
    const sai = seg(t, 6.55 + 0.04 * l.s1, 0.35, 'power2.in'), entra = seg(t, 7.25 + 0.05 * l.s0, 0.6, 'expo.out');
    const dy = t < 7.05 ? sai * BARRA : (1 - entra) * BARRA;
    c.save(); c.beginPath(); c.rect(MARGEM + 66, y, X0 - MARGEM - 80, BARRA); c.clip();
    texto(l.nome, MARGEM + 66, y + 48 + dy, F.rotulo, cor);
    c.restore();
  }

  // marca fantasma: risco de tinta no valor antigo da herói + "era 29"
  const ti = seg(t, 4.55, 0.5, 'power3.out'), to = seg(t, 5.3, 0.3, 'power2.in');
  const tx = X(HEROI.v0), esc = Math.max(0, ti - to);
  c.fillStyle = COR.tinta; c.fillRect(tx - 2, linhaY(0) - 20, 4, 112 * esc);
  const wi = seg(t, 4.65, 0.6, 'expo.out'), wo = seg(t, 5.32, 0.35, 'power2.in');
  c.save(); c.beginPath(); c.rect(tx + 12, 330, 200, 38); c.clip();
  texto(FANTASMA, tx + 12, 358 + (t < 5.32 ? (1 - wi) * 38 : -wo * 38), F.tique, COR.apagado);
  c.restore();

  return pH;
}

function chamada(t, pH) {
  // o número grande entra por baixo da máscara e conta no passo da barra azul
  const bi = seg(t, 1.45, 0.7, 'expo.out'), bo = seg(t, 5.3, 0.35, 'power2.in');
  const dy = t < 5.3 ? (1 - bi) * CHAMADA_ALT : -bo * CHAMADA_ALT;
  const s = '+' + Math.round(GANHO * pH);
  c.save(); c.beginPath(); c.rect(CHAMADA_X, CHAMADA_Y, 560, CHAMADA_ALT); c.clip();
  numero(s, CHAMADA_X, CHAMADA_Y + 268 + dy, 'grande', COR.tinta);
  c.restore();
  const RW = larguraNumero(s, 'grande');
  // régua azul se desenha da esquerda para a direita, e sai pela direita
  const ri = seg(t, 3.5, 0.6, 'power2.inOut'), ro = seg(t, 5.3, 0.35, 'power2.in');
  c.fillStyle = COR.azul; c.fillRect(CHAMADA_X + 8 + RW * ro, 716, Math.max(0, RW * (ri - ro)), 8);
  // rótulo
  const li = seg(t, 3.6, 0.7, 'expo.out'), lo = seg(t, 5.3, 0.35, 'power2.in');
  c.save(); c.beginPath(); c.rect(CHAMADA_X, 740, 520, 52); c.clip();
  texto(ROTULO_CHAMADA, CHAMADA_X, 740 + 38 + (t < 5.3 ? (1 - li) * 52 : -lo * 52), F.rotulo, COR.tinta);
  c.restore();
}

// ---------------------------------------------------------------- o quadro
function fontesOk() { return [F.manchete, F.grande, F.rotulo].every(f => document.fonts.check(f)); }
function render(t) {
  if (!fontesOk()) return;
  if (!med) medir();
  c.save();
  c.fillStyle = COR.papel; c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.55; c.drawImage(grao, 0, 0); c.globalAlpha = 1;
  moldura();
  manchetes(t);
  const pH = grafico(t);
  chamada(t, pH);
  c.restore();
}

// ---------------------------------------------------------------- relógio
const rel = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(rel, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(rel.t % DUR) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
window.addEventListener('load', () => render(tl.time() % DUR));
document.fonts.ready.then(() => { med = null; render(tl.time() % DUR); });
