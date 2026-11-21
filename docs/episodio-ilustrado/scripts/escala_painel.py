"""Ferramenta do agente revisor-escala (19/11/2026). Lê/grava no Painel sem risco.

  listar  <chave>                       -> cenas com imagem no Drive (codigo, nome, situacao, ids)
  baixar  <chave> <codigo> <pasta_saida>-> baixa a imagem (e o vídeo, se houver) da cena
  reprovar <chave> <codigo> <tipo imagem|video> "<nota>"  -> marca a cena para refazer com a nota

Token: variável CONTENT_FACTORY_API_TOKEN (nunca imprimir).
"""
import json, os, re, sys, urllib.request

P = "https://painel.recursoscognitivos.com.br"
T = os.environ.get("CONTENT_FACTORY_API_TOKEN", "")
H = {"Authorization": "Bearer " + T, "Content-Type": "application/json"}
U = P + "/producao-videos/automacao"


def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=60))


def episodio(chave):
    return next(e for e in get(U) if e["chave"] == chave)


def arquivos(chave):
    conta = next(c for c in get(P + "/producao-videos/contas/automacao") for e in c["episodios"] if e["chave"] == chave)
    info = next(e for e in conta["episodios"] if e["chave"] == chave)
    pasta = info["pasta_id"]
    saida = []
    for it in get(P + f"/producao-videos/drive/pasta/{pasta}"):
        if it.get("tipo") == "application/vnd.google-apps.folder":
            saida += get(P + f"/producao-videos/drive/pasta/{it['id']}")
        else:
            saida.append(it)
    return info.get("prefixo", ""), saida


def main():
    cmd, chave = sys.argv[1], sys.argv[2]
    prefixo, arqs = arquivos(chave)
    radical = lambda n: re.sub(r"\.(jpe?g|png|webp|mp4)$", "", n, flags=re.I)
    if cmd == "listar":
        ep = episodio(chave)
        for c in ep["cenas"]:
            nome = prefixo + c["codigo"]
            tem = [a["nome"] for a in arqs if radical(a["nome"]) == nome]
            print(c["codigo"], c["situacao"], "|", c.get("descricao", "")[:60], "|", ", ".join(tem) or "-")
    elif cmd == "baixar":
        cod, out = sys.argv[3], sys.argv[4]
        os.makedirs(out, exist_ok=True)
        for a in arqs:
            if radical(a["nome"]) == prefixo + cod:
                dado = urllib.request.urlopen(urllib.request.Request(P + f"/producao-videos/drive/arquivo/{a['id']}", headers=H), timeout=120).read()
                open(os.path.join(out, a["nome"]), "wb").write(dado)
                print(os.path.join(out, a["nome"]))
    elif cmd == "reprovar":
        cod, tipo, nota = sys.argv[3], sys.argv[4], sys.argv[5]
        ep = episodio(chave)
        for c in ep["cenas"]:
            for k in [k for k in c if k.startswith("drive_") or k.startswith("salvar_")]:
                c.pop(k)
            if c["codigo"] == cod:
                c["situacao"], c["refazer_tipo"] = "refazer", tipo
                c.pop("robo_revisar", None)
                c.setdefault("historico", []).append({"quando": "", "tipo": tipo, "veredito": "rejeitado", "categoria": "escala", "nota": "revisor-escala: " + nota})
        corpo = json.dumps({"chave": chave, "cenas": ep["cenas"], "notas": ep.get("notas", "")}).encode()
        urllib.request.urlopen(urllib.request.Request(U, data=corpo, headers=H, method="POST"), timeout=60)
        print("reprovada", cod)


if __name__ == "__main__":
    main()
