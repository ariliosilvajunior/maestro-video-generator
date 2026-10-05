#!/usr/bin/env python3
"""
alert.py — send a pipeline alert to the owner (config.json → notify.*).

Used by the posting phase when the saved Instagram session fails, by the image phase when
the provider is down (premium → hand-drawn downgrade), and by the recovery sweep. Delivery
method comes from config.json (`log` | `webhook` | `command`); every alert is also written
to <repo>/alerts.log.

Usage:
  python3 post-pipeline/alert.py "free-form message"
  python3 post-pipeline/alert.py --platform instagram --run <Name> --reason "session signed-out"
  python3 post-pipeline/alert.py --platform images    --run <Name> --reason "provider 401"
  python3 post-pipeline/alert.py --platform system    --run scheduler --reason "no browser MCP"

Exit 0 when delivered (log-only counts as delivered), 1 otherwise.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib import notify  # noqa: E402


def compose(platform, run, reason):
    plat = (platform or "system").lower()
    if plat == "images":
        return (f"🎨 Maestro Video Generator — image provider down (video built hand-drawn)\n"
                f"Run: {run or '-'}\nReason: {reason or 'provider error / key invalid'}\n"
                f"Fix the image provider key (config images.provider) so the next videos come out premium.")
    if plat in ("instagram", "manychat", "heygen"):
        return (f"🚨 Maestro Video Generator — {plat.upper()} login alert\nRun: {run or '-'}\n"
                f"Problem: {reason or 'saved session/cookies failed'}\n"
                f"Re-login to {plat} in the pipeline browser and re-save the session (see docs/SETUP.md).")
    return f"⚠️ Maestro Video Generator — {plat}\nRun: {run or '-'}\n{reason or ''}".strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("message", nargs="?", default="")
    ap.add_argument("--platform", default="")
    ap.add_argument("--reason", default="")
    ap.add_argument("--run", default="")
    a = ap.parse_args()
    msg = a.message or compose(a.platform, a.run, a.reason)
    return 0 if notify.send(msg) else 1


if __name__ == "__main__":
    sys.exit(main())
