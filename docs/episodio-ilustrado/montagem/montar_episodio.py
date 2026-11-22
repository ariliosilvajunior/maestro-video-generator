"""Montagem automática dos episódios ilustrados (A Rua de Pedra) — o dono só aprova.

Formato aprovado no Ep01 (22/11/2026): narração do dono (ElevenLabs v3 + troca para a voz dele) + falas dos personagens
com as vozes escolhidas + efeitos sonoros nas pausas + cenas do Flow no tempo do áudio (vídeo em vai-e-volta, imagem
parada com zoom lento) + motion (título, cartão com rosto, frases em destaque, luz quente, poeira dourada).

    python3 montar_episodio.py audio    <episodio.json>   # gera falas/efeitos e a linha do tempo
    python3 montar_episodio.py previa   <episodio.json>   # manda os 3 primeiros minutos para o Painel (Preview de áudio)
    python3 montar_episodio.py status   <episodio.json>   # aguardando_aprovacao_audio | audio_aprovado | rejeitado
    python3 montar_episodio.py video    <episodio.json>   # monta o episódio (só depois do som aprovado) + folha de conferência
    python3 montar_episodio.py entregar <episodio.json>   # sobe o 1080p e o 720p na pasta do episódio no Drive

Episódio = um JSON nesta pasta (ver rp-ep01.json): blocos (N = narrador, P:<personagem> = fala, S:<efeito>:<seg> = efeito
em destaque, G:<seg> = respiro), cada bloco com as cenas que aparecem nele; motion/luz/música ancorados em (bloco, posição).
Chaves: ElevenLabs em ELEVENLABS_API_KEY; Painel em CONTENT_FACTORY_API_TOKEN (nunca imprimir).
"""
import base64, json, math, os, random, subprocess, sys, urllib.request, uuid

AQUI = os.path.dirname(os.path.abspath(__file__))
PAINEL = 'https://painel.recursoscognitivos.com.br'
VOZES = os.path.join(AQUI, '..', 'roteiros-estilo-novo', 'vozes_personagens.json')
FB, FR = os.path.join(AQUI, 'fontes', 'Goodly-Bold.woff'), os.path.join(AQUI, 'fontes', 'Goodly-Regular.woff')
W, H, FPS, XF = 1920, 1080, 25, 0.5
TR = ['fade', 'dissolve', 'fade', 'smoothleft', 'fade', 'fadeblack', 'dissolve', 'smoothright']
run = lambda c: subprocess.run(c, check=True)
dur = lambda f: float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).decode())


def trabalho(ep):
    d = os.environ.get('MONTAGEM_DIR', '/tmp/claude/montagem') + '/' + ep['chave'] + '/'
    for s in ('a', 'clipes', 'mg', 'seg'):
        os.makedirs(d + s, exist_ok=True)
    return d


def painel(metodo, caminho, corpo=None, bruto=False):
    h = {'Authorization': 'Bearer ' + os.environ['CONTENT_FACTORY_API_TOKEN'], 'Content-Type': 'application/json'}
    r = urllib.request.urlopen(urllib.request.Request(PAINEL + caminho, method=metodo, headers=h,
                                                      data=json.dumps(corpo).encode() if corpo is not None else None), timeout=300)
    return r.read() if bruto else json.load(r)


# ---------------------------------------------------------------- áudio
def _el(url, corpo, out):
    if os.path.exists(out):
        return
    h = {'xi-api-key': os.environ['ELEVENLABS_API_KEY'], 'Content-Type': 'application/json'}
    open(out, 'wb').write(urllib.request.urlopen(urllib.request.Request(url, data=json.dumps(corpo).encode(), headers=h, method='POST'), timeout=300).read())


def _sts(voz, fi, fo):
    if os.path.exists(fo):
        return
    b = '----' + uuid.uuid4().hex
    c = lambda n, v: f'--{b}\r\nContent-Disposition: form-data; name="{n}"\r\n\r\n{v}\r\n'
    corpo = (c('model_id', 'eleven_multilingual_sts_v2') + c('voice_settings', json.dumps({"stability": 0.4, "similarity_boost": 0.95, "style": 0.0, "use_speaker_boost": True}))
             + f'--{b}\r\nContent-Disposition: form-data; name="audio"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n').encode() + open(fi, 'rb').read() + f'\r\n--{b}--\r\n'.encode()
    h = {'xi-api-key': os.environ['ELEVENLABS_API_KEY'], 'Content-Type': 'multipart/form-data; boundary=' + b}
    r = urllib.request.urlopen(urllib.request.Request(f'https://api.elevenlabs.io/v1/speech-to-speech/{voz}?output_format=mp3_44100_192', data=corpo, headers=h, method='POST'), timeout=600)
    open(fo, 'wb').write(r.read())


def audio(ep):
    D = trabalho(ep); V = json.load(open(VOZES)); dono = ep['voz_narrador']
    for n, s in ep['sfx'].items():
        _el('https://api.elevenlabs.io/v1/sound-generation', {"text": s['texto'], "duration_seconds": s['seg'], "prompt_influence": 0.5}, D + f'a/sfx_{n}.mp3')
    for i, b in enumerate(ep['blocos']):
        cfg = {'model_id': 'eleven_v3', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8}}
        if b['tipo'] == 'N':
            _el(f'https://api.elevenlabs.io/v1/text-to-speech/{dono}?output_format=mp3_44100_192', {'text': b['texto'], **cfg}, D + f'a/v{i:03d}.mp3')
            _sts(dono, D + f'a/v{i:03d}.mp3', D + f'a/b{i:03d}.mp3')
        elif b['tipo'].startswith('P:'):
            _el(f"https://api.elevenlabs.io/v1/text-to-speech/{V[b['tipo'][2:]]['voice_id']}?output_format=mp3_44100_192", {'text': b['texto'], **cfg}, D + f'a/b{i:03d}.mp3')
        print('bloco', i, flush=True)
    T = []; t = 0.6
    for i, b in enumerate(ep['blocos']):
        if b['tipo'] == 'N' or b['tipo'].startswith('P:'):
            run(['ffmpeg', '-v', 'error', '-y', '-i', D + f'a/b{i:03d}.mp3', '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
                 'silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '1', D + f'a/c{i:03d}.wav'])
            d = dur(D + f'a/c{i:03d}.wav'); T.append({'i': i, 'tipo': b['tipo'], 'ini': t, 'dur': d}); t += d + (0.55 if b['tipo'] == 'N' else 0.7)
        elif b['tipo'].startswith('S:'):
            _, n, d = b['tipo'].split(':'); d = float(d); T.append({'i': i, 'tipo': b['tipo'], 'sfx': n, 'ini': t, 'dur': d}); t += d
        else:
            d = float(b['tipo'][2:]); T.append({'i': i, 'tipo': b['tipo'], 'ini': t, 'dur': d}); t += d
    json.dump({'blocos': T, 'fim': t + 2.5}, open(D + 'timeline.json', 'w'), indent=1)
    mixar(ep)
    print('duração', round(t + 2.5, 1))


def _tempo(ep, TL, a):
    if a == 'fim':
        return TL['fim']
    if isinstance(a, str) and a.startswith('fim-'):
        return TL['fim'] - float(a[4:])
    b = TL['blocos'][a['bloco']]
    return b['ini'] + a['pos'] * b['dur']


def mixar(ep):
    D = trabalho(ep); TL = json.load(open(D + 'timeline.json')); FIM = TL['fim']
    ain, af, vozes, efx = [], [], [], []

    def add(f):
        ain.extend(['-i', f]); return len(ain) // 2 - 1
    for b in TL['blocos']:
        ms = int(b['ini'] * 1000)
        if b['tipo'] == 'N' or b['tipo'].startswith('P:'):
            i = add(D + f"a/c{b['i']:03d}.wav"); vozes.append(f'[v{i}]')
            af.append(f"[{i}:a]aresample=44100,aformat=channel_layouts=stereo,adelay={ms}|{ms},volume={'1.0' if b['tipo']=='N' else '1.05'}[v{i}]")
        elif b['tipo'].startswith('S:'):
            i = add(D + f"a/sfx_{b['sfx']}.mp3"); efx.append(f'[s{i}]')
            af.append(f"[{i}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:{b['dur']+1.2:.2f},afade=t=in:d=0.15,afade=t=out:st={b['dur']+0.4:.2f}:d=0.8,adelay={ms}|{ms},volume=0.9[s{i}]")
    camas = []
    for m in ep.get('musica', []):
        a, z = _tempo(ep, TL, m['de']), _tempo(ep, TL, m['ate']); tipo, nome = m['arquivo'].split(':', 1)
        f = D + f'a/sfx_{nome}.mp3' if tipo == 'sfx' else os.path.join(AQUI, 'musica', nome.replace('.wav', '.mp3'))
        i = add(f); d = z - a; ms = int(a * 1000); camas.append(f'[f{i}]')
        af.append(f"[{i}:a]aresample=44100,aformat=channel_layouts=stereo,aloop=loop=-1:size=2e9,atrim=0:{d:.2f},asetpts=PTS-STARTPTS{m.get('filtro','')},"
                  f"afade=t=in:d=1,afade=t=out:st={max(d-1.5,0):.2f}:d=1.5,volume={m['vol']},adelay={ms}|{ms}[f{i}]")
    af.append(''.join(vozes) + f"amix=inputs={len(vozes)}:normalize=0,asplit=2[voz][voz_sc]")
    af.append(''.join(camas) + f"amix=inputs={len(camas)}:normalize=0[camas]")
    af.append("[camas][voz_sc]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=600:makeup=1[camas_d]")
    af.append(''.join(efx) + f"amix=inputs={len(efx)}:normalize=0[efx]")
    af.append(f"[voz][camas_d][efx]amix=inputs=3:normalize=0,atrim=0:{FIM:.2f},afade=t=out:st={FIM-2:.2f}:d=2,loudnorm=I=-16:TP=-1.5[a]")
    run(['ffmpeg', '-v', 'error', '-y'] + ain + ['-filter_complex', ';'.join(af), '-map', '[a]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', D + 'audio.m4a'])


def previa(ep):
    D = trabalho(ep)
    run(['ffmpeg', '-v', 'error', '-y', '-i', D + 'audio.m4a', '-t', '185', '-c:a', 'libmp3lame', '-b:a', '160k', D + 'previa.mp3'])
    r = painel('POST', '/videos-maestro/audio-preview', {'tema': f"{ep['titulo']} — som dos 3 primeiros minutos (narração + falas + efeitos)",
                                                          'audio_base64': base64.b64encode(open(D + 'previa.mp3', 'rb').read()).decode()})
    json.dump({'preview_id': r['id']}, open(D + 'estado.json', 'w')); print('enviado para o Painel, id', r['id'])


def status(ep):
    D = trabalho(ep); pid = json.load(open(D + 'estado.json'))['preview_id']
    v = next((x for x in painel('GET', '/videos-maestro/lista') if x['id'] == pid), None)
    print(v['status'] if v else 'não encontrado')
    return v and v['status']


# ---------------------------------------------------------------- motion (desenhado quadro a quadro)
NAVY, AQUA, CREME = (43, 72, 114), (86, 202, 201), (250, 240, 220)
ease = lambda x: 1 - (1 - max(0, min(1, x))) ** 3


def _gravar(out, frames, opaco=False):
    from PIL import Image  # noqa
    pasta = out + '_png/'; os.makedirs(pasta, exist_ok=True)
    for i, f in enumerate(frames()):
        f.save(f'{pasta}{i:04d}.png')
    args = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20'] if opaco else ['-c:v', 'png']
    run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', pasta + '%04d.png'] + args + [out])
    run(['rm', '-rf', pasta])


def motion(ep):
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
    D = trabalho(ep) + 'mg/'

    def particulas():
        random.seed(7); ps = [(random.uniform(0, 960), random.uniform(0, 540), random.uniform(0.6, 2.4), random.uniform(-6, 6), random.uniform(-10, -3), random.uniform(0, 6.28)) for _ in range(70)]
        for i in range(10 * FPS):
            t = i / FPS; im = Image.new('RGB', (960, 540)); d = ImageDraw.Draw(im)
            for x, y, r, vx, vy, ph in ps:
                px = (x + vx * t + 8 * math.sin(t * 0.7 + ph)) % 960; py = (y + vy * t) % 540; a = int(110 + 90 * math.sin(t * 1.3 + ph))
                d.ellipse([px - r, py - r, px + r, py + r], fill=(a, int(a * 0.85), int(a * 0.55)))
            yield im.filter(ImageFilter.GaussianBlur(0.8)).resize((W, H))

    def luz():
        for i in range(3 * FPS):
            t = i / (3 * FPS); im = Image.new('RGB', (480, 270)); d = ImageDraw.Draw(im); a = math.sin(t * math.pi)
            for cx, cy, r, cor in ((60 + 300 * t, 80, 160, (255, 150, 60)), (420 - 200 * t, 220, 130, (255, 200, 120))):
                d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=tuple(int(c * a * 0.8) for c in cor))
            yield im.filter(ImageFilter.GaussianBlur(60)).resize((W, H))

    def titulo(tit, sub):
        f1, f2 = ImageFont.truetype(FB, 150), ImageFont.truetype(FR, 54); larg = [f1.getlength(c) for c in tit]; x0 = (W - sum(larg)) / 2
        for i in range(int(5.2 * FPS)):
            t = i / FPS; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); sai = 1 - ease((t - 4.6) / 0.6); x = x0
            for k, c in enumerate(tit):
                p = ease((t - k * 0.07) / 0.5) * sai
                if p > 0:
                    y = 330 + 40 * (1 - p); d.text((x + 4, y + 5), c, font=f1, fill=(0, 0, 0, int(150 * p))); d.text((x, y), c, font=f1, fill=CREME + (int(255 * p),))
                x += larg[k]
            p = ease((t - 1.2) / 0.7) * sai
            if p > 0:
                sx = (W - f2.getlength(sub)) / 2; d.text((sx + 3, 524), sub, font=f2, fill=(0, 0, 0, int(140 * p))); d.text((sx, 520), sub, font=f2, fill=CREME + (int(255 * p),))
                d.line([(W / 2 - 300 * p, 500), (W / 2 + 300 * p, 500)], fill=AQUA + (int(220 * p),), width=3)
            yield im

    def cartao(nome, papel, rosto):
        f1, f2 = ImageFont.truetype(FB, 64), ImageFont.truetype(FR, 34)
        face = Image.open(os.path.join(AQUI, 'rostos', rosto + '.png')).convert('RGB').resize((170, 170)); m = Image.new('L', (170, 170), 0)
        ImageDraw.Draw(m).ellipse([0, 0, 169, 169], fill=255)
        larg = max(560, 230 + max(f1.getlength(nome), f2.getlength(papel)) + 50)
        for i in range(int(2.8 * FPS)):
            t = i / FPS; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
            p = ease(t / 0.45) * (1 - ease((t - 2.35) / 0.45)); x = -larg + (larg + 120) * ease(t / 0.45)
            if t > 2.35:
                x = 120 - 80 * ease((t - 2.35) / 0.45)
            a = int(255 * p)
            d.rounded_rectangle([x, H - 300, x + larg, H - 110], radius=95, fill=NAVY + (int(200 * p),))
            d.ellipse([x + 8, H - 292, x + 182, H - 118], outline=AQUA + (a,), width=6)
            fc = face.copy(); fc.putalpha(m.point(lambda v: int(v * p))); im.alpha_composite(fc.convert('RGBA'), (int(x + 10), H - 290))
            d.text((x + 205, H - 270), nome, font=f1, fill=CREME + (a,)); d.text((x + 207, H - 190), papel, font=f2, fill=AQUA + (a,))
            yield im

    def frase(txt, cor, dd):
        tam = 78
        while ImageFont.truetype(FB, tam).getlength(txt) > W - 200:
            tam -= 4
        f = ImageFont.truetype(FB, tam); pal = txt.split(' ')
        for i in range(int(dd * FPS)):
            t = i / FPS; im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); sai = 1 - ease((t - dd + 0.4) / 0.4); x = (W - f.getlength(txt)) / 2
            for k, w in enumerate(pal):
                p = ease((t - k * 0.18) / 0.35) * sai
                if p > 0:
                    y = H - 230 + 25 * (1 - p); d.text((x + 3, y + 4), w, font=f, fill=(0, 0, 0, int(160 * p))); d.text((x, y), w, font=f, fill=tuple(cor) + (int(255 * p),))
                x += f.getlength(w + ' ')
            yield im
    if not os.path.exists(D + 'particulas.mp4'):
        _gravar(D + 'particulas.mp4', particulas, True)
    if not os.path.exists(D + 'luz.mp4'):
        _gravar(D + 'luz.mp4', luz, True)
    if not os.path.exists(D + 'titulo.mov'):
        _gravar(D + 'titulo.mov', lambda: titulo(ep['titulo_card']['titulo'], ep['titulo_card']['subtitulo']))
    for k, (nome, papel, rosto) in ep.get('cartoes', {}).items():
        if not os.path.exists(D + k + '.mov'):
            _gravar(D + k + '.mov', lambda nome=nome, papel=papel, rosto=rosto: cartao(nome, papel, rosto))
    for k, (txt, cor, dd) in ep.get('frases', {}).items():
        if not os.path.exists(D + k + '.mov'):
            _gravar(D + k + '.mov', lambda txt=txt, cor=cor, dd=dd: frase(txt, cor, dd))


# ---------------------------------------------------------------- vídeo
def baixar_cenas(ep):
    D = trabalho(ep); pastas = [ep['pasta_cenas']]
    arqs = {}
    for p in pastas:
        for f in painel('GET', f'/producao-videos/drive/pasta/{p}'):
            arqs[f['nome']] = f
    plano = []
    for c in dict.fromkeys(c for b in ep['blocos'] for c in b['cenas']):
        n = ep['prefixo'] + c; f = arqs.get(n + '.mp4') or arqs.get(n + '.jpg')
        if not f:
            raise SystemExit(f'falta a cena {n} no Drive')
        out = D + 'clipes/' + f['nome']
        if not os.path.exists(out) or os.path.getsize(out) != int(f.get('tamanho') or os.path.getsize(out)):
            open(out, 'wb').write(painel('GET', f"/producao-videos/drive/arquivo/{f['id']}", bruto=True))
        plano.append({'codigo': c, 'arq': f['nome']})
    return plano


def _kb(d, k, z):
    n = max(int(d * FPS), 1); cx = ['0.5', '0.46', '0.54'][k % 3]
    return f"scale={W*2}:{H*2}:flags=lanczos,zoompan=z='1+{z}*on/{n}':x='(iw-iw/zoom)*{cx}':y='(ih-ih/zoom)/2':d=1:s={W}x{H}:fps={FPS}"


def video(ep):
    D = trabalho(ep); TL = json.load(open(D + 'timeline.json')); B = TL['blocos']; FIM = TL['fim']
    plano = baixar_cenas(ep); motion(ep); N = len(plano); idx = {p['codigo']: k for k, p in enumerate(plano)}
    ini = {}
    for b, eb in zip(B, ep['blocos']):
        n = len(eb['cenas'])
        for j, c in enumerate(eb['cenas']):
            ini.setdefault(idx[c], b['ini'] + b['dur'] * j / n)
    ts = [ini[k] for k in range(N)]; ts[0] = 0.0
    for k in range(1, N):
        ts[k] = max(ts[k], ts[k - 1] + 1.2)
    ts.append(FIM)
    json.dump({'cenas': ts}, open(D + 'tempos.json', 'w'))
    blocos = []
    for b0 in range(0, N, 20):
        b1 = min(b0 + 20, N); out = D + f'bloco{b0:03d}.mp4'; blocos.append((b0, out))
        def seg(k):
            d = ts[k + 1] - ts[k] + (XF if k < N - 1 else 0); src = D + 'clipes/' + plano[k]['arq']; s = D + f'seg/s{k:03d}.mp4'
            if os.path.exists(s):
                return
            if src.endswith('.jpg'):
                run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-t', f'{d:.3f}', '-i', src, '-vf', _kb(d, k, 0.10) + ',format=yuv420p', '-an', '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', s])
            else:
                fc = (f"[0:v]fps={FPS},scale={W}:{H}:flags=lanczos,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1,loop=-1:size=32000,"
                      f"trim=0:{d:.3f},setpts=PTS-STARTPTS,{_kb(d, k, 0.06)},format=yuv420p[v]")
                run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', fc, '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', s])
        if not os.path.exists(out):
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(2) as ex:  # cada ffmpeg já usa ~2 núcleos
                list(ex.map(seg, range(b0, b1)))
            ins = sum((['-i', D + f'seg/s{k:03d}.mp4'] for k in range(b0, b1)), []); fc = []; last = '[0:v]'
            for j, k in enumerate(range(b0 + 1, b1), 1):
                fc.append(f"{last}[{j}:v]xfade=transition={TR[k % len(TR)]}:duration={XF}:offset={ts[k]-ts[b0]:.3f}[x{j}]"); last = f'[x{j}]'
            if fc:
                run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fc), '-map', last, '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', out])
            else:
                run(['cp', D + f'seg/s{b0:03d}.mp4', out])
            for k in range(b0, b1):
                os.remove(D + f'seg/s{k:03d}.mp4')
        print('bloco', b0, flush=True)
    ins = sum((['-i', f] for _, f in blocos), []); fc = []; last = '[0:v]'
    for i in range(1, len(blocos)):
        fc.append(f"{last}[{i}:v]xfade=transition=fade:duration={XF}:offset={ts[blocos[i][0]]:.3f}[y{i}]"); last = f'[y{i}]'
    base = D + 'base.mp4'
    if fc:
        run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fc), '-map', last, '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', base])
    else:
        run(['cp', blocos[0][1], base])
    for _, f in blocos:
        os.remove(f)
    # camadas de motion
    M = D + 'mg/'; cam = [(M + 'titulo.mov', _tempo(ep, TL, ep['motion_titulo']))] if ep.get('motion_titulo') else []
    cam += [(M + m['arquivo'] + '.mov', _tempo(ep, TL, m)) for m in ep['motion']]
    luzes = [_tempo(ep, TL, l) for l in ep.get('luz', [])]
    camadas(D, base, cam, luzes, FIM)
    os.remove(base)
    final = D + ep['chave'] + ' - 1080p.mp4'
    run(['ffmpeg', '-v', 'error', '-y', '-i', D + 'video.mp4', '-i', D + 'audio.m4a', '-c', 'copy', '-shortest', '-movflags', '+faststart', final])
    os.remove(D + 'video.mp4')
    run(['ffmpeg', '-v', 'error', '-y', '-i', final, '-vf', 'scale=1280:720', '-c:v', 'libx264', '-b:v', '2200k', '-maxrate', '3000k', '-bufsize', '6000k',
         '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', D + ep['chave'] + ' - 720p.mp4'])
    conferir(ep, final, ts, plano)


def camadas(D, base, cam, luzes, FIM, partes=None):
    """Motion por cima da base. 23/11/2026: era um processo só (~35 min num episódio de 13 min, 1 núcleo); agora o
    episódio é cortado em partes que rodam ao mesmo tempo (uma por núcleo) e são emendadas sem recodificar."""
    from concurrent.futures import ThreadPoolExecutor
    M = os.path.dirname(cam[0][0]) + '/' if cam else D + 'mg/'
    partes = partes or max(1, min(os.cpu_count() or 1, 6))
    passo = FIM / partes; saidas = []

    def parte(n):
        a = n * passo; z = FIM if n == partes - 1 else (n + 1) * passo; d = z - a
        meus = [(f, t0) for f, t0 in cam if t0 < z and t0 + dur_cache(f) > a]
        minhas = [t0 for t0 in luzes if t0 < z and t0 + 3 > a]
        ins = ['-ss', f'{a:.3f}', '-t', f'{d:.3f}', '-i', base, '-stream_loop', '-1', '-i', M + 'particulas.mp4']
        fc = [f"[1:v]trim=start={a % 10:.3f}:duration={d:.3f},setpts=PTS-STARTPTS,format=gbrp[p]", "[0:v]setpts=PTS-STARTPTS,format=gbrp[b0]",
              "[b0][p]blend=all_mode=screen:all_opacity=0.35,format=yuv420p[v0]"]; cur = '[v0]'; k = 2
        for j, (f, t0) in enumerate(meus):
            ins += ['-i', f]; rel = t0 - a
            fc.append(f"[{k}:v]trim=start={max(0, -rel):.3f},setpts=PTS-STARTPTS+{max(0, rel):.3f}/TB[o{j}]")
            fc.append(f"{cur}[o{j}]overlay=0:0:eof_action=pass:format=auto[v{j+1}]"); cur = f'[v{j+1}]'; k += 1
        for j, t0 in enumerate(minhas):
            ins += ['-i', M + 'luz.mp4']; rel = t0 - a
            fc.append(f"[{k}:v]trim=start={max(0, -rel):.3f},setpts=PTS-STARTPTS+{max(0, rel):.3f}/TB,format=gbrp[l{j}]")
            fc.append(f"{cur}format=gbrp[g{j}];[g{j}][l{j}]blend=all_mode=screen:all_opacity=0.6:eof_action=pass,format=yuv420p[w{j}]"); cur = f'[w{j}]'; k += 1
        fim = (',fade=t=in:d=0.8' if n == 0 else '') + (f',fade=t=out:st={d-2:.3f}:d=2' if n == partes - 1 else '')
        fc.append(f"{cur}vignette=angle=PI/5,noise=alls=3:allf=t{fim},format=yuv420p[v]")
        out = D + f'parte{n}.mp4'
        run(['ffmpeg', '-v', 'error', '-y', '-threads', '2'] + ins + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-t', f'{d:.3f}', '-r', str(FPS),
             '-c:v', 'libx264', '-b:v', '8M', '-maxrate', '10M', '-bufsize', '20M', '-preset', 'veryfast', out])
        return out
    with ThreadPoolExecutor(partes) as ex:
        saidas = list(ex.map(parte, range(partes)))
    open(D + 'partes.txt', 'w').write(''.join(f"file '{s}'\n" for s in saidas))
    run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', D + 'partes.txt', '-c', 'copy', D + 'video.mp4'])
    for s in saidas:
        os.remove(s)


_DUR = {}


def dur_cache(f):
    if f not in _DUR:
        _DUR[f] = dur(f)
    return _DUR[f]


def conferir(ep, final, ts, plano):
    """Folha com um quadro do meio de cada cena + volume — o Claude olha antes de qualquer coisa ir para o dono."""
    from PIL import Image, ImageDraw
    D = trabalho(ep); ims = []
    for k, p in enumerate(plano):
        m = (ts[k] + ts[k + 1]) / 2
        run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{m:.2f}', '-i', final, '-frames:v', '1', '-vf', 'scale=256:144', D + 'q.jpg'])
        im = Image.open(D + 'q.jpg').convert('RGB'); ImageDraw.Draw(im).text((3, 2), p['codigo'], fill=(255, 255, 0)); ims.append(im)
    linhas = math.ceil(len(ims) / 10); P = Image.new('RGB', (2560, 144 * linhas))
    for i, im in enumerate(ims):
        P.paste(im, ((i % 10) * 256, (i // 10) * 144))
    P.save(D + 'conferencia.jpg', quality=75)
    lu = subprocess.run(['ffmpeg', '-i', final, '-af', 'ebur128=framelog=quiet', '-vn', '-f', 'null', '-'], capture_output=True, text=True).stderr
    print('conferência:', D + 'conferencia.jpg', '|', [l.strip() for l in lu.splitlines() if l.strip().startswith('I:')][-1:], '| duração', dur(final))


def entregar(ep):
    sys.path.insert(0, os.path.join(AQUI, '..', 'scripts')); import enviar_drive_grande as E
    D = trabalho(ep)
    for q in ('1080p', '720p'):
        r = E.enviar(D + ep['chave'] + f' - {q}.mp4', ep['pasta_entrega'], f"{ep['titulo']} ({q}).mp4")
        print(q, '→ Drive', r.get('id'))


if __name__ == '__main__':
    cmd, arq = sys.argv[1], sys.argv[2]
    ep = json.load(open(arq if os.path.isabs(arq) or os.path.exists(arq) else os.path.join(AQUI, arq)))
    {'audio': audio, 'previa': previa, 'status': status, 'video': video, 'entregar': entregar, 'motion': motion, 'mixar': mixar}[cmd](ep)
