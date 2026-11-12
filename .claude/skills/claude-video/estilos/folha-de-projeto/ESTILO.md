# Folha de projeto
id: folha-de-projeto
Melhor para: mostrar como um produto ou sistema é por dentro (vista explodida), destacar uma peça ou etapa de um conjunto, abertura de vídeo técnico, loop de fundo para uma explicação
Formato: 1920×1080 (16:9), 12 s, em loop, sem som
Vídeo na galeria: galeria/videos/folha-de-projeto.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: blueprint (desenho técnico que se constrói linha por linha)

*Feita em 3 de novembro de 2026. Referência: o estilo `blueprint` da skill Claude Video 2.0 (a ficha `STYLE.md` e a peça pronta da galeria dela; não distribuídos aqui). A peça é do autor (Jack Roberts, MIT); aqui só medimos. O nosso código é escrito do zero.*

## Ficha da referência

12,0 s · 1280 × 720 no vídeo da galeria (composição em 1920 × 1080) · 30 qps · sem áudio · **em loop**.

## Mecanismo em uma frase

Uma folha de projeto azul em que um objeto se desenha sozinho em traços (linhas de construção primeiro, traços reais por cima), explode em peças ao longo de um eixo, ganha rótulos e cotas, a peça que importa se pinta de amarelo com a câmera chegando perto, e depois tudo se remonta e se apaga ao contrário.

## Estrutura (o que está na tela)

- **Folha:** fundo `#0E3A66`, grade fina a cada 24 px e grade pesada a cada 120 px (`#1C4D80`), que andam a 30 % da câmera (paralaxe). Borda da folha a 48 px com marcas de zona, marcas de canto, barra de escala no canto inferior esquerdo e bloco de título vazio no canto inferior direito.
- **Desenho:** traços `#CFE3F7` de 2 px (contornos) e 1,25 px (detalhes), linha de eixo traço-ponto, linhas de construção de 1 px que atravessam a folha e somem, linhas ocultas tracejadas (9/7), seções hachuradas a 45°.
- **Objeto da referência:** uma câmera fotográfica em corte lateral (para-sol, lente com três elementos de vidro, baioneta, sensor, corpo com visor).
- **Rótulos:** IBM Plex Mono 500, 28 px, caixa alta, tracking 0,06 em, chegam por uma linha-guia que se desenha da peça até o texto, que sobe por uma máscara.
- **Cotas:** crescem a partir do número (IBM Plex Mono 700, 32 px), com as setas na ponta.
- **Acento:** `#FFD23F`, só na peça-chave (o sensor), que se enche de baixo para cima.
- **Câmera:** aproxima durante o desenho, abre na explosão, aproxima da peça-chave, volta.

## Tabela de batidas

| Tempo | O que acontece | Duração | Curva |
|---|---|---|---|
| 0,15–1,1 | Linhas de construção disparam pela folha (horizontais, depois verticais) | 0,5 s cada | expo.out |
| 0,6–2,6 | Traços reais se desenham por cima: corpo, lente, baioneta, para-sol, detalhes, vidros; câmera aproxima (1,7–3,15) | 0,4–1,0 s cada | power1.inOut |
| 2,1–2,6 | Linhas ocultas (tracejadas) aparecem; hachura se preenche; linhas de construção somem | 0,5 s | |
| 3,2–4,2 | **Vista explodida:** peças deslizam ao longo do eixo com escalonamento de 0,07 s e assentam com mola amortecida; peças internas atrasam; câmera abre | 1,0 s | power3.inOut |
| 4,2–4,7 | Rótulos chegam por linha-guia (0,12 s entre eles) | 0,4 + 0,5 s | expo.out |
| 4,9–5,85 | Cota geral cresce a partir do número | 0,5 s | expo.out |
| 5,85–6,0 | Rótulos e cota saem (menos o da peça-chave) | 0,3 s | power2.in |
| 6,05–7,35 | Câmera aproxima da peça-chave; ela se enche de amarelo de baixo para cima (6,1), o rótulo fica amarelo, linhas internas aparecem | 0,45 s | power3.inOut |
| 7,0–7,95 | Cota da peça-chave | 0,5 s | expo.out |
| 8,0–9,1 | Câmera recua; amarelo esvazia (8,4) | | |
| 9,0–10,0 | **Remontagem:** peças voltam ao lugar com mola; câmera volta à vista inicial | 0,95 s | power3.inOut |
| 10,45–11,6 | Traços se apagam na ordem inversa; linhas ocultas somem | 0,3–0,6 s cada | power1.inOut |
| 12,0 | = quadro 0 (loop) | | |

## Movimento (medido com `pericia-movimento.py`)

| Medida | Referência |
|---|---|
| Mediana de energia | 0,21 |
| Pico | 2,91 |
| **Amplitude (pico ÷ mediana)** | **14,0x** |
| Em quase-parada | 52 % |
| Picos | 5 (3,5 · 6,5 · 7,0 · 8,5 s) |
| Cortes duros | 0 |

**Metas para a nossa versão:** amplitude ≥ 9,8x · quase-parada ≥ 42 % · pelo menos 2 picos · nenhum trecho parado acima de 1,0 s. É a referência mais exigente até agora: muito silêncio entre socos.

## Permitido e proibido

- Tudo é traço primeiro; preenchimento só na peça-chave, e só amarelo.
- Rótulo chega por linha-guia; cota cresce a partir do número.
- Câmera: panorâmicas power2.inOut de ~1 s; pode aproximar e afastar, nunca tremer.
- **Proibido:** fotos dentro do desenho, sombra suave, brilho, tipografia arredondada, mais de um destaque por vez.

## O que a nossa versão muda (autoral)

- **Objeto no mundo do Felipe:** uma **tecla de teclado mecânico** em corte, explodida na vertical: tecla (keycap côncava com saia), haste em cruz, carcaça superior com paredes hachuradas, mola (a peça-chave, que fica amarela), base com lâmina de contato oculta e dois pinos, placa de circuito com ilhas de solda. Rótulos em português: TECLA, HASTE, CARCAÇA, MOLA, BASE, PLACA. Cotas ilustrativas: 18 (altura) e 12 (mola).
- **Linha oculta de assinatura:** a mola e a parte da haste dentro das carcaças começam tracejadas e viram traço sólido no instante em que as carcaças se afastam e as descobrem.
- Explosão ao longo do **eixo vertical**; rótulos com linha-guia horizontal para a direita; cotas à esquerda com o número dentro do vão.
- Uma primeira versão com um microfone em corte foi descartada a pedido do Felipe (ficou fálica) e não está nesta skill.
- Motor escrito do zero em canvas: um relógio só, `render(t)` desenha o quadro inteiro; caminhos construídos por um mini-construtor próprio (M/L/H/V/arco/curva), amostrados, com comprimento e trecho visível calculados por nós; grades em paralaxe; câmera por quadros-chave.

## Resultado (render de 3 de novembro de 2026, versão da tecla)

`galeria/videos/folha-de-projeto.mp4` (cópia leve; o original em 1920 × 1080 não é distribuído): 12 s, 1920 × 1080, 30 qps, sem som, em loop.

| Medida | Nosso (1280 × 720, como a referência) | Nosso (1920 × 1080, recodificado) | Referência | Meta |
|---|---|---|---|---|
| Amplitude (pico ÷ mediana) | 12,9x | 13,8x | 14,0x | ≥ 9,8x |
| Quase-parada | 56 % | 56 % | 52 % | ≥ 42 % |
| Picos | 5 | | 4 | ≥ 2 |
| Maior trecho sem movimento | 1,0 s | | 1,0 s | ≤ 1,0 s |
| Cortes duros | 0 | 0 | 0 | |

Passa no teste de aceite e no verificador de ritmo (70 mudanças, nenhum corte duro). O último quadro é igual ao primeiro dentro do ruído de codificação (nenhum pixel difere mais de 20 níveis): o loop fecha.

**Aviso sobre a medição em 1080p:** o arquivo saído do render acusa picos falsos nas janelas 0,0 s, 11,5 s e 12,0 s (1,40 · 0,66 · 1,38) que não existem no vídeo (os quadros são estáticos ali) e não aparecem na cópia em 720p nem no mesmo arquivo recodificado em 1080p (13,8x). É um artefato da codificação do renderizador na abertura e no fecho do arquivo, não do filme.

**Ajustes feitos depois do primeiro render da tecla:** a deriva lenta da câmera caiu de 5/4 px para 2/1,5 px (a peça é menor que a câmera da referência, e a deriva pesava nos trechos parados); a explosão ficou ~30 % mais aberta (tecla −330, haste −215, carcaça −100, base +115, placa +215) com a câmera da vista explodida um pouco mais aberta; a aproximação inicial da câmera termina às 2,7 s e a aproximação da mola começa às 6,2 s (com o amarelo às 6,25 s), para os trechos de 3 s e 6 s ficarem realmente parados. Com a deriva original e a explosão original, media 9,3x em 720p (meta 9,8x).

Revisão por frames: os 35 quadros da explosão, os 40 do apagamento e a grade de 4 quadros por segundo da versão final. Não assistido em tempo real.
