# Headline Banner Strategy — Verified Research

Deep-research run (101 agents, 19 sources, 25 claims adversarially verified → 10 confirmed,
15 killed). This doc is the institutional reference behind the **S0 HeadlineBanner scene**
(`MOTION_DESIGN_SYSTEM.md` §2.6). Only claims that SURVIVED 3-vote adversarial verification
are stated as facts; killed claims are listed so we never repeat them.

## What the headline banner is

A news-style on-screen text banner in the first seconds that states the video's theme as a
clickbait-style headline (curiosity gap / bold claim / number). It is **load-bearing hook
creative, not a caption**: it serves the sound-off audience and feeds text-based topical
relevance signals to the recommendation algorithm.

## Verified findings (and what we do about each)

| # | Finding (confidence) | Implementation |
|---|---|---|
| 1 | ~90% of ad recall impact is captured in the first 6 seconds (TikTok Marketing Science, HIGH) | Headline enters at **frame 0**, fully readable by ~0.4s. S0 = 0–3.0s. |
| 2 | On-screen text that gets people reading lifts view time, recall, likability; on-screen CTA/offer text drove 80–152% conversion lifts in TikTok ads data (MEDIUM — 2021, paid ads, correlational) | The banner is a standing pipeline phase, not an experiment. Directional evidence only — watch own-channel 3s retention. |
| 3 | Headline overlay = load-bearing creative for sound-off viewers + algorithm text signals (MEDIUM) | Headline carries the THEME, not decoration. Words chosen for searchable niche terms (Claude, IA, agente). |
| 4 | Cap hook text at ~6-8 words (consensus 6-10); large, high-contrast, uncluttered (MEDIUM) | HeadlineBanner hard cap: **≤8 words** across max 2 lines + 1-2 word kicker. Anton display type on dark bg = max contrast. |
| 5 | Algorithmic checkpoint = 3-second retention; practitioner banding: >70% strong, 50-70% improvable, <50% rewrite (MEDIUM — heuristic) | S0 (0-3s) owns this window: headline + avatar talking. Use the banding when reviewing channel analytics. |
| 6 | YouTube enforces against "egregious clickbait" — titles/overlays promising what the video doesn't deliver (HIGH; India-first rollout Dec 2024, global direction-of-travel) | **Mismatch rule:** the headline is a second title. Every claim in it MUST be delivered by the video. Bold ≠ false. |

## Brazil-specific caveat (IMPORTANT)

TikTok's "show text in the first 7 seconds" conversion finding **did NOT validate in Brazil**
(also Japan/NA). The strongest timing claim is weakest in our market. The front-loading
principle still holds on recall evidence, but treat the headline as a hypothesis to monitor
in our own analytics (3s retention per video), not settled fact.

## Wording formulas (PT-BR, pick ONE per video)

The headline states the VIDEO THEME — never the spoken opening sentence (complement rule §2.5).

| Formula | Pattern | Example |
|---|---|---|
| Curiosity gap | withhold the key noun/outcome | `ISSO APOSENTA O PROGRAMADOR?` |
| Bold claim | definitive statement | `A IA QUE TRABALHA SOZINHA` |
| Number promise | numeral + payoff | `3 AGENTES QUE FAZEM TUDO` |
| Negativity/warning | threat or mistake framing | `PARE DE USAR IA ASSIM` |
| News-style | kicker (`AGORA`/`VAZOU`/`BOMBA`/`URGENTE`) + fact headline | `VAZOU` + `CLAUDE CODE DE GRAÇA` |

Rules: ≤8 words, ALL CAPS (Anton does this), 1 accent word highlighted, numerals as digits,
no punctuation except `?`, headline must be TRUE to the content.

## Claims we must NEVER cite (killed 0-3 in verification)

- "85% of short-form video is watched without sound" — refuted.
- "On-screen text = 25% higher completion / 40% more saves / 50% retention lift" — refuted.
- "65% swipe away before second 4" / "65% who watch 3s watch 10s more" — refuted.
- All exact safe-zone pixel specs found online (TikTok 130/250px, Reels 108/320px, Shorts 4:5,
  120px bands) — ALL refuted. Keep using our own conservative SAFE_TOP=0.38 geometry.
- Vidooly "47% retention lift from pattern interrupt + text" — refuted.

## Open questions (own-channel A/B candidates)

1. Persistent banner for the whole video vs hook-only (0-3s)? No evidence either way —
   current design: hook-only S0, because b-rolls replace the full frame anyway.
2. Does early headline text help BR organic audiences specifically? Only our analytics can tell —
   compare 3s retention of videos before/after the date you introduced the banner.
