# Showreel em fundo claro

A peça é um showreel de motion designer em papel claro: sete capítulos numerados dentro de uma moldura de estúdio (cantoneiras, mono minúsculo, timecode, BPM), com anotações à mão em caneta vermelha e um pôster suíço que dança no compasso.
Mecanismo: tudo bate a cada 0,5 s (120 BPM), uma bola vermelha atravessa o filme inteiro como fio condutor, e a saída de uma ideia é a entrada da próxima, sem corte seco nem fade.
O que se costuma trocar: o nome e a profissão do fecho ("CLAUDE" e "motion designer"), as frases de até 6 palavras de cada capítulo, as anotações à mão, a ordem dos capítulos e a trilha (`trilha.py` gera `assets/trilha.wav`).
O papel `#F1EEE6`, a tinta `#111` e o único vermelho `#E63022` são do estilo; a fonte é Inter Tight.
O que quebra o estilo: 1) uma segunda cor de acento ou blocos de cor cheia; 2) palavra que aparece em fade ou fora do compasso; 3) perder a bola vermelha ou a moldura de estúdio no meio do filme.
Ritmo medido: variação 10,4x, 52 % em quase-parada, 5 picos, nenhum corte duro.
Nada ficou de fora da cópia do projeto (o maior arquivo é a trilha, 3 MB).
Som gerado em código em `trilha.py`, a −14,9 LUFS; a cópia da galeria não tem áudio.
Sem gravação, foto real ou imagem gerada por IA. Para renderizar de novo, dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.
Mescla de três referências (@stephanlivera e @himanshutwtxs, via prompt-motion.com, e o estilo swiss-kinetic da skill Claude Video 2.0, licença MIT); o nome Claude é marca da Anthropic.
