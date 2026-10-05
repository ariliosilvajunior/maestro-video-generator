---
name: choose-creative-direction
description: Phase 2.5 of the Maestro Video Generator pipeline — the per-video Creative-Director layer. After the PT-BR script is written, the agent classifies the topic shape and picks EXACTLY ONE pre-vetted, QC-safe creative identity from the style gallery, emitting one creative_brief.json that every downstream phase (motion, b-roll, subtitles, music) reads instead of a hard-coded one-size-fits-all template. Auto-runs as Stage 2.5 between write-script-ptbr (Phase 2) and generate-avatar-heygen (Phase 3). Triggers — "choose creative direction", "pick a style for this video", "set the creative direction", "decide the visual style".
---

> Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: choose-creative-direction (Phase 2.5 — Creative-Director Layer)

The primary design goal: **give the agent MORE creative freedom — per video — WITHOUT breaking the QC gate.** This skill replaces the rigid one-size-fits-all template with a small set of **pre-vetted, QC-safe creative identities**. The agent does NOT invent free-form looks; it **classifies the topic** and **selects ONE resolved style** from a curated registry, then records that style as a single `creative_brief.json` that motion, b-roll, subtitle, and music phases all consume. Variety + boldness, but every value is already proven to pass QC.

**Never execute from memory — read the gallery + look profiles first.** This is an AGENT-DECISION step (no external API).

## WHERE IT RUNS — between script and HeyGen (critical ordering)

Order: Stage 0 queue dispatch → Write PT-BR Script (2) → **choose-creative-direction (2.5)** → HeyGen+SRT (3) → select-brolls-stock (4) → Motion (5) → Merge (6) → Insert (7) → Subtitles (8) → Music (9) → QC (10, optional) → CTA (11, optional) → Post (12, `/post-now`).

It runs **after** the script exists (so the topic shape is known) and **before** HeyGen, so the brief is on disk before any visual phase needs it. The brief is **advisory to creative choices only** — it steers palette/motion/b-roll/subtitle/music decisions. **It is NOT advisory to the QC gate: when QC is enabled (`config.qc.enabled`), the Gemini grade remains the final authority** (a brief never excuses a grade below `config.qc.threshold`, default 75).

## INPUTS

- `<scratch>/heygen_script.txt` — the just-written PT-BR script (from `write-script-ptbr`). Read it to judge the editorial tone (announcement vs warning vs how-to…).
- `<scratch>/script_entities.json` — the named-entities list from `write-script-ptbr` (real tools/products/companies/repos/sites the script names; `[]` if none). **Triggers the MANDATORY `reference_capture` derivation** (step 4 field rules): non-empty ⇒ `reference_capture=true` + populate `references[]`. See `PIPELINE_DIRECTIVES.md` §2.
- The run's topic seed — the JSON handed over by Stage 0 / Phase 2 (see the `write-script-ptbr` INPUTS: the source-link `transcript` + `topic_seed` + the `hook` the agent wrote), or the manual topic/transcript the user gave. Read `topic_seed`, `hook`, `category` (if present), and `gate_tier`. (For a manual topic, treat `gate_tier` as unknown.)
- `pipeline-log.csv` — prior runs, for the repetition guard (step 7).

## REGISTRIES IT READS (the vetted source of truth — never improvise values)

- `motion-pipeline/STYLE_GALLERY.md` — the **style registry**. Each entry is a `style_id` with its resolved fields (palette, motion_intensity, default headline_formula, default pacing, etc.) and an **ACTIVE / RETIRED** status. The agent may pick ONLY a `style_id` whose status is **ACTIVE**. The gallery also lists the **approved palette_pair** combinations (the only harmonious pairs allowed).
- **[NOT YET BUILT — ROADMAP_100X backlog; the missing-registry fallback below applies]** `broll-pipeline/cinematography-styles.md` — the **b-roll look profiles** (profile names like `clean-product-macro`, `dark-tech-abstract`, `cinematic-warm`, etc.). `broll_style` must be one of these profile names.
- `docs/NARRATIVE_ARCHETYPES.md` — the **hook archetypes** (ids like `number-promise`, `myth-bust`, `before-after`, `open-loop`, `enemy-callout`…). `hook_archetype` must be one of these ids.
- **[NOT YET BUILT — ROADMAP_100X backlog; the missing-registry fallback below applies]** `subtitle-pipeline/style_packs.py` — the **subtitle personality packs** (pack names; each pack declares an accent color). `subtitle_personality` must be a pack name whose accent color belongs to the chosen `palette`.
- **[NOT YET BUILT — ROADMAP_100X backlog; the missing-registry fallback below applies]** `add-music/music_library.json` (canonical `music_library.json` for the run) — the **music moods**. `music_mood` must be one of its declared moods.

> If a registry file is missing at runtime, do NOT invent its contents — fall back to the default style (step 5) and log a warning. The main loop owns creating/maintaining these registries.

## WORKFLOW

### 1. READ inputs
Read `<scratch>/heygen_script.txt` and the topic seed. Note the hook line, the emotional register, and the gate_tier.

### 2. READ the registries
Open `motion-pipeline/STYLE_GALLERY.md` and `broll-pipeline/cinematography-styles.md` (plus the archetype/subtitle/music registries above). Build the menu of ACTIVE `style_id`s and their resolved fields.

### 3. CLASSIFY the topic shape → pick ONE style_id
Classify the video into exactly ONE **topic shape**, then pick the ACTIVE `style_id` the gallery maps to that shape (the gallery is the authority on the mapping; this table is the default intent):

| Topic shape | What it sounds like | Typical fit |
|-------------|---------------------|-------------|
| **announcement** | "saiu/lançou/agora tem…", new feature/model/release | bold-claim or news-style, high energy |
| **myth-bust** | "todo mundo acha X, mas…", correcting a belief | myth-bust hook, med/high intensity |
| **how-to** | "como fazer X", step-by-step, tutorial | number-promise, med intensity, clear b-roll |
| **controversy** | "X vs Y", hot take, polarizing claim | enemy-callout / open-loop, high intensity |
| **transformation** | "antes eu fazia X, agora…", before→after | before-after, slow-reveal → rapid payoff |
| **warning** | "cuidado com…", risk/mistake to avoid | warning headline, med/high, tense palette |
| **list** | "5 coisas/3 jeitos…", enumerated payoff | number-promise, rapid-fire, count-up motion |

**ENFORCED DEFAULT (see `PIPELINE_DIRECTIVES.md` §1):** `premium-classic` is the default `style_id` for EVERY topic shape above. The premium toolkit (`src/library/premium.tsx`: `PremiumFrame`/`PremiumHeadline`/`PremiumEvidence`/`PremiumAsset`/`PremiumImageIcon`/`PremiumFlow`) + the `generate-image-assets` skill build a coherent editorial video; per-element graphics are keyed IMAGES from your image provider (`config.images.provider`), generated fresh for THIS topic's concepts. So emit `style_id: "premium-classic"` by default.

- **FALLBACK → `hand-drawn-annotation` (automatic, never blocks the run):** emit `hand-drawn-annotation` instead ONLY when premium can't run — the image provider is unavailable (key invalid, quota exhausted, outage) or `config.images.provider` is `"none"` — or a topic genuinely has nothing a premium image depicts. The motion phase ALSO auto-falls-back at build time if asset generation fails. Record the fallback reason in `rationale`.
- **`premium-snap`** — still a narrow opt-in for dark-premium-HYPE shapes; not part of the default path.

#### Premium COLOR CONCEPT by VIDEO THEME — REQUIRED field `premium_palette`
The premium look is **no longer a fixed marble+gold**: the font + background color concept now varies per **video theme**. Classify the topic's THEME and emit the matching `premium_palette` id (one of the six `PREMIUM_PALETTES` defined in `src/library/premium.tsx`). The motion phase wraps the whole composition in `<PremiumTheme palette="<id>">` so every premium component (frame, headline, evidence, assets) recolors coherently.

| Video theme | `premium_palette` | Look |
|---|---|---|
| money · finance · luxury · "ganhar dinheiro" · timeless (DEFAULT when unsure) | `marble-gold` | warm marble paper + antique gold (LIGHT) |
| AI · tech · power · "o futuro" · dramatic reveal | `charcoal-gold` | deep charcoal + warm gold (DARK) |
| data · SaaS · analytics · corporate · trust | `midnight-azure` | midnight navy + azure (DARK) |
| growth · health · nature · productivity · "economizar tempo" | `ivory-emerald` | ivory + deep emerald (LIGHT) |
| luxury · fashion · beauty · lifestyle · creators | `bordeaux-rose` | soft rose + bordeaux (LIGHT) |
| engineering · hardware · crypto · industry · "construir" | `slate-copper` | slate + copper (DARK) |

Pick the ONE theme that best fits; default to `marble-gold` if genuinely ambiguous. This is independent of the abstract `palette` field below (which feeds subtitle accent cross-checks) — `premium_palette` drives the on-screen background/serif color concept. Record the theme→palette choice in `rationale`. (Hand-drawn fallback ignores `premium_palette`.)

Feed-freshness = vary the FRESHNESS DIALS (step 7), the `premium_palette` (when the theme legitimately differs run-to-run), and WHICH objects/icons are generated + how scenes are composed, WITHIN premium — not by swapping styles. Record in `rationale` what you varied.

Pick **EXACTLY ONE** `style_id` from the ACTIVE gallery list. Record the gallery's **resolved fields** for that style — do not free-form your own palette/intensity. The only agent judgment is the topic→style choice and the 1-2 sentence rationale.

### 4. EMIT the creative brief
Write `<downloads>/<Name>_creative_brief.json`. Use the **Write tool** (never bash heredoc/echo — protects any PT-BR diacritics in `rationale`). Exact schema:

```json
{
  "name": "ClaudeCodeGratis",
  "style_id": "premium-classic",
  "palette": "premium-charcoal",
  "premium_palette": "charcoal-gold",
  "palette_pair": null,
  "motion_intensity": "med",
  "broll_mode": "motion-heavy",
  "broll_style": "clean-light",
  "reference_capture": true,
  "references": [
    { "entity": "Claude Code", "kind": "tool", "url_hint": "claude.com/product/claude-code", "what_to_highlight": "the terminal / skills the narration names" }
  ],
  "hook_archetype": "open-loop",
  "headline_formula": "curiosity-gap",
  "subtitle_personality": "clean-pop",
  "music_mood": "light-friendly",
  "pacing": "balanced",
  "rationale": "Estilo padrão premium-classic: visual editorial, fundo theme-palette, imagens recortadas (image provider) por beat; abertura open-loop com headline CLICKBAIT e ritmo equilibrado. references[] traz a ferramenta nomeada no roteiro para captura real (Stage 4 / §2 PremiumEvidence)."
}
```
(When `<scratch>/script_entities.json` is `[]` — a purely abstract topic — set `"reference_capture": false` and `"references": []`.)

> **ACTIVATION REALITY:** in `STYLE_GALLERY.md` the active DEFAULT is
> **`premium-classic`** (§3.05 — editorial themed-paper + gold, keyed image-icons from `generate-image-assets`,
> toolkit `src/library/premium.tsx`). So **every brief resolves to `premium-classic` by default**;
> `hand-drawn-annotation` (§3.0) is the FALLBACK when image-asset generation can't run. For a premium
> brief use `style_id: "premium-classic"`, `palette: "marble+antique-gold"`. `premium-snap` is a narrow alternate; the 4 richer V8 styles remain `candidate` and
> MUST NOT be selected until each passes a real QC≥75 promotion render. `style_id` values are
> the gallery's lowercase-hyphen ids.

Field rules:
- `name` — the run's VideoName (same token used across all suffixes).
- `style_id` — an ACTIVE id from `STYLE_GALLERY.md`.
- `palette` — one of `ember | voltage | acid | royal | <new>` (a `<new>` value is allowed ONLY if the gallery defines it as an ACTIVE palette; never an ad-hoc color).
- `premium_palette` — **REQUIRED for `premium-classic`** — the per-theme on-screen color concept (background + serif). One of `marble-gold | charcoal-gold | midnight-azure | ivory-emerald | bordeaux-rose | slate-copper` (the six `PREMIUM_PALETTES` in `src/library/premium.tsx`). Chosen by VIDEO THEME (see the theme→palette table above); default `marble-gold` if ambiguous. The motion phase passes it to `<PremiumTheme palette="…">`. Ignored by the hand-drawn fallback.
- `palette_pair` — `null`, OR one approved harmonious pair from the gallery's approved-pair list (e.g. `"ember+voltage"`). Never an arbitrary combination.
- `motion_intensity` — `low | med | high`.
- `broll_mode` — `stock | motion-heavy` (real stock footage is the only b-roll source; `motion-heavy` leans on hand-drawn Remotion scenes for more windows). **No AI-generated b-roll.**
- `reference_capture` + `references` — **MANDATORY, DERIVED (not a free judgment) — see `PIPELINE_DIRECTIVES.md` §2.** Read `<scratch>/script_entities.json` (from `write-script-ptbr`). If that list is NON-EMPTY (the script names ANY real tool/product/company/repo/site), `reference_capture` MUST be `true` — you may NOT set it `false` while named entities exist. Set `false` ONLY when the entities list is `[]` (a purely abstract topic). Also COPY the entities into the brief as a structured `references` array: `[{ "entity": "<exact name in the script>", "kind": "tool|product|company|repo|site", "url_hint": "<best canonical URL guess>", "what_to_highlight": "<the part the narration is about>" }]`. A non-empty `references[]` is a non-skippable Stage-4 capture trigger (`capture-references` → real `ScreenshotCard`). A real run once set `reference_capture=false` while the source named a real tool — that is a hard rule VIOLATION, not a judgment call.
- `broll_style` — a profile name from `cinematography-styles.md`.
- `hook_archetype` — an id from `NARRATIVE_ARCHETYPES.md`.
- `headline_formula` — one of `curiosity-gap | bold-claim | number-promise | warning | news-style` (drives the S0 `HeadlineBanner`).
- `subtitle_personality` — a pack name from `style_packs.py`; **its accent color MUST be drawn from the chosen `palette`** (see validation).
- `music_mood` — a mood from `music_library.json`.
- `pacing` — `slow-reveal | balanced | rapid-fire`.
- `rationale` — 1-2 sentences (PT-BR) on why this style fits the topic shape.

### 5. VALIDATE (assertions — fall back, never block)
Before persisting, assert:
1. `style_id` exists in `STYLE_GALLERY.md` **and** its status is **ACTIVE**.
2. If `palette_pair` is non-null, it is on the gallery's **approved-pair list**.
3. The `subtitle_personality` pack's **accent color is a member of the chosen `palette`** (cross-check the pack's accent against the palette's colors in `STYLE_GALLERY.md` / `style_packs.py`).
4. `broll_style`, `hook_archetype`, `music_mood` each resolve in their registries.

If **any** assertion fails, a registry is missing, **or the best-matching style is still a `candidate`**: **fall back to the ENFORCED DEFAULT style `premium-classic`** (premium_palette per topic theme — default `marble-gold`; motion_intensity `med`, broll_mode `motion-heavy`, hook_archetype `open-loop`, headline_formula `curiosity-gap`, subtitle_personality `clean-pop`, music_mood `light-friendly`, pacing `balanced`), emit that brief, and **log the intended style** + a warning. (`hand-drawn-annotation` is NOT the creative-direction fallback — it is selected ONLY at the motion phase when image-asset generation genuinely can't run.) **Never block the pipeline on a creative-direction failure** — a safe default always ships.

### 6. PERSIST into the run state (resume-safe)
Record the brief path so it survives a resume. Write it through `maestro_state.py` (atomic, per-run `pipeline-runs/<Name>.json` — never hand-edit the JSON):
```bash
python3 maestro_state.py set --run <Name> --field creative_brief="<downloads>/<Name>_creative_brief.json"
python3 maestro_state.py phase --run <Name> --num 2.5 --name choose-creative-direction --status done \
  --output "<downloads>/<Name>_creative_brief.json" --resume-next 3
```
That stores `{ "creative_brief": "<downloads>/<Name>_creative_brief.json" }` at the top level of the run state and adds the Phase-2.5 entry to `phases[]` (`{phase: 2.5, name: "choose-creative-direction", status, timestamp, output}`), setting `resume_from` to 3. On resume from any later stage, downstream phases read the brief from this path — they do NOT re-derive it.

> **Downstream contract (documented here; the main loop wires it in each phase):** motion, b-roll, subtitle, and music phases each READ `creative_brief.json` and honor its fields instead of hard-coding — motion uses `style_id` (the STYLE CONTRACT — `generate-motion-remotion` step 0 reads it, asserts ACTIVE, and builds hand-drawn on any miss)/`palette`/`palette_pair`/`motion_intensity`/`headline_formula`/`pacing`; b-roll uses `broll_mode`/`broll_style`; subtitles use `subtitle_personality` (accent from palette); music uses `music_mood`. **Phase 4 `capture-references` reads `reference_capture` + `references[]`: when `reference_capture` is `true` it MUST capture a real screenshot for each `references[]` entry and render it in an annotated hand-drawn `ScreenshotCard` BEFORE motion (Phase 5) — a non-empty `references[]` is a non-skippable capture trigger.** The brief is advisory to creative taste; QC and `PIPELINE_DIRECTIVES.md` stay final on process.

### 7. REPETITION GUARD (feed-fatigue — vary the DIALS, never the style)
Read `pipeline-log.csv`. The ENFORCED DEFAULT style `premium-classic` MUST remain the primary candidate run-to-run — **feed-freshness is achieved by varying the look WITHIN premium, NEVER by reverting to hand-drawn for variety.** If the last run was also `premium-classic` (the normal case), do NOT change `style_id`; instead vary the FRESHNESS DIALS that stay inside the premium envelope: `hook_archetype`, `headline_formula`, `pacing`, `motion_intensity`, and WHICH objects/icons get generated + how each beat is composed. Record in `rationale` what you varied. **`hand-drawn-annotation` is the FALLBACK** — emit it only when image-asset generation can't run (invalid key / quota / outage / `images.provider: "none"`) or the topic has nothing premium to depict; the motion phase also auto-falls-back at build time. If `hook_archetype` repeats the immediately prior run, vary the archetype (still within premium).

## OUTPUTS
- `<downloads>/<Name>_creative_brief.json`.
- The run state (`pipeline-runs/<Name>.json`) updated with the `creative_brief` path + Phase-2.5 entry.
- A printed brief summary (chosen style_id, palette, intensity, broll_mode, hook_archetype) + any warnings (fallback used / repetition nudge).

## HARD RULES
- **(When QC is enabled) Gemini QC is the FINAL authority.** This brief NEVER weakens, bypasses, or excuses the `config.qc.threshold` (default 75) gate. A bold style that scores below it still fails — fix the machinery, never the verdict. "Never fake green."
- **PT-BR obrigatório** (`config.brand.language`, default `pt-BR`) for every text field that carries copy (`rationale`, and any headline/caption text a downstream phase derives from the brief).
- **ONE avatar per repo (`config.avatar.*`).** Creative direction changes the *look around* the avatar, never the avatar — never switch avatars mid-run.
- **No free-form invention.** The agent only selects ACTIVE registry values and records the gallery's resolved fields. New styles/palettes are added to the registries deliberately (after a QC-vetted promotion render), not minted here.
- **Never block the pipeline.** Any validation failure → ENFORCED DEFAULT `premium-classic` + warning, and continue. (Hand-drawn is only the motion-phase image-provider-unavailable fallback, not the creative-direction default.)
- **Resume-safe:** the brief path lives in the run state.

## DEPENDENCIES
- None executable (pure agent authoring + Write tool). Reads the registries listed above. No API, no cost.

## WORKED EXAMPLE — topic "Claude Code grátis" (how-to)

> **Today this how-to SHIPS `premium-classic`** (the ENFORCED DEFAULT). The mapping below shows an INTENDED future alternate (`data-clarity`) it could use once that candidate is promoted via a QC≥75 render — until then the brief resolves to the premium-classic default and logs `data-clarity` as the intended alternate. The example illustrates the topic→style classification, not a currently-selectable alternate.

Topic shape: **how-to** (passo-a-passo de como usar o Claude Code de graça). Classification → a clean, didactic identity → intended alternate `style_id: data-clarity` (candidate) → **ships `premium-classic` today**.

`<downloads>/ClaudeCodeGratis_creative_brief.json`:
```json
{
  "name": "ClaudeCodeGratis",
  "style_id": "premium-classic",
  "palette": "premium-charcoal",
  "premium_palette": "charcoal-gold",
  "palette_pair": null,
  "motion_intensity": "med",
  "broll_mode": "motion-heavy",
  "broll_style": "clean-light",
  "hook_archetype": "number-promise",
  "headline_formula": "number-promise",
  "subtitle_personality": "clean-pop",
  "music_mood": "light-friendly",
  "pacing": "balanced",
  "rationale": "Tutorial de Claude Code grátis no estilo padrão premium-classic: fundo theme-palette, imagens recortadas por beat, headline CLICKBAIT com promessa numérica, §3b reveal palavra-por-palavra e ritmo equilibrado para os passos respirarem."
}
```
Validation passes (`premium-classic` ACTIVE / DEFAULT; `palette_pair` null; `clean-pop` subtitles sit over the avatar; `clean-light`/`number-promise`/`light-friendly` all resolve). Repetition guard: if the prior run also used `number-promise`, warn and vary the hook. Brief path written into the run state, `resume_from: 3`.
