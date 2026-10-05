---
name: add-music
description: Phase 9 (SOUND DESIGN) of the Maestro Video Generator pipeline. In ONE pass add_music.py adds background music + the HOOK RISER (peak on the hook-phrase end) + the DROP (music starts after the riser peak) + TRANSITION CLICKS on every edit-stage cut, producing _music.mp4. Triggers — "add music", "add background music", "add a soundtrack", "add sound effects", "mix in a song".
---

> Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

# Skill: add-music (Phase 9 — SOUND DESIGN: music + hook riser + drop + transition clicks)

Wraps the EXISTING `add_music.py`. Do not rewrite. ALL of the layers below are **DEFAULT, ON, automatic** — a new session needs no prior knowledge; just pass `--input/--output` (and ideally `--song`) and the script resolves the SRT and visual plan itself. Applies to BOTH the "run pipeline" and link-driven (`generate-video-from-link`) entry points, since both call this skill.

## THE THREE SOUND-DESIGN LAYERS (one ffmpeg pass = one audio encode)

1. **HOOK RISER** (house rule) — `sfx/hook-riser.wav` overlaid on the hook so its LOUDEST point lands EXACTLY on the end of the first spoken sentence (the "hook phrase"). **Ducked under the narration** (sidechain) at volume **0.75** (1.0 was "a bit loud") so it NEVER covers the voice. `riser_start = hook_end − riser_peak_offset` (clamped ≥0); the peak offset is **measured from the riser file** (generalises to any riser).
2. **THE DROP** — the song no longer starts at t=0; it **fades in just AFTER the riser peak** (hook_end + 0.10s). Hook = voice + riser building to the peak, then the music "drops" in. Music volume **0.07**, 2s fade-in / 3s fade-out.
3. **TRANSITION CLICKS** (house rule) — `sfx/transition-click.wav` ticked on EVERY edit-stage transition (visual section/cut boundaries). Each click is placed so its sharp transient lands EXACTLY on the cut (`start = boundary − click_peak_offset`, peak offset measured from the click file). **The FIRST click is louder (peak 0.20 ≈ −14 dB); EVERY click after is more subtle (peak 0.11 ≈ −19 dB).** Clicks are summed un-ducked (short transients); the final limiter (0.95) catches the sum.
   - **Where the transition times come from:** PREFER the visual plan (`<downloads>/<Name>_visual_plan.json` → `section_boundaries`, or `sections[].win` starts) when present; OTHERWISE fall back to **ffmpeg scene detection** on the rendered input video (threshold 0.30) — plan-independent, works on every video (recovered 16/18 cuts in test). Boundaries are filtered to the body (drop opening <1.0s and the last 0.8s) and de-duped with a 1.2s minimum gap.

**Robustness — this phase NEVER hard-fails on sound design:** no SRT / hook-end not found / riser missing → skip riser+drop (legacy music-from-0), logged. No plan boundaries AND scene detection finds no cuts → skip clicks, logged. `--no-riser` / `--no-clicks` force each layer off independently; `--no-music` skips the music bed (keeps riser + clicks). The narration is always preserved.

## INPUTS
- `--input`: `<downloads>/<VideoName>_final.mp4` (subtitled, from `generate-subtitles`).
- `--output`: `<downloads>/<VideoName>_music.mp4`.
- `--song` (optional): a filename inside `music/` or an absolute path; random pick from `music/` if omitted. **QCR-076: MATCH the creative_brief `music_mood` — pass `--song` explicitly, don't rely on the random default.** Name your tracks by mood so the match is obvious: `light-friendly`/uplifting tech → e.g. `music/light-friendly-01.mp3`; `tense`/`news`/`warning` → e.g. `music/tense-suspense-01.mp3`; epic/big → e.g. `music/epic-cinematic-01.mp3`; `elegant`/cinematic-ambient → e.g. `music/elegant-ambient-01.mp3` (see `music/README.md`; no tracks ship with the package — drop in your own licensed ones).
- `--volume` (optional): default **0.07**. Do not raise without the user's approval.
- `--srt` (optional): hook SRT; auto-resolved from the output name (`<scratch>/<Name>.srt`) if omitted.
- `--visual-plan` (optional): clicks boundary source; auto-resolved from `<downloads>/<Name>_visual_plan.json` if omitted (else scene detection).
- `--riser` / `--riser-volume` / `--no-riser` (optional): override / disable the riser+drop.
- `--click` / `--no-clicks` (optional): override the click SFX / disable clicks.
- `--no-music` (optional): no music bed (riser + clicks only).

## OUTPUTS
- `<downloads>/<VideoName>_music.mp4` (narration + hook riser + drop + transition clicks + low music). This is the QC + post input.

## COMMAND
```bash
# Riser, drop and clicks are ALL automatic; SRT + visual plan auto-resolved from the name.
python3 add_music.py \
  --input <downloads>/<VideoName>_final.mp4 \
  --output <downloads>/<VideoName>_music.mp4 \
  --song "light-friendly-01.mp3"   # pass the mood-matched track from music/ (QCR-076)
```

## DEPENDENCIES
- Python 3 (stdlib only: array, wave, struct, tempfile), ffmpeg/ffprobe on PATH (`MAESTRO_FFMPEG` overrides).
- Songs folder: `music/` (your own licensed tracks, named by mood). `MUSIC_VOLUME = 0.07`.
- SFX assets (present in repo): `sfx/hook-riser.wav`, `sfx/transition-click.wav`.
- SRT at `<scratch>/<Name>.srt` (Phase 3). Visual plan at `<downloads>/<Name>_visual_plan.json` (Phase 5, optional — scene detection covers its absence).

## NOTE
- After ANY subtitle re-burn, re-run add-music so the final file (the one QC grades when enabled, and the one you post) always has the full sound design.
- The riser peak is ducked at the exact moment the voice finishes the hook line — that is intended. Confirm in the log: `Riser: … starts …`, `Drop: music starts …`, `Clicks: N transitions (visual-plan|scene-detect)`.
- All tuning is centralised as constants at the top of `add_music.py` (`RISER_VOLUME`, `CLICK_FIRST_PEAK`, `CLICK_REST_PEAK`, `CLICK_SCENE_THRESHOLD`, …). See QCR-210 (riser) + QCR-211 (clicks).
