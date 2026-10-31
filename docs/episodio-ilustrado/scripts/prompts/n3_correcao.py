"""31/10/2026 — correções da Notícias 02 (n3, Conta A) a partir das notas do dono.
Causa comum: o Kit não fixava os detalhes (mesa/cadeira de adulto, lado da janela, porta, idade, berço).
Rodar só como script."""
import sys, json, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U, BLOCO
import lugares

EST = "p04-caixas-mudanca"
ST = (f" STYLE LOCK (match {EST} exactly): cinematic painterly realism almost like a photograph painted in oil, realistic adult faces and hands with five fingers, "
      "fine canvas grain and crosshatched texture over the whole image, low golden side light. NOT a clean digital illustration, NOT a cartoon, NOT watercolor, NOT ink line drawing. "
      "No readable text. Lower right corner kept quiet.")
FIM = " raw cinematic imperfect realism, subtle motion blur, natural film grain, uneven light falloff, lived-in textures."

# ---- personagens: idade/altura/roupa repetidas em TODA cena ----
MAE80 = ("Maria from f01-mae [1980s]: about 30 years old (young-adult face, no grey hair, smooth young hands — NOT old), medium-brown skin, dark hair in a low bun, "
         "light-blue floral cotton dress, brown leather sandals")
PAI80 = ("her husband from f06-pai [1980s]: about 33 years old (young face, no grey hair, no deep wrinkles), light-brown skin, black wavy hair, thin moustache, "
         "light-grey short-sleeve button shirt, dark trousers")
JONAS = ("Jonas from f07-jonas-2anos: exactly 2 years old (about 85 cm, toddler proportions, round cheeks), short messy dark-brown hair, cream t-shirt, beige shorts, barefoot")
BEBE = ("the baby brother from f10-irmao-bebe: about 4 months old (cannot sit or stand, always lying on his back), fine dark hair, white cotton vest and cloth diaper")
MAEH = ("the present-day mother from f08-mae-hoje [today] — NOT Maria from the 1980s: about 38 years old, warm brown skin, short curly dark hair to the chin, small gold earrings, "
        "mustard-yellow cardigan over a white t-shirt, dark jeans, white sneakers, smooth hands of a 38-year-old")
PAIH = ("her husband from f09-pai-hoje [today]: about 40, light-brown skin, short black hair, short trimmed beard, navy polo shirt, khaki trousers")
PROF = ("the teacher from f05-professor-aee [today]: a man of about 38, dark-rimmed glasses, short dark beard, blue-grey polo shirt with a lanyard, dark jeans, white sneakers")
LIVRO = "ONE small modern paperback book with a plain off-white cover (no readable text)"
SALA = "c04-sala-aee-A"


def abrir(lugar):
    return f"OPENED IMAGE = the fixed place {lugar}. Keep this exact place: every wall, door, window, piece of furniture, colour and the camera stay exactly as they are; only add what this text asks. "


def anim(cam, acao, atua, luz, integ):
    return (BLOCO + f"CAMERA: {cam}. ACTION: {acao}. ACTING: {atua}. LIGHT AND AMBIENCE: {luz}. "
            f"INTEGRITY: stable faces, hands with five fingers, clothes without artifacts; {integ}." + FIM)


# codigo: (descricao, obs, imagem, animacao)   — imagem None = cena sem imagem nova (cópia)
C = {}
# ---------------- ANOS 80 (o livro) ----------------
C["E08"] = ("[ANOS 80 · livro] Mãe aflita: o Jonas sumiu de vista",
  "ABRIR c01-casa-interior-A · ANEXAR f01-mae [anos 80] + p04-caixas-mudanca",
  abrir("c01-casa-interior-A") + "Late afternoon. The back door on the LEFT wall stands half open, daylight from the yard on the floor. "
  f"Add {MAE80}, standing in the middle of the room facing the half-open back door, one hand at her mouth, worried. Nobody else. Real adult scale.",
  anim("static, 0–6 s", "she takes one step toward the half-open door and stops, ending still, looking at it", "her shoulders rise, she presses her lips together",
       "the sun patch from the right window slowly creeps on the tiles, dust floats", "the door, the sofa, the table and the stove do not move"))
C["E09"] = ("[ANOS 80 · livro] Sala vazia, porta dos fundos entreaberta",
  "ABRIR n3-E08 · ANEXAR p04-caixas-mudanca",
  "Keep this exact room, camera, light and the half-open back door on the LEFT wall exactly. Remove the woman: the room is now empty. "
  "Add ONE small wooden toy truck lying on its side on the tiles near the sofa. Change nothing else.",
  anim("micro push-in 100→103%, 0–6 s", "nothing moves except the half-open door, which sways a few centimetres in the breeze and stops", "—",
       "dust drifting in the light from the yard", "the toy truck, sofa, table and stove do not move"))
C["E10"] = ("[ANOS 80 · livro] No pediatra: Maria, o marido e o Jonas (2 anos)",
  "ABRIR c05-consultorio-A · ANEXAR f01-mae [anos 80] + f06-pai [anos 80] + f07-jonas-2anos + p04-caixas-mudanca",
  abrir("c05-consultorio-A") + "Add the old doctor (a Brazilian man of about 65, white hair, white coat) sitting at the desk; "
  f"{MAE80}, sitting on one of the two wooden chairs in front of the desk with {JONAS} on her lap; {PAI80}, on the other chair. "
  "ONLY ONE child in the scene — NO baby. Four people only.",
  anim("static, 0–10 s", "Jonas fidgets on his mother's lap and looks away; the parents lean forward slightly toward the doctor; end still",
       "the mother's fingers tighten on the boy's shirt; the father rubs his thumb on his knee", "window light steady, dust in the beam",
       "the desk, phone, lamp, scale and chairs do not move"))
C["E11"] = ("[ANOS 80 · livro] O médico só pode indicar um especialista",
  "ABRIR n3-E10 · ANEXAR p04-caixas-mudanca",
  "Keep this exact office, camera, light and the same four people with the same ages and clothes. Change only: the doctor leans over the desk and hands a small folded "
  "white referral paper to the father; the mother looks down. Still only ONE child (Jonas, 2 years old), no baby. Change nothing else.",
  anim("static, 0–10 s", "the father takes the folded paper and holds it without opening it; end still", "the mother lowers her chin; the doctor lifts his hands a little, helpless",
       "steady window light", "the desk objects and chairs do not move"))
C["E12"] = ("[ANOS 80 · livro] A maratona: corredor de espera",
  "ABRIR c07-corredor-clinica-A · ANEXAR f01-mae [anos 80] + f06-pai [anos 80] + f07-jonas-2anos + p04-caixas-mudanca",
  abrir("c07-corredor-clinica-A") + f"Add {MAE80} and {PAI80}, sitting side by side on the wooden bench by the LEFT wall, waiting; the father holds {JONAS} on his lap. "
  "Only these three people. Real adult scale.",
  anim("static, 0–8 s", "the mother looks toward the closed doors and back to her hands; end still", "she sighs, shoulders drop; the father rocks the boy slightly",
       "light from the far window, dust floating", "the benches and doors do not move"))
C["E23"] = ("[ANOS 80 · livro] Exaustão no banco do corredor",
  "ABRIR n3-E12 · ANEXAR p04-caixas-mudanca",
  "Keep this exact corridor, camera and the same three people with the SAME ages and clothes (Maria about 30, her husband about 33, Jonas 2 years old). Later in the day: "
  "warmer, lower light. Maria leans her head back against the wall with her eyes closed; Jonas sleeps on his father's lap. Change nothing else.",
  anim("static, 0–8 s", "the mother breathes slowly, eyes closed; the boy's chest rises and falls; end still", "the father rests his cheek on the boy's head",
       "the low sun from the far window slowly fades a little", "the bench and doors do not move"))
C["E15"] = ("[ANOS 80 · livro] O rosto cansado da Maria (mesma imagem da E13, aproximada na montagem)",
  "NÃO GERAR IMAGEM: copiar a imagem n3-E13 e salvar como n3-E15 · ANIMAR com o texto abaixo (a montagem aproxima no rosto)",
  None,
  anim("static, 0–8 s", "she rubs her tired eyes with one hand and goes back to reading the papers; end still", "she closes her eyes for a second, lips tight",
       "the kerosene lamp flame flickers gently", "the table, papers and lamp do not move; her face stays young (about 30)"))
C["E22"] = ("[ANOS 80 · livro] Exames que não confirmam nada",
  "ABRIR n3-E13 · ANEXAR p04-caixas-mudanca",
  "Keep this exact room at night, camera, lamp light and the same woman (Maria, about 30, same dress). Change only the table: a pile of medical exam papers and brown "
  "envelopes is spread under the kerosene lamp and she holds one sheet, reading it. No readable text. Change nothing else.",
  anim("static, 0–8 s", "she puts the sheet down on the pile and picks up another one; end still", "a small shake of the head, lips pressed",
       "the lamp flame flickers", "the table, lamp and other papers do not move"))
C["E16"] = ("[ANOS 80 · livro] Qualquer porta vira uma porta: Maria com o Jonas na rua",
  "ABRIR c03-rua-bairro-A · ANEXAR f01-mae [anos 80] + f07-jonas-2anos + p04-caixas-mudanca",
  abrir("c03-rua-bairro-A") + f"Morning light. Add {MAE80}, walking away from the camera down the LEFT side of the street, past the houses, holding the hand of {JONAS}. "
  "Both seen from behind, small in the frame. Same camera looking down the street toward the hills. Nobody else.",
  anim("static, 0–8 s", "mother and boy walk slowly away down the street, feet touching the ground at every step, shadows attached to the feet; end still, smaller in frame",
       "she bends slightly toward the boy", "morning sun, dust lifting from the dirt", "houses, gates, poles and fence do not move; nobody passes through gates"))
C["E17"] = ("[ANOS 80 · livro] O berço no canto do quarto",
  "ABRIR c08-quarto-A · ANEXAR f10-irmao-bebe + p04-caixas-mudanca",
  abrir("c08-quarto-A") + f"Add {BEBE}, asleep in the crib in the back-right corner. Nobody else. Quiet afternoon light from the LEFT window.",
  anim("micro push-in 100→103% toward the crib, 0–6 s", "the baby sleeps, his chest rising and falling", "a tiny movement of his hand",
       "the curtain moves softly, dust in the light", "the bed, crib and chest do not move"))
C["E18"] = ("[ANOS 80 · livro] O irmão bebê sozinho no berço (aproximado na montagem)",
  "ABRIR n3-E17 · ANEXAR p04-caixas-mudanca",
  "Keep this exact bedroom, camera and light. Change only the baby: he is awake, lying on his back in the crib, moving his small hands in the air, alone. Same baby, about 4 months old. Change nothing else.",
  anim("static, 0–6 s", "the baby moves his hands and feet slowly, looking up; end calm", "he opens his mouth a little, curious",
       "light from the left window, curtain moving softly", "the crib bars and the bed do not move"))
C["E19"] = ("[ANOS 80 · livro] A atenção da casa toda vai para o Jonas",
  "ABRIR n3-E17 · ANEXAR f01-mae [anos 80] + f07-jonas-2anos + p04-caixas-mudanca",
  "Keep this exact bedroom, camera, light and the baby in the crib in the back-right corner. "
  f"Add {MAE80}, kneeling in the middle of the room hugging {JONAS} tightly, her back half-turned to the crib; the baby lies alone in the crib looking at the ceiling. "
  "Only these three people. Real scale. Change nothing else.",
  anim("static, 0–10 s", "Jonas squirms in his mother's arms and she holds him closer; the baby in the crib moves his hands alone; end still",
       "she closes her eyes and rests her cheek on the boy's head", "afternoon light from the left window", "the crib, bed and chest do not move"))
# ---------------- HOJE (sala do AEE) ----------------
C["E02"] = ("[HOJE · sala do AEE] Os pais sentados à mesa de reunião",
  f"ABRIR {SALA} · ANEXAR f08-mae-hoje + f09-pai-hoje + p04-caixas-mudanca",
  abrir(SALA) + f"Add {MAEH} and {PAIH}, sitting side by side on the TWO adult chairs on the far side of the adult meeting table, facing the camera, silent, hands on the table. "
  f"{LIVRO} lies closed in front of the mother. The teacher's chair on the near side is empty. Nobody sits on the children's chairs. Real adult scale.",
  anim("micro push-in 100→103%, 0–10 s", "the parents sit still, the mother looks down, the father glances at her; end still",
       "she twists her fingers; he takes a slow breath", "window light from the LEFT, dust in the beam", "the table, chairs, shelves and felt board do not move"))
C["E03"] = ("[HOJE · sala do AEE] O silêncio da mãe (close)",
  "CRIAR · ANEXAR n3-E02 + f08-mae-hoje + p04-caixas-mudanca",
  f"Medium close-up of the mother from the attached scene n3-E02 ({MAEH}), sitting at the light-wood adult meeting table, looking down at her clasped hands, silent, eyes heavy. "
  "Behind her ONLY the off-white wall and part of the blue felt board with cream cards, softly out of focus. The window is on the LEFT, out of frame: soft daylight from the left. "
  "NO window behind her.",
  anim("static, 0–8 s", "she keeps looking down, then slowly lifts her eyes a little; end still", "her jaw tightens, eyes glisten",
       "soft daylight from the left", "the table and the board behind do not move"))
C["E04"] = ("[HOJE · sala do AEE] O livro fechado sobre a mesa",
  "CRIAR · ANEXAR n3-E02 + f08-mae-hoje + f09-pai-hoje + p04-caixas-mudanca",
  f"Close-up of the light-wood adult meeting table from the attached scene n3-E02: {LIVRO} lies closed in the middle; behind it the mother's clasped hands (mustard-yellow cardigan sleeves) "
  "and the father's hands (navy polo sleeves) rest on the table; only their torsos are visible. In the background the blue felt board, out of focus. NO window behind them; "
  "daylight from the LEFT. No toys on this table.",
  anim("static, 0–10 s", "the mother's thumbs move slowly over each other; end still", "the father's hand relaxes on the table", "soft daylight from the left",
       "the book and table do not move"))
C["E05"] = ("[HOJE · sala do AEE] As mãos da mãe seguram o livro",
  "ABRIR n3-E04 · ANEXAR p04-caixas-mudanca",
  "Keep this exact table, camera, light and people. Change only: the mother's hands (smooth hands of a 38-year-old woman, NOT old) rest on the closed book, holding it. Change nothing else.",
  anim("static, 0–8 s", "her fingers slide slowly along the edge of the book; end still", "a gentle press of the hands, as if holding a memory",
       "daylight from the left", "the book stays closed, the table does not move"))
C["E07"] = ("[HOJE · sala do AEE] O livro aberto, páginas na luz",
  "ABRIR n3-E05 · ANEXAR p04-caixas-mudanca",
  "Keep this exact table, camera, light and the same hands. Change only: the book is open in the middle, pages lit by the daylight coming from the LEFT. No readable text. Change nothing else.",
  anim("static, 0–6 s", "one page lifts slightly and settles; end still", "her fingertip rests on the page", "dust in the light from the left",
       "the book does not close, the table does not move"))
C["E20"] = ("[HOJE · sala do AEE] A sala vazia, cadeirinhas no cantinho",
  f"NÃO GERAR IMAGEM: copiar {SALA} e salvar como n3-E20 · ANIMAR com o texto abaixo",
  None,
  anim("micro push-in 100→104% toward the children's corner, 0–10 s", "nobody in the room; nothing moves", "—",
       "the sun patch from the LEFT window slowly moves on the floor, dust floating", "all furniture stays still, the door stays closed"))
C["E21"] = ("[HOJE · sala do AEE] Os pais chegam à sala",
  f"ABRIR {SALA} · ANEXAR f08-mae-hoje + f09-pai-hoje + p04-caixas-mudanca",
  abrir(SALA) + f"The door on the RIGHT wall is open. Add {MAEH} and {PAIH}, just stepping into the room through that door, hesitant, the father a step behind. "
  "Real adult scale. Nobody else.",
  anim("static, 0–4 s", "they take one step in and stop, looking at the room; end still", "the mother holds her bag strap tightly",
       "window light from the left", "the door does not swing; nobody passes through the door frame or the furniture"))
C["E24"] = ("[HOJE · sala do AEE] O professor escuta os pais",
  "ABRIR n3-E02 · ANEXAR f05-professor-aee + p04-caixas-mudanca",
  f"Keep this exact room, camera, light and the same two parents on the same two adult chairs. Add {PROF}, sitting on the EMPTY adult chair on the near side of the table, "
  "his back three-quarters to the camera, facing the parents, listening attentively, a notebook on the table. Nobody on the children's chairs. Change nothing else.",
  anim("static, 0–10 s", "the teacher nods slowly while the mother talks with small hand movements; end still", "he leans forward; she swallows and keeps going",
       "window light from the left", "chairs, table and shelves do not move"))
C["E25"] = ("[HOJE · sala do AEE] Alívio: a mão do pai sobre a da mãe",
  "ABRIR n3-E24 · ANEXAR p04-caixas-mudanca",
  "Keep this exact room, camera, light and the same three people in the same chairs. Change only: the father rests his hand over the mother's hand on the table; she exhales "
  "with a faint, tired smile. Change nothing else.",
  anim("static, 0–4 s", "the father's hand settles on hers; end still", "her shoulders drop as she breathes out", "steady light", "chairs and table do not move"))
C["E26"] = ("[HOJE · sala do AEE] O professor prepara os materiais (antes da família chegar)",
  f"ABRIR {SALA} · ANEXAR f05-professor-aee + p04-caixas-mudanca",
  abrir(SALA) + f"Morning, before the meeting. Add {PROF}, standing (not sitting) at the small children's table in the back-right corner, arranging wooden puzzles and picture "
  "cards on it, alone. The adult meeting table is empty. Real adult scale.",
  anim("static, 0–6 s", "he places one wooden puzzle on the small table and straightens a card; end still", "a small focused smile",
       "morning light from the left window", "the furniture does not move"))
C["E27"] = ("[HOJE · sala do AEE] Acolhida: o professor recebe a família",
  "ABRIR n3-E24 · ANEXAR p04-caixas-mudanca",
  "Keep this exact room, camera, light, the same three people and the same dark-grey adult chairs. Change only: the teacher opens one hand in a calm welcoming gesture; "
  "both parents look at him with soft, relieved faces. Change nothing else.",
  anim("static, 0–8 s", "the teacher's hand opens slowly and rests on the table; end still", "the mother's eyes soften, the father nods",
       "window light from the left", "chairs, plants and table do not move"))
C["E28"] = ("[HOJE · sala do AEE] A ficha de matrícula e o livro",
  "ABRIR n3-E04 · ANEXAR p04-caixas-mudanca",
  "Keep this exact table, camera, light and the same hands. Change only: add a blank school enrolment form (a printed sheet with empty lines, no readable text) and a pencil "
  "beside the closed book. Change nothing else.",
  anim("static, 0–10 s", "the mother's hand slides the form a few centimetres closer; end still", "the father's hand rests calmly", "soft daylight from the left",
       "the book and table do not move"))

NOTAS = {
 "E02": ("estilo", "Parece desenho (fora do estilo p04); pais adultos sentados em cadeiras de criança na mesa das crianças. Sala do AEE precisa de mesa e cadeiras de adulto para os responsáveis."),
 "E03": ("estilo", "Continua parecendo desenho."),
 "E04": ("lugar", "Janela atrás dos pais — a janela da sala é na lateral, nunca atrás."),
 "E05": ("lugar", "Janela atrás dos pais (E04–E07)."), "E07": ("lugar", "Janela atrás dos pais (E04–E07)."),
 "E08": ("lugar", "E08 e E09: uma tem porta e a outra não. Mãe com a roupa do 1º episódio sem dizer que é a mesma época."),
 "E09": ("lugar", "Porta diferente da E08."),
 "E10": ("personagem", "Aparece a mãe, o Jonas e um nenê (não pode, só o Jonas) e o marido parece mais velho que o pai de hoje."),
 "E11": ("lugar", "Ângulo e consultório diferentes da E10."),
 "E12": ("personagem", "Pai mais velho que o casal (f06 com cara de 50 anos)."),
 "E15": ("personagem", "A mãe parece uma velha e a mesa/cenário mudou em relação à E13."),
 "E16": ("lugar", "Casa verde com porta e janela aqui; na E01 a casa é azul com duas janelas — rua não bate (E16 virou contraplano)."),
 "E18": ("objeto", "Bebê ao lado do fogão — absurdo; o filho parece mais novo ainda."),
 "E19": ("lugar", "Mistura tudo: berço com bebê e filho mais velho, fogão muda de lugar, porta some."),
 "E20": ("lugar", "E20, E02, E21 e E25 deviam ser a mesma sala: porta trocou de lugar, janela diferente, armário no canto."),
 "E21": ("lugar", "Porta e armário fora do lugar."), "E25": ("lugar", "Sala diferente da E02."),
 "E22": ("lugar", "Abria a E13 mas saiu a mesa do médico — cena sem lugar certo."),
 "E23": ("personagem", "Personagens bem mais velhos que na E12."),
 "E24": ("estilo", "Parece desenho; adultos em cadeiras de criança."),
 "E26": ("epoca", "Não dava para saber a época nem o lugar."),
 "E27": ("lugar", "Plantas e cadeiras diferentes; cadeiras mudam de cor entre E27 e E28."),
 "E28": ("lugar", "Cadeiras de outra cor que na E27."),
}
NOTA_EP = (
 "LEGENDA DE ÉPOCA (31/10): [ANOS 80 · livro] = a história da Maria Stella (f01-mae ~30 anos, f06-pai ~33, f07-jonas-2anos, f10-irmao-bebe ~4 meses) — é a MESMA família e "
 "a MESMA época do piloto, por isso a mesma roupa. [HOJE · sala do AEE] = uma família de hoje que chega à escola (f08-mae-hoje, f09-pai-hoje) — OUTRA família, não são os pais do Jonas — "
 "e o professor f05-professor-aee.\n"
 "ORDEM: 1) Kit primeiro: f06-pai, f08-mae-hoje, f10-irmao-bebe, c04-sala-aee-A, c08-quarto-A (salvar no Drive). 2) Só depois as cenas marcadas Refazer.\n"
 "Cenas sem imagem nova: E06 = cópia da E05; E15 = cópia da E13; E20 = cópia de c04-sala-aee-A (a montagem aproxima/move).\n\n")

KIT = {
 "f06-pai": ("refazer", None, ("A Brazilian father of about 36 in a 1980s rural town:",
   "A Brazilian father of about 33 years old in a 1980s rural town — a YOUNG man: no grey hair, no deep wrinkles, smooth skin, he must look clearly younger than 40:")),
 "f08-mae-hoje": ("refazer", None, None),
 "f09-pai-hoje": (None, None, None),
}
F08 = ("Character reference sheet of ONE person only, same board LAYOUT as the attached sheet f09-pai-hoje (use it ONLY for the layout — NEVER copy that man): "
       "a light grey board; top row: full body front view, full body three-quarter view, full body side profile; bottom row: large face close-up, close-up of the HANDS, close-ups of the clothes and shoes. "
       "A present-day Brazilian mother of about 38 (2020s) who must look clearly DIFFERENT from f01-mae: warm brown skin, round face, short curly dark hair to the chin, small gold earrings, "
       "mustard-yellow cardigan over a white t-shirt, dark jeans, white sneakers, a small brown shoulder bag; smooth hands of a 38-year-old. Clean modern clothes. "
       "Same face, hair and clothes in every panel, plain neutral grey background, no other people, real-world body proportions." + ST.replace(" Lower right corner kept quiet.", ""))
F10 = ("Character reference sheet of ONE baby only, same board LAYOUT as the attached sheet f07-jonas-2anos (use it ONLY for the layout and for the family skin tone — this is his BROTHER, "
       "a different, much smaller child): a light grey board; top row: the baby lying on his back seen from above, lying seen from the side, held in two adult hands (hands only); bottom row: large face close-up, "
       "close-up of the small hands and feet, close-up of the clothes. A Brazilian baby boy of about 4 months old in the 1980s: he cannot sit or stand, light-brown skin, fine dark hair, round cheeks, "
       "dark eyes, white cotton sleeveless vest and white cloth diaper. Same baby in every panel, no other people, real baby proportions." + ST.replace(" Lower right corner kept quiet.", ""))

if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    json.dump(eps, open(__import__('os').path.dirname(__file__) + "/../eps_antes_n3_correcao.json", "w"), ensure_ascii=False)
    E = {e["chave"]: e for e in eps}
    # 1) Kit A
    kit = E["kit-piloto"]["cenas"]
    for c in kit:
        d = c["descricao"]
        if d == "f06-pai":
            c["imagem"] = c["imagem"].replace(*KIT["f06-pai"][2]); c["situacao"] = "refazer"
            c.setdefault("historico", []).append({"quando": "2026-10-31T21:00", "tipo": "imagem", "veredito": "rejeitado", "categoria": "epoca",
              "nota": "O pai dos anos 80 parece ter ~50 anos, mais velho que o pai de hoje e que a esposa (~30). Refazer com ~33 anos."})
        if d == "f08-mae-hoje":
            c["imagem"] = F08; c["situacao"] = "refazer"
            c["obs"] = "CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR p04-caixas-mudanca + f09-pai-hoje (só o formato da folha) · salvar como f08-mae-hoje (apagar a antiga, mesmo nome)"
            c.setdefault("historico", []).append({"quando": "2026-10-31T21:00", "tipo": "imagem", "veredito": "rejeitado", "categoria": "personagem",
              "nota": "Muito parecida com a f01-mae — dá a impressão de ser a mesma mãe. A mãe de hoje é OUTRA pessoa: cabelo curto cacheado, cardigã mostarda."})
        if d == "f09-pai-hoje":
            c["imagem"] = c["imagem"].replace("ref-estilo-p04", EST)
    if not any(c["descricao"] == "f10-irmao-bebe" for c in kit):
        n = 1 + max(int(c["codigo"][1:]) for c in kit if c["codigo"].startswith("K"))
        kit.append({"codigo": f"K{n:02d}", "descricao": "f10-irmao-bebe", "situacao": "falta",
                    "obs": "CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR p04-caixas-mudanca + f07-jonas-2anos · salvar em Conta A › Kit de referência › 02-personagens como f10-irmao-bebe",
                    "imagem": F10})
    # 2) Notícia 02
    ep = E["noticia-3"]
    for c in ep["cenas"]:
        k = c["codigo"]
        if k in C:
            desc, obs, img, an = C[k]
            c["descricao"], c["obs"], c["animacao"] = desc, obs, an
            c["imagem"] = ("USAR a imagem indicada no ABRIR/obs (sem gerar nada)." if img is None else
                           f"REFERENCE ROLES: the attached image {EST} is the MASTER STYLE reference — match its look exactly, never copy its people or place. " + img + ST)
            c["situacao"] = "refazer"
        if k in NOTAS:
            cat, nota = NOTAS[k]
            h = c.setdefault("historico", [])
            if not any(x.get("nota") == nota for x in h):
                h.append({"quando": "2026-10-31T21:00", "tipo": "imagem", "veredito": "rejeitado", "categoria": cat, "nota": nota})
        if k == "E06":
            c["descricao"] = "[HOJE · sala do AEE] O livro, de perto (mesma imagem da E05)"
            c["situacao"] = "refazer"
        if k in ("E01", "E13", "E14", "E29"):
            c["descricao"] = "[ANOS 80 · livro] " + c["descricao"] if not c["descricao"].startswith("[") else c["descricao"]
    if not ep["notas"].startswith("LEGENDA DE ÉPOCA"):
        ep["notas"] = NOTA_EP + ep["notas"]
    # 3) planos -A e PLACE LOCK com os mapas novos (lugares.revisar refaz os L do Kit preservando situação)
    mud = {e["chave"]: e for e in lugares.revisar(list(E.values()))}
    for c in mud["kit-piloto"]["cenas"]:
        if c["descricao"] == "c04-sala-aee-A":
            # NÃO anexar a folha c04-sala-aee (saiu em desenho limpo) — criar só pela descrição
            c["obs"] = ("CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR p04-caixas-mudanca (NÃO anexar a folha c04-sala-aee) · salvar como c04-sala-aee-A "
                        "(apagar a antiga, mesmo nome — TODAS as cenas da sala abrem esta imagem)")
            c["imagem"] = c["imagem"].replace("the place shown in the attached reference sheet c04-sala-aee", "the place described below")
            c["situacao"] = "refazer"
            h = c.setdefault("historico", [])
            nota = "Saiu em desenho limpo e só com mesa e cadeiras de criança: pais sentavam em cadeirinha. Precisa de mesa de reunião de adulto, janela só na lateral esquerda."
            if not any(x.get("nota") == nota for x in h):
                h.append({"quando": "2026-10-31T21:00", "tipo": "imagem", "veredito": "rejeitado", "categoria": "lugar", "nota": nota})
        if c["descricao"] == "c08-quarto-A":
            c["obs"] = c["obs"].replace("salvar como", "salvar em Conta A › Kit de referência › 03-cenarios como")
    # limpa frases "OPENED IMAGE" repetidas (re-execuções antigas) e cenas sem imagem nova
    import re as _re
    for k in ("noticia-3", "noticia-4"):
        for c in mud[k]["cenas"]:
            im = c.get("imagem") or ""
            for frase in set(_re.findall(r"OPENED IMAGE = the fixed place [\w-]+: keep its walls, doors, windows, furniture and light exactly; only add or change what this text asks\. ", im)):
                while im.count(frase) > 1:
                    i = im.rfind(frase); im = im[:i] + im[i + len(frase):]
            if k == "noticia-4" and c["codigo"] == "E18":  # abre c06-pracinha-A; frase da rua sobrando
                im = im.replace("OPENED IMAGE = the fixed place c03-rua-bairro-A: keep its walls, doors, windows, furniture and light exactly; only add or change what this text asks. ", "")
            c["imagem"] = im
    for c in mud["noticia-3"]["cenas"]:
        if c["codigo"] == "E06":
            c["imagem"] = "USAR a imagem n3-E05 (sem gerar nada)."
    # cenas sem imagem nova não levam PLACE LOCK
    for c in mud["noticia-3"]["cenas"]:
        if c["imagem"].startswith("USAR"):
            c["imagem"] = "USAR a imagem indicada no ABRIR/obs (sem gerar nada)."
    if "--dry" in sys.argv:
        json.dump({k: mud[k] for k in ("kit-piloto", "noticia-3", "noticia-4")}, open(__import__('os').path.dirname(__file__) + "/../n3fix/dry.json", "w"), ensure_ascii=False, indent=1)
        sys.exit(0)
    for k in ("kit-piloto", "noticia-3", "noticia-4"):
        body = {"chave": k, "cenas": mud[k]["cenas"]}
        if k == "noticia-3":
            body["notas"] = mud[k]["notas"]
        r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps(body).encode(), headers=H, method="POST")))
        print(k, r["cenas_total"], "refazer:", [c["codigo"] for c in r["cenas"] if c["situacao"] == "refazer"])
