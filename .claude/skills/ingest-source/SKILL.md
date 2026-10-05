---
name: ingest-source
description: Phase 0 — start the pipeline from a PROVIDED source video file (a real camera recording or export) instead of a HeyGen avatar. Converts the source to the 1080x1920 working video + extracts audio for transcription; for long clips, builds a content map and cuts the best short-form segment. Triggers — "edit this video", "edit this video from 0", "edit <file>", "make a short from this recording/clip/file", "ingest this video", any time the user hands a local video FILE (not a YouTube/IG link, not a topic).
---

Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: ingest-source (Phase 0 — ingest a provided source video)

Use when the user hands a **local video FILE** to edit (camera recording, export, clip).
This REPLACES Phase 1 (source select) + Phase 3 (HeyGen) — the provided file IS the talking-head
footage. After ingest, hand off to the normal pipeline from Phase 2.5 onward
(Creative Direction → Source Visuals → Motion → Merge → Insert → Subtitles → Music → QC when enabled).
(For a YouTube/Instagram URL use `generate-video-from-link` instead; for a topic start at Phase 1/2.)
Paths: `<downloads>` = `paths.downloads` (default `~/Downloads`), `<scratch>` = `paths.tmp` (default `/tmp/claude`) — `python3 lib/paths.py` prints both.

## WORKFLOW

### 1. Ingest the file
```bash
python3 ingest-pipeline/ingest_source.py <source-file> --name <Name> \
    [--geometry cover|pad|none] [--start S --duration D]
```
- Produces `<downloads>/<Name>_source.mp4` (1080x1920 h264+aac — the working "avatar" video)
  and `<scratch>/<Name>_audio.wav` (for transcription).
- `cover` (default) center-crops to 9:16; `pad` letterboxes; `none` for already-vertical.
- **Long source?** Don't transcode the whole thing — pick a segment with `--start/--duration`
  (see step 2). The pipeline target is a ≤60s short.
- Exit codes: 0 = working video + audio ready · **2 = video UNDECODABLE (e.g. BRAW)** — audio
  was still extracted · 1 = failure.

### 2. Long recording → pick the best short-form segment (content map)
For a long clip (minutes), first map the content and choose the strongest ~20-60s cut:
```bash
python3 ingest-pipeline/audio_content_map.py <scratch>/<Name>_audio.wav --name <Name>
```
→ `<scratch>/<Name>_content_map.json` = summary, topic timeline, ranked `best_segments`
(start/end + hook + PT-BR headline), and `named_references` (real things to screenshot).
**Caveat:** audio-only timestamps are APPROXIMATE — once the video is decodable, refine the
chosen segment's exact in/out against the picture (and the Gemini SRT). Then re-run step 1 with
`--start/--duration` for that segment.

### 3. Hand off to the pipeline (Phase 2.5 → …)
- Treat `<downloads>/<Name>_source.mp4` as the avatar/source video for the rest of the run.
- Transcribe it for the SRT: `subtitle-pipeline/transcribe_gemini_srt.py <Name>_source.mp4 --name <Name>`.
- Run Creative Direction (premium-classic default), Source Visuals (stock + **reference screenshots** —
  the `named_references` from the content map are prime capture targets), Motion, Merge, Insert,
  Subtitles, Music, QC (only when `config.qc.enabled`).
- **Do NOT auto-post a hand-provided real video.** "Edit this video" means produce the finished
  `_music.mp4` (QC-passed when QC is enabled) and deliver it. Post only on an explicit "post it" instruction.

## BRAW (Blackmagic RAW, `.braw`) — special case
`ffmpeg` can demux the AUDIO but CANNOT decode BRAW video, and Blackmagic's desktop apps
(RAW Player / Speed Test / Proxy Generator) are GUI-only and NOT scriptable — so there is **no
headless BRAW→mp4 path** out of the box. `ingest_source.py` therefore extracts the audio
(so the content map / transcription run) and exits 2 with instructions. To proceed with the
VIDEO, provide a **decodable export** (one of):
- Open the clip in **Blackmagic Proxy Generator** → export H.264/ProRes `.mov`/`.mp4`;
- or export H.264 from the camera / DaVinci Resolve;
- or install the **Blackmagic RAW SDK command-line** decoder (then this skill can be extended to call it).
Then re-run step 1 on that export. **NO AI generation, no fake frames.**

## DEPENDENCIES
- `ingest-pipeline/ingest_source.py`, `ingest-pipeline/audio_content_map.py` (ffmpeg with libass — `python3 bin/doctor.py` checks it — + the Gemini key from `.claude/keys.md` `## Gemini`).
- Downstream: `transcribe_gemini_srt.py`, `choose-creative-direction`, `select-brolls-stock`,
  `capture-references`, `generate-motion-remotion`, `generate-subtitles`, `add-music`, `qc-gate-gemini` (when enabled).
