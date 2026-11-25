from PIL import Image,ImageDraw,ImageFont
import montar as M
base=Image.open('PE01S.jpg').convert('RGB').resize((1376,768))
out=Image.new('RGB',(1376,768),M.BG); out.paste(base.crop((0,60,700,768)),(0,60))
d=ImageDraw.Draw(out); d.rectangle((0,0,1376,58),fill=M.BG)
def cao(box,pct,x):
    f=M.recorte('PE20.jpg',box); a=int(M.DH*pct/100); f=f.resize((int(f.width*a/f.height),a),Image.LANCZOS)
    out.paste(f,(x,M.FLOOR-f.height),f); return f
cao((20,35,450,465),22,520)
out.paste(M.porta,(760,M.DTOP)); f=cao((885,530,1105,750),18,1040)
M.linha(d,M.FLOOR-int(M.DH*0.22),480,660); M.linha(d,M.FLOOR-int(M.DH*0.18),730,1340)
d.line((720,M.FLOOR,1360,M.FLOOR),fill=(150,130,110),width=3)
d.rectangle((150,712,700,768),fill=M.BG); d.rectangle((800,712,1376,768),fill=M.BG)
d.text((20,18),"PE20S — Faísca (cachorro pequeno): em pé, a ponta da orelha chega a 22% da porta · sentado, 18%",font=M.f1,fill=(40,30,20))
d.text((120,722),"em pé, ao lado do Davi (8 anos)",font=M.f2,fill=(40,30,20))
d.text((860,722),"sentado ao lado da porta",font=M.f2,fill=(40,30,20))
out.save('PE20S.jpg',quality=92)
