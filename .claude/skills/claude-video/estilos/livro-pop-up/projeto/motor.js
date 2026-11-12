// paper-cut, versão autoral: colinas, sol, ondas, folhas e letras de papel recortado pousando numa página creme.
// Um relógio só: render(t) desenha o quadro inteiro a partir do tempo. Sem Math.random, Date.now ou timers. Loop de 12 s.

// ---------------------------------------------------------------- variáveis do estilo
const W = 1920, H = 1080, DUR = 12, TAU = Math.PI * 2;
const COR = { creme: '#F2E8D5', areia: '#E3CBA8', salvia: '#9CB49A', salviaEscura: '#5E7F6A', petroleo: '#2F5D62', tinta: '#2B2B2B', acento: '#D98C7A' };
const FONTE = "'EB Garamond'";
const LINHAS = [
  { txt: 'Passo',         tam: 230, base: 488, x: 150, cor: COR.petroleo,     t0: 3.0, passo: 0.05,  fim: 9.3 },
  { txt: 'a passo',       tam: 230, base: 730, x: 236, cor: COR.petroleo,     t0: 3.6, passo: 0.05,  fim: 9.0 },
  { txt: 'sem tecniquês', tam: 76,  base: 858, x: 244, cor: COR.salviaEscura, t0: 5.3, passo: 0.035, fim: 8.3 },
];
const CAM_BALANCO = [12, 5], CAM_EMPURRAO = 0.012;        // px de balanço e fração de empurrão (× profundidade)

// ---------------------------------------------------------------- utilidades
const ease = (() => { const c = {}; return n => c[n] || (c[n] = gsap.parseEase(n)); })();
const seg = (t, ini, dur, curva) => ease(curva || 'power2.out')(Math.min(1, Math.max(0, (t - ini) / dur)));
const mix = (a, b, p) => a + (b - a) * p;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const onda = (t, ciclos, desl) => Math.sin(TAU * ((ciclos || 1) * t / DUR + (desl || 0)));   // sempre fecha o loop
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mistura = (a, b, p) => `rgb(${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * p)).join(',')})`;
const TINTA = hex(COR.tinta).join(',');
function semente(s) { let a = s >>> 0; return () => { a = (a + 0x9E3779B9) | 0; let x = a ^ (a >>> 16); x = Math.imul(x, 0x21F0AAAD); x ^= x >>> 15; x = Math.imul(x, 0x735A2D97); x ^= x >>> 15; return (x >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- grão de papel (uma textura com semente, em mosaico)
const G = 512, grao = document.createElement('canvas'); grao.width = grao.height = G;
{
  const g = grao.getContext('2d'), img = g.createImageData(G, G), r = semente(23);
  const ondas = []; for (let k = 0; k < 7; k++) ondas.push([1 + Math.floor(r() * 4), 1 + Math.floor(r() * 4), r() * TAU, 0.4 + r() * 0.6]);
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    let m = 0; for (const [kx, ky, ph, a] of ondas) m += a * Math.sin(TAU * (kx * x / G + (ky * y / G) * (kx % 2 ? 1 : -1)) + ph);
    const v = 128 + (r() - 0.5) * 64 + m * 3.5, i = (y * G + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); g.lineCap = 'round';
  for (let f = 0; f < 70; f++) { const x = r() * G, y = r() * G, a = r() * TAU, l = 6 + r() * 18; g.strokeStyle = r() < 0.6 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.18)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
}

// ---------------------------------------------------------------- recortes à mão: polígonos com tremor pequeno
const treme = (pts, R) => pts.map(([x, y]) => [x + (R() - 0.5) * 1.2, y + (R() - 0.5) * 1.2]);
function disco(cx, cy, r, sem) {
  const R = semente(sem), f = [R() * TAU, R() * TAU, R() * TAU], n = Math.ceil(TAU * r / 13), pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r * (1 + 0.004 * Math.sin(3 * a + f[0]) + 0.0025 * Math.sin(7 * a + f[1]) + 0.0012 * Math.sin(15 * a + f[2])); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  return { polis: [treme(pts, R)] };
}
function ondulado(y0, amp, cl, sem) {                              // faixa com festões irregulares (as ondas)
  const R = semente(sem), pts = []; let x = -1160;
  while (x < 3080) { const w = cl * (0.72 + 0.56 * R()), a = amp * (0.78 + 0.4 * R()), n = Math.ceil(w / 12); for (let i = 0; i < n; i++) { const u = i / n; pts.push([x + u * w, y0 - a * Math.pow(Math.sin(Math.PI * u), 0.75)]); } x += w; }
  pts.push([x, y0], [x, 1500], [-1160, 1500]);
  return { polis: [treme(pts, R)] };
}
function folha(px, py, ang, comp, larg, sem) {                      // cabo em (px, py), apontando para ang graus
  const R = semente(sem), a = ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const P = (x, y) => [px + x * ca - y * sa, py + x * sa + y * ca];
  const n = Math.ceil(comp / 11), cima = [], baixo = [], curva = (R() - 0.5) * 0.12 * comp;
  for (let i = 0; i <= n; i++) { const u = i / n, w = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.85)), 0.9), c = curva * Math.sin(Math.PI * u); cima.push(P(u * comp, c - larg / 2 * w)); baixo.push(P(u * comp, c + larg / 2 * w * 0.92)); }
  const cabo = [P(-120, -4), P(4, -4), P(4, 4), P(-120, 4)];
  const nervuras = [[P(-110, 0)]];
  for (let i = 1; i <= 10; i++) { const u = i / 10 * 0.88; nervuras[0].push(P(u * comp, curva * Math.sin(Math.PI * u))); }
  for (const u of [0.22, 0.4, 0.58, 0.74]) for (const s of [-1, 1]) { const c = curva * Math.sin(Math.PI * u), w = larg / 2 * 0.62 * Math.pow(Math.sin(Math.PI * u), 0.9); nervuras.push([P(u * comp, c), P(u * comp + w * 0.9, c + s * w)]); }
  return { polis: [treme(cima.concat(baixo.reverse()), R), treme(cabo, R)], nervuras };
}

// ---------------------------------------------------------------- a cena, de trás para a frente
// uma folha de papel: forma, cor, profundidade (0 = fundo, 1 = frente), origem do giro/escala
const folhaDe = (forma, cor, prof, origem, extra) => Object.assign({ forma, cor, prof, origem, filete: mistura(cor, '#FFFFFF', 0.42) }, extra || {});
const COLINAS = [
  folhaDe(disco(1380, 1330, 780, 20), COR.areia,        0.2, [1380, 550], { tIn: 0.0,  tOut: 11.3 }),
  folhaDe(disco(1760, 1260, 620, 21), COR.salvia,       0.3, [1760, 640], { tIn: 0.4,  tOut: 11.05 }),
  folhaDe(disco(1250, 1360, 520, 22), COR.salviaEscura, 0.4, [1250, 840], { tIn: 0.8,  tOut: 10.8 }),
  folhaDe(disco(1680, 1420, 460, 23), COR.creme,        0.5, [1680, 960], { tIn: 1.2,  tOut: 10.55 }),
];
const SOL = folhaDe(disco(1560, 760, 150, 40), COR.acento, 0.55, [1560, 760], { tIn: 1.6, tOut: 10.25 });
const ONDAS = [
  folhaDe(ondulado(946, 46, 300, 50), COR.salvia,   0.7,  [960, 900], { tIn: 2.1, tOut: 9.9,  dir: -1, fase: 0 }),
  folhaDe(ondulado(1016, 52, 260, 51), COR.petroleo, 0.85, [960, 980], { tIn: 2.5, tOut: 9.65, dir: 1,  fase: 0.5 }),
];
const FOLHAS = [
  { p: [-30, -30],  ang: 32,  comp: 660, larg: 220, cor: COR.salviaEscura, prof: 1.0,  tIn: 4.4,  tOut: 8.55, lado: -1 },
  { p: [-30, -30],  ang: 62,  comp: 380, larg: 150, cor: COR.salvia,       prof: 0.92, tIn: 4.7,  tOut: 8.75, lado: -1 },
  { p: [-30, -30],  ang: 6,   comp: 520, larg: 160, cor: COR.petroleo,     prof: 1.06, tIn: 4.55, tOut: 8.65, lado: -1 },
  { p: [1950, -30], ang: 143, comp: 600, larg: 210, cor: COR.salvia,       prof: 0.95, tIn: 4.85, tOut: 8.85, lado: 1 },
  { p: [1950, -30], ang: 114, comp: 420, larg: 150, cor: COR.salviaEscura, prof: 1.02, tIn: 5.0,  tOut: 8.95, lado: 1 },
].map((o, i) => folhaDe(folha(o.p[0], o.p[1], o.ang, o.comp, o.larg, 60 + i), o.cor, o.prof, o.p, Object.assign({ i, nervura: mistura(o.cor, COR.tinta, 0.45) }, o)));

// ---------------------------------------------------------------- desenho
const cv = document.getElementById('cv'), c = cv.getContext('2d');
let padraoGrao = null;
function poligono(pts) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }
function caminho(polis) { c.beginPath(); for (const pts of polis) { pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); } }
// sombra em função do levantamento L (0 = assentada, 1 = no alto)
function sombra(L, k) {
  k = k || 1; L = clamp(L, 0, 1.2);
  return [[(3 + 16 * L) * k, (5 + 30 * L) * k, (6 + 34 * L) * k, 0.34 - 0.13 * L], [0.8 * k, 1.6 * k, 1.4 * k, 0.32 * (1 - Math.min(1, L))]];
}
function camera(t, prof) {
  const bx = CAM_BALANCO[0] * onda(t, 1) * prof, by = CAM_BALANCO[1] * onda(t, 1, 0.25) * prof;
  const emp = 1 + CAM_EMPURRAO * prof * (0.5 - 0.5 * Math.cos(TAU * t / DUR));
  c.translate(960, 540); c.scale(emp, emp); c.translate(-960 + bx, -540 + by);
}
// desenha uma folha: deslocamento, escala e giro em torno da origem, levantamento L
function desenhaFolha(f, t, x, y, esc, rot, L) {
  c.save(); camera(t, f.prof);
  c.translate(x, y); c.translate(f.origem[0], f.origem[1]); c.rotate((rot || 0) * Math.PI / 180); c.scale(esc, esc); c.translate(-f.origem[0], -f.origem[1]);
  for (const [sx, sy, blur, a] of sombra(L)) { c.save(); c.shadowColor = `rgba(${TINTA},${a})`; c.shadowBlur = blur; c.shadowOffsetX = sx; c.shadowOffsetY = sy; c.fillStyle = f.filete; caminho(f.forma.polis); c.fill(); c.restore(); }
  c.fillStyle = f.filete; caminho(f.forma.polis); c.fill();            // filete claro
  c.save(); c.translate(0.8, 2.4); c.fillStyle = f.cor; caminho(f.forma.polis); c.fill(); c.restore();   // o papel
  c.save(); caminho(f.forma.polis); c.clip();
  if (f.forma.nervuras) { c.strokeStyle = f.nervura; c.lineWidth = 3; c.lineCap = 'round'; c.globalAlpha = 0.55; for (const n of f.forma.nervuras) { c.beginPath(); n.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke(); } c.globalAlpha = 1; }
  c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.62; c.fillStyle = padraoGrao; c.fillRect(-1200, -600, 4400, 2200);
  c.restore();
  c.restore();
}

// ---------------------------------------------------------------- tempos
const pulso = (t, s, d) => Math.sin(Math.PI * seg(t, s, d, 'sine.inOut'));
const pousa = (t, t0, d, curva) => [seg(t, t0, d, curva || 'back.out(1.2)'), 1 - seg(t, t0 + 0.25 * d, 0.85 * d, 'power2.inOut')];   // [p, L]
const sai = (t, t1, d) => [seg(t, t1 + 0.1, d, 'power2.in'), seg(t, t1, 0.22, 'power2.out')];                                      // [q, L]

// letras: cada uma é um papelzinho; posições medidas uma vez com a fonte carregada
let letras = null;
function medirLetras() {
  letras = [];
  const R = semente(77);
  for (const L of LINHAS) {
    c.font = `italic 500 ${L.tam}px ${FONTE}`;
    let x = L.x, k = 0;
    for (const ch of L.txt) {
      const w = c.measureText(ch).width;
      if (ch !== ' ') { letras.push({ ch, x, w, L, k, rot: (R() - 0.5) * 16, dx: (R() - 0.5) * 40, dy: -20 - R() * 40 }); k++; }
      x += w + 0.01 * L.tam;
    }
  }
}
function desenhaLetras(t) {
  c.save(); camera(t, 0.6);
  for (const l of letras) {
    const L = l.L, ti = L.t0 + l.k * L.passo, to = L.fim + l.k * L.passo * 0.8;
    const pIn = seg(t, ti, 0.6, 'back.out(1.2)'), a = seg(t, ti, 0.16, 'power1.out');
    const Lin = 1 - seg(t, ti + 0.12, 0.5, 'power2.inOut'), Lout = seg(t, to, 0.22, 'power2.out'), q = seg(t, to + 0.06, 0.42, 'power2.in');
    const lev = t < 7 ? Lin : Lout, op = t < 7 ? a : 1 - seg(t, to + 0.3, 0.18, 'power1.in');
    if (op <= 0.001) continue;
    const esc = 1 + 0.32 * (1 - pIn) + 0.36 * q + 0.03 * lev;
    const x = l.dx * (1 - pIn) - l.dx * q, y = l.dy * (1 - pIn) + l.dy * 1.2 * q, rot = (l.rot * (1 - pIn) - l.rot * q) * Math.PI / 180;
    const ks = L.tam / 230 * 0.55, ox = l.x + l.w / 2, oy = L.base - 0.3 * L.tam;
    c.save(); c.globalAlpha = op; c.translate(ox + x, oy + y); c.rotate(rot); c.scale(esc, esc); c.translate(-ox, -oy);
    c.font = `italic 500 ${L.tam}px ${FONTE}`; c.textBaseline = 'alphabetic'; c.fillStyle = L.cor;
    for (const [sx, sy, blur, al] of [[(3 + 16 * lev) * ks, (5 + 30 * lev) * ks, (6 + 30 * lev) * ks, 0.28 - 0.1 * lev], [0.7 * ks, 1.4 * ks, 1.2 * ks, 0.35 * (1 - Math.min(1, lev))]]) {
      c.shadowColor = `rgba(${TINTA},${al})`; c.shadowBlur = blur; c.shadowOffsetX = sx; c.shadowOffsetY = sy; c.fillText(l.ch, l.x, L.base);
    }
    c.shadowColor = 'transparent'; c.fillText(l.ch, l.x, L.base);
    c.restore();
  }
  c.restore();
}

function render(t) {
  if (!document.fonts.check(`italic 500 40px ${FONTE}`)) return;
  if (!padraoGrao) padraoGrao = c.createPattern(grao, 'repeat');
  if (!letras) medirLetras();
  c.save();
  // a página: creme, vinheta leve, grão
  c.fillStyle = COR.creme; c.fillRect(0, 0, W, H);
  const vin = c.createRadialGradient(730, 454, 300, 730, 454, 1250); vin.addColorStop(0.55, `rgba(${TINTA},0)`); vin.addColorStop(1, `rgba(${TINTA},0.10)`);
  c.fillStyle = vin; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.9; c.fillStyle = padraoGrao; c.fillRect(0, 0, W, H); c.restore();

  // colinas: sobem de baixo, respiram, afundam
  COLINAS.forEach((f, i) => {
    const [p, L1] = pousa(t, f.tIn, 0.8), [q, L2] = sai(t, f.tOut, 0.42), b = pulso(t, 6.1 + 0.22 * i, 0.8);
    const y = (1 - p) * 820 + q * 820 - 14 * b, L = (t < 6 ? L1 : L2) + 0.55 * b;
    desenhaFolha(f, t, 0, y, 1 + 0.035 * Math.max(t < 6 ? L1 : 0, L2) + 0.006 * b, 0, L);
  });
  // sol
  { const [p, L1] = pousa(t, SOL.tIn, 0.9), [q, L2] = sai(t, SOL.tOut, 0.42), b = pulso(t, 7.0, 1.0);
    desenhaFolha(SOL, t, 0, (1 - p) * 480 + q * 480 - 44 * b + 5 * onda(t, 3), 1 + 0.035 * Math.max(t < 6 ? L1 : 0, L2), 0, (t < 6 ? L1 : L2) + 0.6 * b); }
  // letras (atrás das ondas e das folhas, por cima das colinas)
  desenhaLetras(t);
  // ondas: deslizam das laterais, balançam, saem
  for (const f of ONDAS) {
    const p = seg(t, f.tIn, 0.85, 'power3.out'), L1 = 1 - seg(t, f.tIn + 0.3, 0.7, 'power2.inOut'), [q, L2] = sai(t, f.tOut, 0.45);
    desenhaFolha(f, t, f.dir * (1 - p) * 3300 + f.dir * q * 3300 + 22 * onda(t, 2, f.fase), 6 * onda(t, 2, f.fase + 0.25), 1, 0, t < 6 ? L1 : L2);
  }
  // folhas: giram nos cabos a partir dos cantos
  for (const f of FOLHAS) {
    const [p, L1] = pousa(t, f.tIn, 0.7), [q, L2] = sai(t, f.tOut, 0.45);
    if (p <= 0 || q >= 1) continue;
    const rot = f.lado * -105 * (1 - p) + f.lado * -105 * q + 1.6 * onda(t, 2, f.i * 0.17) - f.lado * 6 * pulso(t, 7.6 + 0.08 * f.i, 0.75);
    desenhaFolha(f, t, 0, 0, 1 + 0.04 * (t < 6 ? L1 : L2), rot, (t < 6 ? L1 : L2) * 0.9);
  }
  c.restore();
}

// ---------------------------------------------------------------- relógio
const rel = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(rel, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(rel.t % DUR) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
window.addEventListener('load', () => render(tl.time() % DUR));
document.fonts.ready.then(() => { letras = null; render(tl.time() % DUR); });
