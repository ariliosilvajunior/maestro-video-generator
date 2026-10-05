---
name: setup-wizard
description: The SETUP PHASE of the Maestro Video Generator pipeline — a guided, verified checklist that installs every program, collects every subscription/login/API key, personalises the pipeline (your avatar, brand, image provider) and proves the toolchain with a smoke test. Nothing in the pipeline runs until this checklist is green (config setup.completed = true). Triggers — "/setup", "setup", "configure the pipeline", "instalar", "configurar o pipeline", "first run", "onboarding", any pipeline request while setup is incomplete.
---

# Skill: setup-wizard (the checklist that unlocks the pipeline)

You are walking a new user through installing and personalising the pipeline. Be a calm,
methodical guide: **one item at a time, verify each with a command, never assume**. The source of
truth for "done" is `python3 bin/doctor.py` — the checklist below mirrors it. The user's keys are
secrets: never echo a key back, never write one anywhere except through `bin/setup_init.py key`.

Language: talk to the user in the language they write in (this edition's community is
Portuguese-speaking; the files themselves stay as they are).

## 0. Where you are
```bash
python3 bin/doctor.py            # the live checklist (❌ required, ⚠️ optional)
python3 bin/setup_init.py status # what is filled in config.json / keys.md
```
If `config/config.json` does not exist: `python3 bin/setup_init.py init` (creates config.json +
`.claude/keys.md` from the examples, plus the empty queue files). Then work through the sections
below in order, running the doctor after each one. Skip items already green.

## 1. Programs (install once)
Tell the user the exact command for THEIR OS (the doctor prints it per item):
| Program | Why | macOS | Windows | Linux |
|---|---|---|---|---|
| Node.js ≥ 18 + npm | Remotion renders the motion graphics | `brew install node` | nodejs.org LTS installer | nodejs.org / nvm |
| Python ≥ 3.10 + `pip install -r requirements.txt` | every pipeline script | `brew install python` | python.org | `apt install python3` |
| ffmpeg **with libass** (+ ffprobe) | encoding + subtitle burn | `brew install ffmpeg` | gyan.dev "full" build on PATH | `apt install ffmpeg` |
| yt-dlp | downloads the inspiration link | `brew install yt-dlp` | `pip install -U yt-dlp` | same |
| jq | the paste-a-link hook | `brew install jq` | `winget install jqlang.jq` | `apt install jq` |
| Remotion deps | `cd motion-pipeline/remotion-agent && npm install` (one-time, ~1 GB) | | | |
| (optional) headless Playwright | deterministic YouTube-page captures | `cd reference-pipeline && npm install && npx playwright install chromium` | | |
| (optional) local word-level ASR | measured caption builder | `pip install mlx-whisper` (Apple Silicon) / `pip install faster-whisper` | | |

**Playwright MCP (the browser the agent drives — HeyGen, Instagram, ManyChat, screenshots):**
`.mcp.json` is already in the repo (`npx @playwright/mcp@latest --user-data-dir .playwright-profile`).
After the FIRST launch of Claude Code in this folder the `mcp__playwright__*` tools appear; if they
are missing, ask the user to restart Claude Code in this folder (or run `/mcp` → reconnect). Verify
by calling `browser_navigate("https://example.com")` once — this also creates the persistent profile
where logins are kept.

Tested on macOS (Apple Silicon and Intel) and Linux. Windows works through WSL2 (recommended) — the
hook and the scripts assume a POSIX shell.

## 2. Accounts & subscriptions (the user creates them; you record the facts)
Walk the user through each account and write the answers with `python3 bin/setup_init.py set <key> <value>`:

1. **HeyGen** (avatar videos) — a plan with monthly video credits. If the user has no HeyGen account
   yet, open the sign-up page in the pipeline browser —
   `browser_navigate("https://www.heygen.com/?sid=rewardful&utm_content=creator&utm_medium=influencera&via=maestrosdaia")` —
   and let them create the account and pick the plan in the visible window. The user creates/uploads THEIR
   avatar and picks a voice in HeyGen. Then log in through the pipeline browser
   (`browser_navigate("https://app.heygen.com/home")`, let the user complete the login incl. 2FA in
   the visible window). Once in AI Studio, discover the exact names to store:
   - open "New video" → the avatar picker → read the avatar group name and the look card names
     (e.g. `img[alt="…"]` entries — use `browser_run_code` to list them), and the voice shown in the
     Avatar & Voice panel;
   - store: `avatar.name`, `avatar.look` (the look card the videos will use), `avatar.fallback_look`
     (optional second look), `avatar.voice`. Save the login e-mail/password in keys.md `## HeyGen`
     only if the user wants unattended re-logins (`setup_init.py key HeyGen …` writes an `API Key:`
     line — for HeyGen edit the two `Email:`/`Password:` lines of that section instead, via the Edit tool).
2. **Google Gemini API key** (REQUIRED — transcription; also QC when enabled): aistudio.google.com/apikey.
   `python3 bin/setup_init.py key Gemini <key>`.
3. **Image provider** (pick ONE; premium look): `fal.ai` (`key fal …`), `OpenAI` (`key OpenAI …`; needs
   credits on the organisation and gpt-image-1 access) or `Google` (reuses the Gemini key). Set
   `images.provider` to `fal` / `openai` / `google`. `none` = hand-drawn videos only.
4. **Stock footage** (recommended, free): Pexels key → `key Pexels …`; optional Pixabay / Coverr.
5. **Instagram** (posting): the user logs in through the pipeline browser
   (`browser_navigate("https://www.instagram.com/")`, they type the credentials + 2FA). Then SAVE the
   session: `browser_run_code` → `async (page) => { await page.context().storageState({ path: '<ABS repo path>/.claude/auth/instagram-storage-state.json' }); return 'saved'; }`
   and verify `python3 browser-post-pipeline/restore_session.py instagram --check` exits 0. Store
   `posting.instagram_handle` and `brand.instagram_handle`.
6. **ManyChat** (optional — automatic comment→DM link delivery; needs the PRO plan with Instagram
   connected): if the user wants it and has no ManyChat account yet, open the sign-up page in the
   pipeline browser — `browser_navigate("https://manychat.partnerlinks.io/iyoaakb3km0q")` — and let them create it
   there first. Then set `manychat.enabled true`, `manychat.account_id` (the `fb…` id in the app URL),
   `manychat.instagram_handle` (MUST equal the posting account), log in through the pipeline browser
   and save `.claude/auth/manychat-storage-state.json` the same way (cookies filtered to
   `manychat.com`). Then create the master TEMPLATE automation once following
   `manychat-pipeline/MANYCHAT_INSTRUCTIONS.md` §B0 and store its flow id in `manychat.template_flow_id`.
   Optional upsell bubble: `manychat.extra_bubble.*`. If the user skips ManyChat, links are delivered
   manually (the CTA keyword still goes into the caption).
7. **Metricool** (optional posting fallback): `posting.metricool.enabled true` + `blog_id` / `user_id` /
   `key Metricool <token>`. If the user wants it and has no Metricool account yet, open
   `browser_navigate("https://i.mtr.cool/maestrosdaia")` in the pipeline browser so they create it there first.
8. **Brand + NICHE — this drives the discovery/scraping phase, never skip it.** Interview the user, then store:
   - `brand.name`, `brand.language` (default `pt-BR`), `brand.timezone`;
   - `brand.niche` — ONE line: what the account is about (e.g. "IA para pequenos negócios");
   - `brand.audience` — who watches: level, goal (e.g. "donos de loja sem time técnico que querem automatizar");
   - `discovery.queries` — 6–12 search phrases a viewer of that niche would type on YouTube, in PT **and** EN.
     Ask which tools/products/problems they cover and which creators they follow; WRITE the phrases yourself from
     the answers and read them back. Lists take commas:
     `python3 bin/setup_init.py set discovery.queries "automação com IA, ai agents for business, claude code tutorial"`;
   - `discovery.seed_channels` — 3–10 creators they want to reproduce from (`@handle` or channel URL);
   - `discovery.exclude_keywords` — topics they never want; `discovery.languages` (default `pt, en`);
   - filters: `discovery.max_age_days` (30), `min_views` (5000), `max_duration_s` (900), `per_run` (3), `auto_enqueue` (true).
   Then PROVE it: `python3 discover-pipeline/discover_sources.py --limit 8` and LOOK at the table WITH the user —
   at least ~70 % of the rows must be videos they would happily remake; otherwise rewrite the queries and re-run
   (2–3 rounds is normal). A user who only wants to paste links sets `discovery.enabled false` (the run then stops
   and asks when the queue is empty). Spec: `discover-pipeline/DISCOVERY_INSTRUCTIONS.md`.
9. **Notifications:** `notify.method` = `log` (default) | `webhook` (+ `notify.webhook_url`, Slack/Discord
   compatible) | `command` (+ `notify.command` with `{message}`).
10. **QC (optional):** `qc.enabled true` to grade every video with Gemini before it is queued
    (`qc.threshold` 75, `qc.max_iterations` 3).

## 3. Assets
- Put ≥ 1 royalty-free track in `music/` (see `music/README.md`) — required for Phase 9.
- `sfx/`, fonts, Lottie primitives and the sample assets ship with the package
  (`python3 bin/make_sample_assets.py` regenerates them if ever deleted).
- Optional: generate a premium icon set once into `motion-pipeline/remotion-agent/public/assets/icons/`
  with the `generate-image-assets` skill (doc · gear · hourglass · eye · cursor · key).

## 4. Verify, smoke-test, unlock
```bash
python3 bin/doctor.py --live      # every ❌ must be gone (⚠️ optional items may stay)
python3 bin/smoke_test.py         # renders the premium template + burns captions + mixes sound (no API credits)
python3 bin/setup_init.py complete   # stamps setup.completed = true → pipeline skills unlocked
```
Open the smoke-test video (`<downloads>/maestro-smoke_music.mp4`) with the user and confirm
they see the motion panel, the placeholder avatar, burned captions and hear the riser/click/music.

## 5. Hand-off
Summarise what is configured (provider, avatar look, niche + discovery queries, enabled options) and show the three ways to start:
- paste a YouTube/Instagram link on its own → it is queued (the hook enqueues it); then say
  "run the pipeline" → Stage 0 claims it and builds;
- or give a topic/transcript → the pipeline starts at Phase 2;
- or just say "run the pipeline" with an empty queue → niche discovery fills it from `discovery.*` and the build starts.
Point them to `README.md` for the day-to-day loop and `docs/SETUP.md` for this checklist in prose.

## Rules for you (the wizard)
- Verify with commands; never mark an item done because the user "said so".
- Never print, log or repeat an API key or password. Keys go ONLY through `setup_init.py key` (or the
  Edit tool on `.claude/keys.md` for e-mail/password lines). If a key lands in the chat by accident,
  do not repeat it and remind the user they can rotate it.
- One account at a time; if the user cannot finish one now (e.g. no ManyChat yet), leave it disabled
  and move on — optional items never block `complete`.
- If `doctor` keeps failing on a program install, show the exact error output and the fix for their
  OS; do not guess at alternative package managers.
