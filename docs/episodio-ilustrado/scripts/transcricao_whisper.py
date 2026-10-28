import base64,json,urllib.request,time,sys
sys.path.insert(0,'/home/user/maestro-video-generator/lib')
from api_keys import resolve_key
key=resolve_key('fal'); H={'Content-Type':'application/json','Authorization':'Key '+key}
uri='data:audio/mpeg;base64,'+base64.b64encode(open(sys.argv[1],'rb').read()).decode()
def call(u,d=None):
    r=urllib.request.Request(u,data=json.dumps(d).encode() if d else None,headers=H,method='POST' if d else 'GET')
    return json.load(urllib.request.urlopen(r,timeout=300))
sub=call('https://queue.fal.run/fal-ai/whisper',{"audio_url":uri,"task":"transcribe","language":"pt","chunk_level":"word","version":"3"})
while call(sub['status_url'])['status']!='COMPLETED': time.sleep(4)
r=call(sub['response_url']); json.dump(r,open(sys.argv[2],'w'),ensure_ascii=False); print(r['text'][:3000]); print(len(r.get('chunks',[])))
