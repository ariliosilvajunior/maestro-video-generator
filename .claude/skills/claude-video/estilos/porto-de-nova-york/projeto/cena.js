// cena.js — a paisagem de Nova York desenhada em canvas 2D. O motor usa cada camada como textura.
// Panorama em graus: x = azimute (cresce para a direita), y = elevação em graus de tangente (0 = horizonte).
// Camadas do panorama da Estátua: day (cor de dia, com alfa), night (luz própria), key (quando acende), haze (névoa).
const D2R = Math.PI / 180;
const c01 = x => Math.max(0, Math.min(1, x));
const gray = v => { const c = Math.round(c01(v) * 255); return `rgb(${c},${c},${c})`; };
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function mulHex(hex, k) { const n = parseInt(hex.slice(1), 16), f = v => Math.round(Math.min(255, v * k)); return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`; }

function rect(x0, y0, x1, y1) { const p = new Path2D(); p.rect(x0, y0, x1 - x0, y1 - y0); return p; }
function poly(pts) { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; }
function oval(x, y, rx, ry) { const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return p; }
function polyline(pts) { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); return p; }

function Pano(az0, az1, e0, e1, ppd, layers) {
  const P = { az0, az1, ppd, s0: Math.tan(e0 * D2R) / D2R, s1: Math.tan(e1 * D2R) / D2R, c: {}, cv: {} };
  P.W = Math.round((az1 - az0) * ppd); P.H = Math.round((P.s1 - P.s0) * ppd);
  const BG = { day: null, night: '#000', key: '#fff', haze: '#000' };
  for (const k of layers) {
    const cv = document.createElement('canvas'); cv.width = P.W; cv.height = P.H;
    const g = cv.getContext('2d', { willReadFrequently: true });
    if (BG[k]) { g.fillStyle = BG[k]; g.fillRect(0, 0, P.W, P.H); }
    g.setTransform(ppd, 0, 0, -ppd, -az0 * ppd, P.s1 * ppd);
    P.c[k] = g; P.cv[k] = cv;
  }
  return P;
}
// um objeto opaco: cobre o que está atrás em todas as camadas
function put(P, path, o, rule = 'nonzero') {
  const go = (g, style) => {
    if (o.w) { g.strokeStyle = style; g.lineWidth = o.w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(path); }
    else { g.fillStyle = style; g.fill(path, rule); }
  };
  const c = P.c;
  if (c.day) go(c.day, o.day);
  if (c.night) go(c.night, o.night || '#000');
  if (c.key) go(c.key, gray(o.key ?? 1));
  if (c.haze) go(c.haze, gray(o.haze ?? 0));
}
// detalhe só de dia (sombra, dobra), recortado pelo contorno do objeto
function paint(P, path, col, clip, w) {
  const g = P.c.day; g.save(); if (clip) g.clip(clip);
  if (w) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke(path); } else { g.fillStyle = col; g.fill(path); }
  g.restore();
}
// só luz (janela, lâmpada): aparece de noite, quando a chave passa
function light(P, path, col, key, clip, w) {
  for (const [g, s] of [[P.c.night, col], [P.c.key, gray(key)]]) {
    g.save(); if (clip) g.clip(clip);
    if (w) { g.strokeStyle = s; g.lineWidth = w; g.lineCap = 'round'; g.stroke(path); } else { g.fillStyle = s; g.fill(path); }
    g.restore();
  }
}

// ═════════ A · o pôr do sol, olhando para o oeste (Jersey City, o porto, a ponte em arco) ═════════
// Só silhueta: o cinza guarda a névoa (0 = perto e escuro, 1 = some no céu), o alfa a cobertura.
function cenaA() {
  const P = Pano(-45, 45, -1.2, 9, 36, ['day']);
  const r = rng(7), g = P.c.day;
  const F = (path, h, w) => { if (w) { g.strokeStyle = gray(h); g.lineWidth = w; g.lineCap = 'round'; g.stroke(path); } else { g.fillStyle = gray(h); g.fill(path); } };
  const fim = a => c01((36 - a) / 5);

  // serra ao longe
  let p = new Path2D(); p.moveTo(-45, -0.3);
  for (let a = -45; a <= 45.01; a += 0.25) p.lineTo(a, (0.42 + 0.2 * Math.sin(a * 0.11 + 1.2) + 0.12 * Math.sin(a * 0.37 + 0.4) + 0.05 * Math.sin(a * 1.3 + 2)) * fim(a) - 0.05);
  p.lineTo(45, -0.3); p.closePath(); F(p, 0.9);

  // torres de Jersey City, à esquerda, mais altas na ponta
  const torre = (x, w, h, hz, topo) => {
    const x0 = x - w / 2, x1 = x + w / 2;
    let pts = [[x0, -0.2], [x1, -0.2], [x1, h], [x0, h]];
    if (topo === 'chanfro') pts = [[x0, -0.2], [x1, -0.2], [x1, h - w * 0.55], [x0 + w * 0.45, h], [x0, h]];
    if (topo === 'degrau') pts = [[x0, -0.2], [x1, -0.2], [x1, h - 0.5], [x1 - w * 0.22, h - 0.5], [x1 - w * 0.22, h], [x0 + w * 0.22, h], [x0 + w * 0.22, h - 0.5], [x0, h - 0.5]];
    F(poly(pts), hz);
    if (topo === 'antena') F(rect(x - 0.02, h, x + 0.02, h + 0.65), hz);
  };
  [[-29.4, 1.0, 3.8, .72], [-26.8, 1.1, 6.9, .64, 'chanfro'], [-24.8, 0.9, 6.0, .65], [-22.4, 0.75, 4.7, .68, 'degrau'],
   [-20.1, 1.15, 3.2, .72], [-17.6, 0.65, 4.0, .7, 'antena'], [-15.1, 0.95, 2.6, .74], [-11.8, 0.75, 3.1, .72],
   [-8.5, 1.05, 2.1, .76], [-4.9, 0.65, 2.5, .75], [-1.0, 1.2, 1.5, .78], [26.5, 0.8, 1.8, .77], [28.6, 0.6, 1.3, .78]].forEach(a => torre(...a));
  for (let x = -44; x < 30; x += 1.3 + r() * 2.8) if (Math.abs(x - 2.5) > 2.2) torre(x, 0.6 + r() * 1.1, (0.45 + r() * 0.95) * fim(x + 6), 0.78 + r() * 0.06);

  // guindastes de contêiner
  const grua = (x, hz) => {
    const q = new Path2D();
    q.moveTo(x - 0.36, -0.1); q.lineTo(x - 0.22, 1.55); q.moveTo(x + 0.36, -0.1); q.lineTo(x + 0.22, 1.55);
    q.moveTo(x - 0.31, 0.62); q.lineTo(x + 0.31, 0.62);
    q.moveTo(x - 0.95, 1.56); q.lineTo(x + 1.35, 1.56);
    q.moveTo(x - 0.16, 1.56); q.lineTo(x, 2.15); q.lineTo(x + 0.16, 1.56);
    q.moveTo(x, 2.15); q.lineTo(x + 1.25, 1.6); q.moveTo(x, 2.15); q.lineTo(x - 0.9, 1.6);
    F(q, hz, 0.05);
    F(rect(x - 0.3, 1.46, x + 0.3, 1.7), hz);
  };
  grua(4.8, .7); grua(7.1, .71); grua(9.4, .72);

  // ponte em arco (Bayonne), no fundo da névoa
  const arco = (x0, x1, yd, yt, hz) => {
    const xm = (x0 + x1) / 2, hw = (x1 - x0) / 2;
    const up = x => 0.3 + (yt - 0.3) * (1 - ((x - xm) / hw) ** 2), lo = x => 0.15 + (yt - 0.26 - 0.15) * (1 - ((x - xm) / hw) ** 2);
    const q = new Path2D(); q.moveTo(x0, up(x0));
    for (let x = x0; x <= x1 + 1e-6; x += hw / 40) q.lineTo(x, up(x));
    for (let x = x1; x >= x0 - 1e-6; x -= hw / 40) q.lineTo(x, lo(x));
    q.closePath(); F(q, hz);
    F(rect(x0 - 3.2, yd - 0.06, x1 + 3.2, yd + 0.07), hz);
    const s = new Path2D();
    for (let x = x0 + 0.35; x < x1 - 0.2; x += 0.42) { const y = lo(x); s.moveTo(x, Math.min(y, yd)); s.lineTo(x, Math.max(y, yd)); }
    for (let x = x0 - 3.0; x < x0; x += 0.8) { s.moveTo(x, -0.1); s.lineTo(x, yd); }
    for (let x = x1 + 0.6; x < x1 + 3.2; x += 0.8) { s.moveTo(x, -0.1); s.lineTo(x, yd); }
    F(s, hz, 0.035);
  };
  arco(14.5, 25.5, 1.05, 2.45, .73);

  // margem escura de perto: árvores, galpões e estacas, que somem para a direita
  const ph = [r() * 6.3, r() * 6.3, r() * 6.3, r() * 6.3];
  const topo = x => 1.6 * (0.1 + 0.13 * (0.5 + 0.5 * Math.sin(x * 0.9 + ph[0])) + 0.09 * (0.5 + 0.5 * Math.sin(x * 2.3 + ph[1])) + 0.05 * Math.sin(x * 5.1 + ph[2]) + 0.03 * Math.sin(x * 11.7 + ph[3])) * c01((32 - x) / 6);
  const b = new Path2D(); b.moveTo(-45, -0.28);
  for (let x = -45; x <= 35; x += 0.05) b.lineTo(x, topo(x));
  b.lineTo(35, -0.28); b.closePath(); F(b, 0.06);
  const tufos = new Path2D();
  for (let x = -45; x < 31; x += 0.25 + r() * 0.6) {
    const rw = 0.12 + r() * 0.3, h = topo(x) + 0.02 + r() * 0.12 * c01((31 - x) / 6);
    tufos.moveTo(x + rw, h - rw * 0.5); tufos.ellipse(x, h - rw * 0.5, rw, rw * 0.55, 0, 0, Math.PI * 2);
  }
  F(tufos, 0.06);
  const galpoes = new Path2D();
  for (let x = -40; x < 24; x += 3 + r() * 6) { const w = 0.8 + r() * 1.6; galpoes.rect(x, -0.2, w, 0.34 + r() * 0.22); }
  F(galpoes, 0.06);
  return P;
}

// ═════════ H · a Estátua da Liberdade na frente, Manhattan atrás, a ponte do Brooklyn à direita ═════════
const CX = 114;          // eixo da Estátua (azimute)
const S_Y0 = 6.2, S = 6.1, SX = S * 0.92; // pé da estátua, altura da figura até a chama e largura (graus)
const MS = 1.12;                          // escala do monumento inteiro (forte, pedestal e estátua)
const sU = (u, v) => [CX + u * SX, S_Y0 + v * S];
const TOCHA = (([x, y]) => [CX + (x - CX) * MS, y * MS])(sU(-0.117, 0.965));

function cenaH() {
  const P = Pano(70, 162, -1.2, 15.6, 48, ['day', 'night', 'key', 'haze']);
  const r = rng(11);
  const WIN = ['#ffd38f', '#ffe2b0', '#ffc977', '#fff0d2', '#ffdca0', '#ffd38f', '#e8eeff'];
  const MAN = ['#67638f', '#5d5a84', '#706c97', '#55527a', '#79759f', '#625e88', '#6b6588'];
  const winCol = () => WIN[Math.floor(r() * WIN.length)];
  const kAt = y => 0.06 + 0.8 * c01(y / 8.5);

  function janelas(x0, x1, y0, y1, dens, fl = 0.088, cw = 0.07, clip) {
    for (let y = y0 + 0.07; y < y1 - 0.08; y += fl) {
      if (r() < 0.12) continue; // andar inteiro apagado
      for (let x = x0 + 0.04; x < x1 - 0.05; x += cw) {
        if (r() > dens) continue;
        light(P, rect(x, y, x + cw * 0.55, y + fl * 0.5), winCol(), kAt(y) + 0.1 * r(), clip);
      }
    }
  }
  // prédio comum: face + lateral em sombra + janelas
  function predio(x, w, h, o = {}) {
    const hz = o.hz ?? 0.4, col = o.col ?? MAN[Math.floor(r() * MAN.length)];
    const x0 = x - w / 2, x1 = x + w / 2, path = o.path || rect(x0, -0.25, x1, h);
    put(P, path, { day: col, haze: hz });
    paint(P, rect(x1 - w * (o.side ?? 0.3), -0.3, x1 + 0.01, h + 2), mulHex(col, 0.8), path);
    if (o.win !== false) janelas(x0, x1, 0, o.winTop ?? h, o.dens ?? 0.42, 0.088, 0.07, path);
    return path;
  }
  // mata: base com topo ondulado + tufos redondos em grupos de tamanhos variados
  function copas(x0, x1, hmin, hmax, hz, cols, base = -0.36, taper = 0) {
    const ph = [r() * 6.3, r() * 6.3];
    const amp = x => taper ? c01((x - x0) / taper) : 1;
    const top = x => amp(x) * (hmin * 0.7 + (hmax - hmin) * 0.3 * (0.5 + 0.5 * Math.sin(x * 1.1 + ph[0])) + 0.05 * Math.sin(x * 3.7 + ph[1]));
    const p = new Path2D(); p.moveTo(x0, base);
    for (let x = x0; x <= x1; x += 0.05) p.lineTo(x, Math.max(0.02, top(x)));
    p.lineTo(x1, base); p.closePath();
    put(P, p, { day: cols, haze: hz });
    const q = new Path2D();
    for (let x = x0 + 0.1; x < x1 - 0.1; x += 0.2 + r() * 0.5) {
      const a = amp(x); if (a < 0.08) continue;
      const h = (hmin + r() * (hmax - hmin)) * a, n = 1 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const rw = (0.12 + r() * 0.26) * Math.min(1, h * 1.5), cx = x + (k - (n - 1) / 2) * rw * 0.95, cy = h - rw * (0.75 + r() * 0.35);
        q.moveTo(cx + rw, cy); q.ellipse(cx, cy, rw, rw * (0.8 + r() * 0.25), 0, 0, Math.PI * 2);
      }
    }
    put(P, q, { day: cols, haze: hz });
    return p;
  }

  // ── 1. Midtown ao fundo (Empire State e as torres finas) ──
  for (let x = 97.5; x < 107.5; x += 0.35 + r() * 0.5) predio(x, 0.32 + r() * 0.4, 1.4 + r() * 1.8, { hz: .7, dens: .35 });
  (function esb(x) {
    const hz = .66, col = '#7d78a6';
    const p = new Path2D();
    for (const [w, a, b] of [[0.9, -0.25, 2.6], [0.64, 2.6, 3.35], [0.44, 3.35, 4.25], [0.3, 4.25, 4.5], [0.2, 4.5, 4.75]]) p.rect(x - w / 2, a, w, b - a);
    p.moveTo(x - 0.07, 4.75); p.lineTo(x + 0.07, 4.75); p.lineTo(x + 0.03, 5.15); p.lineTo(x + 0.012, 5.6); p.lineTo(x - 0.012, 5.6); p.lineTo(x - 0.03, 5.15); p.closePath();
    put(P, p, { day: col, haze: hz });
    paint(P, rect(x + 0.12, -0.3, x + 0.5, 6), mulHex(col, 0.82), p);
    janelas(x - 0.45, x + 0.45, 0, 2.6, .5, 0.088, 0.07, p); janelas(x - 0.32, x + 0.32, 2.6, 3.35, .5, 0.088, 0.07, p); janelas(x - 0.22, x + 0.22, 3.35, 4.25, .5, 0.088, 0.07, p);
    light(P, rect(x - 0.15, 4.25, x + 0.15, 4.5), '#ffe3a0', 0.92);
    light(P, rect(x - 0.1, 4.5, x + 0.1, 4.75), '#fff0c8', 0.93);
    light(P, poly([[x - 0.065, 4.75], [x + 0.065, 4.75], [x + 0.025, 5.15], [x - 0.025, 5.15]]), '#fff6dc', 0.94);
  })(101.9);
  predio(104.0, 0.2, 4.75, { hz: .66, col: '#837eaa', dens: .3 });                         // torre fina
  predio(105.3, 0.3, 5.05, { hz: .66, col: '#7a76a2', dens: .3 });                         // torre mais alta
  predio(100.4, 0.42, 4.3, { hz: .66, col: '#807aa6', path: poly([[100.19, -0.25], [100.61, -0.25], [100.61, 3.9], [100.4, 4.3], [100.19, 3.9]]) });
  light(P, rect(100.39, 4.3, 100.41, 4.75), '#fff2d8', .94); put(P, rect(100.392, 4.3, 100.408, 4.75), { day: '#807aa6', haze: .66, night: '#fff2d8', key: .94 });

  // ── 2. Jersey City, à esquerda ──
  for (let x = 79; x < 99.5; x += 0.45 + r() * 0.9) {
    const h = 1.3 + r() * 1.6 + (x > 91 ? 0.8 : 0);
    predio(x, 0.4 + r() * 0.5, h, { hz: .52 + r() * .05, dens: .38 });
  }
  predio(96.9, 0.62, 4.2, { hz: .5, col: '#7e79a6', path: poly([[96.59, -0.25], [97.21, -0.25], [97.21, 3.85], [96.9, 4.2], [96.59, 4.2]]) });
  predio(94.6, 0.55, 3.6, { hz: .52 });
  predio(92.3, 0.5, 3.2, { hz: .53 });

  // ── 3. Lower Manhattan, fileira de trás ──
  for (let x = 104.5; x < 127.5; x += 0.3 + r() * 0.45) {
    const env = 2.0 + 2.5 * Math.exp(-(((x - 117.5) / 6) ** 2));
    predio(x, 0.32 + r() * 0.42, env * (0.55 + r() * 0.45), { hz: .48 + r() * .04 });
  }
  // marcos de Lower Manhattan
  (function pine70(x) {
    const hz = .42, col = '#7c77a3', p = new Path2D();
    for (const [w, a, b] of [[0.5, -0.25, 4.1], [0.38, 4.1, 4.6], [0.26, 4.6, 5.05], [0.14, 5.05, 5.3]]) p.rect(x - w / 2, a, w, b - a);
    p.moveTo(x - 0.03, 5.3); p.lineTo(x + 0.03, 5.3); p.lineTo(x, 5.95); p.closePath();
    put(P, p, { day: col, haze: hz }); paint(P, rect(x + 0.08, -0.3, x + 0.3, 6), mulHex(col, 0.8), p);
    janelas(x - 0.25, x + 0.25, 0, 4.1, .45, 0.088, 0.07, p);
    light(P, rect(x - 0.13, 4.6, x + 0.13, 5.3), '#ffd890', .91, p);
  })(109.4);
  (function wall40(x) {
    const hz = .42, col = '#77729f', body = rect(x - 0.27, -0.25, x + 0.27, 5.0);
    put(P, body, { day: col, haze: hz }); paint(P, rect(x + 0.1, -0.3, x + 0.3, 5.1), mulHex(col, 0.8), body);
    janelas(x - 0.27, x + 0.27, 0, 5.0, .45, 0.088, 0.07, body);
    const roof = poly([[x - 0.22, 5.0], [x + 0.22, 5.0], [x, 5.72]]);
    put(P, roof, { day: '#5f8a86', haze: hz, night: '#9fe0c6', key: .92 });
    put(P, rect(x - 0.012, 5.7, x + 0.012, 6.3), { day: col, haze: hz, night: '#c8f5e2', key: .93 });
  })(111.2);
  for (let i = 0; i < 4; i++) {                                                             // Brookfield Place
    const x = 106.3 + i * 0.62, h = [3.1, 3.5, 3.3, 3.0][i], w = 0.48, col = '#8b84a8';
    const tops = [
      [[x - w / 2, h], [x + w / 2, h], [x, h + 0.42]],
      null,
      [[x - w / 2, h], [x + w / 2, h], [x + w / 2 - 0.08, h + 0.14], [x + 0.12, h + 0.14], [x + 0.06, h + 0.3], [x - 0.06, h + 0.3], [x - 0.12, h + 0.14], [x - w / 2 + 0.08, h + 0.14]],
      [[x - w / 2, h], [x + w / 2, h], [x, h + 0.34]]][i];
    const p = rect(x - w / 2, -0.25, x + w / 2, h);
    if (tops) p.addPath(poly(tops)); else { p.moveTo(x + 0.2, h); p.ellipse(x, h, 0.2, 0.26, 0, 0, Math.PI); }
    predio(x, w, h, { hz: .38, col, path: p });
  }
  predio(105.6, 0.5, 2.9, { hz: .38 });                                                     // 200 West St
  predio(116.6, 0.78, 4.7, { hz: .36, col: '#8580ad', path: poly([[116.21, -0.25], [116.99, -0.25], [116.99, 4.38], [116.21, 4.7]]), dens: .35 }); // 4 WTC
  (function tresWTC(x) {                                                                    // 3 WTC, com os X no alto
    const hz = .36, col = '#7f7aa8', w = 0.84, h = 5.75, x0 = x - w / 2, x1 = x + w / 2;
    const p = rect(x0, -0.25, x1, h); p.addPath(rect(x0 + 0.03, h, x0 + 0.07, h + 0.42)); p.addPath(rect(x1 - 0.07, h, x1 - 0.03, h + 0.42));
    predio(x, w, h, { hz, col, path: p, dens: .4, winTop: 4.2 });
    const xb = new Path2D();
    for (const [a, b] of [[4.25, 5.0], [5.0, 5.75]]) { xb.moveTo(x0, a); xb.lineTo(x1, b); xb.moveTo(x1, a); xb.lineTo(x0, b); }
    paint(P, xb, mulHex(col, 0.72), p, 0.035);
    light(P, xb, '#e8eeff', .9, p, 0.03);
  })(122.2);
  (function umWTC(x) {                                                                      // One World Trade Center
    const hz = .36, b = 0.56, tp = 0.3, y0 = 1.25, y1 = 7.05;
    put(P, rect(x - b, -0.25, x + b, y0), { day: '#77739f', haze: hz });
    const corpo = poly([[x - b, y0], [x + b, y0], [x + tp, y1], [x - tp, y1]]);
    put(P, corpo, { day: '#8f8bb8', haze: hz });
    paint(P, poly([[x, y0], [x + b, y0], [x + tp, y1], [x, y1]]), '#76729f', corpo);
    paint(P, poly([[x - tp, y1], [x, y1], [x, y0]]), '#a29ec7', corpo);
    paint(P, poly([[x, y1], [x + tp, y1], [x, y0]]), '#86829f', corpo);
    for (let y = y0 + 0.1; y < y1 - 0.1; y += 0.088) {
      if (r() < 0.3) continue;
      const hw = b + (tp - b) * (y - y0) / (y1 - y0);
      for (let xx = x - hw + 0.04; xx < x + hw - 0.05; xx += 0.07) if (r() < 0.22) light(P, rect(xx, y, xx + 0.038, y + 0.044), r() < 0.5 ? '#e8eeff' : '#fff0d2', kAt(y) + 0.1 * r(), corpo);
    }
    janelas(x - b, x + b, 0, y0, .45, 0.088, 0.07);
    put(P, rect(x - tp * 0.92, y1, x + tp * 0.92, y1 + 0.14), { day: '#6c6896', haze: hz, night: '#dfe8ff', key: .93 });
    put(P, rect(x - 0.022, y1 + 0.14, x + 0.022, 9.35), { day: '#8a86ad', haze: hz, night: '#f4f6ff', key: .95 });
    put(P, rect(x - 0.065, 7.5, x + 0.065, 7.58), { day: '#8a86ad', haze: hz, night: '#f4f6ff', key: .95 });
    put(P, oval(x, 9.36, 0.045, 0.045), { day: '#8a86ad', haze: hz, night: '#ffffff', key: .97 });
  })(119.6);
  (function spruce8(x) {                                                                    // a torre ondulada
    const hz = .4, col = '#948fba', x0 = x - 0.28, x1 = x + 0.28;
    const p = poly([[x0, -0.25], [x1, -0.25], [x1, 5.1], [x1 - 0.12, 5.1], [x1 - 0.12, 5.45], [x0 + 0.18, 5.45], [x0 + 0.18, 5.65], [x0, 5.65]]);
    predio(x, 0.56, 5.65, { hz, col, path: p, dens: .45 });
    for (let k = 0; k < 6; k++) { const q = new Path2D(), xx = x0 + 0.05 + k * 0.09; q.moveTo(xx, 0); for (let y = 0; y < 5.6; y += 0.1) q.lineTo(xx + 0.025 * Math.sin(y * 2.3 + k), y); paint(P, q, mulHex(col, 1.1), p, 0.018); }
  })(124.6);
  (function woolworth(x) {
    const hz = .42, col = '#857b9e', p = new Path2D();
    p.rect(x - 0.3, -0.25, 0.6, 3.25); p.rect(x - 0.17, 3.25, 0.34, 4.2 - 3.25);
    p.addPath(poly([[x - 0.13, 4.2], [x + 0.13, 4.2], [x + 0.06, 4.58], [x, 4.85], [x - 0.06, 4.58]]));
    for (const ox of [-0.16, 0.16]) p.addPath(poly([[x + ox - 0.025, 4.2], [x + ox + 0.025, 4.2], [x + ox, 4.42]]));
    predio(x, 0.6, 3.25, { hz, col, path: p, dens: .45, winTop: 3.25 });
    light(P, poly([[x - 0.13, 4.2], [x + 0.13, 4.2], [x + 0.06, 4.58], [x, 4.85], [x - 0.06, 4.58]]), '#ffcf7a', .92);
    light(P, rect(x - 0.17, 3.25, x + 0.17, 4.2), '#ffdd9c', .9, p);
  })(126.3);

  // ── 4. Lower Manhattan, fileira da frente (mais baixa) e o Seaport ──
  for (let x = 104.2; x < 131.5; x += 0.32 + r() * 0.5) {
    const h = x > 126.8 ? 0.8 + r() * 0.9 : 0.9 + r() * 1.6;
    predio(x, 0.32 + r() * 0.45, h, { hz: .3 + r() * .04, dens: .5 });
  }

  // ── 5. Brooklyn, à direita ──
  for (let x = 143.5; x < 162; x += 0.35 + r() * 0.7) predio(x, 0.35 + r() * 0.55, 0.45 + r() * 1.0 + (x > 148.5 && x < 153 ? 1.2 : 0), { hz: .32, dens: .45 });
  copas(143, 162, 0.25, 0.75, .28, '#3a3653');

  // ── 6. A ponte do Brooklyn: duas torres de arcos, cabos e o colar de luzes ──
  (function ponte() {
    const hz = .4, col = '#7a7194', xa = 133.6, xb = 139.8, yd = 0.95, yt = 3.05;
    put(P, rect(129.4, yd - 0.06, 144.6, yd + 0.08), { day: col, haze: hz, night: '#3a3020', key: .7 });
    const cabo = new Path2D(), pend = new Path2D(), luzes = new Path2D();
    const catm = x => yt - 0.02 - (yt - 0.02 - (yd + 0.14)) * (1 - ((x - (xa + xb) / 2) / ((xb - xa) / 2)) ** 2);
    const side = (x, xt, xe) => { const k = (x - xe) / (xt - xe); return yd + 0.05 + (yt - 0.02 - yd - 0.05) * k * k; };
    const cy = x => x < xa ? side(x, xa, 130.0) : x > xb ? side(x, xb, 144.0) : catm(x);
    cabo.moveTo(130.0, cy(130.0)); for (let x = 130.0; x <= 144.0; x += 0.05) cabo.lineTo(x, cy(x));
    for (let x = 130.2; x < 144; x += 0.11) { if (Math.abs(x - xa) < 0.3 || Math.abs(x - xb) < 0.3) continue; pend.moveTo(x, cy(x)); pend.lineTo(x, yd); }
    for (const xt of [xa, xb]) for (let k = 1; k <= 7; k++) for (const sd of [-1, 1]) { pend.moveTo(xt, yt - 0.1); pend.lineTo(xt + sd * k * 0.3, yd); }
    put(P, pend, { day: mulHex(col, 0.92), haze: hz, w: 0.012 });
    put(P, cabo, { day: mulHex(col, 0.85), haze: hz, w: 0.032 });
    for (let x = 130.1; x < 144; x += 0.19) { if (Math.abs(x - xa) < 0.3 || Math.abs(x - xb) < 0.3) continue; luzes.moveTo(x + 0.02, cy(x)); luzes.ellipse(x, cy(x), 0.02, 0.02, 0, 0, Math.PI * 2); }
    light(P, luzes, '#fff1cc', .83);
    for (let x = 129.6; x < 144.5; x += 0.32) light(P, oval(x, yd + 0.11, 0.014, 0.014), '#ffe0a0', .8);
    for (const x of [xa, xb]) {
      const p = new Path2D(); p.rect(x - 0.27, -0.25, 0.54, yt + 0.25);
      for (const ox of [-0.12, 0.12]) {
        p.moveTo(x + ox - 0.065, yd + 0.1); p.lineTo(x + ox - 0.065, yt - 0.78);
        p.quadraticCurveTo(x + ox - 0.065, yt - 0.52, x + ox, yt - 0.44); p.quadraticCurveTo(x + ox + 0.065, yt - 0.52, x + ox + 0.065, yt - 0.78);
        p.lineTo(x + ox + 0.065, yd + 0.1); p.closePath();
      }
      put(P, p, { day: col, haze: hz, night: '#6a5a40', key: .76 }, 'evenodd');
      paint(P, rect(x + 0.12, -0.3, x + 0.3, yt + 0.1), mulHex(col, 0.84), p);
      put(P, rect(x - 0.3, yt - 0.06, x + 0.3, yt + 0.05), { day: mulHex(col, 1.05), haze: hz, night: '#7a6848', key: .78 });
    }
  })();

  // ── 7. A margem da esquerda (aparece no fim do giro) ──
  for (let x = 75.5; x < 93; x += 1.2 + r() * 2.2) predio(x, 0.5 + r() * 0.9, (0.35 + r() * 0.7) * c01((x - 74) / 4), { hz: .3, dens: .4 });
  copas(70.4, 95.2, 0.18, 0.72, .27, '#3a3653', -0.36, 5);

  // ── 8. Ellis Island, o prédio de tijolo com quatro cúpulas ──
  (function ellis(x0, x1) {
    const hz = .2, col = '#83697a', xm = (x0 + x1) / 2;
    const p = rect(x0, -0.3, x1, 0.42);
    p.addPath(rect(xm - 0.5, 0.42, xm + 0.5, 0.58));
    p.moveTo(xm + 0.32, 0.58); p.ellipse(xm, 0.58, 0.32, 0.1, 0, 0, Math.PI);
    for (const ox of [-0.62, -0.38, 0.38, 0.62]) { p.addPath(rect(xm + ox - 0.04, 0.42, xm + ox + 0.04, 0.9)); p.moveTo(xm + ox + 0.05, 0.9); p.ellipse(xm + ox, 0.9, 0.05, 0.06, 0, 0, Math.PI); }
    put(P, p, { day: col, haze: hz });
    janelas(x0, x1, -0.05, 0.42, .55, 0.1, 0.09);
    copas(x0 - 1.4, x0 + 0.1, 0.2, 0.55, .2, '#34314d'); copas(x1 - 0.1, x1 + 1.2, 0.2, 0.5, .2, '#34314d');
  })(95.8, 98.6);

  // ── 9. Liberty Island: árvores, a ilha, as luzes da beira ──
  const ilha = rect(99, -0.36, 129.4, 0.08); put(P, ilha, { day: '#2c2b41', haze: .03 });
  copas(99.2, 107.6, 0.45, 1.25, .04, '#2f2e48');
  copas(120.4, 129.2, 0.4, 1.1, .04, '#2f2e48');
  put(P, rect(123.2, 0.05, 125.4, 0.46), { day: '#4a4560', haze: .04 });
  for (let x = 123.4; x < 125.3; x += 0.18) light(P, rect(x, 0.2, x + 0.09, 0.32), '#ffe0a8', .2);
  for (let x = 99.6; x < 129; x += 0.62) light(P, oval(x, -0.02, 0.022, 0.022), '#ffe3a6', .22);

  // ── 10 a 12. O monumento, desenhado numa escala própria em volta do eixo ──
  const gs0 = Object.values(P.c);
  for (const g of gs0) { g.save(); g.translate(CX, 0); g.scale(MS, MS); g.translate(-CX, 0); }

  // ── 10. Forte em estrela: muralha baixa com facetas ──
  const fx0 = CX - 5.2, fx1 = CX + 5.2, fh = 0.64;
  const forte = rect(fx0, -0.2, fx1, fh);
  put(P, forte, { day: '#988b7d', haze: .03, night: '#7e6a4c', key: .12 });
  const cortes = [0, 0.9, 2.0, 2.9, 4.0, 5.2, 6.4, 7.5, 8.4, 9.5, 10.4];
  P.c.night.save(); P.c.night.clip(forte);
  const gf = P.c.night.createLinearGradient(0, -0.2, 0, fh); gf.addColorStop(0, '#b8975f'); gf.addColorStop(1, '#5a4832');
  P.c.night.fillStyle = gf; P.c.night.fillRect(fx0, -0.2, fx1 - fx0, 1);
  P.c.night.restore();
  for (let i = 0; i < cortes.length - 1; i++) if (i % 2) {
    paint(P, rect(fx0 + cortes[i], -0.2, fx0 + cortes[i + 1], fh), '#827568', forte);
    light(P, rect(fx0 + cortes[i], -0.2, fx0 + cortes[i + 1], fh), 'rgba(0,0,0,.32)', .12, forte);
  }
  paint(P, rect(fx0, fh - 0.07, fx1, fh), '#ab9f91', forte);
  light(P, rect(fx0, fh - 0.07, fx1, fh), '#d2b47e', .12, forte);
  for (let x = fx0 + 0.3; x < fx1; x += 0.55) light(P, oval(x, 0.1, 0.024, 0.03), '#ffe7b0', .14);
  // ── 11. Base em degraus e pedestal de granito ──
  const ped = new Path2D();
  const blocos = [[1.85, 0.64, 1.05], [1.7, 1.05, 1.35], [1.58, 1.35, 1.6], [1.4, 2.6, 2.95], [1.3, 4.85, 5.0], [1.2, 5.0, 5.55], [1.33, 5.55, 5.75], [1.12, 5.75, 6.05], [0.5, 6.05, 6.2]];
  for (const [hw, a, b] of blocos) ped.rect(CX - hw, a, hw * 2, b - a);
  ped.addPath(poly([[CX - 1.5, 1.6], [CX + 1.5, 1.6], [CX + 1.38, 2.6], [CX - 1.38, 2.6]]));
  ped.addPath(poly([[CX - 1.27, 2.95], [CX + 1.27, 2.95], [CX + 1.22, 4.85], [CX - 1.22, 4.85]]));
  put(P, ped, { day: '#b3a491', haze: .02, key: .24 });
  paint(P, rect(CX + 0.55, 0.7, CX + 2, 6.3), '#958676', ped);                             // lado em sombra
  paint(P, poly([[CX - 1.5, 1.6], [CX + 1.5, 1.6], [CX + 1.38, 2.6], [CX - 1.38, 2.6]]), 'rgba(170,158,140,.55)', ped);
  for (const [hw, a] of [[1.85, 1.05], [1.7, 1.35], [1.58, 1.6], [1.4, 2.95], [1.3, 5.0], [1.33, 5.75]]) paint(P, rect(CX - hw, a - 0.035, CX + hw, a), '#8b7c6c', ped);
  paint(P, rect(CX - 0.52, 3.2, CX + 0.52, 4.62), '#9f907f', ped);                         // painel rebaixado
  paint(P, rect(CX - 0.38, 3.32, CX + 0.38, 4.5), '#a99a88', ped);
  for (const ox of [-0.55, 0, 0.55]) paint(P, rect(CX + ox - 0.13, 5.07, CX + ox + 0.13, 5.46), '#4f4553', ped); // as aberturas da loggia
  P.c.night.save(); P.c.night.clip(ped);
  const gp = P.c.night.createLinearGradient(0, 0.78, 0, 6.2); gp.addColorStop(0, '#ecd29e'); gp.addColorStop(0.55, '#c9ac7c'); gp.addColorStop(1, '#a2865f');
  P.c.night.fillStyle = gp; P.c.night.fillRect(CX - 2, 0.7, 4, 5.6);
  P.c.night.fillStyle = 'rgba(40,30,20,.55)'; P.c.night.fillRect(CX + 0.55, 0.7, 1.5, 5.6);
  for (const ox of [-0.55, 0, 0.55]) { P.c.night.fillStyle = '#3a2c22'; P.c.night.fill(rect(CX + ox - 0.13, 5.07, CX + ox + 0.13, 5.46)); }
  P.c.night.fillStyle = 'rgba(70,50,25,.45)';
  for (const [hw, a] of [[1.85, 1.05], [1.7, 1.35], [1.58, 1.6], [1.4, 2.95], [1.3, 5.0], [1.33, 5.75]]) P.c.night.fill(rect(CX - hw, a - 0.035, CX + hw, a));
  P.c.night.fillStyle = 'rgba(80,58,30,.22)'; P.c.night.fill(rect(CX - 0.52, 3.2, CX + 0.52, 4.62));
  P.c.night.fillStyle = 'rgba(255,240,210,.14)'; P.c.night.fill(rect(CX - 0.38, 3.32, CX + 0.38, 4.5));
  P.c.night.restore();

  // ── 12. A Estátua ──
  const corpo = poly([
    [-0.135, 0.0], [-0.128, 0.05], [-0.118, 0.13], [-0.110, 0.24], [-0.108, 0.33], [-0.112, 0.42], [-0.110, 0.50], [-0.104, 0.555],
    [-0.118, 0.585], [-0.128, 0.625], [-0.133, 0.69], [-0.136, 0.75], [-0.135, 0.80], [-0.131, 0.845], [-0.130, 0.868],
    [-0.125, 0.885], [-0.122, 0.905], [-0.150, 0.912], [-0.154, 0.928], [-0.140, 0.936], [-0.094, 0.936], [-0.083, 0.928], [-0.087, 0.912],
    [-0.106, 0.905], [-0.104, 0.885], [-0.100, 0.866], [-0.094, 0.835], [-0.090, 0.78], [-0.086, 0.72], [-0.078, 0.665],
    [-0.060, 0.632], [-0.030, 0.622], [0.030, 0.622], [0.070, 0.606], [0.108, 0.588], [0.122, 0.56], [0.125, 0.50], [0.122, 0.42],
    [0.117, 0.33], [0.115, 0.24], [0.120, 0.14], [0.130, 0.05], [0.140, 0.0], [0.09, -0.004], [0.03, 0.006], [-0.04, -0.002], [-0.09, 0.005]
  ].map(([u, v]) => sU(u, v)));
  const fig = new Path2D(corpo);
  const [hx, hy] = sU(0, 0.672); fig.moveTo(hx + 0.04 * SX, hy); fig.ellipse(hx, hy, 0.04 * SX, 0.05 * S, 0, 0, Math.PI * 2);
  const [cx0, cy0] = sU(0, 0.69);
  for (const a of [-80, -54, -27, 0, 27, 54, 80]) {
    const t = a * D2R, dx = Math.sin(t), dy = Math.cos(t), px = Math.cos(t), py = -Math.sin(t);
    fig.addPath(poly([[cx0 + (dx * 0.04 + px * 0.009) * S, cy0 + (dy * 0.04 + py * 0.009) * S], [cx0 + dx * 0.108 * S, cy0 + dy * 0.108 * S], [cx0 + (dx * 0.04 - px * 0.009) * S, cy0 + (dy * 0.04 - py * 0.009) * S]]));
  }
  const [bx, by] = sU(0, 0.708); fig.moveTo(bx + 0.047 * SX, by); fig.ellipse(bx, by, 0.047 * SX, 0.02 * S, 0, 0, Math.PI * 2);
  const tabua = poly([[0.070, 0.345], [0.150, 0.360], [0.168, 0.53], [0.088, 0.545]].map(([u, v]) => sU(u, v)));
  const mao = new Path2D(); { const [mx, my] = sU(0.078, 0.37); mao.ellipse(mx, my, 0.026 * SX, 0.03 * S, 0, 0, Math.PI * 2); }
  fig.addPath(tabua); fig.addPath(mao);
  put(P, fig, { day: '#6aa596', haze: .02, key: .62 });
  // sombra do lado direito, dobras do manto e o drapeado
  paint(P, poly([[0.015, -0.01], [0.2, -0.01], [0.2, 0.64], [0.03, 0.625], [0.04, 0.4]].map(([u, v]) => sU(u, v))), '#4f8679', fig);
  paint(P, poly([[-0.1, 0.84], [-0.08, 0.84], [-0.075, 0.665], [-0.098, 0.64]].map(([u, v]) => sU(u, v))), '#558c7f', fig);
  const dobras = new Path2D();
  for (const [u0, u1] of [[-0.075, -0.085], [-0.04, -0.05], [-0.005, 0.0], [0.045, 0.055], [0.085, 0.1]]) { const [a, b] = sU(u0, 0.45), [c, d] = sU((u0 + u1) / 2 - 0.01, 0.22), [e, f] = sU(u1, 0.015); dobras.moveTo(a, b); dobras.quadraticCurveTo(c, d, e, f); }
  { const [a, b] = sU(0.105, 0.575), [c, d] = sU(0.0, 0.5), [e, f] = sU(-0.1, 0.47); dobras.moveTo(a, b); dobras.quadraticCurveTo(c, d, e, f); }
  { const [a, b] = sU(0.1, 0.5), [c, d] = sU(0.0, 0.43), [e, f] = sU(-0.1, 0.4); dobras.moveTo(a, b); dobras.quadraticCurveTo(c, d, e, f); }
  paint(P, dobras, '#3e7064', fig, 0.028);
  paint(P, tabua, '#7cb4a5'); paint(P, poly([[0.150, 0.360], [0.168, 0.53], [0.158, 0.532], [0.141, 0.362]].map(([u, v]) => sU(u, v))), '#4d8275');
  paint(P, oval(...sU(0.004, 0.668), 0.026 * SX, 0.034 * S), '#78b2a3', fig);                // o rosto pega mais luz
  // de noite: refletores de baixo deixam a estátua verde-água clara
  P.c.night.save(); P.c.night.clip(fig);
  const gs = P.c.night.createLinearGradient(0, S_Y0, 0, S_Y0 + 0.95 * S); gs.addColorStop(0, '#a6e2cd'); gs.addColorStop(0.6, '#7cc2ac'); gs.addColorStop(1, '#5fa691');
  P.c.night.fillStyle = gs; P.c.night.fillRect(CX - 1.2, S_Y0 - 0.2, 2.4, S + 0.4);
  P.c.night.fillStyle = 'rgba(20,50,45,.32)'; P.c.night.fill(poly([[0.015, -0.01], [0.2, -0.01], [0.2, 0.64], [0.03, 0.625], [0.04, 0.4]].map(([u, v]) => sU(u, v))));
  P.c.night.strokeStyle = 'rgba(25,70,60,.5)'; P.c.night.lineWidth = 0.028; P.c.night.lineCap = 'round'; P.c.night.stroke(dobras);
  P.c.night.fillStyle = 'rgba(220,255,240,.22)'; P.c.night.fill(oval(...sU(0.004, 0.668), 0.026 * SX, 0.034 * S)); P.c.night.fill(tabua);
  P.c.night.restore();
  // a chama da tocha (dourada) — é a última luz a acender
  const chama = poly([[-0.138, 0.94], [-0.137, 0.962], [-0.127, 0.982], [-0.117, 1.0], [-0.106, 0.982], [-0.097, 0.962], [-0.096, 0.94]].map(([u, v]) => sU(u, v)));
  put(P, chama, { day: '#c9ad62', haze: .02, night: '#ffd572', key: .97 });
  paint(P, poly([[-0.12, 0.945], [-0.117, 0.99], [-0.108, 0.96], [-0.106, 0.945]].map(([u, v]) => sU(u, v))), '#e0c77c');
  for (const g of gs0) g.restore();
  return P;
}
