# B-Roll Pipeline Instructions

> # ⭐ B-ROLL = STOCK ONLY ($0, real internet footage), MISSES → HAND-DRAWN MOTION
> **The ONLY b-roll source is stock via `broll-pipeline/select_stock_brolls.py` (skill `select-brolls-stock`).** There is NO AI-generated b-roll in this pipeline — no generative-video API, no AI-generated video/images (house rule).
>
> **Key architecture:** b-roll SELECTION runs in **Phase 4, BEFORE motion (Phase 5)**. For each candidate window the selector queries Pexels/Pixabay/Coverr (`orientation=portrait`, true 1080x1920 real footage); a window with an acceptable clip is a **HIT**, a window with none is a **MISS**. **MISS windows are filled by a hand-drawn MOTION scene in Phase 5 — never left empty, NEVER AI-generated.** Phase 7 (`insert_brolls.py`) splices only the HIT clips.
>
> **Workflow:** (1) agent decides candidate windows in the visual plan; (2) write `<Name>_broll_queries.json` (one ENGLISH keyword-list per window, abstract/cinematic-tech, avoid faces); (3) run `select_stock_brolls.py --plan-file ... --queries-file ...`; (4) **`Read` each `<scratch>/<Name>_stockframe_N.png` and reject any clip with a human FACE, on-screen TEXT, or that is off-topic** → re-run that window (`--only-window N`) with better keywords or drop it → that window becomes MOTION; (5) record HITs (→ broll_windows) and MISSes (→ motion_segments) for Phase 5.
>
> Stock keys: free, in `.claude/keys.md` (`## Pexels` required; `## Pixabay` + `## Coverr` optional — `config.stock.sources`). CDN download links need a browser User-Agent (the script sets it).
>
> **6-section-grammar videos (the premium-classic default) skip the stock b-roll steps** (Phases 4-stock and 7) — their visual variety comes from motion ideas, real screenshots and the full-frame/split canvases, and subtitles burn straight onto `_motion.mp4` (see `generate-motion-remotion`). Everything below describes the stock-b-roll path.

## Overview

B-rolls are short (3-5 second) real stock-footage clips inserted into the main video to illustrate concepts being discussed. They **completely replace** the visual (avatar + motion graphics) while the original audio continues uninterrupted. This creates a professional, TV-quality feel that dramatically improves viewer retention.

**Why b-rolls improve engagement:**
- Break visual monotony of a single talking head
- Illustrate abstract concepts with concrete visuals
- Signal production quality (viewers associate b-roll with professional content)
- Create natural "breathing room" for the audience
- Increase average watch time by 15-25% (industry benchmark)

**Pipeline position:** Phase 4 (Select — BEFORE the motion build) + Phase 7 (Insert — after the motion render), before Subtitles (Phase 8).

**Input:** `VideoName_motion.mp4` (avatar + motion graphics merged)
**Output:** `VideoName_broll.mp4` (with 4 b-roll clips inserted: 1 hook + 3 body)

---

## Phase 4: Select B-Rolls — STOCK ONLY (see the `select-brolls-stock` skill)

> B-roll selection is `broll-pipeline/select_stock_brolls.py` (skill `select-brolls-stock`):
> agent writes one ENGLISH keyword-list per window → run the selector → frame-gate each
> `<scratch>/<Name>_stockframe_N.png` (reject faces/text/off-topic) → HITs go to
> `broll_windows`, MISSes become hand-drawn MOTION scenes (Phase 5 motion). Then Phase 7
> (`insert_brolls.py`, below) splices only the HIT clips. NO AI generation, ever.

## Phase 7: Insert B-Rolls into Merged Video

### Step 7.1: Review the Manifest

The selector (`select_stock_brolls.py`) writes a JSON manifest at `<downloads>/VideoName_broll_manifest.json` — HITs only, in the exact shape `insert_brolls.py` consumes:

```json
{
  "video_name": "VideoName",
  "main_video": "<downloads>/VideoName_motion.mp4",
  "brolls": [
    {"file": "<downloads>/VideoName_stock_1.mp4", "insert_at": 15.0, "duration": 4.0},
    {"file": "<downloads>/VideoName_stock_2.mp4", "insert_at": 28.0, "duration": 4.0},
    {"file": "<downloads>/VideoName_stock_3.mp4", "insert_at": 45.0, "duration": 4.0}
  ]
}
```

Review the timestamps. Ensure:
- No overlaps (each `insert_at + duration` < next `insert_at`)
- All timestamps are within the video duration
- At least 8 seconds between each b-roll

### Step 7.2: Insert B-Rolls with ffmpeg

**Method:** `filter_complex` with `trim` + `concat` — single-pass, no intermediate files.

The main video is split into segments using `trim`, b-roll clips are trimmed to exact duration, then everything is concatenated. Audio from the main video is copied directly (no re-encoding).

**Run the insertion script:**
```bash
python3 broll-pipeline/insert_brolls.py \
  --main <downloads>/VideoName_motion.mp4 \
  --manifest <downloads>/VideoName_broll_manifest.json \
  --output <downloads>/VideoName_broll.mp4
```

**Dry run:**
```bash
python3 broll-pipeline/insert_brolls.py \
  --main <downloads>/VideoName_motion.mp4 \
  --manifest <downloads>/VideoName_broll_manifest.json \
  --output <downloads>/VideoName_broll.mp4 \
  --dry-run
```

**What the ffmpeg command does:**
```
[main 0:00-15:00] → [broll_1 4s] → [main 19:00-28:00] → [broll_2 4s] → [main 32:00-45:00] → [broll_3 4s] → [main 49:00-end]
                                                    (video only — audio is copied raw from main)
```

### Step 7.3: Verify Output

```bash
# Check output exists and has correct duration
MAIN_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 <downloads>/VideoName_motion.mp4)
OUT_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 <downloads>/VideoName_broll.mp4)
echo "Main: ${MAIN_DUR}s | Output: ${OUT_DUR}s (should be equal)"

# Extract frames at b-roll timestamps to verify visual replacement
ffmpeg -y \
  -i <downloads>/VideoName_broll.mp4 \
  -ss 15 -frames:v 1 <scratch>/broll_verify_1.png \
  -ss 28 -frames:v 1 <scratch>/broll_verify_2.png \
  -ss 45 -frames:v 1 <scratch>/broll_verify_3.png
```

**Verification checklist:**
- [ ] Output file exists and size > 0
- [ ] Output duration matches input duration (within 0.5s tolerance)
- [ ] Frames at b-roll timestamps show b-roll content (not avatar)
- [ ] Frames before/after b-roll timestamps show avatar + motion
- [ ] Audio plays continuously without gaps or jumps

**Output:** `<downloads>/VideoName_broll.mp4` — ready for subtitles (Phase 8).

---

## B-Roll Selection Rules

### What Makes a Good B-Roll Moment

1. **Concept illustration** — The speaker says "AI is transforming everything" → Show futuristic tech visuals
2. **Metaphor reinforcement** — The speaker uses an analogy → Show the literal analogy
3. **Data/stat emphasis** — The speaker cites a number → Show the relevant context (graphs, growth, scale)
4. **Emotional pivot** — The speaker shifts tone → Use b-roll to punctuate the shift
5. **List items** — The speaker lists things → B-roll on the most important item

### What Makes a Bad B-Roll Moment

1. **During the hook** (0-5s) — Face builds trust, never interrupt
2. **During CTA** (last 5s) — Face drives action, never interrupt
3. **Mid-word or mid-sentence** — Cuts feel jarring
4. **Too close together** (< 8s apart) — Creates MTV-style chaos
5. **Unrelated visuals** — Random pretty footage that doesn't connect to the message
6. **During a personal story** — Face/emotion is the content, don't cover it

---

## Notes
B-roll selection/troubleshooting lives in the `select-brolls-stock` skill. Insertion (`insert_brolls.py`) is unchanged. No AI generation.
