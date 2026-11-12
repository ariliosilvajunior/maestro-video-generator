// A-29 Super Tucano: avião inteiro em geometria procedural. Nada de modelo 3D nem imagem.
// Eixos: +X nariz, +Y cima, +Z asa direita. Medidas em metros.

export function createPlane(THREE, U) {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  // ── Curvas ────────────────────────────────────────────────
  const cr = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  function smooth(st, k) {
    const out = [], keys = Object.keys(st[0]);
    for (let i = 0; i < st.length - 1; i++) {
      const p0 = st[Math.max(0, i - 1)], p1 = st[i], p2 = st[i + 1], p3 = st[Math.min(st.length - 1, i + 2)];
      for (let j = 0; j < k; j++) {
        const t = j / k, o = {};
        for (const key of keys) o[key] = cr(p0[key], p1[key], p2[key], p3[key], t);
        out.push(o);
      }
    }
    out.push({ ...st[st.length - 1] });
    return out;
  }

  // ── Malhas por anéis ──────────────────────────────────────
  // Une anéis fechados em uma malha e corrige o sentido dos triângulos pelo volume.
  function fromRings(rings, closed = true, capA = true, capB = true) {
    const pos = [], idx = [], n = rings.length, m = rings[0].length;
    for (const r of rings) for (const p of r) pos.push(p[0], p[1], p[2]);
    const wrap = closed ? m : m - 1;
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < wrap; j++) {
      const a = i * m + j, b = i * m + (j + 1) % m, c = (i + 1) * m + j, d = (i + 1) * m + (j + 1) % m;
      idx.push(a, b, c, b, d, c);
    }
    const cap = (ri) => {
      const c = [0, 0, 0];
      for (const p of rings[ri]) { c[0] += p[0] / m; c[1] += p[1] / m; c[2] += p[2] / m; }
      const ci = pos.length / 3; pos.push(c[0], c[1], c[2]);
      for (let j = 0; j < wrap; j++) idx.push(ci, ri * m + j, ri * m + (j + 1) % m);
    };
    if (capA) cap(0);
    if (capB) cap(n - 1);
    // sentido: volume assinado em torno do centroide
    let cx = 0, cy = 0, cz = 0; const nv = pos.length / 3;
    for (let i = 0; i < nv; i++) { cx += pos[i * 3]; cy += pos[i * 3 + 1]; cz += pos[i * 3 + 2]; }
    cx /= nv; cy /= nv; cz /= nv;
    let vol = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
      const ax = pos[a * 3] - cx, ay = pos[a * 3 + 1] - cy, az = pos[a * 3 + 2] - cz;
      const bx = pos[b * 3] - cx, by = pos[b * 3 + 1] - cy, bz = pos[b * 3 + 2] - cz;
      const qx = pos[c * 3] - cx, qy = pos[c * 3 + 1] - cy, qz = pos[c * 3 + 2] - cz;
      vol += ax * (by * qz - bz * qy) - ay * (bx * qz - bz * qx) + az * (bx * qy - by * qx);
    }
    if (vol < 0) for (let t = 0; t < idx.length; t += 3) { const s = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = s; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // Corpo elíptico ao longo de X.
  function loftX(stations, { k = 6, seg = 48, a0 = 0, a1 = Math.PI * 2, capA = true, capB = true } = {}) {
    const closed = Math.abs(a1 - a0 - Math.PI * 2) < 1e-4;
    const st = smooth(stations, k), rings = [];
    for (const s of st) {
      const r = [], cnt = closed ? seg : seg + 1;
      for (let j = 0; j < cnt; j++) {
        const a = a0 + (a1 - a0) * j / seg;
        r.push([s.x, s.y + s.ry * Math.sin(a), s.rz * Math.cos(a)]);
      }
      rings.push(r);
    }
    return fromRings(rings, closed, capA, capB);
  }

  // Perfil de asa ao longo da envergadura (Z) ou da altura (Y).
  const foil = (u) => 0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1015 * u ** 4;
  function wingLoft(stations, { axis = 'z', k = 5, n = 22 } = {}) {
    const st = smooth(stations, k), rings = [];
    for (const s of st) {
      const r = [];
      const pts = [];
      for (let i = n; i >= 0; i--) { const u = (i / n) ** 2; pts.push([u, foil(u) * s.t * 5]); }
      for (let i = 1; i < n; i++) { const u = (i / n) ** 2; pts.push([u, -foil(u) * s.t * 5]); }
      for (const [u, h] of pts) {
        const x = s.x - s.c * u, off = h * s.c;
        if (axis === 'z') r.push([x, s.y + off, s.s]);
        else r.push([x, s.s, s.y + off]); // deriva vertical: espessura em Z
      }
      rings.push(r);
    }
    return fromRings(rings, true, true, true);
  }

  // ── Materiais ─────────────────────────────────────────────
  const paintChunk = `
    uniform float uPaint, uWeather;
    varying vec3 vP; varying vec3 vN2; varying float vK;
    float gR, gM;
    float h3(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float vn(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
    float fbm(vec3 p){ return .55*vn(p)+.3*vn(p*2.03+7.)+.15*vn(p*4.1+13.); }
    const vec3 AZUL=vec3(.018,.085,.42), VERDE=vec3(.02,.33,.11), AMAR=vec3(.86,.58,.03);
    vec3 fumaca(vec3 P, vec3 N){
      vec3 c=AZUL;
      if(vK<.5){ float s=P.y+.09*P.x;
        c=mix(c,AMAR,smoothstep(.02,.0,abs(s+.12)-.075));
        c=mix(c,VERDE,smoothstep(.02,.0,abs(s+.34)-.1));
        c=mix(c,vec3(.72,.73,.74),smoothstep(-.42,-.47,s)); }
      if(vK>.5&&vK<1.5){ float s=P.x+abs(P.z)*.24;
        c=mix(c,AMAR,smoothstep(.02,.0,abs(s+.25)-.34));
        c=mix(c,VERDE,smoothstep(.02,.0,abs(s+.82)-.2)); }
      if(vK>1.5){ c=mix(c,VERDE,smoothstep(.75,.72,P.y)*step(abs(P.z),.5));
        c=mix(c,AMAR,smoothstep(.02,.0,abs(P.y-1.05)-.2)*step(abs(P.z),.5)); }
      return c;
    }
    vec3 operacional(vec3 P, vec3 N){
      float n=fbm(P*vec3(.42,.8,.42)+vec3(3.,1.,5.));
      vec3 up=vec3(.05,.1,.06), lo=vec3(.2,.23,.24);
      float lim=vK<.5?(-.08+(n-.5)*1.25):(vK<1.5?(-.2+(n-.5)*.0):(.0));
      float k=vK<.5?smoothstep(lim-.03,lim+.03,P.y):(vK<1.5?step(0.,N.y)*smoothstep(.42,.46,n+.1):smoothstep(.36,.4,n));
      return mix(lo,up,k);
    }
    void pintura(vec3 P, vec3 N, out vec3 col){
      float e=mix(7.,-8.,uPaint), k=smoothstep(e-.35,e+.35,P.x);
      col=mix(fumaca(P,N),operacional(P,N),k);
      gM=mix(.25,.04,k); gR=mix(.36,.62,k);
      float band=smoothstep(.45,.0,abs(P.x-e))*step(.001,uPaint)*step(uPaint,.999);
      col=mix(col,vec3(.906,.604,.098),band*.75);
      float lx=smoothstep(.016,.004,abs(fract(P.x/.72)-.5)/1.7);
      float ly=vK<.5?smoothstep(.02,.006,abs(fract(P.y/.5)-.5)/1.8):smoothstep(.02,.006,abs(fract(P.z/.8)-.5)/2.);
      col*=1.-.2*max(lx,ly);
      float w=fbm(P*vec3(1.6,5.,1.6)+11.);
      col*=1.-uWeather*.18*smoothstep(.45,.75,w);
    }
  `;
  function paintMat(kind) {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6, metalness: .1 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uPaint = U.uPaint; sh.uniforms.uWeather = U.uWeather;
      sh.vertexShader = 'attribute vec3 aP; attribute vec3 aN2; varying vec3 vP; varying vec3 vN2; varying float vK;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n vP=aP; vN2=aN2; vK=${kind.toFixed(1)};`);
      sh.fragmentShader = paintChunk + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n vec3 pc; pintura(vP,normalize(vN2),pc); diffuseColor.rgb=pc;')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor=gR;')
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n metalnessFactor=gM;');
    };
    return m;
  }
  const MAT = {
    fus: paintMat(0), wing: paintMat(1), tail: paintMat(2),
    dark: new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: .55, metalness: .5 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x121212, roughness: .92 }),
    strut: new THREE.MeshStandardMaterial({ color: 0x9a9d9b, roughness: .4, metalness: .7 }),
    hub: new THREE.MeshStandardMaterial({ color: 0xb4b6b0, roughness: .4, metalness: .6 }),
    prop: new THREE.MeshStandardMaterial({ color: 0x1b1c1d, roughness: .5, metalness: .25 }),
    tip: new THREE.MeshStandardMaterial({ color: 0xc9c9c2, roughness: .5 }),
    spin: new THREE.MeshStandardMaterial({ color: 0x141516, roughness: .35, metalness: .5 }),
    tank: new THREE.MeshStandardMaterial({ color: 0x4d5457, roughness: .5, metalness: .25 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe3e6, roughness: .06, metalness: 0, transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false }),
    frame: new THREE.MeshStandardMaterial({ color: 0x25281f, roughness: .5, metalness: .4 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x23251f, roughness: .85 }),
    helmet: new THREE.MeshStandardMaterial({ color: 0xe9e7df, roughness: .4 }),
  };

  const root = new THREE.Group(), air = new THREE.Group();
  root.add(air);
  const add = (geo, mat, parent = air, p) => {
    const me = new THREE.Mesh(geo, mat);
    me.castShadow = true; me.receiveShadow = true;
    if (p) me.position.set(p[0], p[1], p[2]);
    parent.add(me);
    return me;
  };
  function cyl(a, b, r, mat, parent = air, r2) {
    const A = V3(...a), B = V3(...b), L = A.distanceTo(B);
    const me = add(new THREE.CylinderGeometry(r2 ?? r, r, L, 14), mat, parent);
    me.position.copy(A).add(B).multiplyScalar(.5);
    me.quaternion.setFromUnitVectors(V3(0, 1, 0), B.clone().sub(A).normalize());
    return me;
  }

  // ── Fuselagem: nariz longo e fino de turboélice, cabine alta, dorso que afina até a cauda ──
  add(loftX([
    { x: 5.0, y: 0, ry: .36, rz: .34 }, { x: 4.6, y: .0, ry: .48, rz: .42 }, { x: 3.9, y: .0, ry: .62, rz: .48 },
    { x: 3.0, y: .02, ry: .72, rz: .53 }, { x: 2.0, y: .04, ry: .84, rz: .58 }, { x: .9, y: .05, ry: .9, rz: .6 },
    { x: -.3, y: .08, ry: .88, rz: .58 }, { x: -1.6, y: .16, ry: .73, rz: .5 }, { x: -2.9, y: .27, ry: .55, rz: .38 },
    { x: -4.0, y: .36, ry: .4, rz: .27 }, { x: -5.0, y: .44, ry: .27, rz: .16 }, { x: -5.65, y: .5, ry: .1, rz: .05 },
  ]), MAT.fus);
  // dorso atrás da cabine
  add(loftX([
    { x: .5, y: .45, ry: .46, rz: .36 }, { x: -.6, y: .45, ry: .42, rz: .3 }, { x: -2.0, y: .5, ry: .24, rz: .18 }, { x: -3.5, y: .55, ry: .03, rz: .05 },
  ], { k: 4, seg: 28 }), MAT.fus);
  // escapes laterais
  for (const sg of [1, -1]) {
    const e = add(new THREE.CylinderGeometry(.13, .11, .46, 18), MAT.dark, air, [3.72, .14, sg * .47]);
    e.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(-.85, .05, sg * .52).normalize());
    add(new THREE.CylinderGeometry(.095, .095, .05, 18), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: .9 }), air, [3.52, .15, sg * .59])
      .quaternion.setFromUnitVectors(V3(0, 1, 0), V3(-.85, .05, sg * .52).normalize());
  }
  // entrada de ar sob o nariz
  add(loftX([{ x: 4.8, y: -.42, ry: .1, rz: .22 }, { x: 4.3, y: -.5, ry: .13, rz: .24 }, { x: 3.5, y: -.5, ry: .05, rz: .14 }], { k: 3, seg: 18 }), MAT.fus);

  // ── Asas ──────────────────────────────────────────────────
  const y0 = -.55, dih = .085, chordAt = (z) => 2.45 - z * .245, xleAt = (z) => 2.55 - z * .135;
  const ailerons = [], flaps = [];
  for (const sg of [1, -1]) {
    const zs = [.25, 1.6, 3.2, 4.8, 5.45, 5.57];
    const st = zs.map((z) => ({ s: sg * z, x: xleAt(z), c: chordAt(z), t: .15 - z * .007, y: y0 + z * dih }));
    add(wingLoft(st, { k: 3 }), MAT.wing);
    // ponta da asa
    add(loftX([{ x: xleAt(5.57) + .1, y: y0 + 5.57 * dih, ry: .01, rz: .01 }, { x: xleAt(5.57) - .2, y: y0 + 5.57 * dih, ry: .05, rz: .06 }, { x: xleAt(5.57) - 1.05, y: y0 + 5.57 * dih, ry: .01, rz: .01 }], { k: 3, seg: 12 }), MAT.wing, air).position.z = sg * 5.58;
    const surf = (zA, zB, list, frac) => {
      const xa = xleAt(zA) - chordAt(zA) * frac, xb = xleAt(zB) - chordAt(zB) * frac, zm = (zA + zB) / 2;
      const g = new THREE.Group();
      g.position.set((xa + xb) / 2, y0 + zm * dih + .0, sg * zm);
      g.rotation.y = sg * Math.atan2(xa - xb, zB - zA);
      air.add(g);
      const hs = (zB - zA) / 2, c0 = chordAt(zA) * (1 - frac) + .04, c1 = chordAt(zB) * (1 - frac) + .04;
      add(wingLoft([{ s: -hs, x: .02, c: sg > 0 ? c0 : c1, t: .08, y: 0 }, { s: hs, x: .02, c: sg > 0 ? c1 : c0, t: .08, y: 0 }], { k: 2, n: 10 }), MAT.wing, g);
      list.push({ g, sg });
    };
    surf(.8, 3.05, flaps, .76);
    surf(3.2, 5.3, ailerons, .76);
  }

  // ── Cauda: deriva alta com filete dorsal ──────────────────
  add(wingLoft([
    { s: .45, x: -3.2, c: 2.9, t: .05, y: 0 }, { s: .75, x: -4.3, c: 1.85, t: .075, y: 0 }, { s: 1.15, x: -4.72, c: 1.3, t: .08, y: 0 },
    { s: 1.7, x: -4.98, c: 1.0, t: .08, y: 0 }, { s: 2.03, x: -5.1, c: .82, t: .07, y: 0 },
  ], { axis: 'y' }), MAT.tail);
  const rudder = new THREE.Group(); rudder.position.set(-5.74, 0, 0); air.add(rudder);
  add(wingLoft([{ s: .46, x: 0, c: .34, t: .06, y: 0 }, { s: 2.0, x: .1, c: .34, t: .06, y: 0 }], { axis: 'y', k: 2, n: 8 }), MAT.tail, rudder);
  const elev = [];
  for (const sg of [1, -1]) {
    add(wingLoft([
      { s: sg * .08, x: -4.45, c: 1.0, t: .08, y: .62 }, { s: sg * 1.2, x: -4.82, c: .78, t: .07, y: .64 }, { s: sg * 2.22, x: -5.12, c: .52, t: .06, y: .66 },
    ], { k: 3 }), MAT.tail);
    const g = new THREE.Group(); g.position.set(-5.5, .64, 0); air.add(g);
    add(wingLoft([{ s: sg * .1, x: .08, c: .42, t: .06, y: 0 }, { s: sg * 2.2, x: .4, c: .36, t: .06, y: .02 }], { k: 2, n: 8 }), MAT.tail, g);
    elev.push(g);
  }
  // Letras reais da aeronave da foto, em canvas
  const tc = document.createElement('canvas'); tc.width = 512; tc.height = 256;
  U.tailCanvas = tc;
  const tailTex = new THREE.CanvasTexture(tc); tailTex.colorSpace = THREE.SRGBColorSpace; U.tailTex = tailTex;
  for (const sg of [1, -1]) {
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(.92, .46), new THREE.MeshStandardMaterial({ map: tailTex, transparent: true, roughness: .6, polygonOffset: true, polygonOffsetFactor: -2 }));
    pm.position.set(-5.34, 1.1, sg * .085);
    if (sg < 0) pm.rotation.y = Math.PI;
    air.add(pm);
  }

  // ── Cabine em tandem ──────────────────────────────────────
  const CY = .5;
  const cab = new THREE.Group(); cab.position.x = .45; air.add(cab);
  add(loftX([{ x: 2.95, y: CY, ry: .02, rz: .2 }, { x: 2.4, y: CY, ry: .34, rz: .4 }, { x: 1.95, y: CY, ry: .5, rz: .47 }], { k: 4, a0: 0, a1: Math.PI, seg: 32, capA: false, capB: false }), MAT.glass, cab);
  const canopy = new THREE.Group(); canopy.position.set(0, CY, .47); cab.add(canopy);
  const cg = add(loftX([
    { x: 1.95, y: CY, ry: .52, rz: .48 }, { x: 1.2, y: CY, ry: .62, rz: .49 }, { x: .4, y: CY, ry: .62, rz: .49 }, { x: -.2, y: CY, ry: .46, rz: .42 }, { x: -.55, y: CY, ry: .16, rz: .3 },
  ], { k: 5, a0: 0, a1: Math.PI, seg: 32, capA: false, capB: false }), MAT.glass, canopy);
  cg.position.set(0, -CY, -.47);
  const hoop = (x, ry, rz, parent, off) => {
    const pts = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI; pts.push(V3(x, CY + ry * Math.sin(a), rz * Math.cos(a))); }
    const m = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .026, 8), MAT.frame, parent);
    if (off) m.position.set(0, -CY, -.47);
  };
  hoop(2.42, .34, .4, cab); hoop(1.95, .52, .48, cab); hoop(1.93, .52, .48, canopy, true); hoop(.8, .63, .49, canopy, true); hoop(-.3, .42, .4, canopy, true);
  add(new THREE.BoxGeometry(2.3, .3, .78), MAT.seat, cab, [.8, .46, 0]);
  for (const x of [1.42, .34]) {
    add(new THREE.SphereGeometry(.15, 22, 16), MAT.helmet, cab, [x, .86, 0]);
    add(new THREE.CylinderGeometry(.14, .22, .34, 14), MAT.seat, cab, [x, .65, 0]);
  }
  cyl([-1.6, .72, 0], [-2.0, 1.12, 0], .025, MAT.dark, air, .012);

  // ── Tanque central ────────────────────────────────────────
  add(loftX([
    { x: 3.0, y: -1.13, ry: .02, rz: .02 }, { x: 2.5, y: -1.13, ry: .21, rz: .21 }, { x: 1.3, y: -1.13, ry: .29, rz: .29 },
    { x: -.3, y: -1.13, ry: .22, rz: .22 }, { x: -1.35, y: -1.13, ry: .02, rz: .02 },
  ], { k: 6, seg: 24 }), MAT.tank);
  add(new THREE.BoxGeometry(.9, .22, .08), MAT.dark, air, [1.2, -.82, 0]);

  // ── Trem de pouso triciclo ────────────────────────────────
  const GROUND = -1.98;
  function wheel(cx, cz, r, w) {
    const cy = GROUND + r;
    add(new THREE.TorusGeometry(r - w * .55, w * .55, 18, 48), MAT.tire, air, [cx, cy, cz]);
    const hub = add(new THREE.CylinderGeometry(r * .52, r * .52, w * .78, 28), MAT.hub, air, [cx, cy, cz]);
    hub.rotation.x = Math.PI / 2;
    const cap = add(new THREE.CylinderGeometry(r * .16, r * .22, w * .96, 16), MAT.dark, air, [cx, cy, cz]);
    cap.rotation.x = Math.PI / 2;
  }
  for (const sg of [1, -1]) {
    const wx = 1.5, wz = sg * 1.72;
    cyl([1.58, y0 + 1.5 * dih - .02, sg * 1.5], [wx, GROUND + .36, wz], .055, MAT.strut, air, .075);
    cyl([.98, y0 + 1.3 * dih - .04, sg * 1.3], [wx - .02, GROUND + .9, sg * 1.66], .025, MAT.strut);
    const door = add(new THREE.BoxGeometry(.48, .78, .03), MAT.wing, air, [1.64, -1.08, sg * 1.74]);
    door.rotation.x = sg * -.1;
    wheel(wx, sg * 1.8, .34, .18);
  }
  cyl([4.38, -.38, 0], [4.35, GROUND + .26, 0], .05, MAT.strut, air, .065);
  cyl([3.9, -.45, 0], [4.33, GROUND + .55, 0], .022, MAT.strut);
  wheel(4.35, 0, .25, .12);
  const lamp = add(new THREE.SphereGeometry(.05, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0x665522, roughness: .2 }), air, [4.45, GROUND + .95, 0]);
  void lamp;

  // ── Hélice de cinco pás ───────────────────────────────────
  const prop = new THREE.Group(); prop.position.x = 5.12; air.add(prop);
  const spinner = new THREE.Mesh(new THREE.LatheGeometry([...Array(25).keys()].map((i) => {
    const t = i / 24; return new THREE.Vector2(.36 * Math.pow(1 - t * .999, .55) + .0001, t * .78);
  }), 48), MAT.spin);
  spinner.rotation.z = -Math.PI / 2; spinner.castShadow = true;
  prop.add(spinner);
  function bladeGeo(st) {
    const rings = [];
    for (const s of smooth(st, 4)) {
      const r = [];
      for (let j = 0; j < 14; j++) {
        const a = j / 14 * Math.PI * 2, lx = Math.cos(a) * s.c * .5, ly = Math.sin(a) * s.c * .07;
        r.push([-(lx * Math.sin(s.tw) + ly * Math.cos(s.tw)) + .14, s.s, lx * Math.cos(s.tw) - ly * Math.sin(s.tw)]);
      }
      rings.push(r);
    }
    return fromRings(rings, true, true, true);
  }
  for (let b = 0; b < 5; b++) {
    const blade = new THREE.Group(); blade.rotation.x = b * Math.PI * 2 / 5; prop.add(blade);
    const mk = (a, m) => { const me = new THREE.Mesh(bladeGeo(a.map(([s, c, tw]) => ({ s, c, tw }))), m); me.castShadow = true; blade.add(me); };
    mk([[.22, .1, .85], [.42, .2, .7], [.8, .25, .5], [1.0, .23, .36]], MAT.prop);
    mk([[1.0, .23, .36], [1.12, .19, .3], [1.2, .08, .26]], MAT.tip);
  }
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xe9b64a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.07, 1.2, 96), ringMat);
  ring.rotation.y = Math.PI / 2; ring.position.x = 5.28; air.add(ring);
  const discMat = new THREE.MeshBasicMaterial({ color: 0xd9d4c0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.07, 96), discMat);
  disc.rotation.y = Math.PI / 2; disc.position.x = 5.28; air.add(disc);

  // ── aP/aN2: a pintura fica presa à peça mesmo quando ela mexe ──
  air.updateWorldMatrix(true, true);
  const inv = air.matrixWorld.clone().invert(), nm = new THREE.Matrix3();
  air.traverse((o) => {
    if (!o.isMesh || ![MAT.fus, MAT.wing, MAT.tail].includes(o.material)) return;
    const rel = inv.clone().multiply(o.matrixWorld); nm.getNormalMatrix(rel);
    const p = o.geometry.attributes.position, n = o.geometry.attributes.normal;
    const ap = new Float32Array(p.count * 3), an = new Float32Array(p.count * 3), v = V3(0, 0, 0);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(rel); ap.set([v.x, v.y, v.z], i * 3);
      v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); an.set([v.x, v.y, v.z], i * 3);
    }
    o.geometry.setAttribute('aP', new THREE.BufferAttribute(ap, 3));
    o.geometry.setAttribute('aN2', new THREE.BufferAttribute(an, 3));
  });

  // Triciclo: fica nivelado no chão
  air.position.y = -GROUND;

  function set(s) {
    prop.rotation.x = s.propAngle;
    ringMat.opacity = s.blur * .55;
    discMat.opacity = s.blur * .1;
    for (const a of ailerons) a.g.rotation.z = a.sg * s.ctrl * .4;
    for (const f of flaps) f.g.rotation.z = -s.flaps * .62;
    rudder.rotation.y = s.ctrl * .42;
    for (const e of elev) e.rotation.z = s.ctrl * .36;
    canopy.rotation.x = s.canopy * 1.25;
  }
  return { root, set, prop };
}
