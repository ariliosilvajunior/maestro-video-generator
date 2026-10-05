# CREATOR STORAGE — roster of the creators you reproduce from

Whenever a source video link is **saved to the NEXT-VIDEOS QUEUE**, the repo also records **WHO made
that video** — their Instagram / YouTube / TikTok profile — into a deduped roster
(`creators.jsonl`). Over time this gives you a clean list of the creators behind every link you
pull from, to later do other things with (outreach, credit, dashboards, source-quality scoring).

**For now the requirement is only:** on each saved link, get the creator, check if they're already
in storage, and add them if not. This pipeline is that mechanism — nothing more.

## How it hooks into the save action (automatic)

The save action is `next_videos.py add` (run by the `UserPromptSubmit` hook
`.claude/hooks/detect-video-link.sh` on a bare-link drop). That hook ALSO fires a
**background** creator-capture for each saved link:

```bash
nohup python3 creators-pipeline/creators.py capture "<URL>" >> creators-pipeline/capture.log 2>&1 &
```

- It runs **detached in the background** so the network call (yt-dlp) NEVER delays prompt
  submission, and it's the **single owner** of capture (one request per saved link — the platform is
  never double-hit).
- Capture is **idempotent + flock-atomic**: re-running it, or running `backfill` later, never
  creates duplicates. If a link is enqueued by some other path, the catch-up command below stores
  any creators that were missed.

## How a creator is resolved (no login, metadata only)

A bare reel/short permalink (`instagram.com/reel/<shortcode>`) does NOT contain the username, so
it is resolved with **`yt-dlp --skip-download -J <URL>`** (validated on a live queue,
**no cookies / no login**). The video is NOT downloaded — metadata only.

| yt-dlp field | maps to | example |
|---|---|---|
| `channel` | `username` (the @handle — canonical dedup key) | `creator_handle` |
| `uploader` | `display_name` | `Creator Name` |
| `uploader_id` | `uploader_id` (stable numeric id — fallback key) | `12345678901` |

Dedup key = `(platform, username)`, falling back to `(platform, uploader_id)` when no handle.

## Storage — `creators.jsonl` (repo root)

One JSON object per creator (same atomic `flock` + temp-file + `os.replace` pattern as
`next_videos.py` / `maestro_state.py`, QCR-173 — concurrency-safe):

```json
{"username": "creator_handle", "display_name": "Creator Name", "platform": "instagram",
 "uploader_id": "12345678901", "profile_url": "https://www.instagram.com/creator_handle",
 "first_seen_at": "...", "last_seen_at": "...", "video_count": 2,
 "source_urls": ["https://www.instagram.com/reel/<shortcode>", "..."], "note": ""}
```

A repeat sighting of the same creator does NOT add a row — it appends the new `source_url`,
bumps `video_count`, and updates `last_seen_at`. **Never hand-edit `creators.jsonl`** — always go
through `creators.py`.

## Commands

| Command | Use |
|---|---|
| `capture "<URL>"` | Resolve the creator, dedup, store if new. **This is the save-time step** (the hook runs it in the background). |
| `resolve "<URL>"` | Print resolved creator fields WITHOUT saving (testing / inspection). |
| `has <username> [--platform instagram]` | Exit 0 if the creator is already stored, else exit 1. |
| `list` | Human-readable roster (handle, name, platform, #videos, profile URL). |
| `count` | Number of distinct creators stored. |
| `backfill [--from-queue] [URLs...] [--space 7] [--jitter 3]` | Capture every active next-videos entry (and/or explicit URLs), **spacing requests** to avoid IP blocks. The catch-up / safety net. |

## IP-block care

- A single `capture` = one request — fine.
- `backfill` SPACES requests with a jittered sleep (default ~7s + up to 3s) so the platform is
  never hammered. Validated: a 14-URL queue backfill ran clean.

## Known limitation

Some Instagram reels intermittently demand login (`yt-dlp` returns *"requested without being
logged-in"*). That's per-reel gating, **not** an IP block (requests right after a gated one still
succeed). Such a link is reported `UNRESOLVED` and simply skipped — the storage is never blocked by
one failure. Retry later with `python3 creators-pipeline/creators.py backfill --from-queue`
(idempotent), or `capture "<URL>"` the single link again.

## Validated behaviour

A 14-link queue backfill stored **12 distinct creators**, with a creator seen twice correctly
deduped (1 row, 2 source videos). 1 reel was login-gated (skipped, retriable). File:
`creators.jsonl` at the repo root.
