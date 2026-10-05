---
name: insert-brolls
description: Phase 7 of the Maestro Video Generator pipeline. Insert the selected stock b-roll clips into the merged motion video using ffmpeg, preserving narration audio, producing _broll.mp4. Triggers — "insert b-rolls", "splice in the broll", "overlay the cutaways", "place broll clips".
---

> Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: insert-brolls (Phase 7 — Insert B-Rolls)

Wraps the EXISTING `broll-pipeline/insert_brolls.py`. Do not rewrite.

## INPUTS
- `--main`: `<downloads>/<VideoName>_motion.mp4`.
- `--manifest`: `<downloads>/<VideoName>_broll_manifest.json` (HITs from `select-brolls-stock`).
- `--output`: `<downloads>/<VideoName>_broll.mp4`.

## OUTPUTS
- `<downloads>/<VideoName>_broll.mp4` (full-vertical b-roll overlays spliced in, narration preserved). Becomes input to `generate-subtitles`.

## COMMAND
```bash
python3 broll-pipeline/insert_brolls.py \
  --main <downloads>/<VideoName>_motion.mp4 \
  --manifest <downloads>/<VideoName>_broll_manifest.json \
  --output <downloads>/<VideoName>_broll.mp4 \
  --crf 18 --preset medium
# Add --dry-run to print the ffmpeg command without executing (free verification).
```

## DEPENDENCIES
- Python 3, ffmpeg on PATH (`MAESTRO_FFMPEG` / `paths.ffmpeg` overrides; `python3 bin/doctor.py` verifies it).
- Requires the manifest + clips from Phase 4 (`select-brolls-stock`). No external keys.

## GATE
After insertion: ffprobe must show duration ≈ original `_motion.mp4` duration (b-rolls overlay, don't extend) and aac audio intact.
