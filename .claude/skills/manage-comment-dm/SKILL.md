---
name: manage-comment-dm
description: Phase 11 of the Maestro Video Generator pipeline — OPTIONAL (config.manychat.enabled, default false). Runs at the END OF CREATION, right after Phase 10 (QC) and BEFORE the video is enqueued for posting. When the video shares a resource (a tool/repo/agent/skill/product/site with a URL — true for ~every video), create a fresh dedicated ManyChat automation so Instagram comments with the video's CTA keyword auto-DM the resource link, and set it LIVE before the video ever reaches the post-queue. Restores the saved ManyChat session, duplicates the master template, sets the keyword + link + follow-gate, goes live, and verifies. When ManyChat is disabled it stamps resource_cta.status="manual" instead. Triggers — "set up the comment-to-DM", "manychat automation for this video", "comment dm link", "configure manychat", run automatically at the end of every creation run when a resource is present (also invoked defensively by `/post-now` for queue entries whose resource_cta.status is neither live nor manual).
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: manage-comment-dm (Phase 11 — ManyChat Comment→DM, ARMED AT END OF CREATION)

## OPTIONAL-PHASE GATE — `config.manychat.enabled` (default `false`) — CHECK THIS FIRST
- **`false` → SKIP the automation entirely.** The CTA chosen in Phase 2 (keyword + resource link) stays
  in the caption; stamp `resource_cta.status = "manual"`
  (`python3 manychat-pipeline/set_resource_cta.py set-status --status manual`), advance to the mark-ready
  enqueue, and deliver the links by hand (or with any other tool). `assert-ready` and `/post-now` accept
  `status in {live, manual}`. Nothing below applies.
- **`true` → everything below applies**, and a hard ManyChat blocker HOLDS the build.

**Read `manychat-pipeline/MANYCHAT_INSTRUCTIONS.md` before acting — never execute from memory.**
**ORDER: this is the last gated step of the CREATION pipeline (`maestro-video-pipeline`) — right after
Phase 10 (QC) and BEFORE the mark-ready enqueue into `post-queue.jsonl`, well before `post-and-log`
(Phase 12).** The automation triggers on "any post or reel" account-wide — it does NOT need the reel to
exist yet, and all its inputs (keyword from Phase 2, link from Phase 4) are known well before this phase
runs. Arming + verifying it LIVE **before the video is even enqueued** guarantees the CTA is armed no
matter how long the video later sits in the post-queue, and that even the FIRST commenters get the
resource DM once it does post. It is a **REQUIRED** step for ~every video (house rule: no video ships
without a resource link) and a **hard gate on creation itself**: a blocker here HOLDS the build — the
video is never enqueued without a live CTA. `/post-now` also calls this skill, but only as a defensive
fallback for queue entries whose `resource_cta.status` is neither `"live"` nor `"manual"` — for any normal
build this phase has already run by the time the video reaches the queue.

**RUNS IN THE MAIN SESSION ONLY (`PIPELINE_DIRECTIVES.md` §12b).** Never delegate this phase to a
subagent (background or foreground): a subagent may lack the Playwright MCP tools and cannot share this
session's browser — a fully-built run was once lost exactly that way ("browser MCP tools unavailable"),
and two more were orphaned because their sessions ended the turn while a background Phase-11 subagent
was still working (§12a). Run ManyChat inline, in this turn, in this session.

## GATE (run or skip?)
Read it with the helper: `python3 manychat-pipeline/set_resource_cta.py show`.
- `resource_cta.enabled == true` → RUN. **This is the normal case for nearly every video** — Phase 2
  either uses the resource the video already hands over, or finds a perfect-fit one via mandatory web
  research. Do NOT post a video whose CTA isn't armed: run this and verify LIVE first.
- missing / `enabled == false` → **SKIP** only in the rare genuinely-impossible case (Phase 2 could
  not find ANY fitting resource even after exhaustive WebSearch — should be near-zero). If you hit a
  skip, it should already be the canonical `{enabled:false, status:"skipped"}` AND Phase 2 should have
  logged WHY loudly. If `resource_cta` is missing/empty but the video clearly describes something
  gettable, that's a Phase-2 miss — STOP and resolve the resource (Step 1 mandatory research) rather
  than silently skipping.

## INPUTS (from earlier phases)
- `resource_cta.keyword` — the UNIQUE accent-folded ASCII PRIMARY keyword chosen in Phase 2 (in `manychat-pipeline/keyword-ledger.json`).
- `resource_cta.keyword_variants` — **ALL spelling forms to register as ManyChat triggers** (accent-folded + accented + space-join). **You MUST add EVERY variant as a trigger keyword**, not just the primary. ManyChat matching is case-insensitive but NOT accent-insensitive, so a caption that says "Comenta GRÁTIS" gets comments typed both `GRÁTIS` and `gratis` — only registering both fires for both (a real run registered only `GRATIS` and never matched the accented comments). If the field is absent (older runs), derive it: `python3 -c "import importlib.util as u;s=u.spec_from_file_location('m','manychat-pipeline/set_resource_cta.py');m=u.module_from_spec(s);s.loader.exec_module(m);print(m.keyword_variants('<keyword as shown in caption>'))"`.
- `resource_cta.link` — the resource URL captured in Phase 4 (`capture-references`). May be empty → resolve below.
- `resource_cta.resource_name` / `resource_kind`.
- `resource_cta.opening_dm` — the composed OPENING DM (first message, names the resource — "Já separei o <NOME> pra você!"). `resource_cta.opening_name` is the phrase that fills its blank. Both written in Phase 2.
- `resource_cta.dm_message` — the composed LINK DM (after the follow gate).
- Saved session `.claude/auth/manychat-storage-state.json`; account `config.manychat.account_id`; master template `config.manychat.template_flow_id`.

## MODE — CREATE only (QCR-202)
**ALWAYS `create`** — build a FRESH DEDICATED automation per keyword (MANYCHAT_INSTRUCTIONS.md §B0/§B)
so multiple keywords run CONCURRENTLY, each with its own keyword-specific message + link + follow-gate,
then **RENAME it `[<KEYWORD>] Auto-DM links from comments`**. `MODE=create` (one automation per keyword)
is the only supported mode.

> **Never repurpose an existing automation for a new video.** Editing one shared automation per video
> overwrites the PREVIOUS video's keyword (so only the latest keyword stays live) and leaves a stale
> bracketed name — a row named for one keyword firing another. That is the exact defect QCR-202 exists to
> catch. **NEVER fall back to editing an old automation because create is fiddly.** The create path =
> **DUPLICATE THE MASTER TEMPLATE** (`config.manychat.template_flow_id` — the master TEMPLATE automation
> you create once, see MANYCHAT_INSTRUCTIONS §B0) via the list kebab / More Actions → Duplicate, then Edit
> only the keyword + opening DM + link-DM message + link URL, Update → Go live → Rename `[<NEWKEYWORD>]`.
> **The master template is the ONLY safe duplication source** — it carries the canonical content
> (opening-DM `[NOME DO RECURSO]` placeholder + the optional static extra bubble). **Do NOT duplicate an
> arbitrary older `[<KEYWORD>]` automation as a shortcut** — an older copy may lack the placeholder and/or
> the extra bubble, so the duplicate would silently drop them. (If you ever must duplicate a live
> automation instead of the template, you MUST confirm it already has the placeholder and — when
> `config.manychat.extra_bubble.enabled` — the extra bubble before relying on it.) If create genuinely
> cannot run (dead session / Cloudflare / 2FA), ESCALATE — do NOT stamp `status:"live"`.

## KEYWORD-SPECIFIC MESSAGE + FOLLOW-GATE
- **Opening DM NAMES the resource:** the FIRST message uses **`resource_cta.opening_dm`** ("Oiê!… // Já
  separei o <NOME> pra você!…") instead of the generic "o material". Set it during the build (Step 3) —
  see below. Never leave the generic opening DM when a resource is present.
- **OPTIONAL extra bubble (`config.manychat.extra_bubble`):** when enabled, the link-DM node carries a
  SECOND bubble after the resource — a static upsell/community invite (text + button + url from config).
  It is the SAME for every video, lives in the master template, and is inherited by every duplicate —
  **do NOT edit or remove it per post**, just leave it intact. Skip it entirely when disabled.
- **Message, not a bare link:** the link DM uses **`resource_cta.dm_message`** (composed by
  `set_resource_cta.py` from the resource name + `resource_blurb`, e.g. "Aqui está o repositório X que
  faz Y, como você pediu 👇") + the button → `resource_cta.link`. Never ship the generic placeholder text.
- **Follow-gate:** when `resource_cta.follow_gate` is `true` (default, `config.manychat.follow_gate`), CHECK
  the native box **"a DM asking to follow you before they get the link"** so non-followers are prompted to
  follow before the link is released. Verify the box is ON before Go Live.

## PROCEDURE

### Step 1 — Resolve the link (priority order) — WEB RESEARCH IS MANDATORY when not easily found
1. **User-provided** link for this run (if given) — highest priority.
2. **`resource_cta.link`** from Phase 4 capture-references (preferred default).
3. **MANDATORY web research — do NOT give up easily.** If the link is empty / a placeholder, you MUST
   research it until you find a real, accessible resource that fits the video PERFECTLY — not stop at the
   first failed guess:
   - Re-read `<downloads>/<Name>_script.txt` + `<scratch>/script_entities.json` to understand what
     the video DESCRIBES (the capability, tool, repo, agent, skill, product, or need it talks about).
   - `WebSearch` driven by **what the video describes** — the named tool, OR (if nothing is named) the
     exact capability/use-case the script promises. Iterate queries (synonyms, "github", "official
     site", the feature + "tool/repo/app") across multiple searches until a strong candidate appears.
   - **Fit gate:** the resource must match the script PERFECTLY — a viewer who comments expecting what
     the video promised should get exactly that. If the first candidate is only loosely related, keep
     researching for a better-fitting one. Prefer the official site / the exact repo / the product or
     landing page (same logic as `capture-references` step 1).
   - VERIFY by navigating to it (Playwright: real public page, no 404/login wall), then record:
     `python3 manychat-pipeline/set_resource_cta.py set-link --link "<url>" --source re-derived`.
   - If the video was enabled with a generic `resource_name`/`keyword` but research surfaces a more
     specific perfect-fit artifact, re-`enable` with the better name/kind (the keyword stays unless it
     no longer fits) so the DM message is accurate.
4. Only after genuinely-exhaustive research finds NOTHING fitting → set `resource_cta.status = "failed"`,
   log loudly with the queries tried, and ESCALATE to the user. **Because this step runs BEFORE posting,
   a hard failure here means HOLD the build** — do not ship a video whose promised resource link can't be
   delivered. (This should be near-zero: Phase 2 biases toward resource-bearing topics.)

Sanity-check the URL (`https://`, reachable). Keep the button label short ("Acessar agora" / "Quero
acessar" / a 1–2 word verb fitting the resource).

### Step 2 — Restore the ManyChat session (no login)
```bash
python3 manychat-pipeline/restore_session.py --check     # exit 0 = good; 2/3 = dead → STOP, ask the user to re-login + re-save
python3 manychat-pipeline/restore_session.py --snippet   # → paste into browser_run_code addCookies
```
Then `browser_navigate("https://app.manychat.com/<ACCOUNT_ID>/")` and confirm the account matches
`config.manychat.account_id` (`--check` prints it). If a login/Cloudflare wall appears → the session is
dead: fire `python3 post-pipeline/alert.py --platform manychat --run <Name> --reason "saved session dead"`,
STOP and ask the user to log in (they did it once; cookies last ~30d), then re-save with
`page.context().storageState()` filtered to manychat-only (see how the session was first saved).

### Step 3 — Build/edit the automation (keyword + custom message + link + follow-gate)
**HARD GATE (do this FIRST):** re-read `resource_cta` (`set_resource_cta.py show`). If `link` is empty,
a placeholder, or not an `https://…` URL, **ABORT** — go back to Step 1 to resolve it; set
`resource_cta.status="failed"` and escalate rather than ever clicking Go Live with an empty/placeholder
link. Confirm `keyword` AND `dm_message` are non-empty. Only proceed when keyword + https link + message exist.

**MODE=create (DEFAULT) — DUPLICATE the master TEMPLATE. Follow MANYCHAT_INSTRUCTIONS.md §B0:**
- **The duplication source is ONE specific Flow Builder automation** (kept DRAFT, never fires): the master
  template, flow id **`config.manychat.template_flow_id`**
  (`https://app.manychat.com/<ACCOUNT_ID>/cms/files/<TEMPLATE_FLOW_ID>/edit`).
- Open it → More Actions (⋮) → **Duplicate**. On the copy change ONLY: (a) trigger keyword `TEMPLATE` →
  **ALL of `resource_cta.keyword_variants`** (replace TEMPLATE with the first variant, then "+ Keyword"
  for each remaining one — e.g. `GRATIS` AND `GRÁTIS`; `VIDEO` AND `VÍDEO`). Never register only the
  primary, (b) the **"Yes"-branch link-DM**: fill its two placeholders **in place** —
  `[NOME DO RECURSO]` = name, `[o que ele faz]` = blurb — **keeping the blank lines between paragraphs**
  (the message is 3 paragraphs separated by `\n\n`; result == `resource_cta.dm_message`), (c) the
  `Acessar agora` button URL → `resource_cta.link`, (d) the **opening DM** (the FIRST Send Message, before
  the follow Condition): set its text to **`resource_cta.opening_dm`** so the opening message names the
  resource. If the template's opening DM has the `[NOME DO RECURSO]` placeholder, replace it in place;
  otherwise set the whole opening-DM text to `resource_cta.opening_dm` — **preserve the `\n\n`** between the
  greeting and the body. Then **Rename** `[<KEYWORD>] …` → **Set Live**.
  Change the keyword BEFORE Set Live. Record flow id + keyword via `set_resource_cta.py` + ledger.
- **PRESERVE LINE BREAKS (house rule):** all messages are multi-paragraph (`\n\n` between paragraphs;
  follow-gate has numbered steps on separate lines). Never collapse to one line — set the textarea value
  with the real newlines (`fill()` keeps `\n`). A real run once lost the link-DM paragraphs; don't repeat it.
- **Why Flow Builder:** the follow-gate uses a custom **`Estou Seguindo`** button (enforced re-check loop
  via a "Follows your account" Condition) — easy-builder can't relabel its English "Following" system
  button. Structure + canonical copy mirror: `automation-template.html`. To change copy for all future
  posts, edit the master template (future duplicates only).

**Build from scratch (fallback only) — follow MANYCHAT_INSTRUCTIONS.md §B:**
1. `browser_navigate(".../cms/easy-builder?campaign_type=easy_builder_cgt_next_post_multi_links")`.
2. Trigger = **any post or reel**; keyword = `resource_cta.keyword` (+ every variant); keep the 3 rotating PT-BR public replies.
3. Opening DM ON — set the message to **`resource_cta.opening_dm`** (names the resource; preserve the `\n\n`) + button "Quero Receber".
4. **Follow-gate:** if `resource_cta.follow_gate` → check **"a DM asking to follow you before they get the link"**.
5. **Link DM:** "Write a message" = `resource_cta.dm_message` (NOT the generic default) → Add a link →
   button "Acessar agora" + Link = `resource_cta.link` → Save.
5b. **Optional extra bubble (only when `config.manychat.extra_bubble.enabled`):** add a SECOND message/bubble
   after the link DM with `extra_bubble.text` (see MANYCHAT_INSTRUCTIONS.md canonical copy /
   `automation-template.html` `COMMUNITY_DM`) + button `extra_bubble.button_label` → `extra_bubble.url`.
   (The master-template duplication path gets this for free; the from-scratch path must add it manually.)
6. **Go Live** → record the new flow id: `set_resource_cta.py set-status --status live --flow-id <newId>` + ledger history.
7. **Rename the automation (REQUIRED):** in the Automations list, open the new row's kebab (⋮) → **Rename**
   → set the name to `[<KEYWORD>] Auto-DM links from comments` (e.g. `[MAESTRO] Auto-DM links from comments`)
   → **Rename**. The keyword MUST appear bracketed in the name so the list is scannable (every CGT row is
   otherwise the identical "Auto-DM links from comments").

### Step 4 — Verify (never fake green) — HARD GATE before stamping live (QCR-202)
- **NAME == KEYWORD (the gate that was missing):** in the **Automations LIST**, the row is named exactly
  `[<resource_cta.keyword>] Auto-DM links from comments` AND that SAME row's trigger keyword chips include
  the PRIMARY `resource_cta.keyword`. A NAME-vs-keyword MISMATCH (e.g. a row named `[ALPHA]` whose chip is
  `BETA`) means you edited/renamed the wrong thing — FIX it (rename or rebuild) before doing anything
  else. This is the exact defect QCR-202 exists to catch; it is NOT optional.
- **ALL VARIANTS PRESENT:** the row's trigger keyword chips include **every** form in
  `resource_cta.keyword_variants` (e.g. both `GRATIS` and `GRÁTIS`). A missing accent variant = the
  silent-miss bug — add it and re-Update before stamping live.
- Re-read the flow: keyword textbox shows `resource_cta.keyword`, status badge = **LIVE**, trigger = **any post or reel**.
- **Name:** the automation is named `[<KEYWORD>] Auto-DM links from comments` (bracketed keyword present in the Automations list).
- **Follow-gate is PT-BR + multi-line:** non-follower message reads `Falta só 1 coisa rápida pra liberar seu acesso 🙌` + the 3 numbered steps on separate lines + button `Estou Seguindo` — NOT English "Following".
- **"Visitar Perfil" URL == canonical `m.` (house rule):** the follow-gate "Visitar Perfil" button's "Open website" URL is EXACTLY `https://m.instagram.com/<your-handle>` (`config.manychat.instagram_handle`) — the `m.` mobile domain, NOT `www.`, NOT a `?igsh=…&utm_source=qr` QR link, NOT `instagram://`. It is inherited verbatim from the master template; if a duplicate ever shows anything else, fix it to the canonical `m.` URL before Go Live. **Do NOT "correct" it to `www.`** — that's intentional (the IG app intercepts `m.instagram.com/<user>` links to open the NATIVE profile; verified on-device). **Note:** on the web, `m.instagram.com` 301-redirects to `www.instagram.com`, so a link preview / desktop tap will SHOW `www.` after the redirect — that is expected and is NOT a defect (`curl -I` on the `m.` URL returns `301 → www`). The stored value must stay `m.`.
- **Link-DM keeps its 3 paragraphs** (blank lines between `Prontinho!…`, `Ele …`, `É só tocar…`) — not collapsed to one line.
- **Follow-gate:** the "a DM asking to follow you before they get the link" box is CHECKED (when `follow_gate`).
- **Opening DM names the resource:** the FIRST Send Message equals `resource_cta.opening_dm` ("Já separei o <NOME> pra você!") — NOT the generic "o material" — with its blank line intact.
- **Extra bubble present (only when `config.manychat.extra_bubble.enabled`):** the link-DM node has the SECOND bubble — `extra_bubble.text` + button `extra_bubble.button_label` → `extra_bubble.url`. If it's MISSING, you duplicated a stale source — REBUILD by duplicating the master template (which has it). Do NOT Go Live without it when it is enabled.
- **Custom message:** the link-DM "Write a message" text equals `resource_cta.dm_message` (not the generic placeholder).
- **Link:** reopen the link modal → URL equals `resource_cta.link` (not the previous run's link, not empty).
- **Multi-keyword (MODE=create):** confirm the PREVIOUS keyword's automation is STILL LIVE independently
  (Automation list) — proving keywords coexist. A mismatch on any of these = fix and re-Go-Live before done.

### Step 5 — Record
- **ONLY after the Step-4 NAME==KEYWORD hard gate passes**, set the run state → `resource_cta.status = "live"`, `link`, `link_source`, `manychat_flow_id` (the NEW dedicated flow id, never the template id) via `python3 manychat-pipeline/set_resource_cta.py set-status --status live --flow-id <newId>`. Stamping `status:"live"` without a verified dedicated `[<KEYWORD>]` LIVE row is the fake-green QCR-202 forbids.
- The keyword is ALREADY in `keyword-ledger.json` (reserved in Phase 2); if this skill picked/changed
  it, append/update the ledger `history` entry with {keyword, video, link, date}.
- Note the result in the `pipeline-log.csv` row (or a follow-up note): "comment→DM live, kw=<KW>, link=<url>".

## RULES
- Read MANYCHAT_INSTRUCTIONS.md first. $0 (subscription + Playwright).
- SESSION HYGIENE: the saved session lives only in `.claude/auth/manychat-storage-state.json`; to drop a
  session clear only the manychat cookies client-side; never click ManyChat "Log out".
- Keyword uniqueness is enforced in Phase 2; if you ever choose one here, it MUST NOT be in the ledger.
- **Order: this runs at the end of CREATION, before the video is even enqueued — well BEFORE Phase 12
  posting.** Arm + verify the automation LIVE first, THEN let the mark-ready step enqueue the video
  (posting happens later, separately, via `/post-now`). This step never POSTS the reel itself — but a
  hard failure here (dead session / unresolvable link) means **HOLD THE BUILD** (do not enqueue) and
  escalate, so the video never even reaches the post-queue without its CTA armed. When called
  defensively from `/post-now`, a failure there means HOLD THE POST (release back to `ready`) instead,
  since the video is already built.
- If the session is dead or the link can't be resolved after exhaustive research → escalate; do not fabricate
  a link or a "live" status, and do not let posting proceed without the CTA.

## DEPENDENCIES
- `manychat-pipeline/restore_session.py`, `manychat-pipeline/set_resource_cta.py`, `manychat-pipeline/keyword-ledger.json`,
  `manychat-pipeline/MANYCHAT_INSTRUCTIONS.md`, `manychat-pipeline/automation-template.html`.
- Playwright MCP (navigate / click / type / run_code). WebSearch (fallback link resolution).
- Saved session `.claude/auth/manychat-storage-state.json` (account `config.manychat.account_id`, IG channel `config.manychat.instagram_handle`).
- Alerts: `python3 post-pipeline/alert.py --platform manychat --run <Name> --reason "..."` (delivered per `config.notify.*`; always logged to `alerts.log`).

## PREFLIGHT — IG channel MUST match the posting account
Before Go Live, confirm ManyChat's connected Instagram channel (Settings → Instagram, `app.manychat.com/<ACCOUNT_ID>/settings#instagram`) equals the account Phase 12 posts the reel to — `config.posting.instagram_handle` (== `config.manychat.instagram_handle`). If they differ, the automation goes LIVE but catches ZERO comments (a real account once moved its reels to a new handle while ManyChat still watched the old one — a silent miss). On mismatch: STOP, re-point the channel (or fire `alert.py --platform manychat`), and do NOT report "live".
