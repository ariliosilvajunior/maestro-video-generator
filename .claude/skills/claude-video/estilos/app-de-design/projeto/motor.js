// Motor do estilo app de design: um relógio só. stateAt(t) calcula o estado, paint(S) desenha.
const DUR = 15, CUT = 2.0333;
const lerp = (a, b, e) => a + (b - a) * e;
const expoOut = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const p3io = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const p3out = x => 1 - Math.pow(1 - x, 3);
const p3in = x => x * x * x;
const backOut = (x, s = 2.2) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const seg = (t, a, b, ease = x => x) => ease(clamp((t - a) / (b - a)));
const Z = .6, OX = CX - 640 * Z, OY = CY - 360 * Z;
const inFrame = (x, y) => [OX + x * Z, OY + y * Z]; // ponto da thumbnail em coordenadas do app, com o canvas a 60 %
const TW = 612;

// ---------- câmera: planos seguros com deriva lenta; empurrões curtos entre eles ----------
const WIDE = [.94, 960, 540], CAN = [1.63, 914, 548], FX = [2.25, 1107, 519], TXT = [2.237, 753, 548], SNAP = [2.73, 603, 502], ARR = [2.34, 754, 549], VAR = [1.71, 753, 556];
const H = [
  { a: 1.5, b: 1.55, c: WIDE, d: 0 }, { a: CUT, b: 2.85, c: CAN, d: .02 }, { a: 3.25, b: 4.25, c: FX, d: .02 }, { a: 4.6, b: 5.38, c: TXT, d: .012 },
  { a: 5.7, b: 6.85, c: SNAP, d: .012 }, { a: 7.2, b: 8.38, c: ARR, d: .012 }, { a: 8.92, b: 9.68, c: WIDE, d: .006 }, { a: 10.0, b: 11.9, c: VAR, d: .012 },
];
const hs = (h, t) => [h.c[0] * (1 + h.d * (t - h.a) / (h.b - h.a)), h.c[1], h.c[2]];
const mixC = (A, B, e) => [lerp(A[0], B[0], e), lerp(A[1], B[1], e), lerp(A[2], B[2], e)];
function camAt(t) {
  if (t < 1.5) return [lerp(.8, .94, expoOut(t / 1.5)), 960, 540];
  if (t >= 1.55 && t < CUT) return mixC(WIDE, [1.02, 930, 540], seg(t, 1.55, CUT, p3in));
  for (let i = 0; i < H.length; i++) {
    const h = H[i];
    if (t >= h.a && t < h.b) return hs(h, t);
    const n = H[i + 1];
    if (n && h.b !== 1.55 && t >= h.b && t < n.a) return mixC(hs(h, h.b), hs(n, n.a), p3io((t - h.b) / (n.a - h.b)));
  }
  return hs(H[H.length - 1], t);
}

// ---------- caminho da seta e do anel: o cursor desenha de verdade ----------
const bez = (p, a, b, c, d) => { const q = 1 - p; return q * q * q * a + 3 * q * q * p * b + 3 * q * p * p * c + p * p * p * d; };
const arrowP = t => seg(t, 7.02, 7.55, p3io);
const arrowTip = p => inFrame(bez(p, 322, 460, 680, 800), bez(p, 628, 712, 680, 542));
const ringEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
ringEl.setAttribute('d', 'M840 22C1200 2 1484 200 1474 470C1464 760 1130 946 720 940C330 934 24 750 24 470C24 200 330 30 690 26C820 24 980 28 1100 60');
const ringL = ringEl.getTotalLength();
const ringP = t => seg(t, 10.35, 10.95, p3io);
const VZ = .22, VOX = CX - 640 * VZ, VOY = CY - 360 * VZ;
const ringTip = p => { const q = ringEl.getPointAtLength(ringL * p); return [VOX + (-110 + q.x) * VZ, VOY + (-120 + q.y) * VZ]; };

// ---------- cursor da IA: cada trecho é [início, fim, x, y] ----------
const [gx, gy] = [640, 600];
const PATH = [[1.62, 2.1, 900, 600], [2.25, 2.6, 1000, 500], [2.88, 3.24, 1474, 367], [3.64, 3.84, 1320, 505], [3.9, 4.25, 1417, 505], [4.3, 4.6, 435, 520], [4.68, 4.95, 380, 660], [5.42, 5.78, gx, gy], [5.85, 6.2, gx - 40 * Z, gy], [6.3, 6.6, gx - 40 * Z, gy - 34 * Z], [6.68, 6.98, 562, 709], [7.02, 7.55, ...arrowTip(1)], [7.7, 8.0, 471, 380], [8.38, 8.9, 753, 560], [9.1, 9.6, 835, 615], [10.0, 10.33, ...ringTip(0)], [10.35, 10.95, ...ringTip(1)], [11.05, 11.45, 1000, 1160]];
const CLICKS = [2.17, 3.3, 3.62, 3.87, 4.62, 5.82, 7.0, 8.03, 9.0, 10.34];
function curAt(t) {
  if (t >= 7.02 && t < 7.55) return arrowTip(arrowP(t));
  if (t >= 10.35 && t < 10.95) return ringTip(ringP(t));
  let x = 1650, y = 480;
  for (const [a, b, X, Y] of PATH) {
    if (t >= b) { x = X; y = Y; continue; }
    if (t >= a) { const e = p3io((t - a) / (b - a)); x = lerp(x, X, e); y = lerp(y, Y, e); }
    break;
  }
  return [x, y];
}
// colegas: derivam devagar e clicam nas cópias
function keys(t, K) { let [x, y] = K[0].slice(2); for (const [a, b, X, Y] of K) { if (t >= b) { x = X; y = Y; continue; } if (t >= a) { const e = p3io((t - a) / (b - a)); x = lerp(x, X, e); y = lerp(y, Y, e); } break; } return [x, y]; }
const ANA = [[0, 0, 290, 860], [1.8, 2.5, 300, 830], [8.7, 9.7, 500, 640], [9.8, 10.05, 480, 590], [10.35, 10.8, 500, 640]];
const LEO = [[0, 0, 1215, 300], [1.8, 2.5, 1190, 250], [8.7, 9.7, 985, 650], [10.0, 10.28, 1010, 600], [10.55, 11, 985, 650]];
const drift = (p, t, f) => [p[0] + Math.sin(t * .7 + f) * 7, p[1] + Math.cos(t * .55 + f) * 5];

// ---------- a thumbnail em cada instante ----------
function art(t) {
  if (t < 2.17) return { white: 1 };
  const T = { bg: 'sunset', drop: lerp(-46, 0, seg(t, 2.17, 2.42, p3out)), wash: lerp(.9, 0, seg(t, 2.17, 2.6)), fig: seg(t, 2.5, 2.85, x => backOut(x, 1.1)), figA: seg(t, 2.5, 2.62), shadow: t >= 3.3 ? 1 : 0, glow: spread(t) };
  if (t >= 2.75) delete T.drop;
  const n = Math.floor((t - 4.6) / .05) + 1;
  T.typed = t < 4.6 ? 0 : Math.min(15, n);
  T.caret = t >= 4.6 && t < 5.42 ? 1 : 0;
  T.tx = t < 5.85 ? 96 : lerp(96, 56, seg(t, 5.85, 6.2, p3out));
  T.ty = t < 6.3 ? 198 : lerp(198, 164, seg(t, 6.3, 6.6, p3out));
  T.grid = seg(t, 5.7, 5.9) * (1 - seg(t, 6.7, 7));
  T.arrowP = arrowP(t);
  T.badge = t < 8.03 ? 0 : backOut(seg(t, 8.03, 8.33));
  return T;
}
const spread = t => (t < 3.9 ? 0 : 32 * seg(t, 3.9, 4.25, p3io));
const textW = n => (n <= 6 ? 11 + 562 * n / 6 : n < 14 ? 573 : TW);

// ---------- estado ----------
const ST = [1.85, 3.0, 4.55, 6.95, 8.6, 10.0, 11.3];
function stateAt(t) {
  const FLY = 11.15, END = 12;
  if (t >= END) return feedAt(t);
  const cam = camAt(t);
  const dt = .02, A = camAt(t - dt), B = camAt(t + dt), jump = Math.abs(B[1] - A[1]) > 30;
  const vx = jump ? 0 : (B[1] - A[1]) / (2 * dt) * cam[0], vy = jump ? 0 : (B[2] - A[2]) / (2 * dt) * cam[0];
  const open = t < 1.5 ? 1 - expoOut(t / 1.5) : 0;
  const S = { cam, tilt: [-open * 13 - clamp(vy * .0016, -2.5, 2.5), open * 16 + clamp(vx * .0016, -2.5, 2.5)] };
  S.z = lerp(Z, VZ, seg(t, 8.42, 8.92, p3io));
  S.pn = { layers: seg(t, .1, .8, expoOut), design: seg(t, .17, .87, expoOut), claude: seg(t, .24, .94, expoOut), tool: seg(t, .31, 1.01, expoOut), bar: seg(t, .02, .5) };
  S.avA = t < 1.1 ? 0 : backOut(seg(t, 1.1, 1.4));
  S.layers = t < 2.17 ? 0 : t < 2.55 ? 1 : t < 4.62 ? 2 : t < 7.0 ? 3 : t < 8.03 ? 4 : t < 9 ? 5 : 6;
  S.fill = t >= 2.17 ? 1 : 0;
  S.textOn = t >= 4.62 ? 1 : 0;
  S.gridOn = t >= 5.7 && t < 7 ? 1 : 0;
  if (t >= 3.3) S.fx = { shadow: backOut(seg(t, 3.3, 3.65)), glow: t >= 3.62 ? backOut(seg(t, 3.62, 3.95)) : 0, spread: spread(t) };

  // plano
  let done = 0; for (let i = 1; i < ST.length; i++) if (t >= ST[i]) done = i;
  const tick = []; for (let i = 0; i < 6; i++) tick[i] = backOut(seg(t, ST[i + 1], ST[i + 1] + .35), 2.6);
  S.plan = { who: seg(t, 1.0, 1.25), ask: t < 1.22 ? 0 : seg(t, 1.22, 1.5, x => backOut(x, 1.4)), rev: seg(t, 1.42, 1.92) * 6, done, on: t >= ST[0], spin: (t * 360) % 360, tick };

  // quadros
  const W = art(t), fly = t >= FLY, swapL = seg(t, 10.05, 10.3), swapR = seg(t, 10.3, 10.55);
  const dim = t < 10.95 ? 1 : lerp(1, .45, seg(t, 10.95, 11.25));
  if (t < 9) S.frames = [{ x: 0, name: 'Thumbnail', T: W }];
  else {
    const L = t >= 10.05 ? { ...W, bg: 'island', color: '#fff', wash: lerp(.7, 0, swapL) } : W;
    const Rr = t >= 10.3 ? { ...W, bg: 'fog', color: '#FF5A36', wash: lerp(.7, 0, swapR) } : W;
    S.frames = [
      { x: -1484 * seg(t, 9.02, 9.4, p3io), a: dim, name: 'Thumbnail 2', T: L },
      { x: 1484 * seg(t, 9.2, 9.58, p3io), a: dim, name: 'Thumbnail 3', T: Rr },
      { x: 0, a: fly ? 0 : 1, name: 'Thumbnail', T: W },
    ];
  }

  // seleção e guias
  if (t >= 2.17 && t < 2.5) S.sel = { x: 0, y: 0, w: 1280, h: 720 };
  else if (t >= 2.5 && t < 4.4) S.sel = { x: 640, y: 120, w: 640, h: 600 };
  else if (t >= 4.62 && t < 6.85) S.sel = { x: W.tx, y: W.ty, w: textW(W.typed), h: 258 };
  else if (t >= 7 && t < 7.7) S.sel = { x: 322, y: 528, w: 496, h: 186 };
  else if (t >= 8.03 && t < 8.35) S.sel = { x: 58, y: 40, w: 232, h: 84 };
  const G = [];
  if (t >= 6.12 && t < 6.85) G.push({ v: 56 }, { dx: 56, y: 290 });
  if (t >= 6.52 && t < 6.85) G.push({ dy: 164, x: 360 });
  S.guides = G;

  if (t >= 10.35) S.ring = ringP(t);

  // cursores
  S.ai = curAt(t); S.aiA = seg(t, 1.6, 1.72);
  const wash = seg(t, 11.55, 11.95);
  S.ana = drift(keys(t, ANA), t, 0); S.anaA = seg(t, .5, .75) * (1 - wash);
  S.leo = drift(keys(t, LEO), t, 2); S.leoA = seg(t, .8, 1.05) * (1 - wash);
  let ct = -1; for (const c of CLICKS) if (t >= c) ct = c;
  if (ct >= 0 && t < ct + .45) { S.click = curAt(ct); const e = (t - ct) / .45; S.clickK = lerp(.8, 1.7, e); S.clickA = .9 * (1 - e); }
  if (t >= 10.05 && t < 10.5) { const e = (t - 10.05) / .45; S.click2 = { p: keys(10.05, ANA), c: TEAL, k: lerp(.8, 1.7, e), a: .9 * (1 - e) }; }
  if (t >= 10.3 && t < 10.75) { const e = (t - 10.3) / .45; S.click2 = { p: keys(10.3, LEO), c: VIO, k: lerp(.8, 1.7, e), a: .9 * (1 - e) }; }

  // voo da vencedora: sai do quadro no pixel exato e pousa como card
  S.wash = wash;
  if (fly) {
    const a = seg(t, FLY, 11.5, p3out), b = seg(t, 11.5, END, p3io);
    const X0 = 960 + (CX - cam[1]) * cam[0], Y0 = 540 + (CY - cam[2]) * cam[0], S0 = VZ * cam[0];
    S.fly = { x: lerp(X0, 960, b), y: lerp(Y0 - a * 8, 451, b), s: lerp(S0 * (1 + .1 * a), 1440 / 1280, b), rx: 7 * a * (1 - b), ry: -9 * a * (1 - b), rz: -3.5 * a * (1 - b), e: a, l: Math.max(a, b) };
    S.flyT = W;
  }
  return S;
}
function feedAt(t) {
  const v = lerp(3.8, 84, seg(t, 12.6, 13.1, p3out));
  return {
    cam: [1, 960, 540], z: Z,
    ai: t < 13.05 ? [1500, 1130] : [lerp(1500, 770, seg(t, 13.05, 13.6, p3io)), lerp(1130, 925, seg(t, 13.05, 13.6, p3io))],
    aiA: 1,
    feed: {
      T: art(11.9), title: t >= 12.25 ? 1 : 0, mA: seg(t, 12.2, 12.5), vA: seg(t, 12.55, 12.7), ng: seg(t, 11.95, 12.3, p3out),
      views: v < 10 ? v.toFixed(1).replace('.', ',') + ' mil' : Math.round(v) + ' mil',
      dur: t < 12.6 ? 0 : backOut(seg(t, 12.6, 12.9)), hover: t < 13.9 ? 0 : backOut(seg(t, 13.9, 14.2)),
      y: 46 - 14 * seg(t, 13.65, 14.05, p3out), push: lerp(1, 1.012, seg(t, 12, 15)),
    },
  };
}

// ---------- montagem ----------
$('cAna').querySelector('.ar').innerHTML = arrowSVG(TEAL); $('cLeo').querySelector('.ar').innerHTML = arrowSVG(VIO); $('cAI').querySelector('.ar').innerHTML = arrowSVG(CLAY);
$('cAI').querySelector('.tg').innerHTML = spark(CLAY, 11) + 'Claude'; $('avAI').innerHTML = spark(CLAY, 10);
$('tool').innerHTML = [I.cursor, I.frame, I.rect, I.pen, I.T, I.hand, I.msg].map((d, i) => `<span class="${i ? '' : 'on'}">${ic(d, i ? '#3a3a38' : '#fff')}</span>`).join('') + `<span>${spark(CLAY, 10)}</span>`;
$('feedClock').innerHTML = ic(I.clock, '#fff');
const p = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(p, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => paint(stateAt(p.t)) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
paint(stateAt(0));
