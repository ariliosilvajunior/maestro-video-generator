# Interface escura em 3D
id: interface-escura-3d
Melhor para: filme de produto ou de funcionalidade de um app, demonstrar um fluxo de interface (clicar, concluir, publicar), abertura de vídeo sobre ferramenta, manchete ao lado de uma tela
Formato: 1920×1080 (16:9), 12 s, em loop, sem som
Vídeo na galeria: galeria/videos/interface-escura-3d.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: graphite-ui (filme de produto calmo, interface escura, câmera 3D lenta)

*Feita em 3 de novembro de 2026. Referência: o estilo `graphite-ui` da skill Claude Video 2.0 (a ficha `STYLE.md` e a peça pronta da galeria dela; não distribuídos aqui). A peça é do autor (Jack Roberts, MIT); aqui só medimos. O nosso código é escrito do zero.*

## Ficha da referência

12,0 s · 1280 × 720 no vídeo da galeria (composição em 1920 × 1080) · 30 qps · sem áudio · **em loop**.

## Mecanismo em uma frase

Um aplicativo de lista de tarefas, grande e sangrando para fora do quadro, visto por uma câmera 3D que desliza devagar: inclinada e aberta, depois plana e perto, depois virada para dar lugar a uma manchete; um cursor verde clica um botão verde, as linhas vão sendo riscadas em cascata, um aviso de concluído flutua acima do app, e uma borda de limpeza apaga a lista para o filme voltar ao primeiro quadro.

## Estrutura (o que está na tela)

- **Fundo** `#0E0F12` com campo de pontos fraco em paralaxe (1/3 da câmera).
- **App** 1400 × 880 px, painel `#17181C`, borda 1 px `#26282E`, raio 16 px, sombra escura e larga; barra de título com três pontos e campo de busca, barra lateral com ícones e barras-esqueleto, cabeçalho com título real ("Today") e um botão verde ("Complete"), barra de progresso, lista de 6 linhas com caixa de marcar, barras-esqueleto, etiqueta e avatar.
- **Texto:** Inter 600 com tracking −0,03 em no título e na manchete (184 px), Inter 500 na interface; barras-esqueleto no lugar de texto (nunca mais de 6 palavras reais).
- **Acento:** `#3DD68C` em uma só família de coisas: botão, cursor, caixas marcadas, barra de progresso, o "pronto".
- **Manchete** de duas linhas pendurada na margem esquerda, que sobe de trás de máscaras enquanto o app vira para a direita.
- **Aviso flutuante (toast)** 110 px acima do plano do app, que escorrega contra ele com o deslize da câmera.

## Tabela de batidas

| Tempo | O que acontece | Duração | Curva |
|---|---|---|---|
| 0,1–0,8 | Linhas da lista entram em cascata (0,06 s entre linhas, 0,04 s entre partes), subindo por trás da máscara de cada linha | 0,6 s | expo.out |
| 1,2–2,4 | Câmera: de inclinada e aberta para plana e perto | 1,2 s | power3.inOut |
| 1,7–2,8 | Cursor verde entra em arco até o botão | 1,1 s | power3.inOut |
| 2,9 | **Clique:** botão encolhe 5 %, anel verde, rótulo sobe e um visto se desenha no lugar | 0,1 + 0,6 s | expo.out |
| 3,15 → 3,75 | Linhas marcadas em cascata de 0,12 s: caixa enche de verde, visto se desenha, risco atravessa, texto esmaece; barra de progresso cresce | 0,5 s cada | expo.out |
| 4,3 | Cursor sai | 0,6 s | power2.in |
| 4,4–5,6 | Câmera vira o app para a direita (rotateY ~22°) para abrir espaço | 1,2 s | power3.inOut |
| 5,1–5,8 | Manchete sobe de trás das máscaras, palavra por palavra (0,1 s) | 0,7 s | expo.out |
| 6,4–7,6 | Câmera deriva um pouco (sobe) | 1,2 s | sine.inOut |
| 7,5–9,4 | Aviso flutuante entra 110 px acima do app, visto se desenha, sai | 0,6 / 0,35 s | expo.out / power3.in |
| 8,0 | Destaque da barra lateral desce um item | 0,5 s | power3.inOut |
| 8,4–8,8 | Manchete sai por cima | 0,4 s | power3.in |
| 9,3–10,1 | **Borda de limpeza** atravessa a lista da esquerda para a direita e apaga tudo; a lista some e volta a entrar | 0,8 s | power3.inOut |
| 10,1–11,4 | Câmera volta ao enquadramento inicial | 1,3 s | power3.inOut |
| 11,0–11,7 | Botão volta ao rótulo; título rola pela máscara ("novo dia"); destaque da barra lateral volta | 0,6 s | expo.out |
| 12,0 | = quadro 0 (loop) | | |

## Movimento (medido com `pericia-movimento.py`)

| Medida | Referência |
|---|---|
| Mediana de energia | 0,40 |
| Pico | 3,95 |
| **Amplitude (pico ÷ mediana)** | **9,8x** |
| Em quase-parada | 48 % |
| Picos | 1 (5,0 s: câmera virando + manchete subindo) |
| Cortes duros | 0 |

**Metas para a nossa versão:** amplitude ≥ 6,9x · quase-parada ≥ 38 % · pelo menos 1 pico · nenhum trecho parado acima de 1,0 s.

## Permitido e proibido

- Texto aparece de trás de uma borda de máscara limpa; nunca fade suave.
- Câmera desliza em velocidade constante, mecânica; sem tremor de mão.
- Cada ideia segura 1,2 s ou mais.
- Curvas: pouso expo.out 0,6 s; câmera power3.inOut 1,2 s; cascata 0,04 s; **sem quique, sem elástico**.
- **Proibido:** laranja sobre preto, gradiente roxo, vidro desfocado, brilho, logo 3D girando, interface minúscula.

## O que a nossa versão muda (autoral)

- **Tema no mundo do Felipe:** a fila de vídeos da semana do canal. Título "Esta semana", botão "Publicar", manchete "Tudo / publicado.", e cada linha da lista é um vídeo (miniatura 16:9 em esqueleto, barras de título e uma pílula de data). Cinco linhas em vez de seis.
- Enquadramentos de câmera, tempos finos, sombras e medidas do app são nossos; a sequência de batidas e o ritmo são os do estilo.
- Motor escrito do zero em DOM + CSS 3D (perspectiva real para a câmera inclinada): um relógio só, `render(t)` posiciona tudo a partir do tempo; sem `Math.random` (as larguras das barras-esqueleto vêm de uma lista fixa).

## Resultado (render de 3 de novembro de 2026)

`galeria/videos/interface-escura-3d.mp4` (cópia leve; o original em 1920 × 1080 não é distribuído): 12 s, 1920 × 1080, 30 qps, sem som, em loop.

| Medida | Nosso (1920 × 1080) | Nosso (1280 × 720) | Referência | Meta |
|---|---|---|---|---|
| Amplitude (pico ÷ mediana) | 10,2x | 10,0x | 9,8x | ≥ 6,9x |
| Quase-parada | 52 % | 52 % | 48 % | ≥ 38 % |
| Picos | 1 | 1 | 1 | ≥ 1 |
| Maior trecho sem movimento | 0,9 s | | | ≤ 1,0 s |
| Cortes duros | 0 | 0 | 0 | |

Passa no teste de aceite nas duas resoluções e no verificador de ritmo (70 mudanças, nenhum corte duro). O último quadro difere do primeiro só por ruído de codificação, na mesma ordem da diferença entre os quadros 0 e 1: o loop fecha.

Ajuste feito nos cards: a manchete caiu de 184 para 168 px e a câmera virada foi 50 px mais para a direita, porque "publicado." encostava na borda do app.

Revisão por frames: os 36 quadros do clique e da cascata de vistos (2,7 a 3,9 s), os 33 da limpeza (9,2 a 10,3 s) e a grade de 4 quadros por segundo. Não assistido em tempo real.
