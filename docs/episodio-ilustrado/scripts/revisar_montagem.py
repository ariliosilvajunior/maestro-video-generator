"""Folhas de revisão do episódio MONTADO — entrada obrigatória do agente `revisor-montagem` antes de qualquer vídeo
ir para o dono (dono, 04/11/2026: "tem que ter um revisor antes de me enviar ... com o valor que estou gastando").

Gera em <pasta>/revisao/:
  cena_NN.png       por cena: 4 quadros DO VÍDEO FINAL (início, 1/3, 2/3, fim da vaga) + o 1º quadro da cena seguinte
  emendas.png       todas as passagens cena → cena lado a lado (último quadro | primeiro quadro da próxima)
  revisao.json      por cena: código, tempo do Painel, descrição, texto da narração naquela vaga, duração da vaga e
                    do clipe, brilho (YAVG) mínimo — e os avisos automáticos (vaga > 1,6× o clipe, queda para preto)
Uso: python3 revisar_montagem.py <pasta-do-episodio> [episodio_painel.json]
"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw

D = os.path.abspath(sys.argv[1])
P = lambda *x: os.path.join(D, *x)
R = P("revisao")
os.makedirs(R, exist_ok=True)
FINAL = P("final.mp4")
cuts = json.load(open(P("cuts.json")))
cenas = json.load(open(P("cenas_painel.json")))
desc = {}
if len(sys.argv) > 2:
    ep = json.load(open(sys.argv[2]))
    desc = {c["codigo"]: c.get("descricao", "") for c in ep["cenas"]}
w = json.load(open(P("words.json")))
w = w["chunks"] if "chunks" in w else w
ent = next((P(n) for n in ("AV03.mp4", "avatar_entrada.mp4") if os.path.exists(P(n))), None)
dur = lambda f, v=False: float(subprocess.check_output(
    ["ffprobe", "-v", "error"] + (["-select_streams", "v:0", "-show_entries", "stream=duration"] if v else ["-show_entries", "format=duration"])
    + ["-of", "csv=p=0", f]).decode())
OFF = round(dur(ent), 2) if ent else 0.0


def quadro(t, nome, largura=360):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, t):.2f}", "-i", FINAL, "-frames:v", "1",
                    "-vf", f"scale={largura}:-2", nome], check=True)
    return Image.open(nome)


def yavg_min(a, b):
    out = subprocess.run(["ffprobe", "-v", "error", "-f", "lavfi", "-i",
                          f"movie={FINAL}:seek_point={a:.2f},trim=duration={b - a:.2f},fps=4,signalstats",
                          "-show_entries", "frame_tags=lavfi.signalstats.YAVG", "-of", "csv=p=0"], capture_output=True, text=True).stdout
    v = [float(x) for x in out.split() if x.strip()]
    return round(min(v), 1) if v else None


itens, emendas = [], []
for i, ((k, a, b, d, _), c) in enumerate(zip(cuts, cenas)):
    ini, fim = OFF + a, OFF + b
    ts = [ini + 0.2, ini + (fim - ini) / 3, ini + 2 * (fim - ini) / 3, fim - 0.25]
    if i + 1 < len(cuts):
        ts.append(OFF + cuts[i + 1][1] + 0.6)
    ims = [quadro(t, P("revisao", f"_q{j}.png")) for j, t in enumerate(ts)]
    W, H = ims[0].size
    folha = Image.new("RGB", (W * len(ims) + 8 * (len(ims) - 1), H + 30), "white")
    dr = ImageDraw.Draw(folha)
    for j, im in enumerate(ims):
        folha.paste(im, (j * (W + 8), 30))
        dr.text((j * (W + 8) + 4, 8), ["início", "1/3", "2/3", "fim", "→ PRÓXIMA"][j] + f" {ts[j]:.1f}s", fill="black")
    folha.save(P("revisao", f"cena_{k:02d}.png"))
    emendas.append((ims[3], ims[4]) if len(ims) > 4 else None)
    texto = " ".join(x["text"].strip() for x in w if x["timestamp"][0] >= a - 0.05 and x["timestamp"][1] <= b + 0.05)
    clipe = dur(P("clipes", f"p{k:02d}.mp4"), True) if os.path.exists(P("clipes", f"p{k:02d}.mp4")) else None
    avisos = []
    if clipe and d > clipe * 1.6:
        avisos.append(f"vaga {d:.1f}s > 1,6× o clipe ({clipe:.1f}s): cena congela")
    y = yavg_min(ini, fim)
    if y is not None and y < 25:
        avisos.append(f"escurece (YAVG mínimo {y})")
    itens.append({"n": k, "codigo": c["codigo"], "tempo_painel": c["tempo"], "descricao": desc.get(c["codigo"], ""),
                  "narracao": texto, "vaga_s": d, "clipe_s": clipe, "yavg_min": y, "avisos": avisos,
                  "folha": f"revisao/cena_{k:02d}.png"})
# emendas numa folha só (3 por linha)
pares = [e for e in emendas if e]
if pares:
    W, H = pares[0][0].size
    cols = 3
    linhas = (len(pares) + cols - 1) // cols
    fol = Image.new("RGB", (cols * (2 * W + 30), linhas * (H + 26)), "white")
    dr = ImageDraw.Draw(fol)
    for j, (x1, x2) in enumerate(pares):
        cx, cy = (j % cols) * (2 * W + 30), (j // cols) * (H + 26)
        fol.paste(x1, (cx, cy + 22)); fol.paste(x2, (cx + W + 4, cy + 22))
        dr.text((cx + 4, cy + 4), f"{cenas[j]['codigo']} → {cenas[j + 1]['codigo']}", fill="black")
    fol.save(P("revisao", "emendas.png"))
for f in os.listdir(R):
    if f.startswith("_q"):
        os.remove(os.path.join(R, f))
json.dump(itens, open(P("revisao", "revisao.json"), "w"), ensure_ascii=False, indent=1)
print(f"{len(itens)} cenas · folhas em {R} · avisos automáticos: {sum(len(x['avisos']) for x in itens)}")
