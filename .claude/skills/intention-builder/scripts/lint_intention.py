#!/usr/bin/env python3
"""Lint a finished intention doc.

Catches what a human reader skims past: banned vocabulary that corrupts the
downstream skills, missing locks, beat count against runtime, two light states,
cast count past the drift cliff, palettes with no hex, look specs with no
measurements, and TBDs left in the paste-ready token blocks.

Token files emitted alongside the doc are linted too: anything under
`<slug>-tokens/` beside the doc is swept for the same banned vocabulary, at
token severity, because that text is what actually reaches the image model.

Usage:
    python lint_intention.py <project-slug>-intention.md
    python lint_intention.py doc.md --tokens path/to/tokens-dir
    python lint_intention.py doc.md --no-tokens   # doc only
    python lint_intention.py doc.md --json
    python lint_intention.py doc.md --strict     # warnings exit non-zero too

Exit codes: 0 clean (or warnings only), 1 errors present, 2 could not read.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------- vocabulary

AGE_WORDS = [
    "toddler", "child", "children", "kid", "kids", "boy", "girl", "teen",
    "teenage", "teenager", "adolescent", "youngster", "young man", "young woman",
    "youthful", "middle-aged", "middle aged", "elderly", "old man", "old woman",
    "senior citizen", "twenty-something", "thirty-something",
]
AGE_NUMBER = re.compile(
    r"\b(\d{1,2})\s*(?:yo|y/o|years? old|-year-old|yr old)\b", re.I
)

EMOTION_ADJECTIVES = [
    "sad", "angry", "happy", "confident", "nervous", "anxious", "excited",
    "furious", "devastated", "joyful", "melancholy", "sombre", "somber",
    "terrified", "heartbroken", "elated", "despondent", "wistful", "sullen",
]

FACIAL_CHOREOGRAPHY = [
    "brows lift", "brow lifts", "eyes widen", "eyes narrow", "lips part",
    "jaw drops", "smiles widely", "grins", "eyes well up", "tears stream",
    "tears streaming", "weeps", "sobs", "frowns deeply", "scowls",
]

VAGUE_LOOK_WORDS = [
    "cinematic", "epic", "moody", "vibey", "aesthetic", "premium looking",
    "high-end", "artsy", "beautiful", "stunning", "amazing", "gorgeous",
]

LAZY_REFERENCES = [
    "as above", "see previous", "see the block below", "see below",
    "same as before", "ditto", "idem",
]

FORBIDDEN_CAMERA = [
    "epic sweeping drone", "cinematic camera movement", "360-degree rotation",
    "360 degree rotation",
]

MODES = {"M1", "M2", "M3", "M4", "M5"}
ROUTES = {"LIVE-ACTION", "CINEMATIC-ACTION", "MOTION"}
WORKFLOW_MODES = {"ref2video", "text2video", "mixed"}

# alias -> canonical family. Two DIFFERENT families in one look is the failure;
# "Kodak Vision3 250D" is one stock named at length, not two.
STOCK_ALIASES = {
    "250d": "250d", "vision3 250d": "250d", "vision 3 250d": "250d",
    "500t": "500t", "vision3 500t": "500t", "vision 3 500t": "500t",
    "5219": "500t",
    "kodachrome": "kodachrome",
    "ektachrome": "ektachrome",
    "portra": "portra",
    "double-x": "double-x", "5222": "double-x",
    "bleach-bypass": "bleach-bypass", "bleach bypass": "bleach-bypass",
    "super 8": "super8", "super-8": "super8",
}

MOTION_FAMILIES = {
    "paper-editorial", "vox-collage", "zine-collage", "ink-sport-vector",
    "paint-over-photo", "type-punch", "flat-duotone", "glass-dark",
    "blueprint", "terminal-neon", "soft-3d",
}

DAY_STATES = ["dawn", "sunrise", "morning", "midday", "noon", "afternoon",
              "golden hour", "magic hour", "daylight", "daytime"]
NIGHT_STATES = ["dusk", "twilight", "blue hour", "night", "nighttime",
                "midnight", "after dark"]
NEGATION = re.compile(
    r"\b(no|not|never|without|absent|banned|excluded|deliberately absent)\b",
    re.I,
)

# Beat density floors, in seconds per shot, by route. The CINEMATIC-ACTION
# figure is the one that actually governs Seedance downstream.
DENSITY_FLOOR = {"CINEMATIC-ACTION": 2.5, "LIVE-ACTION": 1.5, "MOTION": 1.5}
DENSITY_CEILING = 8.0
# Below this, no route survives — it is an error rather than a judgement call.
DENSITY_HARD_FLOOR = 1.0
# Formats whose whole point is density past the floor.
DENSITY_EXEMPT = ("trailer", "sizzle", "bumper", "montage")
P1_CEILING = 0.25


class Report:
    def __init__(self) -> None:
        self.errors: list[dict] = []
        self.warnings: list[dict] = []

    def error(self, rule: str, msg: str, line: int | None = None,
              fix: str = "") -> None:
        self.errors.append({"rule": rule, "message": msg, "line": line,
                            "fix": fix})

    def warn(self, rule: str, msg: str, line: int | None = None,
             fix: str = "") -> None:
        self.warnings.append({"rule": rule, "message": msg, "line": line,
                              "fix": fix})


# ---------------------------------------------------------------- document

SECTION_RE = re.compile(r"^##\s*(\d+)\s*[·.\-–]\s*(.*)$")


class Doc:
    """A parsed intention doc: frontmatter, body lines, and a section index.

    Line numbers are 1-based and absolute, so they match what an editor shows.
    """

    def __init__(self, text: str) -> None:
        self.text = text
        self.fm: dict[str, str] = {}
        self.body_start = 1          # absolute line number of body line 1
        body = text

        if text.startswith("---"):
            end = text.find("\n---", 3)
            if end != -1:
                raw = text[3:end]
                body = text[end + 4:].lstrip("\n")
                self.body_start = text[:text.index(body)].count("\n") + 1
                for line in raw.splitlines():
                    if ":" in line and not line.strip().startswith("#"):
                        k, _, v = line.partition(":")
                        self.fm[k.strip()] = v.strip()

        self.lines = body.splitlines()
        self.body = body

        # scope: "single" (one doc covers everything), "project", or "scene"
        raw_scope = self.fm.get("scope", "").strip().lower()
        if raw_scope.startswith("scene"):
            self.scope = "scene"
        elif raw_scope.startswith("project"):
            self.scope = "project"
        else:
            self.scope = "single"
        self.scope_raw = raw_scope

        # which lines sit inside a fenced code block
        self.fenced = [False] * len(self.lines)
        depth = 0
        for i, line in enumerate(self.lines):
            if re.match(r"^\s*`{3,}", line):
                depth = 0 if depth else 1
                self.fenced[i] = True
                continue
            self.fenced[i] = bool(depth)

        # section index: num -> (title, start_idx, end_idx) over self.lines,
        # ignoring headings that appear inside fences (token templates carry
        # their own ## headings as literal text).
        self.sections: dict[str, tuple[str, int, int]] = {}
        marks: list[tuple[str, str, int]] = []
        for i, line in enumerate(self.lines):
            if self.fenced[i]:
                continue
            m = SECTION_RE.match(line)
            if m:
                marks.append((m.group(1), m.group(2).strip(), i))
        for j, (num, title, start) in enumerate(marks):
            end = marks[j + 1][2] if j + 1 < len(marks) else len(self.lines)
            self.sections[num] = (title, start, end)

        # §10 is machine-facing: everything from its heading to the next section
        self.machine_range: tuple[int, int] = (-1, -1)
        if "10" in self.sections:
            _, s, e = self.sections["10"]
            self.machine_range = (s, e)

    # -- helpers -----------------------------------------------------------

    def abs_line(self, idx: int) -> int:
        return self.body_start + idx

    def in_machine(self, idx: int) -> bool:
        s, e = self.machine_range
        return s <= idx < e

    def section_text(self, num: str) -> str:
        if num not in self.sections:
            return ""
        _, s, e = self.sections[num]
        return "\n".join(self.lines[s:e])

    def has_section(self, num: str) -> bool:
        return num in self.sections

    def iter_lines(self, skip_fenced: bool = False):
        for i, line in enumerate(self.lines):
            if skip_fenced and self.fenced[i]:
                continue
            yield i, line

    def find(self, needles, word_boundary: bool = True, skip_fenced=False):
        for i, line in self.iter_lines(skip_fenced):
            low = line.lower()
            for n in needles:
                if word_boundary:
                    if re.search(rf"(?<![\w-]){re.escape(n)}(?![\w-])", low):
                        yield n, i
                elif n in low:
                    yield n, i


# ---------------------------------------------------------------- checks

def check_vocabulary(doc: Doc, rep: Report) -> None:
    narrative = {"1", "2"}

    def sect_of(idx: int) -> str:
        for num, (_t, s, e) in doc.sections.items():
            if s <= idx < e:
                return num
        return ""

    for word, i in doc.find(AGE_WORDS):
        rep.error("age-words", f'age word "{word}"', doc.abs_line(i),
                  "describe by build, posture and wardrobe register")
    for m in AGE_NUMBER.finditer(doc.body):
        i = doc.body[:m.start()].count("\n")
        rep.error("age-numbers", f'age number "{m.group(0).strip()}"',
                  doc.abs_line(i), "shot-builder bans age numbers outright")
    for word, i in doc.find(EMOTION_ADJECTIVES):
        if sect_of(i) in narrative:
            continue  # the intention narrative may name feelings
        rep.error("emotion-adjective", f'emotion adjective "{word}"',
                  doc.abs_line(i),
                  "emit the task instead: wants / blocked by / plays / turns on")
    for phrase, i in doc.find(FACIAL_CHOREOGRAPHY, word_boundary=False):
        rep.error("facial-choreography", f'facial choreography "{phrase}"',
                  doc.abs_line(i), "direct the tactic, never the expression")
    for phrase, i in doc.find(LAZY_REFERENCES, word_boundary=False):
        rep.error("lazy-reference", f'"{phrase}" — restate in full',
                  doc.abs_line(i), "downstream skills read blocks in isolation")
    for phrase, i in doc.find(FORBIDDEN_CAMERA, word_boundary=False):
        rep.error("forbidden-camera", f'"{phrase}" is a named failure',
                  doc.abs_line(i), "name the move, its quality and its ending")
    for word, i in doc.find(VAGUE_LOOK_WORDS):
        if doc.in_machine(i):
            rep.error("vague-in-token", f'"{word}" inside a token block',
                      doc.abs_line(i),
                      "tokens need measurements, not adjectives")
        else:
            rep.warn("vague-look-word", f'"{word}" survived the grill',
                     doc.abs_line(i),
                     "run vague-to-spec.md and replace it with the decision")


def check_frontmatter(doc: Doc, rep: Report) -> None:
    route = doc.fm.get("route", "")
    required = ["project", "slug", "route", "format", "runtime", "aspect",
                "register", "locked", "version"]
    if route != "MOTION":
        required.append("light_state")
    for key in required:
        val = doc.fm.get(key, "")
        if not val or val.startswith("<"):
            rep.error("frontmatter", f"missing or unfilled: {key}", None,
                      "every field is read by something downstream")
    if route and route not in ROUTES:
        rep.error("route", f'route "{route}" is not one of {sorted(ROUTES)}')
    mode = doc.fm.get("camera_mode", "")
    if route == "LIVE-ACTION" and mode not in MODES:
        rep.error("camera-mode",
                  f'LIVE-ACTION needs a camera mode M1-M5, got "{mode}"')
    if route in ("LIVE-ACTION", "CINEMATIC-ACTION"):
        wf = doc.fm.get("workflow_mode", "")
        if wf not in WORKFLOW_MODES:
            rep.error("workflow-mode",
                      f'workflow_mode must be one of {sorted(WORKFLOW_MODES)}, '
                      f'got "{wf}"')
    raw = doc.scope_raw
    if raw and doc.scope == "single":
        rep.warn("scope", f'scope "{raw}" is unrecognised — treating this as a '
                          'single self-contained doc', None,
                 'use "project" or "scene NN of NN"')
    if doc.scope == "scene" and not re.search(r"scene\s+\d+\s+of\s+\d+", raw):
        rep.warn("scope", f'scope "{raw}" does not say which scene', None,
                 'write it as "scene 03 of 09" so the cut order is readable')
    reg = doc.fm.get("register", "")
    if reg and reg not in ("photoreal", "stylised", "stylized"):
        rep.warn("register", f'register "{reg}" is unrecognised')


def _light_words(text: str) -> tuple[list[str], list[str]]:
    """Day and night words in `text`, ignoring anything inside a negated clause."""
    day, night = [], []
    for clause in re.split(r"[.;,]", text.lower()):
        if NEGATION.search(clause):
            continue
        day += [w for w in DAY_STATES if w in clause]
        night += [w for w in NIGHT_STATES if w in clause]
    return day, night


def check_light_state(doc: Doc, rep: Report) -> None:
    if doc.fm.get("route") == "MOTION" or doc.scope == "project":
        return  # a project doc spans scenes, so it has no single light state
    d, n = _light_words(doc.fm.get("light_state", ""))
    if d and n:
        rep.error("two-light-states",
                  f"light_state names both {d[0]} and {n[0]}", None,
                  "the sun cannot move between cuts — this is two docs")
        return
    # only the lines that actually declare light; "deliberately absent" and
    # other negations are stripped by _light_words
    declaring = [ln for ln in doc.section_text("3").splitlines()
                 if re.search(r"\*\*(light state|key source|direction|fill|"
                              r"practicals)", ln, re.I)]
    d2, n2 = _light_words("\n".join(declaring))
    if d2 and n2:
        rep.error("two-light-states",
                  f"section 3 declares both {d2[0]} and {n2[0]}", None,
                  "split into two intention docs, or pick one")


def check_beats(doc: Doc, rep: Report) -> None:
    if doc.scope == "project":
        return  # beats live in the scene docs
    beats_text = doc.section_text("7")
    if not beats_text:
        rep.error("no-beats", "section 7 (The beats) is missing", None,
                  "downstream skills need a beat list with a priority each")
        return
    rows = re.findall(r"^\|\s*(\d+)\s*\|", beats_text, re.M)
    beats = len({int(r) for r in rows}) if rows else 0
    if beats == 0:
        rep.error("no-beats", "no beat table rows found in section 7", None,
                  "one row per beat, numbered")
        return
    try:
        runtime = float(re.sub(r"[^\d.]", "", doc.fm.get("runtime", "")) or 0)
    except ValueError:
        runtime = 0.0
    fmt = doc.fm.get("format", "").lower()
    exempt = any(w in fmt for w in DENSITY_EXEMPT)
    if runtime and not exempt:
        floor = DENSITY_FLOOR.get(doc.fm.get("route", ""), 1.5)
        per = runtime / beats
        if per < DENSITY_HARD_FLOOR:
            rep.error("beat-density",
                      f"{beats} beats in {runtime:g}s = {per:.1f}s per shot",
                      None, f"under {DENSITY_HARD_FLOOR:g}s per shot nothing "
                            "registers — cut beats or add time")
        elif per < floor:
            rep.warn("beat-density",
                     f"{beats} beats in {runtime:g}s = {per:.1f}s per shot "
                     f"(comfortable floor for this route is {floor:g}s)", None,
                     "fine for an editorial cut; tight if these are generated "
                     "beats inside one clip")
        elif per > DENSITY_CEILING and beats > 1:
            rep.warn("beat-density",
                     f"{beats} beats in {runtime:g}s = {per:.1f}s per shot",
                     None, f"over {DENSITY_CEILING:g}s per shot reads as a slideshow")
    tags = re.findall(r"\bP([123])\b", beats_text)
    if not tags:
        rep.error("no-priorities", "no P1/P2/P3 priority tags on the beats",
                  None, "priority is what makes a render budget survivable")
    else:
        p1 = tags.count("1")
        if len(tags) >= 8 and p1 / len(tags) > P1_CEILING:
            rep.warn("priority-inflation",
                     f"{p1} of {len(tags)} beats tagged P1", None,
                     "over a quarter P1 and the tag stops meaning anything")


def check_look(doc: Doc, rep: Report) -> None:
    if doc.scope == "scene":
        return  # the look lives in the project doc
    chunk = doc.section_text("4")
    if not chunk:
        return  # already reported by check_required_sections
    hexes = re.findall(r"#[0-9A-Fa-f]{6}\b", chunk)
    if len(hexes) < 3:
        rep.error("palette-no-hex",
                  f"only {len(hexes)} hex values in the look section", None,
                  "a palette in words alone drifts every render")
    low = chunk.lower()
    measurables = {
        "white point (K)": bool(re.search(r"\b\d{3,5}\s*k\b", low)),
        "contrast ratio": bool(re.search(r"\b\d+(\.\d+)?\s*:\s*1\b", low)),
        "saturation 0-1": bool(re.search(r"saturation[^\n]*?0?\.\d", low)),
        "grain": "asa" in low or "grain" in low,
        "halation": "halation" in low,
        "skin IRE": "skin ire" in low,
        "black point": "black point" in low,
    }
    missing = [k for k, v in measurables.items() if not v]
    if missing:
        rep.error("look-not-measurable",
                  "look spec missing: " + ", ".join(missing), None,
                  "without measurements it is a moodboard, not a style token")
    # only the capture-medium line, so a look-library slug like
    # `bleach-bypass-conflict` in the reference anchor does not count as a stock
    medium = [ln for ln in chunk.splitlines()
              if re.search(r"\*\*capture medium", ln, re.I)]
    med_low = " ".join(medium).lower()
    families = {fam for alias, fam in STOCK_ALIASES.items() if alias in med_low}
    if len(families) > 1:
        rep.error("two-stocks", f"two capture media named: {sorted(families)}",
                  None, "mixing two stocks in one look is a named failure")
    if "what this look is not" not in low:
        rep.warn("no-anti-patterns",
                 "no 'What this look is NOT' list in section 4", None,
                 "downstream skills use the anti-patterns verbatim")


STANCE_RANGE = {"in it": (21, 35), "in-it": (21, 35),
                "watching": (40, 100), "observer": (40, 100),
                "participant": (21, 35)}
# rows that frame an object rather than a person are exempt from the range
STANCE_EXEMPT_ROW = ("macro", "detail", "insert", "product", "texture", "object")


def check_stance(doc: Doc, rep: Report) -> None:
    if doc.fm.get("route") == "MOTION" or doc.scope == "scene":
        return
    chunk = doc.section_text("4")
    if not chunk:
        return
    m = re.search(r"\*\*camera stance:?\*\*\s*([^\n—-]*)", chunk, re.I)
    if not m:
        rep.warn("no-stance", "no camera stance recorded in section 4", None,
                 "one question decides the focal range; without it the lens "
                 "table has no reason behind it")
        return
    raw = m.group(1).strip().lower()
    if raw.startswith("n/a") or "product" in raw:
        return
    key = next((k for k in STANCE_RANGE if k in raw), None)
    if key is None:
        rep.warn("stance-unrecognised", f'camera stance "{raw.strip()}" is not '
                 "in it or watching", None, "see camera-stance.md Part 1")
        return
    lo, hi = STANCE_RANGE[key]
    for line in chunk.splitlines():
        low = line.lower()
        if not (line.startswith("|") or "default lens" in low):
            continue
        if any(w in low for w in STANCE_EXEMPT_ROW):
            continue
        if "effect" in low:  # a deliberate, named exception
            continue
        for focal in re.findall(r"\b(\d{2,3})\s*mm\b", line):
            f = int(focal)
            if not (lo <= f <= hi):
                rep.warn("stance-vs-lens",
                         f'{f}mm sits outside the "{key}" range ({lo}-{hi}mm)',
                         None, "the stance is the reason the range exists — "
                               "move the lens, or move the stance")


def check_required_sections(doc: Doc, rep: Report) -> None:
    route = doc.fm.get("route", "")
    scope = doc.scope
    needed: dict[str, str] = {}
    if scope in ("project", "single"):
        needed.update({"1": "Intention", "2": "The event", "4": "The look",
                       "9": "Assets", "10": "Locked tokens", "11": "Next step"})
        if route in ("LIVE-ACTION", "CINEMATIC-ACTION"):
            needed["5"] = "The cast"
    if scope in ("scene", "single"):
        needed.update({"7": "The beats", "8": "Sound"})
        if route in ("LIVE-ACTION", "CINEMATIC-ACTION"):
            needed["3"] = "The world"
        if route == "CINEMATIC-ACTION":
            needed["6"] = "The performance"
    for num, name in sorted(needed.items(), key=lambda kv: int(kv[0])):
        if not doc.has_section(num):
            rep.error("missing-section", f"section {num} ({name}) is missing")

    if scope == "scene":
        return  # the event, the look and the cast live in the project doc

    if not re.search(r"how it ends", doc.body, re.I):
        rep.error("no-ending", "section 2 does not name how it ends", None,
                  "the event is named backward from the ending — this blocks "
                  "everything downstream")
    if not re.search(r"signature", doc.body, re.I):
        rep.warn("no-signature", "no signature named", None,
                 "nothing holds the frames together without one")
    if route == "CINEMATIC-ACTION":
        for key in ("motive", "goal", "obstacle", "tactic"):
            if not re.search(rf"\*\*{key}", doc.body, re.I):
                rep.error("no-acting-task",
                          f"no {key} named for any character", None,
                          "without a task the eyes go dead, and lighting "
                          "cannot fix it")


def check_cast(doc: Doc, rep: Report) -> None:
    if doc.fm.get("route") == "MOTION" or doc.scope == "scene":
        return
    chunk = doc.section_text("5")
    if not chunk:
        return  # already reported by check_required_sections
    people = re.findall(r"^###\s+(.+)$", chunk, re.M)
    if not people:
        # a product, process or environment piece legitimately has no cast —
        # but it has to say so rather than leaving the section blank
        if re.search(r"\b(no cast|nobody on screen|no one on screen|"
                     r"product only|hands only|n/?a)\b", chunk, re.I):
            return
        rep.error("no-cast", "section 5 names no characters", None,
                  'write "no cast — product only" or similar if that is right')
        return
    if len(people) >= 3:
        rep.warn("cast-drift-cliff", f"{len(people)} characters", None,
                 "three or more performing at once is the drift cliff — "
                 "plan cuts, or demote someone to texture")
    blocks = re.split(r"^###\s+", chunk, flags=re.M)[1:]
    for raw in blocks:
        name = raw.splitlines()[0].strip()
        low = raw.lower()
        if "unrepeatable marker" not in low:
            rep.error("no-marker", f'"{name}" has no unrepeatable marker',
                      None, "without it two characters merge by beat three")
        cm = re.search(r"costume[^a-z0-9]{0,3}\s*\(?head to toe", low)
        if not cm:
            rep.error("no-costume", f'"{name}" has no head-to-toe costume',
                      None, "wardrobe is the number one drift source")
        else:
            tail = low[cm.end():cm.end() + 600]
            if len(re.findall(r"[,;]", tail)) < 3:
                rep.warn("costume-thin",
                         f'"{name}" costume looks under-specified', None,
                         "garment, fabric, colour, fit, layering, footwear")


def check_motion(doc: Doc, rep: Report) -> None:
    if doc.fm.get("route") != "MOTION":
        return
    low = doc.body.lower()
    found = {f for f in MOTION_FAMILIES if f in low}
    if not found:
        rep.error("no-family", "no motion-builder style family named", None,
                  f"pick exactly one of: {', '.join(sorted(MOTION_FAMILIES))}")
    elif len(found) > 1:
        rep.error("two-families", f"two families named: {sorted(found)}", None,
                  "one family per sheet — mixing is the top cause of AI-ish output")
    for key, why in (("STAGE", "decided once at sheet time, never per clip"),
                     ("ENERGY", "it sets both the motion verbs and the SFX palette"),
                     ("SCRIPT STATE", "the VO is the timeline; without it the "
                                      "coverage plan is guesswork")):
        if not re.search(rf"^\s*{key}:", doc.body, re.M):
            fn = rep.error if key == "STAGE" else rep.warn
            fn(f"no-{key.lower().replace(' ', '-')}",
               f"{key} is not declared", None, why)


def check_leftovers(doc: Doc, rep: Report) -> None:
    for i, line in doc.iter_lines():
        for m in re.finditer(r"\bTBD\b", line):
            if doc.in_machine(i):
                rep.error("tbd-in-token", "TBD inside a paste-ready token",
                          doc.abs_line(i),
                          "resolve it, or the user pastes a placeholder "
                          "straight into a render")
            else:
                rep.warn("tbd", "TBD left in the doc", doc.abs_line(i))
        if doc.in_machine(i) or doc.fenced[i]:
            continue  # token templates legitimately carry placeholders
        for m in re.finditer(r"<[a-z][^>\n]{2,60}>", line):
            rep.warn("unfilled-placeholder",
                     f"template placeholder left in: {m.group(0)}",
                     doc.abs_line(i))


# ---------------------------------------------------------------- tokens

def token_dirs(doc_path: Path, explicit: str | None) -> list[Path]:
    if explicit:
        d = Path(explicit)
        return [d] if d.is_dir() else []
    stem = doc_path.stem
    for suffix in ("-intention", "_intention"):
        if stem.endswith(suffix):
            stem = stem[: -len(suffix)]
            break
    stem = re.sub(r"-s\d+$", "", stem)  # scene docs share the project's tokens
    cand = doc_path.parent / f"{stem}-tokens"
    return [cand] if cand.is_dir() else []


def check_token_file(path: Path, label: str, rep: Report) -> None:
    # Everything in an emitted token is prompt body, so the vocabulary bans are
    # errors without exception and a TBD is never acceptable.
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        rep.error("token-unreadable", f"{label}: {exc}")
        return
    for i, line in enumerate(text.splitlines(), start=1):
        low = line.lower()
        loc = f"{label}:{i}"
        for w in AGE_WORDS:
            if re.search(rf"(?<![\w-]){re.escape(w)}(?![\w-])", low):
                rep.error("token-age-words", f'{loc} — age word "{w}"', None,
                          "describe by build, posture and wardrobe register")
        if AGE_NUMBER.search(line):
            rep.error("token-age-numbers", f"{loc} — age number", None,
                      "shot-builder bans age numbers outright")
        for w in EMOTION_ADJECTIVES:
            if re.search(rf"(?<![\w-]){re.escape(w)}(?![\w-])", low):
                rep.error("token-emotion", f'{loc} — emotion adjective "{w}"',
                          None, "the model cannot render biography")
        for w in FACIAL_CHOREOGRAPHY + LAZY_REFERENCES + FORBIDDEN_CAMERA:
            if w in low:
                rep.error("token-banned", f'{loc} — banned phrase "{w}"')
        for w in VAGUE_LOOK_WORDS:
            if re.search(rf"(?<![\w-]){re.escape(w)}(?![\w-])", low):
                rep.error("token-vague", f'{loc} — "{w}" in a prompt body',
                          None, "tokens need measurements, not adjectives")
        if re.search(r"\bTBD\b", line):
            rep.error("token-tbd", f"{loc} — TBD in a prompt body", None,
                      "this gets pasted straight into a render")
    if "/cast/" in path.as_posix() and "3-view turnaround" in text:
        if "LIKENESS REPLICATION" not in text:
            rep.warn("token-no-anchor",
                     f"{label} — no LIKENESS REPLICATION anchor", None,
                     "required in ref2video; correct to omit in text2video")


# ---------------------------------------------------------------- driver

def lint(path: Path, tokens: str | None = None,
         sweep_tokens: bool = True) -> Report:
    rep = Report()
    doc = Doc(path.read_text(encoding="utf-8"))
    if not doc.fm:
        rep.error("frontmatter", "no YAML frontmatter — the doc needs one")
    check_frontmatter(doc, rep)
    check_required_sections(doc, rep)
    check_vocabulary(doc, rep)
    check_light_state(doc, rep)
    check_beats(doc, rep)
    check_look(doc, rep)
    check_stance(doc, rep)
    check_cast(doc, rep)
    check_motion(doc, rep)
    check_leftovers(doc, rep)

    if sweep_tokens:
        swept = 0
        for d in token_dirs(path, tokens):
            for f in sorted(d.rglob("*.md")):
                check_token_file(f, f.relative_to(d.parent).as_posix(), rep)
                swept += 1
        if swept == 0 and doc.fm.get("route") in ("LIVE-ACTION",
                                                  "CINEMATIC-ACTION"):
            rep.warn("no-token-files",
                     "no token files found beside the doc", None,
                     "emit them under <slug>-tokens/{cast,locations,styles}/ "
                     "so the next skill reads them instead of the prose")
    return rep


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("doc", help="path to the intention doc")
    ap.add_argument("--json", action="store_true",
                    help="machine-readable output")
    ap.add_argument("--strict", action="store_true",
                    help="exit non-zero on warnings too")
    ap.add_argument("--tokens", metavar="DIR",
                    help="token directory (default: <slug>-tokens beside the doc)")
    ap.add_argument("--no-tokens", action="store_true",
                    help="lint the doc only, skip the token sweep")
    args = ap.parse_args()

    path = Path(args.doc)
    if not path.is_file():
        print(f"cannot read: {path}", file=sys.stderr)
        return 2

    rep = lint(path, args.tokens, sweep_tokens=not args.no_tokens)

    if args.json:
        print(json.dumps({"file": str(path), "errors": rep.errors,
                          "warnings": rep.warnings}, indent=2))
    else:
        def show(items, mark):
            for it in items:
                loc = f"  line {it['line']}" if it.get("line") else ""
                print(f"{mark} [{it['rule']}] {it['message']}{loc}")
                if it.get("fix"):
                    print(f"      -> {it['fix']}")
        if rep.errors:
            print(f"\n{len(rep.errors)} error(s) — fix before delivering:\n")
            show(rep.errors, "  x")
        if rep.warnings:
            print(f"\n{len(rep.warnings)} warning(s):\n")
            show(rep.warnings, "  !")
        if not rep.errors and not rep.warnings:
            print("clean — nothing to fix.")
        elif not rep.errors:
            print("\nno errors. Warnings are judgement calls; note the "
                  "deliberate ones in the doc and move on.")
        print()

    if rep.errors:
        return 1
    if args.strict and rep.warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
