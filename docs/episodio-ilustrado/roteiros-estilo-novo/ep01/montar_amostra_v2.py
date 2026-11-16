# Amostra v2 do Ep01 — com motion graphics: Ken Burns em toda cena, transições variadas, maquete, mapa animado,
# título letra a letra, cartões com rosto dos personagens, frases em destaque, poeira dourada e vazamentos de luz.
import os, subprocess, sys
sys.path.insert(0, '/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/ep01v3')
import cenas_ep01 as C
D = '/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/amostra/'; MG = D + 'mg/'
N = 20; FIM = 121.4; XF = 0.5; W, H, FPS = 1920, 1080, 25
ts = [s[0] for s in C.S[:N]] + [FIM]
run = lambda c: subprocess.run(c, check=True)
os.makedirs(D + 'seg2', exist_ok=True)
# transição na ENTRADA de cada cena (índice da cena que entra)
TRANS = {2: 'fadeblack', 3: 'dissolve', 5: 'smoothleft', 6: 'circleopen', 7: 'fadeblack', 8: 'smoothright', 9: 'slideleft',
         10: 'slideleft', 11: 'slideleft', 12: 'circleclose', 13: 'dissolve', 15: 'zoomin', 16: 'dissolve', 17: 'smoothleft',
         18: 'dissolve', 19: 'fadeblack'}
def kb(d, k):  # Ken Burns: aproxima devagar (o centro alterna para não ficar repetitivo)
    n = max(int(d * FPS), 1); cx = ['0.5', '0.46', '0.54'][k % 3]
    return (f"scale={W*2}:{H*2}:flags=lanczos,zoompan=z='1+0.07*on/{n}':x='(iw-iw/zoom)*{cx}':y='(ih-ih/zoom)/2':d=1:s={W}x{H}:fps={FPS}")
for k in range(N):
    d = ts[k + 1] - ts[k] + (XF if k < N - 1 else 0)
    src = D + f'clipes/rp1-E{k+1:03d}.mp4'; out = D + f'seg2/s{k:02d}.mp4'
    if os.path.exists(out): continue  # só refaz o segmento apagado
    base = f"fps={FPS},tpad=stop_mode=clone:stop_duration=20,trim=0:{{d:.3f}},setpts=PTS-STARTPTS,"
    if k == 4:   # maquete da rua no fundo branco → a cena
        m = 1.8
        run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-t', f'{m}', '-i', D + 'CE27.jpg', '-i', src, '-filter_complex',
             f"[0:v]scale=3840:-1,zoompan=z='1+0.35*on/{int(m*FPS)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS},format=yuv420p[a];"
             f"[1:v]{base.format(d=d-m+0.6)}{kb(d-m+0.6,k)},format=yuv420p[b];[a][b]xfade=transition=fade:duration=0.6:offset={m-0.6:.3f}[v]",
             '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', out])
    elif k == 5:  # mapa animado da Rua de Pedra (casa → pracinha → escola) → a cena dos vizinhos
        m = 4.0
        run(['ffmpeg', '-v', 'error', '-y', '-i', MG + 'mapa.mp4', '-i', src, '-filter_complex',
             f"[0:v]fps={FPS},format=yuv420p[a];[1:v]{base.format(d=d-m+0.6)}{kb(d-m+0.6,k)},format=yuv420p[b];"
             f"[a][b]xfade=transition=circleopen:duration=0.6:offset={m-0.6:.3f}[v]",
             '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', out])
    else:
        run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', base.format(d=d) + kb(d, k) + ',format=yuv420p', '-an', '-c:v', 'libx264', '-crf', '18', out])

ins = []; fc = []; last = '[0:v]'
for k in range(N): ins += ['-i', D + f'seg2/s{k:02d}.mp4']
for k in range(1, N):
    fc.append(f"{last}[{k}:v]xfade=transition={TRANS.get(k,'fade')}:duration={XF}:offset={ts[k]:.3f}[x{k}]"); last = f'[x{k}]'
run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fc), '-map', last, '-c:v', 'libx264', '-crf', '16', D + 'base2.mp4'])

# camadas de motion
cam = [('titulo.mov', 31.2), ('nome_Marta.mov', 52.6), ('nome_Rogério.mov', 55.6), ('nome_Caio.mov', 59.0), ('nome_Davi.mov', 63.3),
       ('frase_porta.mov', 46.9), ('frase_verdinho.mov', 95.2)]
luzes = [29.0, 66.3, 141.0]
ins = ['-i', D + 'base2.mp4', '-stream_loop', '-1', '-i', MG + 'particulas.mp4']
for f, _ in cam: ins += ['-i', MG + f]
for _ in luzes: ins += ['-i', MG + 'luz.mp4']
fc = [f"[1:v]trim=0:{FIM},setpts=PTS-STARTPTS,format=gbrp[p]", "[0:v]format=gbrp[b0]",
      "[b0][p]blend=all_mode=screen:all_opacity=0.45,format=yuv420p[v0]"]
cur = '[v0]'
for j, (f, t0) in enumerate(cam):
    fc.append(f"[{2+j}:v]setpts=PTS-STARTPTS+{t0}/TB[o{j}]")
    fc.append(f"{cur}[o{j}]overlay=0:0:eof_action=pass:format=auto[v{j+1}]"); cur = f'[v{j+1}]'
for j, t0 in enumerate(luzes):
    i = 2 + len(cam) + j
    fc.append(f"[{i}:v]setpts=PTS-STARTPTS+{t0}/TB,format=gbrp[l{j}]")
    fc.append(f"{cur}format=gbrp[g{j}];[g{j}][l{j}]blend=all_mode=screen:all_opacity=0.6:eof_action=pass,format=yuv420p[w{j}]"); cur = f'[w{j}]'
fc.append(f"{cur}vignette=angle=PI/5,noise=alls=5:allf=t,fade=t=out:st={FIM-1.5}:d=1.5,format=yuv420p[v]")
run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-t', f'{FIM}', '-c:v', 'libx264', '-crf', '18', D + 'video2.mp4'])
run(['ffmpeg', '-v', 'error', '-y', '-i', D + 'video2.mp4', '-i', D + 'audio.m4a', '-c:v', 'libx264', '-b:v', '6000k', '-maxrate', '8000k',
     '-bufsize', '16000k', '-preset', 'slow', '-tune', 'grain', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', D + 'Amostra v2 Ep01 - com motion.mp4'])
print('ok')
