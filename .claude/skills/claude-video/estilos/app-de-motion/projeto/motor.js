// Motor do estilo app de motion: um relógio só. stateAt(t) calcula o estado, paint(S) desenha.
const DUR = 16, CUT = 12.9667, PEEL = 12.35;
const expoOut = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const p3io = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const p1io = x => (x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const p3in = x => x * x * x;
const p2in = x => x * x;
const backOut = (x, s = 2.2) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const seg = (t, a, b, ease = x => x) => ease(clamp((t - a) / (b - a)));
const compApp = (x, y) => [546 + x * .5984, 166 + y * .5984]; // ponto do plano em coordenadas do app

// ---------- câmera: planos seguros com deriva lenta; empurrões curtos entre eles ----------
const WIDE = [1, 960, 540], TIT = [1.42, 860, 330], TLC = [1.35, 794, 602], VIEW = [1.75, 929, 381], GRC = [2.69, 962, 793], TRC = [2.81, 1000, 336], FXC = [1.32, 730, 400], FILL = [1920 / 766, 929, 381.5];
const H = [
  { a: 1.5, b: 2.0, c: WIDE, d: 0 }, { a: 2.4, b: 3.1, c: TIT, d: .02 }, { a: 3.55, b: 4.12, c: TLC, d: .012 }, { a: 4.55, b: 4.9, c: VIEW, d: .012 },
  { a: 5.38, b: 6.22, c: GRC, d: .012 }, { a: 6.98, b: 7.25, c: VIEW, d: .012 }, { a: 7.58, b: 9.9, c: TRC, d: .025 }, { a: 10.55, b: 11.15, c: FXC, d: .012 }, { a: 11.5, b: PEEL, c: WIDE, d: .006 },
];
const hs = (h, t) => [h.c[0] * (1 + h.d * (t - h.a) / (h.b - h.a)), h.c[1], h.c[2]];
const mixC = (A, B, e) => [lerp(A[0], B[0], e), lerp(A[1], B[1], e), lerp(A[2], B[2], e)];
function camAt(t) {
  if (t < 1.5) return [lerp(.8, 1, expoOut(t / 1.5)), 960, 540];
  if (t >= PEEL) return mixC(hs(H[8], PEEL), FILL, seg(t, PEEL, CUT, p3in));
  for (let i = 0; i < H.length; i++) {
    const h = H[i];
    if (t >= h.a && t < h.b) return hs(h, t);
    const n = H[i + 1];
    if (n && t >= h.b && t < n.a) return mixC(hs(h, h.b), hs(n, n.a), p1io((t - h.b) / (n.a - h.b)));
  }
  return hs(H[8], t);
}

// ---------- a curva: duas alças arrastadas; o título, os pontos e o gráfico leem a mesma ----------
const e1 = t => seg(t, 5.45, 5.75, p3io), e2 = t => seg(t, 5.93, 6.22, p3io);
const curveAt = t => [lerp(1 / 3, .8, e1(t)), lerp(1 / 3, 0, e1(t)), lerp(2 / 3, .2, e2(t)), lerp(2 / 3, 1, e2(t))];
const GL = [610, 960], GR = [1119, 760];
const handle = (c, i) => [GL[0] + c[i * 2] * (GR[0] - GL[0]), GL[1] + c[i * 2 + 1] * (GR[1] - GL[1])];

// ---------- cursor: cada trecho é [início, fim, x, y] ----------
const TP = compApp(...TRK), TC = compApp(TRK[0] + 128, TRK[1] - 68);
const PATH = [[2.0, 2.2, 929, 150], [2.2, 2.35, 439, 101], [2.42, 2.6, 584, 226], [2.7, 3.0, 745, 300], [3.2, 3.55, 186, 768], [3.62, 3.72, 186, 796], [3.76, 3.86, 186, 824], [3.92, 4.1, 603, 824], [4.15, 4.5, 1070, 640], [4.78, 5.0, 546, 700], [5.05, 5.42, ...handle(LIN, 0)], [5.45, 5.75, ...handle(EASE, 0)], [5.78, 5.92, ...handle(LIN, 1)], [5.93, 6.22, ...handle(EASE, 1)], [6.25, 6.7, 1070, 640], [7.28, 7.58, ...TP], [7.65, 8.0, 1180, 500], [9.2, 9.52, ...TP], [9.55, 9.95, ...TC], [9.97, 10.08, 980, 470], [10.08, 10.24, 190, 144], [10.28, 10.45, 214, 318], [10.55, 10.95, 620, 540], [11.1, 11.4, 1050, 690]];
const CLICKS = [2.38, 2.62, 3.6, 3.74, 3.88, 4.12, 5.02, 5.44, 5.92, 7.6, 9.54, 10.26, 10.48, 11.42];
function curAt(t) {
  if (t >= 5.45 && t < 5.75) return handle(curveAt(t), 0);
  if (t >= 5.93 && t < 6.22) return handle(curveAt(t), 1);
  let x = 1640, y = 700;
  for (const [a, b, X, Y] of PATH) {
    if (t >= b) { x = X; y = Y; continue; }
    if (t >= a) { const e = p3io((t - a) / (b - a)); x = lerp(x, X, e); y = lerp(y, Y, e); }
    break;
  }
  return [x, y];
}

// ---------- relógio do plano: agulha parada, a imagem parada ----------
function ctAt(t) {
  if (t < 2.0) return 3.5;
  if (t < 2.4) return lerp(3.5, TDUR, seg(t, 2.0, 2.4, p3io));
  if (t < 3.95) return TDUR;
  if (t < 4.1) return lerp(TDUR, 0, seg(t, 3.95, 4.1, p3io));
  if (t < 4.4) return 0;
  if (t < 5.0) return lerp(0, TDUR, (t - 4.4) / .6);
  if (t < 6.3) return TDUR;
  if (t < 6.75) return lerp(TDUR, 0, seg(t, 6.3, 6.75, p3io));
  if (t < 7.32) return lerp(0, TDUR, (t - 6.75) / .57);
  if (t < 7.6) return lerp(TDUR, 0, seg(t, 7.32, 7.6, p3io));
  if (t < 9.3) return lerp(0, 1.7, (t - 7.6) / 1.7);
  if (t < 10.5) return 1.7;
  if (t < 11.42) return lerp(1.7, 3.2, seg(t, 10.5, 11.42, p3io));
  if (t < PEEL) return 3.2;
  return t - PEEL;
}

// ---------- linhas da linha do tempo ----------
const POP = (t, a) => (t < a ? 0 : backOut(seg(t, a, a + .4)));
function rowsAt(t, ct) {
  const base = t < 7.6 ? { n: 'caminhada.mp4', c: 'run' } : { n: 'caminhada.mp4', c: 'run', open: t < 11.2, subs: t < 11.2 ? [{ n: 'Ponto 1', v: `${TRK[0]},0, ${(TRK[1] - walkY(ct)).toFixed(1).replace('.', ',')}`, on: 1, track: Math.round(seg(t, 7.6, 9.3) * 39) }] : [{ n: 'Ponto 1', v: `${TRK[0]},0, ${TRK[1]},0`, on: 1, track: 39 }] };
  const cor = { n: 'Cor', c: 'grade' };
  if (t < 2.62) return [base, cor];
  const rows = [];
  if (t >= 10.95) rows.push({ n: 'Terço inferior', c: 'low', bar: [.34, 4.02], keys: [.34, .75] });
  if (t >= 9.54) rows.push({ n: 'Legenda', c: 'call', bar: [.2, 4.02], keys: [.2, .5] });
  const open = t >= 3.55 && t < 7.32;
  const e = easeOf(curveAt(t), ct / TDUR), x = t < 4.12 ? TX1 : lerp(TX0, TX1, e), sc = t < 4.12 ? 100 : lerp(94, 100, e), o = t < 4.12 ? 100 : lerp(60, 100, e);
  const vals = [`${x.toFixed(1).replace('.', ',')}, 52,0`, `${sc.toFixed(1).replace('.', ',')}%`, `${Math.round(o)}%`];
  const subs = open ? ['Posição', 'Escala', 'Opacidade'].map((n, i) => { const a = 3.6 + i * .14, b = 4.12 + i * .05; return { n, v: t >= a ? vals[i] : '', on: t >= a, a: seg(t, 3.55 + i * .03, 3.75 + i * .03), keys: [...(t >= a ? [[TDUR, POP(t, a)]] : []), ...(t >= b ? [[0, POP(t, b)]] : [])] }; }) : null;
  const title = { n: 'Feito com Claude', t: 1, c: 'title', open, sel: t < 7.32 };
  if (subs) title.subs = subs; else if (t >= 7.32) { title.keys = [0, TDUR]; title.hour = 1; }
  rows.push(title, base, cor);
  return rows;
}

// ---------- estado ----------
const ST = [2.2, 4.3, 6.25, 10.0, 11.3];
const FOCS = [[1.2, 'ai'], [2.2, 'view'], [3.2, 'tl'], [4.2, 'view'], [4.95, 'tl'], [6.25, 'view'], [11.2, 'tl']];
function focusAt(t) {
  if (t < 1.2 || t >= PEEL) return null;
  let R = FOC.ai;
  for (let i = 1; i < FOCS.length; i++) { const [T, id] = FOCS[i]; if (t >= T) { const e = seg(t, T, T + .35, p3io); R = FOC[id].map((v, k) => lerp(FOC[FOCS[i - 1][1]][k], v, e)); } }
  return R;
}
function stateAt(t) {
  const cam = camAt(t), ct = ctAt(t);
  const dt = .02, A = camAt(t - dt), B = camAt(t + dt);
  const vx = (B[1] - A[1]) / (2 * dt) * cam[0], vy = (B[2] - A[2]) / (2 * dt) * cam[0];
  const open = t < 1.5 ? 1 - expoOut(t / 1.5) : 0;
  const S = { cam, ph: ct };
  S.tilt = t >= PEEL ? [0, 0] : [-open * 13 - clamp(vy * .0016, -2.5, 2.5), open * 16 + clamp(vx * .0016, -2.5, 2.5)];
  S.tab = t < 7.32 ? 0 : t < 11.2 ? 1 : 2;
  S.tool = t >= 2.38 && t < 3.2 ? 'T' : '';
  S.left = t >= 10.26 ? 'fx' : 'proj';
  S.cache = seg(t, 11.42, 12.27);
  S.focusR = focusAt(t);
  S.pn = { tools: seg(t, .08, .78, expoOut), binP: seg(t, .15, .85, expoOut), viewP: seg(t, .22, .92, expoOut), aiP: seg(t, .29, .99, expoOut), tlP: seg(t, .36, 1.06, expoOut) };
  S.barA = seg(t, .02, .5) * (1 - seg(t, PEEL, PEEL + .25));
  S.winA = 1 - seg(t, PEEL, PEEL + .4);
  S.dim = .65 * seg(t, PEEL, CUT);

  let done = 0; for (let i = 1; i < ST.length; i++) if (t >= ST[i]) done = i;
  S.plan = { who: seg(t, 1.0, 1.25), ask: t < 1.22 ? 0 : seg(t, 1.22, 1.5, x => backOut(x, 1.4)), rev: seg(t, 1.65, 2.15) * 5, done, on: t >= ST[0], spin: (t * 360) % 360 };

  S.rows = rowsAt(t, ct);
  const c = curveAt(t);
  if (t >= 5.02 && t < 6.3) {
    const p = curAt(t), tag = t < 5.45 ? '' : `Influência ${Math.round(Math.max(e1(t), e2(t)) * 80 + (t < 5.75 ? 0 : 0))}%`;
    S.graph = { c, tag, tagAt: [p[0] + (t < 5.9 ? -36 : 8), p[1] + (t < 5.9 ? -32 : -28)] };
    if (t < 5.45) S.graph.tag = '';
  }

  // o plano
  const C = { ct, curve: c };
  if (t >= PEEL) C.curve = EASE;
  if (t < PEEL) {
    C.typed = t < 2.62 ? 0 : Math.min(15, Math.floor((t - 2.62) / .04) + 1);
    C.caret = t >= 2.62 && t < 3.25 ? 1 : 0;
    C.keyed = t >= 4.12 ? 1 : 0;
    C.tsel = t >= 3.55 && t < 4.4 ? 1 : 0;
    C.dots = (t >= 4.12 && t < 5.0) || (t >= 6.3 && t < 7.32) ? 1 : 0;
    C.spark = t < 7.6 ? 0 : POP(t, 7.6);
    C.track = t >= 7.6 && t < 10.05 ? 1 : 0;
    C.trail = t < 7.6 ? 0 : Math.round(seg(t, 7.6, 8.5) * 14);
    C.call = t < 9.55 ? 0 : seg(t, 9.55, 9.95, x => backOut(x, 1.2));
    C.low = t < 10.95 ? 0 : seg(t, 10.95, 11.3, expoOut);
  } else {
    C.typed = t >= CUT ? 15 : 0; C.keyed = 1; C.tt = Math.max(0, t - CUT);
    C.spark = t < CUT + .8 ? 0 : POP(t, CUT + .8);
    C.call = t < CUT + .95 ? 0 : seg(t, CUT + .95, CUT + 1.35, x => backOut(x, 1.2));
    C.low = t < CUT + 1.35 ? 0 : seg(t, CUT + 1.35, CUT + 1.8, expoOut);
  }
  S.comp = C;

  // desmonte: cada painel gira na borda de fora e some
  if (t >= PEEL) {
    const ramp = (i, ang, z) => { const e = seg(t, PEEL + i * .04, PEEL + i * .04 + .55, p2in), b = seg(t, PEEL + i * .04, PEEL + i * .04 + .5, p3in), a = 1 - seg(t, PEEL + i * .04 + .42, PEEL + i * .04 + .55); return { e, b, a, ang, z }; };
    const mk = (i, ang, z, o, vert, dx, dy) => { const r = ramp(i, ang, z); return { x: dx * r.e, y: dy * r.e, z: z * r.e, ry: vert ? 0 : ang * r.e, rx: vert ? ang * r.e : 0, o, b: 14 * r.b, a: r.a }; };
    S.peel = { binP: mk(0, 58, 900, '0% 50%', false, -260, 0), tools: mk(1, -56, 800, '50% 0%', true, 0, -220), tlP: mk(2, 60, 1000, '50% 100%', true, 0, 260), aiP: mk(3, -62, 1100, '100% 50%', false, 300, 0), viewP: { x: 0, y: 0, z: 0, ry: 0, rx: 0, o: '50% 50%', b: 0, a: 1 } };
  }

  // cursor e clique
  S.ai = curAt(t); S.aiA = seg(t, 1.7, 1.85) * (1 - seg(t, PEEL, PEEL + .2));
  let cc = -1; for (const k of CLICKS) if (t >= k) cc = k;
  if (cc >= 0 && t < cc + .45 && t < PEEL) { S.click = curAt(cc); const e = (t - cc) / .45; S.clickK = lerp(.8, 1.7, e); S.clickA = .9 * (1 - e); }
  if (t >= 10.5 && t < 10.95) S.ghost = curAt(t);

  // o visor escurece nos últimos quadros, para o clarão socar
  S.viewB = 1 - .55 * seg(t, CUT - .3, CUT, p2in);
  // plano em tela cheia e clarão no corte
  if (t >= CUT) S.full = lerp(1, 1.05, seg(t, CUT, DUR, p1io));
  if (t >= CUT) S.flash = .8 * (1 - seg(t, CUT, CUT + .5, p2in));
  return S;
}

// ---------- montagem ----------
$('viewB').innerHTML = scoped(SCENE, 'v'); $('fullB').innerHTML = scoped(SCENE, 'f');
$('cAI').querySelector('.ar').innerHTML = arrowSVG(CLAY); $('cAI').querySelector('.tg').innerHTML = spark(CLAY, 11) + 'Claude';
$('aiTab').innerHTML = spark(CLAY, 11) + 'Claude'; $('sendI').innerHTML = ic(I.up, '#fff', 3); $('vplay').innerHTML = ic(I.play);
const p = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(p, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => paint(stateAt(p.t)) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
paint(stateAt(0));
