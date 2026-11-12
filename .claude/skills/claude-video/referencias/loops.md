# Fazendo uma peça dar loop

Um loop só fica sem emenda se o frame do fim for exatamente o frame do começo.
A maioria das peças de partida em `estilos/` que dizem "não faz loop" pode virar loop com esta lista.

## Lista
1. **Sem entrada.** O frame 0 precisa ser um frame pronto e bonito, não uma página vazia em que as coisas entram voando.
   Empurre a construção para mais tarde, ou comece o relógio no meio de uma pausa.
2. **Um relógio só.** Desenhe tudo a partir de `t` (`STUDIO.play(render, { loop: true })`). Nada lê o tempo real.
3. **Ciclos inteiros.** Toda onda, balanço, flutuação, rotação ou deriva precisa completar um número inteiro de ciclos na duração:
   `Math.sin(2 * Math.PI * n * t / D)` com `n` inteiro. Ache os infratores com
   `grep -n "t \*\|Math.sin(t\|Math.cos(t" index.html`. Uma deriva como `x = t * speed` vira um balanço ou um wrap.
4. **Ida e volta.** Toda mudança única (uma troca de cor, um morph, um zoom, uma contagem) precisa voltar ao valor inicial
   até o fim. Transforme curvas de ida só em subidas-e-descidas, e trave no valor final exato quando um movimento termina.
5. **Dê a volta no ruído.** Grão, tremulação ou frames de partículas que usam índice de frame precisam dar a volta: `frame % totalFrames`.
6. **Reinicie escondido.** Se algo precisa pular de volta (uma nuvem, um contador), faça isso enquanto está fora da tela ou coberto.
7. **Continue se mexendo na emenda.** Algo grande deve estar atravessando o ponto do loop, para nunca parecer uma pausa.
   Rode `ritmo.py --loop`, que mede também o buraco através da emenda.

## Prove
`python3 scripts/loop.py out/draft.mp4 --project proj`
- O Teste A desenha o frame em 0 s e o frame do fim (com o wrap do relógio único desligado) e compara os pixels.
- O Teste B checa que o salto do último frame de volta para o primeiro não é maior que um passo normal entre frames.
Os dois precisam dizer PASSOU.
