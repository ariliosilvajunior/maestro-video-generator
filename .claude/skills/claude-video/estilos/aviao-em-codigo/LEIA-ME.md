# Avião em código

A peça é um A-29 Super Tucano feito só com código (Three.js, geometria própria) num hangar com painel de controles: o cursor mexe na hélice, na capota e nos flaps, troca a pintura em um clique, um controle chamado Estilo passa o 3D para a ilustração chapada, e o avião decola todo desenhado, com o anel amarelo na hélice.
Mecanismo: a ilustração entra por baixo do 3D, do desfoque para o foco, com a câmera avançando; a decolagem obedece à física (corrida, nariz sobe nas rodas principais, só depois o solo) e a câmera acompanha sem perder o chão.
O que se costuma trocar: o objeto (qualquer coisa que dê para construir em 3D e ilustrar em camadas), as legendas do painel e o cartão final ("Do código ao céu"), a pintura e a cor de acento, e as camadas da ilustração em `assets/reais/des-*`.
O que quebra o estilo: 1) trocar o 3D pela ilustração num corte seco; 2) um modelo 3D baixado no lugar da geometria em código; 3) foto real dentro da peça; 4) tirar o cartão final com o crédito.
Ritmo medido: variação 3,1x, 13 % em quase-parada, nenhum corte duro.
A versão com foto real existiu e foi retirada desta skill a pedido do Felipe; as camadas da foto não estão em `projeto/`.
Crédito obrigatório: a ilustração foi tirada de uma foto do A-29B da FAB, CC BY 2.0, de André Gustavo Stumpf (ver `CREDITOS.md` ao lado desta ficha); o crédito está no cartão final. Aparecem marcas da FAB e da Embraer: não apresentar como material apoiado por elas.
Sem imagem gerada por IA, sem gravação ou foto real de ninguém. Sem som.
Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
