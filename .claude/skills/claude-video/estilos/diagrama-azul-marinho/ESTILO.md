# Diagrama azul-marinho
id: diagrama-azul-marinho
Melhor para: explicar um fluxo ou pipeline (pedido → plano → código → teste → no ar), arquitetura de agente ou automação, etapas de um serviço, fundo técnico calmo para falar por cima
Formato: 1920×1080 (16:9), 12 s, em loop, sem som
Vídeo na galeria: galeria/videos/diagrama-azul-marinho.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: midnight-grid (diagrama de fluxo em azul-marinho)

*Feita em 3 de novembro de 2026. Referência: o estilo `midnight-grid` da skill Claude Video 2.0 (a ficha `STYLE.md` e a peça pronta da galeria dela; não distribuídos aqui). A peça é do autor (Jack Roberts, MIT); aqui só medimos. O nosso código é escrito do zero.*

## Ficha da referência

12,0 s · 1280 × 720 no vídeo da galeria (composição em 1920 × 1080) · 30 qps · sem áudio · **em loop**.

## Mecanismo em uma frase

Um diagrama de fluxo se constrói nó por nó sobre uma grade de pontos: um pulso azul percorre o fio, entrega o azul ao nó que alcança, a câmera desliza um passo para acompanhar; no fim o pulso volta para casa pelo fio de retorno e o fluxo se desmonta ao contrário.

## Estrutura (o que está na tela)

- **Fundo** `#0B1220` com grade de pontos de 2 px a cada 40 px (`#1E2A44`), que anda com a câmera num ritmo um pouco mais lento (paralaxe).
- **Nós** (5): painel `#111A2E`, borda 2 px `#22304D`, raio 16 px, 600 × 240 px, em zigue-zague (alto, baixo, alto, baixo, alto) sobre um mundo de 4200 px. Dentro: rótulo Inter 700 ~120 px em máscara, pontinho de status no canto superior direito, trilho de progresso de 4 px na base, portas de entrada e saída (círculos de 20 px) nas laterais.
- **Fios** 3 px `#22304D`, ortogonais com cantos arredondados; o **rastro azul** `#3D8BFF` de ~140 px atrás do pulso enquanto o fio se desenha.
- **Um azul só**, e sempre na coisa ativa: borda e trilho do nó atual, pulso, rastro, porta que recebe.
- **Fio de retorno** do último nó ao primeiro, por cima.

## Tabela de batidas

| Tempo | O que acontece | Duração | Curva |
|---|---|---|---|
| 0,2 | Nó 1 ativo (azul); trilho enche | 0,7 s | power2.inOut |
| 0,6 | Câmera desliza para mostrar o par 1–2 | 1,0 s | power3.inOut |
| 0,9 | Fio 1→2 se desenha com o pulso na ponta; nó 1 volta ao apagado | 0,7 s | power2.inOut |
| 1,6 | Nó 2 pousa: limpeza da esquerda para a direita + deslize de 32 px; rótulo sobe pela máscara 0,1 s depois; pontinho estoura | 0,5 s | power3.out / back.out |
| 2,1 / 2,5 | Trilho do nó 2 enche; câmera desliza um passo | 0,7 / 1,2 s | |
| 2,8 … 7,3 | Mesmo ciclo para os nós 3, 4 e 5 (fio 2,8 · 4,7 · 6,6; pouso 3,5 · 5,4 · 7,3; câmera 4,4 · 6,3) | ~1,9 s por nó | |
| 8,6–10,6 | O pulso volta para casa pelo fio de retorno enquanto a câmera volta ao início | 2,0 s | power2.inOut |
| 10,6 | Nó 1 fica ativo de novo; o trilho antigo dele esvazia | 0,45 s | |
| 10,7–11,6 | Desmontagem ao contrário: fio de retorno recolhe; nós 5, 4, 3, 2 saem (limpeza de volta) e cada fio recolhe para a origem | 0,3 s cada | power2.in |
| 12,0 | = quadro 0 (loop) | | |

## Movimento (medido com `pericia-movimento.py`)

| Medida | Referência |
|---|---|
| Mediana de energia | 0,70 |
| Pico | 3,13 |
| **Amplitude (pico ÷ mediana)** | **4,4x** |
| Em quase-parada | 32 % |
| Picos | 4 (5,0 · 9,5 · 10,0 · 12,0 s) |
| Cortes duros | 0 |

**Metas para a nossa versão:** amplitude ≥ 3,1x · quase-parada ≥ 25 % · pelo menos 2 picos · nenhum trecho parado acima de 1,0 s.

## Permitido e proibido

- Diagrama constrói nó por nó: um fio se desenha, depois o próximo nó pousa. Nada aparece sem causa.
- O nó ativo ganha o azul; os antigos voltam ao apagado.
- Câmera desliza calma, um passo de nó por vez; a grade de pontos atrasa um pouco no meio e pousa de volta na grade.
- Curvas: pouso power3.out 0,5 s; deslocamento power3.inOut 0,8 s; fio power2.inOut 0,6 s; saída power2.in 0,3 s; escalonamento 0,05 s.
- **Proibido:** brilho, bloom, flare, bordas neon, gradiente roxo→azul, cartões de vidro com desfoque, anéis de HUD falsos, timecodes, rótulos de canto.

## O que a nossa versão muda (autoral)

- **Tema no mundo do Felipe:** o fluxo de um trabalho feito com o Claude Code: **Pedido → Plano → Código → Teste → No ar**. Número do passo em JetBrains Mono (`01`…`05`) no canto do nó, no lugar do pontinho de status.
- Zigue-zague **espelhado** (começa embaixo), nós de 640 px com passo de 800 px, fio de retorno **por baixo**.
- Motor escrito do zero em canvas: um relógio só, `render(t)` desenha o quadro inteiro; fios como polilinhas com cantos arredondados amostrados (comprimento, ponto no comprimento e trecho visível calculados por nós); grade de pontos em paralaxe; câmera por trechos.
- A sequência de batidas e o ritmo são os do estilo.

## Resultado (render de 3 de novembro de 2026)

`galeria/videos/diagrama-azul-marinho.mp4` (cópia leve; o original em 1920 × 1080 não é distribuído): 12 s, 1920 × 1080, 30 qps, sem som, em loop.

| Medida | Nosso (1920 × 1080) | Nosso (1280 × 720) | Referência | Meta |
|---|---|---|---|---|
| Amplitude (pico ÷ mediana) | 6,1x | 5,9x | 4,4x | ≥ 3,1x |
| Quase-parada | 36 % | 32 % | 32 % | ≥ 25 % |
| Picos | 3 | 4 | 4 | ≥ 2 |
| Maior trecho sem movimento | 0,8 s | | | ≤ 1,0 s |
| Cortes duros | 0 | 0 | 0 | |

Passa no teste de aceite nas duas resoluções e no verificador de ritmo (83 mudanças, nenhum corte duro). O último quadro difere do primeiro em 17 pixels (ruído de codificação, igual à diferença entre os quadros 0 e 1): o loop fecha.

Revisão por frames: os 38 quadros do primeiro fio e do pouso do "Plano" (0,85 a 2,1 s), os 35 quadros da desmontagem (10,55 a 11,7 s) e a grade de 4 quadros por segundo. Não assistido em tempo real.

Correção feita durante os cards: o sinal da câmera estava invertido na primeira leva (os nós saíam pela esquerda); as portas agora aparecem junto com o painel em vez de antes dele.
