// motor.js — um relógio só. render(t) monta o quadro inteiro a partir do tempo.
// Céu, nuvens, sol, lua e água saem de um shader (pixel a pixel); as silhuetas vêm das texturas de cena.js.
const DUR = 30, W = 1920, H = 1080, CAMH = 2.5;
const RAD = Math.PI / 180;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sine = x => 0.5 - 0.5 * Math.cos(Math.PI * cl(x));
const seg = (t, a, b, f = sine) => f(cl((t - a) / (b - a)));
const dirOf = (az, el) => [Math.sin(az * RAD) * Math.cos(el * RAD), Math.sin(el * RAD), Math.cos(az * RAD) * Math.cos(el * RAD)];
const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };

// ───────── a câmera: barco parado, um giro de 116° em duas ondas, depois a aproximação lenta ─────────
const YAW_H = 116;
function camAt(t) {
  const p1 = seg(t, 10.8, 13.6), p2 = seg(t, 14.4, 19.4, x => sine(Math.pow(x, 1.25)));
  const yaw = 46 * p1 + 70 * p2;
  const fov = 60 - 3 * seg(t, 10.4, 16) - 3 * seg(t, 15, 19.9) - 5 * seg(t, 19.9, 29);
  const hor = 0.655 - 0.08 * seg(t, 10.6, 15.2) + 0.07 * seg(t, 15.2, 19.9) - 0.005 * seg(t, 19.9, 29);
  const tanH = Math.tan(fov / 2 * RAD), tanV = tanH * H / W;
  const pitch = Math.atan((2 * hor - 1) * tanV), roll = 0;   // câmera firme, como na referência: o balanço arrasta a textura da água
  const cy = Math.cos(yaw * RAD), sy = Math.sin(yaw * RAD), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const F = [sy * cp, sp, cy * cp], R = [cy, 0, -sy];
  const U = [F[1] * R[2] - F[2] * R[1], F[2] * R[0] - F[0] * R[2], F[0] * R[1] - F[1] * R[0]];
  return { yaw, fov, pitch, roll, tanH, tanV, F, R, U };
}
// direção do mundo → pixel da tela (o inverso exato do raio do shader)
function proj(c, d) {
  const x = d[0] * c.R[0] + d[1] * c.R[1] + d[2] * c.R[2], y = d[0] * c.U[0] + d[1] * c.U[1] + d[2] * c.U[2], z = d[0] * c.F[0] + d[1] * c.F[1] + d[2] * c.F[2];
  if (z <= 0.02) return null;
  const vx = x / z, vy = y / z, cr = Math.cos(c.roll), sr = Math.sin(c.roll);
  const ux = cr * vx + sr * vy, uy = -sr * vx + cr * vy;
  return [(ux / c.tanH + 1) / 2 * W, (1 - uy / c.tanV) / 2 * H, z];
}

// ───────── a paleta do céu ao longo do tempo: pôr do sol → depois do sol → crepúsculo rosa → noite ─────────
const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const KEYS = ['zen', 'mid', 'hor', 'glow', 'glowK', 'belt', 'beltK', 'cLit', 'cDark', 'cloud', 'wispC', 'wispK', 'water', 'silNear', 'amb', 'moonC'];
const PAL = [
  [0.0,  '#a07ccc', '#e08fba', '#f4b39c', '#ffb894', 1.0,  '#e597c0', 0.0,  '#fdbf98', '#eea0b4', 0.74,  '#e0a8c8', 0.0,  '#9c5f74', '#4e2a3b', '#ffffff', '#f3ddb0'],
  [10.4, '#a07ccc', '#e08fba', '#f4b39c', '#ffb894', 0.95, '#e597c0', 0.0,  '#fdbf98', '#eea0b4', 0.74, '#e0a8c8', 0.0,  '#9c5f74', '#4e2a3b', '#ffffff', '#f3ddb0'],
  [15.0, '#4b4aa0', '#8c70c2', '#cb92c5', '#f2a3ae', 0.3,  '#df90c3', 0.25, '#f591b6', '#a173c0', 0.75, '#c0a0d0', 0.0,  '#40356a', '#2c2443', '#e9dcf2', '#f3ddb0'],
  [19.9, '#6f56a8', '#d083bf', '#9a7cc2', '#f0a2b2', 0.06, '#e690c6', 0.9,  '#d891c8', '#a37bb9', 0.0,  '#b898cf', 0.3,  '#3c3060', '#2a2441', '#f3e7f5', '#f3dcae'],
  [22.2, '#40387f', '#7e5aa5', '#62579f', '#f0a2b2', 0.0,  '#a876b8', 0.5,  '#d891c8', '#a37bb9', 0.0,  '#8d7fbf', 0.38, '#262249', '#1d1a33', '#a79cc8', '#f5e8c8'],
  [24.8, '#1b1c4a', '#28296a', '#3a3778', '#f0a2b2', 0.0,  '#3a3778', 0.0,  '#d891c8', '#a37bb9', 0.0,  '#7c79b6', 0.45, '#121230', '#121226', '#4a4c80', '#f6efd8'],
  [30.0, '#1b1c4a', '#28296a', '#3a3778', '#f0a2b2', 0.0,  '#3a3778', 0.0,  '#d891c8', '#a37bb9', 0.0,  '#7c79b6', 0.45, '#121230', '#121226', '#4a4c80', '#f6efd8'],
].map(row => [row[0], ...row.slice(1).map(v => typeof v === 'string' ? hex(v) : v)]);
function palAt(t) {
  let i = 0; while (i < PAL.length - 2 && t >= PAL[i + 1][0]) i++;
  const a = PAL[i], b = PAL[i + 1], k = sine((t - a[0]) / (b[0] - a[0])), o = {};
  KEYS.forEach((key, j) => { const x = a[j + 1], y = b[j + 1]; o[key] = Array.isArray(x) ? x.map((v, n) => lerp(v, y[n], k)) : lerp(x, y, k); });
  return o;
}

// ───────── WebGL2 ─────────
const VS = `#version 300 es
void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
const FS = `#version 300 es
precision highp float;
precision highp int;
out vec4 frag;
uniform vec2 uRes; uniform float uT;
uniform vec3 uF, uR, uU; uniform vec2 uTan; uniform float uRoll;
uniform vec3 uZen, uMid, uHor, uGlow, uBelt, uCLit, uCDark, uWispC, uWater, uSilNear, uAmb, uMoonC;
uniform float uGlowK, uBeltK, uCloud, uWispK, uLight, uMoonK, uSunK, uTorchK;
uniform vec3 uSun, uMoon, uTorch;
uniform sampler2D tA, tDay, tNight, tAux;
uniform vec4 uA, uH;
const float R2D = 57.2957795;
const float CAMH = ${CAMH.toFixed(2)};

uint hsh(uvec2 v) { v = v * 1664525u + 1013904223u; v.x += v.y * 1664525u; v.y += v.x * 1664525u; v ^= v >> 16u; v.x += v.y * 1664525u; v.y += v.x * 1664525u; v ^= v >> 16u; return v.x; }
float h2(vec2 p) { return float(hsh(uvec2(ivec2(p) + 65536))) * (1.0 / 4294967295.0); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p, int oct) { float a = 0.5, s = 0.0; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++) { if (i >= oct) break; s += a * vnoise(p); p = m * p + 3.1; a *= 0.5; } return s; }
float angDeg(vec3 a, vec3 b) { return atan(length(cross(a, b)), dot(a, b)) * R2D; }

// céu: degradê por altura, o cinturão rosa do lado oposto ao sol, o brilho do sol
vec3 skyBase(vec3 d) {
  float e = max(d.y, 0.0);
  vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.2, e));
  c = mix(c, uZen, smoothstep(0.16, 0.62, e));
  vec2 sh = normalize(uSun.xz + vec2(1e-6)), dh = normalize(d.xz + vec2(1e-6));
  float anti = -dot(sh, dh);
  float belt = smoothstep(0.02, 0.1, e) * (1.0 - smoothstep(0.14, 0.34, e)) * smoothstep(-0.4, 0.6, anti);
  c = mix(c, uBelt, uBeltK * belt);
  float cs = max(dot(d, uSun), 0.0), low = 1.0 - smoothstep(0.0, 0.5, e);
  c += uGlow * uGlowK * (0.15 * pow(cs, 4.0) * low + 0.06 * pow(cs, 40.0) + 0.05 * pow(cs, 900.0));
  return c;
}
vec3 addDiscs(vec3 d, vec3 c) {
  float as = angDeg(d, uSun);
  c = mix(c, vec3(1.0, 0.985, 0.93), uSunK * (1.0 - smoothstep(0.88, 0.94, as)));
  if (uMoonK > 0.001) {
    float am = angDeg(d, uMoon);
    c += uMoonC * uMoonK * (0.2 * exp(-am / 2.0) + 0.1 * exp(-am / 7.0));
    if (am < 1.5) {
      vec3 mr = normalize(cross(vec3(0.0, 1.0, 0.0), uMoon)), mu = cross(uMoon, mr);
      vec2 lp = vec2(dot(d, mr), dot(d, mu)) / tan(1.35 / R2D);
      float mar = smoothstep(0.5, 0.56, fbm(lp * 2.2 + 4.0, 4)) * 0.6 + smoothstep(0.62, 0.66, fbm(lp * 5.0 + 1.0, 3)) * 0.3;
      float rr = length(lp);
      vec3 mc = uMoonC * mix(1.0, 0.84, mar) * (1.0 - 0.12 * rr * rr);
      c = mix(c, mc, (1.0 - smoothstep(0.965, 1.02, rr)) * uMoonK);
    }
  }
  return c;
}
// nuvens em escama: ruído torcido num plano do céu, com bordas em faixas
vec4 clouds(vec3 d, int oct) {
  if (uCloud <= 0.001 || d.y < 0.003) return vec4(0.0);
  vec2 p = d.xz / d.y * 2.1 + vec2(0.022, 0.008) * uT;
  vec2 q = vec2(p.x * 0.6 + p.y * 0.15, p.y * 1.5 - p.x * 0.15);
  vec2 w = vec2(fbm(q * 0.7 + vec2(11.0, 3.0), oct), fbm(q * 0.7 + vec2(23.0, 9.0), oct));
  float n = fbm(q * 1.5 + w * 2.4, oct) + 0.05 * sin((q.x * 0.5 + q.y * 2.6) * 5.0 + w.y * 9.0);
  float th = mix(0.74, 0.44, uCloud);
  float aa = 0.018 + 0.09 * (1.0 - smoothstep(0.0, 0.25, d.y));
  float m = smoothstep(th, th + aa, n), hi = smoothstep(th + 0.045, th + 0.045 + aa, n);
  vec3 col = mix(uCDark, uCLit, hi) + uGlow * uGlowK * 0.3 * pow(max(dot(d, uSun), 0.0), 6.0);
  return vec4(col, m * smoothstep(0.018, 0.14, d.y) * smoothstep(0.0, 0.25, uCloud));
}
// fiapos finos do crepúsculo e da noite
vec4 wisps(vec3 d) {
  if (uWispK <= 0.001 || d.y < 0.003) return vec4(0.0);
  vec2 p = d.xz / d.y * 1.3 + vec2(0.012, 0.0) * uT;
  vec2 q = vec2(dot(p, vec2(-0.438, -0.899)) * 0.45, dot(p, vec2(0.899, -0.438)) * 1.3);
  float n = fbm(q + 1.6 * vec2(fbm(q * 0.7 + 5.0, 3), fbm(q * 0.7 + 9.0, 3)), 4);
  float m = smoothstep(0.64, 0.7, n) * (1.0 - 0.6 * smoothstep(0.74, 0.8, n));
  return vec4(uWispC, m * smoothstep(0.03, 0.16, d.y) * uWispK);
}
vec3 skyAll(vec3 d, int oct) {
  vec3 c = addDiscs(d, skyBase(d));
  vec4 w = wisps(d); c = mix(c, w.rgb, w.a);
  vec4 k = clouds(d, oct); c = mix(c, k.rgb, k.a);
  return c;
}
// silhuetas: azimute e elevação viram coordenada da textura
vec2 azs(vec3 d) { return vec2(atan(d.x, d.z) * R2D, d.y / max(length(d.xz), 1e-5) * R2D); }
vec3 hazeCol(float az) { float a = az / R2D; return skyBase(normalize(vec3(sin(a), 0.035, cos(a)))); }
vec2 uvOf(vec2 a, vec4 B) { return vec2((a.x - B.x) / (B.y - B.x), (B.w - a.y) / (B.w - B.z)); }
float inside(vec2 uv) { return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0); }
vec4 silA(vec2 a, float lod) {
  vec2 uv = uvOf(a, uA);
  vec4 s = (lod < 0.0 ? texture(tA, uv) : textureLod(tA, uv, lod)) * inside(uv);
  float hz = clamp(s.r / max(s.a, 0.004), 0.0, 1.0);
  return vec4(mix(uSilNear, hazeCol(a.x), hz * 0.96) * s.a, s.a);
}
vec4 silH(vec2 a, float lod) {
  vec2 uv = uvOf(a, uH);
  float ins = inside(uv);
  vec4 dy = (lod < 0.0 ? texture(tDay, uv) : textureLod(tDay, uv, lod)) * ins;
  vec3 nt = (lod < 0.0 ? texture(tNight, uv) : textureLod(tNight, uv, lod)).rgb * ins;
  vec4 ax = lod < 0.0 ? texture(tAux, uv) : textureLod(tAux, uv, lod);
  float hz = clamp(ax.g / max(dy.a, 0.004), 0.0, 1.0);
  vec3 c = mix(dy.rgb * uAmb, hazeCol(a.x) * dy.a, clamp(hz * 0.9, 0.0, 1.0));
  float on = smoothstep(ax.r - 0.035, ax.r, uLight);
  vec3 e = nt * (1.0 - 0.45 * hz);
  float wl = on * clamp(max(e.r, max(e.g, e.b)) * 1.6, 0.0, 1.0);
  return vec4(mix(c, e, wl), dy.a);
}
vec4 silAll(vec3 d, float lod) { vec2 a = azs(d); vec4 s = silA(a, lod); vec4 h = silH(a, lod); return s + h * (1.0 - s.a); }
// halo das luzes acesas e da tocha
vec3 bloom(vec3 d) {
  vec2 a = azs(d), uv = uvOf(a, uH);
  float ins = smoothstep(-0.05, 0.0, uv.x) * smoothstep(1.05, 1.0, uv.x) * smoothstep(-0.4, 0.0, uv.y) * smoothstep(1.3, 1.0, uv.y);
  vec2 uc = clamp(uv, 0.0, 1.0);
  float kEst = 0.06 + 0.8 * clamp(a.y / 8.5, 0.0, 1.0);
  float on = smoothstep(kEst - 0.12, kEst + 0.08, uLight);
  vec3 g = textureLod(tNight, uc, 4.0).rgb * 0.26 + textureLod(tNight, uc, 6.0).rgb * 0.3;
  float at = angDeg(d, uTorch);
  vec3 tg = vec3(1.0, 0.78, 0.42) * uTorchK * (1.0 * exp(-at * at / 0.07) + 0.3 * exp(-at / 1.0));
  return g * on * ins + tg;
}
// água: nove ondas somadas mexem a normal; o reflexo pega céu, silhuetas e luzes
vec3 waterCol(vec3 d) {
  float dist = CAMH / max(-d.y, 1e-4);
  vec2 p = d.xz * dist;
  float pa = 2.0 * uTan.y / uRes.y, fp = dist * pa * sqrt(dist / CAMH);
  vec2 g = vec2(0.0);
  for (int i = 0; i < 9; i++) {
    float fi = float(i), L = 4.2 * pow(0.72, fi), k = 6.28318 / L, an = 0.6 + fi * 2.39996;
    vec2 dir = vec2(cos(an), sin(an));
    float att = exp(-pow(k * fp * 0.9, 2.0));
    g += dir * (0.065 * mix(1.0, 0.22, fi / 8.0) * cos(dot(dir, p) * k - sqrt(9.81 * k) * uT * 0.2 + fi * 1.7)) * att;
  }
  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 r = reflect(d, n); r.y = max(abs(r.y), 0.0015); r = normalize(r);
  vec3 refl = skyAll(r, 4);
  vec4 s = silAll(r, clamp(1.0 + log2(1.0 + fp), 1.0, 4.0));
  refl = refl * (1.0 - s.a) + s.rgb + bloom(r) * 1.3;
  float fres = 0.38 + 0.62 * pow(1.0 - clamp(dot(-d, n), 0.0, 1.0), 3.0);
  vec3 c = mix(uWater, refl, fres);
  float ss = max(dot(r, uSun), 0.0), ms = max(dot(r, uMoon), 0.0);
  c += vec3(1.0, 0.88, 0.68) * uSunK * (pow(ss, 3000.0) * 3.0 + pow(ss, 260.0) * 0.35);
  c += uMoonC * uMoonK * (pow(ms, 3500.0) * 2.5 + pow(ms, 300.0) * 0.2);
  return c;
}
vec3 rayAt(vec2 fc) {
  vec2 q = fc / uRes * 2.0 - 1.0;
  vec2 v = vec2(q.x * uTan.x, q.y * uTan.y);
  float cr = cos(uRoll), sr = sin(uRoll);
  v = vec2(cr * v.x - sr * v.y, sr * v.x + cr * v.y);
  return normalize(uF + v.x * uR + v.y * uU);
}
void main() {
  vec3 d = rayAt(gl_FragCoord.xy);
  vec4 s = silAll(d, -1.0);
  vec3 c;
  if (d.y > 0.0) c = skyAll(d, 5);
  else {  // água com 4 amostras por pixel: sem o serrilhado que pisca
    c = vec3(0.0);
    for (int i = 0; i < 4; i++) { vec2 o = vec2(float(i & 1), float(i >> 1)) * 0.5 - 0.25; vec3 di = rayAt(gl_FragCoord.xy + o); c += waterCol(vec3(di.x, min(di.y, -1e-4), di.z)); }
    c *= 0.25;
  }
  c = c * (1.0 - s.a) + s.rgb + bloom(d);
  vec2 vq = gl_FragCoord.xy / uRes - 0.5;
  c *= 1.0 - 0.3 * pow(clamp(length(vq * vec2(1.0, 0.85)) * 1.3, 0.0, 1.0), 2.4);
  c += (h2(floor(gl_FragCoord.xy)) - 0.5) / 255.0;
  frag = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

const glc = document.getElementById('gl');
const gl = glc.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false, alpha: false });
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
const prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog); gl.bindVertexArray(gl.createVertexArray());
const LOC = {}; const u = n => LOC[n] ?? (LOC[n] = gl.getUniformLocation(prog, n));

function upload(unit, data, w, h, name) {
  const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u(name), unit);
}
const pixels = cv => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
function premul(d) { for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; d[i] = Math.round(d[i] * a); d[i + 1] = Math.round(d[i + 1] * a); d[i + 2] = Math.round(d[i + 2] * a); } return new Uint8Array(d.buffer); }
const PA = cenaA(), PH = cenaH();
upload(0, premul(pixels(PA.cv.day)), PA.W, PA.H, 'tA');
upload(1, premul(pixels(PH.cv.day)), PH.W, PH.H, 'tDay');
upload(2, new Uint8Array(pixels(PH.cv.night).buffer), PH.W, PH.H, 'tNight');
{ const k = pixels(PH.cv.key), z = pixels(PH.cv.haze), a = new Uint8Array(k.length);
  for (let i = 0; i < k.length; i += 4) { a[i] = k[i]; a[i + 1] = z[i]; a[i + 3] = 255; }
  upload(3, a, PH.W, PH.H, 'tAux'); }
const BOX = P => [P.az0, P.az1, P.s0, P.s1];
const tochaDir = norm([Math.sin(TOCHA[0] * RAD), TOCHA[1] * RAD, Math.cos(TOCHA[0] * RAD)]);

// ───────── a camada de cima: gaivota, boias e a balsa (com reflexo) ─────────
const ov = document.getElementById('ov').getContext('2d');
const veu = document.getElementById('veu');
const rgb = (c, k = 1, a = 1) => `rgba(${Math.round(cl(c[0] * k) * 255)},${Math.round(cl(c[1] * k) * 255)},${Math.round(cl(c[2] * k) * 255)},${a})`;
const tint = (h, amb) => { const c = hex(h); return [c[0] * amb[0], c[1] * amb[1], c[2] * amb[2]]; };

function gaivota(t, c) {
  if (t < 4.0 || t > 11.6) return;
  const k = (t - 4.2) / 7, az = 15 - 29 * k, el = 2.55 + 0.25 * Math.sin((t - 4.2) * 0.9);
  const p = proj(c, dirOf(az, el)); if (!p) return;
  const s = (W / 2 / c.tanH) * Math.tan(0.55 * RAD) / p[2];
  const f = ((t - 4.2) / 2.4) % 1, glide = cl((f - 0.5) / 0.1) - cl((f - 0.92) / 0.08);
  const fl = lerp(Math.sin(t * 2 * Math.PI * 2.6), 0.28, glide);
  ov.save(); ov.translate(p[0], p[1]); ov.rotate(-0.04 + 0.05 * Math.sin(t * 0.8)); ov.scale(s, s);
  ov.strokeStyle = ov.fillStyle = 'rgba(58,32,48,.92)'; ov.lineCap = 'round'; ov.lineJoin = 'round'; ov.lineWidth = 0.13;
  const wy = -fl * 0.55, tip = -fl * 0.9;
  for (const sd of [-1, 1]) { ov.beginPath(); ov.moveTo(0, 0); ov.quadraticCurveTo(sd * 0.45, wy - 0.25, sd * 0.62, wy * 0.6); ov.quadraticCurveTo(sd * 0.8, tip * 0.7 + 0.05, sd * 1.0, tip + 0.18); ov.stroke(); }
  ov.beginPath(); ov.ellipse(0, 0.04, 0.2, 0.07, 0, 0, Math.PI * 2); ov.fill();
  ov.restore();
}

// boias de canal: vermelha e verde, piscando quando a noite chega
const BOIAS = [[104.6, 165, [0.55, 0.2, 0.22], [1, 0.36, 0.3], 0.0, 2.6], [111.8, 300, [0.16, 0.4, 0.32], [0.4, 1, 0.62], 1.1, 3.2],
               [122.4, 200, [0.16, 0.4, 0.32], [0.4, 1, 0.62], 2.0, 2.9], [127.6, 420, [0.55, 0.2, 0.22], [1, 0.36, 0.3], 0.6, 3.6]];
function boias(t, c, P) {
  const f = W / 2 / c.tanH;
  for (const [az, D, body, lamp, ph, per] of BOIAS) {
    const bob = 0.12 * Math.sin(t * 1.7 + ph * 3), base = [Math.sin(az * RAD) * D, -CAMH + bob, Math.cos(az * RAD) * D];
    const p = proj(c, norm(base)); if (!p || p[0] < -60 || p[0] > W + 60) continue;
    const m = f / (D * p[2]), hgt = 2.3 * m, wd = 0.9 * m, x = p[0], y = p[1];
    const col = [body[0] * P.amb[0], body[1] * P.amb[1], body[2] * P.amb[2]];
    // reflexo escuro e o corpo
    ov.fillStyle = rgb(col, 0.55, 0.5); ov.fillRect(x - wd * 0.5, y, wd, hgt * 0.5);
    ov.fillStyle = rgb(col); ov.beginPath(); ov.moveTo(x - wd * 0.5, y); ov.lineTo(x - wd * 0.45, y - hgt * 0.62); ov.lineTo(x, y - hgt); ov.lineTo(x + wd * 0.45, y - hgt * 0.62); ov.lineTo(x + wd * 0.5, y); ov.closePath(); ov.fill();
    ov.fillStyle = rgb(col, 0.6); ov.fillRect(x + wd * 0.1, y - hgt * 0.62, wd * 0.4, hgt * 0.62);
    // a lâmpada pisca: 0,6 s acesa a cada período
    const on = t > 22.3 + ph ? cl(1 - Math.abs(((t - 22.3 - ph) % per) - 0.3) / 0.3 * 0.999) : 0;
    const lit = on > 0 ? Math.min(1, on * 3) : 0;
    if (lit > 0) {
      const ly = y - hgt * 1.08, R = cl(1.7 * m, 5, 13);
      let gr = ov.createRadialGradient(x, ly, 0, x, ly, R); gr.addColorStop(0, rgb(lamp, 1, 0.95 * lit)); gr.addColorStop(0.25, rgb(lamp, 1, 0.45 * lit)); gr.addColorStop(1, rgb(lamp, 1, 0));
      ov.fillStyle = gr; ov.fillRect(x - R, ly - R, 2 * R, 2 * R);
      ov.save(); ov.translate(x, y + hgt * 0.9); ov.scale(1, 3.2);
      gr = ov.createRadialGradient(0, 0, 0, 0, 0, R * 0.7); gr.addColorStop(0, rgb(lamp, 1, 0.5 * lit)); gr.addColorStop(1, rgb(lamp, 1, 0));
      ov.fillStyle = gr; ov.fillRect(-R, -R, 2 * R, 2 * R); ov.restore();
    }
  }
}

// a balsa laranja de Staten Island, que cruza ao fundo depois que a cidade acende
const balsa = document.createElement('canvas'); balsa.width = 400; balsa.height = 80;
function desenhaBalsa(P, lights) {
  const g = balsa.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 400, 80);
  g.setTransform(4, 0, 0, -4, 200, 76);            // metros: x de -50 a 50, y de 0 a 19, com o nível da água em 0
  const lar = tint('#d9672e', P.amb), bra = tint('#d8d4cc', P.amb), esc = tint('#3a3040', P.amb);
  g.fillStyle = rgb(lar); g.beginPath(); g.moveTo(-47, 0.2); g.lineTo(47, 0.2); g.lineTo(48.5, 4.8); g.lineTo(-48.5, 4.8); g.closePath(); g.fill();
  g.fillStyle = rgb(bra); g.fillRect(-48, 4.8, 96, 0.8); g.fillRect(-41, 9.6, 82, 0.7);
  g.fillStyle = rgb(lar); g.fillRect(-41, 5.6, 82, 4.0); g.fillRect(-33, 10.3, 66, 3.4);
  g.fillStyle = rgb(bra); g.fillRect(-35, 13.7, 9, 3.0); g.fillRect(26, 13.7, 9, 3.0); g.fillRect(-1.5, 13.7, 3, 2); g.fillRect(-0.3, 15.7, 0.6, 3.5);
  const win = lights ? 'rgba(255,214,150,1)' : rgb(esc);
  g.fillStyle = win;
  for (let x = -39; x < 39; x += 2.4) g.fillRect(x, 6.6, 1.5, 1.9);
  for (let x = -31; x < 31; x += 2.4) g.fillRect(x, 11.2, 1.5, 1.6);
  for (const x0 of [-34, 27]) for (let k = 0; k < 3; k++) g.fillRect(x0 + k * 2.6, 14.6, 1.8, 1.3);
  if (lights) { g.fillStyle = 'rgba(255,240,205,1)'; for (let x = -46; x < 47; x += 3.1) g.fillRect(x, 4.9, 0.7, 0.6); g.fillRect(-0.4, 18.6, 0.8, 0.8); }
}
function ferry(t, c, P) {
  if (t < 21.8) return;
  const az = 143.5 - 1.15 * (t - 22), D = 1500;
  const p = proj(c, norm([Math.sin(az * RAD) * D, -CAMH, Math.cos(az * RAD) * D])); if (!p || p[0] > W + 200) return;
  const m = (W / 2 / c.tanH) / (D * p[2]);
  desenhaBalsa(P, t > 22.6);
  const bw = 100 * m, bh = 20 * m, x = p[0] - bw / 2, y = p[1];
  ov.drawImage(balsa, 0, 0, 400, 80, x, y - bh, bw, bh);
  // reflexo em fatias que tremem
  const rows = Math.ceil(bh);
  for (let i = 0; i < rows; i++) {
    const sy = 76 - (i + 0.5) / bh * 80, dx = 1.6 * Math.sin(i * 1.3 + t * 3.1) + 0.8 * Math.sin(i * 0.47 - t * 2.3);
    ov.globalAlpha = 0.42 * (1 - i / rows * 0.6);
    ov.drawImage(balsa, 0, Math.max(0, sy - 2), 400, 4, x + dx, y + i * 1.15, bw, 1.3);
  }
  ov.globalAlpha = 1;
}

function render(t) {
  const c = camAt(t), P = palAt(t);
  gl.viewport(0, 0, W, H);
  gl.uniform2f(u('uRes'), W, H); gl.uniform1f(u('uT'), t);
  gl.uniform3fv(u('uF'), c.F); gl.uniform3fv(u('uR'), c.R); gl.uniform3fv(u('uU'), c.U);
  gl.uniform2f(u('uTan'), c.tanH, c.tanV); gl.uniform1f(u('uRoll'), c.roll);
  for (const [k, n] of [['zen', 'uZen'], ['mid', 'uMid'], ['hor', 'uHor'], ['glow', 'uGlow'], ['belt', 'uBelt'], ['cLit', 'uCLit'], ['cDark', 'uCDark'], ['wispC', 'uWispC'], ['water', 'uWater'], ['silNear', 'uSilNear'], ['amb', 'uAmb'], ['moonC', 'uMoonC']]) gl.uniform3fv(u(n), P[k]);
  for (const [k, n] of [['glowK', 'uGlowK'], ['beltK', 'uBeltK'], ['cloud', 'uCloud'], ['wispK', 'uWispK']]) gl.uniform1f(u(n), P[k]);
  const sunEl = t < 10.4 ? lerp(2.05, 1.45, t / 10.4) : lerp(1.45, -1.6, cl((t - 10.4) / 5.6));
  gl.uniform3fv(u('uSun'), dirOf(2.5, sunEl)); gl.uniform1f(u('uSunK'), 1 - seg(t, 12.5, 15.5));
  gl.uniform3fv(u('uMoon'), dirOf(129.5 + 0.06 * (t - 19.5), 1.6 + (t - 19.5) * 0.58)); gl.uniform1f(u('uMoonK'), seg(t, 18.2, 19.2));
  gl.uniform1f(u('uLight'), 1.08 * seg(t, 20.2, 23.4));
  gl.uniform3fv(u('uTorch'), tochaDir); gl.uniform1f(u('uTorchK'), seg(t, 23.0, 23.6) * (1 + 0.06 * Math.sin(t * 13) + 0.04 * Math.sin(t * 23.7)));
  gl.uniform4fv(u('uA'), BOX(PA)); gl.uniform4fv(u('uH'), BOX(PH));
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  ov.setTransform(1, 0, 0, 1, 0, 0); ov.clearRect(0, 0, W, H);
  gaivota(t, c); ferry(t, c, P); boias(t, c, P);
  veu.style.opacity = String(cl(0.88 * (1 - seg(t, 0, 1.7)) + seg(t, 28.7, 30)));
}

const clock = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(clock, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => render(clock.t) }, 0);
window.__timelines = window.__timelines || {}; window.__timelines.main = tl;
window.__render = render;
render(0);
