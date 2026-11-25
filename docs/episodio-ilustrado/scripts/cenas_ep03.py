"""Gera as fichas novas (Kit) e as cenas do rp-ep03. Uso: python3 ep3.py [enviar]"""
import json, sys, urllib.request
from base import H, U  # base.py: token do Painel (fora do repo)

PUPPET = ("Handmade caricature stop-motion puppet, lifelike macro photograph of a real puppet (Gengu-like look the owner chose): "
          "a VERY long, narrow clay nose that droops down over the mouth (the strongest feature), small simple eyes set close together, "
          "thin expressive eyebrows, a long narrow face, a lanky elongated body with a very thin neck, long thin arms and large hands; "
          "smooth matte clay skin; needle-felted wool hair with loose stray fibers; clothes of muted felt and knitted wool (frayed cuffs, "
          "visible stitches) in desaturated grey-blue, beige and brown; warm soft sepia light.")
CORES = ("Clothing colors: deep navy blue (#2B4872) and medium blue (#3E69B7) with cream and warm browns, plus ONE small soft aqua "
         "green (#56CAC9) detail.")
FOLHA = ("Character reference sheet on a PURE WHITE seamless background (#FFFFFF), no props, no floor line, soft even studio light, "
         "faint shadow under the feet. Top row: full body front view, three-quarter view, side view and back view. Bottom row: face "
         "close-ups with these expressions: {exp}; plus one close-up of the hands. Same single character in every panel. No text, no letters.")
ESTILO = ("Use the attached style images ONLY for the visual style — the same handmade stop-motion puppet look, materials, sculpting, "
          "proportions, lighting and color mood. Do NOT copy any character, face, clothing, object, logo or text from them; this is a NEW "
          "character described below. ")
CRIANCA = ("A child puppet: a shorter, smaller body and a softer caricature — the nose still long but rounder, bigger curious eyes, rosy "
           "cheeks, light freckles. ")

LUGAR_ESTILO = ("Use the attached images ONLY for the visual style of this town (handmade stop-motion miniature, cream and ochre plaster, "
                "blue doors and windows, terracotta roofs, cobblestones, warm light) — do NOT copy any house from them: this is a DIFFERENT, NEW place. ")
LUGAR_FIM = ("A COMPLETE real place that fills the frame — the surroundings continue to every edge, no model base, no white background, "
             "no empty ground. TRUE SCALE: doors clearly taller than an adult (about 2.1 m), windows start at an adult's waist, a one-storey "
             "roof is about twice an adult's height. Camera at adult eye height. No people. No text.")
DENTRO = ("Camera INSIDE at adult eye height. The place is closed and complete: the walls reach the edges of the frame and the ceiling is "
          "visible at the top. Same colors as the town (deep navy blue, soft aqua, warm cream, terracotta), handmade stop-motion miniature "
          "style. Doors clearly taller than an adult. Do NOT show the outside of the building, NO wooden base, NO white background. No people, no text.")

KIT = [
    ("PE19", "CRIAR (Imagem · 16:9 · x2) · ANEXAR ES23 + ES12 · salvar como PE19 [Dona Sônia — mãe do Léo, costureira (Ep03)]",
     ESTILO + "Dona Sônia, a slim woman of about 36, Léo's mother, a seamstress: dark-brown skin (the same as her son Léo), short black "
     "curly felted hair tied back under a faded blue cotton headscarf, tired but strong dark eyes; a cream knitted blouse with rolled "
     "sleeves, a long navy-blue skirt, a small apron with pockets full of pins, a yellow tape measure hanging around her neck, simple "
     "worn rubber flip-flops. " + PUPPET + " Smooth youthful clay skin with NO wrinkles. " + CORES + " " +
     FOLHA.format(exp="serious with arms crossed, holding a sewing needle between her lips, crying with one hand over her mouth, tired "
                  "and worried, proud smile")),
    ("PE20", "CRIAR (Imagem · 16:9 · x2) · ANEXAR ES23 + ES12 · salvar como PE20 [Faísca — o cachorro do Léo (Ep03)]",
     "Use the attached style images ONLY for the visual style — handmade stop-motion felt and clay look, materials, lighting and color "
     "mood. Do NOT copy any character from them. Faísca, a small skinny mongrel dog (vira-lata caramelo): short caramel-orange "
     "NEEDLE-FELTED wool fur with loose stray fibers, a white patch on the chest, ONE crooked ear that flops down while the other stands "
     "up, a long thin wagging tail, big shiny black bead eyes, a small black clay nose, a worn navy-blue fabric collar. A small dog: "
     "standing, his back reaches only the KNEE of a child. Handmade stop-motion puppet, macro photograph of a real felt puppet, warm soft "
     "light. Reference sheet on a PURE WHITE seamless background (#FFFFFF), no props, soft even studio light, faint shadow under the paws. "
     "Top row: side view, front view, three-quarter view and back view. Bottom row: chasing his own tail, barking happily, holding a sock "
     "in his mouth, sad with ears down, sleeping curled up. Same single dog in every panel. No text, no letters."),
    ("PE21", "CRIAR (Imagem · 16:9 · x2) · ANEXAR ES17 + ES24 · salvar como PE21 [Padre Antônio — o padre da igrejinha (Ep03)]",
     ESTILO + "Padre Antônio, the village priest, a man of about 65: light-brown skin with gentle wrinkles, white felted hair in a ring "
     "around a bald top, bushy white eyebrows, small round wire spectacles; a long black cassock with a small white collar, a simple "
     "wooden cross on a cord, black shoes. " + PUPPET + " Aged clay skin with gentle wrinkles. " + CORES + " " +
     FOLHA.format(exp="calm blessing with raised hand, surprised with eyebrows up, looking up to the sky, kind smile, laughing")),
    ("PE22", "CRIAR (Imagem · 16:9 · x2) · ANEXAR ES14 + ES01 · salvar como PE22 [A menina do trem — gancho do Ep04, ainda sem nome]",
     ESTILO + "A quiet girl of about 7 who never speaks: dark-brown skin, two long black felted braids tied with small white ribbons, "
     "big serious dark eyes; a blue knitted dress with a white collar, white socks, small brown shoes, holding a big old brown leather "
     "suitcase that is almost as tall as she is. " + PUPPET + " " + CRIANCA + CORES + " " +
     FOLHA.format(exp="serious and silent, looking down shyly, watchful, slightly scared, almost a tiny smile")),
    ("CE39", "CRIAR (Imagem · 16:9 · x2) · ANEXAR CE28-M + CE27 · salvar como CE39 [Casa do Léo — a última da rua de cima, máquina de costura na janela]",
     LUGAR_ESTILO + "The house of Léo and his mother Dona Sônia, a seamstress: the LAST small house at the top of a sloping cobblestone "
     "street, a simple one-storey house with ochre-yellow cracked plaster, a terracotta roof, a navy-blue wooden front door with a stone "
     "step, a big front window with the shutters open where an old black sewing machine stands on a table with folded fabric, a narrow "
     "wooden bench beside the door, a clothesline at the side with socks and shirts, a tin dog bowl near the step, a small side window "
     "(Léo's bedroom) with a navy-blue shutter. Neighbouring houses continue down the street on one side. Afternoon light. " + LUGAR_FIM),
    ("CE39-I", "CRIAR (Imagem · 16:9 · x2) · ANEXAR CE39 + CE29 · salvar como CE39-I (SOMENTE depois de CE39) [Casa do Léo — sala de costura, por dentro]",
     "Show the INSIDE of the house in the first attached image (the second image is ONLY for the style of an interior of this town): a "
     "small simple living room that is also Dona Sônia's sewing room. The old black sewing machine on a wooden table in front of the big "
     "front window (seen from inside, the street outside through it), piles of folded fabric, a pincushion, a basket of thread spools, a "
     "worn blue sofa, a small wall clock, a cream plaster wall with an EMPTY space beside the sewing machine, and the navy-blue door to "
     "Léo's bedroom on the side wall. " + DENTRO),
    ("CE39-Q", "CRIAR (Imagem · 16:9 · x2) · ANEXAR CE39 + CE29 · salvar como CE39-Q (SOMENTE depois de CE39) [Quarto do Léo, por dentro]",
     "Show the INSIDE of Léo's small bedroom in the house of the first attached image (the second image is ONLY for the style): a single "
     "wooden bed with a patchwork blanket against the wall, a ceiling of old cream plaster with many thin CRACKS clearly visible, a small "
     "window with a navy-blue wooden shutter (it can open to the street), drawings of trains and machines pinned on the wall, a little "
     "shelf with toy trucks and screws in a tin, the navy-blue bedroom door. " + DENTRO),
    ("CE40", "CRIAR (Imagem · 16:9 · x2) · ANEXAR CE27 + CE28-M · salvar como CE40 [Estação velha com a Maria-Fumaça e a oficina]",
     LUGAR_ESTILO + "The small OLD RAILWAY STATION of the town: a one-storey station building with cream and ochre plaster, navy-blue "
     "doors and window frames, a terracotta roof extending over a covered wooden platform with two wooden benches and an old round clock "
     "(no numbers needed); one pair of iron rails runs along the platform; on the rails stands the MARIA-FUMAÇA — a small old steam "
     "locomotive, black with dark-red wheels and a brass bell and whistle, a tall black chimney, a small driver's cabin, with ONE wooden "
     "passenger car painted navy-blue behind it; at the side, a big wooden WORKSHOP shed with tall open double doors. A bit of grass "
     "between the sleepers, cobblestones around the station, the town's terracotta roofs behind. Afternoon light. " + LUGAR_FIM),
    ("CE40-O", "CRIAR (Imagem · 16:9 · x2) · ANEXAR CE40 · salvar como CE40-O (SOMENTE depois de CE40) [Oficina do trem, por dentro]",
     "Show the INSIDE of the wooden workshop shed of the attached station: a dim workshop smelling of grease and iron — the SAME small "
     "black-and-red steam locomotive (exactly as in the image) parked inside with the side panel of its big round boiler OPEN showing "
     "pipes and valves, levers in the cabin; a long wooden workbench with tools hung on the wall, an oil lamp, chains, a wooden crate "
     "(a child can sit on it), rags, oil cans; warm light coming in through dusty high windows and the open doors at the back. " + DENTRO),
]

# ---------- elenco ----------
CAST = {  # nome: (descrição, ficha, em pé, sentado, tem S)
    "Davi": ("8-year-old boy, light-tan skin, messy dark-brown felted hair with a cowlick, long nose", "PE01", "half of a door", "38%", True),
    "Léo": ("11-year-old boy, dark-brown skin, short black curly felted hair, wide grin with a missing tooth", "PE02", "a bit more than half of a door", "40%", True),
    "Kenji": ("11-year-old Japanese-Brazilian boy, straight black felted hair with a fringe", "PE06", "a bit more than half of a door", "41%", True),
    "Téo": ("10-year-old boy, freckles, bright orange-red messy felted hair", "PE05", "a bit more than half of a door", "40%", True),
    "Clara": ("10-year-old girl, long wavy chestnut-brown felted hair with a hair clip", "PE07", "a bit more than half of a door", "41%", True),
    "Alice": ("10-year-old girl, long straight black felted hair with a pink headband, round glasses", "PE04", "a bit more than half of a door", "41%", True),
    "Marta": ("woman of 38, light-brown skin, dark-brown wavy felted hair in a low messy bun", "PE09", "two thirds of a door", "50%", True),
    "Caio": ("11-year-old boy, light-tan skin, dark-brown felted hair, same family nose as Davi", "PE10", "a bit more than half of a door", "43%", True),
    "Prof. Helena": ("woman of 35, medium-brown skin, dark curly felted hair in a low bun, round glasses, teal scarf", "PE11", "two thirds of a door", "50%", True),
    "Prof. Regina": ("woman of 45, dark-brown skin, big round black curly felted hair, round glasses, bead necklace", "PE12", "two thirds of a door", "50%", True),
    "Rogério": ("tall slim man of 40, light-brown skin, short dark felted hair, stubble beard", "PE14", "two thirds of a door", "53%", True),
    "Dona Benedita": ("elderly woman of 75, brown wrinkled skin, grey felted hair in a small bun", "PE15", "a bit more than half of a door", "44%", True),
    "Tomé": ("8-year-old deaf boy, medium-brown skin, wild messy black felted hair sticking out, long nose", "PE18", "half of a door", "37%", True),
    "Dona Sônia": ("woman of 36, Léo's mother, dark-brown skin, short black curly felted hair under a faded blue headscarf, yellow tape measure around the neck", "PE19", "two thirds of a door", "50%", False),
    "Padre Antônio": ("priest of 65, white felted hair around a bald top, round spectacles, black cassock", "PE21", "two thirds of a door", "50%", False),
    "a menina do trem": ("7-year-old girl, dark-brown skin, two long black felted braids, blue knitted dress, big brown suitcase", "PE22", "less than half of a door", "35%", False),
}
FAISCA = ("Faísca (small skinny caramel mongrel dog, felted fur, one crooked floppy ear, navy collar) — copy EXACTLY from the attached "
          "sheet PE20; he is SMALL: his back reaches only a child's knee")

ROUPA = ("WARDROBE — EPISODE 3 (change ONLY the clothes; faces, felted hair, body size and everything else exactly as in the character "
         "sheets): Léo wears a RED knitted hoodie, worn blue jeans and old white canvas sneakers; Davi a moss-green knitted sweater and "
         "brown shorts; Tomé his blue-and-white striped knitted sweater, grey shorts and sandals; Prof. Helena a navy-blue knitted cardigan "
         "over a cream blouse, keeping her teal scarf and round glasses; Prof. Regina a mustard-yellow cardigan; Rogério dark-blue work "
         "overalls stained with black grease over a grey shirt (at dinner: a brown jacket); Marta her grey knitted cardigan over a navy top "
         "and a cream apron with a brown skirt; Caio an orange knitted sweater; Dona Sônia exactly as in her sheet PE19. Do NOT copy the "
         "clothes from the other character sheets.")
FESTA = (" FESTIVAL DAY: everybody wears their best clothes — the same people, only cleaner and more colorful; Léo keeps his red hoodie, "
         "now with grease on the sleeves; colorful paper bunting flags hang across the street.")

ESTILO_CENA = ("STYLE LOCK — HAIR (most important): every puppet's hair is NEEDLE-FELTED WOOL with soft loose stray fibers, exactly like "
               "the attached character sheets — NEVER sculpted clay, plasticine or play-dough hair, never smooth shiny modelled hair. "
               "Clothes are knitted wool and felt with visible stitches.")
ESCALA = ("TRUE SCALE between puppets and buildings: the buildings are MUCH bigger than the people — a door is clearly taller than any "
          "adult (an adult's head reaches only about two thirds of the door), windows start above a child's head, a one-storey house roof "
          "is about twice an adult's height, furniture has normal human size. Nobody is as tall as a house. ADULTS ON ADULT CHAIRS: an "
          "adult never sits on a small children's chair.")
LUZ = {"manha": "soft cool morning light, long gentle shadows", "tarde": "warm golden afternoon light, long soft shadows",
       "noite": "NIGHT: deep blue night outside, warm yellow lamp light, soft glows, dark shadows",
       "oficina": "dim workshop light: warm beams through dusty windows and the glow of an oil lamp"}
FILME = ("Handmade stop-motion film still — the SAME puppets and the SAME miniature set as the attached references: keep every "
         "face, long clay nose, felted hair and colors exactly as in the character sheets, and the set exactly as in the place image (now "
         "photographed as a real scene, not on a white background: fill the frame with the set and its surroundings). Macro photograph of "
         "a real handmade miniature, shallow depth of field, tiny dust particles floating in the light, lighting: {luz}. 16:9, no text, no "
         "letters, no logos.")
MANTER = ("Keep the first attached image (the place) EXACTLY as it is — the same buildings, walls, doors, windows, furniture, trees, ground, "
          "camera and light; do not add, remove or move any wall, door or building. Only place the people of this scene into it.")
CAM = {"geral": "Camera: wide shot, the place clearly visible, the people small-to-medium in the frame, never close to the camera.",
       "media": "Camera: medium shot.", "close": "Camera: close-up."}
ANIM_BASE = ("One single continuous shot, no cuts. Handmade stop-motion animation of felt and clay puppets with slightly stepped motion. "
             "Action: {acao} CAMERA: a very slow, gentle push-in toward the main subject (slight zoom forward only). Never pan, never move "
             "sideways, never pull back, never reveal anything outside the start frame. Exactly the same characters as in the start frame — "
             "nobody new appears, nobody duplicates, nobody disappears, nobody leaves the frame. Keep faces, puppets, set and colors exactly "
             "as in the start frame; no mouths talking, no text. {extra}SCALE: nobody grows or changes size; every person stays clearly "
             "SHORTER than the doors.")
NADA = ("ONLY THE PUPPETS OF THE ACTION MOVE: every object, lamp, cup and window stays exactly still, the air is clear and calm, "
        "the light stays steady. ")


def elenco(nomes, cao):
    linhas, em_pe, sent, fichas = [], [], [], []
    for n in nomes:
        d, pe, a, s, tem_s = CAST[n]
        ref = pe + ("S" if tem_s else "")
        fichas += [pe] + ([pe + "S"] if tem_s else [])
        linhas.append(f"{n} ({d}) — copy him/her EXACTLY from the attached sheet {ref}")
        em_pe.append(f"{n}'s head reaches {a}")
        sent.append(f"{n}'s head at {s} of a door")
    if cao:
        fichas.append("PE20")
    total = len(nomes)
    t = (f"CAST (most important): EXACTLY {total} {'person' if total == 1 else 'people'} in this image, all of them our existing "
         f"puppets — " + "; ".join(linhas) + "." if nomes else "CAST: no people in this image.")
    if cao:
        t += " Plus ONE dog: " + FAISCA + "."
    if nomes:
        t += (" Each door sheet (PExxS) shows that puppet STANDING (left) and SEATED (right) next to the same blue door: keep EXACTLY those "
              "proportions — STANDING: " + "; ".join(em_pe) + "; SEATED: " + "; ".join(sent) + ". Seated people are LOW — a seated "
              "adult's head is only about half-way up a door. Never invent anyone else, never change a face or hair. Never draw the red "
              "dashed line, the labels or the white background of the sheets. FACE (most important): for each person, copy the FACE, nose, "
              "hair and clothes from the big character sheet (PExx) and the HEIGHT from the door sheet (PExxS) when there is one.")
    return t, fichas


ABRIR_LINHA = "ABRIR {p} · EDITAR (clicar na imagem → 'O que você quer mudar?') · ANEXAR {a} · salvar como rp3-{c}"
CRIAR_LINHA = "CRIAR (Imagem · 16:9 · x2) · ANEXAR {a} · salvar como rp3-{c}"
SEM_GENTE = "NÃO GERAR vídeo — cena sem gente: imagem parada com zoom na montagem. "
NOVOS = ("CE39", "CE40", "PE19", "PE20", "PE21", "PE22")

# (código, descrição PT, lugar, câmera, luz, elenco, cão, cena EN, ação do vídeo, extra)
S = []
def cena(cod, desc, lugar, cam, luz, nomes, cao, txt, acao, extra=""):
    S.append(dict(cod=cod, desc=desc, lugar=lugar, cam=cam, luz=luz, nomes=nomes, cao=cao, txt=txt, acao=acao, extra=extra))

# 1 — pracinha à noite, a carta
cena("E001", "Pracinha de noite: o Rogério sozinho no banco com a carta", "CE35-R", "geral", "noite", ["Rogério"], False,
     "Night in the little square: Rogério sits alone on the wooden bench under the lamp, wearing a brown jacket, holding an open letter.",
     "Rogério slowly lowers the letter onto his knees and lets out a long breath.")
cena("E002", "Close: as mãos do Rogério segurando a carta", "CE35-R", "close", "noite", ["Rogério"], False,
     "Close-up of Rogério's big hands holding an old folded letter under the lamp light, the paper shaking a little (only unreadable scribbles, no letters).",
     "his thumbs rub the edge of the paper slowly.")
cena("E003", "Close: o Rogério lê de novo, rosto preocupado", "CE35-R", "close", "noite", ["Rogério"], False,
     "Close-up of Rogério's worried face reading the letter again, eyebrows tight, under the lamp.",
     "his eyes move along the letter and he closes them for a moment.")
cena("E004", "Close: dobra a carta em quatro e guarda no bolso de dentro do paletó", "CE35-R", "close", "noite", ["Rogério"], False,
     "Close-up: Rogério folds the letter in four and puts it inside the inner pocket of his brown jacket, over his heart.",
     "he slides the folded letter into the inner pocket and presses his hand on it.")
cena("E005", "Casa do Davi à noite, janela acesa (sem gente)", "CE28-F", "geral", "noite", [], False,
     "The family's house at night, the fence complete, one window glowing warm yellow, the street empty.", "", )
cena("E006", "A Maria-Fumaça parada na estação à noite (sem gente)", "CE40", "geral", "noite", [], False,
     "The old station at night, the small steam locomotive standing silent and cold on the rails under the moon, the workshop doors closed.", "")
cena("E007", "A Rua de Pedra de manhã — 'Esta é a Rua de Pedra' (sem gente)", "CE27", "geral", "manha", [], False,
     "The cobblestone street in the early morning, sunlight on the houses, empty and peaceful.", "")
# 2 — escola, os bilhetes
cena("E008", "Sala de aula: a Prof.ª Regina escrevendo um bilhete", "CE06-R", "media", "manha", ["Prof. Regina"], False,
     "Morning in the classroom: Prof. Regina sits at the teacher's desk writing a small note on a piece of paper, a pile of the same little notes beside her.",
     "Regina writes and sighs, shaking her head slightly.")
cena("E009", "Léo levanta da carteira enquanto a turma está sentada", "CE06-R", "geral", "manha", ["Léo", "Davi", "Clara", "Kenji"], False,
     "The classroom: Davi, Clara and Kenji sit quietly at their desks with open books; Léo is STANDING UP beside his desk again, looking around.",
     "Léo stands up from his chair while the others keep reading.")
cena("E010", "Close: o Léo apontando o lápis até sumir", "CE06-R", "close", "manha", ["Léo"], False,
     "Close-up: Léo at his desk turning a pencil in a small sharpener, a pile of wood shavings in front of him, the pencil now tiny.",
     "Léo keeps turning the pencil in the sharpener and the shavings pile grows.")
cena("E011", "Close: o pé do Léo batendo debaixo da carteira", "CE06-R", "close", "manha", ["Léo"], False,
     "Close-up under the desk: Léo's leg in blue jeans and his white canvas sneaker tapping on the wooden floor.",
     "the sneaker taps up and down quickly, tum, tum, tum.")
cena("E012", "Léo olhando pela janela um passarinho", "CE06-R", "media", "manha", ["Léo"], False,
     "Léo sits at his desk by the window, chin on his hand, eyes following a small felt bird on the branch outside the window.",
     "Léo's head turns slowly following the bird outside.")
cena("E013", "A Prof.ª Regina chama: 'Léo! Página doze!'", "CE06-R", "media", "manha", ["Prof. Regina", "Léo"], False,
     "Prof. Regina stands at the front pointing at an open book; at his desk Léo jumps in his chair, surprised.",
     "Regina raises her finger and Léo sits up straight in a jump.")
cena("E014", "Léo perdido no livro, a turma já virou a página", "CE06-R", "media", "manha", ["Léo", "Davi"], False,
     "Léo turns the pages of his book fast and lost; beside him Davi already has his book open on the right page, looking at Léo.",
     "Léo flips pages quickly; Davi points at his own page.")
cena("E015", "Close: o Léo contando os desenhos da página errada", "CE06-R", "close", "manha", ["Léo"], False,
     "Close-up: Léo's finger counting the little drawings on a page of his book, his face curious and happy, far away from the lesson.",
     "his finger taps each drawing one by one.")
# 3 — casa do Léo, o castigo
cena("E016", "A casa do Léo, a última da rua de cima (sem gente)", "CE39", "geral", "tarde", [], False,
     "Léo's house at the top of the street in the afternoon, the sewing machine in the open window, socks on the clothesline.", "")
cena("E017", "Dona Sônia costurando na máquina da janela", "CE39-I", "media", "tarde", ["Dona Sônia"], False,
     "Inside: Dona Sônia sits on a chair at her sewing machine by the window, sewing a piece of blue fabric, a tape measure around her neck.",
     "her hands guide the fabric under the needle of the sewing machine.")
cena("E018", "O Faísca correndo atrás do próprio rabo", "CE39", "media", "tarde", [], True,
     "In front of Léo's house on the cobblestones: Faísca the little caramel dog spins chasing his own tail, the tin bowl beside him.",
     "Faísca turns round and round after his tail.", )
cena("E019", "O Faísca roubando uma meia do varal", "CE39", "media", "tarde", [], True,
     "Beside the house: Faísca stands on his back legs pulling a striped sock from the clothesline with his teeth.",
     "Faísca tugs the sock until it comes off the line.")
cena("E020", "Léo e Faísca lado a lado, os dois sem parar", "CE39", "media", "tarde", ["Léo"], True,
     "Léo sits on the bench by the door with his knee bouncing, and Faísca sits beside his feet wagging his tail just as fast — the same restless energy.",
     "Léo's knee bounces and Faísca's tail wags at the same rhythm.")
cena("E021", "Dona Sônia na porta lendo o bilhete 47, o Léo atrás", "CE39", "media", "tarde", ["Dona Sônia", "Léo"], False,
     "Dona Sônia stands in her front doorway reading a small note; Léo stands a step behind her with his head down.",
     "Sônia reads the note in silence; Léo looks at the floor.")
cena("E022", "Close: a mão da Sônia amassando o bilhete", "CE39", "close", "tarde", ["Dona Sônia"], False,
     "Close-up of Dona Sônia's hand squeezing the small paper note into a tight ball.",
     "her fingers close slowly crushing the paper.")
cena("E023", "Close: o rosto da Sônia, com medo do futuro do filho", "CE39", "close", "tarde", ["Dona Sônia"], False,
     "Close-up of Dona Sônia's worried, tired face looking down at her son, holding back tears.", "she closes her eyes and breathes in.")
cena("E024", "Sônia aponta o quarto: 'sem rua uma semana'", "CE39-I", "media", "tarde", ["Dona Sônia", "Léo"], False,
     "Inside: Dona Sônia points firmly to the navy-blue bedroom door; Léo walks toward it with his shoulders down.",
     "Sônia keeps pointing and Léo walks slowly to the door.")
cena("E025", "O Faísca de orelha baixa do lado de fora da porta do quarto", "CE39-I", "media", "tarde", [], True,
     "Inside: Faísca lies on the floor in front of the closed navy-blue bedroom door, his ears down, sad.", "Faísca lowers his head on his paws.")
cena("E026", "Léo sentado na cama, de castigo", "CE39-Q", "media", "tarde", ["Léo"], False,
     "Léo sits on the edge of his bed in his small bedroom, the door closed, hands on his knees, alone.", "Léo looks around the room, restless.")
cena("E027", "Close: o Léo deitado olhando o teto", "CE39-Q", "close", "tarde", ["Léo"], False,
     "Close-up: Léo lying on his back on the patchwork blanket, staring at the ceiling.", "his eyes move from crack to crack on the ceiling.")
cena("E028", "Close: as rachaduras do teto (sem gente)", "CE39-Q", "close", "tarde", [], False,
     "Close-up of the old plaster ceiling of the bedroom full of thin cracks.", "")
cena("E029", "Close: o pé do Léo balançando sem parar na cama", "CE39-Q", "close", "tarde", ["Léo"], False,
     "Close-up: Léo's sneaker hanging from the bed, shaking nonstop.", "the foot shakes faster and faster.")
# 4 — pátio, a bola no telhado
cena("E030", "Pátio: os meninos jogando bola, a Helena olhando", "CE02-M", "geral", "manha", ["Caio", "Léo", "Kenji", "Téo", "Prof. Helena"], False,
     "Break time in the school courtyard: Caio, Léo, Kenji and Téo play with a red ball on the cobblestones near the low stone wall; Prof. Helena watches from the side.",
     "the boys run after the ball; Helena watches.")
cena("E031", "A bola sobe por cima do murinho e para no telhado", "CE02-M", "media", "manha", ["Caio", "Kenji", "Téo"], False,
     "Caio, Kenji and Téo stand still looking UP at the low terracotta roof at the side of the courtyard where the red ball is stuck.",
     "the three boys look up with their mouths open.")
cena("E032", "Close: a bola parada em cima do telhado (sem gente)", "CE02-M", "close", "manha", [], False,
     "Close-up of a red ball stuck on the terracotta roof tiles at the edge of the courtyard roof.", "")
cena("E033", "Close: o Caio desanimado — 'Já era'", "CE02-M", "close", "manha", ["Caio"], False,
     "Close-up of Caio with his arms down, a disappointed face, looking up.", "Caio drops his shoulders and shakes his head.")
cena("E034", "Close: o Léo amarrando o rodo na vassoura com o cadarço", "CE02-M", "close", "manha", ["Léo"], False,
     "Close-up of Léo's hands tying a floor squeegee to the end of a broom handle with his own white shoelace, quick and sure.",
     "his hands pull the shoelace tight in a knot.")
cena("E035", "Léo em pé no banco esticando a vassoura até o telhado", "CE02-M", "media", "manha", ["Léo", "Caio"], False,
     "Léo stands on a wooden bench reaching up to the roof with the long broom-and-squeegee tool; Caio watches amazed below.",
     "Léo stretches up and pushes the ball with the tool.")
cena("E036", "A bola desce quicando, os meninos comemoram", "CE02-M", "media", "manha", ["Léo", "Caio", "Kenji", "Téo"], False,
     "The red ball bounces on the cobblestones; Caio, Kenji and Téo cheer with their arms up; Léo stands proudly holding his homemade tool.",
     "the boys raise their arms and jump.")
cena("E037", "A Prof.ª Regina entrega ao Léo o bilhete 48", "CE02-M", "media", "manha", ["Prof. Regina", "Léo"], False,
     "In the courtyard Prof. Regina, serious, hands a small note to Léo, who still holds the broom tool.",
     "Regina holds out the note and Léo takes it slowly.")
cena("E038", "Close: a Helena pensativa olhando o Léo", "CE02-M", "close", "manha", ["Prof. Helena"], False,
     "Close-up of Prof. Helena watching from a distance, thoughtful, a small understanding smile.", "Helena tilts her head, thinking.")
# 5 — sala de recursos, a bolinha
cena("E039", "Sala de recursos: Helena e Léo com o livro fininho", "CE08", "media", "tarde", ["Prof. Helena", "Léo"], False,
     "Afternoon in the resource room: Prof. Helena and Léo sit side by side on ADULT chairs at the rectangular adult wooden table, a thin book with big letters open in front of Léo.",
     "Léo starts reading; Helena listens.")
cena("E040", "Close: o Léo lendo, o pé já começa a bater", "CE08", "close", "tarde", ["Léo"], False,
     "Close-up: Léo reading the thin book, a pencil already in his hand, frowning.", "his foot starts tapping and his eyes drift up.")
cena("E041", "Léo distraído olhando o globo na estante", "CE08", "media", "tarde", ["Léo", "Prof. Helena"], False,
     "Léo has turned in his chair to look at a globe on the shelf; Helena watches him calmly.", "Léo spins the globe with one finger.")
cena("E042", "Close: o Léo frustrado — 'esqueci onde eu estava'", "CE08", "close", "tarde", ["Léo"], False,
     "Close-up of Léo looking back at the book, lost and frustrated.", "Léo rubs his forehead.")
cena("E043", "Close: a Helena pega uma bolinha amarela na gaveta", "CE08", "close", "tarde", ["Prof. Helena"], False,
     "Close-up of Prof. Helena's hand taking a small yellow rubber ball out of a wooden drawer.", "she lifts the yellow ball out of the drawer.")
cena("E044", "A Helena joga a bolinha para o Léo", "CE08", "media", "tarde", ["Prof. Helena", "Léo"], False,
     "Helena tosses the small yellow ball gently to Léo, who catches it in surprise.", "the ball goes from Helena's hand to Léo's hands.")
cena("E045", "Léo lendo andando em volta da mesa, quicando a bolinha", "CE08", "media", "tarde", ["Léo", "Prof. Helena"], False,
     "Léo WALKS around the table holding the open thin book in one hand and bouncing the yellow ball with the other, reading aloud; Helena sits watching, smiling.",
     "Léo walks around the table bouncing the ball while reading.")
cena("E046", "Close: o Léo lendo firme, sorrindo", "CE08", "close", "tarde", ["Léo"], False,
     "Close-up: Léo walking and reading, focused and happy, the yellow ball in his hand.", "his eyes run along the line and he smiles.")
cena("E047", "Close: o Léo vira a página sozinho", "CE08", "close", "tarde", ["Léo"], False,
     "Close-up of Léo's hand turning the page of the thin book by himself.", "he turns the page.")
cena("E048", "A bolinha foge pela porta azul", "CE08", "media", "tarde", ["Léo", "Prof. Helena"], False,
     "The yellow ball bounces crookedly away through the open blue door into the corridor; Léo and Helena look after it, surprised.",
     "the ball bounces out through the door; both turn their heads.")
cena("E049", "A bolinha debaixo da mesa da diretora (sem gente)", "CE16", "close", "tarde", [], False,
     "Close-up under a wooden desk in the school office: the small yellow rubber ball resting in the shadow.", "")
cena("E050", "Close: a Helena escreve no caderno marrom", "CE08", "close", "tarde", ["Prof. Helena"], False,
     "Close-up of Prof. Helena writing in a brown notebook with a pencil, smiling (only unreadable scribbles).", "her pencil writes a few lines.")
# 6 — visita da Helena
cena("E051", "A Helena sobe a rua de cima até a casa do Léo", "CE39", "geral", "tarde", ["Prof. Helena"], False,
     "Prof. Helena walks up the cobblestone street toward Léo's house, her bag on her shoulder.", "Helena walks slowly up toward the door.")
cena("E052", "A Sônia abre a porta com uma agulha presa na boca", "CE39", "media", "tarde", ["Dona Sônia", "Prof. Helena"], False,
     "Dona Sônia opens the navy-blue door with a sewing needle held between her lips, frowning; Prof. Helena stands on the step.",
     "Sônia opens the door and looks at Helena suspiciously.")
cena("E053", "Close: a Helena sorri — 'vim falar bem do seu filho'", "CE39", "close", "tarde", ["Prof. Helena"], False,
     "Close-up of Prof. Helena smiling warmly at the door.", "Helena smiles and nods gently.")
cena("E054", "Close: a Sônia tira a agulha da boca, devagar", "CE39", "close", "tarde", ["Dona Sônia"], False,
     "Close-up of Dona Sônia taking the needle slowly out of her lips, surprised.", "she slowly takes the needle from her mouth.")
cena("E055", "Helena conta da bola e da leitura; Sônia de braços cruzados", "CE39", "media", "tarde", ["Prof. Helena", "Dona Sônia"], False,
     "At the door, Helena explains with her hands open; Dona Sônia listens with her arms crossed, serious.", "Helena gestures; Sônia keeps her arms crossed.")
cena("E056", "Close: a Sônia com os olhos marejados", "CE39", "close", "tarde", ["Dona Sônia"], False,
     "Close-up of Dona Sônia, arms still crossed, her eyes filling with tears.", "her lips tremble.")
cena("E057", "Close: a Sônia chora — 'tenho medo dele virar o pai'", "CE39", "close", "tarde", ["Dona Sônia"], False,
     "Close-up of Dona Sônia crying softly, one tear on her cheek.", "a tear runs down her cheek.")
cena("E058", "Helena e Sônia sentadas lado a lado no banco da porta", "CE39", "media", "tarde", ["Prof. Helena", "Dona Sônia"], False,
     "Prof. Helena and Dona Sônia sit side by side on the narrow wooden bench beside the door, in silence.", "they sit quietly; Sônia wipes her eyes.")
cena("E059", "Close: a mão da Helena sobre a mão da Sônia", "CE39", "close", "tarde", ["Prof. Helena", "Dona Sônia"], False,
     "Close-up of Helena's hand resting on Sônia's hand on her lap.", "Helena's hand presses gently.")
# 7 — fuga e oficina
cena("E060", "Léo foge pela janela do quarto, o Faísca esperando", "CE39", "media", "tarde", ["Léo"], True,
     "At the side of the house: Léo climbs out of his small bedroom window; Faísca waits below wagging his tail.",
     "Léo swings one leg out of the window; Faísca jumps happily.")
cena("E061", "Léo e Faísca correndo pela rua de pedra", "CE27", "geral", "tarde", ["Léo"], True,
     "Léo runs down the cobblestone street with Faísca running beside him.", "Léo and Faísca run down the street.")
cena("E062", "A estação velha com a Maria-Fumaça (sem gente)", "CE40", "geral", "tarde", [], False,
     "The old station in the afternoon, the small steam locomotive on the rails, the workshop doors open and dark inside.", "")
cena("E063", "Oficina escura: o Rogério debruçado na caldeira", "CE40-O", "media", "oficina", ["Rogério"], False,
     "Inside the dark workshop: Rogério in grease-stained overalls bends over the open boiler of the locomotive with a wrench.",
     "Rogério turns the wrench slowly inside the boiler.")
cena("E064", "O Davi no caixote enfileirando parafusos", "CE40-O", "media", "oficina", ["Davi"], False,
     "Davi sits on a wooden crate beside the workbench, lining up screws, nuts and washers in a perfectly straight row from the smallest to the biggest.",
     "Davi places one more nut at the end of the row.")
cena("E065", "Close: a fileira perfeita de parafusos do Davi", "CE40-O", "close", "oficina", ["Davi"], False,
     "Close-up of Davi's small hands placing screws in a perfect straight line from small to big on the wooden bench.",
     "his finger pushes a screw into the line, perfectly aligned.")
cena("E066", "Léo entra na oficina; o Rogério se vira, bravo", "CE40-O", "media", "oficina", ["Léo", "Rogério"], True,
     "Léo steps into the workshop through the open doors with Faísca at his heels; Rogério turns from the locomotive, frowning, wrench in hand.",
     "Rogério turns his head sharply; Léo stops.")
cena("E067", "Léo mexendo nas alavancas, o Faísca farejando", "CE40-O", "media", "oficina", ["Léo"], True,
     "Léo touches a lever in the locomotive's cabin with curiosity; Faísca sniffs an oil can on the floor.",
     "Léo moves the lever a little; Faísca sniffs.")
cena("E068", "Close: o Léo espiando dentro de um cano", "CE40-O", "close", "oficina", ["Léo"], False,
     "Close-up: Léo with one eye close to the end of a thick iron pipe, peering inside.", "Léo squints into the pipe.")
cena("E069", "Close: o Rogério pensativo com a pergunta do menino", "CE40-O", "close", "oficina", ["Rogério"], False,
     "Close-up of Rogério stopped, thinking, rubbing his stubble beard.", "Rogério's eyebrows rise slowly.")
cena("E070", "Rogério e Léo agachados juntos na caldeira", "CE40-O", "media", "oficina", ["Rogério", "Léo"], False,
     "Rogério and Léo crouch side by side at the open boiler of the locomotive, looking inside together.", "both lean closer to the boiler.")
cena("E071", "Close: a mão miúda do Léo onde a mão do Rogério não cabe", "CE40-O", "close", "oficina", ["Léo", "Rogério"], False,
     "Close-up: Léo's small hand reaches into a narrow gap of the pipes; Rogério's big hand rests beside it, too big to enter.",
     "Léo's hand pushes deeper into the gap.")
cena("E072", "Close: o Léo puxa um pano preto de carvão", "CE40-O", "close", "oficina", ["Léo"], False,
     "Close-up: Léo pulls an old rag black with coal out of the pipe.", "the black rag comes out of the pipe.")
cena("E073", "Close: o Léo acende — rosto sujo de graxa, olhos brilhando", "CE40-O", "close", "oficina", ["Léo"], False,
     "Close-up of Léo's face smeared with grease, eyes shining, a huge grin with the missing tooth.", "Léo laughs, delighted.")
cena("E074", "Close: o Rogério olha o menino e lembra de si mesmo", "CE40-O", "close", "oficina", ["Rogério"], False,
     "Close-up of Rogério looking at the boy with a soft, moved smile.", "Rogério's smile grows slowly.")
cena("E075", "Léo explica, o Rogério escuta", "CE40-O", "media", "oficina", ["Léo", "Rogério", "Davi"], False,
     "Léo stands explaining with his hands near the open boiler; Rogério listens with attention, arms crossed; Davi watches from his crate.",
     "Léo gestures; Rogério nods.")
# 8 — a mãe procura
cena("E076", "Sônia abre o quarto: cama vazia, janela aberta", "CE39-Q", "media", "tarde", ["Dona Sônia"], False,
     "Dona Sônia stands in the doorway of Léo's bedroom: the bed is empty and the small window is wide open.", "Sônia stops and puts her hand on the door frame.")
cena("E077", "Sônia descendo a rua apressada", "CE27", "geral", "tarde", ["Dona Sônia"], False,
     "Dona Sônia walks fast down the cobblestone street in her flip-flops, her apron still on.", "Sônia hurries down the street.")
cena("E078", "Sônia para na porta da oficina", "CE40", "media", "tarde", ["Dona Sônia"], False,
     "Dona Sônia arrives at the open doors of the station workshop and stops, about to shout.", "she stops abruptly and holds her breath.")
cena("E079", "Léo explica a válvula; a Sônia no fundo, na porta", "CE40-O", "geral", "oficina", ["Léo", "Rogério", "Dona Sônia"], False,
     "Inside the workshop: Léo, dirty from head to toe, explains a valve to Rogério by the locomotive; at the far open doors Dona Sônia stands watching, frozen.",
     "Léo explains; Sônia slowly lowers her hands.")
cena("E080", "O Rogério limpa as mãos e fala com a Sônia", "CE40-O", "media", "oficina", ["Rogério", "Dona Sônia"], False,
     "Rogério wipes his hands on a rag and speaks kindly to Dona Sônia at the doorway.", "Rogério wipes his hands and nods to her.")
cena("E081", "Close: a Sônia com a mão na boca, chorando", "CE40-O", "close", "oficina", ["Dona Sônia"], False,
     "Close-up of Dona Sônia with her hand over her mouth, crying with emotion.", "tears roll down; she keeps her hand on her mouth.")
cena("E082", "Close: o Léo olha a mãe, sorriso tímido", "CE40-O", "close", "oficina", ["Léo"], False,
     "Close-up of Léo, dirty with grease, looking toward his mother with a shy smile.", "Léo smiles shyly.")
# 9 — jantar, a carta
cena("E083", "Jantar na casa do Davi: Rogério, Marta e Davi", "CE29", "media", "noite", ["Rogério", "Marta", "Davi"], False,
     "Night, dinner in the family kitchen: Rogério, Marta and Davi at the table with plates of food, Rogério quiet.", "they eat in silence; Rogério looks down.")
cena("E084", "Close: o Rogério tira a carta do bolso do paletó", "CE29", "close", "noite", ["Rogério"], False,
     "Close-up: Rogério takes the folded letter out of the inner pocket of his brown jacket.", "he pulls the letter out slowly.")
cena("E085", "Close: a Marta lê a carta", "CE29", "close", "noite", ["Marta"], False,
     "Close-up of Marta reading the letter, serious (only unreadable scribbles).", "her eyes read; she looks up.")
cena("E086", "Close: a Marta — 'por que você não me contou?'", "CE29", "close", "noite", ["Marta"], False,
     "Close-up of Marta looking at her husband, hurt and loving.", "Marta shakes her head softly.")
cena("E087", "Close: as mãos da Marta segurando a do Rogério", "CE29", "close", "noite", ["Marta", "Rogério"], False,
     "Close-up of Marta's hand holding Rogério's hand on the table beside the folded letter.", "her fingers close around his.")
cena("E088", "Close: o Davi enfileirando ervilhas por tamanho", "CE29", "close", "noite", ["Davi"], False,
     "Close-up of Davi's plate: he lines up green peas in a straight row from the smallest to the biggest with his fork.", "the fork pushes one more pea into the row.")
# 10 — três semanas
cena("E089", "Sônia leva a marmita; o Léo chega na oficina", "CE40", "media", "tarde", ["Dona Sônia", "Léo"], False,
     "In front of the station workshop: Dona Sônia hands a lunch tin wrapped in a cloth to Léo, smiling now.", "Sônia hands the tin; Léo takes it and runs in.")
cena("E090", "Oficina cheia: Léo, Rogério, Davi, Tomé e o Faísca", "CE40-O", "geral", "oficina", ["Léo", "Rogério", "Davi", "Tomé"], True,
     "The workshop: Léo and Rogério work on the locomotive, Davi sorts parts on the bench, Tomé hands Davi a washer, Faísca sleeps under the bench.",
     "everyone works; Faísca's ear twitches.")
cena("E091", "Close: o Faísca com graxa no focinho", "CE40-O", "close", "oficina", [], True,
     "Close-up of Faísca lying under the bench with a black smear of grease on his nose, looking proud.", "Faísca licks his nose.")
cena("E092", "Sala de aula: o Léo lê EM PÉ no fundo da sala", "CE06-R", "geral", "manha", ["Léo", "Prof. Regina", "Davi", "Clara"], False,
     "The classroom: at the back of the room Léo stands reading his book with a yellow ball in his hand; Davi and Clara sit at their desks; Regina at the front.",
     "Léo reads standing, shifting his weight from foot to foot.")
cena("E093", "Close: a bolinha amarela nova na mão do Léo", "CE06-R", "close", "manha", ["Léo"], False,
     "Close-up of a new small yellow rubber ball held tightly in Léo's hand.", "his fingers squeeze the ball.")
cena("E094", "Léo explica a caldeira para a turma inteira", "CE06-R", "geral", "manha", ["Léo", "Prof. Regina", "Davi", "Kenji", "Alice"], False,
     "Léo stands at the front of the classroom holding a drawing of a steam boiler, explaining; Davi, Kenji and Alice listen with wide eyes; Prof. Regina sits on an adult chair listening.",
     "Léo points to the drawing; the children lean forward.")
cena("E095", "Close: a Regina escrevendo o bilhete 49, sorrindo", "CE06-R", "close", "manha", ["Prof. Regina"], False,
     "Close-up of Prof. Regina writing a small note, smiling for the first time.", "she writes and smiles.")
cena("E096", "Close: a Sônia prende o bilhete na parede com alfinete", "CE39-I", "close", "noite", ["Dona Sônia"], False,
     "Close-up: Dona Sônia pins a small paper note on the cream wall beside the sewing machine with a sewing pin.", "she presses the pin into the wall and smiles.")
# 11 — festa da padroeira
cena("E097", "A pracinha em festa: bandeirinhas, banda, quentão (sem close)", "CE35-R", "geral", "tarde", [], False,
     "The little square decorated for the patron saint festival: colorful paper bunting flags crossing above, lanterns, a small stall with steaming cups, no people close to the camera (EMPTY square, the festival just set up).", "")
cena("E098", "Todo mundo na plataforma da estação", "CE40", "geral", "tarde", ["Dona Benedita", "Prof. Helena", "Marta", "Dona Sônia", "Davi", "Tomé"], False,
     "The station platform full for the festival: Dona Benedita, Prof. Helena, Marta, Dona Sônia, Davi and Tomé stand on the platform looking at the locomotive; bunting flags over the platform.",
     "everyone watches the locomotive, holding their breath.", FESTA)
cena("E099", "Rogério abre a válvula; o Léo do lado na cabine", "CE40", "media", "tarde", ["Rogério", "Léo"], False,
     "In the small cabin of the locomotive Rogério pulls a big lever while Léo watches beside him, both with grease on their faces.",
     "Rogério pulls the lever; Léo holds his breath.", FESTA)
cena("E100", "Close: a Dona Benedita faz o sinal da cruz", "CE40", "close", "tarde", ["Dona Benedita"], False,
     "Close-up of Dona Benedita on the platform making the sign of the cross, eyes closed.", "she makes the sign of the cross.", FESTA)
cena("E101", "O padre no meio da bênção, o apito toca na hora errada", "CE40", "media", "tarde", ["Padre Antônio"], False,
     "Padre Antônio on the platform with his hand raised in blessing, frozen in surprise with his eyebrows up, turning toward the locomotive.",
     "the priest jumps a little and turns his head.", FESTA)
cena("E102", "Close: o padre olha para o céu — 'entendi o recado'", "CE40", "close", "tarde", ["Padre Antônio"], False,
     "Close-up of Padre Antônio looking up at the sky with a resigned, funny smile.", "he looks up and smiles.", FESTA)
cena("E103", "Close: a roda do trem girando, fumaça branca", "CE40", "close", "tarde", [], False,
     "Close-up of the dark-red wheel of the locomotive starting to turn on the rail, soft white steam around it.",
     "the wheel turns slowly; white steam puffs (STEAM ALLOWED ONLY IN THIS SCENE).", FESTA)
cena("E104", "A Maria-Fumaça anda! Rogério e Léo acenando", "CE40", "geral", "tarde", ["Rogério", "Léo"], False,
     "The small steam locomotive moves slowly along the rails out of the station puffing white smoke from the chimney; Rogério and Léo lean out of the cabin waving.",
     "the locomotive rolls forward slowly with white smoke from the chimney (SMOKE ALLOWED ONLY IN THIS SCENE); they wave.", FESTA)
cena("E105", "Sônia acena com as duas mãos na plataforma, a Helena do lado", "CE40", "media", "tarde", ["Dona Sônia", "Prof. Helena"], False,
     "On the platform Dona Sônia waves with both hands high, laughing and crying; Prof. Helena beside her smiles.", "Sônia waves both hands.", FESTA)
cena("E106", "Close: o Léo sujo de graxa acenando, rindo", "CE40", "close", "tarde", ["Léo"], False,
     "Close-up of Léo leaning out of the locomotive cabin, waving, grease on his face, laughing.", "Léo waves and laughs.", FESTA)
# 12 — mensagem
cena("E107", "A sala de aula vazia no fim da tarde (sem gente)", "CE06-R", "geral", "tarde", [], False,
     "The empty classroom at the end of the afternoon, golden light on the desks, a small yellow ball on one desk at the back.", "")
cena("E108", "Helena e Léo na sala de recursos com a bolinha", "CE08", "media", "tarde", ["Prof. Helena", "Léo"], False,
     "In the resource room Prof. Helena and Léo laugh together, Léo tossing the yellow ball from hand to hand, Helena on an adult chair.",
     "Léo tosses the ball; Helena laughs.")
# 13 — gancho do Ep04
cena("E109", "Domingo: o trem parado na estação (sem gente)", "CE40", "geral", "manha", [], False,
     "Sunday morning at the station: the locomotive and its navy-blue passenger car stopped at the platform, the door of the car open.", "")
cena("E110", "Desce do trem uma menina com uma mala maior que ela", "CE40", "media", "manha", ["a menina do trem"], False,
     "A small girl with two long braids and a blue dress steps down from the passenger car onto the platform, holding a big old brown suitcase almost her size.",
     "the girl steps down carefully with the heavy suitcase.")
cena("E111", "Close: a menina de tranças, olhar sério", "CE40", "close", "manha", ["a menina do trem"], False,
     "Close-up of the girl's serious, silent face, braids with white ribbons.", "she blinks slowly and looks around.")
cena("E112", "A Helena diz 'bom dia'; a menina não responde", "CE40", "media", "manha", ["Prof. Helena", "a menina do trem"], False,
     "On the platform Prof. Helena bends down kindly to greet the girl; the girl holds her suitcase and says nothing.",
     "Helena smiles and waits; the girl stays silent.")
cena("E113", "Close: as mãos da menina apertando a alça da mala", "CE40", "close", "manha", ["a menina do trem"], False,
     "Close-up of the girl's small hands holding tight the handle of the big brown suitcase.", "her fingers tighten on the handle.")


def montar():
    cenas = []
    for s in S:
        cast, fichas = elenco(s["nomes"], s["cao"])
        lugar = s["lugar"]
        anexos = " + ".join(fichas)
        sem = not s["nomes"] and not s["cao"]
        if sem:
            obs = SEM_GENTE + CRIAR_LINHA.format(a=lugar, c=s["cod"])
        elif s["cam"] == "close":
            obs = CRIAR_LINHA.format(a=lugar + (" + " + anexos if anexos else ""), c=s["cod"])
        else:
            obs = ABRIR_LINHA.format(p=lugar, a=anexos, c=s["cod"])
        partes = []
        if s["cam"] == "geral" and not sem:
            partes.append("CAMERA (most important): EXACTLY the camera of the place image — the whole place visible; the people stay small in the middle of the scene, never close to the camera.")
        if not s["cam"] == "close":
            partes.append(MANTER)
        else:
            partes.append("The first attached image is the PLACE of this scene: the background must be that same place (same walls, colors, furniture), seen close.")
        partes += [ESTILO_CENA, s["txt"], CAM[s["cam"]], ESCALA, FILME.format(luz=LUZ[s["luz"]])]
        if s["nomes"]:
            partes.append(ROUPA + s["extra"])
        elif s["extra"]:
            partes.append(s["extra"].strip())
        partes.append(cast)
        if sem:
            partes.append("No people, no animals.")
        img = " ".join(partes)
        anim = ""
        if not sem:
            fumaca = "ALLOWED ONLY IN THIS SCENE" in s["acao"]
            anim = ANIM_BASE.format(acao=s["acao"], extra="" if fumaca else NADA)
        c = {"codigo": s["cod"], "descricao": s["desc"], "situacao": "falta", "obs": obs, "imagem": img,
             "duracao": "8s", "animacao": anim, "historico": []}
        espera = next((n for n in NOVOS if n in obs), "")
        if espera:
            ce = s["lugar"] if s["lugar"].startswith(("CE39", "CE40")) else "CE39"
            c["robo_revisar"] = f"espera {ce} (fichas novas do Ep03: o dono aprova no Kit primeiro)"
        cenas.append(c)
    return cenas


NOTAS = ("A RUA DE PEDRA · Episódio 03 — O menino que não parava (rascunho do Claude, 25/11/2026 — narração v1 AINDA SEM aprovação do "
         "dono; as cenas foram adiantadas a pedido do dono para o Flow não ficar parado). Narração: maestro-video-generator/docs/"
         "episodio-ilustrado/roteiros-estilo-novo/ep03_o-menino-que-nao-parava_narracao_v1.md. Ideia tirada do livro TDAH 2.0 (só a ideia). "
         "HISTÓRIA: o Rogério recebe a carta de que a oficina da estação vai fechar; o Léo (TDAH, bilhete todo dia) acha na oficina a "
         "'dificuldade certa' e ajuda a consertar a Maria-Fumaça; a Helena descobre que mexer o corpo ajuda o Léo a ler (bolinha amarela); a "
         "mãe, Dona Sônia, costureira, ouve pela primeira vez alguém falar bem do filho; festa da padroeira com o trem andando; gancho do Ep04: "
         "desce do trem uma menina que não fala. FICHAS NOVAS no Kit (gerar e APROVAR antes): PE19 Dona Sônia, PE20 Faísca (cachorro), PE21 "
         "Padre Antônio, PE22 menina do trem, CE39 casa do Léo (+CE39-I sala de costura, CE39-Q quarto), CE40 estação com a Maria-Fumaça "
         "(+CE40-O oficina por dentro). As cenas que usam essas fichas estão SEGURADAS ('espera CE39/CE40') e entram na fila sozinhas quando o "
         "dono aprova a ficha do lugar. As outras cenas (escola, pátio, sala de recursos, pracinha, cozinha do Davi) já podem gerar. "
         "FIGURINO Ep03: Léo de moletom vermelho; Rogério de macacão azul sujo de graxa (no jantar, paletó marrom). Fumaça/vapor só nas cenas "
         "E103 e E104 (o trem andando).")


def enviar():
    ls = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H), timeout=60))
    kit = next(e for e in ls if e["chave"] == "kit-mundo")
    ja = {c["descricao"] for c in kit["cenas"]}
    n = max(int(c["codigo"][1:]) for c in kit["cenas"] if c["codigo"][1:].isdigit())
    novos = []
    for desc, obs, img in KIT:
        if desc in ja:
            continue
        n += 1
        novos.append({"codigo": f"K{n}", "descricao": desc, "situacao": "falta", "obs": obs, "imagem": img, "conta_flow": "M"})
    cenas_kit = [{k: v for k, v in c.items() if not k.startswith(("drive_", "salvar_"))} for c in kit["cenas"]] + novos
    post({"chave": "kit-mundo", "cenas": cenas_kit, "notas": kit["notas"]})
    print("kit +", [c["codigo"] + " " + c["descricao"] for c in novos])
    if not any(e["chave"] == "rp-ep03" for e in ls):
        post({"chave": "rp-ep03", "titulo": "A Rua de Pedra · Ep03 — O menino que não parava", "conta_flow": "M", "ordem": 1,
              "cenas": montar(), "notas": NOTAS})
        print("rp-ep03 criado")


def post(corpo):
    r = urllib.request.urlopen(urllib.request.Request(U, data=json.dumps(corpo, ensure_ascii=False).encode(), headers=H, method="POST"), timeout=120)
    return json.load(r)


if __name__ == "__main__":
    cs = montar()
    print(len(cs), "cenas;", sum(1 for c in cs if c.get("robo_revisar")), "seguradas")
    print(cs[19]["obs"]); print(cs[19]["imagem"][:400])
    if sys.argv[1:] == ["enviar"]:
        enviar()
