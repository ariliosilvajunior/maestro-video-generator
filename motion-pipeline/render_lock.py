#!/usr/bin/env python3
"""render_lock.py — ONE local render at a time, so the rest of the pipeline can run in parallel.

Why it exists: when several runs execute at once, almost all wall-clock time is CLOUD WAITING
(the avatar rendering, image generation, transcription). What really competes for the machine
is only: `npx remotion render` (thousands of Chromium frames), the subtitle burn (ffmpeg x264)
and writes to the shared `src/Root.tsx`. Only those need a queue — everything else may overlap.

This utility IS the queue: it serialises through a file lock inside the repo — valid across
processes and sessions (each run may live in a different terminal).

Usage:
  python3 motion-pipeline/render_lock.py -- npx remotion render src/index.ts Comp out.mp4 …
  python3 motion-pipeline/render_lock.py --cwd motion-pipeline/remotion-agent -- npx remotion render …
  python3 motion-pipeline/render_lock.py --status          # who holds the lock right now

Exits with the wrapped command's exit code. If the lock is busy it WAITS (printing who holds it and
for how long) up to `--timeout` seconds; past that it exits 75 without running anything.
"""
import argparse
import datetime
import os
import pathlib
import subprocess
import sys
import time

REPO = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))
from lib.locking import flock, try_flock  # noqa: E402

LOCK = REPO / "motion-pipeline" / ".render"          # lib.locking appends ".lock"
INFO = REPO / "motion-pipeline" / ".render.lock.info"


def read_info():
    try:
        return INFO.read_text(encoding="utf-8").strip()
    except Exception:  # noqa: BLE001
        return "(no info)"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cwd", help="directory to run the command in (default: current)")
    ap.add_argument("--timeout", type=float, default=3600, help="seconds to wait for the queue (default 3600)")
    ap.add_argument("--label", default="", help="who you are, shown by --status")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("cmd", nargs=argparse.REMAINDER)
    a = ap.parse_args()

    LOCK.parent.mkdir(parents=True, exist_ok=True)
    if a.status:
        print(f"lock: {'FREE' if try_flock(str(LOCK)) else 'BUSY'} · {read_info()}")
        return 0

    cmd = a.cmd[1:] if a.cmd and a.cmd[0] == "--" else a.cmd
    if not cmd:
        sys.exit("pass the command after `--`")
    who = a.label or os.environ.get("MAESTRO_RUN") or f"pid {os.getpid()}"
    t0 = time.time()
    while not try_flock(str(LOCK)):
        if time.time() - t0 > a.timeout:
            print(f"[render_lock] queue busy for {time.time() - t0:.0f}s by {read_info()} — giving up (75)", file=sys.stderr)
            return 75
        if int(time.time() - t0) % 30 == 0:
            print(f"[render_lock] {who} waiting · current: {read_info()}", flush=True)
        time.sleep(5)
    with flock(str(LOCK)):
        waited = time.time() - t0
        INFO.write_text(f"{who} since {datetime.datetime.now().strftime('%H:%M:%S')} — {' '.join(cmd)[:120]}", encoding="utf-8")
        print(f"[render_lock] {who} entered" + (f" (waited {waited:.0f}s)" if waited > 1 else ""), flush=True)
        try:
            return subprocess.run(cmd, cwd=a.cwd or None).returncode
        finally:
            INFO.write_text(f"free since {datetime.datetime.now().strftime('%H:%M:%S')}", encoding="utf-8")
            print(f"[render_lock] {who} left", flush=True)


if __name__ == "__main__":
    sys.exit(main())
