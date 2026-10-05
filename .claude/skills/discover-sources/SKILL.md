---
name: discover-sources
description: Phase 1 niche discovery (the "scraping" phase) — search YouTube for fresh, high-performing videos in the user's niche (config discovery.* + brand.niche, set by /setup) and feed the next-videos queue. Runs automatically in Stage 0 when the queue is empty (config discovery.auto_enqueue) or on demand. Triggers — "find videos to reproduce", "discover sources", "fill the queue", "abastecer a fila", "descobre vídeos do meu nicho", "o que eu deveria gravar", "scrape my niche".
---

Precondition: `config/config.json` has `setup.completed: true` and `discovery.queries` and/or
`discovery.seed_channels` filled (the `/setup` niche step). `discovery.enabled: false` → skip this
skill; the pipeline is link-first only.

# Skill: discover-sources (Phase 1 — niche discovery)

Spec: `discover-pipeline/DISCOVERY_INSTRUCTIONS.md`. One script does everything:

```bash
python3 discover-pipeline/discover_sources.py            # dry-run: ranked table (score, views, age, duration, lang, channel, title, url, source)
python3 discover-pipeline/discover_sources.py --enqueue  # add the top discovery.per_run links to next-videos.jsonl
```

## When Stage 0 calls it (automatic)
`next_videos.py peek` is empty **and** `discovery.enabled` **and** `discovery.auto_enqueue` → run
`--enqueue`, then re-run the Stage-0 dispatch (`peek` → `claim`). Exit `3` (nothing passed the filters)
or `5` (nothing configured) → fall back to **STOP and ask the user** for a link or a topic, quoting the
`[discover]` summary line so they can widen the queries.

## When the user asks (manual)
1. Run the dry-run and LOOK at the table. Good = fresh (≤ `max_age_days`), traction (views/day), on-niche,
   resource-bearing (a tool / repo / product the video hands over — the comment→DM CTA needs one).
2. Say which rows you would produce and why (1 line each). If the table is off-niche, propose better
   `discovery.queries` / `seed_channels` and apply them with `python3 bin/setup_init.py set …`, then re-run.
3. Enqueue what the user picks: `next_videos.py add "<url>" --note "discovery"` (or `--enqueue` for the
   top N). Never start a build from here — Stage 0 (`maestro-video-pipeline`) claims the queue.

## Hard rules
- **The niche comes from config, never from your assumptions.** Read `python3 lib/config.py get brand.niche`
  and `brand.audience` before judging relevance; a great video outside the user's niche is a NO.
- **Already posted / already queued / already proposed videos are excluded by the script** — do not
  bypass with `--include-seen` unless the user explicitly asks for a respin.
- **Content-safety gate applies to what you propose** (`PIPELINE_DIRECTIVES.md` §11): skip "easy money",
  miracle-claim, MLM-shaped sources even when they rank high.
- Instagram/TikTok are not searchable without login: ask the user to paste those links (the hook queues them).
- Tune, don't spam: if a run yields < 3 good rows, adjust queries/filters instead of enqueuing weak sources.
