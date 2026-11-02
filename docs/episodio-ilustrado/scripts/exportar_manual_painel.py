"""Exporta as regras do MANUAL_CENAS.md para o Painel do Dono (página /roteiro-video, "Manual + checklist").

Dono, 02/11/2026: "reconstruir esta parte da página onde terá toda a regra separada ... como um manual de cada
processo, e do lado um checklist do que passou e o que precisa refazer ... padrão para todos os vídeos".

O MANUAL_CENAS.md continua sendo a fonte única. Toda vez que uma regra mudar aqui, rodar:
    python3 docs/episodio-ilustrado/scripts/exportar_manual_painel.py <caminho do repo ecossistema>
e commitar `painel/dados/manual_ilustrado.json` no repositório do Painel no mesmo dia.
"""
import json
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
MANUAL = os.path.join(AQUI, "..", "MANUAL_CENAS.md")


def limpar(txt: str) -> str:
    txt = re.sub(r"\*\*([^*]+)\*\*", r"\1", txt)
    txt = re.sub(r"`([^`]+)`", r"\1", txt)
    return re.sub(r"\s+", " ", txt).strip()


def regras(texto: str) -> list[dict]:
    saida, secao, atual = [], "", None
    for linha in texto.splitlines():
        if linha.startswith("## "):
            secao = limpar(linha[3:])
            atual = None
            continue
        m = re.match(r"^- \*\*(R\d+[a-z]?)\*\*\s*(.*)$", linha)
        if m:
            atual = {"codigo": m.group(1), "secao": secao, "texto": m.group(2)}
            saida.append(atual)
        elif atual and linha.startswith("  ") and linha.strip():
            atual["texto"] += " " + linha.strip()
        elif not linha.strip() or linha.startswith(("- ", "#", "|")):
            atual = None
    for r in saida:
        r["texto"] = limpar(r["texto"])
    return saida


if __name__ == "__main__":
    destino_repo = sys.argv[1] if len(sys.argv) > 1 else "/home/user/ecossistema-ia-recursos-cognitivos"
    lista = regras(open(MANUAL, encoding="utf-8").read())
    os.makedirs(os.path.join(destino_repo, "painel", "dados"), exist_ok=True)
    caminho = os.path.join(destino_repo, "painel", "dados", "manual_ilustrado.json")
    json.dump({"fonte": "maestro-video-generator/docs/episodio-ilustrado/MANUAL_CENAS.md", "regras": lista},
              open(caminho, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(lista)} regras → {caminho}")
