# Handoff formats

The last sections of the intention doc are machine-facing. They exist so the next
skill needs no second conversation — the user pastes a block and starts working.

**Emit these in the shapes below, verbatim.** Paraphrasing a template is the same
failure as paraphrasing a token: it drifts. A field with no answer gets
`TBD — <what still has to be decided>`, never deletion.

Emit only the sections for the doc's route. A `LIVE-ACTION` doc carrying a
motion-builder sheet brief is noise.

## Contents

- [Route LIVE-ACTION → shot-builder](#route-live-action--shot-builder)
- [Route CINEMATIC-ACTION → shot-builder-cinematic-action](#route-cinematic-action--shot-builder-cinematic-action)
- [Route MOTION → motion-builder](#route-motion--motion-builder)
- [The router line](#the-router-line)
- [Vocabulary that must not cross the boundary](#vocabulary-that-must-not-cross-the-boundary)

---

## Route LIVE-ACTION → shot-builder

Three token types. Emit one `<CAST>` per character, one `<LOCATION>` per place,
and exactly one `<STYLE>` for the project. Each is a complete file the user can
save into shot-builder's workspace as-is.

**Where they go.** Each block below is a complete file. Write it to disk
alongside the intention doc, one file per token, named `<TOKEN>.md`, so the user
can move it straight into shot-builder's workspace:

```
<project-slug>-tokens/cast/<CAST-TOKEN>.md          → workspace/projects/<slug>/cast/
<project-slug>-tokens/locations/<LOCATION-TOKEN>.md → workspace/projects/<slug>/locations/
<project-slug>-tokens/styles/<STYLE-TOKEN>.md       → workspace/projects/<slug>/styles/
```

Strip the outer ```` ```markdown ```` fence when writing the file — it is a
wrapper for this reference, not part of the token. §10 of the doc then carries a
short manifest (token name, file path, one line on what it locks) rather than
repeating the whole file, and the router line points shot-builder at the folder.

**Per-file constraints — these differ by token type, do not apply them
across the board:**

- **Cast** — exactly one fenced code block in the file, `##` headings only, no
  `---` in the body, no `[[wikilinks]]`, reaction faces capped at five entries,
  total 60-80 lines. These are the strict ones.
- **Location** — several small fenced blocks are expected: one per shot variant,
  plus the 2x2 plate block. The plate block is not optional.
- **Style** — a horizontal rule in the body is fine, and the variants section
  uses `###` sub-headings.

### `<CAST>` token

````markdown
---
token: <CAST-TOKEN>
references:
  - "<what the face reference is, and that likeness replication is required>"
gotchas:
  - "<a specific failure mode, one short sentence>"
  - "<another — three to five total>"
---

# `<CAST-TOKEN>` — <short role description>

> <30-60 words. The signature feature, the wardrobe register, the scene context.>

## Prompt — 3-view turnaround sheet

```
Photorealistic character reference sheet for film production. Exactly 3 views of the SAME CHARACTER in a single image. No more, no less. This is the MASTER IDENTITY REFERENCE.

USE THE EXACT face from the attached <reference description>. LIKENESS REPLICATION, not inspiration. Replicate face shape, jawline, eye shape and colour, brow shape, skin tone, <signature 1>, and <signature 2> precisely. Do NOT idealize, smooth, or symmetrize the face.

CHARACTER: <120-180 words of continuous prose. Face geometry, hair, eyes, nose, mouth, skin texture, facial hair, eyewear, build, default posture. Real skin: visible pores, fine lines, natural imperfections, no airbrushing. No age words, no age numbers.>

ICONIC SIGNATURE — NON-NEGOTIABLE: <the features that must read in every shot, ending with a fail test: "If X, Y, or Z, the character has failed.">

BASELINE EXPRESSION across all 3 views: <what the face reads at rest — neutral, mouth closed, unsmiling for any acting shot.>

The same exact person must appear in all 3 views.

LAYOUT (STRICTLY 3 VIEWS ONLY):

LEFT — Full body FRONT view: standing straight facing camera, arms relaxed, head to toe, neutral pose, <outerwear>, <signature features visible>.

CENTER — Full body SIDE PROFILE: facing left, clean silhouette, head to toe, natural stance, <signature reading in profile>.

RIGHT — Tight close-up FRONTAL HEADSHOT: face filling the frame, eyes to camera, <baseline expression>. Shot on 85mm lens. Hyper-detailed skin: visible pores, fine natural lines, subsurface scattering. Sharp focus on eyes with soft catchlights.

Do NOT generate extra views. Exactly 3 views.

LIGHTING: Even, flat studio lighting across all views. No dramatic shadows. Soft key from front-left on the close-up.

COSTUME (identical across all 3 views, render fabric with photographic clarity — visible weave, stitching, material weight, creases): <every garment head to toe, with fabric, colour, fit, layering, footwear, accessories, eyewear. Name what is deliberately absent.>

ANTI-PATTERNS — DO NOT render: <comma-separated list.>

BACKGROUND: Simple flat neutral grey seamless. No gradients, no vignetting, no environmental elements.

FINISH: Photorealistic. No stylization. Raw natural photograph look. ARRI color science, subtle film grain, maximum resolution.

If the 3 views do not look like the same person, it has failed. The <signature 1> + <signature 2> + <signature 3> + <signature 4> combination is the signature.
```

## Reaction faces

| Beat | Token |
|---|---|
| <beat name> | <weight cue + micro-action + held beat> |

## Variants

- `<CAST-TOKEN-VARIANT>` — <one-line override delta>

## Related

- `<STYLE-TOKEN>`
- `<LOCATION-TOKEN>`
````

**The likeness anchor is conditional.** In `ref2video` it is load-bearing —
shot-builder requires it in every prompt where a reference is attached, and its
absence is the identity-drift failure both skills exist to prevent. In
`text2video` there is nothing to anchor to: delete that paragraph, and never
delete the CHARACTER description with it.

**Reaction faces carry pose and expression only** when reference images exist
(ref2video). When there is no reference (text2video), they must also carry the
signature features, because the text is the only lock. In `mixed` mode, write the
table in the ref2video shape and add a second table headed
`## Reaction faces — text2video variant` for the characters with no plate.

### `<LOCATION>` token

````markdown
---
token: <LOCATION-TOKEN>
type: location
created: YYYY-MM-DD
modified: YYYY-MM-DD
project: <project-slug>
base_image: null
references:
  - "<reference description>"
gotchas:
  - <failure mode plus the fix language>
---

# <LOCATION-TOKEN>

## World note

<150-250 words, one flowing paragraph in a director's voice. The geographic and
era anchor, the architecture in two sentences, the time-of-day choice and why,
the palette logic and what is deliberately excluded, the signature element that
must read in every shot, and the emotional role the place plays.>

## Scenes that use this token

| Scene / shot ID | Beat | Notes |
|---|---|---|
| <id> | <beat name> | <dressing specific to this scene> |

## Canonical description

> <150-250 words, one continuous blockquote paragraph, pure visual description:
> architecture, materials, set dressing, light source, atmospheric character,
> palette, crowd density. Prose, not bullets.>

## Reusable prompt token

```
<LOCATION-TOKEN> := <100-250 words, one continuous block: geographic descriptor, time of day with light direction, two or three architectural details, atmospheric character, palette logic with hex values, crowd density default, the signature continuity anchor, camera and lens character, then an explicit negatives line.>
```

## Shot variants

**`<LOCATION-TOKEN-VARIANT>`** — <scene and beat>:
```
<LOCATION-TOKEN>, <framing>, <crowd state>, <cast presence>, <shot-specific atmospheric note>
```

## 2x2 empty location plate — copy-ready

This block is required, not optional. It generates the pre-lit empty world that
every later shot in this location is composited against, so the light state stays
identical across cuts.

```
Generate a 2x2 grid of the SAME EMPTY <LOCATION> across 4 distinct camera angles. EMPTY environment — no people, no hands, no silhouettes, no characters of any kind. Location is pre-lit so that when <CAST-TOKEN> later stands at <specific position> they hit <the locked light setup>.

<Time of day spec, exact: sun elevation and relative direction, or the interior equivalent.>

<Interior practical lighting spec: which fixtures are ON, what colour, where they sit, how they relate to the key.>

<Atmospheric character: dust, haze, particles, weather, density.>

<Key light angle, non-negotiable, with an explicit fail test.>

CAMERA ANGLES:
- TOP LEFT — Wide establishing front view: eye-level, <lens>, <what fills the frame>
- TOP RIGHT — Low angle looking up: floor-level tilt-up, <lens>, <what is emphasised>
- BOTTOM LEFT — High angle looking down: elevated tilt-down, <what is emphasised>
- BOTTOM RIGHT — Macro detail close-up: <the signature element with the locked light hitting it>

CINEMATIC LOOK:
<Camera body + lenses + filter + finish, exact.>

<Grade spec with hex values.>

OUTPUT:
- Grid layout: 2x2
- Aspect: each panel <aspect>
- Borders: clean thin white panel borders
- Labeling: NONE — zero text, zero captions, zero watermarks
- Resolution: highest available native, sharp focus, balanced exposure

CONSISTENCY RULES:
- Same architecture across all 4 panels
- Same sun position and angle across all 4 panels — the sun does not move between frames
- Same practicals ON in all 4 panels at the same intensity
- Same grade, white balance, halation, saturation and lifted blacks across all 4 panels
- EMPTY environment — NO people on any panel
- <Signature element> visible in every panel where relevant
- Distinct visual variety between angles

REFERENCE (NON-NEGOTIABLE):
The attached <LOCATION> reference image MUST be the architectural source. Replicate <specific architectural elements>. Do NOT invent a generic version. Do NOT redesign the signage, logo, or signature element. The location must be instantly recognisable.
```

## Signature elements (non-negotiable)

- <element — if it is missing, the location has failed>

## Anti-patterns

- <what must never render here>

## Visual references

- <path or description of any plate already shot or generated>

## Related tokens

- `<STYLE-TOKEN>`
- `<CAST-TOKEN>`
- `<OTHER-LOCATION-TOKEN>`
````

### `<STYLE>` token

A style token is **measurable**. Hex values, Kelvin, contrast ratio, saturation
on a 0-1 scale, halation and grain amplitudes. Without measurements it is a
moodboard and shot-builder will treat it as one. Take the numbers from the
look-library entry.

````markdown
---
token: <STYLE-TOKEN>
type: style
created: YYYY-MM-DD
modified: YYYY-MM-DD
project: <project-slug>
base_image: null
references:
  - "<reference film + DP>"
  - "<reference commercial>"
default_palette:
  - "#HEX"
  - "#HEX"
  - "#HEX"
  - "#HEX"
  - "#HEX"
gotchas:
  - <failure mode plus the fix>
---

# <STYLE-TOKEN>

## What this look IS

- **<adjective>** — <one line>
- <five to six of these, ending with the aspect and finish standard>

## What this look is NOT

- <five anti-patterns, from the S7 answers>

## Reference films + commercials

- **<film>** — <DP> — <what to take from it>

## THE LOOK SPEC — paste verbatim into every prompt

```
LOOK: <one continuous paragraph, 150-300 words, in this order — all eighteen elements, none skipped: 1 split-tone hexes; 2 the project palette as 5-8 named hex colours with descriptors; 3 saturation register on a 0-1 scale, stating what it is and what it does not do; 4 allowed and banned colour behaviours; 5 white point in Kelvin plus tint offset; 6 contrast ratio; 7 histogram skew; 8 camera body; 9 the literal placeholder "[LENS PER SHOT — see lens table below]"; 10 film stock LUT; 11 halation amplitude and what triggers it; 12 grain amplitude, with the ASA equivalent; 13 vignette amplitude; 14 atmospheric haze amplitude; 15 skin IRE with its R:G and R:B ratios; 16 aspect ratio and finish standard; 17 the reference films inline; 18 the negatives line, which always ends the spec.>
```

**On element 16.** Aspect ratio is banned from prompt bodies everywhere else in
this skill, and that ban stands. The LOOK spec is the single sanctioned
exception, because shot-builder's own style-token template requires it there.
Nowhere else.

## Lens table — pick per shot

| Shot type | Lens |
|---|---|
| Ultra-wide hero | <focal + family> |
| Standard wide tracking | <focal + family> |
| Normal / mid-shot eye-level | <focal + family> |
| Medium close-up portrait | <focal + family> |
| Tight portrait close-up | <focal + family> |
| Macro extreme close-up | <focal + family> |

Every row sits inside the stance's range — 21-35mm for `in-it`, 40-100mm for
`watching`. A close-up row filled in at 85mm on an `in-it` project silently
reverses the stance, which is the most common way this table goes wrong.

## Quick swap instructions

<How to move this look to a different project: which lines change (palette hexes,
the regional anchor, the reference films) and which must not (the light rule, the
lens family, the contrast ratio — those are what make it read as this look).>

## Variants

### `<STYLE-TOKEN-NIGHT>`
Override deltas only: white point → <K> · halation → <amplitude> · skin IRE →
<value> · palette → <hex shifts>

## Anti-patterns

## Related tokens
````

### The mode declaration

Alongside the tokens, state the camera mode plainly so shot-builder does not have
to infer it:

```
CAMERA MODE: M1 — Narrative (real-world, lived-in)
CAMERA STANCE: in-it — the camera is another body in the scene
WORKFLOW MODE: ref2video
ASPECT: 2.39:1 stills · 16:9 video
DEFAULT LENS: 28mm
RUNTIME PER CLIP: 8s
```

Modes: **M1** narrative real-world · **M2** studio/editorial · **M3**
action/combat · **M4** performance/concert · **M5** atmospheric/empty.

---

## Route CINEMATIC-ACTION → shot-builder-cinematic-action

Emit a scene file. The ten CONTEXT-tier keys, a continuity ledger, a beat
skeleton, and the acting-task blocks.

Keys are ALL CAPS at the head of the line; values are lower-case prose. Only
`SCENE CONTEXT` is allowed to be a paragraph. Never invent a key — there are
twenty-seven and no more.

````markdown
# <scene name>
model:  <seedance tier> · <duration>s · <resolution> · <aspect>
pool:   @Image1 <what it is> · @Image2 <what it is> · @Video1 <what it is>
preset: <CINEMATIC | ACTION | MOTION GRAPHICS | COMMERCIAL | STYLISED>

## CONTEXT
SCENE CONTEXT: <3-5 sentences. Where, who, what kind of thing. Say what kind of scene it is, not what it means. Consequence over adjective.>
FORMAT MODE: <duration, aspect, 24fps, cut budget — one line, no prose. The cut budget must equal the beat count.>
ACTIVE REFERENCES: <one line per reference, never combined. Each line needs the literal uppercase word ONLY or NOT — the downstream linter checks for it. Worked: "@Image1 barista portrait — face and likeness ONLY. NOT wardrobe, NOT lighting, NOT background." Omit this key entirely in text2video.>
LOCATION MAP: <what is where, in screen terms not coordinates, with the distances that matter and the physical position of every light.>
CAST: <who is in it, and the one unrepeatable marker for each. Names, never pronouns. Two is the comfortable limit.>
STAGING: <where everyone stands and how they move relative to camera. The axis line lives here. Count every exception.>
WARDROBE: <what everyone wears, and what must not change. Name what is deliberately absent.>
GAZE AND EYELINES: <the ladder, beat by beat. Say who never looks at camera.>
EVENT AND SHARED DIRECTION
THE EVENT, containing everyone and never spoken aloud: <named from the ending>
The terrain is <the physical action>, and each pursues the event through a different physical channel: <A> through <channel>, <B> through <channel>.
THE SHARED DIRECTION, played by all: <one line>
THE ESSENTIAL AXIS: <the opposition the audience actually reads>

ACTING TASK — <NAME> (fully invested in the tactic; the work happens in the eyes)
MOTIVE: <why THIS one pushes the shared direction>
GOAL: <the personal fight — never the same words as the scene goal>
OBSTACLE: <what presses against the line, and what one crack costs>
TACTIC: <what is done to the partner, with the eye-work named as the action>
Moment to moment:
— {<the words>} — <verb at the partner + what the eyes check>
— {<the words>} — <verb + eye-work>
— <where the line breaks, if it breaks>

<one ACTING TASK block per character>

MICRO-BEHAVIOUR
Natural blink cadence on every face throughout, at rest and while speaking, increasing as the pressure rises. Every gaze stays engaged in the task and focused on something specific. Eyes wet and alive with a real catchlight from <the named source in LIGHTING>. Visible breath in the chest. A micro-pause of about a quarter second before any reaction. Expressions asymmetric, one brow and one side of the mouth.

RULES: <4-6 do-not-break clauses. One light state.>

## LEDGER
| Holds across | Value |
|---|---|
| wardrobe | <the full list, once> |
| markers | <the unrepeatable features> |
| light state | <the one state> |
| camera side | <which side of the axis> |

## BEATS
BEAT 1 — <slug>
OPEN: <who · which screen side · which depth · already in motion. Nobody starts still.>
CAMERA: <one move: the move, its quality, its ending. A locked camera must be stated as locked.>
LENS: <shot size · focal family · focus behaviour. Say what the frame must not open to.>
ACTION: <clauses joined by arrows. One primary action per clause. End on a held state.>
PERFORMANCE: wants — <playable, physical, achievable in this beat>
             blocked by — <what stands in the way, present in the frame>
             plays — <visible behaviour: eyes, breath, hands, jaw, tempo>
             turns on — <the one moment the performance changes gear>
DIALOGUE: {<speaker> · <delivery intention, never an emotion> · "<the line>"}
SFX: <one event per angle-bracket pair, in the order they happen>
EDIT: <hard cut | morph | dissolve | hold>

## PROMPT SEGMENTS
PHYSICS: <name the object, its mass, its behaviour, and the recovery.>
LIGHTING: <every source named and placed: where it comes from, what motivates it, what it does to the face. Colour arrives from the source, not the grade. Must motivate the catchlight.>
AUDIO: <the standing ambience, and what is banned from it. State silence explicitly.>
SCORE: <none, or the function it serves — never a genre.>
STYLE: <capture format, optics, grain, grade, palette as a three-value split summing to 100. Two or three optical textures, maximum.>
VOICE: <per speaker: 4-6 attributes — pitch, weight, texture, pace, accent, one habit. Anchor the language.>
POSITIVE LOCKS: <4-6 clauses written as assertions. Only restate what a render actually dropped — a doc written before any render has nothing here and should say so.>
````

### Notes on the acting blocks

The whole apparatus — `EVENT AND SHARED DIRECTION`, one `ACTING TASK` per
character, `MICRO-BEHAVIOUR` — sits inside the CONTEXT tier, between
`GAZE AND EYELINES` and `RULES`, above the first beat. It is inlined in the
template above rather than pointed at from elsewhere, because a pointer is the
`see previous` failure under another name.

When these blocks are present, **drop the per-beat `PERFORMANCE` block** — they
replace it. `PERFORMANCE` is for iterating; `ACTING TASK` is for finishing.

One thing to warn the user about: `seedance.py lint` flags
`THE ESSENTIAL AXIS`, `MOTIVE`, `GOAL`, `OBSTACLE` and `TACTIC` as unknown block
keys, because its parser reads any line-leading capitals-plus-colon as a block
name. Those five lines are canonical per the acting-task reference and should be
left alone. Say so once when handing the scene over, so nobody deletes them
trying to get a clean lint.

Presets and their block counts, so the doc can declare one: **CINEMATIC** 15
blocks (direction and acting) · **ACTION** 14 (weight, contact, consequence) ·
**MOTION GRAPHICS** 12 (type and flat colour) · **COMMERCIAL** 14 (product and
surface) · **STYLISED** 13 · **EVERYTHING** 27.

`STYLE LOCK` and `POSITIVE LOCKS` are near-mutually-exclusive — loading both
means the register was never decided.

---

## Route MOTION → motion-builder

Emit a sheet brief, not a sheet. It carries every answer motion-builder's
seven-question interview would have asked, so the skill can go straight to
building the style reference.

```markdown
## MOTION SHEET BRIEF

FAMILY: <exactly one slug>
SURFACE: <what the world is made of — paper, void, glass, print, stage set>
PALETTE: <hex list, plus semantic rules: which colour means what>
TYPE VOICE: <shouty grotesk | editorial serif-mono mix | clean UI | other>
LOGO: <attach and never redraw: path or brand name · or: none>
STAGE: <locked — one persistent background world across every clip · or free>
ENERGY: <calm-premium ... punchy-kinetic, on that axis>
ASPECT: <the delivery aspect — the sheet must be rendered at it>
CLIP DURATION: <seconds>
AUDIO POSTURE: sound design only, no music, no voice-over  <or the flagged exception>
REFERENCE IMAGE EXISTS: <yes, path — motion-builder route A · or no — route B>
SCRIPT STATE: <recorded VO at path — timing final · draft script, no audio — timing draft · nothing yet — run story-beats first>
```

The eleven family slugs: `paper-editorial` · `vox-collage` · `zine-collage` ·
`ink-sport-vector` · `paint-over-photo` · `type-punch` · `flat-duotone` ·
`glass-dark` · `blueprint` · `terminal-neon` · `soft-3d`. One per sheet, always.

Also emit the coverage plan, because motion-builder needs a decision for every
second of the timeline:

```markdown
## COVERAGE PLAN

| Segment | Time | What the VO covers | Plan | Priority |
|---|---|---|---|---|
| <name> | 00:00-00:41 | <gist> | generated / talking head / screen rec / v2v / reuse | P1 |
```

Priorities: **P1** the edit cannot ship without it (keep under a quarter of the
total) · **P2** support · **P3** texture and loops. Target mix: 35-45% talking
head and screen recording, 35-45% generated, 10-20% loops and reuse.

If exact on-screen text, charts, counters, maps, or reusable presets matter,
route to `remotion-builder` instead and say so — the same brief works, but the
style locks into code rather than a reference image.

---

## The router line

The last line of the doc, and the last line of the reply. Name the skill, where
the token files are, and the sentence to say:

```
NEXT: copy `kape-morning-tokens/` into shot-builder's workspace
(cast/, locations/, styles/), then run /shot-builder and say
"project kape-morning, tokens are already locked — build the 3-view
turnaround for <BARISTA>"
```

The point of emitting the token files is that shot-builder reads them rather than
re-deriving them from prose. A router line that says "lock the tokens from the
intention doc" throws that away and invites drift on the second pass.

If a script is still missing, the next skill is `story-beats`, not a builder.
Say that plainly rather than handing off a doc with no words in it.

---

## Vocabulary that must not cross the boundary

These corrupt the downstream skills. The linter checks for them; check yourself
before you write.

| Never emit | Because |
|---|---|
| Age words or numbers | shot-builder bans them outright — describe by build, posture and wardrobe register |
| Emotion adjectives as direction | The model cannot render biography. Emit the task, not the feeling. |
| Facial choreography | "Brows lift" is playing the result, and it produces dead faces. |
| Character biography or personality labels | Stripped downstream. Emit motive, goal, obstacle, tactic. |
| Real people's names, real brand names in prompt bodies | Role descriptors and generic nouns. Logos get attached as files, never described. |
| Aspect ratio inside a prompt body | Aspect is an API parameter and a `FORMAT MODE` line. The single exception is element 16 of the style token's LOOK SPEC, where shot-builder requires it. |
| Timecodes inside beats | Arrows, not timecodes — unless syncing to supplied audio. |
| `as above`, `see previous` | Restate in full, every time. |
| Hex codes or font names in a motion action block | They live in the sheet and the style lock only. |
| Meta-commentary about how it reads or feels | Stripped. Say what is in the frame. |
| An invented block name | Twenty-seven exist. A new key is silently ignored. |
