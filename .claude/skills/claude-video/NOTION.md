# claude-video (skill grátis)

*Texto da página do Notion, pronto para colar. A página publicada é
`claude-video · motion graphics com o Claude Code (skill grátis)`; este arquivo é o espelho dela.*

---

Faça motion graphics com cara de estúdio no Claude Code, em português. Escolha um estilo numa galeria de
vídeos reais, responda 5 perguntas e receba o seu MP4. Grátis, no plano normal do Claude.

**Instalar:** copie este link, cole numa conversa do Claude Code e diga "instala essa skill":
https://github.com/Felpborges/claude-video

Mande o link do GitHub, não o da página do Notion: o Claude Code não consegue ler páginas do Notion.

**Plano B, sem o Claude Code** (Terminal no Mac ou Linux, Git Bash no Windows), uma linha só:

```bash
curl -fsSL https://raw.githubusercontent.com/Felpborges/claude-video/main/instalar.sh | bash
```

**Usar:** depois de instalar, abra uma conversa nova e diga "faz um motion graphic pra mim". A galeria abre no
seu navegador.

---

## O que é

Uma skill é uma pasta de instruções e ferramentas que o Claude Code lê. Esta transforma o Claude num pequeno
estúdio de motion. Você fala com ele em palavras simples. Ele escreve o vídeo em código, renderiza o MP4 e
confere o próprio trabalho olhando os frames.

Ela faz duas coisas:

**Motion graphics em código.** Títulos, vinhetas, loops, diagramas, aberturas. Sem filmagem.

**Gráficos com mídia real.** Os mesmos estilos com as suas fotos e clipes dentro. Também pode transformar uma
foto num clipe curto com IA no Higgsfield. Antes de gastar um crédito, mostra o plano e o custo, e espera o seu "sim".

---

## Como funciona

**A. Escolha um estilo.** A galeria abre no navegador, com cada estilo tocando como vídeo real. Aperte
**Usar este estilo** e cole o nome no Claude Code. Ou mande de 1 a 3 links ou vídeos de referência seus.

**B. Responda 5 perguntas** (uma mensagem, cada uma com um padrão):

1. Pra que é (abertura de YouTube, Reels, lançamento, explicação, anúncio, vinheta de aula ou outra coisa) e quanto tempo tem? [12 s, 16:9]
2. O que deve estar escrito na tela? [eu escrevo a partir do seu tema]
3. Fica em loop? [não]
4. Sua marca: cores, fontes, logo? [as do estilo]
5. Mídia real? Suas fotos ou clipes, clipes de IA do Higgsfield, ou nenhuma [nenhuma]

**C. Construir.** O Claude faz a perícia da referência (ritmo, paleta, traço e movimentos de assinatura, em
números), monta o storyboard, mostra cards parados e 3 frames pra você aprovar, renderiza, confere o ritmo e o
loop e compara o movimento do resultado com a referência.

O importante: ele **não copia** o vídeo da galeria. Ele entende o estilo e desenha a **sua** cena nele. Pode
pedir "o mesmo estilo do dirigível, mas uma casa em construção com piscina".

---

## Os 5 hábitos

**1. Um estilo, escolhido antes.** Deixa o visual em aberto e toda IA cai no mesmo padrão (fundo escuro, brilho,
gradiente roxo). Uma ficha de estilo fixa cores, fontes, curvas e o que não pode, pra peça inteira.

**2. Referência real vale mais que adjetivo.** "Moderno e elegante" não diz nada. Um vídeo de verdade diz
tudo. E a skill mede esse vídeo em números em vez de descrever.

**3. Brief em números.** Duração em segundos. Cores em hex. Curvas em números. Um movimento principal por
cena. Uma lista do que não pode.

**4. Loop: um relógio só, último frame igual ao primeiro.** Todo movimento vem de um relógio só. Depois a
skill prova: renderiza o primeiro e o último frame e compara pixel a pixel.

**5. Conferir frames, não código.** Antes do render, 3 frames. Depois do render, checagem de ritmo e
comparação de movimento com a referência.

---

## Instalar em 3 passos

1. Copie o link do repositório (https://github.com/Felpborges/claude-video, o do GitHub, não o desta página),
   cole numa conversa do Claude Code e diga "instala essa skill". O Claude copia a skill, confere a sua máquina
   (Node 22 ou mais novo, ffmpeg, Python 3) e pede confirmação antes de instalar o que faltar. Sem o Claude Code,
   cole a linha do Plano B no Terminal.
2. Só se quiser clipes de IA: crie uma conta em https://console.higgsfield.ai e coloque a chave num arquivo
   chamado `.env` na pasta do seu projeto, numa linha: `HIGGSFIELD_API_KEY=seu_id:seu_segredo`.
   Nunca cole a chave no chat.
3. Abra uma conversa nova no Claude Code e diga: **faz um motion graphic pra mim**

---

## Perguntas frequentes (acréscimos)

**Colei o link desta página no Claude Code e ele não conseguiu ler.** É normal: o Claude Code não lê páginas do
Notion. Mande o link do GitHub e diga "instala essa skill", ou cole a linha do Plano B no Terminal.

**A galeria abriu vazia, sem os vídeos.** Diga no Claude Code: "abre a galeria de estilos". Ele roda o script da
skill (nunca abra o arquivo `index.html` direto) e imprime um endereço; recarregue a página nele. A galeria
desliga sozinha depois de 4 horas; é só pedir de novo.

**Como atualizo a skill?** Diga no Claude Code "atualiza a skill claude-video", ou rode de novo a linha do Plano
B. Ela atualiza o que já está instalado.

---

Feita com HyperFrames (https://hyperframes.heygen.com) e GSAP (https://gsap.com). Todas as fontes são
gratuitas. Licença MIT. A estrutura vem da skill "Claude Video 2.0"; os vídeos, as perícias e os estilos são do
Felipe Borges.
