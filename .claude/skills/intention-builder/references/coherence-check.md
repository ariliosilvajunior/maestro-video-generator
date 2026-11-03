# The coherence pass

A brief can be fully answered and still be impossible. Run every rule below
before the doc is written. Each one that fires becomes a question to the user,
never a silent fix — the user chose both halves of the contradiction, so the user
decides which half survives.

**How to raise one:**

```
⚠️ **Two answers fight each other.**
<the two answers, quoted, with their node names>
<one sentence on why they cannot both be true>
➡️ <the resolution you recommend, and what it preserves>
Or: <the other resolution, and what it costs>
```

Raise all of them in one batch, at the end of the grill, not one at a time.

---

## Hard conflicts — these make the brief unshootable

| Rule | Fires when | Why |
|---|---|---|
| **One light state** | Two times of day, or day and night, in a single doc | The sun cannot move between cuts. Two light states is two intention docs. Split, or pick. |
| **Light vs location** | Golden-hour or sunlit key + a windowless interior | Nothing motivates the light. Either the location gains a window, or the key becomes a practical. |
| **Runtime vs beats** | Seconds per shot falls below 1.0, or rises above 8 | Below one second per shot nothing registers; above eight it reads as a slideshow. Recompute one of them. |
| **Cast vs coverage** | Three or more characters performing in one beat | The drift cliff. Three performing faces in one frame produce the twins artefact. Cut, or demote someone to texture. |
| **Register vs locks** | Photoreal register + a stylised style lock, or both lock types loaded | The register was never decided. Decide it. |
| **Aspect vs reference** | 9:16 delivery + a 2.39:1 reference look, or a style sheet built at the wrong aspect | The composition rules of a wide frame do not survive a vertical crop. Reframe the look, or change the delivery. |
| **Two stocks** | Two film stocks, or two grades, named in one look | Named failure. Pick 250D, 500T, or one bleach-bypass — never two. |
| **Two style families** (MOTION) | More than one motion-builder family slug | The number one cause of output that reads as generic AI. One family per sheet. |
| **Stance vs lens** | The lens table, the default lens, or a camera-mode default falls outside the stance's range — 21-35mm for in-it, 40-100mm for watching | The stance is the reason the focal range exists. A close-up quietly filled in at 85mm on an in-it project reverses the claim the camera was making. Either the stance moves or the lens does. |
| **Movement contradiction** | Stabilised and handheld specified inside the same shot | Named failure. Across shots it is a choice — say which shots. |
| **Reference without a NOT** | A reference plate listed with no exclusion clause | The exclusion is the load-bearing half. "Use this for the face" without "not the wardrobe, not the light" invites both to leak. |
| **Dialogue vs duration** | Word count exceeds runtime × 2.5 | The model rushes or drops lines. Cut words or extend the beat. |
| **Model vs ask** | Requested audio, resolution, duration or reference count exceeds the chosen model's ceiling | Change the model or change the ask, before a single line is composed. |

---

## Soft conflicts — shootable, but the result will disappoint

| Rule | Fires when | Say |
|---|---|---|
| **Look vs intention** | The chosen look's register contradicts what the viewer is supposed to do | "You want them to buy it, and you picked a look built for distance and unease. One of those is wrong." |
| **Format vs runtime** | Runtime is outside the archetype's usual band by more than 50% | "A 90-second social vertical is three times the format's attention span. Is there a reason?" |
| **Beat density under the comfortable floor** | Below 2.5s per shot on CINEMATIC-ACTION, or 1.5s elsewhere | Fine for an editorial cut — a 30-second ad at fourteen shots is normal. Worth a word only if these are *generated* beats inside one clip, where the model has to resolve each one. Trailers, sizzles and bumpers are exempt outright. |
| **No ending** | E1 unanswered, or answered as "it just ends" | This is a stop, not a warning. Nothing downstream works without it — the event is named backward from the ending. The exception is a format whose Depth row omits E1 — a product hero has no narrative, and an explainer's ending is the last line of the VO. There, propose the last frame yourself, write it into §2, and flag it in the appendix rather than asking. |
| **No signature** | E4 unanswered | Nothing holds the frames together. Offer three candidates from what is already locked. |
| **Costume under-specified** | Any character with fewer than four named garments, or no fabric named | Wardrobe is the number one drift source. Push once, hard. |
| **Palette without hex** | Colours named in words only | Downstream skills need values. Derive them from the look library entry and confirm. |
| **Look spec without measurements** | No Kelvin, contrast ratio, saturation value, or grain | shot-builder will not accept it as a style token — it is a moodboard. Derive from the library. |
| **Signature not in the beats** | E4 is locked but no beat features it | The signature is decorative. Either promote it or drop it. |
| **Hero object with no beat** | C6 named but absent from the beat list | It will read as set dressing. Give it a beat. |
| **Everything is P1** | More than a quarter of beats tagged priority 1, on a list of eight or more | The tag has stopped meaning anything. Demote until it hurts. On a short beat list the ratio is noise — skip it. |
| **Score unstated** | A5 never answered | Unstated score means library music arrives uninvited. Force a yes or an explicit none. |
| **Ambience unstated** | A1 never answered | Same failure, quieter. Silence is a valid answer, but it must be *said*. |
| **The first frame** | No beat is nominated as the opener still | A third of the audience sees only that frame. Nominate one. |
| **Only references, no intention** | Three or more reference films and no answer to S5 | Run the reverse move in vague-to-spec.md — extract the shared property and name it. |

---

## Completeness — what must exist before the doc can be called locked

Check by route.

**All routes**
- [ ] Format, runtime, aspect (S1-S3)
- [ ] The one sentence (S4)
- [ ] The ending (E1) — proposed and flagged rather than asked where the
      archetype's Depth row omits it
- [ ] The signature (E4)
- [ ] What it is not — at least three (S7)
- [ ] Register: photoreal or stylised (W1)
- [ ] A palette with hex values (L2)
- [ ] The beat list with a priority tag on each (B1, B5)
- [ ] Global negatives (D1)
- [ ] Reference plates listed with a NOT clause each, or an explicit "none exist" (R1)

**LIVE-ACTION adds**
- [ ] Camera mode M1-M5 declared (W2)
- [ ] Exactly one light state (W4)
- [ ] Location: geography, era, signature element (W3, W5)
- [ ] Per character: unrepeatable marker, full head-to-toe costume, baseline expression (C2, C3, C5)
- [ ] Lens character and capture medium (L3, L4)
- [ ] Measurables: Kelvin and tint, contrast, saturation, halation, grain, skin IRE with R:G and R:B, black point (L6)
- [ ] Workflow mode: ref2video, text2video, or mixed (R2)

**CINEMATIC-ACTION adds everything above, plus**
- [ ] The event, containing every character including the silent ones (E2)
- [ ] The essential axis (E3)
- [ ] Per character: motive, goal, obstacle, tactic (P2-P5)
- [ ] The eyeline ladder (P6)
- [ ] The shot-size ladder across the beats (B2)
- [ ] One camera move per beat, each with an ending (B3)
- [ ] An edit point on every beat (B4)
- [ ] Dialogue verbatim with language, and voice identity per speaker (A3, A4)
- [ ] Model, cut budget, preset, draft-or-finish (X1-X3)
- [ ] The axis line and any counted exceptions (X4)

**MOTION adds**
- [ ] Exactly one style family slug (MG1)
- [ ] Surface, type voice, energy (MG2, MG3, MG5)
- [ ] Stage: locked or free (MG4)
- [ ] Logo and real-brand answer (MG6)
- [ ] Whether the VO exists: recorded, draft, or nothing yet (MG7)
- [ ] A coverage plan accounting for every second, not a clip for every second

---

## Things that look like conflicts but are not

Do not raise these — raising a non-conflict costs credibility and wastes a round.

- **Different camera modes in different sections.** A music video that is M2 for
  the editorial sequence and M4 for the performance is correct. Each section
  gets its own camera block; they are simply never averaged.
- **A warm look in a cold story.** Contrast between tone and palette is a real
  technique, not an error. Ask once whether it is deliberate, accept the answer,
  move on.
- **Handheld with a locked-off look.** Movement register and grade are
  independent axes.
- **A vertical film with a cinematic grade.** Aspect constrains composition, not
  colour.
- **No dialogue in a dramatic piece.** Silence is a choice. Only flag it if the
  performance layer has nothing to play.
- **A short runtime with a big idea.** That is what a good ad is.
- **Participant camera that is lit.** Stance and lighting are independent axes.
  A close, wide, mobile camera in a heavily lit set is a real and common choice.
- **A short session.** Seven questions on a product loop is the depth working,
  not the grill failing.
- **A trailer with sixty cuts in ninety seconds.** Density is the format.
- **A MOTION doc with no location, no light state and no cast.** Those sections
  do not apply; the doc says `n/a` and moves on.
