#!/usr/bin/env python3
"""
suppress_windows.py — remove burned-subtitle Dialogue lines that fall inside given
time windows (house rule). Used so the KINETIC-CAPTION sections
(PremiumKineticCaption — big centered Proxima words on a solid palette background)
do NOT also show the small bottom subtitle: the big caption IS the subtitle there.

Usage:
  python3 suppress_windows.py in.ass out.ass --windows "13.8-18.7,42.7-45.2"
  # or from a JSON file of [[start,end], ...] seconds:
  python3 suppress_windows.py in.ass out.ass --windows-file <Name>_caption_windows.json

A Dialogue line is dropped only if it SUBSTANTIALLY overlaps a window — its midpoint
falls inside the window, OR >=50% of the line's duration is inside it (QCR-213).

WHY NOT a naive "any overlap" test (the old `start < win_end and end > win_start`):
ASS timestamps carry only CENTISECOND precision, so an SRT boundary like 14.056s is
floored to 14.05 when written to the .ass. The NEXT caption then *starts* at 14.05 —
6 ms "inside" a window that ends at 14.056 — and a zero-tolerance overlap test deletes
a subtitle that actually belongs to the following section. That is exactly what dropped
"Estúdio de imagem" on a real run: the line ran 14.05->15.19, the §3b
caption window was [10.827, 14.056], and the 6 ms rounding overlap silently removed the
caption, so from that word on the audio had no matching subtitle and read as out-of-sync.
Requiring a real (midpoint / >=50%) overlap makes boundary-touching lines immune to
centisecond rounding while still dropping the lines genuinely shown by the big caption.
"""
import argparse, json, re, sys

# Overlap below this many seconds is treated as a boundary-rounding artifact, never a
# real overlap (ASS centisecond = 0.01s; 0.08s ~= 2 frames @25fps, well above the rounding floor).
BOUNDARY_EPS = 0.08

# QCR-303: a burned row that is NOT substantially inside a caption
# window (midpoint outside AND <50% in-window, so it is KEPT rather than dropped) can still
# leak its TAIL into the window and render UNDER the big floating/kinetic caption. When that
# tail-leak exceeds this many seconds (matches build_qc_ground_truth's SUPP_EPS "real leak"
# threshold), TRIM the row's end back to the window start so nothing burns inside the window —
# without deleting a line that belongs to the previous section. Below this it is sub-perceptual
# boundary noise and left untouched. The CTA window on a real run kept "mão\Nde graça" ending at
# 52.87 leaking 0.19s into [52.676,56.846] -> QC saw a burned subtitle under the caption (99/100).
TAIL_LEAK_EPS = 0.15


def parse_ts(ts):
    # ASS time: H:MM:SS.cc
    m = re.match(r"(\d+):(\d{2}):(\d{2})\.(\d{2})", ts.strip())
    if not m:
        return None
    h, mm, ss, cc = (int(x) for x in m.groups())
    return h * 3600 + mm * 60 + ss + cc / 100.0


def main():
    p = argparse.ArgumentParser()
    p.add_argument("inp"); p.add_argument("out")
    p.add_argument("--windows", help="comma list 'a-b,c-d' seconds")
    p.add_argument("--windows-file", help="JSON [[a,b],...] seconds")
    p.add_argument("--segments-file",
                   help="caption_segments.json [{win:[s,e],text,kind},...] — single source "
                        "of truth shared with verify_caption_sync.py (QCR-229); windows are "
                        "read from each entry's 'win' so suppression can't drift from the gate")
    a = p.parse_args()
    wins = []
    if a.segments_file:
        for x in json.load(open(a.segments_file)):
            w = x.get("win") or [x.get("start"), x.get("end")]
            wins.append((float(w[0]), float(w[1])))
    if a.windows_file:
        # QCR-119: accept BOTH [[a,b],...] pairs AND [{start/from, end/to},...] objects.
        # The motion/section pipeline writes caption windows as {start,end} dicts; a naive
        # x[0]/x[1] index then KeyErrors (hit on a real run). Normalize here.
        def _pair(x):
            if isinstance(x, dict):
                lo = x.get("start", x.get("from", x.get("t0")))
                hi = x.get("end", x.get("to", x.get("t1")))
                return (float(lo), float(hi))
            return (float(x[0]), float(x[1]))
        wins = [_pair(x) for x in json.load(open(a.windows_file))]
    if a.windows:
        for seg in a.windows.split(","):
            lo, hi = seg.split("-"); wins.append((float(lo), float(hi)))
    if not wins:
        print("no windows given", file=sys.stderr); return 1

    def classify(s, e):
        # Returns ("drop", None) on a SUBSTANTIAL overlap; ("trim", (new_s, new_e)) when the row
        # is kept but a TAIL or HEAD leaks into a window past TAIL_LEAK_EPS (QCR-303 tail / QCR-323
        # head); else ("keep", None). Centisecond-rounded boundary touches survive (QCR-213).
        dur = max(e - s, 1e-6)
        mid = 0.5 * (s + e)
        trim_e = None   # trim END back to a window start (tail leak, QCR-303)
        trim_s = None   # trim START forward to a window end (head leak, QCR-323)
        for (wl, wh) in wins:
            ov = min(e, wh) - max(s, wl)          # seconds of overlap with this window
            if ov <= BOUNDARY_EPS:
                continue                          # touch-only / rounding noise -> keep the line
            if (wl <= mid <= wh) or (ov / dur >= 0.5):
                return ("drop", None)
            # kept row, but does its TAIL leak into (this window starts after the row's mid)?
            if e > wl >= s and (e - wl) > TAIL_LEAK_EPS:
                # trim end back to the window start (take the EARLIEST such window)
                trim_e = wl if trim_e is None else min(trim_e, wl)
            # QCR-323: the MIRROR of the tail leak — the row's HEAD/START
            # falls INSIDE a window whose END lands before the row's mid (row starts under the
            # caption, then continues past it). e.g. "num único pacote." 34.34->35.07 with §3b
            # window [32.81,34.67]: mid 34.705 is just outside the window so it is NOT dropped,
            # but 34.34-34.67 (0.33s) burns under the caption. Trim the START forward to the
            # window end (take the LATEST such window's end).
            if s < wh <= e and (wh - s) > TAIL_LEAK_EPS:
                trim_s = wh if trim_s is None else max(trim_s, wh)
        if trim_s is not None or trim_e is not None:
            new_s = trim_s if trim_s is not None else s
            new_e = trim_e if trim_e is not None else e
            # guard: never invert or zero-out the row (a row fully inside would have been dropped)
            if new_e - new_s > 0.05:
                return ("trim", (new_s, new_e))
        return ("keep", None)

    def fmt_ts(t):
        h = int(t // 3600); t -= h * 3600
        mm = int(t // 60); t -= mm * 60
        ss = int(t); cc = int(round((t - ss) * 100))
        if cc == 100:
            cc = 0; ss += 1
        return f"{h}:{mm:02d}:{ss:02d}.{cc:02d}"

    kept, dropped, trimmed = [], 0, 0
    for ln in open(a.inp, encoding="utf-8"):
        if ln.startswith("Dialogue:"):
            f = ln.split(",", 9)
            s, e = parse_ts(f[1]), parse_ts(f[2])
            if s is not None and e is not None:
                action, val = classify(s, e)
                if action == "drop":
                    dropped += 1
                    continue
                if action == "trim":
                    new_s, new_e = val
                    f[1] = fmt_ts(new_s)
                    f[2] = fmt_ts(new_e)
                    ln = ",".join(f)
                    trimmed += 1
        kept.append(ln)
    open(a.out, "w", encoding="utf-8").writelines(kept)
    print(f"[suppress_windows] dropped {dropped} dialogue line(s), trimmed {trimmed} tail-leak(s) "
          f"in {len(wins)} window(s) -> {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
