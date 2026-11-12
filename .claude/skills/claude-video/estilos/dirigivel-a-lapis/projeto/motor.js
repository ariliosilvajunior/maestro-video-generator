// motor.js — um relógio só. render(t) desenha o quadro inteiro a partir do tempo.
const DUR = 28.6, SZ = 1600;
const PULL0 = 19.6, PULL1 = 20.5;   // a câmera abre para o desenho inteiro
const WIPE0 = 20.9, WIPE1 = 22.25;  // a onda de cor
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const clamp01 = x => Math.max(0, Math.min(1, x));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const seg = (t, a, b, f = x => x) => f(clamp01((t - a) / (b - a)));
const sine = x => .5 - .5 * Math.cos(Math.PI * x);
const p2io = x => x < .5 ? 2 * x * x : 1 - 2 * (1 - x) ** 2;
const p3io = x => x < .5 ? 4 * x ** 3 : 1 - 4 * (1 - x) ** 3;
const p2in = x => x * x;

// ---------- cada linha vira pontos com o tremor da mão ----------
const ZS = Object.values(ELS).sort((a, b) => a.z - b.z);
let SEED = 1;
for (const E of ZS) for (const op of E.ops) {
  if (op.k === 'f') { op.path = pathOf(op.pts); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of op.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } op.bb = [x0, y0, x1, y1]; }
  if (op.k !== 'l') continue;
  const r = rng(SEED++ * 7919), raw = op.pts, P = [];
  for (let i = 0; i < raw.length - 1; i++) { const a = raw[i], b = raw[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5)); for (let j = 0; j < n; j++) P.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n)]); }
  P.push(raw[raw.length - 1].slice());
  const C0 = [0]; for (let i = 1; i < P.length; i++) C0.push(C0[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const amp = Math.min(.65, .2 + C0[C0.length - 1] / 400) * (op.w > 3 ? .4 : 1), f1 = .02 + r() * .03, f2 = .06 + r() * .05, ph1 = r() * 6.3, ph2 = r() * 6.3;
  op.P = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, o = amp * (Math.sin(C0[i] * f1 + ph1) * .7 + Math.sin(C0[i] * f2 + ph2) * .3); return [p[0] - dy / d * o, p[1] + dx / d * o]; });
  op.C = [0]; for (let i = 1; i < op.P.length; i++) op.C.push(op.C[i - 1] + Math.hypot(op.P[i][0] - op.P[i - 1][0], op.P[i][1] - op.P[i - 1][1]));
  op.L = op.C[op.C.length - 1]; op.ph = r() * 6.3; op.pr = .9 + r() * .2;
}
function pointAt(op, s) { const C = op.C; let lo = 0, hi = C.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (C[m] <= s) lo = m; else hi = m; } const f = (s - C[lo]) / ((C[hi] - C[lo]) || 1); return at(op.P[lo], op.P[hi], clamp01(f)); }
// o contorno de um traço até o comprimento len: largura com pressão, pontas afinadas, esquinas em quina
function strokePath(op, len, w = op.w) {
  const P = op.P, C = op.C, W = w * op.pr, pts = [P[0]], cs = [0];
  let k = 1;
  while (k < P.length && C[k] <= len) { pts.push(P[k]); cs.push(C[k]); k++; }
  if (k < P.length && len > cs[cs.length - 1] + .01) { pts.push(at(P[k - 1], P[k], (len - C[k - 1]) / (C[k] - C[k - 1]))); cs.push(len); }
  if (pts.length < 2) return null;
  // trechos de uma linha longa só afinam nas pontas de verdade (e na ponta que ainda está sendo feita)
  const ca = op.capA !== false, cb = op.capB !== false || len < op.L - .01;
  const n = pts.length, hw = cs.map(s => { let v = W * (1 + .1 * Math.sin(s * .03 + op.ph)); if (op.tp) v *= Math.min(1, ca ? .32 + .68 * s / 8 : 1, cb ? .32 + .68 * (len - s) / 8 : 1); return v / 2; });
  const Lp = [], Rp = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[Math.min(n - 1, i + 1)];
    let d0x = b[0] - a[0], d0y = b[1] - a[1], d1x = c[0] - b[0], d1y = c[1] - b[1], l0 = Math.hypot(d0x, d0y), l1 = Math.hypot(d1x, d1y);
    if (l0 < 1e-6) { d0x = d1x; d0y = d1y; l0 = l1; } if (l1 < 1e-6) { d1x = d0x; d1y = d0y; l1 = l0; }
    if (l0 < 1e-6) { d0x = d1x = 1; d0y = d1y = 0; l0 = l1 = 1; }
    const n0x = -d0y / l0, n0y = d0x / l0, n1x = -d1y / l1, n1y = d1x / l1;
    let mx = n0x + n1x, my = n0y + n1y; const ml = Math.hypot(mx, my);
    if (ml < 1e-3) { mx = n1x; my = n1y; } else { mx /= ml; my /= ml; }
    const m = hw[i] / Math.max(.35, mx * n1x + my * n1y);
    Lp.push([b[0] + mx * m, b[1] + my * m]); Rp.push([b[0] - mx * m, b[1] - my * m]);
  }
  const p = new Path2D(), e = pts[n - 1], s0 = pts[0];
  p.moveTo(Lp[0][0], Lp[0][1]); for (let i = 1; i < n; i++) p.lineTo(Lp[i][0], Lp[i][1]);
  const ae = Math.atan2(Lp[n - 1][1] - e[1], Lp[n - 1][0] - e[0]); p.arc(e[0], e[1], hw[n - 1], ae, ae - Math.PI, true);
  for (let i = n - 1; i >= 0; i--) p.lineTo(Rp[i][0], Rp[i][1]);
  const as = Math.atan2(Lp[0][1] - s0[1], Lp[0][0] - s0[0]); p.arc(s0[0], s0[1], hw[0], as + Math.PI, as, true);
  p.closePath(); return p;
}

// ---------- quando cada traço é feito ----------
function chunks(op, maxL = 110) { // corta uma linha longa em trechos que continuam a mesma linha
  if (op.L <= maxL * 1.4) return [op];
  const n = Math.ceil(op.L / maxL);
  op.kids = [];
  for (let k = 0; k < n; k++) {
    const s0 = op.L * k / n, s1 = op.L * (k + 1) / n, P = [pointAt(op, s0)];
    for (let i = 0; i < op.P.length; i++) if (op.C[i] > s0 && op.C[i] < s1) P.push(op.P[i]);
    P.push(pointAt(op, s1));
    const C = [0]; for (let i = 1; i < P.length; i++) C.push(C[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    op.kids.push({ k: 'l', P, C, L: C[C.length - 1], w: op.w, pr: op.pr, ph: op.ph + s0 * .03, tp: op.tp, capA: k === 0, capB: k === n - 1, only: op.only });
  }
  return op.kids;
}
const ORDER = [];
for (const sg of SEGS) {
  const list = [];
  for (const id of sg.els) {
    const lines = ELS[id].ops.filter(op => op.k === 'l' && op.only !== 'paint');
    if (!SWEEP.has(id)) { list.push(...lines); continue; }
    const items = lines.flatMap(op => chunks(op)).map((o, i) => ({ o, i, x: pointAt(o, o.L / 2)[0] }));
    items.sort((a, b) => Math.floor(a.x / 60) - Math.floor(b.x / 60) || a.i - b.i);
    list.push(...items.map(q => q.o));
  }
  let prev = ORDER.length ? ORDER[ORDER.length - 1].P.at(-1) : list[0].P[0], tot = 0;
  const wts = list.map(op => { const tr = Math.hypot(op.P[0][0] - prev[0], op.P[0][1] - prev[1]); prev = op.P.at(-1); const w = [8 + tr * .3, op.L + 10]; tot += w[0] + w[1]; return w; });
  const k = (sg.t1 - sg.t0) / tot; let t = sg.t0;
  list.forEach((op, i) => { op.t0 = t; op.ta = t + wts[i][0] * k; op.t1 = op.ta + wts[i][1] * k; t = op.t1; ORDER.push(op); });
}
const T_END = ORDER[ORDER.length - 1].t1;
for (const E of ZS) for (const op of E.ops) if (op.kids) { op.ta = Math.min(...op.kids.map(k => k.ta)); op.t1 = Math.max(...op.kids.map(k => k.t1)); }
// cada preenchimento (o papel que cobre o que está atrás) entra junto com a próxima linha do mesmo elemento
for (const E of ZS) E.ops.forEach((op, i) => {
  if (op.k !== 'f') return;
  const inkLine = o => o.k === 'l' && o.only !== 'paint';
  op.ref = E.ops.slice(i + 1).find(inkLine) || E.ops.slice(0, i).reverse().find(inkLine);
});
const prog = (op, t) => sine(clamp01((t - op.ta) / (op.t1 - op.ta)));

// ---------- o lápis ----------
function penRaw(t) {
  if (t <= ORDER[0].t0) return [ORDER[0].P[0][0], ORDER[0].P[0][1], 0];
  let lo = 0, hi = ORDER.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (ORDER[m].t0 <= t) lo = m; else hi = m - 1; }
  const op = ORDER[lo];
  if (t < op.ta) { const a = lo ? ORDER[lo - 1].P.at(-1) : op.P[0], b = op.P[0], e = p2io((t - op.t0) / (op.ta - op.t0)); return [lerp(a[0], b[0], e), lerp(a[1], b[1], e), Math.sin(Math.PI * e) * Math.min(1, Math.hypot(b[0] - a[0], b[1] - a[1]) / 60)]; }
  if (t < op.t1) { const p = pointAt(op, prog(op, t) * op.L); return [p[0], p[1], 0]; }
  const e = op.P.at(-1); return [e[0], e[1], 0];
}

// ---------- câmera: segue o lápis devagar, zoom por trechos, nunca sai do papel ----------
const CF = 60, CT0 = -1, CT1 = 21.5, CN = Math.round((CT1 - CT0) * CF) + 1;
// como na referência, a câmera fica perto e a construção vaza pelas bordas do quadro
const ZK = [[0, 4.6], [2.2, 3.4], [4.6, 2.8], [6.2, 2.3], [7.4, 2.15], [8.8, 2.05], [9.6, 2.3], [11.5, 2.15], [13.4, 2.2], [14.4, 1.95], [15.4, 2.1], [17.0, 2.25], [19.4, 1.75], [19.6, 1.7]];
function zoomKey(t) { // o zoom nunca freia nas marcas: anda sempre, como o recuo lento da referência
  if (t <= ZK[0][0]) return ZK[0][1];
  for (let i = 1; i < ZK.length; i++) if (t <= ZK[i][0]) return Math.exp(lerp(Math.log(ZK[i - 1][1]), Math.log(ZK[i][1]), (t - ZK[i - 1][0]) / (ZK[i][0] - ZK[i - 1][0])));
  return ZK[ZK.length - 1][1];
}
// deriva lenta do enquadramento: a câmera da referência nunca fica parada enquanto o lápis desenha
const drift = t => [42 * Math.sin(t * .62) + 18 * Math.sin(t * 1.37 + 2), 26 * Math.sin(t * .51 + 1) + 12 * Math.sin(t * 1.21 + .5)];
function gauss(arr, sig) {
  const r = Math.ceil(sig * 3), w = []; let sw = 0; for (let k = -r; k <= r; k++) { const v = Math.exp(-k * k / (2 * sig * sig)); w.push(v); sw += v; }
  return arr.map((_, i) => { let x = 0, y = 0; for (let k = -r; k <= r; k++) { const q = arr[clamp(i + k, 0, arr.length - 1)]; x += q[0] * w[k + r]; y += q[1] * w[k + r]; } return [x / sw, y / sw]; });
}
const CAM = (() => {
  const raw = []; for (let i = 0; i < CN; i++) raw.push(penRaw(CT0 + i / CF));
  // como na referência: a câmera desliza devagar atrás do lápis, sem tranco; o lápis pode encostar na borda por um instante
  const keep = (arr, frac, P) => arr.map((c, i) => {
    const z = zoomKey(CT0 + i / CF), half = 800 / z, m = half * frac, p = P[i]; let [x, y] = c;
    x = clamp(x, p[0] - m, p[0] + m); y = clamp(y, p[1] - m, p[1] + m);
    return [clamp(x, half, SZ - half), clamp(y, half, SZ - half)];
  });
  let c = gauss(raw, .6 * CF);
  c = gauss(keep(c, .55, gauss(raw, .2 * CF)), .35 * CF);
  c = gauss(keep(c, .66, gauss(raw, .1 * CF)), .2 * CF);
  return c;
})();
function camAt(t) {
  const f = clamp((t - CT0) * CF, 0, CN - 1), i = Math.floor(f), j = Math.min(CN - 1, i + 1), g = f - i;
  const d = drift(t);
  let x = lerp(CAM[i][0], CAM[j][0], g) + d[0], y = lerp(CAM[i][1], CAM[j][1], g) + d[1], z = zoomKey(t);
  const e = seg(t, PULL0, PULL1, p3io); z = lerp(z, 1, e); x = lerp(x, 800, e); y = lerp(y, 800, e);
  const half = 800 / z; return [z, clamp(x, half, SZ - half), clamp(y, half, SZ - half)];
}

// ---------- papel e traço ----------
const GRAIN = (() => { const g = document.createElement('canvas'); g.width = g.height = 256; const c = g.getContext('2d'), im = c.createImageData(256, 256), r = rng(9); for (let i = 0; i < im.data.length; i += 4) { const v = 120 + r() * 135; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } c.putImageData(im, 0, 0); return ctx.createPattern(g, 'repeat'); })();
function drawInk(t) {
  for (const E of ZS) for (const op of E.ops) {
    if (op.k === 'f') {
      if (!op.occ || op.only === 'paint' || !op.ref || t < op.ref.ta) continue;
      ctx.globalAlpha = clamp01((t - op.ref.ta) / Math.max(.001, (op.ref.t1 - op.ref.ta) * .7)); ctx.fillStyle = PAL.paper; ctx.fill(op.path); ctx.globalAlpha = 1;
    } else if (op.k === 'l') {
      if (op.only === 'paint' || t < op.ta) continue;
      ctx.fillStyle = PAL.ink;
      for (const o of op.kids || [op]) {
        if (t < o.ta) continue;
        if (t >= o.t1) ctx.fill(o.full || (o.full = strokePath(o, o.L)));
        else { const p = strokePath(o, prog(o, t) * o.L); if (p) ctx.fill(p); }
      }
    }
  }
}

// ---------- a pintura (feita uma vez) ----------
let CL = null;
function celFill(c, op) {
  c.fillStyle = op.color; c.fill(op.path);
  if (!op.sh) return;
  const [x0, y0, x1, y1] = op.bb; c.save(); c.clip(op.path);
  const g = c.createLinearGradient(x1, y0, x0, y1);
  g.addColorStop(0, `rgba(255,236,210,${op.sh * .5})`); g.addColorStop(.45, 'rgba(255,236,210,0)'); g.addColorStop(.55, 'rgba(40,10,50,0)'); g.addColorStop(1, `rgba(40,10,50,${op.sh * .7})`);
  c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore();
}
function colorLayer() {
  if (CL) return CL;
  CL = document.createElement('canvas'); CL.width = CL.height = SZ; const c = CL.getContext('2d');
  paintBG(c);
  for (const E of ZS) for (const op of E.ops) {
    if (op.only === 'ink') continue;
    if (op.k === 'f') celFill(c, op);
    else if (op.k === 'p') op.fn(c);
    else { c.fillStyle = op.col || PAL.out; c.globalAlpha = !op.col && op.w < 1.2 ? .8 : 1; c.fill(op.full || (op.full = strokePath(op, op.L))); c.globalAlpha = 1; }
  }
  paintGlows(c); paintFG(c);
  return CL;
}

// ---------- a onda de cor ----------
function edgeX(y, t, d) {
  const X = lerp(-380, 1980, seg(t, WIPE0, WIPE1, p2io));
  return X + 200 * (800 - y) / 800 + 34 * Math.sin(y * .0105 + 1.3 + t * 2.2) + 16 * Math.sin(y * .027 + .4 - t * 3.1) + 7 * Math.sin(y * .061 + 2) - d;
}
function wipePath(t, d) { const p = new Path2D(); p.moveTo(-60, -20); for (let y = -20; y <= 1620; y += 10) p.lineTo(edgeX(y, t, d), y); p.lineTo(-60, 1620); p.closePath(); return p; }
function drawWipe(t) {
  const col = colorLayer();
  ctx.save(); ctx.clip(wipePath(t, 0)); ctx.globalAlpha = .5; ctx.fillStyle = '#b6b1f4'; ctx.fillRect(0, 0, SZ, SZ); ctx.restore();
  ctx.save(); ctx.clip(wipePath(t, 24)); ctx.globalAlpha = .55; ctx.drawImage(col, 0, 0); ctx.restore();
  ctx.save(); ctx.clip(wipePath(t, 60)); ctx.drawImage(col, 0, 0); ctx.restore();
}

// ---------- o lápis na tela ----------
const PEN_ANG = .95, PEN_L = 340, PEN_R = 8.5;
function penShape(c) {
  c.beginPath(); c.moveTo(0, 0); c.lineTo(26, -PEN_R * .78); c.lineTo(40, -PEN_R); c.lineTo(PEN_L, -PEN_R);
  c.arc(PEN_L, 0, PEN_R, -Math.PI / 2, Math.PI / 2); c.lineTo(40, PEN_R); c.lineTo(26, PEN_R * .78); c.closePath();
}
function drawPen(x, y, lift) {
  const sc = 1 + .04 * lift;
  ctx.save(); ctx.translate(x + 16 + 26 * lift, y + 20 + 30 * lift); ctx.rotate(PEN_ANG); ctx.scale(sc, sc);
  ctx.filter = `blur(${5 + 6 * lift}px)`; ctx.fillStyle = `rgba(40,28,16,${.24 - .07 * lift})`; penShape(ctx); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.rotate(PEN_ANG); ctx.scale(sc, sc);
  const g = ctx.createLinearGradient(0, -PEN_R, 0, PEN_R); g.addColorStop(0, '#4a4a4c'); g.addColorStop(.3, '#1c1c1e'); g.addColorStop(1, '#050505');
  penShape(ctx); ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(44, -PEN_R * .62, PEN_L - 50, 1.6);
  const tip = ctx.createLinearGradient(0, -PEN_R, 0, PEN_R); tip.addColorStop(0, '#9a9a9c'); tip.addColorStop(1, '#4a4a4c');
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(26, -PEN_R * .78); ctx.lineTo(26, PEN_R * .78); ctx.closePath(); ctx.fillStyle = tip; ctx.fill();
  ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, -2.2); ctx.lineTo(7, 2.2); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ---------- o quadro ----------
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
  if (t >= WIPE1) { ctx.drawImage(colorLayer(), 0, 0); return; }
  const [z, cx, cy] = camAt(t);
  ctx.fillStyle = PAL.paper; ctx.fillRect(0, 0, SZ, SZ);
  ctx.setTransform(z, 0, 0, z, 800 - z * cx, 800 - z * cy);
  drawInk(t);
  ctx.globalAlpha = .045; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = GRAIN; ctx.fillRect(-200, -200, 2000, 2000);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // o lápis: desenha até o último traço e sai pela diagonal
  const out = seg(t, T_END, T_END + .45, p2in);
  if (out < 1) {
    const [px, py, lift] = penRaw(t), sx = 800 + z * (px - cx), sy = 800 + z * (py - cy);
    drawPen(lerp(sx, 1900, out), lerp(sy, 1950, out), Math.max(lift, out));
  }
  if (t >= WIPE0) drawWipe(t);
}

const p = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(p, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(p.t) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
render(0);
