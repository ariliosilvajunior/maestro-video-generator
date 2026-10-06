#!/usr/bin/env python3
"""
doctor.py — the SETUP CHECKLIST. Verifies every program, key, session and asset the pipeline
needs and prints a fix for each miss. The `/setup` skill runs this until it is green; the
orchestrator runs `--quiet` before every build (exit 0 = allowed to run).

    python3 bin/doctor.py            # full checklist
    python3 bin/doctor.py --live     # + live API probes (Gemini, image provider, Pexels, OpenAI)
    python3 bin/doctor.py --json     # machine-readable (also written to config/doctor-report.json)
    python3 bin/doctor.py --quiet    # only failures; exit code says it all

Exit codes: 0 = every REQUIRED check passed · 1 = at least one REQUIRED check failed.
Optional/recommended items never fail the run; they show as ⚠️.
"""
import argparse
import datetime
import glob
import importlib
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, REPO)
from lib import config  # noqa: E402
from lib.api_keys import resolve_key, KEYS_MD  # noqa: E402
from lib import ffmpeg as ffm  # noqa: E402

IS_WIN = os.name == "nt"
IS_MAC = sys.platform == "darwin"
OS_NAME = "macOS" if IS_MAC else ("Windows" if IS_WIN else "Linux")

REMOTION = os.path.join(REPO, "motion-pipeline", "remotion-agent")
REF_PIPE = os.path.join(REPO, "reference-pipeline")
AUTH_DIR = os.path.join(REPO, ".claude", "auth")
MUSIC_DIR = os.path.join(REPO, "music")
SFX_DIR = os.path.join(REPO, "sfx")

AUDIO_EXT = (".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg")

RESULTS = []


def add(section, name, ok, detail="", fix="", required=True, warn=False):
    """ok=True → ✅; ok=False & required → ❌; ok=False & not required (or warn) → ⚠️."""
    status = "ok" if ok else ("warn" if (warn or not required) else "fail")
    RESULTS.append({"section": section, "name": name, "status": status, "detail": detail, "fix": fix, "required": required})


def run(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout or "") + (r.stderr or "")
    except Exception as e:  # noqa: BLE001
        return 127, str(e)


def which(name):
    return shutil.which(name) or shutil.which(name + ".exe")


def ver_tuple(s):
    m = re.search(r"(\d+)\.(\d+)(?:\.(\d+))?", s or "")
    return tuple(int(x or 0) for x in m.groups()) if m else (0, 0, 0)


def pkg_hint(mac, linux, win):
    return {"macOS": mac, "Linux": linux, "Windows": win}[OS_NAME]


# ─────────────────────────────── 1. programs ───────────────────────────────

def check_programs():
    S = "1. Programs"
    py = sys.version_info
    add(S, "Python ≥ 3.10", py >= (3, 10), f"{py.major}.{py.minor}.{py.micro} ({sys.executable})",
        pkg_hint("brew install python", "sudo apt install python3", "https://www.python.org/downloads/"))
    for mod, pipname in (("PIL", "Pillow"), ("numpy", "numpy")):
        try:
            importlib.import_module(mod)
            add(S, f"Python package {pipname}", True, "importable")
        except ImportError:
            add(S, f"Python package {pipname}", False, "missing", f"python3 -m pip install -r requirements.txt")

    node = which("node")
    rc, out = run([node, "--version"]) if node else (1, "")
    v = ver_tuple(out)
    add(S, "Node.js ≥ 18", bool(node) and v >= (18, 0, 0), f"{out.strip() or 'not found'}",
        pkg_hint("brew install node", "https://nodejs.org (or nvm)", "https://nodejs.org (LTS installer)"))
    npm = which("npm")
    add(S, "npm", bool(npm), (run([npm, "--version"])[1].strip() if npm else "not found"), "comes with Node.js")

    # ffmpeg with libass
    try:
        ff = ffm.find_ffmpeg()
        has_ass = ffm.has_ass_filter(ff)
        rc, out = run([ff, "-version"])
        add(S, "ffmpeg", True, f"{ff}  ({out.splitlines()[0][:60] if out else ''})")
        add(S, "ffmpeg has the `ass` subtitle filter (libass)", has_ass, ff if has_ass else f"{ff} lacks libass",
            pkg_hint("brew install ffmpeg  (if it still lacks libass: brew tap homebrew-ffmpeg/ffmpeg && brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-libass, then set MAESTRO_FFMPEG)",
                     "sudo apt install ffmpeg libass9", "use a gyan.dev 'full' build: https://www.gyan.dev/ffmpeg/builds/ and add its bin/ to PATH"))
        try:
            fp = ffm.find_ffprobe()
            add(S, "ffprobe", True, fp)
        except Exception as e:  # noqa: BLE001
            add(S, "ffprobe", False, str(e), "install ffmpeg (ffprobe ships with it)")
    except Exception as e:  # noqa: BLE001
        add(S, "ffmpeg", False, str(e), pkg_hint("brew install ffmpeg", "sudo apt install ffmpeg", "https://www.gyan.dev/ffmpeg/builds/ (add bin/ to PATH)"))
        add(S, "ffmpeg has the `ass` subtitle filter (libass)", False, "ffmpeg missing", "install ffmpeg first")
        add(S, "ffprobe", False, "ffmpeg missing", "install ffmpeg first")

    ytdlp = which("yt-dlp")
    add(S, "yt-dlp (source download for link runs)", bool(ytdlp), (run([ytdlp, "--version"])[1].strip() if ytdlp else "not found"),
        pkg_hint("brew install yt-dlp", "python3 -m pip install -U yt-dlp", "python3 -m pip install -U yt-dlp"))
    jq = which("jq")
    add(S, "jq (used by the paste-a-link hook)", bool(jq), (run([jq, "--version"])[1].strip() if jq else "not found"),
        pkg_hint("brew install jq", "sudo apt install jq", "winget install jqlang.jq"), required=not IS_WIN)
    add(S, "git (optional, recommended for your own versioning)", bool(which("git")), which("git") or "not found",
        pkg_hint("brew install git", "sudo apt install git", "https://git-scm.com"), required=False)

    # Remotion project deps
    rem_pkg = os.path.join(REMOTION, "node_modules", "remotion", "package.json")
    if os.path.exists(rem_pkg):
        try:
            rv = json.load(open(rem_pkg)).get("version")
        except Exception:  # noqa: BLE001
            rv = "?"
        add(S, "Remotion project dependencies installed", True, f"remotion {rv} in motion-pipeline/remotion-agent/node_modules")
    else:
        add(S, "Remotion project dependencies installed", False, "node_modules missing",
            "cd motion-pipeline/remotion-agent && npm install")
    # Playwright for the headless reference capture (optional)
    pw_local = os.path.exists(os.path.join(REF_PIPE, "node_modules", "playwright", "package.json"))
    caches = [os.path.expanduser("~/Library/Caches/ms-playwright"), os.path.expanduser("~/.cache/ms-playwright"),
              os.path.join(os.environ.get("LOCALAPPDATA", ""), "ms-playwright")]
    has_chromium = any(glob.glob(os.path.join(c, "chromium*")) for c in caches if c)
    add(S, "Headless Playwright + Chromium (reference-pipeline: YouTube/page captures)", pw_local and has_chromium,
        ("installed" if pw_local and has_chromium else "not installed"),
        "cd reference-pipeline && npm install && npx playwright install chromium", required=False)
    add(S, "Playwright MCP config (.mcp.json)", os.path.exists(os.path.join(REPO, ".mcp.json")), ".mcp.json present — the browser tools appear in Claude Code after a restart",
        "restore .mcp.json from the package", required=True)
    asr = None
    for mod in ("mlx_whisper", "faster_whisper", "whisper"):
        try:
            importlib.import_module(mod)
            asr = mod
            break
        except Exception:  # noqa: BLE001
            continue
    add(S, "Local word-level ASR (optional: measured caption builder)", bool(asr), asr or "none",
        "python3 -m pip install mlx-whisper   (Apple Silicon)  |  python3 -m pip install faster-whisper", required=False)


# ─────────────────────────────── 2. config ─────────────────────────────────

PLACEHOLDERS = {"", "your brand", "yourhandle", "@yourhandle", "youravatar", "youravatar -- 1", "youravatar -- 2",
                "your voice", "your-brand", "your_handle", "paste_here", "changeme"}


def filled(key):
    """True when a config value is set AND is not one of the config.example.json placeholders."""
    v = config.get(key, "")
    return bool(v) and str(v).strip().lower() not in PLACEHOLDERS


def check_config():
    S = "2. Configuration (config/config.json)"
    if not config.exists():
        add(S, "config/config.json exists", False, "missing", "python3 bin/setup_init.py init   (then fill it — the /setup skill walks you through it)")
        return
    add(S, "config/config.json exists", True, config.CONFIG_PATH)
    add(S, "brand.instagram_handle", filled("brand.instagram_handle"), config.get("brand.instagram_handle") or "(empty)",
        "python3 bin/setup_init.py set brand.instagram_handle yourhandle", required=False)
    add(S, "avatar.name (your HeyGen avatar)", filled("avatar.name"), config.get("avatar.name", "(empty)"),
        "python3 bin/setup_init.py set avatar.name \"YourAvatar\"")
    add(S, "avatar.look (the look card name in HeyGen)", filled("avatar.look"), config.get("avatar.look", "(empty)"),
        "python3 bin/setup_init.py set avatar.look \"YourAvatar -- 1\"")
    add(S, "avatar.voice", filled("avatar.voice"), config.get("avatar.voice", "(empty)"),
        "python3 bin/setup_init.py set avatar.voice \"Your Voice\"", required=False)
    prov = (config.get("images.provider", "") or "").lower()
    add(S, "images.provider ∈ {fal, google, openai, none}", prov in ("fal", "google", "openai", "none"), prov or "(empty)",
        "python3 bin/setup_init.py set images.provider fal   (or google / openai)")
    if config.get("manychat.enabled", False):
        for k in ("manychat.account_id", "manychat.template_flow_id", "manychat.instagram_handle"):
            add(S, k, bool(config.get(k)), config.get(k, "(empty)"), f"python3 bin/setup_init.py set {k} <value>")
    if config.get("posting.metricool.enabled", False):
        for k in ("posting.metricool.blog_id", "posting.metricool.user_id"):
            add(S, k, bool(config.get(k)), config.get(k, "(empty)"), f"python3 bin/setup_init.py set {k} <value>")
    if config.get("posting.buffer.enabled", False):
        add(S, "posting.buffer.organization_id", bool(config.get("posting.buffer.organization_id")),
            config.get("posting.buffer.organization_id", "(empty)"), "python3 bin/setup_init.py set posting.buffer.organization_id <id>")
        any_channel = any(config.get(f"posting.buffer.channels.{n}") for n in ("facebook", "youtube", "tiktok"))
        add(S, "posting.buffer.channels.* (at least one network)", any_channel,
            "facebook/youtube/tiktok" if any_channel else "(none set)",
            "python3 bin/setup_init.py set posting.buffer.channels.<network> <channel_id>", required=False)
    add(S, "posting.instagram_handle", filled("posting.instagram_handle"), config.get("posting.instagram_handle", "(empty)"),
        "python3 bin/setup_init.py set posting.instagram_handle yourhandle", required=False)
    # Niche discovery (Phase 1 "scraping"): the queue is fed from the user's OWN niche, so setup must capture it.
    add(S, "brand.niche (your niche — drives discovery + script angle)", filled("brand.niche"), config.get("brand.niche") or "(empty)",
        "python3 bin/setup_init.py set brand.niche \"<one line: what your account is about>\"", required=bool(config.get("discovery.enabled", True)))
    add(S, "brand.audience (who watches)", filled("brand.audience"), config.get("brand.audience") or "(empty)",
        "python3 bin/setup_init.py set brand.audience \"<who watches, their level and goal>\"", required=False)
    if config.get("discovery.enabled", True):
        q = config.get("discovery.queries", []) or []
        ch = config.get("discovery.seed_channels", []) or []
        add(S, "discovery.queries / seed_channels (niche discovery feeds the queue when it is empty)", bool(q or ch),
            f"{len(q)} queries, {len(ch)} seed channels",
            "python3 bin/setup_init.py set discovery.queries \"frase 1, frase 2, phrase 3\"   (6-12 phrases, PT + EN; the /setup niche step)")
        add(S, "discovery.queries has both PT and EN phrases (recommended)", len(q) >= 4, f"{len(q)} queries",
            "add more search phrases — aim for 6-12 covering PT and EN", required=False)


# ─────────────────────────────── 3. keys ───────────────────────────────────

def _probe(url, headers=None, timeout=15, method=None, data=None):
    try:
        req = urllib.request.Request(url, headers=headers or {}, method=method, data=data)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:  # noqa: BLE001
        return 0


def check_keys(live):
    S = "3. API keys (.claude/keys.md)"
    add(S, ".claude/keys.md exists", os.path.exists(KEYS_MD), KEYS_MD if os.path.exists(KEYS_MD) else "missing",
        "python3 bin/setup_init.py init   (creates it from .claude/keys.md.example)")
    prov = (config.get("images.provider", "fal") or "fal").lower() if config.exists() else "fal"

    gem = resolve_key("gemini")
    add(S, "Gemini key (transcription)", bool(gem), "present" if gem else "missing",
        "python3 bin/setup_init.py key Gemini <AIza...>   — https://aistudio.google.com/apikey")
    if live and gem:
        st = _probe(f"https://generativelanguage.googleapis.com/v1beta/models?key={gem}")
        add(S, "Gemini key accepted (live)", st == 200, f"HTTP {st}", "the key is invalid or the API is not enabled for its project")

    el = resolve_key("elevenlabs")
    add(S, "ElevenLabs key (pre-HeyGen draft narration)", bool(el), "present" if el else "missing",
        "python3 bin/setup_init.py key ElevenLabs <sk_...>   — https://elevenlabs.io/app/settings/api-keys")
    add(S, "avatar.elevenlabs_voice_id", filled("avatar.elevenlabs_voice_id"), config.get("avatar.elevenlabs_voice_id", "(empty)"),
        "python3 bin/setup_init.py set avatar.elevenlabs_voice_id <voice_id>   — GET https://api.elevenlabs.io/v1/voices")
    if live and el:
        st = _probe("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": el})
        add(S, "ElevenLabs key accepted (live)", st == 200, f"HTTP {st}", "the key was rejected")

    if prov == "fal":
        k = resolve_key("fal")
        add(S, "fal.ai key (images.provider = fal)", bool(k), "present" if k else "missing", "python3 bin/setup_init.py key fal <key>   — https://fal.ai/dashboard/keys")
        if live and k:
            model = config.get("images.fal_model", "fal-ai/nano-banana-pro")
            st = _probe(f"https://queue.fal.run/{model}/requests/00000000-0000-0000-0000-000000000000/status",
                        headers={"Authorization": f"Key {k}"})
            add(S, "fal.ai key accepted (live)", st not in (0, 401, 403), f"HTTP {st}", "the key was rejected (401/403)")
    elif prov == "openai":
        k = resolve_key("openai")
        add(S, "OpenAI key (images.provider = openai)", bool(k), "present" if k else "missing", "python3 bin/setup_init.py key OpenAI <sk-...>")
        if live and k:
            st = _probe("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {k}"})
            add(S, "OpenAI key accepted (live)", st == 200, f"HTTP {st}", "the key was rejected")
    elif prov == "google":
        add(S, "Google image provider reuses the Gemini key", bool(gem), "ok" if gem else "Gemini key missing", "fill the Gemini key above")
    elif prov == "none":
        add(S, "Image provider", True, "none — premium image assets disabled; videos use the hand-drawn style", "", required=False)

    px = resolve_key("pexels")
    add(S, "Pexels key (stock b-roll, free)", bool(px), "present" if px else "missing",
        "python3 bin/setup_init.py key Pexels <key>   — https://www.pexels.com/api/", required=False)
    if live and px:
        st = _probe("https://api.pexels.com/videos/search?query=technology&per_page=1", headers={"Authorization": px})
        add(S, "Pexels key accepted (live)", st == 200, f"HTTP {st}", "the key was rejected", required=False)
    for svc, label in (("pixabay", "Pixabay key (optional stock source)"), ("coverr", "Coverr key (optional stock source)")):
        k = resolve_key(svc)
        add(S, label, bool(k), "present" if k else "not set", f"python3 bin/setup_init.py key {svc.capitalize()} <key>", required=False)
    if config.exists() and config.get("posting.metricool.enabled", False):
        k = resolve_key("metricool")
        add(S, "Metricool token (posting.metricool.enabled)", bool(k), "present" if k else "missing", "python3 bin/setup_init.py key Metricool <token>")
    if config.exists() and config.get("posting.buffer.enabled", False):
        k = resolve_key("buffer")
        add(S, "Buffer token (posting.buffer.enabled)", bool(k), "present" if k else "missing", "python3 bin/setup_init.py key Buffer <token>")
        if live and k:
            st = _probe("https://api.buffer.com", headers={"Authorization": f"Bearer {k}", "Content-Type": "application/json"},
                         method="POST", data=b'{"query":"query { account { id } }"}')
            add(S, "Buffer token accepted (live)", st == 200, f"HTTP {st}", "the key was rejected or expired", required=False)


# ─────────────────────────────── 4. sessions ───────────────────────────────

def check_discovery(live):
    S = "3b. Niche discovery (yt-dlp search)"
    if not config.exists() or not config.get("discovery.enabled", True):
        return
    q = config.get("discovery.queries", []) or []
    if not live or not q or not which("yt-dlp"):
        return
    rc, out = run(["yt-dlp", "--no-warnings", "--flat-playlist", "-j", f"ytsearch2:{q[0]}"], timeout=60)
    ok = rc == 0 and '"title"' in out
    add(S, f"YouTube search works for {q[0]!r} (live)", ok, "results returned" if ok else "no results / network error",
        "check the network; try: yt-dlp -j --flat-playlist \"ytsearch2:<query>\"", required=False)


def check_sessions():
    S = "4. Browser sessions (.claude/auth/)"
    ig = os.path.join(AUTH_DIR, "instagram-storage-state.json")
    ok = os.path.exists(ig) and os.path.getsize(ig) > 100
    add(S, "Instagram session saved (needed to POST; not needed to build)", ok, ig if ok else "not saved yet",
        "run /setup step 'Instagram login' — the agent logs you in through the pipeline browser and saves the session", required=False)
    if config.exists() and config.get("manychat.enabled", False):
        mc = os.path.join(AUTH_DIR, "manychat-storage-state.json")
        ok = os.path.exists(mc) and os.path.getsize(mc) > 100
        add(S, "ManyChat session saved (manychat.enabled = true)", ok, mc if ok else "not saved yet",
            "run /setup step 'ManyChat login' (Google/Facebook SSO in the pipeline browser)")
    prof = os.path.join(REPO, ".playwright-profile")
    add(S, "Persistent browser profile (.playwright-profile/) — HeyGen stays logged in here", os.path.isdir(prof),
        "present" if os.path.isdir(prof) else "created on first browser use", "open any page with the Playwright MCP once", required=False)


# ─────────────────────────────── 5. assets ─────────────────────────────────

def check_assets():
    S = "5. Assets"
    tracks = [f for f in os.listdir(MUSIC_DIR) if f.lower().endswith(AUDIO_EXT)] if os.path.isdir(MUSIC_DIR) else []
    add(S, "music/ has ≥ 1 background track", bool(tracks), f"{len(tracks)} track(s)" if tracks else "empty",
        "drop a royalty-free .mp3/.wav into music/ (see music/README.md)")
    riser = glob.glob(os.path.join(SFX_DIR, "hook-riser*"))
    click = glob.glob(os.path.join(SFX_DIR, "transition-click*"))
    add(S, "sfx/ hook riser + transition click", bool(riser and click), f"{len(riser)} riser, {len(click)} click",
        "python3 bin/make_sample_assets.py --sfx")
    fonts = [f for f in ("Anton-Regular.ttf", "Montserrat-Bold.ttf", "SpaceGrotesk.ttf")
             if os.path.exists(os.path.join(REMOTION, "public", "fonts", f))]
    add(S, "Remotion fonts bundled", len(fonts) == 3, ", ".join(fonts) or "missing", "restore motion-pipeline/remotion-agent/public/fonts from the package")
    sample = os.path.join(REMOTION, "public", "sample_avatar.mp4")
    add(S, "Sample avatar clip (smoke test / demo renders)", os.path.exists(sample), sample if os.path.exists(sample) else "missing",
        "python3 bin/make_sample_assets.py", required=False)
    for d in ("pipeline-runs", ".claude/auth", "config"):
        add(S, f"{d}/ writable", os.access(os.path.join(REPO, d), os.W_OK) if os.path.isdir(os.path.join(REPO, d)) else False,
            "ok" if os.path.isdir(os.path.join(REPO, d)) else "missing", f"mkdir -p {d}")


# ─────────────────────────────── report ────────────────────────────────────

ICON = {"ok": "✅", "warn": "⚠️ ", "fail": "❌"}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--live", action="store_true", help="probe the APIs with the configured keys")
    ap.add_argument("--json", action="store_true", help="print JSON instead of the table")
    ap.add_argument("--quiet", action="store_true", help="only print failures/warnings")
    a = ap.parse_args()

    check_programs()
    check_config()
    check_keys(a.live)
    check_discovery(a.live)
    check_sessions()
    check_assets()

    fails = [r for r in RESULTS if r["status"] == "fail"]
    warns = [r for r in RESULTS if r["status"] == "warn"]
    report = {"generated_at": datetime.datetime.now().isoformat(timespec="seconds"), "os": OS_NAME,
              "platform": platform.platform(), "ok": not fails, "failures": len(fails), "warnings": len(warns), "checks": RESULTS}
    try:
        os.makedirs(os.path.join(REPO, "config"), exist_ok=True)
        with open(os.path.join(REPO, "config", "doctor-report.json"), "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
    except OSError:
        pass

    if a.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
        return 0 if not fails else 1

    section = None
    for r in RESULTS:
        if a.quiet and r["status"] == "ok":
            continue
        if r["section"] != section:
            section = r["section"]
            print(f"\n{section}")
        print(f"  {ICON[r['status']]} {r['name']}  —  {r['detail']}")
        if r["status"] != "ok" and r["fix"]:
            print(f"       fix: {r['fix']}")
    print()
    if fails:
        print(f"❌ {len(fails)} required check(s) failed, {len(warns)} warning(s). Fix the items above and re-run: python3 bin/doctor.py")
        return 1
    print(f"✅ All required checks passed ({len(warns)} optional item(s) not configured). "
          f"Next: python3 bin/smoke_test.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
