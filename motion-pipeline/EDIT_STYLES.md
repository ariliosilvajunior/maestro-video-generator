# EDIT_STYLES.md — the content-driven per-beat edit-style registry (completes assertEditFlow)

> **What this is.** The library already
> ships `assertEditFlow` + `EDIT_STYLE_IDS` (in `src/library/motionideas.tsx`) for **content-driven
> editing** — the edit is NO LONGER a fixed §3→§3b→§4→§5→§6 cycle; after the fixed §1 opening, EACH beat's
> edit style is chosen by **what the script phrase needs**. That guard REFERENCES this file for the palette;
> no shipped comp adopts the guard yet (shadow mode — see Rollout status).
>
> This sits ALONGSIDE the frozen `premium-classic` base style (STYLE_GALLERY §3.05) — it does NOT change the
> base style; it decides, per beat, WHICH edit style renders that phrase. Two orthogonal axes:
>   - **`edit_style`** (this file, = `EDIT_STYLE_IDS`) = the CANVAS/concept for the beat → obeys the house
>     **variety rule** (distance-4, below), enforced by `verify_edit_plan.py` (pre-render) + `assertEditFlow`
>     (render backstop). These two MUST agree.
>   - **`motion_idea`** (from `motionideas.tsx`) = WHAT concrete object/mechanism is shown → obeys
>     **match-the-line** (QCR-006/080); it MAY repeat when the phrase calls for it.

---

## THE VARIETY RULE ("4 edit styles in a row / 4 apart" — distance-4)

- **§1 is the FIXED opening hook** (`opening:…`) — the clickbait headline at frame 0 (`check_opening_headline.py` still enforces a real headline component). Everything AFTER §1 is free + content-driven.
- **No `edit_style` repeats within a window of 4** — style[i] must differ from style[i-1], [i-2] AND [i-3].
  Equivalently: any 4 consecutive beats are 4 DISTINCT styles; a style needs ≥3 other beats before it
  returns ("A X Y Z A"). This keeps every 4-beat window visually distinct → dynamic.
- **Richness:** a ≥6-beat video uses ≥4 distinct styles; a ≥10-beat video uses ≥5.
- **Adaptive / never-deadlock:** the effective distance is `min(4, pool)` where `pool` = distinct styles the
  plan draws from — a short video or a thin palette relaxes instead of failing impossibly (`verify_edit_plan.py`
  reports `Deff`). With the 8 free styles below, distance-4 is comfortably reachable on any real video.
- **NO-IMAGE-PROVIDER FALLBACK exception (QCR-200):** a hand-drawn fallback comp that uses zero asset styles
  (hero/split/full/flow) has a smaller palette → window relaxes to 3 and richness to ≥3 (as today).

---

## THE PALETTE — `EDIT_STYLE_IDS` (10 styles; tag each beat `style:concept`)

`status: solid` = proven across multiple QC≥75 shipped comps (freely selectable). `candidate` = code-complete
but not yet proven repeatable — usable, but a run that ships it logs the passing run+grade and flips it here.
**Never invent a style outside this list** (the planner picks from here; new styles are added only after a
real QC≥75 ship — same promotion discipline as STYLE_GALLERY candidate→active).

| edit_style | slot | status | component / idea | when_to_use (the phrase shape) | animation |
|---|---|---|---|---|---|
| `opening` | §1 FIXED | solid (every comp) | PremiumOpeningHook + PillHeadline + PremiumEvidence | ALWAYS beat 1 — the hook | black-pill headline springs in over a MOVING evidence screenshot (scroll default / zoom on a detail), avatar split below |
| `avatar` | breather | solid | FullFrameAvatar (in/out) | a plain narration beat, no object to show — let the avatar carry it | full-frame avatar, fast zoom-punch then hold; alternate direction in/out (QCR-081) |
| `phrase` | §3b caption | solid (15+) | PremiumKineticCaption (reveal / groups) | a punchy line to land word-by-word; distilled `groups` for a SHORT CTA | palette-bg, the spoken line reveals word-by-word (active word gold); ZERO burned sub (suppressed) |
| `avatarcap` | §5b | solid (10+) | PremiumAvatarCaption (zone top; bottom/side candidate) | keep the avatar on-screen but pop BIG words in the empty zone | full-frame avatar + Proxima words pop one-at-a-time in the free zone (top proven; bottom/side candidate) |
| `hero` | §4 | solid (30+) | HeroScene + PremiumAsset + PremiumLabel | the phrase NAMES one concrete object | serif label + ONE keyed asset center, slow parallax drift. **pool_depth 1** ⚠ (variety-debt: build an `asset-orbit-count` variant) |
| `split` | §5 | solid (12+) | PremiumSplitGraphics + PremRings | an explanation that pairs the avatar with a graphic | avatar below; gold rings self-draw, central asset drifts, 1–2 satellite icons pop in, no text. **pool_depth 1** ⚠ (variety-debt: `split-flow-nodes`) |
| `full` | §6 | solid (12+) | PremiumFullGraphics + PremRings | a SYSTEM / "connects everything" beat, no avatar | fullscreen rings self-draw, central drift, up to 3 satellites on radii, a node orbits, no text. **pool_depth 1** ⚠ (variety-debt: `full-flow-diagram`) |
| `evidence` | any | solid (11+) | PremiumEvidence (scroll / zoom / static) | the phrase points at a REAL named thing (repo/site/price/news) beyond §1 | a real screenshot card scrolls or zooms into the focus element, draw-on circle |
| `flow` | any | candidate | PremiumFlow (traveling gold pulse between nodes) | a PROCESS / sequence / "step by step" / "how it works" phrase | 2–3 nodes with a gold pulse traveling between them (proven as an element inside hero/full; not yet a standalone beat) |
| `stat` | any | candidate | IdeaStatBurst / count-up | a NUMBER / "10x" / "%" / big figure phrase | a number counts up with a push; scrub-safe (QCR-081). Proven as an element; promote as a standalone beat on a QC≥75 ship |

**Free styles (selectable after §1) = `avatar, phrase, avatarcap, hero, split, full, evidence, flow, stat`** —
8 solid + 2 candidate. Distance-4 is easily met. §1 `opening` is fixed and excluded from the free rotation.

---

## VARIETY DEBT — depth WITHIN a style (what the canary builds to stop recurrences looking identical)

Today `hero`/`split`/`full` each have **one** animation, so two `hero` beats (even 4+ apart, rule-satisfied)
look the same. Pay it down one variant at a time (build → QC≥75 ship → mark solid), same as a STYLE_GALLERY
promotion:
- `hero` depth-2: `asset-orbit-count` (asset + an orbiting count-up) vs the drift default.
- `split` depth-2: `split-flow-nodes` (traveling pulse between nodes) vs the rings default.
- `full` depth-2: `full-flow-diagram` (left→right process diagram) vs the radial-rings default.
- promote `flow` + `stat` from element to standalone-beat status; promote `avatarcap` bottom/side zones.

Until a variant is solid, the planner uses the style palette above (distance-4 across styles) — identical to
today's look (zero behavior change in shadow mode).

---

## CANARY VERDICT (QCR-292): distance-4-as-hard is DISPROVEN; the real win is animation depth

The canary ran the distance-4 rule against **6 real QC 75–100 comps** (grades 100, 97, 89, 75, ~90, 100) by extracting each one's as-built beat
sequence and gating it. Findings:

- **ALL 6 QC-passing videos FAIL a hard distance-4** → the rule is UNCORRELATED with QC; enforcing it would
  reject videos Gemini rewards. The promotion bar ("improve variety WITHOUT lowering QC") is NOT met.
- **70% of violations (14/20) are `hero` repeating with a DIFFERENT object each time** — the deliberate,
  QC-exempt pattern (assertSectionGrammar already exempts hero adjacency; object variety carries it).
  Forcing distance on `hero` would push object-naming phrases onto non-literal styles → **QCR-006 risk (harm)**.
- With `hero` exempt, **3/6 already PASS**; the rest cluster only on `split`/`full` — two §5 beats or two §6
  beats close together look alike because each has **only ONE animation** (rings-orbit-satellites / -radial).

**So the rule was refined to the evidence:**
- **HARD (enforced by `assertEditFlow` + `verify_edit_plan.py`):** §1 opening · no NON-hero style adjacent ·
  richness (≥4 / ≥5 distinct). All 6 QC-passing comps now PASS this.
- **ADVISORY (warn, never fail):** the wider "4-in-a-row" window on non-hero styles — a nudge that surfaces
  the real monotony (repeated split/full = repeated animation), pointing at the fix below.
- **`hero` is EXEMPT from the distance rule** (object-varied; its variety debt is animation depth).

## THE REAL VARIETY WIN — animation depth (the evidence-backed next step)

The genuine "improve variety without lowering QC" lever is NOT spreading edit styles — it is giving the
workhorse styles a SECOND vetted animation so legitimate recurrences stop looking identical. Build + QC-vet
**one variant per real production run** (candidate→solid, same as a STYLE_GALLERY promotion):

- **`full` depth-2 → `full-flow-diagram` — BUILT + VISUALLY VERIFIED (status: candidate).**
  Component **`PremiumFullFlow`** (`src/library/premium.tsx`, additive — `PremiumFullGraphics` untouched):
  a **TOP→BOTTOM vertical serpentine pipeline** — 3–4 keyed assets stacked down the tall frame (y≈360→1560)
  on an S-curve, threaded by a continuous gold rail (3.6px) with down-pointing chevrons in each gap and a
  downward traveling-pulse train, tall depth halo, ZERO text. Fills the 9:16 frame (the horizontal-flow first
  drafts left the bottom half empty — a horizontal flow fights the tall aspect; vertical fills it) and reads
  as a clear process, VISUALLY DISTINCT from the radial rings-orbit `PremiumFullGraphics`. Verified on 3
  render frames at the premium bar (slate-copper, on-brand, safe margins).
  **Reference/regression demo:** `FullFlowDemo` comp. **→ flips to `solid` on the first real run that ships
  a §6 with it at QC≥75.** Planner usage: when a video has ≥2 `full` beats, ALTERNATE
  `rings-orbit-radial` (`PremiumFullGraphics`) and `full-flow-diagram` (`PremiumFullFlow`) so they differ.
- **`split` depth-2 → `split-flow-nodes` — BUILT + VISUALLY VERIFIED (status: candidate).**
  Component **`PremiumSplitFlow`** (`src/library/premium.tsx`, additive — `PremiumSplitGraphics` untouched):
  same signature/wrapper as its sibling (`{w, avatarSrc, assets, cy=330}` inside `PremiumFrame`), renders a
  **HORIZONTAL left→right process flow** of 2–3 keyed assets in the top-40% panel (avatar shows bottom-60%),
  reusing the strong gold rail + chevrons + pulse train. A horizontal flow FITS the wide-short 1080×768 panel
  (the opposite of §6, where vertical was needed) — it worked FIRST try. Verified: graphics in the top panel,
  avatar fully visible below with ZERO spill, zero text, on-brand slate-copper, distinct from the rings-orbit
  default. **Reference/regression demo:** `SplitFlowDemo`. **→ `solid` on the first real run shipping a §5 with
  it at QC≥75.** Planner: when a video has ≥2 `split` beats, ALTERNATE `rings-orbit-satellites`
  (`PremiumSplitGraphics`) and `split-flow-nodes` (`PremiumSplitFlow`).
- `hero` depth-2: `asset-orbit-count` (asset + orbiting count-up) vs the drift default — NOT built yet.

Each is built ADDITIVELY as a `candidate` component, rendered + VISUALLY verified, and QC-checked on a real
run; on QC≥75 it flips to `solid` here and the planner may use it. This is what actually pays down the
monotony the canary measured.

## Rollout status

1. **Shadow (DONE for the rule-calibration pass):** `plan-edit-direction` emits `<Name>_edit_plan.json`;
   `verify_edit_plan.py` gates it (hard = proven rules; distance = advisory). Phase 5 still builds the current
   way. **Zero output risk. Nothing drives the build.**
2. **Authoritative (deferred — NOT the distance rule):** promote the animation-depth variants one at a time as
   they pass QC≥75 on real runs. The `assertEditFlow` hard rules (opening/adjacent/richness) may be wired as a
   render backstop for new comps once a comp adopts the plan; the distance stays advisory.
3. **Depth:** pay the variety debt above, one vetted variant per run.

**(When QC is enabled) Gemini QC stays the FINAL authority throughout. This registry never overrides a grade below `config.qc.threshold` (default 75).**
