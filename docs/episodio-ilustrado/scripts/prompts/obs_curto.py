"""R53/R44 em TODAS as contas (dono, 02/11: "isso é uma regra a ser seguida em todas as contas").
- obs: só o que o dono faz (ABRIR / ANEXAR / CRIAR / NÃO GERAR IMAGEM · copiar · animar / SOMENTE depois de X).
- animação: trava idade, rosto, cabelo e óculos do 1º ao último quadro; nada novo aparece.
Só mexe em cenas falta/refazer (e Kit falta/refazer). Uso: python3 obs_curto.py [--gravar]
"""
import json, re, sys, urllib.request
sys.path.insert(0, "/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/ep")
from base import H, U  # noqa: E402

TRAVA = ("every person keeps exactly the same age, face, hair colour, hairstyle and glasses as in the first frame "
         "from start to end (nobody grows older or younger); nothing new appears in anyone's hands; ")


def curto(obs):
    o = obs.replace("\n", " ").strip()
    # NÃO GERAR / USAR → forma única
    m = re.match(r"^(?:NÃO GERAR IMAGEM|USAR a imagem)\b.*?(?:copiar(?: a imagem| a)?|USAR a imagem)\s+([\w-]+)", o)
    if o.startswith(("NÃO GERAR", "USAR")):
        nome = m.group(1) if m else re.search(r"([\w-]+)", o[o.find(" a imagem") + 10:]).group(1)
        dep = re.search(r"SOMENTE depois (?:que (?:a nova|o Kit) |de )([\w-]+)", o)
        return f"NÃO GERAR IMAGEM · copiar {nome}" + (f" (SOMENTE depois de {dep.group(1)})" if dep else "") + " · animar"
    # dependências por extenso → (SOMENTE depois de X)
    o = re.sub(r"\(SOMENTE depois que (?:a nova |o Kit )?([\w-]+)[^)]*\)", r"(SOMENTE depois de \1)", o)
    depois = re.search(r"·\s*fazer depois d[aoe]s? (?:ficha |imagem )?([\w-]+)", o)
    o = re.sub(r"·\s*fazer depois d[aoe]s? [^·]*", "", o)
    # segmentos que não são ação do dono
    o = re.sub(r"·\s*(salvar|apagar|montagem|ANIMAR com)[^·]*", "", o)
    # parênteses explicativos (menos o SOMENTE)
    o = re.sub(r"\s*\((?!SOMENTE|Imagem|barra de baixo)[^)]*\)", "", o)
    o = re.sub(r"\s*\[[^\]]*\]", "", o)  # f02-jonas [anos 80, 6 anos] → f02-jonas
    o = o.replace("CRIAR (barra de baixo · ", "CRIAR (")
    o = re.sub(r"^CRIAR(?= ·|$)", "CRIAR (Imagem · 16:9)", o)
    if depois and "SOMENTE" not in o:
        o += f" (SOMENTE depois de {depois.group(1)})"
    o = re.sub(r"\s*·\s*·\s*", " · ", o)
    return re.sub(r"\s{2,}", " ", o).strip(" ·")


def trava(anim):
    if not anim or "nobody grows older" in anim:
        return anim
    if "INTEGRITY:" in anim:
        return anim.replace("INTEGRITY: ", "INTEGRITY: " + TRAVA, 1)
    return anim.rstrip() + " INTEGRITY: " + TRAVA.rstrip("; ") + "."


if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    mud = 0
    for e in eps:
        for c in e["cenas"]:
            if c.get("situacao") not in ("falta", "refazer"):
                continue
            novo = curto(c.get("obs") or "")
            if novo != c.get("obs"):
                print(f"{e['chave']} {c['codigo']}: {c['obs'][:90]!r}\n    → {novo}")
                c["obs"] = novo; mud += 1
            if not e["chave"].startswith("kit"):
                c["animacao"] = trava(c.get("animacao") or "")
        if "--gravar" in sys.argv:
            urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": e["chave"], "cenas": e["cenas"], "notas": e.get("notas", "")}).encode(), headers=H, method="POST"))
    print("obs alterados:", mud)
    if "--gravar" not in sys.argv:
        json.dump(eps, open("/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/obs_dry.json", "w"), ensure_ascii=False)
