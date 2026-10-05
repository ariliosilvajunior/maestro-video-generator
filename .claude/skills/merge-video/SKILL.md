---
name: merge-video
description: Phase 6 of the Maestro Video Generator pipeline. Merge avatar + motion into one frame. In the current architecture this is a NO-OP pass-through — the Remotion render in generate-motion-remotion already produces the merged _motion.mp4. This skill only validates the merged output and advances state. Triggers — "merge the video", "combine avatar and motion".
---

> Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: merge-video (Phase 6 — Merge / pass-through)

**Architecture note:** the Remotion render in `generate-motion-remotion` overlays the avatar (bottom 60%) under the motion (top 40%) and outputs `<VideoName>_motion.mp4`. That render IS the merge. There is NO separate ffmpeg concat step. This skill exists to keep one-skill-per-stage and to gate-check the merge.

## INPUTS
- `<downloads>/<VideoName>_motion.mp4` (from `generate-motion-remotion`).

## OUTPUTS
- Same file `<downloads>/<VideoName>_motion.mp4`, validated. Becomes input to `insert-brolls` (Phase 7 — HIT stock clips only).

## PROCEDURE (validation only)
```bash
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height \
  -of default=noprint_wrappers=1 <downloads>/<VideoName>_motion.mp4
# Expect: video h264 1080x1920, audio aac. If missing → re-run the motion render (Phase 5).
```

## DEPENDENCIES
- ffprobe (ffmpeg). No external keys.

## WHY KEPT
Decouples "merge complete" as its own resumable checkpoint in the run state (`maestro_state.py`), so a downstream failure (b-roll/subtitle) never forces re-rendering motion.
