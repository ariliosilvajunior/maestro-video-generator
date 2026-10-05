#!/usr/bin/env python3
"""
audio_content_map.py — upload a long source AUDIO to Gemini and get a CONTENT MAP:
a summary, a topic timeline, and ranked short-form segment suggestions (start/end +
hook + why). Lets us pre-stage a short-form edit from a long recording (e.g. a 20-min
camera clip) and pick the best ~30-60s segment to cut. fal.ai-free (Gemini only).

Usage:
  python3 audio_content_map.py <audio> --name <Name> [--output-dir /tmp/claude] [--lang pt]
Output: <output-dir>/<Name>_content_map.json
"""
import argparse, json, os, sys, time, urllib.error, urllib.request

# Shared repo helpers (lib/ at the repo root — parent of ingest-pipeline/).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.api_keys import resolve_gemini_key as resolve_key  # noqa: E402
from lib.paths import maestro_tmp  # noqa: E402

MODEL = os.environ.get("GEMINI_ANALYSIS_MODEL", "gemini-2.5-flash")
BASE = "https://generativelanguage.googleapis.com"


def log(m): print(f"[content_map] {m}", file=sys.stderr)


def upload(key, path, mime="audio/mp4"):
    size = os.path.getsize(path)
    req = urllib.request.Request(f"{BASE}/upload/v1beta/files?key={key}", method="POST",
        headers={"X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
                 "X-Goog-Upload-Header-Content-Length": str(size),
                 "X-Goog-Upload-Header-Content-Type": mime, "Content-Type": "application/json"},
        data=json.dumps({"file": {"display_name": os.path.basename(path)}}).encode())
    with urllib.request.urlopen(req, timeout=180) as r:
        url = r.headers.get("x-goog-upload-url")
    if not url: raise RuntimeError("no upload url")
    data = open(path, "rb").read()
    req2 = urllib.request.Request(url, method="POST",
        headers={"X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize",
                 "Content-Length": str(size)}, data=data)
    with urllib.request.urlopen(req2, timeout=600) as r:
        info = json.loads(r.read())
    return info["file"]["name"], info["file"]["uri"]


def wait_active(key, fn, tries=120):
    for _ in range(tries):
        req = urllib.request.Request(f"{BASE}/v1beta/{fn}?key={key}")
        with urllib.request.urlopen(req, timeout=30) as r:
            st = json.loads(r.read()).get("state")
        if st == "ACTIVE": return
        if st == "FAILED": raise RuntimeError("file FAILED")
        time.sleep(3)
    raise RuntimeError("file stuck PROCESSING")


PROMPT = """You are a short-form video editor analyzing the AUDIO of a long source recording (likely a talking-head / spoken video). Produce a CONTENT MAP to pick the best short-form (Reels/Shorts/TikTok, 20-60s) cut. Return ONLY JSON:
{
 "language": "",
 "summary": "3-5 sentences: what this recording is about",
 "speaker_style": "tone/energy/format",
 "topic_timeline": [{"t_start": 0.0, "t_end": 0.0, "topic": ""}],
 "best_segments": [
   {"rank": 1, "start": 0.0, "end": 0.0, "duration_s": 0.0, "hook": "the strong opening line/idea", "why_viral": "", "keywords": ["",""], "suggested_pt_br_headline": ""}
 ],
 "named_references": ["specific real things mentioned that could be screenshotted: products, companies, repos, sites, people, news"],
 "notes": "anything important for editing (dead air, mistakes, best energy moments)"
}
Give 3-6 ranked best_segments with REAL timestamps (seconds). Headlines/hooks in Brazilian Portuguese. Be concrete and timestamp-accurate."""


def analyze(key, uri, mime="audio/mp4"):
    body = {"contents": [{"parts": [{"fileData": {"mimeType": mime, "fileUri": uri}}, {"text": PROMPT}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 16384, "responseMimeType": "application/json"}}
    req = urllib.request.Request(f"{BASE}/v1beta/models/{MODEL}:generateContent?key={key}",
        method="POST", headers={"Content-Type": "application/json"}, data=json.dumps(body).encode())
    with urllib.request.urlopen(req, timeout=400) as r:
        res = json.loads(r.read())
    return json.loads(res["candidates"][0]["content"]["parts"][0]["text"])


def main():
    p = argparse.ArgumentParser()
    p.add_argument("audio"); p.add_argument("--name", required=True)
    p.add_argument("--output-dir", default=maestro_tmp()); p.add_argument("--api-key", default="")
    a = p.parse_args()
    audio = os.path.expanduser(a.audio)
    if not os.path.exists(audio): log(f"ERROR: not found {audio}"); return 1
    key = resolve_key(a.api_key)
    if not key: log("ERROR: no Gemini key"); return 1
    os.makedirs(a.output_dir, exist_ok=True)
    try:
        log(f"upload {os.path.getsize(audio)//1024} KB ...")
        fn, uri = upload(key, audio); wait_active(key, fn)
        log("analyzing (long audio — up to a few min)...")
        data = analyze(key, uri)
    except urllib.error.HTTPError as e:
        log(f"Gemini HTTP {e.code}: {e.read().decode()[:300]}"); return 1
    except Exception as e:
        log(f"ERROR: {e}"); return 1
    out = os.path.join(a.output_dir, f"{a.name}_content_map.json")
    json.dump(data, open(out, "w"), ensure_ascii=False, indent=2)
    log(f"→ {out}")
    print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
