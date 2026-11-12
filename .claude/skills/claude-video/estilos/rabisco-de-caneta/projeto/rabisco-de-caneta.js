/* Rabisco de caneta — rabiscos de esferográfica na margem de um bloco espiral: letras-balão, sombra hachurada, espiral, estrela, cubo e um raio. */
(function () {
  "use strict";
  const { ease, seg, mix, rgba, clamp, TAU } = M;
  const K = M.kits.pintura;
  const STACK = '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif';

  function page(f) {
    const x0 = f.w * 0.05, x1 = f.w * 0.95;
    const y0 = f.h * (f.portrait ? 0.075 : 0.12), y1 = f.h * 0.955;
    const mx = x0 + (x1 - x0) * (f.portrait ? 0.17 : 0.15);
    return { x0, x1, y0, y1, W: x1 - x0, H: y1 - y0, mx };
  }

  /** Tudo que a caneta desenha, medido uma vez por tamanho e palavra. */
  function plan(ctx, f, theme, word) {
    return M.once(`rabisco-plano:${f.w}x${f.h}:${theme.font}:${word}`, () => {
      const P = page(f);
      const areaW = P.x1 - P.mx;
      const cx = (P.mx + P.x1) / 2;
      const cy = P.y0 + P.H * (f.portrait ? 0.5 : 0.52);
      const probe = K.measure(ctx, word, K.font(800, 100, theme.font, STACK));
      const size = Math.min(f.u * (f.portrait ? 0.2 : 0.25), ((areaW * (f.portrait ? 0.8 : 0.56)) / Math.max(1, probe)) * 100);
      const font = K.font(800, size, theme.font, STACK);
      const tw = (probe * size) / 100;
      const x0 = cx - tw / 2, base = cy + size * 0.28;
      // Posição de cada letra.
      const letters = [];
      for (let i = 0; i < word.length; i++) {
        const pre = K.measure(ctx, word.slice(0, i), font);
        letters.push({ ch: word[i], x: x0 + pre });
      }
      const u = f.u;
      const mcx = (P.x0 + P.mx) / 2;
      const mr = Math.min((P.mx - P.x0) * 0.36, u * 0.075);
      const wob = (pts, s) => M.wobble(pts, u * 0.0025, s, u * 0.1);
      // Espiral na margem.
      const spiral = [];
      for (let i = 0; i <= 160; i++) {
        const k = i / 160, a = k * TAU * 3.3;
        spiral.push([mcx + Math.cos(a) * mr * (0.12 + 0.88 * k), P.y0 + P.H * 0.24 + Math.sin(a) * mr * (0.12 + 0.88 * k)]);
      }
      // Estrela traçada duas vezes.
      const star = [];
      const sx = mcx, sy = P.y0 + P.H * 0.72;
      for (let lap = 0; lap < 2; lap++)
        for (let i = 0; i <= 5; i++) {
          const a = -Math.PI / 2 + ((i * 2) % 5) * (TAU / 5) + lap * 0.06;
          const rr = mr * (1.05 + lap * 0.07);
          star.push([sx + Math.cos(a) * rr + lap * u * 0.004, sy + Math.sin(a) * rr - lap * u * 0.003]);
        }
      // Cubo no canto de cima.
      const cs = u * (f.portrait ? 0.07 : 0.075);
      const qx = P.x1 - P.W * (f.portrait ? 0.17 : 0.085) - (f.portrait ? 0 : cs * 0.6), qy = P.y0 + P.H * (f.portrait ? 0.16 : 0.2);
      const d = cs * 0.45;
      const cube = [
        [qx, qy], [qx + cs, qy], [qx + cs, qy + cs], [qx, qy + cs], [qx, qy],
        [qx + d, qy - d], [qx + cs + d, qy - d], [qx + cs, qy], [qx + cs + d, qy - d], [qx + cs + d, qy + cs - d], [qx + cs, qy + cs],
      ];
      // Raio no canto de baixo.
      const bx = P.x1 - P.W * (f.portrait ? 0.2 : 0.1), by = P.y1 - P.H * (f.portrait ? 0.2 : 0.22);
      const b = u * 0.06;
      const bolt = [[bx + b * 0.3, by - b], [bx - b * 0.35, by + b * 0.1], [bx + b * 0.1, by + b * 0.1], [bx - b * 0.3, by + b * 1.1], [bx + b * 0.45, by - b * 0.15], [bx, by - b * 0.15], [bx + b * 0.3, by - b]];
      // Seta que faz a curva até a palavra.
      const ae = [x0 + tw + size * 0.1, base - size * 0.85];
      const as = f.portrait ? [qx - cs * 0.3, qy + cs * 1.6] : [qx - cs * 0.5, qy + cs * 0.6];
      const arrow = f.portrait
        ? K.bezierPts(as, [as[0] - u * 0.02, as[1] + u * 0.12], [ae[0] + u * 0.12, ae[1] - u * 0.06], ae, 40)
        : K.join(
            K.bezierPts(as, [as[0] - u * 0.09, as[1] + u * 0.01], [as[0] - u * 0.1, as[1] + u * 0.09], [as[0] - u * 0.05, as[1] + u * 0.08], 20),
            K.bezierPts([as[0] - u * 0.05, as[1] + u * 0.08], [as[0] + u * 0.0, as[1] + u * 0.07], [ae[0] + u * 0.05, ae[1] - u * 0.06], ae, 30),
          );
      const [hx, hy, ha] = M.pointAt(arrow, 1);
      const hl = u * 0.025;
      const head = [[hx + Math.cos(ha + 2.6) * hl, hy + Math.sin(ha + 2.6) * hl], [hx, hy], [hx + Math.cos(ha - 2.6) * hl, hy + Math.sin(ha - 2.6) * hl]];
      // Sublinhado de laços (a caneta vermelha).
      const loops = [];
      const ly = base + size * 0.3;
      const n = Math.max(5, Math.round(tw / (size * 0.32)));
      for (let i = 0; i <= 220; i++) {
        const k = i / 220;
        const a = k * n * TAU;
        loops.push([x0 + k * tw - Math.sin(a) * size * 0.1, ly - (1 - Math.cos(a)) * size * 0.07]);
      }
      return {
        P, size, font, tw, x0, base, letters,
        spiral: wob(spiral, 1), star: wob(star, 2), cube: wob(cube, 3), bolt: wob(bolt, 4), arrow: wob(arrow, 5), head, loops: wob(loops, 6),
      };
    });
  }

  /** Conteúdo da página até o tempo tc (tc >= 5 = página pronta). */
  function content(g, f, theme, D, tc, lay) {
    const pen = mix(theme.accent2, theme.ink, 0.55);
    const lw = Math.max(1, f.u * 0.0032);
    // Letras: contorno traçado, sombra hachurada por trás, miolo limpo.
    const L = lay;
    const lg = L.ctx;
    const nL = D.letters.length;
    const hatchP = ease.inOutSine(seg(tc, 1.75, 2.35));
    const dd = D.size * 0.07;
    if (hatchP > 0) {
      const H = K.layer("rabisco-hachura", f.w, f.h);
      const hg = H.ctx;
      const step = Math.max(2.5, D.size * 0.055);
      const total = Math.ceil((D.tw + D.size * 1.4) / step);
      hg.strokeStyle = theme.accent2;
      hg.lineWidth = lw;
      hg.beginPath();
      for (let i = 0; i < total * hatchP; i++) {
        const x = D.x0 - D.size * 0.3 + i * step;
        hg.moveTo(x, D.base - D.size * 1.0);
        hg.lineTo(x + D.size * 0.35, D.base + D.size * 0.25);
      }
      hg.stroke();
      hg.globalCompositeOperation = "destination-in";
      hg.font = D.font;
      hg.fillStyle = "#000";
      hg.fillText(M.wordFor(theme, "Rabisco"), D.x0 + dd, D.base + dd);
      lg.drawImage(H.canvas, 0, 0);
    }
    lg.font = D.font;
    lg.strokeStyle = pen;
    lg.lineWidth = lw * 2;
    lg.lineJoin = "round";
    D.letters.forEach((l, i) => {
      const p = ease.inOutSine(seg(tc, 0.65 + (i / nL) * 1.0, 0.65 + (i / nL) * 1.0 + 0.32));
      if (p <= 0) return;
      lg.setLineDash(p >= 1 ? [] : [p * D.size * 4.2, 1e5]);
      lg.strokeText(l.ch, l.x, D.base);
    });
    lg.setLineDash([]);
    lg.globalCompositeOperation = "destination-out";
    lg.fillStyle = "#000";
    lg.fillText(M.wordFor(theme, "Rabisco"), D.x0, D.base);
    lg.globalCompositeOperation = "source-over";
    g.drawImage(L.canvas, 0, 0);

    // Rabiscos da margem, cada um traçado pelo caminho.
    const doodle = (pts, a, b, color = pen, width = lw) => {
      const p = ease.inOutSine(seg(tc, a, b));
      if (p <= 0) return;
      M.stroke(g, pts, { color, width, to: p });
      // Borrão de tinta onde a caneta pousa.
      g.fillStyle = color;
      g.beginPath();
      g.arc(pts[0][0], pts[0][1], width * 1.3, 0, TAU);
      g.fill();
    };
    doodle(D.spiral, 1.9, 2.45);
    doodle(D.star, 2.2, 2.85);
    doodle(D.cube, 2.5, 2.95);
    doodle(D.bolt, 2.75, 3.05);
    doodle(D.arrow, 2.85, 3.15);
    doodle(D.head, 3.12, 3.22);
    doodle(D.loops, 2.95, 3.4, theme.accent, lw * 1.25);
  }

  M.registrar({
    id: "rabisco-de-caneta",
    nome: "Rabisco de caneta",
    chamada: "Rabiscos de caneta na margem",
    aparencia: "Rabiscos de esferográfica num bloco espiral cor de ameixa: letras-balão, sombra hachurada, uma espiral, uma estrela retraçada, um cubo, um raio e um laço laranja.",
    movimento: "A página pronta vira por cima da espiral; na folha nova, ainda marcada pela anterior, a caneta traça cada letra e cada rabisco de novo.",
    regras: [
      "Uma linha fina de esferográfica, traçada pelo caminho, nunca aparecendo por fade.",
      "A tinta borra um pouco onde a caneta pousa.",
      "As letras-balão são contornadas primeiro e hachuradas na sombra depois.",
      "Os rabiscos moram na margem e nos cantos: espiral, estrela retraçada, cubo, raio, seta.",
      "Um só momento de caneta colorida: o laço sob a palavra.",
      "A folha nova traz os sulcos da pressão do desenho anterior.",
      "O loop abre na página pronta, então começo e fim batem.",
    ],
    prompt: `R — Referências
• Rabiscos de caderno escolar feitos com caneta esferográfica (pesquise: ballpoint doodles, bubble letters).
• Letras-balão com sombra hachurada, cubos e estrelas retraçadas na margem.
• O bloco de espiral, com pauta e margem.

I — Ideia
Uma página com começo, meio e fim, 5 segundos, em loop sem emenda:
• Começo (0–0,6 s): a página pronta vira para cima por cima da espiral e mostra uma folha nova, levemente marcada pelos sulcos do desenho anterior.
• Meio (0,6–3,4 s): a caneta traça "{{name}}" em letras-balão, hachura a sombra delas e enche a margem: uma espiral, uma estrela traçada duas vezes, um cubo, um raio, uma seta que faz a curva e um laço {{accent}} embaixo da palavra.
• Fim (3,4–5 s): a página pronta fica parada; é exatamente a página que vira no começo.

E — Estilo
Aparência: bloco {{bg}} com pauta {{accent2}}, margem {{accent}}, espiral de arame; linhas de esferográfica num {{accent2}} clareado, hachura de sombra em {{accent2}}, um só laço {{accent}}; letras-balão arredondadas traçadas em {{font}}.
Movimento: toda linha corre pelo caminho na velocidade da caneta; letras na ordem de leitura; hachura linha a linha; a virada da página tem ease in-out em 0,6 s, com sombra macia.
Regras:
1. Traçar pelo caminho; nada aparece por fade.
2. Borrões onde a caneta pousa.
3. Contorno primeiro, hachura da sombra depois.
4. Rabiscos na margem, nunca em cima da palavra.
5. Um único elemento de caneta colorida.
6. Os sulcos da página anterior na folha nova.

E — Examinar
Construa um arquivo HTML: um <canvas> e uma função pura render(ctx, t, theme, w, h) que desenha o frame t (0–5 s) a partir de theme {bg, ink, accent, accent2, font}. Mesmo t, mesmo frame, em qualquer ordem; hash com semente, sem Math.random. Precisa funcionar em 16:9, 9:16 e 1:1.
Renderize 5 frames (t = 0; 1,25; 2,5; 3,75; 5). Confira: o frame 0 é igual ao frame 5; em t = 1,25 as letras estão sendo contornadas, sem linhas internas sobrando; a hachura fica só na sombra, fora do miolo das letras; os rabiscos não encostam na palavra; nada corta em 9:16. Corrija o que falhar e renderize de novo até todas as verificações passarem.`,
    tema: { bg: "#141019", ink: "#ebe6f5", accent: "#ff9f43", accent2: "#8f7bff", font: "Baloo 2" },
    fontes: ["Baloo 2:wght@700..800"],
    palavra: "Rabisco",
    tags: ["esferográfica", "caneta", "rabisco", "caderno", "esboço", "letras-balão", "escola", "desenho à mão", "margem", "pauta"],

    render(ctx, t, theme, w, h) {
      const f = M.frame(w, h);
      const word = M.wordFor(theme, "Rabisco");
      const D = plan(ctx, f, theme, word);
      const P = D.P;
      ctx.drawImage(K.paper(theme, w, h, { seed: 32, mottle: 0.8 }), 0, 0);

      const sheetColor = mix(theme.bg, theme.accent2, 0.09);
      const sheet = M.bake(`rabisco-folha:${theme.bg}:${theme.accent2}:${theme.accent}:${theme.ink}`, w, h, (g, W, H) => {
        g.fillStyle = sheetColor;
        g.fillRect(P.x0, P.y0, P.W, P.H);
        g.save();
        g.globalCompositeOperation = "source-atop";
        g.drawImage(K.paper({ bg: sheetColor, ink: theme.ink }, W, H, { seed: 33, mottle: 1.2, fibres: 0.5 }), 0, 0);
        g.restore();
        const gap = f.u * 0.055;
        g.strokeStyle = rgba(theme.accent2, 0.22);
        g.lineWidth = Math.max(1, f.u * 0.0018);
        for (let y = P.y0 + gap * 1.6; y < P.y1 - gap * 0.4; y += gap) {
          g.beginPath();
          g.moveTo(P.x0, y);
          g.lineTo(P.x1, y);
          g.stroke();
        }
        g.strokeStyle = rgba(theme.accent, 0.42);
        g.beginPath();
        g.moveTo(P.mx, P.y0);
        g.lineTo(P.mx, P.y1);
        g.stroke();
        // Furos da espiral.
        g.fillStyle = theme.bg;
        const n = Math.round(P.W / (f.u * 0.06));
        for (let i = 0; i < n; i++) {
          const x = P.x0 + ((i + 0.5) / n) * P.W;
          g.beginPath();
          g.arc(x, P.y0 + f.u * 0.022, f.u * 0.009, 0, TAU);
          g.fill();
        }
      });
      // Sulcos do desenho anterior, como pressão no papel.
      const dents = M.bake(`rabisco-sulcos:${theme.font}:${word}:${theme.bg}:${theme.accent2}`, w, h, (g) => {
        const tmp = K.layer("rabisco-sulco-tmp", w, h);
        const lay = K.layer("rabisco-letras", w, h);
        content(tmp.ctx, f, { ...theme, accent: "#000000", accent2: "#000000", ink: "#000000" }, D, 5, lay);
        g.globalAlpha = 0.28;
        g.drawImage(tmp.canvas, 1, 1);
        g.globalCompositeOperation = "source-over";
        g.globalAlpha = 1;
        const hi = K.layer("rabisco-sulco-hi", w, h);
        hi.ctx.drawImage(tmp.canvas, 0, 0);
        hi.ctx.globalCompositeOperation = "source-in";
        hi.ctx.fillStyle = theme.ink;
        hi.ctx.fillRect(0, 0, w, h);
        g.globalAlpha = 0.05;
        g.drawImage(hi.canvas, -0.6, -0.6);
      });

      // A página pronta (ou em andamento) numa camada.
      const flip = ease.inOutSine(seg(t, 0, 0.6));
      const pageAt = (tc, key) => {
        const B = K.layer(key, w, h);
        B.ctx.drawImage(sheet, 0, 0);
        B.ctx.drawImage(dents, 0, 0);
        content(B.ctx, f, theme, D, tc, K.layer("rabisco-letras", w, h));
        return B.canvas;
      };
      if (t < 0.6) {
        ctx.drawImage(sheet, 0, 0);
        ctx.drawImage(dents, 0, 0);
        // Sombra que a folha virando joga na folha nova.
        const edge = P.y0 + P.H * Math.cos((flip * Math.PI) / 2);
        const sh = ctx.createLinearGradient(0, edge, 0, edge + f.u * 0.12);
        sh.addColorStop(0, rgba("#000000", 0.45 * (1 - flip)));
        sh.addColorStop(1, rgba("#000000", 0));
        ctx.fillStyle = sh;
        ctx.fillRect(P.x0, edge, P.W, f.u * 0.12);
        const old = pageAt(5, "rabisco-pagina");
        const sy = Math.max(0.001, Math.cos((flip * Math.PI) / 2));
        ctx.save();
        ctx.translate(0, P.y0);
        ctx.scale(1, sy);
        ctx.translate(0, -P.y0);
        ctx.drawImage(old, 0, 0);
        if (flip > 0) {
          ctx.globalAlpha = flip * 0.55;
          ctx.fillStyle = "#000";
          ctx.fillRect(P.x0, P.y0, P.W, P.H);
        }
        ctx.restore();
      } else {
        ctx.drawImage(pageAt(t, "rabisco-pagina"), 0, 0);
      }

      // Espiral de arame por cima de tudo.
      const n = Math.round(P.W / (f.u * 0.06));
      ctx.save();
      ctx.lineCap = "round";
      for (let i = 0; i < n; i++) {
        const x = P.x0 + ((i + 0.5) / n) * P.W;
        const y = P.y0 + f.u * 0.022;
        ctx.strokeStyle = rgba("#000000", 0.45);
        ctx.lineWidth = Math.max(1.5, f.u * 0.007);
        ctx.beginPath();
        ctx.ellipse(x + f.u * 0.003, y - f.u * 0.02, f.u * 0.011, f.u * 0.032, 0, Math.PI * 0.55, Math.PI * 1.75);
        ctx.stroke();
        ctx.strokeStyle = mix(theme.ink, theme.bg, 0.35);
        ctx.lineWidth = Math.max(1.2, f.u * 0.005);
        ctx.beginPath();
        ctx.ellipse(x, y - f.u * 0.022, f.u * 0.011, f.u * 0.032, 0, Math.PI * 0.55, Math.PI * 1.75);
        ctx.stroke();
      }
      ctx.restore();
      void clamp;
      K.finish(ctx, w, h, t, 0.5, 0.26);
    },
  });
})();
