"""Reel vertical (1080x1920) de um episódio — trecho mais forte + cartão final, no padrão da marca
(azul #2B4872 dominante, verde-água #56CAC9 no destaque, fonte Goodly). 31/10/2026.
Uso: python3 reel.py <pasta-do-episodio> <inicio_narracao_s> <fim_narracao_s> "<GANCHO: linha1|DESTAQUE|linha3>"
"""
import json
import os
import subprocess
import sys

D = sys.argv[1]
INI, FIM = float(sys.argv[2]), float(sys.argv[3])
G1, G2, G3 = sys.argv[4].split("|")
FONTES = "/root/.claude/skills/synced/5dc2abc8-58b1-4914-b895-6a324f74ae6a_2405f526-549e-4955-aaba-f8a9f9f1aa88/designer-recursos-cognitivos/assets/fonts"
ICONE = "/root/.claude/skills/synced/5dc2abc8-58b1-4914-b895-6a324f74ae6a_2405f526-549e-4955-aaba-f8a9f9f1aa88/designer-recursos-cognitivos/assets/logos/icone_parafundoazul.png"
CFG = json.load(open(os.path.join(D, "episodio.json")))
OFF = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(D, "avatar_entrada.mp4")]).decode())
OFF = round(OFF, 2)
CARTAO = 3.0
DUR = FIM - INI + 0.4
TOTAL = DUR + CARTAO


def ts(t):
    t = max(0.0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


# legendas: até 4 palavras por quadro, tempos da narração (o reel começa em INI)
w = json.load(open(os.path.join(D, "words.json")))
ch = w["chunks"] if "chunks" in w else w
cues, atual = [], []
for c in ch:
    a, b = c["timestamp"]
    if b < INI or a > FIM:
        continue
    atual.append((a, b, c["text"].strip()))
    if len(atual) == 4 or c["text"].strip().endswith((".", ",", "?", "!")):
        cues.append(atual); atual = []
if atual:
    cues.append(atual)
correcoes = CFG.get("correcoes", {"Arilho": "Arilio"})
eventos = []
for grupo in cues:
    texto = " ".join(x[2] for x in grupo)
    for errado, certo in correcoes.items():
        texto = texto.replace(errado, certo)
    eventos.append(f"Dialogue: 0,{ts(grupo[0][0] - INI)},{ts(grupo[-1][1] - INI + 0.05)},Leg,,0,0,0,,{texto}")
AZUL, AGUA = "&H00724B2B", "&H00C9CA56"  # ASS = &HAABBGGRR
ass = f"""[Script Info]
PlayResX: 1080
PlayResY: 1920
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Leg,Goodly,74,&H00FFFFFF,&H00FFFFFF,{AZUL},&H00000000,1,0,0,0,100,100,0,0,1,6,0,8,70,70,1100,1
Style: Gancho,Goodly,104,&H00FFFFFF,&H00FFFFFF,{AZUL},&H00000000,1,0,0,0,100,100,0,0,1,6,0,8,40,40,120,1
Style: Cartao,Goodly,78,&H00FFFFFF,&H00FFFFFF,{AZUL},&H00000000,1,0,0,0,100,100,0,0,1,0,0,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 1,{ts(0)},{ts(DUR)},Gancho,,0,0,0,,{{\\fad(300,300)}}{G1}\\N{{\\c{AGUA}\\fs124}}{G2}{{\\c&H00FFFFFF&\\fs104}}\\N{G3}
""" + "\n".join(eventos) + f"""
Dialogue: 2,{ts(DUR)},{ts(TOTAL)},Cartao,,0,0,0,,{{\\fad(300,0)\\pos(540,1080)}}Episódio completo\\Nno {{\\c{AGUA}}}YouTube{{\\c&H00FFFFFF&}}\\N{{\\fs52}}Recursos Cognitivos
"""
open(os.path.join(D, "tmp", "reel.ass"), "w", encoding="utf-8").write(ass)

KEY = "colorkey=0x00FF00:0.30:0.08,despill=type=green"
t0 = OFF + INI
fc = (
    f"[0:v]trim=start={t0}:duration={TOTAL},setpts=PTS-STARTPTS,split[a][b];"
    f"[a]scale=-2:1920,crop=1080:1920,boxblur=30:3,drawbox=color=0x2B4872@0.62:t=fill[bg];"
    f"[b]scale=1080:608[fg];"
    f"[bg][fg]overlay=0:470[v1];"
    f"[1:v]trim=start={INI}:duration={DUR},setpts=PTS-STARTPTS,fps=25,{KEY},scale=600:600,format=yuva420p[av];"
    f"[v1][av]overlay=240:1320:eof_action=pass[v2];"
    f"[v2]drawbox=color=0x2B4872:t=fill:enable='gte(t,{DUR})'[v3];"
    f"[2:v]scale=220:-1[ic];[v3][ic]overlay=430:560:enable='gte(t,{DUR})'[v4];"
    f"[v4]ass=filename={os.path.join(D, 'tmp', 'reel.ass')}:fontsdir={FONTES},format=yuv420p[v]"
)
af = f"[3:a]atrim=start={t0}:duration={TOTAL},asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st={TOTAL - 1.8}:d=1.8[a]"
cmd = ["ffmpeg", "-v", "error", "-y", "-i", os.path.join(D, "tmp", "cenas.mp4"), "-i", os.path.join(D, "avatar_fala.mp4"),
       "-loop", "1", "-i", ICONE, "-i", os.path.join(D, "tmp", "audio.wav"),
       "-filter_complex", fc + ";" + af, "-map", "[v]", "-map", "[a]", "-t", f"{TOTAL:.2f}", "-r", "30",
       "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
       "-movflags", "+faststart", os.path.join(D, "reel.mp4")]
subprocess.run(cmd, check=True)
print("ok", round(TOTAL, 2), "s")
