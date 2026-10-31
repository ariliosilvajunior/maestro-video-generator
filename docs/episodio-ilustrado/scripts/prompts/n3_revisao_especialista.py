"""31/10/2026 — correções do especialista revisor-cenas na n3 (E03 E04 E05 E07 E24 E25 E27 E28 + c04-sala-aee-A)."""
import sys, json, re, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U
ST = (" STYLE LOCK (match p04-caixas-mudanca exactly): cinematic painterly realism almost like a photograph painted in oil, realistic adult faces and hands with five fingers, "
      "fine canvas grain and crosshatched texture over the whole image, low golden side light. NOT a clean digital illustration, NOT a cartoon, NOT watercolor, NOT ink line drawing. "
      "No readable text. Lower right corner kept quiet.")
REF = "REFERENCE ROLES: the attached image p04-caixas-mudanca is the MASTER STYLE reference — match its look exactly, never copy its people or place. "
MAE = ("the present-day mother from f08-mae-hoje: about 38, warm brown skin, short curly dark hair to the chin, small gold earrings, mustard-yellow cardigan over a white t-shirt, "
       "smooth hands of a 38-year-old")
PAIS = ("The mother is f08-mae-hoje (about 38, mustard-yellow cardigan over a white t-shirt, smooth hands); the father is f09-pai-hoje (about 40, navy polo). "
        "The book is the small plain off-white paperback from n3-E02. ")
PROF = "The teacher is f05-professor-aee (about 38, glasses, short beard, blue-grey polo with a lanyard); all three sit on the dark-grey adult chairs. "
LIVRO = ("the closed off-white paperback book lies flat just to the camera-LEFT of the mother's clasped hands, near the left end of the table, its long side parallel "
         "to the table edge, exactly where it is in n3-E02")
JANELA_V = "one large window with a white roller blind"
JANELA_N = "one large wide window with TWO white roller blinds side by side, half lowered"
IMG = {
 "E03": REF + f"Medium close-up, at adult eye level, of {MAE}, sitting on a dark-grey upholstered adult chair at the light-wood adult meeting table from the attached scene "
        "n3-E02, looking down at her clasped hands, silent, eyes heavy. " + LIVRO.replace("the closed", "The closed", 1) + ". "
        "BACKGROUND EXACTLY AS IN n3-E02 (same room, same straight-on camera direction, only closer): directly behind the mother stands the TALL light-wood shelf full of "
        "transparent plastic boxes of coloured materials; the trailing green plant hangs from the camera-right end of the shelf top, just above her head on the side toward "
        "the father (above her LEFT shoulder, camera-right); to the camera-right of the shelf, behind the father's place, the big blue felt board with cream cards; the "
        "off-white wall between them. Soft daylight comes from the camera-LEFT (the window is on the left wall, out of frame). The father is out of frame on the camera-right." + ST,
 "E04": REF + "Close-up of the light-wood adult meeting table from the attached scene n3-E02, at the height of the parents' torsos: the mother's clasped hands "
        "(f08-mae-hoje, about 38 years old: smooth hands, mustard-yellow cardigan sleeves) and the father's hands (f09-pai-hoje, about 40 years old, navy polo sleeves) — hands "
        f"of their real age, NOT old — rest on the table; {LIVRO}. On the table there are only the closed book and the parents' hands; the bare light-wood tabletop fills the "
        "rest of the foreground. BACKGROUND EXACTLY AS IN n3-E02 at torso height: behind the mother, the lower shelves of the tall light-wood shelf with transparent plastic "
        "boxes of coloured materials; behind the father, the off-white wall with the bottom edge of the blue felt board at his shoulder height. The frame ends just past the "
        "father's right elbow, so the children's corner on the right is out of frame. Soft daylight from the camera-LEFT." + ST,
}
ANTES = {  # trocas dentro do texto que já existe
 "E05": [("Change only:", "Change only:" + " " + PAIS[:-1] + " Change only:")],
}
OBS_DEPOIS = {"E05": "n3-E04", "E07": "n3-E05", "E28": "n3-E04", "E25": "n3-E24", "E27": "n3-E24"}
if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    E = {e["chave"]: e for e in eps}
    for c in E["noticia-3"]["cenas"]:
        k = c["codigo"]
        if k in IMG:
            c["imagem"] = IMG[k]
        if k in ("E05", "E07", "E28", "E25", "E27") and "f08-mae-hoje (about 38" not in c["imagem"]:
            extra = PAIS + (PROF if k in ("E25", "E27") else "")
            c["imagem"] = re.sub(r"Change only:", extra + "Change only:", c["imagem"], count=1)
        if k in OBS_DEPOIS and "SOMENTE depois" not in c["obs"]:
            alvo = OBS_DEPOIS[k]
            c["obs"] = c["obs"].replace(f"ABRIR {alvo}", f"ABRIR {alvo} (SOMENTE depois que a nova {alvo} for aprovada e salva por cima da antiga, mesmo nome)", 1)
        if k == "E24" and "nobody is hidden behind him" not in c["imagem"]:
            c["imagem"] = c["imagem"].replace("a notebook on the table.",
                "a small dark notebook on the table in front of him. He sits on that chair turned slightly toward the camera-left corner of the table, seen from behind in "
                "three-quarter view, his head lower in the frame than the parents' faces; the mother's and the father's faces, shoulders and hands stay fully visible above the "
                "table, nobody is hidden behind him. The closed off-white book stays exactly where it is in n3-E02, at the left end of the table, near the mother.", 1)
            assert "nobody is hidden behind him" in c["imagem"], "E24: frase âncora não achada"
        c["imagem"] = c["imagem"].replace(JANELA_V, JANELA_N)
    for c in E["kit-piloto"]["cenas"]:
        if c["descricao"] == "c04-sala-aee-A":
            c["imagem"] = c["imagem"].replace("seen from the doorway corner looking across the meeting table to the felt board",
                                              "seen straight on from the front of the room, facing the back wall").replace(JANELA_V, JANELA_N)
        if c["descricao"] == "f09-pai-hoje":
            c["imagem"] = c["imagem"].replace("about 38", "about 40")
    for k in ("noticia-3", "kit-piloto"):
        r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": k, "cenas": E[k]["cenas"]}).encode(), headers=H, method="POST")))
        print(k, "ok", r["cenas_total"])
