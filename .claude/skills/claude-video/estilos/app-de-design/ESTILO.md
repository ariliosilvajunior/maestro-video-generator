# App de design com cursor de IA
id: app-de-design
Melhor para: demo de app ou produto de design, abertura sobre thumbnails ou identidade visual, teaser "a IA desenhou isso", vídeo sobre criar com IA, mock de feed ou card do YouTube
Formato: 1920×1080, 15 s, sem som
Vídeo na galeria: galeria/videos/app-de-design.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: estilo "app de design com cursor de IA"

Referência: `design-app-ui.mp4` da galeria (15 s, 1280 x 720, 30 fps, mudo). Medida com `pericia-movimento.py`. Usamos só o vídeo e a especificação em números; nada do código dele, porque este estilo não traz código.

## Mecanismo
Um cursor de IA monta uma thumbnail de verdade dentro de um app de design, com movimentos reais de designer; no fim, a vencedora sai voando do app e vira um card no feed.

## Estrutura medida
| Tempo | O que acontece | Quem conduz o olho |
|---|---|---|
| 0 a 1 s | App surge inclinado e assenta aberto; painéis entram em sequência | O próprio app |
| 1 a 2 s | Painel do Claude entra, pedido aparece, plano começa | Painel do Claude |
| 2,03 s | Corte duro para o canvas (único corte) | Quadro branco |
| 2 a 3 s | Fundo cai com seleção e medida 1280 x 720; recorte da pessoa sobe | Caixa de seleção |
| 3,25 a 4,25 s | Câmera vai ao painel: clique em +, sombra, brilho, controle puxa e o brilho cresce | Cursor no controle |
| 4,5 a 5,75 s | Título digita em letras enormes, a caixa cresce junto | Cursor de texto |
| 5,75 a 7 s | Grade de 12 colunas aparece; título é arrastado, encaixa em X (56) e Y (164) | Linhas guia |
| 7 a 8,5 s | Seta se desenha; selo entra com clique | Ponta da seta |
| 8,5 a 9,75 s | Recuo ao plano aberto; duplica, as cópias deslizam para os lados | Cópias |
| 10 a 11 s | Fundos e cores trocam; um anel vermelho é riscado na vencedora; as outras apagam | Anel vermelho |
| 11,5 a 12 s | A vencedora sai do app inclinada em 3D | A própria thumbnail |
| 12 a 15 s | Vira card do feed: nome, visualizações contando, duração; cursor passa, card sobe | Contagem e cursor |

## Movimento: as metas
| Medida | Referência | Meta da nossa versão |
|---|---|---|
| Amplitude (pico ÷ mediana) | 8,7x | ≥ 6,1x |
| Tempo em quase-parada | 42 % | ≥ 32 % |
| Picos | 4 (4,5, 5,5, 7,0 e 8,5 s) | ≥ 2 |
| Cortes duros | 1 (2,03 s) | Precisa socar em algum ponto |

Leitura: as batidas caem na grade de 0,5 s. Rajada curta, depois parada enquanto o trabalho acontece. Os últimos 2,5 s são quase parados.

## Design
- **Fundo fora do app:** cinza claro. **Canvas:** `#EAEAE7` com pontos `#CFCFCA`, que somem quando o zoom cai.
- **Painéis:** brancos, linhas `#E6E6E3`, sombra leve. **Campos:** `#F5F5F2`.
- **Texto:** `#1F1F1F`, `#6B6B67`, `#A3A39E`. Fonte: Switzer.
- **Único acento do app:** argila `#D97757` (seleção, alças, guias, medidas, plano, cursor da IA).
- **Colaboradores:** verde `#2F8C83` e violeta `#6E5FC2`, só nos cursores.
- **Dentro da thumbnail:** amarelo `#FFD43B`, quase preto. **Vermelho:** selo da thumbnail e anel da vencedora.

## Câmera
Duas câmeras: a nossa voa sobre o app (força 1,6 a 2,8) e o app tem zoom próprio de canvas (60 % a 22 %). Seleção, alças e medidas não crescem com o zoom do canvas.

## Permitido e proibido
- **Permitido:** selecionar tudo o que a IA cria, encaixe com guia, controle arrastado, cópia deslizando, risco à mão, voo em 3D.
- **Proibido:** tema escuro, nome ou marca de programa real, vermelho no app fora do anel, texto ou seta sobre o rosto, cursor em cima do título na revelação, grade de pontos ruidosa no zoom baixo, ação sem clique, cursor que teletransporta.

## O que trocamos em relação à referência
- Textos em português: "CLAUDE FEZ ISSO", "100% IA", painéis e plano.
- Colaboradores Ana e Léo no lugar de Maya e Sam.
- Terceira variação: veleiro de vela vermelha na névoa, desenho nosso, no lugar da figura dele.
- Pessoa da thumbnail: o personagem do `01-editor` (moletom sem capuz, cordões, cabelo com gel), a pedido do Felipe, no lugar do busto cinza.
- Título "FEZ ISSO" é mais largo que o da referência: a caixa marca 612 x 258, não 602 x 258.

## Resultado da versão aprovada (2 de novembro de 2026)
15 s, 1920 x 1080, 30 fps, sem áudio. Vídeo final de 10 MB e cópia menor de 3,7 MB.

| Medida | Nosso | Referência | Meta |
|---|---|---|---|
| Amplitude (pico ÷ mediana) | 15,7x | 8,7x | ≥ 6,1x |
| Tempo em quase-parada | 55 % | 42 % | ≥ 32 % |
| Picos | 4 | 4 | ≥ 2 |
| Maior trecho sem mudança | 1,0 s | não medido | até 1,0 s |
| Cortes duros detectados | 0 | 1 (2,03 s) | Precisa socar em algum ponto |

Revisão por quadros parados e medições.

## O que ficou abaixo do original
- O corte de 2,03 s existe nos quadros, mas a medição não o detecta. A pancada é mais fraca que a da referência.
- Mais tempo quase parado que a referência, principalmente no fim.
- Os fundos das variações da ilha e do veleiro são mais simples.
