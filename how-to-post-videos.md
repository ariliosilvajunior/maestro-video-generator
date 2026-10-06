# How to Post Videos — Instagram, Facebook, TikTok, YouTube Shorts

> **POLICY (house rule): Instagram is the ALWAYS-ON default network; Facebook/TikTok/YouTube are
> OPTIONAL, each gated by its own config toggle (`config.posting.buffer.channels.<network>` set +
> `config.posting.buffer.enabled`).** X/Twitter is NOT a posting target — never post to it, in any
> path. Instagram posts via **BROWSER** (`post-browser-manual`) to your account
> (`config.posting.instagram_handle`) by default. **Facebook, TikTok and YouTube Shorts post through
> the Buffer GraphQL API** (`api.buffer.com`, Bearer token) — no browser automation exists for those,
> Buffer or nothing. Buffer's free plan covers this (`organization_id` + the 3 `channels` ids in
> `config.posting.buffer.*`) — no paid plan needed, unlike the Metricool path this repo tried first
> (documented below as an alternative; not the active path). A Buffer post id is NOT a live post until
> its `status` reads `buffer`/`sent` — verify LIVE or HOLD for EVERY enabled network, same as Instagram.
> See `post-and-log` / `post-browser-manual`.

> **Paths in this doc:** `<downloads>` = the pipeline output dir (config `paths.downloads`, default `~/Downloads`; `python3 lib/paths.py` prints it). `<scratch>` = the scratch dir (config `paths.tmp` / `MAESTRO_TMPDIR`).

## Overview

Instagram posts via the pipeline browser by default. Facebook, TikTok and YouTube Shorts — each
OPTIONAL, config-gated — post via **individual `createPost` mutations to the Buffer API**, one per
enabled network (Buffer's `createPost` takes a single `channelId`, so there is no single combined
multi-network call like Metricool's `providers` array — loop over the enabled channels instead).
Only post to a channel listed in `config.posting.buffer.channels.<network>` AND whose network toggle
you've confirmed is meant to be active (the id being present IS the toggle — an empty string means
off). Full field reference verified live against `https://developers.buffer.com` and a real test
post+delete on this account's TikTok channel on 2026-10-06 — see `types/TikTokPostMetadataInput`,
`types/YoutubePostMetadataInput`, `types/FacebookPostMetadataInput` for the source of truth if a
field ever looks wrong.

---

## CRITICAL: File Hosting Rules

**catbox.moe permanent URLs (`files.catbox.moe`) expire silently** — they return `content-length: 0` after some hours, causing the post to fail. Use one of these instead:

1. **litterbox.catbox.moe (RECOMMENDED)** — Temporary hosting (72h expiry), URLs remain valid and return proper content-length:
```bash
PUBLIC_URL=$(curl -F "reqtype=fileupload" -F "time=72h" -F "fileToUpload=@/path/to/video.mp4" https://litterbox.catbox.moe/resources/internals/api.php)
```

1b. **FALLBACK: uguu.se (48h expiry)** — use ONLY when litterbox is down. Known outage mode: litterbox returns HTTP 500 for any mp4/binary upload while tiny text files still succeed — if 3+ retries (including `--http1.1`) fail this way, switch to uguu. NOT 0x0.st (uploads disabled) and NEVER file.io (single-download URLs):
```bash
PUBLIC_URL=$(curl -s -F "files[]=@/path/to/video.mp4" "https://uguu.se/upload?output=text")
# 48h expiry, ~128MB cap. Verify content-length matches the local file size before posting.
# Verified working: a real run published from a uguu URL.
```

2. **Always verify the URL works before posting:**
```bash
curl -sI "$PUBLIC_URL" | grep content-length
# Must show content-length > 0. If 0, the URL is dead — re-upload.
```

3. **For Instagram's Metricool fallback path (below), add `"saveExternalMediaFiles": true` to the API call** — makes Metricool cache the file on its own CDN, preventing "Container Publication failed" errors. **Buffer has no equivalent flag — it fetches the URL at publish time**, so the hosted URL must stay live until the post actually publishes, not just when `createPost` is called (litterbox's 72h window comfortably covers immediate/near-now posting; never use a short-lived or signed URL).

---

## Method 1: Full Pipeline Posting (Recommended)

> **CANONICAL** — the full Phase-12 posting implementation lives HERE. Browser-first path: `post-browser-manual` skill; the Metricool call below is the optional fallback.

**Flow:** Read transcript → Agent writes the Instagram caption → Post.

### Step A: Extract the transcript from the SRT

```bash
TRANSCRIPT=$(sed '/^[0-9]*$/d; /^$/d; /-->/d' <scratch>/VideoName.srt | tr '\n' ' ' | sed 's/  */ /g')
```

### Step B: Agent-written caption (in `config.brand.language`, default pt-BR, for `@<your-handle>`)

**`IG_TEXT` — Instagram Reel caption (always written; Instagram is always-on):**
- Keyword-rich hook under 150 chars (visible before "...more" truncation)
- New line with save/share CTA (e.g., "Salva pra ver depois" / "Manda pra alguém que precisa ver isso")
- Include the comment-CTA: `Comenta '<KEYWORD>' que eu te mando o link no direct` (keyword settled in Phase 11 — automated via ManyChat when `config.manychat.enabled`, otherwise you answer by hand)
- End with exactly 3-5 niche hashtags (IG hard cap = 5, NEVER exceed); no generic tags (#fyp, #viral, #reels); max 1-2 emojis

**When `config.posting.buffer.channels.facebook` / `.tiktok` / `.youtube` is set (non-empty), also write:**
- **`FB_TEXT`** — same spirit as `IG_TEXT`; Facebook has no hard hashtag cap but keep 3-5, same no-generic-tags rule.
- **`TIKTOK_TEXT`** — shorter hook (TikTok truncates earlier, ~150 chars before fold too), same comment-CTA, 3-5 hashtags; TikTok audiences read more casually — looser tone is fine.
- **`YT_TITLE`** — a short, keyword-front-loaded Shorts TITLE (not a caption), ≤ 100 chars, no hashtags needed (YouTube indexes the title/tags fields, not inline hashtags in a Short's title).

**All text in `config.brand.language` (Brazilian Portuguese by default).** (X/Twitter is not a posting target — no fields for it, ever.)

### Step C: Post-call flag check (MANDATORY)

**Instagram's Metricool fallback path:** right after the POST call, parse the response and assert
`"draft": false` AND `"autoPublish": true`. If the post comes back as a draft, fix it immediately (PUT
update). Live publish is the DEFAULT — draft only on explicit user request. (A stale "dry-test default"
once caused 3 videos to land as silent drafts while the log claimed they were posted.)

**Buffer path (Facebook/TikTok/YouTube):** the `createPost` input's `saveToDraft` field must be
**absent or `false`** for a real post — same failure mode as Metricool's `draft` flag, just a
different field name. `saveToDraft: true` is ONLY for the once-per-new-channel verification test
below, never for a real run.

### Platform Text Specification

| Platform | Text Field | Visible Before Fold | Max Length | Hashtags | Tone |
|----------|-----------|---------------------|------------|----------|------|
| **Instagram** (always-on) | `text` (caption) | ~125 chars | 2200 chars | **3-5 max** (IG hard limit = 5) | Keyword-rich hook + save/share CTA. No generic tags. |
| **Facebook** (optional) | `text` on that channel's own `createPost` call | ~100 chars (link/page previews truncate early) | no hard cap | 3-5 (convention, not enforced) | Same hook, slightly more descriptive is fine |
| **TikTok** (optional) | `text` on that channel's own `createPost` call | ~150 chars | 2200 chars | 3-5 (convention) | Casual, faster hook |
| **YouTube Shorts** (optional) | `metadata.youtube.title`, NOT `text` (Buffer's YouTube upload has no separate description field exposed — `title` is what shows) | full title shown | 100 chars | none (use the title itself for keywords) | Keyword-front-loaded, searchable title |

**Current platform algorithm rules:**
- **Instagram**: 5 hashtag hard cap enforced. Natural keywords in caption > hashtags for reach. "Save/share" CTAs most weighted.
- **Buffer's `createPost` is already per-channel** (one `channelId` per call), so each network naturally gets its own `text` — no shared-caption caveat like the old Metricool multi-network call had.

### API Call Structure

> **Slow-POST guard.** A Metricool POST can take 60–150s to respond; a client with a 60s read
> timeout will raise mid-request even though the post WAS created server-side. **Use a ≥150s
> timeout, and if a POST call errors/times out, GET the scheduler list for today and check whether
> the post already exists BEFORE retrying** — blindly re-POSTing the timed-out platform creates a
> duplicate. (curl has no default read timeout, so the documented curl calls are safe; this matters
> when scripting via urllib/requests — set `timeout=150`.)

> **🛑 Post Instagram ONLY on a Metricool brand that actually has Instagram connected**
> (`config.posting.metricool.blog_id`). Scheduling IG on a brand with no IG connected returns an id but
> publishes NOTHING — a real account lost a week of reels exactly that way. Also: a returned schedule
> `id` is **NOT** a live post — confirm the reel is LIVE (IG shortcode on `@<your-handle>`) before
> treating it as posted, else HOLD.

```bash
MC_AUTH=$(python3 -c 'import sys; sys.path.insert(0,"."); from lib.api_keys import resolve_key; print(resolve_key("metricool"))')   # .claude/keys.md ## Metricool
MC_BLOG=$(python3 -c 'import sys; sys.path.insert(0,"."); from lib import config; print(config.get("posting.metricool.blog_id"))')
MC_USER=$(python3 -c 'import sys; sys.path.insert(0,"."); from lib import config; print(config.get("posting.metricool.user_id"))')
MC_URL_IG="https://app.metricool.com/api/v2/scheduler/posts?blogId=$MC_BLOG&userId=$MC_USER"  # the brand with your networks connected
# Prefer near-now (now+5min) so the 72h litterbox host doesn't expire before publish and you can verify LIVE.
SCHEDULE_TIME=$(python3 post-pipeline/compute_next_slot.py --auth "$MC_AUTH")  # reads blog/user ids + timezone from config; fails safe to now+5min

# Instagram — post to the brand. saveExternalMediaFiles prevents "Container Publication failed".
curl -s -X POST "$MC_URL_IG" -H "X-Mc-Auth: $MC_AUTH" -H "Content-Type: application/json" \
  -d '{"text": "IG_CAPTION_HERE", "publicationDate": {"dateTime": "'$SCHEDULE_TIME'", "timezone": "<config.posting.metricool.timezone>"}, "providers": [{"network": "instagram"}], "media": ["MEDIA_URL"], "autoPublish": true, "draft": false, "shortener": false, "saveExternalMediaFiles": true, "instagramData": {"type": "REEL", "showReelOnFeed": true, "collaborators": [], "carouselTags": {}}}'
# AFTER the slot passes: confirm it published LIVE (IG reel shortcode on @<your-handle>). Schedule id != live.
```

### Facebook / TikTok / YouTube Shorts — Buffer API, each gated by its channel id being set

> **Field reference is the live Buffer GraphQL schema**, not guesswork — pulled from
> `https://developers.buffer.com/types/{TikTokPostMetadataInput,YoutubePostMetadataInput,
> FacebookPostMetadataInput}.md` + the enum pages `PostTypeFacebook` / `YoutubePrivacy`, and
> **confirmed working with a real `createPost` (saveToDraft:true) + `deletePost` round-trip** on this
> account's TikTok channel on 2026-10-06 (post id `6ac514a16531870e15cd3abc`, created then deleted —
> see git history for the exact request if this ever needs re-verifying). **Still do the same
> once-per-new-channel dry run before the FIRST real post on Facebook and YouTube specifically**
> (only TikTok has been live-tested) — `saveToDraft: true`, confirm no `MutationError`, confirm the
> draft shows right in the Buffer UI, THEN drop `saveToDraft` for the real post.

**Endpoint + auth** (every call):
```bash
BUFFER_AUTH=$(python3 -c 'import sys; sys.path.insert(0,"."); from lib.api_keys import resolve_key; print(resolve_key("buffer"))')   # .claude/keys.md ## Buffer
BUFFER_URL="https://api.buffer.com"
# config.posting.buffer.organization_id / .channels.{facebook,youtube,tiktok} — already resolved for this account, no discovery call needed
```
Every request is a POST to `$BUFFER_URL` with header `Authorization: Bearer $BUFFER_AUTH`,
`Content-Type: application/json`, body `{"query": "<graphql mutation>"}`. One `createPost` call per
enabled network — there is no combined multi-network call like Metricool had.

**Facebook** (`config.posting.buffer.channels.facebook`) — vertical video → Facebook Reels:
```graphql
mutation {
  createPost(input: {
    text: "FB_TEXT_HERE"
    channelId: "<config.posting.buffer.channels.facebook>"
    schedulingType: automatic
    mode: addToQueue
    assets: [{ video: { url: "MEDIA_URL" } }]
    metadata: { facebook: { type: reel } }
  }) {
    ... on PostActionSuccess { post { id status } }
    ... on MutationError { message }
  }
}
```

**TikTok** (`config.posting.buffer.channels.tiktok`) — standard feed video (no Stories via API):
```graphql
mutation {
  createPost(input: {
    text: "TIKTOK_TEXT_HERE"
    channelId: "<config.posting.buffer.channels.tiktok>"
    schedulingType: automatic
    mode: addToQueue
    assets: [{ video: { url: "MEDIA_URL" } }]
    metadata: { tiktok: { isAiGenerated: true } }
  }) {
    ... on PostActionSuccess { post { id status } }
    ... on MutationError { message }
  }
}
```
`isAiGenerated: true` is the TikTok-required AI-generated-content disclosure (this pipeline's videos
are AI-made end to end — HeyGen avatar, generated motion graphics — never omit it). No custom cover
image on non-Business accounts (TikTok's own API limitation, not Buffer's) — a video frame is used.

**YouTube Shorts** (`config.posting.buffer.channels.youtube`) — vertical ≤60s video auto-detected as a Short:
```graphql
mutation {
  createPost(input: {
    text: ""
    channelId: "<config.posting.buffer.channels.youtube>"
    schedulingType: automatic
    mode: addToQueue
    assets: [{ video: { url: "MEDIA_URL" } }]
    metadata: {
      youtube: {
        title: "YT_TITLE_HERE"
        categoryId: "<config.posting.buffer.youtube_category_id>"
        privacy: public
        isAiGenerated: true
        madeForKids: false
        notifySubscribers: true
      }
    }
  }) {
    ... on PostActionSuccess { post { id status } }
    ... on MutationError { message }
  }
}
```
`isAiGenerated: true` — same disclosure requirement as TikTok, same reason (never omit).
`categoryId` is REQUIRED on create (`config.posting.buffer.youtube_category_id` defaults to `"27"` =
Education, fits this account's niche) — see `types/YoutubePostMetadataInput.md` for the full id list
if the niche ever changes. `text` can stay empty for YouTube; `title` is what actually shows.

**Sending a call** (escape the GraphQL string into JSON, e.g. via Python so quoting is safe):
```bash
python3 -c '
import json, urllib.request, os
query = """mutation { createPost(input: { text: "TIKTOK_TEXT_HERE", channelId: "CHANNEL_ID", schedulingType: automatic, mode: addToQueue, assets: [{ video: { url: "MEDIA_URL" } }], metadata: { tiktok: { isAiGenerated: true } } }) { ... on PostActionSuccess { post { id status } } ... on MutationError { message } } }"""
req = urllib.request.Request(
    "https://api.buffer.com",
    data=json.dumps({"query": query}).encode(),
    headers={"Authorization": f"Bearer {os.environ[\"BUFFER_AUTH\"]}", "Content-Type": "application/json"},
)
print(urllib.request.urlopen(req, timeout=60).read().decode())
'
```
**MANDATORY after every call — check the response for `MutationError` before moving on**, then
AFTER the slot passes, verify LIVE on that network individually (FB reel on the Page, TikTok video on
the account, YouTube Short on the channel) — a returned `post.id` with `status: buffer` is "queued",
not "live"; only `status: sent` (or a confirmed live URL on the platform itself) counts.

---

## Important Notes

- **Video must be at a public, stable URL** — Buffer fetches it at publish time (not at `createPost`
  time), so it must still be reachable when the scheduled slot arrives, not just when you call the API.
- **No media-format quirk on Buffer** — `assets: [{ video: { url: "..." } }]` is the whole shape, no
  separate normalize step like Metricool needed.
- **Channels:** `config.posting.buffer.organization_id` + `.channels.{facebook,youtube,tiktok}` — each
  channel id already resolved for this account (`python3 -c '...account{organizations{id}}...'` /
  `channels(input:{organizationId})` if they ever need re-fetching, e.g. after reconnecting a channel).
- **Plan requirement:** none — Buffer's free plan (1 API key, 3,000 requests/month) covers this; no
  paid upgrade needed, unlike the Metricool path this repo tried first.
- **`saveToDraft`** — omit it (or `false`) for a real post; `true` only for the once-per-new-channel
  verification dry run (see above).
- **AI-content disclosure:** `metadata.tiktok.isAiGenerated` and `metadata.youtube.isAiGenerated` must
  be `true` — every video from this pipeline is AI-generated (HeyGen avatar + generated motion
  graphics). Never omit these.
- **Known Buffer reliability caveat:** Buffer has had real incidents (a March 2026 outage affecting
  TikTok posting specifically) and occasional sync/duplicate complaints — this is WHY the "verify
  LIVE, not just a returned id" rule above is non-negotiable here, same as it already was for
  Metricool/Instagram. At this account's volume (1 video/week) the exposure is low, but never skip
  the live-verify step on the assumption Buffer "probably worked."

### Pipeline posting flow
- **Instagram** → always-on, BROWSER-first (`post-browser-manual`) with Metricool as an optional
  fallback (`config.posting.metricool.enabled`, off by default — this account doesn't have it active)
- **Facebook / TikTok / YouTube Shorts** → each OPTIONAL, active when its
  `config.posting.buffer.channels.<network>` id is set; Buffer-only, no browser path exists for these
  — one `createPost` call per enabled network (see section above)
- **X/Twitter:** not a posting target — no browser attempt, no API call, no alert, ever.

---

## Credentials Reference

All keys live in `.claude/keys.md` (see `.claude/keys.md.example`); `python3 bin/doctor.py` verifies them.
The Buffer token (`## Buffer`, header `Authorization: Bearer <token>`) resolves via
`python3 -c 'import sys; sys.path.insert(0,"."); from lib.api_keys import resolve_key; print(resolve_key("buffer"))'`.
The Metricool token (`## Metricool`, header `X-Mc-Auth`) resolves the same way with `resolve_key("metricool")` —
only relevant if the Instagram browser fallback is ever needed and Metricool gets enabled.
Never hardcode tokens in documentation.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `MutationError: "Failed to fetch image dimensions: Not Found"` (Buffer) | The video URL isn't public/stable — open it in an incognito window; if it prompts a login or 404s, re-host it (see File Hosting Rules above) |
| `MutationError: "Channel not found"` (Buffer) | Wrong `channelId` — re-run the channel-listing query against `config.posting.buffer.organization_id` and update config |
| Buffer post stuck at `status: buffer` past its slot | Check Buffer's own status page / the account's Publish queue — this pipeline has hit real Buffer outages before (see reliability caveat above); HOLD and retry, don't assume it quietly succeeded |
| "Add at least 1 image or video" (Metricool, Instagram fallback) | Media format is wrong — use `["url"]` not `[{"mediaId": "url"}]` |
| "Container Publication failed" (Metricool, Instagram fallback) | Add `"saveExternalMediaFiles": true` to the API call, or verify the media URL returns `content-length > 0` |
| catbox.moe URL returns content-length: 0 | Use `litterbox.catbox.moe` instead (72h temp hosting) — permanent catbox URLs expire silently |

---

## Log row — `pipeline-log.csv` (CANONICAL column reference)

After posting is verified, append ONE row via **`python3 maestro_state.py log …`** (the flock-locked writer —
never a raw `echo >>` when other runs may be live). Append-only; never truncate.

**Columns (in order):** `date` (ISO, `config.brand.timezone`) · `avatar` (`config.avatar.name`) · `voice`
(`config.avatar.voice`) · `script_source` (YouTube/Instagram/TikTok link, or manual — where the SOURCE
content came from) · `script_rank` (@author) · `script_topic` (~60 chars, no commas/newlines) ·
`video_duration_s` · `heygen_file` · `motion_file` · `broll_file` · `final_file` · `catbox_url` ·
`ig_status` · `tiktok_status` (`SKIPPED` unless `config.posting.buffer.channels.tiktok` is set,
then `LIVE`/`HOLD` like `ig_status`) · `twitter_status` (**DEPRECATED, always `SKIPPED`** — X/Twitter
is not a posting target, no toggle exists for it) · `youtube_status` (`SKIPPED` unless
`config.posting.buffer.channels.youtube` is set, then `LIVE`/`HOLD`) · `qc_grade` (`DISABLED`
unless `config.qc.enabled`) · `qc_iterations` · `broll_1_timestamp`…`broll_4_timestamp` (seconds) ·
`fal_model` (legacy header, write `-`) · `notes` (record Facebook's status here too — the row has no
dedicated `facebook_status` column; write e.g. `fb=LIVE` / `fb=SKIPPED` in `notes`).

Values with commas → wrap in double quotes. Confirm with `tail -1 pipeline-log.csv`.
Then (link-driven runs) remove the queue entry: `python3 next-videos-pipeline/next_videos.py done --run "$MAESTRO_RUN"`.

---

## FINAL STEP — after a verified live post: the final stays local

After the post is live + log row + CTA settled (`live` or `manual`) + queue `done`, the posted final
`<downloads>/<Name>_music.mp4` **stays in `<downloads>`** — archive it wherever you like (optional). The
pipeline never deletes your media. HELD runs (build-but-don't-post) change nothing here either.

Optional tidy-up of the browser-upload staging copy only (never the final):

```bash
# Use `find -delete`, NOT a multi-glob `rm -f`: zsh ABORTS the whole rm line if ANY glob has no match
# (`nomatch`), so a run with e.g. no leftover file would skip deleting everything else too. find is
# nomatch-safe + shell-agnostic:
find .upload-tmp -maxdepth 1 -name '<Name>*' -delete 2>/dev/null || true
```

KEEP: `pipeline-runs/`, `pipeline-log.csv`, ledgers, the comp `.tsx`, and the Remotion project's
`public/assets/<Name>/` + `public/refs/` (re-render pool).
