"""API-key resolution — ONE resolver for every service.

Order (first hit wins):
  1. an explicit CLI value (`--api-key ...`) passed by the caller
  2. environment variables (see ENV_ALIASES — e.g. GEMINI_API_KEY, FAL_KEY, OPENAI_API_KEY, PEXELS_API_KEY)
  3. `.claude/keys.md` — a `## <Service>` section holding a line like
         - API Key: `abc123`
     (backticks optional; `Key:`/`Token:` also accepted). Placeholders such as
     `PASTE_..._HERE` / `<...>` are ignored, so an unfilled template never resolves.

keys.md is gitignored and created from `.claude/keys.md.example` by the setup wizard.
Never print a resolved key; scripts only ever report "missing" or the masked tail.
"""
import os
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS_MD = os.environ.get("MAESTRO_KEYS_MD") or os.path.join(REPO_ROOT, ".claude", "keys.md")

# service (lowercase) -> env var names tried, in order
ENV_ALIASES = {
    "gemini": ("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY"),
    "google": ("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY"),
    "fal": ("FAL_KEY", "FAL_API_KEY"),
    "openai": ("OPENAI_API_KEY",),
    "pexels": ("PEXELS_API_KEY", "PEXELS_KEY"),
    "pixabay": ("PIXABAY_API_KEY", "PIXABAY_KEY"),
    "coverr": ("COVERR_API_KEY", "COVERR_KEY"),
    "metricool": ("METRICOOL_TOKEN", "METRICOOL_API_KEY", "MC_AUTH"),
    "painel": ("PAINEL_TOKEN", "CONTENT_FACTORY_API_TOKEN"),
}

# keys.md section headers -> canonical service names (case-insensitive match on the header text)
SECTION_ALIASES = {
    "gemini": ("gemini", "google gemini", "google ai"),
    "google": ("gemini", "google gemini", "google ai"),
    "fal": ("fal", "fal.ai", "fal ai"),
    "openai": ("openai", "open ai"),
    "pexels": ("pexels",),
    "pixabay": ("pixabay",),
    "coverr": ("coverr",),
    "metricool": ("metricool",),
    "painel": ("painel",),
}

_KEY_LINE = re.compile(r"(?:API\s*Key|Key|Token|Auth)\s*:\s*`?([^`\s]+)`?", re.I)
_PLACEHOLDER = re.compile(r"(PASTE_|_HERE\b|^<.*>$|^your[-_ ]|^xxx|^\.\.\.$)", re.I)


def _read_keys_md():
    try:
        with open(KEYS_MD, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return None


def keys_md_section(header):
    """Text of the `## <header>` section (header match is case-insensitive, prefix-tolerant)."""
    text = _read_keys_md()
    if text is None:
        return None
    want = header.strip().lower()
    lines = text.splitlines()
    start = None
    for i, ln in enumerate(lines):
        if ln.startswith("## "):
            title = ln[3:].strip().lower()
            if start is not None:
                return "\n".join(lines[start:i])
            if title == want or title.startswith(want + " ") or title.startswith(want + "(") or title.startswith(want + " —") or title.startswith(want + " -"):
                start = i
    return "\n".join(lines[start:]) if start is not None else None


def _first_key_in(section_text):
    if not section_text:
        return None
    for m in _KEY_LINE.finditer(section_text):
        cand = m.group(1).strip().strip("`'\"")
        if cand and not _PLACEHOLDER.search(cand):
            return cand
    return None


def resolve_key(service, cli_key=None):
    """Resolve the API key for `service` ('gemini', 'fal', 'openai', 'pexels', ...). None if absent."""
    if cli_key:
        return cli_key
    svc = (service or "").strip().lower()
    for ev in ENV_ALIASES.get(svc, (f"{svc.upper()}_API_KEY", f"{svc.upper()}_KEY")):
        if os.environ.get(ev):
            return os.environ[ev]
    for header in SECTION_ALIASES.get(svc, (svc,)):
        k = _first_key_in(keys_md_section(header))
        if k:
            return k
    return None


def resolve_gemini_key(cli_key=None):
    """Back-compat name used by the transcription scripts."""
    return resolve_key("gemini", cli_key)


def masked(key):
    """'…abcd' — safe to print in logs."""
    if not key:
        return "(missing)"
    return "…" + key[-4:] if len(key) > 8 else "…"


if __name__ == "__main__":
    import sys
    for svc in (sys.argv[1:] or ["gemini", "fal", "openai", "pexels", "pixabay", "coverr", "metricool"]):
        print(f"{svc:10s} {masked(resolve_key(svc))}")
