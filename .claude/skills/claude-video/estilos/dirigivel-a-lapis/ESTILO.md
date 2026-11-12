# Dirigível a lápis
id: dirigivel-a-lapis
Melhor para: história de mascote ou personagem, abertura de post quadrado (Instagram), peça "feita à mão" sobre um projeto ou jornada, cenário que se constrói traço a traço, fecho que vira pintura colorida
Formato: 1600×1600 (1:1), 28,6 s, sem som
Vídeo na galeria: galeria/videos/dirigivel-a-lapis.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: desenho a lápis que vira pintura (referência do X)

*Feita em 3 de novembro de 2026; validado pelo Felipe no mesmo dia. Referência: post de @mickeyxfriedman no X (status 2115932308138287552), baixado para a perícia (28,6 s, 1600 × 1600, 30 fps, sem áudio). O autor diz que desenhou tudo "com Opus 5.5 em JavaScript puro", sem gerador de imagem.*

**Como renderizar de novo:** dentro de `projeto/`, `npx hyperframes@0.8.181 render . -o final.mp4 -q high`. A cena inteira (geometria, cores e ordem do lápis) está em `cena.js`; o relógio, o traço, a câmera, o lápis e a onda de cor estão em `motor.js`. A mesma geometria serve para o traço e para a pintura.

## Mecanismo em uma frase

Um lápis desenha em traço preto, sobre papel claro, uma construção cheia de detalhes; a câmera começa colada num detalhe e vai seguindo o lápis enquanto a cena cresce, abre para o desenho inteiro e, numa onda da esquerda para a direita, tudo vira uma pintura colorida de pôr do sol.

## Batidas

| Tempo | O que acontece | Câmera |
|---|---|---|
| 0 a 2 s | Duas cúpulas já desenhadas; o lápis faz plataforma e escoras | Bem fechada (cerca de 3x), quase parada |
| 2 a 8 s | Pernas, escadas e grades; a construção desce | Segue o lápis e recua devagar (cerca de 2x) |
| 8 a 14 s | Escada em zigue-zague, andares de cima, bichinhos, torre da direita | Sobe junto com o lápis |
| 14 a 19,5 s | Topo: cata-ventos, antena, balões presos por fios, bandeiras | Fica no topo (cerca de 1,6x) |
| 19,5 a 20,5 s | O lápis termina os últimos traços enquanto a câmera abre rápido para o desenho inteiro; o lápis sai | Recuo rápido até 1x (pico de movimento do vídeo) |
| 20,9 a 22,2 s | Onda de cor da esquerda para a direita, borda ondulada e inclinada (o alto chega antes), com faixas claras azuladas na frente | Parada |
| 22,2 a 28,6 s | Pintura pronta, parada | Parada |

Nenhum corte duro: é um plano só.

## Design

- **Papel:** `#faf9f5`, com textura quase invisível.
- **Traço:** preto, de largura quase constante, pontas levemente afinadas, sobreposições pequenas nos cantos (jeito de mão). Duplo nas bordas de tábua.
- **Lápis:** stylus preto e comprido, ponta cinza, inclinado com a ponta para cima e à esquerda, sombra suave deslocada para baixo e à direita.
- **Pintura final:** céu `#2340e0` → `#2a46f2` → lilás `#b47fe5` → rosa `#e082cb` → pêssego `#ffb8a3` → laranja `#ffa769`; nuvens rosadas em faixas; estrelas e lua; floresta em camadas de copas recortadas (azul-marinho, verde-azulado, árvores rosa, troncos roxos, vaga-lumes); madeira vermelho-alaranjada, cúpulas de vidro azul, lâmpadas acesas, trepadeiras verdes. Contorno escuro em tudo.
- **A pintura acrescenta coisas** que o traço não tem: o céu, a floresta, trepadeiras, luzes e bichinhos a mais.

## Movimento (medido)

```
mediana 8,59 | pico 18,89 | amplitude 2,2x | em quase-parada 24 %
pico maior: 20,0 s (a câmera abre)
```

Metas para a nossa versão: amplitude ≥ 1,5x, quase-parada ≥ 25 %, pelo menos 9 picos, sem corte duro (a referência não tem).

## O que a gente copia

O método inteiro: desenho traço a traço em código, câmera que segue o lápis, recuo final, onda de cor e pintura de pôr do sol com floresta.

## O que é nosso

- **O tema:** a expedição do mascote do Claude Code. Ele chega de dirigível numa ilha flutuante, com telescópio, chapéu de explorador e mochila; a tripulação de mascotes pequenos segura a corda, atravessa a ponte e faz um acampamento.
- **Os desenhos:** dirigível, ilha, observatório, moinho, casinha, ponte, acampamento. Nada da construção da referência (cúpulas geodésicas, tenda, gatos, axolotes, balões-peixe, faixa "AD ASTRA").
- **O mascote:** a mesma grade em pixels usada no 01-editor.

## Resultado medido (render de 3 de novembro de 2026)

28,6 s, 1600 × 1600, 30 fps, sem áudio. Arquivos: `mascote-aventura-1600x1600.mp4` e `mascote-aventura-compartilhar.mp4`.

| Medida | Nosso | Referência | Meta |
|---|---|---|---|
| Amplitude (pico ÷ mediana) | 3,4x | 2,2x | ≥ 1,5x |
| Picos | 10 | 14 | ≥ 9 |
| Quase-parada | 16 % | 24 % | ≥ 25 % |
| Cortes duros | 0 | 0 | — |

- **Quase-parada abaixo da meta por ruído de compressão:** os 6,3 s finais são uma imagem só. Entre quadros, a maior diferença é de 4 em 255 num pixel (ruído do codificador, invisível), mas o medidor conta isso como movimento. Num render anterior, com o mesmo final, deu 24 %, igual à referência.
- **Regra "mudança a cada 1 s" (pacing_check):** falha nos 6,3 s parados do final, que é exatamente o que a referência faz.
- **Câmera:** desliza atrás do lápis sem tranco (no máximo 35 px por quadro, no recuo final). O lápis encosta na borda em 6 quadros (no máximo 2 % para fora), de passagem, como na referência.
- **Montagem por trechos:** casco, balão e ilha são largos demais para uma câmera tão perto; o lápis monta essas peças da esquerda para a direita, um pedaço de cada linha por vez. O desenho final é idêntico.
- **Medido no nosso abaixo da referência:** a mediana de movimento durante o desenho é menor, porque a referência tem muito mais traço por segundo.
