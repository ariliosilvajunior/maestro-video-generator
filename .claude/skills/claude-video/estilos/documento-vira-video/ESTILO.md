# Documento vira vídeo
id: documento-vira-video
Melhor para: aberturas e showreels de marca em que um documento, pedido ou roteiro vira filme; peças de 10 a 60 s com mergulhos de câmera e volta pelo mesmo ponto
Formato: 16:9 · 32 s · referência a 60 fps (a cópia da galeria roda a 30 fps)
Vídeo na galeria: galeria/videos/documento-vira-video.mp4
Peça de partida: projeto/index.html (loop de 5 s que hospeda o estilo.js; o vídeo da galeria é a peça longa do canal, feita nesse estilo)

---

# Documento vira vídeo · estilo modelado

`[referência]` = medido ou contado num showreel de 32 s, 1920×1080, 60 fps. `[proposto]` = decisão a validar na primeira peça.
Peça de exemplo, já feita neste estilo e aprovada: `galeria/videos/documento-vira-video.mp4 (na skill)`. O projeto que a gerou (HyperFrames, canvas 2D + WebGL2, som sintetizado, conteúdo trocável num JSON) é o ponto de partida mais rápido para uma peça nova.

## 0 · Em uma frase + os três sinais
**O ponto final de um documento desenhado à mão é um portal: a câmera mergulha nele, atravessa um mundo noturno onde a luz vira espectro e o espectro vira filme, e volta pelo mesmo ponto com o documento virado vídeo.**

1. **Palíndromo com viagem no meio:** papel → portal → noite → … → noite → portal → papel. Entrada e saída pelo mesmo ponto, com a mesma câmera ao contrário. Três cortes secos em 32 s (6,6 / 16,7 / 26,3 s); todo o resto é transformação contínua. `[referência]`
2. **Respiração longa, mergulho exponencial:** 55 % do filme em quase-parada e picos curtos. O zoom no portal multiplica a escala de 1 a 190 em cerca de 1,7 s, sempre exponencial (1,2× em 0,4 s, 25× no fim). Amplitude 14,2×. `[referência]`
3. **Tudo é desenho, nada é vídeo:** traço de tinta que treme a 12 quadros por segundo sobre papel, textura de lápis nas cores, ilustrações em lápis de cor, borrão por média de subquadros só nos mergulhos. `[referência]`

## 1 · Beats
### B1 · Papel (abertura, 3 a 4,9 s)
Papel claro com manchas suaves de baixa frequência (cerca de 9 % do lado menor de escala) e uma linha de chão a 73 % da altura. O mascote da marca entra aos saltos pela esquerda (3 pulos em 0,85 s, com rastro) e assenta a 25 % da largura. O documento cai de cima acelerando, com ±5° de giro, pousa no chão com amassada amortecida (0,33 s). A marca surge acima, com logo em escala *back* e o nome letra a letra (cada letra sobe, gira e cresce, 42 ms de intervalo). A frase manuscrita se revela da esquerda para a direita em 0,6 s; a seta se desenha em 0,34 s apontando o documento. O mascote pula quando a marca chega. Conduz: o ponto final do documento, que emite dois anéis finos. Serve para: o pedido ("transforme isso em …"). `[referência]`

### B2 · Mergulho no portal (1,7 s)
Raios radiais (150 a 200 linhas finas, sorteadas de novo a 14 quadros por segundo) aparecem por cima de tudo. A câmera cresce exponencialmente em direção ao ponto final; o ponto vai do lugar dele para o centro da tela conforme a escala passa de 9×. O papel clareia. O mascote inclina e se estica, puxado. Dentro do ponto aparece, nítido, o mundo noturno em miniatura. Corte seco quando o portal cobre a tela. Sem borrão até os últimos 0,4 s. `[referência]`

### B3 · Cosmos e explosão (1,75 s)
Fundo da cor de noite com nebulosa de manchas, estrelas e glifos fantasmas a 25 %. Cinco órbitas inclinadas em 3D, cada uma com uma bolinha correndo; a inclinação muda com o tempo, então as elipses respiram. Bastões coloridos com textura de lápis espiralam até uma estrela de quatro pontas côncavas. A estrela vai de 150 a 2600 px em 0,33 s, com disco claro e uma segunda estrela a 45° atrás; o fundo vira creme. `[referência]`

### B4 · Luz vira espectro (2,6 s)
Corte seco para o papel lavado com raios, 7 quadros. A tela clara **é** o feixe: encolhe de altura (540 a 9 px) e recua até um prisma de vidro desenhado à mão (contorno, volume traseiro, hachura). Raio refratado dentro do vidro, flare de 4 pontas na entrada e na saída. Um leque branco abre em 0,1 s e ganha as seis cores do espectro, em ângulos iguais. O leque se abre num quadrilátero até virar seis faixas horizontais que enchem a tela. É o soco da trilha. `[referência]`

### B5 · Fitas de filme em 3D (4,3 s)
As faixas ganham trilhos perfurados e janelas; cada janela passa de contorno a cor chapada e depois à ilustração. O bloco gira até 7° e recua. As fitas ondulam com fases diferentes, os quadros se separam e viram uma hélice de seis fios ligados por linhas finas. A câmera desce para o eixo enquanto a lente fecha de 50° para 21°, e a hélice vira túnel. Pico de velocidade com profundidade de campo. 3D de verdade (WebGL/Three.js), quadros instanciados. `[referência]`

### B6 · Céu e revoada (3,6 s)
O céu de entardecer (violeta em cima, pêssego embaixo) entra em fade sobre o túnel. Num único quadro, os quadros viram pontos coloridos, que fecham num disco em filotaxia e depois viram glifos escuros (letras do idioma da peça e símbolos do assunto). A revoada passa por bola → diagonal → vale com cauda → faixa; os glifos se ordenam em colunas sobre seis contas esféricas e colapsam numa linha de pontos claros. A câmera inclina para cima e o céu escurece. `[referência]`

### B7 · Fio, anel e alvo (2,4 s)
Corte seco: a linha fica sólida e brilhante, curva e fecha num anel (sorriso, U, anel). Anel interno, estrela, clarão dourado e soco grave. O anel vira um alvo de anéis coloridos com hachura de lápis, em zoom exponencial (razão 1,19 entre anéis, de 118 px a 186 000 px em 1,5 s). O miolo vira um furo que cresce até engolir a tela, com traços radiais coloridos dentro. `[referência]`

### B8 · Lápis e página (4,8 s)
Noite com estrelas finas. Um lápis com o corpo à frente da ponta traça uma linha luminosa: sobe e faz um semicírculo, enquanto a câmera abre de 1,9× para 1×. O lápis cai, o arco achata e vira a borda dourada de uma colina de papel com linhas de texto. Um cartão branco nasce de trás da colina, com halo da cor de acento. A ilustração do cartão (o assunto da peça, em lápis de cor, com legendas manuscritas e setas) se desenha, e o cartão cresce até encher a tela. `[referência]`

### B9 · Grade e volta (2,4 s)
Zoom para fora violento: o cartão vira a célula central de uma grade de centenas de miniaturas (escala de 1 a 0,09 em 0,7 s), com molduras coloridas em anéis concêntricos. A grade deriva inclinada, depois torce e encolhe até virar uma bola e um sol pálido, que vira a estrela do cosmos. Corte seco para o portal visto de fora e zoom para fora: é o inverso exato de B2. `[referência]`

### B10 · Payoff e marca (4,2 s)
O documento levanta, gira no eixo vertical e vira cartão de vídeo com *overshoot*. O mascote pula, com giro e rastro. A barra de progresso enche enquanto a última legenda aparece. Dois cortes verticais dividem o cartão em três; os pedaços voam, encolhem e ganham cor até formar o logo. O nome entra letra a letra em onda, o site entra depois, e tudo segura até o fim. `[referência]`

**Ordem padrão:** B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8 → B9 → B10. Começa e termina no papel. Nunca dois mundos noturnos seguidos sem uma transformação de forma entre eles. Cada beat nasce da última forma do anterior: estrela → tela clara → feixe → espectro → faixas → fitas → túnel → pontos → glifos → linha → anel → alvo → furo → lápis → arco → colina → cartão → grade → bola → estrela → portal. `[referência]`

## 2 · Emendas
| Tipo | Quadros a 60 fps | Condutor | Curva | Por 10 s |
|---|---|---|---|---|
| Mergulho no portal (zoom exponencial e corte) | 100 | o ponto final | exponencial, acelera | 0,3 |
| Corte seco com forma casada | 1 | a forma que sobra (tela clara, linha, portal) | — | 0,9 |
| Forma que vira outra forma, contínua | 15 a 40 | a própria forma | cubic-out ou *back* | 3 ou mais |
| Explosão em branco | 20 | a estrela | in-cubic até o branco | 0,6 |
| Zoom para fora em grade | 42 | o cartão | expo-out | 0,3 |
| Furo que engole a tela | 36 | o miolo do alvo | exponencial | 0,3 |

`[referência]`

## 3 · Movimento (a assinatura)
- Amplitude alvo acima de 9,9× (referência 14,2×). Quase-parada acima de 45 % (referência 55 %). Picos por 10 s acima de 1,3 (referência 1,9).
- **Física:** respirações quase paradas entre mergulhos. Entradas com *back* (logo, cartão), amassadas amortecidas (documento, mascote), zoom sempre exponencial, nunca linear.
- **Câmera:** escala em torno de um ponto, com esse ponto migrando para o centro conforme a escala cresce. Câmera 3D só no beat das fitas (lente que fecha de 50° para 21°).
- **Tremor de traço:** os vértices de toda linha de tinta mudam de ruído a 12 quadros por segundo (semente = piso de t × 12).
- **Borrão:** média de 4 a 8 subquadros num obturador de 1/60 s, só nos mergulhos, explosões e colapsos, e nunca atravessando um corte. Profundidade de campo por jitter de lente entre as amostras.
- **Som:** tom maior (o exemplo usa ré maior). Plucks leves na abertura, riser de ruído que termina seco no corte, sub-drone no cosmos, cintilação no prisma. Batida a 120 BPM em três blocos que coincidem com os cheios (fitas, alvo, grade), whooshes nas emendas, "boings" curtos no mascote e acorde final que decai até o fim. Tudo pode ser sintetizado (numpy/scipy), normalizado perto de −14 LUFS.

```
zoom:      s(t) = smax ^ (k^2,2), k = 0 → 1 no mergulho; ponto → centro com suave(log s / log 9)
volta:     s(t) = smax ^ ((1−k)^2,6)
tremor:    vértice += ruído(semente = floor(t·12)) · 0,12 % do lado menor
estrela:   r = r0 · 30^(in-cubic(k)) em 0,2 a 0,33 s
cartão:    escala X 0 → 1 com back (s = 2,2) em 0,18 s
obturador: quadro = média de N amostras em [t − 1/120, t + 1/120], presas ao trecho do corte
```

## 4 · Design
- **Papel:** cor de papel (o `ink` do tema) com manchas suaves e fibra fina, num buffer pequeno ampliado. Linha de chão fina, tremida.
- **Traço:** tinta escura (o `bg` do tema), 0,4 a 0,5 % do lado menor, pontas redondas. Documento com dobra no canto e barras de texto em cinza.
- **Hierarquia no papel:** marca no topo (logo e nome em peso 700, 5 % do lado menor), frase manuscrita grande (10 % do lado menor), seta, documento a 25 % do lado menor, mascote a 15 %.
- **Noite:** fundo `bg` com nebulosa de manchas gaussianas, estrelas pequenas, órbitas finas, estrela de quatro pontas côncavas com brilho.
- **Lápis:** textura de hachura diagonal sobreposta às faixas, ao prisma e ao alvo (uma textura só, com máscara).
- **Ilustrações:** cartão e miniaturas em lápis de cor sobre branco, contorno fino de tinta, **sem texto dentro da imagem**; as legendas manuscritas são compostas em código, no idioma da peça.
- **Render:** tudo desenhado em código, quadro a quadro, a partir de `t`. 3D só nas fitas.
- **Camadas:** raios de velocidade acima de tudo; o miolo do portal é desenhado em espaço de tela, para ficar nítido em qualquer zoom; a marca e a frase ficam no papel e entram no zoom.

## 5 · Papéis das cores e da tipografia
- **bg:** a noite e a tinta do traço sobre o papel.
- **ink:** o papel e a luz (estrela, feixe, clarões).
- **accent:** o mascote, uma ponta do espectro, a barra de progresso, o sol do cartão. Nunca no papel inteiro.
- **accent2:** a outra ponta do espectro, órbitas, o monte do cartão. O espectro de seis cores nasce da volta longa no círculo de matizes entre `accent2` e `accent`.
- **font:** a da marca, em peso 700 para nome e site. A frase manuscrita usa uma letra de mão (no exemplo, Caveat 700 com contorno leve); na parede, a fonte da marca em itálico pesado. Legendas do cartão em letra de mão fina.

## 6 · O que este estilo nunca faz
- sem zoom linear
- sem corte que não case a forma de um lado com a do outro
- sem borrão em quadro parado
- sem traço perfeitamente estável: a tinta treme sempre
- sem gradiente chapado no papel e sem sombra dura
- sem texto dentro de ilustração gerada: texto é sempre composto e revisado (acentos)
- sem depoimento ou número inventado no cartão
- sem material, nome ou marca de terceiros: frase, marca, mascote, ilustrações e site são da pessoa

## 7 · Como escala para outra duração (3 a 60 s)
- **5 s:** a assinatura da parede: B1 parado → B2 → B3/B4 condensados (estrela, feixe, prisma, espectro, fitas, colapso) → volta → B10 curto (documento vira cartão e volta).
- **10 a 15 s:** B1 curto, B2, B4, B5 curto, B9 (só a volta), B10.
- **30 s:** todos, na ordem padrão (é o exemplo).
- **60 s:** repete B5 e B8 com outro assunto, e uma segunda grade antes da volta.

Fixos: começa e termina no papel; a volta pelo mesmo portal; o documento vira cartão no fim. Mínimo de 4 beats, máximo de 14. `[proposto]`

## 8 · Aceite numérico
| Medida | Mínimo | Referência |
|---|---|---|
| Amplitude | 9,9× | 14,2× |
| Quase-parada | 45 % | 55 % |
| Picos por 10 s | 1,3 | 1,9 |
| Cortes duros por 10 s | ≈ 0,9 | 0,9 |

(os valores vêm de `movimento-alvo.json`; o exemplo mediu 12,1×, 52 % e 5 picos em 32 s)

## 9 · Divergências entre a referência e o estilo
| A referência faz | O estilo faz | Por quê |
|---|---|---|
| Mascote de respingo chapado, desenhado | Mascote da marca; na parede, uma forma geométrica no acento | O mascote é da marca da pessoa |
| Ilustração de planta com legendas em inglês | Ilustração do assunto da pessoa, legendas no idioma dela | Função igual, assunto próprio |
| Alfabetos do mundo na revoada | Letras do idioma da peça e símbolos do assunto | O conteúdo é da peça |
| Três livros coloridos formam o logo | Três pedaços do cartão formam o logo da pessoa | A marca da referência não viaja |
| Espectro de seis cores fixas | Espectro gerado entre `accent2` e `accent` | Cores são papéis do tema |

## 10 · Pendências
- O desenho de 5 s da parede é a assinatura comprimida: dois cortes e um mergulho em 5 s. As metas da seção 8 valem para peças de 10 s ou mais.
- A revoada (B6) e o colapso da grade (B9) ficaram abaixo da referência no exemplo: a revoada com menos densidade e a grade virando bloco em vez de bola. Corrigir na próxima peça.
- Fonte manuscrita: a parede usa a fonte da marca em itálico; numa peça, escolha uma letra de mão local com acentos conferidos.
- Som medido em bandas e picos; timbre aproximado.
- Campo `ref` do `estilo.js` vazio de propósito: nenhum nome de terceiro viaja com o estilo.
