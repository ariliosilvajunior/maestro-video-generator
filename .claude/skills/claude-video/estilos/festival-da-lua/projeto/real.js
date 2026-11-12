// real.js — versão 3: aos 16,15 s o nanquim vira fotografia, o sol se põe atrás da serra e a noite chega.
// As três fotos (entardecer, crepúsculo e noite) foram geradas a partir do nosso próprio quadro de 17,5 s,
// então os picos, o galho, a casa e a pessoa ficam no mesmo lugar do desenho.
const T_VIRA0 = 16.15, T_VIRA1 = 18.4;
const FW = 2688, FH = 1520, FK = FW / W;          // as fotos são 2688 x 1520; o quadro, 1920 x 1080
const SOL0 = [1313, 276], SOL_R = 68;            // o sol da foto, em px do quadro
const FOTOS = { dourado: document.getElementById('f-dourado'), crepusculo: document.getElementById('f-crepusculo'), noite: document.getElementById('f-noite') };
const RC = tela(W, H), rc = RC.getContext('2d');
let PREP = null;

// ---------- preparo das fotos (uma vez, a partir dos pixels) ----------
function preparo() {
  if (!Object.values(FOTOS).every(i => i.complete && i.naturalWidth)) return null;
  const c1 = tela(FW, FH), x1 = c1.getContext('2d'); x1.drawImage(FOTOS.dourado, 0, 0, FW, FH);
  const im = x1.getImageData(0, 0, FW, FH), d = im.data, org = new Uint8ClampedArray(d);
  const lum = i => (org[i] + org[i + 1] + org[i + 2]) / 3;
  const galho = i => lum(i) < 170 || org[i] - org[i + 1] > 80;

  // 1) tira os pássaros parados da foto (os nossos continuam voando por cima)
  const bx0 = Math.round(840 * FK), bx1 = Math.round(1220 * FK), by0 = Math.round(140 * FK), by1 = Math.round(230 * FK), r = 14;
  for (let y = by0; y < by1; y++) for (let x = bx0; x < bx1; x++) {
    let s = 0, n = 0;
    for (let k = -r; k <= r; k += 3) for (const [xx, yy] of [[x + k, y - r], [x + k, y + r], [x - r, y + k], [x + r, y + k]]) { s += lum(4 * (yy * FW + xx)); n++; }
    const i = 4 * (y * FW + x);
    if (lum(i) < s / n - 10) {
      let R = 0, G = 0, B = 0; n = 0;
      for (let k = -r; k <= r; k += 3) for (const [xx, yy] of [[x + k, y - r], [x + k, y + r], [x - r, y + k], [x + r, y + k]]) { const j = 4 * (yy * FW + xx); R += org[j]; G += org[j + 1]; B += org[j + 2]; n++; }
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const j = 4 * ((y + oy) * FW + x + ox); d[j] = R / n; d[j + 1] = G / n; d[j + 2] = B / n; }
    }
  }

  // 2) tira o sol: o céu em volta continua para dentro do disco; o galhinho na frente fica
  const cx = SOL0[0] * FK, cy = SOL0[1] * FK, R0 = 104 * FK, anel = [];
  for (let a = 0; a < 360; a++) {
    const t = a * Math.PI / 180; let R = 0, G = 0, B = 0, n = 0;
    for (let rr = R0 * 1.02; rr < R0 * 1.12; rr += 2) { const j = 4 * (Math.round(cy + Math.sin(t) * rr) * FW + Math.round(cx + Math.cos(t) * rr)); if (galho(j)) continue; R += org[j]; G += org[j + 1]; B += org[j + 2]; n++; }
    anel.push(n ? [R / n, G / n, B / n] : null);
  }
  const ok = anel.filter(Boolean), med = [0, 1, 2].map(k => ok.reduce((s, c) => s + c[k], 0) / ok.length);
  for (let a = 0; a < 360; a++) if (!anel[a]) { let b = 1; while (!anel[(a + b) % 360] && !anel[(a - b + 360) % 360]) b++; anel[a] = anel[(a + b) % 360] || anel[(a - b + 360) % 360]; }
  for (let y = Math.floor(cy - R0); y <= cy + R0; y++) for (let x = Math.floor(cx - R0); x <= cx + R0; x++) {
    const dd = Math.hypot(x - cx, y - cy); if (dd >= R0) continue;
    const i = 4 * (y * FW + x); if (galho(i) && lum(i) < 200) continue;
    const a = (Math.round(Math.atan2(y - cy, x - cx) * 180 / Math.PI) + 360) % 360, f = (dd / R0) ** 2, nz = (hash2(x, y) - .5) * 2.5;
    for (let k = 0; k < 3; k++) d[i + k] = lerp(med[k], anel[a][k], f) + nz;
  }
  x1.putImageData(im, 0, 0);
  // o homem parado (e o reflexo dele) sai das três fotos: quem anda agora é o nosso, em código
  const c2 = tela(FW, FH), c3 = tela(FW, FH);
  c2.getContext('2d').drawImage(FOTOS.crepusculo, 0, 0, FW, FH); c3.getContext('2d').drawImage(FOTOS.noite, 0, 0, FW, FH);
  for (const c of [c1, c2, c3]) for (const caixa of HOMEM_FOTO) remenda(c.getContext('2d'), ...caixa);

  // 3) a frente: a serra (abaixo do primeiro pixel que deixa de ser céu quente) e o galho.
  //    A serra só é recortada na faixa onde o disco do sol passa; fora dela a frente não cobre nada.
  const cf = tela(FW, FH), xf = cf.getContext('2d'), fm = xf.createImageData(FW, FH), fd = fm.data;
  for (let x = 0; x < FW; x++) {
    let ry = FH;
    if (x > 1150 * FK && x < 1500 * FK) for (let y = Math.round(400 * FK); y < Math.round(720 * FK); y++) { const i = 4 * (y * FW + x); if (org[i] - org[i + 2] < 70) { ry = y; break; } }
    for (let y = 0; y < FH; y++) {
      const i = 4 * (y * FW + x);
      let a = y >= ry ? 255 : y >= ry - 2 ? 120 : 0;
      if (!a && y < 380 * FK && x > 1330 * FK && galho(i)) a = 255;
      fd[i + 3] = a;
    }
  }
  xf.putImageData(fm, 0, 0);
  // só a máscara é suavizada; a foto por cima continua nítida
  const cf2 = tela(FW, FH), xf2 = cf2.getContext('2d'); xf2.filter = 'blur(1.2px)'; xf2.drawImage(cf, 0, 0); xf2.filter = 'none';
  xf2.globalCompositeOperation = 'source-in'; xf2.drawImage(c1, 0, 0); xf2.globalCompositeOperation = 'source-over';

  // 4) a água sem o reflexo do sol: cada linha liga as cores das duas bordas da faixa (as ondas são horizontais)
  const ax0 = Math.round(1270 * FK), ax1 = Math.round(1460 * FK), ay0 = Math.round(815 * FK), aw = ax1 - ax0, ah = FH - ay0;
  const ca = tela(aw, ah), xa = ca.getContext('2d'), am = xa.createImageData(aw, ah);
  const cor = (x, y) => { let R = 0, G = 0, B = 0; for (let k = 0; k < 5; k++) { const j = 4 * (y * FW + x + k - 2); R += org[j]; G += org[j + 1]; B += org[j + 2]; } return [R / 5, G / 5, B / 5]; };
  for (let y = 0; y < ah; y++) {
    const e = cor(ax0, y + ay0), dd = cor(ax1, y + ay0);
    for (let x = 0; x < aw; x++) { const f = x / (aw - 1), i = 4 * (y * aw + x), b = Math.min(1, x / 30, (aw - 1 - x) / 30); for (let k = 0; k < 3; k++) am.data[i + k] = lerp(e[k], dd[k], f); am.data[i + 3] = 255 * b * Math.min(1, y / 20); }
  }
  xa.putImageData(am, 0, 0);

  // 5) as estrelas da foto da noite, para piscarem
  const cn = tela(FW, FH), xn = cn.getContext('2d'); xn.drawImage(FOTOS.noite, 0, 0, FW, FH);
  const nd = xn.getImageData(0, 0, FW, Math.round(560 * FK)).data, nl = i => (nd[i] + nd[i + 1] + nd[i + 2]) / 3, cand = [];
  for (let y = 4; y < Math.round(560 * FK) - 4; y += 2) for (let x = 4; x < FW - 4; x += 2) {
    const i = 4 * (y * FW + x), v = nl(i); if (v < 70) continue;
    let s = 0; for (const [ox, oy] of [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [3, 3], [-3, 3], [3, -3]]) s += nl(4 * ((y + oy) * FW + x + ox));
    if (v > s / 8 + 22 && !(x > 1330 * FK && y < 380 * FK)) cand.push([x / FK, y / FK, v - s / 8]);
  }
  cand.sort((a, b) => b[2] - a[2]);
  const estrelas = [];
  for (const c of cand) { if (estrelas.length >= 70) break; if (estrelas.every(e => Math.hypot(e[0] - c[0], e[1] - c[1]) > 18)) estrelas.push(c); }
  return { semSol: c1, crep: c2, noite: c3, lua: fazLua(), frente: cf2, agua: { c: ca, x: ax0 / FK, y: ay0 / FK, w: aw / FK, h: ah / FK }, estrelas };
}

// ---------- a virada: a foto entra a partir do sol, como tinta molhada se espalhando ----------
const VIRA = (() => {
  const w = 480, h = 270, f = new Float32Array(w * h);
  let lo = 1e9, hi = -1e9;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = .72 * Math.hypot(x * 4 - SOL0[0], (y * 4 - SOL0[1]) * 1.15) / 1500 + .28 * fbm(x * .022, y * .022, 31);
    f[y * w + x] = v; lo = Math.min(lo, v); hi = Math.max(hi, v);
  }
  for (let i = 0; i < f.length; i++) f[i] = (f[i] - lo) / (hi - lo);
  const m = tela(w, h), g = tela(w, h);
  return { w, h, f, m, mi: m.getContext('2d').createImageData(w, h), g, gi: g.getContext('2d').createImageData(w, h) };
})();
function mascaraVirada(k) {
  const e = .08, kk = k * (1 + e), { f, mi, gi } = VIRA;
  for (let i = 0; i < f.length; i++) {
    mi.data[4 * i + 3] = clamp01((kk - f[i]) / e) * 255;
    const bd = (kk - e / 2 - f[i]) / .05;
    gi.data[4 * i] = 255; gi.data[4 * i + 1] = 226; gi.data[4 * i + 2] = 180; gi.data[4 * i + 3] = Math.exp(-bd * bd) * 120 * (1 - k);
  }
  VIRA.m.getContext('2d').putImageData(mi, 0, 0); VIRA.g.getContext('2d').putImageData(gi, 0, 0);
}

// ---------- a cena real num instante ----------
function cenaReal(t) {
  const P = PREP, u = seg(t, 18.0, 28.0), z = 1 + .055 * u ** 1.25, dx = -24 * u * u * (3 - 2 * u);
  rc.setTransform(1, 0, 0, 1, 0, 0); rc.globalAlpha = 1; rc.globalCompositeOperation = 'source-over'; rc.filter = 'none';
  rc.setTransform(z, 0, 0, z, W / 2 * (1 - z) + dx, H / 2 * (1 - z));
  rc.drawImage(P.semSol, 0, 0, W, H);
  // o sol desce, esquenta e some atrás da serra
  const ks = seg(t, 18.6, 24.0, sine), sx = SOL0[0] + 14 * ks, sy = SOL0[1] + 310 * ks ** 1.2;
  const quente = [lerp(255, 255, ks), lerp(248, 178, ks), lerp(205, 105, ks)], forca = 1 - .55 * ks;
  let g = rc.createRadialGradient(sx, sy, 0, sx, sy, SOL_R + 3);
  g.addColorStop(0, `rgb(${quente.map(v => Math.min(255, v + 6))})`); g.addColorStop(.86, `rgb(${quente})`); g.addColorStop(1, `rgba(${quente},0)`);
  rc.fillStyle = g; rc.beginPath(); rc.arc(sx, sy, SOL_R + 3, 0, 7); rc.fill();
  rc.drawImage(P.frente, 0, 0, W, H);
  // o reflexo do sol na água some junto com ele
  const kr = seg(ks, .3, .85, sine); if (kr > 0) { rc.globalAlpha = kr; rc.drawImage(P.agua.c, P.agua.x, P.agua.y, P.agua.w, P.agua.h); rc.globalAlpha = 1; }
  // o brilho do sol, por cima de tudo (a luz espalha na névoa e nos picos)
  rc.globalCompositeOperation = 'screen';
  g = rc.createRadialGradient(sx, sy, SOL_R * .8, sx, sy, 470);
  g.addColorStop(0, `rgba(${quente},${.36 * forca})`); g.addColorStop(.35, `rgba(${quente},${.13 * forca})`); g.addColorStop(1, `rgba(${quente},0)`);
  rc.fillStyle = g; rc.fillRect(sx - 470, sy - 470, 940, 940);
  g = rc.createRadialGradient(sx, Math.min(sy, 470), 0, sx, Math.min(sy, 470), 380);
  g.addColorStop(0, `rgba(${quente},${.22 * forca * (1 - seg(t, 22.4, 24.0))})`); g.addColorStop(1, `rgba(${quente},0)`);
  rc.fillStyle = g; rc.fillRect(sx - 380, 90, 760, 760);
  rc.globalCompositeOperation = 'source-over';
  // crepúsculo e noite
  const w2 = seg(t, 21.8, 24.2, sine), w3 = seg(t, 24.0, 26.6, sine);
  if (w2 > 0) { rc.globalAlpha = w2; rc.drawImage(P.crep, 0, 0, W, H); }
  if (w3 > 0) { rc.globalAlpha = w3; rc.drawImage(P.noite, 0, 0, W, H); }
  rc.globalAlpha = 1;
  lua3(t, w3);
  // as luzes da vila respiram e as estrelas piscam
  const luz = .45 * w2 * (1 - w3) + .7 * w3;
  if (luz > 0) {
    const fl = .85 + .15 * vnoise1(t * 6, 3), fl2 = .8 + .2 * vnoise1(t * 9, 7);
    rc.globalCompositeOperation = 'screen';
    for (const [x, y, rr, a] of [[380, 765, 95, .32 * fl], [380, 850, 70, .16 * fl]]) {
      g = rc.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, `rgba(255,170,95,${a * luz})`); g.addColorStop(1, 'rgba(255,170,95,0)'); rc.fillStyle = g; rc.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
    }
    rc.globalCompositeOperation = 'source-over';
  }
  homem(t, w2, w3);
  if (w3 > 0) {
    rc.globalCompositeOperation = 'lighter';
    P.estrelas.forEach(([x, y], i) => {
      const b = w3 * (.5 + .5 * Math.sin(t * (1.6 + (i % 5) * .35) + i * 2.1)) ** 2 * .55;
      g = rc.createRadialGradient(x, y, 0, x, y, 3.2); g.addColorStop(0, `rgba(225,232,255,${b})`); g.addColorStop(1, 'rgba(225,232,255,0)'); rc.fillStyle = g; rc.fillRect(x - 4, y - 4, 8, 8);
    });
    rc.globalCompositeOperation = 'source-over';
  }
}

// ---------- a lua cheia da noite, ao lado do galho (onde a lua do nanquim morava) ----------
const LUA_P = [1192, 252], LUA_RR = 58;
function fazLua() { // textura feita uma vez: mares escuros, borda mais escura, contorno macio
  const k = 2, S = (LUA_RR + 3) * 2 * k, c = tela(S, S), x = c.getContext('2d'), im = x.createImageData(S, S), d = im.data;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = (i + .5) / k - S / 2 / k, dy = (j + .5) / k - S / 2 / k, r = Math.hypot(dx, dy) / LUA_RR, o = 4 * (j * S + i);
    const a = clamp01((1.004 - r) * LUA_RR * .9); if (a <= 0) continue;
    const borda = .8 + .2 * Math.sqrt(Math.max(0, 1 - r * r));
    const mar = Math.max(0, fbm(dx * .045 + 3.1, dy * .045 + 7.3, 41, 4) - .5) * 1.25 + Math.max(0, fbm(dx * .02 - 2, dy * .02 + 4, 43, 3) - .56) * .9;
    const grao = (hash2(i, j) - .5) * .035, v = borda * (1 - mar * .38) + grao;
    d[o] = 246 * v; d[o + 1] = 243 * v; d[o + 2] = 230 * v; d[o + 3] = 255 * a;
  }
  x.putImageData(im, 0, 0); return c;
}
function lua3(t, w3) {
  const a = seg(t, 24.6, 26.9, sine) * w3; if (a <= 0) return;
  const [x, y0] = LUA_P, y = y0 + 10 * (1 - a), P = PREP;
  rc.save(); rc.globalCompositeOperation = 'screen';
  let g = rc.createRadialGradient(x, y, LUA_RR * .9, x, y, 300);
  g.addColorStop(0, `rgba(196,210,240,${.34 * a})`); g.addColorStop(.3, `rgba(170,188,228,${.12 * a})`); g.addColorStop(1, 'rgba(170,188,228,0)');
  rc.fillStyle = g; rc.fillRect(x - 300, y - 300, 600, 600);
  rc.restore();
  rc.save(); rc.globalAlpha = a; rc.drawImage(P.lua, x - LUA_RR - 3, y - LUA_RR - 3, 2 * (LUA_RR + 3), 2 * (LUA_RR + 3)); rc.restore();
  // o rastro da lua na água: tracinhos de luz que tremem
  rc.save(); rc.globalCompositeOperation = 'screen';
  for (let i = 0; i < 44; i++) {
    const yy = 834 + i * 5.6, f = 1 - i / 52, w = (40 - i * .4) * (.45 + .9 * vnoise1(i * 1.3 + t * 2.2, 51)), al = .8 * f * a * (.45 + .55 * vnoise1(i * 2.1 - t * 3.1, 53));
    const xx = x + (vnoise1(i * .7 + t * 1.4, 55) - .5) * 8;
    g = rc.createRadialGradient(xx, yy, 0, xx, yy, w); g.addColorStop(0, `rgba(222,230,248,${al})`); g.addColorStop(1, 'rgba(222,230,248,0)');
    rc.fillStyle = g; rc.save(); rc.translate(xx, yy); rc.scale(1, .11); rc.translate(-xx, -yy); rc.fillRect(xx - w, yy - w, 2 * w, 2 * w); rc.restore();
  }
  rc.restore();
}

// ---------- o homem do lampião: sai da casa, desce para a margem e para com a lanterna ----------
// caixas (px do quadro) onde o homem parado e o reflexo dele estavam nas fotos
const HOMEM_FOTO = [[724, 764, 776, 816], [724, 816, 776, 924]];
// remenda uma caixa ligando, linha a linha, as cores das bordas (névoa, margem e água correm na horizontal)
function remenda(c, x0, y0, x1, y1) {
  const X0 = Math.floor(x0 * FK) - 3, Y0 = Math.floor(y0 * FK), w = Math.ceil(x1 * FK) - X0 + 3, h = Math.ceil(y1 * FK) - Y0;
  const im = c.getImageData(X0, Y0, w, h), d = im.data;
  for (let y = 0; y < h; y++) {
    const E = [0, 1, 2].map(k => (d[4 * (y * w) + k] + d[4 * (y * w + 1) + k] + d[4 * (y * w + 2) + k]) / 3);
    const D = [0, 1, 2].map(k => (d[4 * (y * w + w - 1) + k] + d[4 * (y * w + w - 2) + k] + d[4 * (y * w + w - 3) + k]) / 3);
    for (let x = 3; x < w - 3; x++) { const f = (x - 3) / (w - 7), i = 4 * (y * w + x), nz = (hash2(x + X0, y + Y0) - .5) * 3; for (let k = 0; k < 3; k++) d[i + k] = lerp(E[k], D[k], f) + nz; }
  }
  c.putImageData(im, X0, Y0);
}
// o caminho dos pés: da ponta da varanda, desce para a margem e anda até o lugar dele
const CAMINHO = (() => {
  const pts = [[446, 789], [455, 792], [463, 802], [478, 807], [540, 808], [620, 809], [700, 809], [742, 809]], C = [0];
  for (let i = 1; i < pts.length; i++) C.push(C[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, C, L: C[C.length - 1] };
})();
const T_SAI = 19.2, T_ANDA0 = 19.5, T_CHEGA = 24.8, ESPELHO = 820;
function noCaminho(s) {
  const { pts, C } = CAMINHO; let i = 1; while (i < C.length - 1 && C[i] < s) i++;
  const f = clamp01((s - C[i - 1]) / (C[i] - C[i - 1])); return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
}
// a figura, com os pés em (0, 0): chapéu de palha, túnica, pernas que andam, braço com a vara e a lanterna pendurada
function figura(c, fase, passo, balanco, cor, aceso) {
  const s = passo * Math.sin(fase) * 3.2, inc = .05 * passo;
  c.fillStyle = cor; c.strokeStyle = cor; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = 2.1; c.beginPath(); c.moveTo(-.4, -11); c.lineTo(-.4 + s, -.3); c.moveTo(.6, -11); c.lineTo(.6 - s, -.3); c.stroke();
  c.save(); c.rotate(inc);
  c.beginPath(); c.moveTo(-3.6, -24.5); c.lineTo(3.4, -24.5); c.lineTo(6.2, -9); c.quadraticCurveTo(0, -7.8, -6.4, -9); c.closePath(); c.fill();
  c.beginPath(); c.arc(.4, -27.3, 2.7, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-8.6, -28.2); c.quadraticCurveTo(0, -36.2, 9.2, -28.2); c.quadraticCurveTo(.3, -29.6, -8.6, -28.2); c.fill();
  c.lineWidth = 1.6; c.beginPath(); c.moveTo(2.5, -22.5); c.lineTo(9.5, -18.8); c.stroke();
  c.lineWidth = .9; c.beginPath(); c.moveTo(9.5, -18.8); c.lineTo(13, -19.6); c.stroke();
  const lx = 13 + Math.sin(balanco) * 5.5, ly = -19.6 + Math.cos(balanco) * 5.5;
  c.lineWidth = .6; c.beginPath(); c.moveTo(13, -19.6); c.lineTo(lx, ly); c.stroke();
  c.fillStyle = `rgb(${lerp(178, 255, aceso)},${lerp(62, 168, aceso)},${lerp(42, 96, aceso)})`;
  c.beginPath(); c.ellipse(lx, ly + 3.6, 2.9, 3.8, balanco * .5, 0, 7); c.fill();
  c.restore();
  return [lx + Math.sin(inc) * 4, ly + 3.6];
}
function homem(t, w2, w3) {
  const a = seg(t, T_SAI, T_SAI + .5, sine); if (a <= 0) return;
  // anda com velocidade de gente: acelera ao sair, freia ao chegar
  const u = seg(t, T_ANDA0, T_CHEGA), s = CAMINHO.L * (u < .12 ? .06 * (u / .12) ** 2 : u > .88 ? 1 - .06 * ((1 - u) / .12) ** 2 : .06 + (u - .12) * (.88 / .76));
  const [x, y] = noCaminho(s), anda = Math.min(1, u / .08, (1 - u) / .08) * (t > T_ANDA0 && t < T_CHEGA ? 1 : 0);
  const fase = s / 9 * Math.PI, pa = t - T_CHEGA;
  const balanco = anda > 0 ? .3 * Math.sin(fase) * anda : pa > 0 ? .25 * Math.exp(-pa * 1.4) * Math.sin(pa * 6) : 0;
  const cor = [[70, 58, 50], [48, 42, 48], [22, 26, 38]].reduce((c, k, i) => i === 0 ? k : c.map((v, j) => lerp(v, k[j], i === 1 ? w2 : w3)), null);
  const aceso = clamp01(.12 * w2 + w3) * (.88 + .12 * vnoise1(t * 9, 7));
  const bob = -Math.abs(Math.sin(fase)) * .8 * anda;
  // reflexo na água, mais fraco e borrado
  rc.save(); rc.globalAlpha = a * .3; rc.filter = 'blur(1px)'; rc.translate(x, 2 * ESPELHO - y - bob); rc.scale(1, -.92);
  figura(rc, fase, anda, balanco, `rgb(${cor})`, aceso); rc.restore();
  rc.save(); rc.globalAlpha = a; rc.translate(x, y + bob);
  const [lx, ly] = figura(rc, fase, anda, balanco, `rgb(${cor})`, aceso); rc.restore();
  // a luz da lanterna e o rastro dela na água
  if (aceso > .02) {
    const X = x + lx, Y = y + bob + ly;
    rc.save(); rc.globalCompositeOperation = 'screen';
    let g = rc.createRadialGradient(X, Y, 0, X, Y, 26); g.addColorStop(0, `rgba(255,165,90,${.6 * aceso * a})`); g.addColorStop(1, 'rgba(255,165,90,0)'); rc.fillStyle = g; rc.fillRect(X - 26, Y - 26, 52, 52);
    rc.translate(X, 2 * ESPELHO - Y + 18); rc.scale(1, 5);
    g = rc.createRadialGradient(0, 0, 0, 0, 0, 9); g.addColorStop(0, `rgba(255,160,85,${.4 * aceso * a})`); g.addColorStop(1, 'rgba(255,160,85,0)'); rc.fillStyle = g; rc.fillRect(-9, -9, 18, 18);
    rc.restore();
  }
}

// ---------- o quadro ----------
function render(t) {
  if (t < T_VIRA1) renderTinta(t);
  if (t < T_VIRA0) return;
  PREP = PREP || preparo(); if (!PREP) return;
  cenaReal(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  if (t < T_VIRA1) {
    const k = seg(t, T_VIRA0, T_VIRA1, p2io); mascaraVirada(k);
    rc.setTransform(1, 0, 0, 1, 0, 0); rc.globalCompositeOperation = 'destination-in'; rc.drawImage(VIRA.m, 0, 0, W, H); rc.globalCompositeOperation = 'source-over';
    ctx.drawImage(RC, 0, 0);
    ctx.globalCompositeOperation = 'screen'; ctx.drawImage(VIRA.g, 0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  } else ctx.drawImage(RC, 0, 0);
  // os pássaros e as pétalas continuam (sobre a foto)
  ctx.setTransform(U, 0, 0, U, 0, 0); passaros(t); petalas(t, 1 - .75 * seg(t, 24.0, 26.6, sine)); // à noite as pétalas somem no escuro
}

const p = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(p, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(p.t) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
render(0);
