"""31/10/2026 — correções da Notícias 04 (n5) a partir das notas do dono."""
import sys, json, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U
import lugares
EDU = ("the educator from f01-educadora: about 50 years old, light-brown skin, dark hair with grey streaks in a low bun, round tortoiseshell glasses, "
       "faded light-blue chambray shirt with rolled sleeves and a pencil in the chest pocket, olive-grey trousers; hands of a 50-year-old woman (not elderly)")
MEN = ("the boy from f04-menino: exactly 3 years old (about 90 cm), very thin from malnutrition, with cerebral palsy — he does NOT stand or walk, he is always "
       "sitting supported by the cushions or lying down; dark messy hair, mustard-yellow t-shirt, beige cotton shorts, barefoot. Same size and age in every scene")
SALA = "c02-sala-antiga-adulto-A"
ST = (" STYLE LOCK (match ref-estilo-p04): cinematic painterly realism almost like a photograph painted in oil, realistic faces and hands with five fingers, "
      "natural film grain, muted warm sepia palette, low golden side light from the LEFT window. NOT a clean digital illustration, NOT watercolor, NOT cartoon.")
CENAS = {
 "S01a": (f"ABRIR {SALA} · ANEXAR f01-educadora + ref-estilo-p04",
  f"OPENED IMAGE = the fixed old room {SALA}: keep every wall, crack, the window, the empty shelf, the blackboard, the table with four chairs and the mat with two cushions exactly. "
  f"Add only {EDU}, standing near the window, seen from the side, looking around the room with quiet determination. Real adult scale."),
 "S01b": ("ABRIR n5-S01a · ANEXAR ref-estilo-p04",
  "Keep this exact room and light. Close-up on the same rectangular wooden table: the educator's hands (a 50-year-old woman's hands, light-blue chambray sleeves rolled up) sketch "
  "a simple hand-drawn floor plan of a school building with a pencil on a large sheet of paper. Lines and rectangles only, no letters, no numbers."),
 "S02": (f"ABRIR {SALA} · ANEXAR f01-educadora + ref-estilo-p04",
  f"OPENED IMAGE = the fixed old room {SALA}: keep everything in it exactly. Add {EDU} and ONE other teacher (a woman of about 30 with a braid, simple 1980s blouse and skirt), "
  "standing by the table talking with warm, motivated expressions. Only these two adults. Real adult scale."),
 "S05": ("ABRIR n5-S02 · ANEXAR ref-estilo-p04",
  "Keep this exact room, light and the same TWO teachers. A small special-school class: only THREE students with different disabilities (one girl with Down syndrome, "
  "one boy in an old wheelchair, one boy with a hearing aid) working with wooden blocks and picture cards at the same rectangular table with four chairs. "
  "Two teachers and three students only — nobody else. Change nothing else."),
 "S08a": ("ABRIR c07-hospital-A · ANEXAR f04-menino + ref-estilo-p04",
  f"OPENED IMAGE = the fixed hospital room c07-hospital-A: keep it exactly. Add {MEN}, lying on the hospital bed under the white sheet, interned for severe malnutrition, "
  "eyes open, calm. Nobody else."),
 "S08b": ("ABRIR n5-S08a · ANEXAR ref-estilo-p04",
  "Keep this exact hospital room and the same boy on the bed. Add a Brazilian male doctor of about 50 in a white coat with a stethoscope, standing beside the bed holding a "
  "clipboard (no readable text), serious, looking at the chart. Change nothing else."),
 "S09": (f"ABRIR {SALA} · ANEXAR f01-educadora + f04-menino + ref-estilo-p04",
  f"OPENED IMAGE = the fixed old room {SALA}: keep everything exactly, including the straw mat with exactly TWO cushions by the right wall. "
  f"Add {MEN}, sitting on that straw mat supported by the two cushions; {EDU} kneels beside him; the other teacher (woman of about 30 with a braid) stands near the table. "
  "Only these three people. Real scale."),
 "S10a": ("ABRIR n5-S09 · ANEXAR f01-educadora + f04-menino + ref-estilo-p04",
  "Keep this exact room, the same mat with TWO cushions, the same boy (3 years old, same size) and the same educator in the same place. Closer, at the boy's eye level: "
  "the educator gently feeds him with a spoon from a simple enamel bowl of porridge. The table and chairs stay where they are in the background. Change nothing else."),
 "S10b": ("ABRIR n5-S09 · ANEXAR f01-educadora + f04-menino + ref-estilo-p04",
  "Keep this exact room (NO school desks — only the one table with four chairs), the same mat with TWO cushions and the same boy (3 years old, same size). "
  "The boy now lies on his back on the mat, head on one cushion, smiling a little, while the educator kneels and gently bends and stretches his small thin legs "
  "in a simple physiotherapy exercise. Change nothing else."),
 "S10c": ("ABRIR n5-S10b · ANEXAR f04-menino + ref-estilo-p04",
  "Same room and light. Close-up on the straw mat: the small hands of the same 3-year-old boy (thin child hands, same size as in the previous scene) touch colourful "
  "wooden toys (a rattle, simple blocks) held out by the educator's hands — the hands of a 50-year-old woman, NOT old or wrinkled, light-blue chambray sleeve. "
  "Only hands and toys in frame."),
 "S04": ("ABRIR c04-escola-fachada-A · ANEXAR ref-estilo-p04",
  "OPENED IMAGE = the fixed school front c04-escola-fachada-A: keep the SAME camera position and distance from the gate exactly. Earlier in time: the building is half "
  "built — exposed red bricks, wooden scaffolding, roof frame without tiles; a few community volunteers carry bricks and a wheelbarrow. Change nothing else."),
 "S06a": ("ABRIR c04-escola-fachada-A · ANEXAR ref-estilo-p04",
  "OPENED IMAGE = the fixed school front c04-escola-fachada-A: keep the SAME camera position and distance from the gate exactly (same as n5-S04). The building is freshly "
  "finished, nobody in it. Change nothing else."),
 "S07a": ("ABRIR c03-sala-nova-A · ANEXAR f01-educadora + ref-estilo-p04",
  f"OPENED IMAGE = the fixed NEW classroom c03-sala-nova-A (brand-new, clean white walls with a light-blue band — NOT the old room, no empty shelf, no cracks): keep it exactly. "
  f"Medium close-up at adult eye level: {EDU} kneels beside one student at a desk, both faces visible, she watches him with full attention while he fits a wooden puzzle piece."),
}
NOTAS = {
 "S01a": ("lugar", "Sala antiga diferente entre S01a, S02 e S05: prateleira de tamanho diferente, uma com quadro e outra sem, mesa e cadeiras diferentes, rachaduras da parede não batem."),
 "S02": ("lugar", "Mesmo problema da S01a: a sala não bate com as outras cenas."),
 "S05": ("lugar", "Sala diferente das outras e irreal: 4 professoras e 5 alunos. Turma pequena: no máximo 2 professoras e 3 alunos."),
 "S04": ("lugar", "S04 e S06a são a mesma escola, mas uma está mais perto do portão e a outra bem mais longe."),
 "S06a": ("lugar", "Mesma distância da câmera que a S04 — não bate."),
 "S07a": ("personagem", "Não é a mesma professora nem a mesma sala (tem a prateleira da sala antiga, mas pintura, carteiras e quadro não batem)."),
 "S08a": ("lugar", "Não dá para saber onde o menino está (casa, escola, AEE?) — lugar totalmente novo."),
 "S09": ("personagem", "O menino não é o mesmo, parece mais velho."),
 "S10a": ("lugar", "S10a e S09 são a mesma cena: uma tem mesa atrás e a outra não, 3 almofadas numa e 2 na outra, professora perto da parede numa e não na outra."),
 "S10b": ("personagem", "O menino já está bem maior e a sala tem carteiras de escola."),
 "S10c": ("personagem", "O braço do menino ficou mais novo; as mãos da professora parecem de uma idosa."),
}
if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    json.dump(eps, open(__import__('os').path.dirname(__file__) + "/../eps_antes_n5_correcao.json", "w"), ensure_ascii=False)
    E = {e["chave"]: e for e in eps}
    for c in E["noticia-5"]["cenas"]:
        if c["codigo"] in CENAS:
            c["obs"], txt = CENAS[c["codigo"]]
            c["imagem"] = "REFERENCE ROLES: the attached image ref-estilo-p04 is the MASTER STYLE reference — match its look exactly, never copy its people or place. " + txt + ST
            c["situacao"] = "refazer"
        if c["codigo"] in NOTAS:
            cat, nota = NOTAS[c["codigo"]]
            h = c.setdefault("historico", [])
            if not any(x.get("nota") == nota for x in h):
                h.append({"quando": "2026-10-31T19:30", "tipo": "imagem", "veredito": "rejeitado", "categoria": cat, "nota": nota})
    kit = E["kit-tutor"]["cenas"]
    for c in kit:
        if c["descricao"] == "f04-menino":
            c["imagem"] = c["imagem"].replace("The small boy of about 4 years old, child body proportions.",
              "A Brazilian boy of exactly 3 years old (about 90 cm), very thin from severe malnutrition, with cerebral palsy: he does NOT stand — show him sitting supported by cushions "
              "in all full-body views; dark messy hair, mustard-yellow t-shirt, beige cotton shorts, barefoot. Toddler body proportions.")
            c["situacao"] = "refazer"
            c.setdefault("historico", []).append({"quando": "2026-10-31T19:30", "tipo": "imagem", "veredito": "rejeitado", "categoria": "epoca",
              "nota": "A idade do menino variava entre as cenas (mais velho na S09/S10b, mais novo na S10c). A folha tem que fixar 3 anos, magro, sem ficar em pé."})
        if c["descricao"] == "f01-educadora":
            c["imagem"] = c["imagem"].replace("The educator, founder of the school in 1980s Brazil.",
              "The educator, founder of the school in 1980s Brazil: about 50 years old, light-brown skin, dark hair with grey streaks in a low bun, round tortoiseshell glasses, "
              "faded light-blue chambray shirt with rolled sleeves and a pencil in the chest pocket, olive-grey trousers; include one close-up of her HANDS (a 50-year-old woman's hands, not elderly).")
    mud = {e["chave"]: e for e in lugares.revisar(list(E.values()))}
    for k in ("noticia-5", "kit-tutor"):
        r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": k, "cenas": mud[k]["cenas"]}).encode(), headers=H, method="POST")))
        print(k, [(c["codigo"], c["situacao"]) for c in r["cenas"] if c["situacao"] == "refazer"])
