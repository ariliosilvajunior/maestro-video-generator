# Niche discovery — Phase 1 "scraping" (feeds the next-videos queue)

**What:** when the next-videos queue is empty, the pipeline does not stop: it searches YOUR niche on
YouTube (through yt-dlp, no API key, no login, $0) for fresh, high-performing videos and enqueues the
best ones as source links. Stage 0 then claims them exactly like a link you pasted.

**Where the niche comes from — the setup phase.** The `/setup` wizard interviews you and stores:

| Config key | Meaning | Example |
|---|---|---|
| `brand.niche` | one line describing what your account is about | `IA para pequenos negócios` |
| `brand.audience` | who watches (level, goal, language) | `donos de loja sem time técnico` |
| `discovery.queries` | 6–12 search phrases a viewer of your niche would type, in PT **and** EN | `["automação com IA", "ai agents for business"]` |
| `discovery.seed_channels` | creators you want to reproduce from (`@handle`, channel URL or `UC…` id) | `["@somecreator"]` |
| `discovery.use_creators_roster` | also search the YouTube authors of links you pasted before (`creators.jsonl`) | `true` |
| `discovery.languages` | accepted source languages (the script is rewritten in `brand.language` anyway) | `["pt", "en"]` |
| `discovery.max_age_days` · `min_views` · `min_duration_s` · `max_duration_s` | freshness / traction / length filters | `30` · `5000` · `20` · `900` |
| `discovery.exclude_keywords` | topics you never want (case-insensitive, title + description) | `["cripto", "aposta"]` |
| `discovery.per_run` | links enqueued per discovery run | `3` |
| `discovery.auto_enqueue` | Stage 0 may enqueue automatically when the queue is empty | `true` |
| `discovery.prefer_shorts` | bonus for ≤ 60 s sources | `false` |
| `discovery.enabled` | master switch (`false` = link-first only, the run stops and asks) | `true` |

Set with `python3 bin/setup_init.py set discovery.queries "automação com IA, ai agents for business"`
(comma-separated lists are accepted for list keys) or edit `config/config.json`.

## Command

```bash
python3 discover-pipeline/discover_sources.py                 # dry-run: ranked candidates for your niche
python3 discover-pipeline/discover_sources.py --enqueue       # enqueue the top discovery.per_run links
python3 discover-pipeline/discover_sources.py --limit 10 --json
python3 discover-pipeline/discover_sources.py --queries "…" "…" --channels @creator --max-age-days 14 --min-views 20000
```

Exit codes: `0` candidates found (and enqueued if asked) · `3` nothing passed the filters (widen the
queries or the filters) · `4` yt-dlp missing · `5` discovery disabled / nothing configured.

## How it ranks
1. Two searches per query (relevance + newest) and the latest uploads of every seed/roster channel.
2. Cheap filters on the flat results (duration, views, excluded words), de-duplication against the
   queue, `pipeline-log.csv` (already posted → never re-proposed) and `discover-pipeline/discovered-ledger.json`
   (already proposed → skipped unless `--include-seen`).
3. Full metadata for the top ~25 (≈ 1–2 minutes per run) (upload date, views, likes, language, description) → age, views,
   language and keyword filters.
4. Score = log(views) + 1.5·log(views per day) + engagement bonus + seed-channel bonus + multi-query
   bonus (+ shorts bonus when `prefer_shorts`). Newer + faster-growing wins over merely big.

## Rules
- Discovery only PROPOSES/ENQUEUES sources. Selection safety still applies downstream: Phase 1/2
  content-safety gate (`PIPELINE_DIRECTIVES.md` §11), resource-bearing bias, exact-duplicate check.
- The queue keeps the provenance (`note: "discovery: query:… | title"`); `next_videos.py list` shows it.
- Run it by hand any time to preview what the pipeline would pick: it is the fastest way to tune
  `discovery.queries`. Aim for a table where ≥ 70 % of the rows are videos you would happily remake.
- Instagram/TikTok are not searched (no public search without login); paste those links yourself —
  the hook queues them and the creator roster learns from them.
