// cena.js — a expedição do mascote. Uma geometria só, usada pelo traço do lápis e pela pintura.
// Mundo de 1600 x 1600: é o quadro inteiro quando a câmera abre no fim.
const W1 = 1.9, W2 = 1.35, W3 = 1.0;
const TAU = Math.PI * 2;
const PAL = {
  paper: '#faf9f5', ink: '#181716', out: '#2a1830',
  clay: '#d97757', clayD: '#b5583c', clayL: '#f0a080', eye: '#1b1416',
  wood: '#c9532e', woodD: '#9a3a22', woodL: '#e8794a', plank: '#7a2a18',
  roof: '#e0573a', roofD: '#a8382a',
  cream: '#f6e3c6', creamD: '#e2c4a0', stripe: '#d97757',
  glass: '#3d7fd6', glassL: '#9cc9ff', glow: '#ffd66b', lamp: '#ffe9a8',
  brass: '#e6b04f', leather: '#8a4a2a', khaki: '#e8c98a', khakiD: '#c9a464',
  stone: '#c98a86', stoneD: '#9a6170', rock: '#7f4a90', rockD: '#5c3474', rockL: '#a96cb4',
  grass: '#3fae5a', grassL: '#86dc6e', water: '#bfe9ff',
  tent: '#f2c14e', tentD: '#cf8f2a', fire: '#ffa22e',
  flagA: '#ffd66b', flagB: '#3d82d6', flagC: '#f27fb2', flagD: '#7ad66a', iron: '#3a3550',
};

function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(20261103);
const lerp = (a, b, t) => a + (b - a) * t;
const at = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];

// ---------- geometria ----------
function L(x1, y1, x2, y2, o = 1.6) { // reta com a passadinha de mão nas pontas
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, a = o * (.3 + R() * .9), b = o * (.3 + R() * .9);
  return [[x1 - ux * a, y1 - uy * a], [x2 + ux * b, y2 + uy * b]];
}
function arc(cx, cy, rx, ry, a0, a1, n = 28) { const p = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
function sag(x1, y1, x2, y2, s, n = 24) { const p = []; for (let i = 0; i <= n; i++) { const t = i / n; p.push([lerp(x1, x2, t), lerp(y1, y2, t) + 4 * s * t * (1 - t)]); } return p; }
const sagAt = (x1, y1, x2, y2, s, t) => [lerp(x1, x2, t), lerp(y1, y2, t) + 4 * s * t * (1 - t)];
const rectP = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function rot(pts, cx, cy, a) { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); }
function cr(pts, n = 8) { // curva que passa pelos pontos (Catmull-Rom)
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1].slice()); return out;
}
function along(pts, f) {
  const C = [0]; for (let i = 1; i < pts.length; i++) C.push(C[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const s = f * C[C.length - 1]; let i = 1; while (i < pts.length - 1 && C[i] < s) i++;
  return at(pts[i - 1], pts[i], (s - C[i - 1]) / ((C[i] - C[i - 1]) || 1));
}
function pathOf(pts, close = true) { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); if (close) p.closePath(); return p; }

// ---------- elementos ----------
// Cada elemento guarda operações na ordem em que o lápis faz: 'f' preenche (no traço vira papel que cobre o que está atrás),
// 'l' é linha (no traço o lápis desenha; na pintura vira contorno), 'p' é pintura só da versão colorida.
const ELS = {}, GLOWS = [];
function el(id, z, fn) {
  const ops = [];
  const B = {
    fill(pts, color, o = {}) { ops.push({ k: 'f', pts, color, occ: o.occ !== false, sh: o.sh || 0, only: o.only }); },
    line(pts, w = W2, o = {}) { ops.push({ k: 'l', pts, w, col: o.col, pw: o.pw, tp: o.tp !== false, only: o.only }); },
    paint(fn) { ops.push({ k: 'p', fn }); },
    glow(x, y, r, col = PAL.glow, a = .55) { GLOWS.push({ x, y, r, col, a }); },
  };
  fn(B); ELS[id] = { id, z, ops };
}
function box(B, x, y, w, h, color, o = {}) {
  if (color) B.fill(rectP(x, y, w, h), color, o);
  const lw = o.w || W2, lo = { col: o.col, only: o.only };
  B.line([[x - 1.2, y], [x + w, y], [x + w, y + h + 1.2]], lw, lo);
  B.line([[x, y - 1.2], [x, y + h], [x + w + 1.2, y + h]], lw, lo);
}
function circ(B, cx, cy, r, color, o = {}) {
  const p = arc(cx, cy, r, r, -Math.PI / 2, Math.PI * 1.5, Math.max(12, Math.round(r * 1.3)));
  if (color) B.fill(p, color, o);
  B.line(p, o.w || W2, { col: o.col, only: o.only });
}
// o mascote do Claude Code: a mesma grade do terminal, cada pixel duas vezes mais alto que largo
const CLAWD = [[3, 0], [15, 0], [15, 2], [17, 2], [17, 3], [16, 3], [16, 4], [14, 4], [14, 5], [13, 5], [13, 4], [12, 4], [12, 5], [11, 5], [11, 4], [7, 4], [7, 5], [6, 5], [6, 4], [5, 4], [5, 5], [4, 5], [4, 4], [2, 4], [2, 3], [1, 3], [1, 2], [3, 2], [3, 0]];
function clawd(B, x, y, s, w = W1) {
  const h = s * 2, pts = CLAWD.map(([a, b]) => [x + a * s, y + b * h]);
  B.fill(pts, PAL.clay);
  B.paint(c => {
    c.save(); c.clip(pathOf(pts));
    c.fillStyle = PAL.clayD; c.fillRect(x, y + 3 * h, 18 * s, 2 * h); // a fileira de baixo mais escura, como no desenho em pixels
    c.fillStyle = PAL.clayL; c.fillRect(x, y, 18 * s, h * .3);
    c.restore();
  });
  B.line(pts.slice(0, 15), w); B.line(pts.slice(14), w);
  for (const ex of [5.5, 12.5]) B.line([[x + ex * s, y + h * 1.24], [x + ex * s, y + h * 1.76]], s * .92, { col: PAL.eye, tp: false });
}
function spark(B, cx, cy, r, col, w = 3, n = 8, a0 = .2) { // o asterisco do Claude, raios afinando nas pontas
  for (let i = 0; i < n; i++) {
    const a = a0 + i * TAU / n, rr = r * (i % 2 ? .78 : 1);
    B.line([[cx + Math.cos(a) * r * .12, cy + Math.sin(a) * r * .12], [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]], w, { col });
  }
}
function scope(B, x1, y1, x2, y2, r1, r2, n, cols) { // luneta em gomos que engrossam até a boca
  const d = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / d, ny = (x2 - x1) / d;
  for (let k = 0; k < n; k++) {
    const a = at([x1, y1], [x2, y2], k / n), b = at([x1, y1], [x2, y2], (k + 1) / n), r = lerp(r1, r2, n > 1 ? k / (n - 1) : 0);
    const q = [[a[0] + nx * r, a[1] + ny * r], [b[0] + nx * r, b[1] + ny * r], [b[0] - nx * r, b[1] - ny * r], [a[0] - nx * r, a[1] - ny * r]];
    B.fill(q, cols[k % cols.length], { sh: .35 });
    B.line([q[3], q[0], q[1]], W2); B.line([q[3], q[2]], W2);
  }
  const r = r2 * 1.12;
  B.line([[x2 + nx * r, y2 + ny * r], [x2 - nx * r, y2 - ny * r]], W1 * 1.3);
  B.paint(c => { c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(x2 + nx * r2 * .4, y2 + ny * r2 * .4, r2 * .28, 0, TAU); c.fill(); });
}
function railing(B, x0, x1, yT, yB, step, posts) {
  B.line(L(x0, yT, x1, yT), W2); B.line(L(x0, yT + 4, x1, yT + 4, .8), W3);
  for (let x = x0 + step; x < x1 - 3; x += step) if (!posts.some(p => Math.abs(p - x) < step * .55)) B.line([[x, yT + 4], [x, yB]], W3, { col: PAL.woodD });
  for (const p of posts) { B.line([[p - 2, yT - 3], [p - 2, yB]], W2); B.line([[p + 2, yT - 3], [p + 2, yB]], W2); }
}
function bird(B, x, y, s) {
  const l = cr([[x - s, y - s * .32], [x - s * .45, y - s * .44], [x, y]], 6), r = cr([[x, y], [x + s * .5, y - s * .46], [x + s, y - s * .3]], 6);
  B.line(l.concat(r.slice(1)), W2 * .95, { col: '#3e2350' });
}
function bunting(B, pts, n, size, cols, glowIt) { // corda com bandeirinhas penduradas
  B.line(pts, W3);
  for (let k = 1; k <= n; k++) {
    const p = along(pts, k / (n + 1)), tri = [[p[0] - size * .55, p[1] + 1], [p[0] + size * .55, p[1] + 1], [p[0], p[1] + size]];
    B.fill(tri, cols[k % cols.length], { sh: .2 }); B.line(tri.concat([tri[0]]), W3);
  }
}
function crystals(B, list) { // cristais saindo da rocha: o brilho mágico das ilhas
  for (const [x, y, ang, len, w, col] of list) {
    const u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]], P = (a, o) => [x + u[0] * a + n[0] * o, y + u[1] * a + n[1] * o];
    const q = [P(-4, w / 2), P(len * .72, w / 2), P(len, 0), P(len * .72, -w / 2), P(-4, -w / 2)];
    B.fill(q, col, { sh: .35 });
    B.paint(c => { c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(pathOf([P(0, w * .1), P(len * .7, w * .1), P(len * .93, 0), P(len * .7, w * .38), P(0, w * .38)])); });
    B.line([q[1], q[2], q[3]], W2); B.line(L(...P(0, w / 2), ...q[1], .4), W2); B.line(L(...P(0, -w / 2), ...q[3], .4), W2);
    B.line([P(0, 0), P(len * .72, 0), P(len, 0)], W3);
    B.glow(...P(len * .6, 0), len * 1.4, col, .45);
  }
}
function roots(B, list, seed) {
  const r = rng(seed);
  for (const [x, y, len] of list) {
    const ph = r() * 6, p = [];
    for (let k = 0; k <= 10; k++) p.push([x + Math.sin(k * .9 + ph) * 5 * (k / 10), y - 2 + len * k / 10]);
    B.line(p, W2, { col: '#4a2a55' });
    const f = p[5], side = r() < .5 ? -1 : 1;
    B.line(cr([[f[0], f[1]], [f[0] + side * 8, f[1] + 12], [f[0] + side * 12, f[1] + 26]], 5), W3, { col: '#4a2a55' });
  }
}

// ---------- pintura: ajudantes da versão colorida ----------
function vine(c, pts, seed, every = 9) { // trepadeira: caule e folhas alternadas
  const r = rng(seed);
  c.save(); c.lineCap = 'round'; c.strokeStyle = '#2b7a40'; c.lineWidth = 1.8; c.stroke(pathOf(pts, false));
  let acc = 0, side = 1;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += d;
    while (acc > every) {
      acc -= every; side = -side;
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + side * (.9 + r() * .4), lx = b[0] + Math.cos(ang) * 4, ly = b[1] + Math.sin(ang) * 4;
      c.save(); c.translate(lx, ly); c.rotate(ang);
      c.fillStyle = r() < .5 ? PAL.grass : PAL.grassL; c.beginPath(); c.ellipse(0, 0, 5.2, 3, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(25,60,35,.7)'; c.lineWidth = .7; c.stroke(); c.restore();
    }
  }
  c.restore();
}
function puffs(c, list) {
  for (const [x, y, r] of list) {
    c.fillStyle = 'rgba(246,224,236,.85)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x - r * .25, y - r * .3, r * .45, 0, TAU); c.fill();
  }
}
function islandPaint(c, top, und, seed) {
  const r = rng(seed), body = pathOf(top.concat(und.slice(1)));
  c.save(); c.clip(body);
  // camadas de rocha
  for (let k = 0; k < 3; k++) {
    c.fillStyle = k % 2 ? 'rgba(60,20,80,.22)' : 'rgba(190,120,200,.18)';
    const y0 = top[0][1] + 40 + k * 55, p = [];
    for (let x = top[0][0] - 20; x <= top[top.length - 1][0] + 20; x += 20) p.push([x, y0 + Math.sin(x * .02 + k + seed) * 8]);
    p.push([top[top.length - 1][0] + 20, y0 + 30 + k * 6]); p.push([top[0][0] - 20, y0 + 30 + k * 6]);
    c.fill(pathOf(p));
  }
  // pedrinhas claras
  for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(210,160,220,.35)'; c.beginPath(); c.ellipse(lerp(top[0][0], top[top.length - 1][0], r()), top[0][1] + 20 + r() * 260, 3 + r() * 5, 2 + r() * 3, 0, 0, TAU); c.fill(); }
  // capa de grama com pingos
  const g = top.map(p => p.slice()); const back = top.slice().reverse().map(([x, y]) => [x, y + 11 + 6 * Math.abs(Math.sin(x * .07))]);
  c.fillStyle = PAL.grass; c.fill(pathOf(g.concat(back)));
  c.fillStyle = PAL.grassL; c.fill(pathOf(top.map(([x, y]) => [x, y - 2]).concat(top.slice().reverse().map(([x, y]) => [x, y + 4]))));
  c.restore();
}

// ================= A CENA =================
// --- o herói na proa ---
el('hero', 22, B => clawd(B, 905, 540, 7.2, W1));
el('heroHat', 23, B => { // capacete de explorador
  const dome = arc(970, 538, 43, 36, Math.PI, TAU, 26), brim = arc(970, 540, 60, 7.5, 0, TAU, 44);
  B.fill(dome, PAL.khaki, { sh: .4 }); B.line(dome, W1);
  B.fill(brim, PAL.khakiD, { sh: .25 }); B.line(brim, W1);
  B.fill([[928.5, 532], [1011.5, 532], [1007.5, 522], [932.5, 522]], PAL.leather);
  B.line(L(929, 532, 1011, 532, .8), W2); B.line(L(933, 522, 1007, 522, .8), W2);
  circ(B, 970, 502, 4, PAL.khakiD, { w: W2 });
  circ(B, 947, 521, 6.5, PAL.glassL, { w: W2 }); circ(B, 963, 521, 6.5, PAL.glassL, { w: W2 });
});
el('heroScope', 23, B => scope(B, 914, 575, 836, 527, 5, 7.5, 3, [PAL.brass, PAL.leather, PAL.brass]));
el('heroPack', 21, B => {
  const pk = [[1016, 556], [1050, 556], [1057, 566], [1057, 596], [1016, 598]];
  B.fill(pk, PAL.leather, { sh: .35 }); B.line(pk.concat([pk[0]]), W2);
  box(B, 1030, 572, 20, 14, PAL.khakiD, { w: W3 });
  B.fill(rectP(1012, 544, 50, 12), PAL.flagB, { sh: .3 });
  B.line(L(1012, 544, 1062, 544, .8), W2); B.line(L(1012, 556, 1062, 556, .8), W2);
  B.line(arc(1062, 550, 3.5, 6, -Math.PI / 2, Math.PI / 2, 8), W2);
  B.line(L(1024, 544, 1024, 556, .3), W3); B.line(L(1048, 544, 1048, 556, .3), W3);
});

// --- o barco do dirigível ---
const HULL_TOP = cr([[866, 582], [896, 602], [935, 612], [1160, 612], [1395, 612], [1410, 600]], 8);
const HULL_BOT = cr([[1410, 600], [1415, 634], [1392, 670], [1320, 697], [1150, 708], [1010, 700], [940, 676], [894, 632], [866, 582]], 8);
el('hull', 18, B => {
  B.fill(HULL_TOP.concat(HULL_BOT.slice(1)), PAL.wood, { sh: .4 });
  B.paint(c => {
    c.save(); c.clip(pathOf(HULL_TOP.concat(HULL_BOT.slice(1))));
    c.fillStyle = 'rgba(90,20,10,.16)'; c.fill(pathOf(cr([[880, 640], [1010, 662], [1150, 666], [1320, 660], [1420, 640]], 8).concat([[1420, 700], [880, 700]])));
    c.restore();
    c.strokeStyle = PAL.woodL; c.lineWidth = 3; c.stroke(pathOf(HULL_TOP.map(([x, y]) => [x, y + 4]), false));
  });
  B.line(HULL_TOP, W1); B.line(HULL_BOT, W1);
  B.line(cr([[878, 596], [905, 612], [940, 620], [1160, 620], [1395, 620], [1410, 610]], 8), W2);
  B.line(cr([[893, 622], [930, 647], [1010, 660], [1150, 664], [1320, 658], [1406, 640]], 8), W3, { col: PAL.plank });
  B.line(cr([[912, 652], [960, 678], [1040, 689], [1150, 691], [1300, 685], [1394, 664]], 8), W3, { col: PAL.plank });
  for (const x of [990, 1110, 1230, 1350]) B.line(L(x, 622, x, 660, .4), W3, { col: PAL.plank });
  for (const x of [1050, 1170, 1290]) B.line(L(x, 664, x, 689, .4), W3, { col: PAL.plank });
  B.line(arc(870, 572, 9, 9, Math.PI * .5, Math.PI * 2.3, 20), W2); // a voluta da proa
});
el('portholes', 19, B => { for (const x of [1080, 1160, 1240, 1320]) { circ(B, x, 640, 11, PAL.brass, { w: W2 }); circ(B, x, 640, 7, PAL.lamp, { w: W3 }); B.glow(x, 640, 26, PAL.glow, .45); } });
el('railing', 16, B => railing(B, 1040, 1400, 578, 612, 17, [1042, 1160, 1280, 1398]));
el('wheel', 15, B => {
  B.line(L(1105, 594, 1105, 612, .4), W2);
  B.paint(c => { c.strokeStyle = PAL.wood; c.lineWidth = 3.4; c.beginPath(); c.arc(1105, 590, 14.5, 0, TAU); c.stroke(); });
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; B.line([[1105 + Math.cos(a) * 4, 590 + Math.sin(a) * 4], [1105 + Math.cos(a) * 23, 590 + Math.sin(a) * 23]], W2, { col: PAL.woodD }); }
  circ(B, 1105, 590, 16, null, { w: W2 }); circ(B, 1105, 590, 13, null, { w: W3 }); circ(B, 1105, 590, 4, PAL.brass, { w: W3 });
});
el('cabin', 14, B => {
  box(B, 1172, 530, 130, 82, PAL.woodL, { sh: .4 });
  for (let y = 542; y < 612; y += 12) B.line(L(1172, y, 1302, y, .4), W3, { col: PAL.woodD });
  box(B, 1185, 562, 26, 50, PAL.wood, { sh: .3 }); circ(B, 1206, 588, 2.2, PAL.brass, { w: W3 });
  circ(B, 1262, 560, 11, PAL.lamp, { w: W2 }); B.line(L(1251, 560, 1273, 560, .2), W3); B.line(L(1262, 549, 1262, 571, .2), W3); B.glow(1262, 560, 34, PAL.glow, .5);
  const rf = [[1158, 537], [1237, 512], [1316, 537], [1316, 542], [1158, 542]];
  B.fill(rf, PAL.roof, { sh: .3 }); B.line([[1156, 538], [1237, 512], [1318, 538]], W1); B.line(L(1158, 542, 1316, 542, .8), W2);
});
el('chimneyShip', 13, B => {
  box(B, 1279, 488, 13, 42, '#6a5a7a', { w: W2 }); box(B, 1275, 482, 21, 7, '#4a3a5a', { w: W2 });
  B.paint(c => puffs(c, [[1289, 471, 7], [1298, 462, 5.5]]));
  B.line(cr([[1288, 478], [1281, 469], [1291, 461], [1303, 464]], 6), W3, { col: '#a78bb8' });
});
el('shipFlag', 13, B => {
  B.line(L(1406, 604, 1406, 512, .4), W2, { col: PAL.woodD });
  const f = cr([[1406, 514], [1426, 510], [1444, 520], [1460, 522]], 6).concat(cr([[1460, 522], [1442, 534], [1424, 532], [1406, 540]], 6).slice(1));
  B.fill(f, PAL.flagC, { sh: .25 }); B.line(f, W2);
});
el('propeller', 17, B => {
  box(B, 1410, 636, 36, 8, '#7a6a8a', { w: W2 });
  const up = cr([[1449, 634], [1443, 604], [1454, 577], [1466, 594], [1458, 634]], 6), dn = cr([[1449, 646], [1443, 676], [1454, 703], [1466, 686], [1458, 646]], 6);
  for (const b of [up, dn]) { B.fill(b, PAL.cream, { sh: .35 }); B.paint(c => { c.save(); c.clip(pathOf(b)); c.fillStyle = PAL.stripe; c.fillRect(1430, 560, 50, 30); c.fillRect(1430, 690, 50, 30); c.restore(); }); B.line(b, W2); }
  circ(B, 1453, 640, 7, PAL.brass, { w: W2 });
  for (const [r, a0, a1] of [[74, -1.15, -.5], [74, .5, 1.15], [60, -1.0, -.62], [60, .62, 1.0]]) B.line(arc(1453, 640, r, r, a0, a1, 12), W3, { col: '#8f84c4' });
});
el('rudder', 17, B => { const r = [[1394, 664], [1430, 670], [1427, 728], [1398, 716]]; B.fill(r, PAL.woodD, { sh: .3 }); B.line(r.concat([r[0]]), W2); B.line(L(1400, 670, 1402, 712, .4), W3); });

// --- o balão ---
const EX = 1150, EY = 330, ERX = 320, ERY = 142;
const eh = x => { const u = (x - EX) / ERX; return Math.abs(u) >= 1 ? 0 : ERY * Math.sqrt(1 - u * u); };
el('ropes', 12, B => {
  const xe = [930, 1018, 1106, 1194, 1282, 1370], xd = [1042, 1100, 1160, 1220, 1280, 1394];
  for (let i = xe.length - 1; i >= 0; i--) B.line(sag(xe[i], EY + eh(xe[i]) - 3, xd[i], 576, 2.5, 14), W3); // da popa para a proa, para o balão começar perto
});
el('envOutline', 10, B => {
  const top = arc(EX, EY, ERX, ERY, Math.PI, TAU, 52), bot = arc(EX, EY, ERX, ERY, 0, Math.PI, 52), all = top.concat(bot.slice(1));
  B.fill(all, PAL.cream);
  B.paint(c => {
    c.save(); c.clip(pathOf(all));
    const band = (v1, v2) => { const a = [], b = []; for (let x = 826; x <= 1474; x += 8) { a.push([x, EY + v1 * eh(x)]); b.push([x, EY + v2 * eh(x)]); } return pathOf(a.concat(b.reverse())); };
    c.fillStyle = PAL.stripe; c.fill(band(-.2, .15)); c.fill(band(.55, .7));
    const g = c.createLinearGradient(0, EY - ERY, 0, EY + ERY); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.55, 'rgba(160,60,80,0)'); g.addColorStop(1, 'rgba(110,30,80,.38)');
    c.fillStyle = g; c.fillRect(800, EY - ERY, 700, ERY * 2);
    const gl = c.createLinearGradient(EX + 200, 0, EX - 300, 0); gl.addColorStop(0, 'rgba(255,240,220,0)'); gl.addColorStop(1, 'rgba(90,30,90,.22)');
    c.fillStyle = gl; c.fillRect(800, EY - ERY, 700, ERY * 2);
    c.fillStyle = 'rgba(255,255,255,.42)'; c.beginPath(); c.ellipse(1120, 236, 190, 22, -.05, 0, TAU); c.fill();
    c.restore();
  });
  B.line(top, W1); B.line(bot, W1);
  circ(B, 832, 330, 9, PAL.brass, { w: W2 });
});
el('fins', 9, B => {
  for (const s of [-1, 1]) {
    const f = [[1372, EY + s * 85], [1470, EY + s * 154], [1506, EY + s * 144], [1462, EY + s * 44]];
    B.fill(f, PAL.stripe, { sh: .35 }); B.line(f.concat([f[0]]), W2); B.line(L(1424, EY + s * 102, 1480, EY + s * 142, .5), W3);
  }
});
el('sideFin', 11, B => { const f = [[1426, 322], [1512, 316], [1517, 337], [1426, 340]]; B.fill(f, PAL.stripe, { sh: .3 }); B.line(f.concat([f[0]]), W2); });
el('envSeams', 10, B => {
  for (const v of [-.62, -.2, .15, .55]) { const p = []; for (let x = 838; x <= 1462; x += 12) p.push([x, EY + v * eh(x)]); B.line(p, W3); }
  for (const u of [-.72, -.38, 0, .38, .72]) { const x0 = EX + ERX * u, h0 = eh(x0), p = []; for (let k = 0; k <= 16; k++) { const dy = lerp(-h0, h0, k / 16); p.push([x0 - 11 * (1 - (dy / h0) ** 2), EY + dy]); } B.line(p, W3); }
});
el('patch', 11, B => {
  const q = rot(rectP(1290, 352, 32, 26), 1306, 365, .18);
  B.fill(q, PAL.flagB, { sh: .2 }); B.line(q.concat([q[0]]), W2);
  const qi = rot(rectP(1294, 356, 24, 18), 1306, 365, .18);
  for (let e = 0; e < 4; e++) { const a = qi[e], b = qi[(e + 1) % 4]; for (const f of [.15, .55]) B.line([at(a, b, f), at(a, b, f + .22)], W3, { col: PAL.cream }); }
});
el('emblem', 11, B => { circ(B, 1060, 270, 33, PAL.cream, { w: W1 }); circ(B, 1060, 270, 27, null, { w: W3, col: PAL.stripe }); spark(B, 1060, 270, 21, PAL.stripe, 3.6, 8, .2); });

// --- a corda que amarra o dirigível na torre ---
el('mooring', 30, B => bunting(B, sag(866, 584, 644, 690, 30, 30), 8, 15, [PAL.flagA, PAL.flagB, PAL.flagC, PAL.flagD]));

// --- o observatório ---
el('mini1', 28, B => clawd(B, 586, 682, 3.1, W2));
el('rail2', 29, B => railing(B, 444, 648, 690, 713, 14, [445, 545, 645]));
el('plat2', 27, B => {
  box(B, 432, 713, 223, 8, PAL.wood, { sh: .3, w: W2 });
  for (const x of [470, 520, 570, 620]) B.line(L(x, 714, x, 720, .2), W3, { col: PAL.plank });
  B.line(L(437, 721, 470, 752), W2); B.line(L(650, 721, 592, 758), W2);
});
el('scaffold', 24, B => {
  box(B, 482, 560, 7, 153, PAL.wood, { w: W2, sh: .3 }); box(B, 571, 560, 7, 153, PAL.wood, { w: W2, sh: .3 });
  for (const y of [586, 636, 686]) box(B, 478, y - 2.5, 104, 5, PAL.wood, { w: W3 });
  for (const [y0, y1] of [[563, 611], [613, 661], [663, 711]]) { B.line(L(489, y0, 571, y1, .5), W2, { col: PAL.woodD }); B.line(L(571, y0, 489, y1, .5), W2, { col: PAL.woodD }); }
  B.paint(c => vine(c, cr([[489, 713], [500, 690], [492, 662], [506, 630], [498, 600]], 6), 11));
});
el('ladder', 25, B => {
  B.line(L(448, 858, 448, 721), W2); B.line(L(459, 858, 459, 721), W2);
  for (let y = 848; y > 726; y -= 12) B.line(L(448, y, 459, y, .3), W3);
  B.line(L(462, 713, 462, 562), W2); B.line(L(473, 713, 473, 562), W2);
  for (let y = 702; y > 566; y -= 12) B.line(L(462, y, 473, y, .3), W3);
});
el('obsRoom', 25, B => {
  box(B, 470, 486, 120, 74, PAL.woodL, { sh: .4 });
  for (const x of [484, 519, 554]) { box(B, x, 500, 22, 24, PAL.lamp, { w: W3 }); B.line(L(x + 11, 500, x + 11, 524, .2), W3); B.glow(x + 11, 512, 26, PAL.glow, .4); }
  box(B, 452, 556, 156, 7, PAL.wood, { w: W2, sh: .3 });
});
el('scope', 27, B => scope(B, 528, 468, 452, 390, 8, 12, 2, [PAL.clay, PAL.brass]));
el('dome', 26, B => {
  const cx = 530, cy = 484, rx = 70, ry = 64, sh = arc(cx, cy, rx, ry, Math.PI, TAU, 36);
  B.fill(sh, PAL.glass, { sh: .45 });
  B.paint(c => {
    c.save(); c.clip(pathOf(sh)); c.fillStyle = 'rgba(156,201,255,.5)';
    c.fill(pathOf([[470, 484], [488, 440], [506, 470]])); c.fill(pathOf([[490, 436], [520, 424], [512, 462]])); c.fill(pathOf([[546, 426], [576, 444], [556, 466]]));
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 58, Math.PI * 1.15, Math.PI * 1.38); c.stroke(); c.restore();
  });
  B.line(sh, W1);
  for (const f of [-.62, .62]) { const p = []; for (let k = 0; k <= 12; k++) { const th = k / 12 * Math.PI / 2; p.push([cx + rx * f * Math.cos(th), cy - ry * Math.sin(th)]); } B.line(p, W3); }
  for (const th of [.5, 1.0]) { const yy = cy - ry * Math.sin(th), hw = rx * Math.cos(th), p = []; for (let k = 0; k <= 14; k++) { const s = lerp(-1, 1, k / 14); p.push([cx + hw * s, yy + 5 * Math.cos(th) * (1 - s * s)]); } B.line(p, W3); }
  B.fill([[522, 423], [538, 423], [538, 480], [522, 480]], '#2a2246');
  B.line(L(522, 424, 522, 480, .5), W2); B.line(L(538, 424, 538, 480, .5), W2);
  box(B, 455, 480, 150, 8, PAL.wood, { w: W2 });
});
el('towerFlag', 24, B => {
  B.line(L(585, 446, 585, 350, .4), W2, { col: PAL.woodD });
  const f = cr([[585, 353], [606, 348], [626, 359], [646, 363]], 6).concat(cr([[646, 363], [627, 378], [607, 376], [585, 385]], 6).slice(1));
  B.fill(f, PAL.flagA, { sh: .25 }); B.line(f, W2);
  spark(B, 610, 367, 8, PAL.stripe, 2.2, 8, .2);
});
el('room1', 25, B => {
  box(B, 470, 721, 120, 137, PAL.woodL, { sh: .4 });
  for (const x of [485, 500, 515, 530, 545, 560, 575]) B.line(L(x, 723, x, 856, .3), W3, { col: PAL.woodD });
  circ(B, 530, 780, 21, PAL.lamp, { w: W1 }); circ(B, 530, 780, 16, null, { w: W3 });
  B.line(L(509, 780, 551, 780, .2), W3); B.line(L(530, 759, 530, 801, .2), W3); B.glow(530, 780, 46, PAL.glow, .5);
  box(B, 504, 803, 52, 9, PAL.wood, { w: W2 });
  for (let i = 0; i < 5; i++) circ(B, 510 + i * 10, 799, 4, i % 2 ? PAL.flagC : PAL.flagA, { w: W3 });
  B.paint(c => vine(c, cr([[592, 724], [586, 760], [594, 800], [588, 840]], 6), 12));
});
el('plat1', 27, B => {
  box(B, 412, 858, 245, 9, PAL.wood, { sh: .3, w: W2 });
  B.line(L(418, 867, 455, 902), W2); B.line(L(651, 867, 607, 902), W2);
  railing(B, 606, 655, 836, 858, 12, [607, 654]);
  B.paint(c => { vine(c, cr([[652, 867], [648, 890], [655, 915], [650, 940]], 6), 13); vine(c, cr([[434, 721], [440, 745], [434, 772], [441, 798]], 6), 14); });
});
el('bulbs', 27, B => {
  for (const [x, y0, len] of [[420, 867, 30], [438, 721, 26]]) {
    B.line(L(x, y0, x, y0 + len, .2), W3); box(B, x - 4, y0 + len - 2, 8, 5, '#8a8098', { w: W3 });
    circ(B, x, y0 + len + 11, 8, PAL.lamp, { w: W2 });
    B.line(cr([[x - 3, y0 + len + 12], [x, y0 + len + 7], [x + 3, y0 + len + 12]], 4), W3 * .8, { col: '#c07a2a' });
    B.glow(x, y0 + len + 11, 40, PAL.glow, .6);
  }
});
el('towerBase', 26, B => {
  box(B, 455, 867, 150, 145, PAL.stone, { sh: .45 });
  B.paint(c => { // cada pedra com um tom, presa na mesma grade das juntas
    const r = rng(5);
    for (let k = 0; k < 6; k++) { const xs = k % 2 ? [455, 505, 545, 585, 605] : [455, 485, 525, 565, 605]; for (let i = 0; i < 4; i++) { const v = r(); c.fillStyle = v < .35 ? 'rgba(255,225,215,.22)' : v < .7 ? 'rgba(90,40,70,.14)' : 'rgba(0,0,0,0)'; c.fillRect(xs[i] + 1, 868 + k * 24, xs[i + 1] - xs[i] - 2, 22); } }
  });
  for (const y of [891, 915, 939, 963, 987]) B.line(L(455, y, 605, y, .3), W3, { col: PAL.stoneD });
  for (let r = 0; r < 6; r++) { const y0 = 867 + r * 24; for (const x of (r % 2 ? [505, 545, 585] : [485, 525, 565])) B.line(L(x, y0 + 1, x, y0 + 23, .2), W3, { col: PAL.stoneD }); }
});
el('door', 27, B => {
  const d = [[510, 1012], [510, 966]].concat(arc(531, 966, 21, 21, Math.PI, TAU, 14)).concat([[552, 1012]]);
  B.fill(d, PAL.wood, { sh: .35 }); B.line(d, W2);
  B.line(L(524, 948, 524, 1012, .3), W3, { col: PAL.plank }); B.line(L(538, 948, 538, 1012, .3), W3, { col: PAL.plank });
  circ(B, 546, 990, 2.5, PAL.brass, { w: W3 });
});
el('lantern', 27, B => {
  B.line([[605, 936], [616, 936], [616, 946]], W2);
  box(B, 610, 948, 12, 17, PAL.lamp, { w: W2 }); B.line([[608, 948], [616, 941], [624, 948]], W2);
  B.glow(616, 957, 36, PAL.glow, .6);
});
el('stairs', 28, B => {
  const a = [300, 1012], b = [414, 862], d = 13;
  B.fill([a, b, [b[0] + d, b[1]], [a[0] + d, a[1]]], PAL.wood, { occ: false });
  B.line(L(a[0], a[1], b[0], b[1]), W2); B.line(L(a[0] + d, a[1], b[0] + d, b[1]), W2);
  for (let i = 1; i <= 10; i++) { const p = at(a, b, i / 11); B.line(L(p[0], p[1], p[0] + d, p[1], .5), W2, { col: PAL.plank }); }
  B.line(L(a[0], a[1] - 30, b[0], b[1] - 30), W2);
  for (const i of [0, 4, 8, 11]) { const p = at(a, b, i / 11); B.line(L(p[0], p[1], p[0], p[1] - 30, .3), W3); }
});

// --- a ilha ---
const IS_TOP = cr([[180, 1012], [300, 1009], [420, 1014], [560, 1010], [700, 1013], [820, 1009], [905, 1012]], 8);
const IS_UND = cr([[905, 1012], [892, 1046], [862, 1080], [810, 1118], [760, 1150], [700, 1200], [640, 1262], [592, 1318], [562, 1350], [540, 1322], [500, 1272], [440, 1220], [370, 1170], [300, 1120], [228, 1078], [195, 1040], [180, 1012]], 6);
el('island', 20, B => {
  B.fill(IS_TOP.concat(IS_UND.slice(1)), PAL.rock, { sh: .5 });
  B.paint(c => islandPaint(c, IS_TOP, IS_UND, 3));
  B.line(IS_TOP, W1); B.line(IS_UND, W1);
  B.line(cr([[262, 1080], [360, 1094], [480, 1100], [620, 1098], [760, 1088], [850, 1070]], 6), W3, { col: PAL.rockD });
  B.line(cr([[350, 1150], [450, 1168], [560, 1172], [680, 1160], [758, 1146]], 6), W3, { col: PAL.rockD });
  B.line(cr([[478, 1238], [540, 1256], [616, 1252]], 6), W3, { col: PAL.rockD });
  for (const [x, y] of [[420, 1120], [700, 1112], [560, 1210], [300, 1060]]) B.line([[x, y], [x + 7, y + 9], [x + 3, y + 15], [x + 10, y + 24]], W3, { col: PAL.rockD });
  for (const x of [250, 345, 625, 668, 860]) B.line([[x - 6, 1012], [x - 3, 1002], [x, 1011], [x + 3, 1000], [x + 6, 1012]], W3, { col: '#2b6a3a' });
  for (const [x, r] of [[392, 8], [628, 7], [880, 6]]) { const s = arc(x, 1012, r, r * .8, Math.PI, TAU, 10); B.fill(s, PAL.stone); B.line(s, W3); }
  B.paint(c => { for (const [x, y, s] of [[300, 1118, 31], [470, 1240, 32], [720, 1185, 33], [840, 1096, 34]]) vine(c, cr([[x, y], [x + 4, y + 25], [x - 3, y + 50], [x + 3, y + 72]], 6), s); });
});
el('roots', 19, B => roots(B, [[300, 1118, 70], [392, 1184, 95], [470, 1244, 70], [560, 1346, 110], [620, 1282, 85], [730, 1174, 95], [840, 1096, 70]], 21));
el('crystals', 21, B => crystals(B, [
  [434, 1212, Math.PI * .66, 40, 14, '#7fe3ff'], [450, 1226, Math.PI * .56, 30, 11, '#b49cff'], [420, 1200, Math.PI * .76, 24, 9, '#7fe3ff'],
  [772, 1140, Math.PI * .3, 36, 13, '#ff9de0'], [760, 1150, Math.PI * .4, 26, 10, '#7fe3ff'], [786, 1128, Math.PI * .22, 20, 8, '#ff9de0'],
]));
el('isletCrystals', 21, B => crystals(B, [[1338, 1184, Math.PI * .3, 28, 11, '#7fe3ff'], [1326, 1194, Math.PI * .42, 20, 9, '#ff9de0']]));
const WF_O = cr([[182, 1009], [171, 1036], [165, 1090], [163, 1170], [166, 1250]], 8), WF_I = cr([[208, 1011], [197, 1036], [191, 1090], [189, 1170], [190, 1250]], 8);
el('waterfall', 21, B => {
  B.fill(WF_O.concat(WF_I.slice().reverse()), PAL.water, { only: 'ink' });
  B.paint(c => {
    const p = pathOf(WF_O.concat(WF_I.slice().reverse())), g = c.createLinearGradient(0, 1010, 0, 1262);
    g.addColorStop(0, '#c9eeff'); g.addColorStop(.65, 'rgba(180,228,255,.85)'); g.addColorStop(1, 'rgba(180,228,255,0)');
    c.fillStyle = g; c.fill(p);
    c.save(); c.clip(p); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2;
    for (const dx of [6, 13, 20]) { c.beginPath(); c.moveTo(184 + dx, 1012); c.quadraticCurveTo(170 + dx, 1050, 168 + dx, 1100 + dx * 3); c.stroke(); }
    c.restore();
    for (let i = 0; i < 7; i++) { c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(160 + i * 8, 1250 + (i % 3) * 6, 10 + (i % 2) * 5, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(182, 1010); c.lineTo(210, 1012); c.stroke();
  });
  B.line(WF_O, W2, { only: 'ink' }); B.line(WF_I, W2, { only: 'ink' });
  B.line(cr([[192, 1014], [183, 1040], [178, 1090], [177, 1140]], 6), W3, { only: 'ink' });
  B.line(cr([[200, 1014], [190, 1046], [185, 1110], [184, 1190]], 6), W3, { only: 'ink' });
  B.line(arc(176, 1262, 11, 6, Math.PI, TAU, 10), W3, { only: 'ink' }); B.line(arc(196, 1266, 8, 5, Math.PI, TAU, 8), W3, { only: 'ink' });
});
el('sails', 23, B => {
  const hx = 262, hy = 814;
  for (let k = 0; k < 4; k++) {
    const a = .38 + k * Math.PI / 2, u = [Math.cos(a), Math.sin(a)], n = [-Math.sin(a), Math.cos(a)], p = (r, o) => [hx + u[0] * r + n[0] * o, hy + u[1] * r + n[1] * o];
    B.line([p(0, 0), p(110, 0)], W2, { col: PAL.woodD });
    const fr = [p(20, 2), p(106, 2), p(106, 26), p(20, 26)];
    B.fill(fr, PAL.cream, { sh: .3 }); B.line(fr.concat([fr[0]]), W2);
    B.line([p(20, 14), p(106, 14)], W3);
    for (const r of [42, 63, 84]) B.line([p(r, 2), p(r, 26)], W3);
  }
  circ(B, hx, hy, 7, PAL.brass, { w: W2 });
});
el('windmill', 22, B => {
  const t = [[232, 1012], [292, 1012], [277, 832], [247, 832]];
  B.fill(t, PAL.wood, { sh: .45 }); B.line(t.concat([t[0]]), W1);
  for (const y of [972, 932, 892, 852]) { const hw = lerp(30, 15, (1012 - y) / 180); B.line(L(262 - hw, y, 262 + hw, y, .3), W3, { col: PAL.plank }); }
  const d = [[253, 1012], [253, 994]].concat(arc(262, 994, 9, 9, Math.PI, TAU, 8)).concat([[271, 1012]]);
  B.fill(d, PAL.woodD); B.line(d, W2);
  circ(B, 262, 905, 7, PAL.lamp, { w: W3 }); B.glow(262, 905, 22, PAL.glow, .45);
  const cp = [[240, 838], [262, 800], [284, 838]]; B.fill(cp, PAL.roof, { sh: .3 }); B.line(cp, W2); B.line(L(240, 838, 284, 838, .5), W2);
});

// --- a casinha ---
el('roof', 25, B => {
  B.fill([[674, 912], [767, 828], [860, 912]], PAL.roof, { sh: .4 });
  B.line([[672, 914], [767, 828], [862, 914]], W1); B.line(L(674, 912, 860, 912, .6), W2);
  for (const y of [852, 872, 892]) {
    const hw = (y - 828) * (93 / 84), x0 = 767 - hw + 4, x1 = 767 + hw - 4, p = [];
    for (let x = x0; x < x1 - 2; x += 14) for (let k = 0; k <= 6; k++) { const th = k / 6 * Math.PI; p.push([Math.min(x1, x + 7 - 7 * Math.cos(th)), y + 5 * Math.sin(th)]); }
    B.line(p, W3, { col: PAL.roofD });
  }
  circ(B, 767, 884, 10, PAL.lamp, { w: W2 }); B.line(L(757, 884, 777, 884, .2), W3); B.line(L(767, 874, 767, 894, .2), W3); B.glow(767, 884, 28, PAL.glow, .5);
});
el('chimney', 23, B => { box(B, 806, 836, 22, 50, PAL.stone, { w: W2, sh: .3 }); box(B, 802, 830, 30, 7, PAL.stoneD, { w: W2 }); });
el('smoke', 26, B => {
  B.paint(c => puffs(c, [[818, 818, 8], [826, 803, 9.5], [836, 788, 10.5], [848, 774, 11], [860, 760, 10]]));
  B.line(cr([[817, 826], [808, 812], [820, 800], [834, 806], [829, 792], [840, 780], [854, 786], [851, 771], [862, 760]], 6), W3, { col: '#a78bb8' });
});
el('cottage', 24, B => {
  box(B, 692, 905, 150, 107, PAL.cream, { sh: .4 });
  box(B, 692, 926, 150, 6, PAL.woodD, { w: W3 });
  box(B, 708, 952, 28, 60, PAL.wood, { sh: .3 }); circ(B, 722, 970, 5, PAL.lamp, { w: W3 }); circ(B, 731, 990, 2, PAL.brass, { w: W3 });
  box(B, 765, 942, 50, 33, PAL.lamp, { w: W2 }); B.line(L(790, 942, 790, 975, .3), W3); B.line(L(765, 958, 815, 958, .3), W3); B.glow(790, 958, 50, PAL.glow, .55);
  box(B, 760, 975, 60, 9, PAL.wood, { w: W2 });
  for (let i = 0; i < 5; i++) circ(B, 767 + i * 11.5, 972, 4.5, i % 2 ? PAL.flagC : PAL.flagA, { w: W3 });
  B.paint(c => vine(c, cr([[695, 1012], [700, 980], [694, 950], [702, 920]], 6), 15));
});
el('props', 28, B => {
  const br = cr([[659, 978], [655, 994], [659, 1011]], 5).concat(cr([[681, 1011], [685, 994], [681, 978]], 5));
  B.fill(br, PAL.wood, { sh: .35 });
  B.line(cr([[659, 978], [655, 994], [659, 1011]], 5), W2); B.line(cr([[681, 978], [685, 994], [681, 1011]], 5), W2);
  B.line(arc(670, 978, 11, 3.5, 0, TAU, 16), W2); B.line(L(659, 1011, 681, 1011, .3), W2);
  for (const y of [987, 1002]) B.line(cr([[657, y], [670, y + 2.5], [683, y]], 4), W3, { col: PAL.iron });
  box(B, 850, 982, 30, 30, PAL.woodL, { sh: .3 });
  B.line(L(853, 985, 877, 1009, .3), W3); B.line(L(877, 985, 853, 1009, .3), W3);
});
el('bunting2', 30, B => bunting(B, sag(652, 717, 806, 834, 14, 24), 5, 12, [PAL.flagC, PAL.flagA, PAL.flagD, PAL.flagB]));

// --- a ponte e a ilhota do acampamento ---
const BR = t => sagAt(901, 1010, 1095, 1074, 20, t), BRR = t => sagAt(901, 970, 1095, 1038, 16, t);
el('bridge', 26, B => {
  box(B, 897, 968, 7, 44, PAL.woodD, { w: W2 }); box(B, 1092, 1036, 7, 42, PAL.woodD, { w: W2 });
  const top = sag(901, 1010, 1095, 1074, 20, 24), bot = top.map(([x, y]) => [x, y + 5]);
  B.fill(top.concat(bot.slice().reverse()), PAL.wood);
  B.line(top, W2); B.line(bot, W2);
  for (let k = 1; k < 16; k++) { const p = BR(k / 16); B.line(L(p[0], p[1], p[0] + .6, p[1] + 5, .2), W3, { col: PAL.plank }); }
});
el('mini2', 27, B => {
  const p = BR(.42); clawd(B, p[0] - 27, p[1] - 30, 3.0, W2);
  B.line(L(960, 1040, 939, 1006, .4), W2, { col: PAL.woodD });
  circ(B, 936, 1001, 9, PAL.flagC, { w: W2 }); B.line([[930, 994], [936, 989], [942, 994]], W3);
  B.paint(c => { c.fillStyle = 'rgba(255,255,255,.75)'; for (const [x, y] of [[932, 999], [940, 1004], [935, 1006]]) { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); } });
});
el('bridgeRail', 28, B => {
  B.line(sag(901, 970, 1095, 1038, 16, 24), W2, { col: '#5a3a3a' });
  for (let k = 1; k < 10; k++) { const t = k / 10; if (t > .3 && t < .58) continue; B.line([BRR(t), BR(t)], W3, { col: '#5a3a3a' }); }
  B.paint(c => vine(c, sag(901, 970, 1095, 1038, 16, 24).slice(2, 9), 16, 7));
});
const IT_TOP = cr([[1085, 1078], [1180, 1075], [1300, 1079], [1425, 1076]], 8);
const IT_UND = cr([[1425, 1076], [1418, 1102], [1385, 1140], [1330, 1190], [1285, 1235], [1262, 1262], [1238, 1232], [1190, 1180], [1135, 1135], [1100, 1105], [1085, 1078]], 6);
el('islet', 20, B => {
  B.fill(IT_TOP.concat(IT_UND.slice(1)), PAL.rock, { sh: .5 });
  B.paint(c => islandPaint(c, IT_TOP, IT_UND, 7));
  B.line(IT_TOP, W1); B.line(IT_UND, W1);
  B.line(cr([[1120, 1112], [1200, 1124], [1300, 1120], [1388, 1104]], 6), W3, { col: PAL.rockD });
  B.line(cr([[1196, 1166], [1260, 1176], [1326, 1166]], 6), W3, { col: PAL.rockD });
  for (const x of [1105, 1300, 1395]) B.line([[x - 6, 1078], [x - 3, 1068], [x, 1077], [x + 3, 1066], [x + 6, 1078]], W3, { col: '#2b6a3a' });
  B.paint(c => { vine(c, cr([[1150, 1150], [1154, 1175], [1148, 1200]], 6), 41); vine(c, cr([[1360, 1162], [1364, 1190], [1358, 1214]], 6), 42); });
});
el('isletRoots', 19, B => roots(B, [[1150, 1148, 60], [1262, 1260, 95], [1340, 1180, 70], [1200, 1188, 55]], 31));
el('tent', 24, B => {
  const fr = [[1170, 1078], [1228, 990], [1286, 1078]], side = [[1228, 990], [1162, 982], [1120, 1074], [1170, 1078]];
  B.fill(fr, PAL.tent, { sh: .35 }); B.line([[1168, 1080], [1228, 990], [1288, 1080]], W1); B.line(L(1170, 1078, 1286, 1078, .5), W2);
  B.fill(side, PAL.tentD, { sh: .3 }); B.line([[1228, 990], [1162, 982], [1120, 1074], [1170, 1078]], W2);
  const dd = [[1212, 1078], [1228, 1030], [1244, 1078]]; B.fill(dd, '#5a2a3a'); B.line(dd, W2);
  const flap = cr([[1228, 1030], [1248, 1048], [1262, 1078]], 6).concat([[1244, 1078]]);
  B.fill(flap, PAL.tentD); B.line(cr([[1228, 1030], [1248, 1048], [1262, 1078]], 6), W2);
  B.line(L(1228, 978, 1228, 990, .2), W2); B.line(L(1162, 972, 1162, 982, .2), W2);
  B.line(L(1228, 994, 1296, 1078, .5), W3); B.line(L(1292, 1072, 1300, 1083, .2), W2);
  B.line(L(1162, 986, 1110, 1078, .5), W3);
  B.line(L(1228, 994, 1228, 1030, .2), W3, { col: PAL.tentD });
  B.glow(1228, 1064, 42, '#ffb347', .55);
});
el('fire', 26, B => {
  for (let i = 0; i < 5; i++) { const s = arc(1300 + i * 9, 1078, 5, 4.5, Math.PI, TAU, 8); B.fill(s, PAL.stone); B.line(s, W3); }
  B.line(L(1300, 1076, 1338, 1065, .5), 3.2, { col: '#6a3a2a' }); B.line(L(1300, 1065, 1338, 1076, .5), 3.2, { col: '#6a3a2a' });
  const o = cr([[1306, 1068], [1305, 1050], [1313, 1036], [1318, 1020], [1324, 1038], [1332, 1046], [1333, 1068]], 6), i = cr([[1312, 1068], [1313, 1054], [1319, 1042], [1325, 1056], [1327, 1068]], 5);
  B.fill(o, PAL.fire); B.line(o, W2); B.fill(i, '#ffe27a'); B.line(i, W3);
  B.line(L(1312, 1010, 1310, 1004, .1), W3); B.line(L(1328, 1004, 1331, 997, .1), W3);
  B.glow(1319, 1050, 80, '#ffb347', .7);
});
el('mini3', 27, B => {
  clawd(B, 1342, 1048, 3.0, W2);
  B.line(L(1346, 1063, 1318, 1031, .3), W2, { col: PAL.woodD });
  box(B, 1311, 1022, 8, 8, '#fff6ea', { w: W3 });
});
el('campFlag', 23, B => {
  B.line(L(1414, 1078, 1414, 972, .4), W2, { col: PAL.woodD });
  const f = cr([[1414, 974], [1432, 970], [1448, 980], [1464, 983]], 6).concat(cr([[1464, 983], [1448, 996], [1431, 994], [1414, 1002]], 6).slice(1));
  B.fill(f, PAL.clay, { sh: .25 }); B.line(f, W2);
  spark(B, 1437, 986, 7, PAL.cream, 2, 8, .2);
});

// --- âncora e pássaros ---
el('anchor', 15, B => {
  for (let k = 0; k < 13; k++) { const y = 712 + k * 9.4; if (k % 2 === 0) B.line(arc(1150, y, 3.6, 5.6, -Math.PI / 2, Math.PI * 1.5, 12), W3, { col: PAL.iron }); else B.line(L(1150, y - 4.5, 1150, y + 4.5, .1), W2, { col: PAL.iron }); }
  circ(B, 1150, 838, 6, null, { w: W2, col: PAL.iron });
  box(B, 1147, 844, 6, 42, '#5f5b80', { w: W2 }); box(B, 1130, 852, 40, 5, '#5f5b80', { w: W2 });
  const ar = arc(1150, 866, 27, 22, .2, Math.PI - .2, 16); B.line(ar, 3.2, { col: PAL.iron });
  const e1 = ar[0], e2 = ar[ar.length - 1];
  B.line([[e1[0] - 4, e1[1] - 6], [e1[0] + 4, e1[1] - 9], [e1[0] + 2, e1[1] + 3]], W2, { col: PAL.iron });
  B.line([[e2[0] + 4, e2[1] - 6], [e2[0] - 4, e2[1] - 9], [e2[0] - 2, e2[1] + 3]], W2, { col: PAL.iron });
});
el('birds', 5, B => { for (const [x, y, s] of [[372, 250, 15], [410, 228, 11], [344, 292, 10], [452, 268, 13], [700, 206, 12], [732, 232, 9]]) bird(B, x, y, s); });

// peças largas demais para a câmera acompanhar de ponta a ponta: o lápis monta por trechos, da esquerda para a direita
const SWEEP = new Set(['hull', 'envOutline', 'envSeams', 'island']);
// ordem em que o lápis desenha: começa no herói e termina nos pássaros
const SEGS = [
  { t0: -0.9, t1: 2.2, els: ['hero', 'heroHat', 'heroScope', 'heroPack'] },
  { t0: 2.2, t1: 4.6, els: ['hull', 'portholes', 'railing', 'wheel'] },
  { t0: 4.6, t1: 6.2, els: ['cabin', 'chimneyShip', 'shipFlag', 'propeller', 'rudder'] },
  { t0: 6.2, t1: 8.8, els: ['ropes', 'envOutline', 'fins', 'sideFin', 'envSeams', 'patch', 'emblem'] },
  { t0: 8.8, t1: 9.6, els: ['mooring'] },
  { t0: 9.6, t1: 13.4, els: ['mini1', 'rail2', 'plat2', 'scaffold', 'ladder', 'obsRoom', 'scope', 'dome', 'towerFlag', 'room1', 'plat1', 'bulbs', 'towerBase', 'door', 'lantern'] },
  { t0: 13.4, t1: 15.4, els: ['stairs', 'sails', 'windmill', 'waterfall', 'island', 'crystals', 'roots'] },
  { t0: 15.4, t1: 17.0, els: ['roof', 'chimney', 'cottage', 'smoke', 'props', 'bunting2'] },
  { t0: 17.0, t1: 19.4, els: ['bridge', 'mini2', 'bridgeRail', 'islet', 'isletCrystals', 'isletRoots', 'tent', 'fire', 'mini3', 'campFlag'] },
  { t0: 19.4, t1: 20.3, els: ['anchor', 'birds'] },
];

// ---------- fundo da pintura: céu, lua, nuvens, morros e floresta ----------
function paintBG(c) {
  const g = c.createLinearGradient(0, 0, 0, 1250);
  [[0, '#2340e0'], [.1, '#2a46f2'], [.2, '#4a4ff0'], [.3, '#7f62ea'], [.38, '#ad7de4'], [.46, '#d488d4'], [.54, '#f293c0'], [.62, '#ffa2a8'], [.72, '#ffab8c'], [.84, '#ffb270'], [1, '#ffbb66']].forEach(([o, col]) => g.addColorStop(o, col));
  c.fillStyle = g; c.fillRect(0, 0, 1600, 1600);
  const sg = c.createRadialGradient(1120, 1130, 20, 1120, 1130, 680); sg.addColorStop(0, 'rgba(255,214,140,.55)'); sg.addColorStop(1, 'rgba(255,170,120,0)');
  c.fillStyle = sg; c.fillRect(0, 0, 1600, 1600);
  // estrelas
  const r = rng(42);
  for (let i = 0; i < 170; i++) {
    const x = r() * 1600, y = Math.pow(r(), 1.5) * 720, a = (1 - y / 760) * (.45 + r() * .55), s = .7 + r() * 1.5;
    c.fillStyle = `rgba(255,255,255,${a})`; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
    if (r() < .1) { c.strokeStyle = `rgba(255,255,255,${a * .8})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.moveTo(x, y - 6); c.lineTo(x, y + 6); c.stroke(); }
  }
  // lua
  const mg = c.createRadialGradient(235, 178, 10, 235, 178, 110); mg.addColorStop(0, 'rgba(255,240,200,.4)'); mg.addColorStop(1, 'rgba(255,240,200,0)');
  c.fillStyle = mg; c.fillRect(100, 50, 280, 260);
  const mc = document.createElement('canvas'); mc.width = mc.height = 90; const m = mc.getContext('2d');
  m.fillStyle = '#fff3c4'; m.beginPath(); m.arc(45, 45, 30, 0, TAU); m.fill();
  m.globalCompositeOperation = 'destination-out'; m.beginPath(); m.arc(58, 36, 27, 0, TAU); m.fill();
  c.drawImage(mc, 190, 133);
  // nuvens em faixas
  for (const [x, y, w, h] of [[-40, 300, 560, 26], [130, 330, 280, 14], [960, 150, 380, 18], [690, 96, 240, 12], [1180, 560, 460, 28], [1330, 596, 250, 14], [-30, 640, 330, 22], [1250, 820, 400, 24], [40, 880, 260, 16], [620, 700, 210, 12]]) {
    const base = y < 500 ? '#ff9cc8' : '#ffb2b4', hi = y < 500 ? '#ffc6de' : '#ffd2c6';
    c.fillStyle = base; c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill();
    for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(x + w * (.25 + k * .22), y + h * .2, w * .12, h * .7, 0, 0, TAU); c.fill(); }
    c.fillStyle = hi; c.beginPath(); c.roundRect(x + h * .4, y - h * .25, w * .55, h * .38, h * .2); c.fill();
  }
  // morros distantes
  const hill = (y0, a, f, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, 1600); for (let x = 0; x <= 1600; x += 20) c.lineTo(x, y0 + a * Math.sin(x * f + y0) + a * .5 * Math.sin(x * f * 2.7 + 1)); c.lineTo(1600, 1600); c.closePath(); c.fill(); };
  hill(1090, 18, .006, '#b97bd8'); hill(1140, 22, .005, '#9563c8');
  const hz = c.createLinearGradient(0, 1060, 0, 1200); hz.addColorStop(0, 'rgba(255,170,200,.35)'); hz.addColorStop(1, 'rgba(255,170,200,0)'); c.fillStyle = hz; c.fillRect(0, 1060, 1600, 140);
  // floresta em camadas de copas
  c.fillStyle = '#13305e'; c.fillRect(0, 1235, 1600, 400);
  const rows = [
    { y: 1200, a: 50, b: 70, d: '#244d8f', l: '#3567b0', t: '#4d84c8', pink: .1 },
    { y: 1300, a: 56, b: 80, d: '#1c5a80', l: '#2f8f93', t: '#4fb3a4', pink: .22 },
    { y: 1425, a: 64, b: 88, d: '#174a74', l: '#2c8487', t: '#55b89c', pink: .12 },
    { y: 1560, a: 76, b: 104, d: '#10305c', l: '#1f6a84', t: '#2f8f9a', pink: .05 },
  ];
  rows.forEach((row, ri) => {
    const rr = rng(100 + ri), trees = [];
    for (let x = -70; x < 1700;) { const R = row.a + rr() * (row.b - row.a); trees.push([x, row.y + (rr() - .5) * 26, R, rr() < row.pink]); x += R * (1.1 + rr() * .45); }
    for (const [x, y, R] of trees) trunk(c, x, y, R, rr);
    for (const [x, y, R, pk] of trees) crown(c, x, y, R, pk ? '#b8509a' : row.d, pk ? '#f286bd' : row.l, pk ? '#ffb3d6' : row.t, rr);
  });
}
function trunk(c, x, y, R, r) {
  c.strokeStyle = '#8a3aa8'; c.lineCap = 'round';
  c.lineWidth = R * .14; c.beginPath(); c.moveTo(x + (r() - .5) * 10, y + 190); c.quadraticCurveTo(x - 6, y + 80, x, y); c.stroke();
  c.lineWidth = R * .07;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x, y + 40); c.quadraticCurveTo(x + s * R * .3, y + 10, x + s * R * .5, y - R * .2); c.stroke(); }
}
function crown(c, x, y, R, dark, light, tip, r) { // copa em gomos: anel de fora, anel de dentro, cada gomo com borda de luz
  const lobes = [], n = 10 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) { const a = Math.PI + (i + .5) / n * Math.PI; lobes.push([x + Math.cos(a) * R * .82, y + Math.sin(a) * R * .64, R * (.21 + r() * .08)]); }
  for (let i = 0; i < 6; i++) { const a = Math.PI + (i + .5) / 6 * Math.PI; lobes.push([x + Math.cos(a) * R * .48, y + Math.sin(a) * R * .34 + R * .05, R * (.23 + r() * .06)]); }
  for (let i = 0; i < 4; i++) lobes.push([x + (r() - .5) * R * 1.1, y + R * .22 + r() * R * .18, R * (.24 + r() * .06)]);
  c.fillStyle = dark; c.beginPath(); c.ellipse(x, y + R * .08, R * .98, R * .72, 0, 0, TAU); c.fill();
  for (const [lx, ly, lr] of lobes) { c.beginPath(); c.arc(lx, ly, lr, 0, TAU); c.fill(); }
  for (const [lx, ly, lr] of lobes) {
    c.save(); c.beginPath(); c.arc(lx, ly, lr, 0, TAU); c.clip();
    c.fillStyle = light; c.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
    c.fillStyle = tip; c.beginPath(); c.arc(lx - lr * .2, ly - lr * .5, lr * .55, 0, TAU); c.fill();
    c.fillStyle = dark; c.beginPath(); c.arc(lx + lr * .14, ly + lr * .36, lr * .95, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = tip; c.lineWidth = 1.2;
    if (r() < .6) { const a = -2.3 + r() * 1.2, px = lx + Math.cos(a) * lr * .62, py = ly + Math.sin(a) * lr * .62; c.beginPath(); c.moveTo(px - 2.6, py + 1.8); c.lineTo(px, py - 1.8); c.lineTo(px + 2.6, py + 1.8); c.stroke(); }
  }
}
function paintFG(c) { // vaga-lumes
  const r = rng(77);
  c.save(); c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 46; i++) {
    const x = r() * 1600, y = 1180 + r() * 400, s = 1.2 + r() * 1.6;
    const g = c.createRadialGradient(x, y, 0, x, y, s * 6); g.addColorStop(0, 'rgba(240,255,150,.7)'); g.addColorStop(1, 'rgba(240,255,150,0)');
    c.fillStyle = g; c.fillRect(x - s * 6, y - s * 6, s * 12, s * 12);
    c.fillStyle = '#f6ffb0'; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
  }
  c.restore();
}
function paintGlows(c) {
  c.save(); c.globalCompositeOperation = 'screen';
  for (const { x, y, r, col, a } of GLOWS) {
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,214,107,0)');
    c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  c.restore();
}
