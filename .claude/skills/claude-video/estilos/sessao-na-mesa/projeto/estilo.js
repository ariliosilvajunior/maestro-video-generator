// Estilo modelado "Sessão na mesa": o agente-bloco atrás da mesa, numa sala em aquarela, recebe um pedido
// num avião de papel, reage, dobra a resposta e arremessa de volta. Módulo solto, sem imports.
// Tudo é função pura de t: nada de acaso sem semente, nada de relógio. A sala é pintada uma vez por tamanho.
const LOOP = 5;
const WX = 1920, WY = 1080;

// ---------- utilidades
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  io: (k) => k * k * (3 - 2 * k),
  out3: (k) => 1 - Math.pow(1 - k, 3),
  in2: (k) => k * k,
  out2: (k) => 1 - (1 - k) * (1 - k),
  fold: (k) => (k < 0.5 ? 64 * Math.pow(k, 7) : 1 - Math.pow(-2 * k + 2, 7) / 2),
  back: (k) => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};
const hashI = (i, s) => { let h = Math.imul(i * 374761393 + s * 668265263, 0x5bd1e995); h ^= h >>> 15; h = Math.imul(h, 0x2d2f); h ^= h >>> 13; return ((h >>> 0) % 100000) / 100000; };
const vn = (x, s) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hashI(i, s) * (1 - u) + hashI(i + 1, s) * u - 0.5; };
const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hex = (c) => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || "").trim()); if (!m) return [128, 128, 128]; const h = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1]; const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return "#" + A.map((x, i) => Math.round(lerp(x, B[i], k)).toString(16).padStart(2, "0")).join(""); };
const rgba = (c, a) => { const v = hex(c); return `rgba(${v[0]},${v[1]},${v[2]},${a})`; };
const luz = (c) => { const [r, g, b] = hex(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

// ---------- geometria e pincel (traço de nanquim de largura variável, aguada em camadas)
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const ell = (cx, cy, rx, ry, n = 32, rot = 0) => { const o = [], c = Math.cos(rot), s = Math.sin(rot); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * c - y * s, cy + x * s + y * c]); } return o; };
const rrect = (x, y, w, h, r) => { const o = []; for (const [cx, cy, a0] of [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]]) for (let i = 0; i <= 5; i++) { const a = ((a0 + i * 18) * Math.PI) / 180; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
const through = (pts, n = 12, closed = false) => { const out = [], N = pts.length; const g = (i) => (closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))]); const last = closed ? N : N - 1; for (let i = 0; i < last; i++) { const a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2); for (let j = 0; j < n; j++) { const t = j / n, t2 = t * t, t3 = t2 * t; out.push([0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3), 0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3)]); } } if (!closed) out.push(pts[N - 1]); return out; };
const resample = (pts, step, closed) => { const P = closed ? pts.concat([pts[0]]) : pts, out = []; let carry = 0; for (let i = 0; i < P.length - 1; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1]; const L = Math.hypot(x1 - x0, y1 - y0) || 1e-4; let d = carry; while (d < L) { out.push([x0 + ((x1 - x0) * d) / L, y0 + ((y1 - y0) * d) / L]); d += step; } carry = d - L; } if (!closed) out.push(P[P.length - 1]); return out; };
const path = (c, pts, closed = true) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (closed) c.closePath(); };
const ink = (c, pts, o) => { const { w = 5, color, closed = false, seed = 1, wob = 1.1, taper = !closed, step = 6 } = o; const s = resample(pts, step, closed), n = s.length; if (n < 2) return; const L = [], R = []; for (let i = 0; i < n; i++) { const a = closed ? s[(i - 2 + n) % n] : s[Math.max(0, i - 2)], b = closed ? s[(i + 2) % n] : s[Math.min(n - 1, i + 2)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; const nx = -ty, ny = tx, q = i * step; const d = vn(q * 0.018, seed) * wob * 2; let hw = (w / 2) * (1 + vn(q * 0.022, seed + 5) * 0.42 + vn(q * 0.25, seed + 9) * 0.14); if (taper) hw *= clamp(0.25 + (Math.min(i, n - 1 - i) * step) / (w * 2.4)); const x = s[i][0] + nx * d, y = s[i][1] + ny * d; L.push([x + nx * hw, y + ny * hw]); R.push([x - nx * hw, y - ny * hw]); } c.fillStyle = color; c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (closed) { c.closePath(); R.reverse(); R.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); } else { R.reverse(); R.forEach((p) => c.lineTo(p[0], p[1])); c.closePath(); } c.fill("nonzero"); };
const deform = (pts, amp, r, it = 2) => { let P = pts; for (let k = 0; k < it; k++) { const Q = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); const g = (r() + r() + r() - 1.5) * 0.66, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2 + (r() - 0.5) * 1.1; Q.push(a, [(a[0] + b[0]) / 2 + Math.cos(ang) * g * l * amp, (a[1] + b[1]) / 2 + Math.sin(ang) * g * l * amp]); } P = Q; } return P; };
const blot = (c, pts, color, layers, alpha, seed, amp = 0.5) => { const r = rng(seed); c.fillStyle = rgba(color, alpha); const base = deform(pts, amp, r, 2); for (let i = 0; i < layers; i++) { path(c, deform(base, amp * 0.9, r, 1)); c.fill(); } };
const wash = (c, pts, color, o = {}) => { const { seed = 1, blots = 4, dk = mix(color, o.D || "#2a1f28", 0.35), lt = mix(color, o.L || "#fff6e0", 0.35), edge = 0.16, grad = 0, strength = 1 } = o; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } const W = x1 - x0, H = y1 - y0, r = rng(seed * 991 + 7); c.save(); path(c, pts); c.clip(); c.fillStyle = color; c.fillRect(x0 - 2, y0 - 2, W + 4, H + 4); for (let i = 0; i < blots; i++) { const cx = x0 + r() * W, cy = y0 + r() * H; blot(c, ell(cx, cy, (0.14 + r() * 0.32) * W, (0.14 + r() * 0.32) * H, 7, r() * 3), r() < 0.55 ? dk : lt, 4, 0.03 * strength, seed + i * 13); } if (grad) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, rgba(lt, 0.1 * grad)); g.addColorStop(0.6, rgba(color, 0)); g.addColorStop(1, rgba(dk, 0.28 * grad)); c.fillStyle = g; c.fillRect(x0, y0, W, H); } path(c, pts); c.strokeStyle = rgba(dk, edge * 0.45); c.lineWidth = Math.min(20, Math.min(W, H) * 0.16); c.stroke(); c.lineWidth = Math.min(8, Math.min(W, H) * 0.07); c.strokeStyle = rgba(dk, edge); c.stroke(); c.restore(); };

// ---------- paleta derivada só do tema
const paleta = (th) => {
  const claro = luz(th.bg) >= luz(th.ink) ? th.bg : th.ink;
  const escuro = claro === th.bg ? th.ink : th.bg;
  const L = mix(claro, "#ffffff", 0), D = mix(escuro, "#000000", 0.2);
  const a = th.accent, a2 = th.accent2;
  const madeira = mix(mix(a, a2, 0.22), D, 0.22);
  return {
    L, D, ink: D, body: a, bodyDk: mix(a, D, 0.32), bodyLt: mix(a, L, 0.35),
    wall: mix(L, a, 0.07), wain: mix(a2, L, 0.32), floor: mix(mix(a, L, 0.4), D, 0.18),
    sky: mix(a2, L, 0.5), hill: mix(a2, D, 0.18), sun: mix(L, a, 0.12),
    woodF: madeira, woodT: mix(madeira, L, 0.24), woodDk: mix(madeira, D, 0.35),
    plate: mix(L, a, 0.22), plateDk: mix(madeira, D, 0.5),
    caseC: mix(D, L, 0.2), screen: mix(D, a2, 0.25), check: mix(a2, D, 0.15),
    paper: mix(L, a, 0.03), peach: mix(L, a, 0.24), mug: mix(a, L, 0.18), leaf: mix(a2, D, 0.32),
    lamp: mix(a2, D, 0.5), metal: mix(D, L, 0.16), cork: mix(mix(a, a2, 0.5), L, 0.15), phones: mix(a2, D, 0.4),
  };
};
const fonteDe = (th, px, peso = 700) => `${peso} ${px}px "${th.font || "Marker Felt"}", "Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive`;

// ---------- enquadramento: mundo 1920×1080 que cabe em 16:9, 9:16 e 1:1
const vista = (w, h) => {
  const r = w / h;
  if (r >= 1.4) { const s = Math.max(w / WX, h / WY); return { s, cx: 960, cy: 540 }; }
  if (r >= 0.85) { const s = w / 1240; return { s, cx: 1000, cy: 560 }; }
  const s = w / 880; return { s, cx: 1030, cy: 500, retrato: true };
};
const novoCanvas = (w, h) => { if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h); const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const MON = { out: [[1243, 420], [1562, 366], [1562, 660], [1243, 672]], scr: [[1258, 430], [1547, 382], [1547, 645], [1258, 656]] };

// ---------- a sala, pintada uma vez por tamanho e tema
const pintaSala = (c, P, th, nome) => {
  const m = -900;
  wash(c, rect(-1400, -260, WX + 2800, 900), P.wall, { seed: 3, blots: 14, edge: 0, strength: 0.35, L: P.L, D: P.D });
  wash(c, rect(-1400, 640, WX + 2800, 275), P.wain, { seed: 5, blots: 12, edge: 0, strength: 0.45, grad: 0.4, L: P.L, D: P.D });
  wash(c, rect(-1400, 915, WX + 2800, 1200), P.floor, { seed: 7, blots: 12, edge: 0, strength: 0.5, grad: 0.35, L: P.L, D: P.D });
  ink(c, [[-1400, 640], [WX + 1400, 640]], { w: 5, color: P.ink, seed: 11, taper: false });
  // teto e luminária pendente: só aparecem no vertical
  wash(c, rect(-1400, -900, WX + 2800, 640), mix(P.wall, P.D, 0.06), { seed: 13, blots: 4, edge: 0, strength: 0.3, L: P.L, D: P.D }); ink(c, [[-1400, -260], [WX + 1400, -260]], { w: 6, color: P.ink, seed: 14, taper: false });
  ink(c, [[1000, -260], [1000, -150]], { w: 4, color: P.ink, seed: 15, taper: false }); const ab = [[930, -100], [1070, -100], [1040, -150], [960, -150]]; wash(c, ab, P.wain, { seed: 16, blots: 1, L: P.L, D: P.D }); ink(c, ab, { w: 5, color: P.ink, closed: true, seed: 17 });
  ink(c, [[-1400, 915], [WX + 1400, 915]], { w: 6, color: P.ink, seed: 12, taper: false });
  c.save(); c.globalAlpha = 0.2; blot(c, ell(960, 1046, 830, 34, 24), P.D, 6, 0.1, 9, 0.25); c.restore();
  // janela com céu de dia
  c.save(); path(c, rect(-400, -400, 960, 880)); c.clip(); const g = c.createLinearGradient(0, -200, 0, 480); g.addColorStop(0, mix(P.sky, P.D, 0.08)); g.addColorStop(1, mix(P.sky, P.L, 0.35)); c.fillStyle = g; c.fillRect(-400, -400, 960, 880);
  const H = []; for (let x = -400; x <= 580; x += 20) H.push([x, 392 + Math.pow((x - 120) / 460, 2) * 58 + vn(x * 0.01, 1511) * 8]); H.push([580, 500], [-400, 500]); path(c, H); c.fillStyle = P.hill; c.fill(); ink(c, H.slice(0, -2), { w: 3, color: rgba(P.D, 0.5), seed: 1512, taper: false });
  c.fillStyle = rgba(P.L, 0.7); c.beginPath(); c.ellipse(110, 58, 118, 26, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(380, 250, 92, 20, 0, 0, 7); c.fill();
  const S = ell(420, 110, 56, 56, 28); path(c, S); c.fillStyle = P.sun; c.fill(); ink(c, S, { w: 5, color: P.ink, closed: true, seed: 1501 });
  c.restore();
  const fc = mix(P.wall, P.L, 0.3);
  const sh = (pts, col, o = {}) => { wash(c, pts, col, { L: P.L, D: P.D, ...o }); if (o.line !== false) ink(c, pts, { w: o.w || 5, color: P.ink, closed: true, seed: (o.seed || 1) + 41 }); };
  sh(rect(240, -400, 26, 880), fc, { seed: 101, blots: 1 }); sh(rect(-400, 176, 960, 22), fc, { seed: 102, blots: 1 }); sh(rect(545, -400, 28, 880), fc, { seed: 103, blots: 1 }); sh(rect(-400, 474, 982, 36), fc, { seed: 104, blots: 1, grad: 0.9 });
  // vaso e flores
  [[[438, 385], [410, 330], [392, 285]], [[445, 385], [450, 320], [452, 248]], [[455, 385], [478, 335], [497, 290]]].forEach((s, i) => ink(c, through(s, 8), { w: 8, color: P.leaf, seed: 40 + i, wob: 0.7 }));
  [[392, 280, 24], [452, 246, 25], [499, 289, 25]].forEach(([x, y, r], i) => sh(ell(x, y, r, r * 0.88, 16), mix(P.body, P.D, 0.1), { seed: 80 + i, w: 4.5, blots: 1 }));
  const v = [[398, 382], [480, 382], [486, 476], [394, 476]]; wash(c, v, mix(P.sky, P.L, 0.4), { seed: 21, blots: 2, edge: 0.3, L: P.L, D: P.D }); ink(c, v, { w: 4.5, color: P.ink, closed: true, seed: 22 });
  // planta de chão, à esquerda
  const vaso = [[110, 800], [300, 800], [280, 930], [130, 930]]; sh(vaso, mix(P.body, P.D, 0.25), { seed: 60, w: 6, blots: 3, grad: 0.8 });
  const folhas = [[200, 800, 120, 560, -0.5], [210, 800, 260, 520, 0.4], [205, 800, 40, 650, -0.9], [205, 800, 330, 640, 0.9], [205, 800, 190, 470, 0], [205, 800, 90, 700, -1.2]];
  folhas.forEach(([x0, y0, x1, y1], i) => { ink(c, through([[x0, y0], [(x0 + x1) / 2 + 10, (y0 + y1) / 2], [x1, y1]], 6), { w: 7, color: P.leaf, seed: 61 + i, wob: 0.5 }); const a = Math.atan2(y1 - y0, x1 - x0); const L2 = ell(x1 + Math.cos(a) * 30, y1 + Math.sin(a) * 30, 62, 30, 18, a); sh(L2, mix(P.leaf, P.L, 0.25), { seed: 70 + i, w: 4, blots: 2 }); });
  // cortiça com três cartões
  sh(rect(596, 20, 354, 250), P.woodDk, { seed: 111, w: 6, blots: 2 }); sh(rect(611, 34, 324, 222), P.cork, { seed: 112, w: 3, blots: 6, edge: 0.3 });
  const rr = rng(113); for (let i = 0; i < 40; i++) { c.fillStyle = rgba(P.D, 0.35); c.beginPath(); c.ellipse(615 + rr() * 316, 38 + rr() * 214, 2, 1.6, 0, 0, 7); c.fill(); }
  const card = (x, y, w, h, r, cols, pin, seed) => { c.save(); c.translate(x, y); c.rotate(r); c.fillStyle = rgba(P.D, 0.22); c.fillRect(-w / 2 + 4, -h / 2 + 5, w, h); sh(rect(-w / 2, -h / 2, w, h), P.paper, { seed, w: 3.5, blots: 0 }); cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(-w / 2 + 10, -h / 2 + 12 + i * ((h - 24) / cols.length), w - 20, (h - 24) / cols.length - 4); }); sh(ell(0, -h / 2 + 2, 8, 8, 10), pin, { seed: seed + 3, w: 2.5, blots: 0 }); c.restore(); };
  card(686, 100, 112, 90, -0.06, [P.sky, P.hill], P.body, 120); card(838, 108, 110, 92, 0.07, [P.body, P.bodyLt, P.wain], P.wain, 124); card(770, 202, 118, 86, 0.03, [mix(P.body, P.D, 0.1), mix(P.body, P.wain, 0.5), P.wain], P.L, 128);
  // quadro com a curva
  sh(rect(1190, 6, 296, 228), P.metal, { seed: 131, w: 6, blots: 1 }); sh(rect(1206, 22, 264, 196), P.paper, { seed: 132, w: 2.5, blots: 1, edge: 0.08 });
  c.strokeStyle = rgba(P.D, 0.25); c.lineWidth = 1.4; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(1206 + i * 44, 26); c.lineTo(1206 + i * 44, 214); c.stroke(); }
  const crv = []; for (let i = 0; i <= 30; i++) { const k = i / 30, e = k * k * k * (k * (6 * k - 15) + 10); crv.push([1230 + 212 * k, 190 - 142 * e]); } ink(c, crv, { w: 15, color: mix(P.body, P.D, 0.2), seed: 136, taper: false, wob: 0.8 });
  // prateleira com livros e claquete
  sh(rect(1596, 172, 600, 26), P.woodF, { seed: 141, w: 5.5, blots: 1, grad: 0.8 });
  sh(rect(1622, 94, 88, 78), P.metal, { seed: 145, w: 5, blots: 1 }); c.save(); c.translate(1622, 92); c.rotate(-0.16); sh(rect(0, -22, 88, 20), P.paper, { seed: 146, w: 4, blots: 0 }); c.fillStyle = P.ink; for (let i = 0; i < 5; i++) { path(c, [[3 + i * 18, -21], [12 + i * 18, -21], [6 + i * 18, -3], [-3 + i * 18, -3]]); c.fill(); } c.restore();
  [[1714, 82, 30, P.wain], [1745, 74, 28, P.body], [1774, 88, 28, P.bodyLt], [1803, 96, 22, P.hill], [1826, 70, 26, P.cork]].forEach(([x, h0, w, col], i) => sh(rect(x, 172 - h0, w, h0), col, { seed: 150 + i, w: 4, blots: 1, grad: 0.7 }));
  // quadro com o nome
  sh(rect(1650, 346, 250, 254), P.woodDk, { seed: 161, w: 6.5, blots: 2 }); sh(rect(1668, 364, 214, 218), P.paper, { seed: 162, w: 3, blots: 1, edge: 0.06 });
  const ini = (nome || "M").trim().charAt(0).toUpperCase(); c.fillStyle = P.body; c.font = fonteDe(th, 150, 800); c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(ini, 1775, 450);
  const nfs = Math.min(30, 190 / Math.max(1, nome.length * 0.62)); c.font = fonteDe(th, nfs, 700); c.fillStyle = P.ink; c.fillText(nome.toUpperCase(), 1775, 548);
};
const pintaMeio = (c, P) => {
  ink(c, through([[612, 712], [575, 640], [576, 540], [664, 444]], 12), { w: 18, color: P.metal, seed: 201, wob: 0.5, taper: false }); ink(c, [[664, 444], [716, 492]], { w: 15, color: P.metal, seed: 202, taper: false });
  c.save(); c.translate(710, 510); c.rotate(0.42); const mic = rrect(-26, -44, 52, 88, 24); wash(c, mic, mix(P.metal, P.L, 0.1), { seed: 204, blots: 1, L: P.L, D: P.D }); ink(c, mic, { w: 5, color: P.ink, closed: true, seed: 205 }); c.restore();
  const ped = ell(1622, 726, 60, 12, 24); wash(c, ped, P.lamp, { seed: 211, blots: 0, L: P.L, D: P.D }); ink(c, ped, { w: 4.5, color: P.ink, closed: true, seed: 212 });
  ink(c, through([[1622, 722], [1645, 620], [1660, 524]], 8), { w: 25, color: P.lamp, seed: 213, wob: 0.5, taper: false }); ink(c, [[1660, 524], [1568, 450]], { w: 20, color: P.lamp, seed: 214, taper: false });
  const pe = rect(1385, 655, 38, 60); wash(c, pe, P.caseC, { seed: 221, blots: 0, grad: 0.9, L: P.L, D: P.D }); ink(c, pe, { w: 4, color: P.ink, closed: true, seed: 222 });
  const base = ell(1402, 726, 76, 13, 26); wash(c, base, P.caseC, { seed: 223, blots: 0, L: P.L, D: P.D }); ink(c, base, { w: 4.5, color: P.ink, closed: true, seed: 224 });
  wash(c, MON.out, P.caseC, { seed: 225, blots: 1, L: P.L, D: P.D }); ink(c, MON.out, { w: 6, color: P.ink, closed: true, seed: 226 });
  c.globalCompositeOperation = "destination-out"; path(c, MON.scr); c.fillStyle = "#000"; c.fill(); c.globalCompositeOperation = "source-over"; ink(c, MON.scr, { w: 3.5, color: P.ink, closed: true, seed: 227 });
};
const pintaMesa = (c, P, th, nome) => {
  const sh = (pts, col, o = {}) => { wash(c, pts, col, { L: P.L, D: P.D, ...o }); if (o.line !== false) ink(c, pts, { w: o.w || 5, color: P.ink, closed: true, seed: (o.seed || 1) + 41 }); };
  sh([[322, 712], [1600, 712], [1648, 772], [272, 772]], P.woodT, { seed: 301, w: 6, blots: 6 });
  const fr = [[284, 772], [1640, 772], [1640, 1030], [286, 1030]]; sh(fr, P.woodF, { seed: 302, w: 6.5, blots: 12, grad: 0.9 });
  c.save(); path(c, fr); c.clip(); c.fillStyle = rgba(P.woodDk, 0.35); c.fillRect(290, 790, 1340, 36); const r = rng(304); for (let i = 0; i < 22; i++) { const y = 840 + r() * 185, x = 290 + r() * 1100; c.strokeStyle = rgba(P.woodDk, 0.08 + r() * 0.1); c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 90, y - 5, x + 180, y + 6, x + 240 + r() * 140, y + r() * 3); c.stroke(); } c.restore();
  [[300, 1030], [1600, 1030]].forEach((p, i) => sh(rect(p[0] - 14, p[1], 30, 34), P.woodDk, { seed: 305 + i, w: 4.5, blots: 0 }));
  [[350, 850], [1415, 850]].forEach((p, i) => { sh(rect(p[0], p[1], 156, 118), mix(P.woodF, P.L, 0.12), { seed: 307 + i, w: 4, blots: 3 }); sh(ell(p[0] + 78, p[1] + 60, 13, 7, 14), P.plate, { seed: 309 + i, w: 3, blots: 0 }); });
  sh(rrect(622, 858, 678, 104, 8), mix(P.plate, P.woodDk, 0.25), { seed: 311, w: 6.5, blots: 2, grad: 1 }); sh(rrect(636, 870, 650, 80, 5), P.plate, { seed: 312, w: 2.4, blots: 3, grad: 0.7, edge: 0.3 });
  const txt = nome.length > 26 ? nome.slice(0, 26) : nome; let fs = 50; c.font = fonteDe(th, fs, 700); const mw = c.measureText(txt).width; if (mw > 600) fs *= 600 / mw; c.font = fonteDe(th, fs, 700); c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = rgba(P.L, 0.7); c.fillText(txt, 961, 913); c.fillStyle = P.plateDk; c.fillText(txt, 960, 911);
  sh([[358, 690], [460, 690], [474, 722], [340, 722]], P.metal, { seed: 321, w: 4.5, blots: 0 }); for (let i = 0; i < 4; i++) sh(rect(352 + (i % 2) * 3, 666 + i * 6, 112, 7), i % 2 ? P.paper : mix(P.paper, P.D, 0.06), { seed: 322 + i, w: 2.4, blots: 0 });
  sh([[654, 724], [734, 724], [740, 752], [646, 752]], P.peach, { seed: 327, w: 3, blots: 0 });
  // grão de papel por cima de tudo que é fixo
};
const corpoDe = (P, s) => { const U = 45.5, m = 40, W = 10 * U + 2 * m, H = 7.4 * U + 2 * m; const cv = novoCanvas(Math.ceil(W * s), Math.ceil(H * s)); const c = cv.getContext("2d"); c.scale(s, s); c.translate(m + 5 * U, m); const Q = rect(-5 * U, 0, 10 * U, 7.4 * U); wash(c, Q, P.body, { seed: 501, blots: 10, dk: P.bodyDk, lt: P.bodyLt, edge: 0.18, grad: 0.5, strength: 1.1 }); c.save(); path(c, Q); c.clip(); c.fillStyle = rgba(P.bodyDk, 0.3); c.fillRect(-5 * U, 4.25 * U, 10 * U, 3.2 * U); c.restore(); ink(c, [[-5 * U, 0], [5 * U, 0]], { w: 15, color: P.ink, seed: 541, taper: false, wob: 1 }); ink(c, [[-5 * U, 0], [-5 * U, 7.4 * U]], { w: 9, color: P.ink, seed: 542, taper: false, wob: 1 }); ink(c, [[5 * U, 0], [5 * U, 7.4 * U]], { w: 9, color: P.ink, seed: 543, taper: false, wob: 1 }); return { cv, m, W, H }; };
const graoDe = (w, h, P) => { const gw = Math.ceil(w / 3), gh = Math.ceil(h / 3); const cv = novoCanvas(gw, gh); const c = cv.getContext("2d"); const img = c.createImageData(gw, gh); const [r0, g0, b0] = hex(P.D); for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { const n = vn(x * 0.21 + y * 1.7, 3) * 0.6 + vn(x * 0.9 + y * 0.37, 9) * 0.4 + vn(y * 0.05 + x * 0.013, 17) * 0.8; const i = (y * gw + x) * 4; img.data[i] = r0; img.data[i + 1] = g0; img.data[i + 2] = b0; img.data[i + 3] = Math.max(0, Math.min(255, 14 + n * 40)); } c.putImageData(img, 0, 0); return cv; };
const CACHE = new Map();
const preparar = (w, h, th, nome) => {
  const chave = [w, h, th.bg, th.ink, th.accent, th.accent2, th.font, nome].join("|");
  if (CACHE.has(chave)) return CACHE.get(chave);
  const P = paleta(th), V = vista(w, h);
  const camada = (fn) => { const cv = novoCanvas(w, h); const c = cv.getContext("2d"); c.lineJoin = "round"; c.setTransform(V.s, 0, 0, V.s, w / 2 - V.cx * V.s, h / 2 - V.cy * V.s); fn(c); return cv; };
  const R = { P, V, sala: camada((c) => pintaSala(c, P, th, nome)), meio: camada((c) => pintaMeio(c, P)), mesa: camada((c) => pintaMesa(c, P, th, nome)), corpo: corpoDe(P, V.s * 1.25), grao: graoDe(w, h, P), tex: new Map() };
  if (CACHE.size > 12) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(chave, R);
  return R;
};

// ---------- papel: um modelo só para folha, dobra e avião (vincos rígidos girando em 3D)
const SW = 300, SH = 380;
const rodr = (p, o, d, a) => { const c = Math.cos(a), s = Math.sin(a); const v = [p[0] - o[0], p[1] - o[1], p[2]]; const dv = d[0] * v[0] + d[1] * v[1]; const cr = [d[1] * v[2], -d[0] * v[2], d[0] * v[1] - d[1] * v[0]]; return [o[0] + v[0] * c + cr[0] * s + d[0] * dv * (1 - c), o[1] + v[1] * c + cr[1] * s + d[1] * dv * (1 - c), v[2] * c + cr[2] * s]; };
const unit = (a, b) => { const x = b[0] - a[0], y = b[1] - a[1], l = Math.hypot(x, y); return [x / l, y / l]; };
const reflect = (p, a, b) => { const d = unit(a, b); const t = (p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]; const q = [a[0] + d[0] * t, a[1] + d[1] * t]; return [2 * q[0] - p[0], 2 * q[1] - p[1]]; };
const clipLine = (Pp, a, b, side) => { const O = []; const f = (p) => ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) * side; for (let i = 0; i < Pp.length; i++) { const p = Pp[i], q = Pp[(i + 1) % Pp.length], fp = f(p), fq = f(q); if (fp >= -1e-6) O.push(p); if (fp * fq < -1e-9) { const k = fp / (fp - fq); O.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]); } } return O; };
const NO = [0, -SH / 2], A = [-SW / 2, -SH / 2 + SW / 2], B = [SW / 2, -SH / 2 + SW / 2], WL = [-SW * 0.17, SH / 2], WR = [SW * 0.17, SH / 2], D0 = [0, SH / 2];
const PECAS = (() => { const out = []; const regs = [{ uv: [[-SW / 2, -SH / 2], NO, A], flap: -1 }, { uv: [NO, [SW / 2, -SH / 2], B], flap: 1 }, { uv: [NO, B, [SW / 2, SH / 2], [-SW / 2, SH / 2], A], flap: 0 }]; for (const R of regs) { const toF = (p) => (R.flap === -1 ? reflect(p, NO, A) : R.flap === 1 ? reflect(p, NO, B) : p); const F = R.uv.map(toF); for (const side of [-1, 1]) { const half = clipLine(F, NO, D0, side === -1 ? 1 : -1); if (half.length < 3) continue; const cr = side < 0 ? WL : WR; for (const wing of [false, true]) { const poly = clipLine(half, NO, cr, (side < 0 ? 1 : -1) * (wing ? 1 : -1)); if (poly.length < 3) continue; let ar = 0; poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; ar += p[0] * q[1] - q[0] * p[1]; }); if (Math.abs(ar) < 4) continue; out.push({ flap: R.flap, side, wing, uv: poly.map(toF) }); } } } return out; })();
const AX = { "-1": unit(NO, A), 1: unit(NO, B) }, WAX = { "-1": unit(NO, WL), 1: unit(NO, WR) };
const foldK = (k) => [E.fold(seg(k, 0, 0.3)), E.fold(seg(k, 0.22, 0.52)), E.fold(seg(k, 0.46, 0.76)), E.fold(seg(k, 0.68, 1))];
const FULL = [1, 1, 1, 1];
const texFolha = (R, th, linhas, tipo) => { const k = tipo + linhas.join("/"); if (R.tex.has(k)) return R.tex.get(k); const S = 2, cv = novoCanvas(SW * S, SH * S), c = cv.getContext("2d"), P = R.P; c.scale(S, S); c.fillStyle = tipo === "r" ? P.peach : P.paper; c.fillRect(0, 0, SW, SH); blot(c, ell(SW * 0.4, SH * 0.3, SW * 0.4, SH * 0.25, 9), mix(P.paper, P.D, 0.12), 4, 0.05, 901);
  if (tipo === "p") { c.strokeStyle = rgba(P.D, 0.25); c.lineWidth = 1.5; for (const [a, b] of [[NO, A], [NO, B], [NO, D0], [NO, WL], [NO, WR]]) { c.beginPath(); c.moveTo(a[0] + SW / 2, a[1] + SH / 2); c.lineTo(b[0] + SW / 2, b[1] + SH / 2); c.stroke(); } let fs = 64; c.font = fonteDe(th, fs, 800); const mw = Math.max(...linhas.map((l) => c.measureText(l).width)); if (mw > SW * 0.84) fs *= (SW * 0.84) / mw; const lh = fs * 1.1, y0 = SH * 0.6 - ((linhas.length - 1) * lh) / 2; c.font = fonteDe(th, fs, 800); c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = P.ink; linhas.forEach((l, i) => c.fillText(l, SW / 2, y0 + i * lh)); }
  else { for (let i = 0; i < 3; i++) ink(c, through([[64, 236 + i * 40], [130, 231 + i * 40], [196, 239 + i * 40], [SW - 64 - (i % 2) * 70, 233 + i * 40]], 6), { w: 7, color: mix(P.body, P.D, 0.35), seed: 930 + i, wob: 0.5 }); }
  R.tex.set(k, cv); return cv; };
const papel = (c, st, P) => { const f = st.f; const flat = f[0] + f[1] + f[2] + f[3] < 0.001, col = st.back || P.paper; const cH = Math.cos(st.heading || 0), sH = Math.sin(st.heading || 0), cr = Math.cos(st.roll || 0), sr = Math.sin(st.roll || 0), cp = Math.cos(st.pitch || 0), sp = Math.sin(st.pitch || 0), s = st.s;
  const world = (v) => { let x = v[0] * cr + v[2] * sr, y = v[1], z = -v[0] * sr + v[2] * cr; const y2 = y * cp - z * sp, z2 = y * sp + z * cp; return [st.x + (x * cH - y2 * sH) * s, st.y + (x * sH + y2 * cH) * s, z2 * s]; };
  if (flat) { const q = [[-SW / 2, -SH / 2], [SW / 2, -SH / 2], [SW / 2, SH / 2], [-SW / 2, SH / 2]].map((p) => world([p[0], p[1], 0])); c.save(); c.transform((q[1][0] - q[0][0]) / SW, (q[1][1] - q[0][1]) / SW, (q[3][0] - q[0][0]) / SH, (q[3][1] - q[0][1]) / SH, q[0][0], q[0][1]); c.drawImage(st.tex, 0, 0, SW, SH); c.restore(); ink(c, q, { w: 3.6 * Math.max(0.6, s), color: P.ink, closed: true, seed: 950 }); return; }
  const th1 = Math.PI * f[0], th2 = Math.PI * f[1], th3 = 1.02 * f[2], th4 = 1.12 * f[3];
  const L = PECAS.map((p) => { const v3 = p.uv.map((q) => { let v = [q[0], q[1], 0]; if (p.flap) { v = rodr(v, NO, AX[p.flap], (p.flap < 0 ? 1 : -1) * (p.flap < 0 ? th1 : th2)); v[2] += 0.6; } if (p.wing) v = rodr(v, NO, WAX[p.side], (p.side < 0 ? 1 : -1) * th4); const ang = p.side < 0 ? th3 : -th3, cc = Math.cos(ang), ss = Math.sin(ang); return world([v[0] * cc + v[2] * ss, v[1], -v[0] * ss + v[2] * cc]); }); let z = 0; v3.forEach((v) => (z += v[2])); return { p, v3, z: z / v3.length + (p.flap ? 0.8 : 0) }; });
  L.sort((a, b) => a.z - b.z); c.lineJoin = "round";
  for (const { p, v3 } of L) { const a = v3[0], b = v3[1], d = v3[2]; const nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]); const nl = Math.hypot((b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), nz) || 1; let area = 0, au = 0; v3.forEach((q, i) => { const r = v3[(i + 1) % v3.length]; area += q[0] * r[1] - r[0] * q[1]; const u1 = p.uv[i], u2 = p.uv[(i + 1) % v3.length]; au += u1[0] * u2[1] - u2[0] * u1[1]; }); path(c, v3); c.fillStyle = col; c.fill();
    if (area * au > 0 && f[2] < 0.5) { c.save(); c.clip(); const [u0, u1, u2] = p.uv; const det = (u1[0] - u0[0]) * (u2[1] - u0[1]) - (u2[0] - u0[0]) * (u1[1] - u0[1]); const m11 = ((b[0] - a[0]) * (u2[1] - u0[1]) - (d[0] - a[0]) * (u1[1] - u0[1])) / det, m12 = ((d[0] - a[0]) * (u1[0] - u0[0]) - (b[0] - a[0]) * (u2[0] - u0[0])) / det, m21 = ((b[1] - a[1]) * (u2[1] - u0[1]) - (d[1] - a[1]) * (u1[1] - u0[1])) / det, m22 = ((d[1] - a[1]) * (u1[0] - u0[0]) - (b[1] - a[1]) * (u2[0] - u0[0])) / det; c.transform(m11, m21, m12, m22, a[0] - m11 * u0[0] - m12 * u0[1], a[1] - m21 * u0[0] - m22 * u0[1]); c.globalAlpha = 1 - Math.max(seg(f[2], 0.05, 0.5), seg(f[0], 0.35, 0.95)); c.drawImage(st.tex, -SW / 2, -SH / 2, SW, SH); c.restore(); }
    const shade = clamp(0.72 + 0.28 * Math.abs(nz / nl)); path(c, v3); if (shade < 0.995) { c.fillStyle = rgba(P.D, (1 - shade) * 0.6); c.fill(); } c.strokeStyle = P.ink; c.lineWidth = 2.8 * Math.max(0.55, s); c.stroke(); } };

// ---------- personagem, rosto, objetos vivos
const U = 45.5;
const olho = (c, kind, side, P, look) => { const x = side * 2.45 * U + look * 9, y = 1.75 * U; c.save(); c.translate(x, y); c.fillStyle = P.ink;
  if (kind === "rect") { c.fillRect(-21, -42, 42, 86); c.fillStyle = P.L; c.beginPath(); c.ellipse(-3, -24, 7.5, 10, 0, 0, 7); c.fill(); }
  else if (kind === "alegre") ink(c, through([[-34, 14], [-14, -14], [0, -24], [14, -14], [34, 14]], 5), { w: 17, color: P.ink, seed: 700 + side, wob: 0.4, taper: false });
  else if (kind === "fecha") ink(c, through([[-34, -8], [-14, 10], [14, 10], [34, -8]], 6), { w: 11, color: P.ink, seed: 710 + side, wob: 0.4 });
  else if (kind === "fofo") { c.beginPath(); c.ellipse(0, 0, 38, 42, 0, 0, 7); c.fill(); c.fillStyle = P.L; c.beginPath(); c.ellipse(-12, -15, 13, 15, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(13, 13, 6, 7, 0, 0, 7); c.fill(); }
  else if (kind === "susto") { c.beginPath(); c.ellipse(0, 0, 24, 30, 0, 0, 7); c.fill(); c.fillStyle = P.L; c.beginPath(); c.ellipse(-6, -11, 8, 10, 0, 0, 7); c.fill(); }
  else if (kind === "foco") { c.fillRect(-19, -16, 38, 48); c.fillStyle = P.L; c.beginPath(); c.ellipse(-2, -2, 6, 8, 0, 0, 7); c.fill(); ink(c, side < 0 ? [[-34, -34], [32, -18]] : [[-32, -18], [34, -34]], { w: 11, color: P.ink, seed: 720 + side, wob: 0.3 }); }
  c.restore(); };
const boca = (c, kind, P, look) => { c.save(); c.translate(look * 6, 3.55 * U); c.fillStyle = P.ink;
  if (kind === "o") { c.beginPath(); c.ellipse(0, 0, 16, 20, 0, 0, 7); c.fill(); }
  else if (kind === "sorri") ink(c, through([[-24, -4], [-8, 8], [8, 8], [24, -4]], 6), { w: 8, color: P.ink, seed: 790, wob: 0.3 });
  else if (kind === "abre") { path(c, [[-34, -14], [34, -14], [26, 12], [12, 22], [-12, 22], [-26, 12]]); c.fill(); c.fillStyle = P.bodyDk; path(c, [[-14, 18], [14, 18], [12, 10], [-12, 10]]); c.fill(); }
  else if (kind === "linha") ink(c, [[-15, -2], [14, 2]], { w: 7, color: P.ink, seed: 791, wob: 0.3 });
  c.restore(); };
const braco = (c, px, py, ang, len, P) => { c.save(); c.translate(px, py); c.rotate(ang); const Q = rect(0, -19, len, 38); path(c, Q); c.fillStyle = P.body; c.fill(); c.fillStyle = rgba(P.bodyDk, 0.4); c.fillRect(0, 2, len, 17); ink(c, Q, { w: 7, color: P.ink, closed: true, seed: 811, wob: 0.4, step: 5 }); c.restore(); };
const personagem = (c, o, R) => { const P = R.P, C = R.corpo; const x = 960 + o.dx, y = 462 + o.dy, base = 735, sy = 1 - o.sq, sx = 1 + o.sq * 0.55; c.save(); c.translate(x, base); c.rotate(o.rot); c.scale(sx, sy); c.translate(0, y - base);
  braco(c, -4.7 * U, o.aLy, o.aL, o.aLen, P); braco(c, 4.7 * U, 4.6 * U, o.aR, 2.5 * U, P);
  c.drawImage(C.cv, -5 * U - C.m, -C.m, C.W, C.H); olho(c, o.olhos, -1, P, o.look); olho(c, o.olhos, 1, P, o.look); boca(c, o.boca, P, o.look); c.restore(); };
const faisca = (c, x, y, r, P) => { if (r <= 0.5) return; const Q = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283 - 1.57, rr = i % 2 ? r * 0.3 : r; Q.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } path(c, Q); c.fillStyle = P.L; c.fill(); ink(c, Q, { w: Math.max(2.5, r * 0.1), color: P.ink, closed: true, seed: 1301, wob: 0.3, step: 4 }); };
const lampada = (c, x, y, k, P) => { if (k <= 0.01) return; c.save(); c.translate(x, y); c.scale(k, k); const g = c.createRadialGradient(0, 0, 8, 0, 0, 130); g.addColorStop(0, rgba(mix(P.L, P.body, 0.15), 0.75)); g.addColorStop(1, rgba(P.L, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 130, 0, 7); c.fill(); for (let i = 0; i < 9; i++) { const a = -2.9 + i * 0.34; ink(c, [[Math.cos(a) * 52, Math.sin(a) * 52], [Math.cos(a) * 80, Math.sin(a) * 80]], { w: 6, color: mix(P.body, P.D, 0.1), seed: 1331 + i, wob: 0.2 }); } const Q = ell(0, -4, 36, 36, 22); path(c, Q); c.fillStyle = mix(P.L, P.body, 0.25); c.fill(); ink(c, Q, { w: 5, color: P.ink, closed: true, seed: 1341, wob: 0.3, step: 4 }); const S = rect(-15, 30, 30, 22); path(c, S); c.fillStyle = P.metal; c.fill(); ink(c, S, { w: 4, color: P.ink, closed: true, seed: 1342, wob: 0.2, step: 3 }); c.restore(); };
const linhasCodigo = [[0.23, 0], [0.52, 1], [0.36, 2], [0.6, 3], [0.32, 1], [0.45, 0]];
const tela = (c, modo, t, P) => { const [a, b, , d] = MON.scr; const W = 289, H = 240; c.save(); path(c, MON.scr); c.clip(); c.transform((b[0] - a[0]) / W, (b[1] - a[1]) / W, (d[0] - a[0]) / H, (d[1] - a[1]) / H, a[0], a[1]);
  if (modo === "check") { c.fillStyle = P.check; c.fillRect(-10, -60, W + 20, H + 120); c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = rgba(P.L, 0.3); c.lineWidth = 38; c.beginPath(); c.moveTo(90, 128); c.lineTo(130, 170); c.lineTo(208, 66); c.stroke(); c.strokeStyle = P.L; c.lineWidth = 27; c.stroke(); c.lineCap = "butt"; }
  else { c.fillStyle = P.screen; c.fillRect(-10, -60, W + 20, H + 120); const cols = [P.body, P.wain, P.bodyLt, P.L]; const n = modo.n; for (let i = 0; i < 6; i++) { if (i >= n) break; const [L, ci] = linhasCodigo[i]; c.fillStyle = cols[ci]; c.fillRect(30 + (i % 3) * 10, 44 + i * 22, 240 * L * (i === n - 1 ? modo.frac : 1), 8); } }
  const g = c.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, 210); g.addColorStop(0, rgba(P.L, 0.07)); g.addColorStop(1, rgba(P.D, 0.3)); c.fillStyle = g; c.fillRect(-10, -60, W + 20, H + 120); c.restore(); };
const teclado = (c, P, tecla) => { const Q = [[752, 726], [1170, 726], [1186, 758], [738, 758]]; path(c, Q); c.fillStyle = mix(P.L, P.D, 0.15); c.fill(); ink(c, Q, { w: 3.6, color: P.ink, closed: true, seed: 1201, wob: 0.4 }); for (let r = 0; r < 2; r++) for (let i = 0; i < 18; i++) { const lit = tecla >= 0 && (hashI(tecla, r * 31 + i) > 0.9); c.fillStyle = lit ? P.L : mix(P.L, P.D, 0.38); c.fillRect(762 - r * 4 + i * 22.2 + (r * 2 - 1) * 3, 731 + r * 12, 16, 8); } };
const caneca = (c, P, t) => { c.save(); c.translate(518, 720); ink(c, through(ell(42, -38, 20, 20, 9), 4, true), { w: 5.5, color: P.ink, closed: true, seed: 1211, wob: 0.4 }); const Q = rrect(-40, -72, 80, 74, 7); path(c, Q); c.fillStyle = P.mug; c.fill(); c.fillStyle = rgba(P.bodyDk, 0.3); c.fillRect(-34, -24, 68, 24); ink(c, Q, { w: 5, color: P.ink, closed: true, seed: 1212, wob: 0.4 }); c.restore(); for (let i = 0; i < 3; i++) { const Q2 = []; for (let k = 0; k <= 9; k++) Q2.push([498 + i * 21 + Math.sin(k * 0.8 + i + (t / LOOP) * 6.283 * 2) * 5, 640 - k * 6.2]); ink(c, Q2, { w: 2, color: rgba(P.D, 0.45), seed: 1221 + i, wob: 0.2, step: 4 }); } };
const fones = (c, P, ang) => { c.save(); c.translate(1622, 200); c.rotate(ang); ink(c, through([[-44, 112], [-48, 50], [-28, 18], [0, 8], [28, 18], [48, 50], [44, 112]], 6), { w: 15, color: P.metal, seed: 1232, wob: 0.4, taper: false }); [[-44, 136], [44, 136]].forEach(([x, y], i) => { const Q = rrect(x - 21, y - 36, 42, 72, 19); path(c, Q); c.fillStyle = P.phones; c.fill(); ink(c, Q, { w: 5, color: P.ink, closed: true, seed: 1233 + i, wob: 0.4 }); }); c.restore(); };

// ---------- roteiro do loop (s): o pedido chega, é lido, a resposta é dobrada e arremessada
const BEAT = { voo: [0.05, 1.7], pega: 1.84, abre: [1.84, 2.3], ideia: 2.36, guarda: [2.72, 2.98], digita: [2.95, 3.3], sobe: [3.3, 3.5], dobra: [3.55, 4.22], arma: 4.25, solta: 4.45, fora: 4.95 };
const tr = (t, keys) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], (E[b[2] || "io"])((t - a[0]) / (b[0] - a[0]))); } return keys[keys.length - 1][1]; };
const VOO = through([[-260, 70], [260, 60], [700, 120], [1100, 210], [1250, 360], [1110, 530], [880, 650], [672, 722], [612, 738]], 18);
const tabela = (Pp) => { const A2 = [0]; for (let i = 1; i < Pp.length; i++) A2.push(A2[i - 1] + Math.hypot(Pp[i][0] - Pp[i - 1][0], Pp[i][1] - Pp[i - 1][1])); return A2; };
const TV = tabela(VOO);
const naCurva = (Pp, TB, k) => { const L = TB[TB.length - 1] * clamp(k); let i = 1; while (i < TB.length - 1 && TB[i] < L) i++; const q = (L - TB[i - 1]) / (TB[i] - TB[i - 1] || 1); return { x: lerp(Pp[i - 1][0], Pp[i][0], q), y: lerp(Pp[i - 1][1], Pp[i][1], q), dx: Pp[i][0] - Pp[i - 1][0], dy: Pp[i][1] - Pp[i - 1][1] }; };
const rumo = (dx, dy) => Math.atan2(dx, -dy);
const SAIDA = through([[690, 380], [540, 200], [300, 100], [20, 40], [-300, -20]], 14); const TS = tabela(SAIDA);
const linhasDe = (nome) => { const pal = nome.toUpperCase().split(/\s+/).filter(Boolean); const out = []; let cur = ""; for (const p of pal) { if ((cur + " " + p).trim().length > 10 && cur) { out.push(cur); cur = p; } else cur = (cur + " " + p).trim(); } if (cur) out.push(cur); return out.slice(0, 3); };

export const style = {
  id: "sessao-na-mesa",
  name: "Sessão na mesa",
  modeled: true,
  tagline: "O dia com o agente, em papel e aquarela",
  look: "Sala em aquarela com contorno de nanquim: um personagem-bloco atrás de uma mesa de madeira com placa, monitor inclinado que mostra o estado do trabalho, janela, cortiça e prateleira; papel, martelo e borboleta carregam as falas.",
  move: "Sala parada e personagem sempre em ação: o avião plana em curva longa, pousa com pulinho, desdobra em etapas, a reação começa no quadro da causa e a resposta é dobrada em quatro vincos e arremessada; cerca de 30 % em quase-parada, picos no gancho e na pancada.",
  rules: [
    "Toda fala em tela é citação literal de quem fala, e a pessoa aprova linha a linha antes de sair sem a marca de rascunho.",
    "Cada tipo de mensagem tem um objeto: pedido é avião de papel, correção é martelo, elogio é borboleta com fita, resposta é folha dobrada e arremessada.",
    "A sala fica parada, sem boil; quem se mexe é o personagem, sempre fazendo alguma coisa.",
    "A reação começa no mesmo quadro da causa: pouso, pancada, desdobra.",
    "O papel dobra em quatro vincos sobrepostos, com curva bem apertada, e gira três quartos antes do arremesso.",
    "A janela segue a hora real das mensagens: dia, pôr do sol, noite com luminária acesa.",
    "Todo objeto da sala é verdade sobre a pessoa.",
    "Cada ação tem uma deixa da trilha no quadro dela: pouso, vinco, arremesso, pancada, batida de asa.",
  ],
  prompt: `R — Referências
Curta de uma sessão de trabalho contada como desenho animado em aquarela: um personagem-bloco atrás de uma mesa recebe os recados em objetos de papel, reage, trabalha no monitor e devolve a resposta dobrada em avião. As falas são reais e aprovadas por quem as disse.
I — Ideia
• Começo (0–1,5 s): sala em aquarela de dia, fundo da parede em {{bg}}; um avião de papel entra planando pela janela, faz a curva atrás da cabeça e pousa no bloco com um pulinho.
• Meio (1,5–3,5 s): o personagem pega o avião, que se desdobra em etapas até virar a folha com {{name}}; os olhos crescem, uma lâmpada acende; ele guarda a folha e digita, e o monitor mostra o check.
• Fim (3,5–5 s): uma folha em {{accent2}} sobe, dobra em quatro vincos, gira três quartos e é arremessada de volta pela janela; o personagem se surpreende e volta ao repouso. O quadro 0 é igual ao quadro 5.
E — Estilo
Aparência: aquarela com contorno de nanquim de largura variável, parede {{bg}}, tinta {{ink}}, corpo e acentos em {{accent}} (personagem, flores, curva da parede), apoio {{accent2}} (rodapé, céu, tela), letra de marcador em {{font}} sempre em caixa alta.
Movimento: sala parada e personagem sempre em ação; planeio em curva longa com subida e descida, pouso com pulinho, dobra em 4 vincos com cerca de 39 % de sobreposição, reação no quadro da causa, cerca de 30 % do tempo em quase-parada.
Regras:
1. Toda fala é citação literal e aprovada.
2. Um objeto por tipo de mensagem: avião, martelo, borboleta, folha.
3. Sala parada, sem boil; o personagem nunca fica ocioso.
4. A reação começa no quadro da causa.
5. O papel dobra em quatro vincos e gira três quartos antes do arremesso.
E — Examinar
Um HTML, um canvas, uma função render(t) pura. Confira os quadros em t = 0, 1,25, 2,5, 3,75 e 5 s e corrija.`,
  ref: "",
  theme: { bg: "#e8ddbd", ink: "#17131c", accent: "#ca6c55", accent2: "#9ebfad", font: "Marker Felt" },
  tags: ["aquarela", "personagem", "desenho animado", "papel", "avião de papel", "mesa", "história", "agente", "sessão", "artesanal"],
  word: "Pedido",
  movimentoAlvo: {
    amplitude_min: 5.6,
    fracao_parada_min: 0.21,
    picos_por_10s_min: 0.4,
    cortes_duros_por_10s_ref: 0.2,
    amplitude_ref: 8.0,
    fracao_parada_ref: 0.31,
    duracao_ref: 52.672,
  },
  render(ctx, t, theme, w, h) {
    const T = ((t % LOOP) + LOOP) % LOOP;
    const nome = String((theme && theme.name) || "Pedido");
    const R = preparar(w, h, theme, nome), P = R.P, V = R.V;
    ctx.save();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = P.wall; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(R.sala, 0, 0);
    ctx.setTransform(V.s, 0, 0, V.s, w / 2 - V.cx * V.s, h / 2 - V.cy * V.s); ctx.lineJoin = "round";
    const b = BEAT;
    // pose
    const tecla = Math.floor(T * 12);
    const digitando = (T >= b.digita[0] && T < b.digita[1]) || T < 0.12;
    const o = { dx: 0, dy: 0, rot: 0, sq: 0, aL: 2.42, aR: 0.72, aLen: 2.5 * U, aLy: 4.6 * U, olhos: "rect", boca: null, look: 0 };
    o.aL = tr(T, [[0, 2.42], [b.pega, 2.42], [b.pega + 0.2, 3.72], [b.guarda[0], 3.72], [b.guarda[1], 2.42], [b.sobe[0], 2.42], [b.sobe[1], 3.72], [b.arma, 3.72], [b.solta - 0.05, 4.05], [b.solta + 0.1, 2.9, "out3"], [b.solta + 0.45, 2.42]]);
    o.dy = tr(T, [[0, 0], [b.ideia, 0], [b.ideia + 0.1, -46, "out3"], [b.ideia + 0.35, -36], [b.guarda[1], 0], [b.sobe[1], 22], [b.arma, 22], [b.solta + 0.08, -30, "out3"], [b.solta + 0.4, -12], [LOOP - 0.05, 0]]);
    o.rot = tr(T, [[0, 0], [b.dobra[1], 0], [b.arma + 0.18, 0.08], [b.solta, 0.085], [b.solta + 0.1, -0.08, "out3"], [b.solta + 0.45, 0]]);
    o.dx = tr(T, [[0, 0], [b.dobra[1], 0], [b.arma + 0.18, 24], [b.solta, 26], [b.solta + 0.1, -28, "out3"], [b.solta + 0.45, 0]]);
    if (T >= b.voo[0] && T < b.ideia) { o.olhos = "rect"; }
    if (T >= b.ideia && T < b.guarda[0] + 0.1) { o.olhos = "fofo"; o.boca = "abre"; }
    if (T >= b.guarda[0] + 0.1 && T < b.sobe[0]) { o.olhos = "foco"; o.boca = "linha"; o.look = 0.55; }
    if (T >= b.sobe[0] && T < b.solta) { o.olhos = "alegre"; o.boca = "sorri"; }
    if (T >= b.solta && T < b.fora - 0.1) { o.olhos = "susto"; o.boca = "o"; o.look = -1; }
    if (digitando) { const q = hashI(tecla, 5) > 0.5; o.aL += q ? 0.34 : -0.1; o.aR += q ? -0.1 : 0.34; o.dy += tecla % 2 ? 6 : 0; }
    if (o.aL > 3.2) { o.aLen = 2.9 * U; o.aLy = 3.2 * U; }
    // o avião ou a folha da vez
    let folha = null; const SX = V.retrato ? 905 : Math.max(548, V.cx - w / (2 * V.s) + 200), SY = V.retrato ? 222 : 322;
    const texP = texFolha(R, theme, linhasDe(nome), "p"), texR = texFolha(R, theme, ["-"], "r");
    if (T >= b.voo[0] && T < b.guarda[1]) {
      if (T < b.pega) { const k = seg(T, b.voo[0], b.voo[1]); const kk = 1 - Math.pow(1 - k, 1.6); const Aq = naCurva(VOO, TV, kk), Nq = naCurva(VOO, TV, clamp(kk + 0.012)); const h0 = rumo(Aq.dx, Aq.dy), h1 = rumo(Nq.dx, Nq.dy); let dh = h1 - h0; while (dh > Math.PI) dh -= 6.283; while (dh < -Math.PI) dh += 6.283; const u2 = Math.max(0, T - b.voo[1]); folha = { x: Aq.x + 40 * E.out3(clamp(u2 / 0.15)), y: Aq.y + Math.sin(k * 14) * 14 * (1 - k) - 14 * Math.abs(Math.sin(u2 * 14)) * Math.exp(-8 * u2), heading: h0, roll: 0.95 - clamp(dh * 12, -1, 1) * 0.5, pitch: 0.32, s: lerp(0.46, 0.56, E.io(k)), f: FULL, tex: texP }; o.look = clamp((folha.x - 960) / 420, -1, 1); }
      else if (T < b.guarda[0]) { const u = seg(T, b.abre[0], b.abre[1]), m = E.io(clamp(u * 1.5)); const Aq = naCurva(VOO, TV, 1); folha = { x: lerp(652, SX, m), y: lerp(Aq.y, SY, m) + (T > b.abre[1] ? Math.sin((T - b.abre[1]) * 6) * 4 : 0), s: lerp(0.56, 1, E.out3(clamp(u * 1.5))), heading: lerp(rumo(Aq.dx, Aq.dy), -0.03, m), roll: lerp(1.1, 0, E.io(clamp(u * 2.4))), pitch: lerp(0.5, 0, m), f: foldK(1 - u), tex: texP }; }
      else { const g = E.io(seg(T, b.guarda[0], b.guarda[1])); folha = { x: lerp(SX, 412, g), y: lerp(SY, 668, g), s: lerp(1, 0.28, g), heading: lerp(-0.03, -0.5, g), roll: 0, pitch: 0, f: [0, 0, 0, 0], tex: texP }; }
    }
    if (T >= b.sobe[0] && T < b.fora) {
      const back = P.peach;
      if (T < b.dobra[0]) { const u = E.out3(seg(T, b.sobe[0], b.sobe[1])); folha = { x: lerp(690, SX, u), y: lerp(736, SY, u), s: lerp(0.26, 1, u), heading: lerp(0.15, -0.03, u), roll: 0, pitch: 0, f: [0, 0, 0, 0], tex: texR, back }; }
      else if (T < b.arma) { const k = seg(T, b.dobra[0], b.dobra[1]); folha = { x: SX - 8 * k, y: SY - 34 * E.io(k), s: 1, heading: -0.03, roll: 0.62 * E.io(seg(k, 0.6, 1)), pitch: 0.12 * E.io(seg(k, 0.6, 1)), f: foldK(k), tex: texR, back }; }
      else if (T < b.solta) { const k = E.io(seg(T, b.arma, b.solta - 0.03)); folha = { x: lerp(SX - 8, SX + 98, k), y: lerp(SY - 34, SY + 52, k), s: lerp(1, 0.94, k), heading: lerp(-0.03, 0.55, k), roll: 0.62, pitch: 0.12, f: FULL, tex: texR, back }; }
      else { const k = seg(T, b.solta, b.fora); const Aq = naCurva(SAIDA, TS, E.out2(k)); folha = { x: Aq.x, y: Aq.y, s: lerp(0.9, 0.22, E.out3(clamp(k * 1.6))), heading: lerp(0.55, rumo(Aq.dx, Aq.dy), clamp(k * 5)), roll: 0.85, pitch: 0.3, f: FULL, tex: texR, back }; }
    }
    personagem(ctx, o, R);
    const fim = T >= b.digita[1] - 0.05 && T < b.fora + 0.02;
    const n = T < b.pega ? 6 : T < b.digita[0] ? 6 : 6;
    tela(ctx, fim ? "check" : { n, frac: 1 }, T, P);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.meio, 0, 0);
    ctx.setTransform(V.s, 0, 0, V.s, w / 2 - V.cx * V.s, h / 2 - V.cy * V.s);
    fones(ctx, P, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(R.mesa, 0, 0);
    ctx.setTransform(V.s, 0, 0, V.s, w / 2 - V.cx * V.s, h / 2 - V.cy * V.s);
    teclado(ctx, P, digitando ? tecla : -1); caneca(ctx, P, T);
    if (folha) papel(ctx, folha, P);
    const topo = 462 + o.dy;
    const pop = (a, d) => (T < a || T >= a + d ? 0 : E.back(clamp((T - a) / 0.16)) * (1 - seg(T, a + d - 0.12, a + d)));
    lampada(ctx, 1120, topo - 80, pop(b.ideia, b.guarda[0] + 0.15 - b.ideia) * 1.25, P);
    faisca(ctx, 1232, topo + 22, 54 * pop(b.digita[1] - 0.05, 0.5), P);
    faisca(ctx, 1226, topo + 16, 52 * pop(b.solta + 0.02, 0.45), P);
    // grão de papel, feito uma vez por tamanho
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.55; ctx.imageSmoothingEnabled = true; ctx.drawImage(R.grao, 0, 0, w, h); ctx.globalAlpha = 1;
    ctx.restore();
  },
};
