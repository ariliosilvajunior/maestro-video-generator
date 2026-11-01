"""01/11/2026 — cenas da Conta B (noticia-5 = Notícias 04, noticia-8 = Notícias 05) no padrão do MANUAL_CENAS.md:
época (R02), câmera/cor (R26), mapa novo de cada lugar (R15/R21), fachada pelo plano novo (R20), pessoas com folha e idade
(R04/R22), roupa por cena (R17/R18), ordem de geração (R34), animação no formato (R41). Só mexe no que ainda vai ser gerado."""
import sys, json, re, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U, BLOCO

C = "CAMERA & COLOR (ShotDeck sheets in 05-referencia cores-lentes): "
CAM = {
 "c02-sala-antiga-adulto": C + "wide interior frame at adult eye level, wide lens, left-heavy composition, warm daylight from the window on the camera-LEFT with soft falloff into the worn corners, muted amber and faded-blue palette, fine 35mm film grain.",
 "c03-sala-nova": C + "medium-wide interior frame at adult eye level, medium lens, balanced composition, bright warm daylight from the two windows on the camera-LEFT, clean warm palette (white, light blue, terracotta, honey wood), fine film grain.",
 "c04-escola-fachada": C + "wide establishing frame exactly as in c04-escola-fachada-A, wide lens, balanced composition, low golden sun behind the building with long gate shadows toward the camera, warm ochre and white palette, light haze, fine 35mm film grain.",
 "c07-hospital": C + "medium-wide interior frame from the doorway, medium lens, balanced composition, soft daylight from the window on the back wall through the half-curtain, muted green-grey and white palette, quiet, fine 35mm film grain.",
 "c05-corredor-escola": C + "wide one-point-perspective frame along the veranda, wide lens, balanced composition, low golden sun from the camera-LEFT casting column shadows across the floor, warm white and terracotta palette, fine film grain.",
 "c06-sala-equipe": C + "medium-wide interior frame along the table, medium lens, balanced composition, warm daylight from the window on the camera-LEFT, clean warm palette, fine film grain.",
 "rua": C + "wide establishing frame of the small-town street, wide lens, balanced composition, hard warm daylight with long shadows, warm desaturated ochre palette, fine 35mm film grain.",
 "outra": C + "wide interior frame, wide lens, symmetrical cold composition, flat cold blue-grey light from small high windows, desaturated cold palette, fine 35mm film grain.",
}
ROTULO = {"c02-sala-antiga-adulto": "sala antiga", "c03-sala-nova": "escola nova — sala", "c04-escola-fachada": "escola nova — fachada",
          "c07-hospital": "hospital", "c05-corredor-escola": "escola nova — corredor", "c06-sala-equipe": "escola nova — sala da equipe",
          "rua": "rua da cidade", "outra": "outra instituição"}
EDUC = "f01-educadora (about 50, dark hair with grey streaks in a low bun, round tortoiseshell glasses)"
TEEN = "f02-adolescente (about 15, thin)"
MAE_T = "f03-mae-adolescente (about 42, black hair in a low ponytail, plain dark-red cotton dress, beige cardigan)"
JOVEM = "the young teacher from f05-professora-jovem (about 30, long black braid, cream blouse, dark-grey skirt)"
ROUPA = {
 ("f01-educadora", "A"): "faded light-blue chambray shirt with rolled sleeves, olive-grey trousers, brown flat shoes",
 ("f01-educadora", "B"): "checked cotton blouse in muted red and a long beige skirt (festa junina)",
 ("f02-adolescente", "A"): "plain white t-shirt, navy-blue cotton shorts, worn sneakers",
 ("f02-adolescente", "B"): "plaid cotton shirt, navy shorts and a straw hat (festa junina)",
 ("f04-menino", "A"): "mustard-yellow t-shirt, beige shorts, barefoot",
 ("f04-menino", "B"): "plain white hospital gown, barefoot",
}
IDADE = {"f01-educadora": "about 50", "f02-adolescente": "about 15", "f04-menino": "exactly 3 years old, always sitting or lying, never standing"}
FESTA = {"E32": {"f01-educadora": "B"}, "E33": {"f02-adolescente": "B"}}
HOSP = {"S08a", "S08b"}
# trocas de pessoas genéricas por folha (R04)
PESSOAS = {
 "S02": [(r"ONE other teacher \([^)]*\)", JOVEM)],
 "S05": [(r"\(one girl with Down syndrome, one boy in an old wheelchair, one boy with a hearing aid\)",
          "(the girl with Down syndrome from f08-aluna-down, the girl in her wheelchair from f09-aluna-cadeira, the boy from f11-aluno-quebra-cabeca — exactly as in their sheets)")],
 "S09": [(r"the other teacher \(woman of about 30 with a braid\)", JOVEM)],
 "S08b": [(r"Add a Brazilian male doctor of about 50 in a white coat with a stethoscope", "Add the doctor from f06-medico (about 45, short dark hair, white coat, stethoscope)")],
 "S16a": [(r"the educator, the four teachers, a cook in an apron, a janitor, with a few students among them",
           "the educator, " + JOVEM + ", the school cook from f07-merendeira (about 45, white headscarf, white apron), with three students among them (a girl with Down syndrome in a light-blue dress, a boy on crutches, a boy in a light t-shirt)")],
 "E02": [(r"The educator and two other teachers", "The educator and " + JOVEM)],
 "E15": [(r"a teacher helps a student eat with a spoon, another teacher pushes a student's simple wheelchair",
          JOVEM + " helps a student eat with a spoon, the educator pushes the wheelchair of the girl from f09-aluna-cadeira")],
 "E16": [(r"a teacher walking among them", JOVEM + " walking among them")],
 "E20": [(r"the educator, four teachers and a cook in an apron", "the educator, " + JOVEM + " and the school cook from f07-merendeira (about 45, white headscarf, white apron)")],
 "E21": [(r"One teacher demonstrates", "The young teacher (f05-professora-jovem, about 30) demonstrates")],
 "E22": [(r"the cook in her apron listening attentively and nodding beside a teacher", "the school cook (f07-merendeira, about 45) listening attentively and nodding beside the young teacher (f05-professora-jovem, about 30)")],
 "E23": [(r"the cook and a teacher both greet", "the school cook (f07-merendeira, about 45) and the young teacher (f05-professora-jovem, about 30) both greet")],
 "E03": [(r"the mother from the reference pulls the teenage boy from the reference", "the mother from " + MAE_T + " pulls the teenage boy from " + TEEN)],
 "E11": [(r"The teenage boy from the reference", "The teenage boy from " + TEEN)],
 "E33": [(r"the teenage boy from the reference", "the teenage boy from " + TEEN)],
}
ANEXA = {"S02": ["f05-professora-jovem"], "S05": ["f08-aluna-down", "f09-aluna-cadeira", "f11-aluno-quebra-cabeca"], "S09": ["f05-professora-jovem"],
         "S08b": ["f06-medico"], "S16a": ["f05-professora-jovem", "f07-merendeira"], "E02": ["f05-professora-jovem"],
         "E15": ["f05-professora-jovem", "f09-aluna-cadeira"], "E16": ["f05-professora-jovem"], "E20": ["f05-professora-jovem", "f07-merendeira"],
         "E21": ["f05-professora-jovem"], "E22": ["f07-merendeira", "f05-professora-jovem"], "E23": ["f07-merendeira", "f05-professora-jovem"]}
SEM_P29 = ["Remove the mother and the child. ", "Remove the mother and child of the original. "]


def locks_do_kit(kit):
    """PLACE LOCK novo de cada lugar, tirado dos textos -A revisados do Kit B."""
    out = {}
    for c in kit["cenas"]:
        nome = (c.get("descricao") or "")[:-2] if (c.get("descricao") or "").endswith("-A") else None
        if not nome:
            continue
        t = c["imagem"]
        m = re.search(r"PLACE LOCK — [^:]+: (.*?)(?= STYLE|$)", t, re.S)
        if m:
            corpo = m.group(1).strip()
        else:
            m = re.search(r"(\[ANOS 80[^\]]*\].*?)(?= Every fixed element| STYLE|$)", t, re.S)
            corpo = m.group(1).strip() if m else ""
        corpo = re.sub(r"No people\.\s*", "", corpo)
        out[nome] = f" PLACE LOCK — {nome}-A: " + corpo + (" Every fixed element keeps exactly this position, size and design in every image: never add, move, "
                                                         "duplicate or redesign walls, doors, windows or furniture.")
    return out


def lugar_de(c, por_cod, pref):
    obs = c.get("obs") or ""
    m = re.search(r"ABRIR (c\d{2}-[\w-]+?)-A\b", obs)
    if m:
        return m.group(1)
    m = re.search(r"ABRIR (" + re.escape(pref) + r"[A-Z]\d+\w*|n5-[A-Z]\d+\w*)", obs)
    if m:
        alvo = m.group(1)
        if alvo in ("n5-S03a",):
            return "rua"
        if alvo in ("n5-S06a", "n5-S13", "n5-S17"):
            return "c04-escola-fachada"
        if alvo in ("n5-S06b", "n5-S12", "n5-S07a", "n5-S11"):
            return "c03-sala-nova"
        return por_cod.get(alvo)
    if obs.startswith("CRIAR"):
        return "outra"
    return None


def animacao(c):
    a = c.get("animacao") or ""
    if all(k in a for k in ("CAMERA", "ACTION", "INTEGRITY")):
        return a
    nucleo = a.replace(BLOCO, "").strip() or "a small natural movement of the people, end still"
    return (BLOCO + f"CAMERA: static, no pan. ACTION: {nucleo.rstrip('.')}; end still. ACTING: small natural breathing and one physical sign of the emotion "
            "of the scene (lips pressed, shoulders dropping, eyes softening). LIGHT AND AMBIENCE: the existing light only, dust in the sun. INTEGRITY: stable faces, "
            "hands with five fingers, clothes without artifacts; walls, doors, windows, furniture and gate do not move; nobody passes through doors or gates."
            " raw cinematic imperfect realism, subtle motion blur, natural film grain, uneven light falloff, lived-in textures.")


def aplicar(E):
    locks = locks_do_kit(E["kit-tutor"])
    pend_codes = {}
    for chave, pref in (("noticia-5", "n5-"), ("noticia-8", "n8-")):
        pend_codes[pref] = {pref + c["codigo"] for c in E[chave]["cenas"] if c["situacao"] in ("falta", "refazer")}
    pend_codes["n5-"] |= set()
    todos_pend = pend_codes["n5-"] | pend_codes["n8-"]
    for chave, pref in (("noticia-5", "n5-"), ("noticia-8", "n8-")):
        ep = E[chave]; por_cod = {}
        for c in ep["cenas"]:
            k = c["codigo"]
            lugar = lugar_de(c, por_cod, pref)
            por_cod[pref + k] = lugar
            if c["situacao"] not in ("falta", "refazer"):
                continue
            obs = c["obs"]
            if obs.startswith("USAR"):
                epoca = "HOJE" if k == "E34" else "ANOS 80"
                c["descricao"] = f"[{epoca}] " + re.sub(r"^\[[^\]]*\]\s*", "", c["descricao"])
                c["obs"] = obs.replace("USAR a imagem", "NÃO GERAR IMAGEM: copiar a imagem") + " · ANIMAR com o texto abaixo"
                c["animacao"] = animacao(c)
                continue
            img = c.get("imagem") or ""
            # fachada: plano novo, sem as pessoas do piloto
            obs = obs.replace("ABRIR p29-portao-escola", "ABRIR c04-escola-fachada-A")
            for s in SEM_P29:
                img = img.replace(s, "")
            if "ABRIR c04-escola-fachada-A" in obs:
                lugar = "c04-escola-fachada"; por_cod[pref + k] = lugar
            # pessoas com folha
            for pat, novo in PESSOAS.get(k, []):
                img, n = re.subn(pat, novo, img, count=1)
            for f in ANEXA.get(k, []):
                if f not in obs:
                    obs = obs.replace("ANEXAR ", "ANEXAR " + f + " + ", 1)
            # roupa por cena (A dia a dia / B festa ou hospital)
            presentes = [f for f in ("f01-educadora", "f02-adolescente", "f04-menino") if f in obs or (f == "f01-educadora" and "educator" in img)
                         or (f == "f02-adolescente" and "teenage boy" in img) or (f == "f04-menino" and "boy from f04" in img)]
            if presentes:
                outf = []
                for f in presentes:
                    letra = FESTA.get(k, {}).get(f) or ("B" if (f == "f04-menino" and k in HOSP) else "A")
                    outf.append(f"{f} ({IDADE[f]}) wears OUTFIT {letra} — {ROUPA[(f, letra)]}")
                    obs = re.sub(r"(?<![\w-])" + re.escape(f) + r"(?![\w-])", f + "-roupas", obs)
                    if f + "-roupas" not in obs:
                        obs = obs.replace("ANEXAR ", "ANEXAR " + f + "-roupas + ", 1)
                bloco = "OUTFITS (from the attached wardrobe sheets): " + "; ".join(outf) + ". "
                if "OUTFITS (from" not in img:
                    img = img.replace(" PLACE LOCK", " " + bloco + "PLACE LOCK", 1) if " PLACE LOCK" in img else \
                        (img.replace(" STYLE LOCK", " " + bloco + "STYLE LOCK", 1) if " STYLE LOCK" in img else img + " " + bloco)
            # ordem de geração (R34)
            m = re.search(r"ABRIR ((?:n5|n8)-[A-Z]\d+\w*)", obs)
            if m and m.group(1) in todos_pend and "SOMENTE depois" not in obs:
                obs = obs.replace(m.group(0), f"{m.group(0)} (SOMENTE depois que a nova {m.group(1)} estiver pronta e salva com o mesmo nome)", 1)
            # mapa novo do lugar (R15/R21) + câmera/cor (R26)
            img = re.sub(r" PLACE LOCK — .*?(?= STYLE LOCK| STYLE \(|$)", "", img, flags=re.S)
            if lugar in CAM and "CAMERA & COLOR" not in img:
                img = img.replace(" STYLE LOCK", " " + CAM[lugar] + " STYLE LOCK", 1) if " STYLE LOCK" in img else img + " " + CAM[lugar]
            if lugar in locks:
                img = img.replace(" STYLE LOCK", locks[lugar] + " STYLE LOCK", 1) if " STYLE LOCK" in img else img + locks[lugar]
            # frase "OPENED IMAGE" antiga duplicada + esteira no lugar do mapa novo
            img = img.replace("OPENED IMAGE = the fixed place c02-sala-antiga-adulto-A: keep its walls, doors, windows, furniture and light exactly; only add or change what this text asks. ", "") \
                if "OPENED IMAGE = the fixed old room c02-sala-antiga-adulto-A" in img else img
            img = img.replace("the straw mat with exactly TWO cushions by the right wall", "the straw mat with exactly TWO cushions under the right half of the blackboard")
            for frase in set(re.findall(r"OPENED IMAGE = [^.]+\.", img)):
                while img.count(frase) > 1:
                    i = img.rfind(frase); img = img[:i] + img[i + len(frase):]
            c["imagem"], c["obs"] = img, obs
            rot = ROTULO.get(lugar, "escola nova")
            epoca = "HOJE" if k == "E34" else "ANOS 80"
            c["descricao"] = f"[{epoca} · {rot}] " + re.sub(r"^\[[^\]]*\]\s*", "", c["descricao"])
            c["animacao"] = animacao(c)
        # notas: nomes reais + tabela de roupa por cena (R18)
        n = ep["notas"].replace("ref-escola-nova-p29", "c04-escola-fachada-A").replace("ref-estilo-p08", "ref-estilo-p04").replace("p08", "p04")
        if "ROUPA POR CENA" not in n:
            n = ("ROUPA POR CENA (01/11): educadora f01 = roupa A (camisa chambray, calça cinza-oliva) em tudo, B só na festa junina (n8-E32); adolescente f02 = A "
                 "(camiseta branca, short azul-marinho), B só na festa (n8-E33); menino f04 = A na sala antiga, B (camisola de hospital) em n5-S08a/S08b. "
                 "Fichas: f01-educadora-roupas, f02-adolescente-roupas, f04-menino-roupas (08-kit-vestuario).\n") + n
        ep["notas"] = n


if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    E = {e["chave"]: e for e in eps}
    aplicar(E)
    if "--gravar" not in sys.argv:
        json.dump({k: E[k] for k in ("kit-tutor", "noticia-5", "noticia-8")}, open(__import__('os').path.dirname(__file__) + "/../cenasB_dry.json", "w"),
                  ensure_ascii=False, indent=1)
        print("rascunho"); sys.exit(0)
    for k in ("noticia-5", "noticia-8"):
        r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": k, "cenas": E[k]["cenas"], "notas": E[k]["notas"]}).encode(), headers=H, method="POST")))
        print("gravado", r["chave"])
