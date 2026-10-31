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
LAYOUT_ROUPA = ("Wardrobe reference sheet of ONE person. Use the attached sheet {folha} ONLY as the IDENTITY of the person (same face, hair, skin and body — keep "
                "them exactly); the board layout is NEW: a light grey board divided into two columns, one column per OUTFIT, labelled only by a large plain letter A "
                "and B; in each column the SAME person in full body front view and a small close-up of the fabric and shoes. ")
ST_ROUPA = (" STYLE (match the attached p04-caixas-mudanca exactly): cinematic painterly realism that looks almost like a photograph painted in oil, fine canvas "
            "grain, muted warm palette, soft side light. NOT a clean digital illustration, NOT watercolor, NOT cartoon. No readable text: the ONLY letters on the "
            "board are the two large plain column labels A and B; no other letters, words or numbers.")

# ---------- fichas ----------
KIT_NOVOS = [
 ("f01-mae-roupas", "02-personagens", "f01-mae",
  LAYOUT_ROUPA.format(folha="f01-mae") + "Maria in 1980s small-town Brazil, about 30 years old. OUTFIT A (at home and walking in the neighbourhood): the light-blue floral cotton dress with short sleeves "
  "and brown leather sandals (exactly as in f01-mae). OUTFIT B (going to town — doctor, clinic): a plain cream short-sleeve cotton blouse buttoned at the front, "
  "a knee-length brown A-line skirt, a small brown leather handbag on the shoulder and closed brown flat shoes. Same face and hair (low bun) in both columns."),
 ("f06-pai-roupas", "02-personagens", "f06-pai",
  LAYOUT_ROUPA.format(folha="f06-pai") + "Maria's husband in 1980s small-town Brazil, about 33 years old, no grey hair. OUTFIT A (at home): the light-grey short-sleeve "
  "button shirt, dark trousers and worn leather shoes (exactly as in f06-pai). OUTFIT B (going out): a light-blue short-sleeve button shirt tucked into the same "
  "dark trousers, a thin brown belt, polished brown leather shoes."),
 ("f07-jonas-2anos-roupas", "02-personagens", "f07-jonas-2anos",
  LAYOUT_ROUPA.format(folha="f07-jonas-2anos") + "Jonas, exactly 2 years old (about 85 cm, toddler proportions). OUTFIT A (at home): the cream t-shirt and beige shorts, "
  "barefoot (exactly as in f07-jonas-2anos). OUTFIT B (going out): a small light-blue t-shirt with one white horizontal stripe across the chest, navy shorts and "
  "small brown leather sandals."),
 ("f11-pediatra-anos80", "02-personagens", "f06-pai",
  "Character reference sheet of ONE person only, same board LAYOUT as the attached sheet f06-pai (use it ONLY for the layout — NEVER copy that man): a light grey "
  "board; top row: full body front view, three-quarter view, side profile; bottom row: large face close-up, close-up of the HANDS, close-ups of the clothes and "
  "shoes. The small-town pediatrician in 1980s Brazil, about 65 years old: light skin, thin white hair combed back, clean-shaven, thin wire glasses, a white "
  "doctor's coat over a pale-blue short-sleeve shirt, grey trousers, black shoes, kind tired face; hands of a 65-year-old."),
 ("obj-09-livro", "04-objetos", "obj-08-portao",
  LAYOUT_OBJ + "The book exactly as it appears in n3-E02: a small hardback-like book about 14 x 21 cm and 3 cm thick, a plain matte cream/off-white cover with NO "
  "illustration, NO title and NO letters, plain off-white spine, cream pages, slightly worn corners. Show it closed in FRONT/SIDE/BACK/TOP-DOWN and open in the "
  "CLOSE-UP panel."),
 ("obj-12-carrinho-madeira", "04-objetos", "obj-08-portao",
  LAYOUT_OBJ + "The small wooden toy truck exactly as it appears in c02-quintal-A: about 25 cm long, unpainted natural light-brown wood all over, cab included (no "
  "paint, no red), four round wooden wheels on wooden axles, an open cargo bed with low sides, rounded worn edges, no string."),
 ("obj-13-ficha-matricula", "04-objetos", "obj-08-portao",
  LAYOUT_OBJ + "A present-day school enrolment form: one A4 white printed sheet with empty grey lines and small empty boxes in rows (NO readable text, no "
  "letters), a plain blue ballpoint pen beside it; show it flat (TOP-DOWN), slightly curled (SIDE) and a close-up of the empty lines."),
]

# ---------- roupa por cena (anos 80; as cenas de hoje são um dia só = roupa da folha) ----------
ROUPA = {
 "E08": {"f01-mae": "A"}, "E19": {"f01-mae": "A", "f07-jonas-2anos": "A"},
 "E10": {"f01-mae": "B", "f06-pai": "B", "f07-jonas-2anos": "B"}, "E11": {"f01-mae": "B", "f06-pai": "B", "f07-jonas-2anos": "B"},
 "E12": {"f01-mae": "B", "f06-pai": "B", "f07-jonas-2anos": "B"}, "E23": {"f01-mae": "B", "f06-pai": "B", "f07-jonas-2anos": "B"},
 "E16": {"f01-mae": "A", "f07-jonas-2anos": "A"}, "E22": {"f01-mae": "A"},
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
OBJ = {  # cena → ficha de objeto a ANEXAR (só quando o objeto entra novo na cena)
 "E03": ["obj-09-livro"], "E04": ["obj-09-livro"], "E09": ["obj-12-carrinho-madeira"], "E28": ["obj-13-ficha-matricula"],
}
CITA = {  # cena → frase de objeto (sem anexar: o objeto já está na imagem aberta)
 "E02": ["livro"], "E05": ["livro"], "E07": ["livro"], "E24": ["livro"], "E28": ["livro"],
 "E17": ["berco"], "E18": ["berco"], "E19": ["berco"], "E22": ["lamparina"],
}
FRASE_OBJ = {
 "obj-09-livro": "The book is the small plain off-white book from n3-E02 (no illustration, no title), exactly as in obj-09-livro.",
 "livro": "The book stays the small plain off-white book already in the opened image (no illustration, no title).",
 "berco": "The crib is the SAME crib already in c08-quarto-A (weathered grey-brown wood, thin square vertical slats, white sheet) — do not redraw it.",
 "lamparina": "The lamp is the SAME lamp already on the table in n3-E13 (squat brass base, brass burner, tall clear tulip-shaped glass chimney).",
 "obj-12-carrinho-madeira": "The toy truck is exactly the one in obj-12-carrinho-madeira (unpainted light-brown wood all over, no paint, four wooden wheels).",
 "obj-13-ficha-matricula": "The enrolment form is exactly the one in obj-13-ficha-matricula (white sheet with empty lines, no readable text) with its plain blue ballpoint pen.",
}


def anexar(obs, nomes):
    falta = [n for n in nomes if n not in obs]
    if not falta:
        return obs
    if "ANEXAR" in obs:
        return re.sub(r"(ANEXAR )", lambda m: m.group(1) + " + ".join(falta) + " + ", obs, count=1)
    return obs + " · ANEXAR " + " + ".join(falta)


def aplicar(E):
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
                    "obs": f"CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR {EST} + {layout} · salvar em {('Conta A › RC – Notícias 02 › 08-kit-vestuario' if nome.endswith('-roupas') else 'Conta A › Kit de referência › ' + pasta)} como {nome}",
                    "imagem": txt + (ST_ROUPA if nome.endswith("-roupas") else ST)})
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
        for o in sorted(set(OBJ.get(k, []) + CITA.get(k, []))):
            if True:
                if FRASE_OBJ[o] not in c["imagem"]:
                    c["imagem"] = c["imagem"].replace(" PLACE LOCK", " " + FRASE_OBJ[o] + " PLACE LOCK", 1) if " PLACE LOCK" in c["imagem"] else \
                        c["imagem"].replace(" STYLE LOCK", " " + FRASE_OBJ[o] + " STYLE LOCK", 1)
    if "ROUPAS E OBJETOS" not in E["noticia-3"]["notas"]:
        E["noticia-3"]["notas"] = (
            "ROUPAS E OBJETOS (31/10) — roupa por cena (anos 80): A = em casa e a pé no bairro (E08, E13, E14, E16, E19, E22); B = ir à cidade, médico, clínica "
            "(E10, E11, E12, E23). Fichas em 08-kit-vestuario: f01-mae-roupas, f06-pai-roupas, f07-jonas-2anos-roupas. Hoje (sala do AEE) — um dia só, a roupa da folha. "
            "Fichas de objeto novas: obj-09-livro, obj-12-carrinho-madeira, obj-13-ficha-matricula; médico: f11-pediatra-anos80. Berço e lamparina já estão nas "
            "imagens (c08-quarto-A, n3-E13) — sem ficha nova. Fazer as fichas ANTES das cenas.\n") + E["noticia-3"]["notas"]
