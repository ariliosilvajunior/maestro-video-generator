"""31/10/2026 — linha CAMERA & COLOR em cada cena da n3, tirada das fichas ShotDeck da pasta
"05-referencia cores-lentes" (Conta A). Dono: "vc está usando as referências de cores e lentes que anexei?".
Só os dados técnicos da ficha (frame size, lens, composition, lighting, palette) — nunca nome de filme/diretor."""

FICHAS = {  # nome no Drive → leitura dos dados da ficha (conferida olhando cada imagem)
 "image (10).png": "No Country for Old Men — 1980s, exterior day, wide, wide lens, balanced, hard sunny daylight, warm desaturated ochre + grey-blue sky, 35mm film",
 "image (9).png": "Highway — exterior day, extreme wide, medium lens, right-heavy, hard sunny daylight, warm desaturated, 35mm film",
 "image (12).png": "Opus — exterior day, extreme wide, telephoto, balanced, hard top light, warm saturated yellow",
 "image (8).png": "Empire of Light — 1980s, interior night, wide, wide lens, left-heavy, soft practical light, warm saturated amber with cyan accents",
 "image (6).png": "Presence — interior night, wide, ultra-wide, balanced, backlight from practical lamps, warm saturated yellow",
 "image (13).png": "I Know What You Did Last Summer — interior day, medium 2-shot, medium lens, balanced, top + side light (fluorescent), muted green-grey and beige",
}
G_RUA = ("CAMERA & COLOR (ShotDeck sheets in 05-referencia cores-lentes): wide establishing frame, wide-to-medium lens, balanced composition, hard sunny daylight "
         "with long shadows, warm desaturated ochre and dry-grass palette under a pale grey-blue sky, fine 35mm film grain. ")
G_NOITE = ("CAMERA & COLOR (ShotDeck sheets in 05-referencia cores-lentes): wide interior frame, wide lens, left-heavy composition, soft practical light from the "
           "kerosene lamp only, deep shadows in the corners, warm amber palette with a faint cool cyan in the window, fine 35mm film grain. ")
G_CASA_DIA = ("CAMERA & COLOR (ShotDeck sheets in 05-referencia cores-lentes): wide interior frame, wide lens, left-heavy composition, soft side daylight through "
              "the window, warm amber and faded-blue palette, gentle falloff into shadow, fine 35mm film grain. ")
G_CLINICA = ("CAMERA & COLOR (ShotDeck sheets in 05-referencia cores-lentes): medium frame (2-shot feel), medium lens, balanced composition, top light plus side "
             "light from the window, muted green-grey and beige palette, slightly cool whites, fine 35mm film grain. ")
G_HOJE = ("CAMERA & COLOR (ShotDeck sheets in 05-referencia cores-lentes): medium-wide frame at adult eye level, medium lens, balanced composition, soft natural "
          "side daylight from the window on the camera-left, warm clean palette (honey wood, off-white, the room's blue), gentle shadows, fine film grain. ")
GRUPO = {}
for k in ("E01", "E16", "E29"):
    GRUPO[k] = G_RUA
for k in ("E13", "E15", "E22"):
    GRUPO[k] = G_NOITE
for k in ("E08", "E09", "E17", "E18", "E19"):
    GRUPO[k] = G_CASA_DIA
for k in ("E10", "E11", "E12", "E23"):
    GRUPO[k] = G_CLINICA
for k in ("E02", "E03", "E04", "E05", "E07", "E20", "E21", "E24", "E25", "E26", "E27", "E28"):
    GRUPO[k] = G_HOJE


def aplicar(ep):
    """Põe a linha CAMERA & COLOR só nas cenas que ainda vão ser geradas (não mexe no que o dono já aprovou)."""
    feitos = []
    for c in ep["cenas"]:
        g = GRUPO.get(c["codigo"])
        img = c.get("imagem") or ""
        if not g or c.get("situacao") not in ("refazer", "falta") or img.startswith("USAR") or "CAMERA & COLOR" in img:
            continue
        alvo = " PLACE LOCK" if " PLACE LOCK" in img else " STYLE LOCK"
        if alvo not in img:
            continue
        c["imagem"] = img.replace(alvo, " " + g.strip() + alvo, 1)
        feitos.append(c["codigo"])
    return feitos
