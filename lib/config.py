"""Central configuration — `config/config.json` is the ONE place the pipeline reads
brand / avatar / provider choices from. Secrets never live here (see lib/api_keys.py).

Usage (library):
    from lib import config
    config.get("images.provider", "fal")        # dotted lookup with a default
    config.get("manychat.enabled", False)
    config.load()                                # the merged dict (defaults <- file)
    config.exists()                              # False until the setup wizard wrote it

Usage (CLI):
    python3 lib/config.py get images.provider
    python3 lib/config.py set images.provider openai
    python3 lib/config.py show

Resolution order for the file: $MAESTRO_CONFIG env var → <repo>/config/config.json.
Missing keys fall back to DEFAULTS below, so an older config.json keeps working after
a schema addition. Values are merged recursively (dict-wise) — never replaced wholesale.
"""
import copy
import json
import re
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_DIR = os.path.join(REPO_ROOT, "config")
CONFIG_PATH = os.environ.get("MAESTRO_CONFIG") or os.path.join(CONFIG_DIR, "config.json")
EXAMPLE_PATH = os.path.join(CONFIG_DIR, "config.example.json")

DEFAULTS = {
    "schema_version": 1,
    "brand": {
        "name": "",
        "instagram_handle": "",
        "language": "pt-BR",
        "timezone": "America/Sao_Paulo",
        "niche": "",
        "audience": "",
    },
    "discovery": {                      # Phase 1 niche discovery (the "scraping" phase) — filled by /setup
        "enabled": True,
        "queries": [],                  # 6-12 search phrases a viewer of the niche would type (PT + EN)
        "seed_channels": [],            # @handle / channel URL / UC… id of creators to reproduce from
        "use_creators_roster": True,    # also the YouTube authors of links you pasted (creators.jsonl)
        "languages": ["pt", "en"],
        "max_age_days": 30,
        "min_views": 5000,
        "min_duration_s": 20,
        "max_duration_s": 900,
        "exclude_keywords": [],
        "per_run": 3,
        "auto_enqueue": True,
        "prefer_shorts": False,
        "search_depth": 15,
        "channel_depth": 20,
    },
    "avatar": {
        "provider": "heygen",
        "name": "",
        "look": "",
        "fallback_look": "",
        "voice": "",
        "engine_fallback": "Avatar III",
    },
    "images": {
        "provider": "fal",
        "fal_model": "fal-ai/nano-banana-pro",
        "fal_extra": {},
        "google_model": "gemini-2.5-flash-image",
        "openai_model": "gpt-image-1",
        "openai_transparent": True,
        "width": 1024,
        "height": 1536,
    },
    "transcription": {"provider": "gemini", "model": "gemini-2.5-flash"},
    "stock": {"sources": "auto"},
    "manychat": {
        "enabled": False,
        "account_id": "",
        "template_flow_id": "",
        "instagram_handle": "",
        "follow_gate": True,
        "extra_bubble": {"enabled": False, "text": "", "button_label": "", "url": ""},
    },
    "posting": {
        "method": "browser",
        "instagram_handle": "",
        "metricool": {"enabled": False, "blog_id": "", "user_id": "", "timezone": "America/Sao_Paulo", "gap_hours": 2},
    },
    "painel": {"enabled": False, "url": "https://painel.recursoscognitivos.com.br"},
    "qc": {"enabled": False, "threshold": 75, "max_iterations": 3},
    "notify": {"method": "log", "webhook_url": "", "command": ""},
    "paths": {"downloads": "~/Downloads", "tmp": "", "ffmpeg": ""},
    "setup": {"completed": False, "completed_at": ""},
}

_cache = None


def _merge(base, override):
    out = copy.deepcopy(base)
    for k, v in (override or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _merge(out[k], v)
        else:
            out[k] = v
    return out


def exists():
    return os.path.exists(CONFIG_PATH)


def load(force=False):
    """The merged config dict (DEFAULTS overlaid with config.json). Cached per process."""
    global _cache
    if _cache is not None and not force:
        return _cache
    data = {}
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, encoding="utf-8") as f:
                data = json.load(f) or {}
        except json.JSONDecodeError as e:
            sys.exit(f"ERROR: {CONFIG_PATH} is not valid JSON: {e}")
    _cache = _merge(DEFAULTS, data)
    return _cache


def get(dotted, default=None):
    """Dotted lookup: get('images.provider'). Returns `default` when the path is missing/empty."""
    node = load()
    for part in dotted.split("."):
        if not isinstance(node, dict) or part not in node:
            return default
        node = node[part]
    if node in ("", None):
        return default
    return node


def _default_at(dotted):
    node = DEFAULTS
    for part in dotted.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node


def coerce(dotted, value):
    """Coerce a CLI string to the type of the DEFAULTS value at that key:
    list  <- "a, b, c" (comma/newline separated)   bool <- true/false/yes/no/1/0   int <- "12"."""
    d = _default_at(dotted)
    if isinstance(value, str):
        if isinstance(d, list):
            return [x.strip() for x in re.split(r"[,\n]", value) if x.strip()]
        if isinstance(d, bool):
            if value.strip().lower() in ("true", "yes", "1", "on"):
                return True
            if value.strip().lower() in ("false", "no", "0", "off"):
                return False
        if isinstance(d, int) and not isinstance(d, bool) and re.fullmatch(r"-?\d+", value.strip()):
            return int(value)
    return value


def set_value(dotted, value):
    """Set one dotted key in config.json (creating the file from DEFAULTS if needed). Atomic write."""
    value = coerce(dotted, value)
    data = {}
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, encoding="utf-8") as f:
            data = json.load(f) or {}
    node = data
    parts = dotted.split(".")
    for part in parts[:-1]:
        node = node.setdefault(part, {})
        if not isinstance(node, dict):
            sys.exit(f"ERROR: {dotted}: '{part}' is not an object")
    node[parts[-1]] = value
    save(data)
    return value


def save(data):
    os.makedirs(CONFIG_DIR, exist_ok=True)
    tmp = f"{CONFIG_PATH}.tmp.{os.getpid()}"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    os.replace(tmp, CONFIG_PATH)
    global _cache
    _cache = None


def _parse(v):
    try:
        return json.loads(v)
    except (json.JSONDecodeError, TypeError):
        return v


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    cmd = argv[0]
    if cmd == "show":
        print(json.dumps(load(), indent=2, ensure_ascii=False))
        return 0
    if cmd == "path":
        print(CONFIG_PATH)
        return 0
    if cmd == "get" and len(argv) >= 2:
        v = get(argv[1])
        print(json.dumps(v, ensure_ascii=False) if not isinstance(v, str) else v)
        return 0
    if cmd == "set" and len(argv) >= 3:
        set_value(argv[1], _parse(argv[2]))
        print(f"{argv[1]} = {argv[2]}")
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
