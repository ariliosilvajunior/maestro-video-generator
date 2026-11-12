# Interface escura em 3D

A peça é um aplicativo escuro, grande e sangrando para fora do quadro (a fila de vídeos da semana: "Esta semana", botão "Publicar"), visto por uma câmera 3D que desliza devagar: inclinada e aberta, depois plana e perto, depois virada para dar lugar à manchete "Tudo / publicado."; um cursor verde clica o botão, as cinco linhas são riscadas em cascata, um aviso de concluído flutua acima do app e uma borda de limpeza apaga a lista para recomeçar.
O que se costuma trocar: o que o app lista (cada linha tem miniatura, barras de título e pílula de data), o título, o botão, a manchete e a única cor de acento. As barras-esqueleto ficam no lugar de texto (nunca mais de 6 palavras reais).
O que quebra o estilo: 1) texto por fade suave em vez de subir de trás de uma máscara; 2) quique ou elástico (a câmera é mecânica, sem tremor de mão); 3) vidro desfocado, brilho, gradiente roxo ou laranja sobre preto; 4) interface minúscula.
Ritmo medido: amplitude 10,2x (referência 9,8x), 52 % em quase-parada, 1 pico (a câmera virando com a manchete subindo), nenhum corte duro.
Motor em DOM + CSS 3D (perspectiva real para a câmera inclinada), não em canvas: é o único do conjunto assim.
Nada ficou de fora da cópia do projeto (três arquivos: index.html, motor.js e hyperframes.json).
Sem gravação ou foto real de ninguém; tudo é desenho em código. Sem som.
Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
Motor autoral, escrito do zero a partir da perícia do estilo `graphite-ui` da Claude Video 2.0 (MIT); nenhum código ou texto do autor original.
