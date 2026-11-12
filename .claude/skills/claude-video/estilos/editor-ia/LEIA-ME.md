# Editor com cursor de IA

A peça é uma interface de editor de vídeo, desenhada em código, onde um cursor de IA faz uma edição de verdade: marca silêncios, corta, arrasta cenas, ajusta cor e exporta.
Mecanismo: a câmera mergulha em cada painel enquanto o cursor trabalha, e no fim o programa se desmonta e o vídeo pronto toma a tela.
O que se costuma trocar: o assunto do vídeo editado (hoje é um rapaz no estúdio, desenhado em código), os textos da legenda e do nome, as duas cenas em loop (`neve.js` e `papel.js`) e a cor de acento (argila).
Também dá para trocar o vídeo final por uma gravação real da pessoa (foi feito assim no motion 15 da origem).
O que quebra o estilo: 1) ação sem clique ou cursor que teletransporta; 2) fade suave no lugar de movimento real de câmera; 3) interface pequena demais para ler ou texto em cima do rosto.
Ritmo medido: variação 7,0x, 46 % em quase-parada, no máximo 0,5 s sem movimento.
Nada ficou de fora da cópia do projeto (todos os arquivos têm menos de 25 MB).
Sem gravação ou foto real de ninguém; tudo é desenho em código. Sem som.
Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
O mascote em pixels na linha do tempo é o do Claude Code (marca da Anthropic); conferir antes de redistribuir.
