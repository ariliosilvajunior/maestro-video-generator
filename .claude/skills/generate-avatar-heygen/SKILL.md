---
name: generate-avatar-heygen
description: Phase 3 of the Maestro Video Generator pipeline. Generate a 1080x1920 HeyGen avatar video lip-synced to the already-approved PT-BR narration (config.avatar.*). The DEFAULT method (06/10/2026) is the HeyGen REST API — no browser, no login, so the Cloudflare block on the browser path never comes into play. The old browser editor (/create-v4 via Playwright MCP) is DORMANT (confirmed hard blocker — "flagged for suspicious activity" on every login attempt) and kept only as a fallback if the API is ever unavailable. Triggers — "generate heygen video", "create avatar video", "run heygen", "make the avatar speak the script".
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: generate-avatar-heygen (Phase 3 — HeyGen Avatar)

## 🛑 PRECONDITION — Phase 2.6 draft-narration approval MUST already be confirmed
**Never generate the avatar video for a script/narration the owner has not explicitly approved via
the Phase 2.6 draft-audio gate** (`write-script-ptbr` § "MANDATORY Phase 2.6", `PIPELINE_DIRECTIVES.md`
§2d). HeyGen credits are real money (API: a per-second pay-as-you-go wallet) and hard to undo — the
whole point of Phase 2.6 is to catch wording problems on the cheap ElevenLabs draft, not after an
expensive render. If you reach this skill and Phase 2.6 has not visibly happened, STOP and run it
first — do not treat this as implied or skippable.

**Verify, don't assume.** When `config.painel.enabled` is true, the approval of record lives in the
Painel do Dono, not the chat — re-confirm it before spending any HeyGen credit:
```bash
python3 post-pipeline/enviar_audio_preview_painel.py status --run "$MAESTRO_RUN"
```
Proceed ONLY on `audio_aprovado`. If it prints `aguardando_aprovacao_audio`, the owner has not
approved yet even if they said something encouraging in chat — wait and re-check, never take a
verbal "pode seguir" as a substitute for the Painel status. `rejeitado` → go back to
`write-script-ptbr` Phase 2.6, revise, resubmit. When `painel.enabled` is false, the chat-only
approval recorded in the run state is the fallback approval of record.

## 🛑 METHOD — HeyGen REST API (DEFAULT since 06/10/2026, no browser)
**Why:** the browser path (`/create-v4` via Playwright MCP) is DORMANT — HeyGen's login consistently
returns "flagged for suspicious activity" (Cloudflare anti-bot) for this environment's automated
browser, confirmed as a real, non-retry-fixable block (owner reviewed screenshots and confirmed
06/10/2026). The REST API sidesteps it entirely — it's an authenticated HTTPS call, Cloudflare's
browser-fingerprint checks never see it. This is the SAME HeyGen account + SAME avatar already used
live by the sibling project `ecossistema-ia-recursos-cognitivos` (`video_factory` agent,
`shared/heygen.py`) — same pattern proven there: upload the pre-made narration audio and lip-sync to
it (`audio_asset_id`), rather than text+voice_id (this avatar's engine, `avatar_v`, rejects
text+voice_id with a cloned ElevenLabs voice — "Voice validation failed", seen in practice there).

**Cost:** a prepaid pay-as-you-go wallet (separate from any subscription), already funded by the
owner (shared across this and the sibling project — check balance before a render if in doubt:
`GET https://api.heygen.com/v2/user/remaining_quota`, header `X-Api-Key`). Roughly R$5-20 per
~60-90s video depending on length — small and expected, not a "STOP, this costs money" trigger
(the owner explicitly chose and funded this path 06/10/2026).

### Run it
```bash
python3 heygen-pipeline/generate_avatar_api.py --run "$MAESTRO_RUN" \
    --audio <scratch>/<VideoName>_draft_narration.mp3
```
This is the SAME audio file the owner already approved in Phase 2.6 — the avatar lip-syncs to it
verbatim, so there is no risk of the rendered video saying something different from what was
approved. The script:
1. Uploads the audio as a HeyGen asset (`POST /v3/assets`).
2. Generates the video (`POST /v3/videos`, `type: "studio"`, one `avatar_video` scene using
   `config.avatar.heygen_avatar_id` + the uploaded `audio_asset_id` + `engine: {type: "avatar_v"}`,
   `aspect_ratio: "9:16"`, `resolution: "1080p"`).
3. Polls `GET /v3/videos/{id}` until `completed` (or exits loudly on `failed`).
4. Downloads straight to the per-run canonical path (QCR-180 — no shared intermediate file, so
   cross-run contamination is structurally impossible on this path): `<downloads>/<VideoName>_avatar_1080p.mp4`.
5. Pads to exactly 1080x1920 if the API ever returns a slightly different height, then runs the
   evidence gate (`ffprobe`: h264 / aac / duration > 0) — exits loudly if it fails.

**Render time:** ~3-6 minutes typically (observed: a 95.6s clip took 5 min). Poll, don't guess —
the script already does this and prints status every 20s.

### Next step
Transcribe the Phase-3 SRT from the per-run avatar file (same rule as the old browser path):
```bash
python3 subtitle-pipeline/transcribe_gemini_srt.py <downloads>/<VideoName>_avatar_1080p.mp4 \
    --output-dir <scratch> --name <VideoName> --language pt
```
**Known Gemini quirk (fixed 06/10/2026, still worth a glance):** for clips longer than ~60s, Gemini
used to truncate the transcript at exactly 60s (a fixed "~60 segments for a one-minute clip" example
in the prompt was being read as a hard time limit, not a scaling illustration — the prompt now tells
Gemini the real clip duration and scales the segment budget from it). If you ever see the script's
own `*** WARN TAIL-DROP ***` message, read it — it means the last few seconds of the audio aren't
captioned, and you need to append the missing SRT entry by hand from the known script text (do NOT
burn subtitles that silently omit the ending).

## INPUTS
- `<scratch>/<VideoName>_draft_narration.mp3` — the Phase 2.6-approved narration (exact text, exact
  audio the avatar must lip-sync to).
- `config.avatar.heygen_avatar_id` (the avatar's id in the API) + `config.avatar.heygen_voice_id`
  (kept for reference; not used by the audio-lip-sync path, since no text+voice_id generation
  happens). Resolve the API key via `resolve_key("heygen")` (`.claude/keys.md` `## HeyGen`).

## OUTPUTS
- **`<downloads>/<VideoName>_avatar_1080p.mp4` — the PER-RUN canonical avatar (QCR-180). Every
  downstream phase reads THIS.** Written directly by `generate_avatar_api.py` — no shared
  intermediate path exists on the API method, so the old "stale Quick-Avatar-Video-1080p.mp4"
  contamination class of bug cannot happen here.
- **Evidence gate:** `ffprobe` MUST show `h264 / 1080x1920 / aac` before Phase 4 — the script
  asserts this itself and exits loudly on failure; never proceed past a failed gate.

## PER-RUN AVATAR ISOLATION (MANDATORY — QCR-180)
Downstream phases read ONLY `<downloads>/<VideoName>_avatar_1080p.mp4`, never a shared path:
1. Phase 4 (motion) copies the avatar into the Remotion project (`motion-pipeline/remotion-agent`)
   FROM `<downloads>/<VideoName>_avatar_1080p.mp4`.
2. The Phase-3 SRT MUST be transcribed from `<downloads>/<VideoName>_avatar_1080p.mp4` (this run's
   avatar), and the audio↔subtitle gate (QCR-180, in `generate-subtitles` Step 0 and — when
   `config.qc.enabled` — `qc-gate-gemini` Step 0) re-verifies the embedded audio matches that SRT
   after the render.

---

## 🧊 DORMANT FALLBACK — browser method (Playwright MCP, `/create-v4`)
**Do NOT use this unless the owner explicitly confirms HeyGen's browser login is accessible again.**
Kept only in case the API is ever unavailable (outage, key revoked) and the owner wants to try the
browser as a stopgap. Full step-by-step: `heygen-pipeline/HEYGEN_INSTRUCTIONS.md` (still accurate as
a reference, just not the active path). Summary of the old flow, for when it's revived:
1. `browser_navigate` → `https://app.heygen.com/home`, log in if prompted (`.claude/keys.md`
   `## HeyGen` Email/Password) — **STOP immediately if the login shows "flagged for suspicious
   activity" or any captcha/2FA that doesn't auto-clear; do not retry repeatedly** (this is exactly
   what went wrong 06/10/2026 — confirmed, not a fluke).
2. AI Studio → "New video" → `/create-v4` → **Portrait (9:16)** → pick `config.avatar.name` /
   `config.avatar.look` → fill the approved script → Generate (1080p / MP4 / Watermark Off) →
   Submit (switch to `config.avatar.engine_fallback` if Avatar IV is out of credits, QCR-154).
3. Wait ~15-30 min, download the newest file by mtime, pad 1906→1920 if needed, ffprobe gate, copy
   to the per-run `<downloads>/<VideoName>_avatar_1080p.mp4` (QCR-180 — same final contract as the
   API path).
