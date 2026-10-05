---
name: generate-subtitles
description: Phase 8 of the Maestro Video Generator pipeline. Convert the SRT to viral ASS subtitles (motion style), burn them onto the b-roll video with ffmpeg, and validate placement, producing _final.mp4. Triggers — "add subtitles", "burn captions", "add viral subtitles", "caption this video".
---

> Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: generate-subtitles (Phase 8 — Subtitles)

Wraps `subtitle-pipeline/srt_to_ass.py` + ffmpeg burn + `validate_subtitles.py`. **Read `subtitle-pipeline/SUBTITLE_INSTRUCTIONS.md` and `qc-pipeline/active-rules.md` first.** Reuse the Phase-3 SRT — do NOT re-transcribe.

> **Caption builder options (see SUBTITLE_INSTRUCTIONS.md):** the default path is the one below — an SRT (Phase-3 transcript, or `build_srt_from_script.py` for a verbatim script + VAD) → `srt_to_ass.py`. When a local word-level ASR is installed (mlx-whisper / faster-whisper / whisper), the recommended path for the body captions of an avatar video is `subtitle-pipeline/build_ass_measured.py`, which builds the `.ass` straight from the narration audio with the 3–5-words / ≥0.70s / measured-lag rules as hard constraints and its own gates (only deliver on exit 0). Either way the suppression (1b), sync gate (1c), placement validation (2), burn (3) and post-burn validation (4) below still apply.

## INPUTS
- `<downloads>/<VideoName>_broll.mp4` (from `insert-brolls`) — NOT raw HeyGen. **6-SECTION GRAMMAR videos have NO b-roll phase → input is `<VideoName>_motion.mp4` directly** (the section grammar replaces stock b-roll with motion ideas; QCR-061 grammar).
- The video's SRT (from Phase 3 transcript).

> **6-SECTION GRAMMAR: pass `--section-grammar` to `validate_subtitles.py`.** That grammar
> has full-frame motion sections (no face) + full-frame ZOOMED-avatar sections (face high in frame), so
> a 2-line subtitle at top-edge ~1380 is SAFE. Without the flag the default 1450 face-clearance threshold
> FALSE-FAILS (QCR-084). The ASS geometry + danger-zone checks still apply unchanged.

## OUTPUTS
- `<downloads>/<VideoName>_final.mp4` (subtitles burned in). Becomes input to `add-music`.
- Intermediate: `<VideoName>.ass`.

## PROCEDURE
0. **AUDIO↔SUBTITLE GATE (QCR-180) — part of the OPTIONAL QC layer (`config.qc.enabled`, default false).** It runs `verify_audio_subtitle_match.py`, which transcribes the embedded audio **via the Gemini API** to compare against the SRT (i.e. it is a review call, not content generation). Run it ONLY when QC is enabled; with QC disabled, do NOT call Gemini here. The $0, no-API timing gate below (Step 0b) is the always-on safety net. (Note: with QC off you lose the wrong/stale-avatar catch this gate provides — the QCR-114/QCR-180 defect class is then guarded only by the deterministic Step 0b timing check + the per-run avatar isolation in Phase 3.)
0b. **SRT TIMING GATE (MANDATORY, QCR-232) — run right after the audio↔subtitle match (or first, when QC is off).** Step 0 confirms the right WORDS; this confirms the right TIMING. It catches a correctly-worded but desynced SRT (a real run shipped "extremely delayed subtitles": the transcriber returned degenerate per-word timestamps → the old guard char-packed the words across the whole timeline with no gaps → every word displayed 1-2.5s late). Compares the SRT against the audio's REAL speech runs (ffmpeg VAD, $0, no API):
```bash
python3 subtitle-pipeline/verify_srt_timing.py <downloads>/<VideoName>_avatar_1080p.mp4 --srt <downloads>/<VideoName>.srt --name <VideoName>
# (use the input you're about to burn — <VideoName>_broll.mp4 or _motion.mp4 — if the avatar file is gone; any of them carries the same narration audio)
```
Exit 0 = caption timeline tracks the speech, proceed. **Exit 1 = DESYNC (captions cover the real pauses / lag the speech) → STOP.** Do NOT burn or post. Rebuild the SRT: `transcribe_gemini_srt.py` VAD-anchors its degenerate fallback automatically, so simply re-run it on `<VideoName>_avatar_1080p.mp4` (or `build_srt_from_script.py <script> <avatar.mp4>` for a known verbatim script), then rerun this gate before continuing.
1. SRT → ASS (motion style; enforces 5 words/segment, 3 words/visual line, 18 chars/line). **QCR-044/QCR-035: pass a COHERENT highlight set (recurring concept + brand proper-nouns + numerals) WITH `--no-default-highlights`** so the generic DEFAULT_HIGHLIGHTS don't fire inconsistently (e.g. a plural inflection missed) and trip the QCR-035 highlight-consistency deduction:
```bash
python3 subtitle-pipeline/srt_to_ass.py <downloads>/<VideoName>.srt <downloads>/<VideoName>.ass --highlights "Brand1,Brand2,coreConcept" --no-default-highlights
```
(srt_to_ass.py also floors sub-0.8s flash entries into the trailing gap automatically — QCR-043.)
1b. **SUPPRESS subtitles during KINETIC-CAPTION (§3b) AND AVATAR-FLOATING-CAPTION (§5b) sections (QCR-109/QCR-147, when the video has any).** Both show the spoken line BIG as the caption — the bottom subtitle is redundant there. The composition lists BOTH section types' `[start,end]` windows (seconds) in `<downloads>/<VideoName>_caption_windows.json`. If it exists, drop the overlapping Dialogue lines before burning:
```bash
python3 subtitle-pipeline/suppress_windows.py <downloads>/<VideoName>.ass <downloads>/<VideoName>.ass --windows-file <downloads>/<VideoName>_caption_windows.json
```
1c. **CAPTION↔AUDIO SYNC GATE (MANDATORY, QCR-229) — run right after suppression, BEFORE the burn, ONLY when §3b/§5b caption windows exist.** Because step 1b DELETES the burned subtitle inside every caption window, the §3b/§5b motion caption becomes the ONLY text on screen there. If that hand-authored caption is paraphrased or off by a section, the viewer reads text that does not match the spoken audio (a desync that has shipped in a real run). This deterministic gate (no API) checks, per window, that the caption's content words are actually spoken inside its OWN window:
```bash
python3 subtitle-pipeline/verify_caption_sync.py --srt <downloads>/<VideoName>.srt \
  --segments <downloads>/<VideoName>_caption_segments.json --name <VideoName>
# Fallback if the motion step didn't emit the segments JSON (legacy comps):
#   --tsx motion-pipeline/remotion-agent/src/compositions/<VideoName>.tsx   (instead of --segments)
```
Exit 0 = every caption window matches its audio, proceed. **Exit 1 = at least one caption window shows the wrong/late text → STOP.** Do NOT burn or post. Go back to Phase 5: set each flagged §3b/§5b caption to the VERBATIM SRT words spoken in its OWN window, snap the window to the SRT sentence boundaries, re-emit `<VideoName>_caption_segments.json` + `<VideoName>_caption_windows.json`, re-render the motion, then rerun from step 1. (The motion skill runs this same gate pre-render so it is normally already green here.)
2. Validate placement BEFORE burn (exit 0 = PASS):
```bash
python3 subtitle-pipeline/srt_to_ass.py <downloads>/<VideoName>.ass --validate-only
```
3. Burn:
```bash
ffmpeg -y -i <downloads>/<VideoName>_broll.mp4 \
  -vf "ass=filename=<VideoName>.ass" -c:a copy <downloads>/<VideoName>_final.mp4
# run from the directory that holds <VideoName>.ass (libass resolves the filename relative to the cwd)
```
4. Post-burn validation (6 frames):
```bash
python3 subtitle-pipeline/validate_subtitles.py <downloads>/<VideoName>_final.mp4 --check-frames 6 --section-grammar  # --section-grammar for 6-section-grammar videos (QCR-084)
```

## SUBTITLE SPEC (motion context)
- Arial Black 68, MarginV 280, Outline 5, Shadow 2, BorderStyle 1. Scale overrides FORBIDDEN over motion (use CAPS).
- White `&H00FFFFFF` + Yellow highlights `&H0000D4FF`. Template `subtitle-pipeline/templates/v6_final.ass`.

## DEPENDENCIES
- Python 3, ffmpeg with libass (`python3 bin/doctor.py` checks this; `MAESTRO_FFMPEG` overrides the binary). No external keys. Subtitle text in `config.brand.language` (default pt-BR).
