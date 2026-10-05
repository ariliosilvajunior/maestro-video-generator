---
name: capture-references
description: Phase 4 visual-sourcing sub-step. When the script references a specific real thing (a product/company, a GitHub repo, a website, a logo, a pricing page, a news headline, a platform page), research the right URL and capture a REAL screenshot via Playwright MCP, then show it in a hand-drawn browser card marked up with draw-on annotations. Real captures only — NO AI generation. Triggers — "add reference screenshots", "screenshot the repo/site/news", "show the real page", "capture references for this video".
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: capture-references (Phase 4 — real reference screenshots)

Make the video **authentic and credible** by showing the REAL thing being talked about —
the actual GitHub repo, the company's site, the logo, the pricing page, the news article —
captured live and marked up like a Vox / Cleo-Abram explainer. This is the THIRD visual
source alongside stock b-roll and hand-drawn motion. **Real captures only — no AI-generated
images/video for references.**
Paths: `<downloads>` = `paths.downloads` (default `~/Downloads`); the Remotion project is `motion-pipeline/remotion-agent` — `python3 lib/paths.py` prints both.

> **ALWAYS include a reference when it is VERY PERTINENT to what's being said.** If a beat
> names a specific repo/company/tool/site/number/news, a real screenshot of it beats any
> generic stock clip. If a beat is abstract (a concept, a feeling), use stock or motion.

## WHERE in the pipeline
Runs inside **Phase 4 (visual sourcing), BEFORE motion (Phase 5)**. Each candidate window
resolves to ONE of: **REF** (real screenshot) → **HIT** (stock clip) → **MISS** (→ motion).
Prefer REF when the beat names something screenshottable; else fall through to stock; else motion.

A REF window is realised in ONE of two ways:
- **Annotated card (DEFAULT, on-brand):** the screenshot appears in a `<ScreenshotCard>` inside
  a hand-drawn MOTION scene, marked up with `CircleAnno` / `HandArrow` on the relevant part.
  Treat that window as a **motion_segment** (not an inserted b-roll).
- **Full-frame reveal:** a clean full-screen 1080x1920 clip of the screenshot (Ken-Burns).
  Treat that window as a **HIT b-roll** (inserted in Phase 7). Use only when the page deserves
  the whole frame (a dramatic headline, a single hero screenshot).

## WORKFLOW

### 1. Decide the references (from the script)
Read the PT-BR script. For each beat, ask: *does this name a specific real thing I can show?*
Build a short list: `{ window/beat, entity, best_url, what_to_highlight }`. Examples:
- "Claude Code" → `https://github.com/anthropics/claude-code` (repo header + stars) or `https://claude.com/claude-code`
- "a Anthropic levantou ..." (news) → the actual article (TechCrunch/The Verge/official blog)
- "Cursor" / "Replit" / "Perplexity" → the product homepage (`cursor.com`, `replit.com`, `perplexity.ai`)
- a pricing claim ("$200 por mês") → the product's **/pricing** page
- a logo → the brand's site or press/brand page (capture the logo element)
- a platform page (an app, a marketplace listing) → that page
- a design gallery (Dribbble / Behance) → capture the **HOMEPAGE** (`dribbble.com/`), NOT a `/shots/...` deep link. **QCR-076:** Dribbble deep links hit a "confirm you are human" verification wall; the homepage loads clean and shows real UI mockups (ideal for a "find a design reference" beat). Never solve a captcha.
If unsure of the exact URL, use **WebSearch** to find the official/canonical page first.

### 2. Capture via Playwright MCP — CLEAN + FULL-PAGE (protocol)
Two mandatory parts: (a) a **cleanup pass** that accepts cookies and strips overlays BEFORE the shot,
and (b) a **full-page** capture (so the evidence scroll has content below the hero).

```
mcp__playwright__browser_resize(width=1280, height=900)   # clean desktop viewport
mcp__playwright__browser_navigate(url)
```
Then run the **CLEANUP + FULL-PAGE capture** in one `browser_run_code` (QCR-086: screenshot to an
ABSOLUTE path so `prepare_reference_shot.py` can read it — expand `<downloads>` to the real directory
printed by `python3 lib/paths.py`; `~` is NOT expanded inside the browser):
```
mcp__playwright__browser_run_code(code=`async (page) => {
  // (a) click a cookie-accept button if present
  for (const rx of [/accept all/i,/accept/i,/aceitar/i,/agree/i,/got it/i,/^ok$/i,/allow all/i]) {
    const b = page.getByRole('button', { name: rx }).first();
    try { if (await b.isVisible({ timeout: 400 })) { await b.click({ timeout: 800 }); break; } } catch {}
  }
  await page.waitForTimeout(400);
  // (b) remove consent widgets + fixed/sticky floating chrome (cookie bars, sticky nav, chat bubbles)
  await page.evaluate(() => {
    const sel = ['[id*="onetrust" i]','[class*="onetrust" i]','[id*="cookie" i]','[class*="cookie" i]',
      '[id*="consent" i]','[class*="consent" i]','[class*="cky" i]','[aria-label*="cookie" i]',
      '[id*="intercom" i]','[class*="intercom" i]','[class*="chat" i][class*="widget" i]'];
    document.querySelectorAll(sel.join(',')).forEach(e => e.remove());
    document.querySelectorAll('body *').forEach(e => { const p = getComputedStyle(e).position;
      if (p === 'fixed' || p === 'sticky') e.style.setProperty('display','none','important'); });
  });
  // settle lazy content, return to top, then FULL-PAGE shot
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.screenshot({ path: '<downloads>/<name>.png', fullPage: true });   // ABSOLUTE path
  return 'clean full-page saved';
}`)
```
- **FULL-PAGE is the default** (`fullPage:true`) so the screenshot has the hero + sections below it —
  that's what the evidence **scroll** motion travels through (§ Motion protocol below).
- **EXCEPTION — viewport capture (`fullPage:false`, height 900):** use a short viewport shot ONLY when
  (i) there's nothing relevant below the hero to scroll through, or (ii) you'll use **static**/**zoom**
  motion to show one specific thing. A logo/single element → scope with `element`+`ref`.
- Take a quick `browser_take_screenshot(type="png")` too, just so the image is returned to you to LOOK at.

**AGENT GATE (MANDATORY):** LOOK at the returned image — the WHOLE image, not just the element you will circle.
Confirm it's the right page, fully loaded, the relevant content is visible, and there's NO leftover cookie wall /
banner / login / 404 / broken layout, NO ad ("Sponsored", "Ad", promoted cards) and NO third-party face that the
narration is not about. A video page goes through § 2b, never through this MCP shot. The cleanup is best-effort — if a banner survived (iframe consent, odd label), re-clean
(remove its node) and re-capture. Public pages only — never log in to capture.

### 2b. VIDEO PAGES (YouTube watch/shorts, Vimeo, TikTok, IG Reel) — DETERMINISTIC CAPTURE ONLY (QCR-332)
**Never screenshot a video page with the MCP browser.** The player autoplays — usually a **pre-roll AD first** —
and the sidebar/companion slots are ad inventory. A real run once shipped an evidence card with a competitor's
face (a 26 s ad) inside the player and a "Sponsored" card beside it. Use the script:
```bash
node reference-pipeline/yt_watch_shot.cjs "https://www.youtube.com/watch?v=<id>" <downloads>/<name>.png
#   default --mode poster : player shows the video's OWN maxresdefault poster (what a viewer sees before play)
#   --mode frame --t 12    : waits out / skips the ad (≤120 s), pauses the REAL video at 12 s (falls back to poster)
```
It removes every ad node (player + page), empties the recommendations sidebar (kept as blank space so the player
stays 880 px wide and the title lands inside the evidence-card window), removes comments, then **proves it in the
DOM** and writes `<name>.meta.json` with `ad_free:true`. Exit 3 / `AD_FREE=false` = do NOT use the PNG.
`prepare_reference_shot.py` (next step) **refuses** any video-page shot without that proof — always pass
`--source-url`. **AGENT GATE for video pages:** LOOK at the PLAYER: it must show the video's own thumbnail/frame —
never "Ad"/"Anúncio", "Skip"/"Pular", "Sponsored"/"Patrocinado", a 15–30 s progress bar, or ANY other person's
face; LOOK at the sidebar: blank. If the poster is the wrong video (id typo), fix the URL and recapture.

### 3. Prepare the asset + TARGET THE CIRCLE (QCR-082)
```bash
python3 reference-pipeline/prepare_reference_shot.py <abs-path-to-shot>.png --name <PascalCase> \
  --source-url "<url>" --focus "sx,sy" --focus-size "w,h" [--clip]      # --source-url: QCR-332 gate (video pages need <shot>.meta.json ad_free:true)
```
- Default → `motion-pipeline/remotion-agent/public/refs/<PascalCase>.png` (for `ScreenshotCard`).
- `--clip` → also `<downloads>/<PascalCase>_ref.mp4` (full-frame 1080x1920 Ken-Burns b-roll).
- **`--focus "sx,sy"` is MANDATORY when the circle should ring a specific element.** The draw-on
  circle MUST ring the ACTUAL main element (hero/logo/price/headline/repo-name), NEVER empty space.
  LOOK at the screenshot, read off the main element's CENTER pixel `sx,sy` and rough size `w,h` (in
  the raw 1280-wide capture), and the script prints the exact `focus={fx,fy}` + `focusR={rx,ry}` to
  paste into `<EvidenceReveal>`. It warns if the element is cropped out of the card (recapture
  tighter/scrolled). Example (a hero headline centred at 632,175 with size 495,62 →
  `focus={ fx: 308, fy: 131 } focusR={ rx: 139, ry: 30 }`). When QC is enabled, this is what checklist #15 checks.

### 4. Wire into the motion composition (annotated card — default)
In the Phase-5 hand-drawn composition, for the REF window's scene:
```tsx
import { ScreenshotCard, CircleAnno, HandArrow, Kicker, HandWord, HD } from "../library";
// ...
<ScreenshotCard src="refs/<PascalCase>.png" domain="github.com/anthropics" delay={6} width={640} height={372} />
<CircleAnno cx={470} cy={232} rx={150} ry={52} delay={30} w={640} h={420} />  {/* mark the relevant part */}
<HandArrow x1={250} y1={400} x2={400} y2={250} delay={42} w={640} h={420} />
```
- `fit="contain"` for logos (transparent/letterboxed), `cover` (default) for pages.
- Mark up the SPECIFIC part the narration is about (the repo, the price, the headline).
- One card per scene; respect the 40/60 layout + safe zone; PT-BR for any added words.
- Reference render to model on: `RefShotDemo` (id in Root.tsx; source `src/compositions/RefShotDemo.tsx`, using the bundled placeholders `refs/sample_page.png` / `refs/sample_repo.png` / `refs/sample_pricing.png`).

For a full-frame reveal instead: add `<PascalCase>_ref.mp4` to the b-roll manifest as that
window's HIT clip (`insert_brolls.py` handles it in Phase 7).

## Motion protocol — screenshots MOVE by default
The evidence screenshot is **animated**, not a static image. `EvidenceReveal` / `PremiumEvidence`
take a `motion` prop:
- **`motion="scroll"` (DEFAULT)** — the page scrolls down inside the card. REQUIRES a full-page capture
  (step 2). Pass `scroll={<px>}` (from `prepare_reference_shot.py`'s printed recommendation) +
  `durFrames={F(<beatSeconds>)}`. The fixed circle/arrow are auto-hidden (the scroll IS the highlight).
- **`motion="zoom"` — the 2ND evidence beat** (and any "show this exact detail" beat): a SUBTLE push
  from the just-opened page INTO the focus, no scroll. **`focus`/`focusR` MUST come from
  `prepare_reference_shot.py --focus "sx,sy"` on the MAIN element's CENTER pixel — never eyeballed**
  (an eyeballed focus zooms into blank space). Subtle `zoomTo` ≈ 1.4–1.7 (default 1.6). The zoom centers
  the element and auto-clamps to the image bounds (a near-edge element never shows blank); the circle tracks it.
- **`motion="static"` — EXCEPTION only:** nothing relevant below the hero, or a fixed single proof
  (a logo, one number). Keeps the classic draw-on circle + arrow.

Default cadence when a video has multiple evidence beats: **1st = scroll, 2nd = zoom**, more = vary
(scroll / zoom / static by what each proves). Capture full-page for scroll beats; viewport is fine for
zoom/static.

## RULES
- **Real captures only. NO AI-generated images/video for references.**
- Public pages only; editorial/commentary/educational use; never log in to capture.
- The card must be LEGIBLE on a phone — capture the relevant region, don't cram a whole noisy page.
- Mark up what matters; an un-annotated screenshot is a missed opportunity (this is the whole point).
- Cost = **$0** (Playwright + free).

## Feed the resource link to Phase 11 (comment→DM CTA)
When the run state → `resource_cta.enabled` is `true` AND the entity you just resolved IS that
resource (`resource_cta.resource_name`), record its canonical URL with the helper (do NOT hand-edit):
```bash
python3 manychat-pipeline/set_resource_cta.py set-link --link "<canonical URL>" --source capture-references
```
You already navigated to the real page to screenshot it — that exact URL is what the pipeline will DM to
commenters in Phase 11 (`manage-comment-dm` when `config.manychat.enabled`; otherwise it is the link you send
by hand). Use the resource's primary destination (official site / the exact repo / the product page), not a
deep sub-page. If several entities exist, use the one matching `resource_cta.resource_name`. (Check first with
`set_resource_cta.py show`. If `resource_cta.enabled` is false/absent, do nothing here. If the URL is uncertain,
Phase 11 re-derives — but capturing it here is the reliable default.)

## OUTPUTS
- `motion-pipeline/remotion-agent/public/refs/<name>.png` (card asset) and/or `<downloads>/<name>_ref.mp4` (full-frame).
- REF windows recorded in `<downloads>/<VideoName>_visual_plan.json` (as motion_segments using ScreenshotCard, or as broll_windows for full-frame).
- run state → `resource_cta.link` (+ `link_source`) when a shareable resource is present (see above).

## DEPENDENCIES
- Playwright MCP (browser_navigate / browser_take_screenshot / browser_resize / browser_snapshot).
- `reference-pipeline/prepare_reference_shot.py` (PIL + ffmpeg with libass — `python3 bin/doctor.py` checks it). WebSearch for URL discovery.
- `reference-pipeline/yt_watch_shot.cjs` (Node + Playwright) for video pages.
- Library `ScreenshotCard` + annotations in `src/library/handdrawn.tsx`.
