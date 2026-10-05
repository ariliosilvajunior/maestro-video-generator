# Viral Subtitle Pipeline — Specification

## Tool Requirements
- **ffmpeg with libass**: `ffmpeg` on PATH (`MAESTRO_FFMPEG` / `paths.ffmpeg` overrides the binary)
- **transcription (Gemini)**: `python3 subtitle-pipeline/transcribe_gemini_srt.py [file] --output-dir <scratch> --name [Name]` — the local `whisper` CLI is never used for the SRT
- Your ffmpeg must include libass (the `ass` subtitle filter) — `python3 bin/doctor.py` checks this

## Video Frame Layout (with Motion Graphics)

When the subtitle pipeline runs after the motion graphics phase, the video frame looks like this:

```
┌─────────────────────┐ pixel 0
│   MOTION GRAPHICS   │ ← Top 40% (768px) — animated overlays
│    (Remotion)        │
│                      │
├──── feather blend ───┤ pixel 768
│                      │
│   AVATAR VIDEO       │ ← Bottom 60% (1152px) — HeyGen footage
│   (OffthreadVideo)   │
│                      │
│  ┌─────────────────┐ │ ← pixel ~1480 — SUBTITLES HERE (MarginV=440)
│  │ subtitle text    │ │
│  └─────────────────┘ │
│                      │
└─────────────────────┘ pixel 1920
```

MarginV=440 = 440px from bottom = pixel 1480 from top. This is well inside the video portion (768-1920), with no overlap with the motion area.

---

## Instagram Reels Safe Zone Requirements

### Full Reels View (9:16 = 1080x1920)
- **Top overlay (UI):** ~220px from top
- **Bottom overlay (UI):** ~320-420px from bottom (captions, audio bar, buttons)
- **Right overlay:** ~120px (like, comment, share buttons)
- **Left buffer:** ~60px

### Feed View Crop (4:5 = 1080x1350, centered)
- Feed view extracts center 1350px vertically from 1920px
- **Top crop line:** pixel 285 from top
- **Bottom crop line:** pixel 1635 from top (= 285px from bottom)
- Anything below pixel 1635 is INVISIBLE in feed view

### TikTok Safe Zone (for cross-posting)
- Bottom: ~400px from bottom (for username, caption, sound)
- Similar center-safe approach applies

### Subtitle Placement Rule
- **MarginV (ASS) = 440px** from bottom
- This places text center at approximately Y=1480 (from top)
- Ensures visibility in: full Reels view, feed 4:5 crop, and TikTok
- Text stays above all UI overlays on all platforms
- Subtitles appear roughly in the lower-center third of the video

## ASS Subtitle Style — Viral Template

```
[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: White,Arial Black,92,&H00FFFFFF,&H000000FF,&H00000000,&HE0000000,-1,0,0,0,100,100,1,0,4,1,5,2,80,80,440,1
Style: Yellow,Arial Black,92,&H0000D4FF,&H000000FF,&H00000000,&HE0000000,-1,0,0,0,100,100,1,0,4,1,5,2,80,80,440,1
```

### Style Parameters Explained
| Parameter | Value | Purpose |
|-----------|-------|---------|
| Fontname | Arial Black | Bold, readable on mobile |
| Fontsize | 92 | Large enough for phone screens |
| PrimaryColour (White) | &H00FFFFFF | White text |
| PrimaryColour (Yellow) | &H0000D4FF | Yellow highlight for keywords |
| OutlineColour | &H00000000 | Black outline |
| BackColour | &HE0000000 | 88% opaque black background box |
| Bold | -1 | Always bold |
| BorderStyle | 4 | Background box mode |
| Outline | 1 | Thin outline around text |
| Shadow | 5 | Shadow distance (makes box larger) |
| Alignment | 2 | Bottom-center |
| MarginV | 440 | Pixels from bottom — CRITICAL for Reels feed visibility |
| MarginL/R | 80 | Side padding |

### Inline Overrides for Emphasis
- `{\rYellow}keyword{\rWhite}` — highlight a word in yellow
- `{\fscx112\fscy112}` — scale up 12% for power words
- `{\fad(200,0)}` — fade in first subtitle
- `\N` — manual line break

## Pipeline Steps
1. `python3 subtitle-pipeline/transcribe_gemini_srt.py input.mp4 --output-dir <scratch> --name VideoName` (Gemini — never the local whisper CLI)
2. Write `.ass` file with viral styling (use template above)
3. Split subtitles into 1.5-3s segments for fast pacing
4. Apply yellow highlights to key words/power phrases
5. Scale up (`\fscx110+`) on emotional peaks
6. `ffmpeg -y -i input.mp4 -vf "ass=filename=subtitle.ass" -c:a copy output.mp4`
