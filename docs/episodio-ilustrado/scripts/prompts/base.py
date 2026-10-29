import json,re,urllib.request
import os; T=os.environ['PAINEL_TOKEN']
H={'Authorization':'Bearer '+T,'Content-Type':'application/json'}
U='https://painel.recursoscognitivos.com.br/producao-videos/automacao'
S=os.environ.get('EPISODIO_DIR','./')
BLOCO=("One single continuous shot, no cuts. Image-to-video animation. Preserve the original illustration exactly: same painting texture, palette, "
"composition, framing, faces and clothes, same lighting. Do not restyle, do not redraw, do not morph faces or hands, do not add or remove objects, "
"do not reveal anything outside the original frame. No camera pan. Keep the lower right corner quiet. No dialogue, no music, no text. ")
STY=("Use the attached style references ONLY for the painting style: rich painterly realism, gouache and colored pencil texture, warm golden side light, "
"long soft shadows, dust in the light, muted earthy Brazilian palette, visible paper and brush texture. Do not copy people from style references unless named. ")
END=" Real-world adult scale, camera at adult eye level unless stated. Lower right corner kept quiet and empty. No text, no letters, no signage, one single image."
EDIT="Keep this exact place, light, camera height and painting style, and the same people with the same faces and clothes. "
def segs(n):
    w=json.load(open(S+f'n{n}/words.json'))['chunks']; out=[];st=None
    for c in w:
        if st is None: st=c['timestamp'][0]
        t=c['text'].strip(); dur=c['timestamp'][1]-st
        if (re.search(r'[.?!]$',t) and dur>4) or (re.search(r',$',t) and dur>6.5) or dur>9.5 or c is w[-1]:
            out.append((st,c['timestamp'][1])); st=None
    return out
def mm(s): return f"{int(s//60)}:{int(s%60):02d}"
def dur(d):
    for x in (4,6,8,10):
        if d<=x+0.3: return f"{x}s"
    return "10s"
def gravar(chave,n,prefixo,titulo,conta,ordem,fichas,cenas,notas_extra=""):
    sg=segs(n); assert len(sg)==len(cenas),(chave,len(sg),len(cenas))
    out=[]
    for i,((a,b),(desc,como,img,anim)) in enumerate(zip(sg,cenas),1):
        cod=f"E{i:02d}"
        if img.startswith("CRIAR:"): img=STY+img[6:]+END
        elif img.startswith("EDIT:"): img=EDIT+img[5:]+" Change nothing else."
        out.append({"codigo":cod,"tempo":f"{mm(a)}–{mm(b)}","descricao":desc,"situacao":"falta","obs":como.replace("{p}",prefixo),
                    "imagem":img,"duracao":dur(b-a),"animacao":BLOCO+anim})
    notas=(f"Conta do Flow: {conta}. Nomes das cenas: {prefixo}E01, {prefixo}E02… (imagem e vídeo com o mesmo nome).\n"
           "EDITAR = clicar na imagem (abre grande) → 'O que você quer mudar?'. CRIAR = barra 'O que você quer criar?' (Imagem · 16:9 · Nano Banana 2.1).\n"
           "ANIMAR = Vídeo → Frames → 16:9 → Omni 1.1 Flash → 360p → duração da cena → x1; Início = a imagem da cena.\n"
           "Nunca editar as fichas; personagens ficam em Personagens (sem voz).\n\nFICHAS / CENÁRIOS A CRIAR PRIMEIRO (Imagem · 16:9 · x2, anexar as referências de estilo ref-estilo-p04 e ref-estilo-p08):\n"
           + "\n\n".join(f"• {nome}: {STY}{txt}{END}" for nome,txt in fichas) + ("\n\n"+notas_extra if notas_extra else ""))
    body={"chave":chave,"titulo":titulo,"noticia_id":n,"conta_flow":conta,"ordem":ordem,"etapas":{"roteiro":"feito","audio":"feito"},"cenas":out,"notas":notas}
    r=json.load(urllib.request.urlopen(urllib.request.Request(U,data=json.dumps(body).encode(),headers=H,method='POST')))
    print(r['chave'],r['cenas_total'])
