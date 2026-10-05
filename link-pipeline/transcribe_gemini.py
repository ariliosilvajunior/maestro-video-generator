#!/usr/bin/env python3
"""
Gemini Transcription — universal source-video transcriber for the
generate-video-from-link skill.

Why this exists: the standard pipeline transcriber (subtitle-pipeline/
transcribe_falai.py) uses fal.ai, whose balance can be exhausted. Gemini
(the same paid key used by the QC gate) transcribes audio/video directly and
works uniformly for YouTube AND Instagram sources, with automatic language
detection. This is the PRIMARY transcriber for the link skill.

Pipeline:
  1. Extract audio from the source video with ffmpeg (m4a, mono, 16k).
  2. Resumable-upload the audio to the Gemini Files API.
  3. Poll until ACTIVE.
  4. Ask gemini-2.5-flash for a verbatim transcript + detected language.
  5. Write <name>.txt (plain transcript) and <name>.json (transcript + language).

Usage:
  python3 transcribe_gemini.py <video> --output-dir /tmp/claude --name SourceName \
      [--api-key GEMINI_KEY]

API key resolution order: --api-key, GEMINI_API_KEY env, .claude/keys.md (Gemini section).
Exit codes: 0 = transcript written, 1 = failure.
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

# Shared repo helpers (lib/ at the repo root — parent of link-pipeline/).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.api_keys import resolve_gemini_key as resolve_key  # noqa: E402
from lib.ffmpeg import find_ffmpeg as _find_ffmpeg  # noqa: E402
from lib.paths import maestro_tmp  # noqa: E402

MODEL = "gemini-2.5-flash"
BASE = "https://generativelanguage.googleapis.com"


def log(msg):
    print(f"[transcribe_gemini] {msg}", file=sys.stderr)


def extract_audio(video, workdir):
    out = os.path.join(workdir, "source_audio.m4a")
    ffmpeg = _find_ffmpeg()
    cmd = [ffmpeg, "-y", "-i", video, "-vn", "-ac", "1", "-ar", "16000",
           "-c:a", "aac", "-b:a", "64k", out]
    subprocess.run(cmd, check=True, capture_output=True)
    return out


def upload(key, audio_path):
    size = os.path.getsize(audio_path)
    # Start resumable upload
    req = urllib.request.Request(
        f"{BASE}/upload/v1beta/files?key={key}",
        method="POST",
        headers={
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": str(size),
            "X-Goog-Upload-Header-Content-Type": "audio/mp4",
            "Content-Type": "application/json",
        },
        data=json.dumps({"file": {"display_name": "source_audio"}}).encode(),
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        upload_url = resp.headers.get("x-goog-upload-url")
    if not upload_url:
        raise RuntimeError("No resumable upload URL returned by Gemini")
    # Upload bytes
    with open(audio_path, "rb") as f:
        data = f.read()
    req2 = urllib.request.Request(
        upload_url, method="POST",
        headers={
            "X-Goog-Upload-Offset": "0",
            "X-Goog-Upload-Command": "upload, finalize",
            "Content-Length": str(size),
        },
        data=data,
    )
    with urllib.request.urlopen(req2, timeout=180) as resp:
        info = json.loads(resp.read())
    return info["file"]["name"], info["file"]["uri"]


def wait_active(key, file_name):
    for _ in range(60):
        req = urllib.request.Request(f"{BASE}/v1beta/{file_name}?key={key}")
        with urllib.request.urlopen(req, timeout=30) as resp:
            state = json.loads(resp.read()).get("state")
        if state == "ACTIVE":
            return
        if state == "FAILED":
            raise RuntimeError("Gemini file processing FAILED")
        time.sleep(2)
    raise RuntimeError("Gemini file stuck in PROCESSING")


PROMPT = (
    "You are a verbatim transcription engine. Transcribe the spoken audio EXACTLY "
    "as said, word for word, in the original language. Do not translate, summarize, "
    "or add commentary. Return ONLY a JSON object with two keys: "
    "\"language\" (ISO name of the detected spoken language, e.g. \"Portuguese\", "
    "\"English\") and \"transcript\" (the full verbatim transcript as a single string "
    "with natural sentence punctuation). No markdown, no code fences."
)


def transcribe(key, file_uri):
    body = {
        "contents": [{
            "parts": [
                {"fileData": {"mimeType": "audio/mp4", "fileUri": file_uri}},
                {"text": PROMPT},
            ]
        }],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8192,
                             "responseMimeType": "application/json"},
    }
    req = urllib.request.Request(
        f"{BASE}/v1beta/models/{MODEL}:generateContent?key={key}",
        method="POST",
        headers={"Content-Type": "application/json"},
        data=json.dumps(body).encode(),
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        result = json.loads(resp.read())
    text = result["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(text)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("--output-dir", default=maestro_tmp())
    p.add_argument("--name", default="source")
    p.add_argument("--api-key", default=None)
    args = p.parse_args()

    key = resolve_key(args.api_key)
    if not key:
        log("ERROR: no Gemini API key (tried --api-key, GEMINI_API_KEY, .claude/keys.md)")
        sys.exit(1)

    os.makedirs(args.output_dir, exist_ok=True)
    try:
        log("[1/4] Extracting audio...")
        audio = extract_audio(args.video, args.output_dir)
        log(f"[2/4] Uploading audio ({os.path.getsize(audio)//1024} KB)...")
        file_name, file_uri = upload(key, audio)
        wait_active(key, file_name)
        log("[3/4] Transcribing with Gemini...")
        data = transcribe(key, file_uri)
    except urllib.error.HTTPError as e:
        log(f"ERROR: Gemini HTTP {e.code}: {e.read().decode()[:300]}")
        sys.exit(1)
    except Exception as e:  # noqa
        log(f"ERROR: {e}")
        sys.exit(1)

    transcript = (data.get("transcript") or "").strip()
    language = (data.get("language") or "unknown").strip()
    if not transcript:
        log("ERROR: empty transcript returned")
        sys.exit(1)

    txt_path = os.path.join(args.output_dir, f"{args.name}.txt")
    json_path = os.path.join(args.output_dir, f"{args.name}.json")
    with open(txt_path, "w") as f:
        f.write(transcript + "\n")
    with open(json_path, "w") as f:
        json.dump({"language": language, "transcript": transcript}, f,
                  ensure_ascii=False, indent=2)
    log(f"[4/4] Done. lang={language}, {len(transcript)} chars")
    print(txt_path)


if __name__ == "__main__":
    main()
