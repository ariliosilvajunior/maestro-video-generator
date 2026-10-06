# Notas do dono — combinado em 05/10/2026

Registrado numa conversa separada (sessão do `ecossistema-ia-recursos-cognitivos`),
antes desta ferramenta ter sessão própria. Guardado aqui pra não se perder.

- **Cadência inicial: 1 postagem por semana**, não diária. Começar devagar,
  validar o formato antes de aumentar.
- **Publicação automática (atualizado 06/10/2026 — RESOLVIDO):** Instagram sempre automático
  (via navegador). Facebook/TikTok/YouTube Shorts também automáticos agora, via **Buffer**
  (`config.posting.buffer.*` — conta grátis, sem mensalidade; o Metricool pago foi cogitado
  primeiro mas descartado por custo, R$265/mês, e o caminho 100% direto por API própria foi
  descartado porque o Facebook/Meta bloqueou a conta do dono pra criar um app de
  desenvolvedor — bloqueio persistente, não resolve tentando de novo). As 3 redes já estão
  conectadas na conta Buffer (`recursoscognitivos`) e os ids salvos em `config/config.json`.
  Campos técnicos de cada rede vieram do schema oficial do Buffer
  (`developers.buffer.com`) e o TikTok foi **testado de verdade** (post rascunho criado e
  apagado com sucesso em 06/10/2026) — Facebook e YouTube ainda não tiveram o primeiro post
  real verificado, fazer o teste em rascunho (`saveToDraft: true`) antes do primeiro post de
  verdade em cada um (ver `how-to-post-videos.md`).
- **Negócio:** "Recursos Cognitivos" — sistema de gestão pra AEE
  (Atendimento Educacional Especializado) / educação especial. Dono é
  professor de AEE de verdade. Contexto completo (se precisar) no
  repositório `ecossistema-ia-recursos-cognitivos`, `docs/CONTEXTO_NEGOCIO.md`
  — mas este projeto aqui é **separado** desse sistema, só usa a marca como
  nicho de conteúdo.
- **Áudio/avatar do HeyGen:** o dono mencionou que já está resolvendo isso
  por conta própria (separado desta configuração).

## Aprovação pelo Painel do Dono (combinado em 05/10/2026)

O dono quer assistir e aprovar cada Reel no **Painel do Dono**
(`painel.recursoscognitivos.com.br`, tela "Vídeos Maestro"), em vez de só
abrir o arquivo `.mp4` solto. Isso já está construído do lado de lá
(`ecossistema-ia-recursos-cognitivos`, `agentes/content_factory/main.py` +
`painel/main.py`) e do lado de cá:

- `config/config.json` -> `painel.enabled` / `painel.url` (já preenchido
  no `config.example.json` — confirma se `config.json` também tem,
  `python3 lib/config.py get painel.url`).
- `.claude/keys.md`, seção `## Painel` — precisa do token
  (`CONTENT_FACTORY_API_TOKEN` do outro repositório; pede pro dono se não
  tiver).
- `post-pipeline/enviar_para_painel.py` — manda o vídeo pronto (da fila
  `post-queue.jsonl`) pro Painel. **Não publica nada** — só coloca na fila
  de aprovação.

**Fluxo recomendado (v1, ainda manual):** depois que o pipeline principal
deixar um vídeo pronto em `post-queue.jsonl`, rodar
`python3 post-pipeline/enviar_para_painel.py` antes de `/post-now`. Esperar
o dono aprovar na tela do Painel antes de publicar de verdade. Ainda não
existe checagem automática de "o dono já aprovou?" dentro do `/post-now` —
isso é uma v2, por enquanto é combinado por fora (perguntar/confirmar com
o dono antes de publicar).

## Preview de áudio (Fase 2.6) também pelo Painel (06/10/2026)

O dono pediu que a aprovação do áudio-rascunho (ElevenLabs, antes da HeyGen
— ver `PIPELINE_DIRECTIVES.md` §2d) apareça na mesma tela que já existe pro
Canal AEE ("Preview de áudio esperando aprovação"), não só como arquivo
solto no chat. Construído e testado nesta sessão:

- `ecossistema-ia-recursos-cognitivos`, branch
  `claude/ecossistema-ia-agentes-retry-oso16t`, commit `e31d200` — novo
  status `aguardando_aprovacao_audio` → `audio_aprovado` em `VideoMaestro`
  (`agentes/content_factory/main.py`), rotas-proxy + seção nova no Painel
  (`painel/main.py` + `painel/paginas.py`). 82 testes novos/existentes
  passando lá, suíte inteira (1530 testes) verde.
- `maestro-video-generator` (este repo): script novo
  `post-pipeline/enviar_audio_preview_painel.py` (`enviar` / `status`),
  `post-pipeline/enviar_para_painel.py` atualizado pra linkar o vídeo
  pronto ao MESMO registro do Painel (`video_id`) quando o áudio já foi
  aprovado por lá. Skills `write-script-ptbr` (Fase 2.6) e
  `generate-avatar-heygen` (precondição) atualizadas pra usar/checar o
  Painel como fonte de verdade da aprovação quando `painel.enabled=true`.

**⚠️ PENDENTE: fazer o deploy na VPS antes disso funcionar de verdade.**
O código já está no GitHub mas o servidor ainda roda a versão antiga
(testei: `POST /videos-maestro/audio-preview` no Painel ainda dá 404) —
ninguém com acesso ao terminal da VPS rodou o deploy ainda. Comando (ver
`docs/INFRAESTRUTURA.md` no `ecossistema-ia-recursos-cognitivos`):
```
cd ~/EcossistemaIA
git pull origin claude/ecossistema-ia-agentes-retry-oso16t
docker compose build content_factory painel
docker compose up -d content_factory painel
```
Esta sessão (Maestro) não tem acesso ao terminal da VPS — só o dono (pelo
Hostinger) ou uma sessão do `ecossistema-ia-recursos-cognitivos` com esse
acesso consegue rodar isso. Até lá, `config.painel.enabled` continua
`false` neste repositório (de propósito — evita erro 404 confuso no meio
de um run) e o primeiro vídeo real (`MediacaoAutismo`) fica pausado na
Fase 2.6 esperando esse deploy.

**Atualização 06/10/2026 — tudo deployado e testado de ponta a ponta.** O dono rodou os 3 deploys
pedidos (content_factory + painel, duas vezes — uma migração de coluna faltou no primeiro deploy,
corrigida e redeployada; e faltava uma rota JSON `/videos-maestro/lista` pro Maestro consultar sem
sessão de login). `painel.enabled=true` já está em `config/config.json`. O áudio-rascunho do
`MediacaoAutismo` já foi enviado pro Painel de verdade (`painel_video_id=1`) e está esperando
aprovação em "Preview de áudio esperando aprovação — Vídeos Maestro".

## Roteiro — saudação + menção à marca no fechamento (06/10/2026)

Pedido do dono, depois de ouvir o primeiro áudio-rascunho (aprovado, "ficou muito bom"): a PARTIR
DO PRÓXIMO vídeo (este primeiro, `MediacaoAutismo`, vai ao ar com o áudio já aprovado, sem mudar),
todo roteiro deve:
1. **Cumprimentar a audiência** — tecido DENTRO da frase de gancho (ex.: "Professor de AEE, você
   sabia que..."), não um "oi pessoal" solto antes do gancho (preservaria o impacto do frame 0 —
   ver CLAUDE.md §5).
2. **Referenciar "Recursos Cognitivos" no fechamento** — junto com a CTA de comentário/palavra-chave
   já existente, frase natural e variada a cada vídeo, não um texto fixo repetido.

Já atualizado em `how-to-generate-video-scripts.md` (regras 3 e 6) e
`.claude/skills/write-script-ptbr/SKILL.md`.

## Nunca falar a sigla "AEE" na voz do avatar (regra existente, portada pra cá em 06/10/2026)

O dono já tinha dado essa regra antes (03/10/2026), documentada em `.claquete/config.md` no
repositório `ecossistema-ia-recursos-cognitivos` ("vários erro AEE horrivel nunca dica isso ja que
não sabe" — a voz do avatar pronuncia a sigla errado) — mas essa sessão não tinha essa regra
replicada aqui, e o roteiro v2 do `MediacaoAutismo` acabou com "Professor de AEE" no gancho. O dono
pegou o erro, corrigido na hora (v3 do áudio): sempre por extenso, "Atendimento Educacional
Especializado", e o mesmo vale pra "PEI" (tirado também, virou "Plano Educacional Individualizado"
na primeira menção e "esse plano" depois). Regra agora também em `how-to-generate-video-scripts.md`
(regra 9) e `write-script-ptbr` SKILL.md, pra nunca mais esquecer.

## Fase 3 (avatar) — API da HeyGen, navegador aposentado (06/10/2026)

**Decisão final do dia, depois de muita volta:** o login por navegador na HeyGen está bloqueado de
verdade pelo Cloudflare ("flagged for suspicious activity") — não é 2FA, não é senha errada, é
anti-bot reconhecendo o navegador automatizado. Tentei várias vezes, com cuidado, confirmado com
prints pro dono. Ele deixou claro que o propósito do Maestro é automação 100%, nada de solução manual
(gravar no celular) — então a resposta certa era achar o caminho de API de verdade, não desistir.

Achado: a HeyGen tem API REST paga por uso (carteira pré-paga, separada de assinatura), e o dono **já
tinha isso configurado** no outro projeto (`ecossistema-ia-recursos-cognitivos`, agente
`video_factory`) — mesma conta, mesmo avatar ("Bem-vindo, Professor Arilio"), já testado em produção
lá. Só copiei o padrão: manda o áudio já aprovado (ElevenLabs, Fase 2.6) pra HeyGen como asset, ela
faz o lip-sync nele (`audio_asset_id`, não texto+voice_id — esse avatar especificamente rejeita
texto+voice_id com voz clonada do ElevenLabs).

- Script novo: `heygen-pipeline/generate_avatar_api.py`.
- Chaves em `.claude/keys.md` `## HeyGen`: `HEYGEN_API_KEY` (pega do `.env` da VPS do outro projeto,
  `grep HEYGEN ~/EcossistemaIA/.env`) + `config.avatar.heygen_avatar_id` =
  `1db8e24bb7e043159a4297c01373cefb` (mesmo avatar_id do `video_factory`).
- **Testado de ponta a ponta com o primeiro vídeo real** (`MediacaoAutismo`): 1080x1920, h264+aac,
  95.6s, evidence gate passou. Saldo na conta: ~1808 créditos (~R$150-160) — dá pra várias semanas
  nessa cadência.
- De quebra, achei e corrigi um bug real no `transcribe_gemini_srt.py`: o prompt tinha um exemplo
  fixo ("~60 segmentos pra um clipe de 1 minuto") que o Gemini lia como limite de TEMPO — cortava a
  transcrição exatamente aos 60s em qualquer clipe mais longo (visto ao vivo, duas vezes seguidas,
  no áudio de 95.6s). Corrigido pra informar a duração real e escalar o orçamento de segmentos.

`generate-avatar-heygen` SKILL.md e `CLAUDE.md` §1a documentam o método novo como padrão; o navegador
(`HEYGEN_INSTRUCTIONS.md`) fica só como fallback dormente, não tentar de novo sem o dono confirmar
que o bloqueio do Cloudflare sumiu.

## ⚠️ PENDÊNCIA pra próxima gravação — avatar gravado em formato PAISAGEM (06/10/2026)

O dono bateu o pé (com razão) no primeiro vídeo real (`MediacaoAutismo`) sobre o avatar não estar
centralizado / ombro cortado desigual. Raiz do problema, confirmada direto na conta da HeyGen
(`GET /v3/avatars/looks`): esse avatar (`Professor Arilio Recursos Cognit`,
`1db8e24bb7e043159a4297c01373cefb`) foi **gravado/treinado em formato PAISAGEM**
(`preferred_orientation: "landscape"`, resolução nativa 1280x720) — é o ÚNICO "look" que a conta
tem pra esse avatar, não existe variante vertical pra trocar.

Quando a API gera um vídeo 9:16 a partir desse material, ela corta ~68% da largura original pra
caber no quadro vertical — o corpo já encosta nas DUAS bordas do quadro em praticamente todo o
vídeo (confirmado varrendo os 96 segundos do primeiro vídeo, frame a frame: a mão já toca a borda
em 100% dos segundos, o ombro tem no máximo ~82px de folga). Não existe parâmetro na API da HeyGen
pra consertar isso (`fit`, `scale`, `offset`, `expressiveness` — nenhum se aplica, pesquisado e
confirmado nos docs oficiais). Tentei duas correções de recorte (deslocar a imagem) e as duas
pioraram as coisas (corte real de verdade / costura de cor artificial visível) — a solução que
funcionou pro `MediacaoAutismo` foi mostrar o avatar menor, numa moldura com borda, em vez de tela
cheia (`PremiumFrame` novo parâmetro `inset`, em `motion-pipeline/remotion-agent/src/library/
premium.tsx` + `src/compositions/MediacaoAutismo.tsx`) — funciona, mas é um "jeito de evitar o
problema", não uma correção de verdade.

**Pedido do dono: rever isso antes da próxima gravação.** Dois caminhos reais:
1. **Gravar um novo "look" desse avatar na HeyGen especificamente em formato VERTICAL** (o dono
   grava um novo vídeo de treino segurando o celular na vertical, ou filmando já pensando em 9:16) —
   resolve de vez, elimina a necessidade da moldura/inset. Isso é ação do dono na plataforma da
   HeyGen, não dá pra fazer por aqui.
2. Enquanto isso não acontece, manter o modo `inset` em todo vídeo novo gerado com esse mesmo
   avatar_id (já é o padrão no `MediacaoAutismo.tsx` — replicar o mesmo padrão nos próximos
   roteiros/composições até o avatar vertical existir).
