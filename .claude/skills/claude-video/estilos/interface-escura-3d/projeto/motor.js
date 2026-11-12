// graphite-ui, versão autoral: a fila de vídeos da semana, num app escuro visto por uma câmera 3D lenta.
// Um relógio só: render(t) posiciona tudo a partir do tempo. Sem Math.random, Date.now ou timers. Loop de 12 s.

// ---------------------------------------------------------------- variáveis do estilo
const DUR = 12;
const APP_W = 1400, APP_H = 880;
const TITULO = 'Esta semana', BOTAO = 'Publicar', MANCHETE = ['Tudo', 'publicado.'];
const N = 5, LISTA_Y = 224, LINHA_H = 104;
const LARG_TITULO = [420, 520, 360, 480, 400], LARG_SUB = [180, 240, 150, 210, 170], LARG_DATA = [96, 110, 96, 120, 104];   // esqueletos: larguras fixas
const LARG_LATERAL = [120, 170, 140, 110, 160, 130, 150];
// câmera: [centro x, centro y, escala, rotX, rotY, rotZ]
const CAM = {
  A: [1060, 660, 1.04, 30, 0, -9],     // inclinada e aberta
  B: [780, 640, 1.30, 2, 0, 0],        // plana e perto
  C: [1740, 600, 1.10, 5, 24, 0],      // virada para a direita, dá lugar à manchete
  D: [1760, 490, 1.13, 7, 26, 0],      // deriva
};
const T_LIMPEZA = 9.3, LIMPEZA_DUR = 0.8, T_RESET = T_LIMPEZA + LIMPEZA_DUR;

// ---------------------------------------------------------------- utilidades
const ease = (() => { const c = {}; return n => c[n] || (c[n] = gsap.parseEase(n)); })();
const seg = (t, ini, dur, curva) => ease(curva || 'expo.out')(Math.min(1, Math.max(0, (t - ini) / dur)));
const mix = (a, b, p) => a + (b - a) * p;
const px = v => v + 'px';
const el = (pai, cls, css, html) => { const d = document.createElement('div'); if (cls) d.className = cls; Object.assign(d.style, css || {}); if (html != null) d.innerHTML = html; pai.appendChild(d); return d; };
const VISTO = (tam, esp, cor) => `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24"><path class="ck" d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="${cor}" stroke-width="${esp}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>`;

// ---------------------------------------------------------------- o app (px do mundo, 1400 × 880)
const app = document.getElementById('app'), flutua = document.getElementById('flutua');
el(app, 'hl', { left: 0, top: px(56), width: px(APP_W) });
[24, 46, 68].forEach(x => el(app, 'barra', { left: px(x - 6), top: px(22), width: px(12), height: px(12), background: 'var(--linha)' }));
el(app, 'barra', { left: px(560), top: px(16), width: px(280), height: px(24), background: 'var(--relevo)', border: '1px solid var(--linha)' });
el(app, 'vl', { left: px(300), top: px(56), height: px(APP_H - 56) });
// barra lateral
const LAT_Y = i => 92 + i * 52 + (i > 3 ? 36 : 0);
const destaque = el(app, '', { position: 'absolute', left: px(16), width: px(268), height: px(48), borderRadius: '10px', background: 'var(--relevo)' });
for (let i = 0; i < 7; i++) {
  el(app, 'barra', { left: px(36), top: px(LAT_Y(i) + 14), width: px(20), height: px(20), borderRadius: '6px', background: 'var(--esq2)' });
  el(app, 'barra', { left: px(72), top: px(LAT_Y(i) + 18), width: px(LARG_LATERAL[i]), height: px(12), background: 'var(--esq2)' });
}
el(app, 'hl', { left: px(32), top: px(LAT_Y(4) - 18), width: px(236) });
// cabeçalho
const tituloMask = el(app, 'mascara', { left: px(364), top: px(92), height: px(64), width: px(500) });
const titulo = el(tituloMask, '', {}, TITULO); titulo.id = 'titulo';
const botao = el(app, ''); botao.id = 'botao';
const botaoRotulo = el(botao, '', {}, BOTAO); botaoRotulo.id = 'botaoRotulo';
const botaoVisto = el(botao, '', {}, VISTO(34, 3, 'var(--fundo)')); botaoVisto.id = 'botaoVisto';
const botaoCk = botaoVisto.querySelector('.ck');
el(app, 'barra', { left: px(364), top: px(186), width: px(972), height: px(6), background: 'var(--linha)' });
const progresso = el(app, 'barra', { left: px(364), top: px(186), width: px(972), height: px(6), background: 'var(--verde)', transformOrigin: '0 50%' });
// a lista: cada linha é um vídeo da semana
const linhas = [];
for (let i = 0; i < N; i++) {
  const l = el(app, 'linha', { top: px(LISTA_Y + i * LINHA_H) });
  const fio = el(l, 'hl', { left: 0, top: 0, width: px(972), transformOrigin: '0 50%' });
  const caixa = el(l, 'caixa');
  const caixaCheia = el(caixa, 'caixaCheia', {}, VISTO(22, 3.2, 'var(--fundo)'));
  const mini = el(l, 'mini', {}, '<i></i>');
  const t1 = el(l, 'barra', { left: px(190), top: px(34), width: px(LARG_TITULO[i]), height: px(16), background: 'var(--esq)' });
  const t2 = el(l, 'barra', { left: px(190), top: px(60), width: px(LARG_SUB[i]), height: px(10), background: 'var(--esq2)' });
  const risco = el(l, 'risco', { left: px(182), top: px(41), width: px(LARG_TITULO[i] + 16) });
  const data = el(l, 'data', { width: px(LARG_DATA[i]) });
  const dataBarra = el(data, 'barra', { left: px(14), top: px(10), width: px(LARG_DATA[i] - 32), height: px(8), background: 'var(--esq)' });
  linhas.push({ l, fio, caixa, caixaCheia, ck: caixaCheia.querySelector('.ck'), partes: [caixa, mini, t1, t2, data], t1, t2, mini, risco, data });
}
// aviso flutuante
const aviso = el(flutua, ''); aviso.id = 'aviso';
const avisoBola = el(aviso, '', {}, VISTO(34, 3.2, 'var(--fundo)')); avisoBola.id = 'avisoBola';
const avisoCk = avisoBola.querySelector('.ck');
el(aviso, 'barra', { left: px(124), top: px(44), width: px(320), height: px(18), background: 'var(--esq)' });
el(aviso, 'barra', { left: px(124), top: px(76), width: px(200), height: px(12), background: 'var(--esq2)' });
// borda de limpeza
const limpeza = el(app, ''); limpeza.id = 'limpeza';
Object.assign(limpeza.style, { left: 0, top: px(176), height: px(LISTA_Y + N * LINHA_H - 176 + 8) });

// ---------------------------------------------------------------- manchete (px da tela)
const manchete = document.getElementById('manchete');
const palavras = MANCHETE.map((w, i) => { const m = el(manchete, 'mmask', { top: px(i * 192) }); return el(m, 'mpal', {}, w); });
manchete.style.top = px(540 - 203);
const cursor = document.getElementById('cursor'), anel = document.getElementById('anel'), pontos = document.getElementById('pontos');

// ---------------------------------------------------------------- câmera
const mixC = (a, b, p) => a.map((v, i) => mix(v, b[i], p));
function camera(t) {
  let c = CAM.A;
  c = mixC(c, CAM.B, seg(t, 1.2, 1.2, 'power3.inOut'));
  c = mixC(c, CAM.C, seg(t, 4.4, 1.2, 'power3.inOut'));
  c = mixC(c, CAM.D, seg(t, 6.4, 1.2, 'sine.inOut'));
  c = mixC(c, CAM.A, seg(t, 10.1, 1.3, 'power3.inOut'));
  const w = 2 * Math.PI * t / DUR;                                 // deriva lenta, um ciclo por loop
  return { c, dx: 10 * Math.sin(w), dy: 6 * Math.sin(w + Math.PI / 2), drz: 0.35 * Math.sin(w + Math.PI) };
}

// ---------------------------------------------------------------- o quadro
function render(t) {
  const { c, dx, dy, drz } = camera(t);
  const [cx, cy, sc, rx, ry, rz] = c;
  const camT = `translate(${cx + dx - APP_W / 2}px, ${cy + dy - APP_H / 2}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz + drz}deg) scale(${sc})`;
  app.style.transform = camT; flutua.style.transform = camT;
  pontos.style.transform = `translate(${(cx + dx - 1000) * 0.3}px, ${(cy + dy - 600) * 0.3}px) scale(${0.9 + sc * 0.12})`;

  // aviso: 110 px acima do plano do app
  const ai = seg(t, 7.5, 0.6), ao = seg(t, 9.0, 0.35, 'power3.in');
  aviso.style.opacity = t < 7.5 || t > 9.4 ? 0 : Math.min(1, seg(t, 7.5, 0.2, 'power2.out')) * (1 - ao);
  aviso.style.transform = `translateZ(160px) translateY(${(1 - ai) * 40 + ao * 28}px) scale(${0.92 + 0.08 * ai})`;
  avisoCk.style.strokeDashoffset = 1 - seg(t, 7.75, 0.35, 'power2.out');

  // lista: cascata de entrada, marcação, limpeza
  const viva = t < T_RESET;
  const borda = seg(t, T_LIMPEZA, LIMPEZA_DUR, 'power3.inOut') * 1000 - 20;
  let feitos = 0;
  linhas.forEach((o, i) => {
    const t0 = 0.1 + i * 0.06;
    o.partes.forEach((p, k) => { const a = viva ? seg(t, t0 + k * 0.04, 0.6) : 0; p.style.transform = `translateY(${(1 - a) * 76}px)`; });
    o.fio.style.transform = `scaleX(${viva ? seg(t, t0, 0.7) : 0})`;
    const d = viva ? seg(t, 3.15 + i * 0.12, 0.5) : 0, ds = viva ? seg(t, 3.15 + i * 0.12, 0.28, 'power2.out') : 0;
    feitos += d;
    o.caixaCheia.style.opacity = ds > 0 ? 1 : 0;
    o.caixaCheia.style.transform = `scale(${0.7 + 0.3 * d})`;
    o.ck.style.strokeDashoffset = 1 - (viva ? seg(t, 3.22 + i * 0.12, 0.3, 'power2.out') : 0);
    o.risco.style.transform = `scaleX(${viva ? seg(t, 3.25 + i * 0.12, 0.45, 'power3.out') : 0})`;
    o.t1.style.opacity = 1 - 0.55 * d; o.t2.style.opacity = 1 - 0.5 * d; o.mini.style.opacity = 1 - 0.45 * d; o.data.style.opacity = 1 - 0.5 * d;
    o.l.style.clipPath = viva && t > T_LIMPEZA ? `inset(0 0 0 ${Math.max(0, borda)}px)` : 'none';
  });
  progresso.style.transform = `scaleX(${feitos / N})`;
  progresso.style.clipPath = viva && t > T_LIMPEZA ? `inset(0 0 0 ${Math.max(0, borda)}px)` : 'none';
  const lOn = viva && t > T_LIMPEZA + 0.02;
  limpeza.style.opacity = lOn ? Math.min(1, seg(t, T_LIMPEZA, 0.12, 'power2.out')) * (1 - seg(t, T_RESET - 0.14, 0.14, 'power2.in')) : 0;
  limpeza.style.transform = `translateX(${364 + borda}px)`;

  // botão: aperta, rótulo vira visto, volta durante a limpeza
  const aperta = seg(t, 2.88, 0.08, 'power2.out') - seg(t, 2.96, 0.4);
  botao.style.transform = `scale(${1 - 0.05 * aperta})`;
  const sai1 = seg(t, 2.92, 0.22, 'power3.in'), entra1 = seg(t, 3.04, 0.6);
  const sai2 = seg(t, 11.0, 0.22, 'power3.in'), entra2 = seg(t, 11.12, 0.6);
  botaoRotulo.style.transform = `translateY(${(t < 11.0 ? -sai1 : 1 - entra2) * 64}px)`;
  botaoVisto.style.transform = `translateY(${(t < 11.0 ? 1 - entra1 : -sai2) * 64}px)`;
  botaoCk.style.strokeDashoffset = t < 11.0 ? 1 - seg(t, 3.1, 0.35, 'power2.out') : 0;

  // nova semana: o título rola pela máscara; destaque da barra lateral desce e volta
  const tr = t < 11.3 ? -seg(t, 11.15, 0.22, 'power3.in') : 1 - seg(t, 11.37, 0.6);
  titulo.style.transform = `translateY(${tr * 64}px)`;
  const hp = seg(t, 8.0, 0.5, 'power3.inOut') - seg(t, 11.0, 0.5, 'power3.inOut');
  destaque.style.top = px(mix(LAT_Y(1), LAT_Y(2), hp));

  // manchete: sobe de trás das máscaras, sai por cima
  palavras.forEach((w, i) => { const a = seg(t, 5.1 + i * 0.1, 0.7), b = seg(t, 8.4 + i * 0.06, 0.4, 'power3.in'); w.style.transform = `translateY(${((1 - a) - b) * 214}px)`; });

  // cursor: entra em arco até o botão, clica, sai
  const br = botao.getBoundingClientRect();
  const bx = br.left + br.width * 0.56, by = br.top + br.height * 0.58;
  const FORA = [1990, 1160], SAIDA = [2010, 1220];
  let x = FORA[0], y = FORA[1];
  if (t >= 1.7) { const p = seg(t, 1.7, 1.1, 'power3.inOut'); x = mix(FORA[0], bx, p) - Math.sin(Math.PI * p) * 70; y = mix(FORA[1], by, p) + Math.sin(Math.PI * p) * 40; }
  if (t >= 4.3) { const p = seg(t, 4.3, 0.6, 'power2.in'); x = mix(bx, SAIDA[0], p); y = mix(by, SAIDA[1], p); }
  const cs = 1 - 0.14 * (seg(t, 2.84, 0.07, 'power2.out') - seg(t, 2.91, 0.3));
  cursor.style.transform = `translate(${x - 4}px, ${y - 3}px) scale(${cs})`; cursor.style.transformOrigin = '4px 3px';
  const rp = seg(t, 2.9, 0.55);
  anel.style.opacity = t > 2.9 && t < 3.45 ? (1 - seg(t, 2.9, 0.55, 'power2.in')) * 0.9 : 0;
  anel.style.transform = `translate(${bx}px, ${by}px) scale(${0.6 + 0.6 * rp})`;
}

// ---------------------------------------------------------------- relógio
const rel = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(rel, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(rel.t % DUR) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
render(0);
window.addEventListener('load', () => render(tl.time() % DUR));
document.fonts.ready.then(() => render(tl.time() % DUR));
