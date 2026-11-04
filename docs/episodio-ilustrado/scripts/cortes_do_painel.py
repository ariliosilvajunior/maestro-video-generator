"""Cortes de cena a partir dos TEMPOS DO PAINEL (fonte única) — nunca recalcular por conta própria.

04/11/2026, Notícias 04: os cortes foram recalculados pelas pausas da narração em vez de usar os tempos do Painel;
a diferença chegou a ~10 s no meio do episódio e as cenas ficaram fora da fala (dono: "não está seguindo a ordem
da narração"). Este script pega cada cena do Painel (código + tempo "M:SS–M:SS"), encaixa cada fim de cena na pausa
real mais próxima da narração (words.json) e grava:
  cuts.json          [[n, ini, fim, dur, 0], ...] na ordem do Painel (n = pNN.mp4)
  cenas_painel.json  [{"n", "codigo", "tempo", "ini", "fim"}] — a montagem confere cuts × Painel antes de rodar.
Uso: CONTENT_FACTORY_API_TOKEN=... python3 cortes_do_painel.py <pasta-do-episodio> <chave-do-episodio>
"""
import json
import os
import sys
import urllib.request

D, CHAVE = sys.argv[1], sys.argv[2]
BASE = os.environ.get("PAINEL_URL", "https://painel.recursoscognitivos.com.br")
req = urllib.request.Request(BASE + "/producao-videos/automacao",
                             headers={"Authorization": "Bearer " + os.environ["CONTENT_FACTORY_API_TOKEN"]})
ep = next(e for e in json.load(urllib.request.urlopen(req, timeout=90)) if e["chave"] == CHAVE)
w = json.load(open(os.path.join(D, "words.json")))
w = w["chunks"] if "chunks" in w else w
pausas = [(w[i]["timestamp"][1] + w[i + 1]["timestamp"][0]) / 2 for i in range(len(w) - 1)]
seg = lambda t: int(t.split(":")[0]) * 60 + int(t.split(":")[1])
cuts, cenas, ini = [], [], 0.0
for n, c in enumerate(ep["cenas"], start=1):
    _, fim_txt = c["tempo"].replace("-", "–").split("–")
    fim = w[-1]["timestamp"][1] if n == len(ep["cenas"]) else min(pausas, key=lambda p: abs(p - seg(fim_txt)))
    cuts.append([n, round(ini, 2), round(fim, 2), round(fim - ini, 2), 0])
    cenas.append({"n": n, "codigo": c["codigo"], "tempo": c["tempo"], "ini": round(ini, 2), "fim": round(fim, 2)})
    ini = fim
json.dump(cuts, open(os.path.join(D, "cuts.json"), "w"))
json.dump(cenas, open(os.path.join(D, "cenas_painel.json"), "w"), ensure_ascii=False, indent=1)
for c in cenas:
    print(f"p{c['n']:02d} {c['codigo']:6} painel {c['tempo']:11} → {c['ini']:7.2f}–{c['fim']:7.2f}")
