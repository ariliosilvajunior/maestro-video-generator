#!/usr/bin/env bash
# UserPromptSubmit hook — Maestro Video Generator "paste a link = QUEUE it" (next-videos queue).
#
# HOUSE RULE: a bare social link (Instagram / YouTube / TikTok) is
# ENQUEUED to next-videos.jsonl and does NOT trigger the pipeline. The queued link is
# produced on the NEXT explicit pipeline execution (Stage-0 dispatch). This REPLACES the
# old "paste a link = run the full pipeline + post live" behavior, which spawned an
# immediate run on every link (the thing we are fixing). Spec: PIPELINE_DIRECTIVES.md §9 /
# next-videos-pipeline/NEXT_VIDEOS_INSTRUCTIONS.md.
#
# Behavior:
#   - BARE LINK DROP (the message is essentially just the URL) -> the hook itself runs
#     `next_videos.py add` for each social URL (storage guaranteed) and injects context
#     telling Claude to confirm + STOP, never run the pipeline.
#   - LINK + OTHER TEXT -> inject soft guidance (enqueue-or-handle, never auto-run); let
#     Claude judge. No auto-enqueue, no auto-run.
#   - No social link -> silent.
# Never blocks the prompt (always exits 0).

set -u

prompt="$(jq -r '.prompt // empty' 2>/dev/null || true)"
[ -z "$prompt" ] && exit 0

# Extract whole http(s) URLs, then keep only the social ones (bash 3.2 / BSD-grep safe).
urls="$(printf '%s' "$prompt" \
  | grep -oiE 'https?://[^[:space:]]+' 2>/dev/null \
  | grep -iE 'instagram\.com|youtube\.com|youtu\.be|tiktok\.com|vm\.tiktok\.com' 2>/dev/null || true)"
[ -z "$urls" ] && exit 0

repo="${CLAUDE_PROJECT_DIR:-$(pwd)}"
mgr="$repo/next-videos-pipeline/next_videos.py"
creators="$repo/creators-pipeline/creators.py"

# Capture the creator (IG/YT/TikTok profile) of a saved link into creators.jsonl.
# Runs DETACHED in the background: creator resolution is a yt-dlp NETWORK call (slow,
# IP-block risk) and must NEVER delay prompt submission. It is flock-atomic + idempotent
# (dedups by @handle), so a later re-run or `backfill --from-queue` is harmless. ONE
# request per saved link — the hook is the single owner of capture, so we never double-hit
# the platform. (builds a creator roster from saved links.)
capture_creator() {
  [ -f "$creators" ] || return 0
  nohup python3 "$creators" capture "$1" >>"$repo/creators-pipeline/capture.log" 2>&1 &
}

# Is the message essentially JUST a link (a bare drop)? Strip every URL, the `[PID nnnn]`
# session tag, the "ai video creator" routing label, then all non-alphanumerics. If almost
# nothing meaningful remains, it's a bare drop. (lowercase first — BSD sed has no `I` flag.)
remainder="$(printf '%s' "$prompt" \
  | sed -E 's#https?://[^[:space:]]+##g' \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/\[pid[ ]*[0-9]+\]//g; s/maestro video generator//g' \
  | tr -cd '[:alnum:]')"

if [ "${#remainder}" -le 3 ]; then
  # ── BARE LINK DROP → enqueue each, do NOT run ──────────────────────────────
  results=""
  while IFS= read -r u; do
    [ -z "$u" ] && continue
    out="$(python3 "$mgr" add "$u" 2>&1 || true)"
    capture_creator "$u"   # background: resolve + store the creator (creators.jsonl)
    results="${results}
  - ${out}"
  done <<EOF
$urls
EOF
  ctx="A bare social link was submitted (no other instruction). Per the NEXT-VIDEOS QUEUE directive (PIPELINE_DIRECTIVES.md §9 / root CLAUDE.md), this hook has ALREADY ENQUEUED it to next-videos.jsonl AND kicked off a background creator-capture (creators-pipeline/creators.py → creators.jsonl: resolves the video's author @handle via yt-dlp and stores them if new). Do NOT run the pipeline, do NOT call generate-video-from-link, do NOT post anything for this message. Just confirm to the user what is now queued (you may run: python3 next-videos-pipeline/next_videos.py list) and STOP. The queued link(s) will be produced on the NEXT explicit pipeline execution (\"run the pipeline\" → Stage-0 dispatch). If you want to confirm the creator was stored: python3 creators-pipeline/creators.py list (the background capture takes a few seconds; any miss is caught later by: python3 creators-pipeline/creators.py backfill --from-queue). Hook enqueue result:${results}"
  jq -n --arg ctx "$ctx" '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:$ctx}}'
  exit 0
fi

# ── LINK + OTHER TEXT → never auto-run; let Claude judge ──────────────────────
ctx='A social link is present alongside other text — do NOT auto-run the full pipeline just because a link appears (that old behavior was removed). Apply the NEXT-VIDEOS QUEUE rules (PIPELINE_DIRECTIVES.md §9): if the user is asking to PRODUCE/RUN a video from this link NOW, enqueue it (python3 next-videos-pipeline/next_videos.py add "<URL>" --front) then dispatch Stage 0; if they are just dropping it to be produced later, python3 next-videos-pipeline/next_videos.py add "<URL>" and stop; if the link is incidental to a different request (a question, a status report, an example), handle that request and do NOT enqueue. WHENEVER you enqueue a link here (either branch), ALSO capture its creator into the roster: python3 creators-pipeline/creators.py capture "<URL>" (resolves the author @handle, dedups, stores in creators.jsonl). The pipeline only ever runs from the queue via Stage-0 dispatch — never directly off a pasted link.'
jq -n --arg ctx "$ctx" '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:$ctx}}'
exit 0
