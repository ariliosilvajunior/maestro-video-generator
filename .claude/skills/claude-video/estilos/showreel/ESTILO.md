# Showreel em fundo claro
id: showreel
Melhor para: showreel ou portfólio de motion designer, abertura de canal em fundo claro, tipografia cinética em capítulos, vídeo "o que eu sei fazer" para currículo, aula curta de princípios de animação
Formato: 1920×1080, 16 s, com som (trilha gerada em código, −14,9 LUFS; a cópia da galeria é muda)
Vídeo na galeria: galeria/videos/showreel.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: showreel de motion designer (mescla de três referências)

*Feita em 3 de novembro de 2026. Pedido do Felipe: "copie e mescle esses 2 estilos, mais esse da skill swiss-kinetic, e crie um novo motion graphic com fundo claro".*

## As três referências

| | Fonte | Ficha | Prompt |
|---|---|---|---|
| A | @stephanlivera, `prompt-motion.com/stephanlivera-df17a2`, baixado em `ref/stephan.mp4` | 15 s, 1920 × 1080, 60 qps, com som | "make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out." (Opus 5.5, esforço máximo) |
| B | @himanshutwtxs, `prompt-motion.com/himanshutwtxs-5f4b43`, baixado em `ref/himanshu.mp4` | 15 s, 1920 × 1080, 30 qps, com som | o mesmo prompt, em uma tentativa só |
| C | o estilo `swiss-kinetic` da skill Claude Video 2.0 (ficha e peça do autor, não distribuídas aqui) | 14 s, 1920 × 1080, 30 qps | spec em números no `STYLE.md` |

Os filmes são dos autores; aqui só medimos.

## Mecanismo de cada uma, em uma frase

- **A (Stephan):** um showreel em capítulos numerados, cada um mostrando uma habilidade (identidade, curvas, metamorfose de forma, padrões, profundidade, tipo cinético), dentro de uma moldura de estúdio: cantoneiras, rótulos em mono minúsculo, timecode, BPM e compasso. Fecho: faísca + "CLAUDE" + "motion designer" em serifa itálica + rodapé em mono.
- **B (Himanshu):** uma aula de princípios de animação em papel cinza-claro, com anotações à mão e setas ("slow in, slow out", "squash!", "stretch", "stagger: 45ms", "linear = robotic" riscado, "ease in-out ✓", "follow-through", "anticipation") e uma linha do tempo embaixo com marcadores e o nome do princípio andando com a agulha.
- **C (swiss-kinetic):** um pôster suíço que dança no compasso: papel quente com grão, grade 6 × 4 visível que se desenha, Inter Tight 700, um único acento vermelho (a bola que nunca sai), palavras que batem e se fatiam, letras que pulam de linha como notas, peças pretas que deslizam como quebra-cabeça.

## Movimento (medido com `pericia-movimento.py`)

| | Mediana | Pico | Amplitude | Quase-parada | Picos | Cortes duros |
|---|---|---|---|---|---|---|
| A | 2,15 | 19,6 | 9,1x | 39 % | 11,5 · 12 · 12,5 · 13 s | 8 |
| B | 1,11 | 13,4 | 12,1x | 58 % | 3,5 · 4 · 5 · 5,5 · 8,5 · 13 s | 6 |

Metas para a nossa versão (a mais exigente das duas): amplitude ≥ 8,4x, quase-parada ≥ 39 %, pelo menos 4 picos e cortes secos entre capítulos.

## A mescla (o que vem de cada uma)

| Camada | De onde |
|---|---|
| Fundo papel `#F1EEE6` com grão e fibras, tinta `#111`, um só vermelho `#E63022`, grade 6 × 4 visível, Inter Tight, compasso de 0,5 s (120 BPM), palavras que nunca aparecem em fade, desfoque de movimento só no movimento rápido, a bola vermelha como fio condutor, quebra-cabeça de peças pretas | C |
| Estrutura de showreel em 7 capítulos, moldura de estúdio (cantoneiras, mono minúsculo, timecode, BPM, compasso), corrida das seis curvas, metamorfose de formas com satélites, padrão de arcos (Truchet), faísca + nome + "motion designer" em serifa itálica + rodapé | A |
| Anotações à mão com setas, risco no "errado" e visto no "certo", bola quicando com fantasmas de cebola, achatar e esticar, linha do tempo com marcadores e o nome do princípio na agulha, "aberto a novos projetos" no fim | B |

**Decisões nossas:**
- **Fundo claro do começo ao fim.** Os blocos de cor cheia do A (vermelho, azul, preto, verde-limão) viram painéis e formas dentro do papel.
- **Uma cor só de acento:** o vermelho suíço. As anotações à mão do B (azuis no original) viram **caneta vermelha de professor**.
- **Texto em português**, até 6 palavras por tela. "motion designer" fica como a profissão é chamada no Brasil.

## O que não copiamos

As frases dos autores, a ordem exata dos capítulos do A, os blocos de cor cheia, o túnel de pontos 3D do A e a tela escura do B.

## Resultado (render de 3 de novembro de 2026)

`showreel-1920x1080.mp4`: 16 s, 1920 × 1080, 30 qps, com som (trilha em código, `projeto/trilha.py`, −14,9 LUFS). Cópia leve em `showreel-compartilhar.mp4`.

| Medida | Nosso | Stephan | Himanshu | Meta (a mais exigente) |
|---|---|---|---|---|
| Amplitude (pico ÷ mediana) | 10,4x | 9,1x | 12,1x | ≥ 8,4x |
| Quase-parada | 52 % | 39 % | 58 % | ≥ 48 % |
| Picos | 5 | 4 | 6 | ≥ 4 |
| Maior trecho sem movimento | 0,8 s | | | ≤ 1,0 s |
| Cortes duros | 0 | 8 | 6 | |

Passa no teste de aceite contra as duas. A diferença que fica: as referências trocam de capítulo com cortes secos; a nossa troca com a saída de uma ideia virando a entrada da próxima (regra do suíço), sem corte duro. O verificador de ritmo acusou a fatia do CLAUDE (aberta por menos de 0,3 s); ela agora segura aberta até 3,84 s e o verificador passa.
