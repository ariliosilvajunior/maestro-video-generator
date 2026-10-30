"""Revisão de 30/10/2026 (dono): idade/roupa coerentes, época coerente (pais de hoje na
sala do AEE de hoje), lugares repetidos com plano fixo. Só mexe nos textos citados."""
import sys, json, re, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U
import lugares
from kits import per

def get(): return json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
def post(k, cenas): return json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": k, "cenas": cenas}).encode(), headers=H, method="POST")))

eps = get(); json.dump(eps, open(__import__('os').path.dirname(__file__) + "/../eps_antes_revisao.json", "w"), ensure_ascii=False)
E = {e["chave"]: e for e in eps}
def cena(k, cod): return next(c for c in E[k]["cenas"] if c["codigo"] == cod)

# 1) Kit A: Jonas 2 anos com roupa de criança pequena; pais de HOJE para a sala do AEE
k = cena("kit-piloto", "K02")
k["imagem"] = per("The attached image f02-jonas is the IDENTITY reference: this must be clearly the SAME boy, only at 2 years old, as if it were his baby photo. "
 "Keep from f02-jonas ONLY the body features: the same face (same eye shape and dark-brown eyes, same eyebrows, same nose and mouth), the same light-tan skin tone, the same dark-brown hair colour, "
 "the small light mark under the outer corner of his eye on the right side of the image. Do NOT keep his clothes: a 2-year-old wears toddler clothes — a small plain faded pale-yellow cotton t-shirt, "
 "a white cloth diaper under small light-brown cotton shorts, barefoot. Change the age: a 2-year-old toddler, about 85 cm tall, round baby cheeks, short soft messy hair, toddler body proportions (big head, short legs). "
 "Do not make him older or a different child.")
k["obs"] = "CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR p04-caixas-mudanca + f02-jonas · salvar como f07-jonas-2anos (renomear a antiga para f07-jonas-2anos-antiga)"
k["situacao"] = "refazer"
k["problema"] = "Menino de 2 anos estava com a mesma roupa do Jonas de 6/9 anos — roupa não cresce com a criança. Corrigido no texto em 30/10."
kitA = E["kit-piloto"]["cenas"]
if not any(c["descricao"] == "f08-mae-hoje" for c in kitA):
    kitA.insert(3, {"codigo": "K04", "descricao": "f08-mae-hoje", "situacao": "falta",
        "obs": "CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR p04-caixas-mudanca + f01-mae · salvar como f08-mae-hoje",
        "imagem": per("A present-day Brazilian mother of about 35 (2020s), NOT the 1980s mother of the attached sheet f01-mae (use that sheet ONLY for the layout): medium brown skin, dark straight hair in a ponytail, "
                      "plain grey t-shirt, dark jeans, white sneakers, small shoulder bag, a tired but hopeful face. Clean modern clothes in good condition.")})
    kitA.insert(4, {"codigo": "K05", "descricao": "f09-pai-hoje", "situacao": "falta",
        "obs": "CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR p04-caixas-mudanca + f01-mae · salvar como f09-pai-hoje",
        "imagem": per("A present-day Brazilian father of about 38 (2020s), the husband of f08-mae-hoje — NOT anyone from the attached sheet f01-mae (use it ONLY for the layout): light brown skin, short black hair, "
                      "short trimmed beard, plain navy polo shirt, khaki trousers, dark shoes, quiet worried face. Clean modern clothes in good condition.")})

# 2) Notícia 3: pais de hoje na sala do AEE de hoje; Jonas pequeno sempre com a f07
def troca_pais(c):
    c["obs"] = c["obs"].replace("Mãe + f06-pai", "f08-mae-hoje + f09-pai-hoje")
    c["imagem"] = c["imagem"].replace("the mother and the father from the character references",
        "the present-day mother f08-mae-hoje and father f09-pai-hoje from the attached references (a couple of TODAY, not the 1980s family)")
    c["imagem"] = c["imagem"].replace("The mother and the father (same as character references)",
        "The present-day mother f08-mae-hoje and father f09-pai-hoje (a couple of TODAY)")
for cod in ("E02", "E21"):
    troca_pais(cena("noticia-3", cod))
cena("noticia-3", "E21")["obs"] = "ABRIR n3-E20 · ANEXAR f08-mae-hoje + f09-pai-hoje + p04-caixas-mudanca"
for cod, extra in (("E10", " + f07-jonas-2anos"), ("E14", " + f07-jonas-2anos"), ("E19", " + f07-jonas-2anos")):
    c = cena("noticia-3", cod)
    if "f07-jonas-2anos" not in c["obs"]:
        c["obs"] = c["obs"].replace(" + p04-caixas-mudanca", extra + " + p04-caixas-mudanca") if "ANEXAR" in c["obs"] else c["obs"] + " · ANEXAR f07-jonas-2anos"
for cod in ("E14", "E19"):
    c = cena("noticia-3", cod)
    c["imagem"] = c["imagem"].replace("the toddler sitting on his mother's lap", "the 2-year-old toddler from f07-jonas-2anos sitting on his mother's lap").replace("holding the toddler (f07)", "holding the 2-year-old toddler from f07-jonas-2anos")
c = cena("noticia-3", "E12"); c["obs"] = "ABRIR c07-corredor-clinica-A · ANEXAR Mãe + f06-pai + f07-jonas-2anos + p04-caixas-mudanca"
c["imagem"] = c["imagem"].replace("A long, plain corridor of a small 1980s clinic with wooden benches along a pale green wall: the same mother and father", "In the clinic corridor (opened image): the 1980s mother and father from the references")

# 3) Notícia 4: a pracinha é um lugar próprio (não a rua)
c = cena("noticia-4", "E18"); c["obs"] = "ABRIR c06-pracinha-A · ANEXAR Mãe + f06-pai + p04-caixas-mudanca"

# 4) Notícia 8: corredor e sala da equipe são lugares próprios (não a sala de aula)
c = cena("noticia-8", "E17"); c["obs"] = "ABRIR c05-corredor-escola-A · ANEXAR ref-estilo-p04"
c = cena("noticia-8", "E20"); c["obs"] = "ABRIR c06-sala-equipe-A · ANEXAR f01-educadora + ref-estilo-p04"
for cod in ("E17", "E20"):
    c = cena("noticia-8", cod); c["imagem"] = re.sub(r"OPENED IMAGE = the fixed place c03-sala-nova-A: [^.]*\. ", "", c["imagem"])

# 5) Notícia 2: a cena usava a FOLHA (4 quadros) em vez do plano
c = cena("noticia-2", "E26"); c["obs"] = "USAR a imagem c04-sala-aee-A (sem gerar nada)"
# 6) Notícia 7: o palco vira lugar fixo
c = cena("noticia-7", "E03"); c["obs"] = "ABRIR c06-palco-escola-A · ANEXAR f02-aluno + ref-estilo-p04"

mud = {e["chave"]: e for e in lugares.revisar(list(E.values()))}
mud["kit-piloto"] = E["kit-piloto"]
for k, e in mud.items():
    r = post(k, e["cenas"])
    cs = r["cenas"]
    print(k, "marcadas", sum(c["situacao"] != "falta" for c in cs), "lugar", sum("PLACE LOCK" in (c.get("imagem") or "") for c in cs), "anot", sum(bool(c.get("problema")) for c in cs))
