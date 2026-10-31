"""Som ambiente por cena com fal.ai MMAudio, a partir do próprio clipe (sem música, sem voz)."""
import base64, json, os, subprocess, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, '/home/user/maestro-video-generator/lib')
from api_keys import resolve_key
H = {'Content-Type': 'application/json', 'Authorization': 'Key ' + resolve_key('fal')}
D = os.path.abspath(sys.argv[1]); SOM = json.load(open(os.path.join(D, 'sons.json')))
cuts = {int(k): (a, b) for k, a, b, *_ in json.load(open(os.path.join(D, 'cuts.json')))}
def call(u, d=None):
    r = urllib.request.Request(u, data=json.dumps(d).encode() if d else None, headers=H, method='POST' if d else 'GET')
    return json.load(urllib.request.urlopen(r, timeout=300))
def run(k):
    out = os.path.join(D, 'amb', f'a{k:02d}.wav')
    if os.path.exists(out): return k, 'já existe'
    a, b = cuts[k]; d = min(b - a + 0.6, 10)
    tmp = os.path.join(D, 'amb', f'in{k:02d}.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(D, 'clipes', f'p{k:02d}.mp4'), '-t', f'{d:.2f}', '-an', '-c:v', 'libx264', '-crf', '26', tmp], check=True)
    uri = 'data:video/mp4;base64,' + base64.b64encode(open(tmp, 'rb').read()).decode()
    s = call('https://queue.fal.run/fal-ai/mmaudio-v2', {"video_url": uri, "prompt": SOM[str(k)], "negative_prompt": "music, speech, voice, talking, singing", "duration": round(d, 2)})
    while call(s['status_url'])['status'] != 'COMPLETED': time.sleep(4)
    r = call(s['response_url']); v = os.path.join(D, 'amb', f'o{k:02d}.mp4')
    open(v, 'wb').write(urllib.request.urlopen(r['video']['url']).read())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', v, '-vn', '-ac', '2', '-ar', '44100', out], check=True)
    return k, 'ok'
with ThreadPoolExecutor(5) as ex:
    for res in ex.map(run, sorted(cuts)): print(*res, flush=True)
