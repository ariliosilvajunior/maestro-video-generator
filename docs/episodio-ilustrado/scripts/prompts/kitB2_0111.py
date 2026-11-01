"""01/11/2026 — fichas que faltam no Kit B (revisor-cenas, item 2): pessoas sem folha (R04), roupas (R17), objetos (R16),
e refazer as folhas marcadas prontas que não existem como FOLHA no Drive (K01, K03, K04)."""
import sys, json, re, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U

CAB = ("Character reference sheet of ONE person only, laid out as follows: a light grey board; top row: full body front view, full body three-quarter view, "
       "full body side profile; bottom row: large face close-up, close-up of the HANDS (hands of this person's real age), close-ups of the clothes and shoes. ")
FIM = (" Same face, hair and clothes in every panel, plain neutral grey background, no other people, real-world body proportions. STYLE (match the attached "
       "ref-estilo-p04 exactly): cinematic painterly realism that looks almost like a photograph painted in oil, realistic faces (not cute, not cartoon), fine canvas "
       "grain and crosshatched texture over the whole image, muted warm sepia palette, low golden side light. NOT a clean digital illustration, NOT watercolor, NOT "
       "ink line drawing. No readable text anywhere.")
ROUPA = ("Wardrobe reference sheet of ONE person. Use the attached image {ident} ONLY as the IDENTITY of the person (same face, hair, skin and body — keep them "
         "exactly); the board is NEW: a light grey board divided into two columns labelled only by a large plain letter A and B; in each column the SAME person in "
         "full body front view and a small close-up of the fabric and shoes. ")
FIM_ROUPA = (" STYLE (match the attached ref-estilo-p04 exactly): cinematic painterly realism almost like a photograph painted in oil, fine canvas grain, muted warm "
             "palette. NOT a clean digital illustration, NOT watercolor, NOT cartoon. No readable text: the ONLY letters on the board are the two large plain column "
             "labels A and B.")
OBJ = ("Object reference sheet, laid out as follows: a light grey board; top row of five panels: FRONT, SIDE, BACK, CLOSE-UP, TOP-DOWN (with a plain ruler for "
       "scale); bottom row: four close-ups of the materials and details and one COLOR PALETTE panel with 6 swatches. ONE object only, the same object in every panel. ")
FIM_OBJ = (" STYLE (match the attached ref-estilo-p04 exactly): painterly realism almost like a photograph painted in oil, fine canvas grain, muted warm palette. "
           "NOT cartoon. No readable text, no letters.")
P = "Conta B › Kit de referência › 02-personagens"
NOVAS = [  # (codigo, nome, obs, imagem)
 ("K07", "f05-professora-jovem", f"CRIAR · ANEXAR ref-estilo-p04 · salvar em {P} como f05-professora-jovem",
  CAB + "[ANOS 80] A Brazilian woman teacher of about 30, medium-brown skin, long black hair in a single braid, no grey hair, no deep wrinkles, cream short-sleeved "
  "blouse, dark-grey knee-length skirt, flat black shoes; smooth hands of a 30-year-old." + FIM),
 ("K08", "f06-medico", f"CRIAR · ANEXAR ref-estilo-p04 + n5-S11 (identidade: o médico de jaleco) · salvar em {P} como f06-medico",
  CAB + "[ANOS 80] The doctor in the white coat from the attached n5-S11 — keep exactly his face: a Brazilian man of about 45, short dark hair, no grey, white "
  "coat over a light shirt and dark tie, stethoscope, dark trousers, black shoes; hands of a 45-year-old." + FIM),
 ("K09", "f07-merendeira", f"CRIAR · ANEXAR ref-estilo-p04 · salvar em {P} como f07-merendeira",
  CAB + "[ANOS 80] A Brazilian school cook of about 45, dark skin, short curly black hair under a white headscarf, white apron over a light-green cotton dress, "
  "plastic sandals; working hands of a 45-year-old." + FIM),
 ("K10", "f08-aluna-down", f"CRIAR · ANEXAR ref-estilo-p04 + n5-S06b (identidade: a menina com síndrome de Down) · salvar em {P} como f08-aluna-down",
  CAB + "[ANOS 80] The girl with Down syndrome from the attached n5-S06b — keep exactly her face and hair: about 8 years old, light-blue cotton dress, white socks, "
  "small black shoes; small hands of an 8-year-old." + FIM),
 ("K11", "f09-aluna-cadeira", f"CRIAR · ANEXAR ref-estilo-p04 + n5-S06b (identidade: a menina na cadeira de rodas) · salvar em {P} como f09-aluna-cadeira",
  CAB.replace("full body front view, full body three-quarter view, full body side profile", "front view, three-quarter view and side view, always SITTING in her wheelchair")
  + "[ANOS 80] The girl in the wheelchair from the attached n5-S06b — keep exactly her face: about 9 years old, pink t-shirt, ponytail, sitting in the same simple "
  "metal wheelchair with large spoked wheels, exactly as in n5-S06b." + FIM),
 ("K12", "f10-aluno-muletas", f"CRIAR · ANEXAR ref-estilo-p04 + n5-S06b (identidade: o menino de muletas) · salvar em {P} como f10-aluno-muletas",
  CAB + "[ANOS 80] The boy on crutches from the attached n5-S06b — keep exactly his face: about 9 years old, standing with two wooden underarm crutches, same "
  "clothes as in n5-S06b; hands of a 9-year-old." + FIM),
 ("K13", "f11-aluno-quebra-cabeca", f"CRIAR · ANEXAR ref-estilo-p04 + n5-S06b (identidade: o menino do quebra-cabeça) · salvar em {P} como f11-aluno-quebra-cabeca",
  CAB + "[ANOS 80] The boy doing the wooden puzzle in the attached n5-S06b — keep exactly his face: about 8 years old, light-coloured t-shirt, same clothes as in "
  "n5-S06b; hands of an 8-year-old." + FIM),
 ("K14", "f12-aluno-crise", f"CRIAR · ANEXAR ref-estilo-p04 + n5-S11 (identidade: o aluno em crise) · salvar em {P} como f12-aluno-crise",
  CAB + "[ANOS 80] The student from the attached n5-S11 — keep exactly his face: about 15 years old, brown hair, grey t-shirt, jeans, grey sneakers. He must look "
  "clearly different from f02-adolescente." + FIM),
 ("K15", "f01-educadora-roupas", "CRIAR · ANEXAR ref-estilo-p04 + f01-educadora (identidade) · salvar em Conta B › RC – Notícias 05 › 08-kit-vestuario como f01-educadora-roupas",
  ROUPA.format(ident="f01-educadora") + "The educator, about 50, dark hair with grey streaks in a low bun, round tortoiseshell glasses. OUTFIT A (every day, as in "
  "n5-S06b): faded light-blue chambray shirt with rolled sleeves and a pencil in the chest pocket, olive-grey trousers (always olive-grey, never dark grey), brown "
  "flat shoes. OUTFIT B (festa junina): a simple checked cotton blouse in muted red and a long beige skirt, brown flat shoes." + FIM_ROUPA),
 ("K16", "f02-adolescente-roupas", "CRIAR · ANEXAR ref-estilo-p04 + f02-adolescente (identidade) · salvar em Conta B › RC – Notícias 05 › 08-kit-vestuario como f02-adolescente-roupas",
  ROUPA.format(ident="f02-adolescente") + "The teenage boy, about 15, thin. OUTFIT A (first school day): plain white t-shirt, navy-blue cotton shorts, worn sneakers. "
  "OUTFIT B (festa junina): a plaid cotton shirt, the same navy shorts and a straw hat." + FIM_ROUPA),
 ("K17", "f04-menino-roupas", "CRIAR · ANEXAR ref-estilo-p04 + f04-menino (identidade — a folha NOVA, depois do K02) · salvar em Conta B › RC – Notícias 04 › 08-kit-vestuario como f04-menino-roupas",
  ROUPA.format(ident="f04-menino") + "The boy, exactly 3 years old, very thin, cerebral palsy — always SITTING propped by cushions, never standing. OUTFIT A (old room): "
  "mustard-yellow t-shirt, beige shorts, barefoot. OUTFIT B (hospital): a plain white hospital gown, barefoot." + FIM_ROUPA),
 ("O01", "obj-14-cadeira-de-rodas", "CRIAR · ANEXAR ref-estilo-p04 + n5-S06b · salvar em Conta B › Kit de referência › 04-objetos como obj-14-cadeira-de-rodas",
  OBJ + "The same simple 1980s metal child wheelchair with large spoked wheels, grey vinyl seat and backrest and small front casters seen in the attached n5-S06b." + FIM_OBJ),
 ("O02", "obj-15-blocos-madeira", "CRIAR · ANEXAR ref-estilo-p04 + n5-S06b · salvar em Conta B › Kit de referência › 04-objetos como obj-15-blocos-madeira",
  OBJ + "A set of small painted wooden cubes in red, yellow, blue and green, about 4 cm each, slightly worn edges, exactly as in the attached n5-S06b." + FIM_OBJ),
]
REFAZ = {
 "K01": ("CRIAR · ANEXAR ref-estilo-p04 + f01-educadora (identidade: a imagem atual) · apagar a atual e salvar como f01-educadora (folha de verdade)",
  CAB + "[ANOS 80] The educator from the attached f01-educadora — keep exactly her face: about 50 years old, light-brown skin, dark hair with grey streaks in a low "
  "bun, round tortoiseshell glasses, faded light-blue chambray shirt with rolled sleeves and a pencil in the chest pocket, olive-grey trousers, brown flat shoes; "
  "hands of a 50-year-old woman (not elderly)." + FIM),
 "K03": ("CRIAR · ANEXAR ref-estilo-p04 + f02-adolescente (identidade: a imagem atual) · apagar a atual e salvar como f02-adolescente (folha de verdade)",
  CAB + "[ANOS 80] The teenage boy from the attached f02-adolescente — keep exactly his face: about 15 years old, thin, plain white t-shirt, navy-blue cotton "
  "shorts, worn sneakers; hands of a 15-year-old." + FIM),
 "K04": ("CRIAR · ANEXAR ref-estilo-p04 · salvar em Conta B › Kit de referência › 02-personagens como f03-mae-adolescente",
  CAB + "[ANOS 80] The teenage boy's mother, a Brazilian woman of about 42, medium-brown skin, black hair in a low ponytail, plain dark-red cotton dress, beige "
  "cardigan, flat brown shoes; hands of a 42-year-old. She must look clearly different from the 1980s mother of the pilot (no floral blue dress, no bun)." + FIM),
}
if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    E = {e["chave"]: e for e in eps}
    kit = E["kit-tutor"]["cenas"]
    tem = {c["descricao"] for c in kit}
    for c in kit:
        if c["codigo"] in REFAZ:
            c["obs"], c["imagem"] = REFAZ[c["codigo"]]
            c["situacao"] = "refazer"
    for cod, nome, obs, img in NOVAS:
        if nome not in tem:
            kit.append({"codigo": cod, "descricao": nome, "situacao": "falta", "obs": obs, "imagem": img})
    if "--dry" in sys.argv:
        json.dump({"kit-tutor": E["kit-tutor"]}, open(__import__('os').path.dirname(__file__) + "/../kitB2_dry.json", "w"), ensure_ascii=False, indent=1)
        print("rascunho"); sys.exit(0)
    r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": "kit-tutor", "cenas": kit}).encode(), headers=H, method="POST")))
    print("gravado", [(c["codigo"], c["descricao"], c["situacao"]) for c in r["cenas"]])
