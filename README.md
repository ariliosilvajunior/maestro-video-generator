# Maestro Video Generator

Pipeline completo, operado por um agente (Claude Code), que transforma **um link de vídeo ou um tema**
em um **Reels vertical pronto para publicar** (1080×1920, 25 fps):

```
link / tema → roteiro PT-BR → avatar HeyGen (seu avatar) → motion graphics premium (Remotion)
            → screenshots reais + imagens 3D geradas (fal.ai · Google · OpenAI — você escolhe)
            → legendas virais queimadas → trilha + riser + clicks → fila de publicação → Instagram Reels
```

Tudo é personalizado por **um arquivo de configuração** (`config/config.json`) e **um arquivo de
chaves** (`.claude/keys.md`). Nada da sua conta, do seu avatar ou das suas chaves está no pacote — o
**assistente de setup** (`/setup`) preenche isso com você, item por item, e só libera o pipeline quando o
checklist está verde.

---

## 1. O que vem no pacote (e o que não vem)

| Vem | Não vem (você traz no setup) |
|---|---|
| 24 skills do agente (setup, descoberta por nicho, roteiro, avatar, imagens, motion, legendas, som, QC, ManyChat, fila, postagem) | Sua conta HeyGen + seu avatar/look/voz |
| Projeto Remotion com o kit premium + kit hand-drawn + 14 composições de referência | Chaves de API (Gemini, provedor de imagem, Pexels…) |
| Scripts de todas as fases (Python + Node), gates de qualidade e catálogo de regras (QCR) | Login do Instagram (sessão salva localmente por você) |
| Assets de demonstração sintetizados (avatar placeholder, screenshots, cutouts, SFX, fontes OFL) | Trilhas de música (`music/` fica vazia — veja `music/README.md`) |
| `bin/doctor.py` (checklist verificado), `bin/smoke_test.py` (prova o toolchain sem gastar crédito) | Vídeos gerados, estados de execução, logs |

## 2. Requisitos

**Programas** (o `/setup` mostra o comando certo para o seu sistema): Node.js ≥ 18 + npm, Python ≥ 3.10,
ffmpeg **com libass** (+ ffprobe), yt-dlp, jq, git (opcional). macOS e Linux nativos; **Windows via WSL2**.

**Contas / assinaturas:**

| Serviço | Para quê | Obrigatório? |
|---|---|---|
| Claude Code (Anthropic) | o agente que opera o pipeline | sim |
| HeyGen (plano com créditos de vídeo) | o avatar falante | sim |
| Google Gemini API key | transcrição do avatar → SRT (e QC, se ligar) | sim |
| Provedor de imagem — **fal.ai** ou **OpenAI** ou **Google** | os objetos 3D do estilo premium | um dos três (ou `none` = só hand-drawn) |
| Pexels (grátis) · Pixabay · Coverr | b-roll de stock para o caminho hand-drawn | recomendado |
| Instagram (conta de postagem) | publicação via navegador | sim, para postar |
| ManyChat PRO com Instagram conectado | DM automática com o link ao comentar a palavra-chave | opcional |
| Metricool | fallback de agendamento | opcional |

## 3. Início rápido

```bash
unzip maestro-video-generator-v1.1.0.zip && cd maestro-video-generator
claude            # abre o Claude Code NESTA pasta (o MCP do navegador vem de .mcp.json)
```

Dentro do Claude Code:

```
/setup
```

O assistente percorre o checklist: instala/verifica programas, cria `config/config.json` e
`.claude/keys.md` a partir dos exemplos, pede cada conta/chave, descobre o nome do seu avatar e look no
HeyGen, **entrevista você sobre o seu nicho** (público, palavras-chave de busca, canais de referência) e prova a
descoberta de vídeos com uma busca real, salva a sessão do Instagram, coloca uma música em `music/`, roda o
`doctor` e o `smoke test`, e por fim carimba `setup.completed = true`. Sem esse carimbo nenhuma skill do pipeline roda.

Verificação manual a qualquer momento:

```bash
python3 bin/doctor.py --live     # checklist completo (programas, config, chaves ao vivo, sessões, assets)
python3 bin/smoke_test.py        # render premium + legendas + som com os assets de demonstração
```

## 4. Uso no dia a dia

1. **Cole um link** (YouTube / Instagram / TikTok) sozinho na conversa → ele entra na fila
   (`next-videos.jsonl`). Nada roda ainda. **Fila vazia?** O pipeline pesquisa o **seu nicho** no YouTube
   (descoberta por nicho, configurada no setup) e enfileira os melhores vídeos recentes sozinho. Para ver o que
   ele escolheria: `python3 discover-pipeline/discover_sources.py`.
2. Diga **"roda o pipeline"** → o Stage 0 pega o link mais antigo, escreve o roteiro em PT-BR, gera o
   avatar, monta o motion, legenda, mixa o som e deixa o vídeo pronto em `~/Downloads/<Nome>_music.mp4`
   e na fila de postagem (`post-queue.jsonl`). Não publica.
3. **Revisão no Painel do Dono (opcional, recomendado):**
   `python3 post-pipeline/enviar_para_painel.py` manda o vídeo pronto pra tela "Vídeos Maestro" em
   `painel.recursoscognitivos.com.br`, pra assistir/aprovar antes de publicar — ver NOTAS_DONO.md.
4. **`/post-now`** → publica o próximo vídeo pronto no Instagram Reels pelo navegador, registra em
   `pipeline-log.csv` e limpa as filas.

Também dá para começar de um **tema/transcrição** (o pipeline entra na Fase 2) ou de um **arquivo de
vídeo local** (skill `ingest-source`).

## 5. Configuração (`config/config.json`)

Crie a partir de `config/config.example.json` (o `/setup` faz isso). Edite com
`python3 lib/config.py set <chave.pontuada> <valor>` ou `python3 bin/setup_init.py set …`.

| Chave | O que é |
|---|---|
| `brand.name` · `brand.instagram_handle` · `brand.language` (`pt-BR`) · `brand.timezone` · `brand.niche` · `brand.audience` | sua marca, seu nicho e seu público (guiam a descoberta e o ângulo dos roteiros) |
| `discovery.enabled` · `queries` (6–12 frases de busca em PT e EN) · `seed_channels` · `use_creators_roster` · `languages` · `max_age_days` · `min_views` · `max_duration_s` · `exclude_keywords` · `per_run` · `auto_enqueue` · `prefer_shorts` | a descoberta por nicho: como a fila é abastecida quando está vazia |
| `avatar.name` · `avatar.look` · `avatar.fallback_look` · `avatar.voice` · `avatar.engine_fallback` | o avatar HeyGen exatamente como aparece no editor (o wizard descobre) |
| `images.provider` = `fal` \| `google` \| `openai` \| `none` (+ `fal_model`, `google_model`, `openai_model`, `openai_transparent`, `width`, `height`) | quem gera os objetos 3D do estilo premium |
| `transcription.model` | modelo Gemini da transcrição (`gemini-2.5-flash`) |
| `manychat.enabled` · `account_id` · `template_flow_id` · `instagram_handle` · `extra_bubble.*` | comment→DM automático (opcional) |
| `posting.method` (`browser`) · `posting.instagram_handle` · `posting.metricool.*` | publicação |
| `qc.enabled` · `qc.threshold` · `qc.max_iterations` | nota do Gemini antes de enfileirar (opcional) |
| `notify.method` = `log` \| `webhook` \| `command` | como você recebe alertas (Slack/Discord webhook, comando próprio) |
| `paths.downloads` · `paths.tmp` · `paths.ffmpeg` | pastas de saída/rascunho e um ffmpeg específico |
| `setup.completed` | o carimbo que libera o pipeline (`bin/setup_init.py complete`) |

**Chaves** ficam em `.claude/keys.md` (crie a partir de `.claude/keys.md.example`; nunca versionado) — uma
seção por serviço (`## Gemini`, `## fal`, `## OpenAI`, `## Pexels`, …) com a linha `- API Key: \`…\``.
Variáveis de ambiente têm prioridade (`GEMINI_API_KEY`, `FAL_KEY`, `OPENAI_API_KEY`, `PEXELS_API_KEY`…).

## 6. Provedores de imagem

| `images.provider` | Modelo padrão | Observações |
|---|---|---|
| `fal` | `fal-ai/nano-banana-pro` | fila `queue.fal.run`; troque o modelo em `images.fal_model` e ajuste `images.fal_extra` se o schema pedir (`image_size` vs `aspect_ratio`) |
| `google` | `gemini-2.5-flash-image` | usa a mesma chave Gemini da transcrição |
| `openai` | `gpt-image-1` | com `openai_transparent: true` o PNG já vem com alpha (sem chroma key); precisa de créditos na organização |
| `none` | — | vídeos só no estilo hand-drawn (b-roll de stock + anotações) |

O gerador é um único script, resume-safe, com chroma key + fallback por flood-fill e limpeza de
resíduos: `python3 image-pipeline/generate_image_assets.py --beats <beats.json> --out-dir <pasta> --palette <paleta>`.

## 7. Estrutura

```
CLAUDE.md                 instruções do agente (mapa de fases, gate de setup, regras fixas)
FULL_PIPELINE.md          roadmap detalhado fase a fase   ·  PIPELINE_DIRECTIVES.md  regras da casa
.claude/skills/           23 skills (uma por fase + setup-wizard, post-now, recover-stalled-runs…)
.claude/hooks/            hook "colar link = enfileirar"
.mcp.json                 Playwright MCP (navegador do agente, perfil persistente em .playwright-profile)
bin/                      doctor.py · setup_init.py · smoke_test.py · make_sample_assets.py
config/                   config.example.json (→ config.json)
lib/                      config · api_keys · paths · ffmpeg · locking · notify
heygen-pipeline/          Fase 3 (avatar via navegador)       link-pipeline/  ingest-pipeline/
image-pipeline/           Fase 4 (imagens 3D + chroma key)    reference-pipeline/  (screenshots reais)
broll-pipeline/           Fase 4/7 (stock)                    motion-pipeline/remotion-agent/  (Fase 5)
subtitle-pipeline/        Fase 8 (SRT→ASS→burn + gates)       add_music.py  (Fase 9) · sfx/ · music/
qc-pipeline/              Fase 10 (opcional) + catálogo QCR   manychat-pipeline/  (Fase 11, opcional)
discover-pipeline/        Fase 1 (descoberta por nicho: busca no YouTube via yt-dlp, abastece a fila)
post-queue-pipeline/ next-videos-pipeline/ creators-pipeline/ browser-post-pipeline/ post-pipeline/
maestro_state.py             estado por execução (pipeline-runs/<Nome>.json, escrita atômica)
docs/SETUP.md             este checklist em prosa, por sistema operacional
```

## 8. Comandos úteis

```bash
python3 bin/doctor.py [--live] [--json] [--quiet]        # checklist (exit 1 se falta item obrigatório)
python3 bin/setup_init.py init|set|key|status|complete   # cria config/keys, grava valores, carimba setup
python3 bin/smoke_test.py                                # render + legendas + som de teste (sem API)
python3 bin/make_sample_assets.py [--force]              # regenera os assets de demonstração
python3 lib/config.py get|set|show|path                  # lê/edita config.json
python3 lib/ffmpeg.py --probe                            # qual ffmpeg será usado e se tem o filtro ass
python3 discover-pipeline/discover_sources.py [--enqueue] [--limit N] [--queries …] [--channels …]   # descoberta por nicho
python3 next-videos-pipeline/next_videos.py add|peek|list|count|claim|done|release
python3 post-queue-pipeline/post_queue.py add|peek|list|count|claim|done|release|stale
python3 maestro_state.py init|set|phase|show|get|list|log|register-comp|check-owner|stale|assert-ready
python3 post-pipeline/alert.py --platform images|instagram|manychat|system --run <Nome> --reason "…"
```

## 9. Problemas comuns

- **`ffmpeg` sem o filtro `ass`** → instale um build completo (`brew install ffmpeg`, gyan.dev "full" no
  Windows) ou aponte `paths.ffmpeg` para ele. `python3 lib/ffmpeg.py --probe` mostra o que foi encontrado.
- **As ferramentas `mcp__playwright__*` não aparecem** → reinicie o Claude Code dentro da pasta do repo
  (ou `/mcp` → reconnect). O `.mcp.json` já está pronto; o perfil fica em `.playwright-profile/`.
- **HeyGen pede 2FA/captcha** → conclua na janela do navegador; o agente para só nesses bloqueios.
- **fal responde 422** → o modelo escolhido usa outro schema; ajuste `images.fal_extra`.
- **OpenAI responde 429 `insufficient_quota`** → adicione créditos na organização ou troque de provedor.
- **Render do Remotion lento** → normal em máquinas modestas; use `--concurrency 3` (padrão nas skills).
- **Windows** → use WSL2 (o hook e os scripts assumem um shell POSIX).

## 10. Segurança e privacidade

`.claude/keys.md`, `.claude/auth/*`, `config/config.json`, `.playwright-profile/`, `pipeline-runs/`, mídia
gerada e logs estão no `.gitignore`. Chaves são gravadas só por `bin/setup_init.py key` e nunca ecoadas na
conversa. Nenhum dado seu sai da sua máquina além das chamadas às APIs/sites que você mesmo configurou.

## 11. Licença e avisos

Uso conforme `LICENSE.md`. Componentes de terceiros e suas licenças em `THIRD-PARTY-NOTICES.md`
(atenção à licença do Remotion para empresas). Histórico em `CHANGELOG.md`.
