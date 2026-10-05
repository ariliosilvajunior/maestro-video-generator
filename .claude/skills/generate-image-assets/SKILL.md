---
name: generate-image-assets
description: Phase-4 visual-sourcing sub-step. Generate topic-relevant 3D OBJECT renders per motion beat through YOUR image API (fal.ai, Google Gemini or OpenAI — chosen in config.json images.provider), key them to transparent PNG cutouts, and drop them into the motion graphic as animated HERO assets (PremiumAsset / PremiumImageIcon / IdeaHeroAsset). Use when a beat names a concrete object a 3D render depicts better than a line icon (a coin, robot, lock, megaphone, product). Triggers — "generate image assets", "generate greenscreen icons/images", "add 3D assets to the motion", "make hero cutouts".
---

# Skill: generate-image-assets (image provider → chroma-key → motion hero)

> Precondition: `config/config.json` has `setup.completed: true` and `images.provider` is one of
> `fal | google | openai` (run `/setup` otherwise). `images.provider: "none"` means this repo builds
> hand-drawn videos only — skip this skill and let the motion phase use the hand-drawn toolkit.

Real 3D objects, keyed clean, used as the hero of a motion beat. One script does the whole job:

```bash
python3 image-pipeline/generate_image_assets.py \
  --beats <scratch>/<Name>_beats.json \
  --out-dir motion-pipeline/remotion-agent/public/assets/<Name> \
  --manifest <scratch>/<Name>_assets_manifest.json \
  --palette <premium_palette from the creative brief>     # charcoal-gold | marble-gold | midnight-azure | ivory-emerald | bordeaux-rose | slate-copper
  # optional: --provider fal|google|openai   --model <id>   --seed-salt N   --width/--height   --no-key
```

The script: builds the premium greenscreen prompt for each beat (or a transparent-background
prompt for OpenAI `gpt-image-1`, which returns native alpha) → calls the provider → downloads the
raw PNG to `<scratch>/<beat>.png` → chroma-keys it (greenness key; border flood-fill fallback for
off-green backgrounds) → writes `<out-dir>/<beat>_cut.png` and a manifest with each beat's
`status` + keyed `foreground` %. **RESUME-SAFE:** a beat whose `_cut.png` exists is skipped, so a
failed batch is retried by re-running the same command. Exit codes: `0` all done · `3` provider
not configured / key missing · `4` key rejected (401/403) · `5` some beats failed (see manifest).

## WHEN
A beat NAMES a concrete object that a glossy 3D render sells better than a line icon — money
(coin), the AI (robot), privacy (padlock), an ad (megaphone), a product/logo-ish object, a
trophy, a rocket. For abstract/flow beats (a sequence, sameness, a loop), keep the hand-drawn
line-icon ideas. Mix both — hero cutouts for objects, line icons for concepts.

**ONE FRESH IMAGE PER MOTION BEAT — NO REUSE (HARD).** Generate a NEW, bespoke image for EACH
motion beat, depicting THAT beat's specific concept. Never reuse the same asset across two beats,
and never fall back to a generic icon library as the primary element — repeating assets is the
"every motion looks the same" defect. A video with N motion beats = N freshly generated images,
saved `public/assets/<Name>/<beatN>_<concept>_cut.png`. Vary the OBJECT and the composition per
beat so no two motion scenes look alike.

**LITERAL-DEPICTION RULE (HARD).** Generate the object that LITERALLY depicts the noun/action the
narration says AT THAT MOMENT — never an adjacent/figurative stand-in. "ele escreve o código" → a
terminal / code editor / code-on-screen, NOT a generic robot. "economiza 3 horas" → a clock/hourglass,
NOT money. "conecta tudo" → a hub with links, NOT a brain. Name the exact spoken noun first, then
prompt for THAT object. When reusing an existing keyed asset from a previous run, LOOK at what it
actually shows (its filename names the OBJECT, not a concept) and use it ONLY where that object is
the literal subject. Adjacent-but-wrong is the QCR-006/QCR-098 failure and is blocked at the motion
phase's LITERAL-IMAGE gate.

**PALETTE-MATCH ON REUSE (HARD, QCR-118).** A reused asset inside a `<PremiumTheme palette=X>` video
must match BOTH (a) the literal noun AND (b) the video's `premium_palette` material/colour family
(e.g. `charcoal-gold` = matte charcoal + warm gold / marble / brass). LOOK at the asset before
reusing — a bright glossy CARTOON object in off-palette colours is an off-palette DEFECT even when
the concept is right; generate a fresh on-palette asset instead (`--palette` does this for you).

**NETWORK BLIP ≠ FALLBACK — RETRY & RESUME PER ASSET (HARD, QCR-133).** A single transient
provider error mid-batch MUST NOT collapse the whole video to the hand-drawn fallback:
1. **Per-beat ledger — RESUME, never restart.** The script skips beats whose `_cut.png` exists.
   A mid-batch failure resumes at the first not-done beat — you never pay twice.
2. **Per-asset retry (≥3 attempts) before giving up on THAT beat.** Re-run the same command up to 3
   times; a 429 is retried by the script itself with backoff. One flaky request retries that asset —
   it does NOT abort the batch.
3. **Fall back to hand-drawn ONLY when the provider is GENUINELY unavailable** — exit `4` (key
   rejected) or exit `3` (not configured), or the SAME beat fails all 3 re-runs. Then fire
   `python3 post-pipeline/alert.py --platform images --run <Name> --reason "<why>"`, stamp
   `python3 maestro_state.py set --field images_fallback="<reason>" --field images_alert_sent=true`,
   and continue in hand-drawn. Never downgrade silently (`check_opening_headline.py` blocks that).
4. **Partial premium is allowed.** If 5-of-6 beats keyed and beat 6 is truly unrecoverable, ship the
   5 premium assets and make ONLY beat 6 hand-drawn — do NOT discard the good assets.

## PROCEDURE

1. **Write the beats file** — one entry per motion beat, LITERAL objects. `object` is the spoken noun
   rendered as a premium object; the script wraps it in the proven template for the chosen palette.
   Use `full_prompt` to override the whole prompt for a beat. Save to `<scratch>/<Name>_beats.json`.
   ```json
   [{"name":"beat1_robot","object":"a friendly robot mascot"},
    {"name":"beat3_terminal","object":"a floating terminal command-line window with glowing code"},
    {"name":"beat5_coin","full_prompt":"<your full prompt>"}]
   ```
   Prompt hygiene that matters on every provider:
   - **Counts are explicit.** "exactly five robots, no more and no fewer" — models drift on numbers.
   - **No text in the image:** add "NO numbers, NO letters, NO text" when the object could carry labels.
   - **Keep the object FLOATING + ISOLATED (QCR-190).** Never prompt the hero RESTING ON / INSPECTING a
     large planar surface (a document / page / desk / table) — the model paints THAT surface edge-to-edge
     and it won't key. If a surface is essential keep it SMALL ("a small document floating").
   - **Never a green/emerald body (QCR-161/176)** on the greenscreen path — it conflicts with the key.
   - **Dark palette → dark body is fine; light palette → SATURATED/DARK body (QCR-153)**: on
     `marble-gold` / `ivory-emerald` / `bordeaux-rose` a pale hero disappears against the cream bg —
     prompt deep emerald, antique gold, charcoal, bordeaux; never "cream/white/pale/pastel".
   - Timeout / odd result → re-submit SIMPLIFYING the prompt (drop the emblem, the extra props).

2. **Generate + key in ONE call** (command above). Read the printed manifest: every beat should be
   `status: "keyed"` with `foreground` roughly **8–35 %** (autocropped to the object). Provider notes:
   - **fal** (`images.fal_model`, default `fal-ai/nano-banana-pro`): queue API with polling; a `422`
     means the model's input schema differs — adjust `images.fal_extra` in config.json (e.g. flux models
     take `image_size`, nano-banana takes `aspect_ratio`). Deterministic seeds on flux-family models.
   - **google** (`images.google_model`, default `gemini-2.5-flash-image`): uses the Gemini key.
   - **openai** (`images.openai_model`, default `gpt-image-1`): with `images.openai_transparent: true`
     the PNG comes with native alpha — no keying, only an autocrop. `429 insufficient_quota` = add
     credits to the OpenAI organisation (that is a hard blocker of the provider, not of the pipeline —
     fall back per rule 3 above).

3. **LOOK at every keyed `_cut.png`** (Read tool) and apply the quality gates — the script keys, it
   does not judge:
   - right LITERAL object? clean key (no green halo / no box)? on-palette and high-contrast vs the
     `premium_palette` background?
   - `key-suspect` / `foreground ≥ ~92 %` = the background was NOT removed → re-key manually with
     tighter thresholds or regenerate:
     `python3 image-pipeline/chroma_key.py <scratch>/<beat>.png <out>/<beat>_cut.png --t-low 14 --t-high 30 --despill 0.7 --preview <scratch>/<beat>_prev.png`
     then LOOK at the preview (composited over magenta): reject any green halo / holes.
   - **QCR-126 — composite over the REAL palette background too** (not only magenta): a near-white /
     grey residue is invisible over magenta but shows as a BOX on cream — and a surviving sage
     rectangle shows over charcoal. `python3 -c "from PIL import Image; c=Image.open('<cut>').convert('RGBA'); b=Image.new('RGBA',c.size,(245,242,233,255)); b.alpha_composite(c); b.convert('RGB').save('<scratch>/<beat>_onbg.png')"`
     (use `(27,26,24)` for charcoal, `(23,22,26)` slate, `(15,22,34)` midnight). Reject any residual
     rectangle/halo or a LOW-CONTRAST hero, and regenerate with an explicit "ENTIRE background one solid
     flat pure chroma green #00FF00 edge to edge, no white/gray/studio backdrop, no floor, no shadow".
   - **QCR-152 — light-mint / white background** defeats the greenness key at any threshold: the
     script's border flood-fill fallback usually rescues it; if not, regenerate with the explicit
     pure-green instruction above.
   - Re-roll a bad beat by deleting its `_cut.png` and re-running with `--seed-salt N` or a sharper prompt.

4. **Use in the motion** (Phase 5): premium — `<PremiumAsset src="assets/<Name>/<beat>_cut.png" …/>`,
   `<PremiumImageIcon …/>`, `<PremiumSplitGraphics assets={[…]}/>`, `<PremiumFullGraphics assets={[…]}/>`;
   hand-drawn — `<IdeaHeroAsset full src="assets/<Name>/<beat>_cut.png" glow="rgba(...)" kicker="…"
   headline={[…]} />` (or omit kicker/headline for a text-free §6 beat). Give each object its OWN id in
   `assertSectionGrammar([...])` (`heroAsset:coin` ≠ `heroAsset:robot`); never put the SAME object
   back-to-back.

## DARK OBJECT ON DARK PALETTE — ADD A GLOW (HARD, QCR-123)
On a DARK `premium_palette` (`charcoal-gold`, `midnight-azure`, `slate-copper`) a keyed object whose
body is ALSO dark camouflages against the background — `PremiumAsset` only adds a dark drop-shadow,
which does not separate dark-on-dark. Apply BOTH:
1. **Place a warm radial GLOW behind every hero asset** — a `radial-gradient` div in the palette's
   accent colour, ~1.7× the asset size, `filter: blur(10px)`, rendered BEHIND the `PremiumAsset`.
   Add it to the hero scene and every split/full graphics scene.
2. **If an object is STILL too dark after the glow**, brighten the keyed PNG in place with PIL,
   preserving alpha: `ImageEnhance.Brightness(rgb).enhance(1.85)` + `.Contrast(1.12)` + `.Color(1.25)`
   on the RGB, re-merge with the original alpha. Verify by extracting a render frame and LOOKING.
A near-invisible hero is a quality defect even if QC hasn't flagged it.

## PREMIUM / CLASSIC STYLE — the DEFAULT look
- **Asset prompts** carry editorial descriptors ("matte / antique / brushed metal / marble /
  museum-quality / soft studio lighting / minimalist / muted luxe palette / fine detail / product
  render") — the palette template already does this; describe the OBJECT, not the style.
- **EVERY element is a generated image — including the ICONS.** Do NOT fall back to code-drawn
  `HD_ICONS` line icons in premium mode. Generate a cohesive icon set (doc · gear · hourglass · eye ·
  cursor · key …) once into `public/assets/icons/`, key them, and compose with `PremiumImageIcon` +
  `PremiumFlow` (image-icons joined by thin gold connectors — the premium `FlowDiagram` replacement).
- **Compose 2–5 ELEMENTS per scene** with hierarchy + depth (hero + depth element + vector accent +
  serif type). NEVER one big object alone — that's the low-effort tell.
- **GOTCHA:** the model sometimes ignores "green screen" and puts the object on a studio/grey backdrop
  → that won't key. Re-prompt with "the ENTIRE background is one solid flat pure chroma green
  (#00FF00), nothing else — no studio backdrop, no gray, no floor, no shadow" and regenerate. LOOK
  before keying.

## COST / NOTES
- Cost = your provider's per-image price (typically a few cents per beat). Real keyed still objects,
  animated in code — this is NOT AI-generated *video* (which stays out of the pipeline).
- Assets for the demos ship in `public/assets/sample/` (placeholder robot/coin/clock/lock) — never
  use them in a real video.
- Keys: `.claude/keys.md` (`## fal`, `## OpenAI`, `## Gemini`) or env `FAL_KEY` / `OPENAI_API_KEY` /
  `GEMINI_API_KEY`. `python3 bin/doctor.py --live` verifies them.
