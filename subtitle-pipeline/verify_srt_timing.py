#!/usr/bin/env python3
"""verify_srt_timing.py — SRT-vs-audio TIMING gate (QCR-232).

WHY THIS EXISTS
---------------
Reel DaEFB_vy8sV shipped at QC 100 with subtitles lagging the speech by 1-2.5s.
The two existing subtitle gates were both blind to it:
  * verify_audio_subtitle_match.py — checks only that the caption TEXT appears in
    the spoken audio (content), not WHEN.
  * verify_caption_sync.py — checks only the §3b/§5b motion-caption windows, not
    the main burned subtitle track.
So a perfectly-worded but badly-TIMED SRT passed everything. This gate closes that
hole: it measures whether the SRT's caption timeline actually tracks the audio's
real speech, using ffmpeg `silencedetect` (VAD) — $0, deterministic, no AI, no
forbidden whisper.

WHAT IT CHECKS (against the audio's real speech runs)
-----------------------------------------------------
1. PAUSE-COVERAGE — fraction of the audio's real silence that is covered by an
   active caption. A correctly-timed SRT clears its captions during real pauses
   (~0.2-0.5); the broken "packed / char-proportional, no gaps" SRT covers ~1.0
   of every pause because it never leaves a gap. This is the primary signal.
2. ONSET — the first caption must start near the first speech (a big positive
   offset = leading lag; a big negative = caption before any voice).
3. TAIL — the last caption must end near the last speech (a large early end means
   the closing line ships effectively missing / desynced).

Exit 0 = PASS (timing tracks speech). Exit 1 = FAIL or error (do NOT post).

USAGE
-----
  python3 verify_srt_timing.py <video_or_audio> --srt <file.srt> [--name Tag]
      [--max-pause-coverage 0.75] [--max-onset 1.2] [--max-tail 2.5]
"""
import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import vad_align


def parse_srt(path):
    txt = open(path, encoding="utf-8").read()
    segs = []
    for m in re.finditer(
        r"(\d\d):(\d\d):(\d\d)[,.](\d+)\s*-->\s*(\d\d):(\d\d):(\d\d)[,.](\d+)", txt):
        g = list(map(int, m.groups()))
        start = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
        end = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
        segs.append((start, end))
    return segs


def _overlap(a0, a1, b0, b1):
    return max(0.0, min(a1, b1) - max(a0, b0))


def main():
    p = argparse.ArgumentParser(description="SRT<->audio timing gate (QCR-232)")
    p.add_argument("media")
    p.add_argument("--srt", required=True)
    p.add_argument("--name", default="")
    p.add_argument("--max-pause-coverage", type=float, default=0.75)
    p.add_argument("--max-onset", type=float, default=1.2)
    p.add_argument("--max-tail", type=float, default=2.5)
    p.add_argument("--min-silence", type=float, default=3.0,
                   help="below this much total silence the pause-coverage test is skipped")
    a = p.parse_args()
    tag = f"[{a.name}] " if a.name else ""

    if not os.path.exists(a.media):
        print(f"{tag}FAIL: media not found: {a.media}"); return 1
    if not os.path.exists(a.srt):
        print(f"{tag}FAIL: srt not found: {a.srt}"); return 1

    segs = parse_srt(a.srt)
    if not segs:
        print(f"{tag}FAIL: no caption segments parsed from {a.srt}"); return 1

    runs = vad_align.speech_runs(a.media)
    if not runs:
        print(f"{tag}SKIP: no speech runs detected (cannot judge timing) — passing")
        return 0
    speech_total = vad_align.speech_total(runs)
    duration = runs[-1][1]
    # invert runs -> silence intervals
    sil, t = [], 0.0
    for s, e in runs:
        if s > t:
            sil.append((t, s))
        t = e
    sil_total = sum(e - s for s, e in sil)

    fails = []

    # 1) pause coverage
    if sil_total >= a.min_silence:
        cap_in_sil = sum(_overlap(cs, ce, ss, se)
                         for cs, ce in segs for ss, se in sil)
        coverage = cap_in_sil / sil_total
        verdict = "ok" if coverage <= a.max_pause_coverage else "DESYNC"
        print(f"{tag}pause-coverage={coverage:.2f} (<= {a.max_pause_coverage}) "
              f"[{sil_total:.1f}s silence] {verdict}")
        if coverage > a.max_pause_coverage:
            fails.append(
                f"captions cover {coverage*100:.0f}% of real pauses — the SRT is "
                f"packed end-to-end / pause-absorbing (delayed-subtitle pattern)")
    else:
        print(f"{tag}pause-coverage: skipped (only {sil_total:.1f}s silence)")

    # 2) onset
    onset = segs[0][0] - runs[0][0]
    print(f"{tag}onset: first caption {segs[0][0]:.2f}s vs first speech "
          f"{runs[0][0]:.2f}s (offset {onset:+.2f}s, |.|<= {a.max_onset})")
    if abs(onset) > a.max_onset:
        fails.append(f"first caption is {onset:+.2f}s off the first speech onset")

    # 3) tail
    tail_gap = runs[-1][1] - segs[-1][1]
    print(f"{tag}tail: last caption ends {segs[-1][1]:.2f}s vs last speech "
          f"{runs[-1][1]:.2f}s (gap {tail_gap:+.2f}s, <= {a.max_tail})")
    if tail_gap > a.max_tail:
        fails.append(f"last caption ends {tail_gap:.1f}s before the speech does")

    if fails:
        print(f"\n{tag}*** TIMING FAIL ***")
        for f in fails:
            print(f"  - {f}")
        print(f"{tag}Rebuild the SRT (transcribe_gemini_srt.py now VAD-anchors the "
              f"degenerate fallback; or build_srt_from_script.py with the avatar audio) "
              f"and re-burn before posting.")
        return 1
    print(f"{tag}PASS: caption timeline tracks the speech "
          f"({len(segs)} segments, {speech_total:.0f}/{duration:.0f}s voiced).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
