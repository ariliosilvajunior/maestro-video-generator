#!/usr/bin/env python3
"""
Phase 6: Insert B-Roll Clips into Merged Video

Reads a b-roll manifest JSON and uses ffmpeg's filter_complex with
trim+concat to insert b-roll clips at specified timestamps.
Audio from the original video continues uninterrupted.

Usage:
    python3 broll-pipeline/insert_brolls.py \
        --main ~/Downloads/VideoName_motion.mp4 \
        --manifest ~/Downloads/VideoName_broll_manifest.json \
        --output ~/Downloads/VideoName_broll.mp4

    # Dry run (prints ffmpeg command without executing):
    python3 broll-pipeline/insert_brolls.py \
        --main ~/Downloads/VideoName_motion.mp4 \
        --manifest ~/Downloads/VideoName_broll_manifest.json \
        --output ~/Downloads/VideoName_broll.mp4 \
        --dry-run

Output:
    VideoName_broll.mp4 — main video with b-roll clips inserted
"""

import argparse
import json
import os
import shutil
import subprocess
import sys


# ─── Constants ───────────────────────────────────────────────────────────────

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.ffmpeg import find_ffmpeg, find_ffprobe, get_duration  # noqa: E402
from lib.paths import maestro_tmp  # noqa: E402

FFMPEG = find_ffmpeg()    # prefers a build with libass (see lib/ffmpeg.py)
FFPROBE = find_ffprobe()  # used by get_fps below
TARGET_WIDTH = 1080
TARGET_HEIGHT = 1920


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_fps(path: str) -> float:
    """Get video FPS."""
    result = subprocess.run(
        [FFPROBE, "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=r_frame_rate",
         "-of", "csv=p=0", path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        return 25.0  # fallback
    fps_str = result.stdout.strip().rstrip(",")
    if "/" in fps_str:
        num, den = fps_str.split("/")
        return float(num.strip().rstrip(",")) / float(den.strip().rstrip(","))
    return float(fps_str)


def validate_manifest(manifest: dict, main_duration: float) -> list[dict]:
    """Validate b-roll entries and return sorted list."""
    brolls = manifest.get("brolls", [])
    if not brolls:
        raise ValueError("Manifest contains no b-roll entries")

    # Sort by insert_at
    brolls = sorted(brolls, key=lambda b: b["insert_at"])

    for i, b in enumerate(brolls):
        insert_at = b["insert_at"]
        duration = b["duration"]
        end = insert_at + duration

        # Check file exists
        path = os.path.expanduser(b["file"])
        if not os.path.exists(path):
            raise FileNotFoundError(f"B-roll file not found: {path}")
        b["file"] = path  # resolve path

        # Check timestamps are within video bounds
        if insert_at < 0:
            raise ValueError(f"B-roll {i+1}: insert_at ({insert_at}) is negative")
        if end > main_duration + 0.5:
            raise ValueError(
                f"B-roll {i+1}: end time ({end}s) exceeds video duration ({main_duration}s)"
            )

        # Check no overlaps
        if i > 0:
            prev_end = brolls[i-1]["insert_at"] + brolls[i-1]["duration"]
            if insert_at < prev_end:
                raise ValueError(
                    f"B-roll {i+1} (at {insert_at}s) overlaps with b-roll {i} "
                    f"(ends at {prev_end}s)"
                )

    return brolls


def build_ffmpeg_command(
    main_video: str,
    brolls: list[dict],
    output_path: str,
    main_fps: float,
    crf: int = 18,
    preset: str = "medium",
) -> list[str]:
    """Build the ffmpeg command for b-roll insertion using trim+concat."""

    scale_filter = (
        f"scale={TARGET_WIDTH}:{TARGET_HEIGHT}:"
        f"force_original_aspect_ratio=decrease,"
        f"pad={TARGET_WIDTH}:{TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2,"
        f"setsar=1"
    )

    # Build inputs
    inputs = ["-i", main_video]
    for b in brolls:
        inputs.extend(["-i", b["file"]])

    # Build filter graph
    filter_parts = []
    concat_labels = []
    prev_end = 0.0

    for i, b in enumerate(brolls):
        insert_at = b["insert_at"]
        duration = b["duration"]
        end = insert_at + duration

        # Main video segment before this b-roll
        # setsar=1 (QCR-045): a padded HeyGen export can carry a near-but-not-1:1 SAR
        # (e.g. 16201:16200); the b-roll clips are setsar=1, so without this the concat
        # filter aborts with "SAR parameters do not match". Force 1:1 on every main segment.
        filter_parts.append(
            f"[0:v]trim={prev_end}:{insert_at},setpts=PTS-STARTPTS,setsar=1[seg{i}]"
        )

        # B-roll clip (trimmed to exact duration, scaled, fps-matched)
        broll_filters = (
            f"[{i+1}:v]trim=0:{duration},setpts=PTS-STARTPTS,"
            f"fps={main_fps},{scale_filter}[br{i}]"
        )
        filter_parts.append(broll_filters)

        concat_labels.extend([f"[seg{i}]", f"[br{i}]"])
        prev_end = end

    # Final main video segment after last b-roll
    n = len(brolls)
    filter_parts.append(
        f"[0:v]trim={prev_end},setpts=PTS-STARTPTS,setsar=1[seg{n}]"
    )
    concat_labels.append(f"[seg{n}]")

    # Concat all segments
    total_segments = len(concat_labels)
    filter_parts.append(
        f"{''.join(concat_labels)}concat=n={total_segments}:v=1:a=0[outv]"
    )

    filter_complex = ";\n    ".join(filter_parts)

    cmd = [
        FFMPEG, "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-map", "0:a",
        "-c:v", "libx264",
        "-crf", str(crf),
        "-preset", preset,
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        "-movflags", "+faststart",
        output_path,
    ]

    return cmd


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Insert b-roll clips into main video using ffmpeg"
    )
    parser.add_argument("--main", required=True, help="Path to main video (VideoName_motion.mp4)")
    parser.add_argument("--manifest", required=True, help="Path to b-roll manifest JSON")
    parser.add_argument("--output", required=True, help="Output path (VideoName_broll.mp4)")
    parser.add_argument("--crf", type=int, default=18, help="Video quality CRF (default: 18, lower=better)")
    parser.add_argument("--preset", default="medium", help="Encoding preset (ultrafast/fast/medium/slow)")
    parser.add_argument("--dry-run", action="store_true", help="Print ffmpeg command without executing")
    args = parser.parse_args()

    main_video = os.path.expanduser(args.main)
    manifest_path = os.path.expanduser(args.manifest)
    output_path = os.path.expanduser(args.output)

    print("=" * 60)
    print("PHASE 6: B-ROLL INSERTION")
    print("=" * 60)

    # ── Step 1: Validate inputs ──
    if not os.path.exists(main_video):
        print(f"ERROR: Main video not found: {main_video}")
        sys.exit(1)

    if not os.path.exists(manifest_path):
        print(f"ERROR: Manifest not found: {manifest_path}")
        sys.exit(1)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # ── Empty-manifest passthrough (QCR-233) ──
    # An all-MOTION video (every candidate window was a MISS → motion scene, the documented
    # default for motion-heavy/premium grammar videos) legitimately has 0 HITs. There is
    # nothing to splice — the motion render IS the deliverable. Copy main → output and exit 0
    # instead of raising "Manifest contains no b-roll entries" (which forced a manual cp).
    if not manifest.get("brolls"):
        print("\n  0 b-roll HITs — all-motion video; copying main → output (no-op passthrough).")
        shutil.copyfile(main_video, output_path)
        print(f"\n  Output: {output_path}")
        print("=" * 60)
        sys.exit(0)

    # ── Step 2: Get main video properties ──
    main_duration = get_duration(main_video)
    main_fps = get_fps(main_video)
    print(f"\nMain video: {main_video}")
    print(f"  Duration: {main_duration:.2f}s")
    print(f"  FPS: {main_fps}")

    # ── Step 3: Validate manifest ──
    print(f"\nManifest: {manifest_path}")
    brolls = validate_manifest(manifest, main_duration)
    print(f"  B-rolls: {len(brolls)}")

    for i, b in enumerate(brolls):
        broll_dur = get_duration(b["file"])
        print(f"\n  B-Roll {i+1}:")
        print(f"    File: {b['file']}")
        print(f"    Actual duration: {broll_dur:.2f}s")
        print(f"    Insert at: {b['insert_at']}s")
        print(f"    Use duration: {b['duration']}s")
        print(f"    Replaces: {b['insert_at']}s - {b['insert_at'] + b['duration']}s")

        if broll_dur < b["duration"]:
            print(f"    WARNING: B-roll clip ({broll_dur:.1f}s) is shorter than "
                  f"requested duration ({b['duration']}s). Output may have "
                  f"duration mismatch.")

    # ── Step 4: Build ffmpeg command ──
    cmd = build_ffmpeg_command(
        main_video, brolls, output_path,
        main_fps=main_fps,
        crf=args.crf,
        preset=args.preset,
    )

    if args.dry_run:
        print("\n" + "=" * 60)
        print("DRY RUN — ffmpeg command (not executed):")
        print("=" * 60)
        # Pretty-print the command
        cmd_str = cmd[0]
        i = 1
        while i < len(cmd):
            arg = cmd[i]
            if arg.startswith("-"):
                cmd_str += f" \\\n  {arg}"
                if i + 1 < len(cmd) and not cmd[i + 1].startswith("-"):
                    # Multi-line for filter_complex
                    if arg == "-filter_complex":
                        cmd_str += f' "{cmd[i+1]}"'
                    else:
                        cmd_str += f" {cmd[i+1]}"
                    i += 1
            else:
                cmd_str += f" {arg}"
            i += 1
        print(cmd_str)
        print("\nTo execute, run again without --dry-run")
        return

    # ── Step 5: Execute ffmpeg ──
    print(f"\n{'=' * 60}")
    print("EXECUTING FFMPEG")
    print(f"{'=' * 60}")
    print(f"Output: {output_path}")

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=900,  # 15 min — a 60s 1080x1920 re-encode can exceed 5 min (hit)
    )

    if result.returncode != 0:
        print(f"\nERROR: ffmpeg failed (exit code {result.returncode})")
        # Show last 30 lines of stderr (ffmpeg is very verbose)
        stderr_lines = result.stderr.strip().split("\n")
        for line in stderr_lines[-30:]:
            print(f"  {line}")
        sys.exit(1)

    # ── Step 6: Verify output ──
    print(f"\n{'=' * 60}")
    print("VERIFYING OUTPUT")
    print(f"{'=' * 60}")

    if not os.path.exists(output_path):
        print(f"ERROR: Output file was not created: {output_path}")
        sys.exit(1)

    output_size = os.path.getsize(output_path)
    output_duration = get_duration(output_path)

    print(f"  File: {output_path}")
    print(f"  Size: {output_size:,} bytes ({output_size / 1024 / 1024:.1f} MB)")
    print(f"  Duration: {output_duration:.2f}s")
    print(f"  Expected: {main_duration:.2f}s")

    duration_diff = abs(output_duration - main_duration)
    if duration_diff > 0.5:
        print(f"  WARNING: Duration difference ({duration_diff:.2f}s) exceeds 0.5s tolerance")
        print(f"  This may indicate a b-roll clip was shorter than specified.")
    else:
        print(f"  Duration match: OK (diff: {duration_diff:.3f}s)")

    # Extract verification frames
    print(f"\n  Extracting verification frames...")
    for i, b in enumerate(brolls):
        frame_time = b["insert_at"] + b["duration"] / 2  # middle of b-roll
        frame_path = os.path.join(maestro_tmp(), f"broll_verify_{i+1}.png")
        subprocess.run(
            [FFMPEG, "-y", "-ss", str(frame_time), "-i", output_path,
             "-frames:v", "1", frame_path],
            capture_output=True,
        )
        if os.path.exists(frame_path):
            print(f"    Frame at {frame_time}s: {frame_path}")
        else:
            print(f"    Frame at {frame_time}s: FAILED to extract")

    print(f"\n{'=' * 60}")
    print("PHASE 6 COMPLETE")
    print(f"  Output: {output_path}")
    print(f"  Next step: Add subtitles to {output_path}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
