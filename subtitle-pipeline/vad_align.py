#!/usr/bin/env python3
"""vad_align.py — Voice-Activity-Detection anchored subtitle timing (QCR-232).

WHY THIS EXISTS
---------------
Reel DaEFB_vy8sV ("O Gemini matou o videomaker de drone") shipped with subtitles
that lagged the speech by 1-2.5s through the body. Root cause: gemini-2.5-flash
returned per-WORD segments with DEGENERATE (collapsed) timestamps, so the
`to_srt` degenerate-guard (QCR-074) fell back to redistributing the text
char-proportionally across the FULL audio duration — packed end-to-end with ZERO
gaps. Real TTS narration is NOT gap-free: this 65s clip had 8.1s (12%) of
inter-sentence pauses. Char-proportional packing absorbs that pause time into the
word display times, so every word is shown LATER than it is spoken and the lag
compounds through the body (sentence 1 ended on screen at 4.73s but was spoken by
3.40s). Both existing gates (`verify_audio_subtitle_match` = text-content only,
`verify_caption_sync` = §3b/§5b windows only) are blind to main-track TIMING, so
it shipped at QC 100.

THE FIX
-------
Instead of distributing text across the full timeline, detect the REAL speech runs
from the audio (ffmpeg `silencedetect`, $0, deterministic, no AI, no forbidden
whisper) and distribute the text char-proportionally across SPEECH-ONLY time —
mapping each segment's cumulative-char position onto the concatenated speech
timeline, then back to real timestamps that SKIP the pauses. Words land on speech;
breaths/pauses stay empty; the cumulative drift is gone.

PUBLIC API
----------
  speech_runs(media, noise_db=-32.0, min_sil=0.18) -> [(start, end), ...]
  redistribute_over_speech(segments, runs, duration) -> segments (start/end rewritten)
  speech_total(runs) -> float

`segments` is a list of dicts with at least a "text" key (and optionally
start/end, which are overwritten). Order is preserved — the caller is responsible
for passing segments in spoken order.
"""
import os
import re
import shutil
import subprocess

_FFMPEG_CANDIDATES = [
    os.environ.get("MAESTRO_FFMPEG") or "",
    shutil.which("ffmpeg") or "",
    "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
]


def _ffmpeg():
    try:
        import sys as _s
        _s.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from lib.ffmpeg import find_ffmpeg as _ff
        return _ff()
    except Exception:  # noqa: BLE001
        pass
    for c in _FFMPEG_CANDIDATES:
        if c and os.path.exists(c):
            return c
    raise RuntimeError("ffmpeg not found")


def speech_runs(media, noise_db=-32.0, min_sil=0.18):
    """Return ordered, non-overlapping (start, end) speech runs for `media`.

    Uses ffmpeg `silencedetect` and inverts the detected silences. Returns an
    empty list if the media duration cannot be read; returns the whole clip as a
    single run if no silence is detected (continuous speech)."""
    ff = _ffmpeg()
    probe = subprocess.run(
        [os.path.join(os.path.dirname(ff), "ffprobe"), "-v", "error",
         "-show_entries", "format=duration", "-of",
         "default=noprint_wrappers=1:nokey=1", media],
        capture_output=True, text=True)
    try:
        duration = float(probe.stdout.strip())
    except (TypeError, ValueError):
        return []
    out = subprocess.run(
        [ff, "-i", media, "-af",
         f"silencedetect=noise={noise_db}dB:d={min_sil}", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    silences, cur = [], None
    for line in out.splitlines():
        m = re.search(r"silence_start:\s*([\d.]+)", line)
        if m:
            cur = float(m.group(1))
            continue
        m = re.search(r"silence_end:\s*([\d.]+)", line)
        if m and cur is not None:
            silences.append((cur, float(m.group(1))))
            cur = None
    runs, t = [], 0.0
    for s, e in silences:
        if s > t + 1e-3:
            runs.append((t, min(s, duration)))
        t = max(t, e)
    if t < duration - 1e-3:
        runs.append((t, duration))
    return runs


def speech_total(runs):
    return sum(e - s for s, e in runs)


def _wlen(seg):
    return max(len((seg.get("text") or "").strip()), 1)


def _legacy_full_spread(segs, total_chars, duration):
    """Last-resort char-proportional spread over the WHOLE timeline (the old
    QCR-074 behaviour). Only used when VAD finds no usable speech runs."""
    t = 0.0
    for s in segs:
        d = (_wlen(s) / total_chars) * duration
        s["start"] = t
        s["end"] = min(duration, t + d)
        t = s["end"]
    return segs


def redistribute_over_speech(segments, runs, duration):
    """Rewrite each segment's start/end so captions land ON real speech and the
    silent pauses stay empty.

    Strategy (QCR-232): assign whole segments to speech runs greedily, snapping at
    segment boundaries near each run's char-proportional target, then distribute
    each run's segments char-proportionally across THAT run's real [start, end].
    Snapping to run boundaries means (a) no caption straddles a pause, so the
    pauses render empty, and (b) each run's pace is its OWN real duration, which
    removes the cumulative pause-absorption drift that made DaEFB_vy8sV lag — a
    fast-delivered run no longer borrows time from a slow one. Returns the mutated
    list. Falls back to the legacy full-timeline spread only when VAD is unusable."""
    segs = [s for s in segments if (s.get("text") or "").strip()]
    if not segs:
        return segments
    total_chars = sum(_wlen(s) for s in segs)
    st = speech_total(runs)
    if not runs or st < 0.5:
        return _legacy_full_spread(segs, total_chars, duration)

    # Cumulative char target at the END of each run (proportional to run duration).
    targets, cum = [], 0.0
    for s, e in runs:
        cum += (e - s)
        targets.append(cum / st * total_chars)

    # Greedy assignment of segments -> runs. Advance to the next run only at a
    # PUNCTUATION boundary (a clause/sentence end) once we pass that run's char
    # target — so a sentence is never split across a pause mid-word (that is what
    # pushed "ainda." a word late in the first pass). A large overshoot force-
    # advances anyway, so a genuinely long sentence spoken across several breaths
    # still spreads over its runs. `slack` ~ one run's worth of the average pace.
    buckets = [[] for _ in runs]
    slack = total_chars / max(len(runs), 1)
    k, acc, prev_punct = 0, 0.0, True
    for s in segs:
        w = _wlen(s)
        while k < len(runs) - 1 and (
            (acc + w * 0.5 > targets[k] and prev_punct)
            or acc > targets[k] + slack
        ):
            k += 1
        buckets[k].append(s)
        acc += w
        prev_punct = (s.get("text") or "").strip().endswith(
            (".", "!", "?", "…", ",", ";", ":"))

    # Distribute each run's segments char-proportionally across the run's real span.
    for (rs, re_), group in zip(runs, buckets):
        if not group:
            continue
        gc = sum(_wlen(s) for s in group)
        span = re_ - rs
        t = rs
        for s in group:
            d = (_wlen(s) / gc) * span
            s["start"] = t
            s["end"] = max(t + 0.20, min(re_, t + d))
            t = s["end"]
    return segs
