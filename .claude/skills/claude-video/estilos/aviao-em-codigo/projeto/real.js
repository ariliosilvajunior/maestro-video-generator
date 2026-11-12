// A parte real: fotos de verdade em camadas, sem imagem gerada. Decolagem com física: corrida acelerando
// com a câmera acompanhando, nariz sobe em torno do eixo das rodas principais, só depois as rodas saem do chão.
// Na decolagem, o mesmo avião vira desenho e volta a ser real: o desenho foi tirado da própria foto,
// então os dois ocupam exatamente o mesmo lugar e a fronteira entre eles anda por dentro do avião.
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const io3 = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const ramp = (t, a, b, e = io3) => e(clamp((t - a) / (b - a)));
const sm = (x) => x * x * (3 - 2 * x);

export const T = { ui: 11.5, spool: 11.75, roll: 13.0, rot: 16.55, lo: 17.2, end: 20.1, dur: 22 };
// Fronteira entre os mundos: 1,25 = tudo real; -0,25 = tudo desenho. O desenho entra pela cauda,
// o real volta pelo nariz, com a luz na frente.
const FRENTE = [[13.35, 1.25], [14.55, -.25], [15.35, -.25], [16.45, 1.25], [17.55, 1.25], [18.45, -.25], [18.85, -.25], [19.8, 1.25]];
const K = .8, Y0 = 10, EXT = 800;          // escala das camadas, corte vertical e céu estendido
const ACC = 850, ACC2 = 320;               // px/s² na corrida e depois de sair do chão
const PIVO = [1217, 1128];                 // roda principal de lá, na foto de 2160 px
const HUB = [470, 838], EA = [35, -215], EB = [-85, -8];
const RODAS = { nariz: [546, 1081, 32, 38], perto: [704, 1097, 42, 42], la: [1217, 1084, 38, 42] };

const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
const tela = () => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; return c; };

export async function createReal(bg, fg, soDesenho = false) {
  // Só desenho: as camadas da foto real (fundo, corpo, perto, pas) não existem mais neste projeto; só a sombra e as camadas desenhadas.
  const nomes = soDesenho
    ? ['sombra.png', 'des-fundo.jpg', 'des-corpo.png', 'des-perto.png', 'des-pas.png']
    : ['fundo.jpg', 'corpo.png', 'perto.png', 'pas.png', 'sombra.png', 'des-fundo.jpg', 'des-corpo.png', 'des-perto.png', 'des-linha-corpo.png', 'des-linha-perto.png', 'des-pas.png'];
  const img = {};
  await Promise.all(nomes.map(async (n) => { img[n] = await load('assets/reais/' + n); }));
  const fundo = img['fundo.jpg'], corpo = img['corpo.png'], perto = img['perto.png'], pas = img['pas.png'], sombra = img['sombra.png'];
  const dFundo = img['des-fundo.jpg'], dCorpo = img['des-corpo.png'], dPerto = img['des-perto.png'], lCorpo = img['des-linha-corpo.png'], lPerto = img['des-linha-perto.png'], dPas = img['des-pas.png'];
  const b = bg.getContext('2d'), f = fg.getContext('2d');

  // Faixa dupla espelhada: emenda invisível para a câmera correr sem fim
  function espelhada(img) {
    const c = document.createElement('canvas'); c.width = img.width * 2; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0); x.save(); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(img, 0, 0); x.restore();
    return c;
  }
  const REAL = soDesenho ? null : { tile: espelhada(fundo), corpo, perto, pas, rastro: 1, desenho: false };
  const DES = { tile: espelhada(dFundo), corpo: dCorpo, perto: dPerto, pas: dPas, rastro: .45, desenho: true };
  const LINHA = soDesenho ? null : { corpo: lCorpo, perto: lPerto };

  // Rotação da hélice integrada no tempo: ela nunca salta
  const rpm = (t) => 88 * ramp(t, T.spool, T.roll + .4, (x) => x * x);
  const STEP = 1 / 240, ANG = [];
  { let a = 0; for (let i = 0; i <= T.dur / STEP; i++) { ANG.push(a); a += rpm(i * STEP) * STEP; } }
  const ang = (t) => ANG[clamp(Math.round(t / STEP), 0, ANG.length - 1)];

  const ULO = T.lo - T.roll;
  const X = (t) => { const u = Math.max(0, t - T.roll), a = Math.min(u, ULO), c = Math.max(0, u - ULO); return .5 * ACC * a * a + ACC * ULO * c + .5 * ACC2 * c * c; };
  const V = (t) => { const u = Math.max(0, t - T.roll); return ACC * Math.min(u, ULO) + ACC2 * Math.max(0, u - ULO); };
  // Sobe só depois da rotação, e sobe em rampa rasa: altura vem da velocidade, nunca do nada
  const gama = (t) => .1 * ramp(t, T.lo, T.lo + 1.1, (x) => x);
  const STEP2 = 1 / 120, ALT = [];
  { let h = 0; for (let i = 0; i <= T.dur / STEP2; i++) { ALT.push(h); h += V(i * STEP2) * Math.tan(gama(i * STEP2)) * STEP2; } }
  const alt = (t) => ALT[clamp(Math.round(t / STEP2), 0, ALT.length - 1)];
  const arfagem = (t) => .15 * ramp(t, T.rot, T.lo + .25);
  const dxPlano = (t) => 190 * ramp(t, T.ui + .1, T.roll - .05) - 240 * ramp(t, T.roll + .25, T.roll + 2.3);
  const zoom = (t) => 1 - .28 * ramp(t, T.roll + 1.6, T.end, (x) => x);
  // a câmera inclina para acompanhar a subida, mas sem perder o chão de vista
  const inclina = (h) => 380 * (1 - Math.exp(-.75 * h / 380));

  function drawFundo(t, ctx, src, rastro) {
    const z = zoom(t), h = alt(t), tilt = inclina(h), off = X(t) + dxPlano(t);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.translate(960, 620); ctx.scale(z, z); ctx.translate(-960, -620);
    const borrao = Math.min(V(t) / 60, 90) * rastro, n = borrao < 2 ? 1 : Math.min(20, Math.ceil(borrao / 3.5));
    const W = src.width, y = -(EXT + Y0) + tilt;
    for (let i = 0; i < n; i++) {
      const o = off + (n === 1 ? 0 : borrao * (i / (n - 1) - .5)), m = ((o % W) + W) % W;
      ctx.globalAlpha = 1 / (i + 1);
      for (let x = m - W; x < 2400; x += W) ctx.drawImage(src, x - 400, y);
    }
    ctx.globalAlpha = 1;
  }

  function roda(c, img, r, spin) {
    const [cx, cy, rx, ry] = r, n = spin > .4 ? 7 : 1;
    if (spin < .001) return;
    c.save();
    c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.clip();
    for (let i = 0; i < n; i++) {
      c.save(); c.globalAlpha = 1 / (i + 1);
      c.translate(cx, cy); c.scale(rx / ry, 1); c.rotate((i / n) * Math.min(spin, 1.2) * 1.2 + spin); c.scale(ry / rx, 1); c.translate(-cx, -cy);
      c.drawImage(img, 0, 0); c.restore();
    }
    c.restore();
  }

  function helice(t, c, desenho = false, pasImg = pas) {
    const q = rpm(t);
    if (q < .25) { c.drawImage(pasImg, 0, 0); return; }
    const entrada = ramp(q, .25, 3, (x) => x);
    if (entrada < 1) { c.globalAlpha = 1 - entrada; c.drawImage(pasImg, 0, 0); c.globalAlpha = 1; }
    const N = 46, sh = 1 / 60, a0 = ang(t);
    for (let k = 0; k < N; k++) {
      const a = a0 + q * sh * (k / N);
      for (let i = 0; i < 5; i++) {
        const ph = a + i * Math.PI * 2 / 5 + .1, co = Math.cos(ph), s = Math.sin(ph);
        const rd = [co * EA[0] + s * EB[0], co * EA[1] + s * EB[1]];
        const tg = [-s * EA[0] + co * EB[0], -s * EA[1] + co * EB[1]], tl = Math.hypot(tg[0], tg[1]) || 1;
        const w = 15 * (.38 + .62 * Math.abs(co)) / tl;
        const P = (u, ww) => [HUB[0] + rd[0] * u + tg[0] * w * ww, HUB[1] + rd[1] * u + tg[1] * w * ww];
        c.globalAlpha = entrada * (1 - ramp(q, 45, 80, (x) => x) * .55) * Math.min(1, 1.5 / N * (1 + 40 / (1 + q)));
        const luz = clamp(.5 + .5 * Math.sin(ph + 2.2));
        const g = Math.round(26 + luz * 95);
        c.fillStyle = desenho ? `rgb(${g + 10},${g + 30},${g + 12})` : `rgb(${g},${g + 1},${g + 3})`;
        const a1 = P(.14, -.5), a2 = P(.5, -1), a3 = P(.92, -.72), a4 = P(1, 0), a5 = P(.92, .72), a6 = P(.5, 1), a7 = P(.14, .5);
        c.beginPath(); c.moveTo(a1[0], a1[1]); c.lineTo(a2[0], a2[1]); c.lineTo(a3[0], a3[1]); c.lineTo(a4[0], a4[1]); c.lineTo(a5[0], a5[1]); c.lineTo(a6[0], a6[1]); c.lineTo(a7[0], a7[1]); c.closePath(); c.fill();
      }
    }
    // véu do disco, como em foto com hélice girando; no desenho, o anel amarelo do começo do filme
    const d = ramp(q, 30, 80, (x) => x);
    if (d > 0) {
      const eixo = Math.atan2(EA[1], EA[0]), ra = Math.hypot(EA[0], EA[1]), rb = Math.hypot(EB[0], EB[1]);
      c.globalAlpha = d * .2; c.fillStyle = desenho ? '#d6dccf' : '#bfc5c7';
      c.beginPath(); c.ellipse(HUB[0], HUB[1], ra, rb, eixo, 0, 7); c.fill();
      if (desenho) {
        c.globalAlpha = d * .75; c.strokeStyle = '#e9b64a'; c.lineWidth = 15;
        c.beginPath(); c.ellipse(HUB[0], HUB[1], ra * .94, rb * .94, eixo, 0, 7); c.stroke();
      }
    }
    c.globalAlpha = 1;
  }

  // O avião num dos dois mundos. Quem chama escolhe o contexto e as imagens; a física é a mesma.
  function pose(t) {
    const z = zoom(t), h = alt(t), tilt = inclina(h), dx = dxPlano(t);
    const vb = Math.min(1, V(t) / 900) * (t < T.lo ? 1 : 1 - ramp(t, T.lo, T.lo + .5));
    const trep = (Math.sin(t * 71) * .6 + Math.sin(t * 113.7) * .5) * vb * 1.1;
    const motor = ramp(rpm(t), 8, 70, (x) => x) * (t < T.lo ? .22 : 0);
    const trepm = Math.sin(t * 97) * motor;
    const ph = arfagem(t) + .004 * Math.min(1, V(t) / 500) * (t < T.rot ? 1 : 0);
    return { z, h, tilt, dx, trep, trepm, ph, spin: X(t) / 120 };
  }
  const camera = (c, z) => { c.setTransform(1, 0, 0, 1, 0, 0); c.translate(960, 620); c.scale(z, z); c.translate(-960, -620); };
  function aviao(t, c, A, sombraSim = true) {
    const P = pose(t);
    camera(c, P.z);
    if (sombraSim) {
      // Sombra real, presa ao chão: afasta e dissolve conforme o avião sobe
      c.save();
      c.globalAlpha = 1 - ramp(P.h, 0, 620, (x) => x) * .85;
      c.translate(P.dx, P.tilt + P.trep * .2);
      const sb = Math.min(P.h / 24, 16);
      if (sb > .4) c.filter = `blur(${sb.toFixed(1)}px)`;
      c.drawImage(sombra, 0, -Y0 + 1090 * K + P.h * .24, 2160 * K, 140 * K);
      c.filter = 'none';
      c.restore();
    }
    // Corpo: gira em torno do eixo das rodas principais
    c.save();
    c.translate(P.dx, P.tilt - P.h + P.trep + P.trepm);
    c.translate(PIVO[0] * K, PIVO[1] * K - Y0); c.rotate(P.ph); c.translate(-PIVO[0] * K, -PIVO[1] * K + Y0);
    c.translate(0, -Y0); c.scale(K, K);
    c.drawImage(A.corpo, 0, 0);
    if (A.rodas !== false) { roda(c, A.corpo, RODAS.nariz, P.spin * 1.35); roda(c, A.corpo, RODAS.la, P.spin); }
    if (A.helice !== false) helice(t, c, A.desenho, A.pas);
    c.restore();
    // Perto: asa e trem esquerdo, no mesmo eixo; quase não sobem na rotação
    c.save();
    c.translate(P.dx, P.tilt - P.h + P.trep * .85);
    const rp = [720 * K, 1000 * K - Y0];
    c.translate(rp[0], rp[1]); c.rotate(P.ph * .28); c.translate(-rp[0], -rp[1]);
    c.translate(0, -Y0); c.scale(K, K);
    c.drawImage(A.perto, 0, 0);
    if (A.rodas !== false) roda(c, A.perto, RODAS.perto, P.spin);
    c.restore();
    c.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Uma faixa de luz atravessa só o avião, depois que a foto assenta
  const brilho = tela(), bx = brilho.getContext('2d');
  function luzSobre(u) {
    if (u <= 0 || u >= 1) return;
    const lx = 150 + 1750 * io3(u);
    bx.globalCompositeOperation = 'source-over'; bx.clearRect(0, 0, 1920, 1080); bx.drawImage(fg, 0, 0);
    bx.globalCompositeOperation = 'source-in';
    const g = bx.createLinearGradient(lx - 280, 0, lx + 280, 320);
    g.addColorStop(0, 'rgba(246,242,232,0)'); g.addColorStop(.5, 'rgba(246,242,232,1)'); g.addColorStop(1, 'rgba(246,242,232,0)');
    bx.fillStyle = g; bx.fillRect(0, 0, 1920, 1080);
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.globalCompositeOperation = 'overlay'; f.globalAlpha = .55 * Math.sin(Math.PI * u);
    f.drawImage(brilho, 0, 0);
    f.globalCompositeOperation = 'source-over'; f.globalAlpha = 1;
  }

  // ── A mistura ─────────────────────────────────────────────
  // Camada por cima da foto: o mundo desenhado, recortado por uma máscara que anda por dentro do avião.
  const dw = tela(); dw.style.cssText = 'position:absolute;inset:0;width:1920px;height:1080px;display:none';
  fg.parentElement.appendChild(dw);
  const dc = dw.getContext('2d');
  const lw = tela(), lc = lw.getContext('2d');       // só o traço
  const gw = tela(), gc = gw.getContext('2d');       // a luz da fronteira
  // máscaras em baixa resolução, ampliadas com suavização
  const MW = 480, MH = 270;
  const mk = () => { const c = document.createElement('canvas'); c.width = MW; c.height = MH; return c; };
  const mPreen = mk(), mTraco = mk(), mLuz = mk();
  const iPreen = mPreen.getContext('2d').createImageData(MW, MH), iTraco = mTraco.getContext('2d').createImageData(MW, MH), iLuz = mLuz.getContext('2d').createImageData(MW, MH);
  // ruído de valor, com semente fixa: a fronteira é orgânica e sempre igual no mesmo quadro
  const RU = new Float32Array(MW * MH);
  {
    let s = 917;
    const rnd = () => ((s = Math.imul(s ^ (s >>> 15), s | 1) + 0x6d2b79f5 | 0), ((s ^ (s >>> 14)) >>> 0) / 4294967296);
    const oct = (cel) => {
      const gw2 = Math.ceil(MW / cel) + 2, gh2 = Math.ceil(MH / cel) + 2, G = Float32Array.from({ length: gw2 * gh2 }, rnd);
      return (x, y) => {
        const gx = x / cel, gy = y / cel, ix = Math.floor(gx), iy = Math.floor(gy), fx = sm(gx - ix), fy = sm(gy - iy);
        const v = (i, j) => G[(iy + j) * gw2 + ix + i];
        return (v(0, 0) * (1 - fx) + v(1, 0) * fx) * (1 - fy) + (v(0, 1) * (1 - fx) + v(1, 1) * fx) * fy;
      };
    };
    const o1 = oct(64), o2 = oct(26), o3 = oct(10);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) RU[y * MW + x] = .55 * o1(x, y) + .3 * o2(x, y) + .15 * o3(x, y) - .5;
  }
  function frente(t) {
    if (t <= FRENTE[0][0]) return { c: FRENTE[0][1], v: 0 };
    for (let i = 0; i < FRENTE.length - 1; i++) {
      const [a, ca] = FRENTE[i], [b2, cb] = FRENTE[i + 1];
      if (t < b2) { const u = (t - a) / (b2 - a); return { c: ca + (cb - ca) * sm(u), v: Math.sign(cb - ca) }; }
    }
    return { c: FRENTE[FRENTE.length - 1][1], v: 0 };
  }
  function mascaras(t) {
    const { c, v } = frente(t), W2 = .07;
    const voltaReal = v > 0 ? 1 : .35;
    let algum = false;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const i = y * MW + x, xn = x / MW + RU[i] * .42 + (y / MH - .5) * .12;
      const p = sm(clamp((xn - c + W2) / (2 * W2)));                 // 1 = desenho
      const l = sm(clamp((xn - (c - .11) + W2) / (2 * W2)));         // o traço vai na frente e fica depois
      const g = Math.max(0, 1 - Math.abs(xn - c) / .035) * voltaReal;
      iPreen.data[i * 4 + 3] = p * 255; iTraco.data[i * 4 + 3] = l * 255; iLuz.data[i * 4 + 3] = g * 255;
      if (p > .002 || l > .002) algum = true;
    }
    mPreen.getContext('2d').putImageData(iPreen, 0, 0); mTraco.getContext('2d').putImageData(iTraco, 0, 0); mLuz.getContext('2d').putImageData(iLuz, 0, 0);
    return algum;
  }
  const recorta = (c, m) => { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-in'; c.imageSmoothingQuality = 'high'; c.drawImage(m, 0, 0, 1920, 1080); c.globalCompositeOperation = 'source-over'; };

  function mistura(t) {
    if (t < FRENTE[0][0] || !mascaras(t)) { dw.style.display = 'none'; return; }
    dw.style.display = 'block';
    // 1. o mundo desenhado, cenário e avião, só onde a fronteira já passou
    dc.setTransform(1, 0, 0, 1, 0, 0); dc.clearRect(0, 0, 1920, 1080);
    drawFundo(t, dc, DES.tile, DES.rastro);
    aviao(t, dc, DES);
    recorta(dc, mPreen);
    // 2. o traço do desenho, um pouco à frente: aparece sobre o real antes da cor, e demora a sair
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, 1920, 1080);
    aviao(t, lc, { corpo: LINHA.corpo, perto: LINHA.perto, rodas: false, helice: false }, false);
    recorta(lc, mTraco);
    dc.globalAlpha = .9; dc.drawImage(lw, 0, 0); dc.globalAlpha = 1;
    // 3. a luz da fronteira: forte no avião, quase nada no cenário
    gc.setTransform(1, 0, 0, 1, 0, 0); gc.clearRect(0, 0, 1920, 1080);
    gc.filter = 'blur(10px)'; gc.drawImage(mLuz, 0, 0, 1920, 1080); gc.filter = 'none';
    gc.globalCompositeOperation = 'source-in'; gc.fillStyle = 'rgb(255,236,196)'; gc.fillRect(0, 0, 1920, 1080);
    gc.globalCompositeOperation = 'source-over';
    dc.globalCompositeOperation = 'lighter';
    dc.globalAlpha = .18; dc.drawImage(gw, 0, 0);
    gc.globalCompositeOperation = 'destination-in'; gc.drawImage(fg, 0, 0); gc.globalCompositeOperation = 'source-over';
    dc.globalAlpha = .42; dc.drawImage(gw, 0, 0);
    dc.filter = 'blur(26px)'; dc.globalAlpha = .38; dc.drawImage(gw, 0, 0); dc.filter = 'none';
    dc.globalAlpha = 1; dc.globalCompositeOperation = 'source-over';
  }

  function paintReal(t, varre = 0) {
    const M = soDesenho ? DES : REAL;
    drawFundo(t, b, M.tile, M.rastro);
    f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, 1920, 1080);
    aviao(t, f, M);
    luzSobre(varre);
    if (!soDesenho) mistura(t);
  }
  return { paintReal };
}
