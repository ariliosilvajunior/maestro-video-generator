#!/usr/bin/env python3
"""
Gemini SRT Transcription — Phase 3 Step 3.1 transcriber (fal.ai-FREE).

Gemini transcription (sentence-level timestamps;
all AI generation were removed from the pipeline). Produces a standard timestamped
SRT from a video/audio file using Gemini (the same paid key already used by QC and
the link pipeline) — NO fal.ai, NO local whisper.

Drop-in CLI compatible with the old transcriber:
  python3 transcribe_gemini_srt.py <video> --output-dir <scratch> --name <Name> [--language pt]
Output: <output-dir>/<Name>.srt   (standard SRT, drop-in for srt_to_ass.py)

Pipeline: extract mono 16k audio (ffmpeg) -> resumable-upload to Gemini Files API ->
poll ACTIVE -> ask gemini-2.5-flash for sentence-level timestamped segments (JSON) ->
apply the BRAND_FIXES brand-name corrections (carried over from the fal.ai transcriber,
QCR-021/039/049/053/054/056/024) -> write SRT.

API key resolution: --api-key, GEMINI_API_KEY env, .claude/keys.md (Gemini section).
Exit codes: 0 = SRT written, 1 = failure (NEVER silently fall back to local whisper).
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile, time
import urllib.error, urllib.request

# QCR-232: VAD-anchored timing for the degenerate/tail-collapse fallbacks. Optional
# import so a missing module degrades to the legacy char-proportional spread rather
# than hard-failing transcription.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import vad_align
except Exception:  # noqa
    vad_align = None

# Shared repo helpers (lib/ at the repo root — parent of subtitle-pipeline/).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.api_keys import resolve_gemini_key as resolve_key  # noqa: E402

MODEL = os.environ.get("GEMINI_TRANSCRIBE_MODEL", "gemini-2.5-flash")  # overridden below by config transcription.model when set
BASE = "https://generativelanguage.googleapis.com"
from lib.ffmpeg import find_ffmpeg as _lib_find_ffmpeg  # noqa: E402
from lib.paths import maestro_tmp  # noqa: E402
from lib import config as _cfg  # noqa: E402
FFMPEG_CANDIDATES = [os.environ.get("MAESTRO_FFMPEG") or "", shutil.which("ffmpeg") or ""]

MAX_SEG_WORDS = 12
MAX_SEG_SECONDS = 6.0


def log(m): print(f"[transcribe_gemini_srt] {m}", file=sys.stderr)


def find_ffmpeg():
    try:
        return _lib_find_ffmpeg()
    except Exception:  # noqa: BLE001
        pass
    for c in FFMPEG_CANDIDATES:
        if c and os.path.exists(c):
            return c
    raise RuntimeError("ffmpeg not found")


def extract_audio(ffmpeg, video, out):
    subprocess.run([ffmpeg, "-y", "-i", video, "-vn", "-ac", "1", "-ar", "16000",
                    "-c:a", "aac", "-b:a", "64k", out], check=True, capture_output=True)
    pr = subprocess.run([os.path.join(os.path.dirname(ffmpeg), "ffprobe"), "-v", "quiet",
                         "-show_entries", "format=duration", "-of", "json", out],
                        check=True, capture_output=True, text=True)
    return float(json.loads(pr.stdout)["format"]["duration"])


def upload(key, path, mime="audio/mp4"):
    size = os.path.getsize(path)
    req = urllib.request.Request(
        f"{BASE}/upload/v1beta/files?key={key}", method="POST",
        headers={"X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
                 "X-Goog-Upload-Header-Content-Length": str(size),
                 "X-Goog-Upload-Header-Content-Type": mime, "Content-Type": "application/json"},
        data=json.dumps({"file": {"display_name": os.path.basename(path)}}).encode())
    with urllib.request.urlopen(req, timeout=120) as resp:
        upload_url = resp.headers.get("x-goog-upload-url")
    if not upload_url:
        raise RuntimeError("No resumable upload URL")
    with open(path, "rb") as f:
        data = f.read()
    req2 = urllib.request.Request(upload_url, method="POST",
        headers={"X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize",
                 "Content-Length": str(size)}, data=data)
    with urllib.request.urlopen(req2, timeout=300) as resp:
        info = json.loads(resp.read())
    return info["file"]["name"], info["file"]["uri"]


def wait_active(key, file_name, tries=90):
    for _ in range(tries):
        req = urllib.request.Request(f"{BASE}/v1beta/{file_name}?key={key}")
        with urllib.request.urlopen(req, timeout=30) as resp:
            state = json.loads(resp.read()).get("state")
        if state == "ACTIVE":
            return
        if state == "FAILED":
            raise RuntimeError("Gemini file processing FAILED")
        time.sleep(2)
    raise RuntimeError("Gemini file stuck PROCESSING")


def gemini_segments(key, file_uri, language, mime="audio/mp4"):
    prompt = (
        f"Transcribe this spoken audio VERBATIM in its original language (expected: {language}). "
        "Return ONLY a JSON array of segments. Each segment = {\"start\": <seconds float>, "
        "\"end\": <seconds float>, \"text\": <string>}. Rules: segments follow the speech timing "
        "AS ACCURATELY AS POSSIBLE (start/end are real audio timestamps in seconds); break at natural "
        "sentence/clause boundaries; each segment <=12 words and <=6 seconds; do NOT translate, "
        "summarize, paraphrase, or add commentary; keep numbers and punctuation as spoken. "
        "Keep the array COMPACT: at most ~60 segments for a one-minute clip. "
        "No markdown, no code fences — just the JSON array."
    )
    body = {
        "contents": [{"parts": [
            {"fileData": {"mimeType": mime, "fileUri": file_uri}},
            {"text": prompt},
        ]}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 32768, "responseMimeType": "application/json"},
    }
    req = urllib.request.Request(f"{BASE}/v1beta/models/{MODEL}:generateContent?key={key}",
        method="POST", headers={"Content-Type": "application/json"}, data=json.dumps(body).encode())
    with urllib.request.urlopen(req, timeout=300) as resp:
        result = json.loads(resp.read())
    text = result["candidates"][0]["content"]["parts"][0]["text"]
    data = _loads_segments(text)
    if isinstance(data, dict):  # tolerate {"segments": [...]}
        data = data.get("segments") or data.get("transcript") or []
    return data


def _loads_segments(text):
    """QCR: Gemini can over-segment and TRUNCATE the JSON array mid-object when it
    exceeds the output-token cap (parse error at a fixed char offset). Try a clean
    parse first; on failure, SALVAGE the longest valid prefix — trim to the last
    complete `}` and close the array — instead of failing the whole transcription."""
    text = (text or "").strip()
    # strip accidental code fences
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?|\n?```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # salvage a truncated array: keep up to the last complete object
    last = text.rfind("}")
    while last != -1:
        candidate = text[:last + 1].rstrip().rstrip(",") + "]"
        if not candidate.lstrip().startswith("["):
            candidate = "[" + candidate.lstrip().lstrip("[")
        try:
            salvaged = json.loads(candidate)
            sys.stderr.write(f"[transcribe_gemini_srt] WARN: salvaged {len(salvaged)} segments from truncated JSON\n")
            return salvaged
        except json.JSONDecodeError:
            last = text.rfind("}", 0, last)
    raise json.JSONDecodeError("unsalvageable segments JSON", text, 0)


def fmt_ts(seconds):
    if seconds < 0:
        seconds = 0.0
    ms = int(round(seconds * 1000))
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


# ── Brand-name corrections — carried over VERBATIM from transcribe_falai.py ───
# (QCR-021/039/049/053/054/056/024 — PT-BR AI brand mistranscription fixes.)
BRAND_FIXES = [
    (re.compile(r"\bchat\s*-?\s*(?:gpt|g\.?\s*p\.?\s*t|ept|jpt)\b", re.I), "ChatGPT"),
    (re.compile(r"\banth?ro?f?ic\b", re.I), "Anthropic"),
    (re.compile(r"\bopen\s*a\.?\s*i\b", re.I), "OpenAI"),
    # QCR-119: "Andrej Karpathy" misheard as "Carpate"/"André de Carpate"/
    # "Carpati"/"Carpathy" -> fold back to the brand "Karpathy" (the script tells viewers to
    # COMMENT the word "Karpathy", so the on-screen spelling must be exact). Handles the optional
    # "André/Andrej de" prefix too.
    (re.compile(r"\b(?:andr[ée]j?\s+(?:de\s+)?)?carpat[hi]?[ey]?\b", re.I), "Karpathy"),
    (re.compile(r"\bkarpat[hi]?[ey]\b", re.I), "Karpathy"),
    (re.compile(r"\bg[eê]mini\b", re.I), "Gemini"),
    # QCR-121: Alibaba's "Qwen" model misheard as "Queen"/"Quinn"/"Quin"/
    # "Quem" -> fold back to the brand "Qwen" (script names "Qwen 3.7 Max"; on-screen spelling
    # must be exact). Guard: only when followed by a version/model token (digit / "3.7" / "Max")
    # so the ordinary words "queen"/"quem" in other contexts are untouched.
    (re.compile(r"\bqu(?:een|inn?|em)\b(?=[\s,.-]*(?:\d|tr[eê]s|3[.,]?7|max))", re.I), "Qwen"),
    # QCR-250: the local-AI cluster tool "Exo" (github.com/exo-explore/exo)
    # misheard by Gemini as "Ezo"; and DeepSeek's "DeepSeek" misheard as "Deep Psyche". The CTA tells
    # viewers to COMMENT "EXO" and §1/§4 name both, so on-screen spelling must be exact. Targeted.
    (re.compile(r"\bezo\b", re.I), "Exo"),
    (re.compile(r"\bdeep\s*ps[iy]ch[ae]?\b", re.I), "Deepseek"),
    # QCR-257: Gemini misheard the tool "Context7" (github.com/upstash/context7)
    # as "Context Set"/"context set", and split the CTA keyword "CONTEXT7" into "CNT este 7". The CTA
    # comments "CONTEXT7" and §1/§4 name it, so the on-screen spelling MUST be the exact token. Match the
    # ASR variants (set/sete/7 spelled out) and fold to the one brand token.
    (re.compile(r"\bcontext[\s-]*(?:set|sete|seven|7)\b", re.I), "Context7"),
    (re.compile(r"\bc\.?\s*n\.?\s*t\.?\s*(?:este|est|set)\s*7?\b", re.I), "CONTEXT7"),
    # QCR-259: Gemini misheard Anthropic's "Claude Science" app as
    # "Cloud Science" (and "Claude Code" as "Cloud code" in prior runs) — "Claude"->"Cloud" is a
    # recurring ASR slip. Fold "Cloud Science"/"Cloud Code" back to the Claude brand (on-screen
    # spelling + CTA must be exact). Also "Jupyter" (the tool named alongside PubMed) was rendered
    # as the PT-BR planet "Júpiter" — fold to the tool spelling in our AI/coding niche.
    (re.compile(r"\bcloud\s+(science|code)\b", re.I), lambda m: "Claude " + ("Science" if m.group(1).lower()=="science" else "Code")),
    # QCR-Ccusage: the CLI "ccusage" (github.com/ccusage/ccusage, pronounced "c-c-usage")
    # is misheard by Gemini as "SeQuesAge" / "CQZade" / "cequesage" / "sequsage" / "se quesage" — the
    # on-screen brand + CTA keyword need the exact spelling. Fold the phonetic garblings (none are real
    # PT words, so this is safe) back to "ccusage", incl. the "npx <garble>" command form.
    (re.compile(r"\bnpx\s+(?:se[\s-]?ques[\s-]?age|cqz?ade|cequesage|sequs?age|sequesage|c[\s-]?c[\s-]?usage)\b", re.I), "npx ccusage"),
    (re.compile(r"\b(?:se[\s-]?ques[\s-]?age|cqz?ade|cequesage|sequs?age|sequesage|c[\s-]?c[\s-]?usage)\b", re.I), "ccusage"),
    (re.compile(r"\bj[úu]piter\b", re.I), "Jupyter"),
    (re.compile(r"\bco[\s-]?pilot\b", re.I), "Copilot"),
    # QCR-145: Microsoft "Copilot Cowork" agent — Gemini wrote "Co-work"/
    # "Co work" (hyphen/space) for the brand "Cowork". The script names "Cowork" repeatedly, so the
    # on-screen spelling must be the one-word brand. Match only the hyphen/space variant so a bare
    # "Cowork" is left untouched.
    (re.compile(r"\bco[\s-]work\b", re.I), "Cowork"),
    # QCR-262: "Cohere" (the company behind North Mini Code) misheard by
    # Gemini as "Corré"/"Corrê"/"Coré"/"Coere". The script names Cohere in §1, so on-screen spelling
    # must be the exact brand. Guard: only ACCENTED corr-/cor- forms + cohere/coere — the plain PT
    # verb "corre" (runs) is deliberately left untouched.
    (re.compile(r"\b(?:corr[éê]|cor[éê]|coh?ere?)\b", re.I), "Cohere"),
    # QCR-264: the fine-tuning tool "Unsloth" (github.com/unslothai/unsloth)
    # misheard by Gemini as "Unslot"/"Unslo"; "Google Colab" as "Google Collab" (double-l); and the open
    # models "Llama"/"Gemma" as the PT-BR words "Lhama"/"Gema". The CTA comments "UNSLOTH" and §1/§4 name
    # the tool + models, so on-screen spelling must be exact. "Gema" is fixed ONLY when it follows the
    # model list ("Deepseek ou Gema") to avoid clobbering the PT word "gema" (egg yolk).
    (re.compile(r"\bunslo(?:t|th)?\b", re.I), "Unsloth"),
    (re.compile(r"\bcoll?ab(?:e)?\b", re.I), "Colab"),
    (re.compile(r"\blhama\b", re.I), "Llama"),
    (re.compile(r"(?<=deepseek )ou gema\b", re.I), "ou Gemma"),
    (re.compile(r"\bperplexity\b", re.I), "Perplexity"),
    # QCR-267: Anthropic's model "Sonnet" (Claude Sonnet) misheard by Gemini as
    # "Sonet"/"Sonete" (single-n). §1 names "Sonnet 5" alongside "Fable 5"; on-screen spelling must be the
    # exact model brand. Fold the single-n / PT-word variants back to "Sonnet". "Fable"/"Opus"/"Haiku" are
    # normally transcribed correctly, so only the recurring "Sonet" slip is corrected here.
    (re.compile(r"\bson[eê]te?\b", re.I), "Sonnet"),
    # QCR-265: the no-code AI-agent platform "Dify" (github.com/langgenius/dify)
    # misheard by Gemini as "Dfy" (drops the vowel). The CTA comments "DIFY" and §1/§4 name the tool, so
    # the on-screen spelling MUST be the exact brand. Fold the vowel-dropped ASR variants back to "Dify".
    (re.compile(r"\bdf[iy]\b", re.I), "Dify"),
    (re.compile(r"\bdif(?:ai|ay)\b", re.I), "Dify"),
    # QCR-240: the memory plugin "claude-mem"
    # (github.com/thedotmack/claude-mem) transcribed by Gemini as "Cloudman" / "Cloud man" /
    # "Cloud mem" / "Claude mem" (drops the hyphen, mishears Claude->Cloud). The CTA tells viewers
    # to COMMENT "CONTEXTO" and §1 names the repo, so the on-screen spelling must be the exact
    # one-word brand "claude-mem". Match the misheard variants only.
    (re.compile(r"\b(?:cloud|claude)\s*-?\s*m(?:an|em|en)\b", re.I), "claude-mem"),
    # QCR-240: the open-source coding agent "OpenCode" (github.com/sst/opencode) transcribed as
    # the two-word "Open Code" -> fold to the one-word brand. In our AI-coding niche this is always
    # the brand when capitalised/listed alongside Codex/Gemini/Copilot.
    (re.compile(r"\bopen\s+code\b", re.I), "OpenCode"),
    # QCR-209: the multi-agent framework "CrewAI" (github.com/crewAIInc/crewAI)
    # transcribed by Gemini as the two-word "Crew AI" -> fold back to the one-word brand "CrewAI". The
    # CTA tells viewers to COMMENT "CREW" and §1 names the repo, so the on-screen spelling must be the
    # exact brand. Match only the spaced/hyphenated variant so a bare "crew" (the keyword) is untouched.
    (re.compile(r"\bcrew\s*-?\s*ai\b", re.I), "CrewAI"),
    # QCR-220: the open-source Android SMS-gateway app "TextBee"
    # (github.com/vernu/textbee) transcribed by Gemini as the two-word "Text B" / "Text Bee"
    # (it drops the trailing "ee" / splits the brand). The CTA tells viewers to COMMENT "SMS"
    # and §1 names the repo, so the on-screen spelling must be the exact one-word brand.
    # Match the spaced/hyphenated "Text B(ee)" variant only so ordinary "text" is untouched.
    (re.compile(r"\btext\s*-?\s*b(?:ee|e|é)?\b", re.I), "TextBee"),
    # QCR-208: "Claude" misheard as "Cloud" specifically before
    # "for Foundation Models" (the Anthropic Swift package "Claude for Foundation Models").
    # Fold the brand back so the on-screen spelling is exact. Scoped to the "... for Foundation
    # Models" context so ordinary "cloud" words elsewhere are left untouched.
    (re.compile(r"\bcloud\s+for\s+foundation\s+models\b", re.I), "Claude for Foundation Models"),
    # QCR-217: "Claude" misheard as "Cloud" before "Max" and "for Open
    # Source" (the "Claude for Open Source" program / "Claude Max" plan). Scoped to those two
    # Anthropic-product contexts so ordinary "cloud" words elsewhere are untouched.
    (re.compile(r"\bcloud(\s+max)\b", re.I), r"Claude\1"),
    (re.compile(r"\bcloud\s+for\s+open\s+source\b", re.I), "Claude for Open Source"),
    # QCR-206: the local-model runner "Ollama" misheard as "o Lama"/
    # "o lhama"/"olama"/"o lama" -> fold back to the one-word brand "Ollama". The CTA tells viewers
    # to COMMENT "OLLAMA", so the on-screen spelling must be exact. (The `codex --oss` flag, also
    # misheard as "Ollama" in a `traço traço X` context, is fixed per-run in the SRT review; too
    # context-dependent for a safe global regex.)
    (re.compile(r"\bo+\s*l+(?:h)?ama\b", re.I), "Ollama"),
    # QCR-210: "ScrapeGraphAI" (github.com/ScrapeGraphAI/Scrapegraph-ai)
    # misheard by Gemini as "Scrapegraffi AI" / "Scrape graffi" / "Scrape graph AI" / "Scrapegraph"
    # -> fold back to the one-word brand "ScrapeGraphAI". The CTA tells viewers to COMMENT "SCRAPER"
    # and §1 names the repo, so the on-screen spelling must be exact.
    (re.compile(r"\bscrape\s*-?\s*graf+i?(?:\s*ai)?\b", re.I), "ScrapeGraphAI"),
    (re.compile(r"\bscrape\s*-?\s*graph\s*-?\s*ai\b", re.I), "ScrapeGraphAI"),
    # QCR-142: Google tool names. "Notebook LM"/"notebook l.m." ->
    # one-word brand "NotebookLM"; "Pomeli/Pomelly/Pomely" (Google Labs Pomelli) -> "Pomelli".
    (re.compile(r"\bnotebook\s*-?\s*l\.?\s*m\.?\b", re.I), "NotebookLM"),
    (re.compile(r"\bpome?l+[iy]\b", re.I), "Pomelli"),
    # QCR-128: "CodePath" (Anthropic's Claude Corps nonprofit partner)
    # misheard/spaced as "Code Path" -> fold back to the one-word brand "CodePath".
    (re.compile(r"\bcode\s*-?\s*path\b", re.I), "CodePath"),
    # QCR-144: "VS Code" (Microsoft VS Code) misheard/spelled out by
    # Gemini as "V esse code" / "vis code" / "ves code" / "vs-code" -> fold back to the brand "VS Code".
    # Anchored on the v-prefix before "code" so it never touches "Claude Code" or a bare "code".
    (re.compile(r"\b(?:v\s*esse|v[ií]s|v[eê]s|vs)\s*-?\s*code\b", re.I), "VS Code"),
    # QCR-148: the Claude Code memory file "CLAUDE.md" spoken as
    # "Claude ponto M D" was transcribed "cloud.md" / "claude.md" -> fold to the exact filename
    # "CLAUDE.md". Anchored on the ".md" suffix so it never touches a bare "cloud"/"Claude".
    (re.compile(r"\b(?:cloud|cl[aá]ud[eio])\.?\s*md\b", re.I), "CLAUDE.md"),
    # QCR-113: "Polsia" (polsia.com, AI co-founder) misheard as
    # "Pólcia"/"Polícia"/"Polca"/"Polsa" -> fold back to the brand "Polsia".
    (re.compile(r"\bp[oó]l[scç]i?[ao]\b", re.I), "Polsia"),
    (re.compile(r"\bcl(?:aud[eio]?|ode|od|[óô]de?|[óô])\b", re.I), "Claude"),
    (re.compile(r"\bcl[aá]udi[oa]?\b", re.I), "Claude"),   # QCR-107: "Cláudio/Cláudia" mishear (accented) -> Claude
    (re.compile(r"\bcowork[s]?\b", re.I), "Cowork"),       # QCR-107: keep Cowork casing
    (re.compile(r"\b(criadora do|rival do|no|na|o|a|do|da|seu|sua|meu|minha|teu|tua|nesse|neste|pelo|pela)\s+cloud\b", re.I),
     lambda m: f"{m.group(1)} Claude"),
    (re.compile(r"\bcloud\b(?=\s+(?:está|é|foi|faz|pode|consegue|vai|tem|deixa|escreve|responde|entende|gera|fica|custa|cobra|aprende|trava|alucina|melhora|piora|processa|lê|cria))", re.I),
     "Claude"),
    # QCR-063: "Banana Skill Cloud"/"Skill Cloud" -> Claude. The skill-name search-term context
    # ("pesquise por Banana Skill Claude") escapes the preposition/verb cloud rules above; guarded
    # to "skill cloud" so generic "cloud computing" is untouched. (seen on a real run.)
    (re.compile(r"\b(banana\s+skill|skill)\s+cloud\b", re.I), lambda m: f"{m.group(1)} Claude"),
    # QCR-069: "Cloud Code" -> "Claude Code" (ASR mishears "Claude Code" as "Cloud Code",
    # incl. "Everything Cloud Code"). "Cloud" here is bracketed by "Code" so the preposition/
    # verb cloud rules above miss it. Safe: "cloud" immediately followed by "code".
    (re.compile(r"\bcloud\s+code\b", re.I), "Claude Code"),
    # QCR-164: "Cloud Corps" -> "Claude Corps" (ASR mishears the
    # Anthropic "Claude Corps" program name as "Cloud Corps", same family as QCR-069). "cloud"
    # immediately followed by "corps" is unambiguously the Claude Corps brand.
    (re.compile(r"\bcloud\s+corps\b", re.I), "Claude Corps"),
    # QCR-187: the company "Anthropic" is mis-heard as "Antropi(c)" /
    # "Antrofi" / "Antropi que" (the unstressed "Anthro-" + soft "-pic" ending). Caught when
    # "A Antropi que acabou de lançar o Claude Design" should be "A Anthropic acabou de...".
    # Match the broken spellings (optionally the spurious "que" the ASR inserts for the "-pic"
    # syllable) so the brand renders correctly. Real word "antropologia" etc. is untouched
    # (requires the standalone token ending, not a prefix).
    (re.compile(r"\bantr[oô][pf]?i(?:c|que|qui)?(?:\s+que)?\b", re.I), "Anthropic"),
    # QCR-109: "no terminal continua escrito Cloud" — ASR
    # mishears "Claude" as "Cloud" when followed by "quando" (not a verb in the rule above).
    # "escrito Cloud" is unambiguously the Claude brand (you see "Claude" written in the terminal).
    (re.compile(r"\b(escrito|escreve|aparece|diz)\s+cloud\b", re.I), lambda m: f"{m.group(1)} Claude"),
    # QCR-157: "do/no/ao/o Cloud" (MASCULINE article) -> Claude. The Claude
    # brand is masculine ("o Claude", "decisão do Claude"); generic cloud is feminine ("a cloud",
    # "na cloud"), so a masculine article before "Cloud" is unambiguously the brand. Caught when
    # "questiona cada decisão do Cloud para" should be "do Claude para" (QC -1 SUBTITLE_TIMING).
    (re.compile(r"\b(do|no|ao|o)\s+cloud\b", re.I), lambda m: f"{m.group(1)} Claude"),
    # QCR-169: "um time de Clouds" -> "um time de Claudes" — ASR
    # mishears the PLURAL Claude brand (multiple Claude instances, "a Anthropic usa um time de
    # Claudes") as "Clouds". Anchored on team/quantity words + "de clouds" so generic plural sky
    # "clouds" (e.g. "the clouds in the sky") is never touched.
    (re.compile(r"\b(time|times|grupo|equipe|ex[ée]rcito|v[áa]rios|dois|tr[êe]s)\s+de\s+clouds\b", re.I),
        lambda m: f"{m.group(1)} de Claudes"),
    (re.compile(r"\bchama\s+Markdown\b", re.I), "chama MarkItDown"),
    (re.compile(r"\b(criadora do|criador do|rival do)\s+COD\b"), lambda m: f"{m.group(1)} Claude"),
    (re.compile(r"\bMito\b(?=\s+(?:\d+|cinco\b))", re.I), "Mythos"),
    # QCR-108: "classe mitos/Mitos" (Mythos-class) plural mishear -> Mythos.
    (re.compile(r"\bclasse\s+mitos\b", re.I), "classe Mythos"),
    (re.compile(r"\bmitos\b(?=\s+(?:liberad|p[uú]blic|class))", re.I), "Mythos"),
    # QCR-108: "compósio/composio/compôsio" (Composio, the 1000+-app MCP connector) mishear.
    (re.compile(r"\bcomp[óôo]sio\b", re.I), "Composio"),
    (re.compile(r"\b(segunda|ter[çc]a|quarta|quinta|sexta)\s+-\s*feira\b", re.I), lambda m: f"{m.group(1)}-feira"),
    (re.compile(r"\bn[ãa]o\s+-(?=[A-Za-zÀ-ú])"), "não "),
    (re.compile(r"(?<=\d)\s+\.(?=\d)"), "."),
    (re.compile(r"\bpix\s*art\b", re.I), "PicsArt"),
    # QCR-071: MCP-server tool names Gemini mishears.
    # "Playright"/"Play Wright"/"Plei rait" -> Playwright (the browser-automation MCP).
    (re.compile(r"\bplay\s?-?\s?(?:w?right|wrigth|rait)\b", re.I), "Playwright"),
    # QCR-106: Gemini mishears "Higgsfield" (the AI video
    # tool / MCP connector) as "Riggsfield" (R->H), and other near-spellings. Fold them back.
    (re.compile(r"\b(?:riggs?|higgs|hicks|higs|rigs)[\s-]?fie?ld\b", re.I), "Higgsfield"),
    # "Gliff"/"Glif"/"Glife" -> Glyph, guarded to the "MCP" context so the everyday word is safe.
    (re.compile(r"\bgl[ií]ff?e?\b(?=\s+MCP)", re.I), "Glyph"),
    # "Fire crawl"/"Firecraw" spacing/clipping -> Firecrawl (guarded to MCP context).
    (re.compile(r"\bfire\s?-?\s?craw?l?\b(?=\s+MCP)", re.I), "Firecrawl"),
    # QCR-073: Emergence-experiment brand mishears.
    # "Emergency" (English form Gemini emits for the AI lab "Emergence") -> Emergence.
    # Guarded to the English spelling so the PT word "emergência" is untouched.
    (re.compile(r"\bemergency\b", re.I), "Emergence"),
    # "Grock"/"Grokk" -> Grok (xAI chatbot); "grock" is not a real word so unguarded is safe.
    (re.compile(r"\bgro+ck+\b", re.I), "Grok"),
    # "botes"/"bote" (AI agents) -> bots, guarded to an AI-brand context so the PT word
    # "botes" (boats) stays safe. ASR rendered "bots do Gemini" as "botes do Gemini".
    (re.compile(r"\bbotes?\b(?=\s+(?:do|da|de|dos|das)\s+(?:Gemini|Grok|Claude|ChatGPT|OpenAI|IA))", re.I), "bots"),
    # QCR-074: "Air LLM"/"Air L L M" (spaced) -> AirLLM (the
    # open-source library). Unguarded is safe — "air llm" is never a real two-word phrase.
    (re.compile(r"\bair\s*-?\s*l\s*l\s*m\b", re.I), "AirLLM"),
    # "Lhama"/"Lama" (PT mishears of the Meta model "Llama") -> Llama, guarded to a following
    # version number so the PT animal word "lhama"/"lama" (llama/mud) stays safe elsewhere.
    (re.compile(r"\bl[hl]?ama\b(?=\s+\d)", re.I), "Llama"),
    # QCR-094: Microsoft Scout stack names Gemini mishears.
    # "Open Claw"/"OpenClaw" spacing -> OpenClaw (the open-source agent framework Scout is built on).
    (re.compile(r"\bopen\s*-?\s*claw\b", re.I), "OpenClaw"),
    # "Work e Key"/"Work IQ" (ASR renders the spoken "Work IQ" as "Work e Key"/"Work I Q") -> Work IQ
    # (Microsoft's workplace-intelligence layer). Guarded to the Work-prefixed forms so generic text is safe.
    (re.compile(r"\bwork\s+(?:e\s+key|i\.?\s*q|iq|e\s+q)\b", re.I), "Work IQ"),
    # QCR-278: "Crabbox" (github.com/openclaw/crabbox, the cloud-sandbox CLI
    # from the OpenClaw creator) misheard by Gemini as "Crabox" (single-b) / "Crab box" (spaced). §1/§4
    # name the tool and the CTA comments "CRAB", so the on-screen spelling must be the exact one-word
    # brand. Match crab+one-or-more-b+ox AND the spaced "crab box" — the bare keyword "Crab" is left
    # untouched (no trailing ox/box), so the CTA keyword never collides.
    (re.compile(r"\bcrab+ox\b", re.I), "Crabbox"),
    (re.compile(r"\bcrab\s+box\b", re.I), "Crabbox"),
]


# USER EXTENSIONS: config/brand_fixes.json = [{"pattern": "regex", "replace": "Brand"}] (case-insensitive)
_USER_FIXES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "brand_fixes.json")
if os.path.exists(_USER_FIXES):
    try:
        for _row in json.load(open(_USER_FIXES, encoding="utf-8")):
            BRAND_FIXES.append((re.compile(_row["pattern"], re.I), _row["replace"]))
    except Exception as _e:  # noqa: BLE001
        print(f"[transcribe_gemini_srt] WARN: could not load config/brand_fixes.json: {_e}", file=sys.stderr)


def correct_brands(text):
    for pat, repl in BRAND_FIXES:
        text = pat.sub(repl, text)
    return text


def rejoin_cross_segment_brands(segs):
    """QCR-072: heal a brand name SPLIT across two adjacent segments (e.g. one segment ends
    in 'chat' and the next starts with 'GPT' -> 'ChatGPT'). correct_brands runs per-segment, so a
    brand straddling the segment boundary is never matched. Here we test each boundary word-pair:
    if joining them collapses (via BRAND_FIXES) into a single no-space brand token, fold the
    corrected token onto the previous segment and drop the leading fragment from the next one.
    (a real run had 'o chat' / 'GPT analisa' split across two entries — manual edit.)"""
    for i in range(len(segs) - 1):
        aw, bw = segs[i]["text"].split(), segs[i + 1]["text"].split()
        if not aw or not bw:
            continue
        joined = correct_brands(aw[-1] + " " + bw[0])
        if " " not in joined and joined != aw[-1] + " " + bw[0] \
                and joined.lower() not in (aw[-1].lower(), bw[0].lower()):
            aw[-1] = joined
            segs[i]["text"] = " ".join(aw)
            segs[i + 1]["text"] = " ".join(bw[1:])
    return [s for s in segs if s["text"].strip()]


def split_long(seg):
    """Split a segment that exceeds MAX_SEG_WORDS / MAX_SEG_SECONDS into even pieces."""
    words = seg["text"].split()
    dur = seg["end"] - seg["start"]
    n = max(1, max((len(words) + MAX_SEG_WORDS - 1) // MAX_SEG_WORDS,
                   int(dur // MAX_SEG_SECONDS) + (1 if dur % MAX_SEG_SECONDS > 0.01 else 0)))
    if n <= 1 or not words:
        return [seg]
    per = (len(words) + n - 1) // n
    out, t0 = [], seg["start"]
    step = dur / n
    for i in range(0, len(words), per):
        chunk = " ".join(words[i:i + per])
        s = seg["start"] + (i / max(len(words), 1)) * dur
        e = min(seg["end"], s + step)
        out.append({"start": s, "end": max(e, s + 0.3), "text": chunk})
    return out


def to_srt(segments, duration, speech_runs=None):
    clean = []
    for s in segments:
        try:
            st = float(s.get("start", 0)); en = float(s.get("end", st + 1))
        except (TypeError, ValueError):
            continue
        txt = (s.get("text") or "").strip()
        if not txt:
            continue
        st = max(0.0, min(st, duration))
        en = max(st + 0.3, min(en, duration))
        clean.append({"start": st, "end": en, "text": txt})
    clean.sort(key=lambda x: x["start"])
    # QCR-074: degenerate-timestamp guard. On some clips
    # gemini-2.5-flash returns COLLAPSED timestamps (all near 0, total span << audio
    # duration, non-monotonic) that re-running does NOT fix (QCR-069 "re-run once" fails
    # here). The TEXT + sentence segmentation are still correct, so rather than ship
    # broken timing (or fall back to forbidden whisper), redistribute the segments
    # PROPORTIONALLY BY TEXT LENGTH across the real audio duration. TTS narration is
    # near-uniform pace, so char-proportional spacing tracks the speech closely.
    if clean and duration > 1.0:
        span = clean[-1]["end"] - clean[0]["start"]
        if span < 0.5 * duration:
            # QCR-232: prefer VAD-anchored timing (captions land on real speech,
            # pauses stay empty, per-run pace removes the cumulative lag that made
            # reel DaEFB_vy8sV ship "extremely delayed"). Fall back to the legacy
            # full-duration char spread only when VAD is unavailable/unusable.
            if vad_align is not None and speech_runs:
                vad_align.redistribute_over_speech(clean, speech_runs, duration)
                log(f"[guard] degenerate timestamps (span {span:.2f}s << {duration:.0f}s audio) "
                    f"-> VAD-anchored over {len(speech_runs)} speech runs (QCR-232)")
            else:
                total_chars = sum(max(len(c["text"]), 1) for c in clean)
                t = 0.0
                for c in clean:
                    seg_dur = (max(len(c["text"]), 1) / total_chars) * duration
                    c["start"] = t
                    c["end"] = min(duration, t + seg_dur)
                    t = c["end"]
                log(f"[guard] degenerate timestamps (span {span:.2f}s << {duration:.0f}s audio) "
                    f"-> redistributed {len(clean)} segments proportionally by text length "
                    f"(no VAD — legacy spread)")
    # QCR-124: PARTIAL TAIL-COLLAPSE guard. The global degenerate
    # guard above only fires when the WHOLE span is short; it MISSES the common case where the
    # body is timed correctly but the final N sentences are crammed into a near-zero-duration
    # cluster at the very end (here entries 24-30 all sat at ~73s while 1-23 were fine), because
    # the overall span still looks full. Detect the trailing run of "bad" segments — collapsed
    # (dur<0.4s) OR over-stretched (char-rate <4 chars/s, i.e. a 2-word fragment given 4s) OR
    # non-monotonic — anchor at the last sane segment, and redistribute the bad run proportionally
    # by text length across [anchor_end, duration]. TTS pace is near-uniform so this tracks speech.
    if clean and duration > 1.0 and len(clean) >= 3:
        def _bad(seg, prev_start):
            d = seg["end"] - seg["start"]
            rate = max(len(seg["text"]), 1) / d if d > 0 else 0
            return d < 0.4 or rate < 4.0 or seg["start"] < prev_start - 0.01
        j = len(clean)
        while j - 1 >= 1:
            prev_start = clean[j - 2]["start"] if j - 2 >= 0 else 0.0
            if _bad(clean[j - 1], prev_start):
                j -= 1
            else:
                break
        run = clean[j:]
        if len(run) >= 2 and j >= 1:
            anchor_end = clean[j - 1]["end"]
            if duration - anchor_end > 1.0:
                # QCR-232: VAD-anchor the tail run over the real speech in
                # [anchor_end, duration] when available; else legacy char spread.
                tail_runs = None
                if vad_align is not None and speech_runs:
                    tail_runs = [(max(s, anchor_end), e) for s, e in speech_runs
                                 if e > anchor_end + 0.05]
                if tail_runs:
                    vad_align.redistribute_over_speech(run, tail_runs, duration)
                    log(f"[guard] tail-collapse: VAD-anchored last {len(run)} segments "
                        f"across {anchor_end:.1f}-{duration:.0f}s over {len(tail_runs)} "
                        f"speech runs (body timing kept, QCR-232)")
                else:
                    total = sum(max(len(c["text"]), 1) for c in run)
                    t = anchor_end
                    for c in run:
                        d = (max(len(c["text"]), 1) / total) * (duration - anchor_end)
                        c["start"] = t
                        c["end"] = min(duration, t + d)
                        t = c["end"]
                    log(f"[guard] tail-collapse: redistributed last {len(run)} segments across "
                        f"{anchor_end:.1f}-{duration:.0f}s (body timing kept, legacy spread)")
    # QCR-095: TAIL-DROP guard. gemini-2.5-flash sometimes
    # drops the FINAL spoken clause from its segment array (the salvage/compaction in
    # _loads_segments can also trim the tail), so the last subtitle ends seconds before
    # the audio does and the closing line ships UNCAPTIONED. We cannot re-fabricate the
    # missing words here, but we MUST NOT ship it silently: warn loudly when the last
    # segment ends >2.5s before the audio ends so the agent appends the missing clause.
    if clean and duration > 1.0:
        tail_gap = duration - clean[-1]["end"]
        if tail_gap > 2.5:
            sys.stderr.write(
                f"\n[transcribe_gemini_srt] *** WARN TAIL-DROP: last subtitle ends at "
                f"{clean[-1]['end']:.1f}s but audio is {duration:.1f}s ({tail_gap:.1f}s "
                f"uncaptioned). Gemini likely dropped the final spoken clause — LISTEN to "
                f"the tail and APPEND the missing SRT entry before burning. ***\n\n")
    expanded = []
    for s in clean:
        expanded.extend(split_long(s))
    if not expanded:
        raise RuntimeError("Gemini returned no usable segments")
    expanded = rejoin_cross_segment_brands(expanded)  # QCR-072: heal split brand names
    lines = []
    for i, s in enumerate(expanded, 1):
        lines.append(f"{i}\n{fmt_ts(s['start'])} --> {fmt_ts(s['end'])}\n{correct_brands(s['text'])}\n")
    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser(description="Transcribe video to SRT via Gemini (fal.ai-free)")
    p.add_argument("video")
    p.add_argument("--output-dir", default=maestro_tmp())
    p.add_argument("--name", default="")
    p.add_argument("--language", default=(_cfg.get("brand.language", "pt-BR") or "pt-BR").split("-")[0].lower())
    p.add_argument("--api-key", default="")
    args = p.parse_args()

    global MODEL
    if not os.environ.get("GEMINI_TRANSCRIBE_MODEL") and _cfg.get("transcription.model"):
        MODEL = _cfg.get("transcription.model")
    video = os.path.expanduser(args.video)
    if not os.path.exists(video):
        log(f"ERROR: input not found: {video}"); return 1
    name = args.name or os.path.splitext(os.path.basename(video))[0]
    os.makedirs(args.output_dir, exist_ok=True)
    srt_path = os.path.join(args.output_dir, f"{name}.srt")
    t0 = time.time()
    try:
        key = resolve_key(args.api_key)
        if not key:
            log("ERROR: no Gemini API key (—api-key / GEMINI_API_KEY / .claude/keys.md)"); return 1
        ffmpeg = find_ffmpeg()
        with tempfile.TemporaryDirectory() as tmp:
            audio = os.path.join(tmp, f"{name}.m4a")
            duration = extract_audio(ffmpeg, video, audio)
            log(f"[1/4] audio {duration:.1f}s, {os.path.getsize(audio)//1024} KB")
            # QCR-232: detect real speech runs WHILE the audio exists (the temp dir
            # is torn down right after this block) so the timing guards can anchor
            # captions to speech instead of blindly char-packing the timeline.
            speech_runs = []
            if vad_align is not None:
                try:
                    speech_runs = vad_align.speech_runs(audio)
                    log(f"[vad] {len(speech_runs)} speech runs, "
                        f"{vad_align.speech_total(speech_runs):.1f}s voiced / {duration:.1f}s")
                except Exception as e:  # noqa
                    log(f"[vad] speech-run detection failed ({e}); guards use legacy spread")
            fn, uri = upload(key, audio)
            wait_active(key, fn)
            log("[2/4] uploaded + ACTIVE")
            segs = gemini_segments(key, uri, args.language)
            log(f"[3/4] {len(segs)} raw segments")
        srt = to_srt(segs, duration, speech_runs)
        open(srt_path, "w", encoding="utf-8").write(srt)
        n = srt.count("-->")
        log(f"[4/4] SRT written: {srt_path} ({n} entries) in {time.time()-t0:.1f}s")
        print(srt_path)
        return 0
    except urllib.error.HTTPError as e:
        log(f"ERROR: Gemini HTTP {e.code}: {e.read().decode()[:300]}"); return 1
    except Exception as e:  # noqa
        log(f"ERROR: {e}")
        log("Do NOT fall back to local whisper without explicit user approval.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
