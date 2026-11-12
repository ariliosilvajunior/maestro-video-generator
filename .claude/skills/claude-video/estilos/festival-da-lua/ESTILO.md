# Festival da lua
id: festival-da-lua
Melhor para: peça contemplativa de paisagem, "desenho que vira foto" com passagem de tempo (dia→noite), vinheta sem texto para abertura ou intervalo, tema oriental ou nanquim, data comemorativa ou festival
Formato: 1920×1080, 28 s, sem som
Vídeo na galeria: galeria/videos/festival-da-lua.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

> Nesta ficha vale a versão realista (`festival-da-lua-realista-1920x1080.mp4`): a versão só-nanquim de 28 s ficou de fora, e o `projeto-realista/` da origem está aqui como `projeto/`. A coluna "Nanquim" da tabela de batidas continua valendo, porque os primeiros 16 s das duas versões são iguais.

---

# Perícia: o festival da lua em nanquim (referência do Skillry)

*Validado pelo Felipe em 3 de novembro de 2026, em duas versões. Referência: "Tried Opus 5.5 to explain the Mid-Autumn Festival", de @AmberPromptai no X (status 2103793821012345137), listada no skillry.dev: 47,4 s, 960 × 540, 30 fps, com música, feita em canvas. O filme é dele; aqui só medimos. A perícia completa, com a versão de 47 s e as medições, fica na pasta de trabalho original, fora desta skill.*

## Pedido do Felipe

O mesmo motion graphic, **sem nenhum escrito na tela, só o desenho**: saem os títulos, as legendas e os carimbos com letras. Depois ele pediu o corte em 28 s e uma versão realista, em que o desenho vira foto, o sol se põe e a noite chega.

## Mecanismo em uma frase

Uma linha de pincel seco vira uma serra; a tinta enche as montanhas em pontilhado, chegam névoa, nuvens, lua, pássaros e um galho florido, e a vila acende na margem do lago.

## As duas versões validadas

| Arquivo | O que é | Duração |
|---|---|---|
| `festival-da-lua-realista-*.mp4` | Igual até 16,15 s; aí o nanquim vira fotografia, o sol se põe atrás da serra, vem o crepúsculo e a noite com a lua cheia | 28 s |

Os dois: 1920 × 1080, 30 fps, sem áudio.

## Batidas

| Tempo | Nanquim (28 s) | Realista |
|---|---|---|
| 0 a 2,6 s | Gota de tinta e a linha da serra correndo da esquerda para a direita | igual |
| 4,4 a 7 s | A tinta enche os picos do cume para baixo; montanhas azuladas, névoa, linhas de água | igual |
| 7 a 13 s | Nuvens entram pela direita; a lua aparece; o céu fica azul-acinzentado | igual |
| 12 a 18 s | Pássaros cruzam o céu; o galho entra pelo canto e floresce | igual |
| 16,15 a 18,4 s | (segue o nanquim) | A foto se espalha a partir do sol, como tinta molhada, com borda de luz quente |
| 18,6 a 24 s | Poça com o reflexo da lua (22 s) | O sol desce, encosta na serra (21,5 s) e some atrás dela; o reflexo some na água |
| 19,2 a 24,8 s | (nada) | O homem do lampião sai da varanda da casa, desce para a margem e caminha até o lugar dele |
| 22 a 26,6 s | Casa com janela acesa e pessoa com lanterna (24 a 25,6 s) | Crepúsculo rosa e depois noite azul estrelada; casa e lanterna acendem |
| 24,6 a 28 s | Quadro parado com pétalas, lanterna e poça | A lua cheia aparece ao lado do galho, com rastro de luz no lago |

A paisagem do nanquim desliza para a esquerda o tempo todo, mais rápido à frente (medido na referência). Na parte realista, a câmera se aproxima devagar.

## Design

- **Papel:** `#ece5d8`, fibra fina por cima de tudo. **Nanquim:** `#1b160f`, pincel seco com riscos brancos e bordas rasgadas.
- **Montanhas:** pontilhado sólido no cume e ralo na base, que some numa névoa branca.
- **Acento único:** o laranja-avermelhado das flores, da janela e das lanternas.

## Como foi feito

- **Tudo em código, sem arquivo da referência.** `tinta.js` é a caixa de tinta: pincel seco feito de cerdas, riscos brancos que atravessam o traço e pontilhado em que a tinta aparece primeiro onde é mais densa. `cena.js` guarda a geometria medida nos quadros; `motor.js`, o relógio.
- **Parte realista** (`projeto-realista/real.js`): três fotos geradas no Higgsfield (GPT Image 2.5, 2k, 1 crédito cada) a partir do nosso próprio quadro de 17,5 s, por isso picos, galho, casa e homem ficam no lugar do desenho. Os prompts estão em `midia/`. No código ficam a virada, o sol que desce (o sol da foto é apagado e a serra é recortada pela cor), o homem que anda (o homem parado foi apagado das fotos), a lua cheia com o rastro no lago, as luzes respirando e as estrelas piscando.

## Resultado medido (versão de 47 s, mesmo código da de 28 s)

Amplitude de movimento 12,6x (referência 4,4x; meta ≥ 3,1x), nenhum corte duro. A quase-parada dá 77 % contra 11 % da referência, porque a referência é um arquivo pequeno e muito comprimido, e o chiado conta como movimento.

## Para renderizar de novo

Dentro de `projeto/` ou `projeto-realista/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`. Os dois projetos foram testados gerando um quadro (12 s e 22 s) e comparando com os vídeos salvos: iguais, salvo a compressão do vídeo (PSNR de 44,6 e 41,7 dB).

## Pontos em aberto

- As três fotos da versão realista foram geradas por IA no Higgsfield: conferir os termos de uso antes de distribuir os arquivos de imagem na skill dos alunos.
- A versão de 47,4 s (com círculo de pincel e bolo da lua) ficou só na pasta de trabalho original, fora desta skill; ela não foi validada como versão separada.
