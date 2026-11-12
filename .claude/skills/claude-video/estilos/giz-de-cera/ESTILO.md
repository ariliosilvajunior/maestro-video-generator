# Giz de cera
id: giz-de-cera
Melhor para: aberturas e vinhetas curtas com clima infantil e divertido — anotação de professor, caderno de desenho, uma palavra ou nome escrito à mão com laço e seta; peças de 5 s em loop (escrita, esboço, rabisco, desenho à mão)
Formato: 16:9 · 5 s em loop sem emenda · 30 fps (o render funciona também em 9:16 e 1:1)
Vídeo na galeria: galeria/videos/giz-de-cera.mp4
Peça de partida: projeto/estilo.js

---

## 0 · Em uma frase
**Giz e canetinha no papel-cartão:** giz de cera e canetinha em papel-cartão azul-noite — a palavra escrita à mão, um laço rabiscado, uma seta, brilhos e um coração; a palavra se escreve, a canetinha sublinha, o laço e a seta são rabiscados, os brilhos saltam, as linhas fervem e a borracha passa.

Vem da Biblioteca de motion do app Agentic Design OS (família Pintura e desenho, kit `M.kits.pintura`). O `projeto/` é uma composição HyperFrames standalone: `index.html` + `motor.js` + `_pintura.js` + `giz-de-cera.js`; o estilo é uma função pura `render(ctx, t, theme, w, h)` com `t` de 0 a 5 s e `render(0) === render(5)`.

## 1 · Beats (a Ideia do prompt)
- **Começo (0–1,6 s):** a palavra se escreve sozinha em giz branco, levemente inclinada; um sublinhado de canetinha `accent` corre embaixo dela.
- **Meio (1,6–4,2 s):** um laço de giz rabisca em volta da palavra, uma seta `accent2` faz a curva e aponta para ela, dois brilhos saltam e um coração se desenha no canto; as linhas não param de ferver.
- **Fim (4,2–5 s):** uma borracha passa da esquerda para a direita e deixa só uma mancha leve, que é o primeiro frame.

Tempos exatos no código: palavra 0,15–1,35 s · sublinhado 1,2–1,65 s · laço 1,7–2,55 s · seta 2,45–3,0 s (ponta 2,95–3,2 s) · coração 3,15–3,65 s · brilhos a partir de 3,25 s · borracha 4,2–4,9 s (visível 4,12–4,95 s).

## 2 · Paleta e fontes (tema do próprio estilo)
| Papel | bg | `#121726` | papel-cartão azul-noite, com dente e manchas |
|---|---|---|---|
| Giz | ink | `#f6f1e7` | a palavra, os brilhos, a queda de luz |
| Canetinha | accent | `#b6e34a` | o sublinhado chapado com estrias |
| Caneta 2 | accent2 | `#ff6fae` | seta, coração, borracha; o laço sai de `accent2` com o matiz girado (fica laranja no tema padrão) |

Fonte: **Gochi Hand** (Google Fonts), peso 400; fallback `"Comic Sans MS", "Marker Felt", cursive`. Quando a marca tem nome, o nome entra no lugar da palavra padrão **"olá!"** (`theme.name`, até 16 caracteres). Com o tema de uma marca, `bg` tem que ser escuro e `ink` claro.

## 3 · Regras do estilo
1. O giz é de cera: o dente do papel aparece em todo traço.
2. As linhas fervem a 12 desenhos por segundo: um tremor de mão pequeno e constante.
3. Escreva, não esmaeça: toda marca é desenhada ao longo do caminho.
4. A canetinha é chapada e viva, com estrias; o giz é granulado.
5. Três cores mais o branco, nunca mais que isso.
6. Um laço solto que passa do ponto, nunca uma elipse perfeita.
7. O loop termina com a borracha, que deixa só uma mancha leve.

## 4 · Movimentos de assinatura
- **Escrita por máscara de linha de base:** a palavra entra em velocidade de escrita (cortada por uma borda de escrita, nunca por transparência), ease in-out seno.
- **Traço que corre pelo caminho** com ease out: sublinhado, laço, seta, ponta da seta e coração, cada um do início ao fim do próprio caminho.
- **Brilhos com overshoot** (out-back 2,2), um atrás do outro com 0,16 s de intervalo.
- **Tremor de 12 fps** em tudo que é desenhado (`K.boil` com semente por desenho; inclinação de −2,6° que treme junto).
- **Borracha com ease in-out e borda macia:** `destination-out` com gradiente de 0,5 × tamanho da letra, enquanto o bloco de borracha esfrega para cima e para baixo.
- **Medido no vídeo da galeria** (`movimento.json`): amplitude **6,6×**, quase-parada **18 %**, **1 pico** aos 4,5 s (a borracha), **0 cortes duros**; mediana 0,53, pico 3,54. O perfil sobe devagar (0,2 → 0,6 até 3,5 s) e soca só na borracha.

## 5 · O que não pode
- Traço que aparece por fade ou crossfade: toda marca corre pelo caminho.
- Linha parada: sem o tremor de 12 fps o giz vira vetor.
- Elipse perfeita no laço, ponta de seta geométrica.
- Mais de três cores além do branco; gradiente chapado ou glow no papel.
- Giz sem o dente do papel (sem `breakTooth`).
- Quadro 0 diferente do quadro 5: o loop fecha na mancha que a borracha deixou.
- `Math.random`, `Date.now`: o quadro depende só de `t`, `theme`, `w`, `h`.

## 6 · Conferência feita (3/nov/2026)
Quadros em 0 s, 2,5 s e 4,97 s tirados com `hyperframes snapshot`: em 0 s e 4,97 s só o papel e a mancha leve; em 2,5 s a palavra, o sublinhado e o laço aparecem na fonte certa (Gochi Hand carregada). Quadro 0 × quadro 4,97 s com o grão médio tirado (192×108): diferença média 0,47/255, máxima 3 (contra 6,1 e 187 entre 0 s e 2,5 s): o loop fecha.
