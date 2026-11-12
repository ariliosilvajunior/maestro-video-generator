# Rabisco de caneta
id: rabisco-de-caneta
Melhor para: aberturas e vinhetas com cara de caderno escolar — letras-balão de esferográfica, rabiscos na margem (espiral, estrela, cubo, raio, seta), um nome ou palavra que a caneta traça; peças de 5 s em loop (esboço, escola, desenho à mão, pauta)
Formato: 16:9 · 5 s em loop sem emenda · 30 fps (o render funciona também em 9:16 e 1:1)
Vídeo na galeria: galeria/videos/rabisco-de-caneta.mp4
Peça de partida: projeto/estilo.js

---

## 0 · Em uma frase
**Rabiscos de caneta na margem:** rabiscos de esferográfica num bloco espiral cor de ameixa — letras-balão, sombra hachurada, uma espiral, uma estrela retraçada, um cubo, um raio e um laço laranja; a página pronta vira por cima da espiral e, na folha nova, ainda marcada pela anterior, a caneta traça cada letra e cada rabisco de novo.

Vem da Biblioteca de motion do app Agentic Design OS (família Pintura e desenho, kit `M.kits.pintura`). O `projeto/` é uma composição HyperFrames standalone: `index.html` + `motor.js` + `_pintura.js` + `rabisco-de-caneta.js`; o estilo é uma função pura `render(ctx, t, theme, w, h)` com `t` de 0 a 5 s e `render(0) === render(5)`.

## 1 · Beats (a Ideia do prompt)
- **Começo (0–0,6 s):** a página pronta vira para cima por cima da espiral e mostra uma folha nova, levemente marcada pelos sulcos do desenho anterior.
- **Meio (0,6–3,4 s):** a caneta traça a palavra em letras-balão, hachura a sombra delas e enche a margem: uma espiral, uma estrela traçada duas vezes, um cubo, um raio, uma seta que faz a curva e um laço `accent` embaixo da palavra.
- **Fim (3,4–5 s):** a página pronta fica parada; é exatamente a página que vira no começo.

Tempos exatos no código: virada 0–0,6 s · letras de 0,65 s em diante, na ordem de leitura (0,32 s cada, escalonadas) · hachura 1,75–2,35 s · espiral 1,9–2,45 s · estrela 2,2–2,85 s · cubo 2,5–2,95 s · raio 2,75–3,05 s · seta 2,85–3,15 s (ponta 3,12–3,22 s) · laço 2,95–3,4 s.

## 2 · Paleta e fontes (tema do próprio estilo)
| Bloco | bg | `#141019` | o fundo e a folha (misturada com 9 % de `accent2`) |
|---|---|---|---|
| Papel claro | ink | `#ebe6f5` | brilho dos sulcos, arame da espiral |
| Caneta colorida | accent | `#ff9f43` | a margem e o único laço laranja |
| Esferográfica | accent2 | `#8f7bff` | pauta, hachura da sombra; a linha da caneta é `accent2` clareado com 55 % de `ink` |

Fonte: **Baloo 2** (Google Fonts), peso 800; fallback `"Arial Rounded MT Bold", "Trebuchet MS", sans-serif`. Quando a marca tem nome, o nome entra no lugar da palavra padrão **"Rabisco"** (`theme.name`, até 16 caracteres). Com o tema de uma marca, `bg` tem que ser escuro e `ink` claro.

## 3 · Regras do estilo
1. Uma linha fina de esferográfica, traçada pelo caminho, nunca aparecendo por fade.
2. A tinta borra um pouco onde a caneta pousa.
3. As letras-balão são contornadas primeiro e hachuradas na sombra depois.
4. Os rabiscos moram na margem e nos cantos: espiral, estrela retraçada, cubo, raio, seta.
5. Um só momento de caneta colorida: o laço sob a palavra.
6. A folha nova traz os sulcos da pressão do desenho anterior.
7. O loop abre na página pronta, então começo e fim batem.

## 4 · Movimentos de assinatura
- **Toda linha corre pelo caminho na velocidade da caneta** (`M.stroke` com `to: p`, ease in-out seno), com um borrão de tinta no ponto onde a caneta pousa.
- **Letras na ordem de leitura:** cada letra contornada por `setLineDash` progressivo, miolo limpo (`destination-out`) e a sombra hachurada linha a linha, deslocada 7 % do corpo.
- **Virada de página em 0,6 s** com ease in-out: a página pronta escala em Y por cima da espiral e joga uma sombra macia na folha nova.
- **Sulcos da página anterior:** o desenho completo baked em preto a 28 % com um brilho `ink` a 5 %, deslocado 1 px.
- **Sala parada:** não há boil; o papel, a pauta e a espiral de arame ficam fixos, só a caneta se mexe.
- **Medido no vídeo da galeria** (`movimento.json`): amplitude **28,7×**, quase-parada **82 %**, **picos** em 0 e 0,5 s (a virada da página), **0 cortes duros**; mediana 0,07, pico 1,90. O perfil é o inverso do giz: soco no começo, depois a caneta trabalha em quase-silêncio até a página pronta.

## 5 · O que não pode
- Linha que aparece por fade; rabisco em cima da palavra.
- Hachura dentro do miolo das letras (ela mora só na sombra).
- Mais de um elemento de caneta colorida.
- Boil de linha, grão que se mexe, câmera que passeia: o bloco fica parado.
- Página do começo diferente da página do fim (o loop abre na página pronta).
- `Math.random`, `Date.now`: o quadro depende só de `t`, `theme`, `w`, `h`.

## 6 · Conferência feita (3/nov/2026)
Quadros em 0 s, 2,5 s e 4,97 s tirados com `hyperframes snapshot`: em 0 s e 4,97 s a página pronta (letras-balão com hachura, espiral, estrela, cubo, raio, seta, laço laranja); em 2,5 s as letras contornadas pela metade da hachura e a margem ainda sendo preenchida, na fonte certa (Baloo 2 carregada). Quadro 0 × quadro 4,97 s com o grão médio tirado (192×108): diferença média 0,57/255, máxima 8 (contra 1,5 e 97 entre 0 s e 2,5 s): o loop fecha.
