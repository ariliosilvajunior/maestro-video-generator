"""31/10/2026 — n3 completa: fichas (roupa/objeto/médico) + 2ª revisão + câmera/cor + correções da 3ª revisão.
Uso: python3 n3_tudo.py --dry  (rascunho em n3fix/dry_tudo.json)  |  python3 n3_tudo.py --gravar (só depois do APROVADO)."""
import sys, json, re, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U
import n3_fichas, n3_revisao2, n3_camera, n3_revisao3

PL_DIA = "Daylight enters ONLY through the right window."
PL_DIA_PORTA = "Daylight enters through the right window and, in this scene, also through the half-open back door on the left wall."


def corrigir_frases(c):
    k, im = c["codigo"], c["imagem"]
    if k == "E10":
        im = re.sub(r"with (Jonas from f07-jonas-2anos:[^;]*?) on her lap", r"holding Jonas on her lap — \1", im, count=1)
    if k == "E12":
        im = re.sub(r"holds (Jonas from f07-jonas-2anos:[^.]*?) on his lap", r"holds Jonas on his lap — \1", im, count=1)
    if k == "E19":
        im = re.sub(r"hugging (Jonas from f07-jonas-2anos:.*?barefoot) tightly,", r"hugging Jonas tightly — \1 —", im, count=1)
    if k in ("E08", "E09"):
        im = im.replace(PL_DIA, PL_DIA_PORTA)
    if k in ("E22",):  # cena de noite na sala
        im = im.replace(PL_DIA, "It is night: no daylight; the only light is the kerosene lamp on the table.")
    if k == "E28":
        im = im.replace("and a pencil on the table in front of the mother", "and a plain blue ballpoint pen on the table in front of the mother")
    c["imagem"] = im
    if k == "E10" and "f11-pediatra-anos80" not in c["obs"]:
        c["obs"] = c["obs"].replace("ANEXAR ", "ANEXAR f11-pediatra-anos80 + ", 1)
        c["imagem"] = c["imagem"].replace("Add the old doctor (a Brazilian man of about 65, white hair, white coat)",
                                          "Add the old doctor from f11-pediatra-anos80 (about 65, thin white hair, wire glasses, white coat)")
    if k in ("E11", "E23"):  # abrem E10/E12, que já trazem as roupas: só o estilo anexado, o texto mantém OUTFITS
        c["obs"] = re.sub(r"ANEXAR .*$", "ANEXAR p04-caixas-mudanca", c["obs"])


if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    E = {e["chave"]: e for e in eps}
    import copy
    aprovadas = {c["codigo"]: copy.deepcopy(c) for c in E["noticia-3"]["cenas"] if c.get("situacao") not in ("refazer", "falta")}
    n3_fichas.aplicar(E)
    falhas = n3_revisao2.aplicar(E["noticia-3"])
    for c in E["noticia-3"]["cenas"]:
        corrigir_frases(c)
    feitos = n3_camera.aplicar(E["noticia-3"])
    # cena que o dono já aprovou não muda (o que mudou só vale para o que ainda vai ser gerado)
    E["noticia-3"]["cenas"] = [aprovadas.get(c["codigo"], c) for c in E["noticia-3"]["cenas"]]
    # 3ª revisão: inclui as aprovadas que o especialista mostrou que melhoram (E03, E04; animação E29) — dono autorizou
    print("revisao3 falhas:", n3_revisao3.aplicar(E))
    print("revisao4 falhas:", n3_revisao3.aplicar4(E))
    print("revisao2 falhas:", falhas, "| câmera em:", feitos)
    if "--gravar" not in sys.argv:
        json.dump({k: E[k] for k in ("kit-piloto", "noticia-3")}, open(__import__('os').path.dirname(__file__) + "/../n3fix/dry_tudo.json", "w"), ensure_ascii=False, indent=1)
        print("rascunho salvo (nada gravado)"); sys.exit(0)
    for k in ("kit-piloto", "noticia-3"):
        body = {"chave": k, "cenas": E[k]["cenas"]}
        if k == "noticia-3":
            body["notas"] = E[k]["notas"]
        r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps(body).encode(), headers=H, method="POST")))
        print("gravado", k, r["cenas_total"])
