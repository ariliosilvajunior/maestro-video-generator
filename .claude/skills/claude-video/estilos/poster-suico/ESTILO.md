# Pôster suíço em grade
id: poster-suico
Melhor para: título ou slogan de 3 linhas que troca uma palavra, cartão de abertura ou encerramento em loop, vinheta de marca com um só acento, tela de espera antes da live
Formato: 1920×1080 (16:9), 9 s, em loop, sem som
Vídeo na galeria: galeria/videos/poster-suico.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: swiss-grid (pôster suíço em grade, tipo pesado em branco)

*Feita em 3 de novembro de 2026. Referência: o estilo `swiss-grid` da skill Claude Video 2.0 (a ficha `STYLE.md` e a peça pronta da galeria dela; não distribuídos aqui). A peça é do autor (Jack Roberts, MIT); aqui só medimos. O nosso código é escrito do zero.*

## Ficha da referência

9,0 s · 1280 × 720 no vídeo da galeria (composição em 1920 × 1080) · 30 qps · sem áudio · **em loop** (o último quadro emenda com o primeiro).

## Mecanismo em uma frase

Um pôster suíço parado em que só duas coisas se mexem, nunca ao mesmo tempo: a cada segundo uma peça preta desliza para a casa vazia do bloco, e a cada três segundos a última palavra do título troca como numa esteira enquanto o ponto vermelho pula para o fim da palavra nova.

## Estrutura (o que está na tela)

- **Grade** de 12 colunas, margens de 96 px, calha de 24 px, linhas finas `#E6E6E6` verticais (as duas bordas de cada coluna) e duas horizontais (nas margens de cima e de baixo).
- **Título em três linhas**, pendurado na margem esquerda, Inter 900, ~290 px, tracking −0,045 em: duas linhas fixas e a terceira que troca. A referência usa "Make / it / move → loop → land".
- **Bloco de peças pretas 3 × 3** nas colunas 8 a 12 (peça de 218 px, calha de 24 px), com **uma casa vazia**. O topo da caixa-alta da primeira linha e a linha de base da última linha coincidem com o topo e a base do bloco.
- **Um ponto vermelho `#E4002B`** de 62 px: o ponto final da última palavra. É o único acento.

## Tabela de batidas (um ciclo de 3 s, repetido três vezes)

| Tempo | O que acontece | Duração | Curva |
|---|---|---|---|
| 0,5 s | Peça preta desliza uma casa para a lacuna | 0,45 s | power3.inOut |
| 1,5 s | Troca da palavra na esteira (a antiga sobe e sai da máscara; a nova vem logo atrás) | 0,8 s | expo.inOut |
| 1,5 s | Ponto vermelho: antecipação (achata 0,12 s) → salto em arco até o fim da palavra nova (0,54 s, altura ~260 px) → pouso com amasso e mola (~0,35 s) | 1,0 s no total | power2 |
| 2,5 s | Peça preta desliza para a lacuna | 0,45 s | power3.inOut |

A lacuna anda num **anel de 6 casas** (as três de cima, a do meio-direita, as duas de baixo à direita e a central... na referência: topo-meio → topo-direita → meio-direita → baixo-direita → baixo-meio → centro). Como as peças são iguais, depois de 6 movimentos o bloco volta ao quadro inicial, o que fecha o loop de 9 s.

## Movimento (medido com `pericia-movimento.py`)

| Medida | Referência |
|---|---|
| Mediana de energia | 0,42 |
| Pico | 3,27 |
| **Amplitude (pico ÷ mediana)** | **7,8x** |
| Em quase-parada | 47 % |
| Picos | 3 (a cada 3 s, na troca da palavra + salto do ponto, em 2,0 · 5,0 · 8,0 s) |
| Cortes duros | 0 |

**Metas para a nossa versão:** amplitude ≥ 5,5x · quase-parada ≥ 37 % · pelo menos 2 picos · nenhum trecho parado acima de 1,0 s · mudança visível ao menos a cada 1 s.

## Permitido e proibido (do `STYLE.md` + do que se vê)

- Texto entra sempre por **deslize dentro de máscara**, nunca por fade.
- **Um movimento-herói por vez.** O resto espera.
- Cada layout acabado segura pelo menos 0,6 s.
- Tudo pousa **na grade**.
- Curvas: pouso expo.out 0,6 s; saída power3.in 0,35 s; deslocamento expo.inOut 0,9 s; overshoot ≤ 4 %.
- **Proibido:** gradiente, sombra, brilho, desfoque, cantos arredondados, tudo centralizado, segunda cor de acento, câmera móvel.

## O que a nossa versão muda (autoral)

- **Texto no mundo do Felipe:** "Faça / o Claude / criar. → editar. → animar." (três verbos que o canal ensina; o ciclo de três mantém o loop de 9 s).
- Motor escrito do zero: um relógio só, `render(t)` desenha o quadro inteiro, sem `Math.random`, `Date.now` ou timers. Nada da peça do autor foi copiado; a geometria vem da spec pública (grade, tamanhos, cores, curvas).
- O caminho da lacuna nas peças é outro (anel diferente), para a peça não ser uma cópia quadro a quadro.

## Resultado (render de 3 de novembro de 2026)

`galeria/videos/poster-suico.mp4` (cópia leve; o original em 1920 × 1080 não é distribuído): 9 s, 1920 × 1080, 30 qps, sem som, em loop.

| Medida | Nosso | Referência | Meta |
|---|---|---|---|
| Amplitude (pico ÷ mediana) | 9,1x | 7,8x | ≥ 5,5x |
| Quase-parada | 47 % | 47 % | ≥ 37 % |
| Picos | 3 | 3 | ≥ 2 |
| Maior trecho sem movimento | 0,9 s | | ≤ 1,0 s |
| Cortes duros | 0 | 0 | |

Passa no teste de aceite contra a referência e no verificador de ritmo (42 mudanças, nenhum corte duro). O último quadro (8,967 s) difere do primeiro só por ruído de codificação, na mesma ordem da diferença entre os quadros 0 e 1 (que são estáticos): o loop fecha. Revisão por frames (grade de 4 por segundo e os 27 quadros da primeira troca), não em tempo real.

Mudanças feitas durante os cards: o arco do salto do ponto baixou de ~260 para 150 px, para não passar por cima do "Code" (a 2ª linha da referência é "it", curta); o terceiro verbo passou de "lança" para "anima", porque a cedilha deixava um rabicho visível sob a 2ª linha durante a troca.
