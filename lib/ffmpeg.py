"""ffmpeg / ffprobe discovery (cross-platform) + duration probe.

The subtitle phase needs an ffmpeg build with **libass** (the `ass` filter). Many default
builds ship it (Windows gyan.dev builds, most Linux distro packages, Homebrew `ffmpeg`);
if yours does not, install a full build and point `MAESTRO_FFMPEG` (or config `paths.ffmpeg`)
at it. `python3 bin/doctor.py` tells you whether the selected binary has the filter.

Search order (first EXISTING binary wins; a build WITH the `ass` filter is preferred when
several exist):
  1. $MAESTRO_FFMPEG                       (explicit override)
  2. config.json  paths.ffmpeg
  3. `ffmpeg` on PATH
  4. well-known full-build locations (Homebrew ffmpeg-full, /usr/local, /opt/homebrew)

CLI:  python3 lib/ffmpeg.py            -> prints the chosen ffmpeg path
      python3 lib/ffmpeg.py --probe    -> path + whether the `ass` filter is available
"""
import functools
import os
import shutil
import subprocess
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO_ROOT)

_KNOWN = [
    "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg",
    "/usr/local/opt/ffmpeg-full/bin/ffmpeg",
    "/opt/homebrew/opt/ffmpeg/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
]


def _candidates():
    out = []
    env = os.environ.get("MAESTRO_FFMPEG")
    if env:
        out.append(env)
    try:
        from lib import config
        c = config.get("paths.ffmpeg")
        if c:
            out.append(os.path.expanduser(c))
    except Exception:
        pass
    w = shutil.which("ffmpeg")
    if w:
        out.append(w)
    out.extend(_KNOWN)
    seen, uniq = set(), []
    for c in out:
        c = os.path.expanduser(c)
        if c and c not in seen and os.path.isfile(c):
            seen.add(c)
            uniq.append(c)
    return uniq


@functools.lru_cache(maxsize=None)
def has_ass_filter(ffmpeg_path):
    try:
        r = subprocess.run([ffmpeg_path, "-hide_banner", "-filters"], capture_output=True, text=True, timeout=20)
        return any(ln.split()[1:2] == ["ass"] for ln in r.stdout.splitlines() if ln.strip())
    except Exception:
        return False


@functools.lru_cache(maxsize=None)
def find_ffmpeg():
    cands = _candidates()
    if not cands:
        raise RuntimeError("ffmpeg not found — install it (see docs/SETUP.md) or set MAESTRO_FFMPEG")
    for c in cands:
        if has_ass_filter(c):
            return c
    return cands[0]


def find_ffprobe():
    ff = find_ffmpeg()
    sibling = os.path.join(os.path.dirname(ff), "ffprobe" + (".exe" if ff.lower().endswith(".exe") else ""))
    if os.path.isfile(sibling):
        return sibling
    w = shutil.which("ffprobe")
    if w:
        return w
    raise RuntimeError("ffprobe not found next to ffmpeg nor on PATH")


def get_duration(path: str) -> float:
    """Media duration in seconds via ffprobe (container duration)."""
    result = subprocess.run(
        [find_ffprobe(), "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True,
    )
    return float(result.stdout.strip())


if __name__ == "__main__":
    ff = find_ffmpeg()
    if "--probe" in sys.argv:
        print(f"{ff}  ass_filter={'yes' if has_ass_filter(ff) else 'NO'}  ffprobe={find_ffprobe()}")
    else:
        print(ff)
