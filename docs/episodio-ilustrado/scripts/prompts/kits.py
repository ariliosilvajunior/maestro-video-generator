import sys,json,urllib.request; sys.path.insert(0,__import__('os').path.dirname(__file__))
from base import H,U
LOCK=(" STYLE (match the attached ref-estilo-p04 exactly): cinematic painterly realism that looks almost like a photograph painted in oil, natural realistic proportions and "
 "adult-looking faces (not cute, not big eyes, not cartoon), fine canvas grain and crosshatched texture over the whole image, muted warm sepia palette, low golden side light "
 "with long shadows, worn weathered surfaces. NOT a clean digital illustration, NOT watercolor, NOT ink line drawing. No readable text anywhere.")
def cen(desc,p3,p4,ident=None):
    base=(f"The attached image {ident} is the identity reference: show exactly this same place. " if ident else "")
    return ("Location reference sheet, same board LAYOUT as the attached ref-layout-cenario (use it ONLY for the layout — NEVER copy that house, its rooms or furniture): a light grey board with a 2x2 grid of four large panels and a thin caption strip "
            "at the bottom with no readable text. "+base+f"All four panels show the SAME place, empty of people: {desc}. Panel 1: wide establishing view at adult eye level. "
            f"Panel 2: reverse angle from the other side. Panel 3: {p3}. Panel 4: {p4}. Identical architecture, furniture, materials, colours and light in every panel."+LOCK)
def per(desc,ident=None):
    base=(f"The attached image {ident} is the identity reference: exactly this same person, same face, hair and clothes. " if ident else "")
    return ("Character reference sheet of ONE person only, same board LAYOUT as the attached ref-layout-personagem (use it ONLY for the layout — NEVER copy the woman, her face, dress or sandals): a light grey board; top row: full body front view, full body "
            "three-quarter view, full body side profile; bottom row: large face close-up, close-ups of the clothes and shoes. "+base+f"{desc} Same face, hair and clothes in "
            "every panel, plain neutral grey background, no other people, real-world body proportions."+LOCK)
CRIAR="CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR ref-estilo-p04 + {lay}"
REF_C="ref-layout-cenario"; REF_P="ref-layout-personagem"
def item(cod,nome,tipo,prompt,ident=None,extra=""):
    lay=REF_C if tipo=="c" else REF_P
    obs=CRIAR.format(lay=lay)+(f" + {ident}" if ident else "")+f" · salvar como {nome}"+(" (renomear a antiga para "+nome+"-antiga)" if ident else "")+extra
    return {"codigo":cod,"descricao":nome,"situacao":"falta","obs":obs,"imagem":prompt}
PREP=("ANTES DO KIT, suba neste projeto do Flow (Drive do piloto): ref-estilo-p04 (05-episodios/p04-caixas-mudanca.png), "
      "ref-layout-cenario (03-cenarios/c01-casa-interior), ref-layout-personagem (02-personagens/f01-mae). "
      "Por que: o piloto deu certo porque cada lugar e cada pessoa tinham uma FOLHA DE REFERÊNCIA (várias vistas, mesmo estilo). "
      "Todas as cenas usam esses nomes; com as folhas certas, o estilo e a continuidade vêm junto.\n"
      "Cada item: copiar o texto, CRIAR com os anexos indicados, conferir ao lado da ref-estilo-p04 (tem que parecer do mesmo filme), salvar com o nome, marcar 'Imagem ok'.")
kits={
"kit-piloto":("Kit de referência — conta do PILOTO (notícias 3 e 4)","conta do PILOTO (mesmo projeto do piloto)",1,[
 item("K01","f06-pai","p",per("A Brazilian father of about 36 in a 1980s rural town: light brown skin, short dark wavy hair, thin moustache, tired kind eyes, plain short-sleeve light-grey button shirt, dark trousers, worn leather shoes.")),
 item("K02","f07-jonas-2anos","p",per("A 2-year-old Brazilian toddler, the same boy as the attached character Filho Jonas but much younger: same face features, round cheeks, short messy dark hair, faded striped terracotta t-shirt, barefoot. Toddler body proportions."),extra=" (ANEXAR também o personagem Filho Jonas)"),
 item("K03","c05-consultorio","c",cen("a simple small-town pediatrician's office in 1980s Brazil: pale green walls, old wooden desk with a lamp, metal examination bed with a white sheet, a weighing scale, a window with warm light","close view of the desk and the weighing scale","view toward the window with the light")),
]),
"kit-tutor":("Kit de referência — conta TUTOR (notícias 5 e 8)","Tutor Arilio (utorarilio@gmail.com)",4,[
 item("K01","f01-educadora","p",per("The educator, founder of the school in 1980s Brazil.",ident="f01-educadora"),ident="f01-educadora"),
 item("K02","f04-menino","p",per("The small boy of about 4 years old, child body proportions.",ident="f04-menino"),ident="f04-menino"),
 item("K03","f02-adolescente","p",per("A Brazilian teenage boy of about 15 in the 1980s with an intellectual disability: medium brown skin, short black hair, slightly chubby, faded yellow t-shirt, worn jeans, old sneakers, shy hurt expression.")),
 item("K04","f03-mae-adolescente","p",per("His mother, a Brazilian woman of about 42 in the 1980s: medium brown skin, black hair tied back, tired firm face, simple floral cotton dress, cardigan, plastic sandals.")),
 item("K05","c02-sala-antiga-adulto","c",cen("the old rented room where the educator first taught","close view of the desks and the blackboard","view toward the window and the door",ident="c02-sala-antiga-adulto"),ident="c02-sala-antiga-adulto"),
 item("K06","c03-sala-nova","c",cen("the classroom of the new school","close view of a student desk with wooden blocks","view toward the windows with the light",ident="c03-sala-nova"),ident="c03-sala-nova"),
]),
"kit-conta-c":("Kit de referência — CONTA C (notícias 1 e 6)","Conta C (3º e-mail — escrever aqui qual) — notícias 1 e 6, mesmos personagens",7,[
 item("K01","f01-professora","p",per("A Brazilian early-childhood teacher, about 35: medium brown skin, dark curly hair tied up in a low bun, small gold stud earrings, plain light-blue cotton blouse, beige trousers, flat brown shoes, plain lanyard with a blank badge.")),
 item("K02","f02-daniel","p",per("An autistic Brazilian boy about 5 years old: light-brown skin, short straight dark hair with a fringe, plain mustard-yellow t-shirt, navy shorts, white sneakers with velcro, gaze often to the side. Child body proportions.")),
 item("K03","f03-colega","p",per("A Brazilian boy about 5 years old: dark brown skin, short curly black hair, round lively face, plain red t-shirt, green shorts, blue sneakers. Child body proportions.")),
 item("K04","c01-sala-infantil","c",cen("an early-childhood classroom of a simple Brazilian public school: low round wooden tables with small chairs, a colourful round rug, low shelves with wooden toys, building blocks and baskets, a white ceiling fan, a big window looking out to a sunny courtyard, children's drawings on the wall, a teacher's desk","close view of the rug, the blocks and the shelves","view toward the window and the ceiling fan")),
 item("K05","c02-patio-infantil","c",cen("the courtyard of the same school: a sandbox with small plastic buckets and spades, a small low slide, a big shade tree, a low painted wall, a play mat with interlocking toy pieces, a wooden bench at the edge","close view of the sandbox with buckets","view of the slide and the bench")),
]),
"kit-conta-d":("Kit de referência — CONTA D (notícias 2 e 7)","Conta D (4º e-mail — escrever aqui qual) — notícias 2 e 7, professor do AEE do piloto",10,[
 item("K01","f02-aluno","p",per("A Brazilian boy about 9 years old: light skin with freckles, straight light-brown hair slightly messy, round thin glasses, plain green t-shirt, grey shorts, black sneakers, often holding a small toy dinosaur. Child body proportions.")),
 item("K02","f03-aluna","p",per("A Brazilian girl about 7 years old: medium brown skin, dark curly hair in two puffs with yellow hair ties, plain lilac t-shirt, denim skirt, white sneakers, quiet shy expression. Child body proportions.")),
 item("K03","f04-mae","p",per("A Brazilian mother about 33: medium brown skin, dark curly shoulder-length hair, plain coral blouse, dark jeans, small shoulder bag with no logo.")),
 item("K04","c01-sala-regular","c",cen("a regular classroom of a simple Brazilian public elementary school: rows of student desks and chairs, a green chalkboard with nothing written, a teacher's desk, two big windows with afternoon light, a ceiling fan, a shelf with books and boxes","close view of the teacher's desk and the chalkboard","view toward the windows with the light")),
]),
}
EXTRA_D="\n\nNÃO CRIAR f05-professor-aee nem c04-sala-aee: já são folhas do piloto — baixar do Drive (02-personagens, 03-cenarios) e subir com o mesmo nome."
for chave,(titulo,conta,ordem,cenas) in kits.items():
    notas=PREP+(EXTRA_D if chave=="kit-conta-d" else "")
    if chave=="kit-tutor": notas+="\n\nItens com 'renomear a antiga': as imagens antigas viram só referência de identidade; a FOLHA nova passa a ter o nome que as cenas usam. Depois disso, refazer as cenas já feitas que não parecerem com a ref-estilo-p04."
    body={"chave":chave,"titulo":titulo,"conta_flow":conta,"ordem":ordem,"cenas":cenas,"notas":notas}
    r=json.load(urllib.request.urlopen(urllib.request.Request(U,data=json.dumps(body).encode(),headers=H,method='POST')))
    print(r['chave'],r['cenas_total'])
for chave,o in {"piloto":0,"noticia-3":2,"noticia-4":3,"noticia-5":5,"noticia-8":6,"noticia-1":8,"noticia-6":9,"noticia-2":11,"noticia-7":12}.items():
    urllib.request.urlopen(urllib.request.Request(U,data=json.dumps({"chave":chave,"ordem":o}).encode(),headers=H,method='POST'))
print("ordens ok")
