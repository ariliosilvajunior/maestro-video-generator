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

## 6. Avatar do narrador ✅ fala / 🟡 entrada / ⬜ saída
- Fala: fal.ai H3 Max Lip Sync 480P, foto com fundo verde (#00FF00), pedaços de 5–15 s nas pausas
  (`scripts/avatar_h3max.py`) → `avatar_fala.mp4`. ~US$ 0,05/s (~R$ 51 por episódio de 3 min).
- Entrada: Flow Frames, Início = fundo verde vazio, Fim = a mesma foto da fala, 4 s → `avatar_entrada.mp4`. ✅ piloto
- ⬜ Saída: Flow Frames, Início = foto da fala, Fim = fundo verde vazio, 4 s (levanta e sai pela direita).
  Texto pronto (copiar):
  `One single continuous shot, no cuts, static camera. Pure flat green screen background (#00FF00) the whole time, no floor, no shadows, no furniture, no props appear. The man from the start frame unclasps his hands, stands up from behind a table that stays below the bottom edge of the frame (never visible), turns to his right and walks out through the right edge of the frame, leaving only the empty green background, ending exactly like the end frame. Natural, unhurried movement, realistic body and hands, same face, glasses, beard and navy t-shirt with the logo. Seen from the waist up. No camera pan, no zoom. No text, no music, no dialogue.`
  Sem esse arquivo, a montagem faz o avatar sumir suave (0,8 s) — foi assim no piloto.
- Posição fixa (não mudar sem o dono pedir): quadro 400×400 em 1920×1080, `overlay=W-w-80:H-h+25`.
  Entrada/saída sem recorte: escala 711×400, `overlay=1284:H-h+25` (entra/sai pela borda direita da tela).

## 7. Montagem (Claude, automática) ✅ — `scripts/montar_episodio.py <pasta>`
Entradas: `narracao.mp3, cuts.json, words.json, clipes/pNN.mp4, avatar_fala.mp4, avatar_entrada.mp4,
[avatar_saida.mp4], musica.mp3, [amb/aNN.wav], episodio.json` (título, subtítulo, cor, frases-chave, correções).
1. Cada cena no tamanho da fala: estica até 1,6× mais lento e congela o último quadro se faltar.
2. Fusão de 0,5 s entre cenas; cor do episódio (§3): `eq` + `colorbalance` + grão (`noise`) + `vignette`.
3. Linha do tempo: entrada do avatar (4 s) → narração começa → fala → saída/some → 1,5 s de respiro → fade.
4. Legenda documental: Liberation Sans 46, margem esquerda 100 / direita 520 (não cobre o avatar) / baixo 55,
   até ~34 caracteres por linha; correções de nome (`Arilho` → `Arilio`).
5. Título serifado na abertura (sobre a entrada), nome "Prof. Arilio" + "Recursos Cognitivos" sem caixa,
   frases-chave em destaque (achadas sozinhas no texto da narração).
6. Som: narração atrasada pela entrada; música a 0,20 com ducking (sidechain) sob a voz; ambiente por cena
   (MMAudio a partir do próprio clipe, normalizado ~-30 LUFS, 0,9); whoosh sintetizado em cada fusão.
7. Fade de entrada 0,6 s e saída 1 s.
- ⬜ Ambiente MMAudio gerado automaticamente para TODAS as cenas a partir do texto SOM da cena (hoje: script
  `scripts/ambiente_mmaudio.py` com prompts escritos à mão).
- ⬜ Música escolhida pela paleta/clima da ficha (hoje: trilha fixa da biblioteca do YouTube, escolhida pelo dono).

## 8. Revisão e publicação ⬜
- Dono assiste, anota no Painel o que refazer (cena + vídeo/imagem). Refaz só o que precisa e remonta.
- ⬜ Publicação (YouTube/Instagram) e capa — ainda manual / outras rotinas.

## 9. Custos por episódio (piloto)
| Item | Como | Custo |
|---|---|---|
| Cenas (imagem + animação) | Flow, créditos grátis (50/dia/conta) | R$ 0 |
| Avatar fala ~3 min | fal H3 Max 480P | ~US$ 9,80 (~R$ 51) |
| Transcrição + ambiente | fal Whisper + MMAudio | < US$ 0,50 |
| Montagem | ffmpeg (Claude) | R$ 0 |

## 10. Histórico de mudanças deste doc
- 31/10/2026 — criado na montagem do piloto: estrutura de pastas 00–08, entrada do avatar, cor por ficha ShotDeck,
  montagem automatizada em script único, saída do avatar e kit de vestuário pendentes.
