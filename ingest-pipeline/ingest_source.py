#!/usr/bin/env python3
"""
ingest_source.py — Phase 0: ingest a PROVIDED source video into the pipeline.

The pipeline used to start only from a HeyGen avatar. This lets it start from any
real source file the user hands over (a camera recording, an export, a clip).
Produces the working assets the rest of the pipeline expects:
  - <output-dir>/<Name>_source.mp4   (1080x1920 h264 + aac — the "avatar" footage)
  - <scratch>/<Name>_audio.wav       (mono 16k — for Gemini transcription)

Geometry (default `cover`): scale + center-crop the source to 1080x1920 (fills the
frame; the rest of the pipeline overlays motion on the top 40%). `pad` = letterbox,
`none` = keep source size (only for already-vertical sources).

Segment: --start / --duration cut a slice (REQUIRED in spirit for long sources — a
20-min clip becomes a <=60s short).

BRAW (Blackmagic RAW, codec `brlt`): ffmpeg can demux the AUDIO (works) but CANNOT
decode the VIDEO — there is no headless BRAW decoder on macOS (only the GUI RAW
Player / Speed Test / Proxy Generator, none AppleScript-scriptable). So for .braw
this script extracts the audio (for transcription) and exits with a clear, actionable
instruction to provide a decodable export. NO AI generation, no fake frames.

Usage:
  python3 ingest_source.py <source> --name <Name> [--output-dir ~/Downloads]
      [--geometry cover|pad|none] [--start 0] [--duration 0]   (0 duration = whole clip)
Exit: 0 = working mp4 + audio ready · 2 = audio-only (video undecodable, e.g. BRAW) · 1 = failure
"""
import argparse, json, os, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.ffmpeg import find_ffmpeg as _find_ffmpeg, find_ffprobe as _find_ffprobe  # noqa: E402
from lib.paths import maestro_tmp, downloads  # noqa: E402
FF = _find_ffmpeg()
FP = _find_ffprobe()

UNDECODABLE_TAGS = {"brlt"}  # Blackmagic RAW; extend if other RAW/undecodable tags appear


def log(m): print(f"[ingest_source] {m}", file=sys.stderr)


def probe(src):
    out = subprocess.run([FP, "-v", "error", "-show_streams", "-show_format", "-of", "json", src],
                         capture_output=True, text=True)
    try:
        return json.loads(out.stdout)
    except json.JSONDecodeError:
        return {"streams": [], "format": {}}


def video_decodable(info):
    for s in info.get("streams", []):
        if s.get("codec_type") == "video":
            cn = (s.get("codec_name") or "").lower()
            tag = (s.get("codec_tag_string") or "").lower()
            if cn in ("none", "", "unknown") or tag in UNDECODABLE_TAGS:
                return False, f"{cn or 'unknown'}/{tag}"
            return True, cn
    return False, "no-video-stream"


def has_audio(info):
    return any(s.get("codec_type") == "audio" for s in info.get("streams", []))


def extract_audio(src, name, start, duration):
    out = os.path.join(maestro_tmp(), f"{name}_audio.wav")
    cmd = [FF, "-y", "-hide_banner", "-loglevel", "error"]
    if start: cmd += ["-ss", str(start)]
    cmd += ["-i", src]
    if duration: cmd += ["-t", str(duration)]
    cmd += ["-map", "0:a:0", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", out]
    subprocess.run(cmd, check=True, capture_output=True)
    return out


def transcode_video(src, name, output_dir, geometry, start, duration):
    out = os.path.join(os.path.expanduser(output_dir), f"{name}_source.mp4")
    if geometry == "cover":
        vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
    elif geometry == "pad":
        vf = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black"
    else:
        vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"  # safe default
    cmd = [FF, "-y", "-hide_banner", "-loglevel", "error"]
    if start: cmd += ["-ss", str(start)]
    cmd += ["-i", src]
    if duration: cmd += ["-t", str(duration)]
    cmd += ["-vf", vf, "-r", "25", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True, capture_output=True)
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("source")
    p.add_argument("--name", required=True)
    p.add_argument("--output-dir", default=downloads())
    p.add_argument("--geometry", choices=["cover", "pad", "none"], default="cover")
    p.add_argument("--start", default=0)
    p.add_argument("--duration", default=0)
    args = p.parse_args()

    src = os.path.expanduser(args.source)
    if not os.path.exists(src):
        log(f"ERROR: source not found: {src}"); return 1
    os.makedirs(os.path.expanduser(args.output_dir), exist_ok=True)
    info = probe(src)
    decodable, vinfo = video_decodable(info)

    # Audio first (works even for BRAW) — needed for transcription
    audio = None
    if has_audio(info):
        try:
            audio = extract_audio(src, args.name, args.start, args.duration)
            log(f"audio → {audio}")
        except subprocess.CalledProcessError as e:
            log(f"audio extract failed: {e.stderr.decode()[-200:] if e.stderr else e}")

    if not decodable:
        log("=" * 64)
        log(f"VIDEO NOT DECODABLE HEADLESSLY: codec {vinfo}.")
        if "brlt" in vinfo:
            log("This is Blackmagic RAW (.braw). ffmpeg has no BRAW decoder and the")
            log("installed Blackmagic apps (RAW Player / Speed Test / Proxy Generator)")
            log("are GUI-only (not scriptable). To proceed, provide a DECODABLE export:")
            log("  • Open the clip in 'Blackmagic Proxy Generator' (installed) → export")
            log("    an H.264/ProRes .mov/.mp4, OR export H.264 from the camera/Resolve;")
            log("  • then re-run: ingest_source.py <that_export> --name <Name> --start S --duration D")
            log("Audio WAS extracted above, so transcription/segment-planning can run now.")
        log("=" * 64)
        return 2  # audio-only; video blocked

    try:
        mp4 = transcode_video(src, args.name, args.output_dir, args.geometry, args.start, args.duration)
    except subprocess.CalledProcessError as e:
        log(f"ERROR transcoding video: {e.stderr.decode()[-300:] if e.stderr else e}"); return 1
    meta = probe(mp4)
    vs = next((s for s in meta["streams"] if s["codec_type"] == "video"), {})
    log(f"working video → {mp4} ({vs.get('width')}x{vs.get('height')} {vs.get('codec_name')})")
    print(mp4)
    return 0


if __name__ == "__main__":
    sys.exit(main())
