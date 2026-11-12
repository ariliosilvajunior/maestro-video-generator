# Folha de projeto

A peça é uma folha de projeto azul em que uma tecla de teclado mecânico se desenha sozinha em traços (linhas de construção primeiro, traços reais por cima, linhas ocultas tracejadas, hachura), explode na vertical em tecla, haste, carcaça, mola, base e placa, ganha rótulos por linha-guia e cotas, a mola se pinta de amarelo com a câmera chegando perto, e tudo se remonta e se apaga ao contrário.
O que se costuma trocar: o objeto e as suas peças (a geometria é um mini-construtor de caminhos em `motor.js`), os rótulos, qual peça é a chave (a única que ganha cor) e as cotas. O eixo da explosão pode ser horizontal.
O que quebra o estilo: 1) preenchimento em mais de uma peça ou em outra cor que não o amarelo; 2) rótulo aparecendo sem a linha-guia se desenhar antes; 3) foto, sombra suave ou brilho dentro do desenho; 4) mais de um destaque por vez.
Ritmo medido em 1280 × 720: amplitude 12,9x (referência 14,0x), 56 % em quase-parada, 5 picos, nenhum corte duro; é a referência mais silenciosa do conjunto (muito silêncio entre os socos). O arquivo saído do render acusa picos falsos na abertura e no fecho em 1080p; recodificado, mede 13,8x.
Nada ficou de fora da cópia do projeto (três arquivos: index.html, motor.js e hyperframes.json).
Sem gravação ou foto real de ninguém; tudo é desenho em código. Sem som.
Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
Motor autoral, escrito do zero a partir da perícia do estilo `blueprint` da Claude Video 2.0 (MIT); nenhum código ou texto do autor original.
