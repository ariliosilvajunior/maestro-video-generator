# Ofício do movimento: os números

Use estes quando a ficha de estilo não disser outra coisa. A 30 fps, 1 frame = 0,033 s.

## Tempo
- Um movimento normal: 8 a 18 frames (0,27 a 0,6 s). Mediana de uns 10 frames.
- Um movimento grande de câmera: 0,8 a 1,2 s.
- Escalonamento entre itens: 2 a 3 frames (0,05 a 0,1 s). Mantenha um grupo dentro de 6 frames para ler como um gesto só.
- Segure um estado pronto por pelo menos 0,6 s. Segure palavras o bastante para ler: uns 0,3 s por palavra, 1,2 s no mínimo por linha.
- Algo visível deve mudar pelo menos a cada 1 s. Nos primeiros 3 s, a cada 0,5 a 1 s.
- Nada deve ficar na tela por menos de 0,3 s.
- Um flash (relâmpago, estrobo, frame de impacto) é UM ataque, depois segura ou esvai em 0,3 s ou mais. Sem tremulação:
  dois flashes a 0,17 s de distância leem como glitch, e o check de ritmo reprova.
- Pronto para música: coloque as batidas grandes numa grade de 0,5 s (120 BPM).

## Easing
- Pousando (coisas chegando): power3.out ou expo.out.
- Saindo: power2.in ou power3.in, e mais curto que o pouso.
- Indo de A para B na tela: power3.inOut ou expo.inOut.
- Deriva ambiente: sine.inOut.
- Nunca `none`/linear em algo que o olho acompanha. Linear é só para o relógio mestre.
- Overshoot: no máximo 4% (back.out(1.2)). Sem elástico, a não ser que o estilo peça brincadeira.

## Composição
- Preencha o frame. Formas grandes e confiantes. Nenhum card pequeno flutuando no vazio.
- Margem de segurança: 80 a 120 px num frame de 1920 x 1080.
- Grade de espaçamento de 8 px. 32 px ou mais entre coisas separadas.
- No máximo 6 palavras na tela ao mesmo tempo. Palavras são rótulos, não frases.
- Pendure o texto numa margem. Centralize só quando o estilo mandar.

## O acabamento que separa o bom do ótimo
- Movimento secundário: follow-through, um pequeno assentamento, uma sombra que aperta quando a coisa pousa.
- Paralaxe: camadas próximas se movem mais rápido que as distantes.
- Reveals com máscara para texto (desliza para cima por trás de uma borda), não fades suaves.
- Corte no movimento: comece o próximo plano enquanto algo ainda se move.
- Uma coisa de cada vez recebe a cor de destaque.

## Autoavaliação (faça em toda rodada)
Dê nota de 1 a 10 aos frames em: composição, movimento, tipografia, cor, ideia. Corrija as 3 piores coisas.
Repita até toda nota ser 8 ou mais. Diga as notas em voz alta para a pessoa.
