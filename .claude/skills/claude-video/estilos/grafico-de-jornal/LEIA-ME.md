# Gráfico de jornal

A peça é um gráfico de barras de jornal em papel salmão com grão: cinco barras (Roteiro, Edição, Thumb, Motion, Título), manchete em serifa que troca palavra por palavra ("Cinco no páreo" → "Uma dispara"), e a barra do Motion fica azul, dispara de 29 para 74 com o número grande contando junto, sobe para o 1º lugar, as outras apagam; depois tudo recolhe e recomeça.
O que se costuma trocar: os cinco rótulos e valores, as duas manchetes, o rótulo da chamada ("pontos a mais"), a marca fantasma ("era 29") e o único azul. Números sempre ilustrativos.
O que quebra o estilo: 1) número contando num passo diferente do da barra; 2) segunda cor de acento, gradiente nas barras, pizza ou 3D; 3) texto por fade em vez de máscara; 4) câmera tremendo (o zoom do eixo é o único movimento de câmera permitido).
Ritmo medido em 1280 × 720 (a resolução da referência): amplitude 6,7x (referência 6,0x), 33 % em quase-parada, 2 picos, nenhum corte duro. Em 1920 × 1080 o grão do papel infla a mediana e a medição cai (4,1x, 19 %); por isso a comparação se faz em 720p.
Nada ficou de fora da cópia do projeto (três arquivos: index.html, motor.js e hyperframes.json).
Sem gravação ou foto real de ninguém; tudo é desenho em código. Sem som.
Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
Motor autoral, escrito do zero a partir da perícia do estilo `editorial-paper` da Claude Video 2.0 (MIT); nenhum código ou texto do autor original.
