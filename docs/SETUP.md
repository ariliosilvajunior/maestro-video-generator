# Checklist de instalação (fase de setup)

Esta é a versão em prosa do que o assistente `/setup` faz com você dentro do Claude Code. Marque cada
item; o `python3 bin/doctor.py` é quem diz se está realmente verde. Nada do pipeline roda antes do
carimbo final (`python3 bin/setup_init.py complete`).

---

## A. Programas

| # | Item | macOS | Linux (Debian/Ubuntu) | Windows (WSL2 Ubuntu) | Verificar |
|---|---|---|---|---|---|
| A1 | Claude Code | `npm i -g @anthropic-ai/claude-code` | idem | idem (dentro do WSL) | `claude --version` |
| A2 | Node.js ≥ 18 + npm | `brew install node` | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash - && sudo apt install -y nodejs` | idem no WSL | `node -v` |
| A3 | Python ≥ 3.10 | `brew install python` | `sudo apt install -y python3 python3-pip` | idem | `python3 --version` |
| A4 | Dependências Python | `pip3 install -r requirements.txt` | idem | idem | `python3 -c "import PIL, numpy"` |
| A5 | ffmpeg **com libass** + ffprobe | `brew install ffmpeg` | `sudo apt install -y ffmpeg` | idem | `python3 lib/ffmpeg.py --probe` → `ass: yes` |
| A6 | yt-dlp | `brew install yt-dlp` | `pip3 install -U yt-dlp` | idem | `yt-dlp --version` |
| A7 | jq | `brew install jq` | `sudo apt install -y jq` | idem | `jq --version` |
| A8 | Dependências do Remotion | `cd motion-pipeline/remotion-agent && npm install` (uma vez, ~1 GB) | idem | idem | `npx remotion --version` |
| A9 | Playwright MCP (navegador do agente) | automático via `.mcp.json` ao abrir o Claude Code na pasta | idem | idem | ferramentas `mcp__playwright__*` visíveis; `browser_navigate("https://example.com")` funciona |
| A10 | (opcional) Playwright headless para capturas de páginas de vídeo | `cd reference-pipeline && npm install && npx playwright install chromium` | idem | idem | `node reference-pipeline/yt_watch_shot.cjs --help` |
| A11 | (opcional) ASR local para legendas medidas | `pip3 install mlx-whisper` (Apple Silicon) ou `pip3 install faster-whisper` | `faster-whisper` | `faster-whisper` | `python3 -c "import faster_whisper"` |

> WSL2: instale tudo **dentro** do Ubuntu do WSL (inclusive o Claude Code) e abra o Claude Code a partir
> da pasta do repo no WSL. O navegador do Playwright abre com o WSLg. A pasta `~/Downloads` referida nos
> docs é a do Linux; mude `paths.downloads` se preferir outra.

## B. Contas e assinaturas

| # | Conta | O que fazer | Onde vai |
|---|---|---|---|
| B1 | **HeyGen** (plano com créditos) | conta: https://www.heygen.com/?sid=rewardful&utm_content=creator&utm_medium=influencera&via=maestrosdaia · crie seu avatar (ou faça upload) e escolha uma voz. Faça login pelo navegador do agente em `https://app.heygen.com/home` (2FA na própria janela). O wizard lê os nomes exatos do avatar, dos looks e da voz no editor. | `avatar.name`, `avatar.look`, `avatar.fallback_look`, `avatar.voice`; e-mail/senha em `keys.md` `## HeyGen` (opcional, para re-login sem você) |
| B2 | **Google Gemini API key** (obrigatória) | https://aistudio.google.com/apikey | `python3 bin/setup_init.py key Gemini <chave>` |
| B3 | **Provedor de imagem** (escolha um) | fal.ai: https://fal.ai/dashboard/keys · OpenAI: https://platform.openai.com/api-keys (com créditos e acesso ao `gpt-image-1`) · Google: reutiliza a chave Gemini | `key fal <chave>` / `key OpenAI <chave>`; `set images.provider fal\|openai\|google\|none` |
| B4 | **Pexels** (grátis, recomendado) · Pixabay · Coverr | https://www.pexels.com/api/ | `key Pexels <chave>` (idem Pixabay/Coverr) |
| B5 | **Instagram** (conta de postagem) | faça login pelo navegador do agente; ele salva a sessão em `.claude/auth/instagram-storage-state.json` | `posting.instagram_handle`, `brand.instagram_handle`; verifique: `python3 browser-post-pipeline/restore_session.py instagram --check` |
| B6 | **ManyChat PRO** (opcional) | conta: https://manychat.partnerlinks.io/iyoaakb3km0q · Instagram conectado ao ManyChat; login pelo navegador do agente → `.claude/auth/manychat-storage-state.json`; crie a automação TEMPLATE uma vez (`manychat-pipeline/MANYCHAT_INSTRUCTIONS.md` §B0) | `manychat.enabled true`, `manychat.account_id`, `manychat.instagram_handle` (= conta de postagem), `manychat.template_flow_id` |
| B7 | **Metricool** (opcional) | conta: https://i.mtr.cool/maestrosdaia · token da API + ids da marca | `posting.metricool.enabled true`, `blog_id`, `user_id`, `key Metricool <token>` |
| B8 | **Marca, nicho e descoberta** | veja a seção **B8** abaixo: nicho, público, frases de busca, canais de referência | `brand.*`, `discovery.*` |
| B9 | **Alertas** | `log` (padrão) · `webhook` (Slack/Discord) · `command` | `notify.method`, `notify.webhook_url` / `notify.command` |
| B10 | **QC opcional** | nota do Gemini antes de enfileirar | `qc.enabled true` |

Todos os `set`/`key` acima: `python3 bin/setup_init.py set <chave> <valor>` e
`python3 bin/setup_init.py key <Serviço> <chave>`. Nunca cole chaves no chat; nunca commite `keys.md`.

### B8. Nicho e descoberta de conteúdo (a fase de "scraping")

Quando a fila de links está vazia, o pipeline **pesquisa o seu nicho no YouTube** (via yt-dlp, sem chave, sem
login) e enfileira os melhores vídeos recentes para reproduzir. Para isso o setup precisa saber quem você é:

| Chave | O que responder | Exemplo |
|---|---|---|
| `brand.niche` | uma linha: sobre o que é a sua conta | `IA para pequenos negócios` |
| `brand.audience` | quem assiste: nível e objetivo | `donos de loja sem time técnico que querem automatizar` |
| `discovery.queries` | 6–12 frases que um espectador do seu nicho digitaria no YouTube, em PT **e** EN | `automação com IA, ai agents for business, claude code tutorial` |
| `discovery.seed_channels` | 3–10 criadores que você quer reproduzir (`@handle` ou URL do canal) | `@criador1, https://www.youtube.com/@criador2` |
| `discovery.exclude_keywords` | temas que você nunca quer | `cripto, aposta` |
| `discovery.languages` · `max_age_days` · `min_views` · `max_duration_s` · `per_run` | idiomas aceitos, frescor, tração, duração e quantos links por rodada | `pt, en` · `30` · `5000` · `900` · `3` |
| `discovery.auto_enqueue` | o Stage 0 pode enfileirar sozinho quando a fila está vazia | `true` |

```bash
python3 bin/setup_init.py set brand.niche "IA para pequenos negócios"
python3 bin/setup_init.py set brand.audience "donos de loja sem time técnico"
python3 bin/setup_init.py set discovery.queries "automação com IA, ai agents for business, claude code tutorial, ferramentas de IA para negócios"
python3 bin/setup_init.py set discovery.seed_channels "@criador1, @criador2"
python3 discover-pipeline/discover_sources.py --limit 8      # prova: a tabela deve ter ≥ 70 % de vídeos que você faria
```

Ajuste as frases e repita até a tabela ficar boa (2–3 rodadas é normal). Quem prefere só colar links
desliga com `python3 bin/setup_init.py set discovery.enabled false`. Detalhes em `discover-pipeline/DISCOVERY_INSTRUCTIONS.md`.

## C. Assets

- [ ] pelo menos **uma música** livre de direitos em `music/` (nomeie pelo clima: `energetic-…`, `calm-…`; veja `music/README.md`).
- [ ] `sfx/` (riser + click), fontes, primitivas Lottie e assets de demonstração já vêm no pacote —
  `python3 bin/make_sample_assets.py` regenera se apagar.
- [ ] (opcional) um set de ícones premium gerado uma vez em `motion-pipeline/remotion-agent/public/assets/icons/`
  (skill `generate-image-assets`).

## D. Verificar e liberar

```bash
python3 bin/doctor.py --live        # zero ❌ (⚠️ opcionais podem ficar)
python3 bin/smoke_test.py           # gera ~/Downloads/maestro-smoke_music.mp4 (motion + avatar placeholder + legendas + som)
python3 bin/setup_init.py complete  # carimba setup.completed = true
```

Abra o vídeo do smoke test: painel de motion em cima, avatar placeholder embaixo, legendas queimadas,
riser no gancho, clicks nas transições e música baixa. Se tudo está lá, o toolchain está pronto.

## E. Primeiro vídeo

1. Cole um link do YouTube/Instagram sozinho na conversa → "queued — 1 in line". Ou não cole nada: com a fila
   vazia, "roda o pipeline" faz a descoberta por nicho abastecer a fila primeiro.
2. "Roda o pipeline" → acompanhe as fases; o resultado fica em `~/Downloads/<Nome>_music.mp4`.
3. `/post-now` quando quiser publicar.

## F. Perguntas frequentes

- **Posso usar outro avatar que não o HeyGen?** Nesta edição a Fase 3 é o editor do HeyGen via navegador.
  Um vídeo de avatar produzido em outra ferramenta pode entrar pela skill `ingest-source` (arquivo local).
- **Preciso do ManyChat?** Não. Sem ele o CTA "Comenta <PALAVRA>" continua na legenda e você manda o link
  manualmente; `resource_cta.status` fica `manual`.
- **Quanto custa por vídeo?** Créditos do HeyGen (por minuto de avatar), centavos por imagem no provedor
  escolhido, transcrição Gemini praticamente gratuita, stock Pexels grátis.
- **E se o provedor de imagem cair no meio?** O gerador retoma por beat (não paga duas vezes); só cai para o
  estilo hand-drawn se o provedor estiver realmente indisponível — e avisa (`alerts.log` / webhook).
