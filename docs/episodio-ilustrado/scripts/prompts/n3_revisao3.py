"""31/10/2026 — 3ª revisão do revisor-cenas (19 problemas + direção de fotografia "quero algo incrível").
Roda DEPOIS de n3_fichas / n3_revisao2 / n3_camera e da restauração das cenas aprovadas."""
import re

CAM = re.compile(r"CAMERA & COLOR \(ShotDeck sheets in 05-referencia cores-lentes\):.*?fine (?:35mm )?film grain\.", re.S)
C = "CAMERA & COLOR (ShotDeck sheets in 05-referencia cores-lentes): "
CAM_INSERT = (C + "close insert frame at table height, medium lens, balanced composition with the book on the left third, shallow depth of field (book and hands "
              "sharp, background soft), soft daylight from the window on the camera-LEFT raking across the tabletop, warm clean palette (honey wood, off-white, "
              "mustard, navy), gentle shadows under the hands, fine film grain.")
CAM_CASA = (C + "wide interior frame, wide lens, left-heavy composition, warm late-afternoon daylight from the window on the camera-RIGHT with a sharp sun patch on "
            "the tiles, plus a softer spill from the half-open back door on the camera-left, warm amber and faded-blue palette, fine 35mm film grain.")
CAM_QUARTO = (C + "wide interior frame, wide lens, left-heavy composition, soft afternoon daylight from the small window on the camera-LEFT through the thin "
              "curtain, warm amber and faded-blue palette, gentle falloff into shadow, fine 35mm film grain.")
CAM_CONSULT = (C + "wide interior frame exactly as in c05-consultorio-A, medium lens, balanced composition, warm side daylight from the window on the "
               "camera-right, muted green-grey walls with beige and warm wood, no cool cast, fine 35mm film grain.")
CAM_CORREDOR = (C + "wide one-point-perspective frame exactly as in c07-corredor-clinica-A, wide lens, balanced symmetrical composition, warm daylight from the "
                "window at the far end plus dim top light from the ceiling fixtures, muted green-grey and beige palette, fine 35mm film grain.")
CAM_RUA = (C + "wide establishing frame, wide-to-medium lens, balanced composition, low warm sun from the camera-right with long raking shadows falling toward "
           "the camera-left, light haze over the hills, warm desaturated ochre and dry-grass palette, fine 35mm film grain.")
CAM_NOITE = (C + "wide interior frame, wide lens, right-heavy composition exactly as in n3-E13 (the lit table, lamp and woman on the camera-right, the dark sofa "
             "and room on the camera-left as empty negative space), soft practical light from the kerosene lamp only, deep shadows, warm amber palette with a "
             "faint cool cyan in the window, fine 35mm film grain.")
CAMERAS = {"E05": CAM_INSERT, "E07": CAM_INSERT, "E28": CAM_INSERT, "E08": CAM_CASA, "E09": CAM_CASA, "E17": CAM_QUARTO, "E18": CAM_QUARTO,
           "E19": CAM_QUARTO, "E10": CAM_CONSULT, "E11": CAM_CONSULT, "E12": CAM_CORREDOR, "E23": CAM_CORREDOR, "E16": CAM_RUA, "E22": CAM_NOITE}

ST = (" STYLE LOCK (match p04-caixas-mudanca exactly): cinematic painterly realism almost like a photograph painted in oil, realistic adult faces and hands with five "
      "fingers, fine canvas grain and crosshatched texture over the whole image, low golden side light. NOT a clean digital illustration, NOT a cartoon, NOT "
      "watercolor, NOT ink line drawing. No readable text. Lower right corner kept quiet.")
REF = "REFERENCE ROLES: the attached image p04-caixas-mudanca is the MASTER STYLE reference — match its look exactly, never copy its people or place. "
FIM = " raw cinematic imperfect realism, subtle motion blur, natural film grain, uneven light falloff, lived-in textures."

E04_IMG = (REF + "The attached scene n3-E04 is the SAME moment seen wider: same table, same people, same clothes, same light. Close-up insert of the light-wood adult "
  "meeting table from n3-E04, camera at table height just in front of the near table edge, looking straight across the tabletop toward the parents' torsos. In the "
  "camera-left third, the closed off-white hardback book exactly as in obj-09-livro (plain matte off-white cover, no illustration, no title, about 3 cm thick) lies "
  "flat, its long side parallel to the table edge, exactly where it is in n3-E04, just to the camera-LEFT of the mother's hands. In the centre, the mother's clasped "
  "hands resting on the table (f08-mae-hoje, about 38 years old: smooth warm-brown hands of a 38-year-old, mustard-yellow cardigan cuffs). In the camera-right third, "
  "the father's hand resting flat on the table (f09-pai-hoje, about 40: light-brown hand with the plain gold wedding ring seen in n3-E04, navy polo sleeve). Faces out "
  "of frame above the top edge — hands of their real age, NOT old, five fingers each. BACKGROUND EXACTLY AS IN n3-E04, at table height and softly out of focus: behind "
  "the book and the mother's hands, her mustard-yellow cardigan and white t-shirt, and further back on the camera-left the lower shelves of the tall light-wood shelf "
  "with transparent plastic boxes of coloured pencils; behind the father's hand, his navy polo shirt. On the table there are only the book and the hands; the bare "
  "light-wood tabletop fills the foreground and the lower right corner. " + CAM_INSERT.replace("raking across the tabletop", "raking across the tabletop and the book cover") + ST)
E04_OBS = ("CRIAR · ANEXAR n3-E04 (a atual — baixar antes de apagar) + obj-09-livro + f08-mae-hoje + f09-pai-hoje + p04-caixas-mudanca · apagar a n3-E04 antiga e "
           "salvar a nova como n3-E04 em Conta A › RC – Notícias 02 › 07-episodios · fazer depois da ficha obj-09-livro")
E03_IMG = (REF + "OPENED IMAGE = n3-E03. Keep this exact image: the same woman (f08-mae-hoje, about 38, short curly dark hair, mustard-yellow cardigan over a white "
  "t-shirt), her pose, face, expression and clasped hands, the dark-grey adult chair, the tall light-wood shelf with transparent boxes directly behind her, the "
  "trailing green plant above her on the camera-right, the blue felt board with cream cards on the camera-right, the window light from the camera-left, the framing "
  "and the colours. Change only: add the closed off-white hardback book from obj-09-livro lying flat on the table just to the camera-LEFT of her clasped hands, its "
  "long side parallel to the table edge, fully inside the frame, exactly where it is in n3-E02 (between her hands and the left end of the table). ONE book only. "
  "Change nothing else. " + C + "keep the opened image's medium shot at adult eye level, medium lens, soft daylight from the window on the camera-left, warm clean "
  "palette (honey wood, off-white, mustard, the board's blue), fine film grain." + ST)
E03_OBS = "ABRIR n3-E03 · ANEXAR obj-09-livro + p04-caixas-mudanca · salvar por cima com o mesmo nome · depois da ficha obj-09-livro"
E25_IMG = (REF + "OPENED IMAGE = the new n3-E04 insert. Keep this exact insert, table, book and light. Change only: the father's hand (f09-pai-hoje, about 40, navy "
  "polo sleeve) moves over and rests on top of the mother's clasped hands (f08-mae-hoje, about 38, mustard-yellow cardigan cuffs); her fingers loosen under his. The "
  "teacher's notebook stays out of frame. Change nothing else. " + CAM_INSERT + ST)
E29_ANIM_TAIL = ("CAMERA: static, 0–6 s. ACTION: the sunset light fades very slightly; the trees' leaves sway gently; end still. ACTING: —. LIGHT AND AMBIENCE: the "
                 "house windows keep glowing warm. INTEGRITY: houses, gate, poles, wires and fence do not move." + FIM)

TROCAS = [  # (cena, campo, velho, novo) — velho None = regex especial tratado abaixo
 ("E08", "imagem", "standing in the middle of the room facing the half-open back door, one hand at her mouth, worried",
  "standing in the middle of the room in three-quarter profile, turned toward the half-open back door on the camera-left, her worried face visible to the camera, one hand at her mouth"),
 ("E09", "animacao", None, None),
 ("E10", "imagem", "sitting at the desk;", "sitting on a plain wooden chair BEHIND the desk, between the desk and the wall with the anatomy poster, facing the parents across the desk (his face toward the camera);"),
 ("E12", "imagem", "sitting side by side on the wooden bench by the LEFT wall, waiting;", "sitting side by side on the third and fourth wooden seats from the camera in the row along the LEFT wall, waiting, the mother's hands twisting the strap of her handbag in her lap;"),
 ("E16", "imagem", "walking away from the camera down the LEFT side of the street, past the houses,", "walking away from the camera on the dirt in front of the second (pale-yellow) house,"),
 ("E19", "imagem", "kneeling in the middle of the room hugging", "kneeling on the tiles in the front-left part of the room, between the wooden chest under the window and the foot of the bed, large in the frame, hugging"),
 ("E19", "imagem", "the baby lies alone in the crib looking at the ceiling", "in the back-right corner, small and far, the baby lies awake and alone in the crib looking at the ceiling"),
 ("E26", "imagem", "arranging wooden puzzles and picture cards on it, alone", "taking one transparent plastic box of wooden puzzles from the tall light-wood shelf, holding it in both hands, alone"),
]


def aplicar(E):
    falhas = []
    ep, kit = E["noticia-3"], E["kit-piloto"]
    for c in kit["cenas"]:
        d = c["descricao"]
        if d in ("f06-pai-roupas", "f07-jonas-2anos-roupas"):
            c["imagem"] = c["imagem"].replace("OUTFIT A (at home):", "OUTFIT A (at home and walking in the neighbourhood):").replace(
                "OUTFIT B (going out):", "OUTFIT B (going to town — doctor, clinic):")
        if d == "obj-09-livro":
            c["imagem"] = c["imagem"].replace("a small hardback-like book about 14 x 21 cm and 3 cm thick, a plain matte cream/off-white cover",
                "a small hardback book about 17 x 24 cm and 3 cm thick, a plain matte off-white (light warm-grey) cloth-bound hard cover")
        if d == "f11-pediatra-anos80" and "1.70 m" not in c["imagem"]:
            c["imagem"] = c["imagem"].replace("about 65 years old:", "about 65 years old: about 1.70 m tall, slightly stooped shoulders,")
    for c in ep["cenas"]:
        k = c["codigo"]
        if c.get("situacao") in ("refazer", "falta"):
            c["imagem"] = c["imagem"].replace("off-white paperback", "off-white hardback")
            if k in CAMERAS:
                novo, n = CAM.subn(CAMERAS[k], c["imagem"], count=1)
                if n:
                    c["imagem"] = novo
                else:
                    falhas.append(f"{k}: sem linha de câmera para trocar")
        for kk, campo, velho, novo in TROCAS:
            if kk != k or velho is None:
                continue
            if novo in c[campo]:
                continue
            if velho in c[campo]:
                c[campo] = c[campo].replace(velho, novo, 1)
            else:
                falhas.append(f"{k}.{campo}: não achei «{velho[:45]}»")
        if k == "E09":
            a = re.sub(r"ACTION:.*?(?= ACTING:)", "ACTION: nothing moves; only dust drifts slowly in the light from the yard.", c["animacao"], count=1, flags=re.S)
            c["animacao"] = re.sub(r"INTEGRITY:[^.]*", "INTEGRITY: stable image; the half-open back door stays perfectly still; the toy truck, sofa, table and stove do not move", a, count=1)
        if k == "E10" and "near foreground" not in c["imagem"]:
            c["imagem"] = c["imagem"].replace(" OUTFITS (from", " The backs of the two wooden chairs and Maria's shoulder are in the near foreground, the doctor's face lit by "
                "the window beyond the desk; the parents are seen in three-quarter back view. The posters show only pictures; any lettering on them is blurred and unreadable. OUTFITS (from", 1)
        if k == "E16" and "tiny in the frame" not in c["imagem"]:
            c["imagem"] = c["imagem"].replace(" OUTFITS (from", " The mother and the boy are tiny in the frame, with most of the long empty red road ahead of them toward the hills. OUTFITS (from", 1)
        if k == "E19":
            c["obs"] = c["obs"].replace("ABRIR n3-E17 (SOMENTE depois que a nova n3-E17", "ABRIR n3-E18 (SOMENTE depois que a nova n3-E18")
        if k == "E22" and "ONLY person" not in c["imagem"]:
            c["imagem"] = c["imagem"].replace(" OUTFITS (from", " The wardrobe sheet only confirms her dress: she stays the ONLY person, do not add a second woman. OUTFITS (from", 1)
        if k == "E04":
            c["imagem"], c["obs"], c["situacao"] = E04_IMG, E04_OBS, "refazer"
        if k == "E03":
            c["imagem"], c["obs"], c["situacao"] = E03_IMG, E03_OBS, "refazer"
        if k == "E25":
            c["imagem"] = E25_IMG
            c["obs"] = ("ABRIR n3-E04 (SOMENTE depois que a nova n3-E04, o close de mãos e livro, for aprovada) · ANEXAR p04-caixas-mudanca · apagar a n3-E25 "
                        "antiga e salvar a nova como n3-E25")
        if k == "E29" and "the sunset light fades very slightly" not in c["animacao"]:
            i = c["animacao"].find("CAMERA") if "CAMERA" in c["animacao"] else c["animacao"].find("No dialogue, no music, no text. ") + len("No dialogue, no music, no text. ")
            c["animacao"] = c["animacao"][:i] + E29_ANIM_TAIL
        if k == "E06" and "recorte" not in c["obs"]:
            c["obs"] += " · montagem: recorte no livro e nas mãos (aprox. 150%) · apagar a imagem antiga antes de salvar"
        if k in ("E15", "E20") and "apagar a imagem antiga" not in c["obs"]:
            c["obs"] += " · apagar a imagem antiga antes de salvar"
    nota = ep["notas"]
    i = nota.find("FICHAS / CENÁRIOS A CRIAR PRIMEIRO")
    if i >= 0:
        j = nota.find("• c05-consultorio", i)
        fim = nota.find("\n\n", j) if j >= 0 else -1
        nota = nota[:i] + (nota[fim + 2:] if fim >= 0 else "")
    nota = re.sub(r"ORDEM: 1\) Kit primeiro:.*?2\) Só depois as cenas marcadas Refazer\.",
                  "ORDEM: 1) Kit primeiro: K07 f01-mae-roupas, K08 f06-pai-roupas, K09 f07-jonas-2anos-roupas, K10 f11-pediatra-anos80, O01 obj-09-livro, "
                  "O02 obj-12-carrinho-madeira, O03 obj-13-ficha-matricula (salvar no Drive). 2) Só depois as cenas marcadas Refazer.", nota, count=1, flags=re.S)
    if "RECORTES NA MONTAGEM" not in nota:
        nota = ("RECORTES NA MONTAGEM (sem gerar imagem): E06 livro e mãos (~150%), E11 mão do médico entregando o papel ao pai, E15 rosto da Maria, E18 bebê no berço, "
                "E22 mãos com a folha de exame sob a lamparina, E23 rosto da Maria encostado na parede.\n") + nota
    ep["notas"] = nota
    return falhas


# ---------- 4ª revisão (confirmação): 7 problemas + avisos ----------
E07_NOVO = ("OPENED IMAGE = the new n3-E04 insert. Keep this exact insert: table, camera at table height, light, the mother's and father's hands and sleeves. "
            "Change only: the same off-white hardback book, still exactly where it is in n3-E04 on the camera-left third, now lies open in the middle, its cream "
            "pages lit by the daylight from the camera-LEFT; the mother's right hand leaves her clasped hands and rests one fingertip on the open page. ONE book "
            "only. No readable text. Change nothing else.")


def aplicar4(E):
    falhas = []
    ep = E["noticia-3"]

    def troca(c, campo, velho, novo):
        if novo in c[campo]:
            return
        if velho in c[campo]:
            c[campo] = c[campo].replace(velho, novo, 1)
        else:
            falhas.append(f"{c['codigo']}.{campo}: não achei «{velho[:45]}»")
    for c in ep["cenas"]:
        k = c["codigo"]
        if k == "E07":
            c["obs"] = ("ABRIR n3-E04 (SOMENTE depois que a nova n3-E04, o close de mãos e livro, for aprovada) · ANEXAR p04-caixas-mudanca · apagar a n3-E07 "
                        "antiga e salvar a nova como n3-E07")
            novo, n = re.subn(r"Keep this exact table.*?\(no illustration, no title\)\.", E07_NOVO, c["imagem"], count=1, flags=re.S)
            if n:
                c["imagem"] = novo
            elif E07_NOVO not in c["imagem"]:
                falhas.append("E07: trecho 'Keep this exact table…(no illustration, no title).' não achado")
        if k == "E10":
            troca(c, "imagem", "sitting on a plain wooden chair BEHIND the desk, between the desk and the wall with the anatomy poster, facing the parents across the desk (his face toward the camera);",
                  "sitting on a plain wooden chair at the desk on the camera-left, in front of its drawers, his chair turned away from the desk toward the parents (his face toward the camera);")
            troca(c, "imagem", "the doctor's face lit by the window beyond the desk;", "the doctor's face lit from the camera-right by the large window;")
        if k == "E11":
            troca(c, "imagem", "the doctor leans over the desk and hands", "the doctor leans forward from his chair and hands")
        if k == "E25":
            c["imagem"] = c["imagem"].replace(" The teacher's notebook stays out of frame.", "")
            troca(c, "animacao", "her shoulders drop as she breathes out", "her fingers loosen and relax under his hand")
            troca(c, "animacao", "chairs and table do not move", "the book, the wedding ring and the table do not move")
        if k == "E03":
            troca(c, "animacao", "the table and the board behind do not move", "the book, the table and the board behind do not move")
        if k == "E06":
            c["obs"] = "NÃO GERAR IMAGEM: apagar a n3-E06 antiga, copiar a n3-E05 e salvar como n3-E06 · montagem: recorte no livro e nas mãos (aprox. 150%)"
        if k == "E16":
            troca(c, "imagem", "The mother and the boy are tiny in the frame", "The mother and the boy are small in the frame (the mother about one fifth of the frame height)")
        if k == "E04":
            troca(c, "imagem", "behind the father's hand, his navy polo shirt.", "behind the father's hand, his navy polo shirt; the window stays out of frame on the camera-left, never behind the parents.")
        if k == "E05" and c.get("situacao") not in ("refazer", "falta"):
            c["obs"] = "JÁ APROVADA — não refazer"
    ep["notas"] = ep["notas"].replace("RECORTES NA MONTAGEM (sem gerar imagem):",
        "RECORTES NA MONTAGEM (aproximar na edição a imagem da própria cena — não gerar close extra; E06 e E15 não geram imagem (são cópias)):")
    return falhas
