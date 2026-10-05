#!/usr/bin/env python3
"""
verify_caption_sync.py — WINDOW-LEVEL caption<->audio alignment gate  (QCR-229)

WHY THIS EXISTS
---------------
A real reel shipped with several captions that did not match the
words being spoken at that moment. Root cause: the §3b (PremiumKineticCaption) and §5b
(PremiumAvatarCaption) "caption" sections are HAND-AUTHORED free text in the Remotion
.tsx, decoupled from the SRT. The burned subtitle is (correctly) SUPPRESSED inside those
windows (suppress_windows.py) — the big motion caption IS the subtitle there — so when the
hand-authored caption is off by a section, the ONLY on-screen text is wrong and the burned
fallback is gone. Concrete failures observed:
  • W[5] 13.8-15.91 showed "Sem mensalidade, sem limite"  (audio there: "sem pagar um
    centavo nunca mais"   — that caption text is actually spoken at 11.4-13.8) -> ~2s late
  • W[8] 21.0-24.42 showed "Instala uma vez, gera pra sempre" (audio there: "para sempre,
    rodando ate numa placa de video simples" — spoken at 17.7-21.0) -> ~3s late

The prior guard verify_audio_subtitle_match.py is a WHOLE-VIDEO bag-of-words containment
check; it PASSES this video (~0.9) because every caption word is spoken *somewhere*. It has
no concept of "right words, WRONG time window". This script is that missing temporal gate.

WHAT IT DOES (deterministic, no API, instant)
---------------------------------------------
1. Parses the SRT (ground-truth audio timing) into a per-WORD timeline by distributing each
   cue's words evenly across the cue's duration (the same proportional model the burn uses).
2. Loads the caption sections (window + text) shown where the burned subtitle is suppressed:
     --segments <Name>_caption_segments.json   (preferred single source of truth), OR
     --tsx <comp>.tsx                           (fallback: parse sectionWindows + caption props)
3. For each caption window [s,e]:
     spoken  = normalized content words whose midpoint falls in [s,e]
     caption = normalized content words of the on-screen caption text
     containment = |caption ∩ spoken| / |caption|   (how much of the caption is truly
                                                      spoken inside its own window)
   Distilled CTA captions (groups=[...]) still pass: their keyword IS spoken in-window.
4. PASS (exit 0) iff EVERY caption window's containment >= threshold. Any window below
   threshold => FAIL (exit 1), printing the offending window, what it shows, and what the
   audio actually says there. Also WARNs (never fails) when a window edge is far from any
   SRT sentence boundary (mid-sentence windows invite partial drift).

USAGE
-----
  python3 verify_caption_sync.py --srt <scratch>/<Name>.srt \
      (--segments ~/Downloads/<Name>_caption_segments.json | --tsx <comp>.tsx) \
      [--threshold 0.5] [--name Tag]

Exit: 0 = all caption windows match their audio (PASS), 1 = at least one MISMATCH / error.
"""
import argparse, json, os, re, sys, unicodedata

# A caption whose content words are <THRESHOLD spoken inside its own window is "wrong text".
# 0.5 cleanly separates the real failures (W5=0.00, W8≈0.2 on a real run) from the acceptable
# windows (verbatim/near-verbatim reveals score 0.67-1.0). Tune via --threshold.
DEFAULT_THRESHOLD = 0.5
# A window edge farther than this from any SRT cue boundary is flagged (WARN only): a window
# that starts/ends mid-sentence guarantees the caption straddles two spoken sentences.
SNAP_TOL = 0.45

STOPWORDS = set("""
a o e de da do das dos que em um uma uns umas no na nos nas para pra por com sem se sua seu
suas seus ao aos as os à às é era foi ser ter tem tinha mais mas ja já como ou isso isto
esse essa este esta eles elas ele ela voce você vc nao não sim muito muita pouco entao
então tudo todo toda nada quando onde porque pois sobre entre depois antes ate até cada vai
the a an and or of to in on for with without is are was were be been being it this that
these those you your we our they them he she his her at as by from into about
""".split())


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def light_stem(tok):
    # Fold the most common PT inflections so paga/pagar, imagem/imagens don't false-fail.
    for suf in ("ndo", "aram", "amos", "aria", "ar", "er", "ir", "ou", "am", "as", "os", "es", "a", "o", "e", "s"):
        if len(tok) - len(suf) >= 4 and tok.endswith(suf):
            return tok[: -len(suf)]
    return tok


def norm_tokens(text, stem=True):
    text = strip_accents((text or "").lower()).replace("\\n", " ").replace("\\N", " ")
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    out = []
    for t in text.split():
        if len(t) <= 1 or t in STOPWORDS:
            continue
        out.append(light_stem(t) if stem else t)
    return out


# ── SRT → per-word timeline ──────────────────────────────────────────────────
def parse_srt(path):
    cues = []
    blocks = re.split(r"\n\s*\n", open(path, encoding="utf-8", errors="replace").read().strip())
    for b in blocks:
        m = re.search(r"(\d\d):(\d\d):(\d\d)[,\.](\d{1,3})\s*-->\s*(\d\d):(\d\d):(\d\d)[,\.](\d{1,3})", b)
        if not m:
            continue
        g = [int(x) for x in m.groups()]
        s = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000.0
        e = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000.0
        text = " ".join(ln for ln in b.splitlines() if "-->" not in ln and not re.match(r"^\s*\d+\s*$", ln))
        cues.append((s, e, text.strip()))
    return cues


def word_timeline(cues):
    """[(midpoint_seconds, normalized_token), ...] across the whole clip."""
    tl = []
    for s, e, text in cues:
        raw = [w for w in re.split(r"\s+", text) if w]
        n = len(raw) or 1
        dur = max(e - s, 1e-3)
        for i, w in enumerate(raw):
            mid = s + (i + 0.5) / n * dur
            for tok in norm_tokens(w):
                tl.append((mid, tok))
    return tl


def boundaries(cues):
    b = set()
    for s, e, _ in cues:
        b.add(round(s, 3)); b.add(round(e, 3))
    return sorted(b)


# ── caption segments source ──────────────────────────────────────────────────
def load_segments_json(path):
    data = json.load(open(path, encoding="utf-8"))
    segs = []
    for x in data:
        win = x.get("win") or [x.get("start"), x.get("end")]
        segs.append({"win": [float(win[0]), float(win[1])],
                     "text": x.get("text", ""), "kind": x.get("kind", "caption")})
    return segs


def parse_tsx(path):
    """Fallback: extract sectionWindows boundaries + the §3b/§5b caption text per W[idx]."""
    src = open(path, encoding="utf-8").read()
    m = re.search(r"sectionWindows\s*\([^,]+,\s*\[([^\]]+)\]", src, re.S)
    if not m:
        raise ValueError("could not find sectionWindows([...]) in tsx")
    nums = [float(n) for n in re.findall(r"[-+]?\d+\.?\d*", m.group(1))]
    segs = []

    def win_of(idx):
        if idx + 1 < len(nums):
            return [nums[idx], nums[idx + 1]]
        return [nums[idx], nums[idx]]

    # Each caption Sequence references its window as {...W[N]} or w={W[N]}; the caption text
    # is the text="..." prop (reveal/avatarcap) or groups={[...]} (distilled CTA).
    pat = re.compile(
        r"\{\.\.\.W\[(\d+)\]\}\s*>\s*<Premium(KineticCaption|AvatarCaption)\b(.*?)/>",
        re.S)
    for mm in pat.finditer(src):
        idx = int(mm.group(1)); body = mm.group(3)
        tm = re.search(r'text\s*=\s*"((?:[^"\\]|\\.)*)"', body)
        if tm:
            text = tm.group(1)
        else:
            gm = re.search(r"groups\s*=\s*\{\[([^\]]*)\]\}", body)
            text = " ".join(re.findall(r'"([^"]*)"', gm.group(1))) if gm else ""
        segs.append({"win": win_of(idx), "text": text,
                     "kind": "groups" if "groups" in body else ("avatarcap" if mm.group(2) == "AvatarCaption" else "reveal")})
    # Also catch the w={W[N]} form used by PremiumAvatarCaption.
    pat2 = re.compile(r"<PremiumAvatarCaption\s+w=\{W\[(\d+)\]\}(.*?)/>", re.S)
    seen = {s["win"][0] for s in segs}
    for mm in pat2.finditer(src):
        idx = int(mm.group(1)); body = mm.group(2)
        w = win_of(idx)
        if w[0] in seen:
            continue
        tm = re.search(r'text\s*=\s*"((?:[^"\\]|\\.)*)"', body)
        segs.append({"win": w, "text": tm.group(1) if tm else "", "kind": "avatarcap"})
    return segs


def spoken_in_window(tl, s, e):
    return [tok for (mid, tok) in tl if s - 1e-6 <= mid <= e + 1e-6]


def near_boundary(t, bnds):
    return any(abs(t - b) <= SNAP_TOL for b in bnds)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--srt", required=True)
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--segments", help="<Name>_caption_segments.json [{win:[s,e],text,kind}]")
    src.add_argument("--tsx", help="Remotion composition .tsx (fallback parser)")
    p.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    p.add_argument("--name", default="caption_sync")
    a = p.parse_args()

    if not os.path.exists(a.srt):
        print(f"[caption_sync] ERROR srt not found: {a.srt}", file=sys.stderr); return 1
    try:
        segs = load_segments_json(a.segments) if a.segments else parse_tsx(a.tsx)
    except Exception as e:
        print(f"[caption_sync] ERROR loading caption segments: {e}", file=sys.stderr); return 1
    if not segs:
        print("[caption_sync] no caption sections found — nothing to check (PASS)"); return 0

    cues = parse_srt(a.srt)
    if not cues:
        print(f"[caption_sync] ERROR no cues parsed from {a.srt}", file=sys.stderr); return 1
    tl = word_timeline(cues)
    bnds = boundaries(cues)

    print(f"[caption_sync] {a.name}: checking {len(segs)} caption window(s), threshold={a.threshold:.2f}")
    failures = []
    for sg in sorted(segs, key=lambda x: x["win"][0]):
        s, e = sg["win"]
        cap = norm_tokens(sg["text"])
        spoke = spoken_in_window(tl, s, e)
        sset = set(spoke)
        cont = (sum(1 for t in cap if t in sset) / len(cap)) if cap else 1.0
        status = "OK " if cont >= a.threshold else "BAD"
        if cont < a.threshold:
            failures.append(sg)
        edge = "" if (near_boundary(s, bnds) and near_boundary(e, bnds)) else "  ⚠ off-boundary window"
        print(f"  [{status}] {s:6.2f}-{e:6.2f}  cont={cont:.2f}  shows={sg['text']!r}{edge}")
        if cont < a.threshold:
            raw = " ".join(tok for mid, tok in tl if s <= mid <= e)
            print(f"         audio says here: {raw!r}")

    if failures:
        print(f"\n[caption_sync] FAIL — {len(failures)} caption window(s) do NOT match the audio "
              f"spoken there. The burned subtitle is suppressed in these windows, so the wrong "
              f"text is the ONLY thing on screen. Fix: set each §3b/§5b caption to the VERBATIM "
              f"SRT words spoken in its OWN window and snap the window to the SRT sentence "
              f"boundaries, then re-emit caption_segments.json / re-render. Do NOT post (QCR-229).")
        return 1
    print(f"\n[caption_sync] PASS — every caption window matches its spoken audio.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
