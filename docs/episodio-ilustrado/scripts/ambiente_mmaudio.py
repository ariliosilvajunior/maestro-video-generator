import base64,json,urllib.request,time,sys,subprocess,os
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0,'/home/user/maestro-video-generator/lib')
from api_keys import resolve_key
key=resolve_key('fal'); H={'Content-Type':'application/json','Authorization':'Key '+key}
U='/root/.claude/uploads/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/'
cuts={k:(a,b) for k,a,b,d,p in json.load(open('audio/cuts.json'))}
clips={1:('f0763cba-p01.mp4',0,'quiet dawn countryside, soft wind over dirt road, distant rooster, faint birds'),
2:('b3371d71-p02.mp4',0,'footsteps on dry dirt road, light wind, distant birds, quiet small town'),
3:('7a4adb7d-p03.mp4',0,'empty quiet street, light wind, paper fluttering, distant dog bark'),
4:('e6f9f391-p04.mp4',0,'cardboard boxes rustling, quiet room, soft movement indoors'),
5:('28655e2e-Dust_drifting_in_cabinet_light_1eaa89dd.mp4',0,'quiet old kitchen room tone, faint wooden cabinet door creak'),
6:('d9b566c9-p07.mp4',0,'wood fire crackling in stove, pot simmering, steam'),
7:('ae13de1f-Dust_turning_in_light_beam_bbe8770b.mp4',0,'quiet living room tone, distant birds outside window'),
8:('e8c42487-p08.mp4',0,'children moving in a room, blanket dragging on floor, small objects'),
9:('06547ff5-p09.mp4.mp4',1.9,'child running barefoot on tile floor, wooden chair rocking'),
10:('6bf64f14-p10.mp4',0,'clay roof tile scraping and falling, light wind, birds'),
11:('993dead2-Dust_drifts_past_swinging_gate_051f2564.mp4',0,'old rusty metal gate creaking slowly, wind, dust'),
12:('f344eb2c-p12.mp4',0,'wind over dry grass, distant footsteps running on dirt road'),
13:('3235a9a1-p13.mp4',0,'wooden door, quiet house interior, small footsteps, birds outside')}
def call(u,d=None):
    r=urllib.request.Request(u,data=json.dumps(d).encode() if d else None,headers=H,method='POST' if d else 'GET')
    return json.load(urllib.request.urlopen(r,timeout=300))
def run(k):
    out=f'amb/a{k:02d}.wav'
    if os.path.exists(out): return k,'skip'
    f,ss,pr=clips[k]; a,b=cuts[k]; d=min(b-a+0.6,10)
    tmp=f'amb/in{k:02d}.mp4'
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(ss),'-i',U+f,'-t',f'{d:.2f}','-an','-c:v','libx264','-crf','26',tmp],check=True)
    uri='data:video/mp4;base64,'+base64.b64encode(open(tmp,'rb').read()).decode()
    try: s=call('https://queue.fal.run/fal-ai/mmaudio-v2',{"video_url":uri,"prompt":pr,"negative_prompt":"music, speech, voice, talking, singing","duration":round(d,2)})
    except urllib.error.HTTPError as e: return k,'ERR '+e.read()[:300].decode()
    while call(s['status_url'])['status']!='COMPLETED': time.sleep(5)
    try: r=call(s['response_url'])
    except urllib.error.HTTPError as e: return k,'FAIL '+e.read()[:300].decode()
    v=f'amb/o{k:02d}.mp4'; open(v,'wb').write(urllib.request.urlopen(r['video']['url']).read())
    subprocess.run(['ffmpeg','-v','error','-y','-i',v,'-vn','-ac','2','-ar','44100',out],check=True); return k,'ok'
ids=[int(x) for x in sys.argv[1:]] or sorted(clips)
with ThreadPoolExecutor(4) as ex:
    for res in ex.map(run,ids): print(*res,flush=True)
