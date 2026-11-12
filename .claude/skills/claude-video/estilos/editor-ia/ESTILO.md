# Editor com cursor de IA
id: editor-ia
Melhor para: abertura de vídeo sobre edição com IA, demo de app ou produto de edição, teaser "a IA editou isso", vinheta de canal que fala de ferramentas, cena de bastidor antes do vídeo pronto
Formato: 1920×1080, 18 s, sem som
Vídeo na galeria: galeria/videos/editor-ia.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: estilo "editor com cursor de IA"

Referência: `editor-ui.mp4` da galeria (18 s, 1280 x 720, 30 fps, mudo). Medida com `pericia-movimento.py`. Usamos só o vídeo.

## Mecanismo
Um cursor de IA faz uma edição de verdade dentro de um editor, a câmera mergulha em cada painel, e no fim o programa se desmonta e o vídeo pronto toma a tela.

## Estrutura medida
| Tempo | O que acontece | Quem conduz o olho |
|---|---|---|
| 0 a 2 s | Programa surge inclinado e assenta; painéis entram em sequência | O próprio programa |
| 2 a 7 s | Mergulho na linha do tempo: silêncios marcados, cortados, fechados; cenas arrastadas | Cursor de IA |
| 7,07 s | Corte duro para a legenda no monitor (maior pico, 14,9) | Palavra destacada |
| 8,5 a 10 s | Painel de cor: controle puxado, antes/depois com divisória | Controle deslizante |
| 10,5 a 12 s | Nome na tela; volta ao plano aberto; exportação até 100 % | Barra de progresso |
| 12,7 a 15 s | Painéis voam para fora, riscos de luz, câmera entra no monitor | Riscos a partir do centro |
| 15 a 18 s | Vídeo pronto em tela cheia, legenda e nome entram de novo | Push-in lento |

## Movimento: as metas
| Medida | Referência | Meta da nossa versão |
|---|---|---|
| Amplitude (pico ÷ mediana) | 9,0x | ≥ 6,3x |
| Tempo em quase-parada | 49 % | ≥ 39 % |
| Picos | 3 (7,0, 8,5 e 15,0 s) | ≥ 2 |
| Cortes duros | 4 (7,07, 12,7, 13,0, 15,0 s) | Precisa socar em algum ponto |

Leitura: rajada e parada se alternam. A câmera voa rápido e fica quase parada enquanto o trabalho acontece.

## Permitido e proibido
- **Permitido:** câmera voando entre painéis, cursor com clique visível, marcação aparecendo por ação, painel que se abre com o trabalho, corte duro no maior pico.
- **Proibido:** ação sem clique, cursor que teletransporta, fade suave no lugar de movimento real, texto ou cursor sobre o rosto, interface pequena demais para ler.

## O que tem nesta versão
- **Visual:** cinza com argila, fiel à referência; textos em português.
- **Cena:** desenhada em código, inspirada no estúdio do Felipe: rapaz de moletom sem capuz e cabelo com gel, planta à esquerda, estante à direita.
- **Na linha do tempo:** o mascote do Claude Code, em pixels, no lugar da faísca.
- **Cenas arrastadas:** dois vídeos em loop de 5 s feitos em código, `neve.js` e `papel.js`, com fundo claro; a terceira cena continua sendo um desenho parado.

## Resultado medido
Variação de ritmo 7,0x (referência 9,0x, meta de pelo menos 6,3x), 46 % em quase-parada (referência 49 %, meta de pelo menos 39 %), 7 picos. Na checagem de ritmo, no máximo 0,5 s sem movimento.
