#!/usr/bin/env python3
"""
generate_image_assets.py — per-beat hero images for the motion phase, through YOUR image API.

One command turns a beats file into keyed, transparent PNG cutouts ready for the Remotion
premium toolkit (`PremiumAsset` / `PremiumImageIcon` / `IdeaHeroAsset`):

    beat prompt ──► image provider ──► raw PNG ──► chroma key / native alpha ──► <name>_cut.png

PROVIDERS (pick one in config.json → images.provider, or pass --provider):
  fal      fal.ai        key: FAL_KEY / keys.md "## fal"      model: images.fal_model    (default fal-ai/nano-banana-pro)
  google   Gemini API    key: GEMINI_API_KEY / "## Gemini"   model: images.google_model (default gemini-2.5-flash-image)
  openai   OpenAI API    key: OPENAI_API_KEY / "## OpenAI"   model: images.openai_model (default gpt-image-1)

fal and google render the object on a flat chroma-green background which is then keyed out
(`chroma_key.py`, greenness-based, with a border flood-fill fallback for off-green backgrounds).
OpenAI gpt-image-1 can return a TRANSPARENT PNG natively (images.openai_transparent = true) —
then no keying is needed, the cutout is just auto-cropped.

USAGE
  python3 image-pipeline/generate_image_assets.py \
      --beats beats.json --out-dir motion-pipeline/remotion-agent/public/assets/<run> \
      [--provider fal|google|openai] [--model <override>] [--palette charcoal-gold] \
      [--raw-dir <scratch>] [--no-key] [--seed-salt 0] [--manifest <path>] \
      [--t-low 14 --t-high 30 --despill 0.7] [--width 1024 --height 1536]

  beats.json = JSON list, one entry per motion beat:
     [{"name":"beat1_robot","object":"a friendly robot mascot"},
      {"name":"beat2_terminal","full_prompt":"<override the whole prompt>"}]
   - `name`   -> output stem (keyed PNG = <out-dir>/<name>_cut.png, raw = <raw-dir>/<name>.png)
   - `object` -> wrapped in the greenscreen/transparent template for the chosen palette
   - `full_prompt` (optional) -> used verbatim

RESUME-SAFE: a beat whose `_cut.png` already exists is skipped — re-run the same command after
a failure and only the missing beats are generated (you never pay twice for a finished beat).

Exit codes: 0 all beats done · 3 provider not configured / key missing · 4 auth rejected
(401/403) · 5 some beats failed (see manifest `failed`).
"""
import argparse
import base64
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, REPO)
sys.path.insert(0, HERE)
from lib import config  # noqa: E402
from lib.api_keys import resolve_key, masked  # noqa: E402
from lib.paths import maestro_tmp  # noqa: E402
import chroma_key  # noqa: E402  (same directory)

UA = "maestro-video-generator/1.0 (+image-pipeline)"

# Material/colour phrase per premium palette — keeps every asset of a video in ONE family.
PALETTE_MATERIALS = {
    "charcoal-gold": "matte charcoal body with thick antique-gold accents and gold rim lighting",
    "marble-gold": "white marble and antique brushed-gold materials, museum-quality finish",
    "midnight-azure": "matte midnight-navy body with glowing azure-blue accents",
    "ivory-emerald": "ivory ceramic body with deep emerald enamel and brass accents",
    "bordeaux-rose": "deep bordeaux lacquer body with soft rose-gold accents",
    "slate-copper": "brushed slate-grey metal body with warm copper accents",
    "recursos-cognitivos": "matte deep-blue (#2B4872) body with glossy verde-agua teal (#56CAC9) accents, clean modern professional finish, soft rounded edges",
}

# Proven greenscreen template (keys clean at --t-low 14 --t-high 30 --despill 0.7).
GREENSCREEN_TEMPLATE = (
    "A single glossy museum-quality 3D product render of {obj}, {material}, soft studio lighting, "
    "the object floats centered and occupies about 60 percent of the frame with a WIDE even empty "
    "margin on all sides, absolutely NO podium NO base NO platform NO floor NO pedestal NO stand, "
    "isolated on a perfectly flat fully saturated pure chroma key green screen background hex 00FF00, "
    "uniform green no gradient no vignette edge to edge, no shadow on the background, sharp clean "
    "cut-out edges, no text no watermark no logo"
)

# Native-alpha template (OpenAI gpt-image-1 with background=transparent).
TRANSPARENT_TEMPLATE = (
    "A single glossy museum-quality 3D product render of {obj}, {material}, soft studio lighting, "
    "the object floats centered and occupies about 60 percent of the frame with a wide even empty "
    "margin on all sides, absolutely no podium no base no platform no floor no pedestal no stand, "
    "fully transparent background, no shadow, sharp clean edges, no text no watermark no logo"
)

FAL_QUEUE = "https://queue.fal.run"
GEMINI_BASE = "https://generativelanguage.googleapis.com"
OPENAI_IMAGES = "https://api.openai.com/v1/images/generations"


class AuthError(RuntimeError):
    pass


class ProviderError(RuntimeError):
    pass


def log(m):
    print(f"[images] {m}", file=sys.stderr)


def _req(url, method="GET", headers=None, body=None, timeout=120):
    data = body.encode("utf-8") if isinstance(body, str) else body
    req = urllib.request.Request(url, data=data, method=method, headers={"User-Agent": UA, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:  # noqa: BLE001
        return 0, str(e).encode()


def _download(url, dest):
    st, data = _req(url, timeout=180)
    if st != 200 or len(data) < 1000:
        raise ProviderError(f"download failed ({st}) {url[:80]}")
    with open(dest, "wb") as f:
        f.write(data)


def _ratio(w, h):
    """Closest provider aspect-ratio token for w×h."""
    r = w / float(h)
    table = {"1:1": 1.0, "3:4": 0.75, "4:3": 1.333, "9:16": 0.5625, "16:9": 1.777, "2:3": 0.667, "3:2": 1.5}
    return min(table, key=lambda k: abs(table[k] - r))


def seed_for(name, salt):
    h = int(hashlib.sha1(f"{name}|{salt}".encode()).hexdigest(), 16)
    return (h % 900000) + 1000


# ────────────────────────────────────────── providers ──────────────────────────────────────────

def gen_fal(key, model, prompt, w, h, seed, extra):
    """fal.ai queue API: submit → poll → fetch. Works for every fal image model; unknown-field
    422s are printed verbatim so the caller can adjust `images.fal_extra` in config.json."""
    body = {"prompt": prompt, "num_images": 1}
    if "flux" in model or "sdxl" in model or "stable-diffusion" in model:
        body["image_size"] = {"width": w, "height": h}
        body["seed"] = seed
    else:  # nano-banana family & most modern fal models take an aspect ratio + output format
        body["aspect_ratio"] = _ratio(w, h)
        body["output_format"] = "png"
    body.update(extra or {})
    hdr = {"Authorization": f"Key {key}", "Content-Type": "application/json", "Accept": "application/json"}
    for attempt in range(4):
        st, data = _req(f"{FAL_QUEUE}/{model}", "POST", hdr, json.dumps(body), timeout=60)
        if st == 429:
            time.sleep(6 * (attempt + 1))
            continue
        break
    if st in (401, 403):
        raise AuthError(f"fal rejected the key ({st})")
    if st != 200:
        raise ProviderError(f"fal submit {st}: {data[:400].decode('utf-8', 'replace')}")
    job = json.loads(data)
    status_url, response_url = job.get("status_url"), job.get("response_url")
    if not status_url or not response_url:
        raise ProviderError(f"fal submit: unexpected response {data[:200]!r}")
    t0 = time.time()
    while time.time() - t0 < 420:
        st, data = _req(status_url, headers={"Authorization": f"Key {key}"}, timeout=60)
        if st == 200:
            s = json.loads(data).get("status")
            if s == "COMPLETED":
                break
            if s in ("FAILED", "ERROR", "CANCELLED"):
                raise ProviderError(f"fal job {s}")
        time.sleep(3)
    else:
        raise ProviderError("fal job timeout (7 min)")
    st, data = _req(response_url, headers={"Authorization": f"Key {key}"}, timeout=60)
    if st != 200:
        raise ProviderError(f"fal result {st}: {data[:300].decode('utf-8', 'replace')}")
    res = json.loads(data)
    url = None
    for k in ("images", "output", "outputs"):
        v = res.get(k)
        if isinstance(v, list) and v:
            item = v[0]
            url = item.get("url") if isinstance(item, dict) else item
            break
    if not url and isinstance(res.get("image"), dict):
        url = res["image"].get("url")
    if not url:
        raise ProviderError(f"fal result has no image url: {json.dumps(res)[:300]}")
    return ("url", url)


def gen_google(key, model, prompt, w, h):
    """Gemini image generation (`generateContent` with IMAGE modality) → inline base64 PNG."""
    url = f"{GEMINI_BASE}/v1beta/models/{model}:generateContent?key={key}"
    variants = [
        {"contents": [{"parts": [{"text": prompt}]}],
         "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": _ratio(w, h)}}},
        {"contents": [{"parts": [{"text": prompt}]}],
         "generationConfig": {"responseModalities": ["IMAGE"]}},
        {"contents": [{"parts": [{"text": prompt}]}],
         "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}},
    ]
    last = None
    for body in variants:
        for attempt in range(3):
            st, data = _req(url, "POST", {"Content-Type": "application/json"}, json.dumps(body), timeout=180)
            if st == 429:
                time.sleep(8 * (attempt + 1))
                continue
            break
        if st in (401, 403):
            raise AuthError(f"Gemini rejected the key ({st})")
        if st == 400:
            last = data[:400].decode("utf-8", "replace")
            continue  # try the next request shape
        if st != 200:
            raise ProviderError(f"Gemini {st}: {data[:400].decode('utf-8', 'replace')}")
        res = json.loads(data)
        for cand in res.get("candidates", []):
            for part in (cand.get("content") or {}).get("parts", []):
                inline = part.get("inlineData") or part.get("inline_data")
                if inline and inline.get("data"):
                    return ("b64", inline["data"])
        raise ProviderError(f"Gemini returned no image part: {json.dumps(res)[:300]}")
    raise ProviderError(f"Gemini 400 for every request shape — last: {last}")


def _openai_size(w, h):
    return "1024x1536" if h > w else ("1536x1024" if w > h else "1024x1024")


def gen_openai(key, model, prompt, w, h, transparent):
    body = {"model": model, "prompt": prompt, "n": 1, "size": _openai_size(w, h)}
    if model.startswith("gpt-image"):
        body["quality"] = "medium"
        body["output_format"] = "png"
        body["background"] = "transparent" if transparent else "opaque"
    hdr = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    for attempt in range(3):
        st, data = _req(OPENAI_IMAGES, "POST", hdr, json.dumps(body), timeout=240)
        if st == 429:
            time.sleep(8 * (attempt + 1))
            continue
        break
    if st in (401, 403):
        raise AuthError(f"OpenAI rejected the key ({st})")
    if st != 200:
        raise ProviderError(f"OpenAI {st}: {data[:400].decode('utf-8', 'replace')}")
    res = json.loads(data)
    item = (res.get("data") or [{}])[0]
    if item.get("b64_json"):
        return ("b64", item["b64_json"])
    if item.get("url"):
        return ("url", item["url"])
    raise ProviderError(f"OpenAI returned no image: {json.dumps(res)[:300]}")


# ────────────────────────────────────────── keying ─────────────────────────────────────────────

def flood_key(src, dst, tol=28, pad_ratio=0.04):
    """Border flood-fill keying for backgrounds that are NOT chroma green (pale mint/white/grey):
    everything reachable from the image border within `tol` colour distance becomes transparent;
    same-coloured pixels INSIDE the object (eye highlights) are kept. Returns foreground %."""
    from PIL import Image, ImageDraw
    im = Image.open(src).convert("RGB")
    w, h = im.size
    work = im.copy()
    marker = (255, 0, 255)
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]
    for xy in seeds:
        if work.getpixel(xy) != marker:
            ImageDraw.floodfill(work, xy, marker, thresh=tol)
    import numpy as np
    a = np.asarray(work)
    bg = (a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255)
    rgba = np.dstack([np.asarray(im), np.where(bg, 0, 255).astype("uint8")])
    out = Image.fromarray(rgba, "RGBA")
    bbox = out.split()[3].getbbox()
    if bbox:
        pw = int(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * pad_ratio)
        out = out.crop((max(0, bbox[0] - pw), max(0, bbox[1] - pw), min(w, bbox[2] + pw), min(h, bbox[3] + pw)))
    out.save(dst)
    fg = float((~bg).mean()) * 100
    print(f"[flood_key] {w}x{h} -> {dst} {out.size[0]}x{out.size[1]}  (foreground ~{fg:.1f}%)")
    return fg


def autocrop_alpha(src, dst, pad_ratio=0.04):
    """For natively transparent PNGs: crop to the alpha bounding box (+pad). Returns foreground %."""
    from PIL import Image
    import numpy as np
    im = Image.open(src).convert("RGBA")
    alpha = np.asarray(im)[..., 3]
    fg = float((alpha > 128).mean()) * 100
    bbox = im.split()[3].getbbox()
    if bbox:
        pw = int(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * pad_ratio)
        im = im.crop((max(0, bbox[0] - pw), max(0, bbox[1] - pw), min(im.width, bbox[2] + pw), min(im.height, bbox[3] + pw)))
    im.save(dst)
    print(f"[autocrop] -> {dst} {im.size[0]}x{im.size[1]}  (foreground ~{fg:.1f}%)")
    return fg


def _key_image(raw, out, t_low, t_high, despill, native_alpha):
    """Returns (status, foreground%). status: keyed | key-suspect."""
    if native_alpha:
        fg = autocrop_alpha(raw, out)
        return ("keyed" if 2 <= fg <= 92 else "key-suspect"), fg
    r = subprocess.run([sys.executable, os.path.join(HERE, "chroma_key.py"), raw, out,
                        "--t-low", str(t_low), "--t-high", str(t_high), "--despill", str(despill)],
                       capture_output=True, text=True)
    fg = None
    line = (r.stdout + r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr) else ""
    if "foreground ~" in line:
        try:
            fg = float(line.split("foreground ~")[1].split("%")[0])
        except ValueError:
            pass
    if r.returncode == 0 and fg is not None and fg < 92:
        return "keyed", fg
    # Off-green background (mint / white / studio grey) → border flood-fill fallback
    log(f"greenness key left ~{fg}% foreground — trying border flood-fill")
    try:
        fg2 = flood_key(raw, out)
        return ("keyed" if 2 <= fg2 <= 92 else "key-suspect"), fg2
    except Exception as e:  # noqa: BLE001
        log(f"flood-fill failed: {e}")
        return "key-suspect", fg


def clean_cutout(path, pad_ratio=0.04, min_island_frac=0.002, min_island_px=64):
    """Post-process a keyed RGBA cutout in place:
      * drop stray specks — small alpha islands detached from the object (a corner fleck would
        otherwise stretch the bounding box and shrink the hero inside <PremiumAsset size=…>);
      * zero the RGB of fully transparent pixels (no green/grey bleed when the PNG is scaled);
      * re-crop to the object's alpha bounding box (+pad).
    Islands are found on a 16x16-block grid (8-connected), so a thin antenna stays attached to
    its body; anything below max(min_island_px, min_island_frac x biggest island) is removed.
    Returns the number of islands dropped."""
    from PIL import Image
    import numpy as np
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    alpha = arr[..., 3]
    op = alpha > 128
    if not op.any():
        return 0
    B = 16
    h, w = op.shape
    H, W = -(-h // B), -(-w // B)
    grid = np.zeros((H * B, W * B), dtype=bool)
    grid[:h, :w] = op
    blocks = grid.reshape(H, B, W, B).sum(axis=(1, 3))
    labels = np.zeros((H, W), dtype=np.int32)
    sizes = {}
    for y0 in range(H):
        for x0 in range(W):
            if blocks[y0, x0] == 0 or labels[y0, x0]:
                continue
            cid = len(sizes) + 1
            labels[y0, x0] = cid
            stack, total = [(y0, x0)], 0
            while stack:
                cy, cx = stack.pop()
                total += int(blocks[cy, cx])
                for ny in (cy - 1, cy, cy + 1):
                    for nx in (cx - 1, cx, cx + 1):
                        if 0 <= ny < H and 0 <= nx < W and blocks[ny, nx] and not labels[ny, nx]:
                            labels[ny, nx] = cid
                            stack.append((ny, nx))
            sizes[cid] = total
    biggest = max(sizes.values())
    limit = max(min_island_px, biggest * min_island_frac)
    drop = [cid for cid, n in sizes.items() if n < limit]
    if drop:
        drop_blocks = np.isin(labels, drop)
        drop_px = np.repeat(np.repeat(drop_blocks, B, axis=0), B, axis=1)[:h, :w]
        alpha = np.where(drop_px, 0, alpha).astype("uint8")
        arr[..., 3] = alpha
    arr[alpha == 0, :3] = 0
    ys, xs = np.where(alpha > 0)
    pw = int(max(xs.max() - xs.min(), ys.max() - ys.min()) * pad_ratio)
    box = (max(0, int(xs.min()) - pw), max(0, int(ys.min()) - pw),
           min(w, int(xs.max()) + 1 + pw), min(h, int(ys.max()) + 1 + pw))
    Image.fromarray(arr).crop(box).save(path)
    return len(drop)


def key_image(raw, out, t_low, t_high, despill, native_alpha):
    """Key (or autocrop) one raw render, then clean the cutout. Returns (status, foreground%)."""
    status, fg = _key_image(raw, out, t_low, t_high, despill, native_alpha)
    if status == "keyed" and os.path.exists(out):
        try:
            dropped = clean_cutout(out)
            if dropped:
                log(f"removed {dropped} stray speck(s) from {os.path.basename(out)}")
        except Exception as e:  # noqa: BLE001
            log(f"cutout clean-up skipped ({e})")
    return status, fg


# ───────────────────────────────────────────── main ────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--beats", required=True, help="JSON list of {name, object|full_prompt}")
    ap.add_argument("--out-dir", required=True, help="where keyed <name>_cut.png are written")
    ap.add_argument("--raw-dir", default=None, help="where raw provider PNGs go (default: scratch dir)")
    ap.add_argument("--provider", default=None, help="fal | google | openai (default: config images.provider)")
    ap.add_argument("--model", default=None, help="override the provider's model id")
    ap.add_argument("--palette", default="recursos-cognitivos", help="material family: " + " | ".join(PALETTE_MATERIALS))
    ap.add_argument("--no-key", action="store_true", help="skip keying; keep raw PNGs")
    ap.add_argument("--seed-salt", default="0", help="vary to re-roll (fal/flux seeds)")
    ap.add_argument("--t-low", type=float, default=14.0)
    ap.add_argument("--t-high", type=float, default=30.0)
    ap.add_argument("--despill", type=float, default=0.7)
    ap.add_argument("--width", type=int, default=None)
    ap.add_argument("--height", type=int, default=None)
    ap.add_argument("--manifest", default=None)
    args = ap.parse_args()

    provider = (args.provider or config.get("images.provider", "fal") or "fal").lower()
    if provider == "none":
        log("images.provider is 'none' — this repo is configured WITHOUT an image provider (hand-drawn style only).")
        return 3
    if provider not in ("fal", "google", "openai"):
        log(f"unknown provider {provider!r} (use fal | google | openai)")
        return 3
    key = resolve_key("gemini" if provider == "google" else provider)
    if not key:
        log(f"no API key for provider '{provider}' — add it to .claude/keys.md (see keys.md.example) or the env. "
            f"Run: python3 bin/doctor.py")
        return 3
    model = args.model or config.get(f"images.{provider}_model")
    if not model:
        model = {"fal": "fal-ai/nano-banana-pro", "google": "gemini-2.5-flash-image", "openai": "gpt-image-1"}[provider]
    w = args.width or int(config.get("images.width", 1024))
    h = args.height or int(config.get("images.height", 1536))
    native_alpha = provider == "openai" and bool(config.get("images.openai_transparent", True)) and model.startswith("gpt-image")
    material = PALETTE_MATERIALS.get(args.palette, PALETTE_MATERIALS["recursos-cognitivos"])
    template = TRANSPARENT_TEMPLATE if native_alpha else GREENSCREEN_TEMPLATE

    with open(args.beats, encoding="utf-8") as f:
        beats = json.load(f)
    out_dir = os.path.expanduser(args.out_dir)
    raw_dir = os.path.expanduser(args.raw_dir) if args.raw_dir else maestro_tmp()
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(raw_dir, exist_ok=True)

    def final_path(b):
        return os.path.join(raw_dir, b["name"] + ".png") if args.no_key else os.path.join(out_dir, b["name"] + "_cut.png")

    results, failed, todo = [], [], []
    for b in beats:
        fp = final_path(b)
        if os.path.exists(fp) and os.path.getsize(fp) > 1000:
            results.append({"name": b["name"], "status": "skipped-exists", "path": fp})
            log(f"skip (exists): {b['name']}")
        else:
            todo.append(b)
    log(f"provider={provider} model={model} key={masked(key)} size={w}x{h} "
        f"{'native-alpha' if native_alpha else 'greenscreen+key'} | {len(todo)} to generate, {len(results)} done")

    for b in todo:
        name = b["name"]
        prompt = b.get("full_prompt") or template.format(obj=b["object"], material=material)
        raw = os.path.join(raw_dir, name + ".png")
        try:
            if provider == "fal":
                kind, payload = gen_fal(key, model, prompt, w, h, seed_for(name, args.seed_salt), config.get("images.fal_extra", {}) or {})
            elif provider == "google":
                kind, payload = gen_google(key, model, prompt, w, h)
            else:
                kind, payload = gen_openai(key, model, prompt, w, h, native_alpha)
            if kind == "url":
                _download(payload, raw)
            else:
                with open(raw, "wb") as f:
                    f.write(base64.b64decode(payload))
            rec = {"name": name, "raw": raw, "prompt": prompt, "provider": provider, "model": model}
            if args.no_key:
                rec.update(status="raw", path=raw)
            else:
                out = os.path.join(out_dir, name + "_cut.png")
                status, fg = key_image(raw, out, args.t_low, args.t_high, args.despill, native_alpha)
                rec.update(status=status, path=out, foreground=fg)
                if status == "key-suspect":
                    log(f"WARN {name}: foreground ~{fg}% — inspect the cutout; re-roll with --seed-salt or a sharper prompt")
            results.append(rec)
            log(f"DONE {name} -> {rec['path']}" + (f" (fg ~{rec.get('foreground')}%)" if rec.get("foreground") is not None else ""))
        except AuthError as e:
            log(f"AUTH: {e} — fix the key in .claude/keys.md and re-run (resume-safe)")
            return 4
        except Exception as e:  # noqa: BLE001
            log(f"FAILED {name}: {e}")
            failed.append({"name": name, "status": "failed", "error": str(e)[:300]})

    manifest = {"generator": provider, "model": model, "palette": args.palette, "native_alpha": native_alpha,
                "out_dir": out_dir, "results": results, "failed": failed}
    if args.manifest:
        with open(args.manifest, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(json.dumps(manifest, indent=2, ensure_ascii=False))
    if failed:
        log(f"{len(failed)} beat(s) FAILED: {[x['name'] for x in failed]} — re-run the same command to retry only those")
        return 5
    return 0


if __name__ == "__main__":
    sys.exit(main())
