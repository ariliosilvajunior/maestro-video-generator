# Curta: vídeo das cenas E024–E041 no tempo da nova trilha + mistura (voz manda; efeitos aparecem nas pausas).
import json, os, subprocess
D = os.path.dirname(os.path.abspath(__file__)) + '/'
AM = '/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/amostra/'
TL = json.load(open(D + 'timeline.json')); B = TL['blocos']; FIM = TL['fim']
W, H, FPS, XF = 1920, 1080, 25, 0.5
run = lambda c: subprocess.run(c, check=True)
# início de cada cena = primeiro momento em que ela aparece (blocos com 2 cenas dividem o tempo)
ini = {}
for b in B:
    n = len(b['cenas'])
    for j, c in enumerate(b['cenas']):
        ini.setdefault(c, b['ini'] + b['dur'] * j / n)
cenas = sorted(ini); ts = [ini[c] for c in cenas]; ts[0] = 0.0; ts.append(FIM)
os.makedirs(D + 'seg', exist_ok=True); os.makedirs(D + 'pp', exist_ok=True)
# 17/11 (dono): nada de imagem congelada — o clipe vai e volta (ping-pong) enquanto a fala precisar, sempre em movimento
for k, c in enumerate(cenas):
    pp = D + f'pp/p{c:03d}.mp4'
    if not os.path.exists(pp):
        run(['ffmpeg', '-v', 'error', '-y', '-i', D + f'clipes/rp1-E{c:03d}.mp4', '-filter_complex',
             f"[0:v]fps={FPS},scale=1280:720,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,format=yuv420p[v]", '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '16', pp])
    d = ts[k + 1] - ts[k] + (XF if k < len(cenas) - 1 else 0); n = max(int(d * FPS), 1); cx = ['0.5', '0.46', '0.54'][k % 3]
    run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '-1', '-i', pp, '-vf',
         f"trim=0:{d:.3f},setpts=PTS-STARTPTS,scale={W*2}:{H*2}:flags=lanczos,"
         f"zoompan=z='1+0.06*on/{n}':x='(iw-iw/zoom)*{cx}':y='(ih-ih/zoom)/2':d=1:s={W}x{H}:fps={FPS},format=yuv420p",
         '-an', '-c:v', 'libx264', '-crf', '18', '-t', f'{d:.3f}', D + f'seg/s{k:02d}.mp4'])
ins = []; fc = []; last = '[0:v]'
for k in range(len(cenas)): ins += ['-i', D + f'seg/s{k:02d}.mp4']
for k in range(1, len(cenas)):
    fc.append(f"{last}[{k}:v]xfade=transition={'fadeblack' if cenas[k] in (30, 35) else 'fade'}:duration={XF}:offset={ts[k]:.3f}[x{k}]"); last = f'[x{k}]'
fc.append(f"{last}vignette=angle=PI/5,noise=alls=5:allf=t,fade=t=in:d=0.8,fade=t=out:st={FIM-1.5}:d=1.5,format=yuv420p[v]")
run(['ffmpeg', '-v', 'error', '-y'] + ins + ['-filter_complex', ';'.join(fc), '-map', '[v]', '-c:v', 'libx264', '-crf', '18', D + 'video.mp4'])

# ---- áudio
ain = []; af = []; vozes = []; destaque = []; k = 0
def add(f): global k; ain.extend(['-i', f]); k += 1; return k - 1
for b in B:
    ms = int(b['ini'] * 1000)
    if b['tipo'] == 'N' or b['tipo'].startswith('P:'):
        i = add(D + f"a/c{b['i']:02d}.wav"); vozes.append(f'v{i}')
        af.append(f"[{i}:a]aresample=44100,aformat=channel_layouts=stereo,adelay={ms}|{ms},volume={'1.0' if b['tipo']=='N' else '1.05'}[v{i}]")
    elif b['tipo'].startswith('S:'):
        n = b['sfx']; i = add(D + f'a/sfx_{n}.mp3'); destaque.append(f's{i}')
        af.append(f"[{i}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:{b['dur']+1.2:.2f},afade=t=in:d=0.15,afade=t=out:st={b['dur']+0.4:.2f}:d=0.8,adelay={ms}|{ms},volume=0.9[s{i}]")
# camadas de fundo (abaixam sob a voz): festa, consultório, ônibus + músicas
def cama(f, a, b, vol, extra=''):
    i = add(f); ms = int(a * 1000); d = b - a
    af.append(f"[{i}:a]aresample=44100,aformat=channel_layouts=stereo,aloop=loop=-1:size=2e9,atrim=0:{d:.2f},asetpts=PTS-STARTPTS{extra},afade=t=in:d=1,afade=t=out:st={max(d-1.5,0):.2f}:d=1.5,volume={vol},adelay={ms}|{ms}[f{i}]")
    return f'f{i}'
t = {b['i']: b for b in B}
fim_festa = t[4]['ini'] + t[4]['dur']; ini_cons = t[6]['ini']; fim_cons = t[15]['ini'] + t[15]['dur']; ini_bus = t[16]['ini']
camas = [cama(D + 'a/sfx_festa.mp3', 0, fim_festa, 0.55, ',lowpass=f=2500'),
         cama(D + 'a/sfx_relogio.mp3', ini_cons, fim_cons, 0.35),
         cama(D + 'a/sfx_onibus_amb.mp3', ini_bus + 2.5, FIM, 0.35),
         cama(AM + 'mus/M3.wav', 0, fim_festa, 0.30, ',lowpass=f=900'),
         cama(AM + 'mus/M5.wav' if os.path.exists(AM + 'mus/M5.wav') else AM + 'mus/M2.wav', t[5]['ini'], fim_cons, 0.22),
         cama(AM + 'mus/M4.wav', ini_bus, FIM, 0.28)]
nv = len(vozes)
af.append(''.join(f'[{v}]' for v in vozes) + f"amix=inputs={nv}:normalize=0,asplit=2[voz][voz_sc]")
af.append(''.join(f'[{c}]' for c in camas) + f"amix=inputs={len(camas)}:normalize=0[camas]")
af.append("[camas][voz_sc]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=600:makeup=1[camas_d]")
af.append(''.join(f'[{s}]' for s in destaque) + f"amix=inputs={len(destaque)}:normalize=0[efx]")
af.append(f"[voz][camas_d][efx]amix=inputs=3:normalize=0,atrim=0:{FIM:.2f},afade=t=out:st={FIM-1.5:.2f}:d=1.5,loudnorm=I=-16:TP=-1.5[a]")
run(['ffmpeg', '-v', 'error', '-y'] + ain + ['-filter_complex', ';'.join(af), '-map', '[a]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', D + 'audio.m4a'])
run(['ffmpeg', '-v', 'error', '-y', '-i', D + 'video.mp4', '-i', D + 'audio.m4a', '-c:v', 'libx264', '-b:v', '6000k', '-preset', 'slow', '-tune', 'grain',
     '-c:a', 'copy', '-shortest', '-movflags', '+faststart', D + 'Curta - narração + falas + efeitos.mp4'])
print('ok', round(FIM, 1))
