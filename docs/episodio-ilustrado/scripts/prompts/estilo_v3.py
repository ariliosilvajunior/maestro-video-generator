import json,re,urllib.request,sys
sys.path.insert(0,__import__('os').path.dirname(__file__)); from base import H,U
COND="surface condition exactly as this text describes (a NEW place looks new: fresh clean paint, nothing peeling or cracked; an OLD place looks worn)"
def limpa(t):
    t=t.replace("muted warm sepia palette with faded blue walls and terracotta","muted warm sepia palette")
    t=t.replace("worn and weathered surfaces",COND).replace("worn weathered surfaces",COND)
    t=re.sub(r"Same painting style as the references: rich painterly realism, warm golden side light, long soft shadows, dust in the light, muted earthy 1980s Brazilian palette, visible paper and brush texture\. ","",t)
    t=t.replace(", visible paper and brush texture","")
    return t
eps=json.load(urllib.request.urlopen(urllib.request.Request(U,headers=H)))
for e in eps:
    if e['chave']=='piloto': continue
    for c in e['cenas']:
        if c.get('imagem') and c['imagem']!='—': c['imagem']=limpa(c['imagem'])
        if e['chave']=='kit-tutor' and c['codigo']=='K06':
            c['obs']="CRIAR (barra de baixo · Imagem · 16:9 · x2) · ANEXAR ref-estilo-p04 + ref-layout-cenario · salvar como c03-sala-nova (renomear a antiga para c03-sala-nova-antiga)"
            c['imagem']=re.sub(r"The attached image c03-sala-nova is the identity reference: show exactly this same place\. ","",c['imagem']).replace(
              "the classroom of the new school","the classroom of a brand-new small Brazilian school just built in the 1980s: freshly painted smooth white walls with a light-blue band at the bottom, everything clean and new (nothing peeling, cracked or stained), large windows with metal frames, shiny terracotta tile floor, a normal-sized green blackboard, simple new wooden and metal student desks, a teacher's desk")
        if e['chave']=='noticia-5' and c['codigo']=='S06b':
            c['obs']="ABRIR c03-sala-nova (a folha do Kit: abrir e usar o painel 1) · ANEXAR f01-educadora + ref-estilo-p04"
            c['imagem']=c['imagem'].replace("Inside the new school building: a bright new classroom, white walls with a light-blue band at the bottom, large windows, terracotta tile floor, normal-sized green blackboard. Adult eye level, medium-wide.",
              "Use ONLY panel 1 of this reference sheet as the full 16:9 image (same classroom, brand-new, fresh clean paint, nothing peeling). Adult eye level, medium-wide.")
    r=json.load(urllib.request.urlopen(urllib.request.Request(U,data=json.dumps({"chave":e['chave'],"cenas":e['cenas']}).encode(),headers=H,method='POST')))
    print(e['chave'],sum(c['situacao']!='falta' for c in r['cenas']))
