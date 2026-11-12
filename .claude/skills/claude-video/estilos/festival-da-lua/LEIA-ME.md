# Festival da lua

A peça começa como nanquim em papel: uma linha de pincel seco vira uma serra, a tinta enche as montanhas em pontilhado, chegam névoa, nuvens, lua, pássaros e um galho florido; aos 16 s o desenho vira fotografia, o sol se põe atrás da serra e a noite chega com a lua cheia e o homem do lampião.
Mecanismo: a foto se espalha a partir do sol como tinta molhada, com borda de luz quente, e dali em diante o código move o sol, o homem, a lua, as luzes e as estrelas por cima das fotos.
O que se costuma trocar: a paisagem e os elementos do desenho (`cena.js`), a cor de acento (hoje o laranja-avermelhado das flores e das lanternas), as três fotos finais (dourado, crepúsculo e noite) e os prompts que as geraram, em `midia/`.
As fotos precisam ser geradas a partir do próprio quadro do desenho (hoje o de 17,5 s, em `midia/ref/`), para picos, galho e casa caírem no mesmo lugar.
O que quebra o estilo: 1) qualquer texto na tela; 2) a foto entrar num corte seco ou fade, sem espalhar a partir do sol; 3) pincel limpo e vetorial no lugar do pincel seco com riscos brancos e pontilhado.
Ritmo medido: variação 12,6x, nenhum corte duro; a paisagem desliza para a esquerda o tempo todo e a câmera se aproxima devagar na parte real.
Nada ficou de fora da cópia do projeto (as fotos têm cerca de 5 MB cada). Fotos geradas por IA: as três imagens de `midia/gerados/` foram geradas no Higgsfield (GPT Image 2.5) a partir do nosso desenho; conferir os termos de uso antes de redistribuir os arquivos.
Sem gravação ou foto real de ninguém. Sem som.
Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
A versão só-nanquim de 28 s e a de 47 s não estão aqui; a referência original é de @AmberPromptai no X.
