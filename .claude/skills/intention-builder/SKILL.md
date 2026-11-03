---
name: intention-builder
description: Interrogate a filmmaker until the intention is locked, then write it down as a markdown intention doc (PDF on request) carrying paste-ready cast, location and style tokens for shot-builder, shot-builder-cinematic-action and motion-builder. Use this BEFORE story-beats and before any shot list, prompt, storyboard or generation, whenever someone has an idea but cannot yet specify it - vague briefs, "make it cinematic", "like The Revenant", "a coffee commercial", "I do not know what I want", beginners with no vocabulary, or a brief that keeps changing. Runs numbered rounds of in-depth questions, each carrying a recommended answer, until nothing is silently assumed - intention, ending, look and feel, camera, lens, light, palette, costume, performance, beats, sound, deliverables - then checks every answer against the others for contradictions. Triggers - creative brief, intention, treatment, lock the look, define the style, discovery, pre-production, what do I actually want, brief me, grill me.
---

# Intention Builder — lock what they actually want, before a single pixel

> **Antes de começar (dono, 03/11/2026):** consulte `docs/GUIA_REEL_LAB.md` (resumo de https://reel-lab.com/craft/) e aplique a parte que vale para este trabalho.

> **Recursos Cognitivos (03/11/2026, skill comprada pelo dono — adaptação):**
> - Sempre em **português** e sempre no modo **QUICK** (o dono quer direto ao ponto). Perguntas por clique, com a
>   recomendada primeiro.
> - Usar ANTES de: propaganda do sistema (Estúdio RC → "Pedir roteiro") e no começo de cada episódio ilustrado
>   (travar luz, cor e tom uma vez).
> - As skills de saída daqui são as NOSSAS: `video-prompt-builder` (tomadas de cinema), `roteiro-ilustrado`
>   (cenas do Flow) e `maestro-video-generator/propaganda-sistema/` (telas do sistema em Remotion) no lugar de
>   shot-builder / motion-builder / remotion-builder.
> - **Idade:** nas cenas do Flow vale a regra R44 do `docs/episodio-ilustrado/MANUAL_CENAS.md` (a animação TRAVA a
>   idade). A proibição de "age words" desta skill não se aplica aos textos do Flow.
> - Propaganda segue a ordem da história do `propaganda-sistema/README.md` (mudança → dor → solução → prova → CTA).

Most beginners cannot answer "what do you want it to look like." They can answer
"which of these two frames is closer, and what is wrong with the closer one."
This skill is built on that asymmetry: it never asks the user to generate
vocabulary they do not have. It proposes, they react, the reaction gets written
down as a decision.

The output is one markdown file — the **intention doc** — that downstream skills
can consume without a second conversation. Optionally a PDF for a client or crew.

**Pipeline position:** `intention-builder` → `story-beats` (if a script is needed)
→ `shot-builder` / `shot-builder-cinematic-action` / `motion-builder` /
`remotion-builder`.

---

## The one rule

**Finding facts is your job. Making decisions is theirs.**

Never ask the user something you could look up, infer from an earlier answer, or
propose a sane default for. Never decide something that changes what the film
*is*. When a question needs an environment fact — what files exist, what a
reference film's DP actually did, what a downstream skill requires — dispatch a
sub-agent or read the reference file and keep grilling in the meantime. A running
lookup is an unsettled prerequisite: only the questions downstream of it wait.

---

## STEP 0 — The two gate questions (ask these first, together, nothing else)

Before any grilling, you need the route and the depth. Ask both together and
wait — one `AskUserQuestion` call with two questions, headers `Making` and
`Depth`, your read as the first option of each. If that tool is not available,
ask in the message body using the text below.

```
Before I start asking — two things.

❓ **G1** — **What are we making?**
   a) Live action with no performance to direct — commercial, product, doc
      interview, event, music video without a story
   b) Live action carrying performance — a short film, a scene between people,
      dialogue coverage, or action, stunts and chase. If anyone has to act, it
      is (b)
   c) Motion graphics / explainer / animated diagrams — no filmed people
   d) Not sure yet — describe it to me in one sentence and I will route it
➡️ <your read from what they already said>

❓ **G2** — **How hard do you want me to push?**
   DEEP — nothing important left assumed. How many rounds that takes depends
   on the job: a 20-second product loop is one round, a short film is five.
   QUICK — 3 rounds on the load-bearing decisions; everything else I lock from
   my recommendations and flag in an "assumed, not answered" appendix you can
   overturn later.
➡️ <derive it: QUICK when they said fast, quick, simple, rough, draft or today,
   when the runtime is under a minute, or when a product, tool or process is the
   subject. DEEP otherwise. Do not recommend DEEP just because money is involved
   — a paid product loop still only has seven real questions in it.>
```

Route → which downstream skill the doc is written for → which sections of
[references/handoff-formats.md](references/handoff-formats.md) you emit at the end:

| Answer | Route | Doc is written for |
|---|---|---|
| a | `LIVE-ACTION` | shot-builder |
| b | `CINEMATIC-ACTION` | shot-builder-cinematic-action (+ shot-builder for plates) |
| c | `MOTION` | motion-builder, or remotion-builder if exact text/data/charts matter |
| d | Ask them to describe it, route yourself, state the route in one line, continue |

**Also do this silently at STEP 0** — do not ask about it:

- Check for existing material. If a folder is connected, look for scripts, refs,
  footage, transcripts, moodboards. If they pasted a link, read it. Existing
  material collapses whole branches of the tree — a reference image means you
  never have to ask them to describe a look in words.
- Read [references/format-archetypes.md](references/format-archetypes.md) once
  you know the format. It pre-fills runtime, aspect, cut budget, camera mode and
  coverage expectations, which removes six questions from the tree immediately.

---

## STEP 1 — The grill loop

Model the brief as a **design tree**. Every decision branches into the decisions
that hang off it. [references/question-tree.md](references/question-tree.md) is
the full map: every node, what it depends on, the question, and the default.

**The frontier** is every node whose prerequisites are already settled — the
questions you can ask now without guessing at an answer you have not heard.

Work in rounds:

1. Compute the frontier.
2. Ask **the whole frontier in one round** — as cards where the tool exists,
   split across consecutive calls if the round runs past four questions. Every
   question carries a recommended answer.
3. Wait for the whole round. Do not start the next round, do not start writing
   the doc, do not generate anything.
4. Their answers reshape the tree — settled nodes push the frontier outward and
   unblock questions that depended on them. Recompute. Ask the next round.

A question whose answer depends on another question still open **in this round**
belongs to a later round, not this one. If you catch yourself writing "if you
said X above, then…", that question is in the wrong round.

The session ends when the frontier is empty: every branch visited, nothing
silently assumed.

### How to ask a round

**Use the clickable-option tool when it exists.** If `AskUserQuestion` is
available, ask with it rather than typing questions into a message. Nearly every
node in this skill is a choice between named alternatives, and a beginner who can
click "the one you recommend" gets a coherent film in four clicks instead of
composing four paragraphs of vocabulary they do not have. That is the entire
thesis of this skill, and the card UI is the shape of it.

Its constraints shape the round:

- **Four questions per call, two to four options each.** A round of nine is
  therefore two or three consecutive calls. Say so before the first one —
  *"Round 2, eight questions, coming in two batches"* — so nobody thinks the
  round ended early.
- **The recommendation goes first, labelled `(Recommended)`.** Its `description`
  is where the cost line goes: *"Warm hard key, steam, macro. Costs you: it will
  never read as documentary."* A user who clicks the first option every time
  should land on a film that works.
- **Headers are twelve characters.** `Runtime`, `Look`, `Stance`, `Light state`,
  `Costume`. Not sentences.
- **"Other" is added for you.** Never write your own escape-hatch option.
- **`multiSelect: true`** for anything genuinely additive — deliverables,
  what-it-is-not, which reference plates exist.

**Open questions get proposed answers, not a blank.** Some nodes have no natural
option list — the one sentence, the ending, the costume, the tactic. Do not fall
back to asking them cold. Generate three candidates from everything you already
know and let them pick or correct one. Correcting is far easier than composing,
and a rejected candidate teaches you as much as an accepted one. `Other` catches
anyone who arrives with their own answer.

```
❓ How does it end?
   a) She takes the first sip and closes her eyes for one second. (Recommended)
      Lands on the product without a logo card. Costs you: no dialogue button.
   b) The bag goes into her hand and she is already out the door.
   c) The shop empties and the machine is wiped down. She is gone.
```

### The text fallback

`AskUserQuestion` does not exist on every surface — a scheduled run, a headless
session, or a host that has not enabled it. When it is missing, ask in the
message body using this format, which carries the same information:

```
**ROUND 3 — The look** · locked so far: format, runtime, ending, register, location

❓ **Q1** — **Reference anchor**: Name a film, ad, or video whose *frames* you
want. Not the story — the frames. If nothing comes to mind, pick one:
  a) THE REVENANT — available light only, wide, cold, the sun is the only lamp
  b) COFFEE COMMERCIAL WARM — hard warm key, steam, macro, everything glows
  c) A24 FLAT — soft daylight, low contrast, nothing looks lit
➡️ (b). You said "premium" and "makes you want one" — that is the warm-macro
family. Costs you: it will not read as documentary, ever.

---

❓ **Q2** — **Costume register**: …
➡️ …
```

The nine-per-round ceiling applies to the round either way. In text the whole
round goes in one message; with cards it is split across calls but is still one
round, and you still wait for all of it before recomputing the frontier.

Rules that make the round work:

- **Every question carries `➡️` with a real recommendation** — not "it depends."
  A beginner must be able to reply "yes to all" and get a coherent film. That is
  the safety net; write recommendations that are good enough to be taken.
- **Name the cost.** Each recommendation ends with what it forecloses. "Costs
  you: no night scenes without a second look." Choices with no cost stated read
  as free and get taken carelessly.
- **Show, do not ask, wherever the choice is visual.** Offer 2-3 named looks from
  [references/look-library.md](references/look-library.md) with one plain-English
  line each on *what it does to the frame*. Each entry carries a `Why it works`
  line: the mechanism, not the mood. That line is what lets you transpose a
  reference's reasoning to a different film — which is usually what the user
  wanted when they named it — instead of copying its focal lengths onto a story
  they do not fit.
- **Never use jargon the user has not used first**, unless you define it in the
  same breath. `anamorphic`, `IRE`, `T-stop`, `key light`, `2.39:1` are all
  fine — with four words of translation attached.
- **Derive the camera, do not poll it.** One question — *in it with them, or
  watching them?* — settles how close the camera stands and therefore what glass
  it needs, and whether it follows or holds. Ask that instead of asking about
  focal lengths, then
  translate silently using
  [references/camera-stance.md](references/camera-stance.md) Part 1. Its Parts
  2-4 are an opt-in craft pass; the same file says when not to offer it, which
  is most of the time.
- **Translate their words before you accept them.** When they say cinematic,
  clean, epic, moody, vibey, premium, raw, aesthetic — stop and run
  [references/vague-to-spec.md](references/vague-to-spec.md). Those words are
  the single largest source of a brief that fails at generation time.
- **Nine questions per round is the ceiling in DEEP, six in QUICK. There is no
  minimum.** A round of two is a good round if two is what the job needs. The
  ceiling exists because reply quality collapses past it; nothing anywhere asks
  you to pad a round upward, and a short session is a success, not a shortfall.

### Match the depth to the job

The failure mode of a skill like this is treating every request as a masterwork.
Most work is not, and does not want to be. A twenty-second product loop, a
testimonial, a social cut, a rough draft someone wants to see today — these have
a correct answer that is reachable in two rounds, and a filmmaker who wanted a
video and got an examination about their protagonist's interiority has been
badly served.

So: **the number of rounds is set by the job, not by the tree.** DEEP does not
mean maximal. It means nothing important is silently assumed — and on a simple
job, not much is important.

The mechanism is in [references/format-archetypes.md](references/format-archetypes.md):
every archetype carries a **Depth** row naming the exact nodes to ask and the
round count. Ask those nodes. Derive the rest from the archetype's defaults and
list them in the doc's "Assumed, not answered" appendix, where the user can
overturn any single one without re-running the session. That is what "every
branch visited, nothing silently assumed" means in practice — a derived-and-flagged
node has been visited; only an unrecorded one has been skipped.

A 20-second product loop is seven questions in one round. A short film is
twenty-eight across five, plus the route's own adders and a short sweep per
scene. Both are DEEP.

Signals to compress hard and finish in two rounds: runtime under a minute · a
product, tool or process as the subject · no protagonist · the words fast,
simple, rough, quick, draft or test · social or feed delivery · the user
answering in three words at a time.

Signals that the job can carry more: runtime over a few minutes · a person the
film is actually about · a named director, DP, or a specific film's frames ·
period or a constructed world · a festival, a client, or a pitch at the end of
it · the user reaching for words like meaning, why, or language unprompted.

When you are compressing, say so in one line rather than silently shortening —
*"This is a 20-second product loop, so I am going to ask seven questions, not
thirty."* People trust a stated shortcut and resent an unexplained one.

### The high-value questions beginners are never asked

Push hard on these. They are where a vague brief becomes a specific one:

1. **How does it end?** The ending names the event. It is the single
   highest-value answer in the whole session — every performance decision reads
   backward from it.
2. **What must be true in every single frame?** The signature. If it is missing
   from a frame, that frame failed.
3. **What is this NOT?** Five anti-patterns. Beginners find negatives far easier
   than positives, and downstream skills need them verbatim.
4. **What happens to the viewer after?** Not "what do they feel" — what do they
   *do*. Buy, share, sit still, call someone.
5. **What are you afraid it will look like?** Names the failure mode before it
   is rendered.
6. **If you could only keep one shot, which?** Finds the spine of the edit.

---

## STEP 2 — The coherence pass (this is not optional)

Before writing anything, run every answer against every other answer using
[references/coherence-check.md](references/coherence-check.md).

A brief can be fully answered and still be impossible — a warm golden-hour look
with a night interior, a 15-second runtime with eleven beats, four characters
performing in one shot, a documentary register with a locked studio void.
Contradictions surface as questions, not as silent fixes:

```
⚠️ **Two answers fight each other.**
You locked golden-hour warm key (Q4) and a windowless basement (Q7). One has
to give.
➡️ Keep the basement, move the look to practical-source warm — a single
tungsten bulb doing the same job the sun was doing. The palette survives; the
light motivation changes.
Or: keep the sun, move the scene to the stairwell at the top of the basement.
```

Resolve every contradiction with the user before the doc is written. A locked
doc with a contradiction in it is worse than no doc — downstream skills will
render the contradiction.

---

## STEP 3 — Write the intention doc

Use [assets/intention-doc-template.md](assets/intention-doc-template.md) as the
skeleton. Fill every section. Where an answer never came (QUICK mode, or the
user waved a question off), write the assumed value in place **and** list it in
the appendix — never leave a section blank and never silently invent.

Write it to `<project-slug>-intention.md` in the working directory.

**One doc, or several.** The one-light-state rule means one doc covers one
continuous world. An ad, a music-video section, an explainer: one doc. Anything
with multiple locations or times of day splits into a project doc (intention,
event, look, cast, shared tokens) plus one scene doc per scene (world,
performance, beats, sound). The template's closing section gives the exact
split, the naming, and how beats number across scenes. Say which shape you are
using in one line before you start writing — a user expecting one file and
receiving nine deserves the warning.

Voice: flat, declarative, present tense. This is a specification, not a pitch.
"The key is a single 2K tungsten unit camera-left, three feet above eyeline" —
not "we bathe our hero in a warm, inviting glow."

**Things that must not appear in the doc**, because they corrupt every
downstream skill that reads it:

| Never | Instead |
|---|---|
| Age words or numbers (`young`, `teen`, `40yo`, `elderly`) | Describe by build, posture, wardrobe register |
| Emotion adjectives as direction (`sad`, `angry`, `confident`) | The task: wants / blocked by / plays / turns on |
| Facial choreography (`brows lift`, `eyes widen`) | The tactic; let the face follow |
| Real people's names, real brand names inside prompt bodies | Role descriptors, generic product nouns |
| Aspect ratio inside a prompt body | Aspect goes in FORMAT MODE and API params only. The one exception is the style token's LOOK SPEC, where shot-builder requires it — nowhere else. |
| `as above`, `see previous`, `same as scene 2` | Restate in full, every time |
| Mood-board adjectives with no measurement in the look spec | Hex, Kelvin, contrast ratio, ASA, 0-1 saturation |
| Two light states in one doc | Two docs. Say so. |

---

## STEP 4 — Emit the paste-ready tokens

The doc's final sections are machine-facing. Build them from
[references/handoff-formats.md](references/handoff-formats.md), which carries the
exact templates each downstream skill expects:

| Route | Emit |
|---|---|
| `LIVE-ACTION` | `<CAST>` token(s), `<LOCATION>` token(s), `<STYLE>` token — shot-builder's exact file shapes — plus the camera-mode declaration (M1-M5) |
| `CINEMATIC-ACTION` | A complete `## CONTEXT` block (the ten CONTEXT-tier keys), the `## LEDGER` table, a beat skeleton, and `EVENT AND SHARED DIRECTION` + one `ACTING TASK` per character |
| `MOTION` | A motion-sheet brief: family slug, surface, palette, type voice, stage locked/free, energy, logo answer — enough to drive motion-builder's route B with no interview |

Emit these **verbatim in the templates' shapes**. Paraphrasing a template is the
same failure as paraphrasing a token: it drifts. If a field genuinely has no
answer, write the field with `TBD — <what still has to be decided>` rather than
dropping the field — except inside the token blocks themselves, where a TBD ends
up pasted straight into a render. Resolve those before shipping.

On the two live-action routes, **write the token files to disk** next to the
intention doc, one file per token, so the next skill reads them instead of
re-deriving them from prose:

```
<project-slug>-tokens/cast/<CAST-TOKEN>.md
<project-slug>-tokens/locations/<LOCATION-TOKEN>.md
<project-slug>-tokens/styles/<STYLE-TOKEN>.md
```

§10 of the doc then carries a short manifest — token name, path, what it locks —
rather than the whole file three times over. The MOTION route's brief is short
enough to live inline in §10.

---

## STEP 5 — Lint

Set `$SKILL_DIR` to this skill's directory once per session, then:

```bash
SKILL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/intention-builder"  # neste repositório
# SKILL_DIR="$HOME/.claude/skills/synced/intention-builder"  # synced from an account
python "$SKILL_DIR/scripts/lint_intention.py" <project-slug>-intention.md
```

It sweeps the token files too — anything under `<project-slug>-tokens/` beside
the doc — because that text is what actually reaches the image model, and the
vocabulary bans are absolute there. Pass `--tokens DIR` if they live elsewhere.

The linter catches what a human reader skims past: banned vocabulary, missing
locks, beat count against runtime, two light states, cast count past the drift
cliff, palettes without hex, a look spec with no measurements, TBDs left in
required blocks. Fix everything it flags before delivering. If a flag is a
deliberate exception, add a one-line note in the doc saying why, and re-run.

---

## STEP 6 — Deliver

1. **Markdown always.** Send it with SendUserFile. If a folder is connected,
   write it there too.
2. **PDF on request.** Ask once, at the end, in one line: *"Want this as a
   designed PDF for the client, or is the markdown enough?"* If yes, read the
   `pdf` skill's SKILL.md and build it from the markdown — do not hand-roll it.
3. **Name the next step explicitly**, as the last line of your reply — which
   skill, and what to say to it:

```
Locked. Next: run `/shot-builder` and say "lock <HERO> and <INT-DINER-NIGHT>
from the intention doc" — the token blocks in §10 paste straight in.
```

---

## Re-entry: an intention doc already exists

If the user comes back with changes ("actually it should be night", "the client
hates the ending"), do not re-run the whole tree. Read the existing doc, find
which node changed, and **re-grill only the subtree that hangs off it** — a
changed light state invalidates palette, grade, and every beat's lighting, but
not the cast, the wardrobe, or the event. State the blast radius before you
start:

```
Changing day → night invalidates 4 decisions: key motivation, palette, grade
white point, and the exterior beat. Everything else holds. Four questions.
```

Then bump the doc's `version` and append a `## Changelog` entry. Never
overwrite silently — a crew may already be working from v1.

---

## What this skill does not do

- It does not generate images, video, or shot prompts. It produces the document
  those are built from. If the user asks for a frame mid-session, finish the
  round first, then hand off — a prompt built from a half-locked intention is
  the exact failure this skill exists to prevent.
- It does not write the script or the VO. That is `story-beats`.
- It does not decide the story. It finds out what the user's story already is,
  including the parts they have not said out loud.

## When the user resists

Some people bristle at being questioned. Two moves, in order:

1. **Show the cost concretely, once.** "If we skip the light state, every shot
   comes back a different time of day and the edit will not cut." Not a lecture —
   one sentence, then move on.
2. **Drop to QUICK and flag it.** A doc with six honest assumptions in the
   appendix beats an abandoned session. Say what you assumed and keep going.

Never grind on a question they have declined twice. Take the recommendation,
flag it, move to the next node.
