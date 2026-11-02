"""BÍBLIA DA CONTA B + gerador de cenas por blocos fixos (01/11/2026).

Dono: "descrever com detalhes todas as cenas… todas que dependem da mesma imagem devem seguir um padrão descritivo e não no
achômetro… usa o modelo que te enviei" (video-prompt-builder: bloco fixo por plano + inventário mestre).
Regra: cada LUGAR, PESSOA, ROUPA, OBJETO e CÂMERA tem UM texto, escrito uma vez aqui. Toda cena é MONTADA só com esses
textos (copiados palavra por palavra) + a AÇÃO dela. Nada de descrever a sala ou a pessoa de novo em cada cena.
Uso: python3 biblia_contaB.py [--gravar]"""
import sys, json, re, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U, BLOCO

ESTILO = ("STYLE LOCK (match the attached ref-estilo-p04 exactly): cinematic painterly realism almost like a photograph painted in oil, realistic faces and "
          "hands with five fingers, fine canvas grain and crosshatched texture over the whole image, low golden side light. NOT a clean digital illustration, "
          "NOT a cartoon, NOT watercolor, NOT ink line drawing. No readable text anywhere. Lower right corner kept quiet. Real-world adult scale.")
REF = "REFERENCE ROLES: the attached ref-estilo-p04 is ONLY the painting-style reference — never copy its people or place. "
FIM_ANIM = " raw cinematic imperfect realism, subtle motion blur, natural film grain, uneven light falloff, lived-in textures."

# ---------------- LUGARES: o mapa vem do plano -A revisado no Kit (lido do Painel) + câmera do lugar ----------------
CAMERA = {
 "c02-sala-antiga-adulto": "wide interior frame at adult eye level, wide lens, left-heavy composition, warm daylight from the window on the camera-LEFT with soft falloff into the worn corners, muted amber and faded-blue palette, fine 35mm film grain",
 "c03-sala-nova": "medium-wide interior frame at adult eye level, medium lens, balanced composition, bright warm daylight from the two windows on the camera-LEFT, clean warm palette (white, light blue, terracotta, honey wood), fine film grain",
 "c04-escola-fachada": "wide establishing frame from the street just outside the gate, wide lens, balanced composition, low golden sun behind the building, long shadows of the gate bars toward the camera, warm ochre and white palette, light haze, fine 35mm film grain",
 "c07-hospital": "medium-wide interior frame from the doorway, medium lens, balanced composition, soft daylight from the window on the back wall through the half-curtain, muted green-grey and white palette, fine 35mm film grain",
 "c05-corredor-escola": "wide one-point-perspective frame along the veranda, wide lens, balanced composition, low golden sun from the camera-LEFT casting column shadows across the floor, warm white and terracotta palette, fine film grain",
 "c06-sala-equipe": "medium-wide interior frame along the table, medium lens, balanced composition, warm daylight from the window on the camera-LEFT, clean warm palette, fine film grain",
 "rua": "wide establishing frame of the small-town red dirt street, wide lens, balanced composition, low golden sun at the far end of the street, soft warm haze, long shadows toward the camera, warm desaturated ochre palette, fine 35mm film grain",
 "instituicao": "wide interior frame, wide lens, symmetrical cold composition, flat cold blue-grey light from small high windows, desaturated cold palette, fine 35mm film grain",
}
ROT_LUGAR = {"c02-sala-antiga-adulto": "sala antiga", "c03-sala-nova": "escola nova — sala", "c04-escola-fachada": "escola nova — fachada",
             "c07-hospital": "hospital", "c05-corredor-escola": "escola nova — corredor", "c06-sala-equipe": "escola nova — sala da equipe",
             "rua": "rua da cidade", "instituicao": "outra instituição"}
MAPA_EXTRA = {
 "c03-sala-nova": "PLACE LOCK — c03-sala-nova-A: [ANOS 80 · escola nova] CONDITION: new and clean — smooth fresh paint, nothing peeling or cracked. Walls white above, light-blue band on the lower part of the walls; on the left wall its top edge crosses both windows at about one third of their height, so the lower panes sit inside the blue band, terracotta skirting, shiny terracotta tile floor. LEFT WALL: exactly TWO tall windows with grey metal frames and many small panes, sun coming in. BACK WALL: ONE green blackboard in a thin wooden frame near the middle of the back wall; NO teacher's desk. RIGHT WALL: ONE brown wooden panel door near the back corner, closed, with a small light switch just camera-RIGHT of it; ONE wall-mounted wooden shelf on two brackets near the front, holding a stack of coloured wooden blocks and one wooden shape-puzzle board. CENTER: exactly TEN single student desks (light wooden tops, metal legs) facing the blackboard: THREE in the camera-LEFT column, THREE in the camera-RIGHT column and FOUR in the middle column; the middle column's nearest desk, closest to the camera, has its chair standing at its camera-LEFT end, turned sideways, backrest toward the camera-left, seat half under the desk top; each of the other nine desks has ONE chair on its camera side (grey metal tube frame, wooden seat and back)." + " Every fixed element keeps exactly this position, size and design: never add, move, duplicate or redesign walls, doors, windows, gates or furniture.",
 "c04-escola-fachada": "PLACE LOCK — c04-escola-fachada-A: [ANOS 80 · fachada da escola nova] CONDITION: well kept. Camera on the street just outside the gate, adult eye level; the gate and the walls fill the lower two thirds of the frame, open sky and trees above their top rail, a strip of pale pavement in front of them at the bottom of the frame. FOREGROUND: ONE thick off-white plastered wall section on each side (camera-left and camera-right); between them ONE double gate of vertical grey metal bars with ONE horizontal crossbar at mid-height and a metal latch with a small padlock where the two leaves meet in the centre; CLOSED by default — both leaves shut, the courtyard and the building visible through the bars; it is open ONLY in a scene that says so, and then both leaves swing inward into the courtyard. COURTYARD: wide, flat, pale beige packed ground; a low plastered side wall runs along camera-left, leafy trees behind it. BACK: ONE long single-storey building, white walls with a light-blue band at the bottom, red clay-tile roof, louvered windows; on camera-right a wing with an open veranda of square white columns. SCALE (real-world sizes, never shrink people): the gate and the plastered walls are a normal 2 metres tall, open sky and trees visible above them; the mid-height crossbar is at the WAIST of an adult standing at the gate line, whose head reaches about the gate's top rail; a child of 8–9 at the gate line reaches a little above the crossbar; people deeper in the courtyard get smaller only by distance, and an adult beside the building is as tall as its doors. DEPTH: the courtyard is long and wide; the building stays FAR back at the end of it, exactly where it is in c04-escola-fachada-A, never moved closer to the gate. TREES: the young slender trees exactly as they are in c04-escola-fachada-A, just right of the gate's centre line, the nearest one in a small square planter; branches of one big tree overhang the top-right corner from outside the wall." + " Every fixed element keeps exactly this position, size and design: never add, move, duplicate or redesign walls, doors, windows, gates or furniture.",
 "c07-hospital": "PLACE LOCK — c07-hospital-A: [ANOS 80 · hospital da cidade] A small 1980s ward room seen from its open doorway at adult eye level: the dark wooden door frame shows along the left and right edges of the image. CONDITION: old but clean — pale cream-green walls above, darker green paint on the lower half, cracks and a few peeling patches, worn red-brown tile floor. ONE old white-painted metal hospital bed with rust spots stands on the camera-LEFT half along the back wall, headboard at the camera-left, foot rail toward the camera-RIGHT; thin mattress, white sheet, one white pillow at the camera-left end. At the head of the bed, against the left wall: ONE small white metal bedside cabinet with ONE white enamel cup. Behind the head of the bed: ONE metal IV drip stand with one glass bottle. BACK WALL, right of centre: ONE window with a white half-curtain. Back-right corner, against the back wall: ONE simple dark wooden chair. Nothing else; the lower-right corner is plain tiled floor." + " Every fixed element keeps exactly this position, size and design: never add, move, duplicate or redesign walls, doors, windows, gates or furniture.",
 "c05-corredor-escola": "PLACE LOCK — c05-corredor-escola-A: [ANOS 80 · escola nova] The covered veranda corridor seen from one end at adult eye level, one-point perspective. RIGHT SIDE: white wall with a light-blue band on the lower part and terracotta skirting, with FOUR brown wooden panel doors, all CLOSED by default — the large one nearest the camera, then three more further along, each seen almost edge-on as narrow brown frames; at the far end of the corridor ONE small very dark green door in a brown frame, closed. A door is open ONLY in a scene that says so. LEFT SIDE: open to the sunny courtyard between a row of SIX square white columns on terracotta bases, the nearest one large at the camera-left edge; beyond them the pale courtyard, one young tree in a square planter, the low perimeter wall and a white single-storey wing with a light-blue band and red tile roof. FLOOR: shiny terracotta tiles. CEILING: red clay tiles on dark wooden rafters. Low golden sun from the camera-LEFT casting the column shadows across the floor." + " Every fixed element keeps exactly this position, size and design: never add, move, duplicate or redesign walls, doors, windows, gates or furniture.",
 "rua": "PLACE LOCK — rua (the street of n5-S03a): keep exactly the same red dirt street, the same houses on both sides, doors, windows, walls and poles as in n5-S03a.",
 "instituicao": "",
}

# ---------------- PESSOAS: um texto fixo (sem roupa) + roupas por letra ----------------
PESSOA = {
 "f01-educadora": "THE EDUCATOR (f01-educadora): Brazilian woman of about 50, light-brown skin, dark hair with grey streaks in a low bun, round tortoiseshell glasses; hands of a 50-year-old, not elderly",
 "f05-professora-jovem": "THE YOUNG TEACHER (f05-professora-jovem): Brazilian woman of about 30, medium-brown skin, long black hair in a single braid, no grey hair; cream short-sleeved blouse, dark-grey knee-length skirt, flat black shoes",
 "f06-medico": "THE DOCTOR (f06-medico): Brazilian man of about 45, short dark hair, no grey; white coat over a light shirt and dark tie, stethoscope, dark trousers",
 "f07-merendeira": "THE SCHOOL COOK (f07-merendeira): Brazilian woman of about 50, dark skin, short curly black hair under a white headscarf; white apron over a light-green cotton dress with a small faded floral print, flip-flops",
 "f04-menino": "THE LITTLE BOY (f04-menino): EXACTLY 3 years old (85–90 cm), very thin, cerebral palsy — he never stands or walks, he is always sitting propped on cushions or lying down; light-brown skin, dark messy hair",
 "f02-adolescente": "THE TEENAGE BOY (f02-adolescente): about 15, thin, light-brown skin, short dark hair",
 "f03-mae-adolescente": "THE TEEN'S MOTHER (f03-mae-adolescente): Brazilian woman of about 42, medium-brown skin, black hair in a low ponytail; plain dark-red cotton dress, beige cardigan, flat brown shoes",
 "f08-aluna-down": "THE GIRL WITH DOWN SYNDROME (f08-aluna-down): about 8, dark-brown chin-length bob with straight bangs, light-blue short-sleeved cotton dress with a small faded floral print, white ankle socks, black Mary-Jane shoes",
 "f09-aluna-cadeira": "THE GIRL IN THE WHEELCHAIR (f09-aluna-cadeira): about 9, dark hair in a ponytail, pink t-shirt, dark-grey skirt, flip-flops, always sitting in her simple metal wheelchair with large spoked wheels and a dark-grey vinyl seat",
 "f10-aluno-muletas": "THE BOY ON CRUTCHES (f10-aluno-muletas): about 9, short messy black hair, beige t-shirt, faded GREY-blue shorts, grey socks, dark canvas sneakers, always with his two wooden underarm crutches (standing on them, or leaning beside him when he sits)",
 "f11-aluno-quebra-cabeca": "THE PUZZLE BOY (f11-aluno-quebra-cabeca): about 8, short black hair, plain beige t-shirt, NAVY-blue shorts, white socks, blue canvas sneakers, no crutches",
 "f12-aluno-crise": "THE OLDER STUDENT (f12-aluno-crise): about 15, brown hair, grey t-shirt, jeans, grey sneakers, NO blanket or shawl on his shoulders — clearly different from the teenage boy",
}
ROUPA = {
 ("f01-educadora", "A"): "OUTFIT A: faded light-blue chambray shirt with rolled sleeves, olive-grey trousers, brown flat shoes",
 ("f01-educadora", "B"): "OUTFIT B (festa junina): checked cotton blouse in muted red and a long beige skirt, brown flat shoes",
 ("f02-adolescente", "A"): "OUTFIT A: plain white t-shirt, navy-blue cotton shorts, worn sneakers",
 ("f02-adolescente", "B"): "OUTFIT B (festa junina): plaid cotton shirt, navy shorts, straw hat",
 ("f04-menino", "A"): "OUTFIT A: mustard-yellow t-shirt, beige shorts, barefoot",
 ("f04-menino", "B"): "OUTFIT B: plain white hospital gown, barefoot",
}
FOLHA_ROUPA = {"f01-educadora": "f01-educadora-roupas", "f02-adolescente": "f02-adolescente-roupas", "f04-menino": "f04-menino-roupas"}
OBJETO = {
 "obj-15-blocos-madeira": "the small painted wooden cubes in red, yellow, blue and green, with a few unpainted natural-wood cubes, worn edges, from obj-15-blocos-madeira",
 "obj-14-cadeira-de-rodas": "the simple metal wheelchair with large spoked wheels from obj-14-cadeira-de-rodas",
}
ESTADO = {"portao-aberto": "THE GATE IS OPEN in this shot: both grey metal leaves swung fully inward against the inner side of the walls, the latch and padlock hanging open; the courtyard is seen through the empty gateway.",
          "portao-fechado": "THE GATE IS CLOSED in this shot."}

# ---------------- CENAS: base + plano + pessoas (código, roupa, onde) + objetos + estado + ação + animação ----------------
# base: "A:<lugar>" abre o plano -A; "S:<cena>" abre outra cena (gera depois dela); "C:<cena>" CRIAR close com o fundo da cena;
# "COPIA:<img>" não gera imagem (recorte na montagem). plano: GERAL / MÉDIO / CLOSE / INSERT.
E = "f01-educadora"; J = "f05-professora-jovem"; M = "f04-menino"; T = "f02-adolescente"; MT = "f03-mae-adolescente"
N5 = {
 "S01a": ("A:c02-sala-antiga-adulto", "GERAL", [(E, "A", "standing at the camera-LEFT end of the old wooden table, one hand resting on a large blank sheet of paper on the table, seen in three-quarter profile, the window on the camera-LEFT behind her")], [], None,
          "the educator looks around the empty old room with quiet determination, morning light", "she turns her head slowly from the window toward the room; end still"),
 "S01b": ("C:n5-S01a", "INSERT", [(E, "A", "only her hands and chambray sleeves in frame")], [], None,
          "close insert on the small old wooden table: the educator's hands sketch a simple floor plan of a school building (lines and rectangles only, no letters, no numbers) with a pencil on a large sheet of paper", "the pencil draws one more line; end still"),
 "S02": ("A:c02-sala-antiga-adulto", "MÉDIO", [(E, "A", "standing at the camera-LEFT end of the table"), (J, None, "standing at the camera-RIGHT end of the table")], [], None,
         "the two women talk across the table with warm, motivated expressions; only these two people", "the educator gestures with one open hand, the young teacher nods; end still"),
 "S04": ("A:c04-escola-fachada", "GERAL", [], [], "portao-aberto",
         "This shot OVERRIDES the BACK building of the PLACE LOCK only: same position and size, FAR back at the end of the courtyard, never closer to the gate, but under construction — earlier in time: the building is half built — exposed red bricks, wooden scaffolding, roof frame without tiles; inside the courtyard, between the gate and the building, three ordinary 1980s townspeople (adult men and women in simple work clothes, normal adult size by the SCALE rule) seen from behind and in three-quarter back view, walking AWAY from the camera toward the building: one carries bricks, one pushes a wheelbarrow toward the scaffolding, one hands bricks up to the wall; piles of bricks on the ground next to the building; nobody faces or walks toward the gate", "the volunteers take a few steps AWAY from the camera toward the building with the bricks and the wheelbarrow, dust in the sun; nobody turns toward the gate; end still"),
 "S05": ("A:c02-sala-antiga-adulto", "GERAL", [(E, "A", "standing behind the table on the camera-LEFT"), (J, None, "standing behind the table on the camera-RIGHT"),
          ("f08-aluna-down", None, "sitting on the school chair at the camera-LEFT side of the table"), ("f09-aluna-cadeira", None, "in her wheelchair at the camera-RIGHT side of the table; exception to the PLACE LOCK in this shot only: that side's school chair stands against the back wall to the left of the straw mat"), ("f11-aluno-quebra-cabeca", None, "sitting on the far chair, facing the camera")],
         ["obj-15-blocos-madeira", "obj-14-cadeira-de-rodas"], None,
         "the near chair (back to the camera) stays empty; a small special class: the three students work with the wooden cubes and picture cards on the table, the two teachers help; exactly two teachers and three students, nobody else", "the students move the cubes slowly, a teacher points to a card; end still"),
 "S06a": ("COPIA:c04-escola-fachada-A", "GERAL", [], [], None, "", "nothing moves except dust in the low sun and the leaves of the young trees; end still"),
 "S07a": ("A:c03-sala-nova", "MÉDIO", [(E, "A", "kneeling beside the front-left desk"), ("f11-aluno-quebra-cabeca", None, "sitting at the front-left desk")], [], None,
          "the educator watches with full attention while the boy fits a wooden puzzle piece; both faces visible", "the boy presses the puzzle piece into place, she smiles a little; end still"),
 "S08a": ("A:c07-hospital", "GERAL", [(M, "B", "lying on the hospital bed under the white sheet, head on the pillow")], [], None,
          "the little boy, interned for severe malnutrition, lies calm with his eyes open; nobody else", "his chest rises and falls slowly, his eyes blink; end still"),
 "S08b": ("S:n5-S08a", "GERAL", [(M, "B", "same place on the bed"), ("f06-medico", None, "standing at the foot rail of the bed, between the bed and the wooden chair, facing the boy")], [], None,
          "add only the doctor, holding a clipboard (no readable text), serious, looking at the chart", "the doctor turns one page of the chart; end still"),
 "S09": ("A:c02-sala-antiga-adulto", "GERAL", [(M, "A", "sitting on the straw mat under the right half of the blackboard, propped by the two cushions"),
          (E, "A", "kneeling beside him on his camera-LEFT"), (J, None, "standing behind the table in front of the empty shelf, looking toward the boy")], [], None,
         "the team around the little boy; only these three people", "the educator rests a hand on the cushion beside him; end still"),
 "S10a": ("S:n5-S09", "GERAL", [(M, "A", "same place on the mat"), (E, "A", "kneeling beside him")], [], None,
          "remove the young teacher; the educator gently feeds the boy with a spoon from a simple white enamel bowl of porridge", "the spoon comes slowly to his mouth; end still"),
 "S10b": ("S:n5-S09", "GERAL", [(M, "A", "lying on his back along the straw mat, parallel to the back wall, head on the floral cushion, feet toward the camera-RIGHT; the beige cushion stays against the wall"), (E, "A", "kneeling on the floor on the camera side of the mat, beside his knees, turned three-quarters toward him so her face is visible")], [], None,
          "remove the young teacher; the educator gently bends and stretches his thin legs in a simple physiotherapy exercise; he smiles a little", "she bends his knee slowly and stretches it back; end still"),
 "S10c": ("C:n5-S10b", "INSERT", [(M, "A", "only his small thin hands"), (E, "A", "only her hands and chambray sleeve")], ["obj-15-blocos-madeira"], None,
          "close insert on the straw mat: the boy's small thin hands touch the wooden cubes held out by the educator's hands (hands of a 50-year-old woman, not elderly)", "his fingers close slowly around one cube; end still"),
 "S13": ("A:c04-escola-fachada", "GERAL", [], [], "portao-aberto",
         "nobody in the image; warm late-afternoon sunlight floods through the open gate into the courtyard, a hopeful, open feeling", "the light grows slightly warmer, dust floats in the beam; end still"),
 "S14": ("C:c03-sala-nova-A", "INSERT", [], [], None,
         "close insert on the light wooden top of the front student desk: a tall stack of old paper medical reports and folders (no readable text) and beside it one small wooden puzzle piece; the blue-banded wall and the blackboard soft in the background", "dust floats in the window light; nothing moves; end still"),
 "S15": ("A:c03-sala-nova", "MÉDIO", [(E, "A", "standing in front of the blackboard on the camera-LEFT"), ("f11-aluno-quebra-cabeca", None, "standing beside her on the camera-RIGHT")], [], None,
         "a daily routine board of picture cards (sun, plate, book, ball, house — drawings only, no words) is taped to the blackboard; she points to the next card and he follows it with his finger", "his finger moves to the next card; end still"),
 "S16a": ("A:c04-escola-fachada", "GERAL", [(E, "A", "center"), (J, None, "camera-left of the educator"), ("f07-merendeira", None, "camera-right of the educator"),
          ("f08-aluna-down", None, "in front, camera-left"), ("f10-aluno-muletas", None, "in front, center"), ("f11-aluno-quebra-cabeca", None, "in front, camera-right")], [], "portao-aberto",
          "the school team stands together in the courtyard just inside the open gateway, about three metres behind the gate line, facing the camera, smiling; adults' heads at about the height of the gate's top rail; exactly these six people", "they smile and the children wave a little; end still"),
 "S16b": ("A:c03-sala-nova", "MÉDIO", [("f11-aluno-quebra-cabeca", None, "standing beside the front-center desk facing the camera"), (E, "A", "standing behind him, slightly to the camera-right")], [], None,
          "the boy proudly holds up a colourful drawing (shapes and colours only, no letters) toward the camera with a big smile; the educator smiles behind him", "he lifts the drawing a little higher; end still"),
 "S17": ("A:c04-escola-fachada", "GERAL", [], [], "portao-fechado",
         "nobody in the image; the same school at sunset, warm orange sky, longer shadows, a few windows softly lit", "the sky glows slightly deeper; end still"),
}
N8 = {
 "E01": ("COPIA:n5-S06a", "GERAL", [], [], None, "", "nothing moves except dust in the low sun and the leaves of the young trees; end still"),
 "E18": ("COPIA:n5-S07a", "MÉDIO", [], [], None, "", "the boy presses the puzzle piece into place, she smiles a little; end still"),
 "E19": ("COPIA:n5-S14", "INSERT", [], [], None, "", "dust floats in the window light; nothing moves; end still"),
 "E34": ("COPIA:n5-S13", "GERAL", [], [], None, "", "the light through the open gate grows slightly warmer, dust in the beam; end still"),
 "E37": ("COPIA:n5-S17", "GERAL", [], [], None, "", "the sunset sky glows slightly deeper; end still"),
 "E02": ("A:c03-sala-nova", "GERAL", [(E, "A", "at the front-left desks"), (J, None, "at the back-right desks")], ["obj-15-blocos-madeira"], None,
         "first day ready: the two women place new materials (the wooden cubes, pencils, paper) on the desks; only these two", "they set one more item on a desk; end still"),
 "E03": ("A:c04-escola-fachada", "GERAL", [(MT, None, "on the street side at the open gateway, just left of the centre line, facing the courtyard, pulling the boy by the arm"), (T, "A", "just right of the centre line, facing the camera with his back to the school, leaning back, resisting; keep the lower-right corner empty pavement")], [], "portao-aberto",
         "the mother pulls her teenage son toward the school; he resists, crying; both stay on the street side of the gate, nobody passes through it", "she tugs his arm once, he leans back; end still"),
 "E04": ("C:n8-E03", "CLOSE", [(T, "A", "head and shoulders, centered")], [], None,
         "medium close-up of the teenage boy's crying face, tears on his cheeks, hurt and defiant; behind him, soft and out of focus, the open gateway: the pale courtyard and the white building with the light-blue band, one open grey gate leaf at the edge of the frame, exactly as in n8-E03", "a tear runs down, he presses his lips together; end still"),
 "E05": ("S:n8-E03", "GERAL", [(MT, None, "same place"), (T, "A", "same place"), (E, "A", "small in the frame at the edge of the veranda on the camera-RIGHT wing, looking toward the gate")], [], "portao-aberto",
         "add only the educator, far away on the veranda, watching the mother and the boy with calm attention; they stay exactly where they are", "she lifts her chin slightly as she watches; end still"),
 "E06": ("S:n8-E03", "GERAL", [(MT, None, "same place"), (T, "A", "same place"), (E, "A", "standing just inside the open gate, facing them")], [], "portao-aberto",
         "add only the educator, bending slightly toward the boy with an open, calm hand; the mother and the boy stay exactly where they are", "her open hand moves a little toward him; end still"),
 "E07": ("COPIA:n8-E06", "MÉDIO", [], [], None, "", "the educator speaks gently, the mother listens, the boy slowly looks up; end still"),
 "E08": ("S:n5-S03a", "GERAL", [], [], None,
         "add a few townspeople of the 1980s at their doorways and windows looking down the street with suspicion, including two women standing together at the doorway of the nearest house on the camera-LEFT", "a curtain moves, the two women lean toward each other; end still"),
 "E09": ("COPIA:n8-E08", "MÉDIO", [], [], None, "", "one of the two women covers her mouth and whispers to the other; end still"),
 "E10": ("A:c03-sala-nova", "MÉDIO", [(E, "A", "standing alone by the first window on the camera-LEFT wall")], [], None,
         "the educator stands alone in the empty classroom, thinking, looking out of the window", "she breathes slowly, her fingers touch the window frame; end still"),
 "E11": ("A:c03-sala-nova", "GERAL", [(T, "A", "sitting at the front desk of the camera-LEFT column")], [], None,
         "the teenage boy sits alone, arms crossed, looking away, closed; nobody else", "he shifts slightly and keeps looking away; end still"),
 "E12": ("S:n8-E11", "GERAL", [(T, "A", "same place"), (E, "A", "sitting on the sideways chair at the camera-LEFT end of the nearest middle-column desk, right next to him on his camera-RIGHT, turned toward him (no chair is moved)")], [], None,
         "add only the educator, explaining something calmly with open hands", "her hands open slowly as she talks; end still"),
 "E13": ("S:n8-E12", "GERAL", [(T, "A", "same place"), (E, "A", "same place")], [], None,
         "change only the boy: his arms are now uncrossed, he nods slightly with a small tentative smile", "he nods once; end still"),
 "E14": ("A:c03-sala-nova", "GERAL", [(J, None, "beside the front-left desks, helping"), ("f08-aluna-down", None, "at the front-left desk"), ("f09-aluna-cadeira", None, "in her wheelchair at the second desk of the camera-LEFT column; that desk's chair stands against the camera-LEFT wall below the window"),
          ("f10-aluno-muletas", None, "at the front-right desk"), ("f11-aluno-quebra-cabeca", None, "at the second-right desk"), ("f12-aluno-crise", None, "at the back-right desk"), (E, "A", "standing in the middle column beside the nearest desk, behind its sideways chair, between the two groups")], ["obj-14-cadeira-de-rodas"], None,
         "two groups by autonomy, not by label: on the camera-left the students who need constant help with the young teacher beside them; on the camera-right a group working more independently", "the young teacher guides a hand, the educator looks from one group to the other; end still"),
 "E15": ("S:n8-E14", "GERAL", [], [], None, "the young teacher helps the girl with Down syndrome eat with a spoon; the educator steps from the middle to behind the wheelchair and pushes it a little closer to the desk", "the wheelchair rolls a few centimetres, the spoon rises; end still"),
 "E16": ("S:n8-E14", "GERAL", [], [], None, "change only the camera-right group: the three boys draw and write in notebooks (no readable letters) and the educator (not the young teacher) walks among them; the young teacher stays with the camera-left group", "a pencil moves, the educator bends over a desk; end still"),
 "E17": ("A:c05-corredor-escola", "GERAL", [], [], None,
         "THE DOORS IN THIS SHOT: the near door and the second door on the right wall are OPEN, each leaf swung inward into its classroom; through the near open door a glimpse of a few students at desks; the second door, seen almost edge-on, shows only a narrow warm gap of classroom light; the other doors stay closed. Nobody in the corridor itself", "dust floats in the sun between the columns; end still"),
 "E20": ("A:c06-sala-equipe", "GERAL", [(E, "A", "sitting on the farthest chair on the camera-RIGHT side of the table, next to the cupboard, turned three-quarters toward the camera"), (J, None, "sitting on the farthest chair on the camera-LEFT side, facing the educator across the table"), ("f07-merendeira", None, "sitting on the middle chair on the camera-RIGHT side, beside the educator")], [], None,
         "a team meeting without a boss: the three women talk as equals around the table, nobody standing at the head; only these three; the three nearest chairs stay empty; no chair is added at the ends of the table", "they lean in slightly while one talks; end still"),
 "E21": ("S:n8-E20", "GERAL", [], ["obj-15-blocos-madeira"], None, "change only this: the young teacher demonstrates something with the wooden cubes on the table while the other two lean in to watch", "the cubes are moved into a small row; end still"),
 "E22": ("S:n8-E20", "GERAL", [], [], None, "change only the cook's face and posture: she listens attentively and nods", "the cook nods slowly; end still"),
 "E23": ("A:c05-corredor-escola", "GERAL", [("f07-merendeira", None, "standing beside the first door on the right wall, which stays closed"), (J, None, "standing beside the cook"), ("f11-aluno-quebra-cabeca", None, "walking toward them along the corridor")], [], None,
         "every adult treats the student the same way: the cook and the young teacher greet the boy with the same warm smile", "they raise a hand to greet him; end still"),
 "E24": ("S:n8-E11", "GERAL", [(T, "A", "same place, now relaxed")], [], None, "change only the boy: he now sits relaxed at the desk, drawing on a sheet of paper, with a calm small smile", "his pencil moves slowly; end still"),
 "E25": ("CRIAR:instituicao", "GERAL", [], [], None,
         "(in this shot the light is cold and flat, not golden) a cold grey 1980s institution hallway with bare walls, high small windows, a few children sitting silently on a long bench, sad atmosphere", "nothing moves except dust in the cold light; end still"),
 "E26": ("A:c04-escola-fachada", "GERAL", [("f08-aluna-down", None, "camera-left, laughing"), ("f09-aluna-cadeira", None, "center, laughing with the puzzle boy"), ("f11-aluno-quebra-cabeca", None, "beside the wheelchair"), ("f10-aluno-muletas", None, "camera-right, on his crutches")], ["obj-14-cadeira-de-rodas"], "portao-fechado",
         "the school remembered for its joy, seen through the bars of the closed gate: these four children and three more ordinary children play and laugh in the middle of the courtyard, between the gate and the building, normal child size by the SCALE rule, some running sideways across it; nobody comes toward the gate", "children run a few steps sideways across the courtyard, staying inside it, nobody runs toward or through the gate; the wheelchair turns; end still"),
 "E27": ("A:c03-sala-nova", "GERAL", [(T, "A", "sitting at the second desk of the middle column, just behind the nearest desk"), ("f08-aluna-down", None, "front-left desk"), ("f10-aluno-muletas", None, "front-right desk"), ("f11-aluno-quebra-cabeca", None, "second-left desk"), ("f12-aluno-crise", None, "second-right desk"), (J, None, "standing among the desks"), (E, "A", "standing by the blackboard")], [], None,
         "the classroom full of warm light, all students engaged and smiling in their activities", "heads bend over the work, small smiles; end still"),
 "E28": ("A:c04-escola-fachada", "GERAL", [(T, "A", "already inside the courtyard, walking toward the building, seen from behind"), (MT, None, "on the street side outside the open gate, waving")], [], "portao-aberto",
         "next morning: the teenage boy walks to school on his own, smiling slightly; his mother waves from outside the gate; nobody passes through the gate in this shot", "he walks two steps away, she waves; end still"),
 "E29": ("A:c04-escola-fachada", "GERAL", [], [], "portao-aberto",
         "the courtyard decorated for a festa junina: colourful paper flag garlands (bandeirinhas) strung across, a small unlit bonfire structure of logs, late afternoon light; nobody yet", "the bandeirinhas flutter in the breeze; end still"),
 "E30": ("S:n8-E29", "GERAL", [("f08-aluna-down", None, "dancing with the puzzle boy"), ("f11-aluno-quebra-cabeca", None, "dancing with her"), ("f09-aluna-cadeira", None, "in her wheelchair"), ("f12-aluno-crise", None, "holding her hands, dancing beside her wheelchair"), (T, "B", "dancing with an ordinary girl")], ["obj-14-cadeira-de-rodas"], "portao-aberto",
         "pairs of students dance a quadrilha; the named children wear the clothes of their sheets plus a small straw hat; only the two more ordinary pairs of children wear checked shirts and simple dresses; the dancing pairs are in the near half of the courtyard, a few metres inside the open gateway, normal size by the SCALE rule, turning in place and moving sideways; nobody moves toward or through the gate", "the pairs step and turn in place, staying inside the courtyard; nobody comes toward the gate; end still"),
 "E31": ("S:n8-E30", "GERAL", [], [], "portao-aberto", "change only the dance: it has become joyfully messy, pairs going sideways and in small circles inside the courtyard, laughing; nobody comes toward or through the gate", "the pairs bump and laugh, moving sideways inside the courtyard; nobody comes toward the gate; end still"),
 "E32": ("S:n8-E30", "GERAL", [(E, "B", "standing in the foreground on the camera-LEFT, just inside the gate")], [], "portao-aberto",
         "add only the educator watching the dance, hands together near her chest, moved and smiling", "her eyes fill a little, she smiles; end still"),
 "E33": ("C:n8-E30", "MÉDIO", [(T, "B", "center, medium shot")], [], None,
         "the teenage boy dances and laughs openly; behind him, soft and out of focus, the bandeirinhas, the courtyard and the dancing pairs exactly as in n8-E30", "he turns and laughs; end still"),
 "E35": ("S:n8-E06", "GERAL", [(MT, None, "same place"), (T, "A", "same place"), (E, "A", "same place")], [], "portao-aberto",
         "change only this: the educator rests her hand gently on the teenager's shoulder; he looks at her and calms down", "his shoulders drop as he breathes out; end still"),
 "E36": ("A:c04-escola-fachada", "GERAL", [(E, "A", "walking in the courtyard toward the building, seen from behind at a slight angle"), (T, "A", "walking beside her on her camera-right")], [], "portao-aberto",
         "the educator and the teenager walk together across the courtyard toward the school building; nobody else", "they walk two steps side by side AWAY from the camera toward the school building, seen from behind; nobody turns toward the gate; end still"),
}


def mapas_do_kit(kit):
    out = {}
    for c in kit["cenas"]:
        d = c.get("descricao") or ""
        if not d.endswith("-A"):
            continue
        t = c["imagem"]
        m = re.search(r"PLACE LOCK — [^:]+: (.*?)(?= STYLE|$)", t, re.S)
        corpo = m.group(1).strip() if m else (re.search(r"(\[ANOS 80[^\]]*\].*?)(?= Every fixed element| STYLE|$)", t, re.S) or [None, ""])[1]
        corpo = re.sub(r"No people\.\s*|No readable text\.\s*", "", corpo).strip()
        out[d[:-2]] = f"PLACE LOCK — {d}: {corpo} Every fixed element keeps exactly this position, size and design: never add, move, duplicate or redesign walls, doors, windows, gates or furniture."
    return out


KIT_PEND = set()  # itens do Kit B ainda a gerar (lido do Painel)


def montar(pref, cod, spec, mapas, pend):
    base, plano, pessoas, objs, estado, acao, anim = spec
    tipo, alvo = base.split(":", 1)
    lugar = None
    if tipo == "A":
        lugar = alvo
    elif tipo in ("S", "C", "COPIA"):
        lugar = alvo[:-2] if alvo.endswith("-A") else LUGAR_DE.get(alvo)
    elif tipo == "CRIAR":
        lugar = alvo
    anexos = []
    for p, letra, onde in pessoas:
        if tipo == "S" and onde.startswith("same place"):
            continue  # já está na imagem aberta: anexar de novo faz o Flow redesenhar
        f = FOLHA_ROUPA.get(p) if letra else None
        nome = f or p
        if nome not in anexos:
            anexos.append(nome)
    for o in objs:
        anexos.append(o)
    epoca = f"[ANOS 80 · {ROT_LUGAR.get(lugar, 'escola nova')} · {plano}]"
    if tipo == "COPIA":
        espera = f" (SOMENTE depois que a nova {alvo} estiver pronta)" if (alvo in pend or alvo in KIT_PEND) else ""
        obs = f"NÃO GERAR IMAGEM: apagar a {pref}{cod} antiga (se existir), copiar a imagem {alvo}{espera} e salvar como {pref}{cod} · ANIMAR com o texto abaixo · montagem: recorte (aproximar) conforme a cena"
        return epoca, obs, "NÃO GERAR IMAGEM — cópia de " + alvo, BLOCO + f"CAMERA: static, no pan. ACTION: {anim}. ACTING: one small physical sign of the emotion. LIGHT AND AMBIENCE: the existing light only. INTEGRITY: stable faces, hands with five fingers; walls, doors, gate and furniture do not move; nobody passes through doors or gates." + FIM_ANIM
    if tipo == "A":
        espera = f" (SOMENTE depois que o Kit {alvo}-A estiver pronto e salvo)" if f"{alvo}-A" in KIT_PEND else ""
        obs = f"ABRIR {alvo}-A{espera}"
        if estado == "portao-aberto":
            abertura = (f"OPENED IMAGE = {alvo}-A. Keep the place, camera position, walls, building, trees and light exactly; the ONLY change to the fixed "
                        "elements is the gate, which is OPEN in this shot.")
        else:
            abertura = f"OPENED IMAGE = {alvo}-A. Keep the place, camera position, walls, doors, windows, gate, furniture and light exactly as they are; only add or change what the SHOT says."
        if plano == "MÉDIO":
            obs += " · montagem: recorte (aproximar) para plano médio"
    elif tipo == "S":
        espera = f" (SOMENTE depois que a nova {alvo} estiver pronta e salva com o mesmo nome)" if alvo in pend else ""
        obs = f"ABRIR {alvo}{espera}"
        abertura = f"OPENED IMAGE = {alvo}. Keep the place, camera, light, every person already in it (same faces, same clothes, same positions) and every object exactly; only add or change what the SHOT says."
    elif tipo == "C":
        espera = f" (SOMENTE depois que a nova {alvo} estiver pronta)" if alvo in pend else ""
        obs = f"CRIAR (barra de baixo · Imagem · 16:9) · ANEXAR {alvo}{espera}"
        anexos = [a for a in anexos if a != alvo]
        if alvo.endswith("-A"):
            abertura = f"The attached image {alvo} is the same empty place seen wider; BACKGROUND EXACTLY AS IN {alvo}."
        else:
            abertura = f"The attached image {alvo} is the SAME moment and place seen wider: same light, same people, same clothes. New closer framing as described in the SHOT; BACKGROUND EXACTLY AS IN {alvo}."
    else:
        obs = "CRIAR (barra de baixo · Imagem · 16:9)"
        abertura = "One single 16:9 image."
    marcados = [a + (" (SOMENTE depois que o Kit " + a + " estiver pronto no Flow da Conta B)" if a in KIT_PEND else "") for a in anexos]
    obs += " · ANEXAR " + " + ".join(marcados + ["ref-estilo-p04"]) if "ANEXAR" not in obs else " + " + " + ".join(marcados + ["ref-estilo-p04"])
    linhas_pessoas = []
    for p, letra, onde in pessoas:
        txt = PESSOA[p]
        if letra:
            txt += "; " + ROUPA[(p, letra)] + f" (from {FOLHA_ROUPA[p]})"
        linhas_pessoas.append(f"{txt} — WHERE: {onde}")
    partes = [REF.strip(), abertura, f"SHOT ({plano}): {acao}."]
    if linhas_pessoas:
        n = len(linhas_pessoas)
        partes.append(f"PEOPLE IN THE SHOT (exactly {n}, nobody else unless the SHOT says so): " + " | ".join(linhas_pessoas) + ".")
    if objs:
        partes.append("OBJECTS: " + "; ".join(OBJETO[o] for o in objs) + ".")
    if estado:
        partes.append(ESTADO[estado])
    if lugar in CAMERA:
        # o tamanho do plano manda no enquadramento; a luz e a paleta são sempre as do lugar (nunca "wide" num close)
        luz = ", ".join(CAMERA[lugar].split(", ")[3:])
        geral = ", ".join(CAMERA[lugar].split(", ")[:3])
        enq = {"GERAL": geral,
               "MÉDIO": geral if tipo in ("A", "S") else "medium frame at adult eye level (waist up), medium lens, balanced composition",
               "CLOSE": "close-up frame at eye level (head and shoulders), medium-long lens, shallow depth of field, background soft",
               "INSERT": "close insert frame, medium-long lens, shallow depth of field, hands and object sharp, background soft"}[plano]
        partes.append(f"CAMERA & COLOR (ShotDeck sheets in 05-referencia cores-lentes): {enq}, {luz}.")
    mapa = MAPA_EXTRA.get(lugar) or mapas.get(lugar, "")
    if mapa:
        if plano in ("CLOSE", "INSERT"):
            mapa = mapa.replace("PLACE LOCK — ", "PLACE LOCK (this is the place behind them; keep the close framing) — ", 1)
        partes.append(mapa)
    partes.append(ESTILO)
    img = " ".join(partes)
    fixos = "walls, doors, windows, gate and furniture"
    anim_txt = (BLOCO + f"CAMERA: static, no pan, no zoom. ACTION: {anim}. ACTING: one small physical sign of the emotion of the shot (lips pressed, shoulders "
                f"dropping, eyes softening). LIGHT AND AMBIENCE: the existing light only, dust in the sun. INTEGRITY: stable faces, hands with five fingers, "
                f"clothes without artifacts; {fixos} do not move; nobody new appears; nobody passes through doors or gates." + FIM_ANIM)
    return epoca, obs, img, anim_txt


LUGAR_DE = {}


def lugares_das_cenas(prefixo, specs):
    for cod, spec in specs.items():
        tipo, alvo = spec[0].split(":", 1)
        if tipo in ("A", "CRIAR"):
            LUGAR_DE[prefixo + cod] = alvo
    for _ in range(3):
        for cod, spec in specs.items():
            tipo, alvo = spec[0].split(":", 1)
            if tipo in ("S", "C", "COPIA") and prefixo + cod not in LUGAR_DE:
                if alvo.endswith("-A"):
                    LUGAR_DE[prefixo + cod] = alvo[:-2]
                elif alvo in LUGAR_DE:
                    LUGAR_DE[prefixo + cod] = LUGAR_DE[alvo]
    LUGAR_DE["n5-S03a"] = "rua"


def inventario(pref, specs):
    linhas = ["INVENTÁRIO MESTRE (01/11 — cada cena é montada só com os blocos fixos da Bíblia da Conta B; quem/o quê aparece onde):"]
    quem = {}
    for cod, spec in specs.items():
        for p, letra, _ in spec[2]:
            quem.setdefault(p + (f" roupa {letra}" if letra else ""), []).append(cod)
        for o in spec[3]:
            quem.setdefault(o, []).append(cod)
    for k, v in quem.items():
        linhas.append(f"• {k}: {', '.join(pref + c for c in v)}")
    linhas.append("PLANOS: " + " · ".join(f"{pref}{c} {s[1]}" for c, s in specs.items()))
    return "\n".join(linhas) + "\n"


if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    Ep = {e["chave"]: e for e in eps}
    json.dump(eps, open(__import__('os').path.dirname(__file__) + "/../eps_antes_biblia.json", "w"), ensure_ascii=False)
    mapas = mapas_do_kit(Ep["kit-tutor"])
    # revisor 01/11: na c06-sala-equipe-A gerada a faixa azul sobe e corta a janela (o texto do Kit, já aprovado, diz "lower third")
    mapas["c06-sala-equipe"] = mapas["c06-sala-equipe"].replace("light-blue band on the lower third", "light-blue band on the lower part of the walls; on the left wall its top edge crosses the window at about one third of its height, so the lower panes sit inside the blue band")
    mapas["c06-sala-equipe"] = mapas["c06-sala-equipe"].replace("The small staff room of the same new school, with the same walls, window frames, door and floor as the attached c03-sala-nova-A.", "The small staff room of the same new school.")
    assert "lower third" not in mapas["c06-sala-equipe"] and "attached c03" not in mapas["c06-sala-equipe"]
    KIT_PEND.update(c["descricao"] for c in Ep["kit-tutor"]["cenas"] if c["situacao"] in ("falta", "refazer"))
    lugares_das_cenas("n5-", N5); lugares_das_cenas("n8-", N8)
    for chave, pref, specs in (("noticia-5", "n5-", N5), ("noticia-8", "n8-", N8)):
        ep = Ep[chave]
        pend = {"n5-" + c["codigo"] for c in Ep["noticia-5"]["cenas"] if c["situacao"] in ("falta", "refazer")} | {"n8-" + c["codigo"] for c in Ep["noticia-8"]["cenas"] if c["situacao"] in ("falta", "refazer")}
        for c in ep["cenas"]:
            if c["codigo"] not in specs or c["situacao"] not in ("falta", "refazer"):
                continue
            epoca, obs, img, anim = montar(pref, c["codigo"], specs[c["codigo"]], mapas, pend)
            c["descricao"] = epoca + " " + re.sub(r"^\[[^\]]*\]\s*", "", c["descricao"])
            c["obs"], c["imagem"], c["animacao"] = obs, img, anim
        notas = re.sub(r"^INVENTÁRIO MESTRE.*?(?=\n[A-Z]{4,}|\Z)", "", ep["notas"], flags=re.S)
        ep["notas"] = inventario(pref, specs) + notas
    if "--gravar" not in sys.argv:
        json.dump({k: Ep[k] for k in ("kit-tutor", "noticia-5", "noticia-8")}, open(__import__('os').path.dirname(__file__) + "/../biblia_dry.json", "w"), ensure_ascii=False, indent=1)
        print("rascunho"); sys.exit(0)
    for k in ("noticia-5", "noticia-8"):
        r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": k, "cenas": Ep[k]["cenas"], "notas": Ep[k]["notas"]}).encode(), headers=H, method="POST")))
        print("gravado", r["chave"])
