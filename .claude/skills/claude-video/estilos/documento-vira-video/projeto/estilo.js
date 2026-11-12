// Estilo modelado "Documento vira vídeo": papel desenhado à mão, um portal no ponto final do documento, a viagem por
// um mundo noturno (estrela, feixe, prisma, espectro, fitas de filme) e a volta ao papel com o documento virado vídeo.
// Módulo ES solto, sem imports: o app importa este arquivo direto. Determinístico: tudo depende só de t, theme, w e h.
const LOOP = 5;
const PALAVRA = "transforme isso em vídeo";
const CORTE_IDA = 1.4; // corte duro: papel -> noite
const CORTE_VOLTA = 3.35; // corte duro: noite -> papel
const S_MAX = 150; // zoom no portal no instante do corte

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (x, a, b) => clamp((x - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const suave = (x) => x * x * (3 - 2 * x);
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const inCubic = (x) => x * x * x;
const outBack = (x, s = 1.7) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const TAU = Math.PI * 2;
const hash = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const sgn = (i) => hash(i) * 2 - 1;

const rgbDe = (cor) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((cor || "").trim());
  if (!m) return [128, 128, 128];
  const h = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (cor, a = 1) => {
  const [r, g, b] = Array.isArray(cor) ? cor : rgbDe(cor);
  return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
};
// interpolação de matiz (HSL): o espectro nasce só das duas cores do tema
const hsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2, d = M - m;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};
const rgbDeHsl = ([h, s, l]) => {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const hh = ((h % 360) + 360) % 360;
  const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};
const matiz = (a, b, k) => {
  const p = hsl(rgbDe(a)), q = hsl(rgbDe(b));
  // o caminho longo do círculo de matizes: passa pelas cores intermediárias e dá um espectro de verdade
  let dh = q[0] - p[0];
  if (Math.abs(dh) < 180) dh = dh > 0 ? dh - 360 : dh + 360;
  return rgbDeHsl([p[0] + dh * k, clamp(lerp(p[1], q[1], k), 0.6, 0.8), clamp(lerp(p[2], q[2], k), 0.45, 0.56)]);
};
const mix = (a, b, k) => {
  const p = Array.isArray(a) ? a : rgbDe(a);
  const q = Array.isArray(b) ? b : rgbDe(b);
  return [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2], q[2], k)];
};

// ---------- caches (chave inclui o tamanho e as cores) ----------
const cache = new Map();
const guardar = (chave, fazer) => {
  if (!cache.has(chave)) {
    if (cache.size > 24) cache.clear();
    cache.set(chave, fazer());
  }
  return cache.get(chave);
};
const novaTela = (w, h) => {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
// papel: manchas suaves de baixa frequência sobre a cor de papel (ink), num buffer pequeno ampliado
const texturaPapel = (th) =>
  guardar(`papel|${th.ink}|${th.bg}`, () => {
    const W = 192, H = 192;
    const c = novaTela(W, H);
    const x = c.getContext("2d");
    const img = x.createImageData(W, H);
    const base = rgbDe(th.ink), tinta = rgbDe(th.bg);
    const ruido = (px, py, f, s) => {
      const gx = (px / W) * f, gy = (py / H) * f;
      const x0 = Math.floor(gx), y0 = Math.floor(gy), fx = suave(gx - x0), fy = suave(gy - y0);
      const v = (i, j) => hash(((i % f) + f) % f * 71.3 + (((j % f) + f) % f) * 13.7 + s);
      return lerp(lerp(v(x0, y0), v(x0 + 1, y0), fx), lerp(v(x0, y0 + 1), v(x0 + 1, y0 + 1), fx), fy);
    };
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++) {
        const n = 0.6 * ruido(i, j, 6, 1) + 0.3 * ruido(i, j, 13, 2) + 0.1 * ruido(i, j, 48, 3);
        const k = clamp((n - 0.35) * 0.16, 0, 0.09);
        const o = (j * W + i) * 4;
        img.data[o] = lerp(base[0], tinta[0], k);
        img.data[o + 1] = lerp(base[1], tinta[1], k);
        img.data[o + 2] = lerp(base[2], tinta[2], k);
        img.data[o + 3] = 255;
      }
    x.putImageData(img, 0, 0);
    return c;
  });
const rascunho = (w, h) => guardar(`rascunho|${w}x${h}`, () => novaTela(w, h));

// ---------- geometria do mundo de papel (em px de tela, câmera em escala 1) ----------
const layout = (w, h) => {
  const retrato = h > w * 1.2;
  const u = Math.min(w, h) * (retrato ? 1.4 : 1), cx = w / 2, cy = h / 2;
  const chao = cy + u * (retrato ? 0.22 : 0.27);
  const docW = u * 0.25, docH = u * 0.33;
  const docX = cx + u * (retrato ? 0.1 : 0.2);
  const doc = { x0: docX - docW / 2, x1: docX + docW / 2, y0: chao - docH, y1: chao, dobra: u * 0.045 };
  const ponto = [docX + u * 0.02, chao - u * 0.045];
  const mascote = [cx - u * (retrato ? 0.23 : 0.34), chao];
  const titulo = [cx, doc.y0 - u * (retrato ? 0.2 : 0.13)];
  return { u, cx, cy, chao, doc, ponto, mascote, titulo, retrato };
};
const tremor = (pts, amp, semente) => pts.map((p, i) => [p[0] + sgn(semente + i * 3.1) * amp, p[1] + sgn(semente + i * 7.7 + 0.5) * amp]);
const caminho = (ctx, pts, fechar = false) => {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (fechar) ctx.closePath();
};
const capsula = (ctx, x, y, w, h, r = h / 2) => {
  const q = Math.max(0, Math.min(r, Math.abs(w) / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.arcTo(x + w, y, x + w, y + h, q);
  ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q);
  ctx.arcTo(x, y, x + w, y, q);
  ctx.closePath();
};
const estrela = (ctx, x, y, r, k = 0.16, rot = 0) => {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * TAU) / 4, b = a + TAU / 8, c = a + TAU / 4;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.quadraticCurveTo(x + Math.cos(b) * r * k, y + Math.sin(b) * r * k, x + Math.cos(c) * r, y + Math.sin(c) * r);
  }
  ctx.closePath();
};
const subdividir = (pts, n) => {
  const o = [];
  for (let i = 0; i < pts.length - 1; i++)
    for (let k = 0; k < n; k++) o.push([lerp(pts[i][0], pts[i + 1][0], k / n), lerp(pts[i][1], pts[i + 1][1], k / n)]);
  o.push(pts[pts.length - 1]);
  return o;
};

// ---------- peças do papel ----------
const documento = (g, L, bk, sx = 1) => {
  const { ctx, th } = g;
  const { x0, x1, y0, y1, dobra } = L.doc;
  const u = L.u, mx = (x0 + x1) / 2;
  ctx.save();
  ctx.translate(mx, 0);
  ctx.scale(Math.max(0.001, sx), 1);
  ctx.translate(-mx, 0);
  const pts = tremor(subdividir([[x0, y0], [x1 - dobra, y0], [x1, y0 + dobra], [x1, y1], [x0, y1], [x0, y0]], 4), u * 0.0012, bk * 5.3);
  ctx.fillStyle = rgba(mix(th.ink, "#ffffff", 0.35));
  caminho(ctx, pts, true);
  ctx.fill();
  const linhas = [[0.1, 0.55, 0.14, 1.6], [0.1, 0.9, 0.27], [0.1, 0.9, 0.34], [0.1, 0.62, 0.41], [0.1, 0.9, 0.53], [0.1, 0.84, 0.6], [0.1, 0.9, 0.67], [0.1, 0.58, 0.79]];
  ctx.lineCap = "round";
  linhas.forEach((l, i) => {
    ctx.strokeStyle = rgba(mix(th.ink, th.bg, i === 0 ? 0.5 : 0.36));
    ctx.lineWidth = u * 0.011 * (l[3] || 1);
    const y = lerp(y0, y1, l[2]) + sgn(bk * 2.1 + i) * u * 0.0006;
    ctx.beginPath();
    ctx.moveTo(lerp(x0, x1, l[0]), y);
    ctx.lineTo(lerp(x0, x1, l[1]), y);
    ctx.stroke();
  });
  ctx.fillStyle = rgba(mix(th.ink, th.bg, 0.14));
  ctx.beginPath();
  ctx.moveTo(x1 - dobra, y0);
  ctx.lineTo(x1 - dobra, y0 + dobra);
  ctx.lineTo(x1, y0 + dobra);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = th.bg;
  ctx.lineWidth = u * 0.0052;
  ctx.lineJoin = "round";
  caminho(ctx, pts, true);
  ctx.stroke();
  ctx.lineWidth = u * 0.0035;
  caminho(ctx, [[x1 - dobra, y0], [x1 - dobra, y0 + dobra], [x1, y0 + dobra]]);
  ctx.stroke();
  ctx.restore();
};
const cartao = (g, L, bk, sx, progresso) => {
  const { ctx, th } = g;
  const u = L.u, mx = (L.doc.x0 + L.doc.x1) / 2;
  const cw = u * 0.42, ch = u * 0.26, x0 = mx - cw / 2, y1 = L.chao, y0 = y1 - ch;
  ctx.save();
  ctx.translate(mx, 0);
  ctx.scale(Math.max(0.001, sx), 1);
  ctx.translate(-mx, 0);
  ctx.fillStyle = rgba(mix(th.ink, "#ffffff", 0.45));
  capsula(ctx, x0, y0, cw, ch, u * 0.016);
  ctx.fill();
  // a "cena" do vídeo: monte, sol e uma fita, nas cores do tema
  ctx.save();
  capsula(ctx, x0, y0, cw, ch, u * 0.016);
  ctx.clip();
  ctx.fillStyle = rgba(th.accent, 0.95);
  ctx.beginPath();
  ctx.arc(mx + cw * 0.18, y0 + ch * 0.33, ch * 0.13, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(mix(th.accent2, th.ink, 0.25));
  ctx.beginPath();
  ctx.moveTo(x0 - u * 0.01, y1 - ch * 0.2);
  ctx.quadraticCurveTo(mx - cw * 0.1, y0 + ch * 0.28, mx + cw * 0.25, y1 - ch * 0.24);
  ctx.quadraticCurveTo(mx + cw * 0.38, y1 - ch * 0.3, x0 + cw + u * 0.01, y1 - ch * 0.28);
  ctx.lineTo(x0 + cw + u * 0.01, y1);
  ctx.lineTo(x0 - u * 0.01, y1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = th.bg;
  ctx.lineWidth = u * 0.004;
  ctx.stroke();
  ctx.restore();
  // barra de progresso
  const bx = x0 + cw * 0.08, bw = cw * 0.84, by = y1 - ch * 0.1;
  ctx.fillStyle = rgba(th.bg, 0.16);
  capsula(ctx, bx, by - u * 0.005, bw, u * 0.01);
  ctx.fill();
  ctx.fillStyle = th.accent;
  capsula(ctx, bx, by - u * 0.005, bw * progresso, u * 0.01);
  ctx.fill();
  ctx.fillStyle = rgba(mix(th.ink, "#ffffff", 0.45));
  ctx.strokeStyle = th.bg;
  ctx.lineWidth = u * 0.004;
  ctx.beginPath();
  ctx.arc(bx + bw * progresso, by, u * 0.012, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // contorno à mão
  const pts = tremor(subdividir([[x0, y0], [x0 + cw, y0], [x0 + cw, y1], [x0, y1], [x0, y0]], 5), u * 0.0012, bk * 4.1 + 9);
  ctx.lineWidth = u * 0.0052;
  ctx.lineJoin = "round";
  caminho(ctx, pts, true);
  ctx.stroke();
  ctx.restore();
};
const mascote = (g, L, T) => {
  const { ctx, th } = g;
  const u = L.u;
  let pulo = 0, sx = 1, sy = 1, rot = 0.05 * Math.sin((T * TAU) / 1.25);
  sy = 1 + 0.025 * Math.sin((T * TAU) / 0.625);
  sx = 2 - sy;
  const salto = (a, b, alt) => {
    if (T > a - 0.08 && T < a) { const q = seg(T, a - 0.08, a); sy = 1 - 0.14 * q; sx = 1 + 0.1 * q; }
    else if (T >= a && T <= b) { const k = seg(T, a, b); pulo = Math.sin(k * Math.PI) * alt * u; rot = Math.sin(k * TAU) * 0.35; sy = 1 + 0.1 * Math.sin(k * Math.PI); sx = 2 - sy; }
    else if (T > b && T < b + 0.2) { const q = seg(T, b, b + 0.2); const v = Math.exp(-q * 4) * Math.cos(q * 14); sy = 1 - 0.12 * v; sx = 1 + 0.1 * v; }
  };
  salto(0.18, 0.5, 0.09);
  salto(4.16, 4.5, 0.13);
  // sugado pelo portal
  const puxa = seg(T, 0.6, 1.2) * (T < CORTE_IDA ? 1 : 0) + (T > CORTE_VOLTA ? 1 - seg(T, 3.5, 3.95) : 0) * (T < 3.95 ? 1 : 0);
  rot += puxa * (0.22 + 0.06 * Math.sin(T * 40));
  sx *= 1 + 0.12 * puxa;
  const [mx, my] = L.mascote;
  const s = u * 0.15;
  ctx.fillStyle = rgba(th.bg, 0.12 * (1 - pulo / (u * 0.2)));
  ctx.beginPath();
  ctx.ellipse(mx, my + u * 0.004, s * 0.55, u * 0.008, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(mx + puxa * u * 0.02, my - pulo);
  ctx.rotate(rot);
  ctx.scale(sx, sy);
  // pernas
  ctx.fillStyle = rgba(mix(th.accent, th.bg, 0.12));
  for (let i = 0; i < 4; i++) {
    const lx = (-0.3 + i * 0.2) * s;
    capsula(ctx, lx - s * 0.06, -s * 0.2, s * 0.12, s * 0.2 + Math.max(0, Math.sin(T * 9 + i * 1.7)) * (pulo > 0 ? s * 0.03 : 0), s * 0.06);
    ctx.fill();
  }
  // corpo: triângulo de cantos redondos
  ctx.fillStyle = th.accent;
  const a = [0, -s * 0.95], b = [s * 0.55, -s * 0.16], c = [-s * 0.55, -s * 0.16];
  ctx.beginPath();
  ctx.moveTo((a[0] + c[0]) / 2, (a[1] + c[1]) / 2);
  ctx.arcTo(a[0], a[1], b[0], b[1], s * 0.18);
  ctx.arcTo(b[0], b[1], c[0], c[1], s * 0.12);
  ctx.arcTo(c[0], c[1], a[0], a[1], s * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(mix(th.accent, "#ffffff", 0.3), 0.5);
  ctx.beginPath();
  ctx.ellipse(-s * 0.08, -s * 0.66, s * 0.08, s * 0.035, -0.6, 0, TAU);
  ctx.fill();
  // olhos (piscam) e sorriso
  const pisca = [1.0, 2.6, 4.7].some((p) => T > p && T < p + 0.1);
  ctx.fillStyle = th.bg;
  [-1, 1].forEach((d) => {
    ctx.beginPath();
    if (pisca) ctx.ellipse(d * s * 0.15, -s * 0.42, s * 0.05, s * 0.012, 0, 0, TAU);
    else ctx.arc(d * s * 0.15, -s * 0.42, s * 0.04, 0, TAU);
    ctx.fill();
  });
  ctx.strokeStyle = th.accent2;
  ctx.lineWidth = s * 0.045;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, -s * 0.36, s * 0.1, 0.35, Math.PI - 0.35);
  ctx.stroke();
  ctx.restore();
};
const tituloEseta = (g, L, bk) => {
  const { ctx, th, nome, w } = g;
  const u = L.u;
  const fonte = (p) => `italic 700 ${p}px "${th.font || "Inter"}", "Helvetica Neue", Arial, sans-serif`;
  const largMax = Math.min(w * 0.84, u * 1.1);
  ctx.font = fonte(100);
  // uma linha, ou duas quando a frase não cabe grande (telas em pé)
  let linhas = [nome];
  let px = Math.min(u * 0.1, (100 * largMax) / (ctx.measureText(nome).width || 1));
  const palavras = nome.split(" ");
  if (px < u * 0.07 && palavras.length > 1) {
    let melhor = null;
    for (let i = 1; i < palavras.length; i++) {
      const l = [palavras.slice(0, i).join(" "), palavras.slice(i).join(" ")];
      const m = Math.max(...l.map((x) => ctx.measureText(x).width));
      if (!melhor || m < melhor[0]) melhor = [m, l];
    }
    linhas = melhor[1];
    px = Math.min(u * 0.1, (100 * largMax) / (melhor[0] || 1));
  }
  ctx.font = fonte(px);
  ctx.fillStyle = th.bg;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const [tx, tyBase] = L.titulo;
  const ty = tyBase;
  linhas.forEach((l, i) => ctx.fillText(l, tx + sgn(bk) * u * 0.0007, ty - (linhas.length - 1 - i) * px * 1.05 + sgn(bk + 0.3) * u * 0.0007));
  const larg = Math.max(...linhas.map((x) => ctx.measureText(x).width));
  // seta desenhada à mão
  const p0 = [tx - Math.min(larg * 0.3, u * 0.16), ty + px * 0.28];
  const p3 = [L.doc.x0 - u * 0.02, lerp(L.doc.y0, L.doc.y1, 0.4)];
  const p1 = [p0[0] + u * 0.02, p0[1] + u * 0.12], p2 = [p3[0] - u * 0.12, p3[1] + u * 0.02];
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const k = i / 24, v = 1 - k;
    pts.push([v * v * v * p0[0] + 3 * v * v * k * p1[0] + 3 * v * k * k * p2[0] + k * k * k * p3[0], v * v * v * p0[1] + 3 * v * v * k * p1[1] + 3 * v * k * k * p2[1] + k * k * k * p3[1]]);
  }
  ctx.strokeStyle = th.bg;
  ctx.lineWidth = u * 0.005;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  caminho(ctx, tremor(pts, u * 0.0008, bk * 3 + 40));
  ctx.stroke();
  const a = Math.atan2(p3[1] - pts[22][1], p3[0] - pts[22][0]), r = u * 0.03;
  ctx.beginPath();
  ctx.moveTo(p3[0] + Math.cos(a + 2.55) * r, p3[1] + Math.sin(a + 2.55) * r);
  ctx.lineTo(p3[0], p3[1]);
  ctx.lineTo(p3[0] + Math.cos(a - 2.55) * r, p3[1] + Math.sin(a - 2.55) * r);
  ctx.stroke();
};
const raios = (g, x, y, dens, giro, bk) => {
  const { ctx, th, w, h } = g;
  const u = Math.min(w, h), R = Math.hypot(w, h);
  const n = Math.floor(150 * dens);
  ctx.lineCap = "butt";
  for (let i = 0; i < n; i++) {
    const id = i * 13.1 + bk * 3.3;
    const a = i * 2.39996 + sgn(id) * 0.3 + giro;
    const r0 = u * (0.06 + hash(id + 2) * 0.32), r1 = r0 + u * 0.15 + hash(id + 3) * R;
    ctx.lineWidth = u * (0.0006 + hash(id + 4) * 0.0014);
    ctx.strokeStyle = rgba(th.bg, 0.2 + hash(id + 5) * 0.45);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    ctx.stroke();
  }
};
// miniatura do mundo noturno dentro do portal (em px de tela)
const miolo = (g, x, y, r, T) => {
  const { ctx, th } = g;
  ctx.fillStyle = th.bg;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.clip();
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(mix(th.bg, th.accent, 0.4)));
  gr.addColorStop(1, rgba(th.bg));
  ctx.fillStyle = gr;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  [th.accent, th.accent2, th.ink].forEach((c, i) => {
    ctx.strokeStyle = rgba(c, 0.7);
    ctx.lineWidth = Math.max(0.6, r * 0.012);
    ctx.beginPath();
    ctx.ellipse(x, y, r * (0.5 + i * 0.15), r * (0.22 + i * 0.12), 0.4 + i * 0.9 + T * 0.3, 0, TAU);
    ctx.stroke();
  });
  ctx.fillStyle = rgba(mix(th.ink, th.accent2, 0.15), 0.35);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.18, 0, TAU);
  ctx.fill();
  ctx.fillStyle = th.ink;
  estrela(ctx, x, y, r * 0.09);
  ctx.fill();
  ctx.restore();
};

// câmera do papel: escala s em torno do ponto do documento; o ponto vai para o centro conforme o zoom cresce
const camera = (T) => {
  if (T > 0.55 && T < CORTE_IDA) return Math.pow(S_MAX, Math.pow(seg(T, 0.55, CORTE_IDA), 2.2));
  if (T >= CORTE_VOLTA && T < 3.95) return Math.pow(S_MAX, Math.pow(1 - seg(T, CORTE_VOLTA, 3.95), 2.6));
  return 1;
};
const papel = (g, T) => {
  const { ctx, th, w, h } = g;
  const L = layout(w, h);
  const u = L.u;
  const bk = Math.floor(T * 12 + 1e-6);
  const s = camera(T);
  const e = suave(clamp(Math.log(s) / Math.log(9)));
  const sxp = lerp(L.ponto[0], L.cx, e), syp = lerp(L.ponto[1], L.cy, e);
  // fundo de papel
  ctx.fillStyle = rgba(mix(th.ink, "#ffffff", Math.min(0.3, (s - 1) * 0.05)));
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(sxp, syp);
  ctx.scale(s, s);
  ctx.translate(-L.ponto[0], -L.ponto[1]);
  if (s < 8) {
    ctx.globalAlpha = 1 - seg(s, 3, 8);
    ctx.drawImage(texturaPapel(th), -w * 0.1, -h * 0.1, w * 1.2, h * 1.2);
    ctx.globalAlpha = 1;
  }
  // chão
  ctx.strokeStyle = rgba(th.bg, 0.55);
  ctx.lineWidth = u * 0.0018;
  caminho(ctx, tremor(subdividir([[-w, L.chao], [w * 2, L.chao]], 24), u * 0.0007, bk * 2.2 + 400));
  ctx.stroke();
  tituloEseta(g, L, bk);
  // documento -> cartão de vídeo -> documento
  const vira = seg(T, 3.98, 4.12), abre = seg(T, 4.12, 4.3), fecha = seg(T, 4.78, 4.88), volta = seg(T, 4.88, 4.99);
  const sobe = Math.sin(Math.PI * seg(T, 3.96, 4.14)) * u * 0.015;
  ctx.fillStyle = rgba(th.bg, 0.1);
  ctx.beginPath();
  ctx.ellipse((L.doc.x0 + L.doc.x1) / 2, L.chao + u * 0.004, u * 0.15, u * 0.007, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(0, -sobe);
  if (T < 4.12) documento(g, L, bk, 1 - vira);
  else if (T < 4.88) cartao(g, L, bk, T < 4.3 ? outBack(abre, 2.2) : 1 - fecha, outCubic(seg(T, 4.32, 4.74)));
  else documento(g, L, bk, outBack(volta, 2.4));
  ctx.restore();
  // o ponto final do documento: é o portal
  const temDoc = T < 4.12 || T >= 4.88;
  if (temDoc) {
    const r = u * 0.0105;
    const anel = seg(T, 0.42, 0.62) * (1 - seg(s, 2.5, 4)) * (T < CORTE_IDA ? 1 : 0);
    if (anel > 0) {
      ctx.strokeStyle = rgba(th.bg, 0.55 * anel);
      ctx.lineWidth = u * 0.0018;
      [6, 22].forEach((k) => {
        ctx.beginPath();
        ctx.arc(L.ponto[0], L.ponto[1], r * k * anel, 0, TAU);
        ctx.stroke();
      });
    }
    ctx.fillStyle = th.bg;
    ctx.beginPath();
    ctx.arc(L.ponto[0], L.ponto[1], r, 0, TAU);
    ctx.fill();
  }
  if (s < 6) mascote(g, L, T);
  ctx.restore();
  // miolo do portal em espaço de tela, para ficar nítido em qualquer zoom
  const rTela = u * 0.0105 * s;
  if (s > 2.2) miolo(g, sxp, syp, rTela * 0.86, T);
  // raios de velocidade por cima de tudo
  const dens = T < CORTE_IDA ? seg(T, 0.5, 0.95) : 1 - seg(T, 3.5, 3.98);
  if (dens > 0) raios(g, sxp, syp, dens, T < CORTE_IDA ? 0 : 1.3, Math.floor(T * 14));
};

// ---------- mundo noturno ----------
const ceu = (g) => {
  const { ctx, th, w, h } = g;
  const u = Math.min(w, h);
  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, w, h);
  const gr = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.hypot(w, h) * 0.55);
  gr.addColorStop(0, rgba(mix(th.bg, th.accent, 0.2)));
  gr.addColorStop(1, rgba(th.bg, 0));
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = rgba(th.ink, 0.55);
  for (let i = 0; i < 70; i++) {
    const r = u * (0.0015 + hash(i + 0.7) * 0.002);
    ctx.globalAlpha = 0.35 + hash(i + 3.3) * 0.6;
    ctx.fillRect(hash(i + 1.1) * w, hash(i + 2.2) * h, r, r);
  }
  ctx.globalAlpha = 1;
};
const coresFaixas = (th) => [0, 1, 2, 3, 4, 5].map((i) => matiz(th.accent2, th.accent, i / 5));
const noite = (g, T) => {
  const { ctx, th, w, h } = g;
  const u = Math.min(w, h), cx = w / 2, cy = h / 2;
  ceu(g);
  // 1 · estrela com órbitas, cresce e explode em branco
  if (T < 1.92) {
    const z = lerp(1.15, 1.6, seg(T, CORTE_IDA, 1.86));
    [th.accent, th.accent2, mix(th.ink, th.bg, 0.4), th.accent].forEach((c, i) => {
      const a = 0.35 + i * 0.8 + (T - CORTE_IDA) * (0.4 + i * 0.15);
      const rx = u * (0.28 + i * 0.08) * z, ry = rx * (0.3 + 0.18 * Math.sin(i + T));
      ctx.strokeStyle = rgba(c, 0.85);
      ctx.lineWidth = u * 0.003;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, a, 0, TAU);
      ctx.stroke();
      const d = T * (1.6 + i * 0.4) + i * 2;
      const px = Math.cos(d) * rx, py = Math.sin(d) * ry;
      ctx.fillStyle = rgba(c);
      ctx.beginPath();
      ctx.arc(cx + px * Math.cos(a) - py * Math.sin(a), cy + px * Math.sin(a) + py * Math.cos(a), u * (0.007 + i * 0.002), 0, TAU);
      ctx.fill();
    });
    const sr = u * lerp(0.05, 0.1, seg(T, CORTE_IDA, 1.7)) * Math.pow(30, inCubic(seg(T, 1.7, 1.88)));
    const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr * 3.4);
    gl.addColorStop(0, rgba(th.ink, 0.95));
    gl.addColorStop(0.25, rgba(mix(th.ink, th.accent2, 0.35), 0.6));
    gl.addColorStop(1, rgba(th.accent2, 0));
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rgba(mix(th.ink, "#ffffff", 0.4));
    estrela(ctx, cx, cy, sr, 0.15);
    ctx.fill();
    const branco = seg(T, 1.8, 1.9);
    if (branco > 0) {
      ctx.fillStyle = rgba(mix(th.ink, "#ffffff", 0.4), branco);
      ctx.fillRect(0, 0, w, h);
    }
    if (T < 1.9) return;
  }
  // 2 · a tela branca vira feixe e encontra o prisma
  const px0 = cx - u * 0.06, py0 = cy - u * 0.02;
  const P = [[px0 - u * 0.13, py0 - u * 0.24], [px0 + u * 0.21, py0 + u * 0.02], [px0 - u * 0.13, py0 + u * 0.26]];
  const entrada = [lerp(P[0][0], P[2][0], 0.5), lerp(P[0][1], P[2][1], 0.5) - u * 0.02];
  const saida = [lerp(P[1][0], P[2][0], 0.42), lerp(P[1][1], P[2][1], 0.42)];
  const somePrisma = 1 - seg(T, 2.62, 2.78);
  const desenho = seg(T, 1.98, 2.16);
  if (desenho > 0 && somePrisma > 0) {
    ctx.save();
    ctx.globalAlpha = somePrisma;
    ctx.fillStyle = rgba(mix(th.bg, mix(th.accent, th.ink, 0.4), 0.3), 0.6 * desenho);
    caminho(ctx, P, true);
    ctx.fill();
    ctx.strokeStyle = rgba(mix(th.ink, th.accent, 0.35), 0.55);
    ctx.lineWidth = u * 0.002;
    caminho(ctx, P.map((p) => [p[0] + u * 0.025, p[1] - u * 0.02]), true);
    ctx.stroke();
    ctx.strokeStyle = th.ink;
    ctx.lineWidth = u * 0.004;
    const contorno = subdividir([...P, P[0]], 8);
    caminho(ctx, contorno.slice(0, Math.max(2, Math.ceil(contorno.length * desenho))));
    ctx.stroke();
    ctx.restore();
  }
  const encolhe = seg(T, 1.9, 2.18);
  const meia = lerp(h * 0.62, u * 0.006, 1 - Math.pow(1 - encolhe, 3)) ;
  const ponta = lerp(w * 1.15, entrada[0], outCubic(seg(T, 1.92, 2.2)));
  const inc = -0.12;
  const yb = (x) => lerp(cy, entrada[1] + (x - entrada[0]) * inc, outCubic(encolhe));
  if (somePrisma > 0) {
    ctx.save();
    ctx.globalAlpha = T < 2.6 ? 1 : somePrisma;
    ctx.fillStyle = rgba(mix(th.ink, "#ffffff", 0.4));
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, yb(-w * 0.1) - meia);
    ctx.lineTo(ponta, yb(ponta) - meia);
    ctx.lineTo(ponta, yb(ponta) + meia);
    ctx.lineTo(-w * 0.1, yb(-w * 0.1) + meia);
    ctx.closePath();
    ctx.fill();
    if (T > 2.18) {
      ctx.fillStyle = th.ink;
      estrela(ctx, entrada[0], entrada[1], u * 0.03 * seg(T, 2.18, 2.24), 0.14);
      ctx.fill();
      ctx.strokeStyle = th.ink;
      ctx.lineWidth = u * 0.004;
      const r = seg(T, 2.2, 2.28);
      ctx.beginPath();
      ctx.moveTo(entrada[0], entrada[1]);
      ctx.lineTo(lerp(entrada[0], saida[0], r), lerp(entrada[1], saida[1], r));
      ctx.stroke();
    }
    ctx.restore();
  }
  // 3 · espectro: leque que se abre e vira faixas horizontais
  if (T > 2.26) {
    const cores = coresFaixas(th);
    const abre = outCubic(seg(T, 2.27, 2.38));
    const cor = seg(T, 2.32, 2.5);
    const plano = suave(seg(T, 2.55, 2.8));
    const xd = lerp(saida[0], 0, 1) ;
    const xr = lerp(saida[0], w * 1.1, abre);
    const fh = h / 6;
    for (let i = 0; i < 6; i++) {
      const a0 = 0.07 + (i / 6) * 0.62, a1 = 0.07 + ((i + 1) / 6) * 0.62;
      const yA0 = saida[1] + Math.tan(a0) * (xr - saida[0]), yA1 = saida[1] + Math.tan(a1) * (xr - saida[0]) + 1;
      const xl = lerp(saida[0], -w * 0.05, plano);
      const yl0 = lerp(saida[1], i * fh, plano), yl1 = lerp(saida[1], (i + 1) * fh + 1, plano);
      const yr0 = lerp(yA0, i * fh, plano), yr1 = lerp(yA1, (i + 1) * fh + 1, plano);
      const c = mix(mix(th.ink, "#ffffff", 0.4), cores[i], cor);
      if (T > 2.8) {
        fitas(g, T, i, c);
        continue;
      }
      ctx.fillStyle = rgba(c);
      ctx.beginPath();
      ctx.moveTo(xl, yl0);
      ctx.lineTo(xr, yr0);
      ctx.lineTo(xr, yr1);
      ctx.lineTo(xl, yl1);
      ctx.closePath();
      ctx.fill();
    }
    if (T > 2.8) colapso(g, T);
  }
};
// 4 · as faixas viram fitas de filme: trilhos perfurados, janelas, rolagem, onda e colapso num ponto
const fitas = (g, T, i, c) => {
  const { ctx, th, w, h } = g;
  const u = Math.min(w, h), cx = w / 2, cy = h / 2;
  const fh = h / 6;
  const k = inCubic(seg(T, 3.08, 3.33));
  const esc = lerp(1, 0.02, k);
  const giro = k * 2.4;
  const onda = seg(T, 2.95, 3.1);
  const trilho = seg(T, 2.8, 2.9) * fh * 0.13;
  const janela = seg(T, 2.84, 2.98);
  const rola = (T - 2.8) * u * 1.4 + Math.pow(Math.max(0, T - 2.95), 2) * u * 9;
  const cel = fh * 1.45;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(giro);
  ctx.scale(esc, esc);
  ctx.translate(-cx, -cy);
  const y0 = i * fh + Math.sin(i * 0.9 + T * 7) * onda * fh * 0.35;
  ctx.fillStyle = rgba(c);
  ctx.fillRect(-w * 0.2, y0, w * 1.4, fh + 1);
  const desloca = ((rola * (1 + i * 0.07) + i * cel * 0.37) % cel + cel) % cel;
  if (trilho > 0.5) {
    ctx.fillStyle = rgba(th.bg, 0.9);
    ctx.fillRect(-w * 0.2, y0, w * 1.4, trilho);
    ctx.fillRect(-w * 0.2, y0 + fh - trilho, w * 1.4, trilho);
    ctx.fillStyle = rgba(mix(c, "#ffffff", 0.55));
    const passo = fh * 0.32;
    const d2 = ((rola * (1 + i * 0.07)) % passo + passo) % passo;
    for (let x = -w * 0.2 - d2; x < w * 1.2; x += passo) {
      ctx.fillRect(x, y0 + trilho * 0.3, passo * 0.5, trilho * 0.4);
      ctx.fillRect(x, y0 + fh - trilho * 0.7, passo * 0.5, trilho * 0.4);
    }
  }
  if (janela > 0) {
    const jh = fh - trilho * 2 - fh * 0.12;
    for (let x = -cel - desloca; x < w + cel; x += cel) {
      const n = Math.floor((x + desloca) / cel) + i * 7;
      const jx = x + cel * 0.06, jw = cel * 0.88, jy = y0 + trilho + fh * 0.06;
      ctx.fillStyle = rgba(mix(c, "#ffffff", 0.72), janela);
      ctx.fillRect(jx, jy, jw, jh);
      ctx.globalAlpha = janela;
      ctx.fillStyle = rgba(mix(c, th.bg, 0.35));
      const q = Math.abs(n) % 3;
      if (q === 0) { ctx.beginPath(); ctx.arc(jx + jw * 0.3, jy + jh * 0.45, jh * 0.2, 0, TAU); ctx.fill(); }
      else if (q === 1) { ctx.fillRect(jx + jw * 0.18, jy + jh * 0.3, jw * 0.64, jh * 0.12); ctx.fillRect(jx + jw * 0.18, jy + jh * 0.55, jw * 0.42, jh * 0.12); }
      else { ctx.beginPath(); ctx.moveTo(jx + jw * 0.15, jy + jh * 0.8); ctx.lineTo(jx + jw * 0.45, jy + jh * 0.25); ctx.lineTo(jx + jw * 0.75, jy + jh * 0.8); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
};
const colapso = (g, T) => {
  const { ctx, th, w, h } = g;
  const u = Math.min(w, h);
  const q = seg(T, 3.2, 3.33);
  if (q <= 0) return;
  const r = u * lerp(0.02, 0.09, q);
  const gl = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r * 3);
  gl.addColorStop(0, rgba(th.ink, 0.9 * q));
  gl.addColorStop(1, rgba(th.accent2, 0));
  ctx.fillStyle = gl;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = th.ink;
  estrela(ctx, w / 2, h / 2, r, 0.15);
  ctx.fill();
};

const cena = (g, T) => (T >= CORTE_IDA && T < CORTE_VOLTA ? noite(g, T) : papel(g, T));
// janelas com obturador (média de 4 subquadros), nunca atravessando um corte
const OBTURADOR = [[0.95, CORTE_IDA], [1.9, 2.2], [3.0, CORTE_VOLTA], [CORTE_VOLTA, 3.7]];
const AMOSTRAS = 4;

export const style = {
  id: "documento-vira-video",
  name: "Documento vira vídeo",
  modeled: true,
  tagline: "O ponto final é um portal; a volta é vídeo",
  look: "Papel creme com traço de tinta que treme a 12 quadros por segundo, um mascote simples e um documento desenhado; do outro lado do portal, um mundo noturno de estrela, prisma e fitas de filme coloridas com textura de lápis.",
  move: "Longas respirações quase paradas cortadas por mergulhos exponenciais: zoom de 1 a 150 vezes no ponto do documento em menos de um segundo, dois cortes secos, e o caminho de volta pelo mesmo portal; cerca de 55 % do filme em quase-parada.",
  rules: [
    "A câmera entra e sai pelo mesmo ponto: o ponto final do documento é o portal, e o filme é um palíndromo com uma viagem no meio.",
    "Zoom exponencial, nunca linear: a escala multiplica, de 1 a mais de 100 vezes, com o ponto indo para o centro.",
    "Todo traço de tinta treme a 12 quadros por segundo, com o filme a 60.",
    "Cada corte transforma a última forma na primeira da cena seguinte: tela branca vira feixe, feixe vira espectro, espectro vira fitas, fitas viram ponto.",
    "Borrão só nos mergulhos e nos colapsos, por média de subquadros; o quadro parado é nítido.",
    "O mascote reage a cada evento: pula na chegada da marca, inclina na sucção, pisca nas pausas.",
    "No retorno, o documento gira no próprio eixo e vira cartão de vídeo com barra de progresso.",
    "Cores e fonte são da marca: papel em ink, tinta e noite em bg, acentos só em mascote, espectro e progresso.",
  ],
  prompt: `R — Referências
Showreel feito em código, quadro a quadro: um papel creme desenhado à mão, com um mascote e um documento, uma frase manuscrita e uma seta. A câmera mergulha no ponto final do documento, atravessa um mundo noturno (estrela, feixe, prisma, espectro, fitas de filme) e volta pelo mesmo ponto, com o documento virado vídeo.
I — Ideia
• Começo (0–1,5 s): papel em {{ink}}, a frase {{name}} escrita à mão em {{bg}}, seta apontando o documento; raios de velocidade surgem e a câmera mergulha no ponto final até o corte seco para a noite.
• Meio (1,5–3,5 s): estrela com órbitas explode em branco; a tela branca encolhe e vira feixe que entra num prisma; sai um espectro em {{accent}} e {{accent2}} que vira faixas e depois fitas de filme que rolam, ondulam e colapsam num ponto de luz.
• Fim (3,5–5 s): corte seco de volta ao portal e zoom para fora; o documento gira e vira cartão de vídeo, a barra de progresso enche em {{accent}}, o mascote pula; o cartão volta a ser documento, e o quadro 0 é igual ao quadro 5.
E — Estilo
Aparência: papel {{ink}} com manchas suaves, traço de tinta {{bg}} que treme, mundo noturno em {{bg}}, acento {{accent}} (mascote, espectro, progresso), apoio {{accent2}} (órbitas, prisma, espectro), fonte {{font}} itálica e pesada para a frase manuscrita.
Movimento: respirações quase paradas e mergulhos exponenciais (escala de 1 a 150 em 0,85 s), dois cortes secos, borrão por média de subquadros só nos mergulhos; tremor de traço a 12 quadros por segundo.
Regras:
1. Entra e sai pelo mesmo ponto: o ponto final é o portal.
2. Zoom exponencial, nunca linear.
3. Traço de tinta treme a 12 quadros por segundo.
4. Cada corte transforma a última forma na primeira da cena seguinte.
5. Borrão só nos mergulhos e colapsos.
E — Examinar
Um HTML, um canvas, uma função render(t) pura. Confira os quadros em t = 0, 1,25, 2,5, 3,75 e 5 s e corrija.`,
  ref: "",
  theme: { bg: "#0f0c2c", ink: "#edeae1", accent: "#3b7bf0", accent2: "#e98a4c", font: "Inter" },
  tags: ["papel", "desenho à mão", "portal", "mascote", "zoom", "prisma", "arco-íris", "filme", "showreel", "documento"],
  word: PALAVRA,
  movimentoAlvo: {
    amplitude_min: 9.9,
    fracao_parada_min: 0.45,
    picos_por_10s_min: 1.3,
    cortes_duros_por_10s_ref: 0.9,
    amplitude_ref: 14.2,
    fracao_parada_ref: 0.55,
    duracao_ref: 32.042,
  },
  render(ctx, t, theme, w, h) {
    const T = ((t % LOOP) + LOOP) % LOOP;
    const nome = (theme && theme.name) || PALAVRA;
    const g = { ctx, w, h, th: theme, nome };
    ctx.save();
    const janela = OBTURADOR.find(([a, b]) => T >= a && T < b);
    if (janela) {
      const tela = rascunho(w, h);
      const c2 = tela.getContext("2d");
      const sh = 1 / 60;
      for (let i = 0; i < AMOSTRAS; i++) {
        const ts = clamp(T - sh + (sh * i) / (AMOSTRAS - 1), janela[0], janela[1] - 1e-4);
        c2.setTransform(1, 0, 0, 1, 0, 0);
        c2.globalAlpha = 1;
        cena({ ...g, ctx: c2 }, ts);
        ctx.globalAlpha = 1 / (i + 1);
        ctx.drawImage(tela, 0, 0);
      }
      ctx.globalAlpha = 1;
    } else {
      cena(g, T);
    }
    ctx.restore();
  },
};
