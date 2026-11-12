// motor.js — um relógio só. render(t) desenha o quadro inteiro a partir do tempo.
// Sem texto nenhum: só o desenho (pedido do Felipe).
const DUR = 28;
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const LAND = tela(W, H), lx = LAND.getContext('2d');   // a paisagem, para esmaecer inteira
const TMP = tela(W, H), tx = TMP.getContext('2d');     // grupos que entram e saem juntos
const bez = (a, c, b, u) => (1 - u) * (1 - u) * a + 2 * u * (1 - u) * c + u * u * b;

// ---------- papel e fibra ----------
const PAPEL = (() => {
  const c = tela(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data, c0 = [238, 232, 220], c1 = [223, 215, 199];
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    const dx = (X - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2), r = Math.min(1, Math.sqrt(dx * dx * .75 + dy * dy * 1.05) / 1.12), k = r * r * (3 - 2 * r) * .95;
    const n = (hash2(X, y) - .5) * 4 + (vnoise2(X * .006, y * .006, 9) - .5) * 5, i = 4 * (y * W + X);
    d[i] = c0[0] + (c1[0] - c0[0]) * k + n; d[i + 1] = c0[1] + (c1[1] - c0[1]) * k + n; d[i + 2] = c0[2] + (c1[2] - c0[2]) * k + n * .9; d[i + 3] = 255;
  }
  x.putImageData(img, 0, 0); return c;
})();
const FIBRA = (() => {
  const c = tela(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    const v = 255 - hash2(X + 3, y + 5) * 10 - vnoise2(X * .05, y * .05, 12) * 4, i = 4 * (y * W + X);
    d[i] = v; d[i + 1] = v; d[i + 2] = v - 1; d[i + 3] = 255;
  }
  x.putImageData(img, 0, 0); return c;
})();

// ---------- a linha da serra: acelera no meio e freia na borda (medido: 1 s→150, 1,5 s→295, 2 s→855, 2,45 s→960) ----------
const LS = pincel(SERRA, { w: 6.2, n: 15, seco: .3, fal: .06, fenda: 1.1, passo: 15, sk: .45, rasgo: .4, varia: .5, ta: 3, tb: 10, seed: 5, a: 1 });
const sEm = x => { const i = LS.P.findIndex(p => p[0] >= x); return i < 0 ? LS.L : i; };
function monotona(xs, ys) { // Fritsch–Carlson, com velocidade zero nas pontas
  const n = xs.length, d = [], m = [0];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(0);
  for (let i = 0; i < n - 1; i++) { if (!d[i]) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
  return x => {
    if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
const linhaLen = monotona([.7, 1.0, 1.5, 2.0, 2.45, 2.8], [0, sEm(150), sEm(295), sEm(855), sEm(960), LS.L]);

// ---------- pontilhados (a tinta que enche as montanhas) ----------
const COR_TINTA = [28, 25, 22, 232];
const PT_PICOS = PICOS.map((p, i) => pontilhado(p.vl[0], p.py - 3, p.vr[0] - p.vl[0], Math.ceil(Math.max(p.vl[1], p.vr[1]) + 30 - (p.py - 3)), densPico(p), 30 + i, COR_TINTA));
const PT_MORRO = pontilhado(MORRO.px - 55, MORRO.py - 2, 110, 70, densMonte(MORRO), 40, [72, 72, 70, 205]);
const PT_M1 = pontilhado(M1.px - 106, M1.py - 2, 212, 130, densMonte(M1), 41, [26, 23, 20, 242]);
const PT_M2 = pontilhado(M2.px - 96, M2.py - 2, 192, 114, densMonte(M2), 42, [26, 23, 20, 242]);
const PT_MARGEM = pontilhado(MARGEM[0][0], 378, MARGEM[MARGEM.length - 1][0] - MARGEM[0][0], 62, densMargem, 43, [30, 27, 24, 228]);

// ---------- montanhas do fundo: tinta aguada, macia ----------
const FUNDO_C = (() => {
  const x0 = -40, y0 = 190, w = 1300, h = 170, c = tela(w, h), cx = c.getContext('2d'), img = cx.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = clamp01(densFundo(x0 + x + .5, y0 + y + .5)) * .78 * (.8 + .4 * hash2(x + 7, y + 3)), i = 4 * (y * w + x);
    d[i] = 143; d[i + 1] = 157; d[i + 2] = 167; d[i + 3] = a * 255;
  }
  cx.putImageData(img, 0, 0);
  const c2 = tela(w * U, h * U), c2x = c2.getContext('2d'); c2x.filter = 'blur(4.5px)'; c2x.drawImage(c, 0, 0, w * U, h * U);
  return { c: c2, x0, y0, w, h };
})();

// ---------- nuvens: manchas azul-acinzentadas, barriga escura, borradas ----------
const NUV = (() => {
  const x0 = -200, y0 = 80, w = 1500, h = 200, raw = tela(w * U, h * U), rx = raw.getContext('2d'), R = rng(77);
  rx.setTransform(U, 0, 0, U, -x0 * U, -y0 * U);
  for (const [a, b, yc, hh, op] of NUVENS) {
    for (let x = a; x <= b; x += 16) {
      const k = Math.sin(Math.PI * (x - a) / (b - a)), cy = yc + (R() - .5) * hh * .35, rr = 18 + R() * 22, ry = hh * (.45 + .55 * k) * (.6 + R() * .4);
      const g = rx.createLinearGradient(0, cy - ry, 0, cy + ry);
      g.addColorStop(0, `rgba(232,234,232,${.5 * op})`); g.addColorStop(.6, `rgba(192,201,206,${.7 * op})`); g.addColorStop(1, `rgba(146,160,170,${op})`);
      rx.fillStyle = g; rx.beginPath(); rx.ellipse(x, cy, rr, ry, 0, 0, 7); rx.fill();
    }
    rx.fillStyle = `rgba(128,143,154,${.4 * op})`; rx.beginPath(); rx.ellipse((a + b) / 2, yc + hh * .42, (b - a) / 2, 3.5, 0, 0, 7); rx.fill();
  }
  const c = tela(w * U, h * U), cx = c.getContext('2d'); cx.filter = 'blur(18px)'; cx.drawImage(raw, 0, 0);
  return { c, x0, y0, w, h };
})();
// névoa: manchas brancas e borradas que engolem a base das montanhas
function faixas(lista, blur, seed) {
  const x0 = -200, y0 = 280, w = 1700, h = 300, raw = tela(w * U, h * U), rx = raw.getContext('2d'), R = rng(seed);
  rx.setTransform(U, 0, 0, U, -x0 * U, -y0 * U);
  for (const [a, b, yc, hh, op] of lista) for (let x = a; x <= b; x += 20) {
    rx.fillStyle = `rgba(248,246,241,${op * .45})`; rx.beginPath(); rx.ellipse(x, yc + (R() - .5) * hh * .4, 30 + R() * 30, hh * (.6 + R() * .5), 0, 0, 7); rx.fill();
  }
  const c = tela(w * U, h * U), cx = c.getContext('2d'); cx.filter = `blur(${blur}px)`; cx.drawImage(raw, 0, 0);
  return { c, x0, y0, w, h };
}
const NEV_A = faixas(NEVOA_A, 22, 91), NEV_B = faixas(NEVOA_B, 28, 92);
const nevoa = (c, N, a) => { if (a <= 0) return; c.globalAlpha = a; c.drawImage(N.c, N.x0, N.y0, N.w, N.h); c.globalAlpha = 1; };

// ---------- traços fixos ----------
const L2 = pincel(LINHA2, { w: 2.2, n: 6, seco: .45, seed: 8, ink: '70,66,60', a: .75 });
const AG = AGUA.map(([a, b, y], i) => { const pts = []; for (let x = a; x <= b; x += 12) pts.push([x, y + 1.2 * Math.sin(x * .045 + i * 1.7)]); return pincel(pts, { w: 1.4, n: 3, seco: .6, fal: .3, fenda: 1.4, passo: 22, seed: 20 + i, ink: '84,80,74', a: .38, ta: 10, tb: 30 }); });
const GH = pincel(GALHO, { w: 7.4, n: 15, seco: .32, fal: .08, fenda: 1, passo: 20, rasgo: .45, ta: 2, tb: 90, seed: 50, ink: '52,50,46', a: 1 });
const GHs = GALHINHOS.map((g, i) => pincel(g.pts, { w: 3, n: 7, seco: .32, ta: 2, tb: 24, seed: 60 + i, ink: '56,54,50', a: 1 }));
const ENSO_S = pincel(circulo(ENSO.x, ENSO.y, ENSO.r, ENSO.r, -1.75, -1.75 + Math.PI * 2 * .985, 300, a => 1 + .012 * Math.sin(2 * a + 1) + .007 * Math.sin(5 * a)), { w: 11, n: 26, seco: .26, fal: .04, fenda: 1.5, passo: 17, sk: .18, rasgo: .55, varia: .55, ta: 3, tb: 45, seed: 90, cru: true, a: 1 });
const PARAPEITO = pincel([[150, 313], [200, 312.5], [260, 313.5], [352, 312]], { w: 2.2, n: 6, seco: .3, seed: 91, ink: '40,36,32' });
const TELHADO = pincel([[127, 336], [140, 322], [168, 314], [203, 310], [236, 315], [258, 322], [266, 340]], { w: 2.6, n: 7, seco: .3, seed: 70 });
const PLATAFORMA = pincel([[113, 399], [200, 399.5], [284, 398.5]], { w: 1.8, n: 4, seco: .3, seed: 71, ink: '50,46,42' });
const TRONCO = [[[312, 399], [310, 375], [308, 352], [306, 336]], [[308, 356], [316, 349], [325, 346]], [[307, 363], [299, 358], [291, 356]]].map((p, i) => pincel(p, { w: i ? 1.4 : 2.6, n: i ? 3 : 6, seco: .3, ta: 4, tb: 12, seed: 72 + i }));
const PENA = o => ({ w: 1.45, n: 3, seco: .16, fenda: 0, ta: 1, tb: 3, cru: true, ink: '52,48,44', a: .9, ...o });
const anel = (k, cx, cy, rx, ry) => pincel(circulo(cx, cy, rx, ry, -Math.PI / 2, Math.PI * 1.5, 260, a => 1 + .006 * Math.sin(3 * a + k * 2)), PENA({ seed: 100 + k, w: 1.3 }));
const ANEIS = BOLO.r.map((r, k) => anel(k, BOLO.x, BOLO.y, r, r));
const BORDA = pincel(circulo(BOLO.x, BOLO.y, BOLO.borda, BOLO.borda, -Math.PI / 2 + .1, Math.PI * 1.5 + .1, 700, a => (BOLO.borda + 9 * Math.sqrt(Math.abs(Math.sin(7 * (a - .1))))) / BOLO.borda), PENA({ seed: 110 }));
// as oito nuvenzinhas em espiral, viradas para o centro
const VOLUTAS = [-66, -24, 24, 66, 114, 156, 204, 246].map((g, i) => {
  const th = g * Math.PI / 180, P = [BOLO.x + Math.cos(th) * BOLO.volutas, BOLO.y + Math.sin(th) * BOLO.volutas], T = [-Math.sin(th), Math.cos(th)], C = [-Math.cos(th), -Math.sin(th)], s = 1.55;
  const mundo = ([x, y]) => [P[0] + (x * T[0] + y * C[0]) * s, P[1] + (x * T[1] + y * C[1]) * s];
  const esp = (c, a0, a1) => { const o = []; for (let j = 0; j <= 30; j++) { const f = j / 30, a = lerp(a0, a1, f), r = lerp(.7, 3.6, f); o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); } return o; };
  const curl = [...esp([-4.6, -2.2], 0, -1.5 * Math.PI), [0, 2.0], ...esp([4.6, -2.2], Math.PI, 2.5 * Math.PI).reverse()].map(mundo);
  const base = [[-9, 6.4], [-4, 5.2], [0, 5], [4, 5.2], [9, 6.4]].map(mundo);
  return { a: pincel(curl, PENA({ seed: 120 + i, w: 1.5 })), b: pincel(base, PENA({ seed: 140 + i, w: 1.3 })) };
});
const FL_T = FLORES.map((_, i) => 15.4 + ((i * .618) % 1) * 2.4);

// ---------- céu ----------
function ceu(t) {
  const a = seg(t, 11.3, 13.5, sine); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(LUA.x, LUA.y + 25); ctx.scale(1.55, 1);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 340);
  g.addColorStop(0, 'rgba(174,186,194,.62)'); g.addColorStop(.3, 'rgba(178,190,197,.5)'); g.addColorStop(.65, 'rgba(196,203,205,.24)'); g.addColorStop(1, 'rgba(214,214,208,0)');
  ctx.fillStyle = g; ctx.fillRect(-400, -400, 800, 800); ctx.restore();
}
function nuvens(t, A) {
  if (t < 7) return;
  const dx = 90 * (1 - seg(t, 7, 12, p2o)) - 1.3 * (t - 7), rev = seg(t, 7, 11, sine);
  tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(0, 0, W, H); tx.setTransform(U, 0, 0, U, 0, 0);
  tx.drawImage(NUV.c, NUV.x0 + dx, NUV.y0, NUV.w, NUV.h);
  if (rev < 1) { // entram pela direita
    const xe = lerp(1150, -350, rev), g = tx.createLinearGradient(xe - 200, 0, xe + 200, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    tx.globalCompositeOperation = 'destination-in'; tx.fillStyle = g; tx.fillRect(-10, 0, 980, 540); tx.globalCompositeOperation = 'source-over';
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = A * seg(t, 7, 8.5); ctx.drawImage(TMP, 0, 0); ctx.restore();
}
function lua(t) {
  const a = seg(t, 11.2, 12.8, p2o); if (a <= 0) return;
  const y = LUA.y + 6 * (1 - a), quente = seg(t, 22, 26, sine), resp = .5 + .5 * Math.sin(t * 1.3);
  ctx.save(); ctx.globalAlpha = a;
  let g = ctx.createRadialGradient(LUA.x, y, LUA.r * .9, LUA.x, y, LUA.r * 2.1);
  g.addColorStop(0, 'rgba(250,247,240,.55)'); g.addColorStop(1, 'rgba(250,247,240,0)'); ctx.fillStyle = g; ctx.fillRect(LUA.x - 120, y - 120, 240, 240);
  if (quente > 0) { // o halo quente cresce quando a vila acende
    g = ctx.createRadialGradient(LUA.x, y, LUA.r * .96, LUA.x, y, LUA.r * 1.45);
    g.addColorStop(0, `rgba(238,170,128,${(.34 + .06 * resp) * quente})`); g.addColorStop(.4, `rgba(240,184,150,${.22 * quente})`); g.addColorStop(1, 'rgba(240,190,160,0)');
    ctx.fillStyle = g; ctx.fillRect(LUA.x - 80, y - 80, 160, 160);
  }
  if (a < 1) ctx.filter = `blur(${8 * (1 - a)}px)`;
  g = ctx.createRadialGradient(LUA.x - 12, y - 14, 4, LUA.x, y, LUA.r);
  g.addColorStop(0, '#faf8f3'); g.addColorStop(.75, '#f2efe8'); g.addColorStop(1, '#ebe6dc');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(LUA.x, y, LUA.r, 0, 7); ctx.fill();
  ctx.filter = `blur(${6 + 8 * (1 - a)}px)`; ctx.fillStyle = 'rgba(160,168,176,.05)';
  for (const [dx, dy, r] of [[-14, -8, 13], [10, 12, 10], [18, -16, 7], [-6, 20, 8]]) { ctx.beginPath(); ctx.ellipse(LUA.x + dx, y + dy, r, r * .8, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---------- a paisagem ----------
function gota(c, t) {
  const k = seg(t, .45, .75, p2o); if (k <= 0) return;
  c.fillStyle = `rgba(${INK},.92)`; c.beginPath();
  for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = 3.3 * k * (1 + .18 * Math.sin(3 * a + 1) + .1 * Math.sin(5 * a)), x = GOTA[0] + Math.cos(a) * r * 1.25, y = GOTA[1] + Math.sin(a) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.fill();
}
function arvoreEsquerda(c, t) {
  const a = seg(t, 23.8, 25.0, sine); if (a <= 0) return;
  c.save(); c.translate(DXC, 0); c.globalAlpha = a * .75; c.filter = `blur(${1.2 + 6 * (1 - a)}px)`;
  c.strokeStyle = 'rgba(105,104,100,.8)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(70, 398); c.lineTo(68, 340); c.lineTo(62, 318); c.moveTo(68, 345); c.lineTo(80, 330); c.stroke();
  c.fillStyle = 'rgba(110,110,106,.55)';
  for (const [x, y, r] of [[58, 312, 9], [72, 306, 8], [84, 318, 7], [50, 324, 6], [66, 322, 7], [80, 330, 5]]) { c.beginPath(); c.ellipse(x, y, r, r * .6, 0, 0, 7); c.fill(); }
  c.restore();
}
function casa(c, t) {
  const a = seg(t, 23.8, 25.0, sine); if (a <= 0) return;
  const bl = 6 * (1 - a), fl = .88 + .12 * vnoise1(t * 5, 4);
  c.save(); c.translate(DXC, 0); c.globalAlpha = a; if (bl > .05) c.filter = `blur(${bl}px)`;
  // árvore da direita (pinheirinho de tinta) e lanterna pendurada
  TRONCO.forEach(s => tinta(c, s));
  c.fillStyle = 'rgba(36,34,31,.88)';
  for (const [x, y, rx, ry] of [[300, 338, 9, 3.2], [318, 343, 9, 3], [309, 331, 7, 2.8], [293, 349, 6, 2.4], [325, 348, 5, 2], [306, 345, 6, 2.5], [314, 336, 5, 2.2]]) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); }
  let g = c.createRadialGradient(290, 365, 1, 290, 365, 22); g.addColorStop(0, `rgba(244,140,96,${.5 * fl})`); g.addColorStop(1, 'rgba(244,140,96,0)'); c.fillStyle = g; c.fillRect(266, 341, 48, 48);
  c.strokeStyle = 'rgba(50,46,42,.8)'; c.lineWidth = .7; c.beginPath(); c.moveTo(290, 354); c.lineTo(290, 361); c.stroke();
  c.fillStyle = '#e05f3c'; c.beginPath(); c.ellipse(290, 365, 2.9, 3.8, 0, 0, 7); c.fill();
  // paredes, janela acesa e o painel em sombra
  c.fillStyle = '#f1eee7'; c.fillRect(141, 347, 118, 51);
  g = c.createRadialGradient(176, 371, 2, 176, 371, 40); g.addColorStop(0, `rgba(244,160,112,${.32 * fl})`); g.addColorStop(1, 'rgba(244,160,112,0)'); c.fillStyle = g; c.fillRect(136, 347, 80, 51);
  c.fillStyle = '#e9b79d'; c.fillRect(158, 357, 36, 28);
  c.strokeStyle = 'rgba(150,96,74,.85)'; c.lineWidth = 1; c.strokeRect(158, 357, 36, 28);
  c.beginPath(); c.moveTo(176, 357); c.lineTo(176, 385); c.moveTo(158, 371); c.lineTo(194, 371); c.stroke();
  c.fillStyle = 'rgba(118,116,112,.22)'; c.fillRect(216, 357, 36, 37);
  c.strokeStyle = 'rgba(70,66,60,.5)'; c.lineWidth = .8; c.strokeRect(141, 347, 118, 51); c.beginPath(); c.moveTo(208, 347); c.lineTo(208, 398); c.stroke();
  // telhado
  c.fillStyle = 'rgba(40,37,34,.96)'; c.beginPath(); c.moveTo(123, 352); c.lineTo(267, 352); c.lineTo(266, 340);
  c.quadraticCurveTo(258, 320, 236, 315); c.quadraticCurveTo(203, 309, 168, 314); c.quadraticCurveTo(136, 319, 127, 336); c.closePath(); c.fill();
  tinta(c, TELHADO);
  // plataforma sobre estacas
  tinta(c, PLATAFORMA);
  c.strokeStyle = 'rgba(50,46,42,.8)'; c.lineWidth = .9; c.beginPath();
  for (const x of [122, 160, 200, 240, 278]) { c.moveTo(x, 399); c.lineTo(x, 409); }
  c.stroke();
  c.restore();
}
function pessoaNaMargem(c, t) {
  const a = seg(t, 24.8, 25.6, sine) * (1 - seg(t, 33.4, 34.4, sine)); if (a <= 0) return;
  const fl = .85 + .15 * vnoise1(t * 7, 6);
  c.save(); c.translate(DXP, 0); c.globalAlpha = a;
  c.strokeStyle = 'rgba(90,86,80,.35)'; c.lineWidth = .9; c.beginPath(); c.moveTo(440, 400); c.lineTo(560, 400.5); c.stroke();
  const g = c.createRadialGradient(468, 384, 1, 468, 384, 26); g.addColorStop(0, `rgba(244,140,96,${.5 * fl})`); g.addColorStop(1, 'rgba(244,140,96,0)'); c.fillStyle = g; c.fillRect(440, 356, 56, 56);
  c.fillStyle = '#332f2a';
  c.beginPath(); c.moveTo(476.5, 372); c.quadraticCurveTo(487, 362.5, 497.5, 372); c.quadraticCurveTo(487, 370, 476.5, 372); c.fill();
  c.beginPath(); c.arc(487, 374.5, 2.6, 0, 7); c.fill();
  c.beginPath(); c.moveTo(482, 377); c.lineTo(492, 377); c.lineTo(494.5, 394); c.lineTo(479.5, 394); c.closePath(); c.fill();
  c.strokeStyle = '#332f2a'; c.lineWidth = 1.1; c.lineCap = 'round'; c.beginPath(); c.moveTo(484.5, 394); c.lineTo(484.5, 399.5); c.moveTo(489.5, 394); c.lineTo(489.5, 399.5); c.stroke();
  c.lineWidth = 1.2; c.beginPath(); c.moveTo(482.5, 380); c.lineTo(474, 377.5); c.lineTo(468.5, 377); c.stroke();
  c.lineWidth = .7; c.beginPath(); c.moveTo(468.5, 377); c.lineTo(468.5, 380.5); c.stroke();
  c.fillStyle = '#e05a3a'; c.beginPath(); c.ellipse(468.5, 384.3, 2.8, 3.8, 0, 0, 7); c.fill();
  c.fillStyle = `rgba(255,214,170,${.8 * fl})`; c.beginPath(); c.ellipse(468.5, 384.3, 1.1, 1.8, 0, 0, 7); c.fill();
  c.restore();
}
function poca(c, t) {
  const a = seg(t, 21.8, 23.2, sine) * (1 - seg(t, 38.0, 39.4, sine)); if (a <= 0) return;
  c.save(); c.globalAlpha = a;
  c.save(); c.translate(POCA.x, POCA.y); c.scale(1, POCA.ry / POCA.rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, POCA.rx); g.addColorStop(0, 'rgba(150,166,174,.55)'); g.addColorStop(.7, 'rgba(160,174,181,.42)'); g.addColorStop(1, 'rgba(170,182,188,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, POCA.rx, 0, 7); c.fill(); c.restore();
  c.strokeStyle = 'rgba(70,80,86,.28)'; c.lineWidth = .8; c.beginPath(); c.ellipse(POCA.x, POCA.y + 1, 98, 15, 0, 0, 7); c.stroke();
  c.fillStyle = 'rgba(250,248,242,.45)'; c.beginPath(); c.ellipse(POCA.x - 12, POCA.y - 15, 32, 2.6, 0, 0, 7); c.fill();
  // o reflexo da lua tremendo: risquinhos de tinta que trocam 8 vezes por segundo
  const R = rng(1000 + Math.floor(t * 8)); c.fillStyle = 'rgba(38,38,38,.6)';
  for (let i = 0; i < 230; i++) { const an = R() * Math.PI * 2, rr = Math.sqrt(R()), x = POCA.x + Math.cos(an) * rr * 68, y = POCA.y + 3 + Math.sin(an) * rr * 10; c.fillRect(x, y, .8 + R() * 2.4, .7); }
  c.restore();
}
function paisagem(c, t, o) {
  const fA = seg(t, 5.0, 6.8, sine);
  if (fA > 0) { c.save(); c.translate(-PAN.fundo * o, 6 * (1 - fA)); c.globalAlpha = fA; c.drawImage(FUNDO_C.c, FUNDO_C.x0, FUNDO_C.y0, FUNDO_C.w, FUNDO_C.h); c.restore(); }
  c.save(); c.translate(-.85 * o, 0); nevoa(c, NEV_A, seg(t, 5.0, 6.8, sine)); c.restore();
  c.save(); c.translate(-PAN.serra * o, 0);
  const kM = seg(t, 5.2, 6.6, p2o); if (kM > 0) c.drawImage(pontos(PT_MORRO, kM), PT_MORRO.x0, PT_MORRO.y0);
  PICOS.forEach((p, i) => { const k = seg(t, p.t0, p.t1, p2o); if (k > 0) c.drawImage(pontos(PT_PICOS[i], k), PT_PICOS[i].x0, PT_PICOS[i].y0); });
  gota(c, t); tinta(c, LS, linhaLen(t));
  c.restore();
  c.save(); c.translate(-PAN.frente * o, 0);
  tinta(c, L2, L2.L * seg(t, 5.7, 6.5, p2io));
  arvoreEsquerda(c, t);
  const k1 = seg(t, 5.8, 7.0, p2o); if (k1 > 0) c.drawImage(pontos(PT_M1, k1), PT_M1.x0, PT_M1.y0);
  const k2 = seg(t, 6.0, 7.2, p2o); if (k2 > 0) c.drawImage(pontos(PT_M2, k2), PT_M2.x0, PT_M2.y0);
  c.save(); c.translate((PAN.frente - 1.4) * o, 0); nevoa(c, NEV_B, seg(t, 5.4, 7.2, sine)); c.restore();
  casa(c, t);
  const k3 = seg(t, 6.1, 7.3, p2o); if (k3 > 0) c.drawImage(pontos(PT_MARGEM, k3), PT_MARGEM.x0, PT_MARGEM.y0);
  pessoaNaMargem(c, t);
  c.restore();
  c.save(); c.translate(-PAN.agua * o, 0);
  AG.forEach((s, i) => tinta(c, s, s.L * seg(t, 5.6 + i * .11, 6.6 + i * .11, p2io)));
  c.restore();
  poca(c, t);
}

// ---------- galho, pássaros e pétalas ----------
function folha(c, [x, y, an, len], k, cor = 'rgba(62,64,58,.88)') {
  c.save(); c.translate(x, y); c.rotate(an); c.scale(k, k); c.fillStyle = cor;
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * .45, -len * .28, len, 0); c.quadraticCurveTo(len * .45, len * .22, 0, 0); c.fill();
  c.restore();
}
function flor(c, [x, y, r], k) {
  c.save(); c.translate(x, y); c.scale(k, k);
  if (r < 2.8) { c.fillStyle = '#c95a37'; c.beginPath(); c.arc(0, 0, r * .8, 0, 7); c.fill(); c.restore(); return; }
  c.rotate(x * .1); c.fillStyle = '#d65f3a';
  for (let i = 0; i < 5; i++) { c.rotate(Math.PI * 2 / 5); c.beginPath(); c.ellipse(0, -r * .55, r * .42, r * .55, 0, 0, 7); c.fill(); }
  c.fillStyle = '#f2a079'; c.beginPath(); c.arc(0, 0, r * .32, 0, 7); c.fill();
  c.fillStyle = '#8f2a1c'; c.beginPath(); c.arc(0, 0, r * .14, 0, 7); c.fill();
  c.restore();
}
function galho(t, A) {
  if (t < 13) return;
  tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(1100, 0, 820, 400); tx.setTransform(U, 0, 0, U, 0, 0);
  tinta(tx, GH, GH.L * seg(t, 13.0, 14.3, p2io));
  GHs.forEach((s, i) => tinta(tx, s, s.L * seg(t, GALHINHOS[i].t0, GALHINHOS[i].t1, p2io)));
  FOLHAS.forEach((f, i) => { const k = seg(t, 14.5 + i * .13, 14.95 + i * .13, p2o); if (k > 0) folha(tx, f, k); });
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = A; ctx.filter = 'blur(1.3px)'; ctx.drawImage(TMP, 1100, 0, 820, 400, 1100, 0, 820, 400); ctx.restore();
  ctx.save(); ctx.globalAlpha = A;
  FLORES.forEach((f, i) => { const k = seg(t, FL_T[i], FL_T[i] + .45); if (k > 0) flor(ctx, f, back(k)); });
  ctx.restore();
}
const BANDO = [[0, 0, 1], [26, 9, .9], [50, 15, 1.05], [78, 3, .85], [100, -2, 1], [128, 24, .9], [150, 14, 1.1]];
function passaros(t) {
  if (t < 11.2 || t > 22) return;
  const u = t - 12.5, x0 = 850 - 82 * u, y0 = 105 - 4 * u + 2.5 * Math.sin(u * .7);
  ctx.save(); ctx.strokeStyle = 'rgba(45,40,35,.68)'; ctx.lineWidth = .95; ctx.lineCap = 'round';
  BANDO.forEach(([dx, dy, s0], i) => {
    const s = s0 * .8;
    const x = x0 + dx, y = y0 + dy + 1.5 * Math.sin(t * 1.7 + i), a = clamp01((x - 170) / 60) * clamp01((990 - x) / 30);
    if (a <= 0) return;
    const f = Math.sin(t * 9.5 + i * 1.9), wy = -1 - 1.8 * f;
    ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x - 6 * s, y + wy * s);
    ctx.quadraticCurveTo(x - 2.6 * s, y + (-2.2 + .4 * wy) * s, x, y); ctx.quadraticCurveTo(x + 2.6 * s, y + (-2.2 + .4 * wy) * s, x + 6 * s, y + wy * s); ctx.stroke();
  });
  ctx.restore();
}
const PETALAS = [[22.4, 700, 166], [23.6, 812, 124], [24.9, 873, 60], [26.2, 899, 104], [28.4, 757, 62], [30.6, 694, 150], [32.2, 828, 104], [44.4, 700, 165]];
function petalas(t, A) {
  ctx.save(); ctx.fillStyle = '#d4613c';
  for (const [t0, x, y] of PETALAS) {
    const u = t - t0; if (u < 0 || u > 5) continue;
    ctx.save(); ctx.globalAlpha = A * Math.min(1, u * 4) * (1 - seg(u, 3.5, 5));
    ctx.translate(x - 9 * u + 5 * Math.sin(u * 2.1), y + 24 * u + 1.2 * u * u); ctx.rotate(u * 2.5); ctx.scale(1, .55 + .45 * Math.cos(u * 4));
    ctx.beginPath(); ctx.ellipse(0, 0, 2.3, 1.6, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

// ---------- o círculo de pincel com a pessoa olhando a lua ----------
function pessoaSentada(c) {
  c.save(); c.fillStyle = 'rgb(94,92,89)'; c.filter = 'blur(2px)';
  c.beginPath(); c.arc(218, 247.5, 4.3, 0, 7); c.fill();
  c.beginPath(); c.ellipse(214, 256.5, 6.2, 6.8, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(186, 313); c.bezierCurveTo(188, 290, 194, 270, 207, 265); c.lineTo(220, 265); c.bezierCurveTo(232, 270, 238, 290, 241, 313); c.closePath(); c.fill();
  c.strokeStyle = 'rgb(94,92,89)'; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(233, 284); c.quadraticCurveTo(240, 296, 247, 310); c.stroke();
  c.restore();
}
function circuloDePincel(t) {
  if (t < 33.2 || t > 38.1) return;
  const sai = seg(t, 37.0, 38.0, sine), pA = seg(t, 34.6, 35.3, sine), fl = .85 + .15 * vnoise1(t * 6, 8);
  tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(0, 0, W, H); tx.setTransform(U, 0, 0, U, 0, 0);
  tinta(tx, ENSO_S, ENSO_S.L * seg(t, 33.2, 34.7, p2io));
  if (pA > 0) {
    tx.globalAlpha = pA;
    const g = tx.createRadialGradient(313, 304, 1, 313, 304, 15); g.addColorStop(0, `rgba(244,140,100,${.5 * fl})`); g.addColorStop(1, 'rgba(244,140,100,0)'); tx.fillStyle = g; tx.fillRect(296, 287, 34, 34);
    tx.fillStyle = '#e3653f'; tx.fillRect(311.6, 299, 3, 9);
    pessoaSentada(tx); tx.globalAlpha = 1;
    tinta(tx, PARAPEITO, PARAPEITO.L * seg(t, 34.55, 35.1, p2io));
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - sai; if (sai > 0) ctx.filter = `blur(${4 * sai}px)`; ctx.drawImage(TMP, 0, 0); ctx.restore();
}

// ---------- as ondas que sobem e viram o bolo da lua ----------
function folhaBolo(c, g, k) {
  const th = g * Math.PI / 180, x = BOLO.x + Math.cos(th) * 52, y = BOLO.y + Math.sin(th) * 52;
  c.save(); c.translate(x, y); c.rotate(th); c.scale(k, k);
  for (const [s, a] of [[1.35, .22], [1, .85]]) { c.fillStyle = `rgba(86,82,74,${a})`; c.beginPath(); c.moveTo(-8.5 * s, 0); c.quadraticCurveTo(0, -4.2 * s, 8.5 * s, 0); c.quadraticCurveTo(0, 4.2 * s, -8.5 * s, 0); c.fill(); }
  c.restore();
}
function florCentral(c, k) {
  const s = back(k), al = clamp01(k * 2);
  c.save(); c.globalAlpha = al; c.translate(BOLO.x, BOLO.y);
  let g = c.createRadialGradient(0, 0, 0, 0, 0, 34); g.addColorStop(0, 'rgba(240,150,100,.28)'); g.addColorStop(1, 'rgba(240,150,100,0)'); c.fillStyle = g; c.fillRect(-34, -34, 68, 68);
  c.rotate(-.45 * (1 - k)); c.scale(s * 1.25, s * 1.25);
  g = c.createRadialGradient(0, 0, 0, 0, 0, 22); g.addColorStop(0, '#dd5f2c'); g.addColorStop(1, '#f08b55'); c.fillStyle = g;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, -1); c.bezierCurveTo(-8, -6, -7.5, -15, 0, -21); c.bezierCurveTo(7.5, -15, 8, -6, 0, -1); c.fill(); c.rotate(Math.PI / 2); }
  c.fillStyle = '#9a2a20'; c.beginPath(); c.arc(0, 0, 2.6, 0, 7); c.fill();
  c.restore();
}
// o miolo do bolo fica limpo: papel claro por dentro da borda recortada
function fundoBolo(c, k, kb) { // kb: quanto da borda recortada já foi desenhado
  c.fillStyle = `rgba(241,237,228,${.85 * k})`; c.beginPath();
  for (let i = 0; i <= 360; i++) { const a = i / 360 * Math.PI * 2, r = BOLO.r[2] + (BOLO.borda - BOLO.r[2] + 9 * Math.sqrt(Math.abs(Math.sin(7 * (a - .1))))) * kb; i ? c.lineTo(BOLO.x + Math.cos(a) * r, BOLO.y + Math.sin(a) * r) : c.moveTo(BOLO.x + Math.cos(a) * r, BOLO.y + Math.sin(a) * r); }
  c.fill();
}
function bolo(c, t) {
  tinta(c, BORDA, BORDA.L * seg(t, 40.4, 42.0, p2io));
  const kp = seg(t, 41.8, 42.25);
  if (kp > 0) { c.fillStyle = 'rgba(60,55,50,.75)'; for (let i = 0; i < 84 && i / 84 <= kp; i++) { const a = -Math.PI / 2 + i / 84 * Math.PI * 2; c.beginPath(); c.arc(BOLO.x + Math.cos(a) * BOLO.pontos, BOLO.y + Math.sin(a) * BOLO.pontos, .95, 0, 7); c.fill(); } }
  VOLUTAS.forEach((v, i) => { const k = seg(t, 42.2 + i * .11, 42.65 + i * .11); if (k <= 0) return; tinta(c, v.a, v.a.L * p2io(clamp01(k / .75))); tinta(c, v.b, v.b.L * p2io(seg(k, .55, 1))); });
  [45, 135, 225, 315].forEach((g, i) => { const k = seg(t, 42.9 + i * .08, 43.4 + i * .08, p2o); if (k > 0) folhaBolo(c, g, k); });
  const kf = seg(t, 43.1, 43.9); if (kf > 0) florCentral(c, kf);
}
function ondasEBolo(t) {
  if (t < 37.6) return;
  const fim = seg(t, 46.3, 47.3, sine); if (fim >= 1) return;
  tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(0, 0, W, H); tx.setTransform(U, 0, 0, U, 0, 0);
  const u = seg(t, 38.4, 40.2, p3io);
  if (t >= 40.2) fundoBolo(tx, seg(t, 40.2, 41.8, sine), seg(t, 40.4, 42.0, p2io));
  for (let k = 0; k < 3; k++) {
    const a0 = seg(t, 37.6 + k * .15, 38.0 + k * .15, p2o); if (a0 <= 0) continue;
    const r0 = lerp(40, ONDAS_R0[k], seg(t, 37.6 + k * .15, 38.7 + k * .1, p2o));
    const st = u >= 1 ? ANEIS[k] : u <= 0 ? anel(k, POCA.x, POCA.y, r0, r0 * .19)
      : (() => { const rx = lerp(r0, BOLO.r[k], u); return anel(k, bez(POCA.x, 430, BOLO.x, u), bez(POCA.y, 410, BOLO.y, u), rx, rx * lerp(.19, 1, u ** .8)); })();
    tinta(tx, st, Infinity, a0 * (.7 + .3 * u));
  }
  if (t >= 40.3) bolo(tx, t);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - fim; if (fim > 0) ctx.filter = `blur(${4 * fim}px)`; ctx.drawImage(TMP, 0, 0); ctx.restore();
}

// ---------- o quadro em nanquim (até a virada para o real, em real.js) ----------
function renderTinta(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(PAPEL, 0, 0);
  ctx.setTransform(U, 0, 0, U, 0, 0);
  const o = desliza(t), esm1 = seg(t, 33.6, 35.0, sine), esm2 = seg(t, 37.0, 38.6, sine), volta = seg(t, 46.3, 47.4, sine);
  const terraA = 1 - .58 * esm1 - .14 * esm2 + .25 * volta, nuvemA = 1 - .3 * esm1 - .15 * esm2 + .2 * volta, galhoA = 1 - .15 * esm1 - .3 * esm2 + .2 * volta;
  ceu(t); nuvens(t, nuvemA); lua(t);
  lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, W, H); lx.setTransform(U, 0, 0, U, 0, 0);
  paisagem(lx, t, o);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = terraA; ctx.drawImage(LAND, 0, 0); ctx.globalAlpha = 1;
  ctx.setTransform(U, 0, 0, U, 0, 0);
  passaros(t); galho(t, galhoA); petalas(t, galhoA);
  circuloDePincel(t); ondasEBolo(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .6; ctx.drawImage(FIBRA, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

