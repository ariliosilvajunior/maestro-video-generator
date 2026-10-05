# Viral Subtitle Pipeline — Complete Instructions

> **Caption builder options (read this first):**
> 1. **Default path** — `build_srt_from_script.py` (verbatim script + VAD → SRT), or the Phase-3 Gemini SRT, then `srt_to_ass.py` (the steps below). Works everywhere, no extra install.
> 2. **Recommended when a local word-level ASR is installed** (`mlx-whisper` on Apple Silicon, `faster-whisper` on any machine, or `openai-whisper`) — `subtitle-pipeline/build_ass_measured.py` builds the BODY captions of an avatar video straight from the narration audio: word-level ASR → char-level alignment with the verbatim script (numbers spelled out on both sides) → onsets re-measured on the RMS envelope where there is an acoustic pause → lag measured by cross-correlation against the video that will be burned (`--align-to`) → dynamic programming with 3–5 words / display ≥ 0.70 s / ≤ 3 words and ≤ 18 chars per visual line as HARD constraints → tag-free white ALL-CAPS `.ass` → its own gates (rhythm, font, flash, onset, placement). **Only deliver on exit 0.** The spoken CTA stays out of the body (`--cta-text`); `cta_onset_s` in `<Name>_caption_measure.json` positions the CTA card.
>    ```bash
>    python3 subtitle-pipeline/build_ass_measured.py --script <downloads>/<Name>_script.txt \
>        --narration motion-pipeline/remotion-agent/public/<Name>_avatar.mp4 \
>        --align-to <downloads>/<Name>_motion.mp4 --cta-text "<the spoken CTA, verbatim>" \
>        --out-dir <downloads> --name <Name>
>    ```
>    Why it exists: proportional time distribution (`build_srt_from_script.py`) does not MEASURE, and `srt_to_ass.py` re-slices into 5+2; on real avatar runs that produced 2-word blocks, captions displayed < 0.70 s, captions up to 418 ms off the voice, and a constant +48 ms lag between the clean narration and the audio that ships (it is born in the Remotion render; `add_music.py` alone adds 0 ms). `add_music.py` also pins the output to the video stream's duration (`-t`), so a track longer than the video no longer leaks past the end.
>
> Either way, the suppression (§3b/§5b windows), the caption↔audio sync gate, the placement validation, the burn and the post-burn validation described in this document and in the `generate-subtitles` skill still apply.
>
> *(PT-BR)* Para a legenda do CORPO de um avatar com roteiro verbatim, o caminho recomendado — quando há um ASR local de palavra instalado — é `build_ass_measured.py` (constrói o `.ass` do áudio, com as regras 3–5 palavras / ≥ 0,70 s / lag medido como restrições e gates no próprio arquivo). Os passos abaixo (`build_srt_from_script.py` → `srt_to_ass.py`) são o caminho padrão e continuam válidos para SRT de terceiros e para o card/stand-alone.


## Overview

This pipeline takes any video and burns professional viral-style subtitles optimized for Instagram Reels, TikTok, and YouTube Shorts. The subtitles use a yellow-highlight keyword system with scaling emphasis, positioned safely above all platform UI overlays.

### Motion Graphics Context

When running as part of the full pipeline (Phase 8), the input video is the **motion graphics output** from Phase 5 (or the `_broll.mp4` from Phase 7) — NOT the raw HeyGen video. The combined frame has:
- **Top 40% (pixels 0-768):** Animated motion graphics overlay (Remotion)
- **Bottom 60% (pixels 768-1920):** Original avatar video

Subtitles at **MarginV=440** position at ~pixel 1480 from top, which falls **inside the video portion** (bottom 60%). This is correct — subtitles should appear over the avatar, not the motion area. The SRT from Phase 3 is reused, so no re-transcription is needed.

---

## Prerequisites

| Tool | Path / Install | Purpose |
|------|---------------|---------|
| **ffmpeg with libass** | `ffmpeg` on PATH (`MAESTRO_FFMPEG` / `paths.ffmpeg` overrides the binary) | Burns ASS subtitles into video. Your ffmpeg must include libass (the `ass` filter) — `python3 bin/doctor.py` checks this. |
| **transcribe_gemini_srt.py** | `subtitle-pipeline/transcribe_gemini_srt.py` (Gemini API) | Transcribes audio to SRT (gemini-2.5-flash, sentence-level timestamps + PT-BR brand fixes). **Never the local `whisper` CLI for the SRT** — ~1GB RAM, slower, worse model. |

**CRITICAL:** an ffmpeg build without libass has no `ass` filter and the burn fails — `python3 bin/doctor.py` verifies yours (point `MAESTRO_FFMPEG` at a libass-enabled binary if needed).

---

## Pipeline Steps (6 Steps)

### Step 1: Transcribe via Gemini (never the local whisper CLI for the SRT)
```bash
python3 "subtitle-pipeline/transcribe_gemini_srt.py" input.mp4 --output-dir <scratch> --name VideoName
```
- Uses `gemini-2.5-flash` for sentence-level timestamped segments → SRT (+ the carried-over PT-BR brand fixes); ~10s round trip
- API key auto-resolved: `--api-key` → `GEMINI_API_KEY` env → `.claude/keys.md` (`## Gemini`)
- Outputs `VideoName.srt` in the specified output directory
- If the Gemini call fails: fix the API issue (a 429 = quota — wait or raise the quota) or escalate — do NOT fall back to the local `whisper` CLI without explicit user approval
- **CRITICAL:** Verify the SRT content matches the current video — old SRT files from previous pipeline runs may still exist

### Step 2: Convert SRT → ASS with `srt_to_ass.py` (MANDATORY)

**ALWAYS use the automated converter** — never write ASS dialogue lines manually. Manual timing causes subtitle-audio drift.

```bash
python3 "subtitle-pipeline/srt_to_ass.py" <scratch>/input.srt <downloads>/VideoName_subtitles.ass
```

Options:
- `--highlights "word1,word2,..."` — Add extra highlight words beyond the defaults
- `--standalone` — Use standalone style (Font 92, MarginV 440) instead of motion style
- `--no-fade` — Disable fade-in on first subtitle

**What the script does automatically:**
1. Parses SRT with **exact Whisper timestamps** (no drift)
2. Splits long segments (>12 words or >3.5s) proportionally by word count
3. Applies yellow highlights with **word-boundary matching** (won't match "IA" inside "inteligência" or "design" inside "designers")
4. Adds `\N` line breaks for phone readability (max 6 words per line)
5. Auto-detects CAPS words and sets Yellow style for emphasis lines
6. Adds `{\fad(200,0)}` fade-in on first subtitle

**Default highlight words** (built into the script): inteligência artificial, IA, Figma, Claude, código, design, programar, designers, desenvolvedores, GUERRA, MUDAR, NUNCA, EXATAMENTE, FUTURO, PADRÃO, and more. Numbers are highlighted automatically via regex.

**Highlight-SELECTION rule (QCR-035) — keep the set CATEGORY-CONSISTENT.** When the default list matches little and you supply a custom `--highlights`, pick a COHERENT set, not a grab-bag: (a) the recurring CORE CONCEPT / through-line term (and highlight ALL its instances), (b) BRAND / product proper-nouns (the channel's subject), and (c) actual NUMERALS / percentages / money / years. **AVOID one-off LOCATIONS (e.g. Dubai), lone ADJECTIVES / descriptors (e.g. hipersônico), and SPELLED-OUT durations (e.g. "duas semanas")** unless that same category recurs and you highlight every instance — a single-member category reads as "inconsistent" to QC (a real run lost −25 to this: concept + brand + place + adjective + duration each highlighted once). Fewer, consistent highlights beat a scattered set.

**With motion graphics (full pipeline) — DEFAULT style:**
```
Style: White,Arial Black,68,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1.5,0,1,5,2,2,70,70,280,1
Style: Yellow,Arial Black,68,&H0000D4FF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1.5,0,1,5,2,2,70,70,280,1
```
- Font **68**, Outline **5**, Shadow **2**, MarginV **280**, MarginL/R 70, **BorderStyle=1** (outline, NOT box)
- **Subtitles go BELOW the face** in the lower portion of the frame. MarginV=280 = bottom edge at pixel 1640 from top.
- **Max 2 visual lines** — each line ~78px tall (68 font + 10 outline). 2 lines = 156px. Top edge at pixel 1484 — safely below the chin (~pixel 1350).
- **Max 5 words per segment, max 3 words per visual line** to prevent wrapping to a 3rd visual line.
- **Hard 18-char cap per visual line** — Arial Black at 68px fits ~18-20 chars in 940px usable width.
- **NO scale overrides (\fscx/\fscy)** — use CAPS for emphasis instead.

**WHY these values (pixel math):**
- Avatar video shown at original quality (no zoom) — person naturally framed by HeyGen
- MarginV=280 → bottom edge at pixel 1640 → 2-line top edge at ~1484 → **134px gap below chin** ✓
- MarginV=280 → bottom edge at pixel 1640 → Reels crop line at 1635 → **5px margin** (safe, subtitles barely inside crop)
- Previous MarginV=400 with Font 82 → 2-line top at ~1332, 3-line top at ~1232 → OVERLAPPED chin ✗

**Without motion graphics (standalone) — use `--standalone` flag:**
```
Style: White,Arial Black,92,&H00FFFFFF,&H000000FF,&H00000000,&HE0000000,-1,0,0,0,100,100,1,0,4,1,5,2,80,80,440,1
Style: Yellow,Arial Black,92,&H0000D4FF,&H000000FF,&H00000000,&HE0000000,-1,0,0,0,100,100,1,0,4,1,5,2,80,80,440,1
```
- Font 92, Shadow 5, MarginV 440, MarginL/R 80

### Step 3: Manual Review & Edits (Quick Pass)

After `srt_to_ass.py` generates the ASS file, do a quick review:
1. **Fix Whisper transcription errors** — e.g., "Clod" → "Claude", misspelled brand names
2. **Promote key emotional lines to Yellow style** — change `White` to `Yellow` on lines with ALL-CAPS words or climactic moments
3. **Add extra highlights** for topic-specific terms not in the default list
4. **Verify no broken highlight tags** — search for unclosed `{\rYellow}` without matching `{\rWhite}`

### Step 4: Burn Subtitles with ffmpeg
```bash
ffmpeg -y -i input.mp4 -vf "ass=filename=subtitle.ass" -c:a copy output_subtitled.mp4
```
- `-y` overwrites output without asking
- `-c:a copy` preserves original audio
- Output to `<downloads>/` with `_final` suffix (full pipeline) or `_subtitled` suffix (standalone)

### Step 5: MANDATORY Frame Verification (NEVER SKIP)

After EVERY subtitle burn, extract **6 frames** and visually inspect EACH ONE:

```bash
ffmpeg -y -i output_subtitled.mp4 \
  -ss 1 -frames:v 1 <scratch>/sub_check_1s.png \
  -ss 5 -frames:v 1 <scratch>/sub_check_5s.png \
  -ss 15 -frames:v 1 <scratch>/sub_check_15s.png \
  -ss 25 -frames:v 1 <scratch>/sub_check_25s.png \
  -ss 42 -frames:v 1 <scratch>/sub_check_42s.png \
  -ss 47 -frames:v 1 <scratch>/sub_check_47s.png
```

Then use the `Read` tool on each PNG. **ALL checks must pass on ALL 6 frames:**

| # | Check | Pass Criteria | Fail Action |
|---|-------|---------------|-------------|
| 1 | **Subtitle NOT touching head** | Visible gap (≥40px) between subtitle box bottom and person's hair/forehead | Increase MarginV or push person lower |
| 2 | **Subtitle NOT overlapping motion** | Visible gap (≥30px) between subtitle box top and motion area bottom | Decrease MarginV or reduce font size |
| 3 | **Head NOT trimmed by motion** | Full head visible, not cut at top by motion boundary | Decrease transformOrigin % in Remotion |
| 4 | **Subtitles readable** | Font big enough to read on phone (≥56px for motion, ≥80px standalone) | Increase font size |
| 5 | **No pixelation** | Person's face is sharp, no visible pixel blocks | Reduce scale() value |
| 6 | **Yellow highlights visible** | Yellow words clearly distinguishable from white | Check color codes |

**CRITICAL:** Be HONEST in assessment. If the subtitle box bottom is within ~20px of the person's forehead, that is a FAIL — it will look like overlap on a phone screen. Previous iterations (v7-v14) failed because the agent kept claiming "looks good" when subtitles were clearly on the face.

**If ANY check fails on ANY frame:** Fix the issue, re-render, re-burn, and re-verify. Do NOT proceed until all 6 frames pass all 6 checks. Iterate as many times as needed.

---

## Critical Parameters

### MarginV — Depends on Pipeline Context

**With motion graphics (full pipeline):** Font `68`, MarginV = `280`, Outline = `5`, Shadow = `2`, **BorderStyle = 1**
- Avatar video shown at original quality (no zoom) — person naturally framed by HeyGen
- **Subtitles go BELOW the face** in the lower frame (MarginV 280 = bottom edge at ~pixel 1640 from top)
- 2-line subtitle top edge at ~pixel 1484 — safely 134px below chin
- **Max 5 words per segment, 3 words per visual line, 18 chars per line** — prevents 3-line visual wrapping
- **NO scale overrides (\fscx/\fscy)** — use CAPS for emphasis
- **NEVER use MarginV > 350 with motion pipeline** — higher values push subtitles UP toward the face

**Without motion graphics (standalone subtitles):** `MarginV = 440`
- Positions subtitles at **pixel ~1480 from top** (440px from bottom of 1920px)
- Instagram Reels feed view crops to 4:5 (1080x1350), centered
- Bottom crop line = pixel 1635
- Subtitles at MarginV=440 sit at ~pixel 1480, safely ABOVE the crop line
- Visible in: Reels full view, Reels feed preview, TikTok, YouTube Shorts
- **NEVER use MarginV < 400** for standalone (non-motion) social media content

### Instagram Reels Safe Zones (1080x1920)
| Zone | Pixels | Notes |
|------|--------|-------|
| Top UI overlay | ~220px from top | Username, follow button |
| Bottom UI overlay | ~320-420px from bottom | Captions, audio bar, buttons |
| Right overlay | ~120px | Like, comment, share buttons |
| Left buffer | ~60px | Minimal UI |
| Feed crop top | pixel 285 | 4:5 center crop starts here |
| Feed crop bottom | pixel 1635 | 4:5 center crop ends here |

### Color Format (ASS uses AABBGGRR)
| Color | ASS Code | Actual Color |
|-------|----------|-------------|
| White text | `&H00FFFFFF` | Pure white |
| Yellow highlight | `&H0000D4FF` | Warm yellow-orange |
| Black outline | `&H00000000` | Pure black |
| Background box | `&HE0000000` | 88% opaque black |

---

## Style Parameters Reference

| Parameter | Standalone | Motion Pipeline | Purpose |
|-----------|-----------|----------------|---------|
| Fontname | Arial Black | Arial Black | Maximum readability on mobile |
| Fontsize | 92 | **68** | Standalone = big; Motion = smaller to prevent face overlap |
| Bold | -1 | -1 | Always bold |
| BorderStyle | 4 | **1** | Standalone = box; Motion = outline |
| Outline | 1 | **5** | Outline thickness |
| Shadow | 5 | **2** | Shadow distance |
| Alignment | 2 | 2 | Bottom-center of screen |
| MarginL/R | 80 | 70 | Side padding from edges |
| MarginV | 440 | **280** | Distance from bottom — subtitle bottom at pixel 1640 |
| Spacing | 1 | 1.5 | Slight letter spacing |
| Scale overrides | Yes (108/110/112) | **NO** | Gap too tight for scaled text |
| Max words/segment | 6 | **5** | Prevents overly long subtitle entries |
| Max words/line | 5 | **3** | Prevents visual wrapping to 3rd line |
| Max chars/line | — | **18** | Hard cap for Arial Black at 68px on 940px width |

---

## Inline Override Syntax

| Override | Syntax | Example |
|----------|--------|---------|
| Switch to Yellow | `{\rYellow}word{\rWhite}` | `A {\rYellow}inteligência artificial{\rWhite}` |
| Scale up 8% | `{\fscx108\fscy108}` | `{\fscx108\fscy108}Quem dominar a IA` |
| Scale up 12% | `{\fscx112\fscy112}` | `{\fscx112\fscy112}como SUPERPODER.` |
| Fade in | `{\fad(200,0)}` | `{\fad(200,0)}First subtitle text` |
| Line break | `\N` | `está substituindo\Nprofissões` |

---

## Template Evolution (v1 → v6)

Each version in `templates/` represents a refinement step:

| Version | File | Key Changes |
|---------|------|-------------|
| **v1** | `v1_basic.ass` | First attempt. Font=58px, MarginV=180, single Default style, no highlights. Too small, too low. |
| **v2** | `v2_highlight.ass` | Added yellow Highlight style (`&H0000FFFF`), `{\rHighlight}` inline overrides, Font=80, MarginV=350. Better but still outline-based. |
| **v3** | `v3_dynamic.ass` | Switched to outline BorderStyle=1, Outline=6, Shadow=3. Added `\fscx110` scale effects. Split into faster segments (1.5-2.5s). MarginV=400. |
| **v4** | `v4_boxed.ass` | Changed to **BorderStyle=4** (box mode) with `BackColour=&HC0000000` (75% opaque). Font=85, MarginV=200. Clean box look but MarginV too low. |
| **v5** | `v5_refined.ass` | Refined box to `&HE0000000` (88% opaque). Increased to Font=92, MarginV=180. Added `{\fad(200,0)}` fade-in. Mixed White/Yellow full-line styles. MarginV still too low for feed crop. |
| **v6** | `v6_final.ass` | **PRODUCTION VERSION.** MarginV=440 (Reels-safe). All refinements from v5 preserved. This is the one to use. |

### Key Lessons from Iteration:
1. **Font size 92** is the sweet spot — smaller is unreadable on phones
2. **BorderStyle=4** (box) is better than outline for mobile readability
3. **MarginV=440** is the only safe value for cross-platform visibility
4. **1.5-3s segments** keeps attention vs the original long segments
5. **Yellow highlights on power words** makes text scannable even without audio
6. **Scale-up (\fscx110+)** on climax moments creates visual rhythm
7. **BackColour 88% opacity** provides contrast without being too heavy

---

## Example: SRT → ASS Conversion

**Input (from Whisper SRT):**
```
1
00:00:00,000 --> 00:00:03,720
A inteligência artificial está substituindo profissões que ninguém imaginava.
```

**Output (viral ASS - v6 style):**
```
Dialogue: 0,0:00:00.00,0:00:01.80,White,,0,0,0,,{\fad(200,0)}A {\rYellow}inteligência artificial{\rWhite}
Dialogue: 0,0:00:01.80,0:00:03.72,White,,0,0,0,,está substituindo profissões\Nque ninguém imaginava.
```

**What changed:**
1. Split 3.7s segment into two ~1.8s segments
2. Added `{\fad(200,0)}` fade-in on first subtitle
3. Added `{\rYellow}inteligência artificial{\rWhite}` highlight
4. Added `\N` line break for 2-line layout
5. Used proper ASS timecode format (`.` not `,`)

---

## Quick Reference Command

Full pipeline in one go:
```bash
# 1. Transcribe (Gemini — never the local whisper CLI for the SRT)
python3 "subtitle-pipeline/transcribe_gemini_srt.py" video.mp4 --output-dir <scratch> --name video

# 2. Convert SRT → ASS (automated — exact timestamps, highlights, line breaks)
python3 "subtitle-pipeline/srt_to_ass.py" <scratch>/video.srt <downloads>/video_subtitles.ass

# 2b. (Optional) Quick review — fix transcription errors, promote Yellow emphasis lines

# 3. Burn subtitles
ffmpeg -y -i video.mp4 -vf "ass=filename=video_subtitles.ass" -c:a copy <downloads>/video_subtitled.mp4
```

### srt_to_ass.py Options
| Flag | Effect |
|------|--------|
| `--standalone` | Use standalone style (Font 92, MarginV 440) instead of motion (Font 68, MarginV 280) |
| `--highlights "Figma,Claude,OpenClaw"` | Add extra highlight words beyond built-in defaults |
| `--no-fade` | Disable `{\fad(200,0)}` on first subtitle |
| `--validate-only` | Validate an existing ASS file without converting. Input = ASS file path. Exits 0=PASS, 1=FAIL. |

---

## Placement Validation (MANDATORY)

**Every ASS file MUST pass placement validation before burning. No exceptions.**

### The Pixel Math Formula

```
line_height = font_size + 2 × outline
total_subtitle_height = num_visual_lines × line_height
bottom_edge_pixel = 1920 - MarginV
top_edge_pixel = bottom_edge_pixel - total_subtitle_height

RULE: top_edge_pixel MUST be >= 1450
```

**If `top_edge_pixel < 1450` → FAIL. Subtitles WILL overlap the speaker's face.**

### Worked Examples

**Motion pipeline (Font 68, Outline 5, MarginV 280):**
```
line_height = 68 + 2×5 = 78px
2-line height = 2 × 78 = 156px
bottom_edge = 1920 - 280 = 1640
top_edge = 1640 - 156 = 1484  ← PASS (1484 >= 1450, 134px below chin)
```

**3-line (DANGER — this is what we prevent):**
```
3-line height = 3 × 78 = 234px
top_edge = 1640 - 234 = 1406  ← FAIL (1406 < 1450, overlaps face!)
```

**Standalone (Font 92, Outline 1, MarginV 440):**
```
line_height = 92 + 2×1 = 94px
2-line height = 2 × 94 = 188px
bottom_edge = 1920 - 440 = 1480
top_edge = 1480 - 188 = 1292  ← FAIL if 3 lines, but standalone has more room
```

### Step-by-Step Verification Checklist

Run this BEFORE every subtitle burn:

1. **Run `--validate-only` on the ASS file:**
   ```bash
   python3 "subtitle-pipeline/srt_to_ass.py" --validate-only <downloads>/video_subtitles.ass
   ```
   Must exit with code 0 (PASS). If exit code 1 → DO NOT BURN.

2. **Check the summary output:**
   - `Max visual lines` must be ≤ 2
   - `Worst top-edge pixel` must be ≥ 1450
   - `Failed entries` must be 0

3. **After burning, run post-burn validation:**
   ```bash
   python3 "subtitle-pipeline/validate_subtitles.py" <downloads>/video_subtitled.mp4 --check-frames 6
   ```
   Must exit with code 0. If exit code 1 → subtitle placement is wrong, re-do.

4. **For extra safety, run both frame + ASS analysis:**
   ```bash
   python3 "subtitle-pipeline/validate_subtitles.py" <downloads>/video_subtitled.mp4 \
     --check-frames 6 --ass-fallback <downloads>/video_subtitles.ass
   ```

### validate_subtitles.py — Post-Burn Verification

Standalone script that analyzes burned video frames for subtitle placement:

```bash
# Basic: extract 6 frames, check pixel data
python3 subtitle-pipeline/validate_subtitles.py video.mp4 --check-frames 6

# With ASS fallback (recommended):
python3 subtitle-pipeline/validate_subtitles.py video.mp4 --ass-fallback subtitle.ass

# ASS-only (no video needed):
python3 subtitle-pipeline/validate_subtitles.py --ass-only subtitle.ass

# Keep frame PNGs for manual inspection:
python3 subtitle-pipeline/validate_subtitles.py video.mp4 --keep-frames
```

**How it works:**
1. Extracts N frames evenly distributed across the video
2. Uses Pillow (or basic ffmpeg fallback) to scan pixel rows for text content
3. Identifies the topmost pixel row with subtitle content
4. Reports PASS if that row is >= 1450, FAIL otherwise
5. Optionally cross-checks against ASS file geometry

### NEVER DO (Absolute Prohibitions)

| # | Rule | Why |
|---|------|-----|
| 1 | **NEVER** skip validation before burning | 3-line wrapping is invisible in ASS source but devastating on screen |
| 2 | **NEVER** set MarginV > 350 in motion pipeline | Higher MarginV pushes subtitles UP toward face (MarginV = distance from bottom) |
| 3 | **NEVER** allow > 20 chars per visual line at Font 68 | Will wrap to create a 3rd line that overlaps face |
| 4 | **NEVER** use > 5 words per segment in motion pipeline | More words = more chars = wrapping risk |
| 5 | **NEVER** use scale overrides (`\fscx`/`\fscy`) in motion pipeline | Increases effective text size, breaks placement math |
| 6 | **NEVER** eyeball-approve frames without running pixel math | Human judgment is unreliable — QCR-007 and QCR-008 proved this |
| 7 | **NEVER** proceed with a grade below `config.qc.threshold` (default 75) by overriding QC findings | (When QC is enabled) the Gemini grade is the final authority (QCR-007) |
| 8 | **NEVER** write ASS dialogue lines manually | Use srt_to_ass.py which has built-in validation |
| 9 | **NEVER** pre-emptively single-line-split every dialogue (1-2 words/entry) to "kill wraps" | RETIRED (QCR-013). The single-line split BACKFIRES: it maximizes the number of adjacent-entry boundaries the grader stitches into phantom 3-line WRAP deductions (a real run: 81 entries → 4 reads all <75). Default = validated **2-line** entries (QCR-008). The real WRAP cure is QCR-013 (feed the grader the ground-truth subtitle list), not more splitting. |
| 10 | **NEVER** create entries below the fragmentation floor: 3 words / ~1.0s | Unless the source SRT segment is genuinely that short. 0.55s 2-word flashes are unreadable on a phone AND inflate the phantom-wrap surface. Fewer, well-formed 2-line entries read better and grade better. |

### Quick Validation One-Liner

```bash
# Validate ASS + burn + validate burned video in sequence:
python3 "subtitle-pipeline/srt_to_ass.py" --validate-only subtitle.ass && \
ffmpeg -y -i input.mp4 -vf "ass=filename=subtitle.ass" -c:a copy output.mp4 && \
python3 "subtitle-pipeline/validate_subtitles.py" output.mp4 --ass-fallback subtitle.ass
```

All three commands must succeed (exit 0). If any fails, stop and fix.
