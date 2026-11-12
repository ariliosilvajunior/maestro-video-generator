# Giz de cera — leia antes de usar
O que é: um loop de 5 s em giz de cera e canetinha sobre papel-cartão azul-noite; a palavra se escreve, a canetinha sublinha, um laço e uma seta são rabiscados, dois brilhos saltam, um coração se desenha e a borracha apaga tudo, deixando a mancha leve que é o primeiro quadro.
Como renderizar: dentro de `projeto/`, `npx --yes hyperframes@0.8.181 render . -o renders/final.mp4 -q high --quiet`; os quadros de conferência com `npx --yes hyperframes@0.8.181 snapshot . --at 0,2.5,4.97 -o frames/`.
Como funciona: `motor.js` cria `window.M`, `_pintura.js` o kit `M.kits.pintura` (papel, dente, boil, escrita por linha de base) e `giz-de-cera.js` registra o estilo; `index.html` só liga o relógio GSAP ao `estilo.render(ctx, t, tema, 1920, 1080)`.
O que trocar: a palavra (`tema.name` no `index.html`, até 16 caracteres), as quatro cores e a fonte do tema (bg escuro, ink claro, accent = canetinha, accent2 = seta/coração), o tamanho do quadro (`data-width`/`data-height` + o canvas; o estilo cabe em 16:9, 9:16 e 1:1). Fonte: Gochi Hand entra pelo `<link>` do Google Fonts e pelos `<span>` escondidos; se trocar a fonte, troque o link, os spans e o `document.fonts.load`.
Aceite: quadro 0 igual ao quadro 5 (confira com o grão tirado), palavra cortada por borda de escrita em t = 1,25 s, o laço não fecha certinho, o dente do papel aparece no giz.
Três coisas que quebram o estilo:
1. Traço que aparece por fade ou sem o tremor de 12 fps: vira vetor liso, deixa de ser giz.
2. Mais de três cores além do branco, ou gradiente/glow no papel.
3. Mexer na borracha ou no `t < 4.95` do fim: o loop deixa de fechar e a emenda aparece.
