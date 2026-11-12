/*
 * Kit da família Pintura e desenho (M.kits.pintura).
 * Papel escuro com fibra e manchas, dente de papel que quebra o traço,
 * traço de largura variável, escrita à mão revelada pela linha de base,
 * tremor de 12 desenhos por segundo e o acabamento comum.
 * Tudo determinístico: sementes fixas e caches por chave.
 */
(function () {
  "use strict";
  const { mix, rgba, clamp, lerp, rng, hash, noise3, fbm3, TAU } = M;
  const K = (M.kits.pintura = {});

  // ── tempo desenhado à mão ─────────────────────────────────────────────
  /** Índice do desenho em `fps` desenhos por segundo, que volta a 0 no fim do loop. */
  K.frameIndex = (t, fps = 12) => {
    const n = Math.round(M.LOOP * fps);
    return Math.floor(M.fract(t / M.LOOP) * n + 1e-6) % n;
  };
  /** t arredondado para o desenho atual (anima "em dois"). */
  K.stepTime = (t, fps = 12) => K.frameIndex(t, fps) / fps;
  /** Tremor: deslocamento de -1..1 fixo por desenho e por item. */
  K.jit = (frame, i, salt = 0) => hash(frame * 7919 + salt, i, 4211) * 2 - 1;

  // ── papel ─────────────────────────────────────────────────────────────
  /**
   * Papel escuro: manchas largas, dente fino e fibras claras. Uma vez por
   * tema e tamanho. o: {seed, mottle, tooth, fibres, warm, tint}
   */
  K.paper = function (theme, w, h, o = {}) {
    const seed = o.seed ?? 1;
    const key = `pintura-papel:${seed}:${theme.bg}:${theme.ink}:${o.tint || ""}:${o.mottle ?? 1}:${o.tooth ?? 1}:${o.fibres ?? 1}`;
    return M.bake(key, w, h, (g, W, H) => {
      const bg = M.parse(theme.bg);
      const lift = M.parse(o.tint || mix(theme.bg, theme.ink, 0.5));
      // Manchas em baixa resolução, ampliadas com suavização.
      const q = 4;
      const lw = Math.max(2, Math.ceil(W / q)), lh = Math.max(2, Math.ceil(H / q));
      const low = M.makeCanvas(lw, lh);
      const lg = M.context(low, true);
      const im = lg.createImageData(lw, lh);
      const sc = 1 / Math.max(40, Math.min(W, H) / 5);
      const mot = 0.05 * (o.mottle ?? 1);
      for (let j = 0; j < lh; j++)
        for (let i = 0; i < lw; i++) {
          const x = i * q, y = j * q;
          const n = fbm3(x * sc, y * sc, seed * 3.7, 4) * 0.5 + 0.5;
          const n2 = noise3(x * sc * 4, y * sc * 4, seed + 9.1) * 0.5 + 0.5;
          const k = clamp(mot * (n * 0.8 + n2 * 0.35) - 0.012, -0.03, 0.2);
          const p = (j * lw + i) * 4;
          for (let c = 0; c < 3; c++) im.data[p + c] = clamp(bg[c] + (lift[c] - bg[c]) * k, 0, 255);
          im.data[p + 3] = 255;
        }
      lg.putImageData(im, 0, 0);
      g.imageSmoothingEnabled = true;
      g.drawImage(low, 0, 0, W, H);
      // Dente: pontilhado fino em resolução final.
      const tooth = 0.045 * (o.tooth ?? 1);
      if (tooth > 0) {
        const id = g.getImageData(0, 0, W, H);
        const d = id.data;
        const r = rng(seed * 101 + 5);
        for (let p = 0; p < d.length; p += 4) {
          const v = (r() + r() - 1) * tooth;
          d[p] = clamp(d[p] + (lift[0] - bg[0]) * v + v * 18, 0, 255);
          d[p + 1] = clamp(d[p + 1] + (lift[1] - bg[1]) * v + v * 18, 0, 255);
          d[p + 2] = clamp(d[p + 2] + (lift[2] - bg[2]) * v + v * 18, 0, 255);
        }
        g.putImageData(id, 0, 0);
      }
      // Fibras: fiapos curvos e claros, quase invisíveis.
      const nf = Math.round(((W * H) / 2600) * (o.fibres ?? 1));
      const r = rng(seed * 57 + 2);
      const u = Math.min(W, H) / 1080;
      g.lineCap = "round";
      for (let k = 0; k < nf; k++) {
        const x = r() * W, y = r() * H;
        const a = r() * TAU;
        const l = (8 + r() * 26) * Math.max(0.5, u);
        const bend = (r() - 0.5) * 0.9;
        g.strokeStyle = rgba(theme.ink, 0.025 + r() * 0.05);
        g.lineWidth = Math.max(0.5, (0.5 + r() * 0.9) * u);
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + Math.cos(a + bend) * l * 0.5, y + Math.sin(a + bend) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
        g.stroke();
      }
    });
  };

  // ── dente do papel que quebra o traço ─────────────────────────────────
  const TT = 192;
  const toothTiles = new Map();
  /** Ladrilho repetível: alfa alto onde o papel é alto (o traço não chega). */
  K.toothTile = function (kind = "grao") {
    if (toothTiles.has(kind)) return toothTiles.get(kind);
    const c = M.makeCanvas(TT, TT);
    const g = M.context(c, true);
    const im = g.createImageData(TT, TT);
    const r = rng(kind === "grao" ? 77 : kind === "favo" ? 91 : 113);
    const sc = kind === "favo" ? 6 : kind === "fino" ? 2 : 3; // TT / sc precisa ser inteiro
    const per = TT / sc;
    for (let j = 0; j < TT; j++)
      for (let i = 0; i < TT; i++) {
        let n = noise3(i / sc, j / sc, 2.5, per, per) * 0.5 + 0.5;
        if (kind === "favo") n = 0.5 + 0.5 * Math.cos(n * 9) * 0.6 + (n - 0.5) * 0.6;
        const v = n * 0.75 + r() * 0.45;
        const a = M.smoothstep(0.55, 0.9, v);
        const p = (j * TT + i) * 4;
        im.data[p] = im.data[p + 1] = im.data[p + 2] = 0;
        im.data[p + 3] = Math.round(a * 255);
      }
    g.putImageData(im, 0, 0);
    toothTiles.set(kind, c);
    return c;
  };
  const toothPats = new WeakMap();
  /** Arranca o dente do papel de um contexto (destination-out). */
  K.breakTooth = function (ctx, w, h, amount = 0.8, scale = 1, kind = "grao", ox = 0, oy = 0) {
    let m = toothPats.get(ctx);
    if (!m) toothPats.set(ctx, (m = {}));
    const pat = m[kind] || (m[kind] = ctx.createPattern(K.toothTile(kind), "repeat"));
    pat.setTransform(new DOMMatrix().translateSelf(ox, oy).scaleSelf(scale));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = amount;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  /** Tela de trabalho do tamanho do quadro, limpa e pronta. */
  K.layer = function (key, w, h) {
    const b = M.buffer(key, w, h);
    const g = b.ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.filter = "none";
    g.shadowBlur = 0;
    g.shadowColor = "transparent";
    g.letterSpacing = "0px";
    g.clearRect(0, 0, b.canvas.width, b.canvas.height);
    return b;
  };

  // ── traços ────────────────────────────────────────────────────────────
  /**
   * Traço de largura variável preenchido: wFn(s) dá a largura na fração s
   * do caminho. Desenha só o trecho a..b.
   */
  K.ribbon = function (ctx, pts, wFn, a = 0, b = 1) {
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const T = L[L.length - 1] || 1;
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const s = L[i] / T;
      if (s < a - 1e-6) continue;
      if (s > b + 1e-6) break;
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(pts.length - 1, i + 1)];
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
      const l = Math.hypot(dx, dy) || 1;
      const hw = wFn(s) / 2;
      left.push([pts[i][0] - (dy / l) * hw, pts[i][1] + (dx / l) * hw]);
      right.push([pts[i][0] + (dy / l) * hw, pts[i][1] - (dx / l) * hw]);
    }
    if (left.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fill();
  };

  /** Pontos de uma curva de Bézier cúbica. */
  K.bezierPts = function (p0, p1, p2, p3, n = 40) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n, m = 1 - k;
      out.push([
        m * m * m * p0[0] + 3 * m * m * k * p1[0] + 3 * m * k * k * p2[0] + k * k * k * p3[0],
        m * m * m * p0[1] + 3 * m * m * k * p1[1] + 3 * m * k * k * p2[1] + k * k * k * p3[1],
      ]);
    }
    return out;
  };
  /** Une caminhos em um só. */
  K.join = (...parts) => parts.reduce((acc, p) => acc.concat(acc.length ? p.slice(1) : p), []);
  /** Desloca/escala um caminho de projeto para a tela. */
  K.place = (pts, ox, oy, k) => pts.map(([x, y]) => [ox + x * k, oy + y * k]);
  /** Laço solto que passa do ponto: elipse que não fecha, com sobra. */
  K.loopPts = function (cx, cy, rx, ry, turns = 1.12, a0 = -2.4, seed = 1, n = 120) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const a = a0 + k * turns * TAU;
      const g = 1 + 0.07 * noise3(k * 3, seed, 0.3) + 0.05 * k;
      out.push([cx + Math.cos(a) * rx * g, cy + Math.sin(a) * ry * g]);
    }
    return out;
  };

  /** Mesmo caminho com um tremor novo a cada desenho (ferve em 12 fps). */
  K.boil = function (pts, frame, amp, seed) {
    const ox = K.jit(frame, seed, 1) * amp * 0.6, oy = K.jit(frame, seed, 2) * amp * 0.6;
    return pts.map((p, i) => [
      p[0] + ox + noise3(i * 0.09, seed + frame * 0.71, 1.7) * amp,
      p[1] + oy + noise3(i * 0.09, seed + frame * 0.71, 6.3) * amp,
    ]);
  };

  // ── texto ─────────────────────────────────────────────────────────────
  /** Fonte do canvas com uma pilha de reserva escolhida pelo estilo. */
  K.font = (weight, size, family, fallback = "cursive") => `${weight} ${Math.max(1, size).toFixed(2)}px "${family}", ${fallback}`;
  /** Largura de um texto. */
  K.measure = function (ctx, text, font, spacing = 0) {
    ctx.save();
    ctx.font = font;
    ctx.letterSpacing = `${spacing.toFixed(2)}px`;
    const m = ctx.measureText(text);
    ctx.restore();
    return m.width;
  };
  /**
   * Escreve um texto em velocidade de escrita: uma máscara corre pela linha
   * de base; devolve a posição x da ponta. o: {align, spacing, stroke, lw}
   */
  K.writeText = function (ctx, text, x, y, font, color, prog, o = {}) {
    const p = clamp(prog);
    ctx.save();
    ctx.font = font;
    ctx.letterSpacing = `${(o.spacing || 0).toFixed(2)}px`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const m = ctx.measureText(text);
    const tw = m.width;
    const x0 = o.align === "center" ? x - tw / 2 : o.align === "right" ? x - tw : x;
    const asc = m.actualBoundingBoxAscent || 40, desc = m.actualBoundingBoxDescent || 12;
    const pad = (asc + desc) * 0.4;
    const edge = x0 - pad + (tw + pad * 2) * p;
    if (p > 0) {
      ctx.beginPath();
      ctx.rect(x0 - pad, y - asc - pad, edge - (x0 - pad), asc + desc + pad * 2);
      ctx.clip();
      if (o.stroke) {
        ctx.strokeStyle = o.stroke;
        ctx.lineWidth = o.lw || 2;
        ctx.lineJoin = "round";
        ctx.strokeText(text, x0, y);
      }
      ctx.fillStyle = color;
      ctx.fillText(text, x0, y);
    }
    ctx.restore();
    return { edge, x0, tw, asc, desc };
  };

  // ── acabamento ────────────────────────────────────────────────────────
  K.finish = function (ctx, w, h, t, vig = 0.5, grain = 0.26) {
    M.vignette(ctx, w, h, vig);
    M.grain(ctx, w, h, t, grain);
  };
})();
