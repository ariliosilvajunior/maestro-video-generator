# Roteiro completo de um episódio ilustrado — DOC VIVO

> Fonte única do "como se faz" um episódio, do roteiro ao vídeo final. Atualizar a cada episódio:
> o que deu certo vira regra; o que deu errado vai para `LICOES_CENAS.md` e para a Memória de erros do Painel.
> Status: ✅ feito e validado · 🟡 feito à mão (automatizar) · ⬜ ainda não feito (fazer nos próximos).
> Primeira versão: 31/10/2026, na montagem do piloto ("Não havia pediatra na cidade").

## 0. Onde fica cada coisa (Drive "Projetos Videos")
```
Projetos Videos/
  Conta X (e-mail da conta do Flow)/
    Kit de referência/
      00-avatar-narrador/        avatar-arilio-01, avatar_reference_sheet, avatar_entrada.mp4, avatar_saida.mp4
      01-estilo/                 ref-estilo-p04 (padrão), ref-layout-cenario, ref-layout-personagem
      02-personagens/            f01-…, f02-… (folhas de 1 pessoa, várias vistas)
      03-cenarios/               c01-…-A (plano fixo de cada lugar) + folhas
      04-objetos/                obj-01-… (objetos que se repetem)
      05-referencia cores-lentes/ fichas do ShotDeck (print com os dados: cor, lente, luz, época…)
    RC – Notícias NN - "título"/
      06-audio/                  narração do episódio (mp3) + cortes por cena aNN.mp3
      07-episodios/              imagem e vídeo de cada cena: pNN-… .png/.jpg e .mp4 (MESMO nome para os dois)
      08-kit-vestuario/          ⬜ roupas por personagem e época (a definir — ver §2)
```
Regra de nome: refazer = apagar o errado e salvar o novo com o **mesmo nome**. Código da cena sempre no nome.
O Painel (Roteiro de Vídeo) lê essas pastas ao vivo e marca 🖼 ✓ / 🎬 ✓ em cada cena.

## 1. Notícia → narração ✅
1. A notícia publicada (noticias.recursoscognitivos.com.br) vira podcast (áudio do dono). 🟡
2. Baixar a narração para `06-audio`. 🟡 (Claude: `GET /producao-videos/drive/pasta/{id}` + `/drive/arquivo/{id}`)
3. Transcrição palavra por palavra: fal.ai Whisper (chunk_level word) → `words.json`. ✅ (`scripts/transcricao_whisper.py`)
4. Cortar em cenas de 2–10 s nas pausas → `cuts.json` `[n, início, fim, duração, clipe_s]`. ✅ (`scripts/corte_audio_cenas.py`)

## 2. Kit de referência (antes de qualquer cena) ✅ regras / 🟡 geração no Flow
- Estilo: a imagem p04 é o padrão (realismo pintado quase foto, grão). Nunca desenho limpo/aquarela/cartoon.
- Personagens: uma folha por pessoa e por **época/idade**; roupa da idade; código real `fNN-nome` (nunca apelido).
  - Pessoa de outra idade: anexar a folha original como identidade; só a idade e a roupa mudam.
- Lugares: MAPA FIXO por lugar (o que existe e onde, lado do portão, varal com N postes e roupas em ordem) +
  **um** plano fixo `cXX-…-A`. Toda cena do lugar ABRE o -A. Sem plano -B (editar não muda a câmera).
  Estado de conservação explícito (novo = pintura lisa; velho = gasto).
- ⬜ `08-kit-vestuario`: folha de roupas por personagem e época (ainda não existe — criar no próximo episódio
  para cortar erros de roupa: casaco com estampa da camiseta, mãe de hoje em cena dos anos 80).
- Scripts: `scripts/prompts/kits.py`, `lugares.py`.
- ✅ Checklist do Kit "nos mínimos detalhes" (31/10, lições K) — só depois disso a 1ª cena:
  1. A família/época da notícia foi avaliada (mesma história → mesma família; assunto novo → personagens novos e diferentes).
  2. Uma folha para CADA pessoa citada (inclusive bebê/irmão), com idade, altura, roupa e mãos.
  3. Um plano -A para cada lugar, no estilo p04, com mapa contado (cadeiras e cor, plantas, porta e janela de que lado).
  4. Lugar realista (mesa de adulto para os pais; berço no quarto, longe do fogão).
  5. Tudo salvo no Drive e marcado ✓ no Painel (⛔ "Kit incompleto" some).

## 3. Ficha de câmera e cor (ShotDeck) 🟡
- O dono escolhe quadros no ShotDeck e salva o print em `05-referencia cores-lentes`.
- Do print usamos: COR (paleta), FRAME SIZE, LENS SIZE, COMPOSITION, LIGHTING/TYPE, TIME OF DAY, TIME PERIOD, SET.
  Nunca diretor/ator/filme no texto.
- Piloto (31/10): fichas usadas = No Country for Old Men (anos 80, deserto, luz dura de dia), Opus (quente,
  saturado, amarelo), Highway (quente, dessaturado, 35mm), Empire of Light (anos 80, interior noturno, luz prática,
  quente + ciano). Viraram a cor do episódio na montagem (§7): quente, levemente dessaturado, contraste leve,
  grão 35mm, vinheta.
- ⬜ Nos próximos: a ficha entra também no TEXTO de cada cena (linha CÂMERA) — ver `FICHA_CAMERA_SHOTDECK.md`.

## 4. Textos de cena (imagem + animação) ✅
- Toda cena tem SEMPRE os dois textos. Formato da animação (skill `roteiro-ilustrado`):
  CÂMERA (uma só) · AÇÃO (início → ação → pose final) · ATUAÇÃO (sinais físicos) · LUZ motivada · INTEGRIDADE
  (rosto, 5 dedos, roupa, objetos que não se mexem) · SOM (vai para a montagem, não para o Flow).
- Antes de escrever: ler a Memória de erros e acertos (`GET /producao-videos/aprendizado/automacao`).
- Tudo gravado no Painel; o dono copia de lá.

## 5. Geração no Google Flow 🟡 (dono, à mão — créditos grátis)
- Imagem: Nano Banana 2.1 (0 crédito). ABRIR = clicar na imagem → "O que você quer mudar?"; CRIAR = barra de baixo.
- Vídeo: Vídeo → Frames → 16:9 → Omni 1.1 Flash → 360p → duração da cena → x1 (10 s = 7 créditos; 50/dia/conta).
- Avaliar cada imagem e cada vídeo no Painel (caixas separadas, nota obrigatória ao rejeitar).
- Se o vídeo erra porque a IMAGEM já tem o problema (objeto no meio da queda, pé no ar): refazer a imagem antes.
- ⬜ Automatizar com a extensão Claude no Chrome (teste de 1 cena feito; falta o fluxo completo).

## 6. Avatar do narrador ✅ fala / ✅ entrada / ✅ saída
- Fala: fal.ai H3 Max Lip Sync 480P, foto com fundo verde (#00FF00), pedaços de 5–15 s nas pausas
  (`scripts/avatar_h3max.py`) → `avatar_fala.mp4`. ~US$ 0,05/s (~R$ 51 por episódio de 3 min).
- Entrada: Flow Frames, Início = fundo verde vazio, Fim = a mesma foto da fala, 4 s → `avatar_entrada.mp4`. ✅ piloto
- ✅ Saída (piloto, 31/10): Flow Frames, Início = foto da fala (Av02_fim_sentado), Fim = fundo verde vazio (Av03_inicio_vazio), 4 s → `avatar_saida.mp4`. Entrada e saída valem para TODOS os episódios (mesma foto).
  Texto pronto (copiar):
  `One single continuous shot, no cuts, static camera. Pure flat green screen background (#00FF00) the whole time, no floor, no shadows, no furniture, no props appear. The man from the start frame unclasps his hands, stands up from behind a table that stays below the bottom edge of the frame (never visible), turns to his right and walks out through the right edge of the frame, leaving only the empty green background, ending exactly like the end frame. Natural, unhurried movement, realistic body and hands, same face, glasses, beard and navy t-shirt with the logo. Seen from the waist up. No camera pan, no zoom. No text, no music, no dialogue.`
  Sem esse arquivo, a montagem faz o avatar sumir suave (0,8 s) — foi assim no piloto.
  ⚠️ (31/10) A 1ª saída cortou a cabeça: a foto ocupava o quadro todo e, ao levantar, a cabeça saiu pelo topo.
  Correção: Início = `Av04_saida_inicio` (pessoa com 720 px, encostada embaixo, folga de 360 px em cima),
  Fim = `Av05_saida_fim_vazio`; no texto, "the top of his head stays inside the frame the whole time".
  Na montagem: `"saida_quadro": [1067, 600, 1107]` no `episodio.json` (o sentado fica do mesmo tamanho da fala).
- ⚠️ (31/10) O avatar SUMIA ~0,15 s ao levantar: a fala (195,84 s) era mais curta que a narração (195,97 s) e
  a saída começava no fim da narração. Correção no script: a saída começa no último quadro da fala e a fala
  congela o último quadro até lá. Conferir quadro a quadro (10 por segundo) a passagem fala → saída.
- Posição fixa (não mudar sem o dono pedir): quadro 400×400 em 1920×1080, `overlay=W-w-80:H-h+25`.
  Entrada/saída sem recorte: escala 711×400, `overlay=1284:H-h+25` (entra/sai pela borda direita da tela).

## 7. Montagem (Claude, automática) ✅ — `scripts/montar_episodio.py <pasta>`
Entradas: `narracao.mp3, cuts.json, words.json, clipes/pNN.mp4, avatar_fala.mp4, avatar_entrada.mp4,
[avatar_saida.mp4], musica.mp3, [amb/aNN.wav], episodio.json` (título, subtítulo, cor, frases-chave, correções).
1. Cada cena no tamanho da fala: estica até 1,6× mais lento e congela o último quadro se faltar.
   ⚠️ ERRO GRAVE já ocorrido: medir a duração pela trilha de VÍDEO (o clipe do Flow tem áudio maior que a imagem);
   clipe que escurece no fim → `cortar_fim_clipe` no `episodio.json`. Conferir brilho dos últimos quadros.
2. Fusão de 0,5 s entre cenas; cor do episódio (§3): `eq` + `colorbalance` + grão (`noise`) + `vignette`.
3. Linha do tempo: entrada do avatar (4 s) → narração começa → fala → saída/some → 1,5 s de respiro → fade.
4. Legenda documental: Liberation Sans 46, margem esquerda 100 / direita 520 (não cobre o avatar) / baixo 55,
   até ~34 caracteres por linha; correções de nome (`Arilho` → `Arilio`).
5. Título serifado na abertura (sobre a entrada), nome "Prof. Arilio" + "Recursos Cognitivos" sem caixa,
   frases-chave em destaque (achadas sozinhas no texto da narração).
6. Som: narração atrasada pela entrada; música a 0,20 com ducking (sidechain) sob a voz; ambiente por cena
   (MMAudio a partir do próprio clipe, normalizado ~-30 LUFS, 0,9); whoosh sintetizado em cada fusão.
7. Fade de entrada 0,6 s e saída 1 s.
- ✅ Ambiente MMAudio para todas as cenas: `scripts/gerar_ambiente.py <pasta>` lê `sons.json` (um texto de som por
  cena) e gera `amb/aNN.wav` a partir do próprio clipe (~US$ 0,01 por cena). ⬜ Próximo: `sons.json` sair sozinho
  da linha SOM de cada cena no Painel.
- ✅ Clipes e avatar baixados direto do Drive pelo Painel (token): `GET /producao-videos/drive/pasta/{id}` e
  `/drive/arquivo/{id}` — sem pedir permissão arquivo por arquivo.
- ✅ Aproximar uma cena sem gerar imagem nova: `"recorte": {"15": [cx, cy, zoom]}` no `episodio.json` (centro em
  fração da largura/altura, zoom até ~1,8). Usado na Notícias 02: E15 = E13 de perto, E18 = E17 no berço.
- ⬜ Música escolhida pela paleta/clima da ficha (hoje: trilha fixa da biblioteca do YouTube, escolhida pelo dono).

## 7b. Conferência obrigatória antes de entregar ✅
- Quadros: abertura, entrada do avatar, 1 por bloco, saída do avatar e os últimos 5 s.
- Brilho (YAVG) por cena: nenhuma queda brusca para preto fora do fade final.
- Duração final = entrada + narração + saída + 1,5 s.

## 8. Revisão e publicação no YouTube ✅ (31/10/2026)
- Dono assiste, anota no Painel o que refazer (cena + vídeo/imagem). Refaz só o que precisa e remonta.
- **Sempre passa pela aprovação do dono antes do YouTube** (regra do dono): 
  1. Texto do YouTube em `publicacao/<episodio>_youtube.json` — modelo: links (notícias, sistema, cursos) →
     gancho de 1 linha → 2–3 parágrafos do episódio → convite a comentar → **capítulos** (0:00 obrigatório,
     ≥3, cada um ≥10 s, tempos = narração + entrada do avatar) → livro citado → aviso de IA → parágrafo de
     busca → hashtags (as 3 primeiras aparecem acima do título). Título ≤ 100, sem `<` `>`.
  2. `python3 scripts/enviar_publicacao.py final.mp4 publicacao/<episodio>_youtube.json` (token
     CONTENT_FACTORY_API_TOKEN) — manda em partes de 40 MB para o Painel.
  3. Dono: Roteiro de Vídeo → episódio → **▶ Publicação no YouTube**: assiste, corrige texto, Aprova ou Rejeita com nota.
  4. Aprovado: o Painel sobe privado, confere o canal (`canal_esperado` = UCqHHEf2eAiKKFHwMswa4gFw) e deixa
     público; marca a etapa "publicado". Declara conteúdo sintético (avatar/cenas com IA).
- ✅ Capa (thumbnail) 1280×720 — **sempre pela identidade da marca: skill `designer-recursos-cognitivos`** (o dono
  recusou uma capa fora do padrão em 31/10: "temos um especialista nisso que já tem todas nossas cores, letras").
  Modelo: `scripts/capa_youtube.html` — fundo azul `#2B4872` (80% da peça), cena do episódio puxada para o azul
  à direita, ícone da marca no alto à esquerda, título em **Goodly Bold** branco com a palavra-chave em
  verde-água `#56CAC9` (máx. 5 palavras), barra verde-água, foto do Prof. Arilio recortada à direita (canto
  inferior direito sem nada importante: a duração cobre). Nada de amarelo/vermelho/contorno preto.
  Render: `NODE_PATH=$(npm root -g) node scripts/render_capa.cjs capa.html capa.png 1280 720` e conferir em 320×180.
  Envio: `POST /thumbnails-externas` (token) com o `youtube_video_id` → dono aprova em Painel → Aprovações.
  ⬜ Juntar capa e vídeo numa aprovação só (hoje são duas: vídeo no Roteiro de Vídeo, capa em Aprovações).

## 9. Custos por episódio (piloto)
| Item | Como | Custo |
|---|---|---|
| Cenas (imagem + animação) | Flow, créditos grátis (50/dia/conta) | R$ 0 |
| Avatar fala ~3 min | fal H3 Max 480P | ~US$ 9,80 (~R$ 51) |
| Transcrição + ambiente | fal Whisper + MMAudio | < US$ 0,50 |
| Montagem | ffmpeg (Claude) | R$ 0 |

## 10. Histórico de mudanças deste doc
- 31/10/2026 — publicação no YouTube com aprovação no Painel; corrigido o buraco do avatar entre fala e saída.
- 31/10/2026 — Notícias 02: checklist do Kit nos mínimos detalhes, etiqueta de época, recorte na montagem.
- 31/10/2026 — criado na montagem do piloto: estrutura de pastas 00–08, entrada do avatar, cor por ficha ShotDeck,
  montagem automatizada em script único, saída do avatar e kit de vestuário pendentes.
