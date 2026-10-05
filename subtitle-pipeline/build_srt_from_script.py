#!/usr/bin/env python3
"""build_srt_from_script.py — QCR-109 reusable tool.

When the avatar speaks a KNOWN verbatim script (HeyGen reads the exact Phase-2
script), and `transcribe_gemini_srt.py` returns DEGENERATE timestamps (its guard
prints "degenerate timestamps (span … << … audio) -> redistributed proportionally"),
Gemini ALSO sometimes returns the segments OUT OF ORDER — the proportional
redistribution then preserves that wrong order, producing an SRT whose caption
order does not match the spoken narration (e.g. a clause appearing before the
clause it actually follows).

Because the script text is GROUND TRUTH and the avatar speaks it in order, the
reliable SRT is built directly from the script: split into <=8-word phrase chunks
at sentence/comma boundaries, then distribute proportionally by character length
across the measured audio duration. This guarantees correct ORDER + exact TEXT;
timing is the same proportional approximation the transcribe guard already uses,
but anchored to the true order.

Usage:
  python3 build_srt_from_script.py <script.txt> <audio_or_video> --output <out.srt>
  # duration auto-read via ffprobe; or pass --duration <seconds> to skip ffprobe.
"""
import re, sys, argparse, subprocess, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import vad_align  # QCR-232: anchor chunks to real speech runs when media given
except Exception:  # noqa
    vad_align = None

def ffprobe_duration(path):
    out = subprocess.run(
        ["ffprobe","-v","error","-show_entries","format=duration","-of",
         "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True).stdout.strip()
    return float(out)

def fmt(s):
    h=int(s//3600); m=int((s%3600)//60); sec=s%60
    return f"{h:02d}:{m:02d}:{sec:06.3f}".replace('.',',')

def build(script, dur, max_words=8, media=None):
    chunks=[]
    for sent in re.split(r'(?<=[\.\?\!])\s+', script.strip()):
        sent=sent.strip()
        if not sent: continue
        for piece in re.split(r'(?<=,)\s+', sent):
            words=piece.split(); i=0
            while i < len(words):
                chunks.append(' '.join(words[i:i+max_words])); i+=max_words
    # QCR-232: if we have the audio, distribute chunks across the REAL speech runs
    # (pauses respected, per-run pace) instead of a blind full-duration char spread.
    runs=[]
    if vad_align is not None and media and os.path.exists(media):
        try:
            runs=vad_align.speech_runs(media)
        except Exception:  # noqa
            runs=[]
    if runs:
        segs=[{"text":c} for c in chunks]
        vad_align.redistribute_over_speech(segs, runs, dur)
        out=[f"{i+1}\n{fmt(s['start'])} --> {fmt(s['end'])}\n{s['text']}\n"
             for i,s in enumerate(segs)]
        return "\n".join(out)+"\n", len(segs)
    total=sum(len(c) for c in chunks) or 1
    out=[]; t=0.0
    for i,c in enumerate(chunks):
        d=len(c)/total*dur; start=t; end=min(t+d,dur)
        out.append(f"{i+1}\n{fmt(start)} --> {fmt(end)}\n{c}\n"); t=end
    return "\n".join(out)+"\n", len(chunks)

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("script"); ap.add_argument("media", nargs="?")
    ap.add_argument("--output", required=True); ap.add_argument("--duration", type=float)
    a=ap.parse_args()
    dur=a.duration if a.duration else ffprobe_duration(a.media)
    txt=open(a.script, encoding="utf-8").read()
    srt,n=build(txt,dur,media=a.media)
    os.makedirs(os.path.dirname(os.path.abspath(a.output)) or ".", exist_ok=True)
    open(a.output,"w",encoding="utf-8").write(srt)
    print(f"[build_srt_from_script] {n} chunks over {dur:.2f}s -> {a.output}")
