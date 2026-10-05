# ManyChat Comment→DM — Can it be ONE automation? (Findings)

**Question asked:** consolidate all comment-keyword automations into **one single automation**
that "uses filters depending on the commented keyword" to deliver a different link per keyword.

**Verdict: NOT POSSIBLE in ManyChat.** A single automation cannot deliver *different links
based on which COMMENT keyword* a user typed. This is a hard product limitation, proven three
independent ways below (read-only inspection of a live ManyChat account via Playwright). No running
automation was modified.

---

## Why it's impossible (3 independent proofs)

### Proof 1 — All triggers in one automation share ONE flow
In the new Flow Builder, an automation = a **single trigger group ("When…") → one "Then" → one
flow**. Adding a second trigger (via "+ New Trigger" or blue "+" → Starting Step → Trigger)
drops it into the **same** group, funneling into the **same** "Then". Verified live: a draft
with two keyword triggers (`#24 (keyword KEYWORD-A)` + `#25 (keyword KEYWORD-B)`) produced **one**
"Then" edge into **one** Send-Message chain. Clicking an individual trigger exposes only its own
settings (post, keyword, public reply) — there is **no per-trigger "next step."** So every
keyword that triggers the automation runs the **identical** content → cannot send different links.

### Proof 2 — The comment text/keyword is NOT a branchable field
A `Condition` node can branch only on fields offered by the field picker:
- **Recommended:** Tag, Email, **Follows your account** (← this is the only follow-gate primitive).
- **System Fields:** `Last Reply Type`, `Last Interaction`, `Last Seen` (+ name/locale/etc.).
- **Custom User Fields.**

Searching the picker for `comment`, `keyword`, `input`, `last` returns **no** field carrying the
triggering comment's text. So a single "any comment" trigger + a Condition router **cannot** read
"which keyword did they type" and branch on it.

### Proof 3 — The "Keywords" router is DM-only, not comments
ManyChat's **Keywords** page (Automation → Keywords) is the one surface that maps *many keywords →
many different "Send" flows* in one place. But every rule type is a **Message** rule:
`Message is / Message contains / Message contains whole word / Message begins with / Message is
thumbs up / Message doesn't contain`. There is **no "comment" rule type** — Keywords triggers only
on **incoming DMs**, never on post/reel comments. Comment→DM requires the Comment Growth Tool,
which is one-keyword-per-automation.

**Net:** comments can only be routed to different links by having **one automation per keyword**
(the pipeline's model), because (a) triggers can't fork to different content and (b) nothing inside
the flow knows which keyword fired.

---

## Viable alternatives (pick one)

### Option A — Keep one automation PER keyword (the pipeline's model) + add lifecycle hygiene  ⭐ default
The only way comments deliver a *direct, specific* link per keyword. Keep the proven per-keyword
structure (public reply → opening DM → **follow-gate** → link DM with the "Acessar agora" button) and
the proven clickpaths. Fix the two weaknesses: dedupe keywords against **live automations** (not just
the ledger) before Go-Live, and add a cleanup step that Stops/Trashes comment-DM automations older
than ~30 days so the list stays bounded (`cleanup_old_automations.py` plans it). Pro: zero UX change,
fault-isolated. Con: many automation objects (mitigated by cleanup).

### Option B — ONE evergreen automation + a "hub" link  (true single automation)
One permanent comment automation with a **single evergreen keyword** (e.g. `QUERO`). Its DM always
sends the **same link to a hub page** (Linktree / a `/recursos` landing page) that lists every
resource. Per-video maintenance = update the **hub page** (outside ManyChat); the ManyChat
automation never changes. Pro: genuinely one automation, near-zero ManyChat upkeep. Con: one extra
click for the user (hub → resource), the direct-link UX is lost, and every caption must use the
same keyword.

### Option C — Generic comment automation + the Keywords DM-router  (one place for mappings)
One generic comment automation whose opening DM says "responde a palavra X aqui no direct". The
**Keywords** page then holds all `keyword → link` rules in one list and delivers on the DM reply.
Pro: all mappings live in one place (the Keywords list). Con: adds DM-reply friction (two user
steps), and the comment itself still can't deliver the link.

### (Rejected) Menu automation
One automation whose opening DM shows a button menu of ALL resources. It's one automation, but the
user must pick from a menu instead of getting the exact thing they asked for, and the menu grows
unmanageably with every video. Not recommended.

**Recommendation:** **Option A** for unchanged UX (direct links) + bounded clutter, or **Option B**
if a true single automation is the priority and a hub-link click is acceptable. Option C only if
you specifically want all mappings in one editable list.

---

## Reference: exact Flow Builder clickpath discovered (for whichever path needs it)

- New Automation → **Start From Scratch** → **Start from a blank canvas** → `…/cms/files/<id>/edit`.
- Trigger: blank "When…" → **+ New Trigger** → **Instagram → Post or Reel Comments** →
  Step 1 **All Posts or Reels** → Continue → Step 2 **Specific Keywords** (`+ Keyword`, type, Enter;
  supports multiple include-keywords) → Continue → Step 3 **Public Replies** (Yes/No) → Save.
- Content: "Then → Choose Next Step" → **Instagram** (Send Message). First message after a comment is
  **"As private reply"**; follow-ups are **"Within messaging window."**
- Buttons: `+ Add Button` → action **Open website** (URL button) or **Instagram** (wire to next step).
  A "Quero o link" button → Instagram next step gives the proven opening-DM→link-DM 2-step.
- Follow-gate: a `Condition` node with the **"Follows your account"** filter.
- Useful selectors: `[data-test-id="create-automation-button"]`,
  `[data-test-id="templates-modal-create-new-button"]`, `[data-test-id="add-trigger-button"]`,
  `[data-test-id="add-keyword"]`, `[data-test-id="new-kw"]`, `[data-test-id="widget-save-btn"]`,
  `[data-test-id="next-step-btn"]`, `[data-test-id="next-step-select-InstagramChannel"]`,
  `[data-test-id="next-step-select-Link"]`, `[data-test-id="button-builder-done-button"]`,
  `[data-test-id="flowchart-delete-button"]`, `[data-test-id="other-actions-menu"]`.
- Multi-keyword routing is the ONE thing this builder cannot do (Proofs 1–2 above).

*A throwaway test draft was built to prove the above and then deleted (its triggers went to the
ManyChat trash). No live automation was changed.*
