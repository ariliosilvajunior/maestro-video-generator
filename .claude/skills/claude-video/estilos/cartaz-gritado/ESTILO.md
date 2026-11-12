# Cartaz gritado
id: cartaz-gritado
Melhor para: gancho de Short ou Reel (uma palavra por batida), contagem regressiva, chamada para um lançamento, vinheta barulhenta com música
Formato: 1920×1080 (16:9), 12 s, em loop, sem som
Vídeo na galeria: galeria/videos/cartaz-gritado.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: poster-pop (cartaz de show barulhento, tipo condensado gigante, cortes secos)

*Feita em 3 de novembro de 2026. Referência: o estilo `poster-pop` da skill Claude Video 2.0 (a ficha `STYLE.md` e a peça pronta da galeria dela; não distribuídos aqui). A peça é do autor (Jack Roberts, MIT); aqui só medimos. O nosso código é escrito do zero.*

## Ficha da referência

12,0 s · 1280 × 720 no vídeo da galeria (composição em 1920 × 1080) · 30 qps · sem áudio · **em loop**.

## Mecanismo em uma frase

Um cartaz de show gritando uma palavra por batida: cada palavra ou número gigante (maior que o quadro, cortado nas bordas) entra em disparada de fora da tela e para seco, o cartaz inteiro dá um tranco para baixo ao pousar e um soco de escala na batida, o fundo vira de amarelo para preto em corte duro, um cartão branco atravessa o numeral com a palavra de apoio subindo dentro dele, e tudo corta a cada 0,5 a 1 s.

## Estrutura (o que está na tela)

- **Duas cores só:** amarelo `#FFD400` e tinta `#111111`, mais o branco `#FFFFFF` dos cartões. Sem gradiente, sombra ou brilho.
- **Tipo:** League Gothic em caixa alta (palavra-herói com 50 a 150 % da altura do quadro, tracking 0,01 em) e Archivo Black nas palavras de apoio (≥ 40 px) dentro dos cartões.
- **Sem margens** para a palavra-herói; 64 px para o apoio. Nunca mais de 3 palavras na tela.
- **Planos da referência:** THREE · THINGS · YOU · NEED · 3 + BOLD · 2 + FAST · 1 + LOUD · 3 2 1 · GO · MAKE IT / COUNT.

## Tabela de batidas (tempo de história; o vídeo começa 0,5 s depois, para a emenda cair dentro do 1º plano)

| Tempo | O que acontece | Duração | Curva |
|---|---|---|---|
| 0 | Palavra 1 em disparada de baixo, letra por letra (0,033 s), para seco; tranco de 18 px; soco de escala na batida 0,5 | 0,2 s | power4.out |
| 1 | **Virada de campo** (corte: preto com tipo amarelo); palavra 2 em zíper (ímpares de cima, pares de baixo) | 0,2 s | |
| 2 / 2,5 | Duas palavras curtas de 0,5 s, uma de cima e outra de baixo, campos alternados | 0,2 s | |
| 3 / 4,5 / 6 | Numeral gigante (145 % da altura, cortado) + **cartão branco** que atravessa 0,5 s depois, com a palavra de apoio subindo dentro dele 2 quadros depois; campos alternados | 0,2 s cada | power4.out |
| 7,5 / 8 / 8,5 | Contagem 3 · 2 · 1, uma por meia batida, cada uma grande demais para o cartaz, entrando de direções diferentes | 0,2 s | |
| 9 | Palavra de partida com **zoom de impacto** (1,4 → 1,0) e virada de campo no meio do plano | 0,2 s | |
| 10,5 | Faixa de papel com a frase de apoio e seta; palavra-fecho gigante entra por baixo às 11,0 | 0,2 s | |
| 12 | = quadro 0 (loop) | | |

## Movimento (medido com `pericia-movimento.py`)

| Medida | Referência |
|---|---|
| Mediana de energia | 9,85 |
| Pico | 16,10 |
| **Amplitude (pico ÷ mediana)** | **1,6x** |
| Em quase-parada | 8 % |
| Picos | 13 |
| Cortes duros | 18 |

**Metas para a nossa versão:** amplitude ≥ 1,1x · quase-parada ≥ 25 % (piso fixo da ferramenta; a própria referência tem 8 %) · pelo menos 9 picos · cortes secos no compasso. É o filme mais alto dos oito: quase não há silêncio.

## Permitido e proibido

- Uma palavra ou número por batida; corte na batida; palavras param secas (nunca deslizam suave).
- Soco de escala 1,0 → 1,06 → 1,0 (sobe em 0,05 s, volta em 0,4 s, sine.inOut); saída power3.in 0,2 s; tranco de 18 px assentando em 0,15 s.
- Usar o quadro inteiro; cortar letras nas bordas de propósito.
- **Proibido:** gradiente, sombra, brilho, texto pequeno, mais de 3 palavras na tela, fade lento.

## O que a nossa versão muda (autoral)

- **Textos no mundo do Felipe:** o gancho de um Short do canal: TRÊS · ERROS · QUE · VOCÊ · 3 + PROMPT · 2 + CONTEXTO · 1 + REVISÃO · 3 2 1 · JÁ · NO CANAL / HOJE.
- Direções de entrada, posições dos numerais e dos cartões (cartões entrando por cima e por baixo), ordem das viradas de campo, faixa de papel embaixo com a seta apontando para cima e tempos finos são nossos; a sequência de batidas é a do estilo.
- Motor escrito do zero em canvas: um relógio só, `render(t)` escolhe o plano pelo tempo e desenha tudo; letras colocadas por altura de caixa-alta medida na fonte.

## Resultado (render de 3 de novembro de 2026)

`galeria/videos/cartaz-gritado.mp4` (cópia leve; o original em 1920 × 1080 não é distribuído): 12 s, 1920 × 1080, 30 qps, sem som, em loop.

| Medida | Nosso (1920 × 1080) | Nosso (1280 × 720) | Referência | Meta da ferramenta |
|---|---|---|---|---|
| Amplitude (pico ÷ mediana) | 1,8x | 1,8x | 1,6x | ≥ 1,1x |
| Quase-parada | 4 % | 8 % | 8 % | ≥ 25 % |
| Picos | 11 | 12 | 13 | ≥ 9 |
| Maior trecho sem movimento | 0,4 s | | 0,4 s | ≤ 1,0 s |
| Cortes duros | 18 (nos mesmos instantes da referência) | 18 | 18 | |

Amplitude, picos e cortes batem com a referência; a curva de energia acompanha a dela janela por janela. **Quase-parada reprova no teste de aceite (8 % contra um piso fixo de 25 %), mas é exatamente o valor da referência:** é um cartaz que grita uma palavra por batida e nunca descansa. O verificador de ritmo passa (96 mudanças, nenhum plano abaixo de 0,3 s). O último quadro é igual ao primeiro dentro do ruído: o loop fecha.

Ajuste feito depois do primeiro render: "QUE" entrava pela lateral e as letras cruzavam a tela inteira em 0,2 s, o que o verificador de ritmo acusava como dois flashes e dobrava o pico da medição (28 contra 16 da referência, o que escondia os outros picos). Passou a entrar por baixo; com isso, 12 picos e ritmo aprovado.

Revisão por frames: grade de 4 quadros por segundo e os quadros dos cards. Não assistido em tempo real.
