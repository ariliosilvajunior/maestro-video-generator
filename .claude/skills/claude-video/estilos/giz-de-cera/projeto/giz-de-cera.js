/* Giz de cera — giz e canetinha em papel-cartão escuro: a palavra se escreve, um laço, uma seta, brilhos, e a borracha limpa tudo. */
(function () {
  "use strict";
  const { ease, seg, mix, rgba, clamp, TAU } = M;
  const K = M.kits.pintura;
  const STACK = '"Comic Sans MS", "Marker Felt", cursive';

  /** Medidas da palavra e de cada rabisco, num quadro de projeto. */
  function plan(ctx, f, theme, word) {
    const key = `giz-plano:${f.w}x${f.h}:${theme.font}:${word}`;
    return M.once(key, () => {
      const maxW = f.w * (f.portrait ? 0.7 : f.square ? 0.6 : 0.46);
      const size = Math.min(f.u * (f.portrait ? 0.2 : 0.26), (maxW / Math.max(1, K.measure(ctx, word, K.font(400, 100, theme.font, STACK)))) * 100);
      const font = K.font(400, size, theme.font, STACK);
      ctx.save();
      ctx.font = font;
      const m = ctx.measureText(word);
      ctx.restore();
      const tw = m.width;
      const asc = m.actualBoundingBoxAscent || size * 0.7;
      const desc = m.actualBoundingBoxDescent || size * 0.2;
      const cx = f.cx, base = f.cy + asc * 0.32;
      const midY = base - asc * 0.45;
      const rx = tw / 2 + size * 0.45, ry = (asc + desc) / 2 + size * 0.42;
      const loop = M.wobble(K.loopPts(cx + size * 0.05, midY + size * 0.04, rx, ry, 1.13, -2.5, 3), size * 0.02, 5, 60);
      const under = M.wobble(M.linePts(cx - tw * 0.5, base + desc + size * 0.14, cx + tw * 0.48, base + desc + size * 0.08, 4), size * 0.015, 9, 90);
      // Seta: vem de baixo à esquerda e encosta no laço.
      const tip = [cx - rx * 0.78, midY + ry * 0.78];
      const tail = f.portrait ? [cx - rx * 0.55, midY + ry * 2.4] : [cx - rx * 1.55, midY + ry * 1.7];
      const arrow = M.wobble(
        K.bezierPts(tail, [tail[0] + size * 0.05, tail[1] - size * 0.85], [tip[0] - size * 1.05, tip[1] + size * 0.35], [tip[0] - size * 0.1, tip[1] + size * 0.08], 50),
        size * 0.012, 13, 50,
      );
      const [ax, ay, aa] = M.pointAt(arrow, 1);
      const back = aa + Math.PI;
      const hl = size * 0.36;
      const head = [
        [ax + Math.cos(back - 0.55) * hl, ay + Math.sin(back - 0.55) * hl],
        [ax, ay],
        [ax + Math.cos(back + 0.5) * hl * 0.9, ay + Math.sin(back + 0.5) * hl * 0.9],
      ];
      const sparks = [
        [cx + rx * 0.98, midY - ry * 0.95, size * 0.2],
        [cx + rx * 1.22, midY - ry * 0.35, size * 0.12],
      ];
      const heart = [cx - rx * 0.92, midY - ry * 0.9, size * 0.17];
      return { size, font, tw, asc, desc, cx, base, midY, rx, ry, loop, under, arrow, head, sparks, heart };
    });
  }

  /** Estrela de quatro pontas como caminho. */
  function sparkPts(x, y, r) {
    const out = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * TAU - Math.PI / 2;
      const k = Math.pow(Math.abs(Math.cos(2 * a)), 2.2);
      const rr = r * (0.22 + 0.78 * k);
      out.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    return out;
  }
  /** Coração desenhado num traço só. */
  function heartPts(x, y, r) {
    const out = [];
    for (let i = 0; i <= 70; i++) {
      const a = (i / 70) * TAU;
      const hx = 16 * Math.pow(Math.sin(a), 3);
      const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      out.push([x + (hx / 17) * r, y + (hy / 17) * r]);
    }
    return out;
  }

  /** Giz: dois passes do mesmo caminho, um largo e um fino deslocado. */
  function crayon(g, pts, color, width, a, b) {
    M.stroke(g, pts, { color, width, from: a, to: b, alpha: 0.95 });
    M.stroke(g, pts.map(([x, y]) => [x + width * 0.18, y - width * 0.12]), { color: mix(color, "#ffffff", 0.25), width: width * 0.45, from: a, to: b, alpha: 0.7 });
  }

  M.registrar({
    id: "giz-de-cera",
    nome: "Giz de cera",
    chamada: "Giz e canetinha no papel-cartão",
    aparencia: "Giz de cera e canetinha em papel-cartão azul-noite: a palavra escrita à mão, um laço rabiscado, uma seta, brilhos e um coração.",
    movimento: "A palavra se escreve, a canetinha sublinha, o laço e a seta são rabiscados, os brilhos saltam, as linhas fervem e a borracha passa.",
    regras: [
      "O giz é de cera: o dente do papel aparece em todo traço.",
      "As linhas fervem a 12 desenhos por segundo: um tremor de mão pequeno e constante.",
      "Escreva, não esmaeça: toda marca é desenhada ao longo do caminho.",
      "A canetinha é chapada e viva, com estrias; o giz é granulado.",
      "Três cores mais o branco, nunca mais que isso.",
      "Um laço solto que passa do ponto, nunca uma elipse perfeita.",
      "O loop termina com a borracha, que deixa só uma mancha leve.",
    ],
    prompt: `R — Referências
• Rabiscos de giz de cera e canetinha em papel-cartão preto (caderno de desenho infantil, anotação de professor).
• Animação desenhada à mão com "line boil" a 12 quadros por segundo.
• O sublinhado de marca-texto e o laço com seta das anotações à mão.

I — Ideia
Uma imagem com começo, meio e fim, 5 segundos, em loop sem emenda:
• Começo (0–1,6 s): a palavra "{{name}}" se escreve sozinha em giz branco, levemente inclinada; um sublinhado de canetinha {{accent}} corre embaixo dela.
• Meio (1,6–4,2 s): um laço de giz rabisca em volta da palavra, uma seta {{accent2}} faz a curva e aponta para ela, dois brilhos saltam e um coração se desenha no canto; as linhas não param de ferver.
• Fim (4,2–5 s): uma borracha passa da esquerda para a direita e deixa só uma mancha leve, que é o primeiro frame.

E — Estilo
Aparência: papel-cartão {{bg}} com dente visível; letra de giz {{ink}} em {{font}}; sublinhado de canetinha {{accent}} com estrias; seta e coração em {{accent2}}; o laço numa terceira cor tirada de {{accent2}}; falhas de cera onde o dente do papel é alto.
Movimento: a palavra entra em velocidade de escrita (máscara pela linha de base); cada traço corre pelo comprimento com ease out; os brilhos saltam com overshoot; tremor de linha a 12 fps; a borracha corre com ease in-out e borda macia.
Regras:
1. Todo traço de giz mostra o dente do papel.
2. Tremor de 12 fps em tudo que é desenhado.
3. As marcas correm pelo caminho; nada aparece por fade.
4. Laço que passa do ponto; pontas de seta feitas à mão.
5. Três cores mais o branco.
6. Grão e uma queda de luz suave no papel.

E — Examinar
Construa um arquivo HTML: um <canvas> e uma função pura render(ctx, t, theme, w, h) que desenha o frame t (0–5 s) a partir de theme {bg, ink, accent, accent2, font}. Mesmo t, mesmo frame, em qualquer ordem; hash com semente, sem Math.random. Precisa funcionar em 16:9, 9:16 e 1:1.
Renderize 5 frames (t = 0; 1,25; 2,5; 3,75; 5). Confira: o frame 0 é igual ao frame 5; em t = 1,25 a palavra está pela metade, cortada por uma borda de escrita e não por transparência; o laço não fecha certinho; o dente do papel aparece dentro do giz; nada sai do quadro em 9:16. Corrija o que falhar e renderize de novo até todas as verificações passarem.`,
    tema: { bg: "#121726", ink: "#f6f1e7", accent: "#b6e34a", accent2: "#ff6fae", font: "Gochi Hand" },
    fontes: ["Gochi Hand"],
    palavra: "olá!",
    tags: ["giz de cera", "canetinha", "rabisco", "desenho à mão", "esboço", "infantil", "divertido", "anotação", "escrita", "escreve", "laço", "seta"],

    render(ctx, t, theme, w, h) {
      const f = M.frame(w, h);
      ctx.drawImage(K.paper(theme, w, h, { seed: 9, mottle: 1.4, tooth: 1.6, fibres: 0.6 }), 0, 0);
      M.light(ctx, f.w * 0.42, f.h * 0.3, Math.max(w, h) * 0.75, theme.ink, 0.07);

      const word = M.wordFor(theme, "olá!");
      const P = plan(ctx, f, theme, word);
      const fr = K.frameIndex(t, 12);
      const loopColor = M.adjust(theme.accent2, 0.06, 0.95, 62);
      const S = P.size;
      const boilAmp = S * 0.012;

      const pWord = ease.inOutSine(seg(t, 0.15, 1.35));
      const pUnder = ease.outCubic(seg(t, 1.2, 1.65));
      const pLoop = ease.inOutSine(seg(t, 1.7, 2.55));
      const pArrow = ease.outCubic(seg(t, 2.45, 3.0));
      const pHead = ease.outCubic(seg(t, 2.95, 3.2));
      const pHeart = ease.inOutSine(seg(t, 3.15, 3.65));
      const erase = ease.inOutSine(seg(t, 4.2, 4.9));

      // Mancha que a borracha deixou (de um desenho anterior): sempre por baixo.
      const smear = M.bake(`giz-mancha:${theme.ink}:${theme.accent}:${theme.font}:${word}`, w, h, (g) => {
        g.filter = `blur(${Math.max(2, S * 0.08).toFixed(1)}px)`;
        g.translate(S * 0.12, 0);
        g.font = P.font;
        g.fillStyle = rgba(theme.ink, 0.06);
        g.textAlign = "center";
        g.fillText(word, P.cx, P.base);
        M.stroke(g, P.loop, { color: theme.ink, width: S * 0.1, alpha: 0.035 });
        M.stroke(g, P.under, { color: theme.accent, width: S * 0.14, alpha: 0.04 });
      });
      ctx.drawImage(smear, 0, 0);

      if (t < 4.95) {
        const tilt = -0.045 + K.jit(fr, 3, 7) * 0.003;
        const jx = K.jit(fr, 1, 3) * boilAmp, jy = K.jit(fr, 2, 3) * boilAmp;
        // Giz numa camada própria, depois o dente do papel é arrancado dela.
        const C = K.layer("giz-giz", w, h);
        const g = C.ctx;
        g.translate(f.cx + jx, f.cy + jy);
        g.rotate(tilt);
        g.translate(-f.cx, -f.cy);
        const tip = K.writeText(g, word, P.cx, P.base, P.font, theme.ink, pWord, { align: "center", stroke: theme.ink, lw: S * 0.025 });
        void tip;
        const lw = S * 0.05;
        if (pLoop > 0) crayon(g, K.boil(P.loop, fr, boilAmp, 21), loopColor, lw, 0, pLoop);
        if (pArrow > 0) crayon(g, K.boil(P.arrow, fr, boilAmp, 31), theme.accent2, lw * 0.9, 0, pArrow);
        if (pHead > 0) crayon(g, K.boil(P.head, fr, boilAmp, 41), theme.accent2, lw * 0.9, 0, pHead);
        if (pHeart > 0) crayon(g, K.boil(heartPts(...P.heart), fr, boilAmp, 51), theme.accent2, lw * 0.75, 0, pHeart);
        P.sparks.forEach(([x, y, r], i) => {
          const k = seg(t, 3.25 + i * 0.16, 3.6 + i * 0.16);
          if (k <= 0) return;
          const sc = ease.outBack(k, 2.2);
          const pts = sparkPts(x, y, r * sc).map(([a, b]) => [a + K.jit(fr, i, 61) * boilAmp, b + K.jit(fr, i, 62) * boilAmp]);
          g.fillStyle = rgba(theme.ink, 0.92);
          g.beginPath();
          pts.forEach(([a, b], j) => (j ? g.lineTo(a, b) : g.moveTo(a, b)));
          g.fill();
        });
        K.breakTooth(g, w, h, 0.72, Math.max(0.6, f.s * 1.7), "grao", (fr % 3) * 0.7, 0);

        // Canetinha: chapada, com estrias, por baixo do giz.
        const F = K.layer("giz-final", w, h);
        const q = F.ctx;
        q.translate(f.cx + jx, f.cy + jy);
        q.rotate(tilt);
        q.translate(-f.cx, -f.cy);
        if (pUnder > 0) {
          const u = K.boil(P.under, fr, boilAmp * 0.6, 71);
          const mw = S * 0.16;
          q.fillStyle = rgba(theme.accent, 0.9);
          K.ribbon(q, u, (s) => mw * (0.85 + 0.15 * Math.sin(s * 9)), 0, pUnder);
          for (let k = 0; k < 4; k++) {
            const off = (k / 3 - 0.5) * mw * 0.7;
            M.stroke(q, u.map(([x, y]) => [x, y + off]), { color: k % 2 ? mix(theme.accent, "#ffffff", 0.35) : mix(theme.accent, theme.bg, 0.25), width: mw * 0.07, from: 0, to: pUnder * 0.985, alpha: 0.5, cap: "butt" });
          }
        }
        q.setTransform(1, 0, 0, 1, 0, 0);
        q.drawImage(C.canvas, 0, 0);

        // Borracha: apaga atrás da frente, com borda macia.
        let ex = 0;
        if (erase > 0) {
          const x0 = P.cx - P.rx * 1.8, x1 = P.cx + P.rx * 1.8;
          ex = M.lerp(x0, x1, erase);
          const soft = S * 0.5;
          const gr = q.createLinearGradient(ex - soft, 0, ex, 0);
          gr.addColorStop(0, "rgba(0,0,0,1)");
          gr.addColorStop(1, "rgba(0,0,0,0)");
          q.globalCompositeOperation = "destination-out";
          q.fillStyle = "#000";
          q.fillRect(0, 0, Math.max(0, ex - soft), h);
          q.fillStyle = gr;
          q.fillRect(ex - soft, 0, soft, h);
          q.globalCompositeOperation = "source-over";
        }
        ctx.drawImage(F.canvas, 0, 0);

        // A borracha em si, esfregando para cima e para baixo.
        const show = M.pulse(t, 4.12, 4.25, 4.82, 4.95);
        if (show > 0) {
          const ey = P.midY + Math.sin(t * 38) * S * 0.25;
          const bw = S * 0.62, bh = S * 1.05;
          ctx.save();
          ctx.globalAlpha = show;
          ctx.translate(ex + bw * 0.1, ey);
          ctx.rotate(0.18);
          ctx.fillStyle = rgba("#000000", 0.35);
          ctx.beginPath();
          ctx.roundRect(-bw / 2 + S * 0.06, -bh / 2 + S * 0.08, bw, bh, S * 0.12);
          ctx.fill();
          ctx.fillStyle = mix(theme.accent2, theme.ink, 0.55);
          ctx.beginPath();
          ctx.roundRect(-bw / 2, -bh / 2, bw, bh, S * 0.12);
          ctx.fill();
          ctx.fillStyle = mix(theme.accent2, theme.bg, 0.25);
          ctx.fillRect(-bw / 2, -bh / 2 + bh * 0.55, bw, bh * 0.45 - S * 0.06);
          ctx.restore();
        }
      }

      K.finish(ctx, w, h, t, 0.5, 0.32);
    },
  });
})();
