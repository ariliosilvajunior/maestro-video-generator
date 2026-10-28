"""Envia docs/episodio-ilustrado/producao_inicial.json para o Painel do Dono
(POST /producao-videos/automacao, um episódio por vez). Token: PAINEL_TOKEN."""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "lib"))
from api_keys import resolve_key

token = resolve_key("painel")
if not token:
    sys.exit("PAINEL_TOKEN ausente.")
base = os.path.join(os.path.dirname(__file__), "..", "producao_inicial.json")
for ep in json.load(open(base, encoding="utf-8")):
    req = urllib.request.Request(
        "https://painel.recursoscognitivos.com.br/producao-videos/automacao",
        data=json.dumps(ep).encode(), method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    )
    r = json.load(urllib.request.urlopen(req, timeout=30))
    print(r["chave"], f'{r["cenas_feitas"]}/{r["cenas_total"]}')
