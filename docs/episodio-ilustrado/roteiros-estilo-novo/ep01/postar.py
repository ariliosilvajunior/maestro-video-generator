import sys,json,urllib.request
sys.path.insert(0,'/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/ep01v3'); sys.path.insert(0,'/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/ep')
import cenas_ep01 as C
from base import H,U
STYLE=("Handmade caricature stop-motion film still — the SAME puppets and the SAME miniature set as the attached references: keep every "
       "face, long clay nose, felted hair, knitted clothes and colors exactly as in the character sheets, and the set exactly as in the "
       "scenario image (now photographed as a real scene, not on a white background: fill the frame with the set and its surroundings). "
       "Macro photograph of a real handmade miniature, shallow depth of field, tiny dust particles floating in the light, lighting: {luz}. "
       "16:9, no text, no letters, no logos.")
ANIM=("One single continuous shot, no cuts. Handmade stop-motion puppet animation with slightly stepped motion, like a real "
      "stop-motion film. Action: {mov}. Camera: {cam}. Add gentle living details: dust particles drifting in the light, small fabric "
      "movement, soft light flicker. Keep faces, puppets, set and colors exactly as in the start frame; no mouths talking, no text, "
      "no new characters.")
def dur(d):
    for x in (4,6,8,10):
        if d<=x+0.4: return f"{x}s"
    return "10s"
def mm(s): return f"{int(s//60)}:{int(s%60):02d}"
S=C.S; ts=[x[0] for x in S]+[C.FIM]; n=len(S)
cenas=[]
for i,(t0,ce,pe,desc,acao,cam,mov,luz) in enumerate(S):
    cod=f"E{i+1:03d}"; conta="ABCD"[min(3,i*4//n)]
    anexo=" + ".join([ce]+pe)
    cenas.append({"codigo":cod,"tempo":f"{mm(t0)}–{mm(ts[i+1])}","descricao":desc,"situacao":"falta","conta_flow":conta,
      "obs":f"CRIAR (Imagem · 16:9 · x2) · ANEXAR {anexo} · salvar como rp1-{cod}",
      "imagem":f"{acao}. Camera: {cam}. "+STYLE.format(luz=luz),
      "duracao":dur(ts[i+1]-t0),"animacao":ANIM.format(mov=mov,cam=cam)})
notas=("A RUA DE PEDRA · Episódio 01 — Quem cuida de quem cuida (narração v3 aprovada em 14/11/2026, 13 min).\n"
"4 contas em paralelo: cada cena mostra a conta (A, B, C ou D) — blocos seguidos. Em cada conta, projeto 'RP · Ep01' com o Kit do mundo subido.\n"
"IMAGEM: CRIAR (Imagem · 16:9 · x2), anexar o cenário (CE…) e os personagens (PE…) indicados; salvar como rp1-E001…\n"
"VÍDEO: Vídeo → Frames → 16:9 → Omni 1.1 Flash → 720p → duração da cena → x1; Início = a imagem da cena; salvar com o mesmo nome.\n"
"Personagens: Davi pequeno = PE16, Davi 8 anos = PE01, Caio pequeno = PE17, Caio 11 = PE10. Escola para todos; AEE no contraturno (luz de tarde).\n"
"Música (M1–M8) e efeitos sonoros entram na montagem.")
body={"chave":"rp-ep01","titulo":"A Rua de Pedra · Ep01 — Quem cuida de quem cuida","conta_flow":"M","ordem":1,
      "etapas":{"roteiro":"feito","audio":"feito"},"cenas":cenas,"notas":notas}
r=json.load(urllib.request.urlopen(urllib.request.Request(U,data=json.dumps(body).encode(),headers=H,method='POST')))
print(r['chave'],r['cenas_total'])
import collections; print(collections.Counter(c['conta_flow'] for c in cenas))
cs=json.load(urllib.request.urlopen(urllib.request.Request(U.replace('automacao','contas/automacao'),headers=H)))
m=next(c for c in cs if c['letra']=='M')
eps=[e for e in m.get('episodios',[]) if e.get('chave')!='rp-ep01']+[{"chave":"rp-ep01","nome":"RP Ep01 — Quem cuida de quem cuida","prefixo":"rp1-","pasta_id":"17D6MIC_V5HVBKUjnUDXcEAERkLmB7icJ"}]
r=json.load(urllib.request.urlopen(urllib.request.Request(U.replace('automacao','contas/automacao'),data=json.dumps({"letra":"M","episodios":eps}).encode(),headers=H,method='POST')))
print('conta M',[e['chave'] for e in r['episodios']])
