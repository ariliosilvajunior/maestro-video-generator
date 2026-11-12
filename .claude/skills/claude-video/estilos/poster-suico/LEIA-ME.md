# Pôster suíço em grade

A peça é um pôster suíço parado, em branco e tinta preta sobre uma grade de 12 colunas, onde só duas coisas se mexem e nunca ao mesmo tempo: a cada segundo uma peça preta desliza para a casa vazia de um bloco 3 × 3, e a cada três segundos a última palavra do título ("Claude / Code / cria → edita → anima") troca como numa esteira enquanto o único ponto vermelho salta para o fim da palavra nova e amassa ao pousar.
O que se costuma trocar: as três palavras (as duas fixas e as três que giram na esteira), a cor do único acento e o formato (16:9 nasce aqui; 9:16 pede o bloco embaixo do título).
O que quebra o estilo: 1) texto entrando por fade em vez de deslizar dentro de máscara; 2) dois movimentos ao mesmo tempo; 3) segunda cor de acento, gradiente, sombra ou canto arredondado; 4) qualquer coisa fora da grade.
Ritmo medido: amplitude 9,1x (referência 7,8x), 47 % em quase-parada, 3 picos (um a cada troca), nenhum corte duro; o último quadro emenda com o primeiro.
Nada ficou de fora da cópia do projeto (três arquivos: index.html, motor.js e hyperframes.json).
Sem gravação ou foto real de ninguém; tudo é desenho em código. Sem som.
Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
Motor autoral, escrito do zero a partir da perícia do estilo `swiss-grid` da Claude Video 2.0 (MIT); nenhum código ou texto do autor original.
