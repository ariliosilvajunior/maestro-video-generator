// tinta.js — a caixa de tinta: acaso com semente, ruído, pincel seco e pontilhado.
// Tudo em unidades de desenho (960 x 540); o quadro final é 1920 x 1080, então 1 unidade = 2 px.
const W = 1920, H = 1080, U = 2;
const clamp01 = x => Math.max(0, Math.min(1, x));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b, f = x => x) => f(clamp01((t - a) / (b - a)));
const sine = x => .5 - .5 * Math.cos(Math.PI * x);
const p2io = x => x < .5 ? 2 * x * x : 1 - 2 * (1 - x) ** 2;
const p3io = x => x < .5 ? 4 * x ** 3 : 1 - 4 * (1 - x) ** 3;
const p2o = x => 1 - (1 - x) ** 2;
const p3o = x => 1 - (1 - x) ** 3;
const back = x => 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2;
const smooth = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, y) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vnoise1(x, s = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash2(i, s * 7919 + 13), hash2(i + 1, s * 7919 + 13), u); }
function vnoise2(x, y, s = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), o = s * 1013;
  return lerp(lerp(hash2(ix + o, iy), hash2(ix + 1 + o, iy), ux), lerp(hash2(ix + o, iy + 1), hash2(ix + 1 + o, iy + 1), ux), uy);
}
function fbm(x, y, s = 0, oct = 4) { let v = 0, a = .5, f = 1, n = 0; for (let i = 0; i < oct; i++) { v += a * vnoise2(x * f, y * f, s + i * 17); n += a; a *= .5; f *= 2.03; } return v / n; }
function tela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- a paisagem desliza para a esquerda, cada vez mais rápido (medido na referência) ----------
// velocidade da serra: 3 * ((t-1)/23)^0.7 unidades por segundo até 24 s, depois 3 constantes
function desliza(t) {
  if (t <= 1) return 0;
  if (t <= 24) return 3 * 23 / 1.7 * ((t - 1) / 23) ** 1.7;
  return 3 * 23 / 1.7 + 3 * (t - 24);
}

// ---------- linhas ----------
function catmull(pts, n = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t, q = k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([q(0), q(1)]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
function reamostra(pts, passo = 1) {
  const C = [0]; for (let i = 1; i < pts.length; i++) C.push(C[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = C[C.length - 1], P = []; let k = 0;
  for (let s = 0; s <= L + 1e-6; s += passo) {
    while (k < C.length - 2 && C[k + 1] < s) k++;
    const f = (s - C[k]) / ((C[k + 1] - C[k]) || 1);
    P.push([lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f)]);
  }
  return { P, L };
}
function circulo(cx, cy, rx, ry, a0, a1, n = 240, rf = null) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), r = rf ? rf(a) : 1; pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
  return pts;
}

// ---------- pincel seco: cerdas paralelas que falham onde o pincel seca ----------
// o: { w largura, n cerdas, seco 0..1, corr (falhas alinhadas entre cerdas = riscos brancos atravessados),
//      ta/tb (afinamento no começo/fim), seed, ink 'r,g,b', a, cru (não suaviza) }
const INK = '27,22,15';
function pincel(pts, o = {}) {
  const base = o.cru ? pts : catmull(pts, o.seg || 8);
  const { P, L } = reamostra(base, 1), n = P.length, R = rng(o.seed || 1), seed = o.seed || 1;
  const w = o.w || 3, nb = o.n || Math.max(3, Math.round(w * 2.4)), seco = o.seco ?? .3, corr = o.corr ?? 0;
  const ta = o.ta ?? 6, tb = o.tb ?? 18;
  const N = P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [-dy / d, dx / d]; });
  const va = o.varia ?? .36;
  const wid = P.map((_, s) => w * Math.min(1, .4 + .6 * s / ta) * Math.min(1, .2 + .8 * (L - s) / tb) * (1 - va / 2 + va * vnoise1(s * .045, seed)));
  const br = [], fq = o.fq || 1, sk = o.sk ?? .5, rasgo = o.rasgo ?? .35, fal = o.fal ?? .12;
  // riscos brancos: falhas finas que atravessam o traço (inteiro ou em parte), um pouco inclinadas
  const fendas = [], fenda = o.fenda ?? 0;
  if (fenda > 0) for (let s = R() * 10; s < L; s += (o.passo ?? 16) * (.45 + R() * 1.1))
    fendas.push({ s, hw: fenda * (.35 + R() * .65), k: sk * (.5 + R()) * w * (R() < .5 ? -1 : 1), u0: R() < .55 ? -2 : -1 + R() * 1.3, u1: R() < .55 ? 2 : -.3 + R() * 1.3 });
  for (let b = 0; b < nb; b++) {
    const u = ((b + .5) / nb) * 2 - 1 + (R() - .5) * .3, ed = Math.abs(u);
    const th = Math.max(.32, w / nb * (1.55 + R() * .8)), f = (.08 + R() * .12) * fq, ph = R() * 100;
    const thr0 = seco * (.12 + .88 * ed * ed);
    const runs = []; let cur = null, fi = 0;
    for (let i = 0; i < n; i++) {
      const s = i, seca = thr0 + seco * .5 * (s / L) ** 2;
      while (fi < fendas.length && fendas[fi].s < s - 3 * w - 4) fi++;
      let risco = false;
      for (let q = fi; q < fendas.length && fendas[q].s < s + 3 * w + 4; q++) { const F = fendas[q]; if (u >= F.u0 && u <= F.u1 && Math.abs(s - F.s - u * F.k) < F.hw) { risco = true; break; } }
      // cada cerda ainda falha sozinha, mais nas bordas e no fim do traço (pincel secando)
      const vis = !risco && vnoise1(s * f + ph, seed + 11 + b) > fal + seca * .9 && wid[s] > .05;
      if (!vis) { cur = null; continue; }
      if (!cur) { cur = { s0: s, xy: [] }; runs.push(cur); }
      // cada borda se rasga sozinha
      const j = (vnoise1(s * .3 + ph, seed + 77 + b) - .5) * w * .22 * ed;
      const off = u * wid[s] / 2 * (1 - rasgo * ed * ed * vnoise1(s * .42, seed + (u > 0 ? 5 : 6))) + j;
      cur.xy.push(P[i][0] + N[i][0] * off, P[i][1] + N[i][1] * off);
    }
    br.push({ th, runs: runs.map(r => ({ s0: r.s0, xy: new Float32Array(r.xy) })) });
  }
  return { L, P, br, ink: o.ink || INK, a: o.a ?? .92 };
}
// desenha o traço até o comprimento len (unidades); ctx já está em unidades
function tinta(ctx, st, len = Infinity, a = 1) {
  if (len <= 0 || a <= 0) return;
  ctx.strokeStyle = `rgba(${st.ink},${st.a * a})`; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const b of st.br) {
    ctx.lineWidth = b.th; ctx.beginPath(); let algo = false;
    for (const r of b.runs) {
      if (r.s0 > len) break;
      const m = Math.min(r.xy.length / 2, Math.floor(len - r.s0) + 1);
      ctx.moveTo(r.xy[0], r.xy[1]);
      if (m === 1) ctx.lineTo(r.xy[0] + .05, r.xy[1]);
      for (let i = 1; i < m; i++) ctx.lineTo(r.xy[2 * i], r.xy[2 * i + 1]);
      algo = true;
    }
    if (algo) ctx.stroke();
  }
}
// a ponta do traço em andamento (para gotas e para saber onde está o pincel)
function pontaDe(st, len) { const i = clamp(Math.floor(len), 0, st.P.length - 1); return st.P[i]; }

// ---------- pontilhado: a tinta que entra no papel aparece primeiro onde é mais densa ----------
// dens(x, y) em unidades -> densidade (>1 é sólido). Guarda, por grão, o momento em que ele aparece.
function pontilhado(x0, y0, w, h, dens, seed, cor) {
  w = Math.ceil(w); h = Math.ceil(h);
  const lim = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = dens(x0 + x + .5, y0 + y + .5);
    if (d <= 0) { lim[y * w + x] = 255; continue; }
    const g = hash2(x + seed * 4099, y + seed * 2131) * .8 + vnoise2((x0 + x) * .9, (y0 + y) * .9, seed) * .2;
    lim[y * w + x] = Math.min(255, Math.round(g / d * 254));
  }
  const c = tela(w, h), cx = c.getContext('2d'), img = cx.createImageData(w, h);
  return { x0, y0, w, h, lim, c, cx, img, cor, k: -1 };
}
// k de 0 a 1: quanto da tinta já entrou
function pontos(pt, k) {
  k = clamp01(k);
  if (Math.abs(k - pt.k) < .002) return pt.c;
  const kk = k * 254, d = pt.img.data, [r, g, b, a] = pt.cor;
  for (let i = 0; i < pt.lim.length; i++) {
    const v = pt.lim[i] < 255 ? clamp01((kk - pt.lim[i]) * .2 + .5) : 0;
    d[4 * i] = r; d[4 * i + 1] = g; d[4 * i + 2] = b; d[4 * i + 3] = v * a;
  }
  pt.cx.putImageData(pt.img, 0, 0); pt.k = k;
  return pt.c;
}
