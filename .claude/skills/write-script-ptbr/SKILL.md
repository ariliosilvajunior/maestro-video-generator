---
name: write-script-ptbr
description: Phase 2 of the Maestro Video Generator pipeline. The agent writes a Brazilian-Portuguese short-form video script from a topic seed (the link transcript from generate-video-from-link, or a manual topic/transcript from choose-video-topic), following the script rules in how-to-generate-video-scripts.md. Triggers — "write the script", "escreve o roteiro", "turn this topic into a script", "draft the PT-BR script".
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: write-script-ptbr (Phase 2 — Write PT-BR Script)

This is an AGENT-AUTHORED step (no external script/API). The authoritative rules are **`how-to-generate-video-scripts.md`** (canonical).
Paths: `<scratch>` = `paths.tmp` (default `/tmp/claude`), `<downloads>` = `paths.downloads` (default `~/Downloads`) — `python3 lib/paths.py` prints both.

## What it does
Takes a topic seed (English transcript/seed allowed) and produces an original **Brazilian-Portuguese** script for the HeyGen avatar to speak. The script is REWRITTEN into PT-BR, never literally translated — the source is a topic seed only.

## INPUTS
- The **topic seed**: for a link run, `<scratch>/<Name>_src.txt` + `_src.json` (verbatim source transcript + detected language) from `generate-video-from-link`, plus the hook idea you noted; for a manual run, the topic / transcript the user gave (packaged by `choose-video-topic` as `<downloads>/<Name>_topic_seed.json`: `transcript`, `hook`, `entities`).
- Brand context from config: `brand.niche` + `brand.audience` (`python3 lib/config.py get brand.niche`) — the angle, vocabulary,
  examples and CTA must fit THAT audience; `brand.language` sets the output language.

## OUTPUTS (write BOTH)
- `<downloads>/<VideoName>_script.txt` — named copy for the run.
- `<scratch>/heygen_script.txt` — canonical path Phase 3 (HeyGen) reads from.
- `<downloads>/<VideoName>_entities.json` AND `<scratch>/script_entities.json` — the named-entities list (see RULES); `[]` ONLY if the topic names nothing real. Phase 2.5 derives `reference_capture`/`references[]` from this.
- **run state → `resource_cta`** — set for ~EVERY video (the resource is either handed over by the source or found via mandatory web research; see COMMENT-CTA rule). Carries `{enabled, resource_name, resource_kind, keyword, manychat_flow_id, status:"pending"}`. Phase 4 fills `link`; **Phase 11 consumes it at the END of creation, before the mark-ready enqueue** — with `config.manychat.enabled` it arms the automation (`status=live`), otherwise it stamps `status=manual` (you DM the link by hand; keyword + link still go in the caption). `enabled:false` only in the rare last-resort case where no fitting resource exists even after research (log loudly).
- **Hard limit: 2520 chars** (HeyGen ~3 min cap). Keep ~1 min (≈ 900-1200 chars, ~140 words) for short-form.

## RULES (from how-to-generate-video-scripts.md)
- Output language: **PT-BR obrigatório** (`config.brand.language`, default `pt-BR`).
- Open with a "Você sabia que..." style hook inspired by the source's viral angle. **Owner directive
  (06/10/2026):** weave a direct greeting to the audience (`brand.audience` — AEE teachers) INTO the
  hook sentence itself (e.g. "Professor de AEE, você sabia que..."), never a separate "Oi pessoal"
  before it — frame-0 still has to land as the clickbait headline (CLAUDE.md §5).
- Follow STEPPS (Social currency, Triggers, Emotion, Public, Practical value, Stories).
- Include the core insight from the source transcript.
- End with a save/share CTA ("Salva esse vídeo..."). NO "se inscreva" / "link na bio". **Owner
  directive (06/10/2026):** also reference the brand "Recursos Cognitivos" by name in the closing
  (natural phrasing, varies video to video — e.g. "segue a Recursos Cognitivos pra mais dicas
  assim"), alongside the comment-keyword CTA line below, not instead of it.
- **CONTENT-SAFETY / PLATFORM-POLICY GATE (canonical: `PIPELINE_DIRECTIVES.md` §11 + rule 12).** The topic AND the rewritten hook/script must NEVER read as an "easy money" / get-rich-quick / guaranteed-income scam or anything that risks an Instagram flag/takedown. FORBIDDEN: earnings/income guarantees ("ganhe R$X", "renda garantida", "fique rico", "dinheiro fácil", "sem trabalhar"), no-risk profit claims, "método secreto/infalível", fake/secret coupons (QCR-165/177), miracle health claims, impersonation, MLM/pyramid framing, or overpromising what the resource delivers. **REFRAME by default** (keep the real tool + the TRUE capability, strip the money-scam wrapper: "faça R$10 mil/mês com IA" → "essa IA cria um app funcional em 10 minutos"); clickbait the curiosity of a TRUE fact, never a financial guarantee. **REJECT the topic** only if the whole premise is the scam with no honest resource under it → take the next queue link (or tell the user, for a manual topic). Log via `maestro_state.py set --field safety_note="…"`.
- **COMMENT-CTA + UNIQUE KEYWORD — EVERY VIDEO SHIPS A RESOURCE LINK (feeds Phase 11).**

  **HARD RULE: no video from this repo may lack a resource link.** `resource_cta.enabled` must be `true`
  for essentially every video — whether or not the ManyChat automation is on. The CTA is armed in **Phase 11
  at the END of creation, BEFORE the video is enqueued for posting**, so a video that can't produce a fitting
  resource HOLDS the build — don't ship one without a link.

  **THE GET-TEST (classifier) → then MANDATORY WEB RESEARCH if nothing is handed over.**
  1. **Does the video already hand the viewer ONE specific gettable artifact** — a repo, tool/CLI, agent,
     skill, template, app, product/landing page, or free download/guide that IS (or fits) the subject? If
     YES → use it: `enabled:true`, `resource_name`/`resource_kind` = that artifact.
  2. **If NO** — the source is a platform FEATURE ("Gemini 3 no Google Search"), a merely-DISCUSSED
     company/person/news event, or an opinion/analysis/trend/concept piece — **DO NOT set `enabled:false`.
     Instead, run MANDATORY web research**: `WebSearch` driven by **what the video DESCRIBES** (the
     capability, workflow, or need the script promises) and keep iterating queries (synonyms, "github",
     "official site", the use-case + "tool/repo/app/template") **until you find a REAL, accessible resource
     that fits the script PERFECTLY** — something a viewer who comments would be genuinely glad to receive.
     Then weave it into the script naturally and `enabled:true` with THAT resource. Prefer the official site /
     exact repo / product page; VERIFY it's a real public page.
  3. **Fit bar:** the resource must match the script PERFECTLY — never bolt on a loosely-related link. If
     the topic truly maps to no fitting resource, that is a Phase-1 selection miss (see `choose-video-topic`
     — bias toward resource-bearing topics). Only then, as a last resort, `disable` AND log loudly WHY.
  - **DECOUPLED FROM SCREENSHOTS:** naming a real entity makes `reference_capture` TRUE (screenshots in Phase 4) — a separate decision. The CTA resource may be the named tool OR a researched perfect-fit artifact.
  - **Sentence test:** truthfully complete *"Comenta X que eu te mando o link pra você [pegar/usar/instalar] ____."* The blank MUST be a real, gettable artifact — if the obvious topic doesn't supply one, research until it does.

  **Then WRITE it with the helper — NEVER hand-edit the run state or the ledger** (hand-editing was the #1 cause of inconsistency in a past audit):
  - Enabled: first confirm the keyword is free, then stamp + reserve atomically:
    ```bash
    python3 manychat-pipeline/set_resource_cta.py check-keyword --keyword <WORD>   # exit 0 = free
    python3 manychat-pipeline/set_resource_cta.py enable --name "<resource>" \
        --kind <repo|skill|agent|tool|app|product|site> --keyword <WORD> \
        [--link <url if the canonical URL is already known from the seed/url_hint>] --video <RunName>
    ```
    This writes `resource_cta` into the run state AND appends the keyword to the ledger (`used_keywords` + a `history` entry) in one atomic step; it refuses a colliding or malformed keyword. Phase 4 backfills/confirms `--link` via `set-link`.
  - Disabled (LAST RESORT only — should be near-zero): `python3 manychat-pipeline/set_resource_cta.py disable` (writes the canonical `{enabled:false, status:"skipped"}`). Use ONLY after mandatory web research genuinely found no perfect-fit resource; log WHY loudly so the gap is visible.
  - **Keyword rules:** 1 word, UPPERCASE, ASCII alphanumeric, PT-BR, short, memorable, tied to THIS video, no spaces/accents/emojis (e.g. `ROTINAS`, `AGENTE`, `MAESTRO`). Uniqueness is required — past videos consumed past keywords and each ManyChat automation matches only its own keyword. **`resource_kind`:** pick the MOST specific that fits (repo > skill > agent > tool > app/product > site).
  - **Embed the comment-CTA in the script** near the end (the reason to comment), alongside the "Salva esse vídeo" line: *"Comenta '<KEYWORD>' aqui embaixo que eu te mando o link no seu direct."* (This is a comment-to-DM CTA — ALLOWED; it is NOT "link na bio".) Only add this line when `enabled:true`.
- Clean PT-BR: proper accents, numbers written out, no English jargon, no URLs.
- **NAME REAL ENTITIES (HARD GATE — no genericization; see `PIPELINE_DIRECTIVES.md` §2).** Before writing, scan the topic seed (`transcript`, `hook`, `entities`) for any named real tool / product / app / model / company / GitHub repo / website (e.g. "Anijam", "Claude Code", "Cursor", "Banana Skill"). If the source names a specific real thing, the PT-BR script MUST name it explicitly — you MAY NOT generalize it into a capability/category ("agentes de inteligência artificial", "a própria IA", "uma ferramenta"). A real style-drift run (source named "Anijam", script said only "agentes de IA") destroyed the reference-capture evidence trail and shipped a screenshot-less video — do not repeat it. A tool with no real name in the source is the ONLY case you may speak in category terms.
- **EMIT the named-entities list.** Write (Write tool) `<downloads>/<VideoName>_entities.json` and copy to `<scratch>/script_entities.json` = a JSON array of `{ "entity": "<exact name as said in the script>", "kind": "tool|product|company|repo|site", "url_hint": "<best canonical URL guess, or empty>" }`. Use `[]` ONLY when the topic genuinely names nothing real. This file drives the MANDATORY `reference_capture` derivation in Phase 2.5 and the non-skippable screenshot capture in Phase 4.
- TTS-safe: no brackets, no emojis, no formatting, no stage directions. **Never write "AEE" in
  spoken text — the voice mispronounces it (owner directive, 03/10/2026). Always spell out
  "Atendimento Educacional Especializado"; same caution for PEI/PDI/TGD/SRM and any other
  vowel-heavy acronym — spell out in full on first mention, then refer back with "esse plano" etc.**
  Full rule + rationale: `how-to-generate-video-scripts.md` rule 9.
- **MANDATORY ACCENT CHECK** before saving (você, não, também, código, conteúdo, automação...). The agent must self-verify diacritics — re-read the saved file and confirm accents survived before Phase 3. There is no automated gate.
- **Use the Write tool, NEVER bash heredoc/echo** — bash redirection can silently strip UTF-8 diacritics.

## DEPENDENCIES
- None (pure authoring). Reads `how-to-generate-video-scripts.md`.

## COMMAND
No CLI. Write the file with the Write tool, then verify:
```bash
mkdir -p <scratch> && cp <downloads>/<VideoName>_script.txt <scratch>/heygen_script.txt
wc -c -w <scratch>/heygen_script.txt   # <= 2520 chars
```

## 🛑 MANDATORY Phase 2.6 — draft narration + owner approval (BEFORE Phase 3, no exceptions)
Once the script (and Phase 2.5's creative brief, if that already ran) is final, generate a cheap
ElevenLabs draft of the EXACT script text and send it to the owner via the **Painel do Dono** —
**then STOP and wait for their explicit approval.** This is the one deliberate human checkpoint in
the whole pipeline (see `PIPELINE_DIRECTIVES.md` §2d / `CLAUDE.md` §2's named exception) — never
skip it, never treat a past run's approval as covering this one.

**06/10/2026 — approval now lives in the Painel's "Preview de áudio esperando aprovação — Vídeos
Maestro" section (owner request), not chat alone.** This mirrors the Canal AEE (Video Factory)
pattern already live there. Backend: `ecossistema-ia-recursos-cognitivos`,
`agentes/content_factory/main.py` + `painel/main.py` (branch
`claude/ecossistema-ia-agentes-retry-oso16t`, commit `e31d200`) — a new `VideoMaestro` status chain
`aguardando_aprovacao_audio` → `audio_aprovado`.

```bash
EL_KEY=$(python3 -c 'import sys; sys.path.insert(0,"."); from lib.api_keys import resolve_key; print(resolve_key("elevenlabs"))')
VOICE_ID=$(python3 -c 'import sys; sys.path.insert(0,"."); from lib import config; print(config.get("avatar.elevenlabs_voice_id"))')
mkdir -p <scratch>
python3 -c "
import json, urllib.request, os, sys
text = open('<downloads>/<VideoName>_script.txt', encoding='utf-8').read()
req = urllib.request.Request(
    f'https://api.elevenlabs.io/v1/text-to-speech/{os.environ[\"VOICE_ID\"]}',
    data=json.dumps({'text': text, 'model_id': 'eleven_multilingual_v2'}).encode(),
    headers={'xi-api-key': os.environ['EL_KEY'], 'Content-Type': 'application/json'},
)
with urllib.request.urlopen(req, timeout=60) as r, open('<scratch>/<VideoName>_draft_narration.mp3', 'wb') as f:
    f.write(r.read())
"
```

Submit it to the Painel (writes `painel_video_id` + `draft_narration_status` into the run state):
```bash
python3 post-pipeline/enviar_audio_preview_painel.py enviar --run <VideoName> \
    --audio <scratch>/<VideoName>_draft_narration.mp3 --tema "<topic/hook in a few words>" \
    [--keyword <CTA keyword, if resource_cta is already set>]
```
Also send `<scratch>/<VideoName>_draft_narration.mp3` to the owner in chat (e.g. `SendUserFile`) as a
convenience/heads-up — but the Painel is the **authoritative** approval record, not the chat message.
Tell the owner it's waiting in "Preview de áudio esperando aprovação — Vídeos Maestro" on the Painel.

**Do NOT proceed to Phase 3 on the owner's word alone — verify the Painel status before opening
HeyGen:**
```bash
python3 post-pipeline/enviar_audio_preview_painel.py status --run <VideoName>
```
- `aguardando_aprovacao_audio` → still waiting, do not proceed (poll again later — a scheduled
  check-in every 10-20 min is reasonable; never busy-loop).
- `audio_aprovado` → proceed to Phase 3, narrating this SAME approved text verbatim.
- `rejeitado` → the owner rejected it; ask what to change, revise the script, regenerate the draft,
  resubmit with `enviar` (creates a fresh Painel entry), wait again.

If `config.painel.enabled` is `false` (Painel integration not deployed/configured yet — see
`NOTAS_DONO.md`), fall back to the chat-only flow: send the file via `SendUserFile` and wait for the
owner's explicit "aprovado" in the conversation instead. Prefer the Painel path whenever it's enabled.
