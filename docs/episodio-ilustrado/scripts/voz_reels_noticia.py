"""Reels de notícia com a VOZ do dono (04/11/2026, dono: "a narração ... nas outras redes, como se fosse um podcast").
Baixa a narração da notícia no site, transcreve palavra por palavra (fal Whisper, ~US$ 0,01) e escolhe o trecho do
início até o fim de frase mais perto de 55 s (entre 40 e 62 s). Grava no Reels da notícia no Estúdio (cria se não
existir) como `dados.voz` = {ini, fim, palavras: [[texto, ini, fim], ...]}, status aguardando aprovação.
Uso: CONTENT_FACTORY_API_TOKEN=... python3 voz_reels_noticia.py <noticia_id> [<noticia_id> ...]
"""
import base64, json, os, re, sys, time, urllib.request
sys.path.insert(0, "/home/user/maestro-video-generator/lib")
from api_keys import resolve_key

PAINEL = os.environ.get("PAINEL_URL", "https://painel.recursoscognitivos.com.br")
TOK = {"Authorization": "Bearer " + os.environ["CONTENT_FACTORY_API_TOKEN"], "Content-Type": "application/json"}
FAL = {"Content-Type": "application/json", "Authorization": "Key " + resolve_key("fal")}
CORR = {"Arilho": "Arilio", "Estela": "Stella"}


def req(url, dados=None, cab=TOK, metodo=None):
    r = urllib.request.Request(url, data=json.dumps(dados).encode() if dados is not None else None, headers=cab,
                               method=metodo or ("POST" if dados is not None else "GET"))
    return json.load(urllib.request.urlopen(r, timeout=300))


def transcrever(mp3: bytes) -> list:
    s = req("https://queue.fal.run/fal-ai/whisper", {"audio_url": "data:audio/mpeg;base64," + base64.b64encode(mp3).decode(),
            "task": "transcribe", "language": "pt", "chunk_level": "word", "version": "3"}, FAL)
    while req(s["status_url"], cab=FAL)["status"] != "COMPLETED":
        time.sleep(4)
    return req(s["response_url"], cab=FAL)["chunks"]


def trecho(w: list) -> dict:
    fins = [k for k, c in enumerate(w) if re.search(r"[.?!]$", c["text"].strip()) and 40 <= c["timestamp"][1] <= 62]
    k = min(fins, key=lambda k: abs(w[k]["timestamp"][1] - 55)) if fins else max(i for i, c in enumerate(w) if c["timestamp"][1] <= 60)
    pal = []
    for c in w[:k + 1]:
        t = c["text"].strip()
        for a, b in CORR.items():
            t = t.replace(a, b)
        if pal and t.lower() == pal[-1][0].lower():  # palavra repetida da fala ("o O professor")
            continue
        pal.append([t, round(c["timestamp"][0], 2), round(c["timestamp"][1], 2)])
    return {"ini": 0.0, "fim": round(w[k]["timestamp"][1] + 0.25, 2), "palavras": pal}


pecas = req(PAINEL + "/estudio/automacao")
noticias = {n["id"]: n for n in req(PAINEL + "/noticias/publicados-automacao")}
for nid in map(int, sys.argv[1:]):
    mp3 = urllib.request.urlopen(f"https://noticias.recursoscognitivos.com.br/artigos/{nid}/podcast", timeout=120).read()
    voz = trecho(transcrever(mp3))
    p = next((x for x in pecas if x["tipo"] == "reels" and (x.get("dados") or {}).get("noticia_id") == nid and x["status"] != "aprovado"), None)
    corpo = {"tipo": "reels", "titulo": f"Reels · {noticias[nid]['titulo']}", "dados": {"auto": True, "noticia_id": nid, "voz": voz},
             "status": "aguardando_aprovacao"}
    if p:
        corpo["id"] = p["id"]
    r = req(PAINEL + "/estudio/automacao", corpo)
    print(nid, "→ Reels", r["id"], f"{voz['fim']:.1f} s:", " ".join(x[0] for x in voz["palavras"])[-90:])
