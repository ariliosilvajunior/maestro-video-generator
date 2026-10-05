#!/usr/bin/env python3
"""
setup_init.py — bootstrap + edit the two files that personalise the pipeline:
`config/config.json` (choices) and `.claude/keys.md` (secrets).

    python3 bin/setup_init.py init                       # create both from the examples (never overwrites)
    python3 bin/setup_init.py set images.provider openai  # write one config value (JSON parsed when possible)
    python3 bin/setup_init.py key Gemini AIza...          # write/replace the API key of a keys.md section
    python3 bin/setup_init.py status                      # what is filled, what is still a placeholder
    python3 bin/setup_init.py complete                    # run doctor; if green, stamp setup.completed=true

The /setup skill drives these commands one item at a time so you never edit JSON by hand.
Keys are written with 0600 permissions on macOS/Linux.
"""
import datetime
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, REPO)
from lib import config  # noqa: E402
from lib.api_keys import KEYS_MD, resolve_key, masked  # noqa: E402

KEYS_EXAMPLE = os.path.join(REPO, ".claude", "keys.md.example")
AUTH_DIR = os.path.join(REPO, ".claude", "auth")


def cmd_init():
    made = []
    if not config.exists():
        shutil.copyfile(config.EXAMPLE_PATH, config.CONFIG_PATH)
        made.append(config.CONFIG_PATH)
    if not os.path.exists(KEYS_MD):
        shutil.copyfile(KEYS_EXAMPLE, KEYS_MD)
        try:
            os.chmod(KEYS_MD, 0o600)
        except OSError:
            pass
        made.append(KEYS_MD)
    os.makedirs(AUTH_DIR, exist_ok=True)
    for d in ("pipeline-runs", "music", ".upload-tmp"):
        os.makedirs(os.path.join(REPO, d), exist_ok=True)
    for f in ("next-videos.jsonl", "post-queue.jsonl", "creators.jsonl"):
        p = os.path.join(REPO, f)
        if not os.path.exists(p):
            open(p, "a", encoding="utf-8").close()
    print("created: " + (", ".join(made) if made else "nothing (both files already exist)"))
    print("next:    python3 bin/setup_init.py status")
    return 0


def _parse(v):
    try:
        return json.loads(v)
    except (json.JSONDecodeError, TypeError):
        return v


def cmd_set(key, value):
    if not config.exists():
        cmd_init()
    config.set_value(key, _parse(value))
    print(f"{key} = {value}")
    return 0


def cmd_key(service, value):
    if not os.path.exists(KEYS_MD):
        cmd_init()
    text = open(KEYS_MD, encoding="utf-8").read()
    lines = text.splitlines()
    want = service.strip().lower()
    # find the section
    start = end = None
    for i, ln in enumerate(lines):
        if ln.startswith("## "):
            title = ln[3:].strip().lower()
            if start is not None and end is None:
                end = i
            if start is None and (title == want or title.startswith(want + " ") or title.startswith(want + "(")):
                start = i
    if start is None:
        lines += ["", f"## {service}", f"- API Key: `{value}`"]
    else:
        end = end if end is not None else len(lines)
        for i in range(start + 1, end):
            if re.match(r"\s*-\s*(API\s*Key|Key|Token)\s*:", lines[i], re.I):
                lines[i] = f"- API Key: `{value}`"
                break
        else:
            lines.insert(start + 1, f"- API Key: `{value}`")
    tmp = KEYS_MD + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    os.replace(tmp, KEYS_MD)
    try:
        os.chmod(KEYS_MD, 0o600)
    except OSError:
        pass
    print(f"{service}: key saved ({masked(value)})")
    return 0


def cmd_status():
    print(f"config:  {config.CONFIG_PATH}  {'present' if config.exists() else 'MISSING (run init)'}")
    print(f"keys:    {KEYS_MD}  {'present' if os.path.exists(KEYS_MD) else 'MISSING (run init)'}")
    if config.exists():
        c = config.load()
        for k in ("brand.name", "brand.instagram_handle", "brand.niche", "brand.audience", "avatar.name", "avatar.look",
                  "avatar.voice", "images.provider", "discovery.enabled", "discovery.queries", "discovery.seed_channels",
                  "manychat.enabled", "posting.method", "posting.metricool.enabled",
                  "qc.enabled", "notify.method", "setup.completed"):
            v = config.get(k, "")
            flag = "⚠️" if v in ("", None, [], {}) and not (k.endswith("enabled") or k == "setup.completed") else "  "
            print(f"  {flag} {k:32s} {json.dumps(v, ensure_ascii=False)}")
    for svc in ("gemini", "fal", "openai", "pexels", "pixabay", "coverr", "metricool"):
        k = resolve_key(svc)
        print(f"  {'  ' if k else '⚠️'} key {svc:12s} {masked(k) if k else '(not set)'}")
    for f in ("instagram-storage-state.json", "manychat-storage-state.json"):
        p = os.path.join(AUTH_DIR, f)
        print(f"  {'  ' if os.path.exists(p) else '⚠️'} session {f:32s} {'saved' if os.path.exists(p) else '(not saved)'}")
    return 0


def cmd_complete():
    rc = subprocess.run([sys.executable, os.path.join(HERE, "doctor.py"), "--quiet"]).returncode
    if rc != 0:
        print("doctor reports required failures — setup NOT marked complete. Fix them and re-run.")
        return rc
    config.set_value("setup.completed", True)
    config.set_value("setup.completed_at", datetime.datetime.now().isoformat(timespec="seconds"))
    print("✅ setup.completed = true — the pipeline skills are now unlocked.")
    return 0


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    cmd = argv[0]
    if cmd == "init":
        return cmd_init()
    if cmd == "set" and len(argv) >= 3:
        return cmd_set(argv[1], argv[2])
    if cmd == "key" and len(argv) >= 3:
        return cmd_key(argv[1], argv[2])
    if cmd == "status":
        return cmd_status()
    if cmd == "complete":
        return cmd_complete()
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
