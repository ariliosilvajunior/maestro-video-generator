"""Verificador automático dos textos de cena (MANUAL_CENAS.md). Barra o erro ANTES de ir para o Painel.

Uso:
  CONTENT_FACTORY_API_TOKEN=... python3 validar_cenas.py <chave-do-episodio> [<chave> ...]
  python3 validar_cenas.py --arquivo episodio.json      (lista de cenas local, antes de gravar)

Lê as cenas do Painel e os nomes que EXISTEM no Drive (Kit da conta + pasta do episódio) e confere as
regras que dá para checar sem olhar a imagem. Sai com código 1 se houver ERRO — automação não grava.
O que exige olhar a imagem (R15, R30 "bate com a imagem") é do especialista revisor-cenas.
"""
import json
import os
import re
import sys
import urllib.request

BASE = os.environ.get("PAINEL_URL", "https://painel.recursoscognitivos.com.br")
PREFIXO = {"noticia-3": "n3-", "noticia-4": "n4-", "noticia-5": "n5-", "noticia-8": "n8-",
           "noticia-1": "n1-", "noticia-6": "n6-", "noticia-2": "n2-", "noticia-7": "n7-", "piloto": ""}
CODIGO = re.compile(r"(?<![\w-])((?:[fc]\d{2}|obj-\d{2}|p\d{2}|n\d+-[A-Z]\d+\w*|ref)-?[\w-]*)")
APELIDOS = re.compile(r"\b(Mãe|Pai|Filho|Filha|Professor|Professora|Menino|Menina|Jonas|Maria)\b")
IDADE = re.compile(r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[- ](years?|months?)[- ]old|\bexactly \d+ years|\babout \d+\b", re.I)


def get(caminho):
    req = urllib.request.Request(BASE + caminho, headers={"Authorization": "Bearer " + os.environ["CONTENT_FACTORY_API_TOKEN"]})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def nomes_no_drive(chave):
    """Nomes (sem extensão) de tudo que existe no Kit da conta e na pasta do episódio."""
    nomes = set()
    for conta in get("/producao-videos/contas/automacao"):
        eps = {e["chave"]: e for e in conta.get("episodios", [])}
        if chave not in eps and conta.get("kit_chave") != chave:
            continue
        pastas = list((conta.get("pastas") or {}).values())
        for e in conta.get("episodios", []):
            pastas += list((e.get("pastas") or {}).values())
        for pid in pastas:
            try:
                for f in get(f"/producao-videos/drive/pasta/{pid}"):
                    nomes.add(re.sub(r"\.\w+$", "", f["nome"]).strip())
            except Exception:
                pass
    return nomes


def checar(ep, nomes, kit_codigos):
    erros, avisos = [], []
    pref = PREFIXO.get(ep["chave"], "")
    codigos_ep = {pref + c["codigo"] for c in ep["cenas"]}
    eh_kit = ep["chave"].startswith("kit")
    faltam_ref = set()
    for c in ep["cenas"]:
        if c.get("situacao") not in ("refazer", "falta"):
            continue  # só o que ainda vai ser gerado
        cod = c["codigo"]
        obs, img, anim = c.get("obs") or "", c.get("imagem") or "", c.get("animacao") or ""
        e = lambda r, m: erros.append(f"{pref}{cod} [{r}] {m}")
        a = lambda r, m: avisos.append(f"{pref}{cod} [{r}] {m}")
        sem_imagem = obs.upper().startswith(("NÃO GERAR", "USAR"))
        if not eh_kit:
            if not re.match(r"^\[[^\]]+\]", c.get("descricao") or ""):
                e("R02", "descrição sem etiqueta de época, ex.: [HOJE · sala do AEE]")
            if not anim.strip():
                e("R40", "sem texto de ANIMAÇÃO")
            elif not all(k in anim for k in ("CAMERA", "ACTION", "INTEGRITY")):
                a("R41", "animação fora do formato (CAMERA / ACTION / INTEGRITY)")
            if re.search(r"\bpan(s|ning)? (across|left|right|to)\b", anim, re.I) and "No camera pan" not in anim:
                e("R42", "animação pede pan")
        if not sem_imagem and not img.strip():
            e("R40", "sem texto de IMAGEM")
        # R20: nomes usados existem (Drive, Kit novo ainda pedido, ou cena deste episódio)
        m = re.search(r"(ABRIR|ANEXAR)(.*)$", obs)
        trecho = obs[m.start():] if m else ""
        trecho = re.sub(r"salvar[^·]*", "", trecho)
        for nome in re.findall(r"(?:ABRIR|ANEXAR|\+|copiar(?: a imagem)?)\s+([\w-]+(?:-A)?)", trecho):
            if nome in ("a", "o", "e", "com", "imagem"):
                continue
            if nome not in nomes and nome not in codigos_ep and nome not in kit_codigos:
                if nome.startswith("ref-") or nome == "p04-caixas-mudanca":
                    faltam_ref.add(nome)  # referência de estilo: um aviso por episódio, não por cena
                else:
                    e("R20", f"'{nome}' não existe no Drive nem no Kit")
        if APELIDOS.search(re.sub(r"\[[^\]]*\]", "", trecho)):
            e("R20", f"apelido no ABRIR/ANEXAR: {APELIDOS.search(trecho).group(0)} — use o código")
        # R17: personagem com ficha de roupas no Kit → a cena tem que anexar a ficha e dizer a roupa
        for f in ([] if eh_kit else set(re.findall(r"\b(f\d{2}-[\w-]+?)(?:-roupas)?(?=[ \[·+]|$)", trecho))):
            if f + "-roupas" in kit_codigos and (f + "-roupas" not in obs or "OUTFIT" not in img):
                e("R17", f"{f} tem ficha de roupas no Kit — anexar {f}-roupas e dizer a roupa (OUTFITS) da cena")
        # R16: objeto com ficha no Kit citado no texto → anexar a ficha
        for o in [x for x in kit_codigos if x.startswith("obj-")]:
            if o in img and o not in obs:
                e("R16", f"texto cita {o} mas não anexa a ficha")
        # R34: abre outra cena deste episódio que ainda vai ser refeita → avisar a ordem
        alvo = re.search(r"ABRIR (" + re.escape(pref) + r"[A-Z]\d+\w*)", obs) if pref else None
        if alvo:
            dep = next((x for x in ep["cenas"] if pref + x["codigo"] == alvo.group(1)), None)
            if dep and dep is not c and dep.get("situacao") in ("refazer", "falta") and "SOMENTE depois" not in obs:  # editar a própria cena não é dependência
                e("R34", f"abre {alvo.group(1)}, que ainda está para refazer — dizer no obs para gerar SÓ depois dela")
        if re.search(r"\b(her|his|their) (right|left) (shoulder|side|hand)\b", img) and "camera-" not in img:
            e("R35", "lado pela pessoa ('her right shoulder') — use camera-left / camera-right")
        if sem_imagem or eh_kit:
            continue
        # R26: cena nova tem a linha de câmera/cor das fichas ShotDeck
        if "CAMERA & COLOR" not in img:
            e("R26", "sem linha CAMERA & COLOR (fichas ShotDeck da pasta 05-referencia cores-lentes)")
        # R21: lugar fixo aberto → PLACE LOCK
        lugar = re.search(r"ABRIR (c\d{2}-[\w-]+-A)", obs)
        if lugar and "PLACE LOCK" not in img:
            e("R21", f"abre {lugar.group(1)} mas o texto não tem PLACE LOCK")
        # R22: personagem anexado → idade no texto
        if re.search(r"ANEXAR[^·]*\bf\d{2}-", obs) and not IDADE.search(img):
            e("R22", "anexa personagem mas o texto não diz a idade")
        # R30/R31: close criado a partir de uma cena → fundo descrito pela imagem
        if obs.startswith("CRIAR") and re.search(r"ANEXAR[^·]*\b" + re.escape(pref) + r"[A-Z]\d+", obs):
            if "BACKGROUND EXACTLY AS IN" not in img:
                e("R30", "close criado a partir de outra cena sem 'BACKGROUND EXACTLY AS IN <cena>' (fundo da imagem real)")
        if re.search(r"(behind (her|him|them)|background)[^.]{0,40}\bONLY\b|\bONLY the (off-white )?wall", img, re.I):
            e("R31", "fundo descrito por exclusão ('ONLY …') — descreva o que existe atrás de cada pessoa")
        # texto repetido (re-execuções)
        for frase in set(re.findall(r"OPENED IMAGE = [^.]+\.", img)):
            if img.count(frase) > 1:
                e("—", "frase 'OPENED IMAGE' repetida no texto")
        if re.search(r"-v2\b|renomear|salv\w+ (também )?como .{0,30}antig", obs + img, re.I):
            e("R50", "fala em -v2/renomear — refazer é mesmo nome")
    for nome in sorted(faltam_ref):
        avisos.append(f"[R12] Kit: '{nome}' é usado nas cenas mas não está salvo no Drive (pasta 01-estilo) — salvar lá")
    return erros, avisos


def main(args):
    if args and args[0] == "--arquivo":
        # rascunho local ANTES de gravar: um episódio, ou {chave: episódio} com o Kit junto
        dados = json.load(open(args[1], encoding="utf-8"))
        eps = list(dados.values()) if "cenas" not in dados else [dados]
        kits = {c["descricao"] for e in eps if e["chave"].startswith("kit") for c in e["cenas"]}
        nomes = set()
        if os.environ.get("CONTENT_FACTORY_API_TOKEN"):
            for e in eps:
                nomes |= nomes_no_drive(e["chave"])
        # o Kit também é conferido (antes era descartado quando havia episódio no arquivo)
    else:
        todos = {e["chave"]: e for e in get("/producao-videos/automacao")}
        eps = [todos[k] for k in args]
        kits = {c["descricao"] for e in todos.values() if e["chave"].startswith("kit") for c in e["cenas"]}
        nomes = set()
        for k in args:
            nomes |= nomes_no_drive(k)
    total = 0
    for ep in eps:
        erros, avisos = checar(ep, nomes, kits)
        print(f"\n== {ep['chave']}: {len(erros)} erro(s), {len(avisos)} aviso(s)")
        for x in erros:
            print("  ERRO ", x)
        for x in avisos:
            print("  aviso", x)
        total += len(erros)
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
