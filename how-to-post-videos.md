# How to Post Videos — Instagram, Facebook, TikTok, YouTube Shorts

> **POLICY (house rule): Instagram is the ALWAYS-ON default network; Facebook/TikTok/YouTube are
> OPTIONAL, each gated by its own config toggle (`config.posting.metricool.networks.<network>`,
> OFF by default).** X/Twitter is NOT a posting target (no browser attempt, no Metricool call for it —
> leave it out of `providers` always). Instagram posts via **BROWSER** (`post-browser-manual`) to your
> account (`config.posting.instagram_handle`) by default; **Metricool is the fallback for Instagram**
> AND the **only path for Facebook/TikTok/YouTube** (no browser automation exists for those — Metricool
> or nothing). Requires `config.posting.metricool.enabled` + a Metricool **Advanced or Custom** plan
> (the API is not available on Free/Starter) + `.blog_id`/`.user_id` on a brand that actually has each
> target network connected. A Metricool schedule id is NOT a live post — verify LIVE or HOLD for EVERY
> network in the same post, not just Instagram. See `post-and-log` / `post-browser-manual`.

> **Paths in this doc:** `<downloads>` = the pipeline output dir (config `paths.downloads`, default `~/Downloads`; `python3 lib/paths.py` prints it). `<scratch>` = the scratch dir (config `paths.tmp` / `MAESTRO_TMPDIR`).

## Overview

Instagram posts via the pipeline browser by default (Metricool as fallback). Facebook, TikTok and
YouTube Shorts — each OPTIONAL, config-gated — post via **ONE Metricool API call that can target
several networks at once** (the same `providers` array can list `instagram` + `facebook` + `tiktok`
+ `youtube` together), each with its own `*Data` block for network-specific options. Only include a
network in `providers` when its `config.posting.metricool.networks.<network>` toggle is `true` AND
you've confirmed (Metricool UI) that network is connected on the brand `blog_id`/`user_id` in use.

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

3. **Always add `"saveExternalMediaFiles": true` to the API call.** This makes Metricool download and host the file on its own CDN (`static.metricool.com`), which prevents "Container Publication failed" errors caused by external URL issues.

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

**When `config.posting.metricool.networks.facebook` / `.tiktok` / `.youtube` is `true`, also write:**
- **`FB_TEXT`** — same spirit as `IG_TEXT`; Facebook has no hard hashtag cap but keep 3-5, same no-generic-tags rule.
- **`TIKTOK_TEXT`** — shorter hook (TikTok truncates earlier, ~150 chars before fold too), same comment-CTA, 3-5 hashtags; TikTok audiences read more casually — looser tone is fine.
- **`YT_TITLE`** — a short, keyword-front-loaded Shorts TITLE (not a caption), ≤ 100 chars, no hashtags needed (YouTube indexes the title/tags fields, not inline hashtags in a Short's title).

**All text in `config.brand.language` (Brazilian Portuguese by default).** (X/Twitter is not a posting target — no fields for it, ever.)

### Step C: Post-call flag check (MANDATORY — Metricool path)

Right after the POST call, parse the response and assert `"draft": false` AND `"autoPublish": true`.
If the post comes back as a draft, fix it immediately (PUT update). Live publish is the DEFAULT — draft
only on explicit user request. (A stale "dry-test default" once caused 3 videos to land as silent drafts
while the log claimed they were posted.)

### Platform Text Specification

| Platform | Text Field | Visible Before Fold | Max Length | Hashtags | Tone |
|----------|-----------|---------------------|------------|----------|------|
| **Instagram** (always-on) | `text` (caption) | ~125 chars | 2200 chars | **3-5 max** (IG hard limit = 5) | Keyword-rich hook + save/share CTA. No generic tags. |
| **Facebook** (optional) | `text` is shared across every network in one `providers` call — if the FB caption needs to differ from IG, post Facebook in a SEPARATE API call with its own `text` | ~100 chars (link/page previews truncate early) | no hard cap | 3-5 (convention, not enforced) | Same hook, slightly more descriptive is fine |
| **TikTok** (optional) | same `text` sharing caveat as Facebook | ~150 chars | 2200 chars | 3-5 (convention) | Casual, faster hook |
| **YouTube Shorts** (optional) | `youtubeData.title`, NOT `text` | full title shown | 100 chars | none (use `youtubeData.tags` instead) | Keyword-front-loaded, searchable title |

**Current platform algorithm rules:**
- **Instagram**: 5 hashtag hard cap enforced. Natural keywords in caption > hashtags for reach. "Save/share" CTAs most weighted.
- **One `providers` call = one shared `text`.** If you need per-network caption wording (e.g. a TikTok-specific CTA), split into separate POST calls per network instead of one combined call — the `text` field is NOT per-network, only the `*Data` blocks are.

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

### Facebook / TikTok / YouTube Shorts — OPTIONAL, each gated by its own config toggle

> **Field reference is the live Metricool OpenAPI spec**, not guesswork — pulled from
> `https://app.metricool.com/api/swagger.json` (schemas `ScheduledPostFacebookData`,
> `ScheduledPostTikTokData`, `ScheduledPostYoutubeData`). The `type`/`privacy`/`privacyOption` string
> VALUES below (`REEL`, `public`, `PUBLIC_TO_EVERYONE`) are the standard values used by Meta/TikTok/
> YouTube's own content APIs that Metricool proxies — **not literally confirmed against a real
> Metricool response yet** (no network was connected when this was written). **Before the first real
> post to a newly-enabled network: send the call with `"draft": true` first**, confirm Metricool
> accepts the payload (no 400 on the `*Data` block) and that the draft shows the right settings in
> the Metricool UI, THEN repeat with `"draft": false` for the real post. Never skip this once-per-network
> check — same lesson as the "lost a week of reels" Instagram incident above, just for a network with
> no prior track record here.

> **Multi-network in ONE call** (same `text`, same video) — list every enabled network in `providers`
> and include each one's `*Data` block:
> ```json
> "providers": [{"network": "instagram"}, {"network": "facebook"}, {"network": "tiktok"}, {"network": "youtube"}]
> ```
> Only include a network here when BOTH `config.posting.metricool.networks.<network>` is `true` AND
> you've verified in the Metricool UI that this brand (`blog_id`) has that network connected — including
> an unconnected network silently publishes nothing for it (same failure mode as the IG case above) while
> the OTHER networks in the same call still go through.

**Facebook** (`config.posting.metricool.networks.facebook`) — vertical video → Facebook Reels:
```json
"facebookData": { "type": "REEL", "title": "FB_TEXT_HERE" }
```

**TikTok** (`config.posting.metricool.networks.tiktok`) — standard feed video (no Stories via API):
```json
"tiktokData": { "privacyOption": "PUBLIC_TO_EVERYONE", "title": "TIKTOK_TEXT_HERE", "disableComment": false, "disableDuet": false, "disableStitch": false, "isAigc": true }
```
`isAigc: true` is the TikTok-required AI-generated-content disclosure (this pipeline's videos are
AI-made end to end — HeyGen avatar, generated motion graphics — never omit it). No custom cover image
on non-Business accounts (API limitation) — Metricool auto-picks a video frame.

**YouTube Shorts** (`config.posting.metricool.networks.youtube`) — vertical ≤60s video auto-detected as a Short:
```json
"youtubeData": { "title": "YT_TITLE_HERE", "type": "SHORT", "privacy": "public", "madeForKids": false, "isAiGeneratedContent": true, "notifySubscribers": true }
```
`isAiGeneratedContent: true` — same disclosure requirement as TikTok, same reason (never omit). No
custom Shorts thumbnail via API (platform limitation, not a Metricool gap).

**Full multi-network example** (all four enabled):
```bash
curl -s -X POST "$MC_URL_IG" -H "X-Mc-Auth: $MC_AUTH" -H "Content-Type: application/json" \
  -d '{
    "text": "IG_CAPTION_HERE",
    "publicationDate": {"dateTime": "'$SCHEDULE_TIME'", "timezone": "<config.posting.metricool.timezone>"},
    "providers": [{"network": "instagram"}, {"network": "facebook"}, {"network": "tiktok"}, {"network": "youtube"}],
    "media": ["MEDIA_URL"],
    "autoPublish": true, "draft": false, "shortener": false, "saveExternalMediaFiles": true,
    "instagramData": {"type": "REEL", "showReelOnFeed": true, "collaborators": [], "carouselTags": {}},
    "facebookData": {"type": "REEL", "title": "FB_TEXT_HERE"},
    "tiktokData": {"privacyOption": "PUBLIC_TO_EVERYONE", "title": "TIKTOK_TEXT_HERE", "disableComment": false, "disableDuet": false, "disableStitch": false, "isAigc": true},
    "youtubeData": {"title": "YT_TITLE_HERE", "type": "SHORT", "privacy": "public", "madeForKids": false, "isAiGeneratedContent": true, "notifySubscribers": true}
  }'
# AFTER the slot passes: verify LIVE on EVERY enabled network individually (IG reel + FB reel + TikTok
# video + YouTube Short, each on the matching handle). A schedule id covers the whole call, not a
# per-network guarantee — one network silently failing (e.g. disconnected) does not fail the others.
```

---

## Important Notes

- **Video must be at a public URL** — Metricool fetches it remotely
- **Media format in API:** Must be `["url"]` array, NOT `[{"mediaId": "url"}]`
- **Brand:** `config.posting.metricool.blog_id` / `config.posting.metricool.user_id` — one brand, which must have EVERY enabled network connected (check the Metricool UI). **A network missing from that brand accepts the schedule and publishes nothing for it — the other networks in the same call still go through, so this fails silently per-network, not per-call.**
- **Plan requirement:** the Metricool API (any call, including the Instagram-only path above) needs an **Advanced or Custom** Metricool plan — Free/Starter have no API access at all.
- **Timezone:** `config.posting.metricool.timezone` (default America/Sao_Paulo)
- **saveExternalMediaFiles: true** — ALWAYS use. Makes Metricool cache the video on `static.metricool.com`, preventing "Container Publication failed" errors.
- **AI-content disclosure:** `tiktokData.isAigc` and `youtubeData.isAiGeneratedContent` must be `true` — every video from this pipeline is AI-generated (HeyGen avatar + generated motion graphics). Never omit these.

### Pipeline posting flow
- **Instagram** → always-on, BROWSER-first (`post-browser-manual`) with Metricool as FALLBACK (`config.posting.metricool.enabled`)
- **Facebook / TikTok / YouTube Shorts** → each OPTIONAL and OFF by default (`config.posting.metricool.networks.<network>`); Metricool-only, no browser path exists for these — when enabled, posted in the SAME Metricool call as Instagram (see Multi-network section above)
- **X/Twitter:** not a posting target — no browser attempt, no Metricool call, no alert, ever.

---

## Credentials Reference

All keys live in `.claude/keys.md` (see `.claude/keys.md.example`); `python3 bin/doctor.py` verifies them.
The Metricool token (`## Metricool`, header `X-Mc-Auth`) resolves via
`python3 -c 'import sys; sys.path.insert(0,"."); from lib.api_keys import resolve_key; print(resolve_key("metricool"))'` —
never hardcode tokens in documentation.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Add at least 1 image or video" | Media format is wrong — use `["url"]` not `[{"mediaId": "url"}]` |
| "Container Publication failed" (Instagram) | Add `"saveExternalMediaFiles": true` to the API call, or verify the media URL returns `content-length > 0` |
| catbox.moe URL returns content-length: 0 | Use `litterbox.catbox.moe` instead (72h temp hosting) — permanent catbox URLs expire silently |
| Post stuck in PENDING | Wait until scheduled time + 2-5 min — Metricool queues posts and processes them sequentially |

---

## Log row — `pipeline-log.csv` (CANONICAL column reference)

After posting is verified, append ONE row via **`python3 maestro_state.py log …`** (the flock-locked writer —
never a raw `echo >>` when other runs may be live). Append-only; never truncate.

**Columns (in order):** `date` (ISO, `config.brand.timezone`) · `avatar` (`config.avatar.name`) · `voice`
(`config.avatar.voice`) · `script_source` (YouTube/Instagram/TikTok link, or manual — where the SOURCE
content came from) · `script_rank` (@author) · `script_topic` (~60 chars, no commas/newlines) ·
`video_duration_s` · `heygen_file` · `motion_file` · `broll_file` · `final_file` · `catbox_url` ·
`ig_status` · `tiktok_status` (`SKIPPED` unless `config.posting.metricool.networks.tiktok` is `true`,
then `LIVE`/`HOLD` like `ig_status`) · `twitter_status` (**DEPRECATED, always `SKIPPED`** — X/Twitter
is not a posting target, no toggle exists for it) · `youtube_status` (`SKIPPED` unless
`config.posting.metricool.networks.youtube` is `true`, then `LIVE`/`HOLD`) · `qc_grade` (`DISABLED`
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
