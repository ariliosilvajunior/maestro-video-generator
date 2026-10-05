#!/usr/bin/env python3
"""
Phase 9 — SOUND DESIGN: background music + HOOK RISER + the "drop" + TRANSITION CLICKS.

Everything here is ON BY DEFAULT and fully automatic (house rules, approved on real test renders). A new session needs NO prior knowledge — just call this
with --input/--output (and ideally --song); it resolves the SRT and the visual plan itself.

THREE sound-design layers, one single ffmpeg pass (one audio encode, best quality):

  1. HOOK RISER  — `sfx/hook-riser-5s-01-riser7.mp3` overlaid on the hook so its LOUDEST
     point lands EXACTLY on the end of the first spoken sentence (the "hook phrase",
     read from the SRT). Ducked under the narration (sidechain) at volume 0.75 so it
     NEVER covers the voice. riser_start = hook_end - riser_peak_offset (clamped >= 0).
     The peak offset is MEASURED from the riser file, so it generalises to any riser.

  2. THE DROP   — the background song no longer starts at t=0. It fades in just AFTER the
     riser peak passes (hook_end + 0.10s). So the hook is voice + riser building to the
     peak, then the music "drops" in. Same low volume (0.07) + 3s fade-out as before.

  3. TRANSITION CLICKS — `sfx/transition-click-01-classic.mp3` ticked on EVERY edit-stage
     transition (the visual section/cut boundaries). Each click is placed so its sharp
     transient lands EXACTLY on the cut (start = boundary - click_peak_offset). The FIRST
     click is at peak 0.20 (~-14 dB); EVERY click after is quieter at peak 0.11 (~-19 dB).
     Boundaries come from the visual plan when usable (section_boundaries / sections[].win),
     otherwise from ffmpeg SCENE DETECTION on the rendered video (plan-independent — works
     on every video). Clicks are summed un-ducked (they are short transients); the final
     limiter catches any sum.

Robustness — this phase NEVER hard-fails on sound design:
  - No SRT / hook-end not found / riser file missing  -> skip riser + drop (legacy music
    from t=0), logged.
  - No usable boundaries (no plan field AND scene detection finds nothing) -> skip clicks,
    logged.
  - --no-riser and --no-clicks force each layer off independently.

Usage:
    python3 add_music.py \
        --input ~/Downloads/VideoName_final.mp4 \
        --output ~/Downloads/VideoName_music.mp4 \
        --song light-friendly-01.mp3        # a file in music/ (or an absolute path) matched to the brief's music_mood
        # riser, drop and clicks are automatic; SRT + visual plan auto-resolved from the name.
"""

import argparse
import array
import os
import random
import re
import struct
import subprocess
import sys
import tempfile
import wave

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from lib.ffmpeg import find_ffmpeg, get_duration  # noqa: E402
from lib.paths import maestro_tmp, downloads  # noqa: E402

FFMPEG = find_ffmpeg()  # prefers a build with libass (see lib/ffmpeg.py)
SONGS_DIR = os.path.join(SCRIPT_DIR, "music")

# Music volume relative to narration (0.0-1.0).
# 0.12 was judged "a bit loud" in review — lowered to 0.07.
MUSIC_VOLUME = 0.07
FADE_IN_DURATION = 2   # seconds
FADE_OUT_DURATION = 3  # seconds

# --- Hook riser + drop (house rule) ---
HOOK_RISER = os.path.join(SCRIPT_DIR, "sfx", "hook-riser.wav")
RISER_VOLUME = 0.75          # approved in review (1.0 was "a bit loud")
RISER_PEAK_FALLBACK = 1.85   # seconds into the riser, used if envelope analysis fails
MUSIC_AFTER_PEAK_GAP = 0.10  # music starts hook_end + this many seconds (just after the peak)
RISER_DUCK = "sidechaincompress=threshold=0.02:ratio=12:attack=5:release=250"

# --- Transition clicks (house rule) ---
TRANSITION_CLICK = os.path.join(SCRIPT_DIR, "sfx", "transition-click.wav")
CLICK_FIRST_PEAK = 0.20      # ~-14 dB — the FIRST transition click (the noticeable one)
CLICK_REST_PEAK = 0.11       # ~-19 dB — EVERY click after the first (even more subtle)
CLICK_SCENE_THRESHOLD = 0.30 # ffmpeg scene-detection threshold (recovered 16/18 cuts in test)
CLICK_MIN_GAP = 1.2          # seconds — drop a click that falls within this of the previous
CLICK_STALE_TOL = 0.40       # QCR-326: a plan boundary counts as "matched" if within this of a real scene cut
CLICK_STALE_MIN_MATCH = 0.50 # QCR-326: if fewer than this fraction of plan boundaries match real cuts, the plan is STALE -> scene-detect
CLICK_SR = 44100             # click-track sample rate
LIMITER = "alimiter=limit=0.95"


def get_video_stream_duration(path):
    """Duração do stream de VÍDEO (não do container/áudio) — é o que fixa o comprimento da saída."""
    try:
        out = subprocess.run(
            [os.path.join(os.path.dirname(FFMPEG), "ffprobe"), "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=duration", "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True).stdout.strip()
        return float(out) if out else None
    except Exception:
        return None


def list_songs() -> list:
    if not os.path.isdir(SONGS_DIR):
        print(f"ERROR: Songs directory not found: {SONGS_DIR}")
        sys.exit(1)
    songs = [
        f for f in os.listdir(SONGS_DIR)
        if f.lower().endswith((".mp3", ".wav", ".m4a", ".aac"))
    ]
    if not songs:
        print(f"ERROR: No audio files found in {SONGS_DIR}")
        sys.exit(1)
    return sorted(songs)


# ----------------------------- hook riser helpers -----------------------------

def _srt_time_to_seconds(t: str) -> float:
    hh, mm, rest = t.split(":")
    ss, ms = rest.split(",")
    return int(hh) * 3600 + int(mm) * 60 + int(ss) + int(ms) / 1000.0


def find_hook_end(srt_path: str):
    """End time (s) of the first spoken SENTENCE in the SRT (first segment whose text ends
    with . ! ? …). Falls back to the end of the last segment starting before 5s, else None."""
    if not srt_path or not os.path.exists(srt_path):
        return None
    try:
        with open(srt_path, "r", encoding="utf-8", errors="replace") as fh:
            raw = fh.read()
    except Exception:
        return None
    blocks = re.split(r"\n\s*\n", raw.strip())
    last_end_before_5 = None
    for block in blocks:
        lines = [ln for ln in block.splitlines() if ln.strip()]
        if len(lines) < 2:
            continue
        timing = next((ln for ln in lines if "-->" in ln), None)
        if not timing:
            continue
        m = re.search(r"(\d\d:\d\d:\d\d,\d\d\d)\s*-->\s*(\d\d:\d\d:\d\d,\d\d\d)", timing)
        if not m:
            continue
        start = _srt_time_to_seconds(m.group(1))
        end = _srt_time_to_seconds(m.group(2))
        text = " ".join(ln for ln in lines if ln != timing and "-->" not in ln).strip()
        if start < 5.0:
            last_end_before_5 = end
        if text and text[-1] in ".!?…":
            return end
    return last_end_before_5


def _decode_mono(path: str, sr: int):
    """Decode an audio file to a list of mono float samples at sr. Returns (samples, max_abs)."""
    proc = subprocess.run(
        [FFMPEG, "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
        capture_output=True,
    )
    data = proc.stdout
    n = len(data) // 4
    if n == 0:
        return [], 0.0
    samples = list(struct.unpack("<%df" % n, data[:n * 4]))
    return samples, max(abs(x) for x in samples)


def measure_riser_peak_offset(riser_path: str) -> float:
    """Time (s) of the riser's loudest point (peak of a ~50ms moving sum-of-squares envelope)."""
    try:
        sr = 22050
        samples, _ = _decode_mono(riser_path, sr)
        n = len(samples)
        if n == 0:
            return RISER_PEAK_FALLBACK
        win = max(1, int(0.05 * sr))
        sq = [s * s for s in samples]
        acc = sum(sq[:min(win, n)])
        best_val, best_idx = acc, 0
        for i in range(win, n):
            acc += sq[i] - sq[i - win]
            if acc > best_val:
                best_val, best_idx = acc, i - win + 1
        return (best_idx + win / 2.0) / sr
    except Exception:
        return RISER_PEAK_FALLBACK


def resolve_named(explicit, input_path, output_path, dirpath, suffix):
    """Resolve a sibling artifact (e.g. SRT, visual plan) from the <Name> in the output/input
    filename. <Name> = basename minus the _music/_final/_broll/_motion suffix."""
    if explicit:
        return os.path.expanduser(explicit)
    for p in (output_path, input_path):
        name = os.path.splitext(os.path.basename(p))[0]
        name = re.sub(r"_(music|final|broll|motion)$", "", name)
        cand = os.path.join(dirpath, f"{name}{suffix}")
        if os.path.exists(cand):
            return cand
    return None


# --------------------------- transition-click helpers --------------------------

def measure_click_peak_offset(click_path: str):
    """(peak_offset_seconds, samples, max_abs) for the click — peak = the single sharpest
    transient sample (argmax |x|), which is what we align onto the cut."""
    samples, mx = _decode_mono(click_path, CLICK_SR)
    if not samples:
        return None
    peak_idx = max(range(len(samples)), key=lambda i: abs(samples[i]))
    return peak_idx / CLICK_SR, samples, mx


def plan_boundaries(plan_path):
    """Transition times (s) from the visual plan, if the schema carries them. Supports
    `section_boundaries` (array) and `sections` (array of {win:[s,e]}). Returns None otherwise."""
    if not plan_path or not os.path.exists(plan_path):
        return None
    try:
        import json
        with open(plan_path) as fh:
            d = json.load(fh)
    except Exception:
        return None
    sb = d.get("section_boundaries")
    if isinstance(sb, list) and len(sb) >= 3:
        return [float(x) for x in sb]
    secs = d.get("sections")
    if isinstance(secs, list) and secs:
        starts = [float(s["win"][0]) for s in secs
                  if isinstance(s, dict) and isinstance(s.get("win"), list) and len(s["win"]) == 2]
        if starts:
            return starts
    return None


def scene_detect(video_path, threshold=CLICK_SCENE_THRESHOLD):
    """Visual-cut times (s) via ffmpeg scene detection. Plan-independent — works on any
    rendered video. Deterministic for a given input."""
    try:
        proc = subprocess.run(
            [FFMPEG, "-hide_banner", "-i", video_path,
             "-filter:v", f"select='gt(scene,{threshold})',showinfo", "-f", "null", "-"],
            capture_output=True, text=True,
        )
        return [float(m) for m in re.findall(r"pts_time:([0-9.]+)", proc.stderr)]
    except Exception:
        return []


def get_transition_boundaries(plan_path, video_path, duration):
    """Final transition list for the clicks. Prefers the visual plan; falls back to scene
    detection. Filters to the body of the video and enforces a minimum gap. Returns (list, source).

    QCR-326: the plan's `section_boundaries` can go STALE after a
    re-render (the .tsx section timings changed but the plan JSON was not re-written), which
    would place transition clicks at the OLD cut times — audibly off the actual cuts. Guard it:
    when the plan supplies boundaries, cross-check them against the rendered video's ACTUAL scene
    cuts; if the plan and the real cuts disagree badly (few plan boundaries land near a real cut),
    the plan is stale -> fall back to scene-detect (always derived from the real rendered file)."""
    src = "visual-plan"
    b = plan_boundaries(plan_path)
    if b:
        # Staleness cross-check: how many plan boundaries sit within STALE_TOL of a REAL scene cut?
        real_cuts = scene_detect(video_path)
        if real_cuts:
            body = [x for x in b if 1.0 < x < duration - 0.8]
            if body:
                matched = sum(1 for x in body
                              if min((abs(x - c) for c in real_cuts), default=99.0) <= CLICK_STALE_TOL)
                if matched / len(body) < CLICK_STALE_MIN_MATCH:
                    print(f"  Clicks:   visual-plan boundaries look STALE vs the rendered cuts "
                          f"({matched}/{len(body)} within {CLICK_STALE_TOL}s) -> using scene-detect (QCR-326).")
                    src = "scene-detect"
                    b = real_cuts
    else:
        src = "scene-detect"
        b = scene_detect(video_path)
    # keep the body only (drop opening < 1.0s and the final < 0.8s of tail), dedup, sort
    b = sorted({round(x, 3) for x in b if 1.0 < x < duration - 0.8})
    out, last = [], -99.0
    for x in b:
        if x - last >= CLICK_MIN_GAP:
            out.append(x)
            last = x
    return out, src


def build_click_track(click_path, boundaries, duration):
    """Render a 16-bit stereo WAV of the same length as the video with one click at each
    boundary: first click at CLICK_FIRST_PEAK, the rest at CLICK_REST_PEAK, each placed so
    its transient lands on the cut. Returns the temp wav path, or None."""
    if not boundaries:
        return None
    info = measure_click_peak_offset(click_path)
    if not info:
        return None
    peak_off_s, click, mx = info
    if mx <= 0:
        return None
    peak_off = int(round(peak_off_s * CLICK_SR))
    total = int(duration * CLICK_SR)
    out = array.array("h", bytes(4 * total))  # zero-init stereo int16 (2 shorts / frame)
    for idx, b in enumerate(boundaries):
        g = (CLICK_FIRST_PEAK if idx == 0 else CLICK_REST_PEAK) / mx
        start = int(round(b * CLICK_SR)) - peak_off
        for i, x in enumerate(click):
            j = start + i
            if 0 <= j < total:
                v = int(max(-1.0, min(1.0, x * g)) * 32767)
                s = max(-32768, min(32767, out[2 * j] + v))
                out[2 * j] = s
                out[2 * j + 1] = s
    fd, path = tempfile.mkstemp(suffix=".wav", prefix="clicktrack_")
    os.close(fd)
    w = wave.open(path, "wb")
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(CLICK_SR)
    w.writeframes(out.tobytes())
    w.close()
    return path


# ----------------------------------- main -------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Phase 9 sound design: music + hook riser + transition clicks")
    parser.add_argument("--input", required=True, help="Input video (with narration)")
    parser.add_argument("--output", required=True, help="Output video path")
    parser.add_argument("--song", default=None, help="Song: a filename inside music/ or an absolute path (random music/ track if omitted)")
    parser.add_argument("--no-music", action="store_true", help="Skip the music bed (keep riser + clicks)")
    parser.add_argument("--volume", type=float, default=MUSIC_VOLUME, help=f"Music volume 0.0-1.0 (default {MUSIC_VOLUME})")
    parser.add_argument("--srt", default=None, help="Hook SRT (auto-resolved from <scratch>/<Name>.srt)")
    parser.add_argument("--riser", default=HOOK_RISER, help="Hook riser SFX path")
    parser.add_argument("--riser-volume", type=float, default=RISER_VOLUME, help=f"Riser volume (default {RISER_VOLUME})")
    parser.add_argument("--no-riser", action="store_true", help="Disable hook riser + drop (legacy music-from-0)")
    parser.add_argument("--visual-plan", default=None, help="Visual plan json (auto-resolved from <downloads>/<Name>_visual_plan.json)")
    parser.add_argument("--click", default=TRANSITION_CLICK, help="Transition click SFX path")
    parser.add_argument("--no-clicks", action="store_true", help="Disable transition clicks")
    args = parser.parse_args()

    input_path = os.path.expanduser(args.input)
    output_path = os.path.expanduser(args.output)
    if not os.path.exists(input_path):
        print(f"ERROR: Input video not found: {input_path}")
        sys.exit(1)

    if args.no_music:
        song_name, song_path = "(none)", None
    elif args.song and os.path.isfile(os.path.expanduser(args.song)):
        song_path = os.path.expanduser(args.song)
        song_name = os.path.basename(song_path)
    else:
        songs = list_songs()
        if args.song:
            if args.song not in songs:
                print(f"ERROR: Song '{args.song}' not found in {SONGS_DIR}. Available: {songs}")
                sys.exit(1)
            song_name = args.song
        else:
            song_name = random.choice(songs)
        song_path = os.path.join(SONGS_DIR, song_name)

    duration = get_duration(input_path)
    fade_out_start = max(0, duration - FADE_OUT_DURATION)

    # ---- Layer 1+2: hook riser + drop ----
    riser_path = os.path.expanduser(args.riser)
    srt_path = None if args.no_riser else resolve_named(args.srt, input_path, output_path, maestro_tmp(), ".srt")
    hook_end = find_hook_end(srt_path) if srt_path else None
    riser_on = (not args.no_riser) and os.path.exists(riser_path) and hook_end is not None

    # ---- Layer 3: transition clicks ----
    click_path = os.path.expanduser(args.click)
    clicks_on = (not args.no_clicks) and os.path.exists(click_path)
    boundaries, click_src = ([], None)
    if clicks_on:
        plan_path = resolve_named(args.visual_plan, input_path, output_path,
                                  downloads(), "_visual_plan.json")
        boundaries, click_src = get_transition_boundaries(plan_path, input_path, duration)
        clicks_on = len(boundaries) > 0

    print("=" * 60)
    print("PHASE 9: SOUND DESIGN  (music"
          + (" + hook riser/drop" if riser_on else "")
          + (" + transition clicks" if clicks_on else "") + ")")
    print("=" * 60)
    print(f"  Input:    {input_path}")
    print(f"  Song:     {song_name}   Volume: {args.volume}")
    print(f"  Duration: {duration:.1f}s   Fade in {FADE_IN_DURATION}s / out {FADE_OUT_DURATION}s")

    click_track = None
    try:
        # Build the ffmpeg inputs + filter graph modularly so the two existing, approved
        # paths (riser-on / legacy) produce IDENTICAL filters when clicks are off.
        inputs = [input_path] + ([song_path] if song_path else [])
        idx = len(inputs)
        parts = []
        music_on = song_path is not None

        if riser_on:
            peak_off = measure_riser_peak_offset(riser_path)
            riser_start = max(0.0, hook_end - peak_off)
            music_start = hook_end + MUSIC_AFTER_PEAK_GAP
            m_fade_out = max(music_start, duration - FADE_OUT_DURATION)
            rs_ms, ms_ms = int(round(riser_start * 1000)), int(round(music_start * 1000))
            inputs.append(riser_path)
            riser_idx = idx
            idx += 1
            print(f"  Riser:    {os.path.basename(riser_path)} peak@{peak_off:.2f}s -> starts {riser_start:.2f}s, vol {args.riser_volume}")
            print(f"  Drop:     music starts {music_start:.2f}s (after the hook peak at {hook_end:.2f}s)")
            parts.append("[0:a]asplit=2[v0][key]")
            parts.append(f"[{riser_idx}:a]adelay={rs_ms}|{rs_ms},volume={args.riser_volume}[rr]")
            parts.append(f"[rr][key]{RISER_DUCK}[rd]")
            mix = ["[v0]", "[rd]"]
            if music_on:
                parts.append(f"[1:a]volume={args.volume},adelay={ms_ms}|{ms_ms},"
                             f"afade=t=in:st={music_start:.2f}:d={FADE_IN_DURATION}:curve=tri,"
                             f"afade=t=out:st={m_fade_out:.2f}:d={FADE_OUT_DURATION}[bg]")
                mix.append("[bg]")
        else:
            if not args.no_riser:
                print("  Riser:    SKIPPED (no SRT / hook end not found / riser missing) — legacy music-from-0.")
            mix = ["[0:a]"]
            if music_on:
                parts.append(f"[1:a]volume={args.volume},"
                             f"afade=t=in:d={FADE_IN_DURATION},"
                             f"afade=t=out:st={fade_out_start:.2f}:d={FADE_OUT_DURATION}[bg]")
                mix.append("[bg]")

        if clicks_on:
            click_track = build_click_track(click_path, boundaries, duration)
            if click_track:
                inputs.append(click_track)
                mix.append(f"[{idx}:a]")
                idx += 1
                print(f"  Clicks:   {len(boundaries)} transitions ({click_src}); "
                      f"1st peak {CLICK_FIRST_PEAK} (~-14dB), rest {CLICK_REST_PEAK} (~-19dB)")
                print(f"            at: {', '.join(f'{b:.1f}' for b in boundaries)}")
            else:
                clicks_on = False
        if not clicks_on and not args.no_clicks and not boundaries:
            print("  Clicks:   SKIPPED (no plan boundaries and scene detection found no cuts).")

        # Final mix. normalize=0 (sum, not average) keeps the narration at full level; the
        # limiter catches any peak. The legacy no-extras case keeps the original recipe.
        if len(mix) == 1:
            parts.append(mix[0] + "anull[out]")   # nothing to mix (no music, no riser, no clicks)
        elif len(mix) == 2 and not riser_on and music_on:
            parts.append("".join(mix) + "amix=inputs=2:duration=first:dropout_transition=3[out]")
        else:
            parts.append("".join(mix) + f"amix=inputs={len(mix)}:duration=first:normalize=0:dropout_transition=0,{LIMITER}[out]")

        filter_complex = ";".join(parts)
        cmd = [FFMPEG, "-y"]
        for p in inputs:
            cmd += ["-i", p]
        # Pin the output to the VIDEO stream duration: `amix=duration=first` follows input 0's AUDIO, so a
        # narration track slightly longer than the picture would leak past the last frame. `-shortest` is
        # wrong (it would cut the picture when the audio is shorter); `-t <video duration>` never trims the image.
        video_dur = get_video_stream_duration(input_path) or duration
        cmd += ["-filter_complex", filter_complex,
                "-map", "0:v", "-map", "[out]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{video_dur:.3f}", output_path]

        print("\n  Running ffmpeg...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"ERROR: ffmpeg failed:\n{result.stderr[-1000:]}")
            sys.exit(1)
    finally:
        if click_track and os.path.exists(click_track):
            os.remove(click_track)

    out_size = os.path.getsize(output_path)
    out_dur = get_duration(output_path)
    print(f"\n  Output:   {output_path}")
    print(f"  Size:     {out_size / 1024 / 1024:.1f} MB")
    print(f"  Duration: {out_dur:.1f}s (original: {duration:.1f}s)")
    if abs(out_dur - duration) > 0.5:
        print(f"  WARNING: Duration mismatch ({abs(out_dur - duration):.2f}s)")

    print(f"\n{'='*60}")
    print(f"PHASE 9 COMPLETE — {song_name}"
          + (" + hook riser/drop" if riser_on else "")
          + (f" + {len(boundaries)} clicks" if clicks_on else ""))
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
