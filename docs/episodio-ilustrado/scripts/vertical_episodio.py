"""Versão vertical (1080x1920) do episódio INTEIRO para Instagram e Facebook (combinado do dono, 03/11/2026):
o vídeo 16:9 aparece inteiro no meio, sem cortar, com a marca em volta (azul #2B4872, verde-água #56CAC9 só no
destaque, Goodly, ícone). Usado nas Notícias 02 e 04 (360p, que não vão para o YouTube).

Uso: python3 vertical_episodio.py <final.mp4> <saida.mp4> "Título com *destaque*" [subtítulo] [máx_segundos] [pasta_ep]
O Instagram aceita Reels de até 3 min: passe 179.5 como máximo quando o episódio passar disso.
Com a pasta do episódio (words.json + AV03.mp4/avatar_entrada.mp4), põe a legenda GRANDE (Goodly, 3 palavras) no
azul de baixo, sincronizada com a narração — no celular a legenda de dentro do 16:9 fica pequena.
"""
import json
import os
import glob
import re
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ENT, SAI, TITULO = sys.argv[1], sys.argv[2], sys.argv[3]
SUB = sys.argv[4] if len(sys.argv) > 4 else ""
MAX = float(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[5] else None
PASTA = sys.argv[6] if len(sys.argv) > 6 else None
ASSETS = glob.glob("/root/.claude/skills/synced/*/designer-recursos-cognitivos/assets")[0]
F = lambda peso, tam: ImageFont.truetype(f"{ASSETS}/fonts/Goodly-{peso}.otf", tam)
AZUL, AQUA, BRANCO = (43, 72, 114), (86, 202, 201), (255, 255, 255)
W, H, VY, VH = 1080, 1920, 656, 608          # vídeo 1080x608 centralizado (656..1264)

img = Image.new("RGB", (W, H), AZUL)
d = ImageDraw.Draw(img)
# topo: ícone + selo NOTÍCIA + título com a palavra de destaque em verde-água
ic = Image.open(f"{ASSETS}/logos/icone_parafundoazul.png").convert("RGBA")
ic = ic.resize((110, int(110 * ic.height / ic.width)))
img.paste(ic, (W - 80 - ic.width, 150), ic)
d.rounded_rectangle((80, 168, 300, 228), 16, fill=AQUA)
d.text((104, 176), "NOTÍCIA", font=F("Bold", 38), fill=AZUL)
fonte = F("Bold", 82)
palavras = [(w.strip("*"), w.startswith("*")) for w in re.findall(r"\*[^*]+\*|\S+", TITULO)]
linhas, atual = [], []
for p in palavras:
    teste = " ".join(x for x, _ in atual + [p])
    if atual and d.textlength(teste, font=fonte) > W - 160:
        linhas.append(atual); atual = [p]
    else:
        atual.append(p)
linhas.append(atual)
y = 300
for l in linhas:
    x = 80
    for t, hl in l:
        d.text((x, y), t, font=fonte, fill=AQUA if hl else BRANCO)
        x += d.textlength(t + " ", font=fonte)
    y += 96
if SUB:
    fsub, y = F("Regular", 44), y + 12
    linha = ""
    for w in SUB.split():
        if linha and d.textlength(linha + " " + w, font=fsub) > W - 160:
            d.text((80, y), linha, font=fsub, fill=(225, 232, 240)); y += 56; linha = w
        else:
            linha = (linha + " " + w).strip()
    d.text((80, y), linha, font=fsub, fill=(225, 232, 240))
# moldura fina verde-água em volta do vídeo
d.rectangle((0, VY - 8, W, VY - 1), fill=AQUA)
d.rectangle((0, VY + VH, W, VY + VH + 7), fill=AQUA)
# base: logo + site
lg = Image.open(f"{ASSETS}/logos/logo_horizontal_parafundosazuis.png").convert("RGBA")
lg = lg.resize((400, int(400 * lg.height / lg.width)))
img.paste(lg, ((W - lg.width) // 2, 1630), lg)
site = "noticias.recursoscognitivos.com.br"
fs = F("Semibold", 34)
d.text(((W - d.textlength(site, font=fs)) / 2, 1630 + lg.height + 30), site, font=fs, fill=AQUA)
d.rectangle((0, H - 22, W, H), fill=AQUA)
img.save("/tmp/moldura_vertical.png")

# legenda grande (ASS, Goodly) no azul entre o vídeo e o logo
legenda = ""
if PASTA:
    ent = next((os.path.join(PASTA, n) for n in ("AV03.mp4", "avatar_entrada.mp4") if os.path.exists(os.path.join(PASTA, n))), None)
    off = round(float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ent]).decode()), 2) if ent else 0.0
    cfg = json.load(open(os.path.join(PASTA, "episodio.json"))) if os.path.exists(os.path.join(PASTA, "episodio.json")) else {}
    w = json.load(open(os.path.join(PASTA, "words.json")))
    ch = w["chunks"] if "chunks" in w else w
    ts = lambda x: f"{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}"
    ev, grupo = [], []
    for i, c in enumerate(ch):
        txt = c["text"].strip()
        for a, b in cfg.get("correcoes", {}).items():
            txt = txt.replace(a, b)
        grupo.append((txt, c["timestamp"][0], c["timestamp"][1]))
        fim_frase = txt.endswith((".", "?", "!", ","))
        if len(grupo) == 3 or fim_frase or i == len(ch) - 1:
            a, b = grupo[0][1] + off, grupo[-1][2] + off
            nxt = ch[i + 1]["timestamp"][0] + off if i + 1 < len(ch) else b + 0.3
            ev.append(f"Dialogue: 0,{ts(a)},{ts(min(max(b, a + 0.4), nxt))},Leg,,0,0,0,,{' '.join(t for t, _, _ in grupo).rstrip(',')}")
            grupo = []
    ass = ["[Script Info]", "PlayResX: 1080", "PlayResY: 1920", "WrapStyle: 0", "", "[V4+ Styles]",
           "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
           "Style: Leg,Goodly,74,&H00FFFFFF,&H00FFFFFF,&H00724B2B,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,8,90,90,1330,1",
           "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"] + ev
    open("/tmp/legenda_vertical.ass", "w").write("\n".join(ass) + "\n")
    legenda = f",ass=filename=/tmp/legenda_vertical.ass:fontsdir={ASSETS}/fonts"

t = ["-t", f"{MAX:.2f}"] if MAX else []
fade = []
if MAX:
    dur = MAX
    fade = [f",fade=t=out:st={dur - 1:.2f}:d=1"]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", "/tmp/moldura_vertical.png", "-i", ENT,
                "-filter_complex", f"[1:v]scale={W}:{VH}:flags=lanczos[v];[0:v][v]overlay=0:{VY}:shortest=1" + legenda + "".join(fade) + "[o]",
                "-map", "[o]", "-map", "1:a", *t, "-r", "30", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "160k", "-af", (f"afade=t=out:st={MAX - 1:.2f}:d=1" if MAX else "anull"),
                "-movflags", "+faststart", SAI], check=True)
print("ok", SAI)
