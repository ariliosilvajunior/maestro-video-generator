#!/usr/bin/env python3
"""
chroma_key.py — turn a GREENSCREEN render (from any image provider) into a transparent cutout PNG
(keyed + green-despilled) ready to drop into a Remotion motion graphic as an <Img>.

Workflow (greenscreen asset → motion graphic):
  1. Generate with a greenscreen prompt (generate_image_assets.py does this for you):
     "<object>, centered with margin, isolated on a solid uniform bright chroma key
      green screen background, flat even green, no shadows on the background, product render".
  2. python3 image-pipeline/chroma_key.py in.png out.png [--preview]
  3. Copy out.png into motion-pipeline/remotion-agent/public/assets/<run>/ and use it in a scene:
       <Img src={staticFile("assets/out.png")} style={{ filter: "drop-shadow(...)" }} />
     (animate with spring/bob; see compositions/KickbacksCoinScene.tsx). $0 — real keyed asset.

Keys the background by GREENNESS (g − max(r,b)) so it survives lighting variation, feathers
the edge, and despills the green tint that bleeds onto the subject's edges.
"""
import argparse, sys
from PIL import Image
import numpy as np


def key_out(src, dst, t_low=35.0, t_high=110.0, despill=8, preview=None, autocrop=True):
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    key = g - np.maximum(r, b)                      # high on green bg, negative on subject
    alpha = np.clip((t_high - key) / (t_high - t_low), 0, 1)
    cap = np.maximum(r, b)
    spill = (g > cap) & (alpha > 0)                 # green bleed on kept pixels
    g2 = np.where(spill, np.minimum(g, cap + despill), g)
    out = np.stack([r, g2, b, alpha * 255], axis=-1).clip(0, 255).astype(np.uint8)
    rgba = Image.fromarray(out, "RGBA")
    # Premium asset prompts ask for "generous margin",
    # so the keyed object occupies only ~50-60% of the canvas → renders tiny when PremiumImageIcon
    # `size` maps to the (mostly-transparent) box. Auto-crop to the alpha bounding box (+4% pad) so
    # `size` maps to the OBJECT. Was a manual PIL crop step every premium run; now automatic.
    if autocrop:
        bbox = rgba.split()[3].getbbox()
        if bbox:
            w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
            pad = int(max(w, h) * 0.04)
            l = max(0, bbox[0] - pad); t = max(0, bbox[1] - pad)
            rr = min(rgba.width, bbox[2] + pad); bb = min(rgba.height, bbox[3] + pad)
            rgba = rgba.crop((l, t, rr, bb))
    rgba.save(dst)
    fg = float((alpha > 0.5).mean()) * 100
    print(f"[chroma_key] {im.size[0]}x{im.size[1]} → {dst} {rgba.size[0]}x{rgba.size[1]}  (foreground ~{fg:.1f}%)")
    if preview:
        bg = Image.new("RGBA", rgba.size, (200, 30, 140, 255))  # magenta to expose any green halo
        Image.alpha_composite(bg, rgba).convert("RGB").save(preview)
        print(f"[chroma_key] preview (over magenta) → {preview}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("input", help="greenscreen PNG/JPG")
    p.add_argument("output", help="transparent cutout PNG")
    p.add_argument("--t-low", type=float, default=35.0, help="greenness below this = fully kept (foreground)")
    p.add_argument("--t-high", type=float, default=110.0, help="greenness above this = fully transparent")
    p.add_argument("--despill", type=float, default=8, help="green-tint clamp on kept edge pixels")
    p.add_argument("--preview", help="also write a composite-over-magenta preview to this path")
    p.add_argument("--no-autocrop", action="store_true", help="keep full canvas (default: crop to alpha bbox + 4 pct pad)")
    args = p.parse_args()
    try:
        key_out(args.input, args.output, args.t_low, args.t_high, args.despill, args.preview,
                autocrop=not args.no_autocrop)
    except FileNotFoundError:
        print(f"ERROR: not found: {args.input}", file=sys.stderr); return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
