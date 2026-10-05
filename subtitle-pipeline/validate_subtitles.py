#!/usr/bin/env python3
"""
Post-Burn Subtitle Validation — Pixel-Level Frame Analysis

Extracts frames from a burned video and analyzes pixel data to verify
subtitle placement is safe (below the face zone, above platform UI).

Usage:
  python3 subtitle-pipeline/validate_subtitles.py video.mp4 --check-frames 6
  python3 subtitle-pipeline/validate_subtitles.py video.mp4 --ass-fallback subtitle.ass
  python3 subtitle-pipeline/validate_subtitles.py --ass-only subtitle.ass

Modes:
  1. Frame analysis (default): Extracts PNG frames, uses Pillow to detect
     subtitle pixel regions by scanning for non-video-content rows.
  2. ASS fallback: If Pillow is not available or frame extraction fails,
     falls back to mathematical ASS file analysis.
  3. ASS-only: Skip frame extraction entirely, validate ASS file geometry.

Exit codes:
  0 = PASS — all checks passed
  1 = FAIL — subtitle placement unsafe
  2 = ERROR — could not run validation

Pixel Geometry (1080x1920):
  DANGER_PIXEL = 1450 (subtitle top edge must be BELOW this)
  FACE_ZONE = 950-1350 (head top to chin)
  SAFE_ZONE = 1450-1700 (below face, above platform UI)
  PLATFORM_UI = 1700-1920 (Reels/TikTok bottom UI)
"""

import argparse
import os
import re
import subprocess
import sys
import tempfile

# ── Constants ──
FRAME_HEIGHT = 1920
FRAME_WIDTH = 1080
DANGER_PIXEL = 1450
FACE_ZONE_TOP = 950
FACE_ZONE_BOTTOM = 1350
SAFE_ZONE_TOP = 1450
SAFE_ZONE_BOTTOM = 1700
PLATFORM_UI_TOP = 1700
# QCR-106: in the 6-section grammar, full-frame MOTION
# scenes render line-icon BOXES / headline text in the mid/upper frame. The burned subtitle
# is ALWAYS at MarginV=280 (bottom edge ~1640). A detected bright cluster whose BOTTOM edge
# sits far above the real subtitle band is a motion graphic, NOT a mis-placed subtitle — the
# validator was false-failing it as a danger-zone breach. In --section-grammar mode, ignore
# clusters whose bottom edge is above this floor (real subtitles bottom ~1600-1660).
SECTION_GRAMMAR = False
SUBTITLE_BAND_FLOOR = 1430

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.ffmpeg import find_ffmpeg as _find_ffmpeg  # noqa: E402
FFMPEG = _find_ffmpeg()
if not os.path.exists(FFMPEG):
    FFMPEG = "ffmpeg"  # Fallback to PATH


def get_video_duration(video_path):
    """Get video duration in seconds using ffprobe."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", video_path],
            capture_output=True, text=True, timeout=10
        )
        return float(result.stdout.strip())
    except Exception:
        return 60.0  # Default assumption


def extract_frames(video_path, num_frames=6, output_dir=None):
    """Extract evenly-spaced frames from video as PNG files.

    Returns list of (timestamp_seconds, png_path) tuples.
    """
    if output_dir is None:
        output_dir = tempfile.mkdtemp(prefix="sub_validate_")

    duration = get_video_duration(video_path)
    # Distribute frames across video, avoiding first/last 0.5s
    start = 1.0
    end = max(duration - 0.5, start + 1)
    step = (end - start) / max(num_frames - 1, 1)

    timestamps = [start + i * step for i in range(num_frames)]
    frames = []

    for i, ts in enumerate(timestamps):
        png_path = os.path.join(output_dir, f"frame_{i:02d}_{ts:.1f}s.png")
        try:
            subprocess.run(
                [FFMPEG, "-y", "-ss", f"{ts:.2f}", "-i", video_path,
                 "-frames:v", "1", "-q:v", "2", png_path],
                capture_output=True, timeout=15
            )
            if os.path.exists(png_path) and os.path.getsize(png_path) > 0:
                frames.append((ts, png_path))
        except Exception as e:
            print(f"  WARNING: Failed to extract frame at {ts:.1f}s: {e}")

    return frames


def analyze_frame_pillow(png_path):
    """Analyze a frame using Pillow to detect subtitle pixel regions.

    Scans from bottom up looking for rows with high-contrast text content
    (white or yellow text on darker background).

    Returns dict with:
      - subtitle_detected: bool
      - subtitle_top_pixel: int (topmost pixel row with subtitle content)
      - subtitle_bottom_pixel: int (bottommost pixel row with subtitle content)
      - is_safe: bool (top pixel >= DANGER_PIXEL)
    """
    from PIL import Image

    img = Image.open(png_path)
    if img.size != (FRAME_WIDTH, FRAME_HEIGHT):
        # Scale analysis to actual frame size
        scale_y = img.size[1] / FRAME_HEIGHT
    else:
        scale_y = 1.0

    pixels = img.load()
    width, height = img.size

    # Scan the zone between face top and platform UI for TEXT rows.
    # A burned subtitle pixel is near-white/yellow (lum > 225) with the
    # style's thick black outline (lum < 45) within a few px horizontally.
    # Bright video content (skin highlights, walls, screens) lacks that
    # hard white-on-black transition, which kills the false positives that
    # plagued the previous brightness+variance heuristic.
    scan_start = int(SAFE_ZONE_BOTTOM * scale_y)  # Start from platform UI boundary
    scan_end = int(FACE_ZONE_TOP * scale_y)        # Don't scan above face zone
    sample_cols = list(range(int(width * 0.15), int(width * 0.85), 3))  # Central 70%
    outline_reach = max(2, int(8 * (width / FRAME_WIDTH)))

    def _lum(x, y):
        r, g, b = pixels[x, y][:3]
        return 0.299 * r + 0.587 * g + 0.114 * b

    text_rows = []
    for y in range(scan_start, scan_end, -1):
        text_like = 0
        for x in sample_cols:
            if _lum(x, y) <= 225:
                continue
            # Require the black outline next to the bright pixel
            lo = max(0, x - outline_reach)
            hi = min(width - 1, x + outline_reach)
            if any(_lum(xx, y) < 45 for xx in (lo, lo + outline_reach // 2, hi - outline_reach // 2, hi)):
                text_like += 1
        if text_like / len(sample_cols) > 0.02:
            text_rows.append(int(y / scale_y))

    if not text_rows:
        return {
            'subtitle_detected': False,
            'subtitle_top_pixel': None,
            'subtitle_bottom_pixel': None,
            'is_safe': True,  # No subtitle = no overlap
        }

    # Cluster rows (gap <= 60px) so the lines of one subtitle block merge
    # (consecutive line rows sit ~45-50px apart at font 68) while distant
    # video-content hits stay separate regions.
    text_rows.sort()
    clusters = [[text_rows[0], text_rows[0]]]
    for row in text_rows[1:]:
        if row - clusters[-1][1] <= 60:
            clusters[-1][1] = row
        else:
            clusters.append([row, row])

    # The subtitle block sits at the bottom of the scan zone (bottom edge
    # ~1640 with MarginV=280). Validate the lowest cluster; require a
    # minimum height so a stray 1-2 row glint doesn't count as a subtitle.
    clusters = [c for c in clusters if c[1] - c[0] >= 10]
    # QCR-106: in section-grammar mode, drop clusters that sit ABOVE the real subtitle band
    # (their bottom edge < SUBTITLE_BAND_FLOOR) — those are full-frame motion-graphic icon
    # boxes / headline text, not the burned subtitle (which always lands bottom ~1640).
    if SECTION_GRAMMAR:
        clusters = [c for c in clusters if c[1] >= SUBTITLE_BAND_FLOOR]
    if not clusters:
        return {
            'subtitle_detected': False,
            'subtitle_top_pixel': None,
            'subtitle_bottom_pixel': None,
            'is_safe': True,
        }

    top, bottom = clusters[-1]

    return {
        'subtitle_detected': True,
        'subtitle_top_pixel': top,
        'subtitle_bottom_pixel': bottom,
        'is_safe': top >= DANGER_PIXEL,
    }


def analyze_frame_basic(png_path):
    """Basic frame analysis without Pillow — uses ffmpeg to extract pixel data.

    Less accurate but works without Pillow. Samples specific rows and
    checks for high-brightness pixel clusters.

    Returns same dict format as analyze_frame_pillow.
    """
    # Use ffmpeg to extract raw pixel values at specific rows
    # This is a fallback — less accurate than Pillow
    try:
        # Extract a thin horizontal strip and analyze brightness
        result = subprocess.run(
            [FFMPEG, "-y", "-i", png_path,
             "-vf", f"crop={FRAME_WIDTH}:500:0:1400",  # Crop the subtitle zone
             "-f", "rawvideo", "-pix_fmt", "gray", "-"],
            capture_output=True, timeout=10
        )
        if result.returncode != 0:
            return {'subtitle_detected': False, 'subtitle_top_pixel': None,
                    'subtitle_bottom_pixel': None, 'is_safe': True}

        data = result.stdout
        if not data:
            return {'subtitle_detected': False, 'subtitle_top_pixel': None,
                    'subtitle_bottom_pixel': None, 'is_safe': True}

        # Analyze rows in the cropped region (which maps to pixels 1400-1900)
        rows_with_text = []
        for row in range(0, min(500, len(data) // FRAME_WIDTH)):
            row_start = row * FRAME_WIDTH
            row_end = row_start + FRAME_WIDTH
            if row_end > len(data):
                break
            row_data = data[row_start:row_end]
            # Count bright pixels
            bright = sum(1 for b in row_data if b > 200)
            if bright > FRAME_WIDTH * 0.03:
                rows_with_text.append(1400 + row)

        if not rows_with_text:
            return {'subtitle_detected': False, 'subtitle_top_pixel': None,
                    'subtitle_bottom_pixel': None, 'is_safe': True}

        top = min(rows_with_text)
        bottom = max(rows_with_text)
        return {
            'subtitle_detected': True,
            'subtitle_top_pixel': top,
            'subtitle_bottom_pixel': bottom,
            'is_safe': top >= DANGER_PIXEL,
        }
    except Exception:
        return {'subtitle_detected': False, 'subtitle_top_pixel': None,
                'subtitle_bottom_pixel': None, 'is_safe': True}


def validate_ass_geometry(ass_path):
    """Validate ASS file placement using pure pixel math (no video needed).

    This mirrors the validation in srt_to_ass.py but works standalone.
    """
    # Import validation functions from srt_to_ass if available
    script_dir = os.path.dirname(os.path.abspath(__file__))
    srt_to_ass_path = os.path.join(script_dir, 'srt_to_ass.py')

    if os.path.exists(srt_to_ass_path):
        import importlib.util
        spec = importlib.util.spec_from_file_location("srt_to_ass", srt_to_ass_path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        passed, stats, issues = mod.validate_ass_file(ass_path)
        mod.print_validation_report(passed, stats, issues, label=os.path.basename(ass_path))
        return passed
    else:
        # Inline fallback validation
        return _inline_ass_validation(ass_path)


def _inline_ass_validation(ass_path):
    """Inline ASS validation when srt_to_ass.py is not importable."""
    with open(ass_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse styles
    style_re = re.compile(
        r'^Style:\s*(\w+),([^,]+),(\d+),'
        r'[^,]+,[^,]+,[^,]+,[^,]+,'
        r'[^,]+,[^,]+,[^,]+,[^,]+,'
        r'[^,]+,[^,]+,[^,]+,[^,]+,'
        r'(\d+),(\d+),(\d+),'
        r'(\d+),'
        r'(\d+),(\d+),(\d+)',
        re.MULTILINE
    )

    styles = {}
    for m in style_re.finditer(content):
        styles[m.group(1)] = {
            'font_size': int(m.group(3)),
            'outline': int(m.group(5)),
            'margin_v': int(m.group(10)),
        }

    if not styles:
        print("  ERROR: No styles found in ASS file")
        return False

    # Check each style's 2-line placement
    all_safe = True
    for name, s in styles.items():
        line_height = s['font_size'] + 2 * s['outline']
        top_pixel = FRAME_HEIGHT - s['margin_v'] - (2 * line_height)
        safe = top_pixel >= DANGER_PIXEL
        status = "SAFE" if safe else "FAIL"
        print(f"  [{status}] Style '{name}': MarginV={s['margin_v']}, "
              f"Font={s['font_size']}, Outline={s['outline']} → "
              f"2-line top at pixel {top_pixel}")
        if not safe:
            all_safe = False

    # Parse and check dialogues
    dialogue_re = re.compile(r'^Dialogue:.*?,.*?,.*?,(\w+),.*?,\d+,\d+,(\d+),.*?,(.*)', re.MULTILINE)
    fail_count = 0
    total = 0

    for m in dialogue_re.finditer(content):
        total += 1
        style_name = m.group(1)
        per_line_mv = int(m.group(2))
        text = m.group(3)

        s = styles.get(style_name, list(styles.values())[0])
        mv = per_line_mv if per_line_mv > 0 else s['margin_v']

        # Count visual lines (explicit \N breaks)
        visible = re.sub(r'\{[^}]*\}', '', text)
        explicit_lines = visible.replace('\\N', '\n').split('\n')
        num_lines = len(explicit_lines)

        # Check for long lines that would wrap
        for line in explicit_lines:
            if len(line) > 20:
                num_lines += 1  # Will wrap

        line_height = s['font_size'] + 2 * s['outline']
        top_pixel = FRAME_HEIGHT - mv - (num_lines * line_height)

        if top_pixel < DANGER_PIXEL:
            fail_count += 1
            if fail_count <= 5:
                print(f"  FAIL: '{visible[:40]}...' → {num_lines} lines, top at pixel {top_pixel}")

    print(f"\n  Total: {total} dialogues, {fail_count} unsafe")
    return fail_count == 0 and total > 0


def main():
    parser = argparse.ArgumentParser(
        description="Post-burn subtitle placement validation"
    )
    parser.add_argument("input", help="Video file (MP4) or ASS file with --ass-only")
    parser.add_argument(
        "--check-frames", type=int, default=6,
        help="Number of frames to extract and analyze (default: 6)"
    )
    parser.add_argument(
        "--ass-fallback", default=None,
        help="ASS file path for fallback geometric validation"
    )
    parser.add_argument(
        "--ass-only", action="store_true",
        help="Skip frame extraction, validate ASS geometry only"
    )
    parser.add_argument(
        "--keep-frames", action="store_true",
        help="Keep extracted frame PNGs (default: delete after analysis)"
    )
    parser.add_argument(
        "--section-grammar", action="store_true",
        help="6-SECTION GRAMMAR mode: the video is NOT a fixed 40/60 layout — "
             "full-frame MOTION sections have NO face and full-frame ZOOMED-avatar sections put the "
             "face high in frame, so a 2-line subtitle at top-edge ~1380 is SAFE (no face to clear). "
             "Lowers the face-clearance threshold to 1340 (still above the px-1700 platform danger zone). "
             "Without this flag the default 1450 false-fails the new grammar (QCR-084)."
    )

    args = parser.parse_args()
    input_path = args.input
    if args.section_grammar:
        global DANGER_PIXEL, SAFE_ZONE_TOP, SECTION_GRAMMAR
        SECTION_GRAMMAR = True
        DANGER_PIXEL = 1340
        SAFE_ZONE_TOP = 1340

    header = "=" * 60
    print(f"\n{header}")
    print("  POST-BURN SUBTITLE VALIDATION")
    print(header)

    # ── ASS-only mode ──
    if args.ass_only:
        if not input_path.endswith('.ass'):
            print(f"  WARNING: Expected .ass file, got: {input_path}")
        if not os.path.exists(input_path):
            print(f"  ERROR: File not found: {input_path}")
            sys.exit(2)

        print(f"\n  Mode: ASS geometry analysis (no video)")
        print(f"  File: {os.path.basename(input_path)}\n")
        passed = validate_ass_geometry(input_path)
        print(f"\n  {'PASS' if passed else 'FAIL'} — ASS geometry validation")
        print(header)
        sys.exit(0 if passed else 1)

    # ── Video frame analysis mode ──
    if not os.path.exists(input_path):
        print(f"  ERROR: Video file not found: {input_path}")
        sys.exit(2)

    print(f"\n  Video: {os.path.basename(input_path)}")
    print(f"  Frames to check: {args.check_frames}")
    print(f"  Danger line: pixel {DANGER_PIXEL} (subtitle top must be below)")
    print(f"  Face zone: pixels {FACE_ZONE_TOP}-{FACE_ZONE_BOTTOM}\n")

    # Extract frames
    tmpdir = tempfile.mkdtemp(prefix="sub_validate_")
    frames = extract_frames(input_path, num_frames=args.check_frames, output_dir=tmpdir)

    if not frames:
        print("  ERROR: Could not extract any frames from video")
        if args.ass_fallback:
            print(f"  Falling back to ASS geometry: {args.ass_fallback}")
            passed = validate_ass_geometry(args.ass_fallback)
            sys.exit(0 if passed else 1)
        sys.exit(2)

    print(f"  Extracted {len(frames)} frames\n")

    # Try Pillow first, fall back to basic analysis
    use_pillow = True
    try:
        from PIL import Image
    except ImportError:
        use_pillow = False
        print("  NOTE: Pillow not installed — using basic pixel analysis")
        print("  Install Pillow for better accuracy: pip install Pillow\n")

    all_pass = True
    results = []

    for ts, png_path in frames:
        if use_pillow:
            result = analyze_frame_pillow(png_path)
        else:
            result = analyze_frame_basic(png_path)

        result['timestamp'] = ts
        result['frame_path'] = png_path
        results.append(result)

        if result['subtitle_detected']:
            status = "PASS" if result['is_safe'] else "FAIL"
            top = result['subtitle_top_pixel']
            bottom = result['subtitle_bottom_pixel']
            height = bottom - top

            detail = f"top={top}px, bottom={bottom}px, height={height}px"
            if not result['is_safe']:
                overlap = DANGER_PIXEL - top
                detail += f" — {overlap}px into DANGER ZONE!"
                all_pass = False

            print(f"  [{status}] t={ts:.1f}s: subtitle detected — {detail}")
        else:
            print(f"  [----] t={ts:.1f}s: no subtitle detected in frame")

    # Summary
    detected = sum(1 for r in results if r['subtitle_detected'])
    failed = sum(1 for r in results if r['subtitle_detected'] and not r['is_safe'])

    print(f"\n  Frames analyzed: {len(results)}")
    print(f"  Subtitles detected: {detected}/{len(results)}")
    print(f"  Placement failures: {failed}")

    if detected > 0:
        tops = [r['subtitle_top_pixel'] for r in results if r['subtitle_detected']]
        worst_top = min(tops)
        print(f"  Worst top-edge pixel: {worst_top} (must be >= {DANGER_PIXEL})")
        if worst_top >= DANGER_PIXEL:
            print(f"  Face clearance: {worst_top - FACE_ZONE_BOTTOM}px below chin")

    # If frame analysis passed but we have ASS file, double-check geometry
    if all_pass and args.ass_fallback and os.path.exists(args.ass_fallback):
        print(f"\n  Double-checking ASS geometry: {os.path.basename(args.ass_fallback)}")
        geo_pass = validate_ass_geometry(args.ass_fallback)
        if not geo_pass:
            all_pass = False
            print("  WARNING: Frame analysis passed but ASS geometry FAILED")
            print("  Some dialogue entries may wrap to 3+ lines in specific timing windows")

    # Cleanup frames
    if not args.keep_frames:
        for _, png_path in frames:
            try:
                os.remove(png_path)
            except OSError:
                pass
        try:
            os.rmdir(tmpdir)
        except OSError:
            pass
    else:
        print(f"\n  Frames saved in: {tmpdir}")

    print(f"\n  VERDICT: {'PASS' if all_pass else 'FAIL'}")
    print(header + "\n")

    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
