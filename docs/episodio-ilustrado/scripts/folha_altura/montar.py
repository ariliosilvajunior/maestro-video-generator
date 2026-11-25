import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
FN='/home/user/maestro-video-generator/docs/episodio-ilustrado/montagem/fontes/Goodly-Bold.woff'
f1=ImageFont.truetype(FN,26); f2=ImageFont.truetype(FN,24)
BG=(243,242,238); FLOOR=700; DTOP=110; DH=FLOOR-DTOP
porta=Image.open('PE15P.jpg').convert('RGB').crop((760,110,1007,701))
def recorte(path,box):
    im=Image.open(path).convert('RGB').crop(box); a=np.array(im).astype(int)
    m=(a.min(2)<215)|((a.max(2)-a.min(2))>28)
    m=np.array(Image.fromarray((m*255).astype('uint8')).filter(ImageFilter.MedianFilter(5)))>0
    ys,xs=np.where(m); y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
    rgba=np.dstack([a,(m*255)]).astype('uint8')
    return Image.fromarray(rgba,'RGBA').crop((x0,y0,x1+1,y1+1))
def linha(d,y,x0,x1):
    for x in range(x0,x1,22): d.line((x,y,x+12,y),fill=(196,58,58),width=3)
def ficha(cod,nome,path,box,pe,sent,genero):
    fig=recorte(path,box); alvo=int(DH*pe/100); fig=fig.resize((int(fig.width*alvo/fig.height),alvo),Image.LANCZOS)
    w,h=fig.size
    out=Image.new('RGB',(1376,768),BG); d=ImageDraw.Draw(out)
    out.paste(porta,(140,DTOP)); out.paste(fig,(470-w//2,FLOOR-h),fig); linha(d,FLOOR-h,110,640)
    out.paste(porta,(760,DTOP))
    topo=FLOOR-int(DH*sent/100); seat=FLOOR-int(DH*0.16)
    sup=fig.crop((0,0,w,int(h*0.62))); cx=1130-w//2
    out.paste(sup,(cx,topo),sup)
    can=fig.crop((0,int(h*0.80),w,h)).resize((w,FLOOR-seat)); out.paste(can,(cx,seat),can)
    bx0,bx1=cx-int(w*0.7),cx+w+int(w*0.7); bx0=max(bx0,975)
    for i,yy in enumerate((topo+int(h*0.17),topo+int(h*0.25),topo+int(h*0.33))):
        if yy<seat-10: d.rectangle((bx0+10,yy,bx1-10,yy+16),fill=(140,94,56),outline=(84,55,30))
    d.rectangle((bx0,seat,bx1,seat+18),fill=(122,82,48),outline=(84,55,30))
    for lx in (bx0+16,bx1-30): d.rectangle((lx,min(topo+int(h*0.15),seat),lx+14,FLOOR),fill=(104,70,40))
    linha(d,topo,730,1340)
    d.line((100,FLOOR,640,FLOOR),fill=(150,130,110),width=3); d.line((720,FLOOR,1360,FLOOR),fill=(150,130,110),width=3)
    d.text((20,18),f"{cod}S — {nome}: em pé, a cabeça chega a {pe}% da porta · sentad{genero}, a {sent}%",font=f1,fill=(40,30,20))
    d.text((170,722),"em pé ao lado da porta",font=f2,fill=(40,30,20))
    d.text((820,722),f"sentad{genero} no banco ao lado da porta",font=f2,fill=(40,30,20))
    out.save(f'{cod}S.jpg',quality=92); print(cod,w,h)
ficha('PE19','Dona Sônia','PE19.jpg',(90,20,320,750),65,50,'a')
ficha('PE21','Padre Antônio','PE21.jpg',(75,15,285,535),65,50,'o')
ficha('PE22','a menina do trem','PE22.jpg',(70,30,295,525),46,35,'a')
