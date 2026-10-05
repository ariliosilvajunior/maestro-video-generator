#!/usr/bin/env python3
"""
make_sample_assets.py — (re)generate the SYNTHETIC placeholder assets the demo compositions
and the smoke test rely on. Everything here is produced locally (PIL + numpy + ffmpeg): no
third-party media, nothing to license. The package ships these files already; run this only
if you deleted them or want to regenerate.

  public/sample_avatar.mp4            40 s, 1080x1920, 25 fps — a "talking head" placeholder with
                                      speech-like audio bursts (so VAD / caption gates have real runs)
  public/refs/sample_page.png         fake full-page website capture (1280x2400)
  public/refs/sample_repo.png         fake repository page (1280x900)
  public/refs/sample_pricing.png      fake pricing page (1280x900)
  public/assets/sample/<n>_cut.png    robot / coin / clock / lock transparent cutouts
  sfx/hook-riser.wav                  5 s riser, peak near 4.3 s
  sfx/transition-click.wav            30 ms click

    python3 bin/make_sample_assets.py            # everything that is missing
    python3 bin/make_sample_assets.py --force    # regenerate all
    python3 bin/make_sample_assets.py --sfx      # only the sound effects
"""
import argparse
import math
import os
import struct
import subprocess
import sys
import tempfile
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, REPO)
from lib import ffmpeg as ffm  # noqa: E402

PUBLIC = os.path.join(REPO, "motion-pipeline", "remotion-agent", "public")
FONT = os.path.join(PUBLIC, "fonts", "Montserrat-Bold.ttf")
SFX = os.path.join(REPO, "sfx")

CHARCOAL = (43, 42, 40, 255)
GOLD = (201, 162, 77, 255)
PAPER = (245, 242, 233, 255)


def log(m):
    print(f"[sample-assets] {m}")


def _font(size):
    from PIL import ImageFont
    try:
        return ImageFont.truetype(FONT, size)
    except Exception:  # noqa: BLE001
        return ImageFont.load_default()


# ───────────────────────────── sfx ─────────────────────────────

def write_wav(path, samples, sr=44100):
    peak = max(1e-9, max(abs(s) for s in samples))
    scale = 0.9 / peak
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s * scale)) * 32767)) for s in samples))


def make_sfx(force):
    import random
    rnd = random.Random(7)
    os.makedirs(SFX, exist_ok=True)
    riser = os.path.join(SFX, "hook-riser.wav")
    click = os.path.join(SFX, "transition-click.wav")
    sr = 44100
    if force or not os.path.exists(riser):
        n = int(5.0 * sr)
        out, lp = [], 0.0
        for i in range(n):
            t = i / sr
            # amplitude ramps up to the peak at 4.3 s then decays fast
            env = (t / 4.3) ** 2.2 if t <= 4.3 else max(0.0, 1.0 - (t - 4.3) / 0.55)
            # noise through a rising one-pole low-pass (brightens as it rises) + a rising sweep tone
            cutoff = 0.02 + 0.5 * (t / 5.0)
            lp += cutoff * (rnd.uniform(-1, 1) - lp)
            sweep = math.sin(2 * math.pi * (180 + 900 * (t / 5.0)) * t) * 0.35
            out.append((lp * 1.6 + sweep) * env)
        write_wav(riser, out, sr)
        log(f"wrote {riser}")
    if force or not os.path.exists(click):
        n = int(0.03 * sr)
        out = []
        for i in range(n):
            t = i / sr
            env = math.exp(-t * 260)
            out.append((rnd.uniform(-1, 1) * 0.6 + math.sin(2 * math.pi * 2100 * t) * 0.8) * env)
        write_wav(click, out, sr)
        log(f"wrote {click}")


# ───────────────────────────── refs ─────────────────────────────

def make_refs(force):
    from PIL import Image, ImageDraw
    refs = os.path.join(PUBLIC, "refs")
    os.makedirs(refs, exist_ok=True)

    def page(path, w, h, title, kind):
        if not force and os.path.exists(path):
            return
        im = Image.new("RGB", (w, h), (250, 250, 252))
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, w, 72], fill=(24, 24, 28))
        d.rounded_rectangle([160, 20, w - 160, 52], radius=16, fill=(50, 50, 58))
        d.text((180, 26), "https://example.com/" + kind, fill=(180, 180, 190), font=_font(20))
        d.rectangle([0, 72, w, 130], fill=(255, 255, 255))
        d.text((40, 90), "SAMPLE " + kind.upper(), fill=(30, 30, 30), font=_font(28))
        for i, x in enumerate((420, 540, 660, 780)):
            d.rounded_rectangle([x, 92, x + 90, 112], radius=10, fill=(225, 225, 230))
        d.rounded_rectangle([w - 200, 88, w - 40, 116], radius=14, fill=(201, 162, 77))
        y = 170
        d.text((80, y), title, fill=(20, 20, 20), font=_font(52)); y += 90
        d.text((80, y), "Placeholder reference screenshot — replace with a real capture", fill=(90, 90, 100), font=_font(24)); y += 70
        if kind == "repo":
            d.rounded_rectangle([80, y, w - 80, y + 60], radius=8, fill=(240, 242, 246), outline=(210, 214, 220)); y += 80
            for row in range(9):
                d.rectangle([80, y, w - 80, y + 36], fill=(255, 255, 255) if row % 2 else (247, 248, 250), outline=(230, 232, 236))
                d.rounded_rectangle([100, y + 10, 340, y + 26], radius=6, fill=(200, 205, 215))
                d.rounded_rectangle([700, y + 10, 1000, y + 26], radius=6, fill=(225, 228, 234))
                y += 36
            d.rounded_rectangle([80, y + 30, 320, y + 70], radius=10, fill=(201, 162, 77))
            d.text((100, y + 38), "★ 12.3k stars", fill=(30, 30, 30), font=_font(22))
        elif kind == "pricing":
            for i, (name, price) in enumerate((("Free", "$0"), ("Pro", "$20/mo"), ("Team", "$99/mo"))):
                x = 80 + i * 380
                d.rounded_rectangle([x, y, x + 340, y + 460], radius=18, fill=(255, 255, 255), outline=(215, 218, 225), width=2)
                d.text((x + 30, y + 30), name, fill=(30, 30, 30), font=_font(30))
                d.text((x + 30, y + 90), price, fill=(201, 162, 77), font=_font(46))
                for k in range(5):
                    d.rounded_rectangle([x + 30, y + 190 + k * 40, x + 300, y + 208 + k * 40], radius=6, fill=(230, 232, 236))
                d.rounded_rectangle([x + 30, y + 400, x + 310, y + 436], radius=10, fill=(24, 24, 28))
        else:
            d.rounded_rectangle([80, y, w - 80, y + 380], radius=22, fill=(30, 32, 40))
            d.text((120, y + 40), "Hero section", fill=(245, 242, 233), font=_font(40))
            d.rounded_rectangle([120, y + 300, 360, y + 350], radius=12, fill=(201, 162, 77)); y += 430
            while y < h - 120:
                d.text((80, y), "Section", fill=(40, 40, 46), font=_font(30)); y += 56
                for k in range(4):
                    d.rounded_rectangle([80, y, w - 80 - (k * 90), y + 18], radius=6, fill=(215, 218, 225)); y += 34
                y += 40
                for c in range(3):
                    x = 80 + c * 380
                    d.rounded_rectangle([x, y, x + 340, y + 200], radius=14, fill=(236, 238, 242))
                y += 260
        im.save(path, "PNG")
        log(f"wrote {path}")

    page(os.path.join(refs, "sample_page.png"), 1280, 2400, "Sample product website", "page")
    page(os.path.join(refs, "sample_repo.png"), 1280, 900, "sample-org / sample-tool", "repo")
    page(os.path.join(refs, "sample_pricing.png"), 1280, 900, "Simple, transparent pricing", "pricing")


# ───────────────────────────── cutouts ─────────────────────────────

def make_cutouts(force):
    from PIL import Image, ImageDraw
    out_dir = os.path.join(PUBLIC, "assets", "sample")
    os.makedirs(out_dir, exist_ok=True)
    S = 1024

    def new():
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        return im, ImageDraw.Draw(im)

    def save(im, name):
        bbox = im.split()[3].getbbox()
        if bbox:
            pad = int(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * 0.04)
            im = im.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(S, bbox[2] + pad), min(S, bbox[3] + pad)))
        p = os.path.join(out_dir, f"{name}_cut.png")
        im.save(p, "PNG")
        log(f"wrote {p}")

    if force or not os.path.exists(os.path.join(out_dir, "robot_cut.png")):
        im, d = new()
        d.rounded_rectangle([312, 330, 712, 760], radius=70, fill=CHARCOAL, outline=GOLD, width=12)   # body
        d.rounded_rectangle([362, 150, 662, 330], radius=60, fill=CHARCOAL, outline=GOLD, width=12)   # head
        d.ellipse([410, 200, 480, 270], fill=GOLD); d.ellipse([544, 200, 614, 270], fill=GOLD)        # eyes
        d.rectangle([500, 80, 524, 150], fill=GOLD); d.ellipse([486, 50, 538, 102], fill=GOLD)        # antenna
        d.rounded_rectangle([430, 420, 594, 470], radius=20, fill=GOLD)                                # chest light
        d.rounded_rectangle([240, 380, 300, 640], radius=30, fill=CHARCOAL, outline=GOLD, width=10)   # arms
        d.rounded_rectangle([724, 380, 784, 640], radius=30, fill=CHARCOAL, outline=GOLD, width=10)
        save(im, "robot")
    if force or not os.path.exists(os.path.join(out_dir, "coin_cut.png")):
        im, d = new()
        d.ellipse([172, 172, 852, 852], fill=GOLD, outline=CHARCOAL, width=14)
        d.ellipse([240, 240, 784, 784], fill=(222, 186, 96, 255), outline=CHARCOAL, width=10)
        d.text((512, 512), "$", fill=CHARCOAL, font=_font(300), anchor="mm")
        save(im, "coin")
    if force or not os.path.exists(os.path.join(out_dir, "clock_cut.png")):
        im, d = new()
        d.ellipse([172, 172, 852, 852], fill=CHARCOAL, outline=GOLD, width=16)
        for k in range(12):
            a = k * math.pi / 6
            x1, y1 = 512 + 300 * math.sin(a), 512 - 300 * math.cos(a)
            x2, y2 = 512 + 260 * math.sin(a), 512 - 260 * math.cos(a)
            d.line([x1, y1, x2, y2], fill=GOLD, width=10)
        d.line([512, 512, 512, 300], fill=GOLD, width=18)
        d.line([512, 512, 660, 560], fill=GOLD, width=18)
        d.ellipse([492, 492, 532, 532], fill=GOLD)
        save(im, "clock")
    if force or not os.path.exists(os.path.join(out_dir, "lock_cut.png")):
        im, d = new()
        d.rounded_rectangle([272, 440, 752, 860], radius=60, fill=CHARCOAL, outline=GOLD, width=14)   # body
        d.arc([352, 160, 672, 560], start=180, end=360, fill=GOLD, width=44)                            # shackle
        d.rectangle([352, 360, 396, 440], fill=GOLD); d.rectangle([628, 360, 672, 440], fill=GOLD)
        d.ellipse([462, 560, 562, 660], fill=GOLD); d.rectangle([496, 640, 528, 740], fill=GOLD)        # keyhole
        save(im, "lock")


# ───────────────────────────── avatar clip ─────────────────────────────

def make_avatar(force):
    from PIL import Image, ImageDraw
    dest = os.path.join(PUBLIC, "sample_avatar.mp4")
    if not force and os.path.exists(dest):
        return
    ff = ffm.find_ffmpeg()
    W, H, FPS, LOOP_FRAMES, DUR = 1080, 1920, 25, 50, 40
    with tempfile.TemporaryDirectory() as tmp:
        f_big, f_small = _font(64), _font(34)
        for i in range(LOOP_FRAMES):
            t = i / FPS
            im = Image.new("RGB", (W, H), (18, 19, 24))
            d = ImageDraw.Draw(im)
            # top 40 % — soft gradient (covered by motion in real renders)
            for y in range(0, 768, 8):
                v = int(28 + 30 * (y / 768))
                d.rectangle([0, y, W, y + 8], fill=(v, v + 2, v + 8))
            d.text((W // 2, 384), "MOTION AREA (top 40%)", fill=(90, 92, 104), font=f_small, anchor="mm")
            # bottom 60 % — "avatar": shoulders + head with a gentle bob
            d.rectangle([0, 768, W, H], fill=(38, 40, 48))
            bob = int(6 * math.sin(2 * math.pi * t / 2.0))
            d.rounded_rectangle([200, 1450 + bob, 880, 1920], radius=160, fill=(60, 62, 74))          # shoulders
            d.ellipse([360, 1000 + bob, 720, 1420 + bob], fill=(92, 88, 100))                          # head
            d.ellipse([440, 1150 + bob, 500, 1200 + bob], fill=(30, 30, 36)); d.ellipse([580, 1150 + bob, 640, 1200 + bob], fill=(30, 30, 36))
            mouth = 14 + int(10 * abs(math.sin(2 * math.pi * t * 2.5)))
            d.ellipse([500, 1300 + bob - mouth, 580, 1300 + bob + mouth], fill=(30, 30, 36))
            d.text((W // 2, 880), "SAMPLE AVATAR", fill=(201, 162, 77), font=f_big, anchor="mm")
            d.text((W // 2, 940), "placeholder clip — replace with your HeyGen render", fill=(150, 150, 160), font=f_small, anchor="mm")
            im.save(os.path.join(tmp, f"f_{i:03d}.png"))
        # speech-like audio: syllable bursts with sentence pauses
        import random
        rnd = random.Random(3)
        sr = 16000
        n = DUR * sr
        samples = [0.0] * n
        t = 0.6
        while t < DUR - 1.0:
            sent = rnd.uniform(2.5, 4.5)
            end = min(DUR - 0.5, t + sent)
            tt = t
            while tt < end:
                syl = rnd.uniform(0.12, 0.22)
                f0 = rnd.uniform(110, 190)
                i0, i1 = int(tt * sr), int(min(end, tt + syl) * sr)
                for i in range(i0, i1):
                    k = (i - i0) / max(1, i1 - i0)
                    env = math.sin(math.pi * k)
                    x = (i / sr)
                    samples[i] = env * (0.5 * math.sin(2 * math.pi * f0 * x) + 0.25 * math.sin(2 * math.pi * f0 * 2 * x) + 0.15 * rnd.uniform(-1, 1))
                tt += syl + rnd.uniform(0.02, 0.06)
            t = end + rnd.uniform(0.45, 0.9)   # inter-sentence pause
        wav = os.path.join(tmp, "speech.wav")
        write_wav(wav, samples, sr)
        cmd = [ff, "-y", "-v", "error", "-stream_loop", str(DUR * FPS // LOOP_FRAMES - 1), "-framerate", str(FPS),
               "-i", os.path.join(tmp, "f_%03d.png"), "-i", wav,
               "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-r", str(FPS),
               "-c:a", "aac", "-b:a", "128k", "-t", str(DUR), "-movflags", "+faststart", dest]
        subprocess.run(cmd, check=True)
    log(f"wrote {dest}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--sfx", action="store_true", help="only regenerate the sound effects")
    a = ap.parse_args()
    make_sfx(a.force)
    if a.sfx:
        return 0
    make_refs(a.force)
    make_cutouts(a.force)
    make_avatar(a.force)
    log("done")
    return 0


if __name__ == "__main__":
    sys.exit(main())
