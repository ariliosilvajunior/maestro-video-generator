---
name: claude-video
description: Faz motion graphics com acabamento de estúdio no Claude Code, em português. A pessoa escolhe um estilo numa galeria de vídeos reais (ou cola uma referência própria), responde 5 perguntas e recebe o MP4. O Claude faz a perícia da referência (ritmo, paleta, traço, movimentos de assinatura, medidos em números), mostra cards parados para aprovação, constrói a peça em HTML + GSAP, renderiza com HyperFrames e confere o resultado olhando os frames e comparando o movimento com a referência. Aceita fotos e clipes da pessoa e clipes de IA do Higgsfield (só com a chave dela e depois de mostrar o custo). Use quando a pessoa pedir "faz um motion graphic", "uma abertura pro meu vídeo", "uma vinheta", "um loop pra tela", "um vídeo nesse estilo", "recria esse motion pra X", ou colar um link ou vídeo de referência e pedir algo parecido. Também quando pedir "abre a galeria de estilos" ou "atualiza a skill claude-video".
license: MIT
metadata:
  author: Felipe Borges
  version: "1.0"
---

# claude-video

## Neste repositório (Recursos Cognitivos — instalada em 12/11/2026, a pedido do dono)
- Origem: github.com/Felpborges/claude-video, licença MIT, revisada na versão `ee3dc31` (scripts sem envio de dados;
  rede só para o `npx hyperframes@0.8.181` do render e para o Higgsfield, que é pago e nunca roda sem "sim").
- `$SKILL` aqui é `.claude/skills/claude-video` (dentro do maestro), não `~/.claude/skills/claude-video`.
- **Antes do primeiro uso numa sessão:** `bash $SKILL/baixar-midia.sh` — os vídeos da galeria e as mídias grandes dos
  estilos (~120 MB) não ficam no git; o script baixa da mesma versão revisada.
- **Sessão na nuvem:** o dono não consegue abrir `127.0.0.1`. Em vez de abrir a galeria, mande os vídeos dos estilos
  (`galeria/videos/<id>.mp4`) com SendUserFile, ou uma folha com 1 quadro de cada, e peça o id escolhido.
- **Marca:** cores e fonte da marca vencem as do estilo (azul #2B4872 / #3E69B7, verde-água #56CAC9 só no destaque,
  fonte Goodly — skill `designer-recursos-cognitivos`). Peça de propaganda segue também a skill `propaganda-rc`
  (sem siglas, botões do sistema com as cores originais).
- Nada vai ao dono sem passar pelo revisor (`revisor-montagem` para vídeo montado). Fale em português, curto.

Três etapas: **A. escolher o estilo** (galeria) → **B. cinco perguntas** → **C. construir** (perícia, cards,
peça, frames, render, checagens). Tudo segue os 5 hábitos de `referencias/os-5-habitos.md`: um estilo só,
referência real em vez de adjetivo, brief em números, um relógio só para o loop, e conferir frames, não código.

`$SKILL` abaixo é a pasta desta skill (normalmente `~/.claude/skills/claude-video`).
Crie uma pasta de trabalho nova para cada peça (por exemplo `./video-<nome-curto>/`). Nunca construa dentro de `$SKILL`.

Fale com a pessoa em português do Brasil, em linguagem simples, sem jargão. Diga o que verificou e o que não verificou.

## Antes de começar

Rode `bash $SKILL/scripts/checar.sh` uma vez. Se faltar algo, dê à pessoa o comando de instalação em uma
linha, **peça confirmação antes de instalar** e pare até ela responder. Depois rode a checagem de novo.

Recomende modelo e esforço altos (Opus, esforço alto) para a construção: a perícia sai igual em qualquer
modelo, mas o desenho da cena nova sai mais fraco com modelo menor.

Se a pessoa pedir para **atualizar a skill**: `git -C $SKILL pull --ff-only` (ou, sem git, rode de novo o
instalador `bash $SKILL/instalar.sh`). Depois diga que ela precisa abrir uma conversa nova.

## Etapa A: escolher o estilo

1. Abra a galeria com o script, rodando como um comando normal (ele volta na hora; não precisa de `&`, `nohup`
   nem de rodar em segundo plano por fora):
   `python3 $SKILL/scripts/galeria.py`
   O script serve a pasta só nesta máquina (127.0.0.1) num processo separado que fica no ar por 4 horas,
   reaproveita a galeria se ela já estiver no ar, abre o navegador e imprime o endereço. Diga o endereço também,
   caso não tenha aberto. **Nunca abra `galeria/index.html` direto como arquivo** (com `open`, duplo clique ou
   `file://`): sem o servidor os vídeos podem não carregar. Se a pessoa disser que a galeria abriu vazia, sem
   vídeos ou com um aviso amarelo no topo, rode o script de novo e peça para ela recarregar a página no endereço
   impresso. Se a pessoa só pediu para abrir a galeria, pare aqui depois de abrir.
2. Diga, em uma mensagem curta:
   "Sua galeria de estilos está aberta: <endereço>. Cada tile é um vídeo real feito em código. Aperta
   'Usar este estilo' no que você gostar e cola aqui. Ou me manda de 1 a 3 links ou vídeos de referência seus."
3. Quando a pessoa responder:
   - **Um id da galeria** (como `dirigivel-a-lapis`): leia `$SKILL/estilos/<id>/ESTILO.md`. Essa ficha é a
     perícia pronta da referência (mecanismo, batidas, paleta, traço, metas de movimento). Ela vira lei para a
     peça. O vídeo da referência está em `$SKILL/galeria/videos/<id>.mp4`; o código em `estilos/<id>/projeto/`
     é apoio para consultar como algo foi feito, **não um molde para copiar**: a cena da pessoa é nova.
   - **Referência própria** (link ou arquivo): baixe se for link (`yt-dlp`), faça a perícia completa seguindo
     `$SKILL/referencias/pericia-da-referencia.md` e meça o movimento:
     `python3 $SKILL/scripts/pericia-movimento.py REF.mp4 --json pericia/movimento.json`.
     Escreva `ESTILO.md` na pasta de trabalho no formato de `$SKILL/referencias/formato-de-estilo.md`, com o
     mecanismo em uma frase, paleta em hex, curvas em números e as metas de movimento. Mostre em 5 linhas.
   - **"Escolhe você"**: escolha o estilo que melhor serve o assunto e diga por quê em uma linha.

## Etapa B: as perguntas

Leia `$SKILL/perguntas.md`. Envie o bloco entre as duas linhas `---` como UMA mensagem, palavra por palavra.
Pule o que a pessoa já disse. Aceite "vai" como sim para todos os padrões. Use as perguntas de acompanhamento
só quando precisar.

## Etapa C: construir

1. **Brief em números** (hábito 3). Escreva `BRIEF.md` na pasta de trabalho: tamanho (1920 x 1080 para 16:9,
   1080 x 1920 para 9:16, 1080 x 1080 para 1:1), duração, 30 fps, loop ou não, as palavras exatas, a paleta em hex
   (as cores da marca substituem as do estilo; as regras do estilo ficam), as fontes com os links, as curvas em
   números e a lista do que não pode, sempre ligada: nada de gradiente mudando de cor, nada de brilho, bloom ou
   lens flare, nada de movimento linear no que o olho acompanha, nada de tudo centralizado, nada crescendo do zero,
   no máximo 6 palavras na tela, uma cor de destaque só, nada de chrome falso. Onde a assinatura do estilo escolhido
   contradiz a lista (o brilho de um sol, um widget centralizado), o estilo vence: o vídeo dele na galeria é a prova.
2. **Storyboard.** Escreva `storyboard.json` (cenas com tempos, o que o gráfico faz e de onde vem o material de
   cada uma: `code`, `user_photo`, `user_clip` ou `generate`; veja `$SKILL/exemplos/storyboard.json`). Rode
   `python3 $SKILL/scripts/storyboard.py storyboard.json` e mostre a tabela.
   - Se alguma cena for `generate` (clipe de IA no Higgsfield), a tabela mostra a estimativa de créditos. PARE e
     espere um "sim" claro antes de gastar qualquer coisa. Depois gere cada clipe com
     `python3 $SKILL/scripts/higgsfield.py generate ... --out media/cenaN.mp4 --yes`, um por vez, e olhe 3 frames
     de cada antes de usar. Veja `$SKILL/referencias/midia.md`.
   - Sem clipe de IA, mostre a tabela e siga, a não ser que a pessoa objete.
3. **Cards parados** (o portão principal). Antes de animar, uma página HTML com um card por cena, no tamanho final,
   mostrando o momento-chave de cada uma com as palavras reais, a fonte real, as cores reais e o material já no
   lugar. Gere os cards com o snapshot do HyperFrames e monte uma folha de contato. Mostre à pessoa e pergunte:
   "Os cards estão certos pra eu animar?" Espere o sim. Corrigir aqui é conversa; corrigir depois de animar é retrabalho.
4. **Construir.** `bash $SKILL/scripts/novo-projeto.sh <trabalho>/proj 16x9|9x16|1x1 <segundos> <id do estilo>`.
   Se o estilo tem `projeto/`, o projeto nasce como cópia dele, com a ficha ao lado: aproveite o motor (relógio,
   traço, câmera, acabamento) e troque a cena pelo assunto da pessoa; se a cena dela é outra por completo, apague a
   cena copiada e desenhe a nova por cima do motor. Sem `projeto/`, nasce do modelo em branco. Em todo caso, siga a
   ficha: mesmo mecanismo, mesma paleta, mesmo traço, mesmas batidas, assunto novo. Regras que importam:
   - Um relógio para todo movimento (hábito 4): `STUDIO.play(t => render(t), { loop })` do `studio.js`, ou uma
     timeline GSAP pausada. Mesmo tempo, mesma imagem: sem `Math.random` (use `STUDIO.rng`), sem `Date.now`, sem timers.
   - Fontes: só gratuitas, cada uma carregada por `<link>`; se uma fonte tem link, todas têm
     (veja `$SKILL/referencias/hyperframes.md`). Fonte usada em canvas precisa de um elemento escondido na página.
   - Mídia dentro do desenho (máscaras, cards, formas), nunca embaixo de texto ilegível, nunca em cima de um rosto.
   - Copie as fotos e clipes da pessoa para `<trabalho>/proj/media/`. Nunca mova nem altere os originais.
   - Se precisar fechar em loop e o estilo não fecha, siga `$SKILL/referencias/loops.md`.
5. **3 frames para aprovar** (hábito 5). `bash $SKILL/scripts/frames.sh <trabalho>/proj <t1>,<t2>,<t3>`, cada um
   uns 0,6 s depois de uma troca de cena, quando as coisas já pousaram. Olhe `frames/olhar.jpg`. Dê nota de 1 a 10
   em composição, movimento, tipografia, cor e ideia, como um diretor de motion exigente. Corrija as três piores
   coisas; repita até tudo ficar 8 ou mais. Então mostre os 3 frames e as notas e pergunte: "Pode renderizar?"
   Espere o sim (observações: corrija, frames novos, pergunte de novo).
6. **Render.** `bash $SKILL/scripts/render.sh <trabalho>/proj <trabalho>/out/rascunho.mp4 draft`.
7. **Checagens.** `python3 $SKILL/scripts/ritmo.py <trabalho>/out/rascunho.mp4` (com `--loop` se for loop; nenhum
   trecho parado por mais de 1 s, nada na tela por menos de 0,3 s) e, se for loop,
   `python3 $SKILL/scripts/loop.py <trabalho>/out/rascunho.mp4 --project <trabalho>/proj` (o quadro em 0 s tem
   que ser igual ao quadro do fim). Depois a comparação com a referência:
   `python3 $SKILL/scripts/pericia-movimento.py <trabalho>/out/rascunho.mp4 --contra <vídeo da referência>`
   (amplitude de ritmo, tempo em quase-parada e picos contra as metas da ficha). Leia a folha de contato.
   Se a checagem de ritmo acusar algo que a própria referência faz (confira rodando `ritmo.py` no vídeo dela em
   `galeria/videos/`), não é defeito: o estilo vence. Corrija e renderize de novo até tudo passar. Se reprovar no movimento, o conserto quase nunca é "acelerar tudo":
   é escolher UMA batida para socar e aprofundar as paradas em volta.
8. **Final.** `bash $SKILL/scripts/render.sh <trabalho>/proj <trabalho>/out/final.mp4 high` e rode as checagens
   de novo nele.
9. **Entrega.** Dê o caminho, a duração, o tamanho do quadro, o tamanho do arquivo, o resultado das checagens
   (inclusive quando reprovou e por quê), as notas, e uma linha do que tentaria a seguir. Se o arquivo passar de
   20 MB, faça também uma cópia leve: `ffmpeg -v error -i final.mp4 -c:v libx264 -crf 22 -preset slow -an final-leve.mp4`.
   Depois leia `$SKILL/config.json`. Se `link` não estiver vazio, termine com uma linha:
   "Mais estilos e ajuda: <link_label ou link> <link>". Se estiver vazio, não diga nada sobre isso.

## Regras duras

- Nunca peça, imprima, registre ou comite uma chave de API. Chaves vivem no shell ou num arquivo `.env`.
- Nunca gaste créditos sem mostrar o storyboard com o custo e receber um "sim" claro para aquele plano.
- Nunca anime antes dos cards aprovados. Nunca renderize o final antes dos frames aprovados.
- Nunca cubra um rosto com texto ou gráfico.
- Nunca diga que uma checagem passou sem rodar. Nunca diga que um visual está certo sem olhar um frame.
- Um estilo por peça. Uma cor de destaque. A lista do que não pode vale sempre.
- Só fontes gratuitas. Nunca copie arquivos de fonte para um projeto.
- Da referência se copia método e sensação (mecanismo, ritmo, paleta, traço). Nunca o conteúdo: tema, textos,
  exemplos e marca são sempre da pessoa.
- Nunca desvalorize o trabalho da pessoa nem invente que algo foi verificado.

## Arquivos

- `galeria/` a página da galeria e os vídeos. `scripts/galeria.py` serve a página.
- `estilos/<id>/` os estilos: `ESTILO.md` (a perícia pronta: mecanismo, batidas, paleta, traço, metas de
  movimento, o que não pode), `LEIA-ME.md` (o que trocar e o que quebra) e `projeto/` (o código da peça de
  referência, como apoio).
- `perguntas.md` as perguntas da etapa B (edite à vontade). `config.json` o link opcional do fim.
- `referencias/` os 5 hábitos com as fontes, números de movimento, regras do HyperFrames, como fechar um loop,
  mídia e Higgsfield, formato de estilo, a perícia da referência e o esqueleto de frame.
- `modelos/motion/` o projeto em branco e o `studio.js` (o relógio único).
- `scripts/` checar, galeria, novo-projeto, frames, render, ritmo, loop, storyboard, higgsfield,
  pericia-movimento, portoes.
- `exemplos/` um brief pequeno e um storyboard.
