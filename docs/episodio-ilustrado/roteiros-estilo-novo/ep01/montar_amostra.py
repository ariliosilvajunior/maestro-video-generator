# Amostra do Ep01 (A Rua de Pedra): E001–E020 + narração + música + som dos clipes + título + maquete + nomes.
import json, os, subprocess, sys
sys.path.insert(0, '/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/ep01v3')
import cenas_ep01 as C
D = '/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/amostra/'
FB = '/home/user/recursoscognitivos/static/fonts/Goodly-Bold.woff'
FR = '/home/user/recursoscognitivos/static/fonts/Goodly-Regular.woff'
N = 20; FIM = 121.4; XF = 0.4; W, H, FPS = 1920, 1080, 25
ts = [s[0] for s in C.S[:N]] + [FIM]
run = lambda c: subprocess.run(c, check=True)
os.makedirs(D + 'seg', exist_ok=True)

# 1) segmentos de vídeo, cada um com a duração da sua fala (+XF para a fusão)
for k in range(N):
    d = ts[k + 1] - ts[k] + (XF if k < N - 1 else 0)
    src = D + f'clipes/rp1-E{k+1:03d}.mp4'; out = D + f'seg/s{k:02d}.mp4'
    vf = f"scale={W}:{H}:flags=lanczos,fps={FPS},tpad=stop_mode=clone:stop_duration=20,trim=0:{d:.3f},setpts=PTS-STARTPTS"
    if k == 4:  # E005: abre com a maquete da rua (CE27) no fundo branco, a câmera entra e funde na cena
        m = 1.8
        run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-t', f'{m}', '-i', D + 'CE27.jpg', '-i', src, '-filter_complex',
             f"[0:v]scale=3840:-1,zoompan=z='1+0.35*on/{int(m*FPS)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS},format=yuv420p[a];"
             f"[1:v]scale={W}:{H}:flags=lanczos,fps={FPS},tpad=stop_mode=clone:stop_duration=20,trim=0:{d-m+0.6:.3f},setpts=PTS-STARTPTS,format=yuv420p[b];"
             f"[a][b]xfade=transition=fade:duration=0.6:offset={m-0.6:.3f}[v]", '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', out])
    else:
        run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf + ',format=yuv420p', '-an', '-c:v', 'libx264', '-crf', '18', out])

# 2) junta com fusões suaves
ins = []; fc = []; last = '[0:v]'
for k in range(N): ins += ['-i', D + f'seg/s{k:02d}.mp4']
for k in range(1, N):
    fc.append(f"{last}[{k}:v]xfade=transition=fade:duration={XF}:offset={ts[k]:.3f}[x{k}]"); last = f'[x{k}]'

# 3) título, nomes, vinheta, grão, fade final
def txt(t, a, b, size, y, font=FB, cor='white'):
    al = f"if(lt(t,{a}),0,if(lt(t,{a+0.6}),(t-{a})/0.6,if(lt(t,{b-0.6}),1,if(lt(t,{b}),({b}-t)/0.6,0))))"
    return (f"drawtext=fontfile={font}:text='{t}':fontsize={size}:fontcolor={cor}:x=(w-text_w)/2:y={y}:"
            f"shadowcolor=black@0.6:shadowx=3:shadowy=3:alpha='{al}'")
def nome(t, a, b):
    al = f"if(lt(t,{a}),0,if(lt(t,{a+0.4}),(t-{a})/0.4,if(lt(t,{b-0.4}),1,if(lt(t,{b}),({b}-t)/0.4,0))))"
    return (f"drawtext=fontfile={FB}:text='{t}':fontsize=64:fontcolor=white:x=120:y=h-200:shadowcolor=black@0.7:shadowx=3:shadowy=3:alpha='{al}'")
efeitos = ",".join([
    txt('A Rua de Pedra', 31.2, 36.4, 150, '(h/2)-170'),
    txt('Episódio 1  ·  Quem cuida de quem cuida', 31.8, 36.4, 54, '(h/2)+10', FR),
    nome('Marta', 52.6, 55.2), nome('Rogério', 55.6, 58.5), nome('Caio', 59.0, 62.6), nome('Davi', 63.3, 66.2),
    "vignette=angle=PI/5", "noise=alls=6:allf=t", f"fade=t=out:st={FIM-1.5}:d=1.5"])
fc.append(f"{last}{efeitos},format=yuv420p[v]")
run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', D + 'video.mp4'])

# 4) áudio: narração + música (abaixa sob a voz) + som ambiente dos próprios clipes
a_ins = ['-i', D + 'narracao.mp3', '-i', D + 'mus/M3.wav', '-i', D + 'mus/M1.wav', '-i', D + 'mus/M2.wav']
af = [f"[0:a]atrim=0:{FIM},asetpts=PTS-STARTPTS,volume=1.0,asplit=2[nar][nar2]",
      # festa abafada que corta seco no silêncio
      f"[1:a]atrim=0:16.4,asetpts=PTS-STARTPTS,lowpass=f=700,volume=0.55,afade=t=in:d=1,afade=t=out:st=15.9:d=0.5[m3]",
      # tema da série no título, sai na apresentação da família
      f"[2:a]atrim=0:38,asetpts=PTS-STARTPTS,volume=0.45,afade=t=in:d=1.5,afade=t=out:st=35:d=3,adelay=28500|28500[m1]",
      # piano baixo dos sinais
      f"[3:a]atrim=0:{FIM-66.5},asetpts=PTS-STARTPTS,volume=0.4,afade=t=in:d=2,afade=t=out:st={FIM-66.5-2.5}:d=2.5,adelay=66500|66500[m2]"]
for k in range(N):
    d = ts[k + 1] - ts[k]; ms = int(ts[k] * 1000)
    a_ins += ['-i', D + f'clipes/rp1-E{k+1:03d}.mp4']
    af.append(f"[{4+k}:a]atrim=0:{min(d,8):.2f},asetpts=PTS-STARTPTS,highpass=f=120,volume=0.35,afade=t=in:d=0.3,afade=t=out:st={max(min(d,8)-0.5,0):.2f}:d=0.5,adelay={ms}|{ms}[c{k}]")
amb = ''.join(f'[c{k}]' for k in range(N))
af.append(f"[m3][m1][m2]{amb}amix=inputs={3+N}:normalize=0,volume=1.0[fundo]")
af.append("[fundo][nar]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[fundo_d]")
af.append(f"[fundo_d][nar2]amix=inputs=2:normalize=0,atrim=0:{FIM},afade=t=out:st={FIM-1.5}:d=1.5,loudnorm=I=-16:TP=-1.5[a]")
run(['ffmpeg', '-v', 'error', '-y'] + a_ins + ['-filter_complex', ';'.join(af), '-map', '[a]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', D + 'audio.m4a'])
run(['ffmpeg', '-v', 'error', '-y', '-i', D + 'video.mp4', '-i', D + 'audio.m4a', '-c', 'copy', '-shortest', D + 'Amostra Ep01 - A Rua de Pedra (2 min).mp4'])
print('ok')
