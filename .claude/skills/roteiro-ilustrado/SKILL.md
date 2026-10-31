---
name: roteiro-ilustrado
description: Especialista em montar os textos (prompts) de IMAGEM e ANIMAÇÃO das cenas dos episódios ilustrados das notícias da Recursos Cognitivos no Google Flow (Nano Banana 2.1 + Omni 1.1 Flash), e o Kit de referência (folhas de personagem, planos fixos de lugar). Use sempre que o assunto for cena de episódio, prompt de imagem/animação do Flow, refazer uma cena, Kit de referência, lugar/cenário, personagem, ou montagem do episódio ilustrado. Para teaser/Reels/anúncio use video-prompt-builder.
---

# Roteiro ilustrado — textos do Flow sem erro

O dono (Arilio) gera as imagens e animações no Google Flow copiando os textos do **Painel do Dono →
Roteiro de Vídeo** (cada cena: obs ABRIR/CRIAR/ANEXAR, "1. Imagem", "2. Animação", situação, "O que saiu errado").
Tudo o que você escrever vai para lá (rota `POST /producao-videos/automacao`, token em Senhas) — nunca só na conversa.

## Antes de escrever qualquer texto
1. Ler a **Memória de erros e acertos**: `GET /producao-videos/aprendizado/automacao` (todos os episódios:
   rejeitados com categoria e nota = NÃO repetir; aprovados = repetir). Depois o episódio e o Kit da conta em
   `GET /producao-videos/automacao`, inclusive o `historico` de cada cena.
2. Ler `docs/episodio-ilustrado/LICOES_CENAS.md` (lições A–G) e `MANUAL_FLOW.md`.
3. Se for episódio novo: pedir ao dono as fichas do ShotDeck (`FICHA_CAMERA_SHOTDECK.md`).
4. Antes de afirmar como uma imagem está, **abrir a imagem** (Drive) — nunca supor.

## Regras que nunca mudam
**Nomes**
- Só o **código real** da imagem nos ANEXAR/ABRIR (`f01-mae`, `f08-mae-hoje`, `c05-consultorio-A`, `p04-caixas-mudanca`).
  Nunca apelido ("Mãe", "Filho Jonas", "Professor AEE"). Época entre colchetes: `f01-mae [anos 80]`, `f08-mae-hoje [hoje]`.
- Usar só nomes que EXISTEM na conta do Flow daquele episódio (Conta A usa `p04-caixas-mudanca` como estilo;
  B/C/D usam `ref-estilo-p04`). Na dúvida, perguntar ao dono o nome exato.
- Cada item diz onde salvar: `Conta X › Kit de referência › 02-personagens|03-cenarios|04-objetos` ou
  `Conta X › <pasta do episódio> › 05-episodios`, com o nome = código da cena.

**Arquivos e textos (regras do dono, 31/10/2026)**
- Refazer = o dono APAGA a imagem/vídeo errado e salva o novo com o **MESMO nome**. Nunca sugerir `-v2`,
  `-antiga`, "renomear a antiga" ou "salvar também como".
- Toda cena tem SEMPRE os dois textos: **imagem** e **animação**. Quando o vídeo dá errado, quase sempre é
  preciso refazer a imagem primeiro — sem o texto de imagem o dono fica travado.

**Estilo** (padrão = a imagem p04): realismo pintado quase foto, grão, rostos realistas. Proibido: desenho limpo,
aquarela, contorno de tinta, cartoon. A referência de estilo é só para pincelada/grão — **nunca** para estado
da parede nem cores.

**Kit primeiro (regra do dono, 31/10/2026)**: nenhuma imagem de cena antes de TODO o Kit pronto (folhas +
planos -A, salvos no Drive). Mapas com quantidades e posições; personagens com idade/altura/condição física
repetidas em toda cena. Ver lições J.

**Época, idade, roupa**
- Cada personagem tem uma época. Cena dos anos 80 só usa personagens dos anos 80; cena de hoje só de hoje.
- Mesma pessoa em outra idade: anexa a folha original como identidade, mantém rosto/pele/cabelo/marcas,
  **roupa da idade nova** (criança de 2 anos não usa a roupa do menino de 6).

**Lugares**
- Todo lugar que se repete tem MAPA FIXO (o que existe e onde, de que lado abre o portão, quantos postes no
  varal, quais roupas em que ordem) e **um plano fixo `cXX-…-A`** no Kit. Toda cena daquele lugar **ABRE o -A**
  e só acrescenta pessoas. Nunca recriar o lugar numa cena. O mapa vai no fim do texto ("PLACE LOCK").
- **Sem plano -B**: editar no Flow mantém a câmera — contraplano por edição não funciona.
- Estado de conservação explícito: lugar novo/de hoje = pintura lisa, nada descascado; lugar velho = gasto.
- Corredor, sala da equipe, palco etc. são lugares próprios — não "a sala de aula".
- Scripts: `docs/episodio-ilustrado/scripts/prompts/lugares.py` (mapas e planos) — rodar só como script.

**Imagem no Flow**
- ABRIR x = clicar na imagem x → "O que você quer mudar?". CRIAR = barra "O que você quer criar?". Nunca colar
  texto de ABRIR na barra de CRIAR.
- Para consertar, editar a imagem errada trocando só o que está errado ("Replace ONLY …, keep everything else").
- Kit primeiro (folhas de personagem e planos -A), depois as cenas.
- Folha de personagem = uma pessoa só; anexo de "layout" serve só para o formato ("NEVER copy the woman…").

**Animação (Omni 1.1 Flash, Frames, 360p)**
- Bloco fixo no início (preservar a ilustração, sem pan, sem revelar fora do quadro, canto inferior direito quieto).
- Um movimento principal + ambiente (poeira, luz). Câmera parada ou aproximação lenta 2–4%.
- Objetos com dobradiça (porta, portão, tampa) ficam PARADOS, a menos que a cena seja abrir — e aí diz o lado.
- Nunca pessoa atravessando portão/porta/objeto. Pés tocam o chão a cada passo, sombra presa ao pé.
- **Se a IMAGEM já tem o problema** (objeto no meio da queda, pés no ar), a animação não conserta:
  corrigir a imagem primeiro (editar) e só depois animar.
- Duração ≈ duração da fala (4/6/8/10 s).

**Formato do texto de animação** (adaptado do doc de prompts Kling do dono, 30/10/2026 — só o que serve a
clipe único, calmo, imagem→vídeo; NADA de câmera na mão, chicote, crash zoom, drone, cortes dentro do clipe):
```
[BLOCO FIXO]
CÂMERA (0–Ns): parada | micro push-in 100→104% | rack focus de A para B — um só, com tempo.
AÇÃO: estado inicial → uma ação → estado final estável (pose em que o clipe termina, para corte seco).
ATUAÇÃO: 1–2 sinais físicos de emoção (aperta os lábios, baixa o queixo, ombros soltam, olhos marejam) —
         nunca só "sorri"/"triste".
LUZ E AMBIENTE: um acontecimento de luz motivado pela fonte que existe (sol na janela anda, chama
         tremula, sombra de folha) + poeira/vapor.
INTEGRIDADE: rosto estável, mãos com 5 dedos, roupa sem artefatos; listar os objetos que NÃO se mexem.
SOM (não vai para o Flow — vira o prompt do MMAudio na montagem): ambiente + 1–2 ruídos da ação.
```
Textura final em toda cena: "raw cinematic imperfect realism, subtle motion blur, natural film grain,
uneven light falloff, lived-in textures" (bate com o estilo p04).

**Ficha de câmera (ShotDeck)** — nos episódios novos, cada cena ganha a linha CÂMERA: plano · composição ·
lente · de onde vem a luz · hora; paleta por episódio; decupagem geral → médio → close na emoção → geral.

## Montagem (erro grave já ocorrido — 31/10/2026)
- Duração de clipe do Flow = trilha de VÍDEO, nunca a do arquivo (áudio é maior). Clipe que escurece no fim:
  cortar antes de congelar. Conferir quadros e brilho dos últimos 5 s antes de entregar. Ver lições I.

## Depois de escrever
- Gravar no Painel preservando `situacao` e `problema` do dono (ler → alterar só texto → regravar). Antes de
  qualquer regravação em massa, salvar um backup do JSON.
- Conferir que nenhum ANEXAR tem nome que não é código e que toda cena de lugar fixo tem PLACE LOCK.
- Responder ao dono em português, curto, dizendo exatamente: o código da imagem a abrir, o que anexar, onde salvar.
