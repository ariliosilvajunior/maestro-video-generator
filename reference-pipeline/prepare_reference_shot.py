#!/usr/bin/env python3
"""
prepare_reference_shot.py — turn a raw reference screenshot (captured live via
Playwright MCP) into a pipeline-ready asset for the hand-drawn motion style.

Two outputs (pick with flags):
  1. ScreenshotCard asset (DEFAULT): copy + downscale the PNG into the Remotion
     project's public/refs/<name>.png so `<ScreenshotCard src="refs/<name>.png">`
     can frame + annotate it inside a motion scene. (The on-brand path.)
  2. --clip : also render a full-frame 1080x1920 b-roll clip (`<name>_ref.mp4`) with
     a subtle Ken-Burns zoom, for a clean full-screen reference reveal.

Usage:
  python3 prepare_reference_shot.py <scratch>/shot.png --name ToolRepo [--clip] [--seconds 5]

NO AI generation — this is a real screenshot of a real public page.
"""
import argparse, os, subprocess, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.ffmpeg import find_ffmpeg as _find_ffmpeg  # noqa: E402
from lib.paths import remotion_root, downloads  # noqa: E402

PUBLIC_REFS = os.path.join(remotion_root(), "public", "refs")
FFMPEG = _find_ffmpeg()


def prepare_card(src, name, max_w=1280):
    os.makedirs(PUBLIC_REFS, exist_ok=True)
    im = Image.open(src).convert("RGB")
    if im.width > max_w:
        h = round(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    out = os.path.join(PUBLIC_REFS, f"{name}.png")
    im.save(out, "PNG")
    return out, im.size


# SPLIT-PANEL evidence-card geometry (house rule). Must match src/library/premium.tsx
# PremiumEvidence + sections.tsx EvidenceReveal: the card fills the panel WIDTH and the
# image is shown WIDTH-BOUND (CSS width:100% height:auto) + top-anchored, then the card
# clips the bottom. So the displayed scale is ALWAYS card_w/prepW (no horizontal crop).
#   cardW = 1080-72 = 1008, imgH = 548 (visible window), barH = 46.
CARD_W = 1008     # PremiumEvidence/EvidenceReveal cardW (1080 - 72)
CARD_H = 594      # card height = BAR_H + imgH (46 + 548)
BAR_H = 46        # browser bar height
MAX_W = 1280      # prepare_card downscale width


def compute_focus(src_size, focus_xy, focus_size, card_w=CARD_W, card_h=CARD_H):
    """Map a MAIN-ELEMENT pixel (sx,sy) in the raw screenshot to the card-local
    focus={fx,fy} + focusR={rx,ry} so the draw-on circle lands ON that element.
    This is the circle-targeting contract (house rule): the circle
    must ring the ACTUAL main element, never empty space.

    The card shows the image WIDTH-BOUND (width:100%, height:auto) + top-anchored, then
    clips the bottom (overflow hidden). So the scale is card_w/prepW for BOTH axes (no
    horizontal crop at all) and only the bottom of the page is clipped vertically."""
    srcW, srcH = src_size
    prepW = min(srcW, MAX_W)
    pre = prepW / srcW            # screenshot px → prepared px (uniform downscale)
    img_h = card_h - BAR_H        # visible image window height inside the card
    pw = prepW                    # prepared image width
    scale = card_w / pw           # WIDTH-BOUND (matches CSS width:100%, height:auto)
    sx, sy = focus_xy
    ew, eh = focus_size
    ix = sx * pre * scale         # no horizontal crop → exact
    iy = sy * pre * scale         # top-anchored
    fx, fy = round(ix), round(BAR_H + iy)
    rx = round((ew * pre * scale) / 2 + 22)
    ry = round((eh * pre * scale) / 2 + 16)
    visible = iy < img_h          # element must be in the top window (else recapture/scroll)
    return {"fx": fx, "fy": fy, "rx": rx, "ry": ry, "visible": visible,
            "img_bottom_src": round(img_h / scale / pre)}


def make_clip(card_png, name, seconds, dims=(1080, 1920)):
    """Full-frame vertical clip: blurred fill bg + the screenshot fitted on top, slow zoom."""
    W, H = dims
    out = os.path.join(downloads(), f"{name}_ref.mp4")
    fps = 25
    frames = int(seconds * fps)
    # zoompan slow push-in (1.0 -> 1.08) over the screenshot, on a blurred cover background
    vf = (
        f"split=2[bg][fg];"
        f"[bg]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=20:2,eq=brightness=-0.06[bgb];"
        f"[fg]scale={W}:-1:force_original_aspect_ratio=decrease[fgs];"
        f"[bgb][fgs]overlay=(W-w)/2:(H-h)/2,"
        f"zoompan=z='min(zoom+0.0008,1.08)':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={fps},format=yuv420p"
    )
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-loop", "1", "-i", card_png,
                    "-t", str(seconds), "-vf", vf, "-c:v", "libx264", "-crf", "18",
                    "-pix_fmt", "yuv420p", out], check=True)
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("screenshot", help="Raw screenshot PNG (from Playwright)")
    p.add_argument("--name", required=True, help="Asset name (PascalCase, e.g. ClaudeRepo)")
    p.add_argument("--clip", action="store_true", help="Also render a full-frame 1080x1920 ref clip")
    p.add_argument("--seconds", type=float, default=5.0)
    p.add_argument("--focus", help="MAIN-ELEMENT center in RAW screenshot px: 'sx,sy' → emits card-local focus/focusR")
    p.add_argument("--focus-size", default="380,70", help="main-element px size 'w,h' (for circle radii); default 380,70")
    p.add_argument("--source-url", default="", help="URL da página capturada (OBRIGATÓRIO informar; youtube.com exige a prova do yt_watch_shot.cjs — QCR-332)")
    args = p.parse_args()

    src = os.path.expanduser(args.screenshot)
    if not os.path.exists(src):
        print(f"ERROR: screenshot not found: {src}", file=sys.stderr); return 1
    # QCR-332: um print de página do YouTube tirado "ao vivo" capturou o ANÚNCIO pré-roll
    # (rosto de concorrente) no player e foi ao ar. Página de vídeo só entra com a PROVA de captura
    # determinística (yt_watch_shot.cjs escreve <shot>.meta.json com ad_free:true).
    meta_path = os.path.splitext(src)[0] + ".meta.json"
    meta = None
    if os.path.exists(meta_path):
        import json
        try:
            meta = json.load(open(meta_path, encoding="utf-8"))
        except Exception as ex:
            print(f"ERROR: meta ilegível {meta_path}: {ex}", file=sys.stderr); return 2
    url_l = (args.source_url or (meta or {}).get("url", "")).lower()
    is_video_page = any(h in url_l for h in ("youtube.com", "youtu.be", "vimeo.com", "tiktok.com", "instagram.com/reel"))
    if not args.source_url and meta is None:
        print("WARN: --source-url ausente e sem <shot>.meta.json — informe a URL da página (QCR-332); páginas de vídeo são RECUSADAS sem prova.")
    if is_video_page:
        if not meta or meta.get("ad_free") is not True:
            print("ERROR QCR-332: print de página de VÍDEO sem prova de captura determinística.\n"
                  "  Página de vídeo (YouTube etc.) exibe ANÚNCIO pré-roll/‘Sponsored’ com rostos de terceiros no player e na sidebar.\n"
                  f"  Capture com: node reference-pipeline/yt_watch_shot.cjs \"<url>\" {src}   (gera {os.path.basename(meta_path)} com ad_free:true)\n"
                  f"  meta encontrado: {meta_path if meta else 'nenhum'}; ad_free={None if not meta else meta.get('ad_free')}", file=sys.stderr)
            return 2
        print(f"[qcr-332] prova OK: ad_free=true mode={meta.get('mode_effective')} title={meta.get('checks', {}).get('title', '')[:60]!r}")
    raw_size = Image.open(src).size
    card, size = prepare_card(src, args.name)
    print(f"[card] {card}  ({size[0]}x{size[1]})  → use <ScreenshotCard src=\"refs/{args.name}.png\">")
    # MOTION recommendation (house rule): the evidence screenshot scrolls by default.
    img_win = CARD_H - BAR_H                       # visible window height (548)
    disp_h = round(CARD_W * size[1] / size[0])     # image height as displayed at card width
    below = disp_h - img_win                        # px available below the first window
    scroll = min(below, 1400)
    if below >= 700:
        print(f"[motion] scroll OK: pass motion=\"scroll\" scroll={scroll} (page has {below}px below the hero)")
    else:
        print(f"[motion] page is SHORT ({below}px below hero) → prefer motion=\"zoom\" (focus) or motion=\"static\"; recapture full-page for scroll")
    if args.focus:
        sx, sy = (float(v) for v in args.focus.split(","))
        ew, eh = (float(v) for v in args.focus_size.split(","))
        f = compute_focus(raw_size, (sx, sy), (ew, eh))
        warn = "" if f["visible"] else f"  ⚠ NOT VISIBLE in card (element below src y={f['img_bottom_src']}) — recapture tighter/scrolled"
        print(f"[focus] EvidenceReveal: focus={{ fx: {f['fx']}, fy: {f['fy']} }} focusR={{ rx: {f['rx']}, ry: {f['ry']} }}{warn}")
    if args.clip:
        clip = make_clip(card, args.name, args.seconds)
        print(f"[clip] {clip}  (full-frame 1080x1920 ref b-roll)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
