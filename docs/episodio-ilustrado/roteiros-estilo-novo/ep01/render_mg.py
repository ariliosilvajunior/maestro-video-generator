# Motion graphics da série A Rua de Pedra (camadas com transparência, desenhadas quadro a quadro).
import math, os, random, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont
D = os.path.dirname(os.path.abspath(__file__)) + '/'
K = '/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/kitcheck2/'
FB = '/home/user/recursoscognitivos/static/fonts/Goodly-Bold.woff'
FR = '/home/user/recursoscognitivos/static/fonts/Goodly-Regular.woff'
W, H, FPS = 1920, 1080, 25
NAVY, AZUL, AQUA, CREME = (43, 72, 114), (62, 105, 183), (86, 202, 201), (250, 240, 220)
ease = lambda x: 1 - (1 - max(0, min(1, x))) ** 3

def gravar(nome, frames, fundo_preto=False):
    pasta = D + nome + '_png/'; os.makedirs(pasta, exist_ok=True)
    for i, f in enumerate(frames()): f.save(f'{pasta}{i:04d}.png')
    args = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20'] if fundo_preto else ['-c:v', 'png']
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', pasta + '%04d.png'] + args + [D + nome + ('.mp4' if fundo_preto else '.mov')], check=True)

def particulas():  # poeira dourada flutuando (laço de 10 s, sobre preto, para mesclar em "screen")
    random.seed(7); n = 70
    ps = [(random.uniform(0, 960), random.uniform(0, 540), random.uniform(0.6, 2.4), random.uniform(-6, 6), random.uniform(-10, -3), random.uniform(0, 6.28)) for _ in range(n)]
    for i in range(10 * FPS):
        t = i / FPS; im = Image.new('RGB', (960, 540)); d = ImageDraw.Draw(im)
        for x, y, r, vx, vy, ph in ps:
            px = (x + vx * t + 8 * math.sin(t * 0.7 + ph)) % 960; py = (y + vy * t) % 540
            a = int(110 + 90 * math.sin(t * 1.3 + ph)); d.ellipse([px - r, py - r, px + r, py + r], fill=(a, int(a * 0.85), int(a * 0.55)))
        yield im.filter(ImageFilter.GaussianBlur(0.8)).resize((W, H))

def luz():  # vazamento de luz quente (3 s)
    for i in range(3 * FPS):
        t = i / (3 * FPS); im = Image.new('RGB', (480, 270)); d = ImageDraw.Draw(im)
        a = math.sin(t * math.pi)
        for cx, cy, r, cor in ((60 + 300 * t, 80, 160, (255, 150, 60)), (420 - 200 * t, 220, 130, (255, 200, 120))):
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=tuple(int(c * a * 0.8) for c in cor))
        yield im.filter(ImageFilter.GaussianBlur(60)).resize((W, H))

def titulo():  # "A Rua de Pedra" letra a letra subindo, subtítulo e brilhos (5,2 s)
    f1, f2 = ImageFont.truetype(FB, 150), ImageFont.truetype(FR, 54)
    tit, sub = 'A Rua de Pedra', 'Episódio 1  ·  Quem cuida de quem cuida'
    larg = [f1.getlength(c) for c in tit]; x0 = (W - sum(larg)) / 2; random.seed(3)
    brilhos = [(random.uniform(x0, W - x0), random.uniform(300, 520), random.uniform(0.4, 2.8)) for _ in range(25)]
    for i in range(int(5.2 * FPS)):
        t = i / FPS; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        sai = 1 - ease((t - 4.6) / 0.6)
        x = x0
        for k, c in enumerate(tit):
            p = ease((t - k * 0.07) / 0.5) * sai
            if p > 0:
                y = 330 + 40 * (1 - p)
                d.text((x + 4, y + 5), c, font=f1, fill=(0, 0, 0, int(150 * p)))
                d.text((x, y), c, font=f1, fill=CREME + (int(255 * p),))
            x += larg[k]
        p = ease((t - 1.2) / 0.7) * sai
        if p > 0:
            sx = (W - f2.getlength(sub)) / 2
            d.text((sx + 3, 524), sub, font=f2, fill=(0, 0, 0, int(140 * p))); d.text((sx, 520), sub, font=f2, fill=CREME + (int(255 * p),))
            d.line([(W / 2 - 300 * p, 500), (W / 2 + 300 * p, 500)], fill=AQUA + (int(220 * p),), width=3)
        for bx, by, b0 in brilhos:
            a = max(0, math.sin((t - b0) * 3)) * sai
            if t > b0 and a > 0:
                r = 3 + 5 * a; d.line([(bx - r * 2, by), (bx + r * 2, by)], fill=(255, 235, 180, int(230 * a)), width=2); d.line([(bx, by - r * 2), (bx, by + r * 2)], fill=(255, 235, 180, int(230 * a)), width=2)
        yield im

def rosto(arq, box):
    im = Image.open(K + arq).convert('RGB').crop(box).resize((220, 220))
    m = Image.new('L', (220, 220), 0); ImageDraw.Draw(m).ellipse([0, 0, 219, 219], fill=255); im.putalpha(m); return im

def cartao(nome, papel, face):  # nome com o rosto do personagem entrando pela esquerda (2,8 s)
    f1, f2 = ImageFont.truetype(FB, 64), ImageFont.truetype(FR, 34)
    for i in range(int(2.8 * FPS)):
        t = i / FPS; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        p = ease(t / 0.45) * (1 - ease((t - 2.35) / 0.45)); x = -560 + 680 * ease(t / 0.45)
        if t > 2.35: x = 120 - 80 * ease((t - 2.35) / 0.45)
        a = int(255 * p)
        d.rounded_rectangle([x, H - 300, x + 560, H - 110], radius=95, fill=NAVY + (int(200 * p),))
        d.ellipse([x + 8, H - 292, x + 182, H - 118], outline=AQUA + (a,), width=6)
        fc = face.resize((170, 170)); fa = fc.split()[3].point(lambda v: int(v * p)); fc.putalpha(fa); im.alpha_composite(fc, (int(x + 10), H - 290))
        d.text((x + 205, H - 270), nome, font=f1, fill=CREME + (a,)); d.text((x + 207, H - 190), papel, font=f2, fill=AQUA + (a,))
        yield im

def frase(txt, cor, dur=2.2):  # frase em destaque, palavra por palavra
    f = ImageFont.truetype(FB, 78); pal = txt.split(' ')
    for i in range(int(dur * FPS)):
        t = i / FPS; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        sai = 1 - ease((t - dur + 0.4) / 0.4); tot = f.getlength(txt); x = (W - tot) / 2
        for k, w in enumerate(pal):
            p = ease((t - k * 0.18) / 0.35) * sai
            if p > 0:
                y = H - 230 + 25 * (1 - p)
                d.text((x + 3, y + 4), w, font=f, fill=(0, 0, 0, int(160 * p))); d.text((x, y), w, font=f, fill=cor + (int(255 * p),))
            x += f.getlength(w + ' ')
        yield im

def mapa():  # a Rua de Pedra vista de cima: caminho pontilhado da casa até a escola (4 s, quadro inteiro)
    base = Image.open(D + 'CE27-D.jpg').convert('RGB'); bw = int(H * base.width / base.height)
    fundo = Image.new('RGB', (W, H), (250, 248, 244)); fundo.paste(base.resize((bw, H)), ((W - bw) // 2, 0))
    f = ImageFont.truetype(FB, 40); ox = (W - bw) // 2
    pts = [(ox + bw * 0.50, H * 0.92), (ox + bw * 0.52, H * 0.70), (ox + bw * 0.47, H * 0.48), (ox + bw * 0.52, H * 0.26), (ox + bw * 0.50, H * 0.08)]
    pins = [(pts[0], 'Casa da família', NAVY, 0.2), (pts[2], 'Pracinha', (150, 90, 40), 1.6), (pts[-1], 'Escola · porta azul', AZUL, 2.6)]
    seg = [math.dist(pts[k], pts[k + 1]) for k in range(len(pts) - 1)]; tot = sum(seg)
    for i in range(4 * FPS):
        t = i / FPS; z = 1.0 + 0.05 * t / 4
        im = fundo.resize((int(W * z), int(H * z))).crop((int((W * z - W) / 2), int((H * z - H) / 2), int((W * z - W) / 2) + W, int((H * z - H) / 2) + H)).convert('RGBA')
        d = ImageDraw.Draw(im); L = tot * ease((t - 0.3) / 2.8); acc = 0
        for k in range(len(pts) - 1):
            a, b = pts[k], pts[k + 1]; s = seg[k]
            for j in range(0, int(s), 26):
                if acc + j > L: break
                q = j / s; x = a[0] + (b[0] - a[0]) * q; y = a[1] + (b[1] - a[1]) * q
                d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(255, 255, 255, 255), outline=NAVY, width=3)
            acc += s
        for (x, y), nome, cor, t0 in pins:
            p = ease((t - t0) / 0.4)
            if p > 0:
                r = 22 * p; d.ellipse([x - r, y - r - 30 * p, x + r, y + r - 30 * p], fill=cor + (255,), outline=(255, 255, 255, 255), width=4)
                lx = x + 40; ly = y - 60
                d.rounded_rectangle([lx - 12, ly - 8, lx + f.getlength(nome) + 12, ly + 54], radius=18, fill=(255, 255, 255, int(230 * p)))
                d.text((lx, ly), nome, font=f, fill=cor + (int(255 * p),))
        yield im.convert('RGB')

if __name__ == '__main__':
    gravar('particulas', particulas, True); gravar('luz', luz, True)
    gravar('titulo', titulo)
    caras = {'Marta': ('PE09.jpg', (316, 536, 472, 692), 'a mãe'), 'Rogério': ('PE14.jpg', (24, 536, 176, 688), 'o pai'),
             'Caio': ('PE17.jpg', (0, 542, 220, 762), 'o irmão mais velho'), 'Davi': ('PE16.jpg', (4, 542, 204, 742), 'o caçula')}
    for n, (arq, box, papel) in caras.items():
        gravar('nome_' + n, lambda n=n, arq=arq, box=box, papel=papel: cartao(n, papel, rosto(arq, box)))
    gravar('frase_porta', lambda: frase('Guarda essa porta.', (140, 180, 255)))
    gravar('frase_verdinho', lambda: frase('Sempre o verdinho por último.', AQUA))
    gravar('mapa', mapa, True)
    print('ok')
