# HeyGen Avatar Video Generation — Phase 3

**Phase 3 generates the AI avatar video. There is EXACTLY ONE method: the AI Studio browser editor (`/create-v4`), driven by Playwright MCP.**

> **WHY BROWSER (verified live).** The browser AI Studio editor bills the monthly
> subscription credits (example plan: AvatarIV = 20 credits/min; ~2000/month ≈ ~100 short
> videos), so generating a short video is effectively **no extra cost**. A 55s clip
> drew ~19 credits from the subscription pool. This is the only sanctioned path —
> drive it with Playwright MCP exactly as documented below.

> **Paths in this doc:** `<downloads>` = the pipeline output dir (config `paths.downloads`, default `~/Downloads`; `python3 lib/paths.py` prints it). `<scratch>` = the scratch dir (config `paths.tmp` / `MAESTRO_TMPDIR`).

---

## Avatar & Voice Mapping

**ONE avatar per repo: `config.avatar.*` — never switch avatars mid-run.** The avatar, its looks and its voice come from `config/config.json`:

| Config key | Browser value | Role |
|------------|---------------|------|
| `config.avatar.name` | the avatar GROUP name in the picker (`<AVATAR_NAME>`) | the only avatar this repo uses |
| `config.avatar.look` | the primary look card (`<AVATAR_LOOK>`, e.g. `<AVATAR_NAME> -- 1`) | picked on every run |
| `config.avatar.fallback_look` | a second look of the same avatar (optional) | used only if the primary look is unavailable |
| `config.avatar.voice` | the voice bound to the avatar (`<AVATAR_VOICE>`) | auto-applies when you pick the avatar group |

**Rules:** the configured avatar is the only avatar/voice (no alternation). The voice is bound to the avatar and auto-applies when you pick the avatar group — NEVER switch to a Voice Clone voice. Output: 1080x1920 (9:16 vertical). Max script ~2520 chars (~3 min). The browser editor script box has no hard cap that we hit at short-form lengths.

> **⚠ VOICE STATUS:** if `config.avatar.voice` is an imported voice (e.g. an ElevenLabs import), the editor can show a `VOICE_QUOTA_EXCEEDED` / quota error on render. If it does, escalate to the user — do NOT silently switch to a Voice Clone voice.

---

## Browser method (Playwright MCP) — THE ONLY METHOD

**Credentials:** `.claude/keys.md` → `## HeyGen` (`<HEYGEN_EMAIL>` / `<HEYGEN_PASSWORD>`; see `.claude/keys.md.example`).
Write the script (PT-BR — `config.brand.language`) with the `Write` tool first (e.g. `<downloads>/<VideoName>_script.txt`) so accents are preserved — never a bash heredoc.

### Step-by-step (verified live, current HeyGen UI)

1. **Open HeyGen.** `browser_navigate` → `https://app.heygen.com/home`. The Playwright profile usually keeps you logged in.

2. **Login if prompted.** A dialog with Google/Apple/email options may appear (often when entering AI Studio).
   - Click **"Use email"** → type `<HEYGEN_EMAIL>` into "Enter your email".
   - Click **"Use password"** → type `<HEYGEN_PASSWORD>` into "Enter password".
   - A **Cloudflare Turnstile** challenge runs invisibly and auto-passes (the "Log in" button enables when it clears). Click **"Log in"**.
   - **If a 2FA 6-digit code, visible captcha, or any blocker appears that does NOT auto-clear, STOP and report exactly what is needed — do not guess.**

3. **Enter AI Studio.** From Home, click **"Start from Scratch — Go to AI Studio"** → lands on `/avatar/studio`. Click the **"New video"** card → opens the `/create-v4` editor (it may open as landscape, `vt=l`). Dismiss any "Brand Systems" promo via **Close**.

4. **Switch to Portrait.** Click **"Portrait (9:16)"** in the top bar (it becomes `pressed`). MANDATORY — the default is landscape.

5. **Select your avatar (`config.avatar.name`).** The default scene avatar is a stock avatar ("Annie").
   - Click the avatar selector (the "Annie / Annie Casual…" card) → the **"Choose Avatar & Look"** panel opens.
   - Click the avatar-group header (shows "Annie") → a **"Choose Avatar"** picker opens with tabs **Recently Used / My Avatars / Public Avatars**. **`<AVATAR_NAME>`** appears under **Recently Used** (also under My Avatars). Click the **`<AVATAR_NAME>`** group.
   - The look grid loads (e.g. "9 looks"). Click the look **`<AVATAR_LOOK>`** (`config.avatar.look`).
     - ⚠ The look thumbnail `<img>` is covered by a transparent overlay (`z-[8]`) — clicking the raw image times out. **QCR-110: raw `mouse.click(x,y)` on the card AND JS-dispatched pointer/mouse events on the `z-[8]` overlay both SILENTLY FAIL (the look never moves to front, voice stays the stock avatar's).** The ONLY reliable pick: take a `browser_snapshot`, find the look card's accessibility entry (`generic [ref=eN]: img "<AVATAR_LOOK>"` + a sibling `button [ref=eM]`), and `browser_click` that inner **button ref `eM`** (Playwright resolves the real React click target through the overlay). A successful pick moves `<AVATAR_LOOK>` to the FRONT of the looks list — verify that, then reload the draft URL (`?panel=scene`) and confirm the Avatar & Voice panel reads **Avatar: `<AVATAR_NAME>` / `<AVATAR_LOOK>`, Voice: `<AVATAR_VOICE>`** before filling the script.
   - **QCR-125 — SWITCHING the avatar GROUP (a fresh "New video" defaulted to Annie, not your avatar): pick the look by clicking the CARD's z-[8] overlay, NOT the "Choose look" button.** When you must change the avatar group (last-used ≠ your avatar), you land in your avatar's looks grid whose hover **"Choose look" button is `pointer-events:none`** (QCR-121 automation-proof) — `locator.click` on it times out. The REAL click target is the look card's topmost `div.tw-absolute.tw-inset-0.tw-z-[8]` (it has `pointer-events:auto` + `cursor:pointer`; its `.tw-cursor-pointer.tw-group` ancestor holds the onClick). So: resolve the `img[alt="<AVATAR_LOOK>"]` bounding box and do `page.mouse.move(cx,cy)` then `page.mouse.click(cx,cy)` on the card CENTER — it selects the look (canvas switches to your avatar, scene panel reads `<AVATAR_NAME>` / `<AVATAR_VOICE>`). Verify by screenshot. (The QCR-110 inner-button-ref trick only works when the look button has pointer-events enabled — not here.)
   - Confirm the canvas preview now shows your avatar, portrait framed. Voice auto-sets to **`<AVATAR_VOICE>`** (it is bound to the avatar).

6. **Paste the script.** Use `browser_type` (fill) on the **Script** textbox ("Type your script or use '/' for commands"). Do NOT click-then-type (can trigger an "Upload audio" dialog). The draft auto-saves (URL gains a real draft id) and a duration estimate appears (e.g. "8.8s est.").
   - **QCR-032 — fill APPENDS to a non-empty box.** The Script box is a rich contenteditable; `browser_type`/fill does NOT replace existing text, it appends. If you are SWAPPING the script (e.g. the topic changed after a first fill), you MUST clear it first: click into the box → `ControlOrMeta+a` → `Delete`, confirm the placeholder "Type your script…" returns, THEN fill. **Always verify the duration estimate (e.g. "64s est.") matches ONE script before Generate** — a doubled estimate (~130s) means both scripts concatenated; clear and refill. (A real run once produced a 131.6s box holding two topics — caught at the Generate dialog and cancelled before submit.)
   - **QCR-089 — the left nav is a HOVER flyout that intercepts the editor click.** The `/create-v4` left navigation (`role="dialog" aria-label="Navigation"` OverlayDrawer) expands on hover and the Script editor sits at the far-left edge (x≈20), so a click near the editor's left re-triggers the drawer and the click is intercepted (→ a 69-char partial insert). BEFORE filling: move the mouse to a neutral canvas spot (`page.mouse.move(650,450)` + wait ~1.2s) to collapse the drawer, then click the editor body at **x ≥ 175** (`page.mouse.click(Math.max(box.x+box.width/2,175), box.y+40)`), THEN `keyboard.insertText`. Verify `editor.innerText().length` ≈ script length.
   - **QCR-092 — a LOW duration estimate right after a successful fill is the 429 `text_draft.save` rate-limit, NOT a partial fill.** The estimate is computed SERVER-SIDE after `text_draft.save`; rapid editor edits/polling rate-limit that endpoint (429) so it stays stuck at the first auto-saved sentence (e.g. "6.8s est.") even though `editor.innerText` already holds the full script. TRUST `editor.innerText` head+tail+length as the source of truth that the script landed — do NOT start clearing/re-filling to "fix" the estimate (Ctrl+A in this Lexical editor selects the whole PAGE, deletes land partial, and the extra saves trigger more 429s — it has corrupted the editor and dropped the first sentence). If the estimate looks implausibly low: **reload the draft URL once** (`/create-v4/<draftId>?vt=l&panel=scene` — avatar/look/voice persist), do ONE clean `keyboard.insertText(fullScript)` into the now-empty editor, then **wait ~12s UNTOUCHED** so the save succeeds and the estimate settles to the true ~Ns before reading it.
   - **QCR-103 — for LONG scripts (> ~1 paragraph) `insertText` does NOT persist past the first sentence; use char-by-char `keyboard.type` + reload-VERIFY.** A single bulk `insertText`/paste fires one debounced `text_draft.save` that 429-rate-limits and never commits the remainder — `editor.innerText` shows the full text (client DOM) but only the FIRST sentence (~167 chars) actually saves server-side, even after the QCR-092 reload→insertText→wait path (it has failed repeatedly). The render reads the SERVER draft, so it would speak only the first sentence. RELIABLE path: (1) focus editor, clear via DOM range (`el.focus(); const r=document.createRange(); r.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(r);` then `keyboard.press('Delete')` — NOT Ctrl+A, which selects the whole page), (2) `page.keyboard.type(fullScript, {delay: 7})` (incremental input events each commit), (3) click a neutral canvas spot to BLUR (forces final save), (4) **reload the draft URL and VERIFY both `editor.innerText.length ≈ script length` AND the duration estimate shows the full ~Ns** before Generate; the Generate-dialog credit cost (≈ N/3.4 credits for an Ns clip) is a second confirmation. Keep plain `insertText` only for short one-liners.
   - **QCR-087 — fill into the FIRST contenteditable can miss + may spawn a STRAY empty Scene 2.** Two driving nuances with `browser_run_code` fills: (1) `page.locator('[contenteditable="true"]').first()` may resolve before the editor is focused → the insert lands nowhere (verify `editor.innerText().length` ≈ script length; if it's ~90, click the editor BODY middle `(box.x+box.width/2, box.y+30)` first, then `page.keyboard.insertText`). (2) After a long script fills, HeyGen v4 frequently auto-creates an EMPTY **Scene 2** (white thumbnail + red ⚠) — it adds a blank/warning scene to the render. DELETE it before Generate: right-click the Scene 2 thumbnail in the timeline → click **"Delete Scene"**, then confirm only one scene remains and the total estimate matches scene 1 alone. (Right-click context menu items are text — `getByText('Delete Scene')`.)

   - **QCR-122 — NEVER reload the BLANK `/create-v4/draft` URL before the script fill has minted a real draft id.** The QCR-110/103/092 reload-verify steps apply ONLY AFTER step 6 (script fill) has created a real draft id (URL becomes `/create-v4/<32-hex-id>`). Reloading the bare `/create-v4/draft?...` URL (no id) — e.g. to "verify the avatar stuck" right after picking the look but BEFORE filling the script — SPAWNS A FRESH BLANK DRAFT that defaults to a stock avatar + Landscape, silently discarding your avatar pick AND Portrait (it costs a full re-pick). RULE: pick avatar → fill script (creates the draft id) → THEN (and only then) reload-verify against the real `/create-v4/<id>` URL. To verify the avatar pick before the script exists, read the open editor's DOM in place (no navigation), do not `goto`.
   - **QCR-111 — RE-VERIFY Portrait (9:16) is still `pressed` RIGHT BEFORE Generate.** Any reload of the draft URL (e.g. the QCR-092/103 verify-reload) or an early reload before the script saved can SILENTLY revert orientation to Landscape (the URL carries `vt=l`) AND reset the avatar to a stock avatar. A real render once came out **1920×1080 landscape** because Portrait was not re-checked after a reload — cost a full re-render. So immediately before step 7: assert `Portrait (9:16)` has `aria-pressed="true"` AND the Avatar & Voice panel still reads `<AVATAR_LOOK> / <AVATAR_VOICE>` (re-click Portrait / re-pick your avatar if not). A cached re-render after fixing orientation costs 0 credits.

7. **Generate.** Click **"Generate"** (top-right). A **"Generate Video"** dialog appears — confirm:
   - **Resolution = 1080p**
   - **Format = MP4**
   - **HeyGen Watermark = Off**
   - It shows the cost, e.g. *"This will use 3 credits (you have NNNN remaining)"* — these are the included subscription credits. Click **"Submit"**.
   - **QCR-154 — Avatar IV CREDITS DEPLETED → "Switch to Avatar III" ($0 fallback, NOT a hard blocker).** If the dialog shows the Avatar IV cost EXCEEDS the remaining balance (e.g. *"will use 18 credits. You have 1 remaining"*) and **Submit is DISABLED**, do NOT escalate. The dialog offers **"Switch to Avatar III"** (the engine named in `config.avatar.engine_fallback`, default Avatar III) — click it: the credit-cost line disappears (*"This video will be generated using the Avatar III model"*) and **Submit becomes ENABLED at no premium-credit cost** (subscription-covered). It keeps the SAME avatar / look / voice (only the motion engine changes), exports native 1080x1920, and (when QC is enabled) passes QC normally — a real run scored 100/100 on Avatar III. ONLY escalate if Avatar III ALSO cannot submit (a `VOICE_QUOTA_EXCEEDED` on your voice, or 2FA/captcha at login).
   - A **"Video submitted"** toast appears and you are taken to `/projects`.

8. **Wait for render.** The new project shows `% Ready`, then a duration badge when done. Render on the browser/AvatarIV path is SLOW (typical ~15–30 min for a ~40–60s clip on a busy day). Poll the Projects page with `browser_snapshot` / `browser_wait_for`. If a render is slow, WAIT IT OUT or escalate to the user — there is no other generation path.
   - **QCR-096 — a "Video submitted" toast is NOT proof the render started; verify a processing card within ~5 min, else RE-SUBMIT.** A submission can SILENTLY FAIL: the draft is consumed (`text_draft.get` 404) and the toast shows, yet NO card EVER appears on `/projects` — not finished, not `% Ready`. A SUCCESSFUL submission shows a top-of-grid card with a live `NN% Ready` badge within ~1-3 min. So: after Submit, poll `/projects` and CONFIRM a `NN% Ready` (or fresh duration) card appears within ~3-5 min. If nothing shows after ~5 min, treat the submission as FAILED → open a fresh "New video" and re-do Phase 3. Do NOT wait 30+ min on a submission that never surfaced a processing card. **The blank `/create-v4/draft` defaults to a stock avatar + Motion Engine `Avatar V`** — always swap the avatar to `<AVATAR_LOOK>` before re-filling. **Avatar V exports native 1080x1920** (no 1906→1920 pad needed; the pad step is then a harmless no-op).

9. **Download.** Click the finished video → header **"Download"** → confirm Resolution **1080p** → **Download**. Playwright MCP saves the file under `.playwright-mcp/<Title>.mp4`.
   - **QCR-114: GRAB THE NEWEST FILE BY MTIME, never by a guessed name, and VERIFY content before padding.** An untitled render downloads as `Untitled-Video.mp4` (HYPHEN), but a STALE `Untitled_Video.mp4` (UNDERSCORE) from a prior run can already sit in `.playwright-mcp/` — picking by name once grabbed the wrong (old) video and it sailed through padding undetected (caught only when the Gemini SRT didn't match the script). ALWAYS resolve the just-downloaded file as the newest mp4:
     ```bash
     SRC=$(ls -t .playwright-mcp/*.mp4 | head -1)   # newest by mtime = the file you just downloaded
     mv "$SRC" <downloads>/Quick-Avatar-Video-1080p.mp4
     ```
   - **VERIFY before padding (mandatory):** after the Phase-3 Gemini SRT is produced, grep it for a distinctive word from THIS script (e.g. the product name). If the transcript does not match the script, you grabbed the wrong file — re-resolve the newest download. (Setting a Title in the Generate dialog also avoids the `Untitled` collision entirely.)

10. **Pad to exact 1920 height — CONDITIONAL (speed).** Avatar IV V4 exports **1080×1906** (needs padding), but **Avatar III AND Avatar V export native 1080×1920** (pad is a no-op re-encode that wastes ~2 min — a real timeout was hit live this way). So **check the height FIRST and only re-encode when it's actually 1906**; a `cp` is strictly better (no quality loss) when it's already 1920:
    ```bash
    H=$(ffprobe -v error -select_streams v -show_entries stream=height -of csv=p=0 <downloads>/Quick-Avatar-Video-1080p.mp4)
    if [ "$H" != "1920" ]; then
      ffmpeg -y -i <downloads>/Quick-Avatar-Video-1080p.mp4 \
        -vf "pad=1080:1920:0:(1920-ih)/2:black" \
        -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a copy \
        <downloads>/Quick-Avatar-Video-1080p-padded.mp4
      mv <downloads>/Quick-Avatar-Video-1080p-padded.mp4 <downloads>/Quick-Avatar-Video-1080p.mp4
    fi   # else: already 1080x1920 (Avatar III/V) — no re-encode needed
    ```

11. **Evidence gate (MANDATORY).**
    ```bash
    ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,duration \
      -of default=noprint_wrappers=1 <downloads>/Quick-Avatar-Video-1080p.mp4
    ```
    Must show video h264 1080x1920 + an aac audio stream, duration > 0. Do NOT proceed to Phase 4 without this.

12. **Stamp the PER-RUN avatar (MANDATORY — QCR-180).** Copy the gated file to a per-run name; every downstream phase reads THIS, never the shared path (which the next run overwrites). This is what makes a cross-run swap (one run's subtitles burned over another run's avatar audio) structurally impossible:
    ```bash
    cp <downloads>/Quick-Avatar-Video-1080p.mp4 <downloads>/<VideoName>_avatar_1080p.mp4
    ```
    Then transcribe the Phase-3 SRT FROM `<downloads>/<VideoName>_avatar_1080p.mp4` (this run's avatar), so the SRT and the embedded audio can never disagree.

**Browser hygiene:** leave the browser open between phases (login state preserved). Do NOT close the tab mid-pipeline.

---

## Pipeline Integration

- **Input:** Accent-corrected script in `config.brand.language` (PT-BR by default) from Phase 2.
- **Output:** `<downloads>/Quick-Avatar-Video-1080p.mp4` (raw/pad target) **+ the per-run `<downloads>/<VideoName>_avatar_1080p.mp4` (QCR-180 — the canonical avatar all downstream phases read).**
- **Next phase:** Phase 4 (Motion Graphics) copies `<downloads>/<VideoName>_avatar_1080p.mp4` (NOT the shared path) into the Remotion project (`motion-pipeline/remotion-agent`).
- **The shared output filename and the ffprobe evidence gate are unchanged; the per-run copy (step 12) is the mandatory final step.**

---

## VALIDATED `browser_run_code` SNIPPETS (token/speed — copy these instead of snapshotting to DISCOVER selectors)

These are the exact snippets that drove a full successful Phase 3 end-to-end. Each returns a TINY object so
the orchestrator context stays small (a `browser_snapshot`/`browser_click` dumps the whole tree — the Annie
looks grid alone is ~57 entries / tens of KB). **Run them in order, READ the small return, decide the next
step.** They use role/text/DOM-walk selectors (robust), not brittle `eN` refs. **If any returns empty/`error`
(the UI drifted), fall back to `browser_snapshot` discovery for THAT step only** — graceful degradation, no
harm. This does NOT replace the step-by-step checkpoints or any QCR — it just skips the UI-discovery snapshots.

Before running them, substitute the placeholders: `<HEYGEN_EMAIL>` / `<HEYGEN_PASSWORD>` from `.claude/keys.md`
(`## HeyGen`), `<AVATAR_NAME>` = `config.avatar.name`, `<AVATAR_LOOK>` = `config.avatar.look`,
`<AVATAR_VOICE>` = `config.avatar.voice` (escape regex metacharacters when a name is used inside `/…/`),
`<Name>` = the run name. Never paste the credentials into a transcript or a log.

```js
// 0) Login state — navigate home, check if a login form is present
async (page) => { await page.goto('https://app.heygen.com/home'); await page.waitForTimeout(5000);
  const b = await page.locator('body').innerText();
  return { loginForm: /Use email|Continuar com o Google/.test(b), studio: /Go to AI Studio/.test(b) }; }

// 0b) IF loginForm: email+password (Cloudflare auto-clears; STOP on 2FA). Credentials: .claude/keys.md ## HeyGen
async (page) => { const t=async s=>{const e=page.getByText(s,{exact:false}).first();if(await e.count()){await e.click();await page.waitForTimeout(1200);}};
  await t('Use email'); const em=page.locator('input[type="email"]').first(); if(await em.count())await em.fill('<HEYGEN_EMAIL>');
  await t('Use password'); const pw=page.locator('input[type="password"]').first(); let f=false; if(await pw.count()){await pw.fill('<HEYGEN_PASSWORD>');f=true;}
  await page.waitForTimeout(6000); const btn=page.getByRole('button',{name:/^Log in$/i}).first(); if(await btn.count()&&await btn.isEnabled().catch(()=>0))await btn.click();
  await page.waitForTimeout(6000); const b=await page.locator('body').innerText(); return { pwFilled:f, stillLogin:/Use password/.test(b), has2FA:/verification code|c[oó]digo/i.test(b) }; }

// 1) Open the editor: /avatar/studio → click the "New video" card (the button whose sibling text is "New video")
async (page) => { await page.goto('https://app.heygen.com/avatar/studio'); await page.waitForTimeout(6000);
  const r = await page.evaluate(() => { const el=[...document.querySelectorAll('*')].find(e=>e.textContent?.trim()==='New video');
    let n=el; for(let i=0;i<5&&n;i++){n=n.parentElement; if(n?.querySelector('button')){n.querySelector('button').click();return 'ok';}} return 'not-found';});
  await page.waitForTimeout(8000); for(const t of ['Close','Try Now']){const x=page.getByRole('button',{name:new RegExp('^'+t+'$','i')}).first(); if(await x.count())await x.click().catch(()=>{});}
  return { clicked:r, inEditor:/create-v4/.test(page.url()) }; }

// 2) Portrait 9:16
async (page) => { const p=page.getByRole('button',{name:/Portrait \(9:16\)/}).first(); await p.click();
  return { pressed: await p.getAttribute('aria-pressed').catch(()=>null) }; }

// 3) Open avatar picker → <AVATAR_NAME> group → look <AVATAR_LOOK> via the card's INNER button (QCR-110)
//    ("Annie" = HeyGen's stock avatar on a fresh New video; adjust the two Annie selectors if the default differs)
async (page) => { const sel=page.locator('div').filter({hasText:/^AnnieAnnie/}).nth(2); if(await sel.count())await sel.click(); await page.waitForTimeout(2500);
  const hdr=page.getByRole('button',{name:'Annie'}).first(); if(await hdr.count())await hdr.click(); await page.waitForTimeout(2500);
  const av=page.getByText(/^<AVATAR_NAME>$/).first(); if(await av.count())await av.click(); await page.waitForTimeout(3500);
  const img=page.locator('img[alt="<AVATAR_LOOK>"]').first(); if(!await img.count())return {err:'no <AVATAR_LOOK>'};
  await page.evaluate(el=>{let c=el;for(let i=0;i<5&&c;i++){c=c.parentElement;if(c?.querySelector('button')){c.querySelector('button').click();break;}}}, await img.elementHandle());
  await page.waitForTimeout(3000); const b=await page.locator('body').innerText(); return { avatar:/<AVATAR_LOOK>/.test(b) }; }

// 4) Fill the script (QCR-089 collapse drawer + QCR-103 char-by-char). Pass the script as a JS string literal.
async (page) => { const script = `<PASTE THE SCRIPT HERE>`;
  await page.mouse.move(650,450); await page.waitForTimeout(1300); const ed=page.locator('[contenteditable="true"]').first(); const bx=await ed.boundingBox();
  await page.mouse.click(Math.max(bx.x+bx.width/2,175), bx.y+30); await page.waitForTimeout(600);
  await page.evaluate(()=>{const e=document.querySelector('[contenteditable="true"]');e.focus();const r=document.createRange();r.selectNodeContents(e);const s=getSelection();s.removeAllRanges();s.addRange(r);});
  await page.keyboard.press('Delete'); await page.waitForTimeout(400); await page.keyboard.type(script,{delay:6}); await page.waitForTimeout(1500);
  await page.mouse.click(650,450); await page.waitForTimeout(3000);
  return { editorLen: await ed.innerText().then(t=>t.trim().length), draftId:(page.url().match(/create-v4\/([0-9a-f]{16,})/)||[])[1]||null }; }

// 5) Reload-verify (ONLY after step 4 minted a real draft id — QCR-122) then Generate → (Avatar III if IV depleted, QCR-154) → Submit
async (page) => { const id='<DRAFT_ID>'; await page.goto(`https://app.heygen.com/create-v4/${id}?panel=scene`); await page.waitForTimeout(9000);
  const b=await page.locator('body').innerText(); const ed=page.locator('[contenteditable="true"]').first();
  const st={editorLen:await ed.innerText().then(t=>t.trim().length),look:/<AVATAR_LOOK>/.test(b),voice:/<AVATAR_VOICE>/.test(b),portrait:await page.getByRole('button',{name:/Portrait/}).first().getAttribute('aria-pressed').catch(()=>null),est:(b.match(/(\d+(?:\.\d+)?)\s*s\s*est/i)||[])[0]};
  if(!st.look||st.portrait!=='true')return {abort:'reverify failed',...st};   // QCR-111: re-pick the look / re-click Portrait before Generate
  await page.getByRole('button',{name:/^Generate$/}).first().click(); await page.waitForTimeout(4000);
  const d=await page.locator('body').innerText();
  if(/Switch to Avatar III/i.test(d)){await page.getByRole('button',{name:'Switch to Avatar III'}).click(); await page.waitForTimeout(1500);}   // QCR-154 $0
  const title=page.getByRole('textbox',{name:/Untitled Video/}).first(); if(await title.count())await title.fill('<Name>-001');   // avoid Untitled collision QCR-114
  const sub=page.getByRole('button',{name:/^Submit$/}).first(); const ok=await sub.isEnabled().catch(()=>0); if(ok)await sub.click(); await page.waitForTimeout(6000);
  return {...st, avatarIIIswitch:/Switch to Avatar III/i.test(d), submitted:/projects/i.test(page.url())}; }

// 6) Confirm processing card (QCR-096) then poll to done; 7) open the finished /videos/<id> card, Download → 1080p → Download.
//    (Use the Download-modal flow from step 9 in this doc; grab the newest .playwright-mcp/*.mp4 by mtime, QCR-114.)
```
