"""31/10/2026 — 2ª revisão do revisor-cenas na n3 (E03 E04 E07 E21 E24 E28). Aplica sobre o dict de episódios."""
import re

TROCAS = {
 "E03": [("imagem", "just above her head on the side toward the father (above her LEFT shoulder, camera-right)", "just above her head, slightly to the camera-right of it"),
         ("imagem", "The father is out of frame on the camera-right.", "At the far camera-right edge of the frame only the left edge of the blue felt board and a sliver of the father's navy-blue shoulder are visible; his face is out of frame."),
         ("animacao", "the table and the board behind do not move", "the table, the tall shelf, the plastic boxes, the hanging plant and the felt board do not move")],
 "E04": [("imagem", "The frame ends just past the father's right elbow, so the children's corner on the right is out of frame.",
          "The frame ends just past the father's camera-right elbow, so the yellow children's chairs on the camera-right are out of frame.")],
 "E07": [("imagem", "daylight coming from the LEFT", "daylight coming from the camera-LEFT"), ("animacao", "dust in the light from the left", "dust in the light from the camera-left")],
 "E21": [("imagem", "just stepping into the room through that door, hesitant, the father a step behind", "both already inside the room, standing on the floor just in front of the open door, the father one step behind the mother, hesitant"),
         ("imagem", "white sneakers, smooth hands of a 38-year-old", "white sneakers, a small brown leather crossbody bag on her shoulder (as in f08-mae-hoje), smooth hands of a 38-year-old"),
         ("animacao", "they take one step in and stop, looking at the room; end still", "they take one small step forward toward the meeting table and stop, looking at the room; end still")],
 "E28": [("imagem", "and a pencil beside the closed book.", "and a pencil on the table in front of the mother, to the camera-right of the closed book; the book stays exactly where it is in n3-E04.")],
}
E24_NOVO = ("Seen from behind in three-quarter view, at full adult scale, his head and shoulders are centred on the gap between the mother and the father: the mother stays "
            "visible on the camera-left of his head and the father on the camera-right of it, both faces fully visible; his shoulders may overlap only the edge of the table "
            "between them, never the book.")


def aplicar(ep):
    falhas = []
    for c in ep["cenas"]:
        for campo, velho, novo in TROCAS.get(c["codigo"], []):
            if novo in c[campo]:
                continue
            if velho not in c[campo]:
                falhas.append(f"{c['codigo']}.{campo}: não achei «{velho[:50]}»")
                continue
            c[campo] = c[campo].replace(velho, novo, 1)
        if c["codigo"] == "E24" and E24_NOVO not in c["imagem"]:
            novo, n = re.subn(r"He sits on that chair turned slightly.*?nobody is hidden behind him\.", E24_NOVO, c["imagem"], count=1, flags=re.S)
            if n:
                c["imagem"] = novo
            else:
                falhas.append("E24: trecho 'He sits on that chair…' não achado")
    return falhas
