# Cartazes em risografia
id: cartaz-risografia
Melhor para: anúncio de live, evento ou lançamento em três cartazes, teaser percussivo para Reels, vinheta de abertura com música, qualquer coisa que precise de soco e textura de impressão
Formato: 1920×1080 (16:9), 12 s, em loop, sem som
Vídeo na galeria: galeria/videos/cartaz-risografia.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: risograph (impressão de duas tintas, granulada e fora de registro)

*Feita em 3 de novembro de 2026. Referência: o estilo `risograph` da skill Claude Video 2.0 (a ficha `STYLE.md` e a peça pronta da galeria dela; não distribuídos aqui). A peça é do autor (Jack Roberts, MIT); aqui só medimos. O nosso código é escrito do zero.*

## Ficha da referência

12,0 s · 1280 × 720 no vídeo da galeria (composição em 1920 × 1080) · 30 qps · sem áudio · **em loop**.

## Mecanismo em uma frase

Três cartazes de 4 s impressos em duas tintas (rosa fluorescente e azul) que carimbam na tela no compasso de 120 BPM: cada forma e palavra entra dura como uma passada de impressão, a chapa azul fica 3 a 6 px fora de registro e dá um tranco a cada carimbo, as tintas se multiplicam onde se sobrepõem, e um rolo de barras varre a folha velha para dar lugar à próxima.

## Estrutura (o que está na tela)

- **Papel** `#F5F0E6` com grão fixo (semente), pontinhos de falha de tinta na cor do papel por cima.
- **Duas tintas:** rosa `#FF48B0` (principal) e azul `#0078BF`, cada uma uma camada inteira em multiply; o roxo escuro nasce sozinho na sobreposição. Branco dentro de uma camada = vazado (deixa o papel).
- **Tipo:** Archivo Black em caixa alta, tracking −0,02 em (palavras gigantes penduradas na margem esquerda); Space Mono 700 nos rótulos pequenos (28 px).
- **Cartaz A:** palavra em cima (rosa) e embaixo (azul), disco rosa grande sangrando com disco de retícula azul por cima, faixa de listras azuis, rótulo que troca.
- **Cartaz B:** uma palavra gigante rosa, letra por letra; a chapa azul da mesma palavra em retícula pousa fora e encaixa a 18 px; faixa de listras inclinada que anda a cada batida.
- **Cartaz C:** sol de retícula azul que nasce, anéis rosa com pulsos a cada batida, palavra azul em cima e palavra rosa embaixo com vazado branco cortando os anéis.
- **Marcas de registro** nos cantos, nas duas tintas, para a chapa fora de registro sempre aparecer.
- **Rolo:** três barras azuis e uma rosa varrendo (esquerda→direita, cima→baixo, direita→esquerda), recortando a folha velha sob elas.

## Tabela de batidas (grade de 0,5 s)

| Tempo | O que acontece | Duração | Curva |
|---|---|---|---|
| 0,0 / 0,5 / 1,0 | Cartaz A: disco rosa, palavra 1, palavra 2 carimbam (escala 1,12 → 1, giro ±2° assentando); tranco da chapa azul | 0,25 s | power4.out |
| 1,5 | Disco de retícula azul desliza e gira até encaixar sobre o rosa | 0,5 s | expo.out |
| 2,0 / 2,5 / 3,0 | Faixa de listras revela da esquerda e anda 1,5 período por batida; rótulo sobe pela máscara e troca | 0,4–0,5 s | expo.out |
| 3,5 | **Rolo** varre e limpa a folha | 0,6 s | power2.inOut |
| 4,0 → 4,75 | Cartaz B: letras carimbam uma a uma (0,25 s) | 0,25 s | power4.out |
| 5,0 | Faixa inclinada entra deslizando; anda a cada batida (5,5 … 7,0) | 0,5 s | expo.out |
| 6,0 / 6,5 | Chapa azul em retícula pousa longe do registro e encaixa a 18 px | 0,25 / 0,35 s | power4.out / expo.out |
| 7,5 | Rolo (de cima para baixo) | 0,6 s | sine.inOut |
| 8,0 | Cartaz C: sol de retícula nasce | 0,6 s | expo.out |
| 8,5 / 9,0 | Palavras carimbam | 0,25 s | power4.out |
| 9,5 → 11,5 | Anéis carimbam e mandam um pulso grosso por batida; retícula do sol incha um degrau por batida | | |
| 11,5 | Rolo (direita para esquerda) → volta ao cartaz A | 0,6 s | |

## Movimento (medido com `pericia-movimento.py`)

| Medida | Referência |
|---|---|
| Mediana de energia | 2,94 |
| Pico | 9,80 |
| **Amplitude (pico ÷ mediana)** | **3,3x** |
| Em quase-parada | 8 % |
| Picos | 6 (2,0 · 4,0 · 6,0 · 6,5 · 10,0 · 10,5 s) |
| Cortes duros | 2 (7,0 e 10,5 s) |

**Metas para a nossa versão:** amplitude ≥ 2,3x · quase-parada ≥ 25 % (piso fixo da ferramenta; a própria referência tem 8 %) · pelo menos 4 picos · nenhum trecho parado acima de 1,0 s. É o filme mais percussivo dos oito: cortes no compasso, nunca fade.

## Permitido e proibido

- Formas carimbam duras; **nenhum fade de opacidade**.
- A chapa azul fica 3 a 6 px fora da rosa; tremor de 1 a 2 px só nas batidas.
- Grão fixo com semente (o papel é o mesmo em todo quadro). Mover a chapa, nunca o papel.
- Padrões repetidos andam 1,5 período, não um inteiro (para o passo ler como movimento).
- **Proibido:** gradiente digital limpo, mais de duas tintas, sombra, tipografia fina.

## O que a nossa versão muda (autoral)

- **Textos no mundo do Felipe:** cartaz A "AO / VIVO" com rótulo "TODA QUARTA → ÀS 19H"; cartaz B "CODE" (a palavra gigante em retícula) com "SEM TECNIQUÊS"; cartaz C "NOVO / VÍDEO" com "NO CANAL". A referência anuncia um show ("SAT 9PM", "LIVE", "NEW SOUND").
- Disposição dos discos, ângulos das faixas, direções dos rolos (direita→esquerda, cima→baixo, esquerda→direita), tamanhos e sementes do grão e do tremor são nossos; a sequência de batidas e o compasso são os do estilo.
- Motor escrito do zero em canvas: cada tinta é uma camada inteira desenhada por quadro e composta em multiply sobre o papel; retícula, listras, vazado e rolo calculados por nós; um relógio só, `render(t)`.

## Resultado (render de 3 de novembro de 2026)

`galeria/videos/cartaz-risografia.mp4` (cópia leve; o original em 1920 × 1080 não é distribuído): 12 s, 1920 × 1080, 30 qps, sem som, em loop.

| Medida | Nosso (1920 × 1080) | Nosso (1280 × 720) | Referência | Meta da ferramenta |
|---|---|---|---|---|
| Amplitude (pico ÷ mediana) | 3,4x | 3,4x | 3,3x | ≥ 2,3x |
| Quase-parada | 4 % | 8 % | 8 % | ≥ 25 % |
| Picos | 5 | 5 | 6 | ≥ 4 |
| Maior trecho sem movimento | 0,4 s | | 0,4 s | ≤ 1,0 s |
| Cortes duros | 2 | 2 | 2 | |

Amplitude, picos e cortes batem com a referência. **Quase-parada reprova no teste de aceite (8 % contra um piso fixo de 25 %), mas é exatamente o valor da referência:** o estilo carimba a cada meia batida e nunca descansa; congelar a cena para agradar a medição quebraria o estilo. O verificador de ritmo passa (90 mudanças, nenhum trecho morto, nenhum flash).

**Emenda do loop:** o quadro 0 cai no início do deslize da retícula (tempo de história 1,5 s), como na referência, por dois motivos: o deslize começa fora da tela (emenda suave) e as batidas de 0,5 s ficam alinhadas com a grade de medição. Com a emenda logo depois de um carimbo (0,75 s), as batidas caíam no meio das janelas e a ferramenta contava só 3 picos; com a emenda exatamente num carimbo (0,5 s), o loop abria com um corte. A chapa azul treme 1–2 px a cada batida, inclusive na emenda, por isso o último e o primeiro quadro diferem em alguns pixels da chapa azul; é o tremor do estilo, não uma falha.

Revisão por frames: grade de 4 quadros por segundo e os quadros dos cards. Não assistido em tempo real.
