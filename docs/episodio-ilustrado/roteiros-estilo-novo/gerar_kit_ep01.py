# Gera o Kit do episódio 01 (estilo miniatura) — md no repositório + docx para o dono.
from docx import Document
from docx.shared import Pt

ESTILO = ("Handmade caricature stop-motion puppet style, lifelike macro photograph of a real handmade puppet: matte polymer clay "
          "skin with fine real texture, a long rounded clay nose (the strongest feature), rosy cheeks, "
          "slightly oversized head, thin neck, needle-felted wool hair with loose stray fibers, clothes of worn real fabric "
          "(knitted wool with frayed cuffs, linen, canvas, visible stitches). Not a cartoon, not a clean 3D render, no text.")
CRIANCA = ("Soft gentle caricature for a child: the nose clearly bigger than real but cute, big expressive eyes, light freckles.")
BRANCO_P = ("Character reference sheet on a PURE WHITE seamless studio background (#FFFFFF), no props, no base, no floor line, "
            "soft even studio light with a faint natural shadow under the feet. Top row: full body front view, three-quarter "
            "view, side view and back view. Bottom row: face close-ups with these expressions: {expr}. Plus one close-up of "
            "the hands.")
EXPR_ADULTO = "calm kind smile, worried, crying softly with one tear, tired and sad, joyful laughing"
EXPR_CRIANCA = "calm smile, curious, overwhelmed with both hands over his ears (calm face), shy, joyful laughing"
PALETA_P = ("Clothes keep the same style as the attached image, recolored with deep navy blue (#2B4872) or medium blue "
            "(#3E69B7) and cream, with ONE small soft aqua green (#56CAC9) detail.")
CEN = ("Whimsical handmade stop-motion miniature diorama, macro photograph of a real handmade miniature set: slightly crooked "
       "walls, weathered cracked plaster, chipped paint, carved worn wood, aged fabric with visible stitches, tiny dried "
       "flowers, terracotta tiles. Colors: a warm aged base of beige, cream, honey wood and terracotta; doors, window frames "
       "and main furniture in deep navy blue (#2B4872) and medium blue (#3E69B7); ONE single small accent in soft aqua green "
       "(#56CAC9). Warm golden side light, tiny dust particles. No people. Not a cartoon, not a clean 3D render, no readable text.")
BRANCO_C = ("The whole set is built on a small square wooden board and photographed ISOLATED on a PURE WHITE seamless studio "
            "background (#FFFFFF): nothing outside the board, no sky, no horizon, only white around it, a faint natural "
            "shadow under the board.")

ANG = {
 "A": "wide establishing view from above at a 45-degree angle, the whole set visible",
 "B": "eye level of a small child, low camera close to the floor, looking across the set",
 "C": "low-angle view looking up (contra-plongée), the set feeling tall and imposing",
 "D": "top-down view straight from above (plongée), like a map of the set",
 "E": "extreme macro close-up on the most emotional detail of the set, very shallow depth of field",
 "F": "reverse angle: the camera on the opposite side of the set, looking back toward where the first view was taken",
}
def angulos(cod, lista):
    return [(f"{cod}-{a}", f"Same miniature set as the attached image, same objects, colors and white background, seen from a new camera position: {ANG[a]}. Keep every object, its position and design exactly the same.") for a in lista]

PERS = [
 ("PM01","Davi, 8 anos (garoto autista — protagonista)","P01-Davi-miniatura","boy of about 8", True, EXPR_CRIANCA, ""),
 ("PM01b","Davi pequeno, 2 anos (começo da história)","P01-Davi-miniatura","toddler of about 2, small round toddler body, same hair color, a little cotton t-shirt and shorts", True, "calm, curious, overwhelmed with hands over his ears (calm face), sleepy, happy", "Same character as the attached sheet, but at 2 years old."),
 ("PM02","Marta, a mãe (38 anos)","P09 (mãe do Davi)","woman of about 38, smooth youthful clay skin with NO wrinkles, taller slim adult proportions", False, EXPR_ADULTO, ""),
 ("PM03","Rogério, o pai (40 anos) — PERSONAGEM NOVO","(nenhum — criar)","man of about 40, light-brown clay skin, short dark felted hair, a short stubble beard, tired kind eyes, tall slim adult proportions, a worn navy blue denim work shirt with rolled sleeves, cream canvas trousers, worn brown boots", False, EXPR_ADULTO, ""),
 ("PM04","Caio, irmão mais velho, 11 anos","P10 (irmão mais velho)","boy of about 11, slim, a bit taller", True, "calm smile, waiting and lonely, worried, proud, joyful laughing", ""),
 ("PM04b","Caio pequeno, 5 anos (começo da história)","P10 (irmão mais velho)","boy of about 5, small body, same hair color", True, "calm, lonely waiting at a window, curious, shy, happy", "Same character as the attached sheet, but at 5 years old."),
 ("PM05","Prof.ª Helena (professora do AEE)","P11-Helena-miniatura","woman of about 35, smooth youthful clay skin with NO wrinkles, taller slim adult proportions, the navy cardigan, cream linen dress and aqua green knitted scarf", False, "calm kind smile, attentive listening, moved with teary eyes, proud, joyful laughing", ""),
 ("PM06","O pediatra da cidade (Sr. Aurélio)","P08 (Sr. Aurélio)","elderly man of about 70, aged matte clay skin with gentle wrinkles, felted grey hair and bushy eyebrows, a worn white doctor coat over a cream shirt, round wire glasses", False, "calm, serious and sorry, thoughtful, kind smile, tired", ""),
 ("PM07","Dona Benedita, a benzedeira (vizinha) — PERSONAGEM NOVO","(nenhum — criar)","elderly woman of about 75, aged clay skin with deep gentle wrinkles, a grey felted bun, a faded floral cotton dress, a knitted shawl, a small sprig of rue in her hand", False, "calm, praying with closed eyes, kind smile, mysterious, gentle", ""),
]
AMIGOS = [("PM08","Léo","P02"),("PM09","Ícaro","P03"),("PM10","Alice","P04"),("PM11","Téo","P05"),("PM12","Kenji","P06"),("PM13","Clara","P07")]

CENARIOS = [
 ("CM01","Rua de pedra da cidadezinha (entardecer)","A narrow cobblestone street in an old small town in the Brazilian countryside: crooked two-storey houses leaning gently toward each other, small iron balconies with dried flowers, an old bent street lamp, uneven hand-laid cobblestones.","ABCDF"),
 ("CM02","Casa da família — fachada e quintal","A small crooked one-storey family house with a navy blue front door and window shutters, a little front garden with a low wooden fence, and a backyard with a dirt yard, a clothesline, a mango tree and a small worn football.","ABCE"),
 ("CM03","Cozinha da família","A small family kitchen: a worn wooden table with two chairs facing each other and two coffee cups going cold, an old stove, open shelves with jars, a window over the sink, a hanging light bulb, a navy blue cupboard. Under the table there is a clear empty space at floor level.","ABCDEF"),
 ("CM04","Quarto dos meninos","A small bedroom for two brothers: two narrow single beds with knitted blankets, a wooden shelf with toy cars lined up in a perfect row, a small window with curtains, a worn rug.","ABDE"),
 ("CM05","Sala da festa de família","A small living room decorated for a simple family party: a long table with a cake and paper cups, colorful paper bunting across the ceiling, many empty chairs, an old sofa.","ABCF"),
 ("CM06","Consultório do pediatra da cidade","A small old-fashioned doctor's office in a small town: a wooden desk with a notepad and an old pen, two chairs in front of it, a small examination bed with a paper sheet, a glass cabinet with old medicine bottles, a framed diploma with no readable text.","ABEF"),
 ("CM07","Viagem: dentro do ônibus na estrada","The inside of an old intercity bus: two rows of worn fabric seats, a window seat with a view of a winding countryside road and green hills made of felt and painted wood.","ABE"),
 ("CM08","Corredor de espera do hospital na cidade grande","A long hospital waiting corridor: a row of plastic chairs against the wall, closed doors with small windows, a water cooler, a long cold strip of light on the floor; the colors here are colder and greyer than the rest of the story.","ABCF"),
 ("CM09","Secretaria de Educação (balcão)","A small municipal education office: a long wooden counter, piles of paper folders, a wall clock, a bench for waiting, a window with half-closed blinds.","ABE"),
 ("CM10","Escola — fachada e portão","The same small old public school as the attached facade image, now with an iron front gate in front of it where parents wait outside.","ABCF"),
 ("CM11","Pátio da escola","A school courtyard: cobblestone and dirt ground, a big old tree with a round bench around it, a lonely corner by a wall, a drinking fountain, a small football goal.","ABCDE"),
 ("CM12","Sala de recursos (porta azul)","A small cozy resource room: a navy blue door, a low wooden children's table with two small chairs, shelves with colorful wooden toys and boxes, a felt board with picture cards, an adult table with three chairs for meetings, a soft rug, a big window with golden light.","ABCDEF"),
 ("CM13","Sala de aula","A small classroom: rows of old wooden desks, a green chalkboard with no readable text, a teacher's desk, tall windows, a cubby wall with backpacks.","ABCF"),
 ("CM14","Pracinha com banco e árvore velha","A small town square at the end of the cobblestone street: one old wooden bench under a big old twisted tree, a little stone fountain, an old street lamp, fallen leaves.","ABCDE"),
]

def item_p(cod,nome,anexo,desc,crianca,expr,extra):
    base = (f"{extra} " if extra else "") + (f"Use the attached image ONLY to keep this same character (same face, hair color and hairstyle, same kind of clothes). " if not anexo.startswith("(nenhum") else "") 
    txt = f"{base}A {desc}. {ESTILO} {CRIANCA if crianca else 'Small warm expressive eyes.'} {PALETA_P if not anexo.startswith('(nenhum') else 'Use deep navy blue (#2B4872) or medium blue (#3E69B7) and cream, with ONE small soft aqua green (#56CAC9) detail.'} " + BRANCO_P.format(expr=expr)
    return " ".join(txt.split())

md=["# Kit do episódio 01 — estilo miniatura (Conta C) — fundo branco em tudo","",
    "> Dono, 13/11/2026: \"o kit quero todos e várias dimensões para manter o mesmo cenário em vários ângulos, abuse da posição",
    "> das câmeras… drama, emoção e felicidade… todos personagens e cenários com FUNDO BRANCO\".",
    "> Como fazer: PERSONAGENS = CRIAR (Imagem · 16:9 · Nano Banana 2.1 · x2) anexando a imagem indicada. CENÁRIOS = 1º a",
    "> base (CRIAR, sem anexo, ou anexando a imagem antiga do lugar se existir); depois cada ÂNGULO = CRIAR anexando a BASE",
    "> aprovada do mesmo cenário. Salvar com o código no nome (ex.: PM02-Marta, CM03-A-cozinha).",""]
md.append("## Personagens")
for p in PERS:
    md += [f"### {p[0]} — {p[1]}", f"Anexar: {p[2]}", "```", item_p(*p), "```",""]
md += ["### PM08–PM13 — amigos do Caio na escola (Léo, Ícaro, Alice, Téo, Kenji, Clara)",
       "Mesmo texto para cada um, anexando a folha original dele (P2 a P7); troque a idade se ele não tiver ~10 anos.",""]
for cod,nome,orig in AMIGOS:
    md += [f"**{cod} — {nome}** (anexar {orig})", "```", item_p(cod,nome,orig,"child of about 10, friendly and playful",True,"calm smile, curious, laughing with friends, cheering, kind",""), "```",""]
md.append("## Cenários (base + ângulos)")
for cod,nome,desc,angs in CENARIOS:
    base = " ".join(f"{('Use the attached facade image to keep the same school building. ' if cod=='CM10' else '')}{desc} {CEN} {BRANCO_C}".split())
    md += [f"### {cod} — {nome}", f"**{cod}-base**" + (" (anexar C01-fachada-miniatura)" if cod=="CM10" else " (sem anexo)"), "```", base, "```"]
    for c,t in angulos(cod,angs):
        md += [f"**{c}** (anexar {cod}-base)", "```", t, "```"]
    md.append("")
open('/home/user/maestro-video-generator/docs/episodio-ilustrado/roteiros-estilo-novo/ep01_kit.md','w').write("\n".join(md))

# docx
d=Document(); d.styles['Normal'].font.name='Arial'; d.styles['Normal'].font.size=Pt(10)
for linha in md:
    if linha.startswith('# '): d.add_heading(linha[2:],0)
    elif linha.startswith('## '): d.add_heading(linha[3:],1)
    elif linha.startswith('### '): d.add_heading(linha[4:],2)
    elif linha in ('```',''): continue
    elif linha.startswith('**') : d.add_paragraph(linha.replace('**',''), style='List Bullet')
    elif linha.startswith('> '): d.add_paragraph(linha[2:]).italic=True
    else: d.add_paragraph(linha)
d.save('/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/Kit Episodio 01 - estilo miniatura.docx')
n_p=len(PERS)+len(AMIGOS); n_c=sum(1+len(a) for *_,a in CENARIOS)
print('personagens',n_p,'cenarios (base+angulos)',n_c,'total',n_p+n_c)
