// blueprint, versão autoral: uma tecla de teclado mecânico em corte, numa folha de projeto que se desenha sozinha.
// Um relógio só: render(t) desenha o quadro inteiro a partir do tempo. Sem Math.random, Date.now ou timers. Loop de 12 s.

// ---------------------------------------------------------------- variáveis do estilo
const W = 1920, H = 1080, DUR = 12;
const COR = { fundo: '#0E3A66', traco: '#CFE3F7', grade: '#1C4D80', texto: '#EAF3FC', acento: '#FFD23F' };
const MONO = "'IBM Plex Mono'";
const GRADE_FINA = 24, GRADE_PESADA = 120, PARALAXE = 0.3;
const T_EXPLODE = 3.2, T_MONTA = 9.0;                          // vista explodida e remontagem
const LARG = { contorno: 2, fino: 1.25, construcao: 1, oculta: 1.5, cota: 1.5, ext: 1.25, guia: 1.5 };

// ---------------------------------------------------------------- utilidades
const ease = (() => { const c = {}; return n => c[n] || (c[n] = gsap.parseEase(n)); })();
const seg = (t, ini, dur, curva) => ease(curva || 'power1.inOut')(Math.min(1, Math.max(0, (t - ini) / dur)));
const mix = (a, b, p) => a + (b - a) * p;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mistura = (a, b, p) => `rgb(${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * p)).join(',')})`;

// ---------------------------------------------------------------- mini-construtor de caminhos (amostrados)
// Cada caminho vira uma lista de pontos [x, y, salto]; sabemos o comprimento e desenhamos qualquer trecho [a, b].
function P() {
  const o = { pts: [], acum: [], len: 0 };
  let ini = null;
  const add = (x, y, salto) => {
    const u = o.pts[o.pts.length - 1];
    const d = (salto || !u) ? 0 : Math.hypot(x - u[0], y - u[1]);
    o.len += d; o.pts.push([x, y, !!salto]); o.acum.push(o.len); if (salto) ini = [x, y];
  };
  const cur = () => o.pts[o.pts.length - 1];
  o.M = (x, y) => { add(x, y, true); return o; };
  o.L = (x, y) => { add(x, y); return o; };
  o.H = x => { add(x, cur()[1]); return o; };
  o.V = y => { add(cur()[0], y); return o; };
  o.A = (cx, cy, r, a0, a1) => { const n = Math.max(6, Math.round(Math.abs(a1 - a0) / 6)); for (let k = 1; k <= n; k++) { const a = (a0 + (a1 - a0) * k / n) * Math.PI / 180; add(cx + r * Math.cos(a), cy + r * Math.sin(a)); } return o; };
  o.Q = (cx, cy, x, y) => { const [x0, y0] = cur(); for (let k = 1; k <= 10; k++) { const u = k / 10, m = 1 - u; add(m * m * x0 + 2 * m * u * cx + u * u * x, m * m * y0 + 2 * m * u * cy + u * u * y); } return o; };
  o.Z = () => { if (ini) add(ini[0], ini[1]); return o; };
  o.path2d = () => { const p = new Path2D(); o.pts.forEach(([x, y, s]) => s ? p.moveTo(x, y) : p.lineTo(x, y)); return p; };
  return o;
}
function pontoEm(f, s) {
  s = clamp(s, 0, f.len);
  let i = 1; while (i < f.acum.length - 1 && f.acum[i] < s) i++;
  const a = f.pts[i - 1], b = f.pts[i], d = f.acum[i] - f.acum[i - 1], u = d ? (s - f.acum[i - 1]) / d : 1;
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}
function trecho(c, f, a, b) {
  if (b - a < 0.25) return;
  c.beginPath();
  const p0 = pontoEm(f, a); c.moveTo(p0[0], p0[1]);
  for (let i = 0; i < f.pts.length; i++) {
    if (f.acum[i] <= a || f.acum[i] >= b) continue;
    const [x, y, s] = f.pts[i]; s ? c.moveTo(x, y) : c.lineTo(x, y);
  }
  const p1 = pontoEm(f, b); c.lineTo(p1[0], p1[1]);
  c.stroke();
}

// ---------------------------------------------------------------- o desenho (coordenadas locais: eixo da tecla em x = 0, vertical; y cresce para baixo)
// um traço: caminho + quando desenha (t0, dur) + quando apaga (u0, udur)
const tracos = [];
const traco = (parte, f, larg, t0, dur, u0, udur, curva) => { const s = { parte, f, larg, t0, dur, u0, udur, curva }; tracos.push(s); return s; };

// peças: deslocamento Y na explosão (negativo = sobe), ordem de explosão (ei) e de montagem (ai)
const PECAS = {
  tecla:   { X: -330, ei: 3, ai: 0 },
  haste:   { X: -215, ei: 2, ai: 1 },
  carcaca: { X: -100, ei: 1, ai: 2 },
  mola:    { X: 0,    ei: 6, ai: 3 },     // peça interna: fica no lugar
  base:    { X: 115,  ei: 1, ai: 2 },
  placa:   { X: 215,  ei: 2, ai: 1 },
};

// tecla (keycap) em corte: saia larga embaixo, topo mais estreito e levemente côncavo; parede interna
traco('tecla', P().M(-110, -100).L(-90, -150).Q(0, -158, 90, -150).L(110, -100).Z(), 'contorno', 1.0, 0.9, 10.85, 0.6);
traco('tecla', P().M(-96, -100).L(-80, -138).Q(0, -146, 80, -138).L(96, -100), 'fino', 1.5, 0.6, 10.6, 0.4);
traco('tecla', P().M(-18, -138).V(-100).M(18, -138).V(-100), 'fino', 1.8, 0.4, 10.55, 0.3);   // encaixe da haste

// haste (stem): poste em cruz visto de lado; a parte dentro da carcaça é linha oculta
const hasteD = P().M(-18, -100).H(18).V(-40).H(-18).Z().M(0, -100).V(-40);
traco('haste', hasteD, 'contorno', 2.0, 0.6, 10.5, 0.5);
const hasteOculta = hasteD;

// carcaça superior: caixa com abertura para a haste; rebordo
traco('carcaca', P().M(-80, -10).V(-70).H(-26).V(-84).H(26).V(-70).H(80).V(-10).Z(), 'contorno', 0.6, 1.0, 11.0, 0.6);
traco('carcaca', P().M(-80, -24).H(80), 'fino', 1.45, 0.5, 10.5, 0.4);
traco('carcaca', P().M(-66, -70).V(-24).M(66, -70).V(-24), 'fino', 1.53, 0.5, 10.55, 0.4);

// mola (peça-chave): zigue-zague de 8 espiras, de -40 a 40
const molaP = P().M(-24, -40); for (let i = 1; i <= 8; i++) molaP.L(i % 2 ? 24 : -24, -40 + i * 10);
traco('mola', molaP, 'contorno', 2.2, 0.6, 10.5, 0.5);
const molaOculta = molaP;

// base (carcaça inferior): caixa, cavidade, lâmina de contato oculta, dois pinos
traco('base', P().M(-80, -10).H(80).V(60).H(-80).Z(), 'contorno', 1.1, 0.8, 10.9, 0.5);
traco('base', P().M(-62, -10).V(42).H(62).V(-10), 'fino', 1.6, 0.5, 10.6, 0.3);
traco('base', P().M(-30, 60).V(80).H(-22).V(60).M(22, 60).V(80).H(30).V(60), 'fino', 2.2, 0.35, 10.5, 0.3);   // pinos
const contatoOculto = P().M(-50, -4).V(26).L(-38, 40).M(40, 0).V(40).M(-50, 10).H(-40);

// placa de circuito: chapa com duas ilhas de solda
traco('placa', P().M(-150, 80).H(150).V(96).H(-150).Z(), 'contorno', 1.2, 0.8, 10.8, 0.5);
traco('placa', P().M(-150, 88).H(150), 'fino', 1.9, 0.5, 10.55, 0.3);
traco('placa', P().M(-38, 80).V(74).H(-14).V(80).M(14, 80).V(74).H(38).V(80), 'fino', 2.3, 0.3, 10.5, 0.3);

// linhas de construção: disparam pela folha e somem (verticais em pares, para a folha nunca parar mais de 1 s)
const construcao = [];
[-150, -100, -70, -10, 60, 80, 96].forEach((y, i) => construcao.push({ f: P().M(-1300, y).H(1300), t0: 0.15 + 0.05 * i }));
[-110, -80, -24, 24, 80, 110].forEach((x, i) => construcao.push({ f: P().M(x, -800).V(800), t0: [0.75, 0.8, 1.05, 1.1, 1.35, 1.4][i] }));

// rótulos: âncora local na peça (lado direito), comprimento da linha-guia para a direita, tempos
const ROTULOS = [
  { texto: 'TECLA',   parte: 'tecla',   em: [110, -118], L: 200, tin: 4.20, tout: 5.85 },
  { texto: 'HASTE',   parte: 'haste',   em: [18, -76],   L: 290, tin: 4.32, tout: 5.90 },
  { texto: 'CARCAÇA', parte: 'carcaca', em: [80, -40],   L: 230, tin: 4.44, tout: 5.95 },
  { texto: 'MOLA',    parte: 'mola',    em: [24, -10],   L: 286, tin: 4.56, tout: 8.00, chave: true },
  { texto: 'BASE',    parte: 'base',    em: [80, 25],    L: 230, tin: 4.68, tout: 6.00 },
  { texto: 'PLACA',   parte: 'placa',   em: [150, 88],   L: 160, tin: 4.80, tout: 6.05 },
];

// câmera (centro local + escala) por quadros-chave
const CAM = {
  A: { cx: 0,   cy: -25, s: 2.4 },    // vista geral
  H: { cx: 0,   cy: -30, s: 2.8 },    // aproxima enquanto desenha
  E: { cx: 90,  cy: -85, s: 1.2 },    // vista explodida (desenho à esquerda do centro, rótulos à direita)
  F: { cx: 60,  cy: 0,   s: 3.0 },    // na mola
};
const lerpCam = (a, b, p) => ({ cx: mix(a.cx, b.cx, p), cy: mix(a.cy, b.cy, p), s: mix(a.s, b.s, p) });
function camEm(t) {
  let c = CAM.A;
  c = lerpCam(c, CAM.H, seg(t, 1.5, 1.2, 'power2.inOut'));
  c = lerpCam(c, CAM.E, seg(t, 3.15, 1.15, 'power2.inOut'));
  c = lerpCam(c, CAM.F, seg(t, 6.2, 1.2, 'power2.inOut'));
  c = lerpCam(c, CAM.E, seg(t, 8.0, 1.1, 'power2.inOut'));
  c = lerpCam(c, CAM.A, seg(t, 9.0, 1.2, 'power2.inOut'));
  const w = 2 * Math.PI * t / DUR;                                // deriva lenta, um ciclo por loop
  return Object.assign({ dx: 2 * Math.sin(w), dy: 1.5 * Math.sin(w + Math.PI / 2) }, c);   // deriva pequena: a peça é menor que a da referência
}

// explosão: cada peça desliza no eixo vertical com escalonamento e assenta com mola; volta em T_MONTA
function posY(nome, t) {
  const p = PECAS[nome]; if (!p.X) return 0;
  const t0 = T_EXPLODE + p.ei * 0.07, t1 = T_MONTA + p.ai * 0.07;
  let x = p.X * (seg(t, t0, 1.0, 'power3.inOut') - seg(t, t1, 0.95, 'power3.inOut'));
  const e0 = t - (t0 + 1.0), e1 = t - (t1 + 0.95);
  if (e0 > 0) x += p.X * 0.03 * Math.exp(-7 * e0) * Math.sin(2 * Math.PI * 2.0 * e0);
  if (e1 > 0) x -= p.X * 0.02 * Math.exp(-7 * e1) * Math.sin(2 * Math.PI * 2.3 * e1);
  return x;
}

// ---------------------------------------------------------------- desenho
const cv = document.getElementById('cv'), c = cv.getContext('2d');
const F = { rotulo: `500 28px ${MONO}`, numero: `700 32px ${MONO}` };
let hachura = null;
function prepara() {
  const h = document.createElement('canvas'); h.width = 10; h.height = 10; const g = h.getContext('2d');
  g.strokeStyle = COR.traco; g.lineWidth = 1.5; g.globalAlpha = 0.8;
  g.beginPath(); g.moveTo(-2, 12); g.lineTo(12, -2); g.moveTo(-7, 7); g.lineTo(7, -7); g.moveTo(3, 17); g.lineTo(17, 3); g.stroke();
  hachura = c.createPattern(h, 'repeat');
}

function folha() {
  c.save(); c.globalAlpha = 0.45; c.strokeStyle = COR.traco; c.lineWidth = 1; c.fillStyle = COR.traco;
  c.strokeRect(48.5, 48.5, 1823, 983);
  c.beginPath();
  for (let x = 288; x < 1872; x += 240) { c.moveTo(x, 48); c.lineTo(x, 60); c.moveTo(x, 1032); c.lineTo(x, 1020); }
  for (let y = 288; y < 1032; y += 240) { c.moveTo(48, y); c.lineTo(60, y); c.moveTo(1872, y); c.lineTo(1860, y); }
  [[96, 96], [1824, 96], [96, 984], [1824, 984]].forEach(([x, y]) => { c.moveTo(x - 14, y); c.lineTo(x + 14, y); c.moveTo(x, y - 14); c.lineTo(x, y + 14); });
  // bloco de título vazio
  c.moveTo(1512, 1032); c.lineTo(1512, 948); c.lineTo(1872, 948); c.moveTo(1512, 976); c.lineTo(1872, 976); c.moveTo(1632, 948); c.lineTo(1632, 1032); c.moveTo(1752, 976); c.lineTo(1752, 1032);
  c.stroke();
  // barra de escala
  for (let i = 0; i < 10; i++) { c.beginPath(); c.rect(96.5 + i * 24, 1006.5, 24, 8); if (i % 2 === 0) c.fill(); c.stroke(); }
  c.restore();
}

function grades(cam) {
  const gs = 1 + PARALAXE * (cam.s / CAM.A.s - 1);
  const gx = PARALAXE * (cam.s * (CAM.A.cx - cam.cx)) + PARALAXE * cam.dx, gy = PARALAXE * (cam.s * (CAM.A.cy - cam.cy)) + PARALAXE * cam.dy;
  c.save(); c.translate(960 + gx, 540 + gy); c.scale(gs, gs); c.translate(-960, -540);
  c.strokeStyle = COR.grade; c.lineWidth = 1 / gs;
  for (const [passo, alfa, ox, oy] of [[GRADE_FINA, 0.5, 0, 18], [GRADE_PESADA, 1, 96, 66]]) {
    c.globalAlpha = alfa; c.beginPath();
    for (let x = -240 + ox; x < 2200; x += passo) { c.moveTo(x + 0.5, -300); c.lineTo(x + 0.5, 1400); }
    for (let y = -210 + oy; y < 1400; y += passo) { c.moveTo(-300, y + 0.5); c.lineTo(2300, y + 0.5); }
    c.stroke();
  }
  c.restore();
}

// cota entre dois pontos locais: linhas de extensão, duas metades que crescem a partir do vão do número, setas na ponta
function cota(a, b, vao, extD, tin, tout, t, k) {
  const pin = seg(t, tin, 0.3, 'power2.out') - seg(t, tout + 0.2, 0.25, 'power2.in');
  if (pin > 0.001) { c.strokeStyle = COR.texto; c.lineWidth = LARG.ext * k; trecho(c, extD, 0, extD.len * pin); }
  const g = seg(t, tin + 0.15, 0.5, 'expo.out') - seg(t, tout + 0.05, 0.3, 'power2.in');
  if (g <= 0.002) return;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, meio = L / 2;
  const r0 = vao / 2, r1 = r0 + (meio - r0) * g;
  const AH = 16 * k, AW = 5.5 * k;
  c.strokeStyle = COR.texto; c.lineWidth = LARG.cota * k; c.fillStyle = COR.texto;
  for (const sg of [1, -1]) {
    const p0 = [mx + sg * ux * r0, my + sg * uy * r0], p1 = [mx + sg * ux * r1, my + sg * uy * r1];
    c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    const dx = sg * ux, dy = sg * uy;
    c.globalAlpha = Math.min(1, g * 3);
    c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p1[0] - dx * AH - dy * AW, p1[1] - dy * AH + dx * AW); c.lineTo(p1[0] - dx * AH + dy * AW, p1[1] - dy * AH - dx * AW); c.closePath(); c.fill();
    c.globalAlpha = 1;
  }
}

// texto que sobe por uma máscara (espaço de tela)
function textoMascara(s, x, y, alt, p, fonte, cor, tracking) {
  if (p <= 0.001) return;
  c.save(); c.beginPath(); c.rect(x - 2, y, 600, alt); c.clip();
  c.font = fonte; c.letterSpacing = tracking || '0px'; c.fillStyle = cor; c.textBaseline = 'alphabetic';
  c.fillText(s, x, y + alt - 10 + (1 - p) * (alt + 4));
  c.restore();
}

function render(t) {
  if (![F.rotulo, F.numero].every(f => document.fonts.check(f))) return;
  if (!hachura) prepara();
  const cam = camEm(t), k = 1 / cam.s;
  const tx = 960 - cam.s * cam.cx + cam.dx, ty = 540 - cam.s * cam.cy + cam.dy;
  const tela = (x, y) => [tx + cam.s * x, ty + cam.s * y];
  const Y = {}; for (const n in PECAS) Y[n] = posY(n, t);

  c.save();
  c.fillStyle = COR.fundo; c.fillRect(0, 0, W, H);
  grades(cam);
  folha();

  // ---- espaço do desenho (recortado na borda da folha)
  c.save(); c.beginPath(); c.rect(49, 49, W - 98, H - 98); c.clip();
  c.translate(tx, ty); c.scale(cam.s, cam.s);
  c.lineJoin = 'miter'; c.lineCap = 'butt';

  // eixo vertical
  c.save(); c.globalAlpha = 0.55; c.strokeStyle = COR.traco; c.lineWidth = 1 * k; c.setLineDash([48, 10, 6, 10]); c.beginPath(); c.moveTo(0, -1400); c.lineTo(0, 1400); c.stroke(); c.restore();

  // linhas de construção
  const somem = 1 - seg(t, 2.2, 0.4, 'power2.in');
  if (somem > 0.001) {
    c.save(); c.globalAlpha = somem; c.strokeStyle = COR.traco; c.lineWidth = LARG.construcao * k;
    for (const l of construcao) trecho(c, l.f, 0, l.f.len * seg(t, l.t0, 0.5, 'expo.out'));
    c.restore();
  }

  // hachura das paredes da carcaça (seção), entra com limpeza e sai no fim
  const hw = seg(t, 2.1, 0.5, 'power2.inOut') - seg(t, 10.5, 0.3, 'power2.in');
  if (hw > 0.001) {
    c.save(); c.translate(0, Y.carcaca); const y0 = -70 + 46 * seg(t, 10.5, 0.3, 'power2.in');
    c.beginPath(); c.rect(-90, y0, 180, 46 * hw); c.clip();
    c.fillStyle = hachura; c.fillRect(-80, -70, 14, 46); c.fillRect(66, -70, 14, 46);
    c.restore();
  }

  // linhas ocultas: lâmina de contato dentro da base; haste e mola onde as carcaças cobrem
  const ocultaIn = seg(t, 2.1, 0.5, 'power2.out') - seg(t, 10.45, 0.4, 'power2.in');
  const topoCarcaca = -70 + Y.carcaca, baseCarcaca = -10 + Y.carcaca, topoBase = -10 + Y.base, fundoBase = 60 + Y.base;
  if (ocultaIn > 0.001) {
    c.save(); c.strokeStyle = COR.traco; c.lineWidth = LARG.oculta * k; c.setLineDash([9, 7]);
    c.globalAlpha = 0.5 * ocultaIn; c.translate(0, Y.base); trecho(c, contatoOculto, 0, contatoOculto.len);
    c.restore();
    // coberto = dentro da carcaça superior ou dentro da base
    const cobre = () => { c.beginPath(); c.rect(-400, topoCarcaca, 800, baseCarcaca - topoCarcaca); c.rect(-400, topoBase, 800, fundoBase - topoBase); c.clip(); };
    c.save(); c.strokeStyle = COR.traco; c.lineWidth = LARG.oculta * k; c.setLineDash([9, 7]); c.globalAlpha = 0.75 * ocultaIn;
    cobre(); c.save(); c.translate(0, Y.haste); trecho(c, hasteOculta, 0, hasteOculta.len); c.restore();
    c.translate(0, Y.mola); trecho(c, molaOculta, 0, molaOculta.len);
    c.restore();
  }

  // preenchimento amarelo da mola (de baixo para cima) + a própria espiral na cor do fundo por cima
  {
    const fIn = seg(t, 6.25, 0.45, 'power3.inOut'), fOut = seg(t, 8.4, 0.4, 'power2.in');
    const topo = fOut > 0 ? mix(-40, 40, fOut) : mix(40, -40, fIn);
    if (40 - topo > 0.01) {
      c.save(); c.translate(0, Y.mola);
      c.fillStyle = COR.acento; c.fillRect(-24, topo, 48, 40 - topo);
      c.beginPath(); c.rect(-30, topo, 60, 40 - topo); c.clip();
      c.strokeStyle = COR.fundo; c.lineWidth = 2 * k;
      const pe = seg(t, 6.75, 0.5, 'expo.out') - seg(t, 8.22, 0.25, 'expo.out'); if (pe > 0) trecho(c, molaP, 0, molaP.len * pe);
      c.restore();
    }
  }

  // traços de cada peça (desenham, depois apagam); haste e mola sólidas só fora das carcaças
  c.strokeStyle = COR.traco;
  for (const s of tracos) {
    const p = seg(t, s.t0, s.dur, s.curva), q = s.u0 != null ? seg(t, s.u0, s.udur) : 0;
    if (p <= 0.0005 || q >= 0.9995) continue;
    c.save(); c.translate(0, Y[s.parte]); c.lineWidth = LARG[s.larg] * k;
    if (s.parte === 'haste' || s.parte === 'mola') {
      const dy = Y[s.parte];
      c.beginPath(); c.rect(-400, -2000, 800, 2000 + topoCarcaca - dy); c.rect(-400, baseCarcaca - dy, 800, topoBase - baseCarcaca); c.rect(-400, fundoBase - dy, 800, 2000); c.clip();
    }
    trecho(c, s.f, s.f.len * q, s.f.len * p);
    c.restore();
  }

  // cotas (locais): altura total à esquerda; altura da mola à esquerda, mais perto
  const cima = -150 + Y.tecla, baixo = 96 + Y.placa, xc = -230;
  cota([xc, cima], [xc, baixo], 44 * k, P().M(-116, cima).H(xc - 12).M(-156, baixo).H(xc - 12), 4.9, 5.85, t, k);
  const xm = -64, mt = -40 + Y.mola, mb = 40 + Y.mola;
  cota([xm, mt], [xm, mb], 44 * k, P().M(-30, mt).H(xm - 12).M(-30, mb).H(xm - 12), 7.0, 7.95, t, k);
  c.restore();   // fim do espaço do desenho

  // ---- rótulos e números (espaço de tela)
  c.lineCap = 'butt';
  for (const r of ROTULOS) {
    const [ax, ay] = tela(r.em[0], r.em[1] + Y[r.parte]);
    const pl = seg(t, r.tin, 0.4, 'power2.out') - seg(t, r.tout + 0.1, 0.3, 'power2.in');
    const pt = seg(t, r.tin + 0.22, 0.5, 'expo.out') - seg(t, r.tout, 0.25, 'power2.in');
    const quente = r.chave ? seg(t, 6.25, 0.35, 'power2.inOut') - seg(t, 7.8, 0.3, 'power2.inOut') : 0;
    const cor = quente > 0 ? mistura(COR.texto, COR.acento, quente) : COR.texto;
    c.font = F.rotulo; c.letterSpacing = '1.68px'; const w = c.measureText(r.texto).width;
    if (pl > 0.001) {
      const guia = P().M(ax, ay).H(ax + r.L).V(ay - 14).H(ax + r.L + 12 + w + 8);
      c.strokeStyle = cor; c.lineWidth = LARG.guia; trecho(c, guia, 0, guia.len * pl);
      c.fillStyle = cor; c.beginPath(); c.arc(ax, ay, 4 * Math.min(1, pl * 4), 0, Math.PI * 2); c.fill();
    }
    textoMascara(r.texto, ax + r.L + 12, ay - 14 - 44, 40, Math.max(0, pt), F.rotulo, cor, '1.68px');
  }
  {
    c.font = F.numero; c.letterSpacing = '0.64px';
    const [nx, ny] = tela(xc, (cima + baixo) / 2); const w = c.measureText('18').width;
    textoMascara('18', nx - w / 2, ny - 22, 44, Math.max(0, seg(t, 5.2, 0.5, 'expo.out') - seg(t, 5.85, 0.25, 'power2.in')), F.numero, COR.texto, '0.64px');
    const [sx, sy] = tela(xm, (mt + mb) / 2); const w2 = c.measureText('12').width;
    textoMascara('12', sx - w2 / 2, sy - 22, 44, Math.max(0, seg(t, 7.35, 0.5, 'expo.out') - seg(t, 7.95, 0.25, 'power2.in')), F.numero, COR.texto, '0.64px');
  }
  c.restore();
}

// ---------------------------------------------------------------- relógio
const rel = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(rel, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(rel.t % DUR) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
window.addEventListener('load', () => render(tl.time() % DUR));
document.fonts.ready.then(() => render(tl.time() % DUR));
