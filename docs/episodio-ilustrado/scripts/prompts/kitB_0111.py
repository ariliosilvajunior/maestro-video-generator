"""01/11/2026 — Kit da Conta B (kit-tutor) com os textos revisados pelo revisor-cenas olhando as imagens reais.
Planos -A partem das imagens que JÁ existem (sala antiga, sala nova n5-S12, p29) em vez de criar do zero."""
import sys, json, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U

ST = (" STYLE (match the attached ref-estilo-p04 exactly): cinematic painterly realism that looks almost like a photograph painted in oil, natural realistic "
      "proportions, fine canvas grain and crosshatched texture over the whole image, muted warm sepia palette, low golden side light with long shadows. NOT a "
      "clean digital illustration, NOT watercolor, NOT ink line drawing. No people. No readable text. One single 16:9 image, not a sheet.")
ST_NOVO = ST.replace("muted warm sepia palette", "natural warm palette with clean colours")

TXT = {
 "K02": ("CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR ref-estilo-p04 · 1º ordem · apagar \"f04-menino\" antigo (o menino saudável numa sala) e salvar como f04-menino em Kit de referência › 02-personagens",
  "Character reference sheet of ONE person only, laid out as follows: a light grey board; top row: full body front view, full body three-quarter view, full body "
  "side profile — in all three he is SITTING on the grey floor, propped up by TWO plain beige cushions behind and beside him; bottom row: large face close-up, "
  "close-up of his small thin hands, close-ups of the clothes. [ANOS 80] A Brazilian boy of EXACTLY 3 years old (about 85–90 cm), very thin from severe "
  "malnutrition — thin arms and legs, visible collarbones, slightly hollow cheeks — with cerebral palsy: he does NOT stand or walk, his legs rest bent and loose, "
  "one hand slightly curled. Light-brown skin, dark messy hair, tired but calm eyes. Mustard-yellow cotton t-shirt, beige cotton shorts, barefoot. A real "
  "3-year-old toddler face and head-to-body proportions — NOT a 5- or 6-year-old, NOT a baby. Same face, hair, size and clothes in every panel, plain neutral grey "
  "background, no other people. STYLE (match the attached ref-estilo-p04 exactly): cinematic painterly realism that looks almost like a photograph painted in oil, "
  "realistic child face (not cute, not big cartoon eyes), fine canvas grain and crosshatched texture over the whole image, muted warm sepia palette, low golden "
  "side light with long shadows. NOT a clean digital illustration, NOT watercolor, NOT ink line drawing. No readable text anywhere."),
 "L01A": ("ABRIR c02-sala-antiga-adulto · ANEXAR ref-estilo-p04 · 1º ordem · salvar como c02-sala-antiga-adulto-A em Kit de referência › 03-cenarios (TODAS as cenas da sala antiga abrem esta imagem)",
  "OPENED IMAGE = the old rented room c02-sala-antiga-adulto. Keep the room, camera angle, walls, cracks, window, shelf, blackboard, table, chairs and light exactly "
  "as they are. Change only two things: (1) remove the woman completely — the room is empty of people; where she stood show the same worn terracotta floor and the "
  "same wooden chair against the left wall; (2) add ONE rectangular woven straw mat lying flat on the floor in front of the back wall, under the right half of the "
  "blackboard, with exactly TWO cushions on it, one faded floral and one plain beige. Keep the lower-right corner of the image as empty tiled floor. PLACE LOCK — "
  "c02-sala-antiga-adulto-A: [ANOS 80 · sala antiga] CONDITION: old and worn — faded blue lime walls with peeling plaster and cracks, worn terracotta tile floor and "
  "skirting. LEFT WALL: ONE wooden window with two casements of four panes each, warm sun coming in; directly BELOW the window a patch of exposed red bricks; ONE "
  "wooden chair with a slatted back standing against the left wall. BACK WALL, from left to right: ONE tall EMPTY wooden shelf unit with exactly four shelf boards "
  "(nothing on it); ONE dark-green chalkboard in a wooden frame with a chalk ledge, nothing written, on the right half of the wall. CENTER: ONE small rectangular "
  "old wooden table with exactly FOUR school chairs (grey metal tube frames, wooden seats and backs), one on each side. FLOOR, under the right half of the "
  "blackboard: ONE woven straw mat with exactly TWO cushions (one faded floral, one plain beige). The entrance door is behind the camera and never visible. No school "
  "desks, no pictures, nothing on the walls. No people. No readable text."),
 "L02A": ("ABRIR n5-S12 · ANEXAR ref-estilo-p04 · 1º ordem · salvar como c03-sala-nova-A em Kit de referência › 03-cenarios (TODAS as cenas da sala nova abrem esta imagem)",
  "OPENED IMAGE = n5-S12, the classroom of the new school. Keep the room, camera angle, walls, windows, blackboard, door, wall shelf, desks, chairs, light and "
  "painting style exactly. Change only this: remove the teenage boy and the educator completely, and remove the paper and coloured pencils from the front desk; the "
  "room is empty of people and every desk top is bare. PLACE LOCK — c03-sala-nova-A: [ANOS 80 · escola nova] CONDITION: new and clean — smooth fresh paint, nothing "
  "peeling or cracked. Walls white above, light-blue band on the lower third (up to just below the window sills), terracotta skirting, shiny terracotta tile floor. "
  "LEFT WALL: exactly TWO tall windows with grey metal frames and many small panes, sun coming in. BACK WALL: ONE green blackboard in a thin wooden frame, slightly "
  "left of center; NO teacher's desk. RIGHT WALL: ONE brown wooden panel door near the back corner, closed, with a light switch to its left; ONE wall-mounted wooden "
  "shelf on two brackets near the front, holding a stack of coloured wooden blocks and one wooden shape-puzzle board. CENTER: exactly NINE single student desks "
  "(light wooden tops, metal legs) in three columns of three facing the blackboard, each with ONE chair (grey metal tube frame, wooden seat and back). No people. "
  "No readable text."),
 "L03A": ("ABRIR p29-portao-escola · ANEXAR ref-estilo-p04 · 1º ordem · salvar como c04-escola-fachada-A em Kit de referência › 03-cenarios (TODAS as cenas da fachada abrem esta imagem)",
  "OPENED IMAGE = p29-portao-escola. Keep the place, camera position, distance to the gate, gate leaves, walls, courtyard, building, trees, sky and light exactly. "
  "Change only this: remove the woman and the boy completely; where they stood show the same pale courtyard ground and the same long gate shadows. Nobody in the "
  "image. PLACE LOCK — c04-escola-fachada-A: [ANOS 80 · fachada da escola nova] CONDITION: well kept. Camera on the street just outside the gate, adult eye level. "
  "FOREGROUND: ONE thick off-white plastered wall section on each side (camera-left and camera-right); between them ONE double gate of vertical grey metal bars, "
  "BOTH leaves open inward into the courtyard (left leaf toward camera-left, right leaf toward camera-right). COURTYARD: wide, flat, pale beige packed ground; a low "
  "plastered side wall runs along camera-left. BACK: ONE long single-storey building, white walls with a light-blue band at the bottom, red clay-tile roof, louvered "
  "windows; on camera-right a wing with an open veranda of square white columns. TREES: exactly THREE young slender trees in small square planters in the "
  "middle-right of the courtyard; branches of one big tree overhang the top-right corner from outside the wall. Low golden sun, long shadows of the gate bars toward "
  "the camera. No people. No readable text."),
 "L04A": ("CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR ref-estilo-p04 · 1º ordem · salvar como c07-hospital-A em Kit de referência › 03-cenarios",
  "One single wide 16:9 image, empty of people. [ANOS 80 · hospital da cidade] A small 1980s small-town Brazilian hospital ward room, seen from the doorway at "
  "adult eye level. CONDITION: old but clean — pale green walls with a darker green band on the lower third, a few faded patches, worn red tile floor. Fixed layout, "
  "follow it exactly: LEFT WALL: ONE old white-painted metal hospital bed, head against the back-left corner, foot toward the camera, thin mattress, white sheet, one "
  "flat white pillow; at the head of the bed ONE white metal bedside table with ONE white enamel cup; beside the head of the bed ONE metal IV drip stand with one "
  "glass bottle. BACK WALL: ONE window with a white half-curtain, daylight. RIGHT WALL: ONE simple wooden adult chair against the wall. The door is behind the "
  "camera, never visible. Nothing else; keep the lower-right corner as plain floor. Every fixed element keeps exactly this position, size and design in every image: "
  "never add, move, duplicate or redesign walls, doors, windows or furniture." + ST),
 "L05A": ("CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR ref-estilo-p04 + c04-escola-fachada-A + c03-sala-nova-A · 2º ordem (SÓ depois de L02A e L03A) · salvar como c05-corredor-escola-A em Kit de referência › 03-cenarios",
  "One single wide 16:9 image, empty of people. [ANOS 80 · escola nova] The covered veranda corridor of the same new school seen in the attached "
  "c04-escola-fachada-A (the open veranda with square white columns), with the same wall colours, door and floor as the attached c03-sala-nova-A. Camera at one end "
  "of the corridor, adult eye level, looking along it. CONDITION: new and clean, nothing peeling. Fixed layout: RIGHT WALL: white wall with a light-blue band on the "
  "lower third and terracotta skirting, with exactly TWO brown wooden panel doors (the same door as in c03-sala-nova-A), both standing open, a few metres apart. "
  "LEFT SIDE: open to the sunny courtyard between exactly FOUR square white columns, no windows, no wall; pale beige courtyard ground beyond. FLOOR: shiny "
  "terracotta tiles. CEILING: red clay-tile roof on wooden rafters. Low golden sun from the left casting the column shadows across the floor. Nothing else." + ST_NOVO),
 "L06A": ("CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR ref-estilo-p04 + c03-sala-nova-A · 2º ordem (SÓ depois de L02A) · salvar como c06-sala-equipe-A em Kit de referência › 03-cenarios",
  "One single wide 16:9 image, empty of people. [ANOS 80 · escola nova] The small staff room of the same new school, with the same walls, window frames, door and "
  "floor as the attached c03-sala-nova-A. Camera at the front end of the room at adult eye level, looking along the table toward the back wall. CONDITION: new and "
  "clean. Fixed layout: walls white above, light-blue band on the lower third, terracotta skirting, shiny terracotta tile floor. CENTER: ONE rectangular wooden table "
  "for adults with exactly SIX simple wooden adult chairs, three on each long side, nothing on the table. LEFT WALL: ONE tall window with a grey metal frame and "
  "small panes, sun coming in. BACK WALL: ONE low wooden cupboard with ONE enamel coffee pot and SIX white cups on top. RIGHT WALL: ONE brown wooden panel door, "
  "closed. Nothing on the walls, no other furniture; lower-right corner plain floor." + ST_NOVO),
}
if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    json.dump(eps, open(__import__('os').path.dirname(__file__) + "/../eps_antes_kitB_0111.json", "w"), ensure_ascii=False)
    kit = [e for e in eps if e["chave"] == "kit-tutor"][0]
    novas = []
    for c in kit["cenas"]:
        if c["codigo"] == "K06":  # dispensado: a sala nova já existe nas cenas aprovadas; o -A sai da n5-S12
            continue
        if c["codigo"] in TXT:
            c["obs"], c["imagem"] = TXT[c["codigo"]]
            if c["codigo"] in ("L01A", "L02A", "L03A"):
                c["situacao"] = "falta"
            h = c.setdefault("historico", [])
            nota = "01/11 revisor-cenas: texto refeito olhando as imagens reais da Conta B (nomes reais, plano parte da imagem existente, mapa contado)."
            if not any(x.get("nota") == nota for x in h):
                h.append({"quando": "2026-11-01T01:00", "tipo": "imagem", "veredito": "rejeitado", "categoria": "lugar", "nota": nota})
        novas.append(c)
    kit["cenas"] = novas
    r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": "kit-tutor", "cenas": kit["cenas"]}).encode(), headers=H, method="POST")))
    print("gravado", r["chave"], [(c["codigo"], c["situacao"]) for c in r["cenas"]])
