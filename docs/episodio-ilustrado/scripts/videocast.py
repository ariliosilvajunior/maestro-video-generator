"""Videocast (1920x1080) da narração INTEIRA de uma notícia — YouTube e Facebook (04/11/2026, dono: "a narração ...
nas outras redes, como se fosse um podcast"). Marca travada: azul #2B4872, verde-água #56CAC9, Goodly, ícone.
Esquerda: selo NOTÍCIA + título (palavra de destaque em verde-água) + "Prof. Arilio · Recursos Cognitivos" + site.
Direita: legenda grande, 1 grupo por vez, palavra falada em verde-água; embaixo, a onda do som ao vivo (showwaves).
Som: a narração + a trilha padrão da marca bem baixa (0,06). Começa já com a capa (sem tela preta).

Uso: python3 videocast.py <narracao.mp3> <words.json> "Título com *destaque*" <saida.mp4> [musica.mp3]
"""
import glob
import json
import re
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

MP3, WORDS, TITULO, SAIDA = sys.argv[1:5]
MUSICA = sys.argv[5] if len(sys.argv) > 5 else None
A = glob.glob("/root/.claude/skills/synced/*/designer-recursos-cognitivos/assets")[0]
F = lambda p, t: ImageFont.truetype(f"{A}/fonts/Goodly-{p}.otf", t)
AZUL, AQUA, BRANCO = (43, 72, 114), (86, 202, 201), (255, 255, 255)
W, H = 1920, 1080
CORR = {"Arilho": "Arilio", "Estela": "Stella", "Sciotti": "Chiote"}

# ---- fundo fixo (PIL)
img = Image.new("RGB", (W, H), AZUL)
d = ImageDraw.Draw(img)
d.rectangle((760, 0, W, H), fill=(36, 61, 98))                       # painel da direita, um tom abaixo
d.rectangle((756, 0, 763, H), fill=AQUA)
ic = Image.open(f"{A}/logos/icone_parafundoazul.png").convert("RGBA")
ic = ic.resize((120, int(120 * ic.height / ic.width)))
img.paste(ic, (80, 70), ic)
d.rounded_rectangle((80, 250, 300, 312), 16, fill=AQUA)
d.text((104, 259), "NOTÍCIA", font=F("Bold", 38), fill=AZUL)
fonte = F("Bold", 70)
pal = [(w.replace("*", ""), w.startswith("*")) for w in re.findall(r"\*[^*]+\*\S*|\S+", TITULO)]
linhas, atual = [], []
for p in pal:
    if atual and d.textlength(" ".join(x for x, _ in atual + [p]), font=fonte) > 600:
        linhas.append(atual); atual = [p]
    else:
        atual.append(p)
linhas.append(atual)
y = 350
for l in linhas[:6]:
    x = 80
    for t, hl in l:
        d.text((x, y), t, font=fonte, fill=AQUA if hl else BRANCO)
        x += d.textlength(t + " ", font=fonte)
    y += 84
d.text((80, H - 220), "Prof. Arilio", font=F("Bold", 48), fill=BRANCO)
d.text((80, H - 160), "Recursos Cognitivos", font=F("Semibold", 40), fill=AQUA)
d.text((80, H - 100), "noticias.recursoscognitivos.com.br", font=F("Regular", 30), fill=(210, 222, 236))
img.save("/tmp/videocast_fundo.png")

# ---- legenda (ASS, Goodly): grupos de até 4 palavras, a palavra falada em verde-água
w = json.load(open(WORDS))
w = w["chunks"] if "chunks" in w else w
ts = lambda x: f"{int(x // 3600)}:{int(x % 3600 // 60):02d}:{x % 60:05.2f}"
grupos, g = [], []
for i, c in enumerate(w):
    t = c["text"].strip()
    for a, b in CORR.items():
        t = t.replace(a, b)
    if g and t.lower() == g[-1][0].lower():
        continue
    g.append((t, c["timestamp"][0], c["timestamp"][1]))
    if len(g) >= 4 or re.search(r"[.?!,]$", t) or i == len(w) - 1:
        grupos.append(g); g = []
ev = []
for k, gr in enumerate(grupos):
    fim_g = grupos[k + 1][0][1] if k + 1 < len(grupos) else gr[-1][2] + 0.6
    for j, (t, a, b) in enumerate(gr):
        fim = gr[j + 1][1] if j + 1 < len(gr) else fim_g
        txt = " ".join(("{\\c&HC9CA56&}" + p + "{\\c&HFFFFFF&}") if jj == j else p for jj, (p, _, _) in enumerate(gr))
        ev.append(f"Dialogue: 0,{ts(a)},{ts(max(fim, a + 0.05))},Leg,,0,0,0,,{txt}")
ass = ["[Script Info]", "PlayResX: 1920", "PlayResY: 1080", "WrapStyle: 0", "", "[V4+ Styles]",
       "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
       "Style: Leg,Goodly,92,&H00FFFFFF,&H00FFFFFF,&H00724B2B,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,5,860,100,0,1",
       "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"] + ev
open("/tmp/videocast.ass", "w").write("\n".join(ass) + "\n")

dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", MP3]).decode())
total = dur + 1.5
entradas = ["-loop", "1", "-i", "/tmp/videocast_fundo.png", "-i", MP3]
filtro = (f"[1:a]asplit[nar][onda];[onda]showwaves=s=1000x170:mode=cline:rate=30:colors=white:scale=sqrt,format=gray,lut=c0='if(gt(val\\,8)\\,255\\,0)'[wm];color=c=0x56CAC9:s=1000x170:r=30[ac];[ac][wm]alphamerge[w];"
          f"[0:v][w]overlay=860:800:shortest=0,ass=filename=/tmp/videocast.ass:fontsdir={A}/fonts,"
          f"fade=t=out:st={total - 1:.2f}:d=1[v]")
if MUSICA:
    entradas += ["-stream_loop", "-1", "-i", MUSICA]
    filtro += (f";[2:a]volume=0.06,atrim=0:{total:.2f},afade=t=in:d=2,afade=t=out:st={total - 3:.2f}:d=3[m];"
               f"[nar]apad=whole_dur={total:.2f}[n];[n][m]amix=inputs=2:duration=first:normalize=0,afade=t=out:st={total - 1:.2f}:d=1[a]")
else:
    filtro += f";[nar]apad=whole_dur={total:.2f},afade=t=out:st={total - 1:.2f}:d=1[a]"
subprocess.run(["ffmpeg", "-v", "error", "-y", *entradas, "-filter_complex", filtro, "-map", "[v]", "-map", "[a]",
                "-t", f"{total:.2f}", "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", SAIDA], check=True)
print("ok", SAIDA, f"{total:.1f}s")
