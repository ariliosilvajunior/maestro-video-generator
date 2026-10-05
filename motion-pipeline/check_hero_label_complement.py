#!/usr/bin/env python3
"""
check_hero_label_complement.py — Phase-5 pre-render gate (QCR-112 / QCR-326b).

Deterministically enforces the COMPLEMENT RULE on premium §4 hero LABELS so a
label that reuses 4+ CONSECUTIVE words from its time-concurrent burned subtitle
can never ship unattended. This automates the recurring MANUAL "diff each hero
label vs the concurrent SRT" step (QCR-112) that keeps being skipped and costing
a real -5 MOTION_DUPLICATE at QC (a real run at 0:10.6: "O VÍDEO PRONTO PRA POSTAR"
vs subtitle "vídeo pronto pra postar." = 4 consecutive → grade 95, and the same
family on the runs logged at active-rules.md:1683/2128/2756).

WHAT IT CHECKS (§4 hero labels ONLY — §3b/§5b captions are EXEMPT because they
ARE the suppressed-subtitle line, QCR-193):
  For every §4 HeroScene `label=` / `PremiumLabel` string in the composition,
  find the burned ASS/SRT subtitle SCREENS whose time window overlaps that
  label's section window, and compute the max CONSECUTIVE shared word run
  against each individual screen (never a concatenation across screens —
  QCR-020/072/319). If any label shares >=4 consecutive words with a single
  concurrent subtitle screen, FAIL (exit 1) and print the offending label so
  the author distills it (e.g. "O VÍDEO PRONTO PRA POSTAR" -> "PRONTO PRA
  MONETIZAR" / "SEU VÍDEO ENTREGUE").

Matching is done against the burned ASS screens when a .ass is available (that
is exactly what renders on screen), falling back to the SRT cues otherwise.

USAGE:
  python3 motion-pipeline/check_hero_label_complement.py \
      --tsx motion-pipeline/remotion-agent/src/compositions/<Name>Motion.tsx \
      --ass ~/Downloads/<Name>.ass          # preferred (on-screen screens)
      [--srt ~/Downloads/<Name>.srt]        # fallback if no .ass
      [--plan ~/Downloads/<Name>_visual_plan.json]   # to map label->window by §4 id
Exit 0 = PASS (no §4 hero label hits 4+ consecutive). Exit 1 = FAIL.
"""
import argparse, json, os, re, sys, unicodedata

MAX_CONSEC = 3  # a label may share at most 3 consecutive words; 4+ is a MOTION_DUPLICATE


def _norm_words(s):
    s = s.replace("\\N", " ")
    s = re.sub(r"\{[^}]*\}", " ", s)          # strip ASS override tags
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"[^0-9A-Za-zÀ-ÿçÇ ]", " ", s)
    return [w for w in s.lower().split() if w]


def _max_consecutive_shared(a, b):
    best = 0
    for i in range(len(a)):
        for j in range(len(b)):
            k = 0
            while i + k < len(a) and j + k < len(b) and a[i + k] == b[j + k]:
                k += 1
            best = max(best, k)
    return best


def _ts_to_s(ts):
    ts = ts.strip().replace(",", ".")
    h, m, s = ts.split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def load_ass_screens(path):
    out = []
    for ln in open(path, encoding="utf-8"):
        if not ln.startswith("Dialogue:"):
            continue
        f = ln.split(",", 9)
        out.append((_ts_to_s(f[1]), _ts_to_s(f[2]), _norm_words(f[9])))
    return out


def load_srt_screens(path):
    out = []
    blocks = re.split(r"\n\s*\n", open(path, encoding="utf-8").read())
    for b in blocks:
        m = re.search(r"(\d\d:\d\d:\d\d[,.]\d+)\s*-->\s*(\d\d:\d\d:\d\d[,.]\d+)", b)
        if not m:
            continue
        txt = b[m.end():].strip()
        out.append((_ts_to_s(m.group(1)), _ts_to_s(m.group(2)), _norm_words(txt)))
    return out


# Extract §4 hero labels from the .tsx. HeroScene label="..." and <PremiumLabel ...>text</PremiumLabel>.
def extract_hero_labels(tsx):
    src = open(tsx, encoding="utf-8").read()
    labels = []
    # HeroScene label="..."  (the canonical §4 hero label wiring)
    for m in re.finditer(r'HeroScene[^>]*?\blabel=(?:"([^"]*)"|\{"([^"]*)"\}|\{`([^`]*)`\})', src, re.S):
        labels.append(next(g for g in m.groups() if g is not None))
    # PremiumLabel children: <PremiumLabel ...>TEXT</PremiumLabel>
    for m in re.finditer(r"<PremiumLabel[^>]*>([^<{][^<]*)</PremiumLabel>", src):
        labels.append(m.group(1).strip())
    # dedup, keep order
    seen, uniq = set(), []
    for l in labels:
        if l and l not in seen:
            seen.add(l); uniq.append(l)
    return uniq


def label_window_from_plan(plan_path, label):
    """Best-effort: match a §4 hero label to its section window via the plan's
    heroAsset:/full: sections. Falls back to scanning ALL subtitle screens if we
    cannot map (which is strictly SAFER — it will never miss an overlap)."""
    try:
        d = json.load(open(plan_path, encoding="utf-8"))
    except Exception:
        return None
    # No reliable label->section text mapping in the plan; return None so the
    # caller conservatively checks the label against EVERY subtitle screen.
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tsx", required=True)
    ap.add_argument("--ass")
    ap.add_argument("--srt")
    ap.add_argument("--plan")
    a = ap.parse_args()

    if a.ass and os.path.exists(a.ass):
        screens = load_ass_screens(a.ass); src_kind = "ASS (on-screen)"
    elif a.srt and os.path.exists(a.srt):
        screens = load_srt_screens(a.srt); src_kind = "SRT (fallback)"
    else:
        print("[hero-label-gate] ERROR: need --ass or --srt", file=sys.stderr)
        return 2

    labels = extract_hero_labels(a.tsx)
    if not labels:
        print("[hero-label-gate] no §4 hero labels found — PASS (nothing to check)")
        return 0

    print(f"[hero-label-gate] checking {len(labels)} §4 hero label(s) vs {len(screens)} {src_kind} subtitle screens")
    fails = []
    for label in labels:
        lw = _norm_words(label)
        worst = 0; worst_scr = ""
        for (s, e, sw) in screens:            # check against EVERY screen (conservative + correct)
            k = _max_consecutive_shared(lw, sw)
            if k > worst:
                worst, worst_scr = k, " ".join(sw)
        status = "OK" if worst <= MAX_CONSEC else "FAIL"
        print(f'  [{status}] "{label}" ({len(lw)}w) max-consecutive-shared={worst}'
              + (f'  vs "{worst_scr}"' if worst >= 3 else ""))
        if worst > MAX_CONSEC:
            fails.append((label, worst, worst_scr))

    if fails:
        print("\n[hero-label-gate] FAIL — the following §4 hero label(s) share 4+ CONSECUTIVE words "
              "with a concurrent burned subtitle (a MOTION_DUPLICATE, QCR-112). "
              "Distill each to a NON-verbatim complement (<=3 consecutive shared) and re-render:", file=sys.stderr)
        for label, k, scr in fails:
            print(f'    "{label}"  ({k} consecutive vs "{scr}")', file=sys.stderr)
        return 1

    print("[hero-label-gate] PASS — every §4 hero label shares <=3 consecutive words")
    return 0


if __name__ == "__main__":
    sys.exit(main())
