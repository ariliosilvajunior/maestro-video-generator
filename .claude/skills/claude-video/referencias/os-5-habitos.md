# Os 5 hábitos

Estes cinco hábitos são o motivo de o resultado parecer feito por um estúdio e não por um prompt preguiçoso.
A skill faz os cinco por você. Aqui está o que é cada um, e de onde ele vem.

## 1. Escolha UM estilo primeiro, e fique nele

Antes de qualquer código, escolha UM estilo em `estilos/` (ou construa um a partir das referências da pessoa).
Um estilo é uma ficha curta: cores em hex, fontes, números de easing, regras de movimento e uma lista de proibições.
Todo plano da peça usa essa mesma ficha. Sem misturar.

Por quê: quando você deixa o visual em aberto, todo modelo cai no mesmo visual padrão
(fundo escuro, glow, gradiente roxo). Uma ficha fixa impede a deriva entre os planos.

Como a skill faz: a Etapa A mostra a galeria e a pessoa escolhe um visual. O `ESTILO.md` dele é colado no brief,
e as cores dele viram tokens CSS no topo do arquivo. Nenhuma cor é digitada em outro lugar.

Fontes:
- O Motion Lab manda banir o visual padrão de IA logo de cara: https://github.com/NovusEdge/motion-lab
- "Trave os tokens de design" num único lugar compartilhado: https://aiartimind.com/how-to-make-motion-graphics-with-claude-opus-5-5/

## 2. Referência real vale mais que adjetivo

"Faça algo elegante e moderno" não quer dizer nada. Um frame real de um filme real diz muito.
Peça de 1 a 3 referências e então descreva COMO elas foram feitas (texto com máscara, câmera lenta,
pausas longas), não só a sensação que passam.

Onde achar boas referências:
- https://savee.com (moodboards de frames de design e motion)
- https://godly.website (o melhor motion em sites reais)
- https://mobbin.com (telas reais de apps, ótimo para demos de produto)
- Filmes de lançamento da Linear, da Apple e do Cursor (busque "<empresa> launch video")

Fontes:
- Uma análise frame a frame do filme de lançamento do Linear Agent (reveals com máscara, pausas longas, easing de arranque rápido):
  https://impractical.ai/launch-videos/linear-agent
- "Ache uma referência e descreva em palavras o método de produção dela":
  https://aiartimind.com/how-to-make-motion-graphics-with-claude-opus-5-5/

## 3. Escreva o brief em números

Transforme cada palavra num número antes de construir:
- duração em segundos, e formato (1920 x 1080 ou 1080 x 1920)
- cores em hex
- easing como nome e segundos (expo.out em 0,6 s), nunca "suave"
- um movimento herói por plano, com a hora em que começa
- uma lista de proibições

A lista de proibições padrão (sempre ligada):
- nenhum gradiente que muda de matiz
- nenhum glow, bloom ou lens flare
- nenhum easing linear em algo que o olho acompanha
- nenhum layout com tudo centralizado
- no máximo uma cor de destaque
- nada cresce a partir do zero (comece em 0,6 a 0,9 com opacidade)

Fontes:
- O brief numérico do Motion Lab: tempos, paleta em hex, valores de easing e mola, lista de planos, um movimento herói por plano:
  https://github.com/NovusEdge/motion-lab
- Proibições para gradientes que mudam, glow e easing linear: https://aiartimind.com/how-to-make-motion-graphics-with-claude-opus-5-5/

## 4. Loops: um relógio só, último frame = primeiro frame

Um loop só parece sem emenda se o fim for de fato o começo. Então:
- Mova TUDO a partir de um relógio só (`STUDIO.play(render)` em `modelos/motion/studio.js`).
  render(t) desenha o frame inteiro a partir de t, e só.
- Todo movimento que se repete usa um número inteiro de ciclos ao longo da duração (`STUDIO.wave(t, 2)`),
  e todo movimento único termina de volta onde começou.
- Para transformar uma peça que não faz loop numa que faz: siga a lista em `referencias/loops.md`.
- Prove: `scripts/loop.py` renderiza o frame em 0 s e o frame do fim e compara os pixels.
  Falha se forem diferentes. Também checa que o salto do último frame de volta para o
  primeiro não é maior que um passo normal entre frames.

Fontes:
- Ajudantes de fase de loop para o primeiro e o último frame baterem: https://github.com/NovusEdge/motion-lab
- O HyperFrames renderiza uma timeline pausada frame a frame, então o mesmo tempo sempre dá a mesma imagem:
  https://hyperframes.heygen.com (ou rode `npx hyperframes docs gsap`)

## 5. Confira frames, não código

Código que parece certo ainda pode ficar errado na tela. Então olhe imagens, nos momentos que importam:
1. Antes do render completo, capture 3 ou 4 frames, cada um uns 0,6 s depois de uma virada de plano, quando as coisas já pousaram (`scripts/frames.sh`).
   Olhe cada um. Corrija o que está fora. Receba um "pode seguir".
2. Depois do render, rode o check de ritmo (`scripts/ritmo.py`):
   nenhum buraco morto maior que 1 s, e nada na tela por menos de 0,3 s.
3. Olhe a folha de contato que ele grava (um frame por segundo).

Fontes:
- "Confira os frames das viradas antes de assistir ao vídeo inteiro": https://aiartimind.com/how-to-make-motion-graphics-with-claude-opus-5-5/
- Frames nas viradas de plano, folhas de contato numeradas, diffs de frame: https://github.com/NovusEdge/motion-lab
- O `snapshot` do HyperFrames captura frames exatos de uma composição: https://hyperframes.heygen.com
