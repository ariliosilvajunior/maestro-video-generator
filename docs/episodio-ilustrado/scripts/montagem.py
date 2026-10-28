import json,subprocess,re
U='/root/.claude/uploads/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/'
N=U+'f296eef9-podcast_1.mp3'; MUS=U+'bd218977-Whirlpool_-_The_Mini_Vandals.mp3'
T=0.5  # crossfade
cuts={k:(a,b) for k,a,b,d,p in json.load(open('audio/cuts.json'))}
clips={1:('f0763cba-p01.mp4',0),2:('b3371d71-p02.mp4',0),3:('7a4adb7d-p03.mp4',0),4:('e6f9f391-p04.mp4',0),
5:('28655e2e-Dust_drifting_in_cabinet_light_1eaa89dd.mp4',0),6:('d9b566c9-p07.mp4',0),7:('ae13de1f-Dust_turning_in_light_beam_bbe8770b.mp4',0),
8:('e8c42487-p08.mp4',0),9:('06547ff5-p09.mp4.mp4',1.9),10:('6bf64f14-p10.mp4',0),11:('993dead2-Dust_drifts_past_swinging_gate_051f2564.mp4',0),
12:('f344eb2c-p12.mp4',0),13:('3235a9a1-p13.mp4',0)}
ks=sorted(clips); end=cuts[ks[-1]][1]
for k in ks:
    f,ss=clips[k]; a,b=cuts[k]; d=b-a+(T if k!=ks[-1] else 0)
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(ss),'-i',U+f,'-an','-vf','scale=1920:1080:flags=lanczos,fps=25,tpad=stop_mode=clone:stop_duration=3,format=yuv420p,setsar=1','-t',f'{d:.3f}','-c:v','libx264','-crf','18',f'mont/x{k:02d}.mp4'],check=True)
inp=[];fc=[];prev='0:v'
for i,k in enumerate(ks): inp+=['-i',f'mont/x{k:02d}.mp4']
for i,k in enumerate(ks[1:],1):
    off=cuts[ks[i-1]][1]; o=f'v{i}'
    fc.append(f'[{prev}][{i}:v]xfade=transition=fade:duration={T}:offset={off:.3f}[{o}]'); prev=o
subprocess.run(['ffmpeg','-v','error','-y',*inp,'-filter_complex',';'.join(fc),'-map',f'[{prev}]','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','mont/bg2.mp4'],check=True)
# ASS: legenda + títulos
def ts(s): h=int(s//3600);m=int(s%3600//60);return f'{h}:{m:02d}:{s%60:05.2f}'
w=[c for c in json.load(open('audio/words.json'))['chunks'] if c['timestamp'][0]<end]
fix={'Arilho,':'Arilio,'}; cues=[];cur=[]
for c in w:
    t=fix.get(c['text'].strip(),c['text'].strip()); cur.append((t,c['timestamp'][0],c['timestamp'][1]))
    txt=' '.join(x[0] for x in cur)
    if len(txt)>=34 or re.search(r'[.,?!]$',t) and len(txt)>=12: cues.append(cur);cur=[]
if cur: cues.append(cur)
H=['[Script Info]','ScriptType: v4.00+','PlayResX: 1920','PlayResY: 1080','','[V4+ Styles]',
'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
'Style: Doc,Liberation Sans,46,&H00F5F5F5,&H00F5F5F5,&H00202020,&H64000000,0,0,0,0,100,100,0.5,0,1,2.2,1.5,2,100,520,55,1',
'Style: Title,Liberation Serif,96,&H00EAF4FA,&H00EAF4FA,&H00203040,&H80000000,1,0,0,0,100,100,2,0,1,2,3,5,100,100,0,1',
'Style: Sub,Liberation Serif,40,&H00C8DCE8,&H00C8DCE8,&H00203040,&H80000000,0,1,0,0,100,100,3,0,1,1.5,2,5,100,100,0,1',
'Style: Name,Liberation Sans,46,&H00FFFFFF,&H00FFFFFF,&H00202020,&H90000000,1,0,0,0,100,100,1,0,1,2,2,3,0,540,345,1',
'Style: Role,Liberation Sans,32,&H00E0EEF4,&H00E0EEF4,&H00202020,&H90000000,0,0,0,0,100,100,1,0,1,1.6,1.8,3,0,540,295,1',
'Style: Key,Liberation Serif,64,&H00E6F2F8,&H00E6F2F8,&H00203040,&H80000000,1,1,0,0,100,100,1,0,1,2,3,7,110,100,90,1',
'','[Events]','Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
E=[]
for i,c in enumerate(cues):
    a=c[0][1]; b=min(c[-1][2]+0.25, cues[i+1][0][1] if i+1<len(cues) else end)
    if a<6.5: continue  # título ocupa a abertura
    E.append(f'Dialogue: 0,{ts(a)},{ts(b)},Doc,,0,0,0,,'+' '.join(x[0] for x in c))
E.append(r'Dialogue: 1,0:00:00.40,0:00:06.30,Title,,0,0,0,,{\fad(900,700)\pos(960,470)}Quando falta estrutura')
E.append(r'Dialogue: 1,0:00:01.20,0:00:06.30,Sub,,0,0,0,,{\fad(900,700)\pos(960,570)}Uma história de família, autismo e pontes')
E.append(r'Dialogue: 1,0:00:06.60,0:00:12.00,Name,,0,0,0,,{\fad(400,500)}Prof. Arilio')
E.append(r'Dialogue: 1,0:00:06.80,0:00:12.00,Role,,0,0,0,,{\fad(400,500)}Recursos Cognitivos')
E.append(r'Dialogue: 1,0:00:24.20,0:00:27.60,Key,,0,0,0,,{\fad(350,450)}zero estrutura de apoio')
E.append(r'Dialogue: 1,0:00:51.70,0:00:54.30,Key,,0,0,0,,{\fad(350,450)}vigilância o tempo inteiro')
open('mont/fx.ass','w').write('\n'.join(H+E)+'\n')
# whoosh suave sintetizado
subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i','anoisesrc=d=0.9:c=pink:a=0.5','-af','highpass=f=300,lowpass=f=3500,afade=t=in:d=0.45,afade=t=out:st=0.45:d=0.45,volume=0.22','mont/whoosh.wav'],check=True)
offs=[cuts[k][1]+T/2-0.45 for k in ks[:-1]]
wi=[];wf=[]
for j,o in enumerate(offs): wf.append(f'[{5+j}:a]adelay={int(o*1000)}|{int(o*1000)}[w{j}]'); wi+=['-i','mont/whoosh.wav']
mix='[0:a]asplit[v1][v2];[2:a]volume=0.20,afade=t=in:d=2,afade=t=out:st=%.2f:d=3,atrim=0:%.2f[m];[m][v2]sidechaincompress=threshold=0.05:ratio=2.5:attack=80:release=700[md];'%(end-3,end)
mix+=';'.join(wf)+';[4:a]volume=0.9[amb];'+'[v1][md][amb]'+''.join(f'[w{j}]' for j in range(len(offs)))+f'amix=inputs={3+len(offs)}:duration=first:normalize=0[a]'
vf='[3:v]fps=25,colorkey=0x00FF00:0.30:0.08,despill=type=green,scale=400:400[av];[1:v][av]overlay=W-w-80:H-h+25:shortest=1,ass=mont/fx.ass[v]'
subprocess.run(['ffmpeg','-v','error','-y','-to',str(end),'-i',N,'-i','mont/bg2.mp4','-stream_loop','-1','-i',MUS,'-to',str(end),'-i','entrega/avatar_arilio_ep1_verde.mp4','-i','amb/ambiente.wav',*wi,
 '-filter_complex',vf+';'+mix,'-map','[v]','-map','[a]','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t',str(end),'entrega/previa_P01-P13_efeitos.mp4'],check=True)
print('ok',end)
