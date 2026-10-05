---
name: plan-edit-direction
description: Phase 4.7 of the Maestro Video Generator pipeline — Edit Direction. AFTER visual sourcing (Phase 4) and BEFORE the motion build (Phase 5), decide the per-beat EDIT STYLE for the whole video from the script + SRT windows + resolved assets, and emit a validated <Name>_edit_plan.json. Content-driven editing: §1 is the fixed opening hook, every later beat's edit style is chosen by what its phrase needs, with no style repeating within a window of 4 (house variety rule). SHADOW-MODE — the plan is emitted + gated but does NOT yet drive the build (canary rollout). Triggers — "plan the edit", "edit direction", "assign edit styles", "which edit style per beat", runs automatically as Stage 4.7 between visual sourcing and motion.
---

> Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: plan-edit-direction (Phase 4.7 — Edit Direction)

**Purpose:** decide, per beat, WHICH edit style renders that phrase — up front, as a deterministically-validated
plan — instead of the motion phase picking ad-hoc while building. It sits BETWEEN Phase 4 (visual sourcing:
you now know the SRT windows + which beats got a real screenshot / keyed image asset) and Phase 5 (motion).
It implements the content-driven-editing house rule (the `assertEditFlow` guard in the library + the
`EDIT_STYLES.md` palette it references).

> **SHADOW-MODE (current — ZERO output risk).** You EMIT `<Name>_edit_plan.json` and GATE it with
> `verify_edit_plan.py`, but the motion phase (Phase 5) STILL builds the current way (agent picks ideas +
> `assertSectionGrammar` at render). The plan is for comparison during the canary. Do NOT let a plan
> FAIL block the run — if the gate fails or the plan is missing, log it and continue with the current build.
> Promotion to authoritative happens only after 3–5 real runs hold QC≥75 (with QC enabled) with the plan
> guiding the build (see `motion-pipeline/EDIT_STYLES.md` → Rollout).

## READ FIRST
- `motion-pipeline/EDIT_STYLES.md` — the vetted edit-style palette (`EDIT_STYLE_IDS`) + the variety rule.
- `motion-pipeline/SECTION_PIPELINE.md` — the section grammar (the fixed §1 opening + the mandatory breathers).
- The two axes: **`edit_style`** (this plan, distance-4 varied) is ORTHOGONAL to **`motion_idea`** (WHAT object
  is shown — obeys match-the-line QCR-006/080, MAY repeat). Never conflate them.

## INPUTS
- `<scratch>/<Name>.srt` (the per-run SRT; sentence windows = the beat boundaries).
- `<downloads>/<Name>_creative_brief.json` (style = premium-classic; premium_palette).
- Resolved Phase-4 assets: `motion-pipeline/remotion-agent/public/assets/<Name>/*_cut.png` (which beats have a
  keyed hero asset from `generate-image-assets`) + `public/refs/*.png` (which beats can show a real screenshot → `evidence`).
- `<scratch>/script_entities.json` (named real things → candidates for `evidence` / `hero`).

## OUTPUT
- `<downloads>/<Name>_edit_plan.json` — a JSON array, ONE object per beat, in time order:
  ```json
  [{"beat":1,"win":[0.0,5.28],"edit_style":"opening","motion_idea":"evidence-zoom","asset":"refs/<Entity>.png","rationale":"hook: real repo + pill headline"},
   {"beat":2,"win":[8.4,11.0],"edit_style":"avatar","motion_idea":"breather","rationale":"plain narration, no object"},
   {"beat":3,"win":[11.0,13.5],"edit_style":"phrase","motion_idea":"reveal","rationale":"punchy list line — word-by-word"},
   {"beat":4,"win":[15.1,16.5],"edit_style":"hero","motion_idea":"apiplug","asset":"assets/<Name>/b1_apiplug_cut.png","rationale":"names the API connector object"}]
  ```
  `win` = [start,end] seconds (snap to SRT sentence boundaries). `edit_style` ∈ EDIT_STYLE_IDS. `motion_idea`
  = the concrete object/mechanism matching the line. `asset` = the ref/keyed-cutout file when the style needs one.

## WORKFLOW
1. **Segment** the SRT into beats (≤2.5s each; split longer sentences). Beat 1 = §1 opening (fixed).
2. **Classify each later beat's phrase → an `edit_style`** from the palette (EDIT_STYLES.md `when_to_use`):
   - names ONE concrete object → `hero` (has a keyed image asset) ; a real named repo/site/price → `evidence` (has a `refs/` shot).
   - a punchy line to land → `phrase` (§3b caption) ; a short CTA → `phrase` with distilled groups.
   - keep the avatar on-screen with big words → `avatarcap` ; a plain narration beat → `avatar` breather.
   - an explanation pairing avatar + graphic → `split` ; a "system / connects everything" → `full` ;
     a process/sequence → `flow` ; a number/"10x"/"%" → `stat`.
3. **Assign `motion_idea`** per beat by MATCH-THE-LINE (the concrete noun/action) — independent of edit_style.
4. **Variety (calibrated on the canary — QCR-292):** HARD = §1 opening + no NON-hero style
   adjacent + richness (≥4 / ≥5 distinct). `hero` is EXEMPT from the distance rule (its variety = different
   OBJECTS + animation depth; forcing it off an object-naming phrase risks QCR-006). The "4-in-a-row" window
   is ADVISORY (`verify_edit_plan.py` WARNs) — prefer to vary WHERE the content allows, but do NOT force a
   wrong style onto a phrase. ≥6-beat → ≥4 distinct; ≥10-beat → ≥5.
   - **ANIMATION-DEPTH on recurring beats (the real variety win):** when the SAME style recurs, vary its
     ANIMATION so the two don't look identical. TWO styles have a 2nd vetted animation (tag the
     recurrence `@flow`):
     - **`full`:** `full:<c>` default = `PremiumFullGraphics` (radial rings-orbit); `full:<c>@flow` =
       `PremiumFullFlow` (top→bottom serpentine pipeline, candidate).
     - **`split`:** `split:<c>` default = `PremiumSplitGraphics` (rings-orbit + satellites); `split:<c>@flow`
       = `PremiumSplitFlow` (horizontal process flow in the top panel, candidate).
     So two `full` beats → one rings + one flow; two `split` beats → one rings + one flow. (`hero` depth
     variant not built yet — until it is, `hero` recurrences vary by OBJECT only, as today.)
   - **Reality (measured on real builds):** current builds lean HARD on `hero` (the workhorse §4 asset-drift look).
     The win of this step is spreading those out — use `evidence`/`split`/`full`/`flow`/`stat` for beats that
     TODAY would all be `hero`. Where the palette lacks depth (a style has only one animation), the variety
     comes from choosing a DIFFERENT style, not a second look of the same one (see EDIT_STYLES.md variety-debt).
5. **GATE:** `python3 motion-pipeline/verify_edit_plan.py <downloads>/<Name>_edit_plan.json` — exit 0 = PASS.
   Fix reassignments until green. **Shadow-mode: if it can't go green (thin palette / short video), log the
   Deff/warnings and continue — do NOT block the run.**
6. **State:** `python3 maestro_state.py set --run <Name> --field edit_plan="<downloads>/<Name>_edit_plan.json"`.

## HANDOFF
- **Shadow-mode:** the plan is recorded for comparison. Phase 5 builds as it does today; note in the run how
  the emitted plan differs from what was built (that diff is the canary signal).
- **Authoritative (post-canary):** Phase 5 reads `edit_style`+`motion_idea` per beat as the CONTRACT and the
  composition calls `assertEditFlow(ids)` (distance-4) as the render backstop — the Python gate and the TS
  guard enforce the SAME rule.

## DEPENDENCIES
- Python 3; `motion-pipeline/verify_edit_plan.py`; `maestro_state.py`. No external keys. **(When QC is enabled) the Gemini grade stays FINAL.**
