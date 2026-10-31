"""31/10/2026 — E03/E04 (n3): fundo do close escrito a partir da imagem n3-E02 REAL, não do mapa.
Dono: "quando está só a mulher o armário atrás dela some"."""
import sys, json, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U
ST = (" STYLE LOCK (match p04-caixas-mudanca exactly): cinematic painterly realism almost like a photograph painted in oil, realistic adult faces and hands with five fingers, "
      "fine canvas grain and crosshatched texture over the whole image, low golden side light. NOT a clean digital illustration, NOT a cartoon, NOT watercolor, NOT ink line drawing. "
      "No readable text. Lower right corner kept quiet.")
FUNDO = ("BACKGROUND EXACTLY AS IN n3-E02 (same room, same camera direction, only closer): directly behind the mother stands the TALL light-wood shelf full of transparent "
         "plastic boxes, with the trailing green plant hanging from its top on the right side of the shelf, just above her right shoulder; to the RIGHT of the shelf, behind "
         "the father's place, the big blue felt board with cream cards. The off-white wall between them. The window is on the LEFT wall, out of frame — only soft daylight "
         "from the left. NO window behind them, NO other chairs, NO children's chairs in this close view. She sits on a dark-grey upholstered adult chair. ")
MAE = ("the present-day mother from f08-mae-hoje: about 38, warm brown skin, short curly dark hair to the chin, small gold earrings, mustard-yellow cardigan over a white t-shirt, "
       "smooth hands of a 38-year-old")
TXT = {
 "E03": ("REFERENCE ROLES: the attached image p04-caixas-mudanca is the MASTER STYLE reference — match its look exactly, never copy its people or place. "
         f"Medium close-up, at adult eye level, of {MAE}, sitting at the light-wood adult meeting table from the attached scene n3-E02, looking down at her clasped hands, "
         "silent, eyes heavy. " + FUNDO + "The father is out of frame on the right." + ST),
 "E04": ("REFERENCE ROLES: the attached image p04-caixas-mudanca is the MASTER STYLE reference — match its look exactly, never copy its people or place. "
         "Close-up of the light-wood adult meeting table from the attached scene n3-E02: the closed off-white paperback book lies on the table in front of the mother, toward "
         "the LEFT end of the table, exactly where it is in n3-E02; the mother's clasped hands (mustard-yellow cardigan sleeves) and the father's hands (navy polo sleeves) rest "
         "on the table; only their torsos are visible. " + FUNDO + "No toys on this table." + ST),
}
NOTA = ("Close da mãe sem a estante alta atrás dela — o texto descrevia o fundo pelo mapa (\"só a parede e o quadro\") e não pela imagem n3-E02 real, "
        "onde a estante com caixas e a planta ficam atrás da mãe e o quadro azul atrás do pai.")
if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    ep = [e for e in eps if e["chave"] == "noticia-3"][0]
    for c in ep["cenas"]:
        if c["codigo"] in TXT:
            c["imagem"] = TXT[c["codigo"]]; c["situacao"] = "refazer"
            if c["codigo"] == "E03":
                h = c.setdefault("historico", [])
                if not any(x.get("nota") == NOTA for x in h):
                    h.append({"quando": "2026-10-31T21:45", "tipo": "imagem", "veredito": "rejeitado", "categoria": "lugar", "nota": NOTA})
    r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": "noticia-3", "cenas": ep["cenas"]}).encode(), headers=H, method="POST")))
    print(r["chave"], [(c["codigo"], c["situacao"]) for c in r["cenas"] if c["codigo"] in ("E03", "E04", "E05", "E07", "E28")])
