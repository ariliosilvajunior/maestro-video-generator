"""Capa do YouTube do episódio piloto (1280x720)."""
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

D = "/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/ep1/thumb/"
BLACK = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
BOLD = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
W, H = 1280, 720

# fundo: posto de saúde fechado (p03), levemente escurecido à esquerda para o texto
fundo = Image.open(D + "p03.png").convert("RGB")
fundo = fundo.resize((W, int(fundo.height * W / fundo.width)), Image.LANCZOS).crop((0, 0, W, H))
fundo = ImageEnhance.Contrast(ImageEnhance.Color(fundo).enhance(1.1)).enhance(1.08)
sombra = Image.new("L", (W, H))
ds = ImageDraw.Draw(sombra)
for x in range(W):
    ds.line([(x, 0), (x, H)], fill=int(max(0, 200 * (1 - x / 820))))
fundo = Image.composite(Image.new("RGB", (W, H), (12, 10, 8)), fundo, sombra)
vinheta = Image.new("L", (W, H), 0)
ImageDraw.Draw(vinheta).rectangle((0, H - 140, W, H), fill=120)
fundo = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), fundo, vinheta.filter(ImageFilter.GaussianBlur(60)))

# o Prof. Arilio à direita, com contorno claro para destacar
av = Image.open(D + "avatar_recorte.png").convert("RGBA")
alt = 640
av = av.resize((alt, alt), Image.LANCZOS)
x_av, y_av = W - alt + 70, H - alt + 20
borda = av.split()[3].filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.GaussianBlur(3))
fundo.paste(Image.new("RGB", av.size, (255, 255, 255)), (x_av, y_av), borda)
fundo.paste(av, (x_av, y_av), av)

d = ImageDraw.Draw(fundo)


def texto(xy, t, fonte, cor, contorno=8):
    d.text(xy, t, font=fonte, fill=cor, stroke_width=contorno, stroke_fill=(0, 0, 0))


f1 = ImageFont.truetype(BLACK, 104)
f2 = ImageFont.truetype(BLACK, 132)
f3 = ImageFont.truetype(BLACK, 48)
texto((48, 70), "NÃO HAVIA", f1, (255, 255, 255))
texto((44, 178), "PEDIATRA", f2, (255, 206, 38), 10)
texto((48, 320), "NA CIDADE", f1, (255, 255, 255))
# faixa: o que o vídeo entrega
frase = "E UM FILHO AUTISTA"
x0, y0, x1, y1 = d.textbbox((0, 0), frase, font=f3)
d.rounded_rectangle((48, 468, 48 + (x1 - x0) + 44, 468 + (y1 - y0) + 36), radius=14, fill=(229, 57, 53))
d.text((70 - x0, 486 - y0), frase, font=f3, fill=(255, 255, 255))

fundo.save(D + "capa_piloto.png", optimize=True)
fundo.save(D + "capa_piloto.jpg", quality=92)
fundo.resize((320, 180), Image.LANCZOS).save(D + "capa_piloto_celular.png")
print("ok")
