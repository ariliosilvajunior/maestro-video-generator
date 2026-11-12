// poster-pop, versão autoral: o gancho de um Short do canal gritado palavra por palavra, em amarelo e tinta.
// Um relógio só: render(t) escolhe o plano pelo tempo e desenha tudo. Sem Math.random, Date.now ou timers. Loop de 12 s.

// ---------------------------------------------------------------- variáveis do estilo
const W = 1920, H = 1080, DUR = 12;
const COR = { amarelo: '#FFD400', tinta: '#111111', papel: '#FFFFFF' };
const HEROI = "'League Gothic'", APOIO = "'Archivo Black'";
const TRACKING = 0.01, ESCALONA = 0.033;                      // tracking em em; atraso entre letras
const DESLOC = 0.5;                                           // o vídeo começa 0,5 s depois da história: a emenda cai dentro do 1º plano
const TRANCO = 18, SOCO = 0.06;

// ---------------------------------------------------------------- utilidades
const ease = (() => { const c = {}; return n => c[n] || (c[n] = gsap.parseEase(n)); })();
const seg = (t, ini, dur, curva) => ease(curva || 'power4.out')(Math.min(1, Math.max(0, (t - ini) / dur)));
const cv = document.getElementById('cv'), c = cv.getContext('2d');
const capCache = {};
function razaoCaixa(fam) {                                     // altura da caixa-alta em relação ao corpo, medida na fonte real
  if (capCache[fam]) return capCache[fam];
  c.font = `1000px ${fam}`; const r = c.measureText('H').actualBoundingBoxAscent / 1000;
  if (document.fonts.check(`100px ${fam}`)) capCache[fam] = r; return r;
}
function medidas(txt, fam, cap, maxW) {
  let fs = cap / razaoCaixa(fam); c.font = `${fs}px ${fam}`;
  let ws = [...txt].map(ch => c.measureText(ch).width), tw = ws.reduce((a, b) => a + b, 0) + TRACKING * fs * (ws.length - 1);
  if (maxW && tw > maxW) { const k = maxW / tw; fs *= k; ws = ws.map(w => w * k); tw = maxW; }
  return { fs, ws, tw, cap: fs * razaoCaixa(fam) };
}
// palavra cujas letras entram em disparada de `de` (deslocamento em px) e param secas
function palavra(lt, o) {
  const m = medidas(o.txt, o.fam || HEROI, o.cap, o.maxW);
  let x = o.x; if (o.alinha === 'centro') x -= m.tw / 2; else if (o.alinha === 'direita') x -= m.tw;
  c.font = `${m.fs}px ${o.fam || HEROI}`; c.fillStyle = o.cor; c.textBaseline = 'alphabetic';
  const n = m.ws.length, esc = o.esc == null ? ESCALONA : o.esc, ini = o.ini || 0, de = o.de || [0, 0], inverso = de[0] < 0;
  let cx = x;
  for (let i = 0; i < n; i++) {
    const ordem = inverso ? n - 1 - i : i, s0 = ini + ordem * esc;
    if (lt >= s0) { const p = seg(lt, s0, 0.2); const z = o.ziper && i % 2 ? -1 : 1; c.fillText(o.txt[i], cx + (1 - p) * de[0], o.base + (1 - p) * de[1] * z); }
    cx += m.ws[i] + TRACKING * m.fs;
  }
  return m;
}
// cartão de papel que entra em disparada; a palavra de apoio sobe dentro dele 2 quadros depois
function cartao(lt, o) {
  if (lt < o.ini) return;
  const p = seg(lt, o.ini, 0.2), x = o.x + (1 - p) * o.de[0], y = o.y + (1 - p) * o.de[1];
  c.fillStyle = COR.papel; c.fillRect(x, y, o.w, o.h);
  c.save(); c.beginPath(); c.rect(x, y, o.w, o.h); c.clip();
  const q = seg(lt, o.ini + 0.067, 0.24), m = medidas(o.txt, APOIO, o.cap, o.maxW);
  palavra(99, { txt: o.txt, fam: APOIO, cap: o.cap, maxW: o.maxW, x: x + o.tx, base: y + o.h / 2 + m.cap / 2 + (1 - q) * o.h, cor: COR.tinta, esc: 0 });
  c.restore();
}
// o soco: 1,0 → 1,06 rápido, volta em 0,4 s
function soco(lt, batidas) { let s = 0; for (const b of batidas) { const d = lt - b; if (d < 0) continue; s = Math.max(s, d < 0.05 ? seg(d, 0, 0.05, 'power2.out') : 1 - seg(d, 0.05, 0.4, 'sine.inOut')); } return 1 + SOCO * s; }
// o tranco: o cartaz desce quando algo pousa e assenta em 0,15 s
function tranco(lt, hits) { let y = 0; for (const h of hits) if (lt >= h) y = TRANCO * (1 - seg(lt, h, 0.15, 'power2.out')); return y; }
function quadro(fundo, esc, jy, desenha) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = fundo; c.fillRect(0, 0, W, H); c.translate(W / 2, H / 2 + jy); c.scale(esc, esc); c.translate(-W / 2, -H / 2); desenha(); }
const meio = cap => H / 2 + cap / 2;                            // linha de base que centra uma caixa-alta
const A = COR.amarelo, K = COR.tinta;

// ---------------------------------------------------------------- os planos (tempo de história u)
const PLANOS = [
  { u: 0, f(lt) {   // TRÊS: de baixo, letra por letra
    quadro(A, soco(lt, [0.5]), tranco(lt, [0.27]), () => palavra(lt, { txt: 'TRÊS', cap: 0.86 * H, x: W / 2, alinha: 'centro', base: meio(0.86 * H), cor: K, de: [0, H * 1.1] })); } },
  { u: 1, f(lt) {   // ERROS: virada de campo, zíper
    quadro(K, soco(lt, [0.5]), tranco(lt, [0.3]), () => palavra(lt, { txt: 'ERROS', cap: 0.82 * H, x: W / 2, alinha: 'centro', base: meio(0.82 * H), cor: A, de: [0, H * 1.2], ziper: true })); } },
  { u: 2, f(lt) {   // QUE: de baixo (vindo pela lateral, as letras cruzavam a tela inteira e viravam um flash)
    quadro(A, 1, tranco(lt, [0.12]), () => palavra(lt, { txt: 'QUE', cap: 1.04 * H, x: W / 2, alinha: 'centro', base: meio(1.04 * H), cor: K, de: [0, H * 1.25] })); } },
  { u: 2.5, f(lt) { // VOCÊ: de cima, campo preto
    quadro(K, 1, tranco(lt, [0.15]), () => palavra(lt, { txt: 'VOCÊ', cap: 1.0 * H, x: W / 2, alinha: 'centro', base: meio(1.0 * H), cor: A, de: [0, -H * 1.3] })); } },
  { u: 3, f(lt) {   // 3 + PROMPT: numeral à direita, cartão entra por cima
    quadro(A, soco(lt, [1.0]), tranco(lt, [0.1, 0.6]), () => {
      palavra(lt, { txt: '3', cap: 1.45 * H, x: W + 60, alinha: 'direita', base: meio(1.45 * H), cor: K, de: [0, -H * 1.6] });
      cartao(lt, { ini: 0.5, x: -40, y: H / 2 - 260, w: 1360, h: 520, de: [0, -1100], txt: 'PROMPT', cap: 320, maxW: 1160, tx: 140 }); }); } },
  { u: 4.5, f(lt) { // 2 + CONTEXTO: numeral à esquerda, cartão entra por baixo
    quadro(K, soco(lt, [1.0]), tranco(lt, [0.1, 0.6]), () => {
      palavra(lt, { txt: '2', cap: 1.45 * H, x: -60, base: meio(1.45 * H), cor: A, de: [0, H * 1.6] });
      cartao(lt, { ini: 0.5, x: 600, y: H / 2 - 260, w: W - 560, h: 520, de: [0, 1100], txt: 'CONTEXTO', cap: 300, maxW: 1200, tx: 100 }); }); } },
  { u: 6, f(lt) {   // 1 + REVISÃO: numeral vem da direita, cartão atravessa da esquerda
    quadro(A, soco(lt, [1.0]), tranco(lt, [0.1, 0.6]), () => {
      palavra(lt, { txt: '1', cap: 1.45 * H, x: W - 40, alinha: 'direita', base: meio(1.45 * H), cor: K, de: [1200, 0] });
      cartao(lt, { ini: 0.5, x: -40, y: H / 2 - 260, w: W - 400, h: 520, de: [-1600, 0], txt: 'REVISÃO', cap: 320, maxW: 1200, tx: 140 }); }); } },
  { u: 7.5, f(lt) { // 3 2 1: uma por meia batida, cada uma grande demais
    const i = Math.min(2, Math.floor(lt / 0.5)), l = lt - i * 0.5, fundo = i === 1 ? A : K, tinta = i === 1 ? K : A;
    const P = [{ x: W * 0.72, de: [0, -H * 1.6], cap: 1.3 * H }, { x: W / 2, de: [0, H * 1.6], cap: 1.3 * H }, { x: W * 0.3, de: [-W, 0], cap: 1.5 * H }][i];
    quadro(fundo, 1, tranco(l, [0.1]), () => palavra(l, { txt: '321'[i], cap: P.cap, x: P.x, alinha: 'centro', base: meio(P.cap), cor: tinta, de: P.de })); } },
  { u: 9, f(lt) {   // JÁ: zoom de impacto e virada de campo no meio
    const inv = lt >= 1.0, fundo = inv ? K : A, tinta = inv ? A : K, impacto = 1.4 - 0.4 * seg(lt, 0, 0.2);
    quadro(fundo, impacto * soco(lt, [0.5, 1.0]), tranco(lt, [0.12]), () => palavra(lt, { txt: 'JÁ', cap: 1.2 * H, x: W / 2, alinha: 'centro', base: meio(1.2 * H), cor: tinta, esc: 0 })); } },
  { u: 10.5, f(lt) { // NO CANAL / HOJE: faixa de papel embaixo com seta para cima; palavra gigante em cima
    quadro(A, soco(lt, [1.0]), tranco(lt, [0.1, 0.6]), () => {
      const p = seg(lt, 0, 0.2), fy = H - 300 + (1 - p) * 340;
      c.fillStyle = COR.papel; c.fillRect(-40, fy, W + 80, 340);
      c.save(); c.beginPath(); c.rect(-40, fy, W + 80, 340); c.clip();
      const q = seg(lt, 0.067, 0.24);
      palavra(99, { txt: 'NO CANAL', fam: APOIO, cap: 150, x: 64, base: fy + 150 + 75 + (1 - q) * 300, cor: K, esc: 0 });
      const ax = W - 64 - 100, ay = fy + 280 - (1 - q) * 300;      // seta de tinta apontando para cima, para a palavra
      c.fillStyle = K; c.beginPath(); c.moveTo(ax - 36, ay); c.lineTo(ax + 36, ay); c.lineTo(ax + 36, ay - 110); c.lineTo(ax + 100, ay - 110); c.lineTo(ax, ay - 220); c.lineTo(ax - 100, ay - 110); c.lineTo(ax - 36, ay - 110); c.closePath(); c.fill();
      c.restore();
      palavra(lt, { txt: 'HOJE', cap: 700, x: W / 2, alinha: 'centro', base: 40 + 700, cor: K, de: [0, -1000], ini: 0.5, maxW: W + 120 }); }); } },
];

function render(t) {
  if (![`100px ${HEROI}`, `100px ${APOIO}`].every(f => document.fonts.check(f))) return;
  const u = (t + DESLOC) % DUR;
  let pl = PLANOS[0]; for (const p of PLANOS) if (u >= p.u) pl = p;
  pl.f(u - pl.u);
}

// ---------------------------------------------------------------- relógio
const rel = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(rel, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(rel.t % DUR) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
window.addEventListener('load', () => render(tl.time() % DUR));
document.fonts.ready.then(() => render(tl.time() % DUR));
