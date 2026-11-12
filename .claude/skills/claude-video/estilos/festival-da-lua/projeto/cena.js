// cena.js — o desenho inteiro, em unidades (960 x 540), medido nos quadros da referência.
// Camadas que deslizam para a esquerda: FUNDO 0,7 · SERRA 1 · FRENTE 1,8 · AGUA 1,6 (vezes desliza(t)).
// Lua, céu, nuvens, galho, poça, círculo e bolo ficam parados na tela.
const PAN = { fundo: .7, serra: 1, frente: 1.8, agua: 1.6 };
// posição de desenho de algo que aparece em x de tela no instante t
const naFrente = (x, t) => x + PAN.frente * desliza(t);

// ---------- a linha da serra (o primeiro traço) ----------
const SERRA = [[-14, 360], [0, 360], [24, 364], [48, 363], [72, 369], [86, 371], [98, 368], [110, 362], [122, 359], [134, 349], [146, 335], [158, 318], [168, 311], [180, 318], [192, 325], [204, 333], [216, 345], [228, 354], [240, 360], [254, 364], [266, 367], [278, 370], [290, 362], [302, 348], [314, 332], [326, 303], [338, 276], [348, 269], [360, 284], [372, 302], [384, 324], [396, 339], [408, 349], [420, 360], [434, 366], [446, 367], [458, 366], [470, 364], [482, 361], [494, 354], [506, 338], [518, 315], [530, 302], [541, 303], [553, 318], [565, 335], [577, 347], [589, 357], [601, 355], [613, 345], [625, 337], [637, 324], [649, 310], [661, 296], [673, 300], [685, 319], [697, 340], [709, 355], [721, 360], [733, 367], [745, 372], [757, 372], [769, 371], [781, 363], [793, 353], [805, 328], [817, 295], [829, 260], [838, 255], [850, 272], [864, 296], [877, 313], [889, 336], [901, 352], [913, 360], [925, 359], [937, 360], [960, 358], [985, 352], [1003, 340], [1018, 329], [1032, 336], [1050, 350], [1075, 358], [1105, 362], [1140, 360], [1190, 361]];
const GOTA = [42, 362];
function serraY(x) {
  if (x <= SERRA[0][0]) return SERRA[0][1];
  for (let i = 1; i < SERRA.length; i++) if (x <= SERRA[i][0]) return lerp(SERRA[i - 1][1], SERRA[i][1], (x - SERRA[i - 1][0]) / (SERRA[i][0] - SERRA[i - 1][0]));
  return SERRA[SERRA.length - 1][1];
}
// os picos que a tinta enche (cume, vale esquerdo, vale direito, força), na ordem em que enchem
const PICOS = [
  { px: 348, py: 269, vl: [278, 370], vr: [446, 367], A: 1.75, t0: 4.4, t1: 5.9 },
  { px: 836, py: 255, vl: [750, 372], vr: [915, 360], A: 1.85, t0: 4.45, t1: 6.0 },
  { px: 664, py: 296, vl: [592, 357], vr: [750, 372], A: 1.35, t0: 4.65, t1: 6.1 },
  { px: 535, py: 301, vl: [446, 367], vr: [592, 357], A: 1.3, t0: 4.75, t1: 6.2 },
  { px: 1018, py: 329, vl: [915, 360], vr: [1110, 362], A: 1.1, t0: 4.8, t1: 6.3 },
  { px: 168, py: 311, vl: [86, 371], vr: [278, 370], A: .9, t0: 4.9, t1: 6.3 },
];
function densPico(p) {
  return (x, y) => {
    const r = serraY(x); if (y < r - .5 || x < p.vl[0] || x > p.vr[0]) return 0;
    const base = lerp(p.vl[1], p.vr[1], (x - p.vl[0]) / (p.vr[0] - p.vl[0])), h = base - p.py;
    const rh = clamp01((base - r) / h), dy = Math.max(0, y - r);
    let d = p.A * rh ** 1.25 * Math.exp(-dy / (.5 * h)) + .55 * rh * Math.exp(-dy / 3);
    if (x < p.px) d *= 1.12;
    d *= .76 + .48 * fbm(x * .05, y * .05, 3);
    return d * (1 - smooth(base - 10, base + 26, y));
  };
}
// um monte triangular (cume px,py; meia largura hw; base)
function densMonte(m) {
  return (x, y) => {
    const k = Math.abs(x - m.px) / m.hw; if (k > 1.3) return 0;
    const ry = m.py + (m.base - m.py) * k ** (m.curva || 1.1); if (y < ry) return 0;
    const v = clamp01((y - m.py) / (m.base - m.py));
    let d = m.A * (1 - .95 * v ** 1.4) * (1 - .35 * k * k) + .45 * Math.exp(-(y - ry) / 2.5);
    d *= .78 + .44 * fbm(x * .06, y * .06, m.s || 5);
    return d * (1 - smooth(m.base - 6, m.base + 24, y));
  };
}
const MORRO = { px: 777, py: 296, hw: 40, base: 336, A: .75, s: 8 };        // morrinho cinza atrás do pico grande
const M1 = { px: naFrente(170, 6), py: 294, hw: 64, base: 392, A: 2.6, s: 11, curva: .78 }; // os dois picos pretos da frente
const M2 = { px: naFrente(318, 6), py: 318, hw: 66, base: 402, A: 2.4, s: 13, curva: .85 };
const LINHA2 = [[-30, 383], [0, 384], [30, 387], [60, 390], [96, 393], [120, 388], [140, 380]].map(([x, y]) => [naFrente(x, 6), y]);
// a margem escura da direita
const MARGEM = [[738, 416], [760, 410], [785, 404], [805, 401], [835, 403], [865, 405], [895, 400], [920, 397], [945, 394], [965, 395], [990, 397], [1020, 394], [1050, 391], [1080, 393], [1110, 397], [1150, 401], [1190, 404], [1240, 406]].map(([x, y]) => [naFrente(x, 6.2), y]);
function margemY(x) {
  if (x <= MARGEM[0][0] || x >= MARGEM[MARGEM.length - 1][0]) return 1e9;
  for (let i = 1; i < MARGEM.length; i++) if (x <= MARGEM[i][0]) return lerp(MARGEM[i - 1][1], MARGEM[i][1], (x - MARGEM[i - 1][0]) / (MARGEM[i][0] - MARGEM[i - 1][0]));
}
function densMargem(x, y) {
  const r = margemY(x); if (y < r) return 0;
  const borda = Math.min(1, (x - MARGEM[0][0]) / 30);
  return borda * (1.15 * Math.exp(-(y - r) / 3.5) + .25 * Math.exp(-(y - r) / 11)) * (.75 + .5 * fbm(x * .07, y * .07, 17));
}

// ---------- montanhas azul-acinzentadas do fundo ----------
const FUNDO = [[160, 253, 85], [293, 245, 80], [487, 256, 90], [635, 228, 95], [833, 214, 105], [985, 240, 85], [1075, 262, 70], [1160, 250, 80]]
  .map(([x, y, hw]) => ({ px: x + 5, py: y, hw }));
function densFundo(x, y) {
  let d = 0;
  for (const m of FUNDO) {
    const k = Math.abs(x - m.px) / m.hw; if (k > 1.4) continue;
    const ry = m.py + (345 - m.py) * k ** 1.4; if (y < ry - 1.5) continue;
    const e = clamp01((y - ry + 1.5) / 3);
    d = Math.max(d, e * (.78 * Math.exp(-(y - ry) / 20) + .1) * (1 - .5 * k));
  }
  return d * (1 - smooth(290, 345, y)) * (.8 + .4 * fbm(x * .04, y * .08, 21));
}

// ---------- linhas de água (x0, x1, y) ----------
const AGUA = [[150, 520, 443], [560, 760, 452], [420, 700, 478], [60, 330, 498], [820, 1080, 470], [700, 930, 528], [980, 1210, 505], [1050, 1240, 440], [-60, 160, 470]]
  .map(([a, b, y]) => [a + 5, b + 5, y]);

// ---------- nuvens (faixas: x0, x1, centro y, altura, opacidade) ----------
const NUVENS = [
  [140, 580, 138, 30, .26], [700, 1120, 146, 24, .26],
  [70, 640, 186, 32, .42], [680, 1090, 176, 26, .38],
  [230, 540, 232, 18, .18], [860, 1160, 206, 18, .22],
];
// névoa branca que engole a base das montanhas (faixas: x0, x1, y, altura, opacidade)
const NEVOA_A = [[-200, 1400, 338, 16, .55], [-100, 500, 326, 12, .35], [600, 1300, 330, 12, .35]];
const NEVOA_B = [[-200, 1500, 392, 22, .62], [-200, 1500, 430, 34, .45], [-200, 1500, 500, 50, .35], [100, 800, 372, 10, .3]];

// ---------- céu ----------
const LUA = { x: 665, y: 150, r: 53 };
const POCA = { x: 665, y: 435, rx: 125, ry: 22 };

// ---------- o galho (entra pelo canto de cima, da direita para a esquerda) ----------
const GALHO = [[978, 24], [950, 33], [920, 46], [885, 54], [843, 62], [805, 72], [770, 85], [742, 96], [712, 108], [688, 117], [662, 124]];
const GALHINHOS = [
  { pts: [[921, 47], [916, 62], [907, 80], [898, 98]], t0: 13.3, t1: 13.9 },
  { pts: [[843, 62], [835, 78], [826, 94], [816, 108]], t0: 13.6, t1: 14.2 },
  { pts: [[773, 84], [769, 68], [763, 54], [756, 40]], t0: 13.9, t1: 14.5 },
  { pts: [[709, 109], [705, 125], [701, 142], [697, 160]], t0: 14.1, t1: 14.7 },
  { pts: [[950, 34], [956, 22], [960, 14]], t0: 13.15, t1: 13.5 },
];
// folhas: x, y, ângulo da ponta, comprimento
const FOLHAS = [[688, 118, 3.0, 13], [757, 39, -2.5, 11], [765, 57, -2.9, 10], [742, 97, -2.3, 10], [701, 141, -2.7, 9], [693, 159, 2.5, 9], [829, 92, -2.6, 9], [906, 89, -2.1, 9], [871, 55, -2.9, 10], [801, 73, 2.7, 9], [918, 46, -1.0, 8], [957, 18, -.9, 9], [728, 103, 2.4, 8]];
// flores: x, y, raio
const FLORES = [[755, 43, 3.8], [772, 56, 3.4], [763, 66, 3.6], [793, 72, 3.2], [804, 76, 3.8], [809, 82, 3.0], [737, 99, 3.2], [817, 107, 3.9], [828, 100, 3.3], [802, 115, 3.5], [812, 124, 3.7], [873, 53, 3.6], [877, 63, 3.2], [900, 76, 3.5], [913, 81, 3.4], [897, 101, 3.8], [692, 146, 3.9], [697, 163, 4.1], [688, 131, 2.6], [783, 77, 2.4], [925, 62, 2.6], [858, 58, 2.3], [705, 120, 2.4]];

// ---------- a casa e a vila (posições de tela em 24,4 s; deslizam com a frente) ----------
const DXC = PAN.frente * desliza(24.4);
const DXP = PAN.frente * desliza(25);

// ---------- o círculo e a pessoa dentro dele ----------
const ENSO = { x: 258, y: 262, r: 118 };

// ---------- o bolo da lua ----------
const BOLO = { x: 380, y: 270, r: [75, 124, 132], borda: 145, pontos: 128, volutas: 100 };
const ONDAS_R0 = [110, 150, 178]; // tamanho das ondas antes de subir
