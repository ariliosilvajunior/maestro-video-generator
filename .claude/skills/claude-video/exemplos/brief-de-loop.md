# Exemplo de brief: loop "Faz rodar."

O que você diz ao Claude:
> faz um motion graphic pra mim. 16:9, 9 segundos, grade-suica, em loop, palavras "Faz rodar.", padrões do estilo.

O brief que o Claude escreve a partir disso (hábito 3: cada palavra vira um número):

- Formato: 1920 x 1080, 9,0 s, 30 fps, em loop (o frame em 9,0 s = o frame em 0 s).
- Estilo: grade-suica. Fundo #FFFFFF, tinta #111111, grade #E6E6E6, destaque #E4002B. Inter 900, tracking -0.04em.
- Easing: palavras pousam expo.out 0,6 s, saem power3.in 0,35 s, blocos se movem power3.inOut 0,5 s.
- Palavras: "Faz" / "rodar." empilhadas, penduradas na margem esquerda. A última palavra troca: rodar. -> loop. -> pousar.
- O único motivo: o ponto final vermelho. Ele pula de palavra em palavra e achata quando pousa.
- Mapa de beats:
  | tempo | o que se vê | movimento herói |
  |---|---|---|
  | 0,5 | bloco de 3 x 3 peças à direita, uma lacuna | uma peça desliza para a lacuna |
  | 1,5 | última palavra sobe e sai da máscara, palavra nova sobe no lugar | o ponto vermelho pula e pousa |
  | 2,5; 3,5 | as peças seguem deslizando, a lacuna anda num circuito | peça se move |
  | 4,5 | segunda troca de palavra | pulo do ponto |
  | 5,5; 6,5 | peças | peça se move |
  | 7,5 | terceira troca de palavra, de volta a "rodar." | pulo do ponto |
  | 8,5 | o último movimento de peça fecha o circuito da lacuna | o frame agora é igual ao frame 0 |
- Proibições: sem gradiente, sombra, glow, canto arredondado, texto centralizado, segunda cor de destaque, easing linear em coisa que se move.
- Checks: loop.py (0 s vs 9 s precisam bater), ritmo.py (nenhum buraco acima de 1 s, nada abaixo de 0,3 s).

A peça pronta construída a partir deste brief é `estilos/grade-suica/projeto/index.html` (o vídeo dela na galeria é `galeria/videos/grade-suica.mp4`).
