// Motor do 13-showreel: um relógio só, render(t) desenha tudo a partir do tempo.
// Mescla de três referências: o pôster suíço que dança no compasso (papel, grade 6 x 4, Inter Tight, um só vermelho),
// o showreel em capítulos com moldura de estúdio (@stephanlivera) e a aula de princípios com anotações à mão (@himanshutwtxs).
// Fundo claro do começo ao fim; as anotações à mão viram caneta vermelha.
const W = 1920, H = 1080, DUR = 16, FPS = 30;
const PAPEL = '#F1EEE6', TINTA = '#111111', VERM = '#E63022', CINZA = 'rgba(17,17,17,.52)';
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');

// ---------- utilidades ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const expoOut = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);
const p4in = k => k * k * k * k;
const p4io = k => k < .5 ? 8 * k ** 4 : 1 - Math.pow(-2 * k + 2, 4) / 2;
const cubicIO = k => k < .5 ? 4 * k ** 3 : 1 - Math.pow(-2 * k + 2, 3) / 2;
const sineIn = k => 1 - Math.cos(k * Math.PI / 2);
const backOut = (k, s = 1.25) => { const c = s + 1; return 1 + c * (k - 1) ** 3 + s * (k - 1) ** 2; };
const elasticOut = (k, a = 1, p = .45) => { if (k <= 0) return 0; if (k >= 1) return 1; const s = p / (2 * Math.PI) * Math.asin(1 / a); return a * Math.pow(2, -10 * k) * Math.sin((k - s) * 2 * Math.PI / p) + 1; };
const bounceOut = k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; };
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const DT = 1 / 60; // meio quadro: o obturador do desfoque de movimento
const lim = (v, m = 90) => clamp(v, -m, m);

const fDisp = (s, w = 700) => `${w} ${s}px "Inter Tight"`;
const fSerif = s => `italic 400 ${s}px "Instrument Serif"`;
const fMao = s => `600 ${s}px "Caveat"`;
const fMono = (s, w = 500) => `${w} ${s}px "JetBrains Mono"`;

// ---------- grade suíça 6 x 4 ----------
const GX = [80, 380, 680, 980, 1280, 1580], CW = 260, GY = [92, 340, 588, 836], RH = 152;
const LV = GX.flatMap(x => [x, x + CW]), LH = GY.flatMap(y => [y, y + RH]);

// cada batida grande faz a grade pulsar
const BATIDAS = [.75, 1.25, 1.65, 1.95, 2.35, 2.9, 3.0, 3.5, 3.84, 4.0, 5.5, 6.5, 7.45, 8.0, 8.5, 9.0, 9.95, 10.45, 10.95,
  11.5, 11.55, 11.95, 12.38, 13.0, 13.5, 14.0, 14.45, 14.7];
function pulso(t) { let p = 0; for (const b of BATIDAS) if (t >= b) p = Math.max(p, Math.exp(-(t - b) / .14)); return p; }

// ---------- capítulos (moldura de estúdio + linha do tempo de princípios) ----------
const CAPS = [[0, '01', 'ESPAÇAMENTO', 'espaçamento'], [2.5, '02', 'IDENTIDADE', 'identidade'], [5, '03', 'CURVAS', 'curvas'],
  [7.5, '04', 'FORMA', 'antecipação'], [9.5, '05', 'PADRÕES', 'atraso'], [11.5, '06', 'LETRA', 'compasso'], [13, '07', 'FIM', 'olá']];

// ---------- fundo, grão e medidas (depois que as fontes chegam) ----------
let fundo = null, grao = null, pronto = false;
const L = {};
function preparar() {
  fundo = document.createElement('canvas'); fundo.width = W; fundo.height = H;
  const f = fundo.getContext('2d');
  f.fillStyle = PAPEL; f.fillRect(0, 0, W, H);
  const luz = f.createRadialGradient(640, 300, 40, 640, 300, 1350);
  luz.addColorStop(0, 'rgba(255,253,247,.6)'); luz.addColorStop(1, 'rgba(255,253,247,0)');
  f.fillStyle = luz; f.fillRect(0, 0, W, H);
  // grão, fibras e vinheta: multiplicados por cima de tudo, como impressão em papel
  grao = document.createElement('canvas'); grao.width = W; grao.height = H;
  const q = grao.getContext('2d');
  const img = q.createImageData(W, H), d = img.data, r = rng(7);
  for (let i = 0; i < d.length; i += 4) { const v = 255 - Math.floor(r() * r() * 30); d[i] = v; d[i + 1] = v - 1; d[i + 2] = v - 3; d[i + 3] = 255; }
  q.putImageData(img, 0, 0);
  const r2 = rng(11); q.lineWidth = 1;
  for (let i = 0; i < 170; i++) {
    const x = r2() * W, y = r2() * H, a = r2() * Math.PI, n = 18 + r2() * 60;
    q.strokeStyle = `rgba(120,100,80,${.07 + r2() * .09})`; q.beginPath(); q.moveTo(x, y);
    q.quadraticCurveTo(x + Math.cos(a) * n * .5 + (r2() - .5) * 12, y + Math.sin(a) * n * .5 + (r2() - .5) * 12, x + Math.cos(a) * n, y + Math.sin(a) * n); q.stroke();
  }
  const v = q.createRadialGradient(W * .42, H * .4, H * .5, W * .5, H * .5, H * 1.2);
  v.addColorStop(0, 'rgba(160,135,105,0)'); v.addColorStop(1, 'rgba(160,135,105,.24)');
  q.fillStyle = v; q.fillRect(0, 0, W, H);

  const c = ctx;
  c.font = fDisp(100, 800); L.claudeFs = 100 * 1760 / c.measureText('CLAUDE').width;
  c.font = fDisp(L.claudeFs, 800); L.claudeAsc = c.measureText('CLAUDE').actualBoundingBoxAscent;
  c.font = fDisp(100); L.l1Fs = 100 * RH / c.measureText('F').actualBoundingBoxAscent;
  L.dancFs = 100 * 1560 / c.measureText('dançar').width;
  c.font = fDisp(L.dancFs); L.dancW = c.measureText('dançar').width;
  L.rDanc = .072 * L.dancFs; L.pontoDanc = [80 + L.dancW + L.rDanc * 1.5, 836 - L.rDanc];
  c.font = fDisp(280, 800); L.fimW = c.measureText('CLAUDE').width; L.fimAsc = c.measureText('CLAUDE').actualBoundingBoxAscent;
  L.pontoFim = [360 + L.fimW + 46, 600 - 30];
}

// ---------- ferramentas de desenho ----------
// desfoque de movimento direcional: cópias ao longo do deslocamento de meio quadro
function borrado(c, dx, dy, fn) {
  const n0 = Math.hypot(dx, dy);
  if (n0 < 1.5) { fn(0, 0); return; }
  const a0 = c.globalAlpha, n = Math.min(12, Math.max(4, Math.round(n0 / 6))), a = Math.min(1, 1.9 / n);
  for (let i = 0; i < n; i++) { const k = i / (n - 1) - .5; c.globalAlpha = a0 * a; fn(dx * k, dy * k); }
  c.globalAlpha = a0;
}

// palavra que sobe de dentro de uma máscara, letra a letra (nunca em fade); "sai" devolve para a máscara
function sobe(c, t, txt, x, y, font, cor, t0, o = {}) {
  if (t < t0) return;
  const stg = o.stg ?? .03, dur = o.dur ?? .36;
  c.font = font;
  const asc = c.measureText('Hd').actualBoundingBoxAscent, top = y - asc * 1.15, bot = y + asc * (o.descK ?? .34), alt = bot - top;
  const off = (i, tt) => {
    let k = (1 - expoOut(prog(tt, t0 + i * stg, t0 + i * stg + dur))) * alt;
    if (o.sai != null) k += p4in(prog(tt, o.sai + i * stg * .5, o.sai + i * stg * .5 + (o.saiDur ?? .28))) * alt;
    return k;
  };
  if (o.sai != null && off(0, t) >= alt && t > o.sai) return;
  c.save(); c.beginPath(); c.rect(x - 60, top, o.larg ?? W, alt); c.clip();
  c.fillStyle = cor; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  for (let i = 0; i < txt.length; i++) {
    if (txt[i] === ' ') continue;
    const a = off(i, t); if (a >= alt - .5) continue;
    const xi = x + c.measureText(txt.slice(0, i)).width;
    borrado(c, 0, lim(a - off(i, t - DT), 40), (dx, dy) => c.fillText(txt[i], xi + dx, y + a + dy));
  }
  c.restore();
}

// troca de texto rolando para cima dentro de uma máscara
function rola(c, t, textos, tempos, x, y, font, cor, h, o = {}) {
  if (t < tempos[0]) return;
  let i = 0; while (i + 1 < tempos.length && t >= tempos[i + 1]) i++;
  const k = p4io(prog(t, tempos[i], tempos[i] + .25)), s = o.sai != null ? p4in(prog(t, o.sai, o.sai + .25)) : 0;
  if (s >= 1) return;
  c.save(); c.font = font; c.fillStyle = cor; c.textAlign = o.alinha || 'left'; c.textBaseline = 'alphabetic';
  const mx = o.alinha === 'right' ? x - 900 : x - 6;
  c.beginPath(); c.rect(mx, y - h, 906, h * 1.4); c.clip();
  c.fillText(textos[i], x, y + h * (1 - k) - h * s);
  if (i > 0 && k < 1) c.fillText(textos[i - 1], x, y - h * k);
  c.restore();
}

// texto datilografado (rótulos em mono)
function datilo(c, t, txt, x, y, font, cor, t0, dur, o = {}) {
  let n = Math.floor(txt.length * prog(t, t0, t0 + dur) + 1e-6);
  if (o.sai != null) n -= Math.floor(txt.length * prog(t, o.sai, o.sai + .2) + 1e-6);
  if (n <= 0) return;
  c.font = font; c.fillStyle = cor; c.textBaseline = 'alphabetic';
  if (o.alinha === 'right') { c.textAlign = 'left'; c.fillText(txt.slice(0, n), x - c.measureText(txt).width, y); }
  else { c.textAlign = 'left'; c.fillText(o.sai != null && t > o.sai ? txt.slice(txt.length - n) : txt.slice(0, n), x + (o.sai != null && t > o.sai ? c.measureText(txt.slice(0, txt.length - n)).width : 0), y); }
}

// seta à mão (curva quadrática), desenhada até p; "sai" come a seta pelo começo
function qpt(P, u) { const [x0, y0, cx, cy, x1, y1] = P, a = (1 - u) ** 2, b = 2 * (1 - u) * u, d = u * u; return [a * x0 + b * cx + d * x1, a * y0 + b * cy + d * y1]; }
function seta(c, P, p, sai = 0) {
  if (p <= sai) return;
  c.save(); c.strokeStyle = VERM; c.lineWidth = 3.2; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  for (let i = 0; i <= 24; i++) { const [x, y] = qpt(P, lerp(sai, p, i / 24)); i ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke();
  if (p > .97 && sai < .9) {
    const [x1, y1] = qpt(P, 1), [xa, ya] = qpt(P, .88), a = Math.atan2(y1 - ya, x1 - xa), n = 16;
    c.beginPath(); c.moveTo(x1 - n * Math.cos(a - .5), y1 - n * Math.sin(a - .5)); c.lineTo(x1, y1); c.lineTo(x1 - n * Math.cos(a + .5), y1 - n * Math.sin(a + .5)); c.stroke();
  }
  c.restore();
}

// anotação à mão em caneta vermelha: escreve da esquerda para a direita; na saída apaga na mesma direção
function nota(c, t, o) {
  const s = o.tam || 40, dur = o.dur || .26;
  const pin = prog(t, o.t0, o.t0 + dur); if (pin <= 0) return;
  const pout = o.t1 != null ? prog(t, o.t1, o.t1 + .16) : 0; if (pout >= 1) return;
  c.save(); c.translate(o.x, o.y); c.rotate((o.rot ?? -3) * Math.PI / 180);
  c.font = fMao(s); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const w = c.measureText(o.txt).width;
  if (o.chip) { const pc = expoOut(prog(t, o.t0 - .06, o.t0 + .14)); c.fillStyle = PAPEL; c.fillRect(-16 + (w + 32) * pout, -s * .95, (w + 32) * (pc - pout) + (o.visto ? 50 : 0), s * 1.4); }
  c.save(); c.beginPath(); c.rect(w * pout - 6, -s * 1.2, w * (pin - pout) + 12, s * 1.9); c.clip();
  c.fillStyle = VERM; c.fillText(o.txt, 0, 0); c.restore();
  c.strokeStyle = VERM; c.lineCap = 'round'; c.lineJoin = 'round';
  if (o.risco && pout < .5) { const pr = prog(t, o.risco, o.risco + .16); if (pr > 0) { c.lineWidth = 3.6; c.beginPath(); c.moveTo(-8, -s * .27); c.lineTo(-8 + (w + 16) * pr, -s * .33); c.stroke(); } }
  if (o.visto && pout < .5) {
    const pv = prog(t, o.visto, o.visto + .18);
    if (pv > 0) {
      const P = [[w + 14, -s * .32], [w + 26, -s * .12], [w + 52, -s * .66]], sg = pv * 2;
      c.lineWidth = 4; c.beginPath(); c.moveTo(...P[0]);
      c.lineTo(lerp(P[0][0], P[1][0], clamp(sg)), lerp(P[0][1], P[1][1], clamp(sg)));
      if (sg > 1) c.lineTo(lerp(P[1][0], P[2][0], clamp(sg - 1)), lerp(P[1][1], P[2][1], clamp(sg - 1)));
      c.stroke();
    }
  }
  c.restore();
  if (o.seta) seta(c, o.seta, prog(t, o.t0 + dur * .8, o.t0 + dur * .8 + .2), pout);
}

// a faísca: o círculo estoura em 12 raios
const RAIOS = [1, .78, .92, .84, 1, .8, .95, .76, 1, .86, .9, .8];
function faisca(c, cx, cy, t, t0, R, rot, sai = null, nucleo = false) {
  c.fillStyle = VERM;
  for (let i = 0; i < 12; i++) {
    let p = expoOut(prog(t, t0 + i * .012, t0 + i * .012 + .34));
    if (sai != null) p *= 1 - p4in(prog(t, sai + (11 - i) * .01, sai + (11 - i) * .01 + .22));
    const n = R * RAIOS[i] * p; if (n < 2) continue;
    const w0 = R * .085, w1 = R * .05;
    c.save(); c.translate(cx, cy); c.rotate(rot + i * Math.PI / 6);
    c.beginPath(); c.moveTo(0, -w0); c.lineTo(n, -w1); c.arc(n, 0, w1, -Math.PI / 2, Math.PI / 2); c.lineTo(0, w0); c.closePath(); c.fill();
    c.restore();
  }
  if (nucleo) { const p = expoOut(prog(t, t0, t0 + .3)); c.beginPath(); c.arc(cx, cy, R * .17 * p, 0, Math.PI * 2); c.fill(); }
}

// =====================================================================
// O PONTO VERMELHO: o mesmo objeto do começo ao fim (bola, círculo, núcleo da faísca, corredor, forma, ponto final, peça vazia)
// =====================================================================
const CHAO = 740, BR = 34, CASA = [1640, 300];
const ARCOS = [{ a: .75, b: 1.25, x0: 440, x1: 860, h: 400 }, { a: 1.25, b: 1.65, x0: 860, x1: 1180, h: 230 }, { a: 1.65, b: 1.95, x0: 1180, x1: 1400, h: 110 }];
const CONTATOS = [.75, 1.25, 1.65, 1.95];
function bolaPos(t) {
  const yc = CHAO - BR;
  if (t < .75) { const s = prog(t, .3, .75); return [lerp(170, 440, s), lerp(-60, yc, s * s)]; }
  for (const A of ARCOS) if (t < A.b) { const s = prog(t, A.a, A.b); return [lerp(A.x0, A.x1, s), yc - 4 * A.h * s * (1 - s)]; }
  const s = prog(t, 1.95, 2.3); return [lerp(1400, CASA[0], Math.pow(s, .85)), lerp(yc, CASA[1], 1 - Math.pow(1 - s, 2.4))];
}
function bolaEscala(t) { // achata no chão, estica na queda
  for (const tc of CONTATOS) { const d = Math.abs(t - tc); if (d < .07) { const k = 1 - d / .07; return [1 + .32 * k, 1 - .36 * k]; } }
  const v = Math.abs(bolaPos(t)[1] - bolaPos(t - DT)[1]) / DT, e = clamp(v / 3400) * .26;
  return [1 - e * .5, 1 + e];
}
const amassa = (t, tc, a = .3) => { const d = t - tc; if (d < 0 || d > .16) return [1, 1]; const k = Math.sin(Math.PI * d / .16); return [1 + a * k, 1 - a * k]; };

const PA = 640, PB = 1480, PY = i => 372 + i * 100;
const FC = [760, 560], FR = 150;
const CEL = { TL: [80, 92], TR: [980, 92], BL: [80, 588], BR: [980, 588] }, CLW = 860, CLH = 400;
const centro = k => [CEL[k][0] + CLW / 2, CEL[k][1] + CLH / 2];

function pontoEstado(t) {
  if (t < .3) return null;
  if (t < 2.3) {
    const [x, y] = bolaPos(t), [sx, sy] = bolaEscala(t);
    return { x, y: Math.min(y, CHAO - BR * sy), r: BR, sx, sy };
  }
  if (t < 2.9) { const r = (34 + 116 * elasticOut(prog(t, 2.3, 2.75))) * (1 - .2 * sineIn(prog(t, 2.75, 2.9))); return { x: CASA[0], y: CASA[1], r }; }
  if (t < 4.75) return { x: CASA[0], y: CASA[1], r: lerp(120, 22, expoOut(prog(t, 2.9, 3.15))) };
  if (t < 5.5) { const k = p4io(prog(t, 4.75, 5.2)); return { x: lerp(CASA[0], PA, k), y: lerp(CASA[1], PY(1), k) - 120 * Math.sin(Math.PI * k), r: lerp(22, 18, k) }; }
  if (t < 7.25) return { x: PA + (PB - PA) * cubicIO(prog(t, 5.5, 6.5)), y: PY(1), r: 18 };
  if (t < 7.45) { const k = p4io(prog(t, 7.25, 7.45)); return { x: lerp(PB, FC[0], k), y: lerp(PY(1), FC[1], k), r: 18 }; }
  if (t < 12.1) return null; // vira a forma do capítulo 4 e o padrão nasce dele
  const PD = L.pontoDanc, rD = L.rDanc;
  if (t < 12.95) { const k = prog(t, 12.1, 12.38), [sx, sy] = amassa(t, 12.38, .34); return { x: PD[0], y: Math.min(lerp(-80, PD[1], k * k), 836 - rD * sy), r: rD, sx, sy }; }
  const [tlx, tly] = centro('TL'), [blx, bly] = centro('BL'), [brx, bry] = centro('BR');
  if (t < 13.5) { const k = p4io(prog(t, 12.95, 13.2)); return { x: lerp(PD[0], tlx, k), y: lerp(PD[1], tly, k) - 90 * Math.sin(Math.PI * k), r: lerp(rD, 60, k) }; }
  if (t < 14.0) { const k = p4io(prog(t, 13.5, 13.86)); return { x: tlx + 180 * Math.sin(Math.PI * k), y: lerp(tly, bly, k), r: 60 }; }
  if (t < 14.3) { const k = p4io(prog(t, 14.0, 14.36)); return { x: lerp(blx, brx, k), y: bly - 150 * Math.sin(Math.PI * k), r: 60 }; }
  const PF = L.pontoFim, k = p4io(prog(t, 14.3, 14.7)), [sx, sy] = amassa(t, 14.7, .3);
  return { x: lerp(brx, PF[0], k), y: lerp(bry, PF[1], k) - 100 * Math.sin(Math.PI * k), r: lerp(60, 30, k), sx, sy };
}
function ponto(c, t) {
  const e = pontoEstado(t); if (!e) return;
  const e0 = pontoEstado(t - DT) || e;
  c.fillStyle = VERM;
  borrado(c, lim(e.x - e0.x), lim(e.y - e0.y), (dx, dy) => {
    c.beginPath(); c.ellipse(e.x + dx, e.y + dy, e.r * (e.sx || 1), e.r * (e.sy || 1), 0, 0, Math.PI * 2); c.fill();
  });
}

// =====================================================================
// 01 · ESPAÇAMENTO: a bola quica no chão, com fantasmas, caminho pontilhado e anotações
// =====================================================================
function cap1(c, t) {
  if (t >= 2.6) return;
  const pc = expoOut(prog(t, .2, .65)), sc = p4in(prog(t, 2.1, 2.45));
  if (pc > sc) { c.strokeStyle = TINTA; c.lineWidth = 2; c.beginPath(); c.moveTo(80 + 1760 * sc, CHAO); c.lineTo(80 + 1760 * pc, CHAO); c.stroke(); }
  if (t > .3) {
    const fim = Math.min(t, 2.3), ini = t < 1.95 ? .3 : lerp(.3, fim, p4io(prog(t, 1.95, 2.3)));
    c.fillStyle = 'rgba(17,17,17,.4)';
    for (let tt = ini; tt < fim; tt += .011) { const [x, y] = bolaPos(tt); c.beginPath(); c.arc(x, y, 1.8, 0, Math.PI * 2); c.fill(); }
  }
  if (t > .35 && t < 2.15) {
    c.lineWidth = 1.6;
    for (let g = 1; g <= 7; g++) {
      const tt = t - g * .05; if (tt < .3) break;
      const [x, y] = bolaPos(tt), [sx, sy] = bolaEscala(tt);
      c.strokeStyle = `rgba(17,17,17,${.34 * (1 - g / 8)})`;
      c.beginPath(); c.ellipse(x, Math.min(y, CHAO - BR * sy), BR * sx, BR * sy, 0, 0, Math.PI * 2); c.stroke();
    }
  }
  nota(c, t, { txt: 'achata!', x: 470, y: 818, t0: .8, t1: 2.04, rot: 3, seta: [462, 788, 436, 790, 444, 754] });
  nota(c, t, { txt: 'suave no topo', x: 392, y: 214, t0: .95, t1: 2.0, seta: [610, 196, 668, 192, 664, 250] });
  nota(c, t, { txt: 'estica', x: 1180, y: 430, t0: 1.45, t1: 2.08, seta: [1176, 442, 1138, 454, 1134, 520] });
}

// =====================================================================
// 02 · IDENTIDADE: o círculo estoura na faísca, CLAUDE bate e se fatia, "motion designer" sobe
// =====================================================================
function cap2(c, t) {
  if (t < 2.85 || t >= 5.0) return;
  const rot = (15 * elasticOut(prog(t, 2.9, 3.4)) + 12 * (t - 2.9)) * Math.PI / 180;
  faisca(c, CASA[0], CASA[1], t, 2.9, 175, rot, 4.6);

  if (t >= 3.0) {
    const fs = L.claudeFs, asc = L.claudeAsc, base = 950, x = 80, top = base - asc - 24, alt = asc + 30;
    const subir = tt => (1 - expoOut(prog(tt, 3.0, 3.36))) * alt * 1.1;
    const fatia = (tt, b) => { const A = [-80, 110, -60][b]; if (tt < 3.5) return 0; if (tt < 3.84) return A * p4io(prog(tt, 3.5, 3.64)); return A * (1 - elasticOut(prog(tt, 3.84, 4.24))); };
    const saida = (tt, b) => -2200 * p4in(prog(tt, 4.55 + b * .04, 4.85 + b * .04));
    c.save(); c.beginPath(); c.rect(0, top, W, alt + 2); c.clip();
    c.font = fDisp(fs, 800); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    if (t < 3.5) { // fantasma vermelho fora de registro
      const gy = subir(t - .06), gx = 16 * (1 - prog(t, 3.36, 3.5));
      c.fillStyle = VERM; borrado(c, 0, lim(gy - subir(t - .06 - DT), 34), (dx, dy) => c.fillText('CLAUDE', x + gx, base + gy + dy));
    }
    c.fillStyle = TINTA;
    for (let b = 0; b < 3; b++) {
      const dx = fatia(t, b) + saida(t, b), vx = dx - fatia(t - DT, b) - saida(t - DT, b);
      const dy = subir(t), vy = dy - subir(t - DT);
      c.save(); c.beginPath(); c.rect(0, top + alt * b / 3 - (b === 0 ? 50 : 0), W, alt / 3 + (b !== 1 ? 50 : 0) + 1); c.clip();
      borrado(c, lim(vx, 70), lim(vy, 34), (ox, oy) => c.fillText('CLAUDE', x + dx + ox, base + dy + oy));
      c.restore();
    }
    c.restore();
  }
  sobe(c, t, 'motion designer', 84, 540, fSerif(140), TINTA, 3.82, { stg: .018, sai: 4.55, descK: .42 });
  nota(c, t, { txt: 'prazer!', x: 1190, y: 160, t0: 3.98, t1: 4.55, seta: [1310, 150, 1420, 138, 1468, 210] });
}

// =====================================================================
// 03 · CURVAS: seis jeitos de ir de A a B, mesma distância, mesmo tempo
// =====================================================================
const PISTAS = [['linear', k => k], ['suave', cubicIO], ['expo', expoOut], ['recuo', k => backOut(k, 1.7)], ['elástico', k => elasticOut(k, 1, .35)], ['quique', bounceOut]];
const CORR = [5.5, 6.5];
function cap3(c, t) {
  if (t < 5.0 || t >= 7.6) return;
  sobe(c, t, 'Seis jeitos de chegar.', 84, 236, fSerif(96), TINTA, 5.0, { stg: .012, sai: 7.15, descK: .42 });
  datilo(c, t, 'MESMA DISTÂNCIA · MESMO TEMPO (1 S)', 1840, 226, fMono(14), CINZA, 5.1, .3, { alinha: 'right', sai: 7.15 });
  const pa = expoOut(prog(t, 5.1, 5.4)) * (1 - p4in(prog(t, 7.15, 7.4)));
  if (pa > .5) { c.font = fMono(14, 700); c.fillStyle = TINTA; c.textAlign = 'center'; c.fillText('A', PA, 324); c.fillText('B', PB, 324); c.textAlign = 'left'; }
  for (let i = 0; i < 6; i++) {
    const y = PY(i), d = .05 * i, ease = PISTAS[i][1];
    const ent = expoOut(prog(t, 5.15 + d, 5.55 + d)), sai = p4in(prog(t, 7.15 + d * .5, 7.45 + d * .5));
    sobe(c, t, '0' + (i + 1), 84, y + 8, fMono(16, 700), VERM, 5.1 + d, { sai: 7.12 + d * .5, larg: 40 });
    sobe(c, t, PISTAS[i][0], 130, y + 8, fMono(24), TINTA, 5.12 + d, { sai: 7.14 + d * .5, larg: 260 });
    // ícone da curva
    if (ent > sai) {
      c.strokeStyle = TINTA; c.lineWidth = 2; c.beginPath();
      for (let u = sai; u <= ent + 1e-6; u += .02) { const px = 420 + 70 * u, py = y + 20 - 40 * ease(u); u === sai ? c.moveTo(px, py) : c.lineTo(px, py); }
      c.stroke();
      c.strokeStyle = 'rgba(17,17,17,.25)'; c.lineWidth = 1; c.strokeRect(420, y - 24, 70, 48);
      const k = prog(t, ...CORR); c.fillStyle = VERM; c.beginPath(); c.arc(420 + 70 * k, y + 20 - 40 * ease(k), 4, 0, Math.PI * 2); c.fill();
    }
    // trilho de A a B
    const x0 = PA + (PB - PA) * sai, x1 = PA + (PB - PA) * ent;
    if (x1 > x0) {
      c.strokeStyle = 'rgba(17,17,17,.3)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
      c.strokeStyle = TINTA; c.lineWidth = 1.5; c.beginPath();
      if (sai === 0) { c.moveTo(PA, y - 9); c.lineTo(PA, y + 9); }
      if (ent > .99) { c.moveTo(PB, y - 9); c.lineTo(PB, y + 9); }
      c.stroke();
      // marcas de espaçamento: onde a bola estava a cada 0,1 s
      c.strokeStyle = i === 1 ? VERM : 'rgba(17,17,17,.5)'; c.lineWidth = 2; c.beginPath();
      for (let k = 1; k <= 9; k++) { if (t < CORR[0] + k * .1) break; const xm = PA + (PB - PA) * ease(k / 10); if (xm < x0 || xm > x1 + 40) continue; c.moveTo(xm, y - 26); c.lineTo(xm, y - 15); }
      c.stroke();
    }
    // fantasmas da corrida
    const pos = tt => PA + (PB - PA) * ease(prog(tt, ...CORR));
    if (t > CORR[0] && t < CORR[1] + .2) {
      c.lineWidth = 1.5;
      for (let g = 1; g <= 4; g++) { const tt = t - g / 30; if (tt < CORR[0]) break; c.strokeStyle = i === 1 ? `rgba(230,48,34,${.4 * (1 - g / 5)})` : `rgba(17,17,17,${.32 * (1 - g / 5)})`; c.beginPath(); c.arc(pos(tt), y, 18, 0, Math.PI * 2); c.stroke(); }
    }
    // a bola (a da pista 2 é o ponto vermelho)
    if (i !== 1) {
      const pe = prog(t, 5.2 + d, 5.5 + d); if (pe <= 0) continue;
      const fora = tt => 1100 * p4in(prog(tt, 7.2 + i * .03, 7.48 + i * .03));
      const xb = pos(t) + fora(t), vx = xb - pos(t - DT) - fora(t - DT), r = 18 * lerp(1.5, 1, expoOut(pe));
      c.fillStyle = TINTA; borrado(c, lim(vx), 0, (dx) => { c.beginPath(); c.arc(xb + dx, y, r, 0, Math.PI * 2); c.fill(); });
    }
  }
  nota(c, t, { txt: '= robótico', x: 1534, y: PY(0) + 12, t0: 6.55, t1: 7.15, risco: 6.86, rot: -2 });
  nota(c, t, { txt: 'natural', x: 1534, y: PY(1) + 12, t0: 6.78, t1: 7.2, visto: 7.0, rot: -2 });
}

// =====================================================================
// 04 · FORMA: o ponto cresce e vira círculo → triângulo → estrela → quadrado, sempre com antecipação
// =====================================================================
const MORFS = [8.0, 8.5, 9.0], NF = 120;
function rPoli(n, th, R, rot = -Math.PI / 2) { const a = 2 * Math.PI / n, x = (((th - rot) % a) + a) % a - a / 2; return R * Math.cos(Math.PI / n) / Math.cos(x); }
function rEstrela(th, R, ri, rot = -Math.PI / 2) {
  const a = Math.PI / 5, u = (((th - rot) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), k = Math.floor(u / a);
  const a1 = k * a, a2 = a1 + a, r1 = k % 2 ? ri * R : R, r2 = k % 2 ? R : ri * R;
  return r1 * r2 * Math.sin(a2 - a1) / (r1 * Math.sin(u - a1) + r2 * Math.sin(a2 - u));
}
function raioForma(f, th) {
  if (f === 0) return 1;
  if (f === 1) return rPoli(3, th, 1.2);
  if (f === 2) return rEstrela(th, 1.24, .5);
  return .9 / Math.pow(Math.abs(Math.cos(th)) ** 4 + Math.abs(Math.sin(th)) ** 4, .25);
}
function formaRaios(t, n = NF) {
  const out = new Array(n);
  for (let k = 0; k < n; k++) {
    const th = k / n * 2 * Math.PI; let r = 1;
    for (let m = 0; m < 3; m++) { const e = p4io(prog(t, MORFS[m], MORFS[m] + .3)); if (e > 0) r = lerp(r, raioForma(m + 1, th), e); }
    out[k] = r;
  }
  return out;
}
function antecip(t, tm) { if (t < tm - .14) return 1; if (t < tm) return 1 - .14 * sineIn(prog(t, tm - .14, tm)); return lerp(.86, 1, elasticOut(prog(t, tm, tm + .5))); }
function formaEscala(t) { let s = 18 / FR + (1 - 18 / FR) * elasticOut(prog(t, 7.45, 7.9)); for (const m of MORFS) s *= antecip(t, m); return s * (1 - p4in(prog(t, 9.28, 9.52))); }
function formaRot(t) { let r = .25 * (t - 7.45); for (const m of MORFS) r += Math.PI / 2 * elasticOut(prog(t, m, m + .5)); return r; }
function caminhoForma(c, cx, cy, R, raios, rot) {
  const n = raios.length; c.beginPath();
  for (let k = 0; k < n; k++) { const th = k / n * 2 * Math.PI, r = raios[k] * R, x = cx + r * Math.cos(th + rot), y = cy + r * Math.sin(th + rot); k ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.closePath();
}
const NOMES = ['CÍRCULO → TRIÂNGULO', 'TRIÂNGULO → ESTRELA', 'ESTRELA → QUADRADO'];
function cap4(c, t) {
  if (t < 7.45 || t >= 9.6) return;
  const [cx, cy] = FC;
  const am = expoOut(prog(t, 7.5, 7.95)) * (1 - p4in(prog(t, 9.2, 9.45)));
  if (am > 0) {
    c.strokeStyle = 'rgba(17,17,17,.28)'; c.lineWidth = 1; c.beginPath();
    c.moveTo(cx - 440 * am, cy); c.lineTo(cx + 440 * am, cy); c.moveTo(cx, cy - 360 * am); c.lineTo(cx, cy + 360 * am); c.stroke();
    c.setLineDash([3, 9]); c.beginPath(); c.arc(cx, cy, 300, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * am); c.stroke(); c.setLineDash([]);
    if (am > .95) { c.font = fMono(12); c.fillStyle = CINZA; c.textAlign = 'left'; c.fillText('0°', cx + 450, cy + 4); c.fillText('90°', cx + 8, cy - 352); c.fillText('180°', cx - 488, cy + 4); }
  }
  // satélites no anel, copiando a forma com atraso
  for (let j = 0; j < 12; j++) {
    const ts = 7.6 + j * .025, p = backOut(prog(t, ts, ts + .3), 1.6); if (p <= 0) continue;
    const out = tt => 1300 * p4in(prog(tt, 9.22 + j * .01, 9.47 + j * .01));
    const ang = tt => { let a = j * Math.PI / 6 + .45 * (tt - 7.6); for (const m of MORFS) a += Math.PI / 6 * expoOut(prog(tt, m + .04, m + .4)); return a; };
    const pos = tt => [cx + (300 + out(tt)) * Math.cos(ang(tt)), cy + (300 + out(tt)) * Math.sin(ang(tt))];
    const [sx, sy] = pos(t), [sx0, sy0] = pos(t - DT), ra = formaRaios(t - j * .02, 36), rr = formaRot(t - j * .02);
    c.fillStyle = TINTA;
    borrado(c, lim(sx - sx0), lim(sy - sy0), (dx, dy) => { caminhoForma(c, sx + dx, sy + dy, 15 * p, ra, rr); c.fill(); });
  }
  // ecos do giro (contornos que ficam para trás)
  for (const d of [.1, .05]) {
    const rot = formaRot(t - d), a = clamp(Math.abs(formaRot(t) - rot) / .35) * .55;
    if (a < .03 || t - d < 7.45) continue;
    caminhoForma(c, cx, cy, FR * formaEscala(t - d), formaRaios(t - d), rot); c.strokeStyle = `rgba(17,17,17,${a})`; c.lineWidth = 2; c.stroke();
  }
  caminhoForma(c, cx, cy, FR * formaEscala(t), formaRaios(t), formaRot(t)); c.fillStyle = VERM; c.fill();
  // leitura de estúdio
  sobe(c, t, 'METAMORFOSE', 1220, 448, fMono(13, 700), CINZA, 7.62, { sai: 9.15, larg: 600 });
  rola(c, t, NOMES, [7.68, 8.2, 8.7], 1220, 500, fMono(30), TINTA, 34, { sai: 9.17 });
  if (t >= 7.74) {
    const deg = (formaRot(t) * 180 / Math.PI).toFixed(1).replace('.', ',');
    rola(c, t, [`ROT ${deg}°   ·   MOLA f=2,6  ζ=0,30`], [7.74], 1220, 540, fMono(14), CINZA, 18, { sai: 9.19 });
  }
  nota(c, t, { txt: 'antecipação', x: 1040, y: 300, t0: 7.8, t1: 9.15, seta: [1048, 316, 960, 330, 902, 420] });
}

// =====================================================================
// 05 · PADRÕES: o padrão de arcos nasce do ponto e gira em ondas
// =====================================================================
const TT = 120, TC = 16, TR = 9;
const TORI = (() => { const r = rng(42); return Array.from({ length: TC * TR }, () => r() < .5 ? 0 : 1); })();
const ONDAS = [9.95, 10.45, 10.95];
function cap5(c, t) {
  if (t < 9.4 || t >= 11.5) return;
  c.lineWidth = 22; c.lineCap = 'butt';
  const h = TT / 2;
  for (let j = 0; j < TR; j++) for (let i = 0; i < TC; i++) {
    const cx = i * TT + h, cy = j * TT + h, dist = Math.hypot(cx - FC[0], cy - FC[1]);
    const din = 9.42 + dist / 2600, dout = 11.12 + j * .025 + i * .004;
    const p = expoOut(prog(t, din, din + .32)) * (1 - p4in(prog(t, dout, dout + .2)));
    if (p <= .002) continue;
    const d1 = cx / W * .42, d2 = (cx + cy) / (W + H) * .42, d3 = (W - cx) / W * .42;
    const giro = p4io(prog(t, ONDAS[0] + d1, ONDAS[0] + d1 + .28)) + p4io(prog(t, ONDAS[1] + d2, ONDAS[1] + d2 + .28)) + p4io(prog(t, ONDAS[2] + d3, ONDAS[2] + d3 + .28));
    c.strokeStyle = t > ONDAS[1] + d2 + .14 && t < ONDAS[2] + d3 + .14 ? VERM : TINTA;
    c.save(); c.translate(cx, cy); c.rotate(giro * Math.PI / 2);
    const sw = Math.PI / 2 * p, o = TORI[j * TC + i];
    c.beginPath(); if (o === 0) c.arc(-h, -h, h, 0, sw); else c.arc(h, -h, h, Math.PI / 2, Math.PI / 2 + sw); c.stroke();
    c.beginPath(); if (o === 0) c.arc(h, h, h, Math.PI, Math.PI + sw); else c.arc(-h, h, h, Math.PI * 1.5, Math.PI * 1.5 + sw); c.stroke();
    c.restore();
  }
  nota(c, t, { txt: 'atraso: 45 ms', x: 1290, y: 214, t0: 10.05, t1: 11.05, chip: true, seta: [1282, 226, 1190, 240, 1150, 318] });
  if (t >= 9.7 && t < 11.15) {
    const txt = 'ARCOS × 144  ·  3 ONDAS  ·  SEMENTE 0x2A';
    c.font = fMono(13); const w = c.measureText(txt).width;
    c.fillStyle = PAPEL; c.fillRect(1840 - w - 18, 950, w + 18, 30);
    datilo(c, t, txt, 1831, 970, fMono(13), TINTA, 9.7, .3, { alinha: 'right' });
  }
}

// =====================================================================
// 06 · LETRA: "Faço a letra dançar." — as letras pulam de linha como notas
// =====================================================================
function cap6(c, t) {
  if (t < 11.45 || t >= 13.3) return;
  sobe(c, t, 'Faço a letra', 80, 244, fDisp(L.l1Fs), TINTA, 11.47, { sai: 12.85 });
  const fs = L.dancFs, base = 836, U = 62, txt = 'dançar';
  const O0 = [-2, 1, -1, 0, -3, 1], O1 = [1, -2, 1, -1, 0, -2];
  c.font = fDisp(fs); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = TINTA;
  for (let i = 0; i < txt.length; i++) {
    const ts = 11.55 + i * .04, pS = prog(t, ts, ts + .3); if (pS <= 0) continue;
    const xi = 80 + c.measureText(txt.slice(0, i)).width, wi = c.measureText(txt[i]).width;
    const off = tt => {
      const h1 = backOut(prog(tt, 11.95 + i * .03, 12.21 + i * .03)), h2 = backOut(prog(tt, 12.3 + i * .02, 12.56 + i * .02));
      return lerp(lerp(O0[i], O1[i], h1), 0, h2) * U - 40 * (1 - expoOut(prog(tt, ts, ts + .3)));
    };
    const fora = tt => -2300 * p4in(prog(tt, 12.88 + (5 - i) * .02, 13.14 + (5 - i) * .02));
    const sc = lerp(1.12, 1, expoOut(pS)), [, sq] = amassa(t, 12.42 + i * .02, .07);
    const y = off(t), vy = y - off(t - DT), x = fora(t), vx = x - fora(t - DT);
    c.save(); c.translate(xi + wi / 2 + x, base + y); c.scale(sc * (2 - sq), sc * sq);
    borrado(c, lim(vx), lim(vy, 40), (dx, dy) => c.fillText(txt[i], -wi / 2 + dx, dy));
    c.restore();
  }
  nota(c, t, { txt: 'no compasso', x: 1420, y: 160, t0: 11.95, t1: 12.8, seta: [1560, 176, 1652, 220, 1640, 318] });
}

// =====================================================================
// 07 · FIM: três peças pretas deslizam como quebra-cabeça e o ponto troca de lugar; depois a assinatura
// =====================================================================
const PECAS = [{ txt: 'Feito', ini: 'BL', ts: 13.0, mov: [[13.5, 'BL', 'TL']] }, { txt: 'em', ini: 'TR', ts: 13.06, mov: [] }, { txt: 'código', ini: 'BR', ts: 13.12, mov: [[14.0, 'BR', 'BL']] }];
function cap7(c, t) {
  if (t >= 13.0 && t < 14.7) {
    PECAS.forEach((pc, n) => {
      const p = prog(t, pc.ts, pc.ts + .4); if (p <= 0) return;
      const pos = tt => { let [x, y] = CEL[pc.ini]; for (const [tm, a, b] of pc.mov) { const k = p4io(prog(tt, tm, tm + .36)); x = lerp(x, CEL[b][0], k); y = lerp(y, CEL[b][1], k); } return [x - 2400 * p4in(prog(tt, 14.25 + n * .05, 14.55 + n * .05)), y]; };
      const [x, y] = pos(t), [x0, y0] = pos(t - DT);
      let sc = p < .4 ? lerp(1.08, .985, expoOut(p / .4)) : lerp(.985, 1, elasticOut((p - .4) / .6));
      for (const [tm] of pc.mov) { const q = prog(t, tm + .3, tm + .62); if (q > 0 && q < 1) sc *= 1 - .015 * Math.sin(Math.PI * q); }
      c.save(); c.translate(x + CLW / 2, y + CLH / 2); c.scale(sc, sc);
      const g = c.createLinearGradient(0, -CLH / 2, 0, CLH / 2); g.addColorStop(0, '#1D1C1A'); g.addColorStop(1, '#0C0C0C');
      borrado(c, lim(x - x0, 70), lim(y - y0, 50), (dx, dy) => {
        c.fillStyle = g; c.fillRect(-CLW / 2 + dx, -CLH / 2 + dy, CLW, CLH);
        c.fillStyle = PAPEL; c.font = fDisp(210); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(pc.txt, -CLW / 2 + 30 + dx, CLH / 2 - 44 + dy);
      });
      c.restore();
    });
  }
  if (t < 14.3) return;
  // assinatura
  const base = 600, x0 = 360;
  faisca(c, 200, base - L.fimAsc / 2, t, 14.35, 112, (15 * elasticOut(prog(t, 14.35, 14.85)) + 10 * (t - 14.35)) * Math.PI / 180, null, true);
  sobe(c, t, 'CLAUDE', x0, base, fDisp(280, 800), TINTA, 14.45, { stg: .035 });
  sobe(c, t, 'motion designer', x0 + 6, 735, fSerif(118), TINTA, 14.75, { stg: .015, descK: .42 });
  const pr = expoOut(prog(t, 14.9, 15.3));
  if (pr > 0) { c.strokeStyle = TINTA; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 + 6, 790); c.lineTo(x0 + 6 + (1840 - x0 - 6) * pr, 790); c.stroke(); }
  datilo(c, t, 'SHOWREEL 2026  ·  16 SEGUNDOS  ·  CADA QUADRO ESCRITO EM CÓDIGO', x0 + 6, 830, fMono(15, 500), TINTA, 15.0, .35);
  nota(c, t, { txt: 'aberto a novos projetos', x: 1330, y: 912, t0: 15.15, dur: .34, seta: [1560, 872, 1606, 760, L.pontoFim[0] + 4, L.pontoFim[1] + 46] });
}

// =====================================================================
// grade, moldura de estúdio e linha do tempo
// =====================================================================
function grade(c, t) {
  const a = .085 + .12 * pulso(t);
  c.strokeStyle = `rgba(17,17,17,${a})`; c.lineWidth = 1;
  let n = 0;
  for (const x of LV) { const p = expoOut(prog(t, .05 + n * .035, .55 + n * .035)); n++; if (p <= 0) continue; c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H * p); c.stroke(); }
  for (const y of LH) { const p = expoOut(prog(t, .05 + n * .035, .55 + n * .035)); n++; if (p <= 0) continue; c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W * p, y + .5); c.stroke(); }
}
function moldura(c, t) {
  const pIn = expoOut(prog(t, .05, .45)), m = 24, n = 22 * pIn, chips = t >= 9.42 && t < 11.5;
  c.strokeStyle = TINTA; c.lineWidth = 2; c.beginPath();
  c.moveTo(m, m + n); c.lineTo(m, m); c.lineTo(m + n, m);
  c.moveTo(W - m - n, m); c.lineTo(W - m, m); c.lineTo(W - m, m + n);
  c.moveTo(m, H - m - n); c.lineTo(m, H - m); c.lineTo(m + n, H - m);
  c.moveTo(W - m - n, H - m); c.lineTo(W - m, H - m); c.lineTo(W - m, H - m - n);
  c.stroke();
  c.letterSpacing = '1.5px';
  if (chips) { c.fillStyle = PAPEL; c.fillRect(40, 30, 300, 28); c.fillRect(W - 300, 30, 262, 28); c.fillRect(40, 1000, 430, 58); c.fillRect(W - 470, 1028, 432, 28); }
  datilo(c, t, 'CLAUDE', 48, 50, fMono(12, 700), TINTA, .1, .2);
  datilo(c, t, 'SHOWREEL · 2026', 124, 50, fMono(12), CINZA, .18, .3);
  rola(c, t, CAPS.map(k => `${k[1]} · ${k[2]}`), CAPS.map(k => k[0] + .02), W - 48, 50, fMono(12, 700), TINTA, 16, { alinha: 'right' });
  // timecode e quadros por segundo
  const fr = Math.floor(t * FPS + 1e-6), ss = Math.floor(fr / FPS), ff = fr % FPS, z = v => String(v).padStart(2, '0');
  datilo(c, t, `00:00:${z(ss)}:${z(ff)}`, 48, 1046, fMono(12, 700), TINTA, .1, .15);
  datilo(c, t, '30 QPS', 196, 1046, fMono(12), CINZA, .2, .15);
  // BPM, batida dentro do compasso e compasso
  const beat = Math.floor(t / .5 + 1e-6) % 4, bar = Math.min(8, Math.floor(t / 2 + 1e-6) + 1);
  datilo(c, t, `COMPASSO ${bar}/8`, W - 48, 1046, fMono(12, 700), TINTA, .1, .2, { alinha: 'right' });
  if (pIn > .5) {
    c.font = fMono(12, 700); const wc = c.measureText(`COMPASSO ${bar}/8`).width;
    for (let i = 0; i < 4; i++) { const x = W - 48 - wc - 16 - (3 - i) * 14 - 9; c.strokeStyle = TINTA; c.lineWidth = 1.2; c.strokeRect(x + .5, 1037.5, 9, 9); if (i === beat) { c.fillStyle = TINTA; c.fillRect(x, 1037, 10, 10); } }
    datilo(c, t, '120 BPM', W - 48 - wc - 16 - 4 * 14 - 18, 1046, fMono(12), CINZA, .2, .1, { alinha: 'right' });
  }
  c.letterSpacing = '0px';
  // linha do tempo de princípios
  const y = 1012, xa = 48, xb = W - 48, pl = expoOut(prog(t, .1, .6)), px = xa + (xb - xa) * t / DUR;
  if (pl > 0) {
    c.strokeStyle = 'rgba(17,17,17,.28)'; c.lineWidth = 1; c.beginPath(); c.moveTo(xa, y + .5); c.lineTo(xa + (xb - xa) * pl, y + .5); c.stroke();
    c.strokeStyle = TINTA; c.lineWidth = 2; c.beginPath(); c.moveTo(xa, y + .5); c.lineTo(px, y + .5); c.stroke();
    for (const k of CAPS) {
      const xd = xa + (xb - xa) * k[0] / DUR; if (xd > xa + (xb - xa) * pl) continue;
      c.save(); c.translate(xd, y + .5); c.rotate(Math.PI / 4);
      if (t >= k[0]) { c.fillStyle = TINTA; c.fillRect(-4, -4, 8, 8); } else { c.fillStyle = PAPEL; c.fillRect(-4, -4, 8, 8); c.strokeStyle = TINTA; c.lineWidth = 1.2; c.strokeRect(-4, -4, 8, 8); }
      c.restore();
    }
    c.strokeStyle = TINTA; c.lineWidth = 2; c.beginPath(); c.moveTo(px, y - 8); c.lineTo(px, y + 8); c.stroke();
    rola(c, t, CAPS.map(k => k[3]), CAPS.map(k => k[0] + .02), px - 8, y - 9, fMao(24), CINZA, 26, { alinha: 'right' });
  }
}

// =====================================================================
function fontesOk() {
  return ['800 40px "Inter Tight"', '700 40px "Inter Tight"', 'italic 400 40px "Instrument Serif"', '600 40px "Caveat"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"']
    .every(f => document.fonts.check(f));
}
function render(t) {
  if (!pronto) { if (!fontesOk()) return; preparar(); pronto = true; }
  const c = ctx;
  c.save();
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.drawImage(fundo, 0, 0);
  grade(c, t);
  cap1(c, t); cap2(c, t); cap3(c, t); cap4(c, t); cap5(c, t); cap6(c, t); cap7(c, t);
  ponto(c, t);
  moldura(c, t);
  c.globalCompositeOperation = 'multiply'; c.drawImage(grao, 0, 0);
  c.restore();
}

const p = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(p, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(p.t) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
window.addEventListener('load', () => render(tl.time()));
document.fonts.ready.then(() => render(tl.time()));
