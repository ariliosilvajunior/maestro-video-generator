# Changelog

## 1.1.0 — 2026-09-20 — niche-aware discovery (the "scraping" phase)
- **Setup captures each user's niche:** `brand.niche`, `brand.audience`, and a `discovery` section
  (search queries in PT + EN, seed channels, creators roster, language/age/views/duration filters,
  excluded keywords, per-run count, auto-enqueue). The `/setup` wizard interviews the user, writes the
  values and proves them with a live dry-run; `bin/doctor.py` requires the niche + queries when
  discovery is enabled (`--live` probes a real YouTube search).
- **New Phase 1 source:** `discover-pipeline/discover_sources.py` (+ skill `discover-sources`) searches
  YouTube through yt-dlp ($0, no login), filters, de-duplicates against the queue / posted log / its own
  ledger, ranks by view velocity and enqueues the best links. Stage 0 runs it automatically when the
  next-videos queue is empty; the run only stops and asks when discovery finds nothing.
- Scripts read `brand.niche` / `brand.audience` for angle and vocabulary; `setup_init.py set` accepts
  comma-separated lists and true/false for list/bool keys.

## 1.0.0 — 2026-09-20 — first release

**Personalisation & setup**
- Single config file `config/config.json` (brand, avatar, image provider, transcription, ManyChat,
  posting, QC, notifications, paths) + `.claude/keys.md` for keys. No identity is hardcoded anywhere.
- `setup-wizard` skill (`/setup`): verified checklist — programs, accounts, keys, avatar discovery in
  HeyGen, Instagram/ManyChat sessions, assets — ending in `bin/setup_init.py complete`.
- `bin/doctor.py`: the checklist as code (programs incl. ffmpeg `ass` filter, config, keys with `--live`
  probes, sessions, assets); `bin/smoke_test.py`: render + subtitle burn + sound mix without API credits;
  `bin/make_sample_assets.py`: synthesizes every demo asset locally.
- Setup gate: every pipeline skill checks `setup.completed` + `doctor --quiet` before running.

**Image generation — choose your provider**
- `image-pipeline/generate_image_assets.py`: fal.ai (queue API), Google Gemini image models, or OpenAI
  `gpt-image-1` (native transparent background). Premium palette prompt templates, chroma key with a
  border flood-fill fallback, stray-speck clean-up, per-beat resume, provider-aware exit codes.
- `images.provider = none` keeps the hand-drawn style available with no image API at all.

**Portability**
- Cross-platform helpers in `lib/`: config, key resolution (CLI → env → keys.md), paths (no symlinks,
  no fixed home folders), ffmpeg discovery preferring a libass build, file locking (fcntl/msvcrt),
  atomic writes, notifications (log / webhook / command).
- Remotion project addressed relatively (`motion-pipeline/remotion-agent`), fonts bundled, sample
  compositions render with the shipped placeholder assets; TypeScript type-checks clean.
- Local ASR backend chain for the measured caption builder (mlx-whisper → faster-whisper → whisper).

**Optional integrations**
- QC gate (Gemini) and ManyChat comment→DM are opt-in (`qc.enabled`, `manychat.enabled`); with ManyChat
  off the CTA keyword still ships in the caption and the resource is delivered manually.
- Posting: browser-first Instagram Reels with an optional Metricool fallback; generic alert channel.

**Not included (by design)**
- Any company identity, avatar ids, account ids, keys, saved sessions, generated videos, run states and
  logs; scraping; cloud archive step; proprietary notification channel.
