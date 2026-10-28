import json,re,unicodedata,subprocess,sys
w=json.load(open('words.json'))['chunks']
def n(s): return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFD',s.lower()).encode('ascii','ignore').decode())
W=[(n(c['text']),c['timestamp'][0],c['timestamp'][1]) for c in w if n(c['text'])]
starts=["eu sou o professor","e a historia de uma","e nenhum pediatra","voce muda de cidade","foi exatamente isso","sem ajuda em casa","e tentava dar","ao mesmo tempo um","esse filho chamado","ele escalava telhados","abria o portao","saia andando","entrava na casa","mais de uma vez","e quando vinha","levar a crianca","porque na propria","e olha sao","a primeira foi","e ela criou","tao real que","passou a procura","quando essa terapeuta","a mae teve","a segunda virada","nao so do irmao","existia nenhuma escola","as criancas da vizinhanca","foi esse gesto","e o que essa","quando falta estrutura","e o mesmo principio","alias nao e"]
idx=[];pos=0
for s in starts:
    t=[n(x) for x in s.split()]
    for i in range(pos,len(W)-len(t)+1):
        if all(W[i+k][0].startswith(t[k]) or t[k].startswith(W[i+k][0]) for k in range(len(t))):
            idx.append(i);pos=i+1;break
    else: print('MISS',s);sys.exit(1)
cuts=[0.0]
for i in idx[1:]: cuts.append(round((W[i-1][2]+W[i][1])/2,2))
dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',sys.argv[1]]))
cuts.append(dur)
plan=[9,6,3,8,6,6,3,5,5,2,5,2,4,8,6,6,7,9,11,3,3,3,5,4,6,5,4,4,8,9,16,5,6]
out=[]
for k in range(33):
    a,b=cuts[k],cuts[k+1]
    out.append((k+1,a,b,round(b-a,2),plan[k]))
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(a),'-to',str(b),'-i',sys.argv[1],'-c:a','libmp3lame','-b:a','192k',f'a{k+1:02d}.mp3'],check=True)
for r in out: print('P%02d %7.2f %7.2f  real=%5.2fs plano=%ds'%r)
json.dump(out,open('cuts.json','w'))
