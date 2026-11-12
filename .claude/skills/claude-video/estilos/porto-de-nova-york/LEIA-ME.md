# Porto de Nova York

A peça é o porto de Nova York desenhado em código, sem texto: do barco, a câmera assiste ao pôr do sol sobre Jersey City, gira devagar pela água vazia até encontrar a Estátua da Liberdade na frente de Manhattan, a lua nasce e as luzes acendem de baixo para cima até virar noite.
Mecanismo: um shader WebGL2 pinta céu, nuvens, sol, lua e água pixel a pixel; a cidade é um panorama em graus desenhado em canvas (`cena.js`), com camadas de dia, de noite e de quando cada luz acende; um relógio só, nada aleatório.
O que se costuma trocar: a cidade ou o lugar (os dois panoramas em `cena.js`), a ordem em que as luzes acendem, os detalhes da camada de cima (gaivota, balsa, boias) e a trilha (`trilha.py` gera `assets/trilha.wav`).
As cores do céu por hora (rosa e pêssego, violeta, cinturão do crepúsculo, índigo) são do estilo.
O que quebra o estilo: 1) texto na tela; 2) corte seco ou mais de um plano (é um plano só, com dois giros); 3) água cintilando ou balanço de câmera nos trechos calmos.
Ritmo medido: variação 8,3x, 46 % em quase-parada, 11 picos.
Nada ficou de fora da cópia do projeto (o maior arquivo é a trilha, 5,8 MB). A versão com a foto real, a foto CC BY de John Cunniff e o `CREDITOS.md` dela ficaram na origem, de propósito.
Som gerado em código: piano elétrico, pad, água, gaivota, buzina de navio, sininhos nas luzes e sino de boia, sintetizados em `trilha.py`. A cópia da galeria não tem áudio.
Sem gravação, foto real ou imagem gerada por IA. Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
A referência original é de @DemitiyaGeekzen no X; o filme é dele, aqui só foi medido.
