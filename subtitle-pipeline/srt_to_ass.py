#!/usr/bin/env python3
"""
SRT → ASS Converter for Viral Subtitles Pipeline

Converts Whisper SRT files to ASS format with:
- Exact SRT timestamps preserved (no manual drift)
- Long segments split proportionally by word count
- Yellow highlights on keywords (numbers, brands, tech terms, power verbs)
- Motion pipeline style (Font 68, MarginV 280, BorderStyle 1, Outline 5, Shadow 2)
- Max ~3 words per visual line, max 5 words per segment, max 2 visual lines
- Hard 18-char-per-line cap to prevent visual wrapping at Font 68
- Built-in placement validation that REJECTS unsafe configurations

Usage:
  python3 srt_to_ass.py input.srt output.ass [--highlights "word1,word2,..."] [--standalone]
  python3 srt_to_ass.py --validate-only existing.ass

Pixel Geometry (1080x1920 vertical video):
  Frame: 1080x1920
  Motion area: pixels 0-768 (top 40%)
  Avatar area: pixels 768-1920 (bottom 60%)
  Face zone: pixels 950-1350 (head top to chin)
  DANGER ZONE: anything above pixel 1450
  Safe subtitle zone: pixels 1450-1700
  Platform UI danger: pixels 1700-1920
"""

import re
import sys
import os
import argparse

# ── Constants ──

FRAME_WIDTH = 1080
FRAME_HEIGHT = 1920
FACE_ZONE_TOP = 950
FACE_ZONE_BOTTOM = 1350
DANGER_PIXEL = 1450  # Subtitle top edge must be BELOW this
PLATFORM_UI_PIXEL = 1700  # Below this = platform UI danger
USABLE_TEXT_WIDTH = 888  # 1080 - 96 MarginL - 96 MarginR (wider safe margin)

# Arial Black approximate character widths at various sizes (pixels per char).
# These are conservative estimates (wide) to catch wrapping before it happens.
# Measured from rendered Arial Black at common sizes on 1080px canvas.
CHAR_WIDTH_MAP = {
    68: {
        'default': 42,  # Average char width for Arial Black 68px
        'narrow': 28,   # i, l, t, f, j, r, 1, !, |, :, ;, .
        'wide': 52,     # M, W, m, w, @, %
        'medium': 42,   # Everything else
    },
    92: {
        'default': 57,
        'narrow': 38,
        'wide': 70,
        'medium': 57,
    },
}

NARROW_CHARS = set('iltfjr1!|:;.,\' ')
WIDE_CHARS = set('MWmw@%')

# ── ASS Header Templates ──

MOTION_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: White,Arial Black,68,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1.5,0,1,5,2,2,96,96,280,1
Style: Yellow,Arial Black,68,&H0000D4FF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1.5,0,1,5,2,2,96,96,280,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"""

STANDALONE_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: White,Arial Black,92,&H00FFFFFF,&H000000FF,&H00000000,&HE0000000,-1,0,0,0,100,100,1,0,4,1,5,2,96,96,440,1
Style: Yellow,Arial Black,92,&H0000D4FF,&H000000FF,&H00000000,&HE0000000,-1,0,0,0,100,100,1,0,4,1,5,2,96,96,440,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"""

# ── Default highlight words (PT-BR viral content) ──

DEFAULT_HIGHLIGHTS = {
    # Tech terms / brands
    "inteligência artificial", "IA", "Figma", "Claude", "OpenClaw",
    "código", "design", "programar", "programação", "desenvolvedores",
    "designers", "API", "tokens", "token", "modelo", "algoritmo", "automação",
    # QCR-047: consistency — these tech nouns recur in coding videos
    # and Gemini flags them when código/tokens are yellow but they are not.
    "função", "grafo", "GitHub", "Anthropic", "Graphify", "repositório",
    # Power verbs / emotional words
    "GUERRA", "MUDAR", "NUNCA", "EXATAMENTE", "FUTURO", "PADRÃO",
    "SUPERPODER", "SUBSTITUÍDO", "PROMOVIDO", "verdade", "revolução",
    # Numbers get highlighted automatically (regex-based)
}


# ══════════════════════════════════════════════════════════════════════════════
#  PLACEMENT VALIDATION — Prevents face overlap BEFORE burning
# ══════════════════════════════════════════════════════════════════════════════

def estimate_visual_line_width(text, font_size):
    """Estimate rendered pixel width of a text string in Arial Black.

    Strips ASS override tags before measuring. Uses conservative (wide)
    character width estimates to catch wrapping before it happens.
    """
    # Remove all ASS override tags {\\...}
    visible = re.sub(r'\{[^}]*\}', '', text)
    if not visible:
        return 0

    widths = CHAR_WIDTH_MAP.get(font_size, CHAR_WIDTH_MAP[68])

    total = 0
    for ch in visible:
        if ch in NARROW_CHARS:
            total += widths['narrow']
        elif ch in WIDE_CHARS:
            total += widths['wide']
        else:
            total += widths['medium']
    return total


def count_visual_lines(text, font_size, usable_width=USABLE_TEXT_WIDTH):
    """Count how many visual lines a dialogue entry will actually render as.

    Accounts for:
    1. Explicit \\N line breaks in the ASS text
    2. Visual wrapping when a line exceeds the usable pixel width
    """
    # Split on explicit ASS line breaks
    explicit_lines = text.replace('\\N', '\n').split('\n')
    total_visual_lines = 0

    for line in explicit_lines:
        line_width = estimate_visual_line_width(line, font_size)
        if line_width <= 0:
            total_visual_lines += 1
            continue
        # How many visual lines does this one explicit line wrap into?
        wrapped = max(1, -(-line_width // usable_width))  # Ceiling division
        total_visual_lines += wrapped

    return total_visual_lines


def visible_text(s):
    """Return text with ASS tags stripped — only visible characters."""
    return re.sub(r'\{[^}]*\}', '', s)


def visible_len(s):
    """Return character count of visible text (ASS tags stripped)."""
    return len(visible_text(s))


def validate_placement(margin_v, font_size, outline, max_lines=2, label=""):
    """Validate that subtitle placement will NOT overlap the face.

    Formula: top_pixel = FRAME_HEIGHT - margin_v - (max_lines × (font_size + 2 × outline))
    PASS: top_pixel >= DANGER_PIXEL (1450)
    FAIL: top_pixel < DANGER_PIXEL — subtitles would overlap face zone

    Returns (is_safe, top_pixel, bottom_pixel, detail_string)
    """
    line_height = font_size + 2 * outline
    total_height = max_lines * line_height
    bottom_pixel = FRAME_HEIGHT - margin_v
    top_pixel = bottom_pixel - total_height

    detail = (
        f"MarginV={margin_v}, Font={font_size}, Outline={outline}, "
        f"Lines={max_lines} → line_height={line_height}px, "
        f"total_height={total_height}px, "
        f"bottom_edge=pixel {bottom_pixel}, top_edge=pixel {top_pixel}"
    )
    if label:
        detail = f"[{label}] {detail}"

    is_safe = top_pixel >= DANGER_PIXEL

    if not is_safe:
        detail += f" → FAIL: top edge ({top_pixel}) < danger line ({DANGER_PIXEL})"
        face_overlap = DANGER_PIXEL - top_pixel
        detail += f" — {face_overlap}px into face zone!"
    else:
        clearance = top_pixel - FACE_ZONE_BOTTOM
        detail += f" → PASS: {clearance}px clearance below chin ({FACE_ZONE_BOTTOM})"

    return is_safe, top_pixel, bottom_pixel, detail


def validate_dialogue_entry(text, font_size, outline, margin_v, usable_width=USABLE_TEXT_WIDTH):
    """Validate a single dialogue entry for safe placement.

    Returns (is_safe, visual_lines, top_pixel, issues_list)
    """
    issues = []
    visual_lines = count_visual_lines(text, font_size, usable_width)

    # Check line count
    if visual_lines > 2:
        issues.append(
            f"VISUAL_LINES={visual_lines} (max 2) — text will wrap and overlap face"
        )

    # Check character count per explicit line
    explicit_lines = text.replace('\\N', '\n').split('\n')
    for i, line in enumerate(explicit_lines):
        vlen = visible_len(line)
        if vlen > 20:  # Absolute max — beyond this wrapping is guaranteed
            issues.append(
                f"Line {i+1} has {vlen} visible chars (max 20) — will visually wrap: '{visible_text(line)[:30]}...'"
            )
        elif vlen > 18:  # Warning zone
            issues.append(
                f"Line {i+1} has {vlen} visible chars (soft limit 18) — may visually wrap: '{visible_text(line)[:30]}'"
            )

    # Validate pixel placement with actual visual line count
    is_safe, top_pixel, bottom_pixel, _ = validate_placement(
        margin_v, font_size, outline, max_lines=visual_lines
    )

    if not is_safe:
        issues.append(
            f"TOP_PIXEL={top_pixel} (must be >= {DANGER_PIXEL}) — "
            f"subtitle overlaps face zone with {visual_lines} visual lines"
        )

    # Check if bottom edge is in platform UI zone
    if bottom_pixel > PLATFORM_UI_PIXEL:
        issues.append(
            f"BOTTOM_PIXEL={bottom_pixel} (should be <= {PLATFORM_UI_PIXEL}) — "
            f"subtitle extends into platform UI zone"
        )

    return len(issues) == 0, visual_lines, top_pixel, issues


def validate_ass_file(ass_path):
    """Validate an existing ASS file. Used by --validate-only mode.

    Parses styles, extracts font_size/outline/margin_v, then validates
    every dialogue entry for safe placement.

    Returns (passed, stats_dict, issues_list)
    """
    if not os.path.exists(ass_path):
        return False, {}, [f"File not found: {ass_path}"]

    with open(ass_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse styles to extract font_size, outline, margin_v
    styles = {}
    style_pattern = re.compile(
        r'^Style:\s*(\w+),([^,]+),(\d+),'  # Name, Fontname, Fontsize
        r'[^,]+,[^,]+,[^,]+,[^,]+,'         # Colours
        r'[^,]+,[^,]+,[^,]+,[^,]+,'         # Bold..StrikeOut
        r'[^,]+,[^,]+,[^,]+,[^,]+,'         # ScaleX..Angle
        r'(\d+),(\d+),(\d+),'               # BorderStyle, Outline, Shadow
        r'(\d+),'                             # Alignment
        r'(\d+),(\d+),(\d+)',                # MarginL, MarginR, MarginV
        re.MULTILINE
    )
    for m in style_pattern.finditer(content):
        name = m.group(1)
        styles[name] = {
            'font_size': int(m.group(3)),
            'outline': int(m.group(5)),
            'margin_v': int(m.group(10)),
            'margin_l': int(m.group(8)),
            'margin_r': int(m.group(9)),
        }

    if not styles:
        return False, {}, ["No styles found in ASS file — cannot validate"]

    # Parse dialogue entries
    dialogue_pattern = re.compile(
        r'^Dialogue:\s*\d+,'           # Layer
        r'([^,]+),([^,]+),'            # Start, End
        r'(\w+),'                      # Style
        r'[^,]*,'                      # Name
        r'(\d+),(\d+),(\d+),'          # MarginL, MarginR, MarginV (per-line overrides)
        r'[^,]*,'                      # Effect
        r'(.*)',                        # Text
        re.MULTILINE
    )

    all_issues = []
    total_dialogues = 0
    max_visual_lines = 0
    worst_top_pixel = FRAME_HEIGHT  # Start at bottom, track worst (lowest pixel number)
    fail_count = 0

    for m in dialogue_pattern.finditer(content):
        total_dialogues += 1
        start_tc = m.group(1)
        style_name = m.group(3)
        line_margin_v = int(m.group(6))
        text = m.group(7)

        # Use per-line MarginV if non-zero, else use style default
        style = styles.get(style_name, list(styles.values())[0])
        margin_v = line_margin_v if line_margin_v > 0 else style['margin_v']
        font_size = style['font_size']
        outline = style['outline']
        margin_l = style['margin_l']
        margin_r = style['margin_r']
        usable_w = FRAME_WIDTH - margin_l - margin_r

        is_safe, visual_lines, top_pixel, issues = validate_dialogue_entry(
            text, font_size, outline, margin_v, usable_w
        )

        max_visual_lines = max(max_visual_lines, visual_lines)
        worst_top_pixel = min(worst_top_pixel, top_pixel)

        if not is_safe:
            fail_count += 1
            for issue in issues:
                all_issues.append(f"  [{start_tc}] {issue}")
                all_issues.append(f"    Text: {visible_text(text)[:60]}")

    stats = {
        'total_dialogues': total_dialogues,
        'max_visual_lines': max_visual_lines,
        'worst_top_pixel': worst_top_pixel,
        'fail_count': fail_count,
        'styles': styles,
    }

    passed = fail_count == 0 and total_dialogues > 0
    return passed, stats, all_issues


def print_validation_report(passed, stats, issues, label=""):
    """Print a formatted validation report."""
    header = "=" * 60
    print(f"\n{header}")
    print(f"  SUBTITLE PLACEMENT VALIDATION{f' — {label}' if label else ''}")
    print(header)

    if not stats:
        print("  ERROR: Could not parse file")
        for issue in issues:
            print(f"  {issue}")
        print(header)
        return

    print(f"  Total dialogues:       {stats['total_dialogues']}")
    print(f"  Max visual lines:      {stats['max_visual_lines']}")
    print(f"  Worst top-edge pixel:  {stats['worst_top_pixel']}")
    print(f"  Danger line:           {DANGER_PIXEL}")
    print(f"  Failed entries:        {stats['fail_count']}")

    if stats.get('styles'):
        for name, s in stats['styles'].items():
            is_safe, top_px, bot_px, detail = validate_placement(
                s['margin_v'], s['font_size'], s['outline'], max_lines=2, label=name
            )
            print(f"  Style '{name}': {detail}")

    print(f"\n  {'PASS' if passed else 'FAIL'} — ", end="")
    if passed:
        clearance = stats['worst_top_pixel'] - FACE_ZONE_BOTTOM
        print(f"All {stats['total_dialogues']} dialogues safe. "
              f"Worst case: {clearance}px clearance below chin.")
    else:
        print(f"{stats['fail_count']}/{stats['total_dialogues']} dialogues UNSAFE:")
        for issue in issues[:20]:  # Cap output
            print(issue)
        if len(issues) > 20:
            print(f"  ... and {len(issues) - 20} more issues")

    print(header + "\n")


# ══════════════════════════════════════════════════════════════════════════════
#  SRT PARSING
# ══════════════════════════════════════════════════════════════════════════════

def parse_srt(filepath):
    """Parse SRT file into list of (index, start_ms, end_ms, text) tuples."""
    if not os.path.exists(filepath):
        print(f"ERROR: SRT file not found: {filepath}")
        sys.exit(1)
    if os.path.getsize(filepath) == 0:
        print(f"ERROR: SRT file is empty: {filepath}")
        sys.exit(1)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read().strip()

    blocks = re.split(r"\n\n+", content)
    entries = []

    for block in blocks:
        lines = block.strip().split("\n")
        if len(lines) < 3:
            continue
        idx = int(lines[0].strip())
        timecode = lines[1].strip()
        text = " ".join(lines[2:]).strip()

        match = re.match(
            r"(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})",
            timecode,
        )
        if not match:
            continue

        h1, m1, s1, ms1 = int(match[1]), int(match[2]), int(match[3]), int(match[4])
        h2, m2, s2, ms2 = int(match[5]), int(match[6]), int(match[7]), int(match[8])

        start_ms = h1 * 3600000 + m1 * 60000 + s1 * 1000 + ms1
        end_ms = h2 * 3600000 + m2 * 60000 + s2 * 1000 + ms2

        entries.append((idx, start_ms, end_ms, text))

    return entries


def merge_short_entries(entries, min_ms=800, max_merged_words=7):
    """QCR-026: fal.ai Whisper emits ultra-short trailing-word segments (e.g. "artificial"
    0.36s, "empresas." 0.58s, "Na bolsa." 0.62s) that render as <1s subtitle flashes and
    draw recurring MINOR SUBTITLE_TIMING deductions in QC. Merge any entry shorter than
    `min_ms` into an ADJACENT entry (prefer the previous; the next if it's the first),
    as long as the combined word count stays within `max_merged_words` (split_segment will
    re-split the merged text downstream if it now exceeds the 5-word/2.5s caps). This keeps
    every subtitle screen on-screen long enough to read without over-merging into walls of text.
    """
    if not entries:
        return entries
    merged = []
    for idx, start_ms, end_ms, text in entries:
        dur = end_ms - start_ms
        wc = len(text.split())
        if merged and dur < min_ms and (len(merged[-1][3].split()) + wc) <= max_merged_words:
            # extend the previous entry to absorb this short one
            p_idx, p_start, _p_end, p_text = merged[-1]
            merged[-1] = (p_idx, p_start, end_ms, (p_text + " " + text).strip())
            continue
        merged.append((idx, start_ms, end_ms, text))
    # edge case: a too-short FIRST entry — fold it forward into the next
    if len(merged) >= 2:
        f_idx, f_start, f_end, f_text = merged[0]
        if (f_end - f_start) < min_ms and (len(f_text.split()) + len(merged[1][3].split())) <= max_merged_words:
            n_idx, _n_start, n_end, n_text = merged[1]
            merged[0:2] = [(f_idx, f_start, n_end, (f_text + " " + n_text).strip())]
    return merged


def ms_to_ass(ms):
    """Convert milliseconds to ASS timecode (H:MM:SS.cc)."""
    h = ms // 3600000
    ms %= 3600000
    m = ms // 60000
    ms %= 60000
    s = ms // 1000
    cs = (ms % 1000) // 10
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def ass_to_ms(tc):
    """Parse an ASS timecode (H:MM:SS.cc) back to milliseconds."""
    h, m, rest = tc.split(":")
    s, cs = rest.split(".")
    return ((int(h) * 3600) + (int(m) * 60) + int(s)) * 1000 + int(cs) * 10


def floor_short_dialogues(dialogues, min_ms=800, gap_ms=40):
    """QCR-043: give sub-min_ms 'flash' subtitle entries more readable
    on-screen time by extending their END into the trailing GAP before the next cue.

    Background: split_segment / safe_split_entries (QCR-017/026) can emit sub-0.8s
    pieces (e.g. a 1-word trailing "fácil." 0.52s, or a forced split of a short 6-word
    segment). Gemini deducts a MINOR SUBTITLE_TIMING for each (QCR-026 residual). This
    pass ONLY lengthens display time — it never shortens, reorders, re-times the start,
    or lets an entry overlap the next one (a gap_ms guard is kept), so timing/sync are
    preserved. Back-to-back pieces with no trailing gap are left as-is (the alternative
    would be a worse 3-line wrap); the fixable subset (anything with slack before the
    next cue, incl. the last entry) is floored to min_ms.
    """
    parsed = []  # (start_ms, end_ms, line)
    for d in dialogues:
        f = d.split(",", 9)
        if len(f) < 10 or not d.startswith("Dialogue:"):
            parsed.append((None, None, d)); continue
        parsed.append((ass_to_ms(f[1].strip()), ass_to_ms(f[2].strip()), d))
    n = len(parsed)
    for i, (st, en, line) in enumerate(parsed):
        if st is None or (en - st) >= min_ms:
            continue
        # next real cue's start (the ceiling we must not cross)
        nxt = next((parsed[j][0] for j in range(i + 1, n) if parsed[j][0] is not None), None)
        target = st + min_ms
        if nxt is not None:
            target = min(target, nxt - gap_ms)
        if target <= en:
            continue  # no slack available — leave the flash as-is
        f = line.split(",", 9)
        f[2] = ms_to_ass(target)
        parsed[i] = (st, target, ",".join(f))
    return [p[2] for p in parsed]


def add_lead_out(dialogues, tail_ms=200, gap_ms=30, max_fill_ms=500):
    """QCR-256: give EVERY cue a short
    lead-out so it holds ~tail_ms past the word it ends on, instead of cutting the
    instant the word finishes. Gemini deducts a MINOR SUBTITLE_TIMING for each cue
    that 'disappears too early, before the speaker finishes X' — on a real run that
    was 44 x -1 = grade 56, even though the deterministic verify_srt_timing gate
    PASSED (the lead-out is a readability convention, not a sync error).

    SAFE-BY-CONSTRUCTION: the extension only fills a SMALL trailing gap
    (<= max_fill_ms). Premium §3b/§5b caption-suppression windows are >=1s gaps, so
    a cue immediately before one is never extended into it (max_fill_ms guard) — this
    preserves QCR-193/229 (no burned subtitle inside a floating-caption window). It
    never shortens, never re-times a start, and keeps a gap_ms guard before the next
    cue, so timing/sync are preserved. Runs after floor_short_dialogues (which handles
    the sub-0.8s flashes); this pass tops up the normal-length cues."""
    parsed = []
    for d in dialogues:
        f = d.split(",", 9)
        if len(f) < 10 or not d.startswith("Dialogue:"):
            parsed.append((None, None, d)); continue
        parsed.append((ass_to_ms(f[1].strip()), ass_to_ms(f[2].strip()), d))
    n = len(parsed)
    for i, (st, en, line) in enumerate(parsed):
        if st is None:
            continue
        nxt = next((parsed[j][0] for j in range(i + 1, n) if parsed[j][0] is not None), None)
        if nxt is None:
            target = en + tail_ms            # last cue: free to extend
        else:
            gap = nxt - en
            if gap > max_fill_ms:
                continue                     # big gap (likely a suppression window) — leave it
            target = min(en + tail_ms, nxt - gap_ms)
        if target > en:
            f = line.split(",", 9)
            f[2] = ms_to_ass(target)
            parsed[i] = (st, target, ",".join(f))
    return [p[2] for p in parsed]


# ══════════════════════════════════════════════════════════════════════════════
#  SEGMENT SPLITTING
# ══════════════════════════════════════════════════════════════════════════════

def split_segment(start_ms, end_ms, text, max_words=5, max_duration_ms=2500):
    """Split a long SRT segment into multiple shorter segments.

    Splits proportionally by word count, preserving the original
    start/end timestamps from Whisper (no drift).
    Max 5 words per segment to ensure max 2 visual lines at Font 68.
    """
    words = text.split()
    total_words = len(words)
    duration = end_ms - start_ms

    # No split needed
    if total_words <= max_words and duration <= max_duration_ms:
        return [(start_ms, end_ms, text)]

    # Determine number of splits
    n_splits = max(
        (total_words + max_words - 1) // max_words,
        (duration + max_duration_ms - 1) // max_duration_ms,
    )
    n_splits = max(n_splits, 2)

    # Split words evenly
    words_per_split = total_words / n_splits
    segments = []

    for i in range(n_splits):
        w_start = round(i * words_per_split)
        w_end = round((i + 1) * words_per_split)
        seg_words = words[w_start:w_end]
        if not seg_words:
            continue

        # Proportional timestamp based on word position
        t_start = start_ms + round(duration * (w_start / total_words))
        t_end = start_ms + round(duration * (w_end / total_words))

        segments.append((t_start, t_end, " ".join(seg_words)))

    return segments


# ══════════════════════════════════════════════════════════════════════════════
#  HIGHLIGHT APPLICATION
# ══════════════════════════════════════════════════════════════════════════════

def apply_highlights(text, highlight_words):
    """Apply yellow highlights to matching words in text.

    Uses word-boundary matching to avoid highlighting inside other words.
    Multi-word phrases (e.g. "inteligência artificial") are matched first.
    Returns ASS-formatted text with {\\rYellow} and {\\rWhite} tags.
    """
    result = text

    # Sort by length (longest first) so multi-word phrases match before single words
    sorted_words = sorted(highlight_words, key=len, reverse=True)

    for word in sorted_words:
        escaped = re.escape(word)
        pattern = re.compile(r"(?<!\w)" + escaped + r"(?!\w)", re.IGNORECASE)

        def replace_if_not_tagged(m):
            start = m.start()
            preceding = result[:start]
            if preceding.endswith("{\\rYellow}") or "{\\rYellow}" in preceding[max(0, start - 50):start]:
                opens = preceding.count("{\\rYellow}")
                closes = preceding.count("{\\rWhite}")
                if opens > closes:
                    return m.group(0)
            return f"{{\\rYellow}}{m.group(0)}{{\\rWhite}}"

        result = pattern.sub(replace_if_not_tagged, result)

    # Highlight standalone numbers (tag-aware: skip a number already inside a
    # {\rYellow}...{\rWhite} run, else an explicit --highlights number gets double-wrapped
    # into {\rYellow}{\rYellow}N{\rWhite}{\rWhite} — cosmetically redundant and it confuses
    # the QCR-016 [YELLOW: ...] ground-truth extraction. QCR-059.)
    num_pattern = re.compile(
        r"(?<!\w)(\d[\d.,]*\s*(?:por cento|%|bilhões|milhões|mil|horas|minutos|segundos)?)(?!\w)"
    )

    def wrap_number_if_not_tagged(m):
        start = m.start()
        preceding = result[:start]
        if "{\\rYellow}" in preceding[max(0, start - 50):start]:
            if preceding.count("{\\rYellow}") > preceding.count("{\\rWhite}"):
                return m.group(0)  # already inside a yellow run
        return f"{{\\rYellow}}{m.group(0)}{{\\rWhite}}"

    result = num_pattern.sub(wrap_number_if_not_tagged, result)

    # Final safety net: collapse any nested duplicate tags that slipped through.
    result = re.sub(r"(\{\\rYellow\})+", r"{\\rYellow}", result)
    result = re.sub(r"(\{\\rWhite\})+", r"{\\rWhite}", result)

    return result


# ══════════════════════════════════════════════════════════════════════════════
#  LINE BREAKING WITH STRICT ENFORCEMENT
# ══════════════════════════════════════════════════════════════════════════════

def add_line_breaks(text, max_words_per_line=3, max_chars_per_line=18, font_size=68):
    """Add \\N line breaks to keep lines short for phone readability.

    CRITICAL: At Font 68 + Arial Black on 940px usable width (~70px MarginL/R),
    approximately 18-20 chars fit per visual line. Any line exceeding this will
    visually wrap, creating an unexpected 3rd line that overlaps the face.

    Rules:
    - Max 3 words per visual line (prevents wrapping with Portuguese long words)
    - Max 18 chars per visual line (hard cap for Arial Black at 68px)
    - HARD REJECT at 20 chars (absolute maximum — wrapping guaranteed beyond this)
    - Always exactly 2 visual lines max (1 line if short enough)
    """
    words = text.split()
    if len(words) <= max_words_per_line and visible_len(text) <= max_chars_per_line:
        return text

    # If only 1 word but it's very long, we can't split it — just return it
    if len(words) == 1:
        return text

    # Try splitting at every possible point, find the split that minimizes
    # the maximum visible line length while keeping to 2 lines
    best_split = len(words) // 2
    best_max_len = float('inf')

    for split_at in range(1, len(words)):
        l1 = " ".join(words[:split_at])
        l2 = " ".join(words[split_at:])
        max_len = max(visible_len(l1), visible_len(l2))
        # Also penalize if either line has too many words
        word_penalty = max(0, split_at - max_words_per_line) + max(0, (len(words) - split_at) - max_words_per_line)
        effective = max_len + word_penalty * 5
        if effective < best_max_len:
            best_max_len = effective
            best_split = split_at

    line1 = " ".join(words[:best_split])
    line2 = " ".join(words[best_split:])

    return f"{line1}\\N{line2}"


def enforce_line_limits(text, max_chars=20, font_size=68):
    """Final enforcement pass: if any explicit line exceeds absolute max chars,
    force a further split. Returns None if the text CANNOT be made safe
    (would require 3+ visual lines).

    This is the last line of defense before the dialogue is emitted.
    """
    explicit_lines = text.replace('\\N', '\n').split('\n')

    # If already 2 explicit lines, check each
    if len(explicit_lines) >= 2:
        # Check if any line would visually wrap
        for line in explicit_lines:
            vlen = visible_len(line)
            if vlen > max_chars:
                # This line will wrap — 3+ visual lines guaranteed
                return None  # Signal: needs re-splitting at segment level
        return text

    # Single line — check if it needs splitting
    if visible_len(text) <= max_chars:
        return text

    # Needs a line break — use add_line_breaks
    result = add_line_breaks(text, max_chars_per_line=max_chars - 2, font_size=font_size)

    # Verify the result
    for line in result.replace('\\N', '\n').split('\n'):
        if visible_len(line) > max_chars:
            return None  # Can't fix — signal for re-split
    return result


def safe_split_entries(seg_start, seg_end, seg_text, highlight_words, font_size, max_chars=18):
    """QCR-017: recursively produce timed (start, end, formatted) entries
    that are GUARANTEED ≤2 visual lines with every visual line ≤ max_chars.

    The previous fallback split a too-long segment at the naive midpoint exactly once
    and did NOT re-check the halves, so long Portuguese words (e.g. "absolutamente nada.")
    still emitted a 19-char line that the validator hard-fails — forcing a manual ASS
    re-split every run. This balances the split point (minimizing the line-length gap)
    and recurses by TIME until each screen fits, matching the validator's 18-char cap.
    Highlights are re-applied per sub-text so tag pairing never breaks across a split.
    """
    text = seg_text.strip()
    words = text.split()
    wrapped = add_line_breaks(apply_highlights(text, highlight_words), font_size=font_size)
    vis = wrapped.replace('\\N', '\n').split('\n')
    if len(vis) <= 2 and all(visible_len(l) <= max_chars for l in vis):
        return [(seg_start, seg_end, wrapped)]
    if len(words) <= 1:
        return [(seg_start, seg_end, wrapped)]  # a single over-long word can't be split
    # pick the split that best balances the two halves' visible lengths
    total = len(words)
    best_at, best_metric = total // 2, float('inf')
    for at in range(1, total):
        l1 = " ".join(words[:at]); l2 = " ".join(words[at:])
        metric = abs(visible_len(l1) - visible_len(l2))
        if metric < best_metric:
            best_metric, best_at = metric, at
    dur = seg_end - seg_start
    t_mid = seg_start + round(dur * (best_at / total))
    return (safe_split_entries(seg_start, t_mid, " ".join(words[:best_at]), highlight_words, font_size, max_chars)
            + safe_split_entries(t_mid, seg_end, " ".join(words[best_at:]), highlight_words, font_size, max_chars))


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN CONVERSION
# ══════════════════════════════════════════════════════════════════════════════

# QCR-236: Gemini QC consistently flags EVERY subtitle as "appears too early"
# (~0.1s before the spoken word's onset) → -1 each = blanket fail (a real run went from 43 → after a
# manual +0.10s start shift, iter2=88). Gemini-derived SRT onsets sit slightly ahead of the word,
# so nudge every cue START later by this much. Clamped to keep ≥0.20s display and to never cross
# the cue's own end; harmless to the caption-sync containment gate and to verify_srt_timing
# (onset tolerance 1.2s). Set to 0 to disable.
ONSET_SHIFT_MS = 80


def convert_srt_to_ass(
    srt_path, ass_path, highlight_words=None, standalone=False, fade_first=True
):
    """Main conversion: SRT → ASS with exact timestamps, highlights, and validation."""
    entries = parse_srt(srt_path)
    entries = merge_short_entries(entries)  # QCR-026: fold <0.8s flash entries into a neighbor
    if ONSET_SHIFT_MS:                       # QCR-236: nudge each cue start later to fix the
        _shifted = []                        # "subtitle appears too early" Gemini family
        for _idx, _s, _e, _t in entries:
            _ns = min(_s + ONSET_SHIFT_MS, _e - 200)
            _shifted.append((_idx, max(_s, _ns), _e, _t))
        entries = _shifted
    header = STANDALONE_HEADER if standalone else MOTION_HEADER

    if standalone:
        font_size, outline, margin_v = 92, 1, 440
        max_chars = 22  # Wider at 92px with 80px margins? No — 920px usable, still ~20 chars
    else:
        font_size, outline, margin_v = 68, 5, 280
        max_chars = 18  # QCR-017: align with validator's 18-char hard fail (was 20 → emitted 19-char lines that failed validation)

    # ── Pre-flight placement validation ──
    print("\n--- Pre-flight placement check ---")
    for n_lines in [1, 2]:
        is_safe, top_px, bot_px, detail = validate_placement(
            margin_v, font_size, outline, max_lines=n_lines,
            label=f"{'standalone' if standalone else 'motion'} {n_lines}-line"
        )
        status = "SAFE" if is_safe else "REJECT"
        print(f"  [{status}] {detail}")

    # Validate that 2-line config is safe (it must be, or we abort)
    is_safe_2line, _, _, _ = validate_placement(margin_v, font_size, outline, max_lines=2)
    if not is_safe_2line:
        print(f"\nFATAL: 2-line subtitle placement is UNSAFE with current config.")
        print(f"  MarginV={margin_v}, Font={font_size}, Outline={outline}")
        print(f"  Subtitles WILL overlap the face. Aborting.")
        sys.exit(1)

    # Check that 3-line is UNSAFE (validates our need to prevent 3-line wrapping)
    is_safe_3line, top_3, _, _ = validate_placement(margin_v, font_size, outline, max_lines=3)
    if not is_safe_3line:
        print(f"  [INFO] 3-line top edge at pixel {top_3} — confirms 3-line wrapping must be prevented")
    print("--- End pre-flight check ---\n")

    if highlight_words is None:
        highlight_words = DEFAULT_HIGHLIGHTS

    dialogues = []
    is_first = True
    validation_issues = []

    for idx, start_ms, end_ms, text in entries:
        # Split long segments
        segments = split_segment(start_ms, end_ms, text)

        for seg_start, seg_end, seg_text in segments:
            # Apply highlights
            formatted = apply_highlights(seg_text, highlight_words)

            # Add line breaks for readability
            formatted = add_line_breaks(formatted, font_size=font_size)

            # Enforce absolute line limits
            enforced = enforce_line_limits(formatted, max_chars=max_chars, font_size=font_size)
            if enforced is None:
                # Text too long for 2 lines at ≤max_chars — QCR-017: recursively split into
                # balanced timed entries that each fit, instead of one naive midpoint split.
                for sub_start, sub_end, sub_formatted in safe_split_entries(
                    seg_start, seg_end, seg_text, highlight_words, font_size, max_chars=max_chars
                ):
                    sub_visible = visible_text(sub_formatted)
                    style = "Yellow" if bool(re.search(r"\b[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]{3,}\b", sub_visible)) else "White"
                    prefix = ""
                    if is_first and fade_first:
                        prefix = "{\\fad(200,0)}"
                        is_first = False

                    dialogues.append(
                        f"Dialogue: 0,{ms_to_ass(sub_start)},{ms_to_ass(sub_end)},{style},,0,0,0,,{prefix}{sub_formatted}"
                    )
                continue

            formatted = enforced

            # Determine style
            has_caps = bool(re.search(r"\b[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]{3,}\b", seg_text))
            style = "Yellow" if has_caps else "White"

            # Add fade-in on first subtitle
            prefix = ""
            if is_first and fade_first:
                prefix = "{\\fad(200,0)}"
                is_first = False

            start_tc = ms_to_ass(seg_start)
            end_tc = ms_to_ass(seg_end)

            dialogues.append(
                f"Dialogue: 0,{start_tc},{end_tc},{style},,0,0,0,,{prefix}{formatted}"
            )

    dialogues = floor_short_dialogues(dialogues)  # QCR-043: extend sub-0.8s flashes into trailing gap
    dialogues = add_lead_out(dialogues)           # QCR-256: +200ms readability lead-out on every cue (small gaps only)
    output = header + "\n" + "\n".join(dialogues) + "\n"

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(output)

    if len(dialogues) == 0:
        print(f"WARNING: 0 dialogues generated from {len(entries)} SRT entries — check SRT format")

    print(f"Converted {len(entries)} SRT entries → {len(dialogues)} ASS dialogues")
    print(f"Output: {ass_path}")

    # Print any warnings from conversion
    for issue in validation_issues:
        print(f"  {issue}")

    # Verify output was written
    if not os.path.exists(ass_path) or os.path.getsize(ass_path) == 0:
        print(f"ERROR: Output file was not written or is empty: {ass_path}")
        sys.exit(1)

    # ── Post-conversion validation ──
    print("\n--- Post-conversion validation ---")
    passed, stats, issues = validate_ass_file(ass_path)
    print_validation_report(passed, stats, issues, label=os.path.basename(ass_path))

    if not passed:
        print("ERROR: Generated ASS file FAILED placement validation.")
        print("Subtitles would overlap the speaker's face. DO NOT BURN.")
        sys.exit(1)

    # ── Summary statistics ──
    print("--- Summary ---")
    print(f"  Dialogues:          {stats['total_dialogues']}")
    print(f"  Max visual lines:   {stats['max_visual_lines']}")
    print(f"  Worst top-edge px:  {stats['worst_top_pixel']}")
    print(f"  Face clearance:     {stats['worst_top_pixel'] - FACE_ZONE_BOTTOM}px below chin")
    print(f"  Verdict:            PASS — safe to burn")
    print()

    return len(dialogues)


# ══════════════════════════════════════════════════════════════════════════════
#  CLI ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert SRT to viral ASS subtitles")
    parser.add_argument("input", help="Input SRT file path (or ASS file with --validate-only)")
    parser.add_argument("output", nargs="?", help="Output ASS file path")
    parser.add_argument(
        "--highlights",
        default="",
        help="Comma-separated additional highlight words",
    )
    parser.add_argument(
        "--standalone",
        action="store_true",
        help="Use standalone style (Font 92, MarginV 440) instead of motion style",
    )
    parser.add_argument(
        "--no-fade", action="store_true", help="Disable fade-in on first subtitle"
    )
    parser.add_argument(
        "--no-default-highlights",
        action="store_true",
        help="QCR-044: use ONLY the --highlights words, NOT the generic DEFAULT_HIGHLIGHTS set. "
             "Prevents the default 'inteligência artificial'/'EXATAMENTE' etc. from firing "
             "inconsistently (e.g. missing a plural inflection) and tripping QCR-035 highlight "
             "consistency. Pass a coherent set via --highlights: recurring concept + brands + numerals.",
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Validate an existing ASS file without converting. Input = ASS file path.",
    )

    args = parser.parse_args()

    # ── Validate-only mode ──
    if args.validate_only:
        ass_path = args.input
        if not ass_path.endswith('.ass'):
            print(f"WARNING: File does not have .ass extension: {ass_path}")

        passed, stats, issues = validate_ass_file(ass_path)
        print_validation_report(passed, stats, issues, label=os.path.basename(ass_path))

        sys.exit(0 if passed else 1)

    # ── Normal conversion mode ──
    if not args.output:
        print("ERROR: Output path required for conversion mode")
        parser.print_help()
        sys.exit(1)

    extra_words = set()
    if args.highlights:
        extra_words = {w.strip() for w in args.highlights.split(",") if w.strip()}

    all_highlights = extra_words if args.no_default_highlights else (DEFAULT_HIGHLIGHTS | extra_words)

    convert_srt_to_ass(
        args.input,
        args.output,
        highlight_words=all_highlights,
        standalone=args.standalone,
        fade_first=not args.no_fade,
    )
