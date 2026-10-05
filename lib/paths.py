"""Canonical repo paths + env-overridable defaults.

Everything the pipeline writes outside the repo goes to TWO places:
  * the OUTPUT dir  — `~/Downloads` by default (render artifacts <Name>_*.mp4, plans, SRT/ASS copies)
  * the SCRATCH dir — `/tmp/claude` on macOS/Linux, `%TEMP%\\claude` on Windows (transient files)
The Remotion project lives INSIDE the repo (`motion-pipeline/remotion-agent`) — no symlinks needed.

Overrides (env var > config.json > default):
  MAESTRO_OUT       output dir            config: paths.downloads
  MAESTRO_TMPDIR    scratch dir           config: paths.tmp
  MAESTRO_REMOTION  Remotion project root (only if you moved it)
"""
import os
import sys
import tempfile

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO_ROOT)


def _cfg(key, default=None):
    try:
        from lib import config
        return config.get(key, default)
    except Exception:  # config module unavailable during bootstrap — defaults still work
        return default


def repo_root():
    return REPO_ROOT


def remotion_root():
    """The Remotion project root: $MAESTRO_REMOTION or <repo>/motion-pipeline/remotion-agent."""
    return os.environ.get("MAESTRO_REMOTION") or os.path.join(REPO_ROOT, "motion-pipeline", "remotion-agent")


def downloads():
    """The OUTPUT dir for render artifacts (default ~/Downloads)."""
    d = os.environ.get("MAESTRO_OUT") or _cfg("paths.downloads") or "~/Downloads"
    d = os.path.expanduser(d)
    os.makedirs(d, exist_ok=True)
    return d


def maestro_tmp():
    """The pipeline scratch dir: $MAESTRO_TMPDIR, config paths.tmp, else /tmp/claude (or %TEMP%\\claude)."""
    d = os.environ.get("MAESTRO_TMPDIR") or _cfg("paths.tmp")
    if not d:
        d = "/tmp/claude" if os.name != "nt" else os.path.join(tempfile.gettempdir(), "claude")
    d = os.path.expanduser(d)
    os.makedirs(d, exist_ok=True)
    return d


def out(name):
    """<downloads>/<name>"""
    return os.path.join(downloads(), name)


def tmp(name):
    """<scratch>/<name>"""
    return os.path.join(maestro_tmp(), name)


if __name__ == "__main__":
    print(f"repo      {repo_root()}")
    print(f"remotion  {remotion_root()}")
    print(f"downloads {downloads()}")
    print(f"tmp       {maestro_tmp()}")
