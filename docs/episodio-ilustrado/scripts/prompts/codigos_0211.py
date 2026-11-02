"""Códigos por categoria em todas as contas (dono, 02/11/2026: "criar um cód para cada coisa ... cada categoria
ter seu cód diferenciado, que aí fica fácil de saber quando está em um lugar errado").

AV avatar · ES estilo · PE personagem (PE-R roupas) · CE cenário/plano fixo (CE-F folha-base) · OB objeto · CL cores/lentes.
Cenas continuam nN-Exx / nN-Sxx. O número antigo é mantido (f04 → PE04, c03 → CE03, obj-15 → OB15).
Uso: python3 codigos_0211.py [--gravar]   (troca os nomes nos textos do Painel: Kits e cenas falta/refazer)
"""
import json, re, sys, urllib.request
sys.path.insert(0, "/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/ep")
from base import H, U  # noqa: E402

CONTA_DO = {"kit-piloto": "A", "piloto": "A", "noticia-3": "A", "noticia-4": "A", "kit-tutor": "B", "noticia-5": "B",
            "noticia-8": "B", "kit-conta-c": "C", "noticia-1": "C", "noticia-6": "C", "kit-conta-d": "D", "noticia-2": "D", "noticia-7": "D"}
AV = {"avatar-arilio-01": "AV01", "avatar_reference_sheet": "AV02", "avatar_entrada": "AV03", "avatar_saida": "AV04",
      "Av02_fim_sentado": "AV05", "Av03_inicio_vazio": "AV06"}


def novo_nome(nome, em_kit=False):
    """Código novo de um nome antigo (None = não é nome de arquivo do Kit)."""
    if nome in AV:
        return AV[nome]
    if nome in ("ref-estilo-p04", "p04-caixas-mudanca"):
        return "ES01"
    m = re.fullmatch(r"f(\d{2})-[\w-]+?(-roupas)?", nome)
    if m:
        return f"PE{m.group(1)}" + ("-R" if m.group(2) else "")
    m = re.fullmatch(r"c(\d{2})-[a-z0-9-]+?(-A)?", nome)
    if m:
        return f"CE{m.group(1)}" if (m.group(2) or not em_kit) else f"CE{m.group(1)}-F"
    m = re.fullmatch(r"obj-(\d{2})-[\w-]+", nome)
    if m:
        return f"OB{m.group(1)}"
    return None


NOME = re.compile(r"(?<![\w-])((?:f\d{2}|c\d{2}|obj-\d{2})-[a-z0-9-]*[a-z0-9](?:-A)?|ref-estilo-p04|p04-caixas-mudanca|avatar-arilio-01|avatar_reference_sheet|avatar_entrada|avatar_saida|Av02_fim_sentado|Av03_inicio_vazio)(?![\w-])")


def trocar(txt, em_kit=False):
    if not txt:
        return txt
    txt = re.sub(r"\s*\+\s*ref-estilo-p08", "", txt)
    txt = txt.replace("ref-estilo-p08", "ES01")
    return NOME.sub(lambda m: novo_nome(m.group(1), em_kit) or m.group(1), txt)


if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    tabela, mud = {}, 0
    for e in eps:
        kit = e["chave"].startswith("kit")
        for c in e["cenas"]:
            if kit:
                antigo = c.get("descricao", "")
                novo = novo_nome(antigo, em_kit=True)
                if novo and novo != antigo:
                    tabela.setdefault(CONTA_DO.get(e["chave"], "?"), {})[antigo] = novo
                    c["descricao"] = novo
            if not kit and c.get("situacao") not in ("falta", "refazer"):
                continue
            for campo in ("obs", "imagem", "animacao"):
                antes = c.get(campo) or ""
                for m in NOME.finditer(antes):
                    tabela.setdefault(CONTA_DO.get(e["chave"], "?"), {})[m.group(1)] = novo_nome(m.group(1), kit)
                depois = trocar(antes, kit)
                if depois != antes:
                    c[campo] = depois; mud += 1
        e["notas"] = trocar(e.get("notas") or "")
        if "--gravar" in sys.argv:
            urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": e["chave"], "cenas": e["cenas"], "notas": e["notas"]}).encode(), headers=H, method="POST"))
    print("campos alterados:", mud)
    json.dump(tabela, open("/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/cod/tabela_textos.json", "w"), ensure_ascii=False, indent=1)
    if "--gravar" not in sys.argv:
        json.dump(eps, open("/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/cod/eps_codigos_dry.json", "w"), ensure_ascii=False)
    for L, t in sorted(tabela.items()):
        print("== Conta", L); [print("  ", a, "→", b) for a, b in sorted(t.items())]
