# Dirigível a lápis

A peça é um lápis desenhando, em traço preto sobre papel claro, a expedição do mascote: ele chega de dirigível numa ilha flutuante com observatório, moinho, casinha, ponte e acampamento.
Mecanismo: a câmera começa colada num detalhe e segue o lápis enquanto a cena cresce, abre rápido para o desenho inteiro e, numa onda da esquerda para a direita, tudo vira uma pintura de pôr do sol.
O que se costuma trocar: o tema e os desenhos (a geometria inteira está em `cena.js`, em ordem de traço), o personagem, as cores da pintura final (hoje céu azul→lilás→pêssego→laranja com floresta) e o formato (quadrado, pode virar 16:9).
A mesma geometria serve para o traço e para a pintura; a pintura pode acrescentar coisas que o traço não tem (céu, luzes, bichinhos).
O que quebra o estilo: 1) o desenho aparecer pronto ou em fade, em vez de traço a traço com o lápis na tela; 2) câmera com tranco ou que não segue o lápis; 3) a cor entrar de uma vez, sem a onda com borda ondulada e inclinada.
Ritmo medido: variação 3,4x, 10 picos, nenhum corte duro; os 6,3 s finais são uma imagem parada, de propósito.
Nada ficou de fora da cópia do projeto (todos os arquivos têm menos de 25 MB).
Sem gravação ou foto real de ninguém; tudo é desenho em código. Sem som.
Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
O mascote é o do Claude Code (marca da Anthropic); conferir antes de redistribuir.
