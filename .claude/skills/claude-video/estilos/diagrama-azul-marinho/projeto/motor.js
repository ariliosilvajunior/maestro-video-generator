// midnight-grid, versão autoral. Um relógio só: render(t) desenha o quadro inteiro a partir do tempo.
// Sem Math.random, sem Date.now, sem timers. Mesmo t, mesma imagem. Loop de 12 s.

// ---------------------------------------------------------------- variáveis do estilo
const W = 1920, H = 1080, DUR = 12;
const COR = { fundo: '#0B1220', pontos: '#1E2A44', painel: '#111A2E', borda: '#22304D', texto: '#E8EDF7', apagado: '#8C98B3', azul: '#3D8BFF' };
const GRADE = 40, PONTO_R = 2;                          // grade de pontos
const NO_W = 640, NO_H = 240, RAIO = 16;                // nó
const PASSO = 800;                                      // distância entre nós (múltiplo de 40)
const ROTULO_PX = 120, ROTULO_TRACK = -0.035;
const PASSOS = ['Pedido', 'Plano', 'Código', 'Teste', 'No ar'];   // o fluxo de um trabalho com o Claude Code
const POS = [[160, 640], [960, 280], [1760, 640], [2560, 280], [3360, 640]];   // zigue-zague espelhado: começa embaixo
const MUNDO = 4200;
// tempos (s)
const ENCHE = [0.2, 2.1, 4.0, 5.9, 7.8];                // trilho de progresso enche
const FIO = [0.9, 2.8, 4.7, 6.6], FIO_DUR = 0.7;        // fio i→i+1 se desenha
const POUSA = [null, 1.6, 3.5, 5.4, 7.3];               // nó pousa
const SAI = [null, 11.20, 10.94, 10.82, 10.70];         // nó sai (desmontagem)
const RECOLHE = [11.28, 11.00, 10.86, 10.72];           // fio recolhe
const VOLTA0 = 8.6, VOLTA_DUR = 2.0;                    // pulso volta para casa
const ATIVO_ON = [10.6, 1.6, 3.5, 5.4, 7.3], ATIVO_OFF = [0.9, 2.8, 4.7, 6.6, 8.6];
const CAM0 = POS[0][0] + NO_W / 2 - W / 2;              // câmera = x do mundo que fica na borda esquerda da tela; nó 1 centrado
const CAM_PASSOS = [[0.6, 1.0, 400], [2.5, 1.2, PASSO], [4.4, 1.2, PASSO], [6.3, 1.2, PASSO]];   // [início, duração, deslocamento]

// ---------------------------------------------------------------- utilidades
const ease = (() => { const c = {}; return n => c[n] || (c[n] = gsap.parseEase(n)); })();
const seg = (t, ini, dur, curva) => ease(curva || 'power3.out')(Math.min(1, Math.max(0, (t - ini) / dur)));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mistura = (a, b, p) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * p)).join(',')})`;
const C = { borda: hex(COR.borda), apagado: hex(COR.apagado), texto: hex(COR.texto), azul: hex(COR.azul) };
const sino = (t, t0, d) => { const p = (t - t0) / d; return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0; };
const cy = i => POS[i][1] + NO_H / 2;

// ---------------------------------------------------------------- fios: polilinha com cantos arredondados, amostrada
function rota(pts, r) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy2] = pts[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy2 - by), rr = Math.min(r, l1 / 2, l2 / 2);
    const p1 = [bx - (bx - ax) / l1 * rr, by - (by - ay) / l1 * rr], p2 = [bx + (cx - bx) / l2 * rr, by + (cy2 - by) / l2 * rr];
    out.push(p1);
    for (let k = 1; k <= 10; k++) {                     // curva quadrática amostrada
      const u = k / 10, m = 1 - u;
      out.push([m * m * p1[0] + 2 * m * u * bx + u * u * p2[0], m * m * p1[1] + 2 * m * u * by + u * u * p2[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  const acum = [0];
  for (let i = 1; i < out.length; i++) acum.push(acum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { pts: out, acum, L: acum[acum.length - 1] };
}
function pontoEm(f, s) {
  s = clamp(s, 0, f.L);
  let i = 1; while (i < f.acum.length - 1 && f.acum[i] < s) i++;
  const a = f.pts[i - 1], b = f.pts[i], d = f.acum[i] - f.acum[i - 1], u = d ? (s - f.acum[i - 1]) / d : 0;
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}
function tracaTrecho(c, f, a, b, cor, larg) {
  if (b - a < 0.5) return;
  c.strokeStyle = cor; c.lineWidth = larg; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  const p0 = pontoEm(f, a); c.moveTo(p0[0], p0[1]);
  for (let i = 0; i < f.pts.length; i++) if (f.acum[i] > a && f.acum[i] < b) c.lineTo(f.pts[i][0], f.pts[i][1]);
  const p1 = pontoEm(f, b); c.lineTo(p1[0], p1[1]);
  c.stroke();
}
const fios = [];
for (let i = 0; i < 4; i++) {
  const x0 = POS[i][0] + NO_W, x1 = POS[i + 1][0], mx = x0 + 80;
  fios.push(rota([[x0, cy(i)], [mx, cy(i)], [mx, cy(i + 1)], [x1, cy(i + 1)]], 32));
}
const portaFim = [POS[4][0] + NO_W / 2, POS[4][1] + NO_H];          // porta de saída do último nó: embaixo
const retorno = rota([portaFim, [portaFim[0], 960], [80, 960], [80, cy(0)], [POS[0][0], cy(0)]], 40);

// ---------------------------------------------------------------- câmera
function cam(t, longe) {
  const E = longe ? 'power2.inOut' : 'power3.inOut', k = longe ? 1.3 : 1;
  if (t < 8) { let x = CAM0; for (const [ini, dur, d] of CAM_PASSOS) x += d * seg(t, ini, dur * k, E); return x; }
  const total = CAM_PASSOS.reduce((s, p) => s + p[2], 0);
  return CAM0 + total * (1 - seg(t, VOLTA0, VOLTA_DUR * (longe ? 1.15 : 1), E));
}

// ---------------------------------------------------------------- desenho
const cv = document.getElementById('cv'), c = cv.getContext('2d');
const F = { rotulo: `700 ${ROTULO_PX}px 'Inter'`, mono: `500 28px 'JetBrains Mono'` };
function retArred(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ativo(i, t) {
  if (i === 0) return t < 5 ? 1 - seg(t, ATIVO_OFF[0], 0.3, 'power2.out') : seg(t, ATIVO_ON[0], 0.25, 'power2.out');
  return seg(t, ATIVO_ON[i], 0.25, 'power2.out') - seg(t, ATIVO_OFF[i], 0.3, 'power2.out');
}

function gradePontos(t) {
  const off = ((20 - cam(t, true)) % GRADE + GRADE) % GRADE;
  c.fillStyle = COR.pontos;
  for (let x = off; x < W; x += GRADE) for (let y = 20; y < H; y += GRADE) { c.beginPath(); c.arc(x, y, PONTO_R, 0, Math.PI * 2); c.fill(); }
}

function porta(x, y, esc, cor) {
  c.beginPath(); c.arc(x, y, 10 * esc, 0, Math.PI * 2);
  c.fillStyle = COR.fundo; c.fill(); c.lineWidth = 3; c.strokeStyle = cor; c.stroke();
}

function no(i, t) {
  const [x, y] = POS[i];
  const pousa = i === 0 ? 1 : seg(t, POUSA[i], 0.5, 'power3.out');
  const sai = i === 0 ? 0 : seg(t, SAI[i], 0.3, 'power2.in');
  const visivel = i === 0 || (t >= POUSA[i] && sai < 1);
  const a = Math.max(0, ativo(i, t));
  if (visivel) {
    const recorte = sai > 0 ? sai : 1 - pousa;             // limpeza: entra da esquerda, sai pela direita
    const dx = -32 * (1 - pousa) - 24 * sai;
    c.save(); c.translate(dx, 0);
    c.beginPath(); c.rect(x - 4, y - 4, (NO_W + 8) * (1 - recorte), NO_H + 8); c.clip();
    retArred(x, y, NO_W, NO_H, RAIO); c.fillStyle = COR.painel; c.fill();
    c.lineWidth = 2; c.strokeStyle = mistura(C.borda, C.azul, a); c.stroke();
    // rótulo sobe pela máscara 0,1 s depois do pouso
    const lp = i === 0 ? 1 : seg(t, POUSA[i] + 0.1, 0.5, 'power3.out');
    c.save(); c.beginPath(); c.rect(x + 48, y + 30, 520, 150); c.clip();
    c.font = F.rotulo; c.letterSpacing = `${ROTULO_TRACK * ROTULO_PX}px`; c.textBaseline = 'alphabetic';
    c.fillStyle = mistura(C.apagado, C.texto, a); c.fillText(PASSOS[i], x + 48, y + 30 + 116 + (1 - lp) * 165);
    c.restore();
    // número do passo (mono) no canto, estoura ao pousar
    const sp = i === 0 ? 1 : seg(t, POUSA[i] + 0.18, 0.35, 'back.out(1.2)');
    c.save(); c.globalAlpha = Math.min(1, sp * 1.4);
    c.font = F.mono; c.letterSpacing = '0px'; c.textAlign = 'right'; c.fillStyle = mistura(C.borda, C.azul, Math.max(a, 0.55 * (1 - a) + a));
    c.fillStyle = a > 0.5 ? mistura(C.apagado, C.azul, a) : mistura(C.borda, C.apagado, 0.8);
    c.translate(x + NO_W - 48, y + 48 + 10); c.scale(0.6 + 0.4 * sp, 0.6 + 0.4 * sp); c.fillText('0' + (i + 1), 0, 0);
    c.restore();
    // trilho de progresso
    const f = seg(t, ENCHE[i], 0.7, 'power2.inOut'), esvazia = i === 0 ? seg(t, 10.65, 0.45, 'power2.inOut') : 0;
    const tx = x + 48, tw = NO_W - 96, ty = y + NO_H - 48 - 4;
    c.fillStyle = COR.borda; retArred(tx, ty, tw, 4, 2); c.fill();
    const fw = Math.max(0, f - esvazia) * tw;
    if (fw > 1) { c.fillStyle = mistura(C.apagado, C.azul, a); retArred(tx + esvazia * tw, ty, fw, 4, 2); c.fill(); }
    c.restore();
  }
  // portas
  const pv = i === 0 ? 1 : pousa * (1 - sai);
  if (pv > 0) {
    c.globalAlpha = pv;
    const bateIn = i === 0 ? sino(t, VOLTA0 + VOLTA_DUR - 0.02, 0.4) : sino(t, POUSA[i] - 0.02, 0.4);
    const bateOut = i < 4 ? sino(t, FIO[i] - 0.1, 0.3) : sino(t, VOLTA0 - 0.1, 0.3);
    porta(x, cy(i), (0.6 + 0.4 * pv) * (1 + 0.35 * bateIn), mistura(C.borda, C.azul, Math.max(i === 0 ? 0 : a, bateIn)));
    const po = i < 4 ? [x + NO_W, cy(i)] : portaFim;
    porta(po[0], po[1], (0.6 + 0.4 * pv) * (1 + 0.35 * bateOut), mistura(C.borda, C.azul, bateOut));
    c.globalAlpha = 1;
  }
}

function render(t) {
  if (![F.rotulo, F.mono].every(f => document.fonts.check(f))) return;
  c.save();
  c.fillStyle = COR.fundo; c.fillRect(0, 0, W, H);
  gradePontos(t);
  c.translate(-Math.round(cam(t)), 0);

  // fios: desenham com o pulso; recolhem para a origem no fim
  let pulso = null;
  const cavalga = (f, s0, dur) => {
    const p = seg(t, s0, dur, 'power2.inOut'), cabeca = f.L * p;
    if (t >= s0 - 0.12 && t < s0 + dur + 0.22) {
      const pop = seg(t, s0 - 0.12, 0.15, 'back.out(1.2)'), some = seg(t, s0 + dur, 0.2, 'power2.in');
      const pt = pontoEm(f, cabeca);
      pulso = { x: pt[0], y: pt[1], esc: (0.6 + 0.4 * pop) * (1 - 0.6 * some), alfa: Math.min(1, pop * 1.5) * (1 - some) };
      return { cabeca, rastro: [Math.max(0, cabeca - 140 * (1 - some)), cabeca] };
    }
    return { cabeca, rastro: null };
  };
  fios.forEach((f, k) => {
    const r = cavalga(f, FIO[k], FIO_DUR), rec = seg(t, RECOLHE[k], 0.35, 'power2.in');
    tracaTrecho(c, f, 0, t < FIO[k] ? 0 : r.cabeca * (1 - rec), COR.borda, 3);
    if (r.rastro) tracaTrecho(c, f, r.rastro[0], r.rastro[1], COR.azul, 3);
  });
  const rv = cavalga(retorno, VOLTA0, VOLTA_DUR), rr = seg(t, 10.70, 0.7, 'power2.inOut');
  tracaTrecho(c, retorno, retorno.L * rr, t < VOLTA0 ? 0 : rv.cabeca, COR.borda, 3);
  if (rv.rastro) tracaTrecho(c, retorno, rv.rastro[0], rv.rastro[1], COR.azul, 3);

  for (let i = 0; i < 5; i++) no(i, t);

  if (pulso) { c.globalAlpha = pulso.alfa; c.fillStyle = COR.azul; c.beginPath(); c.arc(pulso.x, pulso.y, 12 * pulso.esc, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
  c.restore();
}

// ---------------------------------------------------------------- relógio
const rel = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(rel, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(rel.t % DUR) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
window.addEventListener('load', () => render(tl.time() % DUR));
document.fonts.ready.then(() => render(tl.time() % DUR));
