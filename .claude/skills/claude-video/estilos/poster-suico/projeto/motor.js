// swiss-grid, versão autoral. Um relógio só: render(t) desenha o quadro inteiro a partir do tempo.
// Sem Math.random, sem Date.now, sem timers. Mesmo t, mesma imagem. Loop de 9 s.

// ---------------------------------------------------------------- variáveis do estilo
const W = 1920, H = 1080, DUR = 9;
const COR = { fundo: '#FFFFFF', tinta: '#111111', grade: '#E6E6E6', acento: '#E4002B' };
const MARGEM = 96, COLUNA = 122, CALHA = 24;           // 12 colunas: 12*122 + 11*24 = 1728 = 1920 - 2*96
const PECA = 218, PECA_CALHA = 24;                      // bloco 3 x 3 de peças pretas
const FONTE = 290, TRACKING = -0.045;                   // Inter 900, tracking -0,045 em
const PONTO = 62;                                       // o ponto vermelho (ponto final)

// o texto: duas linhas fixas e a terceira que troca como numa esteira
const LINHAS = ['Claude', 'Code'];
const VERBOS = ['cria', 'edita', 'anima'];   // sem descendentes: a palavra que sobe não deixa rabicho sob a 2ª linha
const TROCAS = [1.5, 4.5, 7.5];                         // quando a terceira linha troca
const TROCA_DUR = 0.85;                                 // expo.inOut

// o bloco: a casa vazia anda num anel de 6 casas, uma peça desliza por segundo
const ANEL = [[2, 0], [2, 1], [2, 2], [1, 2], [1, 1], [1, 0]];   // [linha, coluna] que a lacuna visita
const MOVIMENTOS = [0.5, 2.5, 3.5, 5.5, 6.5, 8.5];
const PECA_DUR = 0.45;                                  // power3.inOut

// ---------------------------------------------------------------- geometria derivada
const BX = MARGEM + 7 * (COLUNA + CALHA);               // o bloco começa na coluna 8
const BH = 3 * PECA + 2 * PECA_CALHA;                   // altura do bloco
const BY = H / 2 - BH / 2;                              // bloco centrado na vertical
const casa = (l, c) => [BX + c * (PECA + PECA_CALHA), BY + l * (PECA + PECA_CALHA)];

// ---------------------------------------------------------------- curvas
const ease = (() => { const c = {}; return n => c[n] || (c[n] = gsap.parseEase(n)); })();
const seg = (t, ini, dur, curva) => ease(curva)(Math.min(1, Math.max(0, (t - ini) / dur)));
const mix = (a, b, p) => a + (b - a) * p;

// ---------------------------------------------------------------- estado das peças (calculado uma vez)
// cada peça tem um caminho: lista de {t0, de, para}. Fora dos movimentos ela fica parada na última casa.
const pecas = [];
for (let l = 0; l < 3; l++) for (let c = 0; c < 3; c++) {
  if (l === ANEL[0][0] && c === ANEL[0][1]) continue;  // a lacuna no quadro 0
  pecas.push({ casa0: [l, c], passos: [] });
}
{
  const ocupa = new Map(pecas.map(p => [p.casa0.join(','), p]));
  MOVIMENTOS.forEach((t0, k) => {
    const lacuna = ANEL[k % 6], vem = ANEL[(k + 1) % 6];
    const p = ocupa.get(vem.join(','));
    p.passos.push({ t0, de: vem, para: lacuna });
    ocupa.delete(vem.join(',')); ocupa.set(lacuna.join(','), p);
  });
}
function posPeca(p, t) {
  let [l, c] = p.casa0, xy = casa(l, c);
  for (const s of p.passos) {
    if (t < s.t0) break;
    const a = casa(...s.de), b = casa(...s.para), q = seg(t, s.t0, PECA_DUR, 'power3.inOut');
    xy = [mix(a[0], b[0], q), mix(a[1], b[1], q)];
  }
  return xy;
}

// ---------------------------------------------------------------- texto
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const fonte = `900 ${FONTE}px 'Inter'`;
let medidas = null;
function medir() {
  ctx.font = fonte; ctx.letterSpacing = `${TRACKING * FONTE}px`;
  const capAlt = ctx.measureText('H').actualBoundingBoxAscent;
  const larg = {};
  [...LINHAS, ...VERBOS].forEach(w => { larg[w] = ctx.measureText(w).width - TRACKING * FONTE; }); // tira o tracking final
  // as três linhas de base: o topo da caixa-alta da 1ª linha e a base da 3ª coincidem com o bloco
  const passo = (BH - capAlt) / 2;
  const bases = [BY + capAlt, BY + capAlt + passo, BY + BH];
  // máscara da 3ª linha: de logo abaixo da base da 2ª até abaixo dos descendentes da 3ª
  const mTopo = bases[1] + 0.07 * FONTE, mBase = bases[2] + 0.27 * FONTE;
  medidas = { capAlt, larg, bases, mTopo, mBase, mAlt: mBase - mTopo };
}

function texto(c, s, x, y) { c.font = fonte; c.letterSpacing = `${TRACKING * FONTE}px`; c.textBaseline = 'alphabetic'; c.fillStyle = COR.tinta; c.fillText(s, x, y); }

// qual verbo está na tela em t, e a troca em curso (se houver)
function estadoVerbo(t) {
  let k = 0; TROCAS.forEach((s, i) => { if (t >= s) k = i + 1; });
  return { k, atual: k % 3, anterior: (k + 2) % 3, inicio: k ? TROCAS[k - 1] : -10 };
}

// ---------------------------------------------------------------- o ponto vermelho
// senta como ponto final; na troca antecipa (achata), pula em arco até o fim da palavra nova e amassa ao pousar
function ponto(c, t, m) {
  const { k, atual, anterior, inicio } = estadoVerbo(t);
  const fimX = i => MARGEM + m.larg[VERBOS[i]] + 0.04 * FONTE + PONTO / 2;   // centro do ponto
  const chao = m.bases[2];
  let x = fimX(atual), y = chao, sx = 1, sy = 1;
  const dt = t - inicio;
  if (k && dt < 1.0) {
    const x0 = fimX(anterior), x1 = fimX(atual);
    if (dt < 0.12) {                                     // antecipação: agacha
      const a = seg(t, inicio, 0.12, 'power2.out'); x = x0; sx = 1 + 0.2 * a; sy = 1 - 0.24 * a;
    } else if (dt < 0.64) {                              // o salto, em arco
      const p = (dt - 0.12) / 0.52, e = ease('power2.inOut')(p);
      x = mix(x0, x1, e); y = chao - 150 * 4 * p * (1 - p);      // arco baixo: passa abaixo da base da 2ª linha, nunca por cima do "Code"
      const v = Math.abs(1 - 2 * p); sx = 0.85 + 0.15 * v; sy = 1.2 - 0.2 * v;   // estica no ar, volta ao pousar
    } else {                                             // pouso: amassa e assenta com mola
      const d = dt - 0.64, q = 0.32 * Math.exp(-9 * d) * Math.cos(15 * d);
      x = x1; sx = 1 + q; sy = 1 - q;
    }
  }
  c.save();
  c.translate(x, y); c.scale(sx, sy);                    // origem na base do ponto (ele amassa contra o chão)
  c.fillStyle = COR.acento; c.beginPath(); c.arc(0, -PONTO / 2, PONTO / 2, 0, Math.PI * 2); c.fill();
  c.restore();
}

// ---------------------------------------------------------------- o quadro
function grade(c) {
  c.fillStyle = COR.grade;
  for (let i = 0; i < 12; i++) {
    const x = MARGEM + i * (COLUNA + CALHA);
    c.fillRect(x, 0, 1, H); c.fillRect(x + COLUNA - 1, 0, 1, H);
  }
  c.fillRect(0, MARGEM, W, 1); c.fillRect(0, H - MARGEM - 1, W, 1);
}

function render(t) {
  if (!document.fonts.check(fonte)) return;
  if (!medidas) medir();
  const m = medidas, c = ctx;
  c.save();
  c.fillStyle = COR.fundo; c.fillRect(0, 0, W, H);
  grade(c);

  // linhas fixas
  texto(c, LINHAS[0], MARGEM, m.bases[0]);
  texto(c, LINHAS[1], MARGEM, m.bases[1]);

  // terceira linha: esteira dentro da máscara
  const { k, atual, anterior, inicio } = estadoVerbo(t);
  const p = k ? seg(t, inicio + 0.05, TROCA_DUR, 'expo.inOut') : 1;
  c.save();
  c.beginPath(); c.rect(0, m.mTopo, BX - CALHA, m.mAlt); c.clip();
  texto(c, VERBOS[atual], MARGEM, m.bases[2] + (1 - p) * m.mAlt);          // a nova sobe até a base
  if (k && p < 1) texto(c, VERBOS[anterior], MARGEM, m.bases[2] - p * m.mAlt); // a antiga sai por cima
  c.restore();

  // peças pretas
  c.fillStyle = COR.tinta;
  for (const pc of pecas) { const [x, y] = posPeca(pc, t); c.fillRect(Math.round(x), Math.round(y), PECA, PECA); }

  ponto(c, t, m);
  c.restore();
}

// ---------------------------------------------------------------- relógio
const rel = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(rel, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(rel.t % DUR) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
window.addEventListener('load', () => render(tl.time() % DUR));
document.fonts.ready.then(() => { medidas = null; render(tl.time() % DUR); });
