# Phase 2 — PT-BR Script Rules (CANONICAL)

> **This file is the single source of truth for the Phase-2 script-writing rules.** Executed by the
> `write-script-ptbr` skill. `FULL_PIPELINE.md` is only the roadmap.

The agent reads the **topic seed** — for a link run, the source transcript from `generate-video-from-link`
(`<scratch>/<Name>_src.txt` + `_src.json`: transcript, detected language, the hook idea the agent noted); for a
manual run, the topic / transcript the user gave — and writes an **original PT-BR narrative script** for HeyGen.
This is NOT a translation — the agent uses the source material as a topic seed. (`<scratch>` = `paths.tmp`,
default `/tmp/claude`; `<downloads>` = `paths.downloads`, default `~/Downloads` — `python3 lib/paths.py` prints both.)

## Script writing rules

1. Read the topic seed: the `transcript`, the `hook` idea, and any named entities in it
2. Write a ~60-second PT-BR script (~140 words, max 2520 chars for HeyGen)
3. Open with a "Você sabia que..." hook inspired by the source's viral angle
4. Follow the STEPPS framework (Social currency, Triggers, Emotion, Public, Practical value, Stories)
5. Include the core insight from the source transcript
6. End with a save/share CTA ("Salva esse vídeo...")
7. NO CTAs like "se inscreva" or "link na bio" — just value delivery
8. Clean PT-BR (`config.brand.language`, default `pt-BR`): proper accents (ç, ã, é, ê, ó, ú, í, â, õ), numbers written out, no English jargon, no URLs
9. TTS-safe: no brackets, no emojis, no formatting
10. **MANDATORY ACCENT CHECK:** Before saving, verify ALL Portuguese diacritics are present. Common words: você, não, também, já, até, só, está, código, conteúdo, automação, estratégia, gestão, análise, inteligência, prática, padrão, revolução, cérebro, calendário, número
11. **COMMENT-CTA + UNIQUE KEYWORD — EVERY VIDEO SHIPS A RESOURCE LINK (feeds Phase 11).**
    **HARD RULE: no video from this repo may lack a resource link.** `resource_cta.enabled` is effectively ALWAYS `true`, whether or not the ManyChat automation is on (`config.manychat.enabled`). Phase 11 runs at the END OF CREATION **before the video is even enqueued for posting**: with ManyChat on it arms the dedicated automation (`status=live`); with ManyChat off it stamps `status=manual` and you DM the link by hand — either way the keyword + link go in the caption. A video that can't produce a fitting resource HOLDS THE BUILD.
    **THE GET-TEST (classifier) → then MANDATORY WEB RESEARCH if nothing is handed over:**
    - If the video already hands the viewer ONE specific gettable artifact (a repo, tool/CLI, agent, skill, template, app, product/landing page, free download/guide) → use it: `enabled:true`.
    - If NOT — the source is a platform FEATURE ("Gemini 3 no Google Search"), a merely-DISCUSSED company/person/news event, or an opinion/analysis/concept piece — **DO NOT disable. Run MANDATORY web research**: `WebSearch` driven by **what the video DESCRIBES** (the capability/need the script promises), iterating queries until you find a REAL, accessible resource that fits the script **PERFECTLY**, then weave it in and `enabled:true` with that resource. The fit bar is strict — a commenter must get exactly what the video promised; never bolt on a loosely related link.
    - **Naming a real entity drives `reference_capture` (screenshots) — that is SEPARATE;** the CTA resource may be the named tool OR a researched perfect-fit artifact.
    **WRITE it with the helper — NEVER hand-edit the run state or the ledger:**
    - Enabled: `python3 manychat-pipeline/set_resource_cta.py check-keyword --keyword <WORD>` (confirm free) then `… enable --name "<resource>" --kind <repo|skill|agent|tool|app|product|site> --keyword <WORD> [--link <url if known>] [--blurb "<o que ele faz>"] [--opening-name "<phrase naming the resource in the opening DM>"] --video <RunName>` — stamps `resource_cta` + reserves the keyword in the ledger atomically (refuses collisions/bad keywords). Phase 4 backfills `--link` via `set-link`.
      - **`--opening-name`:** the OPENING DM NAMES the resource ("Já separei o **<NOME>** pra você!"). Write `--opening-name` as the most natural short phrase for that blank, understanding the script + the resource's purpose (usually the tool/repo name; tailor it if a cleaner phrasing fits). Independent of `--name`; **defaults to `--name`** if omitted, so it's never blank for a resource video. Composes `resource_cta.opening_dm` (mirrors how `--name`/`--blurb` compose the link DM). Phase 11 writes it into the automation's opening message (ManyChat on) — or it is the text you send by hand (ManyChat off).
    - Disabled (LAST RESORT only, near-zero): `python3 manychat-pipeline/set_resource_cta.py disable` — only after research genuinely found no perfect-fit resource; log WHY loudly.
    - Keyword: 1 word, UPPERCASE, ASCII, PT-BR, memorable, tied to this video (e.g. `ROTINAS`, `AGENTE`). `resource_kind`: most specific (repo > skill > agent > tool > app/product > site).
    - Embed in the script near the end: *"Comenta '<KEYWORD>' aqui embaixo que eu te mando o link no seu direct."* (allowed; NOT "link na bio"). The Comment→DM phase (**armed BEFORE Post+Log**) publishes it. See `manychat-pipeline/MANYCHAT_INSTRUCTIONS.md`.
12. **CONTENT-SAFETY / PLATFORM-POLICY GATE — reject or reframe "easy money" & scam-shaped angles.** This runs at BOTH topic selection and script writing (canonical spec: `PIPELINE_DIRECTIVES.md` §11). The videos teach REAL AI tools/capabilities with honest framing — they must NEVER read as a get-rich-quick / guaranteed-income scam or otherwise risk an Instagram takedown/flag. Apply this to the chosen topic AND to the rewritten hook/script:
    - **FORBIDDEN framings (never write, even if the source reel used them):** guaranteed/fast/passive income or specific earnings claims ("ganhe R$X por dia/mês", "renda garantida", "fique rico", "dinheiro fácil", "lucro garantido", "sem esforço", "largue seu emprego"); no-risk investment/financial-return promises; "método secreto/infalível", "segredo que ninguém te conta", "hack que os bancos/gurus escondem"; fake/secret coupons or fabricated codes (integrity-fail, QCR-165/177); miracle health/beauty/weight claims; impersonation or fabricated authority; anything deceptive, MLM/pyramid-shaped, or that overpromises a result the resource can't deliver.
    - **The fix is REFRAME, not necessarily reject.** Most queue links are legit ("this AI builds a working app in 10 min", "this agent automates X"). Keep the real tool + the genuine capability; strip the money-scam wrapper. Convert "faça R$10 mil/mês com IA sem trabalhar" → the honest capability ("essa IA cria um app funcional em 10 minutos"). Clickbait the CURIOSITY/impact of a TRUE fact (§1 formulas), never a financial guarantee.
    - **REJECT (skip the topic) only when** the entire premise IS the scam and there is no honest capability/resource under it — then pick the next queue link (or, for a manual topic, tell the user). Log the skip/reframe reason in the run state (`maestro_state.py set --field safety_note="…"`).
    - **Gate is on by DEFAULT for every run.** A borderline case leans safe: soften the claim, drop the earnings number, keep it truthful. Honest + curiosity-driven still converts; a flagged/removed reel converts zero. (`post_queue.py add` re-checks the caption/title in code at mark-ready and refuses money-claims.)

## Entity extraction (MANDATORY — PIPELINE_DIRECTIVES §2)

The script MUST preserve any real tool/product/company/repo/site named in the source (NO "agentes de
IA" genericization of a named tool) and emit `<scratch>/script_entities.json` (+ `<downloads>/<Name>_entities.json`).
Phase 2.5 derives `reference_capture` from it; Phase 4 captures a real screenshot of each entry.

## Saving the script

**Use the Claude Code `Write` tool to write the script directly to `<scratch>/heygen_script.txt`.
Do NOT use `cat << EOF`, `echo`, or any bash redirection** — these can silently strip UTF-8 accents.

The agent is responsible for the accent check above — there is no automated script gate. Re-read the
saved file and confirm diacritics survived before Phase 3 (HeyGen).

## Queue empty → ask the user for a link or a topic

There is no scraper. If Stage 0 finds the next-videos queue empty and no manual topic was given, STOP and ask:
"The next-videos queue is empty. Paste a YouTube/Instagram link to produce from, or give me a topic (a one-liner
or a transcript)."
- A link → `python3 next-videos-pipeline/next_videos.py add "<URL>" --front`, then Stage-0 dispatch (`generate-video-from-link`).
- A topic / transcript → Phase 1 (`choose-video-topic`) packages it as the topic seed → this Phase 2.
Never invent a topic on your own and never wait on a scraper.
