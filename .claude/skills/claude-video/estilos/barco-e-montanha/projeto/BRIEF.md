# Brief: barco na montanha (versão premium, paper-world)

Nosso desenho (montanha com cúpula, barco no cume, ondas de nível, um dia em loop) no estilo `paper-world`.
A versão anterior, em editorial-paper, está guardada em `versoes/`.

## Em números
- 1920 x 1080, 16.0 s, 30 fps, loop (quadro 16 s = quadro 0 s). Sem texto, sem marca, sem mídia.
- Estilo: `paper-world` (travado). Tudo desenhado num canvas, como função pura do tempo.

## Paleta (hex) e o acento
creme `#F2E8D5` · areia `#E3CBA8` · sálvia `#9CB49A` · sálvia escura `#5E7F6A` · verde-petróleo `#2F5D62` · tinta `#2B2B2B`
· **acento único: rosa `#D98C7A`** (o sol no entardecer, a bandeira do barco, o brilho do pôr do sol).
Quatro chaves de luz, todas misturadas desses tons: manhã → dourada → entardecer → noite → (de volta à manhã).

## O barco (nosso desenho, cores do estilo)
Casco verde-petróleo com dobra mais escura, vela esquerda creme, vela direita areia, mastro em tinta, bandeira rosa tremulando.

## Papel
- Toda borda cortada à mão: facetas de 6 a 13 px com ruído sorteado (função `cut` do estilo).
- Cada folha: filete de luz de 2.4 px no topo, grão e fibras, sombra suave + sombra de contato.
- As sombras se inclinam para longe do sol (de dia) ou da lua (de noite).

## Camadas (de trás para frente)
céu (2 tons da chave) · estrelas de papel · lua · sol (3 discos) · nuvens de papel · serra longe · serra de trás · serra do meio
· barco · montanha (nosso contorno) com **terraços de nível** · lascas de esteira · pássaros · morros da frente (petróleo).

## Movimento
| movimento | números |
|---|---|
| terraços de nível | 5 folhas com o contorno da montanha, descem 640 px a cada 4 s (`sine.inOut`), escurecem com a profundidade |
| barco | bob ±9 px, balanço ±2.4°, preso à respiração; bandeira 16 ciclos |
| esteira | 2 lascas de papel por lado saem do casco e descem pelo contorno |
| câmera | paralaxe 1 ciclo; aproxima 10 % no barco (4.2 a 5.8 s) e volta (9.0 a 10.8 s); profundidade de campo cresce com a aproximação (fundo até 2.4 px, frente até 3.4 px) |
| luz | sol só na metade esquerda (põe-se atrás do flanco), lua só na direita; nunca cruzam o barco |
| ondulação da madrugada | as serras sobem e assentam de trás para a frente: longe 16 px (11.2 s), de trás 24 px (11.5 s), do meio 30 px (11.8 s), barco 14 px (12.2 s); `power2.out` 0.45 s e `back.out(1.3)` 0.6 s; sombra abre no ar |
| céu | estrelas de papel aparecem à noite e balançam; nuvens; 3 pássaros que somem ao anoitecer |
| morros da frente | balanço de 2 ciclos, ±0.7° |

## Beat map
| tempo | luz | herói |
|---|---|---|
| 0 a 4 | manhã | os terraços respiram sob o barco |
| 4 a 8 | dourada → entardecer, brilho rosa | a câmera chega no barco, o sol se põe |
| 8 a 12 | noite | estrelas entram uma a uma, lua com halo; a câmera volta; a ondulação rola pelas serras até o barco |
| 12 a 16 | madrugada → manhã | o sol nasce, volta ao quadro 0 |

## Proibições (do estilo + as da casa)
Sem texto, sem borda limpa de vetor, sem grão sujo, sem vinheta pesada, sem segunda cor de acento, sem verde/azul saturado,
sem Math.random/Date.now, sem linear no que o olho segue. O brilho do pôr do sol e a vinheta leve são assinatura do estilo
(a skill manda o estilo vencer nesse caso).

## Checagens
3 frames com notas ≥ 8 e sua aprovação; `pacing_check.py --loop`; `loop_check.py`.
