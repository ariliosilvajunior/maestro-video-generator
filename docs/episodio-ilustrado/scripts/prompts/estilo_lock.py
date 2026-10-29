import json,urllib.request,sys
sys.path.insert(0,__import__('os').path.dirname(__file__)); from base import H,U
LOCK=(" STYLE LOCK: rich painterly realism in gouache and coloured pencil, visible brush strokes and paper texture, warm golden side light, "
      "long soft shadows, muted earthy palette, exactly like the opened/attached image. NOT watercolor, NOT ink line drawing, NOT cartoon, "
      "NOT children's book illustration, NOT white-paper sketch.")
eps=json.load(urllib.request.urlopen(urllib.request.Request(U,headers=H)))
for e in eps:
    if e['chave']=='piloto': continue
    n=0
    for c in e['cenas']:
        img=c.get('imagem') or ''
        if img and img!='—' and 'STYLE LOCK' not in img:
            c['imagem']=img.rstrip()+LOCK; n+=1
    body={"chave":e['chave'],"cenas":e['cenas']}
    r=json.load(urllib.request.urlopen(urllib.request.Request(U,data=json.dumps(body).encode(),headers=H,method='POST')))
    print(e['chave'],n,'atualizadas; situações preservadas:',sum(1 for c in r['cenas'] if c['situacao']!='falta'))
