---
name: generate-avatar-heygen
description: Phase 3 of the Maestro Video Generator pipeline. Generate a 1080x1920 HeyGen avatar video from the PT-BR script using YOUR avatar (config.avatar.*). The ONLY method is the AI Studio browser editor (/create-v4) driven by Playwright MCP — it uses the subscription credits (no extra cost). There is no other generation path. Triggers — "generate heygen video", "create avatar video", "run heygen", "make the avatar speak the script".
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: generate-avatar-heygen (Phase 3 — HeyGen Avatar)

**Read `heygen-pipeline/HEYGEN_INSTRUCTIONS.md` before running** — it carries the full, verified browser workflow with current selectors. There is exactly ONE method: the AI Studio browser editor (`/create-v4`) via Playwright MCP.

## 🛑 PRECONDITION — Phase 2.6 draft-narration approval MUST already be confirmed
**Never open the HeyGen editor for a script the owner has not explicitly approved via the
Phase 2.6 draft-audio gate** (`write-script-ptbr` § "MANDATORY Phase 2.6", `PIPELINE_DIRECTIVES.md`
§2d). HeyGen credits are real money and hard to undo — the whole point of Phase 2.6 is to catch
wording problems on the cheap ElevenLabs draft, not after an expensive avatar render. If you reach
this skill and Phase 2.6 has not visibly happened (no approval in this conversation / run state),
STOP and run it first — do not treat this as implied or skippable.

## WHY BROWSER (no extra cost)
The browser AI Studio editor uses the monthly subscription credits (example plan: AvatarIV = 20 credits/min, ~2000/mo ≈ ~100 short videos), so a short video is effectively free. A 55s clip drew ~19 credits. This is the only sanctioned generation path — drive it with Playwright MCP.

## INPUTS
- `<downloads>/<VideoName>_script.txt` (in `config.brand.language` — PT-BR by default — written with the `Write` tool, accents intact).
- Avatar: **ONE avatar per repo — `config.avatar.name`** (look `config.avatar.look` primary, `config.avatar.fallback_look` fallback). Never switch avatars mid-run. Voice `config.avatar.voice` auto-applies (it is bound to the avatar).

## OUTPUTS
- `<downloads>/Quick-Avatar-Video-1080p.mp4` (1080x1920, H.264 + AAC) — the raw download/pad target.
- **`<downloads>/<VideoName>_avatar_1080p.mp4` — the PER-RUN canonical avatar (QCR-180). Every downstream phase reads THIS, never the shared `Quick-Avatar` path.**
- The Avatar IV V4 export is **1080×1906** — pad to 1920. **Avatar III/V export native 1080×1920 — pad is a no-op; ffprobe the height FIRST and `cp` instead of re-encoding when it's already 1920 (skips a ~2-min re-encode; conditional command in HEYGEN_INSTRUCTIONS.md step 10).**
- **Evidence gate:** `ffprobe` MUST show `h264 / 1080x1920 / aac` before Phase 4.

## PER-RUN AVATAR ISOLATION (MANDATORY — QCR-180)
The shared fixed path `<downloads>/Quick-Avatar-Video-1080p.mp4` is overwritten by every run and was the root cause of a real cross-run contamination incident (a wrong/stale avatar at that path got embedded while the SRT+subtitles+motion belonged to the correct run). To make cross-run contamination structurally impossible:
1. **BEFORE the HeyGen download:** delete any stale shared file so a leftover can't be grabbed —
   `rm -f <downloads>/Quick-Avatar-Video-1080p.mp4`.
2. **IMMEDIATELY AFTER padding + the ffprobe gate passes:** copy to the per-run name and from then on reference ONLY it —
   `cp <downloads>/Quick-Avatar-Video-1080p.mp4 <downloads>/<VideoName>_avatar_1080p.mp4`.
3. Phase 4 (motion) copies the avatar into the Remotion project (`motion-pipeline/remotion-agent`) FROM `<downloads>/<VideoName>_avatar_1080p.mp4` — never from the shared path.
4. The Phase-3 SRT MUST be transcribed from `<downloads>/<VideoName>_avatar_1080p.mp4` (this run's avatar), and the audio↔subtitle gate (QCR-180, in `generate-subtitles` Step 0 and — when `config.qc.enabled` — `qc-gate-gemini` Step 0) re-verifies the embedded audio matches that SRT after the render.

## THE METHOD: browser AI Studio (Playwright MCP)
Full step-by-step in `heygen-pipeline/HEYGEN_INSTRUCTIONS.md`. Summary:
1. `browser_navigate` → `https://app.heygen.com/home` (login persists; if prompted: Use email → `<HEYGEN_EMAIL>` → Use password → `<HEYGEN_PASSWORD>` (from `.claude/keys.md` `## HeyGen`) → Log in; Cloudflare auto-clears; STOP on 2FA/captcha).
2. Home → **"Start from Scratch — Go to AI Studio"** → **"New video"** → `/create-v4` editor (close Brand Systems promo).
3. Click **"Portrait (9:16)"**.
4. Avatar selector → group header → **Recently Used / My Avatars → `<AVATAR_NAME>`** → look **`<AVATAR_LOOK>`** (click the card, not the overlay-covered img — QCR-110/QCR-125).
5. `browser_type` (fill) the script into the Script textbox. **If the box already has text (swapping a script), clear it first (focus → `ControlOrMeta+a` → `Delete`) — fill APPENDS to the rich-text box, it does not replace (QCR-032). Verify the duration estimate reflects ONE script (~60s, not ~130s) before Generate.**
6. **Generate** → dialog: 1080p / MP4 / Watermark Off / "uses N credits" → **Submit** → "Video submitted".
   - **OUT-OF-CREDITS → SWITCH TO AVATAR III, NEVER ESCALATE (QCR-154).** If the dialog says the Avatar IV cost EXCEEDS the remaining balance (e.g. *"will use 24 credits. You have 1 remaining"*) and **Submit is DISABLED**, do NOT ask, do NOT pause, do NOT click "Get credits" (that spends money). Click **"Switch to Avatar III"** (`config.avatar.engine_fallback`) — Submit becomes ENABLED at $0 (subscription-covered), the SAME avatar / look / voice carry over (only the motion engine changes), it exports native 1080×1920, and (when QC is enabled) it passes QC normally. This is the VIABLE-FALLBACK-FIRST rule (`PIPELINE_DIRECTIVES.md` §7): an unsupervised run takes the free resource-at-hand option automatically. Escalate ONLY if Avatar III ALSO cannot submit.
7. Wait on `/projects` (~15–30 min), Download → move to `<downloads>/Quick-Avatar-Video-1080p.mp4` → pad 1906→1920 → ffprobe gate → **`cp` to the per-run `<downloads>/<VideoName>_avatar_1080p.mp4` (QCR-180, see PER-RUN AVATAR ISOLATION above).**

## ENGINE FALLBACK — Avatar IV out of credits is NOT a hard blocker (QCR-154)
The Generate dialog defaults to **Avatar IV**, which draws premium subscription credits. When those are exhausted, the dialog offers **"Switch to Avatar III"** — the included/cheaper engine that renders the same avatar at $0. An unsupervised run MUST take this automatically (see step 6 + `PIPELINE_DIRECTIVES.md` §7). NEVER treat "Avatar IV out of credits" as a dead-credential blocker, and NEVER click "Get credits"/upgrade. A true HeyGen hard blocker is only: 2FA/captcha at login that won't auto-clear, a `VOICE_QUOTA_EXCEEDED` on `config.avatar.voice`, or Avatar III ALSO failing to submit.

## SLOW RENDER
The browser render can take ~15–30 min. WAIT IT OUT — there is no alternative generation path. A slow render is NOT a blocker; only escalate if it never surfaces a processing card (QCR-096) or after an extreme wait with the user reachable.
