# Livro pop-up de papel
id: livro-pop-up
Melhor para: frase ou promessa curta em serifa ("passo a passo"), abertura afetiva ou artesanal, cartão de boas-vindas, loop de fundo quente para falar por cima
Formato: 1920×1080 (16:9), 12 s, em loop, sem som
Vídeo na galeria: galeria/videos/livro-pop-up.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: paper-cut (livro pop-up de papel recortado)

*Feita em 3 de novembro de 2026. Referência: o estilo `paper-cut` da skill Claude Video 2.0 (a ficha `STYLE.md` e a peça pronta da galeria dela; não distribuídos aqui). A peça é do autor (Jack Roberts, MIT); aqui só medimos. O nosso código é escrito do zero.*

## Ficha da referência

12,0 s · 1280 × 720 no vídeo da galeria (composição em 1920 × 1080) · 30 qps · sem áudio · **em loop**.

## Mecanismo em uma frase

Uma página de papel creme sobre a qual folhas de papel recortado pousam uma a uma, de trás para a frente (arcos, sol, ondas, letras, folhas que giram nos cabos a partir dos cantos), cada uma segurada um pouco acima com sombra larga e assentada com sombra justa; a pilha respira; e depois tudo levanta e sai na ordem inversa até sobrar a página nua, fechando o loop.

## Estrutura (o que está na tela)

- **Papel:** creme `#F2E8D5` com grão fino (textura com semente, em soft-light) e vinheta leve. Cores das folhas: areia `#E3CBA8`, sálvia `#9CB49A`, sálvia escura `#5E7F6A`, petróleo `#2F5D62`, tinta `#2B2B2B`; **um acento** rosa-crepúsculo `#D98C7A` (o sol).
- **Folhas:** bordas recortadas à mão (tremor pequeno), filete claro em cima, sombra suave sobre a folha de trás. 5 a 7 camadas de profundidade: folhas próximas mexem mais que as distantes (paralaxe) e sofrem mais o empurrão lento da câmera.
- **Composição:** texto pendurado na margem esquerda, sobre o creme nu; arcos à direita, ondas embaixo, folhas nos cantos de cima; formas grandes sangrando para fora do quadro.
- **Tipo:** EB Garamond 500 itálico, 230 px nas duas linhas e 76 px na terceira; cada letra é papel e pousa com a própria sombra.

## Tabela de batidas

| Tempo | O que acontece | Duração | Curva |
|---|---|---|---|
| 0,0 → 1,2 | Quatro arcos pousam, do fundo para a frente (0,4 s entre eles), vindo de baixo, 3,5 % maiores no ar e com sombra larga que aperta ao assentar | 0,8 s cada | back.out(1.2) |
| 1,6 | O sol (acento) pousa | 0,9 s | back.out |
| 2,1 / 2,5 | Duas ondas deslizam das laterais (uma de cada lado) e ficam ondulando devagar | 0,85 s | power3.out |
| 3,0 / 3,6 | Linhas de texto: cada letra cai de pouco acima da página, com giro e escala, 0,05 s entre letras | 0,6 s por letra | back.out(1.2) |
| 4,4 → 5,0 | Cinco folhas giram nos cabos a partir dos cantos superiores (−105° → 0) | 0,7 s cada | back.out |
| 5,3 | Terceira linha (pequena) | 0,6 s por letra | |
| 6,1 → 7,8 | **A respiração:** arcos, sol e folhas levantam um pouco e assentam, um após o outro | 0,8–1,0 s cada | sine.inOut |
| 8,3 → 9,3 | Letras descolam e saem (escala e giro, de volta para cima) | 0,4 s por letra | power2.in |
| 8,55 → 8,95 | Folhas saem girando | 0,45 s | power2.in |
| 9,65 / 9,9 | Ondas saem pelas laterais | 0,45 s | power2.in |
| 10,25 | Sol levanta e sai | 0,42 s | |
| 10,55 → 11,3 | Arcos levantam e saem, da frente para o fundo | 0,42 s cada | power2.in |
| 12,0 | Página nua = quadro 0 (loop) | | |

Durante todo o filme: a câmera empurra devagar (um ciclo de 12 s, até 1,2 % × profundidade) e balança 12 × 5 px (um ciclo), cada camada na sua medida.

## Movimento (medido com `pericia-movimento.py`)

| Medida | Referência |
|---|---|
| Mediana de energia | 0,80 |
| Pico | 2,52 |
| **Amplitude (pico ÷ mediana)** | **3,1x** |
| Em quase-parada | 16 % |
| Picos | 3 (4,5 · 9,0 · 10,0 s) |
| Cortes duros | 0 |

**Metas para a nossa versão:** amplitude ≥ 2,2x · quase-parada ≥ 25 % (a ferramenta pede um mínimo fixo acima do que a própria referência tem: 16 %) · pelo menos 2 picos · nenhum trecho parado acima de 1,0 s. É um filme que respira o tempo todo: a amplitude é baixa de propósito.

## Permitido e proibido

- Toda folha tem borda recortada, filete claro e sombra suave na folha de trás; folha no ar lança sombra mais larga e mais suave.
- Pouso back.out(1.2) 0,6 s com ~2 % de estouro; câmera sine.inOut lenta (4 a 8 s); balanços em ondas com número inteiro de ciclos (para fechar o loop).
- **Proibido:** forma vetorial chapada sem sombra, borda geométrica perfeita, cor saturada, texto por cima da cena.

## O que a nossa versão muda (autoral)

- **Texto no mundo do Felipe:** "Passo / a passo" e, pequeno, "sem tecniquês" (a promessa do canal). A referência diz "Layer / by layer / made by hand".
- **Cena:** três colinas de papel (não concêntricas) à direita com o sol rosa nascendo entre elas, em vez do arco-íris de arcos concêntricos; duas ondas recortadas embaixo; cinco folhas nos cantos. Geometria, cores por camada, sementes do recorte, tempos finos e profundidades são nossos; a sequência de batidas é a do estilo.
- Motor escrito do zero em canvas: um relógio só, `render(t)` desenha o quadro inteiro; grão de papel e recortes gerados uma vez com semente fixa; sombras por folha com a profundidade; letras desenhadas uma a uma com sombra própria.

## Resultado (render de 3 de novembro de 2026)

`galeria/videos/livro-pop-up.mp4` (cópia leve; o original em 1920 × 1080 não é distribuído): 12 s, 1920 × 1080, 30 qps, sem som, em loop.

| Medida | Nosso (1920 × 1080) | Nosso (1280 × 720) | Referência | Meta da ferramenta |
|---|---|---|---|---|
| Amplitude (pico ÷ mediana) | 5,3x | 4,8x | 3,1x | ≥ 2,2x |
| Quase-parada | 16 % | 20 % | 16 % | ≥ 25 % |
| Picos | 3 | 3 | 3 | ≥ 2 |
| Maior trecho sem movimento | 0,4 s | | 0,8 s | ≤ 1,0 s |
| Cortes duros | 0 | 0 | 0 | |

Amplitude e picos passam com folga. **Quase-parada reprova no teste de aceite (16–20 % contra um mínimo fixo de 25 %), mas a própria referência tem 16 %:** é um filme que respira o tempo todo (empurrão e balanço de câmera, ondas, respiração das folhas), e a ferramenta impõe um piso que o estilo não tem. Mantivemos o comportamento da referência em vez de congelar a cena para agradar a medição. O verificador de ritmo passa (112 mudanças, nenhum corte duro). O último quadro é igual ao primeiro dentro do ruído de codificação: o loop fecha.

Revisão por frames: grade de 4 quadros por segundo da versão final. Não assistido em tempo real.
