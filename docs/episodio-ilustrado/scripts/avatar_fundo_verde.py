import base64,json,urllib.request,time,sys,io
sys.path.insert(0,'/home/user/maestro-video-generator/lib')
from api_keys import resolve_key
from PIL import Image
key=resolve_key('fal'); H={'Content-Type':'application/json','Authorization':'Key '+key}
im=Image.open('../images/1.webp').convert('RGB'); b=io.BytesIO(); im.save(b,'PNG')
uri='data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
def call(u,d=None):
    r=urllib.request.Request(u,data=json.dumps(d).encode() if d else None,headers=H,method='POST' if d else 'GET')
    return json.load(urllib.request.urlopen(r,timeout=300))
s=call('https://queue.fal.run/fal-ai/birefnet/v2',{"image_url":uri,"model":"General Use (Heavy)","operating_resolution":"2048x2048","output_format":"png"})
while call(s['status_url'])['status']!='COMPLETED': time.sleep(3)
r=call(s['response_url']); cut=Image.open(io.BytesIO(urllib.request.urlopen(r['image']['url']).read())).convert('RGBA')
cut.save('avatar_test/cutout.png')
g=Image.new('RGBA',cut.size,(0,255,0,255)); g.alpha_composite(cut); g.convert('RGB').save('avatar_test/avatar_verde.png'); print(cut.size)
