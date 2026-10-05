# Narrative Archetypes — The Hook + Arc Library (PT-BR)

*Institutional reference for Phase 2 (`write-script-ptbr`). Read BEFORE writing any script.*
*Source concepts translated from `docs/VIRAL_VIDEO_TECHNIQUES.md` §1, §3, §10, §14.*

## Why this file exists

The old pipeline wrote almost every video as **"Você sabia que..."** with the same rigid
problem → conflito → revelação arc. That monoculture is the single biggest creative ceiling on
the channel: the algorithm sees the same opening pattern run after run, and the audience learns
to predict (and scroll). This library kills that. It is the **highest-leverage, $0,
QC-neutral creative unlock** in the whole pipeline — it changes nothing about cost, render, or
the QC gate; it only widens the editorial range the agent is allowed to choose from.

**The agent picks ONE archetype per video**, matched to the topic shape, then writes the script
to that archetype's hook formula and narrative curve. The chosen `archetype_id` is recorded in
the `creative_brief` (`hook_archetype` field) and logged to `pipeline-log.csv` for the feedback
loop.

---

## NON-NEGOTIABLE constraints (every archetype inherits these)

These survive intact from the existing pipeline. An archetype choice NEVER overrides them:

- **PT-BR obrigatório** (`config.brand.language`, default `pt-BR`) — every word of script, subtitle, and caption is Brazilian Portuguese.
- **STEPPS** (`VIRAL_VIDEO_TECHNIQUES.md` §14) — each script must hit at least Practical Value
  + one high-arousal Emotion (awe/anger/anxiety/excitement). Social Currency is the default
  framing ("a maioria não sabe isso").
- **Length cap** — script body ≤ **2520 characters / ~140 words** (TTS budget for ~60s at
  the avatar's TTS pace). Hard cap, no exceptions.
- **Accent / UTF-8 safe** — full Portuguese accents (á é í ó ú ã õ ç). Encode UTF-8.
- **TTS-safe** — NO brackets `[ ]`, NO stage directions, NO emoji, NO markdown inside the
  spoken text. Numerals spelled or as digits per the existing script rules. The avatar's TTS reads exactly
  what is written.
- **ONE avatar per repo (`config.avatar.*`).** No second speaker, no "nós dois".
- **Hook ↔ Headline same promise (complement rule intact).** The spoken hook and the S0
  `HeadlineBanner` must make the **SAME promise** — never the identical sentence (≤3 shared
  words, `MOTION_DESIGN_SYSTEM.md` §2.5), but the SAME claim. If the hook promises "a IA que
  trabalha sozinha", the headline cannot promise something different. Bold ≠ false: the video
  must deliver whatever both promise (`headline-banner-research.md` finding #6).

---

## THE RETENTION SPINE (mandatory in every archetype)

Whatever archetype is chosen, the script MUST carry these three load-bearing beats. They are the
reason the arc holds attention end-to-end and earns rewatch. Missing any one is a script defect.

1. **PLANT an open loop in the hook** (`VIRAL_VIDEO_TECHNIQUES.md` §3). The hook opens a gap —
   a question, a withheld noun, a promised payoff — that is **NOT closed until ~45s** (near the
   end). The viewer's brain keeps watching to close the itch.
2. **ONE mid-script re-hook near 50%** (~30s mark). A second curiosity spike that resets
   attention before the natural mid-drop. Phrasing bank: *"mas tem um detalhe que muda tudo"* /
   *"e aqui é onde quase todo mundo erra"* / *"só que tem um porém"* / *"e foi aí que eu percebi
   uma coisa"*. It must introduce NEW tension, not restate the hook.
3. **End on a loop-back / callback** (`VIRAL_VIDEO_TECHNIQUES.md` §10). The final line calls
   back to the hook's opening image or question, manufacturing the "wait, let me rewatch the
   start" instinct that pushes AVD over 100%. The callback line is NOT the CTA — the CTA comes
   after.

Spine ordering inside the ~140 words: HOOK (loop planted, 0–3s) → SETUP/STAKES → RE-HOOK (~50%)
→ PAYOFF (loop closed ~45s) → CALLBACK → CTA.

---

## THE 8 ARCHETYPES

Each archetype below gives: `archetype_id`, **when_to_use** (topic shape), **HOOK FORMULA**
(≤12 words, PT-BR), **NARRATIVE CURVE** (the beat sequence that replaces the rigid
problem→conflito→revelação arc), the mapped **S0 headline_formula**
(`curiosity-gap | bold-claim | number-promise | warning | news-style`), a recommended
**cta_intent** (`follow | share | comment | save | action`), and one worked PT-BR example.

---

### 1. `mystery_curiosity_gap`

- **when_to_use:** Topic with a single counterintuitive payoff worth withholding (a hidden
  feature, an unexpected result, a "ninguém te contou" fact). The ONE case where a `Você
  sabia`-adjacent framing is allowed — only if a genuine mystery is being held back.
- **HOOK FORMULA:** withhold the key noun/outcome →
  *"Isso aqui muda como você usa IA — e quase ninguém percebeu."*
- **NARRATIVE CURVE:** gap aberto → por que importa (stakes) → *re-hook ~50%* → pista parcial →
  revelação do payoff (~45s) → callback ao gap inicial.
- **headline_formula:** `curiosity-gap`
- **cta_intent:** `save`
- **Example hook:** *"Tem um jeito de usar o Claude que ninguém te mostra."*

---

### 2. `problem_number`

- **when_to_use:** Topic that decomposes into a small, countable set of mistakes / tips / steps
  (3–5). Self-identification topics ("você faz isso e nem sabe").
- **HOOK FORMULA:** numeral + erro/identificação →
  *"3 erros que você comete com IA e perde horas."*
- **NARRATIVE CURVE:** promessa numerada (loop: "o terceiro é o pior") → erro 1 → erro 2 →
  *re-hook ~50% ("mas o próximo muda tudo")* → erro 3 (payoff/o pior, ~45s) → callback ao
  "terceiro é o pior".
- **headline_formula:** `number-promise`
- **cta_intent:** `save`
- **Example hook:** *"São 3 erros com IA que te custam horas todo dia."*

---

### 3. `shock_myth_bust`

- **when_to_use:** Topic where a widely-held belief is wrong / outdated and you can prove the
  opposite. High-arousal (anger/awe). Use sparingly — must be TRUE.
- **HOOK FORMULA:** quebra de crença →
  *"Tudo que te disseram sobre IA substituir programador está ERRADO."*
- **NARRATIVE CURVE:** crença (o que todos acham) → prova (o fato que contradiz) →
  *re-hook ~50% ("e tem algo ainda mais contra-intuitivo")* → verdade (o que é real, ~45s) →
  virada (o que fazer com isso) → callback à crença derrubada.
- **headline_formula:** `bold-claim`
- **cta_intent:** `comment`
- **Example hook:** *"Quase tudo que te falaram sobre agentes de IA está errado."*

---

### 4. `direct_call_out`

- **when_to_use:** Topic with a clearly identifiable audience segment ("quem usa IA todo dia",
  "quem programa", "quem ainda copia e cola prompt"). Creates instant personal relevance.
- **HOOK FORMULA:** chamada direta + pare →
  *"Se você usa IA todo dia, para de rolar agora."*
- **NARRATIVE CURVE:** call-out (loop: "isso é pra você") → por que isso te afeta (stakes
  pessoais) → *re-hook ~50% ("mas tem um detalhe que muda tudo")* → o insight central (~45s) →
  o passo prático → callback ("por isso eu te mandei parar de rolar").
- **headline_formula:** `warning`
- **cta_intent:** `follow`
- **Example hook:** *"Se você usa IA pra trabalhar, isso aqui é pra você."*

---

### 5. `transformation`

- **when_to_use:** Topic framed as a before→after journey (um fluxo lento que virou rápido, um
  resultado conquistado com uma ferramenta/método). STEPPS Stories + Public.
- **HOOK FORMULA:** estado ruim → resultado (sem dar o "como") →
  *"Eu gastava horas nisso — hoje a IA faz em minutos."*
- **NARRATIVE CURVE:** estado ruim (loop: "como?") → o ponto de virada (sem revelar o método
  ainda) → *re-hook ~50% ("e o que destravou foi uma coisa só")* → o método/resultado (~45s) →
  callback ao estado ruim ("de horas pra minutos").
- **headline_formula:** `bold-claim`
- **cta_intent:** `action`
- **Example hook:** *"Eu passava o dia nisso até a IA assumir sozinha."*

---

### 6. `exclusivity`

- **when_to_use:** Topic that is genuinely under-known / insider (um truque, um setup, um ajuste
  que poucos usam). STEPPS Social Currency. Must be real, not fake scarcity.
- **HOOK FORMULA:** poucos sabem + tópico →
  *"Só 1% que usa IA conhece esse ajuste."*
- **NARRATIVE CURVE:** exclusividade (loop: "o que é?") → por que a maioria não sabe → *re-hook
  ~50% ("e tem um motivo de quase ninguém usar")* → o segredo revelado (~45s) → como aplicar →
  callback ao "1%".
- **headline_formula:** `curiosity-gap`
- **cta_intent:** `share`
- **Example hook:** *"Pouca gente que mexe com IA sabe desse ajuste."*

---

### 7. `warning_fomo_urgency`

- **when_to_use:** Time-sensitive or money-sensitive topic (não pague por X antes de ver isso;
  uma ferramenta gratuita que substitui paga; algo que muda agora). High anxiety arousal.
- **HOOK FORMULA:** antes de [ação] + pausa →
  *"Antes de pagar por mais uma ferramenta de IA, assiste isso."*
- **NARRATIVE CURVE:** alerta (loop: "por quê?") → relógio/consequência (o que você perde se não
  souber) → *re-hook ~50% ("e tem um detalhe que muda tudo")* → a saída/ação certa (~45s) →
  callback ao alerta ("por isso eu falei pra não pagar ainda").
- **headline_formula:** `warning` (or `news-style` with kicker `AGORA`/`URGENTE` when the
  trigger is a fresh release)
- **cta_intent:** `share`
- **Example hook:** *"Não assina mais nenhuma ferramenta de IA antes disso."*

---

### 8. `list_confession`

- **when_to_use:** Either a structured list payload (top N) OR a behind-the-scenes / "eu não
  deveria mostrar isso" reveal. Pick the confession framing when the content feels personal /
  insider; the list framing when it's a clean enumerated payload.
- **HOOK FORMULA (confession):** *"Eu não deveria mostrar, mas é assim que eu automatizo tudo."*
  **HOOK FORMULA (list):** *"As 3 ferramentas de IA gratuitas que ninguém te indica."*
- **NARRATIVE CURVE:** confissão/promessa de lista (loop: "o quê?") → item/contexto 1 → *re-hook
  ~50% ("e o último é o que muda o jogo")* → item/revelação final (~45s) → callback à confissão
  ("agora você sabe o que eu não deveria contar").
- **headline_formula:** `bold-claim` (confession) / `number-promise` (list)
- **cta_intent:** `follow`
- **Example hook:** *"Eu quase não posto isso, mas é meu setup de IA inteiro."*

---

## Headline-formula crosswalk

The S0 `HeadlineBanner` formula the archetype maps to (see
`headline-banner-research.md` §"Wording formulas"). Same promise as the hook, never
the same sentence.

| archetype_id | headline_formula |
|---|---|
| `mystery_curiosity_gap` | `curiosity-gap` |
| `problem_number` | `number-promise` |
| `shock_myth_bust` | `bold-claim` |
| `direct_call_out` | `warning` |
| `transformation` | `bold-claim` |
| `exclusivity` | `curiosity-gap` |
| `warning_fomo_urgency` | `warning` / `news-style` |
| `list_confession` | `bold-claim` / `number-promise` |

---

## CONVERSION-CTA LIBRARY (PT-BR, keyed by intent)

Pick the CTA whose **intent matches the archetype's `cta_intent` AND the algo signal you want**
this run (shares and comments are the strongest distribution signals; saves and follows compound
the channel; action drives off-platform value). The CTA is the LAST spoken line, AFTER the
callback. Keep it one short sentence, TTS-safe.

**share-drivers** (`share`)
1. *"manda pra quem ainda faz isso na mão."*
2. *"compartilha com aquele amigo que vive reclamando disso."*
3. *"manda no grupo de quem trabalha com IA."*

**comment-drivers** (`comment`)
4. *"comenta se você concorda ou discorda."*
5. *"qual desses você já cometeu? me conta aqui embaixo."*
6. *"escreve aqui qual ferramenta você usa hoje."*

**follow-drivers** (`follow`)
7. *"me segue que amanhã eu mostro o passo a passo."*
8. *"me acompanha que todo dia tem um truque novo de IA."*
9. *"fica de olho aqui que vem mais coisa dessa."*

**save-drivers** (`save`)
10. *"salva pra não perder o setup."*
11. *"salva esse vídeo pra aplicar depois."*

**action-drivers** (`action`)
12. *"testa hoje e volta aqui pra me contar o resultado."*

**FORBIDDEN CTAs (never use):** *"se inscreva"*, *"link na bio"*, *"deixa o like"* — these are
dead weight on Reels/TikTok/Shorts (no subscribe verb, no clickable bio mid-feed) and signal
generic-creator energy. Always pick from the library above.

---

## REPETITION RULE (anti-monoculture, enforced)

- **Do NOT reuse the same `archetype_id` two runs in a row.** Before choosing, the agent reads
  the last logged archetype from `pipeline-log.csv` (the `hook_archetype` column) and excludes
  it. If a topic only fits the just-used archetype, pick the next-best fit, never repeat.
- **Rotate CTAs too** — do not use the identical CTA sentence as the previous run; pick a
  different phrasing within the chosen intent.
- The whole point is editorial VARIETY run-over-run. One-size-fits-all is the failure mode this
  file exists to kill.

---

## LOGGING FOR THE FEEDBACK LOOP

The agent records the chosen archetype so performance can be attributed back to editorial choice:

- Write `hook_archetype: "<archetype_id>"` into the `creative_brief` for the run.
- Append the same value to the `hook_archetype` column of `pipeline-log.csv` at post time (Phase 12, `post-and-log`).
- Over time this lets the analyst correlate archetype → scroll-stop / retention / shares and
  bias future selection toward what actually wins on THIS channel. Until that data exists,
  rotate broadly (the repetition rule guarantees coverage).

---

## QC NEUTRALITY (why this is safe)

Nothing here touches render, cost, or the QC gate. When QC is enabled, the Gemini QC stays the **FINAL
authority** at `config.qc.threshold` (default 75) — an archetype choice never excuses a low grade and never "explains away" a
finding. This layer only changes WHICH words the agent writes in Phase 2; QC grades the finished
video exactly as before. "Never fake green" is unaffected.
