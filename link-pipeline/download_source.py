#!/usr/bin/env python3
"""
Source downloader for the generate-video-from-link skill.

Downloads a video from a YouTube (incl. Shorts) or Instagram (Reel/Post) URL
using yt-dlp. Validated: both platforms download with NO cookies or
special keys. Falls back across format selectors for robustness.

Usage:
  python3 download_source.py "<url>" --output-dir /tmp/claude --name SourceName

Output: <output-dir>/<name>_source.mp4  (path printed to stdout on success)
Exit codes: 0 = downloaded, 1 = failure.
"""

import argparse
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.ffmpeg import find_ffmpeg as _find_ffmpeg  # noqa: E402
from lib.paths import maestro_tmp  # noqa: E402


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def _ig_cookie_file():
    # QCR-217: Instagram now returns an EMPTY media response to
    # logged-out yt-dlp ("use --cookies-from-browser or --cookies"), so a bare-link IG
    # download fails. Convert the saved Playwright IG storage-state cookies into a Netscape
    # cookie file so yt-dlp can authenticate (no browser needed). Returns the path or None.
    import json, time
    src = os.path.join(os.path.dirname(__file__), "..", ".claude", "auth",
                       "instagram-storage-state.json")
    if not os.path.exists(src):
        return None
    out = os.path.join(maestro_tmp(), "ig_cookies.txt")
    try:
        cookies = json.load(open(src)).get("cookies", [])
        n = 0
        with open(out, "w") as f:
            f.write("# Netscape HTTP Cookie File\n")
            for c in cookies:
                dom = c.get("domain", "")
                if "instagram" not in dom:
                    continue
                flag = "TRUE" if dom.startswith(".") else "FALSE"
                # QCR-233: session cookies arrive as expires -1/None. int(-1 or 0) == -1
                # (−1 is truthy), so the old expression wrote a literal -1 → yt-dlp SKIPS the
                # entry ("invalid expires at -1"), dropping session cookies like `rur`. Treat
                # any non-positive expiry as "session" → stamp a 30-day future timestamp so the
                # FULL cookie set (incl. rur) reaches yt-dlp.
                raw_exp = int(c.get("expires", 0) or 0)
                exp = raw_exp if raw_exp > 0 else int(time.time()) + 30 * 86400
                f.write("\t".join([dom, flag, c.get("path", "/"),
                                   "TRUE" if c.get("secure") else "FALSE",
                                   str(exp), c.get("name", ""), c.get("value", "")]) + "\n")
                n += 1
        return out if n else None
    except Exception:
        return None


def download(url, out_template):
    # Try a sequence of format selectors, most-compatible first.
    attempts = [
        ["-t", "mp4"],                         # yt-dlp smart mp4 preset
        ["-f", "bv*+ba/b"],                     # best video+audio merged
        ["-f", "best"],                         # single best stream
    ]
    # Instagram needs auth (empty media response when logged out) — attach saved cookies.
    cookie_args = []
    if "instagram.com" in url.lower():
        cf = _ig_cookie_file()
        if cf:
            cookie_args = ["--cookies", cf]
    for extra in attempts:
        cmd = ["yt-dlp", "--no-progress", "--no-playlist", *cookie_args,
               "-o", out_template, *extra, url]
        res = run(cmd)
        # Determine produced file
        produced = out_template.replace("%(ext)s", "mp4")
        if res.returncode == 0 and os.path.exists(produced) and os.path.getsize(produced) > 0:
            return produced
        # yt-dlp may emit other extensions; search dir
        base = os.path.dirname(out_template)
        stem = os.path.basename(out_template).replace(".%(ext)s", "")
        for fn in os.listdir(base):
            if fn.startswith(stem) and os.path.getsize(os.path.join(base, fn)) > 0:
                full = os.path.join(base, fn)
                if not full.endswith(".mp4"):
                    mp4 = os.path.join(base, stem + ".mp4")
                    run([_find_ffmpeg(), "-y",
                         "-i", full, "-c", "copy", mp4])
                    if os.path.exists(mp4) and os.path.getsize(mp4) > 0:
                        return mp4
                return full
        print(f"[download_source] attempt {extra} failed: "
              f"{res.stderr.strip()[-200:]}", file=sys.stderr)
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("url")
    p.add_argument("--output-dir", default=maestro_tmp())
    p.add_argument("--name", default="link")
    args = p.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    out_template = os.path.join(args.output_dir, f"{args.name}_source.%(ext)s")
    result = download(args.url, out_template)
    if not result:
        print("[download_source] ERROR: all download attempts failed", file=sys.stderr)
        sys.exit(1)
    print(result)


if __name__ == "__main__":
    main()
