# The question tree

Every decision node, what it depends on, the question to ask, and the default to
recommend. **Layers are the typical shape of the frontier, not a script** — a
user who opens with "a 30-second coffee ad, warm, like the Nespresso ones, ends
on the logo" has already settled half of Layer 1 and 2, and those nodes must not
be asked again. Recompute the frontier from what is actually settled.

## Contents

- [How to read a node](#how-to-read-a-node)
- [Layer 1 — The spine](#layer-1--the-spine) (no prerequisites)
- [Layer 2 — The event](#layer-2--the-event)
- [Layer 3 — The world](#layer-3--the-world)
- [Layer 4 — The look](#layer-4--the-look)
- [Layer 5 — The bodies](#layer-5--the-bodies)
- [Layer 6 — The performance](#layer-6--the-performance)
- [Layer 7 — The beats](#layer-7--the-beats)
- [Layer 8 — Sound](#layer-8--sound)
- [Layer 9 — Assets, constraints, delivery](#layer-9--assets-constraints-delivery)
- [The craft pass — offered once, mostly skipped](#the-craft-pass--offered-once-mostly-skipped)
- [Route-specific subtrees](#route-specific-subtrees)
- [QUICK mode: the fifteen that survive](#quick-mode-the-fifteen-that-survive)

---

## How to read a node

```
N1 · <node name>                    ← what gets locked
   needs: <prerequisite nodes>      ← do not ask before these are settled
   ask:   <the question, in the user's language>
   recs:  <the default, and what it costs>
   feeds: <what this unblocks downstream>
   skill: <which downstream skill consumes it>
```

`needs: —` means the node is on the opening frontier.

**Card shape.** Ask with `AskUserQuestion` where it exists. Most nodes are
already a choice between named alternatives — the `recs:` line is the first
option, labelled `(Recommended)`, and its cost becomes that option's
description. A handful have no natural option list and need three *proposed*
answers instead of a blank field:

| Node | What the three options are |
|---|---|
| S4 THE ONE SENTENCE | Three reconstructions of their idea, in one sentence each |
| E1 THE ENDING | Three candidate last frames for the sentence in S4 |
| E2 THE EVENT · E3 THE AXIS | One proposal each, plus "that is not it" |
| E4 THE SIGNATURE | Three candidates drawn from what is already locked |
| W3 LOCATION | Three specific versions of the vague place they named |
| C2 UNREPEATABLE MARKER | Three markers that suit the role |
| C3 COSTUME | Three wardrobe registers, then build the garment list from the pick |
| P2-P5 MOTIVE, GOAL, OBSTACLE, TACTIC | One proposal each; they correct it |
| B1 THE BEAT LIST | Not a card — show the table and ask for corrections |

Nodes that are genuinely additive — S7 WHAT IT IS NOT, D1 GLOBAL NEGATIVES,
D3 DELIVERABLES, R1 REFERENCE PLATES — take `multiSelect: true`.

Nodes marked *"do not ask — derive"* (L3, L5, L6, and every `(Propose.)` in
Layer 7) never become cards. Confirm them in a line of prose instead; turning a
derivation into a question is how a seven-question job becomes thirty.

---

## Layer 1 — The spine

Everything here is askable in round one. Most of it is already implied by
whatever the user said to trigger the skill — infer aggressively and confirm in
one line rather than asking cold.

```
S1 · FORMAT
   needs: —
   ask:   What kind of thing is this? Ad, music video, short film, doc piece,
          social vertical, explainer, trailer, product film, event film.
   recs:  Read it off what they said. Confirm, do not ask.
   feeds: S2, S3, everything in format-archetypes.md
   skill: all

S2 · RUNTIME
   needs: S1
   ask:   How long, in seconds? And is that a hard number (ad slot, platform
          cap) or a target?
   recs:  The archetype default. Never assume — shot-builder's rule is "always
          ask the user for runtime."  Costs: runtime sets the beat budget, and
          a beat budget cannot be renegotiated later without a re-grill.
   feeds: B1 (beat count), M1 (model choice), everything in Layer 7
   skill: all

S3 · ASPECT + PLATFORM
   needs: S1
   ask:   Where does this play? Cinema/16:9 web, phone-vertical, square feed,
          2.39:1 letterbox for a festival cut.
   recs:  Archetype default. Costs: aspect is decided once — a 9:16 project
          needs a 9:16 style reference, and reframing later re-renders
          everything.
   feeds: L1, and the FORMAT MODE block
   skill: all

S4 · THE ONE SENTENCE
   needs: —
   ask:   In one sentence: who does what, where. No adjectives. If you cannot
          say it in one sentence, we do not have a film yet — we have a mood.
   recs:  Offer them your best reconstruction from what they have said and let
          them correct it. Correcting is far easier than composing.
   feeds: E1, W1, C1
   skill: all

S5 · AUDIENCE + THE AFTER
   needs: S4
   ask:   Who sees this, and what do they DO after — not what they feel. Buy,
          share, sit still, call someone, click, remember it next week.
   recs:  Push back on "feel inspired." A verb, or it is not an answer.
   feeds: E1, L2, and the "what it is NOT" list
   skill: none directly — it is the tiebreaker for every later argument

S6 · EXISTING MATERIAL
   needs: —
   ask:   (Do not ask if you can look.) Is there a script, a reference image, a
          moodboard, footage already shot, a transcript, a location you already
          have?
   recs:  Ask only for what you cannot find yourself.
   feeds: R1, and collapses L1 entirely if a reference image exists
   skill: all — a reference image switches motion-builder to route A and
          shot-builder to ref2video

S8 · SCRIPT STATE
   needs: S1, S6
   ask:   Is there a script or a voice-over yet — finished, drafted, or nothing?
   recs:  Ask on anything that will carry narration or dialogue: brand film,
          doc interview, testimonial, short film. Skip it on a product loop or
          a social cut. Costs: with no script, the beats in this doc are
          provisional, and the next skill is story-beats rather than a builder.
          Say that out loud rather than building an edit rhythm the words will
          later have to break.
   feeds: B1 (beats are provisional without it), the router line
   skill: story-beats, then all
   note:  The MOTION route uses MG7 instead; do not run both.

S7 · WHAT IT IS NOT
   needs: S1, S4
   ask:   Name three things this must never look like. Beginners find this far
          easier than describing what it should look like — and downstream
          skills use it verbatim.
   recs:  Seed with two obvious ones from the format and let them add.
   feeds: the anti-patterns list in the style token, the negative baseline
   skill: shot-builder (style token §What this look is NOT), all
```

---

## Layer 2 — The event

The highest-value layer, and the one no beginner is ever asked about. Every
performance decision downstream reads backward from **E1**.

```
E1 · THE ENDING
   needs: S4
   ask:   How does it end? The last shot, the last line, the last thing the
          viewer sees. Not the resolution of the plot — the actual last frame.
   recs:  If they do not know, offer three endings for the sentence in S4 and
          have them pick. An ending they reject teaches you as much as one they
          take.
   feeds: E2, E3, P1-P5, B1
   skill: shot-builder-cinematic-action (EVENT AND SHARED DIRECTION is named
          backward from the ending)

E2 · THE EVENT
   needs: E1, C1
   ask:   (Usually you propose, they confirm.) Naming it from the ending: the
          one thing that is happening to everyone in this, that nobody says out
          loud. Every character must be inside it, including the silent ones.
   recs:  Propose one. If any character stands outside it, it is named wrong —
          say so and re-name it.
   feeds: P1-P5, the shared direction
   skill: shot-builder-cinematic-action

E3 · THE ESSENTIAL AXIS
   needs: E2
   ask:   What is the opposition the audience actually reads? Not the theme —
          the tension between two forces they can see.
   recs:  Derive from E2 and confirm. Costs: an unnamed axis produces coverage
          with no shape.
   feeds: P5, B2 (the shot-size ladder tracks the axis)
   skill: shot-builder-cinematic-action

E4 · THE SIGNATURE
   needs: S4, S7
   ask:   What must be true in EVERY frame? One thing. If a frame is missing
          it, that frame failed.
   recs:  Usually one of: a colour, a light quality, a piece of wardrobe, an
          object, a framing habit. Costs: nothing — this is the cheapest
          continuity insurance there is.
   feeds: the style token, every location's signature element, the linter
   skill: shot-builder, motion-builder

E5 · THE ONE SHOT
   needs: E1
   ask:   If the whole thing were cut to a single shot, which one survives?
   recs:  Whatever they answer becomes the hero beat and gets the render
          budget. Costs: nothing. Gains: an edit with a spine.
   feeds: B1 (that beat is P1), the escalation ladder in Layer 9
   skill: all
```

---

## Layer 3 — The world

```
W1 · REGISTER — photoreal or stylised
   needs: S1, Route
   ask:   Should this look like it was photographed, or like it was made?
   recs:  Photoreal for anything with a human face in it that has to be
          believed. Costs: the two registers use mutually exclusive lock
          systems downstream — deciding late means rewriting the look.
   feeds: L1, and POSITIVE LOCKS vs STYLE LOCK
   skill: shot-builder-cinematic-action (loading both locks means the register
          was never decided)

W2 · SCENE TYPE → CAMERA MODE
   needs: S4, W1
   ask:   Which of these is the world: a real lived-in place / a studio or void
          / combat-chase-stunt / a stage with a crowd / an environment with no
          people in it.
   recs:  Map straight to M1-M5. Real lived-in = M1. Studio/editorial = M2.
          Action = M3. Performance = M4. No humans = M5.
   feeds: L3, L4, L5 — the mode carries body, lens family, movement, filter and
          grade as a package
   skill: shot-builder (camera-grammar M1-M5)

W3 · LOCATION — geography and era
   needs: S4
   ask:   Where, specifically? A real city, a real kind of room, a real era.
          "A kitchen" is not a location; "a narrow 1970s Manila kitchen with
          jalousie windows" is.
   recs:  Push for a real anchor even on a fictional world — models render
          "generic" as mush. Costs: none. This is the single biggest quality
          lever in an image prompt.
   feeds: W4, W5, the location token
   skill: shot-builder (location token)

W4 · LIGHT STATE — one, and only one
   needs: W3
   ask:   What time is it, and what is making the light? Not "moody" — a
          window, a bulb, the sun at what height, a screen, a fire.
   recs:  Pick the one the story needs and refuse the second. Costs: two light
          states in one doc is two docs — the sun cannot move between cuts.
   feeds: L2, L4, B3, the 2x2 location plate, every LIGHTING block
   skill: shot-builder, shot-builder-cinematic-action

W5 · SIGNATURE ELEMENT of the location
   needs: W3
   ask:   What one thing makes this place recognisably itself across every
          shot? A sign, a window shape, a stain, a machine, a view.
   recs:  Propose from their description. Costs: nothing; without it the model
          rebuilds the room every shot.
   feeds: the location token's non-negotiables
   skill: shot-builder

W6 · CROWD / DENSITY DEFAULT
   needs: W3
   ask:   Empty, sparse, or busy — by default?
   recs:  Empty unless the crowd is the point. A crowd is a condition, not a
          cast.
   feeds: the location token, staging
   skill: shot-builder
```

---

## Layer 4 — The look

Run [vague-to-spec.md](vague-to-spec.md) before this layer if the user has used
any adjective from it. Offer looks from [look-library.md](look-library.md) rather
than asking for specifications — and lead with CS1, because the stance decides
the lens and the movement, which turns two questions into confirmations.

```
CS1 · CAMERA STANCE
   needs: S4, W1
   ask:   Should the camera be in it with them, or watching them from a step
          back? In it = another body in the scene, close and mobile. Watching =
          holds its distance and lets you see them in their situation.
   recs:  Derive it, do not poll it — the derivation list is in
          camera-stance.md Part 1 and is the only correct copy. Read it before
          recommending; the short version is that physical contact pulls the
          camera IN, and social measurement pushes it BACK. Confirm in one line.
          Costs: named per stance in camera-stance.md. Both stances are correct;
          the difference from a palette decision is that a palette can be argued
          about in the grade, and a stance shows up in every shot.
   feeds: L3 (the lens is a consequence of this, not a preference), L5, B2, and
          what the frame's width is FOR — scale or social space
   skill: shot-builder, shot-builder-cinematic-action
   more:  camera-stance.md Part 1. Skip Parts 2-4 unless the craft pass is on.

L1 · REFERENCE ANCHOR
   needs: W1, S1
   ask:   Name a film, ad, or video whose FRAMES you want — not its story. If
          nothing comes to mind, pick from three named looks I will describe.
   recs:  Three from look-library.md that fit the format and register, each with
          one plain-English line on what it does to the frame. Costs: stated per
          look in the library.
   feeds: L2-L6, the whole style token
   skill: shot-builder (style token §Reference films + commercials, with DPs)

L2 · PALETTE
   needs: L1, W4
   ask:   Warm, cool, or neutral — and which two or three colours are allowed
          to be loud?
   recs:  Take the library look's palette. Costs: unstated palettes come back
          different every render. Emit as hex, plus a three-value split summing
          to 100 for the cinematic-action route.
   feeds: the style token, STYLE block, the grade
   skill: all

L3 · LENS CHARACTER
   needs: CS1, W2, L1
   ask:   Do not ask. Derive it and confirm in one line. CS1 already decided
          the range: "in it" means 21-35mm used close, so the environment stays
          in frame with the face; "watching" means 40-100mm at social distance.
          Every row of the lens table must sit inside that range.
          Only on WATCHING is there anything left to ask — flattered or plain?
          Flattered = 85mm with diffusion; plain = 40-50mm, no filter.
   recs:  Faces plain by default. Do not fall back to the mode default (55mm)
          on an IN IT project — 55mm sits outside its range, and reaching for
          it silently undoes the stance. Costs: a wide lens close to a face is
          not neutral — it claims the viewer should be inside this person. On a
          story about not belonging, it accidentally makes them heroic.
   feeds: the lens table, the LENS block per beat
   skill: shot-builder, shot-builder-cinematic-action

L4 · CAPTURE MEDIUM + GRADE
   needs: L1, W1
   ask:   (Usually do not ask — take it from L1.) Confirm the stock and the
          contrast in plain terms: "grainy and warm like 250D" vs "clean and
          cool."
   recs:  One stock only. Mixing two film stocks in one look is a named failure.
          Costs: the stock decides how the blacks behave, permanently.
   feeds: the LOOK SPEC's measurable block
   skill: shot-builder (style token)

L5 · CAMERA MOVEMENT REGISTER
   needs: CS1, W2
   ask:   Confirm rather than ask: "in it" wants handheld that follows and is
          occasionally fractionally late; "watching" wants locked, or slow and
          level. Ask only whether there are exceptions.
   recs:  Mode default within the stance. Costs: mixing stabilised and handheld inside one shot
          is a named failure; across shots it is a choice, so say which shots.
   feeds: B3, the CAMERA block per beat
   skill: all

L6 · MEASURABLES
   needs: L1-L4
   ask:   (Never ask the user. Derive.) White point in K plus tint, contrast
          ratio, saturation 0-1, halation and grain amplitude, vignette, haze,
          skin IRE with its R:G and R:B ratios, black point.
   recs:  Take from the library entry; state them in the doc. A look spec
          without measurements is a moodboard, and shot-builder will reject it
          as a style token.
   feeds: the style token's LOOK SPEC
   skill: shot-builder

L7 · TYPOGRAPHY
   needs: Route
   ask:   Does any text have to be in frame? Exact string if so.
   recs:  No. The default is a refusal — text in generated frames is the most
          reliable way to produce garbage. Costs: none.
   feeds: TYPOGRAPHY block, motion-builder's type voice
   skill: shot-builder-cinematic-action, motion-builder
```

---

## Layer 5 — The bodies

Costume is a first-class node here, not an afterthought. It is what the model
drifts on hardest, and what beginners under-specify most.

```
C1 · CAST COUNT
   needs: S4
   ask:   How many people are in frame at once, at most?
   recs:  Two. Three or more performing simultaneously is the drift cliff.
          Costs: if they need four, they need cuts, and cuts cost beats.
   feeds: C2-C5, P1-P5, the beat budget
   skill: all

C2 · PER CHARACTER — the unrepeatable marker
   needs: C1
   ask:   For each: what is the one physical thing you would describe them by
          to someone in a crowd? Not their personality — a mark, a haircut, a
          scar, glasses, a way of standing.
   recs:  One per character, and no two characters may share a category.
          Costs: without it, two characters merge into one face by beat three.
   feeds: the cast token, the CAST block
   skill: shot-builder, shot-builder-cinematic-action

C3 · COSTUME — head to toe, per character
   needs: C2, W3, W4
   ask:   Walk them head to toe. Every garment: what it is, what it is made of,
          what colour, how it fits, how it is layered, what shoes. And what is
          deliberately absent — no watch, no jacket, no shoes.
   recs:  If they stall, offer a wardrobe register from the format archetype
          (workwear / tailored / streetwear / period / uniform / undressed) and
          build out from there. Costs: wardrobe is the number one drift source;
          under-specified costume changes between every shot.
   feeds: the cast token's COSTUME block, WARDROBE, the continuity ledger
   skill: shot-builder, shot-builder-cinematic-action

C4 · COSTUME CHANGES
   needs: C3, B1
   ask:   Does anyone change clothes? At which beat, and does the audience see
          the change or just its result?
   recs:  No changes. Costs: every change is a second cast token and a second
          set of references.
   feeds: variants on the cast token
   skill: shot-builder

C5 · BASELINE EXPRESSION
   needs: C2
   ask:   What does each face read as at rest — before anything happens?
   recs:  Neutral, mouth closed, unsmiling. Costs: none, and it is required —
          an expression baked into a character reference becomes a mask no
          performance direction can remove.
   feeds: the cast token's BASELINE EXPRESSION, the reference plate brief
   skill: shot-builder

C6 · PROPS AND THE HERO OBJECT
   needs: S4, E4
   ask:   What does the camera have to see clearly? A product, a letter, a
          phone screen, a cup.
   recs:  Name it and give it its own beat. Costs: a hero object that never
          gets a beat reads as set dressing.
   feeds: B1, the location token's set dressing
   skill: shot-builder
```

---

## Layer 6 — The performance

Skip entirely on the `MOTION` route. On `LIVE-ACTION`, run P1-P3 only unless
there is dialogue. On `CINEMATIC-ACTION`, run all of it — this layer is the
whole point of that skill.

```
P1 · GIVEN CIRCUMSTANCES
   needs: E2, C1
   ask:   What is already true when the film starts that neither character can
          undo?
   recs:  Derive two from S4 and confirm. Costs: a motive that ignores the
          given circumstances plays as a lie.
   feeds: P2

P2 · MOTIVE — per character
   needs: P1, E2
   ask:   Why does THIS one push toward the event? Same vector, different fuel.
   recs:  Propose. Costs: unstated motive collapses into "they are the good one".

P3 · GOAL — per character
   needs: P2
   ask:   What is their personal fight in this scene? Never the same words as
          the scene's goal, never the theme.
   recs:  Propose from P2.

P4 · OBSTACLE — per character
   needs: P3
   ask:   What presses against it, and what does one crack cost them?
   recs:  Propose. Must be present in the frame or in the body — never backstory.

P5 · TACTIC — per character (the acting task)
   needs: P4, E3
   ask:   What are they DOING to the other person, moment to moment? Written
          as an action, with the eye-work named as the action.
   recs:  Propose in the shape "checking both of their eyes for X", "registering
          after each point whether it landed", "measuring them, comparing what
          I feel with what they show". Costs: without a task the eyes go dead,
          and no lighting fixes dead eyes.
   feeds: the ACTING TASK block

P6 · THE EYELINE LADDER
   needs: P5, B1
   ask:   Who is allowed to look at whom, beat by beat? And who never looks at
          camera?
   recs:  Build a ladder: never looks up → finds them in a reflection → first
          direct look → first returned look → asks for the look → does not get
          it. Costs: none. It is the cheapest fix for the dead-eyed group shot.
   feeds: GAZE AND EYELINES

P7 · THE BREAK
   needs: P5
   ask:   Where does someone's fuel run out and the line break?
   recs:  Locate it in the beat list. The break IS the delivery of the scene.
   feeds: the beat that gets the close-up
```

---

## Layer 7 — The beats

```
B1 · THE BEAT LIST
   needs: S2, E1, E5
   ask:   (Propose, do not ask cold.) Here is the shot list the runtime allows.
          One primary action per beat, one impact per beat.
   recs:  Derive count from runtime and the archetype's cut budget. Costs: a
          beat count that exceeds the model's cut budget renders as mush.
   feeds: everything in Layer 7, the FORMAT MODE cut budget
   skill: all

B2 · THE SHOT-SIZE LADDER
   needs: B1, E3
   ask:   (Propose.) Wide → medium → medium close → close, tracking the axis.
   recs:  Write the ladder before the beats, not per beat. Costs: without it,
          coverage is all mediums and the edit has no build.
   feeds: the LENS block per beat
   skill: shot-builder-cinematic-action

B3 · ONE CAMERA MOVE PER BEAT
   needs: B1, L5
   ask:   (Propose.) Per beat: the move, its quality, and where it ends. A
          locked camera must be stated as locked.
   recs:  Mode default, varied across the ladder. Costs: two moves in one beat
          is a named failure.
   feeds: the CAMERA block
   skill: shot-builder-cinematic-action

B4 · EDIT POINTS
   needs: B1
   ask:   (Propose.) How does each beat get out — hard cut, morph, dissolve,
          hold.
   recs:  Hard cut throughout unless the format says otherwise.
   feeds: the EDIT block
   skill: shot-builder-cinematic-action

B5 · PRIORITY
   needs: B1, E5
   ask:   Which beats cannot be missing? Which are support? Which are texture?
   recs:  Tag P1/P2/P3. Keep P1 under a quarter of the total or the tag stops
          meaning anything. Costs: none, and it is what makes a budget survivable.
   feeds: the render budget, motion-builder's pack priorities
   skill: motion-builder, all
```

---

## Layer 8 — Sound

```
A1 · DIEGETIC BED
   needs: W3, W4
   ask:   What does this place sound like when nothing is happening?
   recs:  Name it, plus what is banned from it. Costs: unstated ambience comes
          back as library music you have to fight.

A2 · SFX PER BEAT
   needs: B1
   ask:   (Propose.) One sound event per thing that moves. 4-8 specific
          physical sounds across the piece.
   recs:  Object and action, never adjective. "boot on wet metal", not
          "ominous sound".

A3 · DIALOGUE
   needs: B1, C1
   ask:   Every line, verbatim, and which beat it is in. Plus the language.
   recs:  Count the words against runtime: 2-2.5 words per second is the
          ceiling, 1.2-1.5 if the pauses are the content. Costs: over the
          ceiling, the model rushes or drops lines.

A4 · VOICE IDENTITY
   needs: A3
   ask:   Per speaker: pitch, weight, texture, pace, accent, one vocal habit.
   recs:  Four to six attributes. Paste verbatim everywhere — a synonym is a
          drift.

A5 · SCORE
   needs: S1
   ask:   Music, or explicitly none?
   recs:  None, in the generated material — score is an edit decision, and
          unstated score means library music arrives uninvited. Describe
          function, not genre, if there is one.
```

---

## Layer 9 — Assets, constraints, delivery

```
R1 · REFERENCE PLATES
   needs: S6, C2, W3
   ask:   Which reference images or clips exist — faces, places, products,
          footage? For each: what it is FOR, and what it must NOT contribute.
   recs:  The NOT clause is the load-bearing half. "Use this for the face, not
          the wardrobe, not the lighting."  Number them and keep the numbering
          fixed across the whole project.
   feeds: ACTIVE REFERENCES, the workflow mode
   skill: all

R2 · WORKFLOW MODE
   needs: R1
   ask:   (Derive.) Reference images of the people and places exist →
          ref2video. Nothing exists → text2video. Some do and some do not →
          mixed, and say per character which is which.
   recs:  ref2video whenever a real face or place must be recognisable. Costs:
          text2video means identity comes from text alone and drifts. mixed is
          the common real case — a hero with a plate and extras without.
   feeds: whether the likeness anchor line exists at all
   skill: shot-builder, shot-builder-cinematic-action

D1 · GLOBAL NEGATIVES
   needs: S7, E4
   ask:   Anything that must never appear? Symbols, brands, logos, a colour, a
          type of person, a cliché.
   recs:  Collect from S7 and the location. Costs: none.
   feeds: the negative baseline, every token's gotchas

D2 · BUDGET POSTURE
   needs: B5
   ask:   Are we running the full ladder — storyboard still, end-frame still,
          low-res preview, then the hero render — or going straight to hero?
   recs:  Full ladder on anything over a handful of shots. Costs: skipping it
          means paying hero prices for a composition you have not seen.
   feeds: the generation plan

D3 · DELIVERABLE FORMATS
   needs: S3, B1
   ask:   What comes out at the end: stills, a cut, a contact sheet, plates,
          a vertical version?
   recs:  From the archetype.
   feeds: the deliverables list

D4 · OUTPUT FORMAT OF THIS DOC
   needs: —  (ask once, at the very end, one line)
   ask:   Markdown is written either way. Want a designed PDF for the client too?
   recs:  Markdown only unless someone outside the room has to read it.
```

---

## The craft pass

An optional deepening that derives every camera decision from the protagonist's
condition instead of choosing it from a menu: condition → stance → what must stay
in the frame → what that forecloses.

**The gate lives in [camera-stance.md](camera-stance.md) Part 2 and nowhere else.**
It is stated once so it cannot drift. Read it before offering, and take its
exclusion list as absolute. In short: most jobs never see this, and the ones that
do are offered it in a single line they can decline.

A conditional sub-tree hangs off it — **when the world is pre-electric**, three
period questions about what physically makes the light, whether the film looks
back at the period or pretends to be contemporaneous with it, and where the
palette's colours could have come from. camera-stance.md Part 4. Their answers
feed W4, L2 and L4 rather than getting a section of their own.

---

## Route-specific subtrees

**`MOTION` route** — skip Layers 5 and 6 entirely. Replace Layer 4 with:

```
MG1 · STYLE FAMILY — exactly one, by slug, from motion-builder's eleven:
      paper-editorial · vox-collage · zine-collage · ink-sport-vector ·
      paint-over-photo · type-punch · flat-duotone · glass-dark · blueprint ·
      terminal-neon · soft-3d
      recs: propose three that fit the topic, describe what each does to the
      frame, let them pick. Mixing families is the number one cause of output
      that reads as generic AI.
MG2 · SURFACE — what is the world made of? paper, void, glass, print, stage set.
MG3 · TYPE VOICE — shouty grotesk / editorial serif-mono mix / clean UI.
MG4 · STAGE — one persistent background world across every clip, or a new world
      per clip? Decided once, at sheet time, never per clip.
MG5 · ENERGY — calm-premium ↔ punchy-kinetic. Sets both motion verbs and the
      sound palette, so it propagates into every block.
MG6 · LOGO / REAL BRANDS — is there a logo to attach, and which real marks
      appear? They get fetched and attached, never described in words.
MG7 · SCRIPT STATE — is there a recorded VO (timing final), a draft script with
      no audio (timing draft, estimate at 150 words per minute), or nothing?
      The VO is the timeline in motion graphics: every beat maps to a visual, so
      without it the coverage plan is guesswork. Nothing yet means the next
      skill is story-beats, not motion-builder. Ask this FIRST in the MOTION
      subtree — it gates everything else.
```

Layer 8 on the MOTION route is thin: there is no dialogue and no on-camera
performance, so A1 ambience and A5 score collapse into a single decision, which
is almost always "sound design only, no music, no voice-over." The VO itself is
MG7, not a Layer 8 node.

**`CINEMATIC-ACTION` route** — add:

```
X1 · MODEL + CUT BUDGET — which Seedance tier, and how many cuts it affords.
     Derive from runtime, whether audio is needed, and resolution.
X2 · PRESET — CINEMATIC (direction and acting) / ACTION (weight and consequence)
     / COMMERCIAL (product and surface) / STYLISED / MOTION GRAPHICS.
X3 · DRAFT OR FINISH — a draft is half the blocks and half the words. Ask which
     this is; a finish-end brief on a draft-end idea wastes everyone's time.
X4 · THE AXIS LINE — which side of the line does the camera stay on, and are
     there exceptions? Count them: "crosses exactly once, on beat four."
```

---

## Multi-scene projects: the scene sweep

When a job splits into a project doc plus scene docs, the project-level nodes are
grilled once, in the normal rounds. The scene-level nodes are then swept — one
round per scene, and the same four every time:

**W3 location · W4 light state · W5 signature element · B1 the beat list.**

Nothing else. Everything else in a scene doc is inherited from the project doc or
derived: the look, the cast, the costume, the palette, the sound bed and the
performance tasks were all settled once, for all scenes. Propose each scene's
four and let the user correct them; a nine-scene short is nine short rounds, not
nine sessions.

If a scene genuinely needs a different look or a different cast, that is not a
scene — it is a second project, and it gets its own project doc.

---

## QUICK mode: the fifteen that survive

Three rounds. Everything else is locked from recommendations and listed in the
appendix. Ask, in this order:

The prerequisite order still holds — QUICK is a shorter session, not a licence
to ask a question before its answer is askable. Round sizes stay small so reply
quality does not collapse.

**Trim against the archetype first.** Whichever of the fifteen do not appear in
the format's Depth row are derived and flagged, not asked. On a small job QUICK
and DEEP converge, which is correct — there was only ever one short session in
there.

**First, a confirmation, not a round.** S1 FORMAT, S4 THE ONE SENTENCE and
S6 EXISTING MATERIAL are almost always already implied by the message that
triggered the skill. State your reading of all three in one line and ask them to
correct it. If any is genuinely unknowable from what they said, ask it here — but
ask only that.

**Round 1 (needs only S1 and S4):** S2 RUNTIME · S3 ASPECT · W1 REGISTER ·
E1 THE ENDING · W3 LOCATION · C1 CAST COUNT

**Round 2 (needs round 1):** S7 WHAT IT IS NOT · L1 REFERENCE ANCHOR ·
W4 LIGHT STATE · C2 UNREPEATABLE MARKER · E5 THE ONE SHOT

**Round 3 (needs round 2):** E4 THE SIGNATURE · C3 COSTUME ·
R1 REFERENCE PLATES · B5 PRIORITY, plus every contradiction the coherence pass
turned up. B1, the beat list, is proposed by you from the runtime rather than
asked — B5 is confirming priorities on a list they are seeing for the first time.

Everything else — palette, lens, stock, measurables, movement register, beats,
sound, budget — is derived and flagged. Say so plainly in the appendix, with the
node name, so they can overturn any one of them without re-running the session.
