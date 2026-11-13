# Kit do MUNDO v2 (13/11/2026) — série "A Rua de Pedra".
# Dono, depois das 3 primeiras fichas: "não tem nada a ver com as da referência… melhor não usar nada daquela
# referência [os personagens 3D antigos] e sim as do vídeo de referência". Então:
#  - NENHUM personagem/cenário antigo é anexado (eles puxavam o jeito "Pixar");
#  - cada item anexa só quadros do vídeo de referência como ESTILO (ES01–ES06, pasta 01-estilo do Kit),
#    nunca para copiar pessoas, objetos, logos ou textos de lá;
#  - o personagem é descrito inteiro no texto (rosto, cabelo, roupa), com a paleta da marca.
import json

REF_P = ("Use the attached style images ONLY for the visual style — the same handmade stop-motion puppet look, materials, "
         "sculpting, proportions, lighting and color mood. Do NOT copy any character, face, clothing, object, logo or text "
         "from them; this is a NEW character described below.")
REF_C = ("Use the attached style images ONLY for the visual style — the same handmade stop-motion miniature set look, "
         "materials, weathering, warm light and color mood. Do NOT copy any building, object, logo or text from them; "
         "this is a NEW place described below.")
PUPPET = ("Handmade caricature stop-motion puppet, lifelike macro photograph of a real puppet: matte sculpted clay skin with "
          "fine fingerprints and texture, a LONG rounded clay nose (the strongest feature), big droopy expressive eyes, "
          "slightly oversized head on a thin neck, long thin limbs, needle-felted wool hair with loose stray fibers, clothes "
          "of worn real fabric (knitted wool with frayed cuffs, tweed, linen, visible stitches).")
CHILD = "A child puppet: softer and cuter caricature, nose clearly long but rounder, big curious eyes, rosy cheeks, light freckles."
YOUNG = "Smooth youthful clay skin with NO wrinkles."
OLD = "Aged clay skin with gentle wrinkles."
PALETA = ("Clothing colors: deep navy blue (#2B4872) and medium blue (#3E69B7) with cream and warm browns, plus ONE small "
          "soft aqua green (#56CAC9) detail.")
SHEET = ("Character reference sheet on a PURE WHITE seamless background (#FFFFFF), no props, no floor line, soft even studio "
         "light, faint shadow under the feet. Top row: full body front view, three-quarter view, side view and back view. "
         "Bottom row: face close-ups with these expressions: {expr}; plus one close-up of the hands. Same single character "
         "in every panel. No text, no letters.")
EA = "calm kind smile, worried, crying softly with one tear, tired and sad, joyful laughing"
EC = "calm smile, curious, shy, upset, joyful laughing"

# (código, nome, idade/tipo, descrição completa, expressões, depende_de)
PERS = [
 ("PE01", "Davi, 8 anos — protagonista (autista)", "child",
  "Davi, a slim boy of about 8: light-tan skin, straight dark brown felted hair a bit messy with a cowlick, big dark brown "
  "eyes that often look slightly to the side; a navy blue knitted sweater with frayed cuffs over a cream t-shirt, worn "
  "light-blue denim shorts, brown leather sandals, a small aqua-green toy car always in one hand.",
  "calm smile, curious looking at his toy car, overwhelmed with both hands over his ears (calm face), shy, joyful laughing", ""),
 ("PE02", "Léo (amigo do Caio)", "child",
  "Léo, a boy of about 11: dark brown skin, short black curly felted hair, a wide happy grin with a missing tooth; a mustard "
  "yellow knitted t-shirt, worn blue jeans rolled at the ankles, old white canvas sneakers.", EC, ""),
 ("PE03", "Ícaro (amigo do Caio, usa cadeira de rodas)", "child",
  "Ícaro, a boy of about 11 sitting in a small worn metal wheelchair with big spoked wheels: light skin, short brown felted "
  "hair, bright green eyes; a dark teal knitted polo shirt, grey corduroy trousers, cream sneakers with aqua laces. The "
  "wheelchair appears in every full-body view.", EC, ""),
 ("PE04", "Alice (amiga do Caio)", "child",
  "Alice, a girl of about 10: light-tan skin, long straight black felted hair with a pale pink headband, round thin "
  "glasses; a lilac knitted cardigan over a white collar blouse, a navy pleated skirt, white knee socks, black shoes.", EC, ""),
 ("PE05", "Téo (amigo do Caio)", "child",
  "Téo, a boy of about 10: fair skin with many freckles, bright orange-red messy felted hair, green eyes; an orange knitted "
  "t-shirt, navy cargo shorts, a fabric plaster on one knee, blue sneakers.", EC, ""),
 ("PE06", "Kenji (amigo do Caio)", "child",
  "Kenji, a boy of about 11 of Japanese-Brazilian descent: light skin, straight black felted hair with a fringe, narrow "
  "kind eyes; a light-blue knitted t-shirt, a small navy cross-body fabric bag, beige shorts, grey sneakers.", EC, ""),
 ("PE07", "Clara (amiga do Caio)", "child",
  "Clara, a girl of about 10: light skin, long wavy chestnut-brown felted hair with a small hair clip, soft brown eyes; a "
  "cream chunky knitted cardigan over a dusty-pink top, dark grey woolen tights, white canvas shoes.", EC, ""),
 ("PE08", "Sr. Aurélio — o pediatra da cidade", "old",
  "Dr. Aurélio, a thin elderly man of about 70: light-tan skin, wild white felted hair and bushy white eyebrows, round wire "
  "glasses on the tip of his long nose, a small white mustache; a worn white doctor coat over a cream shirt and a navy "
  "knitted vest, brown trousers, an old stethoscope around his neck.",
  "calm, serious and sorry, thoughtful looking over his glasses, kind smile, tired", ""),
 ("PE09", "Marta — a mãe do Davi (38 anos)", "young",
  "Marta, a slim woman of about 38: light-brown skin, dark brown wavy felted hair tied in a low messy bun with loose strands, "
  "tired kind brown eyes with soft dark circles; a navy blue long-sleeve knitted blouse, a cream linen apron or a grey wool "
  "cardigan over it, a long brown skirt, simple sandals, a thin aqua-green bracelet.", EA, ""),
 ("PE10", "Caio — irmão mais velho do Davi (11 anos)", "child",
  "Caio, a boy of about 11, a bit taller and slimmer than his brother Davi: light-tan skin, dark brown felted hair, the "
  "same family nose; a navy and cream striped knitted t-shirt, grey shorts, worn red sneakers, often barefoot at home.",
  "calm smile, waiting and lonely, worried, proud, joyful laughing", ""),
 ("PE11", "Prof.ª Helena — professora do AEE", "young",
  "Helena, a woman of about 35: medium brown skin, dark curly felted hair in a low bun, warm attentive eyes, small round "
  "glasses; a navy knitted cardigan over a cream linen dress, a soft aqua-green knitted scarf, flat brown shoes, ALWAYS "
  "holding a brown hardcover notebook.", "calm kind smile, attentive listening, moved with teary eyes, proud, joyful laughing", ""),
 ("PE12", "Prof.ª Regina — professora da sala de aula", "young",
  "Regina, a woman of about 45: dark brown skin, big round black curly felted hair, round thin glasses, wooden bead "
  "necklace; a wine-red knitted blouse, wide beige linen trousers, brown shoes.", EA, ""),
 ("PE13", "Prof. Marcos — professor", "young",
  "Marcos, a man of about 40: light-tan skin, short dark hair, a short trimmed beard, rectangular glasses; an olive-green "
  "knitted cardigan over a light-blue shirt, a lanyard with a blank badge, navy trousers, brown shoes.", EA, ""),
 ("PE14", "Rogério — o pai do Davi (40 anos)", "young",
  "Rogério, a tall slim man of about 40: light-brown skin, short dark felted hair, a short stubble beard, tired kind eyes; "
  "a worn navy blue denim work shirt with rolled sleeves, cream canvas trousers, worn brown boots.", EA, ""),
 ("PE15", "Dona Benedita — a benzedeira vizinha", "old",
  "Dona Benedita, an elderly woman of about 75: brown skin with deep gentle wrinkles, grey felted hair in a small bun, "
  "small kind eyes; a faded floral cotton dress, a knitted brown shawl, a small sprig of green rue in her hand.",
  "calm, praying with closed eyes, kind smile, mysterious, gentle", ""),
 ("PE16", "Davi pequeno, 2 anos (começo da história)", "child",
  "Davi at about 2 years old, the SAME character as the attached sheet PE01 but a toddler: small round toddler body, the "
  "same face and hair color; a little cream cotton t-shirt and navy shorts, barefoot, holding a small aqua-green toy car.",
  "calm, curious, overwhelmed with hands over his ears (calm face), sleepy, happy", "PE01"),
 ("PE17", "Caio pequeno, 5 anos (começo da história)", "child",
  "Caio at about 5 years old, the SAME character as the attached sheet PE10 but younger: small body, the same face and hair "
  "color; a navy and cream striped t-shirt, grey shorts, barefoot.", "calm, lonely waiting at a window, curious, shy, happy", "PE10"),
]

CEN = ("Whimsical handmade stop-motion miniature diorama, macro photograph of a real handmade set: slightly crooked walls, "
       "weathered cracked plaster, chipped paint, carved worn wood, aged fabric with visible stitches, tiny dried flowers, "
       "terracotta tiles. Colors: warm aged beige, cream, honey wood and terracotta; doors, window frames and main furniture "
       "in deep navy blue (#2B4872) and medium blue (#3E69B7); ONE small accent in soft aqua green (#56CAC9). Warm golden "
       "side light, tiny dust particles in the air. No people. No readable text.")
BRANCO = ("The whole set is built on a square wooden board and photographed ISOLATED on a PURE WHITE seamless background "
          "(#FFFFFF): nothing outside the board, no sky, no horizon, a faint shadow under the board.")
MARCA = ("Brand detail: somewhere on the school, a small round sign with a simple stylized brain drawn in navy and aqua "
         "lines (no letters).")
ANG = {
 "A": "wide establishing view from above at a 45-degree angle, the whole set visible",
 "B": "eye level of a small child, low camera close to the floor, looking across the set",
 "C": "low-angle view looking up, the set feeling tall and imposing",
 "D": "top-down view straight from above, like a map of the set",
 "E": "extreme macro close-up on the most emotional detail of the set, very shallow depth of field",
 "F": "reverse angle: the camera on the opposite side of the set, looking back",
}
ESC = "the small old public school of the town"
CENARIOS = [
 ("CE01","Escola — fachada e portão",f"The front of {ESC}: a long one-storey building with peeling cream plaster, a terracotta roof, tall navy blue windows, an iron front gate and a short cobblestone sidewalk where parents wait. {MARCA}","ABCF"),
 ("CE02","Pátio da escola","A school courtyard: cobblestone and dirt ground, a big old tree with a round wooden bench around it, a lonely corner by a wall, a drinking fountain, a small football goal.","ABCDE"),
 ("CE03","Cantina","A small school canteen: a long counter with big aluminium pots, a serving window, long wooden tables with benches, enamel cups and plates, a tiled wall.","ABC"),
 ("CE04","Corredor externo","An open-air school corridor: a long covered walkway with old columns, a row of classroom doors painted navy blue, potted plants, a bulletin board with blank paper notes.","ABC"),
 ("CE05","Quadra de esportes","A small open school sports court: cracked painted concrete floor with faded lines, a basketball hoop, a small football goal, a low wall with blank children's drawings, a bench.","ABD"),
 ("CE06","Sala de aula","A small classroom: rows of old wooden desks and chairs, a green chalkboard with no text, a teacher's desk, tall windows, a cubby wall with small backpacks.","ABCF"),
 ("CE07","Sala de aula — quadro e mesa da professora","The front of the small classroom: a green chalkboard with no text, the teacher's wooden desk with a pile of notebooks, an apple and a jar of pencils, a globe on a shelf.","AB"),
 ("CE08","Sala de recursos (porta azul)",f"A small cozy resource room behind a bright NAVY BLUE door: a low wooden children's table with two small chairs, shelves with colorful wooden toys and boxes, a felt board with picture cards, an adult round table with three chairs, a soft rug, a big window with golden light. {MARCA}","ABCDEF"),
 ("CE10","Sala de reunião","A small teachers' meeting room: a long wooden table with chairs, a pot of coffee and cups, folders, a wall clock, a window with blinds.","AB"),
 ("CE11","Sala de atendimento às famílias","A small room for talking with families: a round wooden table with four chairs, a box of tissues, coffee cups, a shelf with folders, a window with a plant.","ABEF"),
 ("CE12","Pátio coberto","A covered school patio: a wide roof on old wooden beams, a cement floor with a painted hopscotch game, a row of hooks with backpacks, benches along the wall.","ABD"),
 ("CE14","Sala dos professores","The teachers' room: an old sofa, a small kitchen corner with a kettle and mugs, lockers, a corkboard with blank notes.","AB"),
 ("CE15","Biblioteca","The small school library: tall wooden bookshelves full of old books, a reading rug with cushions, a small wooden table, a window with golden light.","AB"),
 ("CE16","Secretaria / coordenação","The school office: a wooden counter, filing cabinets, piles of folders, an old telephone, a wall clock.","AB"),
 ("CE17","Cozinha / refeitório","The school kitchen and dining hall: big pots on an old stove, a serving hatch, long tables with benches.","A"),
 ("CE18","Quadra coberta","The covered sports court: a curved metal roof on columns, painted floor lines, a basketball hoop, bleachers.","A"),
 ("CE19","Corredor de entrada","The school entrance hallway: a tiled floor, a row of coat hooks, framed blank pictures, the main door with daylight.","AB"),
 ("CE20","Auditório","The small school auditorium: rows of wooden chairs and a little stage with navy velvet curtains.","AB"),
 ("CE21","Sala de artes","The art room: paint pots, brushes in jars, an easel, colorful splashes on the tables, blank children's drawings on the wall.","AB"),
 ("CE22","Depósito / almoxarifado","The storage room: shelves with boxes, rolled mats, balls, an old mop and bucket.","A"),
 ("CE23","Banheiro","The school bathroom: small white sinks, a mirror, tiled walls, wooden stall doors painted navy.","A"),
 ("CE24","Vestiário","The changing room: wooden benches, metal lockers, hooks with towels.","A"),
 ("CE25","Copa dos professores","The teachers' small pantry: a counter with a coffee maker, mugs, lockers, a small table.","A"),
 ("CE26","Sala de apoio / atendimento","A small support room for one-to-one sessions: a small table with two chairs, a box of sensory toys, a soft lamp, a beanbag.","AB"),
 ("CE27","Rua de pedra da cidadezinha","A narrow cobblestone street in an old small town in the Brazilian countryside: crooked two-storey houses leaning gently toward each other, small iron balconies with dried flowers, an old bent street lamp, uneven hand-laid cobblestones, a church tower at the end.","ABCDF"),
 ("CE28","Casa da família — fachada e quintal","A small crooked one-storey family house with a navy blue front door and window shutters, a little front garden with a low wooden fence, and a backyard with a clothesline, a mango tree and a small worn football.","ABCE"),
 ("CE29","Cozinha da família","A small family kitchen: a worn wooden table with two chairs facing each other and two coffee cups going cold, an old stove, open shelves with jars, a window over the sink, a hanging light bulb, a navy blue cupboard, an old fridge. Under the table there is a clear empty space at floor level.","ABCDEF"),
 ("CE30","Quarto dos meninos","A small bedroom for two brothers: two narrow single beds with knitted blankets, a wooden shelf with toy cars lined up in a perfect row, a small window with curtains, a worn rug.","ABDE"),
 ("CE31","Sala da festa de família","A small living room decorated for a simple family party: a long table with a cake and paper cups, colorful paper bunting, many chairs, an old sofa, balloons.","ABCF"),
 ("CE32","Consultório do pediatra","A small old-fashioned doctor's office: a wooden desk with a notepad and an old pen, two chairs in front of it, a small examination bed with a paper sheet, a glass cabinet with old medicine bottles, a framed diploma with no readable text.","ABEF"),
 ("CE33","Dentro do ônibus na estrada","The inside of an old intercity bus: two rows of worn fabric seats, a window seat with a view of a winding countryside road and green hills made of felt and painted wood.","ABE"),
 ("CE34","Corredor do hospital da cidade grande","A long hospital waiting corridor: a row of plastic chairs, closed doors with small windows, a water cooler; colder and greyer colors than the rest of the town.","ABCF"),
 ("CE35","Pracinha com banco e árvore velha","A small town square: one old wooden bench under a big old twisted tree, a little stone fountain, an old street lamp, fallen leaves.","ABCDE"),
 ("CE36","Secretaria de Educação (balcão)","A small municipal education office: a long wooden counter, piles of paper folders, a wall clock, a bench for waiting, a window with half-closed blinds.","ABE"),
]

# Estilo (pasta 01-estilo): ES01 grupo de bonecos de corpo inteiro · ES02 mulher passando roupa (dono) · ES03 menino com
# cachorro (dono) · ES04 menina de tranças (dono) · ES05 fachada com flores · ES06 cozinha · ES07 rostos de perto ·
# ES08 rapaz de boina no banco com cachorro (dono).
MENINO, MENINA, MULHER, HOMEM, IDOSO = "ES03 + ES01", "ES04 + ES01", "ES02 + ES07", "ES08 + ES07", "ES07 + ES01"
ANEXO = {"PE01": MENINO, "PE02": MENINO, "PE03": MENINO, "PE04": MENINA, "PE05": MENINO, "PE06": MENINO, "PE07": MENINA,
         "PE08": IDOSO, "PE09": MULHER, "PE10": MENINO, "PE11": MULHER, "PE12": MULHER, "PE13": HOMEM, "PE14": HOMEM,
         "PE15": MULHER, "PE16": MENINO, "PE17": MENINO}

def prompt_p(cod, nome, tipo, desc, expr, dep):
    idade = {"child": CHILD, "young": YOUNG, "old": OLD}[tipo]
    inicio = (f"Keep EXACTLY the same character as the attached sheet {dep} (same face, nose, hair and colors). " if dep else "") + REF_P
    return " ".join(f"{inicio} {desc} {PUPPET} {idade} {PALETA} {SHEET.format(expr=expr)}".split())

def itens():
    out = []
    for p in PERS:
        cod, nome, tipo, desc, expr, dep = p
        anexo = f"{dep} + " + ANEXO[cod].split(" + ", 1)[1] if dep else ANEXO[cod]
        ob = f"CRIAR (Imagem · 16:9 · x2) · ANEXAR {anexo} · salvar como {cod}" + (f" (SOMENTE depois de {dep})" if dep else "")
        out.append((cod, nome, ob, prompt_p(*p)))
    for cod, nome, desc, angs in CENARIOS:
        out.append((cod, nome, f"CRIAR (Imagem · 16:9 · x2) · ANEXAR ES05 + ES06 · salvar como {cod}",
                    " ".join(f"{REF_C} {desc} {CEN} {BRANCO}".split())))
        for a in angs:
            out.append((f"{cod}-{a}", f"{nome} — ângulo {a}", f"CRIAR (Imagem · 16:9 · x2) · ANEXAR {cod} · salvar como {cod}-{a} (SOMENTE depois de {cod})",
                        f"Same miniature set as the attached image, same objects, colors, style and white background, seen from a new camera position: {ANG[a]}. Keep every object, its position and design exactly the same. No people, no text."))
    return out

if __name__ == "__main__":
    it = itens()
    json.dump([{"descricao": d, "nome": n, "obs": f"{o} [{n}]", "imagem": t} for d, n, o, t in it],
              open("/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/kitmini/itens_kit_mundo_v2.json", "w"), ensure_ascii=False)
    print(len(it))
