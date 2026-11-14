import re,sys,os,json,uuid,subprocess,urllib.request,urllib.error
sys.path.insert(0,'/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/intro'); import el
D='/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/ep01v3/'
V='7E34QW8YpZNX1CILBhmz'
s=open('/home/user/maestro-video-generator/docs/episodio-ilustrado/roteiros-estilo-novo/ep01_quem-cuida-de-quem-cuida_narracao_v3.md').read().split('\n---\n')[1]
pars=[];troca=False
for p in s.split('\n\n'):
    p=p.strip()
    if not p: continue
    if p.startswith('[MÚSICA'):
        troca=True; continue
    if pars and troca: pars[-1][1]=1.8
    troca=False
    pars.append([re.sub(r'\s+',' ',p),0.75])
json.dump(pars,open(D+'pars.json','w'),ensure_ascii=False,indent=0)
K=el.chave()
def v3(i):
    body={'text':pars[i][0],'model_id':'eleven_v3','voice_settings':{'stability':0.5,'similarity_boost':0.8}}
    r=urllib.request.urlopen(urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{V}?output_format=mp3_44100_192',data=json.dumps(body).encode(),headers={'xi-api-key':K,'Content-Type':'application/json'},method='POST'),timeout=300)
    open(D+f'v{i:03d}.mp3','wb').write(r.read())
def sts(i):
    b='----'+uuid.uuid4().hex; data=open(D+f'v{i:03d}.mp3','rb').read()
    c=lambda n,v:f'--{b}\r\nContent-Disposition: form-data; name="{n}"\r\n\r\n{v}\r\n'
    body=(c('model_id','eleven_multilingual_sts_v2')+c('voice_settings',json.dumps({"stability":0.4,"similarity_boost":0.95,"style":0.0,"use_speaker_boost":True}))+
          f'--{b}\r\nContent-Disposition: form-data; name="audio"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n').encode()+data+f'\r\n--{b}--\r\n'.encode()
    r=urllib.request.urlopen(urllib.request.Request(f'https://api.elevenlabs.io/v1/speech-to-speech/{V}?output_format=mp3_44100_192',data=body,headers={'xi-api-key':K,'Content-Type':'multipart/form-data; boundary='+b},method='POST'),timeout=600)
    open(D+f's{i:03d}.mp3','wb').write(r.read())
def um(i):
    try:
        if not os.path.exists(D+f'v{i:03d}.mp3'): v3(i)
        if not os.path.exists(D+f's{i:03d}.mp3'): sts(i)
        return None
    except urllib.error.HTTPError as e: return (i,e.code,e.read()[:200])
if '--gerar' in sys.argv:
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(3) as ex: erros=[x for x in ex.map(um,range(len(pars))) if x]
    print('erros',erros[:3],len(erros))
if '--montar' in sys.argv:
    for pref in ('v','s'):
        L=open(D+f'lista_{pref}.txt','w')
        for i,(t,sil) in enumerate(pars):
            subprocess.run(['ffmpeg','-v','error','-y','-i',D+f'{pref}{i:03d}.mp3','-af','silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse','-ar','44100','-ac','1',D+f'{pref}{i:03d}.wav'],check=True)
            subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i','anullsrc=r=44100:cl=mono','-t',str(sil),D+f'z{i:03d}.wav'],check=True)
            L.write(f"file '{pref}{i:03d}.wav'\nfile 'z{i:03d}.wav'\n")
        L.close()
        nome={'v':'Ep01 v3 - voz ElevenLabs v3.mp3','s':'Ep01 v3 - SUA VOZ (v3 + troca de voz).mp3'}[pref]
        subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',D+f'lista_{pref}.txt','-af','loudnorm=I=-16:TP=-1.5','-ar','44100','-c:a','libmp3lame','-b:a','192k',D+nome],check=True)
