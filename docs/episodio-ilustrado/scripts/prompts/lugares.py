"""Mapa fixo de cada lugar (pedido do dono 30/10/2026: o varal, o portão e as
paredes mudavam de cena para cena). Cada lugar ganha:
  - MAPA: o que existe e ONDE, sempre igual (vai no fim de toda cena do lugar);
  - plano -A (vista principal) e -B (contraplano), imagens únicas 16:9 que
    TODAS as cenas do lugar abrem para editar, em vez de inventar o lugar de novo.
Só altera textos; nunca mexe em situação/anotação do dono."""
import sys, json, re, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U

LUGARES = {
 # ---------------- Conta A (piloto, notícias 3 e 4) ----------------
 "c01-casa-interior": dict(conta="A",
   vista_a="from the front door looking in", vista_b="from the kitchen corner looking back toward the front door",
   mapa="the main room of a small 1980s rural Brazilian house (living room and kitchen in one). Walls of faded blue lime paint peeling over ochre plaster; floor of red terracotta square tiles; ceiling of dark wooden beams under clay tiles. "
   "BACK WALL: on the left a dark wooden inner door; in the middle the kitchen corner — an olive-green two-door wall cupboard with cracked paint above a grey concrete sink counter with green doors, a narrow wooden shelf with three tin jars; on the right of it a red-brick wood-burning stove with an iron top, a dented aluminium pot on it and a rusty metal chimney pipe going straight up. "
   "LEFT WALL: one worn brown fabric three-seat sofa against the wall. RIGHT WALL: one large wooden window with six square panes looking out to a dry fenced field and a lone tree; under the window a rustic wooden table with ONE wooden chair. "
   "FRONT WALL (behind the camera in the main view): the wooden plank front door. Warm afternoon sun enters ONLY through the right window and draws window-shaped patches on the floor."),
 "c02-quintal": dict(conta="A",
   vista_a="from the house's back door looking out across the yard to the back wall", vista_b="from the back wall looking toward the house",
   mapa="the backyard of the same house: flat packed red earth, dry grass tufts only along the walls. "
   "LEFT: the side wall of the house (ochre plaster, clay-tile roof eave) with a low concrete step and a wooden bench. BACK: an exposed red brick wall about 2 m high closes the whole yard, dry shrubs and one tree behind it. "
   "GATE: in the RIGHT part of the back wall, ONE small gate (obj-08): green rusty iron frame with four grey pine slats (one chipped) and an iron bolt, about 100 cm wide and 90 cm high, hinged on its LEFT post, opening INTO the yard; closed unless the scene says it is open. "
   "CLOTHESLINE: exactly ONE rope stretched between exactly TWO round grey wooden posts, running left to right, parallel to the back wall and about 2 m in front of it, posts about 4 m apart; on it ALWAYS exactly four pieces, in this order from left to right: white sheet, faded blue shirt, cream towel, faded red shirt, held by wooden pegs. "
   "On the ground: a worn leather ball and a small wooden toy truck. Late sun from the left, long shadows falling to the right."),
 "c03-rua-bairro": dict(conta="A",
   vista_a="standing in the middle of the street near the family house, looking down the street toward the hills", vista_b="from further down the street looking back up toward the family house",
   mapa="the red dirt street of the small town in the 1980s, no pavement, no cars. The street runs straight away from the camera and gently downhill toward misty blue hills. "
   "LEFT SIDE: a row of one-storey houses with clay-tile roofs and plastered walls in faded white, yellow and green, each behind a low plastered wall with a rusty green metal gate; the family house is the FIRST on the left (white walls, brown wooden shutters, green gate). Wooden power poles with sagging wires stand along the LEFT side only. "
   "RIGHT SIDE: open dry grass field with a barbed-wire fence on wooden posts and a few scattered trees."),
 "c04-sala-aee": dict(conta="A",
   vista_a="from the doorway looking at the table and the felt board", vista_b="from the window side looking toward the door",
   mapa="a present-day resource room (sala de recursos) in a Brazilian public school: off-white walls, light grey tiled floor. "
   "LEFT WALL: one large window with a roller blind; under it a long low light-wood shelf with transparent plastic boxes and a small potted plant. BACK WALL: a big blue felt board with five blank cream cards pinned in two rows; to its LEFT a tall light-wood shelf with plastic boxes and a plant on top; to its RIGHT a small white rolling cart with a cup of pencils. "
   "RIGHT WALL: a light-wood door with a narrow vertical glass panel and a tall light-wood wardrobe. CENTER: ONE rectangular light-wood table on a blue rug, with two blue and two yellow children's chairs."),
 "c05-consultorio": dict(conta="A",
   vista_a="from the entrance door looking at the desk and the window", vista_b="from behind the desk looking toward the entrance door",
   mapa="a 1980s small-town pediatrician's office: pale green walls with peeling patches and old faded anatomy posters (no readable text); red tile floor. "
   "BACK WALL (main view): on the left an old wooden desk with drawers, a brass desk lamp, a beige rotary phone, a metal tray with a stethoscope and a white baby scale; beside the desk a tall standing doctor's scale; in the corner a white glass medicine cabinet. "
   "RIGHT WALL: one large wooden window with six panes looking at a neighbouring house; under it a metal examination bed with a white sheet and a small pillow. "
   "FRONT WALL (behind the camera): the wooden entrance door. Two wooden chairs for the parents stand in front of the desk."),
 # ---------------- Conta B (notícias 5 e 8) ----------------
 "c02-sala-antiga-adulto": dict(conta="B",
   vista_a="from the doorway at adult eye level looking at the blackboard", vista_b="from the blackboard looking back toward the door",
   mapa="the small old rented room where the educator first taught, 1980s: faded blue lime walls with peeling plaster, red terracotta floor. "
   "BACK WALL: a small green blackboard in the middle. RIGHT WALL: one wooden window with open wooden shutters, warm light coming in. LEFT WALL: the wooden entrance door. "
   "Old wooden school desks with chairs in two short rows facing the blackboard. Exactly as in the attached plate — never add or move walls, windows or doors."),
 "c03-sala-nova": dict(conta="B",
   vista_a="from the back of the room at adult eye level looking at the blackboard", vista_b="from beside the blackboard looking back at the desks and the door",
   mapa="the classroom of the brand-new school (1980s, just built): smooth freshly painted white walls with a light-blue band along the bottom, clean shiny terracotta tile floor, nothing peeling or cracked. "
   "BACK WALL: a normal-sized green blackboard centered, the teacher's wooden desk in front of it on the left. LEFT WALL: two large metal-framed windows with sun coming in. RIGHT WALL: the wooden door near the back corner and a low shelf with wooden toys and puzzles. "
   "Simple new wooden-and-metal student desks in three rows facing the blackboard."),
 "c04-escola-fachada": dict(conta="B", origem="ref-escola-nova-p29", alias=["ref-escola-nova-p29", "n5-S06a"],
   vista_a="from the street outside the open gate looking into the courtyard", vista_b="from inside the courtyard looking back at the gate and the street",
   mapa="the front of the new school: a plastered front wall with a wide double gate of metal bars in the middle, opening INTO the courtyard; a courtyard of packed red earth; a single-storey building with clay-tile roof across the back of the courtyard; one big shade tree on the left. Exactly as in the attached image ref-escola-nova-p29."),
 # ---------------- Conta C (notícias 1 e 6) ----------------
 "c01-sala-infantil": dict(conta="C",
   vista_a="from the classroom door at adult eye level", vista_b="from the window side looking back toward the door and the teacher's desk",
   mapa="an early-childhood classroom of a simple Brazilian public school: walls painted cream with children's drawings pinned (no letters), terracotta floor. "
   "CENTER: a round colourful rug with three low round wooden tables and small chairs around them. LEFT WALL: one big window looking out to the sunny courtyard (sandbox and slide visible outside). "
   "BACK WALL: low wooden shelves with wooden toys, building blocks and wicker baskets. RIGHT WALL: the teacher's wooden desk near the door. CEILING: ONE white ceiling fan in the middle."),
 "c02-patio-infantil": dict(conta="C",
   vista_a="from the classroom door looking out into the courtyard", vista_b="from the far end of the courtyard looking back at the classroom door",
   mapa="the courtyard of the same school: packed red earth and a low plastered wall painted light yellow around it. "
   "LEFT: a square wooden sandbox with small plastic buckets and spades. CENTER-BACK: one small low blue slide. RIGHT: one big shade tree with a wooden bench under it. FOREGROUND-RIGHT: a play mat with interlocking toy pieces. The classroom door and its window are on the near side."),
 "c03-sala-recursos": dict(conta="C", alias=["n1-E24"],
   vista_a="from the door looking at the round table", vista_b="from the window looking back toward the door",
   mapa="a small resource room: one round table with adapted board games and picture cards, shelves with boxes (no letters) on the back wall, a simple computer on a desk on the right wall, a mirror and colourful mats, one window on the left wall with afternoon light."),
 # ---------------- Conta D (notícias 2 e 7) ----------------
 "c01-sala-regular": dict(conta="D",
   vista_a="from the back of the classroom at adult eye level looking at the chalkboard", vista_b="from beside the chalkboard looking back at the rows of desks",
   mapa="a regular classroom of a simple Brazilian public elementary school: walls cream above and green below, grey cement floor. "
   "BACK WALL (main view): a green chalkboard with nothing written, the teacher's desk in front of it on the right. LEFT WALL: two big windows with afternoon light. RIGHT WALL: the door near the front and a shelf with books and boxes (no letters). "
   "Five rows of student desks with chairs facing the chalkboard. ONE ceiling fan in the middle."),
 "c04-sala-aee@D": dict(conta="D", nome="c04-sala-aee",
   vista_a="from the doorway looking at the table and the felt board", vista_b="from the window side looking toward the door",
   mapa=None),  # mesmo mapa do c04-sala-aee da Conta A (preenchido abaixo)
 "c05-sala-professores": dict(conta="D", alias=["n7-E01"],
   vista_a="from the door looking at the long table", vista_b="from the window looking back at the door",
   mapa="a simple teachers' room of a Brazilian public school: one long table with chairs in the middle, coffee cups and a thermos on it; a window on the left wall; a cork board and lockers on the back wall; the door on the right wall."),

 # ---- lugares acrescentados na revisão de 30/10 (cenas que se repetiam sem plano fixo) ----
 "c06-pracinha": dict(conta="A",
   vista_a="from the dirt path looking at the bench under the tree", vista_b="from behind the bench looking toward the houses",
   mapa="a small quiet square near the family house in the same 1980s town: packed red earth, ONE big shady mango tree in the middle with ONE long wooden bench under it facing the camera, low dry grass around, the row of clay-roofed houses of the street visible in the background on the left, a wooden power pole on the right."),
 "c07-corredor-clinica": dict(conta="A",
   vista_a="from one end of the corridor looking down its length", vista_b="from the far end looking back",
   mapa="a long plain corridor of a small 1980s clinic: pale green walls with a darker green band at the bottom, worn red tile floor, ONE row of wooden benches along the LEFT wall, closed wooden doors along the RIGHT wall, one window at the far end letting in light."),
 "c05-corredor-escola": dict(conta="B",
   vista_a="from one end of the corridor at adult eye level", vista_b="from the other end looking back",
   mapa="the corridor of the brand-new school: smooth white walls with a light-blue band at the bottom, clean terracotta floor, two open classroom doors side by side on the RIGHT wall, windows to the courtyard on the LEFT wall, sunlight on the floor."),
 "c06-sala-equipe": dict(conta="B",
   vista_a="from the door looking at the table", vista_b="from the window looking back at the door",
   mapa="the small staff room of the brand-new school: smooth white walls with a light-blue band, ONE rectangular wooden table with six chairs in the middle, a window on the LEFT wall, a small cupboard with a coffee pot and cups on the BACK wall, the door on the RIGHT wall."),
 "c06-palco-escola": dict(conta="D", alias=["n7-E03"],
   vista_a="from the audience looking at the small stage", vista_b="from the side of the stage looking at the empty chairs",
   mapa="the small stage of a present-day school hall: a low wooden stage with a dark red curtain pulled to both sides, ONE bright spotlight from above, rows of empty plastic chairs in front, plain light walls."),
}
LUGARES["c04-sala-aee@D"]["mapa"] = LUGARES["c04-sala-aee"]["mapa"]

# Estado de conservação (dono, 30/10/2026: "se a escola é nova porque a pintura já está caindo?").
# A referência de estilo p04 tem parede descascando — sem isto o Flow copia o desgaste para tudo.
NOVOS = {"c05-corredor-escola", "c06-sala-equipe", "c06-palco-escola", "c04-sala-aee", "c04-sala-aee@D", "c03-sala-nova", "c04-escola-fachada", "c01-sala-infantil", "c02-patio-infantil",
         "c03-sala-recursos", "c01-sala-regular", "c05-sala-professores"}
COND_NOVO = ("CONDITION: this place is well kept and clean — smooth intact paint, NO peeling, NO cracks, NO stains, NO damp patches, NO exposed plaster, "
             "clean floor, furniture in good shape. The style reference is ONLY for brushwork and grain, NEVER for wall condition, decay or colours. ")
COND_VELHO = "CONDITION: old and worn, exactly as described. "


def cond(chave): return COND_NOVO if chave in NOVOS else COND_VELHO

ESTILO = {"A": "p04-caixas-mudanca", "B": "ref-estilo-p04", "C": "ref-estilo-p04", "D": "ref-estilo-p04"}
KIT = {"A": "kit-piloto", "B": "kit-tutor", "C": "kit-conta-c", "D": "kit-conta-d"}
EPISODIOS = {"A": ["noticia-3", "noticia-4"], "B": ["noticia-5", "noticia-8"], "C": ["noticia-1", "noticia-6"], "D": ["noticia-2", "noticia-7"]}
FOLHA_EXISTE = {"c01-casa-interior", "c02-quintal", "c03-rua-bairro", "c04-sala-aee", "c05-consultorio",
                "c02-sala-antiga-adulto", "c03-sala-nova", "c01-sala-infantil", "c02-patio-infantil", "c01-sala-regular"}

STYLE = (" STYLE (match the attached {est} exactly): cinematic painterly realism that looks almost like a photograph painted in oil, natural realistic proportions, "
         "fine canvas grain and crosshatched texture over the whole image, muted warm sepia palette, low golden side light with long shadows, surface condition exactly as described "
         "(a NEW place looks new and clean; an OLD place looks worn). NOT a clean digital illustration, NOT watercolor, NOT ink line drawing. No people. No readable text. One single 16:9 image, not a sheet.")
TRAVA = " Every fixed element keeps exactly this position, size and design in every image: never add, move, duplicate or redesign walls, doors, windows, gates, clotheslines, posts or furniture."


def nome(chave): return LUGARES[chave].get("nome", chave)


def estilo(chave, est):
    t = STYLE.format(est=est)
    if chave in NOVOS:
        t = t.replace("muted warm sepia palette", "natural warm palette with clean colours")
    return t


def lock(chave):
    return f" PLACE LOCK — {nome(chave)}: {cond(chave)}{LUGARES[chave]['mapa']}{TRAVA}"


def placas(chave, codigo_base):
    L = LUGARES[chave]; n = nome(chave); est = ESTILO[L["conta"]]
    fonte = L.get("origem") or n
    tipo_fonte = "the attached reference sheet" if fonte in FOLHA_EXISTE else "the attached image"
    anexos = f"{est} + {fonte}" if (fonte in FOLHA_EXISTE or L.get("origem")) else est
    tipo_fonte = tipo_fonte if anexos != est else "this description"
    a = {"codigo": codigo_base + "A", "descricao": n + "-A", "situacao": "falta",
         "obs": f"CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR {anexos} · salvar como {n}-A (plano principal — TODAS as cenas deste lugar abrem esta imagem)",
         "imagem": f"One single wide 16:9 image of the place shown in {tipo_fonte}{(' ' + fonte) if anexos != est else ''}, seen {L['vista_a']}, at adult eye level, empty of people. "
                   f"It must be the SAME place with the same architecture, materials and colours. {cond(chave)}Fixed layout, follow it exactly: {L['mapa']}{TRAVA}" + estilo(chave, est)}
    b = {"codigo": codigo_base + "B", "descricao": n + "-B", "situacao": "falta",
         "obs": f"ABRIR {n}-A · ANEXAR {est} · salvar como {n}-B (contraplano: o mesmo lugar visto do lado oposto)",
         "imagem": f"Keep this exact place, light, materials and painting style. Show the SAME place seen {L['vista_b']}, at adult eye level, empty of people. "
                   f"Every fixed element stays where it really is (what was on the left is now on the right): {cond(chave)}{L['mapa']}{TRAVA} Change nothing else." + estilo(chave, est)}
    return [a, b]


def lugar_da_cena(obs, por_codigo, prefixo):
    """Lugar da cena: nome de lugar citado no ABRIR/ANEXAR, ou herdado da cena que ela abre."""
    for chave, L in LUGARES.items():
        if L["conta"] != CONTA_ATUAL[0]:
            continue
        for alvo in [nome(chave)] + L.get("alias", []):
            if alvo and re.search(r"(?<![\w-])" + re.escape(alvo) + r"(?:-[AB])?(?![\w-])", obs):
                return chave
    m = re.search(r"ABRIR (" + re.escape(prefixo) + r"[A-Z]\d+\w*)", obs)
    if m and m.group(1)[len(prefixo):] in por_codigo:
        return por_codigo[m.group(1)[len(prefixo):]]
    return None


CONTA_ATUAL = [""]
PREFIXO = {"noticia-3": "n3-", "noticia-4": "n4-", "noticia-5": "n5-", "noticia-8": "n8-", "noticia-1": "n1-", "noticia-6": "n6-", "noticia-2": "n2-", "noticia-7": "n7-"}


def revisar(eps):
    por_chave = {e["chave"]: e for e in eps}
    mudados = []
    for conta, kit_chave in KIT.items():
        CONTA_ATUAL[0] = conta
        kit = por_chave[kit_chave]
        # tira placas antigas (re-execução) e põe as novas, preservando situação já marcada
        velhas = {c["descricao"]: c for c in kit["cenas"] if c["codigo"].startswith("L")}
        kit["cenas"] = [c for c in kit["cenas"] if not c["codigo"].startswith("L")]
        i = 1
        for chave, L in LUGARES.items():
            if L["conta"] != conta:
                continue
            for p in placas(chave, f"L{i:02d}"):
                v = velhas.get(p["descricao"])
                if v:
                    p["situacao"] = v["situacao"]
                    if v.get("problema"): p["problema"] = v["problema"]
                kit["cenas"].append(p)
            i += 1
        mudados.append(kit)
        for ep_chave in EPISODIOS[conta]:
            ep = por_chave[ep_chave]; pref = PREFIXO[ep_chave]; por_codigo = {}
            for c in ep["cenas"]:
                obs = c.get("obs", "")
                lugar = lugar_da_cena(obs, por_codigo, pref)
                por_codigo[c["codigo"]] = lugar
                if not lugar:
                    continue
                n = nome(lugar)
                # cena que abria a FOLHA (4 quadros) passa a abrir o plano -A
                obs = re.sub(r"ABRIR " + re.escape(n) + r"(?![\w-])", f"ABRIR {n}-A", obs)
                obs = re.sub(r"(ANEXAR[^·]*?)(?<![\w-])" + re.escape(n) + r"(?![\w-])", lambda m: m.group(1) + n + "-A", obs)
                m = re.match(r"CRIAR[^·]*·\s*ANEXAR (.*)$", obs)
                if m and (n + "-A") in m.group(1):
                    resto = " + ".join(x.strip() for x in m.group(1).split("+") if x.strip() != n + "-A")
                    obs = f"ABRIR {n}-A · ANEXAR {resto}" if resto else f"ABRIR {n}-A"
                obs = obs.replace(" (a folha do Kit: abrir e usar o painel 1)", "")
                c["obs"] = obs
                img = c.get("imagem") or ""
                img = img.replace("Use ONLY panel 1 of this reference sheet as the full 16:9 image (same classroom, brand-new, fresh clean paint, nothing peeling). ", "Keep this exact classroom (brand-new, fresh clean paint, nothing peeling). ")
                if obs.startswith("ABRIR " + n + "-A") and "Keep this exact" not in img[:300] and img and img != "—":
                    img = img.replace("REFERENCE ROLES:", "OPENED IMAGE = the fixed place " + n + "-A: keep its walls, doors, windows, furniture and light exactly; only add or change what this text asks. REFERENCE ROLES:", 1)
                if img and img != "—":
                    img = re.sub(r" PLACE LOCK — .*?(?= STYLE LOCK| STYLE \(|$)", "", img, flags=re.S)
                    if " STYLE LOCK" in img:
                        img = img.replace(" STYLE LOCK", lock(lugar) + " STYLE LOCK", 1)
                    else:
                        img = img + lock(lugar)
                    c["imagem"] = img
            mudados.append(ep)
    return mudados


if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    json.dump(eps, open(__import__('os').path.dirname(__file__) + "/../eps_antes_lugares.json", "w"), ensure_ascii=False)
    for e in revisar(eps):
        body = {"chave": e["chave"], "cenas": e["cenas"]}
        r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps(body).encode(), headers=H, method="POST")))
        print(r["chave"], r["cenas_total"], "marcadas:", sum(c["situacao"] != "falta" for c in r["cenas"]),
              "com lugar:", sum("PLACE LOCK" in (c.get("imagem") or "") for c in r["cenas"]))
