---
name: choose-video-topic
description: Phase 1 of the Maestro Video Generator pipeline — source select. Content comes from the next-videos queue (links you paste, dispatched by Stage 0), from niche discovery (skill discover-sources — YouTube search in the niche set by /setup, feeds the queue when empty) or from a manual topic/transcript the user gives. Triggers — "choose a topic", "pick a script", "what should I produce next", a manual topic/transcript handed to the pipeline.
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: choose-video-topic (Phase 1 — Source Select)

> Phase 1 never invents a topic. It decides WHICH real source feeds Phase 2 (`write-script-ptbr`): a queued
> link, a link found by **niche discovery** (`discover-sources`, driven by `config.brand.niche` + `discovery.*`
> captured in `/setup`), or a manual topic/transcript from the user.

## Where topics come from
Content flows in through **Stage 0 — the NEXT-VIDEOS queue** — or a manual seed:

1. **Queue has a link** (`python3 next-videos-pipeline/next_videos.py peek` returns a URL) → the
   pipeline runs THAT link via `generate-video-from-link`. This is the normal path; this skill is skipped.
2. **Queue empty → niche discovery** (`config.discovery.enabled`): Stage 0 runs
   `python3 discover-pipeline/discover_sources.py --enqueue` (YouTube search for the user's niche: queries,
   seed channels, creators roster; fresh + high-velocity + on-language; already posted/queued/proposed excluded)
   and re-dispatches the queue. On demand, run the dry-run and pick with the user (skill `discover-sources`).
3. **Manual topic seed** — the user supplies a YouTube/Instagram URL, a one-line topic, or a transcript:
   - a URL → `python3 next-videos-pipeline/next_videos.py add "<URL>" --front`, then Stage-0 dispatch
     (it becomes a normal link run);
   - a topic / transcript → package it as the **topic seed** for Phase 2: the text itself (`transcript`),
     the hook idea it suggests (`hook`), and any real tools/products/repos it names (`entities`) — write it
     to `<downloads>/<Name>_topic_seed.json` (Write tool) and start the pipeline at Phase 2.
4. **All empty** (`peek` prints nothing, discovery found nothing / is disabled, and no manual seed was given) → there is
   nothing to produce. **STOP and ask the user** for a link or a topic: "The next-videos queue is empty.
   Paste a YouTube/Instagram link to produce from, or give me a topic (a one-liner or a transcript)."
   Do not guess a topic outside the configured niche — wait for the answer (or widen `discovery.queries` with the user).

## RESOURCE-BEARING SELECTION BIAS (no video lacks a resource link)
Every video this repo ships MUST carry a shareable resource link (a tool/repo/agent/skill/app/product/guide)
that the comment→DM CTA hands out. **So when choosing among queued/manual topics, PREFER the one that maps
cleanly to a concrete, gettable resource** — a specific tool/repo/agent/skill/app/product the viewer can go get
— over pure opinion, news-reaction, or platform-feature topics where the only "resource" would be a homepage or
a feature they already have. A topic with no obvious gettable resource is not disqualified outright — Phase 2
will research a perfect-fit resource — but prefer resource-bearing topics so the link is organic. Note in the
topic seed which gettable resource the candidate implies, to seed Phase 2's CTA.

## AUTONOMY — decide, don't ask (once a source exists)
Choosing among available topics is a self-check, NOT a reason to stop and ask the user. **Adjacent /
thematically-similar topics are NOT a problem** — reject ONLY an EXACT duplicate (same product + same angle
already in `pipeline-log.csv`). A different product, tool, or angle within the same theme is acceptable: pick
it and proceed. The ONLY question this phase ever asks is the one in rule 3 above (no source at all).

## CONTENT-SAFETY / PLATFORM-POLICY GATE (canonical: `PIPELINE_DIRECTIVES.md` §11)
Screen every candidate topic for **"easy money" / get-rich-quick / scam-shaped** angles and Instagram-policy
risk BEFORE handing it to Phase 2. A topic whose hook is a financial guarantee ("ganhe R$X/mês com IA",
"renda garantida", "dinheiro fácil", "método secreto"), a fake/secret coupon (QCR-165/177), a miracle
health claim, or anything deceptive/MLM-shaped is **reframed** (keep the real tool + TRUE capability, drop
the money-scam wrapper) or, if the entire premise IS the scam with no honest resource under it, **skipped**
(take the next queue link; for a manual topic, tell the user why). Prefer resource-bearing, honestly-framed
topics. Log via `maestro_state.py set --field safety_note="…"`. This is a decision, not a question.

## Hand-off
Skip straight to `write-script-ptbr` with the topic seed (from the queue link's transcript, or the manual seed
above). `export MAESTRO_RUN=<Name>` as soon as the run name exists and `maestro_state.py init --note "manual topic
run" --field source_url="<url or 'manual'>"` (no `queue_url` for a manual run — nothing to remove on
completion).
