# App de motion com cursor de IA
id: app-de-motion
Melhor para: demo de ferramenta de animação, abertura sobre motion graphics com IA, vídeo em tema escuro sobre keyframes e curvas, teaser "do plano cru ao plano pronto", peça com cara de interface profissional
Formato: 1920×1080, 16 s, sem som
Vídeo na galeria: galeria/videos/app-de-motion.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: estilo "app de motion com cursor de IA"

Referência: `motion-app-ui.mp4` da galeria (16 s, 1280 x 720, 30 fps, mudo). Medida com `pericia-movimento.py`. Usamos só o vídeo e a especificação em números; nada do código dele, porque este estilo não traz código.

## Mecanismo
Um cursor de IA anima um plano de verdade dentro de um app escuro de motion: título, curva, rastreamento e nome. No fim, os painéis se desmontam e o plano pronto toma a tela.

## Estrutura medida
| Tempo | O que acontece | Quem conduz o olho |
|---|---|---|
| 0 a 1,25 s | App surge inclinado e assenta aberto; painéis entram em sequência | O próprio app |
| 1,25 a 2,25 s | Painel do Claude, pedido, plano de 5 passos | Painel do Claude |
| 2,25 a 3,25 s | Câmera vai ao visor; ferramenta de texto; título digitado no plano | Cursor de texto |
| 3,25 a 4,5 s | Câmera desce à linha do tempo; abre Posição, Escala e Opacidade; três cliques, três losangos; prévia com pontos iguais | Losangos |
| 4,75 a 6,25 s | Mergulho no editor de curva; alças arrastadas; "Influência 80%" | Alça da curva |
| 6,25 a 7,25 s | Segunda prévia: os pontos se juntam nas pontas | Título em movimento |
| 7,25 a 9,5 s | Mergulho no corredor; caixa de rastreamento; rastro de pontos | Caixa argila |
| 9,5 a 10,25 s | Legenda "4:52 /km" presa ao ponto rastreado | Linha da legenda |
| 10,25 a 11 s | Painel de efeitos; nome arrastado para o plano | Cursor |
| 11 a 12,5 s | Plano aberto; faixa de cache varre a linha do tempo; prévia | Faixa argila |
| 12,5 a 13 s | Painéis giram nas bordas e somem com desfoque; a mesa escurece | O visor crescendo |
| 12,97 s | Corte duro com clarão argila para o plano em tela cheia | Clarão |
| 13 a 16 s | Plano pronto com avanço lento de 5 % | O corredor |

## Movimento: as metas
| Medida | Referência | Meta da nossa versão |
|---|---|---|
| Amplitude (pico ÷ mediana) | 5,4x | ≥ 3,8x |
| Tempo em quase-parada | 33 % | ≥ 25 % |
| Picos | 5 (3,0, 5,0, 6,5, 10,0 e 13,0 s) | ≥ 3 |
| Cortes duros | 1 (12,97 s) | Precisa socar em algum ponto |

## Design
- **Mesa:** `#0B0B0C`. **Janela:** `#121212`. **Painéis:** `#1D1D1D`, canto de 8 px. **Linhas:** `#1F1F1F`, selecionada `#2B2B2B`.
- **Texto:** `#EDEDED`, `#9A9A9A`, `#7A7A7A`. Fonte: Switzer; uma palavra só em Instrument Serif itálica argila.
- **Único acento:** argila `#D97757` (cursor, anel de foco, losangos, alças, rastreador, faixa de cache).
- **Etiquetas de camada, apagadas:** `#4E7380`, `#5F7A55`, `#6D6A55`, `#7A6F9E`, `#86796A`.
- **Curva:** `#F2F2F2`, 3 px, com a reta tracejada de antes.

## Regras
- Um relógio só; o tempo do plano é uma tabela, e título, legenda e rastreador sempre mostram esse tempo.
- A mesma curva move o título, os pontos do caminho e o gráfico. Arrastou a alça, os três mudam.
- Câmera: abre com escala 0,80, 16° e -13°; empurrões de cerca de 0,45 s a escala 1,5–2,7, depois deriva lenta.
- **Proibido:** tema claro, nome ou marca de programa real, segundo acento na interface, rastreador ou título sobre o rosto, losango sem clique, curva que não muda o movimento, interface miúda demais para ler.

## O que trocamos em relação à referência
- Textos em português; título "Feito com *Claude*" no lugar de "Claude Video 2.0"; nome "Seu Nome".
- Em vez de corrida, uma caminhada com o personagem do `01-editor` de frente: moletom, capuz caído, cordões, cabelo com gel e alças da mochila. Pedido do Felipe, que depois vai criar uma versão com a imagem dele.
- Legenda "5,2 km/h" no lugar de "4:52 /km", ligada ao movimento. Rastreador preso à alça da mochila.
- Cena desenhada por nós, seguindo a ideia da especificação: rua ao entardecer com a pessoa em contraluz.

## Resultado da versão aprovada (2 de novembro de 2026)
16 s, 1920 x 1080, 30 fps, sem áudio. Vídeo final de 14 MB e cópia menor de 5,6 MB.

| Medida | Nosso | Referência | Meta |
|---|---|---|---|
| Amplitude (pico ÷ mediana) | 7,3x | 5,4x | ≥ 3,8x |
| Tempo em quase-parada | 45 % | 33 % | ≥ 25 % |
| Picos | 3 | 5 | ≥ 3 |
| Maior trecho sem mudança | 0,9 s | 0,1 s | até 1,0 s |
| Cortes duros detectados | 1 (13,00 s) | 1 (12,97 s) | Precisa socar em algum ponto |

Revisão por quadros parados e medições.

## O que ficou abaixo do original
- Três picos contra cinco: os empurrões de câmera foram suavizados para o teste de ritmo não os ler como cortes. A referência falha nesse teste pelo mesmo motivo.
- Mais tempo quase parado que a referência; parte vem da caminhada, que move menos o corpo.
- O giro dos painéis no desmonte quase não aparece nos quadros revisados.
- A faísca cobre parte da caixa do rastreador.
- As linhas verticais da fachada são mais densas.

## Decisões técnicas
- O clarão sobe de uma vez em um quadro, não em 0,06 s, para não gerar um trecho curto demais.
- O visor escurece nos últimos 0,3 s antes do corte, para o clarão aparecer sobre o plano alaranjado.
