"""31/10/2026 — fichas de ROUPA (por personagem que aparece em dias diferentes) e de OBJETO (o que se repete)
para a Notícias 02 (Conta A), e amarração de cada cena à roupa e aos objetos. Dono: "porque vc não está mais
fazendo as fichas dos objetos, roupas, estilo… parece que os personagens nunca trocam de roupa"."""
import sys, json, re, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U

EST = "p04-caixas-mudanca"
ST = (f" STYLE (match the attached {EST} exactly): cinematic painterly realism that looks almost like a photograph painted in oil, fine canvas grain and "
      "crosshatched texture, muted warm palette, soft side light. NOT a clean digital illustration, NOT watercolor, NOT cartoon. No readable text, no letters, "
      "no numbers except the plain ruler marks.")
LAYOUT_OBJ = ("Object reference sheet, same board LAYOUT as the attached sheet obj-08-portao (use it ONLY for the layout — NEVER copy the gate): a light grey board; "
              "top row of five panels: FRONT, SIDE, BACK, CLOSE-UP, TOP-DOWN (with a plain ruler for scale); bottom row: four close-ups of the materials and details and "
              "one COLOR PALETTE panel with 6 swatches; a thin caption strip with no readable text. ONE object only, the same object in every panel, plain background. ")
LAYOUT_ROUPA = ("Wardrobe reference sheet of ONE person, same board LAYOUT as the attached sheet {folha} (use it ONLY as the IDENTITY of the person: same face, hair, "
                "skin and body — keep them exactly): a light grey board divided into columns, one column per OUTFIT, each column labelled only by a large plain "
                "letter A, B (no other text); in each column the SAME person in full body front view and a small close-up of the fabric and shoes. ")

# ---------- fichas ----------
KIT_NOVOS = [
 ("f01-mae-roupas", "02-personagens", "f01-mae",
  LAYOUT_ROUPA.format(folha="f01-mae") + "Maria in 1980s small-town Brazil, about 30 years old. OUTFIT A (at home): the light-blue floral cotton dress with short sleeves "
  "and brown leather sandals (exactly as in f01-mae). OUTFIT B (going out — doctor, clinic, street): a plain cream short-sleeve cotton blouse buttoned at the front, "
  "a knee-length brown A-line skirt, a small brown leather handbag on the shoulder and closed brown flat shoes. Same face and hair (low bun) in both columns."),
 ("f06-pai-roupas", "02-personagens", "f06-pai",
  LAYOUT_ROUPA.format(folha="f06-pai") + "Maria's husband in 1980s small-town Brazil, about 33 years old, no grey hair. OUTFIT A (at home): the light-grey short-sleeve "
  "button shirt, dark trousers and worn leather shoes (exactly as in f06-pai). OUTFIT B (going out): a light-blue short-sleeve button shirt tucked into the same "
  "dark trousers, a thin brown belt, polished brown leather shoes."),
 ("f07-jonas-2anos-roupas", "02-personagens", "f07-jonas-2anos",
  LAYOUT_ROUPA.format(folha="f07-jonas-2anos") + "Jonas, exactly 2 years old (about 85 cm, toddler proportions). OUTFIT A (at home): the cream t-shirt and beige shorts, "
  "barefoot (exactly as in f07-jonas-2anos). OUTFIT B (going out): a small light-blue t-shirt with one white horizontal stripe across the chest, navy shorts and "
  "small brown leather sandals."),
 ("obj-09-livro", "04-objetos", "obj-08-portao",
  LAYOUT_OBJ + "The book from the episode: a small modern paperback book about 14 x 21 cm and 2 cm thick, matte off-white cover with a soft pale illustration of "
  "two simple figures holding hands (no readable title, no letters), cream pages, slightly worn corners. Show it closed in FRONT/SIDE/BACK/TOP-DOWN and open "
  "in the CLOSE-UP panel."),
 ("obj-10-berco", "04-objetos", "obj-08-portao",
  LAYOUT_OBJ + "An old 1980s Brazilian wooden baby crib about 120 x 65 cm and 95 cm high: dark varnished wood with worn edges, vertical round bars on all four "
  "sides, a thin mattress with a white cotton sheet and a small white pillow, no wheels, no toys, no canopy."),
 ("obj-11-lamparina", "04-objetos", "obj-08-portao",
  LAYOUT_OBJ + "A 1980s glass kerosene table lamp about 30 cm high: round clear glass base half full of kerosene, brass burner with a small round knob, tall clear "
  "glass chimney slightly sooty at the top; show it unlit and, in the CLOSE-UP, lit with a small warm flame."),
 ("obj-12-carrinho-madeira", "04-objetos", "obj-08-portao",
  LAYOUT_OBJ + "A small handmade wooden toy truck about 25 cm long: unpainted light wood with a faded red cab, four round wooden wheels on wooden axles, an open "
  "cargo bed, rounded worn edges, a short string tied to the front."),
 ("obj-13-ficha-matricula", "04-objetos", "obj-08-portao",
  LAYOUT_OBJ + "A present-day school enrolment form: one A4 white printed sheet with empty grey lines and small empty boxes in rows (NO readable text, no "
  "letters), a plain blue ballpoint pen beside it; show it flat (TOP-DOWN), slightly curled (SIDE) and a close-up of the empty lines."),
]

# ---------- roupa por cena (anos 80; as cenas de hoje são um dia só = roupa da folha) ----------
ROUPA = {
 "E08": {"f01-mae": "A"}, "E19": {"f01-mae": "A", "f07-jonas-2anos": "A"},
 "E10": {"f01-mae": "B", "f06-pai": "B", "f07-jonas-2anos": "B"}, "E11": {"f01-mae": "B", "f06-pai": "B", "f07-jonas-2anos": "B"},
 "E12": {"f01-mae": "B", "f06-pai": "B", "f07-jonas-2anos": "B"}, "E23": {"f01-mae": "B", "f06-pai": "B", "f07-jonas-2anos": "B"},
 "E16": {"f01-mae": "B", "f07-jonas-2anos": "B"}, "E22": {"f01-mae": "A"},
}
DESC_ROUPA = {
 ("f01-mae", "A"): "the light-blue floral cotton dress and brown leather sandals",
 ("f01-mae", "B"): "a plain cream short-sleeve blouse, a knee-length brown skirt, a small brown shoulder handbag and closed brown flat shoes",
 ("f06-pai", "B"): "a light-blue short-sleeve button shirt tucked into dark trousers with a thin brown belt",
 ("f07-jonas-2anos", "A"): "the cream t-shirt and beige shorts, barefoot",
 ("f07-jonas-2anos", "B"): "a small light-blue t-shirt with one white stripe, navy shorts and small brown sandals",
}
TROCA_ROUPA = {  # frase da roupa da folha (no texto atual) → roupa da cena
 "f01-mae": "light-blue floral cotton dress, brown leather sandals",
 "f06-pai": "light-grey short-sleeve button shirt, dark trousers",
 "f07-jonas-2anos": "cream t-shirt, beige shorts, barefoot",
}
OBJ = {  # cena → objetos que ela mostra
 "E02": ["obj-09-livro"], "E03": ["obj-09-livro"], "E04": ["obj-09-livro"], "E05": ["obj-09-livro"], "E07": ["obj-09-livro"],
 "E24": ["obj-09-livro"], "E28": ["obj-09-livro", "obj-13-ficha-matricula"],
 "E09": ["obj-12-carrinho-madeira"], "E17": ["obj-10-berco"], "E18": ["obj-10-berco"], "E19": ["obj-10-berco"], "E22": ["obj-11-lamparina"],
}
FRASE_OBJ = {
 "obj-09-livro": "The book is exactly the one in obj-09-livro (small off-white paperback, soft pale illustration, no readable title).",
 "obj-10-berco": "The crib is exactly the one in obj-10-berco (dark varnished wood, round vertical bars, white sheet).",
 "obj-11-lamparina": "The lamp is exactly the one in obj-11-lamparina (glass kerosene lamp with brass burner and tall clear chimney).",
 "obj-12-carrinho-madeira": "The toy truck is exactly the one in obj-12-carrinho-madeira (light wood, faded red cab, four wooden wheels).",
 "obj-13-ficha-matricula": "The enrolment form is exactly the one in obj-13-ficha-matricula (white sheet with empty lines, no readable text) with its blue pen.",
}


def anexar(obs, nomes):
    falta = [n for n in nomes if n not in obs]
    if not falta:
        return obs
    if "ANEXAR" in obs:
        return re.sub(r"(ANEXAR )", lambda m: m.group(1) + " + ".join(falta) + " + ", obs, count=1)
    return obs + " · ANEXAR " + " + ".join(falta)


if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    E = {e["chave"]: e for e in eps}
    kit = E["kit-piloto"]["cenas"]
    existentes = {c["descricao"] for c in kit}
    nk = 1 + max(int(c["codigo"][1:]) for c in kit if re.match(r"K\d+$", c["codigo"]))
    no = 1 + max([int(c["codigo"][1:]) for c in kit if re.match(r"O\d+$", c["codigo"])] or [0])
    for nome, pasta, layout, txt in KIT_NOVOS:
        if nome in existentes:
            continue
        if nome.startswith("obj"):
            cod = f"O{no:02d}"; no += 1
        else:
            cod = f"K{nk:02d}"; nk += 1
        kit.append({"codigo": cod, "descricao": nome, "situacao": "falta",
                    "obs": f"CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR {EST} + {layout} · salvar em Conta A › Kit de referência › {pasta} como {nome}",
                    "imagem": txt + ST})
    for c in E["noticia-3"]["cenas"]:
        k = c["codigo"]
        if k in ROUPA:
            folhas = []
            for f, letra in ROUPA[k].items():
                folhas.append(f + "-roupas")
                if (f, letra) in DESC_ROUPA and TROCA_ROUPA[f] in c["imagem"]:
                    c["imagem"] = c["imagem"].replace(TROCA_ROUPA[f], DESC_ROUPA[(f, letra)], 1)
            marca = "OUTFITS (from the attached wardrobe sheets): " + "; ".join(f"{f} wears OUTFIT {l} — {DESC_ROUPA.get((f, l), 'as in the sheet')}"
                                                                              for f, l in ROUPA[k].items()) + ". "
            if "OUTFITS (from" not in c["imagem"]:
                c["imagem"] = c["imagem"].replace(" PLACE LOCK", " " + marca + "PLACE LOCK", 1) if " PLACE LOCK" in c["imagem"] else \
                    c["imagem"].replace(" STYLE LOCK", " " + marca + "STYLE LOCK", 1)
            c["obs"] = anexar(c["obs"], folhas)
            for f in ROUPA[k]:  # a ficha de roupas já tem o rosto da pessoa: substitui a folha base no ANEXAR
                c["obs"] = re.sub(r" \+ " + re.escape(f) + r"(?: \[[^\]]*\])?(?=[ ·]|$)", "", c["obs"])
        if k in OBJ:
            c["obs"] = anexar(c["obs"], OBJ[k])
            for o in OBJ[k]:
                if FRASE_OBJ[o] not in c["imagem"]:
                    c["imagem"] = c["imagem"].replace(" PLACE LOCK", " " + FRASE_OBJ[o] + " PLACE LOCK", 1) if " PLACE LOCK" in c["imagem"] else \
                        c["imagem"].replace(" STYLE LOCK", " " + FRASE_OBJ[o] + " STYLE LOCK", 1)
    if "ROUPAS E OBJETOS" not in E["noticia-3"]["notas"]:
        E["noticia-3"]["notas"] = ("ROUPAS E OBJETOS (31/10): anos 80 — roupa A = em casa, roupa B = sair (médico, clínica, rua); fichas f01-mae-roupas, "
                                   "f06-pai-roupas, f07-jonas-2anos-roupas. Hoje — um dia só, a roupa da folha. Objetos que se repetem: obj-09-livro, obj-10-berco, "
                                   "obj-11-lamparina, obj-12-carrinho-madeira, obj-13-ficha-matricula. Fazer essas fichas ANTES das cenas.\n") + E["noticia-3"]["notas"]
    if "--dry" in sys.argv:
        json.dump({k: E[k] for k in ("kit-piloto", "noticia-3")}, open(__import__('os').path.dirname(__file__) + "/../n3fix/dry_fichas.json", "w"), ensure_ascii=False, indent=1)
        sys.exit(0)
    for k in ("kit-piloto", "noticia-3"):
        body = {"chave": k, "cenas": E[k]["cenas"]}
        if k == "noticia-3":
            body["notas"] = E[k]["notas"]
        r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps(body).encode(), headers=H, method="POST")))
        print(k, r["cenas_total"])
