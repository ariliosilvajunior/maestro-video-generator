// studio.js: um relógio só para a peça inteira (hábito 4).
// Carregue depois do GSAP e antes do script da sua cena.
// A cena chama STUDIO.play(render). render(t) precisa desenhar o frame INTEIRO a partir de t, e só.
// Mesmo t entrando, mesma imagem saindo. Isso deixa o render exato, com busca no tempo e em loop.
(function () {
  // funciona a partir do <head> ou do <body>: a raiz é procurada na primeira vez em que é necessária
  const R = () => document.querySelector('[data-composition-id]');
  const num = (k) => +R().dataset[k];
  const cache = {};
  const S = {
    get root() { return R(); },
    get D() { return num('duration'); },
    get W() { return num('width'); },
    get H() { return num('height'); },
    get V() { return S.H > S.W; },               // true para 9:16
    get u() { return Math.min(S.W, S.H) / 1080; }, // 1 unidade = 1 px num lado curto de 1080
    ease(name) { return cache[name] || (cache[name] = name === 'none' ? (p) => p : gsap.parseEase(name)); },
    // progresso 0..1 com easing de um movimento que começa em `start` e dura `dur`
    seg(t, start, dur, ease) {
      const p = Math.min(1, Math.max(0, (t - start) / dur));
      return S.ease(ease || 'power3.out')(p);
    },
    mix(a, b, p) { return a + (b - a) * p; },
    // uma onda que sempre fecha o loop: use um número inteiro de ciclos
    wave(t, cycles, offset) { return Math.sin(2 * Math.PI * ((cycles || 1) * t / S.D + (offset || 0))); },
    // números aleatórios com semente (nunca use Math.random num render)
    rng(seed) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    // um relógio só move tudo; loop:true dá a volta em t para t = D desenhar o mesmo frame que t = 0
    play(render, opts) {
      const loop = !opts || opts.loop !== false;
      const D = S.D, root = S.root;
      const clock = { t: 0 };
      const tl = gsap.timeline({ paused: true });
      // o loop.py define STUDIO_NO_WRAP para provar que render(fim) é de fato igual a render(0)
      const wrap = loop && !window.STUDIO_NO_WRAP;
      const draw = () => render(wrap ? clock.t % D : clock.t);
      tl.to(clock, { t: D, duration: D, ease: 'none', onUpdate: draw }, 0);
      draw();
      // as fontes podem chegar depois do primeiro desenho; desenhe de novo para o texto medido a partir delas ficar certo,
      // até no frame 0 (buscar o tempo em que você já está não redesenha)
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
      window.addEventListener('load', draw);
      window.__timelines = window.__timelines || {};
      window.__timelines[root.dataset.compositionId] = tl;
      return tl;
    },
  };
  window.STUDIO = S;
})();
