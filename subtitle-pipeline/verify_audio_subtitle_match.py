#!/usr/bin/env python3
"""
Audio<->Subtitle consistency gate  (QCR-180)

WHY THIS EXISTS
---------------
The reel posted from run "Sora" shipped with SORA subtitles + SORA motion graphics
burned over AGENTIC-AI narration audio. Root cause: the HeyGen avatar is downloaded to
a SHARED fixed path (~/Downloads/Quick-Avatar-Video-1080p.mp4) and copied into the
Remotion project from there. A stale / wrong-run avatar at that path (QCR-114) gets
embedded, while the SRT + subtitles + motion all belong to the correct run -> the
*audio* ends up from a different script than everything on screen.

The only prior guard (HEYGEN_INSTRUCTIONS "VERIFY before padding") is a MANUAL grep that
runs at Phase 3 only and is trivially skipped. Nothing re-checked the audio that actually
ended up *embedded in the finished video*. This script is that missing automatic gate.

WHAT IT DOES
------------
1. Transcribes the ACTUAL audio of the given video via Gemini (the same transcriber the
   pipeline already uses — no new dependency).
2. Reads the subtitle/script text we believe the video should say (.ass / .srt / .txt).
3. Normalizes both (lowercase, strip accents/punctuation, drop PT+EN stopwords) and
   measures how much of the subtitle's CONTENT vocabulary actually appears in the spoken
   audio (containment) plus a Jaccard score.
4. PASS (exit 0) if containment >= threshold; FAIL (exit 1) otherwise, printing both
   samples so the mismatch is obvious.

For a correct run the subtitles are derived from a transcription of the same audio, so
containment is ~0.85-1.0. A cross-run swap (Sora subs vs agentic audio) scores ~0.05-0.15.
The default threshold (0.40) sits in the wide gap between the two.

USAGE
-----
  python3 verify_audio_subtitle_match.py <video.mp4> --subs <file.ass|.srt|.txt> \
      [--threshold 0.40] [--name Tag] [--api-key KEY]

Exit codes: 0 = audio matches subtitles (PASS), 1 = MISMATCH or error (FAIL).
"""

import argparse
import os
import re
import sys
import tempfile
import unicodedata

# Reuse the single, already-validated Gemini transcription implementation.
_HERE = os.path.dirname(os.path.abspath(__file__))
_LINK = os.path.join(os.path.dirname(_HERE), "link-pipeline")
sys.path.insert(0, _LINK)
try:
    from transcribe_gemini import (  # noqa: E402
        resolve_key, extract_audio, upload, wait_active, transcribe,
    )
except Exception as e:  # noqa
    print(f"[verify_match] ERROR importing transcribe_gemini: {e}", file=sys.stderr)
    sys.exit(1)


def log(msg):
    print(f"[verify_match] {msg}", file=sys.stderr)


# Function words that two unrelated PT-BR (or EN) scripts share anyway — remove them so
# the score reflects MEANING overlap, not grammar.
STOPWORDS = set("""
a o e de da do das dos que em um uma uns umas no na nos nas para por com sem se sua seu
suas seus ao aos as os à às é era foi ser ter tem tinha mais mas ja já como ou isso isto
esse essa este esta eles elas ele ela voce você vc nao não sim muito muita pouco entao
então tudo todo toda nada quando onde porque pois sobre entre depois antes ate até cada
the a an and or of to in on for with without is are was were be been being it this that
these those you your we our they them he she his her at as by from into about
""".split())


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s)
                    if not unicodedata.combining(c))


def normalize_tokens(text):
    text = strip_accents(text.lower())
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    toks = [t for t in text.split() if len(t) > 1 and t not in STOPWORDS]
    return toks


def read_subtitle_text(path):
    """Extract spoken text from .ass, .srt, or plain .txt."""
    with open(path, encoding="utf-8", errors="replace") as f:
        raw = f.read()
    ext = os.path.splitext(path)[1].lower()
    if ext == ".ass":
        lines = []
        for ln in raw.splitlines():
            if ln.startswith("Dialogue:"):
                # text is everything after the 9th comma
                parts = ln.split(",", 9)
                if len(parts) == 10:
                    txt = parts[9]
                    txt = re.sub(r"\{[^}]*\}", "", txt)   # drop {\override} tags
                    txt = txt.replace("\\N", " ").replace("\\n", " ")
                    lines.append(txt)
        return " ".join(lines)
    if ext == ".srt":
        out = []
        for ln in raw.splitlines():
            if not ln.strip():
                continue
            if re.match(r"^\d+$", ln.strip()):
                continue
            if "-->" in ln:
                continue
            out.append(ln)
        return " ".join(out)
    return raw  # .txt / script


def score(audio_tokens, sub_tokens):
    a, s = set(audio_tokens), set(sub_tokens)
    if not s:
        return 0.0, 0.0
    inter = len(a & s)
    containment = inter / len(s)          # fraction of subtitle vocab heard in audio
    union = len(a | s) or 1
    jaccard = inter / union
    return containment, jaccard


def main():
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("--subs", required=True,
                   help="subtitle/script file (.ass, .srt, or .txt) the video should match")
    p.add_argument("--threshold", type=float, default=0.40,
                   help="min subtitle->audio containment to PASS (default 0.40)")
    p.add_argument("--name", default="match")
    p.add_argument("--api-key", default=None)
    args = p.parse_args()

    if not os.path.exists(args.video):
        log(f"ERROR: video not found: {args.video}")
        sys.exit(1)
    if not os.path.exists(args.subs):
        log(f"ERROR: subs file not found: {args.subs}")
        sys.exit(1)

    key = resolve_key(args.api_key)
    if not key:
        log("ERROR: no Gemini API key (tried --api-key, GEMINI_API_KEY, .claude/keys.md)")
        sys.exit(1)

    sub_text = read_subtitle_text(args.subs)
    sub_tokens = normalize_tokens(sub_text)
    if not sub_tokens:
        log("ERROR: no usable text extracted from --subs file")
        sys.exit(1)

    workdir = tempfile.mkdtemp(prefix="verify_match_")
    try:
        log("transcribing the video's ACTUAL embedded audio via Gemini...")
        audio = extract_audio(args.video, workdir)
        file_name, file_uri = upload(key, audio)
        wait_active(key, file_name)
        data = transcribe(key, file_uri)
    except Exception as e:  # noqa
        log(f"ERROR transcribing audio: {e}")
        sys.exit(1)

    audio_text = (data.get("transcript") or "").strip()
    audio_tokens = normalize_tokens(audio_text)
    if not audio_tokens:
        log("ERROR: empty audio transcript")
        sys.exit(1)

    containment, jaccard = score(audio_tokens, sub_tokens)
    log(f"containment={containment:.2f} jaccard={jaccard:.2f} threshold={args.threshold:.2f}")
    log(f"AUDIO  says : {' '.join(audio_text.split())[:220]}")
    log(f"SUBS   say  : {' '.join(sub_text.split())[:220]}")

    if containment >= args.threshold:
        print(f"PASS audio<->subtitle match containment={containment:.2f}")
        sys.exit(0)

    print(f"FAIL AUDIO/SUBTITLE MISMATCH containment={containment:.2f} < {args.threshold:.2f}")
    print("  The spoken audio does NOT match the burned/intended subtitles.")
    print("  Almost always a wrong/stale avatar embedded (QCR-114/QCR-180):")
    print("  re-resolve THIS run's avatar (~/Downloads/<Name>_avatar_1080p.mp4),")
    print("  re-transcribe it, rebuild subtitles, and re-render. Do NOT post.")
    sys.exit(1)


if __name__ == "__main__":
    main()
