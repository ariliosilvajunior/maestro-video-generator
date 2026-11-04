"""Monta um episódio ilustrado inteiro (Recursos Cognitivos).

Entradas (na pasta do episódio):
  narracao.mp3, cuts.json ([[n, ini, fim, dur, clipe_s], ...]), words.json (Whisper, palavra por palavra),
  clipes/pNN.mp4 (um por cena), avatar_fala.mp4 (H3 Max, fundo verde, fala inteira),
  avatar_entrada.mp4 (opcional, 16:9 fundo verde), avatar_saida.mp4 (opcional), musica.mp3,
  amb/aNN.wav (som ambiente por cena, opcional), episodio.json (título, frases-chave, cor).
Saída: final.mp4 (1920x1080, 25 fps).
Doc vivo: docs/episodio-ilustrado/ROTEIRO_MONTAGEM_EPISODIO.md
"""
import json, os, re, subprocess, sys

D = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
P = lambda *x: os.path.join(D, *x)
CFG = json.load(open(P("episodio.json")))
XF = 0.5                      # fusão entre cenas (s)
# 02/11: no Drive o avatar virou AV03 (entrada) e AV04 (saída); aceita os dois nomes
ENTRADA = next((P(n) for n in ("AV03.mp4", "avatar_entrada.mp4") if os.path.exists(P(n))), None)
SAIDA = next((P(n) for n in ("AV04.mp4", "avatar_saida.mp4") if os.path.exists(P(n))), None)


def dur(f, video=False):
    """Duração; com video=True usa a trilha de VÍDEO (clipes do Flow têm áudio mais longo que a imagem)."""
    if video:
        return float(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "csv=p=0", f]).decode())
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).decode())


def run(cmd):
    subprocess.run(cmd, check=True)


cuts = [(int(k), a, b) for k, a, b, *_ in json.load(open(P("cuts.json")))]
NARR = dur(P("narracao.mp3"))
OFF = round(dur(ENTRADA), 2) if ENTRADA else 0.0         # a narração começa depois da entrada
TAIL = (round(dur(SAIDA), 2) if SAIDA else 0.8) + 1.5      # saída do avatar + respiro final
END = OFF + NARR + TAIL
os.makedirs(P("tmp"), exist_ok=True)

def recorte(k):
    """Aproximar uma cena sem gerar imagem nova (ex.: n3-E15 = n3-E13 de perto).
    episodio.json: "recorte": {"15": [cx, cy, zoom]} — centro em fração da largura/altura, zoom até ~1.8."""
    r = CFG.get("recorte", {}).get(str(k))
    if not r: return ""
    cx, cy, z = r
    return (f"crop=iw/{z}:ih/{z}:'max(0,min(iw-iw/{z},iw*{cx}-iw/{z}/2))':'max(0,min(ih-ih/{z},ih*{cy}-ih/{z}/2))',")

# 1) cada cena no tamanho certo: estica (até 1,6x mais lento) e congela o último quadro se faltar
inicio = {}
for i, (k, a, b) in enumerate(cuts):
    ini = 0.0 if i == 0 else OFF + a
    fim = END if i == len(cuts) - 1 else OFF + b
    inicio[k] = ini
    precisa = fim - ini + (XF if i < len(cuts) - 1 else 0)
    src = P("clipes", f"p{k:02d}.mp4")
    if not os.path.exists(src):
        # R54 (02/11): cena que o Flow não deixa animar (criança deitada/hospital) — zoom lento (Ken Burns) na imagem
        img = next((P("clipes", f"p{k:02d}.{e}") for e in ("jpg", "png", "jpeg") if os.path.exists(P("clipes", f"p{k:02d}.{e}"))), None)
        if img is None:
            raise SystemExit(f"cena {k}: falta clipes/p{k:02d}.mp4 (ou a imagem .jpg/.png para o zoom lento)")
        quadros = int((precisa + 1) * 25)
        run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", img, "-vf",
             f"scale=3840:2160:flags=lanczos,zoompan=z='min(1+0.0006*on,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={quadros}:s=1920x1080:fps=25,format=yuv420p",
             "-t", f"{precisa + 1:.3f}", "-c:v", "libx264", "-crf", "17", src])
    d = dur(src, video=True); ss = CFG.get("inicio_clipe", {}).get(str(k), 0.0)
    corte = CFG.get("cortar_fim_clipe", {}).get(str(k), 0.0)   # clipe que termina escurecendo: não congelar no preto
    d -= ss + corte
    lento = min(max(precisa / d, 1.0), 1.6)
    # -ss e -t ANTES do -i (opção de entrada): depois do -i o segundo -t sobrescreve e o corte some (erro 31/10)
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-t", f"{d:.3f}", "-i", src, "-an", "-vf",
         f"setpts={lento:.4f}*PTS,{recorte(k)}scale=1920:1080:flags=lanczos,fps=25,tpad=stop_mode=clone:stop_duration=30,format=yuv420p,setsar=1",
         "-t", f"{precisa:.3f}", "-c:v", "libx264", "-crf", "17", P("tmp", f"c{k:02d}.mp4")])

# 2) junta com fusão + cor do episódio (referência ShotDeck) + grão 35mm + vinheta
inp, fc, prev = [], [], "0:v"
for i, (k, a, b) in enumerate(cuts):
    inp += ["-i", P("tmp", f"c{k:02d}.mp4")]
for i, (k, a, b) in enumerate(cuts[1:], 1):
    fc.append(f"[{prev}][{i}:v]xfade=transition=fade:duration={XF}:offset={inicio[k]:.3f}[v{i}]"); prev = f"v{i}"
fc.append(f"[{prev}]{CFG['cor']}[g]")
run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(fc), "-map", "[g]", "-t", f"{END:.3f}",
     "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", P("tmp", "cenas.mp4")])

# 3) legenda + título + nome + frases-chave (ASS), tudo deslocado pelo tempo da entrada
def ts(s): return f"{int(s//3600)}:{int(s%3600//60):02d}:{s%60:05.2f}"
w = json.load(open(P("words.json")))["chunks"]
corr = CFG.get("correcoes", {})
cues, cur = [], []
for c in w:
    t = corr.get(c["text"].strip(), c["text"].strip()); cur.append((t, c["timestamp"][0], c["timestamp"][1]))
    txt = " ".join(x[0] for x in cur)
    if len(txt) >= 34 or (re.search(r"[.,?!]$", t) and len(txt) >= 12):
        cues.append(cur); cur = []
if cur: cues.append(cur)
H = ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1920", "PlayResY: 1080", "", "[V4+ Styles]",
     "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
     "Style: Doc,Liberation Sans,46,&H00F5F5F5,&H00F5F5F5,&H00202020,&H64000000,0,0,0,0,100,100,0.5,0,1,2.2,1.5,2,100,520,55,1",
     "Style: Title,Liberation Serif,96,&H00EAF4FA,&H00EAF4FA,&H00203040,&H80000000,1,0,0,0,100,100,2,0,1,2,3,5,100,100,0,1",
     "Style: Sub,Liberation Serif,40,&H00C8DCE8,&H00C8DCE8,&H00203040,&H80000000,0,1,0,0,100,100,3,0,1,1.5,2,5,100,100,0,1",
     "Style: Name,Liberation Sans,46,&H00FFFFFF,&H00FFFFFF,&H00202020,&H90000000,1,0,0,0,100,100,1,0,1,2,2,3,0,540,345,1",
     "Style: Role,Liberation Sans,32,&H00E0EEF4,&H00E0EEF4,&H00202020,&H90000000,0,0,0,0,100,100,1,0,1,1.6,1.8,3,0,540,295,1",
     "Style: Key,Liberation Serif,64,&H00E6F2F8,&H00E6F2F8,&H00203040,&H80000000,1,1,0,0,100,100,1,0,1,2,3,7,110,100,90,1",
     "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
E = []
for i, c in enumerate(cues):
    a = c[0][1]; b = min(c[-1][2] + 0.25, cues[i + 1][0][1] if i + 1 < len(cues) else NARR)
    E.append(f"Dialogue: 0,{ts(OFF+a)},{ts(OFF+b)},Doc,,0,0,0,," + " ".join(x[0] for x in c))
E.append(rf"Dialogue: 1,{ts(0.4)},{ts(OFF+2.0)},Title,,0,0,0,,{{\fad(900,700)\pos(960,470)}}{CFG['titulo']}")
E.append(rf"Dialogue: 1,{ts(1.2)},{ts(OFF+2.0)},Sub,,0,0,0,,{{\fad(900,700)\pos(960,570)}}{CFG['subtitulo']}")
E.append(rf"Dialogue: 1,{ts(OFF+0.4)},{ts(OFF+6.0)},Name,,0,0,0,,{{\fad(400,500)}}Prof. Arilio")
E.append(rf"Dialogue: 1,{ts(OFF+0.6)},{ts(OFF+6.0)},Role,,0,0,0,,{{\fad(400,500)}}Recursos Cognitivos")
def achar(frase):
    alvo = [re.sub(r"\W", "", x).lower() for x in frase.split()]
    pal = [(re.sub(r"\W", "", c["text"]).lower(), c["timestamp"]) for c in w]
    for i in range(len(pal) - len(alvo) + 1):
        if [p for p, _ in pal[i:i + len(alvo)]] == alvo:
            return pal[i][1][0], max(pal[i + len(alvo) - 1][1][1] + 1.2, pal[i][1][0] + 2.6)
    raise SystemExit(f"frase-chave não encontrada na narração: {frase}")
for frase in CFG.get("frases_chave", []):
    a, b = achar(frase)
    E.append(rf"Dialogue: 1,{ts(OFF+a)},{ts(OFF+b)},Key,,0,0,0,,{{\fad(350,450)}}{frase}")
open(P("tmp", "fx.ass"), "w").write("\n".join(H + E) + "\n")

# 4) avatar: entrada (sem recorte, entra pela borda) → fala (posição fixa) → saída (ou some suave)
KEY = "colorkey=0x00FF00:0.30:0.08,despill=type=green"
vin = ["-i", P("tmp", "cenas.mp4"), "-i", P("avatar_fala.mp4")]
# 31/10 (dono: "quando levanto para sair o avatar some e reaparece"): a fala do avatar (195,84 s) era mais curta
# que a narração (195,97 s) e a saída só começava no fim da narração → buraco de ~0,15 s sem avatar.
# Agora a saída começa no ÚLTIMO quadro da fala (SAI) e a fala congela o último quadro até lá, sem sobreposição.
SAI = OFF + min(NARR, dur(P("avatar_fala.mp4"), video=True))
vf = [f"[1:v]fps=25,crop='min(iw,ih)':'min(iw,ih)',{KEY},scale=400:400,format=yuva420p,tpad=stop_mode=clone:stop_duration=3,setpts=PTS+{OFF}/TB" +
      ("" if SAIDA else f",fade=t=out:st={SAI:.2f}:d=0.8:alpha=1") + "[fala]"]
base = "[0:v]"
if ENTRADA:
    vin += ["-i", ENTRADA]
    vf.append(f"[2:v]fps=25,scale=711:400,{KEY},format=yuva420p[ent]")
    vf.append(f"{base}[ent]overlay=1284:H-h+25:enable='lt(t,{OFF})'[b1]"); base = "[b1]"
vf.append(f"{base}[fala]overlay=W-w-80:H-h+25:eof_action=pass" + (f":enable='lt(t,{SAI:.3f})'" if SAIDA else "") + "[b2]"); base = "[b2]"
if SAIDA:
    n = len(vin) // 2
    vin += ["-i", SAIDA]
    # quadro da saída: [largura, altura, x]. Padrão = saída antiga (pessoa ocupa o quadro todo → corta a cabeça ao
    # levantar). Saída com folga (Av04: pessoa 720px embaixo num quadro 1920x1080) = [1067, 600, 1107].
    sw, sh, sx = CFG.get("saida_quadro", [711, 400, 1284])
    vf.append(f"[{n}:v]fps=25,scale={sw}:{sh},{KEY},format=yuva420p,setpts=PTS+{SAI:.3f}/TB[sai]")
    vf.append(f"{base}[sai]overlay={sx}:H-h+25:eof_action=pass[b3]"); base = "[b3]"
vf.append(f"{base}ass={P('tmp', 'fx.ass')}[v]")
run(["ffmpeg", "-v", "error", "-y", *vin, "-filter_complex", ";".join(vf), "-map", "[v]", "-t", f"{END:.3f}",
     "-c:v", "libx264", "-crf", "19", "-pix_fmt", "yuv420p", P("tmp", "video.mp4")])

# 5) som: narração (atrasada pela entrada) + música com ducking + ambiente por cena + whoosh nas fusões
run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anoisesrc=d=0.9:c=pink:a=0.5", "-af",
     "highpass=f=300,lowpass=f=3500,afade=t=in:d=0.45,afade=t=out:st=0.45:d=0.45,volume=0.22", P("tmp", "whoosh.wav")])
ain = ["-i", P("narracao.mp3"), "-stream_loop", "-1", "-i", P("musica.mp3")]
af = [f"[0:a]adelay={int(OFF*1000)}|{int(OFF*1000)},apad=whole_dur={END:.2f}[nar]", "[nar]asplit[n1][n2]",
      f"[1:a]volume={CFG.get('volume_musica', 0.20)},atrim=0:{END:.2f},afade=t=in:d=2,afade=t=out:st={END-3:.2f}:d=3[m]",
      "[m][n2]sidechaincompress=threshold=0.05:ratio=2.5:attack=80:release=700[md]"]
mix = ["[n1]", "[md]"]; idx = 2
for i, (k, a, b) in enumerate(cuts):
    amb = P("amb", f"a{k:02d}.wav")
    if os.path.exists(amb):
        ms = int(inicio[k] * 1000)
        ain += ["-i", amb]; af.append(f"[{idx}:a]loudnorm=I=-30:TP=-6,volume=0.9,adelay={ms}|{ms}[a{k}]"); mix.append(f"[a{k}]"); idx += 1
    if i > 0:
        ms = int(max(inicio[k] - 0.45, 0) * 1000)
        ain += ["-i", P("tmp", "whoosh.wav")]; af.append(f"[{idx}:a]adelay={ms}|{ms}[w{k}]"); mix.append(f"[w{k}]"); idx += 1
af.append("".join(mix) + f"amix=inputs={len(mix)}:duration=first:normalize=0,atrim=0:{END:.2f}[a]")
run(["ffmpeg", "-v", "error", "-y", *ain, "-filter_complex", ";".join(af), "-map", "[a]", "-c:a", "pcm_s16le", P("tmp", "audio.wav")])

# 6) junta e termina com fade para preto
run(["ffmpeg", "-v", "error", "-y", "-i", P("tmp", "video.mp4"), "-i", P("tmp", "audio.wav"), "-vf",
     f"fade=t=in:d=0.6,fade=t=out:st={END-1.0:.2f}:d=1.0", "-af", f"afade=t=out:st={END-1.5:.2f}:d=1.5",
     "-c:v", "libx264", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", P("final.mp4")])
print("ok", round(END, 2), "s")
