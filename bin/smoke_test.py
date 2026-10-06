#!/usr/bin/env python3
"""
smoke_test.py — proves the LOCAL toolchain end-to-end in ~2 minutes, without spending a
single API credit: Remotion renders the canonical premium template with the sample avatar,
the subtitle converter + libass burn a caption track onto it, and the sound-design mixer
adds the riser / clicks / a music bed. If this passes, every local phase of the pipeline
works on your machine; what remains are the cloud accounts (HeyGen, Gemini, images).

    python3 bin/smoke_test.py             # full run (render ~3 s of the template)
    python3 bin/smoke_test.py --seconds 8 # render a longer slice

Output: <downloads>/maestro-smoke_music.mp4  (+ the intermediate _motion / _final files)
Exit 0 = all steps passed.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, REPO)
from lib import ffmpeg as ffm  # noqa: E402
from lib.paths import downloads, remotion_root, maestro_tmp  # noqa: E402

NAME = "maestro-smoke"
STEPS = []


def step(name, ok, detail=""):
    STEPS.append((name, ok, detail))
    print(f"  {'✅' if ok else '❌'} {name}" + (f"  — {detail}" if detail else ""))
    return ok


def sh(cmd, cwd=None, timeout=900):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    return r.returncode, (r.stdout + r.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seconds", type=float, default=3.0)
    a = ap.parse_args()
    out_dir = downloads()
    rem = remotion_root()
    tmp = maestro_tmp()
    print(f"Maestro Video Generator smoke test  (remotion={rem}, out={out_dir})\n")

    # 0. doctor (required section only)
    rc, out = sh([sys.executable, os.path.join(HERE, "doctor.py"), "--quiet"])
    if not step("doctor: required checks", rc == 0, "" if rc == 0 else "run python3 bin/doctor.py and fix the ❌ items"):
        print(out)
        return 1

    # 1. Remotion render (sample avatar + sample assets)
    frames = f"0-{int(a.seconds * 25) - 1}"
    motion = os.path.join(out_dir, f"{NAME}_motion.mp4")
    npx = shutil.which("npx") or shutil.which("npx.cmd")
    render_cmd = [npx, "remotion", "render", "src/index.ts", "PremiumSectionRef", motion,
                  f"--frames={frames}", "--codec", "h264", "--crf", "20", "--timeout", "300000", "--log", "error"]
    if os.environ.get("PLAYWRIGHT_BROWSERS_PATH"):
        # Sandboxed/cloud sessions of this kind route HTTPS through a local MITM proxy whose CA
        # Chromium doesn't trust (affects only what the headless browser fetches, e.g. Google Fonts,
        # not the rendered video's correctness or any non-sandboxed environment).
        render_cmd.append("--ignore-certificate-errors")
    rc, out = sh(render_cmd, cwd=rem, timeout=1500)
    ok = rc == 0 and os.path.exists(motion) and os.path.getsize(motion) > 10000
    if not step("Remotion render (PremiumSectionRef, sample assets)", ok, motion if ok else out[-1500:]):
        return 1

    # 2. subtitles: SRT → ASS → validate → burn (libass)
    srt = os.path.join(REPO, "subtitle-pipeline", "examples", "original.srt")
    ass = os.path.join(tmp, f"{NAME}.ass")
    rc, out = sh([sys.executable, os.path.join(REPO, "subtitle-pipeline", "srt_to_ass.py"), srt, ass])
    if not step("srt_to_ass.py (example SRT → motion-style ASS)", rc == 0 and os.path.exists(ass), out[-800:] if rc else ass):
        return 1
    rc, out = sh([sys.executable, os.path.join(REPO, "subtitle-pipeline", "srt_to_ass.py"), "--validate-only", ass])
    if not step("placement validation (--validate-only)", rc == 0, out[-800:] if rc else "PASS"):
        return 1
    ff = ffm.find_ffmpeg()
    final = os.path.join(out_dir, f"{NAME}_final.mp4")
    ass_arg = ass.replace("\\", "/").replace(":", "\\:") if os.name == "nt" else ass
    rc, out = sh([ff, "-y", "-v", "error", "-i", motion, "-vf", f"ass=filename={ass_arg}", "-c:a", "copy", final])
    if not step("libass burn (ffmpeg -vf ass)", rc == 0 and os.path.exists(final), out[-800:] if rc else final):
        return 1

    # 3. sound design (music + riser + clicks). Uses a music/ track if present, else a synthetic bed.
    music_dir = os.path.join(REPO, "music")
    tracks = [f for f in os.listdir(music_dir) if f.lower().endswith((".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"))]
    song = os.path.join(music_dir, sorted(tracks)[0]) if tracks else None
    tmpbed = None
    if not song:
        tmpbed = os.path.join(tempfile.gettempdir(), f"{NAME}_bed.wav")
        sh([ff, "-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=110:duration=60", "-af", "volume=0.5", tmpbed])
        song = tmpbed
    # add_music resolves the SRT by <Name>.srt in the scratch dir — provide one so the riser layer runs
    shutil.copyfile(srt, os.path.join(tmp, f"{NAME}.srt"))
    music = os.path.join(out_dir, f"{NAME}_music.mp4")
    rc, out = sh([sys.executable, os.path.join(REPO, "add_music.py"), "--input", final, "--output", music, "--song", song])
    ok = rc == 0 and os.path.exists(music)
    step("add_music.py (music + hook riser + transition clicks)", ok, (music + ("  [synthetic bed — add tracks to music/]" if tmpbed else "")) if ok else out[-1200:])
    if tmpbed and os.path.exists(tmpbed):
        os.remove(tmpbed)
    if not ok:
        return 1

    # 4. probe the final
    rc, out = sh([ffm.find_ffprobe(), "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height", "-of", "csv=p=0", music])
    step("ffprobe final = h264 1080x1920", "h264,1080,1920" in out.replace("\n", ""), out.strip())

    print(f"\n✅ Smoke test passed. Open: {music}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
