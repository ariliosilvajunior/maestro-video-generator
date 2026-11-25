from PIL import Image,ImageDraw
import montar as M
out=Image.new('RGB',(1376,768),M.BG); d=ImageDraw.Draw(out)
def cao(box,pct,x):
    f=M.recorte('PE20.jpg',box); a=int(M.DH*pct/100); f=f.resize((int(f.width*a/f.height),a),Image.LANCZOS)
    out.paste(f,(x,M.FLOOR-f.height),f)
out.paste(M.porta,(140,M.DTOP)); cao((20,35,450,465),22,420)
out.paste(M.porta,(760,M.DTOP)); cao((885,530,1105,750),18,1040)
M.linha(d,M.FLOOR-int(M.DH*0.22),110,660); M.linha(d,M.FLOOR-int(M.DH*0.18),730,1340)
d.line((100,M.FLOOR,640,M.FLOOR),fill=(150,130,110),width=3); d.line((720,M.FLOOR,1360,M.FLOOR),fill=(150,130,110),width=3)
d.text((20,18),"PE20S — Faísca (cachorro pequeno): em pé, a orelha chega a 22% da porta · sentado, 18%",font=M.f1,fill=(40,30,20))
d.text((200,722),"em pé ao lado da porta",font=M.f2,fill=(40,30,20))
d.text((860,722),"sentado ao lado da porta",font=M.f2,fill=(40,30,20))
out.save('PE20S.jpg',quality=92)
