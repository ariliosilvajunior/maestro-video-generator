# App de motion com cursor de IA

A peça é um app escuro de motion, desenhado em código, onde um cursor de IA anima um plano de verdade: digita o título, cria os keyframes, puxa a curva, rastreia uma pessoa e prende uma legenda nela.
Mecanismo: um relógio só move título, pontos do caminho e gráfico ao mesmo tempo (mexeu na curva, os três mudam); no fim os painéis se desmontam e um clarão argila corta para o plano em tela cheia.
O que se costuma trocar: o plano animado (hoje uma caminhada ao entardecer com o personagem do editor), o título ("Feito com Claude"), a legenda presa ao rastreador ("5,2 km/h"), o nome na tela e os textos do plano de 5 passos.
A paleta escura e o único acento argila são do estilo; a palavra em serifa itálica é o detalhe de marca.
O que quebra o estilo: 1) tema claro ou nome de programa real; 2) segundo acento na interface ou losango sem clique; 3) curva que não muda o movimento, ou interface miúda demais para ler.
Ritmo medido: variação 7,3x, 45 % em quase-parada, 3 picos, 1 corte duro aos 13 s.
Nada ficou de fora da cópia do projeto (todos os arquivos têm menos de 25 MB).
Sem gravação ou foto real de ninguém; a pessoa que caminha é desenhada em código. Sem som.
Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
O nome Claude aparece no título e no painel (marca da Anthropic); conferir antes de redistribuir.
