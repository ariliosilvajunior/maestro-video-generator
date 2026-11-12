# Gráfico de jornal
id: grafico-de-jornal
Melhor para: um número ou ranking que muda de figura (antes e depois), comparação de 3 a 6 itens em que um se destaca, dado de resultado num vídeo ou post, cartão de estatística em loop
Formato: 1920×1080 (16:9), 10 s, em loop, sem som
Vídeo na galeria: galeria/videos/grafico-de-jornal.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: editorial-paper (gráfico de jornal que ganha vida)

*Feita em 3 de novembro de 2026. Referência: o estilo `editorial-paper` da skill Claude Video 2.0 (a ficha `STYLE.md` e a peça pronta da galeria dela; não distribuídos aqui). A peça é do autor (Jack Roberts, MIT); aqui só medimos. O nosso código é escrito do zero.*

## Ficha da referência

10,0 s · 1280 × 720 no vídeo da galeria (composição em 1920 × 1080) · 30 qps · sem áudio · **em loop**.

## Mecanismo em uma frase

Um gráfico de barras de jornal em papel salmão em que uma barra fica azul, dispara além das outras enquanto o número grande conta junto, sobe para o primeiro lugar, e as outras apagam para ela ficar sozinha; depois tudo recolhe e recomeça.

## Estrutura (o que está na tela)

- **Papel** `#FFF1E5` com grão fino estático; tinta `#1A1A1A`; réguas `#E3D3C3`; texto apagado `#6B5E55`; **um azul** `#0F5499`.
- **Cabeçalho:** barrinha de tinta curta em cima, manchete Playfair Display 700 (~116 px) que troca palavra por palavra dentro de uma máscara, fio de tinta embaixo.
- **Gráfico:** 5 barras horizontais de 72 px de altura, passo de 112 px, posição e letra à esquerda (Playfair 900 para o número da posição, Inter 500 para a letra), valor em Playfair 900 logo depois da barra, linhas de grade verticais a cada 20 com rótulos Inter 500 apagados, linha do zero em tinta.
- **Chamada à direita:** número grande Playfair 900 (~320 px) que conta, régua azul embaixo e rótulo Inter 500.
- **Marca fantasma:** um risco de tinta e "was 31" onde a barra azul começou.
- Grade de 12 colunas, margens de 120 px, calha de 32 px. Fio apagado na base.

## Tabela de batidas

| Tempo | O que acontece | Duração | Curva |
|---|---|---|---|
| 0,0–0,5 | Manchete 1 ("cinco no páreo") parada com as 5 barras | | |
| 0,25 → 0,55 | Manchete 1 sai por cima, palavra a palavra; manchete 2 ("uma dispara") entra por baixo | 0,35 s sai / 0,7 s entra | power2.in / expo.out |
| 0,7–2,3 | A barra azul cresce além das outras (as outras encolhem um pouco); eixo faz zoom de 60 para 80; o gráfico estreita para abrir espaço; o número grande entra e **conta junto** | 1,6 s | power2.inOut |
| 2,5–3,4 | Reordenação: a azul sobe para a 1ª posição (com leve estouro), as outras descem logo atrás | 0,9 s | back.inOut / power3.inOut |
| 3,5–4,3 | Régua azul se desenha sob o número; rótulo entra por baixo | 0,6 / 0,7 s | power2.inOut / expo.out |
| 4,2–4,8 | Foco: as outras barras apagam para a cor das réguas; risco fantasma e "era X" no valor antigo | 0,6 s | power2.inOut |
| 5,3–5,7 | Chamada sai por cima; manchete 2 sai; foco volta | 0,35 s | power2.in |
| 5,7–7,0 | Barras recolhem a zero (de baixo para cima); eixo volta para 60; gráfico alarga | 1,2 s | power2.inOut |
| 6,35–7,0 | Manchete 1 volta por baixo | 0,7 s | expo.out |
| 7,05 | Ordem das posições volta à original (com as barras vazias) | corte | |
| 7,4–8,8 | Barras crescem de novo aos valores iniciais; letras entram por baixo | 1,4 s | power2.inOut |
| 9,4–9,8 | A barra herói volta a ser azul | 0,4 s | power2.inOut |

## Movimento (medido com `pericia-movimento.py`)

| Medida | Referência |
|---|---|
| Mediana de energia | 0,69 |
| Pico | 4,14 |
| **Amplitude (pico ÷ mediana)** | **6,0x** |
| Em quase-parada | 33 % |
| Picos | 3 (1,5 · 3,0 · 10,0 s) |
| Cortes duros | 0 |

**Metas para a nossa versão:** amplitude ≥ 4,2x · quase-parada ≥ 25 % · pelo menos 2 picos · nenhum trecho parado acima de 1,0 s.

## Permitido e proibido

- Linhas se desenham da esquerda para a direita; números contam no mesmo passo da barra.
- A câmera pode dar zoom no gráfico (mudar o eixo), nunca tremer.
- Grão de papel fino, estático.
- Texto entra por máscara (deslize), nunca por fade.
- **Proibido:** gráfico 3D, pizza, neon, brilho, gradiente nas barras, linha de fonte ou nota de rodapé, segunda cor de acento, cantos arredondados, sombra.

## O que a nossa versão muda (autoral)

- **Tema no mundo do Felipe:** as cinco barras são etapas de um vídeo do canal (Roteiro, Edição, Thumb, Motion, Título) e a história é "o motion dispara" (de 29 para 74 pontos, +45). Manchetes: "Cinco no páreo" → "Uma dispara". Rótulo da chamada: "pontos a mais"; marca fantasma: "era 29". Números ilustrativos.
- Rótulos de linha com palavras em vez de letras (a coluna de rótulos ficou mais larga e o gráfico começa mais à direita).
- Motor escrito do zero em canvas: um relógio só, `render(t)` desenha o quadro inteiro; grão gerado uma vez com semente fixa; dígitos desenhados com avanço fixo para o número contar sem tremer.
- Valores e ritmo interno diferentes; a sequência de batidas é a do estilo.

## Resultado (render de 3 de novembro de 2026)

`galeria/videos/grafico-de-jornal.mp4` (cópia leve; o original em 1920 × 1080 não é distribuído): 10 s, 1920 × 1080, 30 qps, sem som, em loop.

| Medida | Nosso (medido em 1280 × 720, como a referência) | Nosso (medido em 1920 × 1080) | Referência | Meta |
|---|---|---|---|---|
| Amplitude (pico ÷ mediana) | 6,7x | 4,1x | 6,0x | ≥ 4,2x |
| Quase-parada | 33 % | 19 % | 33 % | ≥ 25 % |
| Picos | 2 | 3 | 3 | ≥ 2 |
| Maior trecho sem movimento | 0,7 s | | | ≤ 1,0 s |
| Cortes duros | 0 | 0 | 0 | |

O vídeo da galeria da referência é 1280 × 720. Medido na mesma resolução (cópia reduzida para 1280 × 720), o nosso passa no teste de aceite com folga. Medido em 1920 × 1080, reprova em amplitude e quase-parada: o grão de papel em resolução cheia vira ruído de codificação entre quadros parados e infla a mediana (o trecho parado de 2,5 s mede 0,78 em 1080p e 0,14 em 720p). O verificador de ritmo passa (68 mudanças, maior intervalo 0,7 s, nenhum corte duro). O último quadro difere do primeiro só por ruído de codificação, na mesma ordem da diferença entre os quadros 0 e 1: o loop fecha.

Revisão por frames: os 32 quadros do disparo com a contagem (1,4 a 2,4 s) e os 32 da reordenação (2,45 a 3,5 s), além da grade de 4 quadros por segundo. Não assistido em tempo real.
