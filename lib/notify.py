"""Owner notifications — the pipeline never blocks on a notification.

Every alert call site in the pipeline routes through this module, configurable in config.json:

  "notify": {
    "method": "log" | "webhook" | "command",
    "webhook_url": "https://...",          # method=webhook — POST {"text": msg, "content": msg}
    "command": "say \"{message}\""        # method=command — shell template, {message} substituted
  }

Every method ALSO appends to <repo>/alerts.log, so nothing is ever lost. Failures are
printed and swallowed — an alert that cannot be delivered must not kill a build.
"""
import datetime
import json
import os
import shlex
import subprocess
import sys
import urllib.request

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO_ROOT)
from lib import config  # noqa: E402

ALERTS_LOG = os.path.join(REPO_ROOT, "alerts.log")


def _log(message):
    stamp = datetime.datetime.now().isoformat(timespec="seconds")
    try:
        with open(ALERTS_LOG, "a", encoding="utf-8") as f:
            f.write(f"[{stamp}] {message}\n")
    except OSError:
        pass
    print(f"[alert] {message}", file=sys.stderr)


def send(message):
    """Deliver `message` via the configured method. Returns True when delivered (log counts)."""
    _log(message)
    method = (config.get("notify.method", "log") or "log").lower()
    try:
        if method == "webhook":
            url = config.get("notify.webhook_url")
            if not url:
                print("[alert] notify.method=webhook but notify.webhook_url is empty", file=sys.stderr)
                return False
            body = json.dumps({"text": message, "content": message}).encode("utf-8")
            req = urllib.request.Request(url, data=body, method="POST",
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return 200 <= r.status < 300
        if method == "command":
            tmpl = config.get("notify.command")
            if not tmpl:
                print("[alert] notify.method=command but notify.command is empty", file=sys.stderr)
                return False
            cmd = tmpl.replace("{message}", shlex.quote(message))
            subprocess.run(cmd, shell=True, timeout=60, check=False)
            return True
        return True  # log
    except Exception as e:  # noqa: BLE001 — never block the pipeline on a notification
        print(f"[alert] delivery failed ({method}): {e}", file=sys.stderr)
        return False
