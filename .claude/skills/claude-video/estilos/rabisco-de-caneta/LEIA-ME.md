# Rabisco de caneta — leia antes de usar
O que é: um loop de 5 s de caderno escolar: a página pronta vira por cima da espiral e, na folha nova (com os sulcos da anterior), a esferográfica traça a palavra em letras-balão com sombra hachurada e enche a margem com espiral, estrela, cubo, raio, seta e um laço laranja.
Como renderizar: dentro de `projeto/`, `npx --yes hyperframes@0.8.181 render . -o renders/final.mp4 -q high --quiet`; os quadros de conferência com `npx --yes hyperframes@0.8.181 snapshot . --at 0,2.5,4.97 -o frames/`.
Como funciona: `motor.js` cria `window.M`, `_pintura.js` o kit `M.kits.pintura` (papel, camadas, caminhos, medida de texto) e `rabisco-de-caneta.js` registra o estilo; `index.html` só liga o relógio GSAP ao `estilo.render(ctx, t, tema, 1920, 1080)`.
O que trocar: a palavra (`tema.name` no `index.html`, até 16 caracteres; o plano das letras é medido uma vez por palavra), as quatro cores e a fonte do tema (bg escuro, ink claro, accent = margem e laço, accent2 = pauta e caneta), o tamanho do quadro (`data-width`/`data-height` + o canvas; cabe em 16:9, 9:16 e 1:1). Fonte: Baloo 2 (700–800) entra pelo `<link>` do Google Fonts e pelos `<span>` escondidos; se trocar a fonte, troque o link, os spans e o `document.fonts.load`, senão as letras saem na fonte reserva.
Aceite: quadro 0 igual ao quadro 5 (a página pronta), letras contornadas sem linhas internas em t = 1,25 s, hachura só na sombra, rabiscos sem encostar na palavra, nada cortado em 9:16.
Três coisas que quebram o estilo:
1. Linha que aparece por fade, ou hachura invadindo o miolo das letras.
2. Um segundo elemento colorido ou rabisco em cima da palavra: só o laço laranja é cor.
3. Boil, grão que se mexe ou câmera passeando: o bloco é parado; só a caneta e a virada da página se mexem.
