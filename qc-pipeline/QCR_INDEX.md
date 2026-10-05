# QCR_INDEX.md — índice compacto das regras QCR (1 linha por regra)

> **Como usar (Token Efficiency):** leia ESTE índice no início do run (é a leitura
> obrigatória compacta). Para executar uma fase, filtre pelas tags dela (`grep "| .*<tag>" QCR_INDEX.md`)
> e abra em `active-rules.md` SOMENTE as entradas completas da sua fase / que o índice sinalizar.
> **`active-rules.md` continua sendo a fonte integral e canônica** — este índice nunca a substitui,
> só evita reler 2.500 linhas em toda fase.
>
> Tags: script brief heygen assets broll motion insert subs sound qc manychat post state note
> (a tag `scrape` está aposentada — esta edição não tem scraper; as linhas ficam como stubs "retired")
>
> **Edição comunitária:** o QC graduado do Gemini é OPCIONAL (`config.qc.enabled`, default false;
> `config.qc.threshold` default 75; `config.qc.max_iterations` default 3). As regras com tag `qc`
> valem quando o QC está habilitado; os gates determinísticos (validators, caption-sync, timing,
> audio↔subtitle) valem sempre. Ids `QCR-NOTE-nn` = notas de validação de runs reais (sem ids de run).
> Placeholders: `<downloads>` = `paths.downloads` (default `<downloads>`), `<scratch>` = `paths.tmp`.
>
> **Manutenção (Self-Improve Step 5.6):** ao registrar um QCR novo em `active-rules.md`, APPENDE
> a linha-resumo correspondente aqui (mesmo formato). Nunca delete linhas — regra aposentada vira
> um stub "(retired …)" com o mesmo número, aqui e em `active-rules.md`.

QCR-001 | subs | Subtitle MarginV 280 (motion) / 440 (standalone); bottom edge ~px 1640 must clear UI overlay zone
QCR-002 | subs | Max 5-6 words/line; split >12-word segments into 2+ timed entries; 1.5-2.5s per segment
QCR-003 | subs | Highlight ALL instances of categories (numbers, brands, power verbs); never partial categories
QCR-004 | motion | Text alignment pixel-perfect: explicit textAlign:"center" + alignItems:"center" in every container
QCR-005 | motion | Numerical animations hold each value >=0.3s (>=7 frames@25fps); use Easing.out(Easing.cubic)
QCR-006 | motion | Converging icons (+ fusion): delay until narration shifts to collaboration; use "VS"/"X" for conflict
QCR-007 | qc | (com QC habilitado) Gemini grade is FINAL AUTHORITY; never override; após config.qc.max_iterations abaixo do threshold, PARE e reporte ao usuário (nunca poste)
QCR-008 | subs | Font 68 max; MarginV 280; max 18 chars/visual line; <=2 visual lines; subtitle top >=px 1450 clearance
QCR-009 | qc | Gemini QC output: structured 4-section format (Checklist -> Fixes Table -> Commands -> Re-render)
QCR-010 | qc | Record Gemini flag discrepancies; if grade >=75 (hallucination) AGENT NOTE only; if <75 apply anyway, resubmit
QCR-011 | motion | COMPLEMENT rule: motion text <=3 shared words max with concurrent subtitle; never 4+ consecutive
QCR-012 | qc | Parse GRADE with final regex capture; discard malformed/empty/loop responses; re-call
QCR-013 | qc | Inject authoritative text layers (ASS Dialogue exact + motion titles + timings) into QC prompt; temp 0.1
QCR-014 | qc | Loop até config.qc.max_iterations (default 3); Self-Improve after EVERY QC read (pass or fail); friction -> permanent source fix via QCR
QCR-015 | motion | "Near-duplicate"/"conceptual overlap" != defect; only 4+ consecutive shared words is MOTION_DUPLICATE
QCR-016 | subs,qc | Ground-truth carrega [YELLOW: words] por row; palavra listada YELLOW E amarela — nunca flagar "not highlighted"
QCR-017 | subs | srt_to_ass auto-split de segmento infitavel: balancear metades, <=18 chars/linha, <=2 linhas visuais
QCR-020 | motion,qc | Titulo de motion <=3 palavras nao pode ser MOTION_DUPLICATE (floor de contagem mata o phantom)
QCR-025 | scrape | (retired — no scraper in this edition)
QCR-026 | subs | merge_short_entries: fundir entries SRT <0.8s na anterior (max 7 palavras); min_ms=800
QCR-030 | scrape | (retired — no scraper in this edition)
QCR-031 | scrape | (retired — no scraper in this edition)
QCR-032 | heygen | Script box do /create-v4 APPENDA: limpar antes de trocar script (focus + CtrlA + Delete), verificar duration
QCR-032b | broll | Selecao de stock DETERMINISTICA: ordenar candidatos por pexels id imutavel antes do [0]
QCR-033 | broll | Beat "data/tokens/stream": liderar com "abstract glowing particles blue", NUNCA "binary data"/"matrix rain" (rostos)
QCR-034 | qc | Ground-truth lista as janelas de B-ROLL; proibir flags MOTION_* dentro delas
QCR-035 | subs | Highlights com categoria COERENTE (conceito + marca + numerais); nunca one-offs mistos
QCR-036 | broll | Beat "fire/flame": liderar "fire flames black background", NUNCA "jet engine"/"rocket fire" (pessoas)
QCR-037 | scrape | (retired — no scraper in this edition)
QCR-038 | broll | Beat "lens/focus": "abstract bokeh lights dark", NUNCA "camera lens macro" (rosto); documento -> paper abstrato
QCR-040 | broll | Beat "AI/brain": "abstract glowing blue particles dark", NUNCA "ai brain hologram"; "dashboard/score" -> abstract light
QCR-041 | script | Concept-grep no pipeline-log ANTES de roteirizar (parafrase cross-lingua fura o dedup de string)
QCR-042 | broll | Beat "server/data-center": "circuit board macro"; "automation/gears" -> preferir --drop-window (motion)
QCR-043 | subs | floor_short_dialogues: estender entries sub-0.8s ate a proxima cue (min 0.8s)
QCR-044 | subs | --no-default-highlights: set coerente, sem DEFAULT_HIGHLIGHTS genericos disparando inconsistente
QCR-045 | broll | insert_brolls: setsar=1 em AMBOS os inputs do concat (fixa abort por SAR mismatch)
QCR-046 | qc | Screenshot-insert: declarar janelas como B-ROLL + LAYOUT NOTE; subs estilo motion (nunca --standalone)
QCR-048 | subs | Re-render com avatar-overlay atrasa audio ~0.15s: shiftar ASS +0.15s antes do burn
QCR-050 | broll | 4 leads azul-abstratos verificados-limpos: circuit board macro / blue digital waves / abstract bokeh dark / abstract energy waves — frame-gate SEMPRE
QCR-051 | broll | Beat "code/script": PREFERIR motion (--drop-window); leads "limpos" degradam com a rotacao do ledger
QCR-052 | broll | Beat "magical/sparkle": "abstract light leaks dark", NUNCA "colorful bokeh"/"sparkle" (pessoas com sparklers)
QCR-055 | qc | Blanket SUBTITLE_TIMING -1xN em subs sincronizadas = variancia do grader: clean re-read (QCR-012), NUNCA re-timing
QCR-057 | broll | "abstract light leaks dark" esgota no ledger: beat "output/publish/media" -> "abstract energy waves blue dark"
QCR-058 | motion | LottieIcon disponivel (recolor por palette, deterministico) — assets em public/lottie/
QCR-059 | subs | srt_to_ass: guard tag-aware p/ numeros em --highlights (evita double-wrap)
QCR-060 | scrape | (retired — no scraper in this edition)
QCR-060b | motion | default = premium-classic (copiar PremiumSectionRef.tsx); hand-drawn e o FALLBACK (ver DIRECTIVES SS1)
QCR-062 | assets | Capturar referencias REAIS (repo/site/logo) via Playwright + ScreenshotCard anotado — 3a fonte visual
QCR-063 | subs,broll | BRAND_FIX "skill cloud"->Claude; stock "interior/home/chair" = trap de pessoas -> motion
QCR-064 | state | Ingest Phase 0 p/ video fornecido; BRAW e blocker duro (sem decoder CLI)
QCR-065 | qc | Nudges de timing candidatos NAO shipam sem A/B verify (QCR-007)
QCR-066 | qc | Checklist #13=YES e rows MOTION_DUPLICATE sao MUTUAMENTE EXCLUSIVOS — dropar rows auto-refutantes
QCR-067 | qc | Grade parser tolera "GRADE: [100]/100" e forma com conta matematica (ultimo numero da linha)
QCR-068 | broll | "colorful light burst" -> rostos neon REJECT; clips de tinta COMECAM pretos: rever o mp4 real, nao so o PNG
QCR-069 | subs | BRAND_FIX "Cloud Code"->"Claude Code" (bigram guarded)
QCR-070 | qc | Banir justificativas auto-refutantes ("redundant/exact match/usually fine") em MOTION_DUPLICATE; <=3 shared = SANCIONADO
QCR-071 | qc,subs | Storm de MOTION_DUPLICATE em tool-roundup -> clean re-read; BRAND_FIXES Playwright/Glyph/Firecrawl
QCR-072 | qc | MOTION_LIST: parear cada titulo com a subtitle concorrente + max-consecutive-shared pre-computado
QCR-073 | subs | BRAND_FIXES: Emergence/Grok/bots (lookahead de contexto AI)
QCR-074 | subs | Guard de timestamps degenerados (span<<duracao) redistribui proporcional; BRAND_FIXES AirLLM/Llama
QCR-075 | qc | Parser fallback: sem prefixo GRADE, capturar o ultimo "N/100" do texto
QCR-076 | assets,sound | Dribbble deep-link = captcha (capturar HOMEPAGE); add_music: passar --song combinando o mood do brief
QCR-077 | motion | Kicker nao ecoa frase da narracao (4+ consecutivas)
QCR-078 | motion | Icones de FullMotionFrame = KEYS do HD_ICONS, nunca paths
QCR-079 | motion | Gramatica 6-secoes: SS5/SS6 graphics-only com ZERO texto baked
QCR-080 | motion | MATCH a linha falada + VARIAR o mecanismo (assertVariety/assertSectionGrammar)
QCR-081 | motion | Zoom-punch do FullFrameAvatar SS3: 1.0->1.16 em ~8 frames easeOutCubic; alternar in/out
QCR-082 | assets | Circulo draw-on anela o ELEMENTO principal real (--focus "sx,sy" do prepare_reference_shot.py)
QCR-083 | motion | HD_ICONS semanticos: coin/eye/cursor/ad/loader/lock (NO emoji)
QCR-084 | subs | validate_subtitles --section-grammar: clearance 1450->1340 p/ layouts full-frame/zoomed
QCR-085 | qc | Reference card do QC deve ser GRAMMAR-AWARE (checklist #14/#15)
QCR-086 | heygen | Screenshots Playwright nao persistem: browser_run_code com path ABSOLUTO (-> .debug/<RUN>/)
QCR-087 | heygen | Script-fill: clicar o MEIO do body do editor, depois insertText; DELETAR Scene 2 vazia antes do Generate
QCR-088 | motion | assertVariety so pega repeticao ADJACENTE: >6 beats exigem reuso visualmente distinto ou fold
QCR-089 | heygen | Left-nav e flyout de hover que intercepta o clique: mover mouse p/ neutro ANTES, clicar editor x>=175
QCR-090 | subs | JSON da transcricao truncado: maxOutputTokens 32768 + salvage do maior prefixo valido + retry
QCR-091 | state | Updaters multi-linha PT-BR: usar Write tool -> arquivo, depois python3 (nunca heredoc bash)
QCR-092 | heygen | Estimativa de duracao baixa pos-fill = rate-limit 429: RELOAD do draft + 1 insertText + esperar 12s — nunca re-clear
QCR-093 | brief | premium-classic e o ENFORCED DEFAULT; premium_palette pelo tema (marble-gold/charcoal-gold/midnight-azure/...)
QCR-094 | subs | BRAND_FIXES: OpenClaw (nao "Open Claw"), Work IQ
QCR-095 | subs | TAIL-DROP do Gemini (clausulas finais faltando): guard de gap >2.5s -> WARN + append manual do tail
QCR-096 | heygen | Submit v4 pode falhar SILENCIOSO: verificar processing card em 3-5min, senao RE-SUBMIT; Avatar V = 1920 nativo
QCR-097 | scrape | (retired — no scraper in this edition)
QCR-098 | assets,motion | Semantica do asset premium: o objeto DEVE ser o substantivo falado (coin p/ custo, NUNCA p/ documentos)
QCR-099 | motion | Screenshots GRANDES full-frame (948x1208); SS2 como overlay sibling; palette varia por tema
QCR-100 | motion | Font Montserrat/Proxima ALL CAPS (nao serif); sem kicker no SS1; imagem LITERAL; elementos que se MOVEM
QCR-101 | brief | charcoal-gold p/ temas AI/power/drama; arco two-evidence announce->suspensao
QCR-101b | motion | Evidence em SPLIT painel superior (CHILD do frame), width-bound sem crop, top-anchored; CARD_W 1008
QCR-103 | assets | Screenshot animado DEFAULT scroll (fullPage capture); zoom no 2o beat (focus do --focus, zoomTo~1.6); SPA/WebGL hero em branco -> capturar secao de prosa
QCR-102 | motion | Margens seguras >=96px horizontais em TODO texto; headline SS1 baixa (flex-end) perto da split line
QCR-102b | brief | midnight-azure p/ debunk/myth-bust com two-evidence (prova real + feature/launch)
QCR-103b | motion,assets | Zoom mira o CENTRO do elemento principal, clamp a imagem; zoomTo 1.4-1.7 (default 1.6)
QCR-104 | motion | SS3b Kinetic Caption: full-frame palette-bg, 2-3 palavras BIG centradas, fade-up; pacing ~2s/secao
QCR-104b | post | Re-checar log + scheduler por dup do topico ANTES de postar (corrida paralela); nunca double-log
QCR-105 | motion,brief | Reusar brass library (concept-match) ANTES do fallback hand-drawn; olhar cada asset
QCR-106 | subs | SUBTITLE_BAND_FLOOR=1430 no validate --section-grammar (ignora texto de motion acima da faixa da legenda)
QCR-107 | qc | validacao end-to-end da gramatica nova; BRAND_FIX "Claudio"; headline != hook
QCR-108 | motion | GAP de 1 frame (flash do avatar) = arredondamento F(span): usar sectionWindows(fps, times) SEMPRE
QCR-109 | subs,motion | Sem caption abaixo do screenshot; suprimir SRT queimada nas janelas de kinetic-caption; 1 Audio root + PremiumBg floor
QCR-110 | heygen | Look do avatar: browser_click no BOTAO interno do card (z-[8] overlay intercepta cliques crus)
QCR-110b | state | NUNCA pkill -f playwright (mata o MCP server): browser_close + retry, ou /mcp restart
QCR-111 | subs | Gemini normaliza coloquial PT-BR (ta->esta): preferir build_srt_from_script p/ script coloquial
QCR-112 | motion | Componentes de texto premium TAMBEM obedecem complement rule (<=3 palavras vs SRT concorrente) — diff antes do render
QCR-113 | subs | BRAND_FIX "Polsia" (mishear de Policia)
QCR-114 | heygen | Download do HeyGen: newest por mtime + VERIFICAR o conteudo (SRT/audio) antes de usar
QCR-115 | assets | (retired — concerned a removed integration)
QCR-115b | qc | Checklist #10 sem ambiguidade: "BOTTOM edge do subtitle >= px1700 danger zone" (wording no QC_INSTRUCTIONS)
QCR-116 | heygen | Clicar Generate via getByRole('button',{name:'Generate'}), nunca ref de snapshot (#preview-button)
QCR-118 | assets,motion | Reuso de asset premium exige PALETTE-match alem de concept-match (robo cartoon em charcoal-gold = DEFECT)
QCR-119 | state | (retired — concerned a removed integration)
QCR-119b | subs | suppress_windows.py aceita ambos os shapes de JSON ({start,end} e [a,b])
QCR-119c | subs | BRAND_FIX "Karpathy" (carpathy/carpatie)
QCR-120 | post,state | DUP-POST guard no resume: grep pipeline-log ANTES de rebuild; topico ja postado -> NAO re-postar
QCR-121 | subs | BRAND_FIX "Qwen" (queen/quinn/quem + versao)
QCR-121b | heygen | Fluxo "New video" fresh (herda ultimo avatar) + painel INLINE "Change look" — modal "Add avatar" e automation-proof
QCR-122 | heygen | NUNCA recarregar /draft puro (reseta avatar->stock + Landscape); verificar avatar via DOM pos-fill
QCR-123 | assets,motion | Objeto escuro em palette escura fica invisivel: adicionar Glow (radial copper 1.7x, blur 10px) + brightness-check
QCR-124 | subs | TAIL-COLLAPSE parcial: guard checa dur<0.4s + char-rate + nao-monotonico -> redistribuir segmentos finais
QCR-125 | heygen | Troca de grupo de avatar: mouse.move+click no CENTRO do card overlay z-[8] (botao "Choose look" tem pointer-events:none)
QCR-126 | assets | Chroma-key gate em palette CLARA: compor no BG real (marble/ivory) revela residuo cinza -> aceitar/regenerar no bg real
QCR-127 | assets | Fundo verde-sage (apagado) do provedor de imagem: re-key --t-low 14 --t-high 30 --despill 0.7; fallback border-flood p/ bg branco/mint
QCR-131 | qc | validate_subtitles FALSO-FAIL em texto de motion: autoridade = geometria ASS PASS + frame LOOK
QCR-132 | post | Dup-guard RE-CHECK imediatamente antes do agendamento (janela de corrida de 20+ min)
QCR-133 | assets | 1 drop de rede do provedor de imagem != fallback: retry+resume POR ASSET; fallback so com provedor fora ou beat esgotado
QCR-134 | subs | SRT vive em <scratch> pos-Phase-3: SEMPRE cp p/ <downloads>/<Name>.srt antes dos gates
QCR-128 | brief | marble-gold p/ oportunidade/anuncio; palette CLARA sem glow
QCR-135 | assets | (retired — concerned a removed integration)
QCR-136 | motion | PillHeadline: <=16 chars no size 74; passar size:60 p/ ate ~24 chars; frame-LOOK do SS1 obrigatorio
QCR-137 | heygen | (retired — concerned a removed integration)
QCR-138 | heygen | Titulo HeyGen nao persiste: resolver render pela URL do DRAFT-ID (/videos/<draftId>), nunca "newest card"
QCR-139 | scrape | (retired — no scraper in this edition)
QCR-140 | scrape | (retired — no scraper in this edition)
QCR-141 | assets | Heroes de paisagem geram FAIXA de chao que quebra o key: prompt "NO floor/ground/horizon, bg solid green edge-to-edge"
QCR-142 | subs | BRAND_FIXES NotebookLM e Pomelli
QCR-143 | brief | ivory-emerald (palette CLARA) p/ listicle; sem glow em palette clara
QCR-144 | subs | BRAND_FIX "VS Code" (v esse code / vis code)
QCR-146 | scrape | (retired — no scraper in this edition)
QCR-147 | motion | SS5 split-graphics DEVE aparecer (anti ping-pong caption<->hero): assertSectionGrammar obrigatorio
QCR-148 | subs | BRAND_FIX "CLAUDE.md" (cloud.md)
QCR-149 | motion | PillHeadline SEMPRE pill preta + texto BRANCO + acento amarelo — em QUALQUER palette
QCR-150 | brief | marble-gold p/ agente autonomo; assertSectionGrammar com 3 split + 2 full
QCR-151 | brief | bordeaux-rose validada (6a palette); keying sage 14/30
QCR-152 | assets | Light-mint derrota os thresholds: border-flood-fill OU regen "pure #00FF00 edge-to-edge"
QCR-153 | assets,motion | Palette CLARA exige hero de corpo ESCURO/saturado (charcoal/navy/bordeaux/gold) p/ contraste
QCR-154 | heygen | Avatar IV esgotado -> "Switch to Avatar III" ($0) automaticamente; avatar preservado
QCR-155 | brief | slate-copper validada (palette escura); tail-redistribute
QCR-156 | qc | Phantom em caption suprimida: ground-truth ENUMERA as janelas + re-declara os bans QCR-020/066
QCR-157 | subs | BRAND_FIX "{artigo} cloud"->"{artigo} Claude" (do/no/ao/o cloud)
QCR-158 | motion | caption_windows.json = indices REAIS das Sequences SS3b/SS5b do .tsx FINAL; verificar 2 frames pre-QC
QCR-159 | post | Re-grep do log IMEDIATAMENTE antes do 1o POST (sibling paralelo pode postar mid-run)
QCR-160 | scrape | (retired — no scraper in this edition)
QCR-161 | assets | Heroes greenscreen NUNCA com corpo VERDE (conflito com chroma-key), em qualquer palette
QCR-163 | motion,assets | Fallback hand-drawn quando o provedor de imagem falha em TODAS as chamadas (down, não blip) — passou QC 97 com screenshot real
QCR-164 | subs | BRAND_FIXES: "Cloud Corps"→"Claude Corps"
QCR-165 | scrape | (retired — no scraper in this edition)
QCR-166 | post | IG web Crop default 1:1 — selecionar 9:16 portrait ANTES do Next; verificar reel live em portrait
QCR-173 | state | Estado per-run pipeline-runs/<run>.json + flock atômico; ledger de keyword isolado (SHIPPED)
QCR-184 | scrape | (retired — no scraper in this edition)
QCR-185 | assets | Objeto MARBLE/BRANCO/PALIDO: incluir 'fundo #00FF00 edge to edge, NOT white/gray' ja no 1o prompt; preferir locator.click() a page.mouse.click(x,y)
QCR-NOTE-28 | note | validação: premium-classic charcoal-gold QC 100/100
QCR-195 | qc | Rubric <scratch>/qc_rubric.txt: reconstruir POR VÍDEO; nunca reusar stale
QCR-182 | heygen | Avatar IV sem créditos NÃO é blocker: clicar "Switch to Avatar III" automaticamente, nunca perguntar
QCR-202 | manychat | CREATE automação dedicada [<KEYWORD>] por vídeo; MODE=modify PROIBIDO; verificar nome==keyword==LIVE
QCR-203 | qc | §4 hero premium é FULL-FRAME (sem avatar) — marcar assim no ground-truth; §1 pill pode gerar falso MINOR
QCR-209 | subs,heygen,sound | BRAND_FIXES: "Crew AI"->CrewAI; §3b/§5b sem word-timings -> even-spread na janela SRT; SRT sentence-level: shift pequeno + gap-fill de END (nao shift global grande)
QCR-212 | heygen,sound | Abrir o video pronto pela URL /videos/<draftId> (clicar no titulo entra em rename); export 1080p 'Preparing...' pode levar 2-3 min — esperar; add_music --song = basename
QCR-213 | subs | Supressão de janela: usar BOUNDARY_EPS=0.08s de folga no arredondamento (não zero-tolerance)
QCR-214 | post | IG sem idempotência: snapshot do grid ANTES do Share; reconciliar antes de re-postar (nunca 2 reels)
QCR-216 | post | Dup-guard: re-checar log+state IMEDIATAMENTE antes do 1º post de plataforma (corrida paralela)
QCR-217 | subs | Download de reel IG via yt-dlp exige --cookies gerado do instagram-storage-state.json
QCR-218 | assets | Full-page timeout em página pesada: viewport alto + motion=zoom + cleanup suave
QCR-219 | state | Ownership heartbeat lock (worker_pid+heartbeat_ts) no estado per-run — base do check-owner
QCR-223 | qc | Propagar correções de wording de leitura #10 ("subtitles below 1700") ao QC_INSTRUCTIONS
QCR-225 | qc | SRT sentence-level começa ~0.1s antes da fala — 25 phantom MINOR; tolerância no ground-truth
QCR-226 | manychat | Drag no canvas pixi DESANEXA nós do link-DM — nunca free-pan; editar in-place
QCR-227 | post | Sessão YT pode estar morta server-side com cookies presentes: checar --liveness; fallback Metricool + alerta (alert.py)
QCR-228 | motion | Auto-fit de caption em box overflow:hidden: reservar ≥1 linha extra de orçamento vertical
QCR-230 | subs | transcribe_gemini: auto-retry quando salvage devolve contagem absurda (942 segs) ou clean[] vazio
QCR-232 | subs | Timestamps degenerados absorvem pausas: VAD-anchor (vad_align.py) + gate verify_srt_timing.py PAUSE-COVERAGE
QCR-231 | qc | Ground-truth marca CADA janela [SUB:ON] ou [SUB:SUPPRESSED] (mata storm SUBTITLE_PRESENCE)
QCR-229 | motion,subs | Gate verify_caption_sync.py pré-render + pré-burn: caption §3b/§5b = SRT verbatim, janela snapped
QCR-233 | manychat | Duplicate PODE perder o nó link-DM: reparar via Basic Builder com cautela (ver QCR-258)
QCR-234 | script | Tópico de link já postado com URL diferente = RESPIN (hook novo)
QCR-235 | qc | Lead uniforme ~0.3s flagado pelo grader com gate VAD PASS: aplicar shift só se gate confirmar; senão phantom
QCR-240 | subs | §1 pill + subtitle inferior = phantom OVERLAP: suprimir janela de subtitle do §1; BRAND_FIXES claude-mem/OpenCode
QCR-244 | subs | SRT que não cobre o tail: ESTICAR o bloco final do CTA (não reconstruir — mantém janelas sincronizadas)
QCR-248 | qc | Auto-ingerir <Name>_caption_windows.json no MOTION_LIST do QC (§3b/§5b premium)
QCR-249 | post | Dup-guard falso-positivo em status de FASE: checar status do RUN explicitamente
QCR-251 | motion | Font delayRender timeout: re-rodar com --timeout alto (300000) — transiente, não é bug da comp
QCR-253 | assets | Browser travado por run concorrente → fallback headless_capture.cjs p/ screenshots
QCR-256 | subs | Toda cue ganha +200ms de lead-out de legibilidade
QCR-250 | motion | "Request closed"/font-timeout no render = transiente: retry com --timeout 120000+ — NUNCA cair p/ hand-drawn
QCR-262 | qc | Palette escura: glow dourado faz grader ler subtitle BRANCA como amarela — phantom; [YELLOW:none] do ASS vale
QCR-263 | qc | MOTION_DUPLICATE dentro de janela §3b/§5b suprimida = phantom: inline a imunidade QCR-193 na regra #13
QCR-264 | subs | BRAND_FIXES: Unsloth/Colab/Llama/Gemma (proteger "gema" comum)
QCR-266 | subs,qc | Gap <0.30s entre cues = pausa VAD intencional: gap-fill no ASS pré-burn; 0.00s NUNCA é flag
QCR-267 | subs | Tail STRETCHED+CRAMMED passa gate agregado: redistribuir tail proporcional a chars; checar per-segment
QCR-268 | subs | validate_subtitles.py pós-burn SEMPRE com --section-grammar em vídeo premium (senão FAIL falso garantido)
QCR-269 | assets | Timeout por-beat no batch do provedor de imagem é normal: re-rodar o MESMO comando 1× preenche os faltantes (resume-safe)
QCR-269b | qc | #7=YES ⟹ ZERO rows SUBTITLE_TIMING sub-0.5s (mutual-exclusion — mata o storm de lead uniforme)
QCR-270 | qc | Gold da reveal §3b/§5b ≠ inconsistência de highlight: ground-truth diz "não há subtitle inferior aqui"
QCR-271 | subs | Tail degenerado recorrente → build_srt_from_script.py (determinístico); rodar verify_srt_timing logo após transcrever
QCR-272 | qc | Injetar assert MECÂNICO "SUBTITLE_WRAP impossível" (verificado do ASS) no ground-truth — mata a família na 1ª leitura
QCR-273 | script,state | <scratch>/heygen_script.txt é COMPARTILHADO entre runs: sempre usar <downloads>/<Name>_script.txt per-run
QCR-274 | qc | LEAD <0.5s = antecipação intencional do leitor: proibir rows "appears too early" e shifts +0.2s (reintroduz QCR-232)
QCR-275 | motion | Render SEMPRE com --timeout 300000 --concurrency 3 (font delayRender) — skill e quick-ref alinhados
QCR-276 | qc | Proibir SUBTITLE_TIMING "blank/missing subtitle" dentro de janela de supressão (a caption É o texto ali)
QCR-280 | qc | MOTION_LIST premium: anotar max-consecutive-shared por label (QCR-072) + texto verbatim das captions suprimidas
QCR-281 | heygen | page.mouse cru pode wedgear ("Invalid parameters"): usar locator click + Range delete + keyboard.type
QCR-281b | post,state | Double-own entre state files DIFERENTES: dup-guard (grep log pelo shortcode) antes E depois de cada superfície irreversível
QCR-282 | subs | VAD pode SWAPPAR ordem de 2 fragmentos adjacentes: preferir build_srt_from_script quando o script existe
QCR-NOTE-27 | script,manychat | Keyword com número falado (VEO3→"veo três"): registrar grafia COM espaço p/ gerar ambas as variants
QCR-283 | subs | Highlights: strip pontuação final + frase completa p/ marca multi-palavra; preferir tokens únicos (BUMBLEBEE, MCP)
QCR-284 | subs | SRT contíguo já alinhado que falha o gate: CLAMP ends-to-speech dentro da janela (nunca redistribute pós-render)
QCR-285 | motion | ANTES do render: prune public/*.mp4 exceto o avatar do run atual (ENOSPC; re-derivável de <downloads>)
QCR-215 | subs,sound | Cue longa >=1s no hook SS1: dividir em 2 entries proporcionais antes do srt_to_ass
QCR-220 | subs | Shift global +0.15s quando o QC flaga padrao uniforme "early" na track inteira (confirmado pelo gate)
QCR-221 | assets | Site muito animado: re-capturar em modo GENTLE (sem strip fixed/sticky) em vez de fullPage
QCR-222 | state | Run in_progress nao e livre: maestro_state.py check-owner RECUSA se owned (heartbeat<180s) — nunca double-own
QCR-236 | subs | ONSET_SHIFT_MS=80 em todo start de cue no srt_to_ass (apos merge_short_entries)
QCR-237 | subs | Pause-coverage ~0.9: clampar END da cue ao run_end+0.12s (per-cue start-containing-run)
QCR-238 | insert | Manifest de broll VAZIO (video all-motion) e legitimo: passthrough, nunca ValueError
QCR-239 | qc | Dentro de janela suprimida SS3b/SS5b: proibir flags SUBTITLE_STYLE (so existe a caption, sem subtitle inferior)
QCR-241 | state | macOS nao tem timeout CLI: usar run_in_background em vez de `timeout N cmd`
QCR-242 | qc | qc_prompt generalizado: sem nomes de tool hardcoded — usar o ground-truth DESTE video
QCR-243 | scrape | (retired — no scraper in this edition)
QCR-245 | qc | Row SUBTITLE_TIMING invalida se New==Old ou |New-Old|<=0.3s com timing-gate ja PASS
QCR-246 | heygen | NUNCA reusar draft do create-v4 populado por outro run: sempre abrir "New video" fresh
QCR-247 | qc | Video denso em supressao SS3b/SS5b: listar cada janela + anotacoes de regiao (top vs bottom) no ground-truth
QCR-252 | subs,motion | Run com script conhecido: build_srt_from_script ANTES da Phase 5 (janelas snapam em fala real)
QCR-257 | subs | BRAND_FIXES "Context7" (context set/sete/seven/7)
QCR-258 | manychat | NUNCA trocar duplicate fresh de Flow Builder p/ Basic Builder (poda o true-branch do link-DM)
QCR-259 | subs | BRAND_FIXES "Claude Science"/"Jupyter"; tail-clamp p/ tail-underrun
QCR-260 | subs | Rodar verify_srt_timing LOGO APOS a Phase 3; FAIL -> rebuild via build_srt_from_script ANTES da Phase 5
QCR-261 | motion,subs | Autorar janelas de caption SS3b/SS5b a partir do SRT VAD-alinhado UP FRONT (nunca do SRT degenerado)
QCR-NOTE-01 | subs | Highlight do TOKEN numerico inteiro com pontos ("48.000", nao "48")
QCR-NOTE-02 | note | validacao: premium link run 100/100 charcoal-gold
QCR-NOTE-03 | note | validacao: link premium 100/100; add_music --song usa basename
QCR-NOTE-04 | note | validacao: midnight-azure 99/100; caption DEVE manter diacriticos PT-BR
QCR-NOTE-05 | note | validacao: bordeaux-rose 100/100, 14 secoes
QCR-162 | state | macOS nao tem `timeout`: usar gtimeout (coreutils) ou run_in_background
QCR-167 | qc | Prompt de QC condensado reabre alucinacoes SUBTITLE_WRAP: usar o prompt completo do QC_INSTRUCTIONS
QCR-168 | assets | (retired — concerned a removed integration)
QCR-169 | subs | BRAND_FIX plural "Clouds"->"Claudes"
QCR-170 | post | Guard pre-post (QCR-159) detecta build concorrente redundante — reconciliar, nao re-postar
QCR-171 | qc | SUBTITLE_WRAP em tela de 2 linhas <=18 chars cada = phantom (nunca somar L1+L2)
QCR-172 | subs | suppress_windows roda no .ass APOS o srt_to_ass, nunca no .srt
QCR-174 | motion | Badge "REAL" do PremiumOpeningHook: inset ~8-12px do topo do card
QCR-175 | post | Sessao YT pode morrer server-side com --check passando: checar liveness real
QCR-176 | assets | Corpo do hero greenscreen NUNCA verde/emerald: carvao/navy/bordeaux/gold
QCR-177 | scrape | (retired — no scraper in this edition)
QCR-178 | scrape | (retired — no scraper in this edition)
QCR-179 | assets | (retired — concerned a removed integration)
QCR-180 | heygen,subs | PER-RUN AVATAR ISOLATION: rm do Quick-Avatar compartilhado + cp p/ <Name>_avatar_1080p.mp4; gate audio<->subtitle antes do burn e do QC
QCR-181 | motion,brief | Downgrade premium->hand-drawn NUNCA silencioso: alerta (alert.py --platform images) + stamp images_fallback/images_alert_sent no state; check_opening_headline.py bloqueia
QCR-183 | manychat | set_resource_cta disable nao aceita --video: conferir flags do subcomando
QCR-186 | motion | Colisao de case em nome de comp orfa quebra o bundle inteiro: nomes case-distintos
QCR-187 | subs | BRAND_FIX "Anthropic" (antropi/antrofi)
QCR-188 | scrape | (retired — no scraper in this edition)
QCR-189 | script | Topico de WebSearch: verificar a DATA do anuncio numa fonte PRIMARIA antes de comprometer (rejeitar >~30d ou nao confirmado)
QCR-190 | assets | Prompt greenscreen "object-on-surface" enche o frame e quebra o key: objeto isolado bg verde
QCR-191 | assets | restore_session --snippet: capturar stderr (ruido no check)
QCR-193 | qc | CAPTION-WINDOW: dentro de janela suprimida a caption E a subtitle — proibir double-count (base dos QCR-239/263/270/276)
QCR-194 | assets | (retired — concerned a removed integration)
QCR-200 | subs | Highlight cobre TODOS os itens da categoria (Claude,GPT,Gemini) — nunca parcial
QCR-201 | assets | (retired — concerned a removed integration)
QCR-204 | assets | Medir o verde do chroma POR IMAGEM; t-high ABAIXO da medida
QCR-205 | motion | Titulos SS4 NUNCA copiam a narracao verbatim (MOTION_DUPLICATE -20)
QCR-206 | subs | BRAND_FIX "codex --oss" (mishear Ollama)
QCR-208 | qc | SUBTITLE_OVERLAP por regiao = phantom conhecido; BRAND_FIX Cloud->Claude
QCR-210 | sound | Hook riser default ON na Fase 9 (peak no fim do hook, ducked 0.75)
QCR-211 | sound | Transition clicks default ON na Fase 9 (1o 0.20, resto 0.11, transient no corte)
QCR-NOTE-06 | note | validacao: verificar login do HeyGen na superficie /avatar/studio (nao /home); batch parcial do provedor de imagem nao e fallback; reuso de assets keyed de run anterior do mesmo topico
QCR-NOTE-07 | qc | Lead de ~0.1s nas boundaries do SRT = phantom (ver QCR-274)
QCR-NOTE-08 | note | validacao: charcoal-gold 100/100 first submit
QCR-NOTE-09 | note | (retired — concerned a removed integration)
QCR-NOTE-10 | note | validacao: ENOSPC + StatBurst overflow + base64 corruption tratados
QCR-NOTE-11 | motion | Accent do CTA SS3b/SS5b muito ESCURO em certas palettes: checar contraste
QCR-082b | brief,motion | premium-classic com image-icons do provedor de imagem e o DEFAULT — DIRECTIVES SS1
QCR-117 | note | validacao: premium-classic charcoal-gold 100/100 first submit (angulo distinto de um video anterior do mesmo tema)
QCR-XXX | note | template de entrada nova (topo do active-rules.md) — copiar o formato ao registrar um QCR
QCR-NEW | script,state | <scratch>/heygen_script.txt clobberado por run concorrente — usar o script per-run (ver QCR-273)
QCR-NOTE-12 | note | validacao: premium-classic midnight-azure 100/100 iter1; browser_run_code roda em Node (sem atob/Buffer): decodificar base64 no page.evaluate
QCR-RUN | qc | QC entra em table-loop na 1a leitura: descartar e re-chamar (classe QCR-012)
QCR-NOTE-13 | note | validacao: link-run Remotion-editor 99/100; add_music --song exige basename, nao path
QCR-286 | qc | PREFERIDO: montar o ground-truth com build_qc_ground_truth.py (mata as familias phantom na 1a leitura); fallback = receita manual do Step 5.3b
QCR-287 | qc | build_qc_ground_truth: overlap de janela de caption mede DURAÇÃO (>0.15s = leak real), não toque-de-borda; janela §3b/§5b snapa na PRÓPRIA sentença
QCR-288 | note | validação: run completo pós-reorg verde (QC 100, IG live, ManyChat live); respin exit-1 doc + QCR-287 fixes
QCR-289 | heygen,state | Pad HeyGen CONDICIONAL: ffprobe height, cp se já 1920 (Avatar III/V nativo), re-encode só em 1906; + regras de token (nunca browser_navigate em página pesada; delegar 4 fases pesadas; não chutar flag de CLI)
QCR-290 | heygen | Fase 3: copiar os snippets browser_run_code validados no HEYGEN_INSTRUCTIONS (retornos minúsculos) em vez de snapshotar p/ descobrir selectors; snapshot só se o snippet vier vazio (UI mudou)
QCR-291 | brief,motion | Edit Direction (Phase 4.7 plan-edit-direction, SHADOW-MODE): edit_style por beat sem repetir em janela-4 (assertEditFlow apertado 3→4 + verify_edit_plan.py); palette EDIT_STYLES.md; ORTOGONAL a motion_idea (match-the-line); não muda estilo-base; canário antes de dirigir o build
QCR-292 | motion | Canário: distância-4-dura DISPROVADA (6/6 QC-pass falham, descorrelacionada; hero objeto-variado é isento senão vira QCR-006). Refinado: HARD=§1+adjacência-não-hero+richness; distância=advisory. Ganho real=profundidade de animação (1 variante vetada/run)
QCR-293 | motion | PremiumFullFlow (full-flow-diagram) construído+verificado: §6 serpentina vertical top→bottom, ALTERNA com radial rings quando há ≥2 full; candidate→solid no 1º QC≥75 real; 2 versões fracas reprovadas por QC visual (horizontal≠9:16)
QCR-294 | motion | PremiumSplitFlow (split-flow-nodes) construído+verificado: §5 fluxo horizontal no painel top-40% (avatar embaixo, sem spill), ALTERNA com rings-satellites quando há ≥2 split; horizontal encaixa no painel largo (1ª tentativa); candidate→solid no 1º QC≥75 real
QCR-295 | motion | Render font-timeout PODE ser bloat de public/: asset dirs stale (public/assets/<run>) acumulam ilimitado (814MB/76 dirs num run real) e starvam o render → delayRender timeout que PARECE QCR-275/250 mas NÃO é resolvido só por --timeout. Prune (QCR-285) ALSO reloca asset dirs >7d (mantém run atual + icons + refs + pool <7d); public bem abaixo de ~300MB antes do render
QCR-296 | note | validação: run completo optimization — RESPIN QCR-234 (tópico postado c/ URL diferente), keyword única, script 95s→65s, reconciliação factual 1M/256K; QC 100 iter1; premium-classic charcoal-gold Avatar III
QCR-297 | qc,subs | build_qc_ground_truth lia {\rYellow}/{\rWhite} (style-reset) como [YELLOW: none] → storm SUBTITLE_STYLE (-10, grade 90). Fix: walker parseia \r<Style> contra yellow_styles do header; 9 palavras amarelas agora corretas
QCR-298 | manychat | set_resource_cta _compose_dm: --blurb é slot de "Ele {blurb}" → tem que ser FRASE VERBAL. Blurb noun-phrase ("o guia completo") gerava "Ele o guia completo…"; auto-fix prefixa "é " quando começa com artigo (o/a/um/esse…)
QCR-299 | qc | §1 opening-hook pill headline: grader re-transcreve a frase e conta palavra AUSENTE da subtitle ("IA" vs "inteligência artificial") → MOTION_DUPLICATE phantom. build_qc_ground_truth emite RULE: confie no max-consecutive-shared pré-computado, nunca re-transcreva nem conte palavra fora das rows de subtitle
QCR-300 | qc,subs | build_qc_ground_truth colava o \N (quebra de linha) na palavra seguinte dentro de span amarelo → token [YELLOW: NCode]. Fix: tok.replace("\\N"," ") antes do re.findall (ex.: 0:33/0:58 "Claude\NCode")
QCR-301 | qc,subs | linha subtitle 100% amarela (Style: Yellow, todas as palavras) listada como [YELLOW: w1,w2,...] lê como highlight PARCIAL → grader mis-flag "só X destacado" -1 SUBTITLE_STYLE (0:49 "sem chave de API" 100→99). Fix: build_qc_ground_truth emite [YELLOW: ALL words (whole-line yellow style)] quando toda palavra é amarela + RULE que consistência é inerente, nunca flag #11=NO
QCR-302 | motion,qc | §4 hero LABEL deve ser complemento DESTILADO (≤3 consecutivas com a legenda concorrente), nunca o sintagma falado verbatim; label `-> REVIEW` do builder = reescrever ANTES de renderizar
QCR-303 | subs | suppress_windows.py: linha queimada cuja CAUDA vaza >0.15s numa janela §3b/§5b é TRIMADA (fim = início da janela), não só dropada por overlap substancial (par da QCR-323 head-leak)
QCR-304 | qc,motion | §2 EVIDENCE card (kicker/stamp/domain sobre screenshot REAL do repo) mis-flagged MOTION_DUPLICATE -5x2 (0:14 "O NOME É PONYTAIL/OPEN SOURCE/…ponytail" + 1:09 "DE GRAÇA·OPEN SOURCE/70K★/…ponytail" 100→90). Fix: build_qc_ground_truth marca rows id `evidence:` como EVIDENCE SCREENSHOT CARD exempt (design §2 sancionado, echo da narração é CORRETO, nunca MOTION_DUPLICATE)
QCR-305 | qc,motion | build_qc_ground_truth NÃO emitia motion list quando só `--plan` era passado (run hand-drawn/all-motion sem `_motion_list.json`) → seção de motion sumia, perdendo os pairings QCR-072 (100/100 só porque montei o MOTION_LIST à mão). Fix: fallback que SINTETIZA motion rows dos `motion_segments` do plano (win+idea→label distilada) pareados com SRT concorrente + NOTE avisando que títulos são labels distiladas. Phase 5 deveria emitir `_motion_list.json` p/ hand-drawn também
QCR-306 | qc,motion | build_qc_ground_truth CRASHAVA (`'str' object has no attribute 'get'`) quando o plano premium-grammar tem `motion_segments` = STRING descritiva (não lista) — o fallback QCR-305 iterava os CARACTERES da string. Fix: só iterar motion_segments se for lista; senão usar `scenes`; senão o array `sections[]` do plano; pular não-dict; carregar o `id` real (evidence:/caption:) na row sintetizada p/ os classificadores QCR-193/304 dispararem
QCR-307 | qc,subs | Linha whole-line `Style: Yellow` ([YELLOW: ALL words]) ainda gerava row phantom -1 SUBTITLE_STYLE ("só GLM destacado") mesmo com checklist #11=YES (0:38 "ou o GLM," 100→99). Fix: build_qc_ground_truth emite RULE de mutual-exclusion (#11=YES ⟹ ZERO rows SUBTITLE_STYLE; row contra [YELLOW: ALL words] é auto-refutante e PROIBIDA) — espelha QCR-066/269
QCR-308 | qc,motion | Motion rows SINTETIZADAS (fallback QCR-305, sem _motion_list.json) usam o `idea` do plano (PROSA que restata a fala) como "title" → max-consecutive-shared 4-12 → verdict "REVIEW (4+ shared)" → NOTE mandava CONFIAR no count → 12 phantom MOTION_DUPLICATE -5 = grade 40 (títulos reais na .tsx eram só "ZERO MENSALIDADE"/"BACKLINKS" ≤2 palavras). Fix: quando motion_synth, verdict = "SYNTHESIZED CONCEPT LABEL … shared count é vs PROSA, MEANINGLESS, MOTION_DUPLICATE-EXEMPT (#13 stays YES)"; NOTE reescrita: proibido flagar MOTION_DUPLICATE em beat sintetizado. Phase 5 deveria emitir _motion_list.json p/ premium também
QCR-NOTE-14 | qc,note | validação: hand-build de _motion_list.json a partir dos títulos REAIS da .tsx (não a prosa do plano) → ground-truth limpo → QC 100/100 iter1 (premium-classic charcoal-gold). Confirma o path correto p/ o gap Phase-5-sem-motion-list do QCR-308: LER a .tsx, nunca deixar cair na síntese de prosa
QCR-309 | qc,subs | Storm SUBTITLE_TIMING na frase-espelho ("appears too LATE / shift start EARLIER por poucos frames", ex 0:23.58→0:23.50) — 16 phantom -1 → grade 84 num reel VAD-anchored limpo (#7=YES, todos os shifts ≤0.13s <0.5s, gate ffmpeg PASSOU). A regra QCR-274 só nomeava o caso "too EARLY / shift +". Fix build_qc_ground_truth: (1) regra de antecipação agora cobre AMBAS as direções (start dentro de 0.5s = by-design, ONSET_SHIFT+lead-out QCR-236/256; 'too early'/'shift +' E o espelho 'too late'/'shift −0.05..−0.3s'/'align with speech' são auto-refutantes PROIBIDOS); (2) QCR-245 virou MECHANICAL BAN: computar |New-Old| das próprias colunas e DROPAR a row quando New==Old ou |New-Old|≤0.30s. Também: check pós-HeyGen de divergência de canal stereo (energia L−R) p/ auto-detectar o defeito de narração parcial sobreposta
QCR-315 | qc,subs | build_qc_ground_truth derivava janelas de supressão só de `--segments` (_caption_segments.json) que OMITE a janela §3b CTA/grouped (PremiumKineticCaption groups=[...], sem frase verbatim) — presente só em _caption_windows.json (ex.: 4 de 5 janelas; a CTA 83–92s ficava FORA da lista de supressão → risco de phantom SUBTITLE_TIMING "blank subtitle"/MOTION_DUPLICATE; só passou porque hand-tagged no motion-list). Fix: novo arg `--caption-windows` ingere _caption_windows.json e sintetiza uma row de supressão p/ qualquer janela não coberta (>50% overlap) pelos segments. Passar SEMPRE ambos. QC 100 iter1
QCR-316 | qc,motion | §1 opening-hook pill contava 4 consecutivas ATRAVÉS da fronteira de tela de subtitle (concurrent_srt_text concatenava TODAS as cues da janela) E caía no verdict genérico "REVIEW (rewrite)" contradizendo a regra QCR-299 do rodapé → 1 phantom -5 MOTION_DUPLICATE, grade 95. Fix build_qc_ground_truth: (1) novo max_consecutive_shared_vs_cues — max por cue SEPARADA, nunca concatenação (mata match cross-boundary p/ TODO título); (2) branch is_opening (id opening:/hook:) ANTES do gate genérico emite verdict SANCIONADO §1 (QCR-149/299, "NOT MOTION_DUPLICATE even if 4 shared, do NOT deduct") em vez de REVIEW. Verdadeiro max por-tela do pill = 3 ("LIMITE DE API"). Standing: Phase 5 sem _motion_list.json p/ premium (QCR-308)
QCR-317 | qc,motion | build_qc_ground_truth lia o título de motion só do campo `text`; motion list per-run keyed em `title` → 14 títulos emitidos VAZIOS (0 words). Passou 100 só porque labels §4 descartados eram ≤3 palavras; label §4 futuro com 4+ palavras esconderia MOTION_DUPLICATE real (false-green). Fix: `m.get("text") or m.get("title") or ""` (aceita ambos os campos, back-compat). Verificado: labels §4 reais reaparecem (ZERO CENTAVOS/TROCA SOZINHA/A PONTE GRÁTIS), todos ≤2 shared, 100 mantido
QCR-NOTE-15 | note | validação: premium-classic charcoal-gold 100/100 iter1 (OmniRoute/Codex de graça, Avatar III, keyword CODEXGRATIS); Step-0 gate 0.98/0.97
QCR-318 | qc | Storm de "burned subtitle not suppressed" (+bleed de outro script) dentro das janelas de supressão → grade 55. Fix build_qc_ground_truth: bloco VERIFIED-EMPTY BOTTOM-BAND no topo da seção de supressão (count total = conjunto completo; texto fora das N rows = bleed PROIBIDO). Re-read limpo → 99
QCR-319 | qc,motion | max-consecutive-shared do motion-title medido vs SRT sentence-level (não vs as telas ASS queimadas) → §4 label "RECURSOS DA VERSÃO PAGA"=4 phantom REVIEW. Fix: cues do overlap vêm das rows ASS (o que está na tela), SRT só fallback → =3 COMPLEMENT
QCR-320 | heygen | HeyGen v4 Submit falha SILENCIOSO via dialog `beforeunload`: draft fica editável, NUNCA renderiza, card `% Ready` não aparece. Fix/guardrail: pollar o card `NN% Ready` como sinal POSITIVO; se em ~30-45s não apareceu e a página ainda é o draft editável → re-abrir o draft + re-Generate→Submit, ACEITAR o dialog (browser_handle_dialog accept:true) p/ a navegação completar, confirmar o card antes de tratar Phase 3 como iniciada. Recorrência concreta de QCR-096
QCR-321 | subs,qc | SRT sentence-level do Gemini FALSE-POSITIVA o gate pause-coverage QCR-232 (0.97) mesmo com onset +0.00 / tail +0.42 (cues absorvem pausas inter-frase); build_srt_from_script conserta pause-coverage (0.14) mas COMPRIME as últimas 3 captions ~2.6s cedo. Fix working = HYBRID: corpo do build_srt + as N últimas entries (tail) do SRT Gemini (timestamps reais do fecho). Passou pause-coverage 0.14 + Step-0 0.95 + caption-sync §5b 1.00. TODO: build_srt ancorar últimas N cues aos timestamps reais do Gemini / verify_srt_timing isentar pause-coverage alta quando onset+tail <0.5s
QCR-322 | qc | build_qc_ground_truth rodado SEM `--caption-windows` (lapso da regra QCR-315); só seguro pq o vídeo não tinha janela CTA/grouped (todas §3b/§5b sentence-form em _caption_segments.json). Fix: adicionar `--caption-windows` à invocação MOSTRADA em QC_INSTRUCTIONS Step 5.3b + skill GROUND-TRUTH BUILDER (regra no ponto de uso, não só em active-rules) p/ não ser pulada ao copiar o exemplo. Latente false-green num vídeo futuro COM grouped CTA
QCR-NOTE-16 | note | validação: premium-classic charcoal-gold 99/100 iter1 (OpenAI prompt packs 300+ prompts por cargo, hook "300 PROMPTS PRONTOS DE GRAÇA", keyword prompts); Step-0 0.95/0.91; único -1 = overlap 0.21s tail da caption §5b (auto-refutável QCR-276/245, mas Gemini é autoridade final e passou em 99)
QCR-NOTE-17 | qc,note | validação: premium-classic slate-copper 100/100 iter1, 14/14 YES, NONE (China/Codex grátis via Tencent HY3, keyword HY3, Avatar IV); Step-0 0.99/0.99; ground-truth com --caption-windows 30 rows/5 supress/7 motion/0 wrap sem warnings; confirma path QCR-308/317 (motion_list.json real presente, keyed em `title`, sem síntese de prosa)
QCR-323 | subs,qc | suppress_windows: trim tambem o HEAD/START de burned row que vaza p/ dentro de janela de caption (espelho do QCR-303 tail); classify retorna (new_s,new_e); ex.: "num unico pacote." 34.34->34.67
QCR-NOTE-18 | note | validacao: premium-classic charcoal-gold 90/100 iter1 (ContextSwitch extensao gratis Claude/ChatGPT/Gemini, keyword SWITCH); Step-0 1.00/0.99; 1 head-leak real (QCR-323 fix) + 1 phantom SUBTITLE_TIMING §5b (QCR-318 override, absorvido pela margem)
QCR-324 | subs,qc | ffmpeg 8.x: shorthand `ass=<path>` do -vf falha "No option name" -> usar `ass=filename=<path>`; corrigido em SUBTITLE_INSTRUCTIONS/SUBTITLE_PIPELINE_SPEC/QC_INSTRUCTIONS
QCR-NOTE-19 | note | validacao: premium-classic charcoal-gold 100/100 iter1 (Open Generative AI, studio AI all-in-one open-source, keyword CRIADOR, Avatar III 52.46s); Step-0 0.94/0.90; ground-truth 27 rows/5 supress/9 motion/0 wrap sem warnings; SRT Gemini ~1.4s late -> build_srt_from_script VAD-anchor (classe QCR-232/271/321); motion-list hand-built da .tsx real (QCR-308/317)
QCR-325 | qc,subs | Storm uniforme "+0.20s/appears too early/shift start later" em TODAS as 42 rows (grade 100->58) mesmo com o ban QCR-245/309 presente — o ban estava no FIM do bloco e o grader escreveu a tabela antes de chegar nele. Fix: banner PRE-FLIGHT no TOPO do bloco SUBTITLE_TIMING (computar |New-Old| antes de qualquer row; N shifts +0.20s idênticos = NONE; #7=YES => zero rows sub-0.5s), espelhando o hoist do QCR-318
QCR-326 | sound,qc | add_music clicks: plan section_boundaries podem ficar STALE pos-re-render -> cross-check vs scene cuts reais (CLICK_STALE_TOL 0.4s / min-match 0.5); <50% match => scene-detect (ex.: 7/25 stale -> fallback)
QCR-NOTE-20 | qc,note | validacao: premium-classic charcoal-gold 100/100 iter1 (Crabbox cloud-sandbox CLI p/ agentes, github openclaw/crabbox, §1 "A FABRICA DE AGENTES 24 HORAS", keyword CRAB); Step-0 0.96/0.94; ground-truth 43 rows/8 supress/26 motion sintetizados/0 broll/0 wrap; friction QCR-326 (plan stale pos-re-render); SRT rebuild classe QCR-321/232/271
QCR-327 | motion,qc | §4 hero label verbatim (4 consecutivas vs subtitle concorrente) = MOTION_DUPLICATE real -5 ("O VÍDEO PRONTO PRA POSTAR" grade 95); check_hero_label_complement.py agora e gate deterministico pre-render (skill generate-motion-remotion), §3b/§5b captions isentos (QCR-193). Automatiza o diff manual QCR-112 que era pulado
QCR-NOTE-21 | qc,note | validacao: premium-classic charcoal-gold 95/100 iter1 PASS (link run IG, "a primeira IA que faz seu canal de YouTube sozinha", tool anonimo p/ CTA, InVideo AI, keyword CANAL, Avatar III, 76.5s); Step-0 0.96/0.94; ground-truth 45 rows/8 supress/13 motion/0 broll/0 wrap; unico -5 = §4 hero label real (QCR-327 gate criado)
QCR-328 | qc | build_qc_ground_truth.py --tsx <comp.tsx>: sobrescreve o TEXTO dos §4 hero rows com o label REAL do .tsx (HeroScene label=/PremiumLabel), nunca a PROSA do visual_plan que o motion-list hand-built carrega. Ex.: "VOZ HUMANA E REALISTA"(prosa, 4 consec)→"PARECE UMA PESSOA DE VERDADE"(.tsx real, 1 consec) matou o phantom MOTION_DUPLICATE -5 (grade 95 PASS, nao re-graded QCR-007). Complemento em grade-time do gate QCR-327 (build-time). Passar --tsx SEMPRE quando a composicao existe
QCR-NOTE-22 | qc,note | validacao: premium-classic charcoal-gold 95/100 iter1 PASS (link run, HuMo GitHub §1 real screenshot, "a primeira IA que cria videos longos completos pro YT sozinha", resource HuMo, keyword CANAL, Avatar III, 76.5s); Step-0 0.97/0.96; ground-truth 48 rows/6 supress/20 motion/0 broll/0 wrap; unico -5 = §4 hero label PHANTOM induzido por motion-list hand-built com a prosa do plan (QCR-328 --tsx fix criado; real label limpo, gate QCR-327 PASS no .tsx)
QCR-NOTE-23 | qc,note | validação re-grade: QCR-328 --tsx confirmado — §4 labels reais (PROJETO HUMO/NÍVEL CINEMA, 0 shared) mataram o phantom MOTION_DUPLICATE; 100/100 iter1 (era 95 no ground-truth sem --tsx). 1 429 transiente no Step-0, retry passou. Friction QCR-308/317 (Phase 5 sem motion_list.json) — motion-list hand-built da .tsx real
QCR-329 | qc,subs | Storm SUBTITLE_TIMING (30 rows "-1 shift start earlier 0.24-0.39s", grade 70) pq o ban anti-storm QCR-325 morava DEPOIS da seção de motion → grader tabela antes de lê-lo. Fix: HOISTAR bloco "TOP-PRIORITY MECHANICAL BAN" p/ o TOPO do ground-truth (após o header, antes das rows) em build_qc_ground_truth.py — #7=YES⟹0 rows sub-0.5s; |New-Old|≤0.5s ou New==Old = drop; N shifts pequenos idênticos = NONE. Clean re-read (mp4 unchanged, URI reused) → 100/100. Espelha o hoist do QCR-318
QCR-NOTE-24 | qc,note | validação: premium-classic charcoal-gold 100/100 iter2 (iter1=70 phantom-storm → hoist QCR-329 → 100); "5 plugins do Claude Code", link run, keyword PLUGINS, Avatar III, 73.9s; Step-0 0.99/0.96; ground-truth 37 rows/4 supress/7 motion/0 broll/0 wrap sem warnings; motion-list hand-built da .tsx real (QCR-308/317/328)
QCR-NOTE-25 | qc,note | validação: premium-classic charcoal-gold 100/100 iter1 clean first-submit (NVIDIA Build 80+ modelos de IA de graça → API key grátis em Cursor/Cline/Open WebUI/n8n, §1 "80 IAS DE GRAÇA", keyword NVIDIA, 69.29s); Step-0 0.99/0.99; ground-truth --caption-windows --tsx 41 rows/4 supress/15 motion/0 broll/0 wrap sem warnings; QCR-328 --tsx corrigiu 2 §4 hero labels reais; motion-list hand-built da .tsx real (QCR-308/317)
QCR-330 | qc,subs | Storm SUBTITLE_TIMING ainda disparou (34 rows "+0.20s appears slightly early", |New-Old|=0.20s em TODAS, grade 66) MESMO com o ban do QCR-329 no ground-truth — pq o ban mora na 2ª message part e o PROMPT-rubrica (3ª part, posicionalmente dominante a temp 0.1) abria direto sem gate de timing. Fix (complementa QCR-329): adicionar bloco "!!! MANDATORY PRE-FLIGHT — SUBTITLE_TIMING MECHANICAL GATE !!!" como PRIMEIRA coisa do prompt-rubrica (antes de "You are a video QC engineer"): computa |New-Old| primeiro; ≤0.5s ou New==Old = drop; #7=YES⟹0 rows sub-0.5s; N shifts idênticos = NONE. Clean re-read (mp4 unchanged, FILE_URI reused, ACTIVE) → 100/100 iter2, 14/14 YES, FIXES NONE
QCR-NOTE-26 | qc,note | validação: premium-classic charcoal-gold 100/100 iter2 (iter1=66 phantom-storm 34×+0.20s → pre-flight gate QCR-330 no prompt → 100); "software full-stack real sem código com 1 IA = Emergent, deploy 1-clique URL viva", §1 Emergent site scroll + pill, keyword CRIARAPP, 67.8s; Step-0 0.96/0.94; ground-truth 37 rows/6 supress/16 motion/0 broll/0 wrap; QCR-328 --tsx WARN 0 heroAsset vs 3 labels (count mismatch → não sobrescreveu, sem dano); 2× 429/min transiente com backoff; motion-list SYNTHESIZED do plan (QCR-308 exempt)
QCR-NOTE-29 | qc,note | FAILED first-pass: storm SUBTITLE_TIMING persistente (58 depois 46) num video 14/14-YES; devolvido ao orquestrador, nao overridden (classe QCR-274/309; lever = clean re-reads, nunca re-timing)
QCR-331 | qc,note | QC HARD-BLOCKED: a key Gemini devolveu 429 RESOURCE_EXHAUSTED em TODAS as chamadas (cap diário/mensal do projeto, não RPM — confirmado após espera de 50s). Gate QCR-180 não rodou (transcrição 429, não é mismatch) e grade não obtida. Escalação correta = hard blocker "dead/blocked API key" (a skill proíbe outro path de QC; subir cap/comprar crédito é decisão do usuário). Run resumável em resume_from=10, _music.mp4 intacto → re-rodar QC as-is quando a key tiver quota. Hardening: subir o cap do projeto ou provisionar a key num projeto de billing com folga
QCR-332 | assets,qc | Página de VÍDEO (YouTube etc.) NUNCA por screenshot ao vivo (pegou AD pré-roll c/ rosto de terceiro + Sponsored e foi ao ar): só `yt_watch_shot.cjs` (pôster real no player, ads/sidebar/comments removidos, prova DOM em <shot>.meta.json ad_free:true); `prepare_reference_shot.py --source-url` RECUSA sem prova; gate do agente = OLHAR o PLAYER e a sidebar
