/*
 * Motor da Biblioteca de motion.
 * Tudo aqui é puro ou cache determinístico: um estilo montado com estas peças
 * continua sendo uma função pura de t. Script clássico (funciona em file://),
 * exposto em window.M.
 *
 * Contrato de um estilo: render(ctx, t, theme, w, h) desenha o frame t
 * (0..5 s) a partir de theme {bg, ink, accent, accent2, font, name?}.
 * Mesmo t, mesmo frame, em qualquer ordem; render(0) === render(5).
 */
(function () {
  "use strict";
  const M = (window.M = {});
  const LOOP = (M.LOOP = 5);
  const TAU = (M.TAU = Math.PI * 2);

  // ── números e tempo ───────────────────────────────────────────────────
  const clamp = (M.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x));
  const lerp = (M.lerp = (a, b, k) => a + (b - a) * k);
  const fract = (M.fract = (x) => x - Math.floor(x));
  M.smoothstep = (a, b, x) => {
    const k = clamp((x - a) / (b - a));
    return k * k * (3 - 2 * k);
  };
  /** Progresso de t dentro de [a, b], de 0 a 1. */
  M.seg = (t, a, b) => clamp((t - a) / (b - a));
  /** Fase do loop, 0..1 (t = 5 volta a 0). */
  M.phase = (t, period = LOOP) => fract(t / period);
  /** Seno com `cycles` voltas inteiras por loop: sempre sem emenda. */
  M.wave = (t, cycles = 1, offset = 0) => Math.sin(TAU * (cycles * (t / LOOP) + offset));
  /** Sobe em [a, b] e desce em [c, d]: um "entra, segura, sai" que fecha o loop. */
  M.pulse = (t, a, b, c, d, ease = M.ease.inOutSine) => ease(M.seg(t, a, b)) * (1 - ease(M.seg(t, c, d)));

  M.ease = {
    linear: (x) => x,
    inSine: (x) => 1 - Math.cos((x * Math.PI) / 2),
    outSine: (x) => Math.sin((x * Math.PI) / 2),
    inOutSine: (x) => 0.5 - Math.cos(Math.PI * x) / 2,
    inQuad: (x) => x * x,
    outQuad: (x) => 1 - (1 - x) * (1 - x),
    inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
    inCubic: (x) => x * x * x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQuart: (x) => 1 - Math.pow(1 - x, 4),
    inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
    outQuint: (x) => 1 - Math.pow(1 - x, 5),
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inOutExpo: (x) =>
      x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
    outBack: (x, s = 1.6) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
    inBack: (x, s = 1.6) => (s + 1) * x * x * x - s * x * x,
    /** Mola amortecida que assenta em 1. */
    outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -9 * x) * Math.sin(((x * 10 - 0.75) * TAU) / 3.2) + 1),
    outBounce: (x) => {
      const n = 7.5625;
      const d = 2.75;
      if (x < 1 / d) return n * x * x;
      if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
      if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
      return n * (x -= 2.625 / d) * x + 0.984375;
    },
  };

  // ── acaso com semente ─────────────────────────────────────────────────
  /** Hash de até três inteiros para [0, 1). Mesma entrada, mesma saída. */
  const hash = (M.hash = function (a, b = 0, c = 0) {
    let h = (Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b9)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
    h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  });
  /** Hash de texto, para sementes por estilo. */
  M.hashText = (s) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    return (h >>> 0) / 4294967296;
  };
  /** Gerador com semente (sfc32). Para montar layouts; nunca alimentado pelo tempo. */
  const rng = (M.rng = function (seed) {
    let a = 0x9e3779b9;
    let b = 0x243f6a88;
    let c = 0xb7e15162;
    let d = (seed >>> 0) ^ 0xdeadbeef;
    const next = () => {
      a |= 0; b |= 0; c |= 0; d |= 0;
      const r = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      c = (c + r) | 0;
      return (r >>> 0) / 4294967296;
    };
    for (let i = 0; i < 12; i++) next();
    return next;
  });

  // ── ruído de gradiente periódico ──────────────────────────────────────
  const fade = (x) => x * x * x * (x * (x * 6 - 15) + 10);
  const wrapI = (i, p) => (p > 0 ? ((i % p) + p) % p : i) & 255;
  // Tabela de permutação e 256 gradientes unitários, sorteados uma vez com semente.
  const P = new Uint8Array(512);
  const GX = new Float64Array(256), GY = new Float64Array(256), GZ = new Float64Array(256);
  (() => {
    const r = rng(0xc0ffee);
    const base = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    for (let i = 0; i < 512; i++) P[i] = base[i & 255];
    for (let i = 0; i < 256; i++) {
      const u = r() * 2 - 1;
      const th = r() * TAU;
      const s = Math.sqrt(1 - u * u);
      GX[i] = s * Math.cos(th);
      GY[i] = s * Math.sin(th);
      GZ[i] = u;
    }
  })();
  function gdot(ix, iy, iz, dx, dy, dz) {
    const g = P[P[P[ix] + iy] + iz];
    return GX[g] * dx + GY[g] * dy + GZ[g] * dz;
  }
  /**
   * Ruído de gradiente 3D, cerca de -1..1. Períodos inteiros fazem o eixo
   * repetir: noise3(x, y, 3 * t / 5, 0, 0, 3) morfa e fecha o loop sem emenda.
   */
  const noise3 = (M.noise3 = function (x, y, z = 0, px = 0, py = 0, pz = 0) {
    const X = Math.floor(x);
    const Y = Math.floor(y);
    const Z = Math.floor(z);
    const fx = x - X;
    const fy = y - Y;
    const fz = z - Z;
    const x0 = wrapI(X, px), x1 = wrapI(X + 1, px);
    const y0 = wrapI(Y, py), y1 = wrapI(Y + 1, py);
    const z0 = wrapI(Z, pz), z1 = wrapI(Z + 1, pz);
    const u = fade(fx), v = fade(fy), w = fade(fz);
    const a = lerp(gdot(x0, y0, z0, fx, fy, fz), gdot(x1, y0, z0, fx - 1, fy, fz), u);
    const b = lerp(gdot(x0, y1, z0, fx, fy - 1, fz), gdot(x1, y1, z0, fx - 1, fy - 1, fz), u);
    const c = lerp(gdot(x0, y0, z1, fx, fy, fz - 1), gdot(x1, y0, z1, fx - 1, fy, fz - 1), u);
    const d = lerp(gdot(x0, y1, z1, fx, fy - 1, fz - 1), gdot(x1, y1, z1, fx - 1, fy - 1, fz - 1), u);
    return lerp(lerp(a, b, v), lerp(c, d, v), w) * 1.6;
  });
  /** Ruído fractal com os mesmos períodos (cada oitava dobra, continua inteiro). */
  const fbm3 = (M.fbm3 = function (x, y, z = 0, oct = 4, px = 0, py = 0, pz = 0) {
    let s = 0, amp = 0.5, f = 1, n = 0;
    for (let o = 0; o < oct; o++) {
      s += amp * noise3(x * f, y * f, z * f, px * f, py * f, pz * f);
      n += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / n;
  });
  /** Campo que morfa `speed` períodos inteiros por loop. */
  M.loopNoise = (x, y, t, speed = 2, oct = 3) => fbm3(x, y, (speed * t) / LOOP, oct, 0, 0, speed);

  // ── cor ───────────────────────────────────────────────────────────────
  const parse = (M.parse = function (c) {
    const s = String(c || "").trim();
    let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.replace(/./g, (x) => x + x);
      const n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (m) return [+m[1], +m[2], +m[3]].map((v) => Math.max(0, Math.min(255, Math.round(v))));
    return [0, 0, 0];
  });
  const to255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const hex = (M.hex = (rgb) => "#" + rgb.map((v) => to255(v).toString(16).padStart(2, "0")).join(""));
  const rgbaMemo = new Map();
  /** "rgba(...)" de uma cor com alfa a (com cache: os estilos chamam isto todo frame). */
  const rgba = (M.rgba = function (c, a = 1) {
    const al = Math.max(0, Math.min(1, a));
    const key = c + "@" + al.toFixed(3);
    let out = rgbaMemo.get(key);
    if (!out) {
      const [r, g, b] = parse(c);
      out = `rgba(${r},${g},${b},${al.toFixed(3)})`;
      if (rgbaMemo.size > 5000) rgbaMemo.clear();
      rgbaMemo.set(key, out);
    }
    return out;
  });
  const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const gam = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055);
  const toLab = (M.toLab = function (c) {
    const [r, g, b] = parse(c).map(lin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  });
  const fromLab = (M.fromLab = function ([L, A, B]) {
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    return hex([
      gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ]);
  });
  const mixMemo = new Map();
  /** Mistura perceptual (OKLab): k = 0 dá a, k = 1 dá b. */
  M.mix = function (a, b, k) {
    k = clamp(k);
    const key = a + "|" + b + "|" + k.toFixed(3);
    let out = mixMemo.get(key);
    if (!out) {
      const A = toLab(a);
      const B = toLab(b);
      out = fromLab([lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)]);
      if (mixMemo.size > 5000) mixMemo.clear();
      mixMemo.set(key, out);
    }
    return out;
  };
  /** Ajusta luminosidade (dl), croma (×cs) e matiz (+dh graus) em OKLCH. */
  M.adjust = function (c, dl = 0, cs = 1, dh = 0) {
    const [L, A, B] = toLab(c);
    const C = Math.hypot(A, B) * cs;
    const h = Math.atan2(B, A) + (dh * Math.PI) / 180;
    return fromLab([clamp(L + dl, 0, 1), C * Math.cos(h), C * Math.sin(h)]);
  };
  M.luminance = (c) => {
    const [r, g, b] = parse(c).map(lin);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // ── telas auxiliares e caches ─────────────────────────────────────────
  const makeCanvas = (M.makeCanvas = function (w, h) {
    const W = Math.max(1, Math.round(w));
    const H = Math.max(1, Math.round(h));
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(W, H);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return c;
  });
  M.context = (c, read = false) => c.getContext("2d", { willReadFrequently: read });

  function lru(map, key, max, build, onEvict) {
    if (map.has(key)) {
      const v = map.get(key);
      map.delete(key);
      map.set(key, v);
      return v;
    }
    const v = build();
    map.set(key, v);
    while (map.size > max) {
      const k = map.keys().next().value;
      if (onEvict) onEvict(map.get(k));
      map.delete(k);
    }
    return v;
  }
  const onceMap = new Map();
  /** Guarda qualquer valor determinístico (layouts, trajetórias) por chave. */
  M.once = (key, build) => lru(onceMap, key, 600, build);
  const bakeMap = new Map();
  let fontEpoch = 0;
  if (typeof document !== "undefined" && document.fonts && document.fonts.addEventListener)
    document.fonts.addEventListener("loadingdone", () => fontEpoch++);
  /**
   * Desenha uma camada estática uma vez por chave e tamanho e reaproveita.
   * `draw(ctx, w, h)` precisa ser determinístico (com semente).
   */
  M.bake = function (key, w, h, draw) {
    const id = `${key}@${Math.round(w)}x${Math.round(h)}#${fontEpoch}`;
    return lru(bakeMap, id, 360, () => {
      const c = makeCanvas(w, h);
      draw(M.context(c, true), c.width, c.height);
      return c;
    });
  };
  const bufMap = new Map();
  /** Uma tela reaproveitável por chave e tamanho. O conteúdo NÃO é guardado entre chamadas. */
  M.buffer = function (key, w, h) {
    const id = `${key}@${Math.round(w)}x${Math.round(h)}`;
    return lru(bufMap, id, 120, () => {
      const canvas = makeCanvas(w, h);
      return { canvas, ctx: M.context(canvas, true) };
    });
  };

  // ── quadro ────────────────────────────────────────────────────────────
  /** Fatos do quadro. `s` converte pixels de projeto (lado curto = 1080) para esta tela. */
  M.frame = function (w, h) {
    const u = Math.min(w, h);
    return {
      w, h, u,
      s: u / 1080,
      cx: w / 2,
      cy: h / 2,
      portrait: h > w * 1.05,
      square: Math.abs(w - h) <= Math.max(w, h) * 0.05,
      wide: w > h * 1.2,
    };
  };
  /** Preenche o quadro inteiro com uma cor chapada. */
  M.ground = function (ctx, w, h, color) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  // ── acabamento: grão, vinheta, luz ────────────────────────────────────
  const GT = 160;
  const grainTiles = [];
  function grainTile(i) {
    if (grainTiles[i]) return grainTiles[i];
    const c = makeCanvas(GT, GT);
    const g = M.context(c, true);
    const img = g.createImageData(GT, GT);
    const r = rng(0x51ab + i * 977);
    for (let p = 0; p < GT * GT; p++) {
      const v = (r() + r() + r() + r()) / 4;
      const c8 = to255(128 + (v - 0.5) * 2.6 * 127);
      img.data[p * 4] = img.data[p * 4 + 1] = img.data[p * 4 + 2] = c8;
      img.data[p * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return (grainTiles[i] = c);
  }
  const grainPatterns = new WeakMap();
  /** Grão de filme que troca 24 vezes por segundo e se repete a cada loop. amount ~0.25 é sutil. */
  M.grain = function (ctx, w, h, t, amount = 0.26) {
    const fr = Math.floor(fract(t / LOOP) * LOOP * 24 + 1e-6);
    const idx = fr % 4;
    let list = grainPatterns.get(ctx);
    if (!list) grainPatterns.set(ctx, (list = []));
    const pat = list[idx] || (list[idx] = ctx.createPattern(grainTile(idx), "repeat"));
    const sc = Math.max(0.5, Math.min(w, (h * 16) / 9) / 1920);
    pat.setTransform(new DOMMatrix().translateSelf(-hash(fr, 5) * GT * sc, -hash(fr, 9) * GT * sc).scaleSelf(sc));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = amount;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };
  /** Escurece as bordas, como a queda de luz de uma lente. */
  M.vignette = function (ctx, w, h, strength = 0.5, color = "#000000") {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.hypot(w, h) * 0.6);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(1, rgba(color, strength));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };
  /** Uma poça de luz suave (screen por padrão). */
  M.light = function (ctx, x, y, r, color, alpha = 0.18, op = "screen") {
    if (r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, alpha));
    g.addColorStop(0.45, rgba(color, alpha * 0.42));
    g.addColorStop(1, rgba(color, 0));
    ctx.save();
    ctx.globalCompositeOperation = op;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  };

  // ── texto ─────────────────────────────────────────────────────────────
  M.SANS = '"Inter", "Helvetica Neue", Arial, sans-serif';
  M.SERIF = '"Newsreader", Georgia, serif';
  M.MONO = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';
  /** String de fonte do canvas. */
  M.font = (weight, size, family, fallback = M.SANS) =>
    `${weight} ${Math.max(1, size).toFixed(2)}px "${family}", ${fallback}`;
  /** Maior tamanho (até max) em que o texto cabe em maxW. */
  M.fit = function (ctx, text, maxW, max, weight, family, fallback = M.SANS, spacing = 0) {
    ctx.save();
    ctx.font = M.font(weight, max, family, fallback);
    ctx.letterSpacing = `${(spacing * max).toFixed(2)}px`;
    const w = ctx.measureText(text).width || 1;
    ctx.restore();
    return Math.min(max, (max * maxW) / w);
  };
  /** A palavra que o estilo escreve: theme.name, se houver, ou a palavra do estilo. */
  M.wordFor = function (theme, fallback, maxChars = 16) {
    const n = String((theme && theme.name) || "").trim();
    if (!n) return fallback;
    return n.length > maxChars ? n.slice(0, maxChars).trim() : n;
  };

  // ── traços desenhados (tinta que corre pelo caminho) ──────────────────
  const lenMemo = new WeakMap();
  function lengths(pts) {
    let L = lenMemo.get(pts);
    if (!L) {
      L = [0];
      for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      lenMemo.set(pts, L);
    }
    return L;
  }
  M.pathLength = (pts) => {
    const L = lengths(pts);
    return L[L.length - 1];
  };
  /** Ponto [x, y, ângulo] na fração f do caminho. */
  M.pointAt = function (pts, f) {
    const L = lengths(pts);
    const T = L[L.length - 1] * clamp(f);
    let lo = 0, hi = L.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (L[mid] < T) lo = mid;
      else hi = mid;
    }
    const k = (T - L[lo]) / (L[hi] - L[lo] || 1);
    return [
      lerp(pts[lo][0], pts[hi][0], k),
      lerp(pts[lo][1], pts[hi][1], k),
      Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0]),
    ];
  };
  /** Acrescenta ao path atual o trecho do caminho entre as frações a..b. */
  M.tracePath = function (ctx, pts, a = 0, b = 1) {
    a = clamp(a);
    b = clamp(b);
    if (b <= a || pts.length < 2) return false;
    const L = lengths(pts);
    const T = L[L.length - 1];
    const sa = a * T, sb = b * T;
    let started = false;
    for (let i = 0; i < pts.length - 1; i++) {
      if (L[i + 1] < sa) continue;
      if (L[i] > sb) break;
      const sl = L[i + 1] - L[i] || 1;
      const u0 = clamp((sa - L[i]) / sl);
      const u1 = clamp((sb - L[i]) / sl);
      const p = pts[i], q = pts[i + 1];
      if (!started) {
        ctx.moveTo(lerp(p[0], q[0], u0), lerp(p[1], q[1], u0));
        started = true;
      }
      ctx.lineTo(lerp(p[0], q[0], u1), lerp(p[1], q[1], u1));
    }
    return started;
  };
  /** Desenha o trecho a..b de um caminho com traço redondo. */
  M.stroke = function (ctx, pts, o) {
    const a = o.from ?? 0;
    const b = o.to ?? 1;
    if (b <= a) return;
    ctx.save();
    ctx.strokeStyle = o.color;
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.lineWidth = o.width ?? 2;
    ctx.lineCap = o.cap ?? "round";
    ctx.lineJoin = "round";
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath();
    M.tracePath(ctx, pts, a, b);
    ctx.stroke();
    ctx.restore();
  };
  /** Pontos de uma reta, com passo `step`. */
  M.linePts = function (x0, y0, x1, y1, step = 6) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    const out = [];
    for (let i = 0; i <= n; i++) out.push([lerp(x0, x1, i / n), lerp(y0, y1, i / n)]);
    return out;
  };
  /** Pontos de um arco. */
  M.arcPts = function (cx, cy, r, a0, a1, step = 6) {
    const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / step));
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = lerp(a0, a1, i / n);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  };
  /** Retângulo arredondado como caminho, horário a partir do canto superior esquerdo. */
  M.rrectPts = function (x, y, w, h, r, step = 6) {
    r = Math.min(r, w / 2, h / 2);
    const out = [];
    const add = (arr) => {
      for (const p of arr) {
        const l = out[out.length - 1];
        if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 0.01) out.push(p);
      }
    };
    add(M.linePts(x + r, y, x + w - r, y, step));
    add(M.arcPts(x + w - r, y + r, r, -Math.PI / 2, 0, step));
    add(M.linePts(x + w, y + r, x + w, y + h - r, step));
    add(M.arcPts(x + w - r, y + h - r, r, 0, Math.PI / 2, step));
    add(M.linePts(x + w - r, y + h, x + r, y + h, step));
    add(M.arcPts(x + r, y + h - r, r, Math.PI / 2, Math.PI, step));
    add(M.linePts(x, y + h - r, x, y + r, step));
    add(M.arcPts(x + r, y + r, r, Math.PI, Math.PI * 1.5, step));
    return out;
  };
  /** Tremor de mão: desloca cada ponto pela normal com ruído fixo (o traço não treme no tempo). */
  M.wobble = function (pts, amp, seed, freq = 80) {
    const L = lengths(pts);
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const d = noise3(L[i] / freq, seed * 1.37, 0.5) * amp + noise3(L[i] / (freq * 0.25), seed * 2.11, 3.5) * amp * 0.3;
      return [p[0] - (dy / l) * d, p[1] + (dx / l) * d];
    });
  };

  // ── registro e desenho seguro ─────────────────────────────────────────
  M.styles = [];
  M.byId = new Map();
  /** Registra um estilo. Cada arquivo em estilos/ chama isto uma vez. */
  M.registrar = function (style) {
    if (!style || !style.id) throw new Error("estilo sem id");
    if (M.byId.has(style.id)) M.styles.splice(M.styles.indexOf(M.byId.get(style.id)), 1);
    M.byId.set(style.id, style);
    M.styles.push(style);
    return style;
  };
  /** Ajudantes compartilhados de uma família (estilos/_<grupo>.js) ficam em M.kits.<grupo>. */
  M.kits = {};
  /** Leva t para [0, 5] (5 é aceito, para comparar com 0). */
  M.loopTime = (t, loop = LOOP) => (t === loop ? loop : ((t % loop) + loop) % loop);
  /** Desenha um frame com o contexto limpo. Devolve o erro, se o estilo falhar. */
  M.draw = function (ctx, style, t, theme, w, h) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.letterSpacing = "0px";
    ctx.imageSmoothingEnabled = true;
    try {
      style.render(ctx, M.loopTime(t), theme || style.tema, w, h);
      ctx.restore();
      return null;
    } catch (err) {
      ctx.restore();
      M.ground(ctx, w, h, (theme || style.tema || {}).bg || "#111");
      return err;
    }
  };
  /** Preenche {{bg}} {{ink}} {{accent}} {{accent2}} {{font}} {{name}} do prompt com o tema. */
  M.fillPrompt = function (style, theme) {
    const th = theme || style.tema;
    const name = M.wordFor(th, style.palavra || "Motion", 40);
    return String(style.prompt || "").replace(/\{\{(bg|ink|accent|accent2|font|name)\}\}/g, (_, k) =>
      k === "name" ? name : th[k] || "",
    );
  };
})();
