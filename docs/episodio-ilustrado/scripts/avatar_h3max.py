import base64,json,urllib.request,time,sys,os
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0,'/home/user/maestro-video-generator/lib')
from api_keys import resolve_key
key=resolve_key('fal'); H={'Content-Type':'application/json','Authorization':'Key '+key}
img='data:image/png;base64,'+base64.b64encode(open('avatar_test/avatar_verde.png','rb').read()).decode()
def call(u,d=None):
    r=urllib.request.Request(u,data=json.dumps(d).encode() if d else None,headers=H,method='POST' if d else 'GET')
    return json.load(urllib.request.urlopen(r,timeout=300))
def run(i):
    out=f'ep1_avatar/v{i:02d}.mp4'
    if os.path.exists(out): return i,'skip'
    aud='data:audio/mpeg;base64,'+base64.b64encode(open(f'ep1_avatar/chunks/c{i:02d}.mp3','rb').read()).decode()
    try: s=call('https://queue.fal.run/minimax/h3-max/lip-sync/image-to-video',{"image_url":img,"audio_url":aud,"resolution":"480P"})
    except urllib.error.HTTPError as e: return i,'ERR '+e.read()[:300].decode()
    t0=time.time()
    while call(s['status_url'])['status']!='COMPLETED':
        if time.time()-t0>1200: return i,'timeout'
        time.sleep(8)
    try: r=call(s['response_url'])
    except urllib.error.HTTPError as e: return i,'FAIL '+e.read()[:300].decode()
    open(out,'wb').write(urllib.request.urlopen(r['video']['url']).read()); return i,'ok'
ids=[int(x) for x in sys.argv[1:]]
with ThreadPoolExecutor(4) as ex:
    for res in ex.map(run,ids): print(*res,flush=True)
