// Neve: vale nevado ao entardecer, 5 s em loop sem emenda. render(ctx, t, theme, w, h) é função pura de t.
(function () {
  const LOOP = 5, TAU = Math.PI * 2;
  const TEMA = { bg: '#a9cfcc', ink: '#123230', accent: '#3f8f86', accent2: '#ffcd6a', font: 'Lora, serif' };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const mixHex = (a, b, e) => { const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * e)).join(',')})`; };

  // três profundidades: número inteiro de alturas do quadro por loop, balanço em ciclos inteiros
  const CAMADAS = [
    { n: 90, voltas: 1, r: .0022, sway: .006, ciclos: 1, a: .9, macio: false, sem: 10 },
    { n: 60, voltas: 1, r: .0042, sway: .012, ciclos: 2, a: .92, macio: false, sem: 40 },
    { n: 26, voltas: 2, r: .0125, sway: .024, ciclos: 1, a: .72, macio: true, sem: 70 },
  ];

  function layout(w, h) {
    const m = Math.min(w, h), retrato = h > w;
    const janela = { x: w * (retrato ? .62 : .66), y: h * (retrato ? .66 : .67), s: m * .03 };
    return { m, retrato, janela, chao: janela.y + janela.s * 1.2 };
  }

  function serra(c, w, h, base, amp, seed, cor) {
    c.fillStyle = cor; c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += Math.max(2, w / 240)) {
      const u = x / w;
      const y = base + amp * (Math.sin(u * 5.1 + seed) * .5 + Math.sin(u * 11.3 + seed * 2) * .28 + Math.sin(u * 23 + seed * 3) * .1);
      c.lineTo(x, y);
    }
    c.lineTo(w, h); c.closePath(); c.fill();
  }
  function pinheiro(c, x, y, a, T) {
    const n = 4;
    c.fillStyle = '#7a5a48'; c.fillRect(x - a * .03, y - a * .08, a * .06, a * .09);
    for (let i = 0; i < n; i++) {
      const k = i / n, top = y - a + a * .82 * k, bot = top + a * .4, l = a * (.12 + .22 * k);
      c.fillStyle = T.pine; c.beginPath(); c.moveTo(x, top); c.lineTo(x + l, bot); c.lineTo(x - l, bot); c.closePath(); c.fill();
      // neve em cada camada, com borda irregular
      c.fillStyle = T.neve; c.beginPath(); c.moveTo(x, top); c.lineTo(x + l * .44, top + (bot - top) * .44); c.quadraticCurveTo(x + l * .16, top + (bot - top) * .3, x, top + (bot - top) * .42); c.quadraticCurveTo(x - l * .16, top + (bot - top) * .3, x - l * .44, top + (bot - top) * .44); c.closePath(); c.fill();
    }
  }

  const cache = new Map();
  function cenario(w, h, th) {
    const key = [w, h, th.bg, th.accent].join('|');
    if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'), { m, janela, chao } = layout(w, h);
    const T = { pine: '#143a38', neve: '#f4faf7' };
    const ceu = c.createLinearGradient(0, 0, 0, chao);
    ceu.addColorStop(0, mixHex(th.bg, th.accent, .32)); ceu.addColorStop(.6, th.bg); ceu.addColorStop(1, '#dcecE8');
    c.fillStyle = ceu; c.fillRect(0, 0, w, h);
    // aurora parada: véus largos
    for (let i = 0; i < 3; i++) {
      c.save(); c.globalAlpha = .2; c.strokeStyle = th.accent; c.lineCap = 'round'; c.lineWidth = m * (.08 + i * .03); c.filter = `blur(${m * .03}px)`;
      c.beginPath(); for (let x = -.1; x <= 1.1; x += .05) { const y = h * (.14 + i * .07) + m * .06 * Math.sin(x * 6 + i * 1.7); x === -.1 ? c.moveTo(x * w, y) : c.lineTo(x * w, y); } c.stroke(); c.restore();
    }
    serra(c, w, h, chao - m * .36, m * .1, 1.2, mixHex(th.bg, th.accent, .5));
    serra(c, w, h, chao - m * .24, m * .08, 3.7, mixHex('#d7ebe7', th.accent, .32));
    // crista com pinheiros
    serra(c, w, h, chao - m * .12, m * .05, 6.1, '#c6e0db');
    for (let i = 0; i < Math.round(w / m * 26); i++) { const u = (i + hash(i) * .8) / (w / m * 26), x = u * w; pinheiro(c, x, chao - m * (.11 + .05 * hash(i + 9)), m * (.09 + .07 * hash(i + 3)), T); }
    // campo de neve
    const campo = c.createLinearGradient(0, chao - m * .06, 0, h);
    campo.addColorStop(0, '#eef6f3'); campo.addColorStop(1, mixHex('#eef6f3', th.accent, .22));
    c.fillStyle = campo; c.beginPath(); c.moveTo(0, h); c.lineTo(0, chao - m * .03);
    for (let x = 0; x <= w; x += w / 60) c.lineTo(x, chao - m * .03 + m * .018 * Math.sin(x / w * 7 + 1));
    c.lineTo(w, h); c.closePath(); c.fill();
    // cabana
    const s = janela.s, cx = janela.x, base = chao + s * .1;
    c.fillStyle = '#3c2c28'; c.fillRect(cx - s * 2.2, base - s * 2.4, s * 4.4, s * 2.4);
    c.fillStyle = '#3c2c28'; c.fillRect(cx + s * 1.1, base - s * 4.4, s * .75, s * 1.6);
    c.fillStyle = T.neve; c.fillRect(cx + s * 1.02, base - s * 4.55, s * .92, s * .24);
    c.fillStyle = '#2b1f1d'; c.beginPath(); c.moveTo(cx - s * 2.8, base - s * 2.3); c.lineTo(cx, base - s * 4.1); c.lineTo(cx + s * 2.8, base - s * 2.3); c.closePath(); c.fill();
    c.fillStyle = T.neve; c.beginPath(); c.moveTo(cx - s * 2.8, base - s * 2.3); c.lineTo(cx, base - s * 4.1); c.lineTo(cx + s * 2.8, base - s * 2.3); c.quadraticCurveTo(cx + s * 1.4, base - s * 2.95, cx + s * .4, base - s * 2.8); c.quadraticCurveTo(cx - s * 1, base - s * 3, cx - s * 2.8, base - s * 2.3); c.closePath(); c.fill();
    // pinheiros da frente, nas pontas
    pinheiro(c, w * .1, h * .98, m * .34, T); pinheiro(c, w * .2, h * .96, m * .22, T); pinheiro(c, w * .92, h * .99, m * .3, T);
    cache.set(key, cv);
    return cv;
  }

  function sprite(rgb) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(.55, `rgba(${rgb},.75)`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); return cv;
  }
  let SPF = null, SPQ = null;

  window.renderNeve = function (ctx, t, theme, w, h) {
    const th = Object.assign({}, TEMA, theme);
    if (!SPF) { SPF = sprite('255,255,255'); SPQ = sprite('255,214,130'); }
    const { m, janela, chao } = layout(w, h), f = ((t % LOOP) + LOOP) % LOOP / LOOP;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(cenario(w, h, th), 0, 0, w, h);

    // janela: respira num ruído periódico lento, a única luz quente
    const res = 1 + .07 * Math.sin(TAU * 2 * f) + .04 * Math.sin(TAU * 3 * f + 1.1);
    const s = janela.s;
    const der = ctx.createRadialGradient(janela.x, chao + s * .8, 0, janela.x, chao + s * .8, m * .24);
    der.addColorStop(0, `rgba(255,205,106,${.5 * res})`); der.addColorStop(1, 'rgba(255,205,106,0)');
    ctx.save(); ctx.translate(0, chao + s * .8); ctx.scale(1, .42); ctx.translate(0, -(chao + s * .8)); ctx.fillStyle = der; ctx.fillRect(0, 0, w, h * 3); ctx.restore();
    const aura = ctx.createRadialGradient(janela.x, janela.y, 0, janela.x, janela.y, m * .15);
    aura.addColorStop(0, `rgba(255,205,106,${.42 * res})`); aura.addColorStop(1, 'rgba(255,205,106,0)');
    ctx.fillStyle = aura; ctx.fillRect(janela.x - m * .15, janela.y - m * .15, m * .3, m * .3);
    ctx.fillStyle = th.accent2; ctx.globalAlpha = Math.min(1, .9 * res); ctx.fillRect(janela.x - s * .7, janela.y - s * .75, s * 1.4, s * 1.5); ctx.globalAlpha = 1;
    ctx.fillStyle = '#3c2c28'; ctx.fillRect(janela.x - s * .05, janela.y - s * .75, s * .1, s * 1.5); ctx.fillRect(janela.x - s * .7, janela.y - s * .05, s * 1.4, s * .1);

    // fumaça: cada baforada vive um loop inteiro, nasce e morre transparente
    const bx = janela.x + s * 1.47, by = chao + s * .1 - s * 4.5;
    for (let i = 0; i < 16; i++) {
      const p = (f + i / 16) % 1, sobe = p * m * .42;
      const x = bx + m * .012 * p * Math.sin(TAU * (p * 1.5 + i * .17)) * 4 + m * .08 * p * p;
      const r = m * (.012 + .05 * p), a = .34 * Math.sin(Math.PI * p);
      ctx.globalAlpha = a; ctx.drawImage(SPF, x - r, by - sobe - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;

    // a palavra, parada no céu
    const fs = Math.round(m * .17);
    ctx.font = `600 ${fs}px ${th.font}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.fillStyle = th.ink;
    ctx.fillText('Neve', h >= w ? w * .1 : w * .17, h * (h > w ? .22 : .32)); // em 16:9 sai de baixo do selo da miniatura

    // flocos: acendem ao passar pela luz da janela
    CAMADAS.forEach((C) => {
      for (let i = 0; i < C.n; i++) {
        const y0 = hash(i + C.sem), x0 = hash(i * 1.7 + C.sem + 3), ph = hash(i * 2.3 + C.sem + 7);
        const r = C.r * m * (.8 + .5 * hash(i + C.sem + 11)) * (w > 600 ? 1 : 1.5), mg = r * 3;
        const y = ((y0 + C.voltas * f) % 1) * (h + 2 * mg) - mg;
        const x = x0 * w + C.sway * m * Math.sin(TAU * (C.ciclos * f + ph)) + C.sway * m * .4 * Math.sin(TAU * (C.ciclos * 2 * f + ph * 3));
        const d = Math.hypot(x - janela.x, (y - janela.y) * 1.2) / (m * .24), luz = Math.max(0, 1 - d);
        if (C.macio) {
          const q = r * 2.2; ctx.globalAlpha = C.a; ctx.drawImage(SPF, x - q, y - q, q * 2, q * 2);
          if (luz > 0) { ctx.globalAlpha = Math.min(1, luz * 1.6); ctx.drawImage(SPQ, x - q, y - q, q * 2, q * 2); }
        } else {
          ctx.globalAlpha = C.a; ctx.fillStyle = luz > .05 ? mixHex('#ffffff', '#ffc14d', Math.min(1, luz * 1.5)) : '#ffffff';
          ctx.beginPath(); ctx.arc(x, y, r * (1 + luz * .9), 0, TAU); ctx.fill();
        }
      }
    });
    ctx.globalAlpha = 1;
  };
})();
