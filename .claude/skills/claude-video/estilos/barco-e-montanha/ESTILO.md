# Barco e montanha
id: barco-e-montanha
Melhor para: fundo ambiente em loop (tela de espera, intervalo, live), abertura calma de marca, peça "um dia inteiro" sem texto, ilustração em papel recortado para história ou livro, cena de viagem ou natureza
Formato: 1920×1080, 16 s em loop (quadro 0 s = quadro 16 s), sem som
Vídeo na galeria: galeria/videos/barco-e-montanha.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# 17 · Barco na montanha (premium)

**Mecanismo:** o mesmo desenho do 16 (montanha com cúpula, barco no cume, ondas de nível) feito em papel recortado,
atravessando um dia inteiro em loop: manhã, luz dourada, pôr do sol, noite com lua e estrelas, madrugada e de volta à manhã.

## Ficha
- 16 s, 1920 x 1080, 30 fps, loop (quadro 0 s = quadro 16 s), sem som, sem texto.
- Estilo: `paper-world` da skill Claude Video 2.0. Paleta: creme `#F2E8D5`, areia `#E3CBA8`, sálvia `#9CB49A`, sálvia escura `#5E7F6A`,
  verde-petróleo `#2F5D62`, tinta `#2B2B2B`; acento único rosa `#D98C7A` (sol no entardecer, bandeira, brilho do pôr do sol).
- Quatro chaves de luz misturadas só desses tons. O barco saiu do azul por regra do estilo: casco verde-petróleo, velas creme e areia.
- Feito em 3/nov/2026. Brief e storyboard: `projeto/BRIEF.md` e `projeto/storyboard.json`. Tudo desenhado num canvas, como função pura do tempo.

## O que se mexe
| elemento | como |
|---|---|
| terraços de nível | 5 folhas com o contorno da montanha descem 640 px a cada 4 s (`sine.inOut`) e escurecem com a profundidade |
| barco | sobe ±9 px e balança ±2,4°; bandeira 16 ciclos; anéis de ondulação a cada respiração; linha d'água batendo no casco; sombra de contato |
| luz do dia | sol de 3 discos só na metade esquerda (põe-se atrás das serras), lua com crateras e halo só na direita; nunca cruzam o barco |
| sombras | inclinam para longe da luz e se alongam com o sol baixo; filete de luz esquenta na hora dourada |
| câmera | paralaxe de 1 ciclo, sobe e desce, aproxima 10 % no barco (4,2 a 5,8 s) e volta (9,0 a 10,8 s), com profundidade de campo |
| ondulação da madrugada | as serras sobem e assentam de trás para a frente (11,2 a 13,3 s) até o barco |
| céu | nuvens de papel, faixas de pôr do sol que entram só na luz dourada, estrelas de 8 pontas que pousam uma a uma, 2 bandos de pássaros |
| frente | árvores recortadas nas serras e nos morros, samambaias balançando, pólen na luz dourada e de noite |

## Pedidos do Felipe nesta peça
1. "Versão extremamente premium" do 16: virou o dia inteiro em loop.
2. "Mais nesse estilo (paper-world), mantendo nosso desenho": refeita em papel recortado.
3. "Mais detalhes ainda, precisa ficar impecável": árvores, samambaias, nuvens, faixas, estrelas, halo, pólen, sombreado e sombra dupla nas folhas, acabamento do barco.

## Resultado medido (versão final)
| checagem | resultado |
|---|---|
| ritmo (`pacing_check.py --loop`) | PASSOU · maior trecho parado 0,9 s, nenhum corte seco |
| loop (`loop_check.py`) | PASSOU · 0,007 % de pixels diferentes entre 0 s e 16 s; salto da emenda 1,04 (limite 1,70) |
| movimento contra `gallery/videos/paper-world.mp4` (`pericia-movimento.py`) | **reprovou em parte**: amplitude 4,0x (meta ≥ 2,0x, passou); quase-parada 0 % (meta ≥ 25 %) e 5 picos (meta ≥ 6) falharam |

O primeiro rascunho reprovou no ritmo (1,5 s parado de 11,5 a 13 s, de noite); a ondulação da madrugada resolveu.
O teste de movimento pede paradas que um loop ambiente não tem; a peça foi validada pelo Felipe assistindo.

## Autoria (ler antes de distribuir)
Esta peça **não é toda autoral no código**. O `index.html` foi escrito nesta sessão, mas porta funções da peça de referência
`styles/paper-world/index.html` da skill original (licença MIT, Jack Roberts): o corte à mão (`cut`, `noise1`, `hash2`, `vnoise`),
o grão procedural, o pintor de folhas (`sheet`, `shadowOf`, `bigShadow`), as árvores (`treeShape`), as samambaias (`fernCluster`),
as nuvens (`cloudShape`, `capsule`), os pássaros (`birdPath`) e as fórmulas das chaves de luz. O desenho, a cena e o movimento são nossos.
A licença MIT permite o uso, mas pede manter o aviso de copyright junto do código se ele for redistribuído na skill dos alunos.
