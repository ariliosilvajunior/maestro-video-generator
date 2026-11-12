// Mar de papel: seis camadas recortadas, 5 s em loop sem emenda. render(ctx, t, theme, w, h) é função pura de t.
(function () {
  const LOOP = 5, TAU = Math.PI * 2;
  const TEMA = { bg: '#e8e2f3', ink: '#3a3268', accent: '#ff8e7a', accent2: '#fffaf2', font: 'Fraunces, serif' };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const io = (x) => (x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  // da mais clara e lavanda (longe) à mais funda (perto)
  const CORES = ['#d6cfee', '#bdb4e4', '#a095d6', '#7f74c4', '#5a4f9c', '#3a3268'];
  // ondulação entra e sai com ease in-out; fora dela vale zero, então o fim encontra o começo
  const ondul = (t) => { const a = io(clamp((t - 1.2) / 1.1)), b = io(clamp((t - 2.7) / 1.1)); return a - b; };

  function camada(i, w, h, m) {
    const k = i / 5, dir = i % 2 ? -1 : 1;
    return { base: h * (.5 + .085 * i * (h > w ? .9 : 1)), lam: m * (1.15 - k * .25), amp: m * (.028 + k * .03), voltas: dir * (i < 2 ? 1 : 2), ph: i * 1.3, dir };
  }
  // altura da onda: lâmbda inteiro por loop, mais recorte irregular preso à própria camada
  function alt(C, x, f, t, m, i, recorte) {
    const u = x / C.lam + C.voltas * f;
    let y = C.base + C.amp * Math.sin(TAU * u + C.ph) + C.amp * .35 * Math.sin(TAU * 2 * u + C.ph * 2);
    y -= m * .07 * ondul(t) * (.45 + .55 * Math.sin(Math.PI * (i + 1) / 7)) * (.8 + .2 * Math.sin(TAU * u));
    if (recorte) y += m * .0028 * (Math.sin(TAU * 7 * u + i) + .7 * Math.sin(TAU * 13 * u + i * 2) + .5 * Math.sin(TAU * 29 * u + i * 3));
    return y;
  }

  const cache = new Map();
  function fibra(w, h) {
    const key = w + 'x' + h;
    if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'), im = c.createImageData(w, h);
    let a = 41; const r = () => { a |= 0; a = a + 0x6d2b79f5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    for (let j = 0; j < im.data.length; j += 4) { const v = 118 + r() * 20; im.data[j] = im.data[j + 1] = im.data[j + 2] = v; im.data[j + 3] = 255; }
    c.putImageData(im, 0, 0);
    // fibras curtas e soltas
    c.lineWidth = 1;
    for (let i = 0; i < w * h / 900; i++) { const x = r() * w, y = r() * h, d = r() * 6.28, l = 3 + r() * 9; c.strokeStyle = r() > .5 ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.14)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(d) * l, y + Math.sin(d) * l); c.stroke(); }
    cache.set(key, cv);
    return cv;
  }
  const sombra = (c, b, dy, a = .34) => { c.shadowColor = `rgba(45,35,95,${a})`; c.shadowBlur = b; c.shadowOffsetX = 0; c.shadowOffsetY = dy; };
  const semSombra = (c) => { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; };

  function barco(c, x, y, ang, s, th) {
    c.save(); c.translate(x, y); c.rotate(ang); sombra(c, s * .22, s * .08);
    c.fillStyle = th.accent2;
    c.beginPath(); c.moveTo(-s, -s * .36); c.lineTo(s, -s * .36); c.lineTo(s * .62, 0); c.lineTo(-s * .62, 0); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-s * .06, -s * .42); c.lineTo(-s * .06, -s * 1.38); c.lineTo(s * .66, -s * .42); c.closePath(); c.fill();
    semSombra(c);
    c.strokeStyle = 'rgba(58,50,104,.34)'; c.lineWidth = Math.max(1, s * .03);
    c.beginPath(); c.moveTo(-s * .06, -s * .42); c.lineTo(s * .66, -s * .42); c.moveTo(-s * .8, -s * .22); c.lineTo(s * .8, -s * .22); c.stroke();
    c.restore();
  }
  function gaivota(c, x, y, s, abre, th) {
    sombra(c, s * .3, s * .12, .3); c.fillStyle = th.ink;
    c.beginPath(); c.moveTo(x - s, y - s * .55 * abre); c.quadraticCurveTo(x - s * .4, y - s * .22, x, y + s * .12); c.quadraticCurveTo(x + s * .4, y - s * .22, x + s, y - s * .55 * abre); c.quadraticCurveTo(x + s * .4, y + s * .02, x, y + s * .3); c.quadraticCurveTo(x - s * .4, y + s * .02, x - s, y - s * .55 * abre); c.closePath(); c.fill(); semSombra(c);
  }

  window.renderPapel = function (ctx, t, theme, w, h) {
    const th = Object.assign({}, TEMA, theme), m = Math.min(w, h);
    const lt = ((t % LOOP) + LOOP) % LOOP, f = lt / LOOP;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const ceu = ctx.createLinearGradient(0, 0, 0, h);
    ceu.addColorStop(0, '#d9d0ee'); ceu.addColorStop(.6, th.bg); ceu.addColorStop(1, '#f3eaf0');
    ctx.fillStyle = ceu; ctx.fillRect(0, 0, w, h);

    // estrelas de papel piscam em ciclos inteiros
    for (let i = 0; i < 16; i++) {
      const x = hash(i + 2) * w, y = hash(i + 30) * h * .34 + m * .03, r = m * (.006 + .005 * hash(i + 50));
      const pisca = .55 + .45 * Math.sin(TAU * ((1 + i % 3) * f + hash(i + 70)));
      ctx.globalAlpha = pisca; sombra(ctx, r, r * .4, .25); ctx.fillStyle = th.ink;
      ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2, q = k % 2 ? r * .42 : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1; semSombra(ctx);

    // lua coral com dois anéis de papel: o único acento
    const lx = w * (h >= w ? .72 : .74), ly = h * (h > w ? .29 : h === w ? .33 : .3), lr = m * (h >= w ? .11 : .13);
    [[1.55, '#fbd4c8'], [1.27, '#ffb7a6'], [1, th.accent]].forEach(([k, c]) => { sombra(ctx, m * .02, m * .007); ctx.fillStyle = c; ctx.beginPath(); for (let a = 0; a < TAU; a += .1) { const q = lr * k * (1 + .006 * Math.sin(a * 9 + k * 4)); ctx.lineTo(lx + Math.cos(a) * q, ly + Math.sin(a) * q); } ctx.closePath(); ctx.fill(); });
    semSombra(ctx);

    // a palavra recortada no céu
    const fs = Math.round(m * (h >= w ? .13 : .165));
    ctx.font = `700 ${fs}px ${th.font}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    sombra(ctx, m * .012, m * .007); ctx.fillStyle = th.ink;
    ctx.fillText('Motion', h >= w ? w * .07 : w * .16, h * (h > w ? .13 : h === w ? .18 : .31)); // fora da lua e do selo da miniatura semSombra(ctx);

    // gaivotas cruzam o céu e saem do quadro antes do loop fechar
    const g = clamp((lt - 1.2) / 2.6);
    [[-.08, .42, 1], [-.22, .36, .78]].forEach(([x0, yy, e], i) => {
      const x = (x0 + g * 1.42) * w, y = h * yy * (h > w ? .8 : 1) + m * .02 * Math.sin(TAU * 2 * f + i);
      gaivota(ctx, x, y, m * .035 * e, .55 + .45 * Math.sin(TAU * 5 * f + i * 1.4), th);
    });

    // camadas, da longe para a perto; cada uma projeta sombra na de trás
    const passo = Math.max(3, w / 200);
    for (let i = 0; i < 6; i++) {
      const C = camada(i, w, h, m);
      sombra(ctx, m * .032, -m * .009, .42); ctx.fillStyle = CORES[i];
      ctx.beginPath(); ctx.moveTo(-10, h + 10);
      for (let x = -10; x <= w + passo; x += passo) ctx.lineTo(x, alt(C, x, f, lt, m, i, true));
      ctx.lineTo(w + 10, h + 10); ctx.closePath(); ctx.fill(); semSombra(ctx);
      // filete de luz na borda de cima
      ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.lineWidth = Math.max(1, m * .0028); ctx.beginPath();
      for (let x = -10; x <= w + passo; x += passo) { const y = alt(C, x, f, lt, m, i, true) + m * .002; x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      // o barquinho segue a altura e a inclinação da quarta onda
      if (i === 3) {
        const bx = w * (h > w ? .4 : .46), dx = m * .03, Y = alt(C, bx, f, lt, m, i, false), Y1 = alt(C, bx - dx, f, lt, m, i, false), Y2 = alt(C, bx + dx, f, lt, m, i, false);
        barco(ctx, bx, Y + m * .006, Math.atan2(Y2 - Y1, dx * 2) * .9, m * .082, th);
      }
    }
    // fibra de papel em tudo
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .42; ctx.drawImage(fibra(w, h), 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  };
})();
