# Porto de Nova York
id: porto-de-nova-york
Melhor para: cartão-postal de cidade ou lugar, passagem de tempo (pôr do sol→noite) com as luzes acendendo, abertura contemplativa sem texto, peça de viagem ou turismo, fundo ambiente com trilha gerada em código
Formato: 1920×1080, 30 s, com som (trilha sintetizada em código; a cópia da galeria é muda)
Vídeo na galeria: galeria/videos/porto-de-nova-york.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

> Nesta ficha ficou só a versão desenhada (`nova-york-1920x1080.mp4`, `projeto/`): as seções da versão com a foto real saíram, e a foto de Nova York e o `CREDITOS.md` dela não foram copiados.

---

# Perícia: noite de lua no porto de Nova York (referência do skillry.dev)

*Feita em 3 de novembro de 2026. Referência: post de @DemitiyaGeekzen no X (status 2103517910274818523), listado em `skillry.dev/ai-videos/opus-5-5` como `demitiyageekzen-818523`. Baixada em `ref/ref.mp4`: 30 s, 1920 × 1080, 30 fps, com som. O autor diz que o Opus 5.5 fez tudo em código: um shader WebGL2 pinta céu, nuvens, sol, lua e água pixel a pixel, e o pavilhão é desenhado em canvas 2D. O som também é sintetizado (cítara, flauta, água, grilos). O filme é dele; aqui só medimos.*

## Mecanismo em uma frase

Do barco, a câmera assiste ao pôr do sol sobre a cidade, gira devagar pela água vazia até encontrar o monumento, a lua nasce ao lado dele e as luzes acendem de baixo para cima até virar noite.

## Batidas (medidas pelos quadros a 1 por segundo)

| Tempo | Referência | Nossa versão (Nova York) |
|---|---|---|
| 0 a 1,5 s | Abre do escuro | Igual |
| 1,5 a 10,5 s | Pôr do sol: torres à esquerda, serra, margem escura, sol no centro; o pato passa pelo sol | Jersey City à esquerda, guindastes do porto, ponte em arco; a gaivota passa rente ao sol |
| 10,5 a 14,5 s | Primeiro giro (o pico de movimento); o sol fica para trás | Igual |
| 14,5 a 16,5 s | Céu e água da mesma cor; horizonte vazio | Igual |
| 16,5 a 19,5 s | Segundo giro; a margem com árvores entra pela direita | Liberty Island entra pela direita com Manhattan atrás |
| 19,5 a 21 s | O pavilhão no centro, rosa do crepúsculo; a lua nasce atrás das árvores | A Estátua da Liberdade na frente de Manhattan; a lua nasce atrás do porto, ao lado da ponte do Brooklyn |
| 21 a 23,5 s | O pavilhão acende de baixo para cima; o céu escurece | O forte e o pedestal acendem, depois as janelas e a estátua; a tocha acende por último |
| 23,5 a 28,5 s | Noite, lanternas na água, aproximação lenta | Noite, reflexo dourado, balsa laranja cruzando ao fundo, boias piscando, aproximação lenta |
| 28,5 a 30 s | Escurece | Igual |

**Sem nenhum texto na tela** (pedido do Felipe): saem os poemas, o carimbo e a legenda lateral da referência.

## Movimento (medido com `pericia-movimento.py`)

```
mediana 0,77 | pico 6,45 | amplitude 8,3x | em quase-parada 34 %
picos: 0,5 · 11 a 13,5 · 16,5 a 18,5 s | cortes duros: 0
```

Metas para o nosso: amplitude de pelo menos 5,8x, pelo menos 25 % do filme em quase-parada e os dois montes de movimento nos giros. Um plano só, sem corte.

## Design

- **Céu:** degradê por altura; no pôr do sol, rosa com lilás no alto e pêssego no horizonte; depois do sol, violeta com nuvens rosa; no crepúsculo, o cinturão rosa do lado oposto ao sol; à noite, índigo com fiapos.
- **Nuvens:** escamas de ruído torcido num plano do céu, em faixas de cor (sem degradê suave).
- **Água:** nove ondas somadas; o reflexo pega céu, silhuetas e luzes; brilho do sol e da lua em coluna.
- **Silhuetas:** recortes chapados, mais claros quanto mais longe (névoa). À noite, a luz própria substitui a cor.

## Construção

`proj/cena.js` desenha em canvas 2D dois panoramas em graus (o pôr do sol e o da Estátua), com camadas de dia, de noite, de quando cada luz acende e de névoa. `proj/motor.js` tem o shader WebGL2 (céu, nuvens, sol, lua, água, reflexos e halos), a câmera (um giro de 116° em duas ondas e a aproximação final) e a camada de cima (gaivota, balsa e boias). Um relógio só; nada aleatório no tempo.

## Som

`proj/trilha.py` sintetiza tudo, como na referência: piano elétrico em pentatônica de Ré sobre um pad que troca de acorde com a cena (Ré, Si menor no giro, Sol na chegada, de volta a Ré quando as luzes acendem), água batendo no barco, dois gritos da gaivota, buzina de navio ao longe no giro, arpejo de sininhos que sobe junto com as luzes, brilho quente na tocha, buzina curta da balsa e sino de boia à noite. Volume médio igual ao da referência (cerca de -17 dB RMS).

## Resultado (versão de 3 de novembro)

| Medida | Nosso | Referência | Meta |
|---|---|---|---|
| Amplitude (pico ÷ mediana) | 8,3x | 8,3x | pelo menos 5,8x |
| Em quase-parada | 46 % | 34 % | pelo menos 25 % |
| Picos | 11 | 12 | pelo menos 8 |
| Maior trecho sem mudança visível | 0,8 s | — | até 1,0 s |

O que destravou o teste de aceite: a câmera parada nos trechos calmos (o balanço arrastava a textura fina da água), ondas mais lentas e suaves e quatro amostras por pixel na água, que tiraram o cintilar. O forte e o pedestal acendem primeiro para não deixar um vazio entre a chegada e as luzes.

## Pendências

- A revisão foi por quadros e por medição; o vídeo não foi assistido em tempo real, e o som não foi ouvido (só medido).

## Arquivos desta pasta (validado em 3 de novembro, as duas versões)

| Versão | Vídeo | Projeto |
|---|---|---|
| Só desenho | `nova-york-1920x1080.mp4` e `nova-york-compartilhar.mp4` | `projeto/` |

Para renderizar de novo, dentro da pasta do projeto: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`. A trilha sai de `python3 trilha.py` (gera `assets/trilha.wav`).

