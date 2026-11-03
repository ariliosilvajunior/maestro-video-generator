---
project: <Project Name>
slug: <project-slug>
route: <LIVE-ACTION | CINEMATIC-ACTION | MOTION>
scope: <project | scene NN of NN>   # see "One doc or several" below
format: <30-second ad | music video | short film | explainer | ...>
runtime: <seconds>
aspect: <2.39:1 | 16:9 | 9:16 | 1:1 | 4:5>
register: <photoreal | stylised>
light_state: <the one state, e.g. "overcast late afternoon, ~4pm" — leave empty on the MOTION route>
camera_mode: <M1 | M2 | M3 | M4 | M5 | n/a>
workflow_mode: <ref2video | text2video | mixed | n/a>
locked: <YYYY-MM-DD>
mode: <DEEP | QUICK>
version: 1
---

# <PROJECT NAME> — Intention

> <The one sentence. Who does what, where. No adjectives.>

---

## 1 · Intention

**What this is:** <format, runtime, where it plays>

**Who sees it:** <audience, in one line>

**What they do after:** <a verb. Buy, share, sit still, call someone.>

**The one shot that survives if everything else is cut:** <beat reference>

**This is not:**
- <anti-pattern 1>
- <anti-pattern 2>
- <anti-pattern 3>

---

## 2 · The event

**How it ends:** <the actual last frame or last line>

**The event, named backward from the ending:** <the one thing happening to
everyone, never spoken aloud>

**The shared direction:** <one line, played by all>

**The essential axis:** <the opposition the audience actually reads>

**The signature — true in every frame:** <the one thing. If a frame is missing
it, that frame failed.>

---

## 3 · The world

*(MOTION route: this section is `n/a` — a style family has a surface and a stage,
not a geography. Say so in one line and move to §4.)*

**Location:** <name>
- **Geography and era:** <real city, region, decade>
- **Architecture and materials:** <two sentences>
- **Signature element:** <the one thing that makes it recognisably itself>
- **Crowd density default:** <empty | sparse | busy>

**Light state (one, and only one):** <time of day and what is making the light>
- **Key source and motivation:** <the physical thing producing it>
- **Direction and height:** <where it comes from>
- **Fill:** <what bounces, or explicitly none>
- **Practicals:** <every in-frame source, its colour, its position>

**What is deliberately absent from this world:** <the excluded>

---

## 4 · The look

**Reference anchor:** <named look, or films with DP credits>

**What this look IS:**
- <five to six lines>

**What this look is NOT:**
- <five anti-patterns>

**Palette:**

| Role | Hex | Note |
|---|---|---|
| <dominant> | `#XXXXXX` | <one line> |
| <secondary> | `#XXXXXX` | |
| <accent — the only loud one> | `#XXXXXX` | |
| <shadow> | `#XXXXXX` | |
| <highlight> | `#XXXXXX` | |

**Banned colours:** <what must never appear>

**Camera stance:** <IN IT | WATCHING | n/a — product, or the MOTION route> —
<the one-line reason, from what the film is about>

**Camera:** <mode M1-M5> · <body> · <movement register>

**Lens character:** <family, default focal> — <why: what must stay in the frame
for the film to read. This is the justification for the focal range, and every
row of the table below sits inside the stance's range.>

| Shot type | Lens |
|---|---|
| Wide establishing | <focal> |
| Mid / dialogue | <focal> |
| Close-up | <focal> |
| Macro detail | <focal> |

**Capture medium and grade:** <one stock, one grade>

**Measurables:**
- White point: <K>, tint <offset>
- Contrast ratio: <n:1>
- Saturation: <0-1>
- Halation: <amplitude>, triggered by <what>
- Grain: <ASA>
- Skin IRE: <value> (R:G <n>, R:B <n>, or neutral)
- Black point: <IRE>

**Typography in frame:** <none — the default — or the exact string>

---

## 5 · The cast

*(MOTION route: `n/a`.)*

### <CHARACTER NAME>

- **Unrepeatable marker:** <the one physical thing>
- **Build and posture:** <no age words>
- **Face:** <geometry, hair, eyes, skin, facial hair, eyewear>
- **Costume, head to toe:** <every garment: what, fabric, colour, fit, layering,
  footwear, accessories>
- **Deliberately absent:** <no watch, no jacket, bare feet>
- **Baseline expression at rest:** <neutral, mouth closed, unsmiling — for any
  acting shot>
- **Role in the piece:** <one line>
- **Anti-patterns:** <what must never render>

*(repeat per character — two in frame at once is the comfortable limit)*

**Props and the hero object:** <what the camera must see clearly, and which beat
it gets>

**Costume changes:** <none, or beat and whether the change is seen>

---

## 6 · The performance

*(Skip on the MOTION route. On LIVE-ACTION, the tactic is often enough.)*

**Given circumstances:** <what is already true and cannot be undone>

### <CHARACTER NAME>

- **Motive:** <why this one pushes toward the event>
- **Goal:** <the personal fight — never the theme>
- **Obstacle:** <what presses against it, and what one crack costs>
- **Tactic:** <what they are doing to the other person, eye-work named as action>

*(repeat per character)*

**The eyeline ladder:**
1. <who looks where, beat by beat>

**Who never looks at camera:** <names>

**The break:** <where someone's fuel runs out — this is the delivery of the scene>

---

## 7 · The beats

| # | Beat | Shot size | Camera move | What happens | Priority | Edit out |
|---|---|---|---|---|---|---|
| 1 | <slug> | WS | <move, quality, ending> | <one primary action> | P1 | hard cut |
| 2 | | MS | | | P2 | |

**Shot-size ladder across the piece:** <wide → medium → medium close → close>

**The first frame:** <which beat, and why it works alone as a still>

**The last three seconds:** <where it lands>

**Cut budget:** <n> shots in <runtime>s

---

## 8 · Sound

**Ambience:** <what the place sounds like when nothing is happening>

**Banned from the ambience:** <what must never be in it>

**SFX:** <4-8 specific physical sounds — object and action, never adjective>

**Dialogue:**

| Beat | Speaker | Delivery intention | Line |
|---|---|---|---|
| 1 | <name> | <intention, not emotion> | "<verbatim>" |

**Language:** <one>
**Word count vs runtime:** <n words / <runtime>s = <n> wps — ceiling is 2.5>

**Voice identity:**
- **<name>:** <pitch, weight, texture, pace, accent, one habit>

**Score:** <none — the default — or the function it serves>

---

## 9 · Assets and constraints

**Reference plates:**

| # | What it is | What it is FOR | What it must NOT contribute |
|---|---|---|---|
| @Image1 | <face reference> | face and likeness ONLY | NOT wardrobe, NOT lighting, NOT background |
| @Image2 | | | |

Write the FOR and NOT clauses with the literal uppercase words `ONLY` and `NOT`
— the downstream linter checks for them, and the exclusion is the half that
actually does the work.

**Workflow mode:** <ref2video | text2video | mixed> — <why, and if mixed, which characters are which>

**Global negatives:** <what must never appear anywhere>

**Budget posture:** <full escalation ladder | straight to hero>

**Deliverables:**
- <master, cutdowns, aspect variants, stills>

---

## 10 · Locked tokens — paste-ready

*(Built from references/handoff-formats.md for this doc's route. Emit only the
sections the route needs. On the LIVE-ACTION and CINEMATIC-ACTION routes the
token files are written to disk beside this doc — list them here as a manifest
rather than repeating them in full.)*

| Token | File | Locks |
|---|---|---|
| `<CAST-TOKEN>` | `<slug>-tokens/cast/<CAST-TOKEN>.md` | identity, wardrobe, baseline expression |
| `<LOCATION-TOKEN>` | `<slug>-tokens/locations/<LOCATION-TOKEN>.md` | architecture, light state, signature element |
| `<STYLE-TOKEN>` | `<slug>-tokens/styles/<STYLE-TOKEN>.md` | camera, lens, stock, palette, grade |

**Camera mode:** <M1-M5> · **Workflow mode:** <mode> · **Aspect:** <aspect> ·
**Default lens:** <focal> · **Runtime per clip:** <seconds>

*(On the MOTION route, put the MOTION SHEET BRIEF and the COVERAGE PLAN here
instead — they are short enough to live inline.)*

---

## 11 · Next step

```
NEXT: /<skill> — "<the exact sentence to say to it>"
```

---

## Appendix · Assumed, not answered

Everything below was locked from a recommendation rather than an answer. Any one
of these can be overturned without re-running the session — say which, and only
the decisions downstream of it get re-asked.

| Node | Assumed value | Why this default |
|---|---|---|
| <L2 PALETTE> | <value> | <taken from the reference look> |

---

## Changelog

| Version | Date | What changed | Blast radius |
|---|---|---|---|
| 1 | <date> | Initial lock | — |

---

## One doc or several

The one-light-state rule means a single doc covers a single continuous world. A
30-second ad, a music-video section, an explainer — all one doc, `scope: project`.

Anything with multiple locations or multiple times of day splits, and the split
has a shape:

- **One project doc** (`scope: project`) carries §1 Intention, §2 The event,
  §4 The look, §5 The cast, §9 Assets, and §10 the shared tokens. These hold
  across every scene — the look and the cast do not change because the location
  did.
- **One scene doc per scene** (`scope: scene 03 of 09`), named
  `<slug>-s03-intention.md`, carrying §3 The world, §6 The performance,
  §7 The beats, §8 Sound, and a §10 that adds only the tokens unique to that
  scene. Its frontmatter repeats `project`, `slug`, `route` and `register`, and
  carries its own `light_state`.
- Beats number continuously across scenes (scene 3 might run beats 14-19) so the
  edit and the render folders agree.
- The project doc's §11 lists every scene doc and the order they cut in.

A fifteen-minute short is one project doc and eight to twenty scene docs. That is
not overhead — it is the same information a call sheet carries, and it is why the
sun does not move between cuts.
