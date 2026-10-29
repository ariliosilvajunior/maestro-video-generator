import json,re,urllib.request,sys
sys.path.insert(0,__import__('os').path.dirname(__file__)); from base import H,U
NOVO_ROLE=("REFERENCE ROLES: the attached image ref-estilo-p04 is the MASTER STYLE reference — match its look exactly, never copy its people or place. ")
NOVO_LOCK=(" STYLE LOCK (match ref-estilo-p04): cinematic painterly realism that looks almost like a photograph painted in oil — natural realistic proportions and adult-looking faces "
 "(not cute, not big eyes, not cartoon, not children's book), fine canvas grain and crosshatched texture over the whole image, muted warm sepia palette with faded blue walls and terracotta, "
 "strong low golden sunlight with long hard shadows, worn and weathered surfaces, documentary composition. NOT a clean digital illustration, NOT watercolor, NOT ink line drawing, NOT smooth bright colours.")
eps=json.load(urllib.request.urlopen(urllib.request.Request(U,headers=H)))
for e in eps:
    if e['chave']=='piloto': continue
    for c in e['cenas']:
        img=c.get('imagem') or ''
        if not img or img=='—': continue
        img=re.sub(r'^REFERENCE ROLES:.*?place\. ','',img)
        img=re.sub(r' STYLE LOCK:.*$','',img)
        img=img.replace("Use the attached style references ONLY for the painting style: rich painterly realism, gouache and colored pencil texture, warm golden side light, long soft shadows, dust in the light, muted earthy Brazilian palette, visible paper and brush texture. ","")
        img=img.replace(" STYLE LOCK: gouache and coloured pencil painterly realism, NOT watercolor, NOT ink line drawing, NOT cartoon.","")
        c['imagem']=NOVO_ROLE+img+NOVO_LOCK
    e['notas']=e['notas'].replace("5. Conferir antes de aceitar: guache/lápis (NÃO aquarela, NÃO contorno a tinta)","5. Conferir antes de aceitar: igual à ref-estilo-p04 — quase foto pintada, textura granulada, tons sépia, rostos realistas (NÃO desenho limpo, NÃO aquarela, NÃO rosto fofinho)")
    r=json.load(urllib.request.urlopen(urllib.request.Request(U,data=json.dumps({"chave":e['chave'],"cenas":e['cenas'],"notas":e['notas']}).encode(),headers=H,method='POST')))
    print(e['chave'],'ok',sum(c['situacao']!='falta' for c in r['cenas']))
