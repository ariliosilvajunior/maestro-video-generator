// risograph, versão autoral: três cartazes do canal em duas tintas, carimbados no compasso.
// Um relógio só: render(t) desenha o quadro inteiro a partir do tempo. Sem Math.random, Date.now ou timers. Loop de 12 s.

// ---------------------------------------------------------------- variáveis do estilo
const W = 1920, H = 1080, DUR = 12, M = 80;
const COR = { papel: '#F5F0E6', rosa: '#FF48B0', azul: '#0078BF', vazado: '#FFFFFF' };
const DISPLAY = "'Archivo Black'", MONO = "'Space Mono'";
const DESLOC = 1.5;                                          // o quadro 0 cai no início do deslize da retícula: emenda suave e batidas alinhadas à grade de 0,5 s
const REGISTRO = [5, -3];                                    // a chapa azul fica 5 px para a direita e 3 px para cima
const CARTAZ_A = { cima: 'AO', baixo: 'VIVO', tam: 470, rotulos: ['TODA QUARTA', 'ÀS 19H'] };
const CARTAZ_B = { palavra: 'CODE', tam: 600, rotulo: 'SEM TECNIQUÊS' };
const CARTAZ_C = { cima: 'NOVO', baixo: 'VÍDEO', tamCima: 400, tamBaixo: 330, rotulo: 'NO CANAL' };
const ROLOS = [{ T: 3.5, dir: 'RL', s: 0 }, { T: 7.5, dir: 'TB', s: 1 }, { T: 11.5, dir: 'LR', s: 2 }];
const BARRAS = [{ tinta: 'azul', a: 0, b: 128 }, { tinta: 'azul', a: 150, b: 186 }, { tinta: 'azul', a: 204, b: 216 }, { tinta: 'rosa', a: 70, b: 172 }];
const BATIDAS_TRANCO = [0, 0.5, 1, 4, 4.25, 4.5, 4.75, 6, 8.5, 9, 9.5];

// ---------------------------------------------------------------- utilidades
const ease = (() => { const c = {}; return n => c[n] || (c[n] = gsap.parseEase(n)); })();
const seg = (t, ini, dur, curva) => ease(curva || 'expo.out')(Math.min(1, Math.max(0, (t - ini) / dur)));
const mix = (a, b, p) => a + (b - a) * p;
function semente(s) { let a = s >>> 0; return () => { a = (a + 0x9E3779B9) | 0; let x = a ^ (a >>> 16); x = Math.imul(x, 0x21F0AAAD); x ^= x >>> 15; x = Math.imul(x, 0x735A2D97); x ^= x >>> 15; return (x >>> 0) / 4294967296; }; }
const JR = semente(21), TREMOR = Array.from({ length: 24 }, () => [JR() * 3 - 1.5, JR() * 3 - 1.5]);
const KR = semente(33), TRANCO = BATIDAS_TRANCO.map(() => [(KR() < 0.5 ? -1 : 1) * (4 + 3 * KR()), (KR() < 0.5 ? -1 : 1) * (3 + 3 * KR())]);

// ---------------------------------------------------------------- camadas: papel, tinta azul, tinta rosa, grão, falhas
const cv = document.getElementById('cv'), c = cv.getContext('2d');
const camada = () => { const k = document.createElement('canvas'); k.width = W; k.height = H; return k; };
const AZ = camada(), RO = camada(), az = AZ.getContext('2d'), ro = RO.getContext('2d');
// grão fixo (multiply) e falhas de tinta na cor do papel: gerados uma vez com semente
const grao = camada(), falhas = camada();
{
  const g = grao.getContext('2d'), r = semente(9), m = document.createElement('canvas'); m.width = 40; m.height = 23;
  const mx = m.getContext('2d'), md = mx.createImageData(40, 23), rr = semente(3);
  for (let i = 0; i < 40 * 23; i++) { const v = rr() * 255; md.data.set([v, v, v, 255], i * 4); } mx.putImageData(md, 0, 0);
  g.imageSmoothingEnabled = true; g.drawImage(m, 0, 0, W, H);
  const d = g.getImageData(0, 0, W, H), p = d.data;
  for (let i = 0; i < p.length; i += 4) { const n = r(), q = p[i] / 255; const v = 255 - 16 * n * n - 9 * q - (n > 0.9985 ? 70 : 0); p[i] = v; p[i + 1] = v - 1; p[i + 2] = v - 3; p[i + 3] = 255; }
  g.putImageData(d, 0, 0);
  const f = falhas.getContext('2d'), r2 = semente(5); f.fillStyle = COR.papel;
  for (let i = 0; i < 52000; i++) { const x = r2() * W, y = r2() * H, rad = 0.5 + 1.4 * r2() * r2(); f.globalAlpha = 0.45 + 0.55 * r2(); f.beginPath(); f.arc(x, y, rad, 0, Math.PI * 2); f.fill(); }
}
// padrão de pontos azuis para a chapa em retícula
const pontos = (() => { const k = document.createElement('canvas'); k.width = k.height = 19; const x = k.getContext('2d'); x.fillStyle = COR.azul; x.beginPath(); x.arc(9.5, 9.5, 7.6, 0, Math.PI * 2); x.fill(); return az.createPattern(k, 'repeat'); })();

// ---------------------------------------------------------------- peças de impressão
function reticula(x, cx, cy, R, cel, ang, tamanho, cor) {        // pontos numa grade girada, recortados num círculo
  x.save(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.clip(); x.fillStyle = cor;
  const co = Math.cos(ang), si = Math.sin(ang), n = Math.ceil(R / cel) + 2; x.beginPath();
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    const px = cx + (i * co - j * si) * cel, py = cy + (i * si + j * co) * cel, dx = px - cx, dy = py - cy;
    if (dx * dx + dy * dy > (R + cel) * (R + cel)) continue;
    const r = tamanho(dx / R, dy / R) * cel; if (r < 0.6) continue;
    x.moveTo(px + r, py); x.arc(px, py, r, 0, Math.PI * 2);
  }
  x.fill(); x.restore();
}
function listras(x, x0, y0, w, h, larg, passo, fase, cor, rot) {   // faixa de listras verticais que anda com a fase
  x.save(); x.translate(x0, y0); if (rot) x.rotate(rot * Math.PI / 180); x.beginPath(); x.rect(0, 0, w, h); x.clip(); x.fillStyle = cor;
  for (let px = -passo + (fase % passo); px < w + passo; px += passo) x.fillRect(px, -10, larg, h + 20);
  x.restore();
}
let metr = null;
function medir() { c.font = `100px ${DISPLAY}`; const m = c.measureText('H'); metr = { cap: m.actualBoundingBoxAscent / 100 }; }
// carimbo: pousa dura, escala 1,12 → 1 com giro pequeno assentando; sem fade
const carimbo = (tt, t0, r0) => tt < t0 ? null : (p => ({ s: mix(1.12, 1, p), r: mix(r0 || 0, 0, p) * Math.PI / 180 }))(seg(tt, t0, 0.25, 'power4.out'));
function palavra(x, txt, px, base, tam, cor, ca, extra) {          // palavra em Archivo Black, carimbada; origem do giro no meio
  if (!ca) return;
  x.save(); x.font = `${tam}px ${DISPLAY}`; x.letterSpacing = `${-0.02 * tam}px`; x.textBaseline = 'alphabetic';
  const w = x.measureText(txt).width, ox = px + w / 2, oy = base - metr.cap * tam * 0.38;
  x.translate(ox, oy); x.rotate(ca.r); x.scale(ca.s, ca.s); x.translate(-ox, -oy);
  if (extra) extra(x, w); x.fillStyle = cor; x.fillText(txt, px, base); x.restore();
}
function rotulo(x, txt, px, py, cor, p, dir) {                      // rótulo em Space Mono subindo por uma máscara de 40 px
  if (p <= 0) return;
  x.save(); x.beginPath(); x.rect(px - 4, py, 700, 40); x.clip(); x.font = `700 28px ${MONO}`; x.letterSpacing = '2.2px'; x.textBaseline = 'alphabetic'; x.fillStyle = cor; x.textAlign = dir || 'left';
  x.fillText(txt, px, py + 30 + (1 - p) * 40); x.restore();
}
function marcas(x, cor) { x.save(); x.strokeStyle = cor; x.lineWidth = 4; for (const [px, py] of [[40, 40], [W - 40, H - 40]]) { x.beginPath(); x.arc(px, py, 16, 0, Math.PI * 2); x.moveTo(px, py - 26); x.lineTo(px, py + 26); x.moveTo(px - 26, py); x.lineTo(px + 26, py); x.stroke(); } x.restore(); }

// ---------------------------------------------------------------- os cartazes (cada um desenha nas duas tintas)
function cartazA(tt) {
  const cx = 1330, cy = 560, R = 410;
  const ca = carimbo(tt, 0, -2);
  if (ca) { ro.save(); ro.translate(cx, cy); ro.rotate(ca.r); ro.scale(ca.s, ca.s); ro.fillStyle = COR.rosa; ro.beginPath(); ro.arc(0, 0, R, 0, Math.PI * 2); ro.fill(); ro.restore(); }
  if (tt >= 1.5) { const sA = seg(tt, 1.5, 0.5); const hx = 1560 + (1 - sA) * 260, hy = 250 - (1 - sA) * 700; az.save(); az.translate(hx, hy); az.rotate((1 - sA) * 18 * Math.PI / 180); reticula(az, 0, 0, 350, 24, 0.26, (u, v) => Math.min(0.62, 0.1 + 0.32 * (1 + 0.7 * u + 0.7 * v)), COR.azul); az.restore(); }
  palavra(ro, CARTAZ_A.cima, M - 8, 92 + metr.cap * CARTAZ_A.tam, CARTAZ_A.tam, COR.rosa, carimbo(tt, 0.5, 1.5));
  palavra(az, CARTAZ_A.baixo, M - 8, H - 92, CARTAZ_A.tam, COR.azul, carimbo(tt, 1.0, -1.5));
  if (tt >= 2) { const r = seg(tt, 2.0, 0.5), st = seg(tt, 2.5, 0.4) + seg(tt, 3.0, 0.4); listras(az, M, 478, (W - 2 * M) * r, 132, 18, 36, st * 54, COR.azul); }
  const l1 = seg(tt, 2.0, 0.4), l2 = seg(tt, 3.0, 0.4, 'expo.inOut');
  az.save(); az.beginPath(); az.rect(W - M - 700, H - M - 34, 700, 40); az.clip();
  az.font = `700 28px ${MONO}`; az.letterSpacing = '2.2px'; az.textAlign = 'right'; az.fillStyle = COR.azul; az.textBaseline = 'alphabetic';
  if (l1 > 0) az.fillText(CARTAZ_A.rotulos[0], W - M, H - M - 4 + (1 - l1) * 40 - l2 * 40);
  if (l2 > 0) az.fillText(CARTAZ_A.rotulos[1], W - M, H - M - 4 + (1 - l2) * 40);
  az.restore();
}
function cartazB(tt) {
  const tam = CARTAZ_B.tam, base = 540 + metr.cap * tam / 2 + 10;
  // letras rosa carimbam uma a uma
  ro.save(); ro.font = `${tam}px ${DISPLAY}`; ro.letterSpacing = `${-0.02 * tam}px`; ro.textBaseline = 'alphabetic';
  let px = M - 14; const xs = [];
  for (const ch of CARTAZ_B.palavra) { xs.push(px); px += ro.measureText(ch).width - 0.02 * tam; }
  [...CARTAZ_B.palavra].forEach((ch, i) => { const ca = carimbo(tt, 4 + i * 0.25, i % 2 ? 2 : -2); if (!ca) return; const w = ro.measureText(ch).width, ox = xs[i] + w / 2, oy = base - metr.cap * tam * 0.3; ro.save(); ro.translate(ox, oy); ro.rotate(ca.r); ro.scale(ca.s, ca.s); ro.translate(-ox, -oy); ro.fillStyle = COR.rosa; ro.fillText(ch, xs[i], base); ro.restore(); });
  ro.restore();
  // chapa azul em retícula: pousa longe do registro e encaixa a 18 px
  if (tt >= 6) { const sn = seg(tt, 6.5, 0.35), pousa = seg(tt, 6.0, 0.25, 'power4.out'); az.save(); az.translate(mix(64, 18, sn), mix(-46, 14, sn)); const s = mix(1.08, 1, pousa); az.translate(960, 540); az.scale(s, s); az.translate(-960, -540); az.font = `${tam}px ${DISPLAY}`; az.letterSpacing = `${-0.02 * tam}px`; az.textBaseline = 'alphabetic'; az.fillStyle = pontos; az.fillText(CARTAZ_B.palavra, M - 14, base); az.restore(); }
  // faixa inclinada: entra deslizando e anda a cada batida
  if (tt >= 5) { const sb = seg(tt, 5.0, 0.5), passo = [5.5, 6.0, 6.5, 7.0].reduce((a, b) => a + seg(tt, b, 0.4), 0); listras(az, -300 + (1 - sb) * 2400, 760, 2800, 250, 22, 48, passo * 72, COR.azul, 9); }
  rotulo(ro, CARTAZ_B.rotulo, M, M + 4, COR.rosa, seg(tt, 7.0, 0.4));
}
function cartazC(tt) {
  const SX = 1430, SY = 1150, SR = 640, sobe = seg(tt, 8.0, 0.6), sy = SY + (1 - sobe) * 760;
  let incha = 0; [9.5, 10, 10.5, 11].forEach(b => { incha += 0.09 * seg(tt, b, 0.3); });
  reticula(az, SX, sy, SR, 26, 0.26 + 0.3 * (1 - sobe), (u, v) => Math.min(0.66, (0.12 + 0.5 * (v + 1) / 2 + 0.25 * (1 - Math.hypot(u, v))) * (1 + incha)), COR.azul);
  if (tt >= 9.5) {                                                   // anéis rosa com pulsos a cada batida
    const rl = seg(tt, 9.5, 0.25, 'power4.out'); ro.save(); ro.strokeStyle = COR.rosa;
    for (let i = 0; i < 14; i++) { const r = SR + 40 + i * 96; let pu = 0; for (const b of [9.5, 10, 10.5, 11, 11.5]) { const d = tt - b; if (d >= 0) { const x = (r - SR - 1150 * d) / 110; pu += Math.exp(-x * x); } } pu = Math.min(1, pu); ro.lineWidth = (Math.max(7, 20 - (r - SR) / 90) + 26 * pu) * mix(0.4, 1, rl); ro.beginPath(); ro.arc(SX, sy, Math.max(1, (r + 12 * pu) * mix(1.04, 1, rl)), 0, Math.PI * 2); ro.stroke(); }
    ro.restore();
  }
  palavra(az, CARTAZ_C.cima, M - 8, 92 + metr.cap * CARTAZ_C.tamCima, CARTAZ_C.tamCima, COR.azul, carimbo(tt, 8.5, -1.5));
  const cs = carimbo(tt, 9.0, 1.5);
  palavra(ro, CARTAZ_C.baixo, M - 6, H - 92, CARTAZ_C.tamBaixo, COR.vazado, cs, (x) => { x.lineJoin = 'round'; x.strokeStyle = COR.vazado; x.lineWidth = 44; x.strokeText(CARTAZ_C.baixo, M - 6, H - 92); });   // vazado: corta os anéis
  palavra(ro, CARTAZ_C.baixo, M - 6, H - 92, CARTAZ_C.tamBaixo, COR.rosa, cs);
  rotulo(az, CARTAZ_C.rotulo, W - M, M + 4, COR.azul, seg(tt, 10.0, 0.4), 'right');
}
const CARTAZES = [cartazA, cartazB, cartazC];

// ---------------------------------------------------------------- o quadro
function render(t) {
  if (![`40px ${DISPLAY}`, `700 40px ${MONO}`].every(f => document.fonts.check(f))) return;
  if (!metr) medir();
  const tt = (t + DESLOC) % DUR;
  // registro: a chapa azul fica fora, treme 1-2 px por batida e leva um tranco a cada carimbo
  const batida = Math.floor(tt * 2 + 1e-6) % 24;
  let rx = REGISTRO[0] + TREMOR[batida][0], ry = REGISTRO[1] + TREMOR[batida][1];
  BATIDAS_TRANCO.forEach((h, i) => { const d = tt - h; if (d >= 0 && d < 0.6) { const k = Math.exp(-d * 16); rx += TRANCO[i][0] * k; ry += TRANCO[i][1] * k; } });

  az.clearRect(0, 0, W, H); ro.clearRect(0, 0, W, H);
  // qual folha está no tambor, e o rolo que a limpa
  const atual = Math.min(2, Math.floor(tt / 4));
  let recorte = null, rolo = null;
  for (const w of ROLOS) { if (tt >= w.T - 0.1 && tt < w.T + 0.5) { const e = seg(tt, w.T - 0.1, 0.6, w.dir === 'TB' ? 'sine.inOut' : 'power2.inOut'); const L = w.dir === 'TB' ? H : W; rolo = { w, frente: mix(-40, L + 260, e) }; recorte = rolo.frente - 64; } }
  for (const x of [az, ro]) {
    x.save();
    if (rolo) { x.beginPath(); if (rolo.w.dir === 'LR') x.rect(recorte, -20, W + 40, H + 40); else if (rolo.w.dir === 'RL') x.rect(-20, -20, W - recorte + 20, H + 40); else x.rect(-20, recorte, W + 40, H + 40); x.clip(); }
    x.__ativo = true;
  }
  CARTAZES[atual](tt);
  az.restore(); ro.restore();
  if (rolo) for (const b of BARRAS) {                               // o rolo: barras medidas de trás da frente
    const x = b.tinta === 'azul' ? az : ro, a = rolo.frente - b.b, len = b.b - b.a; x.fillStyle = COR[b.tinta];
    if (rolo.w.dir === 'TB') x.fillRect(-20, a, W + 40, len); else if (rolo.w.dir === 'LR') x.fillRect(a, -20, len, H + 40); else x.fillRect(W - a - len, -20, len, H + 40);
  }
  marcas(az, COR.azul); marcas(ro, COR.rosa);

  // composição: papel, chapa azul (fora de registro) e chapa rosa em multiply, grão em multiply, falhas de tinta por cima
  c.save();
  c.fillStyle = COR.papel; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'multiply';
  c.drawImage(AZ, rx, ry); c.drawImage(RO, 0, 0); c.drawImage(grao, 0, 0);
  c.globalCompositeOperation = 'source-over'; c.drawImage(falhas, 0, 0);
  c.restore();
}

// ---------------------------------------------------------------- relógio
const rel = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(rel, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(rel.t % DUR) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
window.addEventListener('load', () => render(tl.time() % DUR));
document.fonts.ready.then(() => { metr = null; render(tl.time() % DUR); });
