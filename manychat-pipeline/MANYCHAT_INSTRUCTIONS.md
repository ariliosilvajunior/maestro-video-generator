# ManyChat Comment→DM Automation — Pipeline Spec (Phase 11 — ARMED AT END OF CREATION, before enqueue)

> **OPTIONAL PHASE — `config.manychat.enabled` (default `false`).** When `false`, the CTA is still chosen
> in Phase 2 (keyword + resource link) and written into the caption; the automation step is skipped and
> `resource_cta.status` is stamped `"manual"` — you deliver the links by hand (or with any other tool).
> When `true`, everything in this spec applies. `maestro_state.py assert-ready` and `/post-now` accept
> `status in {live, manual}`.

**What this does:** when a video's topic IS a specific shareable resource (a tool / repo / agent /
skill / product / site with a real URL), the pipeline creates a dedicated ManyChat automation so that
anyone who comments the video's CTA keyword on Instagram gets the resource **link sent to their DM
automatically**. Validated end-to-end via Playwright MCP.

---

## Per-post model is THE standard

**One automation per keyword (= per post) is the confirmed, intended model.** A fresh automation per
video is the right shape because followers have a reason to comment on every post. A consolidation
into a **single** automation that routes by the commented keyword was investigated in depth and is
**IMPOSSIBLE in ManyChat** — see `SINGLE_AUTOMATION_FINDINGS.md` (proofs: all triggers in one
automation share one flow; the comment text is not a branchable Condition field; the Keywords router
is DM-only, not comments). So `MODE=create` below is not just a default — it is the only model that
delivers a direct, specific link per comment keyword, and the only mode this pipeline supports.

**Canonical copy + buttons for every new automation** live in the interactive generator
**`automation-template.html`** (open it, fill name/keyword/link/blurb → copy each block straight
into ManyChat). The static copy there (public replies, opening DM, follow-gate ask, link-DM
message, button labels, the optional extra bubble) is the single source of truth for the per-post
automation; keep it in sync with `set_resource_cta._compose_dm`.

**Reliability checklist (make every per-post automation "work well"):**
0. **NAME = `[<KEYWORD>] Auto-DM links from comments` (REQUIRED).** Every automation's name MUST be
   prefixed with its keyword in brackets, e.g. `[MAESTRO] Auto-DM links from comments`. This makes the
   keyword visible at a glance in the Automations list (otherwise every row reads the identical
   "Auto-DM links from comments"). Set it right after Go-Live: Automations list → the row's kebab (⋮)
   → **Rename** → type `[<KEYWORD>] Auto-DM links from comments` → **Rename**.
1. **Unique keyword** — every automation fires on "any post or reel", so two automations sharing a
   keyword BOTH fire (a duplicated test keyword once double-fired on a real account). The keyword MUST
   be unique vs the ledger AND vs live automations. The generator checks the ledger list; before
   Go-Live also eyeball the live Automation list.
2. **Follow-gate ON** + opening DM (button) → link DM (URL button). Never ship a bare link.
3. **IG channel must equal the account the pipeline posts Reels to** (`config.manychat.instagram_handle`
   == `config.posting.instagram_handle`) — else comments are missed silently.
4. **Bound the clutter** — periodically Stop/Trash comment-DM automations older than ~30 days
   (the comment surge is over by then). Run `python3 manychat-pipeline/cleanup_old_automations.py`
   (dry-run planner; emits the keywords to trash + the confirmed bulk-select clickpath). Execute the
   trash in the MCP browser under confirmation (trashed automations are recoverable from ManyChat trash).
5. **Ledger discipline** — only write keywords via `set_resource_cta.py` (never hand-edit the JSON).
   A retired automation keeps its keyword reserved in `used_keywords` (never reuse a keyword, even
   after trashing — old posts still carry it).

## Account & target

| Key | Value |
|-----|-------|
| ManyChat account | `config.manychat.account_id` (`<MANYCHAT_ACCOUNT_ID>` — the id in your `app.manychat.com/<ACCOUNT_ID>/…` URLs; a ManyChat PRO subscription is what this feature runs on) |
| Instagram channel | `config.manychat.instagram_handle` — the SAME Instagram account the pipeline posts Reels to (`config.posting.instagram_handle`). The automation's "any post or reel" therefore catches comments on the exact reels you publish. **FOOTGUN (must stay aligned):** the ManyChat IG channel MUST equal the account Phase 12 (`post-and-log`) posts to. If IG posting ever moves to a DIFFERENT account, this automation silently stops catching comments — re-point ManyChat's IG channel (Settings → Instagram) to the new account FIRST. (A real account once posted reels to a new handle while ManyChat still watched the old one — a silent miss until the channel was re-pointed.) |
| Login method | Google/Facebook SSO (saved session). Cloudflare "verify you are human" appears on the login page only; the saved session skips it. |
| Saved session | `.claude/auth/manychat-storage-state.json` (ManyChat-only cookies; ~30-day expiry on `mc_production-main` → re-login ~monthly). |
| Restore helper | `python3 manychat-pipeline/restore_session.py [--check\|--snippet]` (prints the account from config) |
| **Session hygiene (CRITICAL)** | The saved session lives ONLY in this repo's `.claude/auth/manychat-storage-state.json`. **Never click ManyChat "Log out"** (it can invalidate the server-side session token). To drop a session, clear ONLY the manychat cookies client-side (`context.clearCookies({domain:/manychat/i})`). |

## Concurrency model — `MODE=create` is the ONLY mode

**Each keyword gets its OWN live automation**, so multiple videos' CTAs work **concurrently** and the
DM response is **keyword-specific** (routed by whichever keyword the commenter typed). Editing one
shared automation per video could only keep ONE keyword live at a time, which is incompatible with
the per-keyword custom message + multi-keyword requirement — it is not supported.

| Key | Value |
|-----|-------|
| Template type | "Auto-DM links from comments" (`easy_builder_cgt_next_post_multi_links`) |
| Trigger scope | **any post or reel** (so it never depends on the scheduled reel being live yet) |
| Structure (per keyword) | comment keyword → public reply (rotated, PT-BR) → **opening DM** + button "Quero Receber" → **FOLLOW-GATE** ("a DM asking to follow you before they get the link") → **link DM** = the resource-specific message (`resource_cta.dm_message`, e.g. "aqui está o repositório X que faz Y…") + button "Acessar agora" → the link. Opening DM is REQUIRED by Meta before a link can be sent; the follow-gate is a NATIVE ManyChat checkbox that checks follower status and prompts non-followers to follow first. |
| Per run | Phase 11 **creates a fresh automation** (clickpath B0 — duplicate the master template) with this run's keyword + custom message + link + follow-gate, then **Go Live** — BEFORE the Phase-12 post. Records the new flow id in `resource_cta.manychat_flow_id`. |

- **`MODE=create`:** one automation per keyword → keywords coexist; each replies with its own
  `dm_message` + link. Unique keywords (ledger) guarantee no cross-routing. This is what "validate more
  than 1 keyword" exercises. There is no other mode.

---

## Data contract — `pipeline-state.json` → `resource_cta`

```json
"resource_cta": {
  "enabled": true,
  "resource_name": "Claude Code",
  "resource_kind": "tool|repo|agent|skill|product|site",
  "keyword": "CODE",
  "link": "https://github.com/anthropics/claude-code",
  "link_source": "capture-references|owner|re-derived",
  "resource_blurb": "deixa a IA programar sozinha no seu terminal",
  "dm_message": "Aqui está o ferramenta Claude Code 🎁 — deixa a IA programar sozinha no seu terminal, como você pediu. É só tocar no botão aqui embaixo pra acessar 👇",
  "follow_gate": true,
  "mode": "create",
  "manychat_flow_id": "<config.manychat.template_flow_id until Phase 11 mints the dedicated per-keyword id>",
  "status": "pending|live|manual|skipped|failed"
}
```
- **`resource_blurb`** (Phase 2): PT-BR "what it does" (Y) — feeds the composed `dm_message`.
- **`dm_message`** (auto-composed by `set_resource_cta.py`, or `--dm-message` override): the KEYWORD-SPECIFIC
  link-DM text the automation sends, NOT a bare link.
- **`follow_gate`** (default `true`, from `config.manychat.follow_gate`): require the commenter to FOLLOW
  before the link is released (native ManyChat follow-gate — checks follower status, prompts
  non-followers first).
- **`mode`** is always `create` = one live automation per keyword (concurrent). `manychat_flow_id` starts
  as the template id (`config.manychat.template_flow_id`) and is overwritten with the freshly-minted
  dedicated id in Phase 11.
- **`status`**: `pending` → `live` (automation verified LIVE) | `manual` (ManyChat disabled in config —
  the CTA is in the caption, links delivered by hand) | `skipped` (no resource) | `failed`.

- **`enabled`** is set in **Phase 2** and is **effectively ALWAYS `true`** (house rule: no video ships
  without a resource link). The **GET-TEST** classifies what the video naturally hands over (a discrete
  gettable artifact = repo/tool/CLI/agent/skill/template/app/product/landing page/free download/guide).
  **If the video does NOT already name a gettable artifact** (a platform feature, a merely-discussed
  company, an opinion/news/concept piece), Phase 2 MUST run **mandatory web research** driven by what
  the video DESCRIBES and keep going until it finds a REAL, accessible resource that fits the script
  PERFECTLY — then enable the CTA with that. `enabled:false` (`disable`) is reserved for the rare
  genuinely-impossible case and MUST be logged loudly. **DECOUPLED FROM SCREENSHOTS:** naming a real
  entity makes `reference_capture` true (Phase 4 screenshots) — that is a separate decision; the CTA
  resource may instead be a researched perfect-fit artifact. Because the CTA is settled in **Phase 11,
  at the end of creation, BEFORE the video is even enqueued for the Phase-12 post**, a
  missing/unresolvable resource **HOLDS THE BUILD** rather than shipping a video with no link — with
  or without ManyChat (the caption needs the keyword + link either way).
- **Write it with the helper, never by hand:** `python3 manychat-pipeline/set_resource_cta.py
  enable|disable|set-link|check-keyword|set-status|show` — stamps `resource_cta` into the run state AND
  reserves the keyword in the ledger atomically (refuses collisions/malformed keywords). Canonical shapes:
  enabled object above; disabled = `{enabled:false, status:"skipped"}`.
- **`keyword`** chosen in **Phase 2**, reserved by the helper (`used_keywords` exact-match,
  case-insensitive, accent/spacing-folded). MUST be unused.
- **`link`** filled in **Phase 4** by `capture-references` calling `set_resource_cta.py set-link
  --source capture-references` (it already navigates to the resource's canonical URL to screenshot it);
  Phase 2 may pre-fill `--link` if the seed already carries the URL. Fallback order in Phase 11
  (`manage-comment-dm` Step 1): **user-provided → Phase-4 capture URL → MANDATORY web research**
  (re-read script, WebSearch driven by what the video describes until a perfect-fit resource is found,
  verify by navigating). If none resolves after exhaustive research → `status:failed`, log loudly, and
  **HOLD THE BUILD** + escalate (the CTA is settled before the video is even enqueued, so it must not
  reach the post-queue without it).

---

## Where it sits in the pipeline (ARMED AT END OF CREATION, before enqueue)

```
Phase 2      write-script-ptbr    → pick UNIQUE keyword, embed CTA in script, stamp resource_cta(enabled,name,kind,keyword), reserve keyword in ledger
                                     (resource is found via mandatory web research when not already named — every video ships one)
Phase 4      capture-references   → resource_cta.link = canonical URL it screenshotted (+ link_source)
Phase 11     manage-comment-dm    → END OF CREATION, before enqueue: restore cookies → CREATE dedicated automation → set keyword+link+follow-gate → Go Live → verify → stamp status=live
                                     (config.manychat.enabled = false → skip the automation, stamp status=manual)
mark-ready   post_queue.py add    → enqueue into post-queue.jsonl, resource_cta.status already "live" (or "manual")
[later, via  post-and-log         → publish reel; IG caption MUST include "Comenta '<KEYWORD>' ..." (the automation has been live since Phase 11, so the first commenters get the DM)
 /post-now]  (Phase 12)
```

**Phase 11 (ManyChat) runs at the END OF CREATION (`maestro-video-pipeline`), BEFORE the video is
enqueued and well before Phase 12 (posting).** Rationale: the automation triggers on **"any post or
reel"** account-wide, so it does NOT depend on the new reel being live — and all its inputs are known
well before this phase runs (keyword from Phase 2, link from Phase 4, the resource itself found via
Phase-2 mandatory research). Arming + verifying it LIVE before the video is even enqueued guarantees
the comment→DM is already running whenever the reel eventually publishes, so **even the first comments
get the resource link**. When `config.manychat.enabled` is `true`, a hard ManyChat blocker (dead
session / unresolvable link) therefore **HOLDS THE BUILD** — the video never gets enqueued without its
CTA armed. When it is `false`, the phase stamps `status="manual"` and the build proceeds. `/post-now`
re-checks `resource_cta.status` defensively and only re-runs this phase when the status is neither
`live` nor `manual` (see `.claude/skills/post-now/SKILL.md` Step 3).

---

## BLANK-PAGE BLOCKER — DO NOT GIVE UP (QCR-202 follow-up)

A real run once reported "automation-list + editor iframe rendered BLANK in this session (blocked
resources)" and STOPPED without finishing. **That was a false blocker.** In a Playwright/MCP session
the **`/automation/flows` fresh page-load route renders blank** (its bootstrap request returns
`net::ERR_BLOCKED_…`), but **every other surface works if you reach it by CLIENT-SIDE navigation
instead of a fresh `goto`:**

1. `browser_navigate("…/<ACCOUNT_ID>/dashboard")` — the dashboard renders fine and confirms the account.
2. Click the **Automation** left-menu item (`[data-test-id="cms"]`) — this client-side-routes to
   `/cms?path=/…` (the "My Automations" list), which **renders correctly** (the `/cms` route works;
   only `/automation/flows` is blank).
3. To open a flow's editor, **click the row's anchor client-side** (the card overlay anchor
   `a._card__mainActionButton…` intercepts pointer events, so `.click()` may time out — instead do
   `page.evaluate(() => document.querySelector('a[href="/<ACCOUNT_ID>/cms/files/<id>"]').click())`). The
   Flow Builder canvas (react-pixi) then renders fully — trigger, opening DM, Condition, link DM,
   follow-gate are all editable.
4. The message body is a real `<textarea>` — set it React-safely with the native value setter +
   `input`/`change` events (`Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set`).
   **Do NOT** add a "type a space then Backspace" keystroke to "force a commit" — it lands at the
   cursor and corrupted the `\n\n` paragraph break (left `.\n \n`). The native setter + events is
   sufficient; re-set the full clean value if you must.

So: a blank `/automation/flows` is NOT a dead session and NOT a hard blocker. Verify the session is
alive via the dashboard, then drive everything through `/cms` + client-side row clicks. Escalate only
if the dashboard itself won't render or a login/Cloudflare/2FA wall appears.

## Validated Playwright clickpath

### A) EDIT an existing easy-builder automation (fixing a keyword/link on one of YOUR per-keyword automations — never to repurpose one for a new video)
1. `restore_session.py --snippet` → `browser_run_code` addCookies. Verify with `--check` (exit 0).
2. `browser_navigate("https://app.manychat.com/<ACCOUNT_ID>/cms/easy-builder/<flowId>")`.
3. Click **Edit** (`getByRole('button',{name:'Edit'})`). All fields become editable at once.
4. **Keyword:** `getByRole('textbox',{name:'Enter a word or multiple'}).fill('<KEYWORD>')`.
5. **Link:** click the existing link chip (the current button label, e.g. "Acessar agora") → the
   link modal (`[data-test-id="dm-link-modal"]`) opens pre-filled →
   set `getByRole('textbox',{name:'Link'}).fill('<URL>')` (and Button label if needed) → **Save**.
6. Click **Update** (`getByRole('button',{name:'Update'})`). Toast: "Your changes were saved".
7. If the flow shows **STOPPED**, click **Go live** (`getByRole('button',{name:'Go live'})`). Toast:
   "Your automation is live".
8. **Verify:** re-read — keyword textbox shows `<KEYWORD>`, status badge shows **LIVE**.

Editing an automation that belongs to a PREVIOUS video to reuse it for a new one is FORBIDDEN (QCR-202):
it overwrites the previous keyword and leaves a stale bracketed name — a row named for one keyword
firing another. New video = new automation (B0).

### B0) DUPLICATE the master TEMPLATE — THE method

**THE single duplication source (the "template") is a Flow Builder automation you create ONCE and keep
as a DRAFT — DUPLICATE IT for every new post. Do NOT build from scratch per post and do NOT duplicate a
random live one.**

| Key | Value |
|-----|-------|
| Master template | a Flow Builder automation named e.g. **`⭐ TEMPLATE — Auto-DM (DUPLICAR p/ cada post · NÃO PUBLICAR)`** |
| Flow id | `config.manychat.template_flow_id` (kept **DRAFT** — never publishes; it only exists to be duplicated) |
| Edit/open URL | `https://app.manychat.com/<ACCOUNT_ID>/cms/files/<TEMPLATE_FLOW_ID>/edit` |
| Why Flow Builder | the enforced follow-gate uses a **custom "Estou Seguindo" button** — impossible in easy-builder, whose follow button is a fixed English "Following" system label. |
| Structure | trigger (any post/reel, keyword) → opening DM (`Quero Receber`) → **Condition: Follows your account?** → **Yes** → link DM (`Acessar agora` → URL) [+ the OPTIONAL extra bubble] · **No** → follow-gate DM + **`Estou Seguindo`** button → loops back to the Condition (re-checks; link is released only once they actually follow). |
| Follow-gate "Visitar Perfil" button URL | **`https://m.instagram.com/<your-handle>`** (`config.manychat.instagram_handle`). Use the **`m.instagram.com`** mobile-domain form, NOT `www.instagram.com/...?igsh=…&utm_source=qr` (a QR-share link that only opens IG's in-app **browser** webview). The `m.` mobile domain is handed off to the **native profile screen** inside the app (verified on-device). Keep it `https://` (so desktop still works); do NOT "fix" it back to a www/QR link or to the `instagram://` scheme (which silently no-ops on some devices + fully fails on desktop). Lives only in the master-template flow → per-post duplicates inherit it automatically. **⚠️ Expected-not-a-bug (`curl -I`): `m.instagram.com` is a deprecated subdomain that 301-redirects to `www.instagram.com` on the WEB.** So a link preview / desktop tap will display `www.` AFTER the redirect even though the stored button is `m.` — that is NOT a misconfiguration, do not re-"fix" it. The IG app intercepts the `m.` link first → native profile (the reason `m.` is chosen). |

**Build the master template ONCE (setup):** New Automation → **Start From Scratch** → **Start from a
blank canvas** (clickpath + selectors in `SINGLE_AUTOMATION_FINDINGS.md` → "Reference: exact Flow
Builder clickpath"). Trigger = Instagram → Post or Reel Comments → **All Posts or Reels** → keyword
`TEMPLATE` → the 3 rotating public replies. Then the structure above with the **Canonical PT-BR copy**
below (generate every block with `automation-template.html`): opening DM with the `[NOME DO RECURSO]`
placeholder + `Quero Receber` (Instagram → next step) → Condition "Follows your account" → Yes: the
3-paragraph link DM with `[NOME DO RECURSO]` / `[o que ele faz]` placeholders + `Acessar agora` (Open
website → a placeholder URL) [+ the optional extra bubble, if `config.manychat.extra_bubble.enabled`]
· No: the follow-gate DM + `Visitar Perfil` (Open website → `https://m.instagram.com/<your-handle>`)
+ `Estou Seguindo` (Instagram → back to the Condition). Save, **leave it DRAFT/STOPPED — never Set
Live** — and put its flow id (from the `/cms/files/<id>/edit` URL) into `config.manychat.template_flow_id`.

**Per-post steps:**
1. Restore session (`restore_session.py`); confirm IG channel == the posting account (`config.posting.instagram_handle`).
2. Open the master template (URL above) → **More Actions (⋮) → Duplicate** (or the list kebab → Duplicate).
3. On the copy, change ONLY these per-post fields (everything else is canonical, leave as-is):
   (a) **trigger keyword(s)** `TEMPLATE` → **ALL of `resource_cta.keyword_variants`** — replace TEMPLATE
       with the first, then "+ Keyword" for each remaining variant. Normally TWO chips when the caption word
       has an accent: the ASCII fold AND the accented form (`GRATIS`+`GRÁTIS`, `VIDEO`+`VÍDEO`). ManyChat is
       case-insensitive but NOT accent-insensitive, so a no-accent comment misses an accent-only keyword
       (a real run registered only the accented form and silently missed every `gratis` comment). Check the
       ledger first — never reuse the keyword or any variant;
   (b) **link-DM text** (the "Yes" branch Send Message — a 3-paragraph message with BLANK LINES between
       paragraphs): fill the two placeholders **in place, leaving the blank lines intact** — `[NOME DO RECURSO]`
       = resource name, `[o que ele faz]` = blurb (verb phrase completing "Ele ___"). Do NOT retype the whole
       message or collapse the paragraphs. The filled result == `resource_cta.dm_message` (`set_resource_cta._compose_dm`,
       which already carries the `\n\n`). **Preserving the blank-line paragraph breaks is REQUIRED.**
   (c) **link button URL** (`Acessar agora` → the template's placeholder URL) → the real link.
   (d) **opening-DM text** (the FIRST Send Message, sent before the follow Condition): set it to
       **`resource_cta.opening_dm`** so the opening message NAMES the resource ("Já separei o <NOME> pra
       você!"). Preferred = replace the `[NOME DO RECURSO]` placeholder **in place**, keeping the blank line
       between the greeting and the body. (If your duplicated copy predates the placeholder — its opening DM
       still says "o material" — set the WHOLE opening-DM text to `resource_cta.opening_dm`, preserving the
       `\n\n`. Either way the result must equal `resource_cta.opening_dm`.)
   The follow-gate text, the `Estou Seguindo`/`Quero Receber` buttons, the Condition, the 3
   PT-BR public replies, AND the **optional extra bubble** (`config.manychat.extra_bubble` — the static
   upsell/community block that follows the link DM, when enabled; same for every video) all carry over
   identical — DON'T touch them.
4. **Rename** (breadcrumb pencil or list kebab → Rename) → `[<KEYWORD>] Auto-DM links from comments`.
5. **Set Live** (the template was DRAFT; the copy must be published).
6. Record flow id + keyword via `set_resource_cta.py set-status --status live --flow-id <newId>` (+ ledger history). Verify keyword/link/LIVE/name.
   ⚠️ Change the keyword in step 3a BEFORE Set Live, or the copy keeps `TEMPLATE` — harmless (the master
   never fires) but wrong. Never reuse a live keyword (collision: both fire).

**To change copy for ALL future posts:** edit the master template itself (URL above) — edits apply to
*future* duplicates only; already-created automations are independent copies and don't change.
The version-controlled mirror of this copy is `automation-template.html` — keep them in sync.

> **The master template's opening DM carries the `[NOME DO RECURSO]` placeholder.** It reads `Oiê! Que
> alegria te ver por aqui 😊 // Já separei o [NOME DO RECURSO] pra você! Agora é só tocar no botão aqui
> embaixo para receber ⚡` (== `_compose_opening_dm("[NOME DO RECURSO]")`). So every duplicate inherits the
> placeholder → per-post step 3(d) is a simple **in-place fill** (`[NOME DO RECURSO]` →
> `resource_cta.opening_name`), exactly like the link DM. The template stays STOPPED/DRAFT (never
> published). The full-text-set path in step 3(d) remains the fallback for a duplicate whose opening DM
> lacks the placeholder.

### B) CREATE a fresh automation from scratch (fallback when there's nothing to duplicate)
1. Restore cookies (as above). Confirm the connected IG channel == the posting account (preflight).
2. `browser_navigate("https://app.manychat.com/<ACCOUNT_ID>/cms/easy-builder?campaign_type=easy_builder_cgt_next_post_multi_links")`.
3. **Post step:** select radio **"any post or reel"** → **Next** (or it may be a single editable form — set each region inline).
4. **Comments step:** `fill('Enter a word or multiple', resource_cta.keyword)` → check **"reply to their
   comments under the post"** → set the 3 rotating PT-BR public replies (defaults below).
5. **Opening DM:** keep **"an opening DM"** ON → set the message to **`resource_cta.opening_dm`** (it NAMES
   the resource — "Já separei o <NOME> pra você!"; preserve the `\n\n`) + button label "Quero Receber".
6. **FOLLOW-GATE:** when `resource_cta.follow_gate` is `true`, CHECK the box
   **"a DM asking to follow you before they get the link"** (`getByText('a DM asking to follow you before they get the link')`
   → its sibling `checkbox`). This makes ManyChat verify follower status and prompt non-followers to follow
   FIRST; only followers get the link. Set its PT-BR ask copy if editable (default below).
7. **Link DM:** set "Write a message" = **`resource_cta.dm_message`** (the keyword-specific text, e.g. "Aqui
   está o repositório X que faz Y…") → **Add a link** / click the link chip → Button label "Acessar agora" +
   Link = `resource_cta.link` → **Save**.
7b. **Optional extra bubble:** when `config.manychat.extra_bubble.enabled`, add a SECOND message/bubble after
   the link DM with `extra_bubble.text` + button `extra_bubble.button_label` → `extra_bubble.url` (the
   master-template duplication path gets this for free; the from-scratch path must add it manually).
8. **Go Live** (top-right). It mints a new flow id at `/cms/easy-builder/<newId>` — record it into
   `resource_cta.manychat_flow_id` via the helper, and append the ledger history entry.
8b. **Rename the automation (REQUIRED):** Automations list → the new row's kebab (⋮) → **Rename** →
   `[<KEYWORD>] Auto-DM links from comments` → **Rename**. Verify the row shows the bracketed keyword.
9. **Verify:** re-open → keyword == `resource_cta.keyword`, follow-gate checkbox ON, link-DM text ==
   `dm_message`, link == `resource_cta.link`, status **LIVE**. Each prior keyword's automation stays live
   independently (confirm the previous one is still LIVE = multi-keyword works).

### Canonical PT-BR copy — the master template (`config.manychat.template_flow_id`) is the source of truth. Mirror in `automation-template.html` + `set_resource_cta._compose_dm`.
**FORMATTING RULE (house rule):** the messages are MULTI-PARAGRAPH — paragraphs are separated by a BLANK
LINE (`\n\n`), and the follow-gate has numbered steps on their own lines (`\n`). These breaks ARE the
copy. When writing into ManyChat, preserve them (set the textarea value WITH the real newlines —
`fill()` keeps `\n`; never collapse to one line). A real run once delivered the link-DM as a single
run-on line because the breaks were dropped. (Below, ` / ` marks a line break, ` // ` marks a blank-line
paragraph break.)
- Public replies (rotated): `Te enviei no direct! 📩` · `Já mandei no seu direct! 👀` · `Olha lá no seu direct! ✅`
- Opening DM (NAMES THE RESOURCE): `Oiê! Que alegria te ver por aqui 😊 // Já separei o [NOME DO RECURSO] pra você! Agora é só tocar no botão aqui embaixo para receber ⚡` + button `Quero Receber`. Per post, fill `[NOME DO RECURSO]` **in place** (keep the blank line) = `resource_cta.opening_name` (an agent-authored phrase naming the resource, from understanding the script + resource purpose; defaults to the resource name). The filled result == `resource_cta.opening_dm` (`set_resource_cta._compose_opening_dm`). **No-resource fallback** (rare): `Oiê! Que alegria te ver por aqui 😊 // Já separei o material pra você! Agora é só tocar no botão aqui embaixo para receber o que pediu ⚡` (byte-identical to the generic copy).
- **Follow-gate** (non-follower branch; custom button — NOT ManyChat's English "Following"): `Falta só 1 coisa rápida pra liberar seu acesso 🙌 // 1️⃣ Visite nosso Instagram / 2️⃣ Clique em Seguir/Follow / 3️⃣ Volte e clique em "Estou Seguindo"` + button `Estou Seguindo` (loops back to the Follows-account check) + button `Visitar Perfil` → `https://m.instagram.com/<your-handle>`.
- Link DM (Yes branch): `Prontinho! Aqui está o [NOME DO RECURSO] 🎁 // Ele [o que ele faz]. // É só tocar no botão aqui embaixo pra acessar 👇` + button `Acessar agora` → `<resource link>`. Per post, fill the placeholders **in place** (keep the blank lines): `[NOME DO RECURSO]` = resource name, `[o que ele faz]` = blurb (verb phrase). Equals `set_resource_cta._compose_dm` (which already includes the `\n\n`).
- **OPTIONAL extra bubble (`config.manychat.extra_bubble` — STATIC, follows the link DM in the SAME "Send Message #1" node, second bubble).** Right after the resource bubble, a second text block + button can invite them to your community / product / offer. **It is constant for every video** (no placeholders, no per-post edit), lives in the master template, and is inherited by every duplicate — do NOT touch it per post. Text/button/url come from config (`extra_bubble.text`, `extra_bubble.button_label`, `extra_bubble.url`); skip the bubble entirely when `extra_bubble.enabled` is `false`. Generic shape (mirrored by `automation-template.html`):
  > `Ah, e quero fazer um convite especial para você 😁 // [Descreva aqui o seu produto/comunidade em 3–5 linhas.] // Se quiser saber mais, clique abaixo 👇`
  + button **`Quero saber mais`** → `https://example.com/sua-oferta` (put your real URL, with attribution parameters if you use them, in `extra_bubble.url`).

> **Follow-confirm button?** The easy-builder follow-gate is **message-only — there is NO "I followed" button** (and none can be added in easy-builder). ManyChat auto-detects the follow and releases the link; the opening-DM button can also be re-tapped to re-check — which is why the canonical copy says "toca de novo no botão". A true dedicated button requires the Flow Builder template (B0) — the reason the pipeline's master template is a Flow Builder automation.

---

## Selectors / refs that proved stable
- New Automation button: `[data-test-id="create-automation-button"]` (text "New Automation").
- Easy-builder is a 3-step form (Post → Comments → DM) with a right-side phone Preview; tabs Post/Comments/DM.
- Keyword input: role `textbox` name "Enter a word or multiple".
- Public-reply toggle: role `checkbox` name "reply to their comments under the post"; reply inputs are
  `triggers.widgets.<id>.feed_comment_welcome.public_reply_messages.{0,1,2}`.
- Opening-DM button label: `[data-test-id="optional-opening-dm-button"]`.
- Link modal: `[data-test-id="dm-link-modal"]` with role-textbox "Button label" + "Link", buttons Cancel/Save (Delete link when editing).
- Live controls: Edit / Stop / Go live + More Actions (`[data-test-id="other-actions-menu"]` → only "Delete" on easy-builder flows; no Clone — so an easy-builder create = build-from-scratch (B); Flow Builder flows offer Duplicate (B0)).
- Cookie consent on login page: dismiss with role-button "Accept all".

## RULES
- $0 (subscription + Playwright). Never log into ManyChat headlessly past Cloudflare/2FA — if the
  saved session is dead (`--check` ≠ 0), STOP and ask the user to re-login, then re-save the session.
- The saved session lives only in this repo's auth file; never click ManyChat "Log out" (see Account & target).
- Keyword MUST be unique (ledger). Append it on use.
- Verify LIVE + keyword read-back before declaring done. Never fake green.
