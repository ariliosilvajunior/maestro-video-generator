"""01/11/2026 — dono: "nunca mandar comando como este... ref-layout-personagem... e sim o nome da imagem".
Tira os apelidos de layout (não existem no Drive), troca ref-escola-nova-p29 pelo arquivo real p29-portao-escola
e não anexa a folha antiga e errada do f04-menino no refazer dele."""
import sys, json, re, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U
TROCAS = [
 ("same board LAYOUT as the attached ref-layout-personagem (use it ONLY for the layout — NEVER copy the woman, her face, dress or sandals):", "laid out as follows:"),
 ("same board LAYOUT as the attached ref-layout-cenario (use it ONLY for the layout — NEVER copy that house, its rooms or furniture):", "laid out as follows:"),
 (" + ref-layout-personagem", ""), (" + ref-layout-cenario", ""),
 ("ref-escola-nova-p29", "p29-portao-escola"),
]
if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    mud = set()
    for e in eps:
        for c in e["cenas"]:
            for campo in ("obs", "imagem", "animacao"):
                v = c.get(campo) or ""
                for a, b in TROCAS:
                    v = v.replace(a, b)
                if v != (c.get(campo) or ""):
                    c[campo] = v; mud.add(e["chave"])
            if e["chave"] == "kit-tutor" and c["codigo"] == "K02":
                c["obs"] = c["obs"].replace(" + f04-menino", "")
                c["imagem"] = c["imagem"].replace("The attached image f04-menino is the identity reference: exactly this same person, same face, hair and clothes. ", "")
                mud.add("kit-tutor")
    resto = [(e["chave"], c["codigo"]) for e in eps for c in e["cenas"] if re.search(r"ref-layout|ref-escola-nova", json.dumps(c, ensure_ascii=False))]
    assert not resto, resto
    for e in eps:
        if e["chave"] in mud:
            r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": e["chave"], "cenas": e["cenas"]}).encode(), headers=H, method="POST")))
            print("gravado", r["chave"])
