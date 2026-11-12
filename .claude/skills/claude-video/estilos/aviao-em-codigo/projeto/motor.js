// Motor do filme: um relógio só. paint(t) desenha tudo a partir do tempo.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.2/+esm';
import { createPlane } from './plane.js';
import { createReal, T } from './real.js';

const $ = (s) => document.querySelector(s);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const io3 = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const out3 = (x) => 1 - Math.pow(1 - x, 3);
const ramp = (t, a, b, e = io3) => e(clamp((t - a) / (b - a)));
const lerp = (a, b, k) => a + (b - a) * k;

// ── Cena ────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setSize(1920, 1080, false);
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const SKY = 0xc4cbbf;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 70, 210);
const camera = new THREE.PerspectiveCamera(30, 1920 / 1080, .5, 600);
camera.setViewOffset(1920, 1080, 165, 0, 1920, 1080); // centro desviado: o painel ocupa a direita

scene.add(new THREE.HemisphereLight(0xdfe6df, 0x8c7f62, 1.05));
const sun = new THREE.DirectionalLight(0xfff0d8, 3.1);
sun.position.set(14, 26, -18);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 80 });
sun.shadow.bias = -.0004;
sun.shadow.normalBias = .03;
scene.add(sun);

{
  const env = new THREE.Scene(), c = document.createElement('canvas'); c.width = 8; c.height = 256;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#dfe6ea'); g.addColorStop(.48, '#f4f3e8'); g.addColorStop(.52, '#a5977a'); g.addColorStop(1, '#6e6450');
  x.fillStyle = g; x.fillRect(0, 0, 8, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  env.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide })));
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, .02).texture;
  scene.environmentIntensity = .42;
}
// PRNG sem Math.random: o mesmo quadro sempre sai igual
const rng = (s) => () => ((s = Math.imul(s ^ (s >>> 15), s | 1) + 0x6d2b79f5 | 0), ((s ^ (s >>> 14)) >>> 0) / 4294967296);

// Chão de trama pontilhada, o lado "desenho" da cena
{
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d'), r = rng(7);
  x.fillStyle = '#c3b599'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${r() < .5 ? '255,245,220' : '70,60,40'},${r() * .07})`; x.fillRect(r() * 512, r() * 512, 2, 2); }
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    x.fillStyle = `rgba(62,54,38,${.2 + r() * .3})`;
    x.beginPath(); x.arc((i + .5 + (j % 2) * .5) * 32, (j + .5) * 32, 3 + r() * 1.2, 0, 7); x.fill();
  }
  const tx = new THREE.CanvasTexture(c);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(170, 170);
  tx.anisotropy = renderer.capabilities.getMaxAnisotropy(); tx.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ map: tx, roughness: .95 }));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
}
// Linha de árvores em camadas de névoa
{
  const layer = (radius, height, color, seed) => {
    const c = document.createElement('canvas'); c.width = 4096; c.height = 256;
    const x = c.getContext('2d'), r = rng(seed); x.fillStyle = color;
    for (let i = 0; i < 150; i++) {
      const px = r() * 4096, w = 22 + r() * 40, h = 46 + r() * 100;
      for (const o of [-1, 0, 1]) { x.beginPath(); x.ellipse(px + o * 4096, 256 - h * .5, w, h * .55, 0, 0, 7); x.fill(); x.fillRect(px + o * 4096 - w, 256 - h * .4, w * 2, h * .4); }
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.repeat.x = 5; t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 96, 1, true), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    m.position.y = height / 2 - .2; scene.add(m);
  };
  layer(260, 30, '#aab4a4', 11); layer(230, 21, '#909d8c', 23);
}

const U = { uPaint: { value: 0 }, uWeather: { value: .5 } };
const plane = createPlane(THREE, U);
scene.add(plane.root);

function tailLetters() {
  const x = U.tailCanvas.getContext('2d');
  x.clearRect(0, 0, 512, 256);
  x.textAlign = 'center'; x.fillStyle = 'rgba(232,232,222,.86)';
  x.font = '700 120px Barlow'; x.fillText('A-29B', 256, 110);
  x.font = '600 110px Barlow'; x.fillText('5950', 256, 225);
  U.tailTex.needsUpdate = true;
}

// ── Roteiro ─────────────────────────────────────────────────
export const DUR = T.dur;
const CLIP_IN = 11.5;

// Variante sem a foto: o avião passa do 3D para a ilustração e decola desenhado
const SO_DESENHO = document.getElementById('root').dataset.variante === 'desenho';

const CAPS = [
  [.35, 2.7, 'Um avião inteiro, só com código', true],
  [2.95, 5.2, 'Cada peça se move', false],
  [5.45, 7.9, 'Pintura nova em um clique', false],
  [8.75, 11.35, SO_DESENHO ? 'Agora, pronto para decolar' : 'Agora, de verdade', false],
];

// Pose alinhada com a foto real: a varredura só convence se as silhuetas baterem
const HERO = { az: -44, el: 0, d: 30, y: 1.8, vx: 0, vy: -90, fov: 14 };
// Câmera: [t, azimute, elevação, distância, alvo y]. Entre chaves, rajada; depois, parada.
const CAM = [
  [0, -14, 5, 24, 1.5], [2.4, -30, 6, 23, 1.5],
  [3.15, -78, 6, 23, 1.45], [3.95, -84, 7, 22.5, 1.45],
  [4.7, -22, 32, 25, 1.3], [5.45, -28, 32, 25, 1.3],
  [6.4, -68, 13, 24, 1.45], [6.95, -70, 12, 24, 1.45],
  [8.35, HERO.az, HERO.el, HERO.d, HERO.y], [DUR, HERO.az, HERO.el, HERO.d, HERO.y],
];
function camAt(t) {
  let i = 0; while (i < CAM.length - 2 && t >= CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1], k = io3(clamp((t - a[0]) / (b[0] - a[0])));
  return { az: lerp(a[1], b[1], k), el: lerp(a[2], b[2], k), d: lerp(a[3], b[3], k), y: lerp(a[4], b[4], k) };
}

const st = (t) => ({
  thr: ramp(t, 1.35, 2.1) * (1 - ramp(t, 8.0, 8.45)),
  canopy: ramp(t, 2.72, 3.2) * (1 - ramp(t, 7.55, 7.95)),
  flaps: ramp(t, 3.4, 3.85) * (1 - ramp(t, 7.25, 7.6)),
  ctrl: ramp(t, 4.27, 4.75, out3) * (1 - ramp(t, 6.85, 7.3)),
  paint: ramp(t, 5.47, 6.4, (x) => x),
  real: ramp(t, 9.2, 10.8),
  ui: ramp(t, CLIP_IN, CLIP_IN + .5),
  end: ramp(t, T.end, T.end + .45),
});

// Hélice: ângulo vem da integral da rotação, e termina em repouso num ponto fixo
const TAB = [], STEP = 1 / 120;
{ let a = 0; for (let i = 0; i <= DUR / STEP; i++) { TAB.push(a); a += st(i * STEP).thr * 21 * STEP; } }
const REST = TAB[TAB.length - 1];
const propAngle = (t) => TAB[Math.min(TAB.length - 1, Math.round(t / STEP))] - REST + Math.PI / 4 + .1;

// ── Painel e cursor ─────────────────────────────────────────
const SEG = {}; document.querySelectorAll('.seg').forEach((s) => { SEG[s.dataset.k] = s.children; });
const rectC = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const tr = (id) => { const r = $(id + ' .tr').getBoundingClientRect(); return [[r.left, r.top + 2], [r.right, r.top + 2]]; };
const mot = tr('#slMotor'), rea = tr('#slReal');
// [início do trecho, fim do trecho, destino]; o clique vem logo depois da chegada
const K = [
  [.95, 1.33, mot[0]], [1.35, 2.1, mot[1]],
  [2.25, 2.68, rectC(SEG.canopy[1])], [3.0, 3.36, rectC(SEG.flaps[1])],
  [3.82, 4.23, rectC(SEG.ctrl[1])], [5.03, 5.43, rectC($('#livB'))],
  [6.45, 6.82, rectC(SEG.ctrl[0])], [6.95, 7.2, rectC(SEG.flaps[0])], [7.25, 7.5, rectC(SEG.canopy[0])],
  [7.6, 7.98, mot[1]], [8.0, 8.45, mot[0]],
  [8.75, 9.18, rea[0]], [9.2, 10.8, rea[1]],
];
const CLICKS = [[2.72, SEG.canopy[1]], [3.4, SEG.flaps[1]], [4.27, SEG.ctrl[1]], [5.47, $('#livB')], [6.85, SEG.ctrl[0]], [7.24, SEG.flaps[0]], [7.54, SEG.canopy[0]]]
  .map(([tc, el]) => [tc, rectC(el)]);
function curAt(t) {
  let p = [1500, 1140];
  for (const [a, b, d] of K) { if (t < a) break; p = t >= b ? d : [lerp(p[0], d[0], io3((t - a) / (b - a))), lerp(p[1], d[1], io3((t - a) / (b - a)))]; if (t < b) break; }
  return p;
}

function paint(t) {
  const s = st(t);

  // 3D
  plane.set({ propAngle: propAngle(t), blur: ramp(s.thr, .45, .95), ctrl: s.ctrl, flaps: s.flaps, canopy: s.canopy });
  U.uPaint.value = s.paint;
  const hk = ramp(t, 6.95, 8.35);
  camera.fov = lerp(30, HERO.fov, hk); camera.setViewOffset(1920, 1080, lerp(165, HERO.vx, hk), lerp(0, HERO.vy, hk), 1920, 1080); camera.updateProjectionMatrix();
  const c = camAt(t), az = c.az * Math.PI / 180, el = c.el * Math.PI / 180;
  camera.position.set(.3 + c.d * Math.cos(el) * Math.cos(az), c.y + c.d * Math.sin(el), c.d * Math.cos(el) * Math.sin(az));
  camera.lookAt(.3, c.y, 0);
  renderer.render(scene, camera);

  // Do desenho ao real: a foto entra por baixo do desenho, do desfoque para o foco, sem cortina.
  // O desenho perde foco no mesmo ritmo, e a câmera nunca para de avançar.
  const realw = $('#realw'), gl = $('#gl'), r = s.real;
  const sm = (x) => x * x * (3 - 2 * x), rl = clamp((t - 9.25) / 1.6);
  const focoReal = sm(rl), focoDes = sm(clamp(rl / .85));
  const push = 1 + .04 * ramp(t, 8.4, 11.6, (x) => 1 - Math.pow(1 - x, 2));
  const cam = `scale(${push.toFixed(5)})`;
  gl.style.transformOrigin = realw.style.transformOrigin = '968px 640px';
  gl.style.transform = realw.style.transform = cam;
  gl.style.filter = r > 0 ? `blur(${(focoDes * 9).toFixed(2)}px) saturate(${(1 - .35 * focoDes).toFixed(3)})` : 'none';
  realw.style.display = r > 0 ? 'block' : 'none';
  realw.style.opacity = focoReal;
  realw.style.filter = focoReal < 1 ? `blur(${(16 * (1 - focoReal)).toFixed(2)}px) saturate(${(.55 + .45 * focoReal).toFixed(3)}) brightness(${(1.12 - .12 * focoReal).toFixed(3)})` : 'none';
  $('#scan').style.opacity = 0;
  if (REAL && r > 0) REAL.paintReal(t, ramp(t, 10.8, 11.75, (x) => x));

  // Painel
  const seg = (k, v) => { SEG[k][0].classList.toggle('on', !v); SEG[k][1].classList.toggle('on', !!v); };
  seg('ctrl', t >= 4.27 && t < 6.85); seg('flaps', t >= 3.4 && t < 7.24); seg('canopy', t >= 2.72 && t < 7.54);
  $('#livA').classList.toggle('on', t < 5.47); $('#livB').classList.toggle('on', t >= 5.47);
  const slider = (id, v) => { $(id + ' .tr u').style.width = v * 100 + '%'; $(id + ' .tr s').style.left = v * 100 + '%'; };
  slider('#slMotor', s.thr); slider('#slReal', s.real);
  $('#vMotor').textContent = s.thr < .02 ? 'parada' : s.thr > .98 ? 'máxima' : Math.round(s.thr * 100) + '%';
  $('#vReal').textContent = Math.round(s.real * 100) + '%';

  // Legenda
  const cap = $('#cap'); let shown = false;
  for (const [a, b, txt, eyebrow] of CAPS) if (t >= a && t < b) {
    const k = out3(clamp((t - a) / .28)) * (1 - ramp(t, b - .18, b));
    cap.style.opacity = k; cap.style.transform = `translateX(-50%) translateY(${(1 - k) * 18}px)`;
    $('#capT').textContent = txt; $('#capE').style.display = eyebrow ? 'flex' : 'none'; shown = true;
  }
  if (!shown) cap.style.opacity = 0;

  // Cursor e anel de clique
  const p = curAt(t), curEl = $('#cur');
  curEl.style.transform = `translate(${p[0] - 4}px,${p[1] - 3}px) scale(${1 - .14 * clickAmt(t)})`;
  curEl.style.opacity = 1 - s.ui;
  const ringEl = $('#ring'); let ro = 0;
  for (const [tc, q] of CLICKS) if (t >= tc && t < tc + .32) {
    const k = (t - tc) / .32; ro = 1 - k;
    ringEl.style.transform = `translate(${q[0]}px,${q[1]}px) scale(${.35 + k})`;
  }
  ringEl.style.opacity = ro;

  // Sobre a foto, o título passa para o claro
  const tk = SO_DESENHO ? 0 : clamp((t - 9.25) / 1.6) ** 2 * (3 - 2 * clamp((t - 9.25) / 1.6)), tc = `rgb(${lerp(32, 246, tk)},${lerp(36, 243, tk)},${lerp(28, 230, tk)})`;
  $('#title').style.setProperty('--tt', tc);

  // Saída da interface antes do vídeo real
  $('#panel').style.transform = `translateX(${s.ui * 360}px)`;
  $('#title').style.transform = `translateX(${-s.ui * 760}px)`;
  $('#tag').style.opacity = 1 - s.ui;

  // Cartão final
  $('#end').style.opacity = s.end;
  const e = out3(clamp((t - (T.end + .15)) / .45));
  $('#end').querySelector('.e1').style.transform = `translateY(${(1 - e) * 26}px)`;
}
const clickAmt = (t) => { for (const [tc] of CLICKS) if (t >= tc - .02 && t < tc + .1) return 1; return 0; };

let REAL = null;
window.addEventListener('hf-seek', (ev) => paint(ev.detail.time));
window.__paint = paint;
paint(window.__hfThreeTime || 0);
const fontes = document.fonts.load('900 190px "Big Shoulders Stencil"').then(() => document.fonts.load('800 92px "Big Shoulders Stencil"')).then(() => {
  tailLetters(); paint(window.__hfThreeTime || 0);
});
Promise.all([fontes, createReal($('#bgc'), $('#fg'), SO_DESENHO)]).then(([, r]) => { REAL = r; paint(window.__hfThreeTime || 0); });
