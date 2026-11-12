// Motor do estilo editor: um relógio só. Tudo que aparece na tela é função pura de t.
const DUR = 18, CUT = 7.0667;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, e) => a + (b - a) * e;
const expoOut = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const p3io = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const p1io = x => (x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const p3out = x => 1 - Math.pow(1 - x, 3);
const p2in = x => x * x;
const p3in = x => x * x * x;
const p4in = x => x * x * x * x;
const backOut = (x, s = 2) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const seg = (t, a, b, ease = x => x) => ease(clamp((t - a) / (b - a)));
const $ = id => document.getElementById(id);

// ---------- montagem estática ----------
const SIL = [[6.5, 9], [15, 18.5], [24, 26.5]];
const PIECES = [[0, 6.5, 0], [9, 15, 2.5], [18.5, 24, 6], [26.5, 30, 8.5]]; // início, fim, quanto anda no fechamento
const TOTAL = 21.5;
const WAVE1 = wave(792, 54, 3, 1), WAVE2 = wave(792, 54, 7, .8);
const SLOT = [
  { s: 4, e: 7.5, loop: 0, th: [24, 836], go: [4.7, 5.2], bin: 2 },
  { s: 9, e: 13, loop: 1, th: [250, 836], go: [5.3, 5.8], bin: 3 },
  { s: 15, e: 18, bg: COD, th: [24, 960], go: [5.9, 6.4], bin: 4 },
];
const TLX = 536, TLY = 620;
const STEPTIME = [[2.0, 4.3], [4.3, CUT], [CUT, 8.3], [8.3, 10.85], [10.85, 12.7], [13.0, 14.1]];
const RECT = { ai: [1448, 52, 464, 1020], tl: [536, 620, 904, 452], prog: [568, 52, 872, 560], src: [8, 52, 552, 560] };

$('tools').innerHTML = toolsHTML;
$('bin').innerHTML = binPanel(-1);
$('src').innerHTML = `<div class="hd"><span id="sT1" class="on">Origem</span><span id="sT2">Controles de efeito</span></div>
<div id="srcA"><div class="box" style="left:16px;top:50px;width:520px;height:292px"><div class="scr" style="transform:scale(.27083)">${screen({})}</div></div><div class="ctrl" style="top:360px">${ctrl('00:00:01:00')}</div></div>
<div id="srcB" class="grade" style="display:none"><h4>Ajuste de cor<small>fx</small></h4>
<label><span>Temperatura</span><span id="vT">0,0</span></label><div class="track tp"><u id="uT"></u></div>
<label><span>Saturação</span><span id="vS">0,0</span></label><div class="track"><u id="uS"></u></div>
<label><span>Contraste</span><span>11,0</span></label><div class="track"><u style="left:54%"></u></div></div>`;
const capHTML = `<div class="cap"><span class="w">feito</span> <span class="w">com</span> <span class="w"><i>Claude</i></span></div>`;
const lowHTML = `<div class="low"><u></u><div><b>Seu Nome</b><em>Seu canal</em></div></div>`;
$('prog').innerHTML = `<div class="hd"><span class="on">Programa</span></div>
<div class="box" style="left:16px;top:40px;width:840px;height:472px"><div class="scr" id="pScr" style="transform:scale(.4375)">
${scene(COOL)}<div id="pWarm" style="position:absolute;inset:0">${scene(WARM)}</div>
<div id="pRoll" style="position:absolute;inset:0;background-size:cover;background-position:center;display:none"></div>
<div class="wipe" id="pWipe" style="display:none"></div><div class="wtag" id="tA" style="left:40px;display:none">Antes</div><div class="wtag" id="tD" style="right:40px;display:none">Depois</div>
<div id="pLow">${lowHTML}</div><div id="pCap">${capHTML}</div><div id="pSp" style="position:absolute;left:1730px;top:880px;width:96px;height:96px;display:none">${spark()}</div>
</div></div>
<div class="ctrl" id="pCtrl" style="top:524px">${ctrl('')}</div><div class="exp" id="pExp" style="top:526px;display:none"><div><i id="eBar" style="width:0"></i></div><span id="ePct">0%</span></div>`;
$('ai').innerHTML = aiPanel(-1, 6);
const stepEls = [...$('ai').querySelectorAll('.step')];
const binEls = [...$('bin').querySelectorAll('.th')];

let tlH = `<div class="hd"><span class="on">Abertura</span></div><div class="tcbig" id="tc2"></div><div class="icons">${['snap', 'plus', 'sq', 'arc'].map(k => ic(I[k])).join('')}</div><div class="tcend" id="tcE"></div><div class="ruler">${[0, 5, 10, 15, 20, 25, 30].map(s => `<span style="left:${s * PX}px">00:${String(s).padStart(2, '0')}</span>`).join('')}</div>`;
for (const r in Y) tlH += `<div class="rowl" style="top:${Y[r]}px">${ic(I.lock, '#8d8d8d')}<b>${r}</b>${ic(r[0] === 'V' ? I.eye : I.spk, '#8d8d8d')}</div>`;
for (let i = 0; i < 9; i++) tlH += `<div class="clip gfx v3" style="left:${sx(1.6 + i * 2.2)}px;top:${Y.V3}px;width:${1.7 * PX}px"><div style="position:absolute;left:18%;right:18%;top:24px;height:5px;background:#d7d7d7;border-radius:3px"></div></div>`;
PIECES.forEach(([a, b], i) => {
  const w = (b - a) * PX;
  tlH += `<div class="clip vid pc" data-i="${i}" style="left:${sx(a)}px;top:${Y.V1}px;width:${w}px;background-image:${THUMB};background-position:${-a * PX}px 0"></div>`;
  tlH += `<div class="clip aud pc" data-i="${i}" style="left:${sx(a)}px;top:${Y.A1}px;width:${w}px"><div style="position:absolute;left:${-a * PX}px;top:0;width:792px;height:54px">${WAVE1}</div></div>`;
});
tlH += `<div class="clip aud" id="a2" style="left:${sx(0)}px;top:${Y.A2}px;width:${30 * PX}px"><div style="position:absolute;left:0;top:0;width:792px;height:54px">${WAVE2}</div></div>`;
// o trecho em silêncio existe de verdade até ser cortado
SIL.forEach(([a, b]) => {
  const w = (b - a) * PX;
  tlH += `<div class="clip vid sl" style="left:${sx(a)}px;top:${Y.V1}px;width:${w}px;background-image:${THUMB};background-position:${-a * PX}px 0"></div>`;
  tlH += `<div class="clip aud sl" style="left:${sx(a)}px;top:${Y.A1}px;width:${w}px"><div style="position:absolute;left:${-a * PX}px;top:0;width:792px;height:54px">${WAVE1}</div></div>`;
});
SIL.forEach(([a, b]) => { for (const r of ['V1', 'A1']) tlH += `<div class="hatch ht" style="left:${sx(a)}px;top:${Y[r]}px;width:${(b - a) * PX}px;height:54px;border-radius:5px"></div>`; });
tlH += `<div class="ph" id="ph"></div><div class="scroll"></div>`;
$('tl').innerHTML = tlH;
const pcs = [...document.querySelectorAll('.pc')], hts = [...document.querySelectorAll('.ht')], sls = [...document.querySelectorAll('.sl')], v3s = [...document.querySelectorAll('.v3')];

const app = $('app');
const mk = (id, css, html = '') => { const d = document.createElement('div'); d.id = id; d.style.cssText = css; d.innerHTML = html; app.appendChild(d); return d; };
const ghosts = SLOT.map((c, i) => mk('g' + i, `position:absolute;border-radius:5px;border:3px solid #d97757;${c.bg ? `background-image:${c.bg};` : ''}background-size:cover;background-position:center;display:none;overflow:hidden`));
// os dois vídeos em loop: um quadro por relógio, copiado para cada lugar onde aparecem
const novoCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'; return c; };
const LOOPS = [window.renderNeve, window.renderPapel].map((fn) => ({ fn, cv: novoCanvas(1280, 720), alvos: [] }));
SLOT.forEach((c, i) => {
  if (c.loop == null) return;
  const L = LOOPS[c.loop], th = novoCanvas(428, 240), g = novoCanvas(320, 180);
  binEls[c.bin].style.backgroundImage = 'none'; binEls[c.bin].prepend(th); ghosts[i].appendChild(g); L.alvos.push(th, g);
});
const rollC = novoCanvas(1280, 720); $('pRoll').appendChild(rollC);
mk('focus', 'position:absolute;border:2px solid #d97757;border-radius:8px;pointer-events:none');
for (const id of ['spark', 'ring', 'cur', 'tag']) { const e = $(id); e.style.margin = '0'; e.style.transformOrigin = '0 0'; app.appendChild(e); }
$('ring').style.transformOrigin = '50% 50%';
// o mascote do Claude Code em pixels, na mesma grade do desenho que aparece no terminal
const CLAWD = (() => {
  const B = [[3,0,12,2],[1,2,16,1],[3,3,12,1],[2,2,14,2],[4,4,1,1],[6,4,1,1],[11,4,1,1],[13,4,1,1]];
  return `<svg viewBox="0 0 18 5" preserveAspectRatio="none" shape-rendering="crispEdges" style="position:absolute;inset:0;width:100%;height:100%">${B.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#d97757"/>`).join('')}<rect x="5" y="1" width="1" height="1" fill="#0d0d0d"/><rect x="12" y="1" width="1" height="1" fill="#0d0d0d"/></svg>`;
})();
const MW = 90, MH = 50; // no terminal cada pixel do desenho é duas vezes mais alto que largo
const sEl = $('spark'); sEl.innerHTML = CLAWD; sEl.style.width = MW + 'px'; sEl.style.height = MH + 'px'; sEl.style.transformOrigin = '50% 100%';
// no pouso: arco de contato sobre o clipe e o risco branco do corte, como na referência
const arc = mk('hopArc', 'position:absolute;width:80px;height:26px;border:3px solid #d97757;border-bottom-color:transparent;border-radius:50%;pointer-events:none');
const razor = mk('razor', 'position:absolute;width:3px;background:#fff;pointer-events:none');
$('tag').innerHTML = spark(CLAY, 11) + 'Claude';
$('grain').style.backgroundImage = uri(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2"/><feColorMatrix type="saturate" values="0"/></filter><rect width="256" height="256" filter="url(#n)"/></svg>`);
$('full').innerHTML = `<div class="scr" id="fScr">${scene(WARM)}<div id="fLow">${lowHTML}</div><div id="fCap">${capHTML}</div><div style="position:absolute;left:1740px;top:880px;width:96px;height:96px">${spark()}</div></div><div id="flash" style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,#d97757 0%,rgba(217,119,87,.5) 45%,rgba(217,119,87,0) 80%);mix-blend-mode:screen"></div>`;
const pW = [...$('pCap').querySelectorAll('.w')], fW = [...$('fCap').querySelectorAll('.w')];
[...pW, ...fW].forEach(w => { w.style.display = 'inline-block'; w.style.padding = '0 14px 4px'; w.style.borderRadius = '12px'; });
const lowEls = [$('pLow').firstChild, $('fLow').firstChild];
// riscos de luz, fixos e sorteados com semente
const ST = []; { const r = rng(5), NS = 'http://www.w3.org/2000/svg'; for (let i = 0; i < 56; i++) { const l = document.createElementNS(NS, 'line'); l.setAttribute('stroke', i % 3 === 0 ? CLAY : '#ededed'); l.setAttribute('stroke-width', 1 + r() * 2); $('streaks').appendChild(l); ST.push({ l, a: r() * 6.283, r0: 120 + r() * 200, len: 140 + r() * 460, o: .35 + r() * .55, d: r() * .12 }); } }

// ---------- câmera ----------
const WIDE = [1, 960, 540], TL = [1.9, 988, 796], BIN = [1.5, 650, 720], PRG = [1.9, 1004, 332], COL = [1.33, 730, 406], LOW = [1.7, 1004, 332], DIVE = [2.286, 1004, 328];
const H = [
  { a: 1.5, b: 2.0, c: WIDE, d: 0 }, { a: 2.5, b: 4.4, c: TL, d: .03 }, { a: 4.85, b: CUT, c: BIN, d: .02 }, { a: CUT, b: 8.3, c: PRG, d: .03 },
  { a: 8.75, b: 10.85, c: COL, d: .02 }, { a: 11.3, b: 12.1, c: LOW, d: .02 }, { a: 12.6, b: 14.05, c: WIDE, d: .012 },
];
const hs = (h, t) => [h.c[0] * (1 + h.d * (t - h.a) / (h.b - h.a)), h.c[1], h.c[2]];
const mixC = (A, B, e) => [lerp(A[0], B[0], e), lerp(A[1], B[1], e), lerp(A[2], B[2], e)];
function camAt(t) {
  if (t < 1.5) return [lerp(.8, 1, expoOut(t / 1.5)), 960, 540];
  if (t >= 14.05) return mixC(hs(H[6], 14.05), DIVE, seg(t, 14.05, 15, p4in));
  for (let i = 0; i < H.length; i++) {
    const h = H[i];
    if (t >= h.a && t < h.b) return hs(h, t);
    const n = H[i + 1];
    if (n && t >= h.b && t < n.a) return mixC(hs(h, h.b), hs(n, n.a), p3io((t - h.b) / (n.a - h.b)));
  }
  return hs(H[6], t);
}

// ---------- cursor: cada trecho é [início, fim, x, y]. Corte de câmera pode trocar de lugar sem deslizar. ----------
const yT = 203, yS = 288;
const PATH = [[1.2, 1.75, 1870, 1040], [2.3, 2.7, 837, 879], [2.85, 3.0, 1074, 879], [3.15, 3.3, 1298, 879], [4.45, 4.68, 131, 892], [4.7, 5.2, 784, 820], [5.22, 5.3, 357, 892], [5.32, 5.8, 922, 820], [5.82, 5.9, 131, 1016], [5.92, 6.4, 1068, 820], [CUT, CUT, 1370, 430], [8.3, 8.48, 1000, 585], [8.48, 8.65, 259, yT], [8.7, 9.25, 393, yT], [9.28, 9.4, 259, yS], [9.42, 9.72, 324, yS], [10.9, 11.1, 1000, 585], [11.1, 11.3, 1320, 170], [12.15, 12.7, 1760, 660], [12.75, 12.98, 1780, 684]];
const CLICKS = [1.85, 2.75, 3.05, 3.35, 4.69, 5.31, 5.91, 8.67, 9.41, 13.0];
function curAt(t) {
  let x = 1880, y = 1120;
  for (const [a, b, X, Y2] of PATH) {
    if (t >= b) { x = X; y = Y2; continue; }
    if (t >= a) { const e = p3io((t - a) / (b - a)); x = lerp(x, X, e); y = lerp(y, Y2, e); }
    break;
  }
  return [x, y];
}
// faísca que pula na linha do tempo
const HOPS = [[2.5, 700, 852], [2.75, 837, 852], [3.05, 1074, 852], [3.35, 1298, 852], [4.3, 1180, 852], [5.2, 784, 794], [5.8, 922, 794], [6.4, 1068, 794]]; // tempo, x, altura do clipe em que pousa
function sparkAt(t) {
  let x = 700, base = 852, h = 0, sq = 0; // de pé em cima do clipe
  for (let i = 1; i < HOPS.length; i++) {
    const [T, X, Yb] = HOPS[i], [T0, X0, Y0] = HOPS[i - 1], a = T - .28;
    if (t >= T) { x = X; base = Yb; sq = Math.exp(-(t - T) * 10) * Math.cos((t - T) * 22) * .25; continue; }
    if (t >= a && T > T0) { const e = (t - a) / .28; x = lerp(X0, X, p1io(e)); base = lerp(Y0, Yb, p1io(e)); h = Math.sin(Math.PI * e) * 62; sq = -.12 * Math.sin(Math.PI * e); }
    else { x = X0; base = Y0; }
    break;
  }
  return [x, base - h, sq];
}

// ---------- estado ----------
const fmt = s => { const f = Math.floor(s * 30 + .001), ss = Math.floor(f / 30) % 60, m = Math.floor(f / 1800); return `00:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(f % 30).padStart(2, '0')}`; };
function phAt(t) {
  if (t < 2.4) return t;
  if (t < 4.6) return 2.4;
  if (t < CUT) return lerp(2.4, 14, (t - 4.6) / (CUT - 4.6));
  if (t < 12.7) return lerp(6.83, 8.3, (t - CUT) / (12.7 - CUT));
  if (t < 13) return 8.3;
  return lerp(8.3, TOTAL, seg(t, 13, 14.1, p1io));
}
const setText = (el, s) => { if (el.textContent !== s) el.textContent = s; };
const show = (el, on) => { const v = on ? '' : 'none'; if (el.style.display !== v) el.style.display = v; };
function capture(words, t, t0, pillEnd) {
  words.forEach((w, i) => {
    const a = t0 + i * .15, e = seg(t, a, a + .33);
    w.style.opacity = e > 0 ? 1 : 0;
    w.style.transform = `translateY(${(1 - e) * 22}px) scale(${lerp(.86, 1, backOut(e))})`;
    const live = t >= a && t < (i < 2 ? a + .15 : pillEnd);
    w.style.background = live ? '#d97757' : 'transparent';
  });
}
function lowState(el, t, t0) {
  const e = seg(t, t0, t0 + .55, expoOut);
  el.style.clipPath = `inset(0 ${(1 - e) * 100}% 0 0)`;
}

function render(t) {
  if (t < 15) LOOPS.forEach((L) => { L.fn(L.cv.getContext('2d'), t, {}, 1280, 720); L.alvos.forEach((a) => a.getContext('2d').drawImage(L.cv, 0, 0, a.width, a.height)); });
  // abertura e câmera
  const [s, x, y] = camAt(t);
  const opening = t < 1.5 ? 1 - expoOut(t / 1.5) : 0;
  const dt = .02, A = camAt(t - dt), B = camAt(t + dt), jump = Math.abs(B[1] - A[1]) > 40;
  const vx = jump ? 0 : (B[1] - A[1]) / (2 * dt) * s, vy = jump ? 0 : (B[2] - A[2]) / (2 * dt) * s;
  const ry = opening * 16 + clamp(vx * .0016, -3, 3), rx = -opening * 13 - clamp(vy * .0016, -3, 3);
  const cam = $('cam');
  cam.style.transformOrigin = `${x}px ${y}px`;
  cam.style.transform = `translate(${960 - x}px,${540 - y}px) scale(${s}) rotateY(${ry}deg) rotateX(${rx}deg)`;

  // painéis: entram em sequência; no fim voam para fora
  const dive = seg(t, 14.05, 15);
  const DV = { src: [-1, -.5, 1200, 34, 0], bin: [-1, .7, 1500, 26, -14], tools: [-.3, 1, 1000, 0, -24], tl: [.25, 1, 1300, 0, -34], ai: [1, 0, 1400, -38, 0] };
  [['src', 0], ['prog', 1], ['ai', 2], ['bin', 3], ['tools', 4], ['tl', 5]].forEach(([id, i]) => {
    const el = $(id), e = seg(t, .08 + i * .07, .78 + i * .07, expoOut);
    let tf = `translateY(${(1 - e) * 26}px) scale(${lerp(.975, 1, e)})`, flt = '';
    const d = DV[id];
    if (d && t > 14.05) {
      const n = seg(t, 14.05, 14.3, p3out), f = seg(t, 14.15 + i * .05, 15, p3in);
      tf = `translate3d(${d[0] * (26 * n + 420 * f)}px,${d[1] * (26 * n + 300 * f)}px,${d[2] * f}px) rotateY(${d[3] * f}deg) rotateX(${d[4] * f}deg)`;
      flt = `blur(${(7 * f).toFixed(2)}px)`;
    }
    el.style.opacity = e;
    el.style.transform = tf;
    el.style.filter = flt;
  });
  app.style.background = t > 14.05 ? 'transparent' : '';
  document.querySelector('.bar').style.opacity = 1 - seg(t, 14.05, 14.4);

  // abas
  $('tEdit').className = t < 12.7 ? 'on' : ''; $('tExp').className = t < 12.7 ? '' : 'on';
  const g = t >= 8.3; show($('srcA'), !g); show($('srcB'), g); $('sT1').className = g ? '' : 'on'; $('sT2').className = g ? 'on' : '';

  // plano do Claude: o pedido entra, depois os passos
  const pe = seg(t, 1.0, 1.35), pr = $('ai').querySelector('.prompt');
  pr.style.opacity = pe > 0 ? 1 : 0; pr.style.transform = `translateY(${(1 - pe) * 12}px) scale(${lerp(.9, 1, backOut(pe))})`;
  stepEls.forEach((el, i) => {
    const e = seg(t, 1.45 + i * .1, 1.85 + i * .1, expoOut), [a, b] = STEPTIME[i];
    el.style.opacity = e; el.style.transform = `translateY(${(1 - e) * 14}px)`;
    const cls = t >= b ? 'step ok' : t >= a ? 'step run' : 'step';
    if (el.className !== cls) el.className = cls;
    const bb = el.querySelector('b');
    if (t >= b) { if (!bb.firstChild) bb.innerHTML = ic(I.check, '#fff'); bb.style.transform = `scale(${backOut(seg(t, b, b + .4), 2.6)})`; }
    else { if (bb.firstChild) bb.innerHTML = ''; bb.style.transform = t >= a ? `rotate(${(t * 360) % 360}deg)` : ''; }
  });

  // silêncios: marcados no clique, levantam e o buraco fecha
  const close = seg(t, 3.85, 4.3, p3io);
  pcs.forEach(p => {
    const [a, , off] = PIECES[+p.dataset.i];
    p.style.left = sx(a - off * close) + 'px';
  });
  hts.forEach((h, k) => {
    const i = Math.floor(k / 2), on = seg(t, 2.75 + i * .3, 3.0 + i * .3, p3out), up = seg(t, 3.6 + i * .08, 3.85 + i * .08, p2in);
    h.style.transformOrigin = '0 50%';
    h.style.transform = `translateY(${-16 * up}px) scaleX(${on})`;
    h.style.opacity = on > 0 ? (1 - up) * .88 : 0;
  });
  sls.forEach((el, k) => {
    const i = Math.floor(k / 2), up = seg(t, 3.6 + i * .08, 3.85 + i * .08, p2in);
    el.style.transform = `translateY(${-16 * up}px)`; el.style.opacity = 1 - up;
  });
  $('a2').style.width = lerp(30, TOTAL, close) * PX + 'px';
  setText($('tcE'), fmt(lerp(30, TOTAL, close)));

  // cenas arrastadas do projeto para a linha do tempo
  binEls.forEach((el, i) => el.classList.toggle('sel', SLOT.some(c => c.bin === i && t >= c.go[0] - .05 && t < c.go[1] + .1)));
  SLOT.forEach((c, i) => {
    const el = ghosts[i], [a, b] = c.go, on = t >= a;
    show(el, on && t < 14.2);
    if (!on) return;
    const e = seg(t, a, b, p3io), W = (c.e - c.s) * PX, X = TLX + sx(c.s), Y2 = TLY + Y.V2;
    const land = t >= b ? 1 + .08 * Math.exp(-(t - b) * 9) * Math.cos((t - b) * 20) : 1;
    el.style.left = lerp(c.th[0], X, e) + 'px'; el.style.top = lerp(c.th[1], Y2, e) + 'px';
    el.style.width = lerp(214, W, e) + 'px'; el.style.height = lerp(112, 54, e) + 'px';
    el.style.transform = `scale(${land}) rotate(${Math.sin(Math.PI * e) * -2}deg)`;
    el.style.boxShadow = `0 ${14 * Math.sin(Math.PI * e)}px ${26 * Math.sin(Math.PI * e)}px rgba(0,0,0,.65)`;
  });
  v3s.forEach((el, i) => { const e = seg(t, 7.25 + i * .05, 7.55 + i * .05); el.style.opacity = e > 0 ? 1 : 0; el.style.transform = `scale(${lerp(.8, 1, backOut(e))})`; });

  // monitor: cena por cima quando a agulha passa por ela
  const ph = phAt(t), tc = fmt(ph);
  $('ph').style.left = sx(ph) + 'px';
  setText($('tc2'), tc);
  setText($('pCtrl').querySelector('.tc'), tc);
  const roll = t < CUT ? SLOT.find(c => t >= c.go[1] && ph >= c.s && ph < c.e) : null;
  show($('pRoll'), !!roll);
  if (roll) { if (roll.loop != null) { show(rollC, true); $('pRoll').style.backgroundImage = 'none'; rollC.getContext('2d').drawImage(LOOPS[roll.loop].cv, 0, 0); } else { show(rollC, false); $('pRoll').style.backgroundImage = roll.bg; } }

  // legenda e nome
  show($('pCap'), t >= CUT);
  capture(pW, t, 7.2, 8.15);
  show($('pSp'), t >= CUT);
  show($('pLow'), t >= 10.95);
  lowState(lowEls[0], t, 10.95);

  // cor: temperatura e saturação sobem no arraste; depois o antes e depois
  const eT = seg(t, 8.7, 9.25, p3io), eS = seg(t, 9.42, 9.72, p3io);
  setText($('vT'), (32 * eT).toFixed(1).replace('.', ',')); setText($('vS'), (18 * eS).toFixed(1).replace('.', ','));
  $('uT').style.left = lerp(45, 72, eT) + '%'; $('uS').style.left = lerp(45, 58, eS) + '%';
  const wIn = seg(t, 9.95, 10.3, p3io), wOut = seg(t, 10.55, 10.85, p3io), wx = (wIn - wOut) * 1240;
  const pw = $('pWarm'); pw.style.opacity = eT; pw.style.clipPath = wx > 0 ? `inset(0 0 0 ${wx}px)` : '';
  const wipeOn = wx > 1; show($('pWipe'), wipeOn); show($('tA'), wipeOn); show($('tD'), wipeOn); $('pWipe').style.left = wx + 'px';

  // exportar
  const exp = seg(t, 13, 14.1);
  const exOn = t >= 12.7; show($('pCtrl'), !exOn); show($('pExp'), exOn);
  $('eBar').style.width = exp * 100 + '%'; setText($('ePct'), Math.round(exp * 100) + '%');

  // anel de foco desliza até o painel em uso
  const F = [[0, 'ai'], [2.0, 'tl'], [CUT, 'prog'], [8.3, 'src'], [10.85, 'prog'], [12.6, 'ai']];
  let R = RECT.ai;
  for (let i = 1; i < F.length; i++) { const [T, id] = F[i]; if (t >= T) { const e = T === CUT ? 1 : seg(t, T, T + .45, p3io); R = RECT[id].map((v, k) => lerp(RECT[F[i - 1][1]][k], v, e)); } }
  const fo = $('focus'); fo.style.left = R[0] + 'px'; fo.style.top = R[1] + 'px'; fo.style.width = R[2] + 'px'; fo.style.height = R[3] + 'px';
  fo.style.opacity = seg(t, 1.2, 1.5) * (1 - seg(t, 14.05, 14.2));

  // cursor, clique e faísca: nunca teleportam, e a escala compensa a câmera
  const cu = $('cur'), ta = $('tag'), ri = $('ring'), sp = $('spark'), vis = t >= 1.2 && t < 14.1;
  show(cu, vis); show(ta, vis);
  const [cx, cy] = curAt(t), k = Math.pow(s, -.35);
  let dip = 1, ringT = -1, rp = [0, 0];
  for (const c of CLICKS) if (t >= c) { ringT = t - c; rp = curAt(c); if (t < c + .2) dip = 1 - .16 * Math.sin(Math.PI * (t - c) / .2); }
  cu.style.left = cx + 'px'; cu.style.top = cy + 'px'; cu.style.transform = `translate(${-4 * k}px,${-4 * k}px) scale(${k * dip})`;
  ta.style.left = cx + 24 * k + 'px'; ta.style.top = cy + 42 * k + 'px'; ta.style.transform = `scale(${k})`;
  const rOn = ringT >= 0 && ringT < .45; show(ri, rOn);
  if (rOn) { const e = ringT / .45; ri.style.left = rp[0] - 22 + 'px'; ri.style.top = rp[1] - 22 + 'px'; ri.style.transform = `scale(${k * lerp(1, 1.7, e)})`; ri.style.opacity = .85 * (1 - e); }
  const spOn = t >= 2.35 && t < CUT; show(sp, spOn);
  if (spOn) { const [a, b, q] = sparkAt(t); sp.style.left = a - MW / 2 + 'px'; sp.style.top = b - MH + 'px'; sp.style.transform = `scale(${k * (1 + q)},${k * (1 - q)})`; sp.style.opacity = seg(t, 2.35, 2.5); }
  let landT = -1, landX = 0, landY = 0, landI = 0;
  HOPS.forEach(([T, X, Yb], i) => { if (i && t >= T) { landT = t - T; landX = X; landY = Yb; landI = i; } });
  const arcOn = spOn && landT >= 0 && landT < .35; show(arc, arcOn);
  if (arcOn) { const e = landT / .35; arc.style.left = landX - 40 + 'px'; arc.style.top = landY - 13 + 'px'; arc.style.transform = `scale(${lerp(.7, 1.5, e)})`; arc.style.opacity = .8 * (1 - e); }
  const rzOn = landI >= 1 && landI <= 3 && landT >= 0 && landT < .28 && t < 3.6; show(razor, rzOn);
  if (rzOn) { razor.style.left = landX - 1 + 'px'; razor.style.top = '852px'; razor.style.height = (TLY + Y.A1 + 54 - 852) + 'px'; razor.style.opacity = 1 - landT / .28; }

  // riscos de luz e tela cheia
  const se = seg(t, 14.3, 15);
  $('streaks').style.display = se > 0 && t < 15 ? '' : 'none';
  if (se > 0) ST.forEach(o => {
    const e = p2in(clamp(se - o.d, 0, 1)), r1 = o.r0 + e * 900, r2 = r1 + o.len * (.15 + e);
    o.l.setAttribute('x1', 960 + Math.cos(o.a) * r1); o.l.setAttribute('y1', 540 + Math.sin(o.a) * r1 * .68);
    o.l.setAttribute('x2', 960 + Math.cos(o.a) * r2); o.l.setAttribute('y2', 540 + Math.sin(o.a) * r2 * .68);
    o.l.setAttribute('opacity', o.o * clamp(e * 5));
  });
  const full = t >= 15; $('full').style.display = full ? 'block' : 'none'; // o CSS começa escondido
  if (full) {
    $('fScr').style.transformOrigin = '50% 50%';
    $('fScr').style.transform = `scale(${lerp(1, 1.05, seg(t, 15, 18, p1io))})`;
    capture(fW, t, 15.35, 17.1);
    lowState(lowEls[1], t, 15.6);
    $('flash').style.opacity = .8 * (1 - seg(t, 15, 15.5));
  }
}
const p = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(p, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(p.t) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
render(0);
