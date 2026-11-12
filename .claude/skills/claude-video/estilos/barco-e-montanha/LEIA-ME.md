# Barco e montanha

A peça é um desenho em papel recortado: uma montanha com cúpula, um barquinho no cume e terraços de nível que descem como ondas, atravessando um dia inteiro em loop (manhã, luz dourada, pôr do sol, noite com lua e estrelas, madrugada).
Mecanismo: cada elemento é uma folha de papel com borda cortada à mão, grão e sombra dupla; a luz muda devagar e nunca para, e tudo é função pura do tempo, por isso o quadro de 16 s é igual ao de 0 s.
O que se costuma trocar: o desenho (montanha, barco, árvores) e o herói pequeno que se mexe, a cor de acento (hoje o rosa `#D98C7A` do sol e da bandeira), a duração do ciclo e a presença de pássaros, pólen e nuvens.
A paleta de creme, areia, sálvia, verde-petróleo e tinta é do estilo `paper-world`; as quatro chaves de luz são misturadas só desses tons.
O que quebra o estilo: 1) texto ou número na tela; 2) bordas vetoriais limpas, sem o corte à mão, ou grão sujo e vinheta pesada; 3) uma segunda cor de acento, verdes ou azuis saturados.
Ritmo medido: maior trecho parado 0,9 s, nenhum corte seco; o loop fecha com 0,007 % de pixels diferentes.
Nada ficou de fora da cópia do projeto (todos os arquivos têm menos de 25 MB). `BRIEF.md`, `STYLE.md` e `storyboard.json` são do projeto de origem.
Sem som, sem gravação, foto real ou imagem gerada por IA. Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
Autoria: o código porta funções da peça `paper-world` da skill Claude Video 2.0 (licença MIT, Jack Roberts): corte à mão, grão, pintor de folhas, árvores, samambaias, nuvens e pássaros. Manter o aviso de copyright da MIT junto do código ao redistribuir.
Na galeria, `estilos.js` diz 12 s para este id; a peça validada tem 16 s.
