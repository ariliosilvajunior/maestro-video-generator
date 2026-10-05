---
name: post-browser-manual
description: On-demand BROWSER posting of a finished vertical video to Instagram Reels ONLY via Playwright MCP — the default posting path (Metricool is an optional fallback). Restores the saved Instagram cookies of your account (config.posting.instagram_handle, no login), uploads the file, fills the caption, and either stops at the pre-publish screen (test mode, DEFAULT) or publishes (only on explicit "post for real" / when invoked by post-and-log or /post-now). Triggers — "post via browser", "manually post to instagram", "browser upload this video", "test browser posting", "post without metricool".
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: post-browser-manual (browser upload to IG Reels)

> **PLATFORM = Instagram Reels ONLY.** YouTube, TikTok and X are not posting targets of this
> pipeline — this skill posts to Instagram only. (Where a source link you queued came from does not
> matter here — that is input, not output.)

The browser-driven posting path. It drives Instagram's own web uploader with Playwright MCP,
reusing your saved login cookies so no re-login is needed. Built + verified end-to-end (a real
video was published live to Instagram this way). House rule: this is the DEFAULT posting strategy
for Instagram, not Metricool.

## DEFAULT POSTING METHOD — browser, not Metricool
This is the PRIMARY way the pipeline publishes to Instagram Reels. Metricool is an Instagram-only
OPTIONAL fallback (`config.posting.metricool.enabled`). **One Instagram account:**
`config.posting.instagram_handle` — the saved session in `.claude/auth/instagram-storage-state.json`
MUST belong to that account (the setup wizard writes it after your first login). There is no
account switching inside a run.

## SAFETY DEFAULT — stop before publish
**DEFAULT = TEST MODE: drive each upload to the final pre-publish screen (file uploaded + caption filled) and STOP. Do NOT click Publish/Share/Post.** Only publish for real when the user explicitly says "post for real" / "publish it" / "go live" — or when this skill is invoked by `post-and-log` / `/post-now`, which are explicit posting commands. Browser posting is outward-facing and irreversible, so confirm intent.

## Accounts & saved sessions
Cookies live in `.claude/auth/instagram-storage-state.json` (gitignored). Login creds in `.claude/keys.md` → `## Instagram` (used only if the saved session expires).

| Platform | Upload URL | Account | Auth cookie life |
|----------|-----------|---------|------------------|
| Instagram| `https://www.instagram.com/` → Create → Post | logged in as `@<your-handle>` (`config.posting.instagram_handle`) | ~90d (re-login when it lapses) |

The video to post MUST be copied into the project root first — the Playwright MCP browser can only read
files under the project dir, NOT `<downloads>`. Staging dir: `.upload-tmp/` (gitignored).

```bash
cp <downloads>/<Name>_music.mp4 ".upload-tmp/"   # then upload from .upload-tmp/<Name>_music.mp4
```

## PROCEDURE (Instagram only)

### 0. Stage the file + size the browser
```bash
cp <downloads>/<VIDEO>.mp4 ".upload-tmp/"
```
`mcp__playwright__browser_resize(1280, 860)` once at the start.

### 1. Restore the session (no login)
```bash
python3 browser-post-pipeline/restore_session.py instagram --check        # cookie PRESENCE only: 0 present / 3 thin / 2 none
python3 browser-post-pipeline/restore_session.py instagram --snippet > <scratch>/instagram_restore.js
```
1. `browser_navigate("https://www.instagram.com/")` (need a page in the context before addCookies).
2. `browser_run_code(<contents of <scratch>/instagram_restore.js>)` — injects the cookies.

#### 1.5 AUTHORITATIVE LIVENESS GATE (MANDATORY — do this BEFORE uploading)
**`--check` exit 0 does NOT mean the session works.** A platform can invalidate the session
SERVER-SIDE while the cookies sit unexpired on disk — `--check` stays green yet the uploader redirects
to a sign-in wall. So the real readiness test is an in-browser redirect probe:
```bash
python3 browser-post-pipeline/restore_session.py instagram --liveness   # -> {"live_url":..., "dead_marker":...}
```
1. `browser_navigate(live_url)` then read the landing URL: `browser_run_code("async (page)=>page.url()")`.
2. **DEAD** if the landing URL CONTAINS `dead_marker` (IG→`/accounts/login`) — i.e. it redirected to a
   login/account-chooser. **ALIVE** if it stayed on the real authed surface (IG edit profile).
3. **If DEAD → do NOT stumble into the uploader.** Fire the alert, then apply the policy fallback:
   ```bash
   python3 post-pipeline/alert.py --platform instagram --run <Name> \
     --reason "browser session server-side signed out (cookies present, --liveness landed on <dead_marker>)"
   ```
   (delivered per `config.notify.*`; always logged to `alerts.log`)
   - **Instagram** → post via **Metricool** only if `config.posting.metricool.enabled` and the brand
     `config.posting.metricool.blog_id` actually has Instagram connected (see `post-and-log`); otherwise HOLD.
   - When the user is available, run **Step 4** (user-assisted re-login) and re-save the session.
4. **If ALIVE →** `browser_navigate("https://www.instagram.com/")` and proceed to Step 2. (A snapshot
   confirming the Create/upload UI with no login wall is the secondary check; the redirect probe above is
   primary.)

### 2. Upload the file
- Click Instagram's "Select file/video" control → it opens a file chooser modal →
  `browser_file_upload(["<abs path under project>/.upload-tmp/<VIDEO>.mp4"])`.
- If the file chooser closed before upload (a prior error), click the select button AGAIN to reopen it,
  then call `browser_file_upload` immediately (the modal must be open).

### 3. Fill metadata, advance to the final pre-publish screen
- **Instagram:** dismiss the "shared as reels" popup (OK). **Crop → SET 9:16 (MANDATORY — vertical Reels, QCR-166) →** Next → **Edit** → Next → **New reel** caption screen. Click "Write a caption…" → type the caption (in `config.brand.language`) + hashtags. STOP here (test) or click **Share** (real).
  - **QCR-166 (a real reel once went out CROPPED TO SQUARE) — SET ASPECT TO 9:16 ON THE CROP SCREEN, MANDATORY for every vertical video.** IG's Crop step DEFAULTS to a **1:1 square** crop and clicking **Next** without changing it ships a center-cropped square Reel (the 1080×1920 source rendered as 720×720). FIX: on the Crop screen, BEFORE Next, click the **"Select crop"** control (bottom-left crop icon) → in the popup choose **"9:16"** (the portrait option; "Original" also works for a true 9:16 source, but pick **9:16** explicitly). Confirm the preview now fills the tall frame, THEN Next.
  - **IG IDEMPOTENCY PROTOCOL — share AT MOST ONCE, NEVER blind-repost (QCR-214).** A real reel once posted to IG **TWICE** because the share succeeded but the agent re-shared "to be safe" (the vanished-share/square-crop repost paths below had no guard). EVERY repost MUST be gated on a fresh grid check, so a still-live first copy is never duplicated:
    1. **BASELINE (before clicking Share):** open `instagram.com/<your-handle>/reels`, record the **shortcode of the top reel** and the **reel count**. This is the "before" state.
    2. **SHARE EXACTLY ONCE.** Click Share a single time. Then **poll** for the success signal (next bullet). Do NOT click Share again, do NOT re-open Create, do NOT restart the upload while a "Sharing" spinner is up — a lingering spinner is normal, not a failure.
    3. **BEFORE ANY REPOST (vanished share OR square crop), RECONCILE THE GRID FIRST.** Reload `…/reels` and compare against the baseline:
       - **A new reel with this video is already live** → the share **SUCCEEDED**. Do **NOT** repost. If exactly **one** new reel and it is 9:16 → done. If **two or more** copies exist → a duplicate already happened → **delete the extras** (… → Delete → confirm) until exactly **one** correct 9:16 copy remains.
       - **No new reel vs baseline** → the share truly didn't land → repost **once**, re-taking the baseline first.
    4. Only `delete-then-share` is allowed for the square-crop fix — **delete the bad copy and confirm the grid is back to baseline BEFORE sharing the 9:16 replacement.** Never `share-then-discover-two`.
  - **WAIT FOR THE SHARE TO COMPLETE (QCR-166) — do NOT navigate away while the "Sharing" spinner is up.** After clicking Share, poll until the **"Your reel has been shared"** text appears (or the Sharing dialog closes on success) — navigating away early (e.g. a ~14s fixed wait) can CANCEL the upload, so the reel silently never posts. Only then verify. **If unsure whether the share landed, RECONCILE THE GRID (idempotency protocol above) — never just re-share.**
  - **POST-PUBLISH ASPECT VERIFICATION (QCR-166), MANDATORY:** open the new reel and read the video's intrinsic dims — `page.evaluate(()=>{const v=document.querySelector('video');return v?{vw:v.videoWidth,vh:v.videoHeight}:null})`. Confirm **vh > vw (portrait, ratio ≈ 0.56 = 9:16)**. If it comes back **square (vw===vh)**, the crop defaulted to 1:1 → **delete the reel (… → Delete → confirm) and repost with 9:16 selected** (via the delete-then-share idempotency path above) until the posted reel verifies as portrait. Never leave a square-cropped vertical video live, and never leave **two** copies live.

### 4. Fresh login (only if the session lapsed)
Navigate to the Instagram login, let the USER log in directly in the browser window (creds in
`.claude/keys.md` → `## Instagram`). 2FA codes → the user enters them.
After login, **re-save the session** so next time skips login:
```
browser_run_code:  async (page) => { await page.context().storageState({ path: '<ABS>/.claude/auth/instagram-storage-state.json' }); return 'saved'; }
```

### 5. Re-save cookies after a successful real post (MANDATORY keep-alive)
Same `storageState({path})` call as Step 4, run after every successful browser post — not optional.
Re-saving rotates the session tokens so it stays alive; a session that never gets re-saved rots and
eventually falls over to a login wall.
```
browser_run_code:  async (page) => { await page.context().storageState({ path: '<ABS>/.claude/auth/instagram-storage-state.json' }); return 'saved'; }
```

## Captions
`config.brand.language` (default pt-BR) is mandatory. IG tuning per `how-to-post-videos.md` (≤5 hashtags).

## NOTES / gotchas (from the build)
- Navigating away from a half-finished upload triggers a **beforeunload / discard dialog** —
  handle it with `mcp__playwright__browser_handle_dialog(accept=true)`, then the navigation completes.
- `.claude/` and `.upload-tmp/` are gitignored — cookies + staged videos never get committed.
- `browser_take_screenshot(filename=...)` writes a viewport PNG (good for an evidence shot of the
  pre-publish screen). For a guaranteed on-disk path use `browser_run_code` → `page.screenshot({path})`.
- Cookie file domain: instagram.com.
