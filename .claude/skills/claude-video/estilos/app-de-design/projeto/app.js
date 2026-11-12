// O app inteiro desenhado a partir de um estado. paint(S) não guarda nada entre quadros: mesmo S, mesma imagem.
const CLAY='#D97757',TEAL='#2F8C83',VIO='#6E5FC2',RED='#E5402A',YEL='#FFD43B';
function rng(a){return()=>{a|=0;a=a+0x6d2b79f5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x;
const spark=(c=CLAY,w=9)=>{let d='';for(let i=0;i<12;i++){const a=i*Math.PI/6,l=i%2?44:50;d+=`M${50+Math.cos(a)*7} ${50+Math.sin(a)*7}L${50+Math.cos(a)*l} ${50+Math.sin(a)*l}`}return `<svg viewBox="0 0 100 100"><path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/></svg>`};
const ic=(d,c='#1F1F1F',w=2)=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I={frame:'<path d="M8 3v18M16 3v18M3 8h18M3 16h18"/>',plus:'<path d="M12 4v16M4 12h16"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',shadow:'<rect x="3" y="3" width="14" height="14" rx="2"/><path d="M21 8v11a2 2 0 0 1-2 2H8"/>',img:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/>',person:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',T:'<path d="M5 6h14M12 6v14"/>',arrow:'<path d="M4 18C10 18 15 14 19 6M13 6h6v6"/>',tag:'<rect x="3" y="7" width="18" height="10" rx="2"/>',copy:'<rect x="4" y="8" width="12" height="12" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v10"/>',cursor:'<path d="M5 3l15 9-7 1.5L10 20z" fill="currentColor"/>',rect:'<rect x="4" y="6" width="16" height="12" rx="1.5"/>',pen:'<path d="M4 18C8 4 16 20 20 6"/><circle cx="4" cy="18" r="1.6"/><circle cx="20" cy="6" r="1.6"/>',hand:'<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v9c0 4-3 6-6 6-4 0-5-3-8-8 1-1 3-1 5 1z"/>',msg:'<path d="M4 5h16v11H9l-5 4z"/>',check:'<path d="M5 12.5 10 17 19 7"/>',up:'<path d="M12 19V5M6 11l6-6 6 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
const STEPS=[['Fundo','img'],['Recorte + brilho','person'],['Título','T'],['Seta + selo','arrow'],['3 variações','copy'],['Escolher a vencedora','check']];

// ---------- a arte da thumbnail: 1280 x 720, nada de foto ----------
const BG={
 sunset:`<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg"><defs>
  <linearGradient id="sk1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#17152a"/><stop offset=".3" stop-color="#2a2340"/><stop offset=".62" stop-color="#4a3350"/></linearGradient>
  <radialGradient id="sn1" cx=".52" cy=".62" r=".5"><stop offset="0" stop-color="#d9a673"/><stop offset=".42" stop-color="#a86d55" stop-opacity=".55"/><stop offset="1" stop-color="#8a4c55" stop-opacity="0"/></radialGradient>
  <radialGradient id="hz1" cx="1" cy=".62" r=".62" gradientTransform="translate(0 .25) scale(1 .62)"><stop offset="0" stop-color="#d9705a" stop-opacity=".95"/><stop offset=".55" stop-color="#b8604f" stop-opacity=".5"/><stop offset="1" stop-color="#8a4c55" stop-opacity="0"/></radialGradient>
  <linearGradient id="sa1" x1="0" x2="1"><stop offset="0" stop-color="#5c3f3a"/><stop offset=".6" stop-color="#b2835a"/><stop offset="1" stop-color="#d9a671"/></linearGradient></defs>
  <rect width="1280" height="720" fill="url(#sk1)"/><rect width="1280" height="470" fill="url(#hz1)"/><rect width="1280" height="520" fill="url(#sn1)"/>
  <path d="M0 470C180 430 420 424 640 432S1040 436 1280 430V560H0Z" fill="#3b3048"/>
  <path d="M0 500C210 468 470 482 700 478S1100 470 1280 462V720H0Z" fill="#191a1f"/>
  <path d="M280 720C430 610 700 568 950 548S1190 520 1280 512V556C1100 574 980 590 860 640S620 720 520 720Z" fill="url(#sa1)"/>
  <path d="M620 720C800 640 1040 580 1280 568V720Z" fill="#20211f"/>
  <path d="M0 580C110 590 230 640 330 720H0Z" fill="#100f15"/>
  <g transform="translate(590 505)"><path d="M26 -74V0H-30Z" fill="#8f8785"/><path d="M32 -70V0H72Z" fill="#b0a8a2"/><path d="M-36 6H78L66 22H-22Z" fill="#14131a"/></g></svg>`,
 island:`<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg"><defs>
  <linearGradient id="sk2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#151236"/><stop offset=".3" stop-color="#3d2a63"/><stop offset=".5" stop-color="#c0638f"/><stop offset=".58" stop-color="#f1a0a6"/></linearGradient>
  <linearGradient id="se2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3fb2ab"/><stop offset="1" stop-color="#0d3d4a"/></linearGradient></defs>
  <rect width="1280" height="420" fill="url(#sk2)"/><rect y="400" width="1280" height="320" fill="url(#se2)"/>
  <path d="M170 480C270 390 520 380 760 408S1000 470 900 520 560 590 340 560 110 530 170 480Z" fill="#101a1d"/>
  ${(()=>{const r=rng(9);let s='';for(let i=0;i<120;i++){const x=240+r()*640,y=420+r()*120;s+=`<circle cx="${x}" cy="${y}" r="${1.4+r()*1.8}" fill="#ffd98f" opacity="${.5+r()*.5}"/>`}return s})()}</svg>`,
 fog:`<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg"><defs>
  <linearGradient id="fg3" x1="0" x2="1"><stop offset="0" stop-color="#57534f"/><stop offset=".45" stop-color="#b9b6b0"/><stop offset="1" stop-color="#ebe9e4"/></linearGradient></defs>
  <rect width="1280" height="720" fill="url(#fg3)"/><path d="M0 500C240 470 520 520 760 500S1100 470 1280 492V720H0Z" fill="#35312f" opacity=".85"/>
  <path d="M0 560C300 530 640 590 1280 540V720H0Z" fill="#1e1c1b"/>
  <g transform="translate(730 370) scale(.8)"><path d="M6 -150C50 -60 110 90 180 170H6Z" fill="#c11f18"/><path d="M-6 -120V170H-120C-60 90 -20 -30 -6 -120Z" fill="#8f1610"/><path d="M-150 182H210L176 226H-112Z" fill="#141210"/></g></svg>`};

// o mesmo personagem do 01-editor: moletom sem capuz, capuz caído, cordões e cabelo com gel
const FIG={fig:'#1b120d',face:'#33221a',rimL:'#c88356',rimR:'#b9c2a0'};
const BUST=g=>{const sh=g.shadow?'drop-shadow(0 18px 26px rgba(0,0,0,.5))':'',gl=g.glow>0?`drop-shadow(0 0 ${g.glow*.34}px rgba(255,190,110,.95)) drop-shadow(0 0 ${g.glow*1.1}px rgba(255,160,80,.55))`:'',T=FIG;
 return `<svg viewBox="0 0 1280 720" style="position:absolute;inset:0;filter:${sh} ${gl}" xmlns="http://www.w3.org/2000/svg"><g transform="translate(342 -25) scale(.69)">
  <path d="M455 1080C455 830 620 700 760 680H1030C1170 700 1335 830 1335 1080Z" fill="${T.fig}"/><path d="M455 1080C455 830 620 700 760 680" fill="none" stroke="${T.rimL}" stroke-width="5"/><path d="M1030 680C1170 700 1335 830 1335 1080" fill="none" stroke="${T.rimR}" stroke-width="4"/>
  <path d="M690 770C690 680 770 640 830 668H960C1020 640 1100 680 1100 770C1020 830 770 830 690 770Z" fill="${T.fig}"/><path d="M690 770C690 680 770 640 830 668" fill="none" stroke="${T.rimL}" stroke-width="4"/><path d="M960 668C1020 640 1100 680 1100 770" fill="none" stroke="${T.rimR}" stroke-width="3"/>
  <path d="M822 620H968V740C940 790 850 790 822 740Z" fill="${T.face}"/>
  <ellipse cx="768" cy="512" rx="15" ry="36" fill="${T.face}"/><ellipse cx="1022" cy="512" rx="15" ry="36" fill="${T.face}"/>
  <path d="M895 340C800 340 772 420 776 510C784 630 840 712 895 712S1006 630 1014 510C1018 420 990 340 895 340Z" fill="${T.face}"/><path d="M776 510C784 630 840 712 895 712" fill="none" stroke="${T.rimL}" stroke-width="4" opacity=".85"/><path d="M1014 510C1006 630 950 712 895 712" fill="none" stroke="${T.rimR}" stroke-width="3" opacity=".7"/>
  <path d="M772 490C756 440 752 390 764 340C768 308 786 292 806 284Q818 274 828 258Q842 270 854 274Q870 250 892 240Q906 256 920 260Q942 240 970 242Q976 260 980 274Q1004 280 1022 302C1038 332 1036 410 1018 490C1010 440 992 410 950 400C890 388 826 396 800 430C786 448 778 468 772 490Z" fill="${T.fig}"/><path d="M772 490C756 440 752 390 764 340C768 308 786 292 806 284Q818 274 828 258Q842 270 854 274Q870 250 892 240" fill="none" stroke="${T.rimL}" stroke-width="4" stroke-linejoin="round"/><path d="M892 240Q906 256 920 260Q942 240 970 242Q976 260 980 274Q1004 280 1022 302C1038 332 1036 410 1018 490" fill="none" stroke="${T.rimR}" stroke-width="3" stroke-linejoin="round"/><path d="M814 392Q830 346 866 322M868 384Q888 342 930 316M932 388Q952 352 988 336" fill="none" stroke="${T.rimR}" stroke-width="3" stroke-linecap="round" opacity=".32"/>
  <path d="M720 778C800 830 990 830 1070 778L1000 720C960 800 830 800 790 720Z" fill="${T.fig}"/><path d="M790 720C830 800 960 800 1000 720" fill="none" stroke="${T.rimR}" stroke-width="3" opacity=".5"/>
  <path d="M856 792C852 832 858 872 852 930M934 792C938 832 932 872 938 930" fill="none" stroke="${T.rimR}" stroke-width="5" stroke-linecap="round" opacity=".6"/></g></svg>`};

// T = {bg,color,arrow,typed,tx,ty,fig,shadow,glow,arrowP,badge,grid,caret,white}
// os ids dos gradientes não podem se repetir entre quadros, senão um quadro escondido apaga a cor do outro
const scoped=(h,k)=>h.replace(/id="(\w+)"/g,`id="$1${k}"`).replace(/url\(#(\w+)\)/g,`url(#$1${k})`);
function thumb(T,k='f'){return scoped(thumbRaw(T),k)}
function thumbRaw(T){if(T.white)return '<div style="position:absolute;inset:0;background:#fff"></div>';
 let h=T.drop!=null?`<div style="position:absolute;inset:0;background:#fff"></div><div style="position:absolute;inset:0;transform:translateY(${T.drop}px)">${BG[T.bg||'sunset']}</div>`:BG[T.bg||'sunset'];
 if(T.wash>0)h+=`<div style="position:absolute;inset:0;background:#fff;opacity:${T.wash}"></div>`;
 if(T.fig>0)h+=`<div style="position:absolute;inset:0;opacity:${T.figA==null?1:T.figA};transform:translateY(${(1-T.fig)*260}px)">${BUST(T)}</div>`;
 if(T.typed>0){const s='CLAUDE\nFEZ ISSO'.slice(0,T.typed).split('\n');
  h+=`<div style="position:absolute;left:${T.tx}px;top:${T.ty}px;font:800 150px/135px Switzer,sans-serif;letter-spacing:-.03em;color:${T.color||YEL};white-space:pre;text-shadow:0 8px 18px rgba(0,0,0,.45)">${s.join('<br>')}${T.caret?`<span style="display:inline-block;width:7px;height:118px;margin-left:8px;background:${CLAY};vertical-align:-8px"></span>`:''}</div>`}
 if(T.grid>0){let g='';for(let i=0;i<12;i++)g+=`<i style="position:absolute;top:0;bottom:0;left:${56+i*(1168+24)/12}px;width:${(1168+24)/12-24}px;background:rgba(217,119,87,.17)"></i>`;h+=`<div style="position:absolute;inset:0;opacity:${T.grid}">${g}</div>`}
 if(T.arrowP>0){const L=760,c=T.color||YEL,p=T.arrowP;
  h+=`<svg viewBox="0 0 1280 720" style="position:absolute;inset:0;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))"><path d="M322 628C460 712 680 680 800 542" fill="none" stroke="${c}" stroke-width="26" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L*(1-p)}"/>${p>=.98?`<path d="M724 546 818 528 802 626Z" fill="${c}" stroke="${c}" stroke-width="10" stroke-linejoin="round"/>`:''}</svg>`}
 if(T.badge>0)h+=`<div style="position:absolute;left:58px;top:40px;width:232px;height:84px;background:${RED};border-radius:10px;display:flex;align-items:center;justify-content:center;font:800 54px Switzer,sans-serif;letter-spacing:-.03em;color:#fff;box-shadow:0 8px 16px rgba(0,0,0,.35);transform:rotate(-4deg) scale(${T.badge})">100% IA</div>`;
 return h}

// ---------- painéis ----------
function layers(n){const L=[['Selo','tag'],['Seta','arrow'],['Título','T'],['Recorte','person'],['Fundo','img']].slice(Math.max(0,5-n));
 return `<div class="lh"><b>Thumbnails</b><small>Rascunhos</small></div><div class="tabs"><span class="on">Camadas</span><span>Recursos</span></div><div class="li top">${ic(I.frame)}<b>Thumbnail</b></div>${L.map(([a,k])=>`<div class="li">${ic(I[k],'#6B6B67')}${a}</div>`).join('')}${n>=6?`<div class="li top">${ic(I.frame)}<b>Thumbnail 2</b></div><div class="li top">${ic(I.frame)}<b>Thumbnail 3</b></div>`:''}`}
function design(S){const E=S.fx||{},text=S.textOn;const f=v=>`<div class="fld ${text?'':'dim'}" style="${v[1]}">${v[0]}</div>`;
 const rowFx=(y,e,name,on)=>`<div class="fx" style="top:${y}px;opacity:${clamp(e*3)};transform:scale(${.9+.1*e})">${on==='g'?`<i class="dot"></i>`:ic(I.shadow,'#3a3a38')}<b>${name}</b>${ic(I.eye,'#6B6B67')}</div>`;
 return `<div class="tabs" style="top:14px"><span class="on">Design</span><span>Protótipo</span></div><hr style="top:56px">
 <div class="row" style="top:68px">${ic(I.frame)}<b>Thumbnail</b></div>
 ${[['X','0',20,100],['Y','0',136,100],['L','1280',20,144],['A','720',136,144]].map(([a,b,x,y])=>`<div class="in" style="left:${x}px;top:${y}px"><i>${a}</i>${b}</div>`).join('')}
 <hr style="top:188px"><div class="lb" style="top:202px">Preenchimento</div>
 <div class="row" style="top:238px">${S.fill?`<span class="chip" style="background-image:${THUMBURI}"></span><b>Imagem</b>`:'<b>FFFFFF</b>'}<em>100%</em></div>
 <hr style="top:282px"><div class="lb" style="top:296px">Efeitos</div><span class="pl" style="top:296px">${ic(I.plus)}</span>
 ${E.shadow?rowFx(334,E.shadow,'Sombra projetada'):''}${E.glow?rowFx(382,E.glow,'Brilho externo','g'):''}
 ${E.glow?`<div class="sl" style="top:432px"><i>Espalhar</i><div class="tr"><u style="width:${E.spread/44*100}%"></u><s style="left:${E.spread/44*100}%"></s></div><b>${Math.round(E.spread)}</b></div>`:''}
 <hr style="top:478px"><div class="lb ${text?'':'dim'}" style="top:492px">Texto</div>
 ${f(['Switzer','left:20px;top:530px;width:224px'])}${f(['Black','left:20px;top:570px;width:140px'])}${f(['150','left:168px;top:570px;width:76px'])}
 <div class="sw" style="top:616px;opacity:${text?1:.5}"></div><div class="fxt ${text?'':'dim'}" style="top:620px">FFD43B</div>
 <hr style="top:668px"><div class="lb" style="top:682px">Grade de layout</div><span class="pl" style="top:682px">${ic(I.plus)}</span>
 ${S.gridOn?`<div class="row" style="top:716px"><b style="font-weight:600">12 colunas</b></div>`:''}
 <hr style="top:758px"><div class="lb" style="top:772px">Exportar</div>
 <div class="fld" style="left:20px;top:808px;width:60px">2x</div><div class="fld" style="left:88px;top:808px;width:156px">PNG</div>`}
function claude(S){const P=S.plan||{};const rev=P.rev||0,done=P.done||0;
 return `<div class="who" style="opacity:${P.who==null?1:P.who}">${spark()}<b>Claude</b></div>${P.ask?`<div class="ask" style="opacity:${clamp(P.ask*2)};transform:translateY(${(1-P.ask)*12}px) scale(${.9+.1*P.ask})">Cria uma thumbnail pra mim</div>`:''}
 ${STEPS.map(([n,k],i)=>{const e=clamp(rev-i);if(e<=0)return '';const ok=i<done,run=i===done&&P.on;
  return `<div class="st ${ok?'ok':run?'run':''}" style="opacity:${e};transform:translateY(${(1-e)*14}px)"><span class="si">${ic(I[k],ok||run?'#1F1F1F':'#A3A39E')}</span>${n}<b style="${run?`transform:rotate(${P.spin||0}deg)`:ok?`transform:scale(${(P.tick||[])[i]==null?1:P.tick[i]})`:''}">${ok?ic(I.check,'#fff',3):''}</b></div>`}).join('')}
 <div class="send" style="opacity:${P.who==null?1:P.who}"><u></u><i>${ic(I.up,'#fff',3)}</i></div>`}

// ---------- montagem ----------
const $=id=>document.getElementById(id);
const memo=new Map();function put(el,s){if(memo.get(el)!==s){memo.set(el,s);el.innerHTML=s}}
const uri=s=>`url('data:image/svg+xml,${encodeURIComponent(s).replace(/'/g,'%27')}')`;
const THUMBURI=uri(BG.sunset);
const CX=753,CY=548; // centro do canvas em coordenadas do app
function arrowSVG(c){return `<svg viewBox="0 0 40 48"><path d="M3 3 L3 37 L13 28 L20 44 L27 41 L20 25 L34 25 Z" fill="${c}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>`}
function cursorAt(el,S,p,k,a=1){if(!p||a<=0){el.style.display='none';return}el.style.display='block';el.style.opacity=a;const[s,x,y]=S.cam;const X=960+(p[0]-x)*s,Y=540+(p[1]-y)*s;el.style.transform=`translate(${X}px,${Y}px) scale(${k})`}

function paint(S){
 const[s,cx,cy]=S.cam,[rx,ry]=S.tilt||[0,0];const z=S.z;
 $('feed').style.display=S.feed?'block':'none';
 $('cam').style.display=S.feed?'none':'block';
 $('cam').style.transform=rx||ry?`translate(960px,540px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s}) translate(${-cx}px,${-cy}px)`:`translate(${960-cx*s}px,${540-cy*s}px) scale(${s})`;
 const k=clamp(.58*Math.sqrt(s),.5,1.05);
 if(S.feed){paintFeed(S);for(const c of['cAna','cLeo'])$(c).style.display='none'}
 else{
 put($('barL'),`<span class="dots"><i></i><i></i><i></i></span><span class="grid4"></span><b>Thumbnails</b><span class="dim">/ Ep 42</span>`);
 const dots=clamp((s*z*44-8)/14);
 const c=$('canvas');const st=(z<.4?88:44)*z;c.style.backgroundSize=`${st}px ${st}px`;c.style.backgroundImage=`radial-gradient(rgba(180,180,172,${dots}) 1.1px,transparent 1.3px)`;c.style.backgroundPosition=`${CX-260-640*z}px ${CY-44-360*z}px`;
 put($('zoomL'),Math.round(z*100)+'%');
 put($('layers'),layers(S.layers||0));put($('design'),design(S));put($('claude'),claude(S));
 $('claude').style.display=S.plan&&S.plan.panel===0?'none':'block';
 // quadros
 const ox=CX-640*z,oy=CY-360*z;let fr='',lab='';
 (S.frames||[]).forEach((F,i)=>{const w=1280*z,h=720*z,x=ox+F.x*z,y=oy+(F.y||0)*z;
  fr+=`<div class="fr" style="left:${x}px;top:${y}px;width:1280px;height:720px;transform:scale(${z}) ${F.tf||''};opacity:${F.a==null?1:F.a}">${thumb(F.T,'q'+i)}</div>`;
  lab+=`<div class="flb" style="left:${x}px;top:${y-24}px;opacity:${F.a==null?1:Math.max(.5,F.a)}">${F.name}</div>`});
 put($('frames'),fr);put($('flabels'),lab);
 // seleção, guias e medidas, sempre do tamanho do app
 const A=(x,y)=>[ox+x*z,oy+y*z];let o='';
 if(S.sel){const[a,b]=A(S.sel.x,S.sel.y),w=S.sel.w*z,h=S.sel.h*z;
  o+=`<div class="sb" style="left:${a}px;top:${b}px;width:${w}px;height:${h}px"></div>`;
  [[0,0],[1,0],[0,1],[1,1]].forEach(([i,j])=>o+=`<i class="hd" style="left:${a+i*w}px;top:${b+j*h}px"></i>`);
  o+=`<div class="pill" style="left:${a+w/2}px;top:${b+h+10}px;transform:translateX(-50%)">${Math.round(S.sel.w)} × ${Math.round(S.sel.h)}</div>`}
 (S.guides||[]).forEach(g=>{
  if(g.v!=null){const[a,b]=A(g.v,0);o+=`<div class="gl" style="left:${a}px;top:${b}px;width:1.5px;height:${720*z}px"></div>`}
  if(g.dx){const[a,b]=A(0,g.y);o+=`<div class="gl" style="left:${a}px;top:${b}px;width:${g.dx*z}px;height:1.5px"></div><div class="pill" style="left:${a+g.dx*z/2}px;top:${b}px;transform:translate(-50%,-50%)">${g.dx}</div>`}
  if(g.dy){const[a,b]=A(g.x,0);o+=`<div class="gl" style="left:${a}px;top:${b}px;width:1.5px;height:${g.dy*z}px"></div><div class="pill" style="left:${a}px;top:${b+g.dy*z/2}px;transform:translate(-50%,-50%)">${g.dy}</div>`}});
 if(S.ring){const[a,b]=A(-110,-120),w=1500*z,h=960*z;
  o+=`<svg viewBox="0 0 1500 960" class="rg" style="left:${a}px;top:${b}px;width:${w}px;height:${h}px"><path d="M840 22C1200 2 1484 200 1474 470C1464 760 1130 946 720 940C330 934 24 750 24 470C24 200 330 30 690 26C820 24 980 28 1100 60" fill="none" stroke="${RED}" stroke-width="${16}" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-S.ring}"/></svg>`}
 if(S.mark)o+=`<div class="mk" style="left:${S.mark[0]}px;top:${S.mark[1]}px"></div>`;
 put($('over'),o);
 cursorAt($('cAna'),S,S.ana,k,S.anaA);cursorAt($('cLeo'),S,S.leo,k,S.leoA);
 const pn=S.pn||{};for(const id of['layers','design','claude','tool']){const e=pn[id]==null?1:pn[id];$(id).style.opacity=e;$(id).style.transform=`translateY(${(1-e)*26}px) scale(${.975+.025*e})`}
 const bl=$('barL'),br=$('barR'),ba=pn.bar==null?1:pn.bar;bl.style.opacity=ba;br.style.opacity=ba;
 const av=$('avAI'),ae=S.avA==null?1:S.avA;av.style.display=ae>0?'':'none';av.style.transform=`scale(${ae})`;
 }
 cursorAt($('cAI'),S.feed?{cam:[1,960,540]}:S,S.ai,S.feed?.62:k,S.aiA);
 const C2=$('click2');if(S.click2&&!S.feed){const X=960+(S.click2.p[0]-cx)*s,Y=540+(S.click2.p[1]-cy)*s;C2.style.display='block';C2.style.borderColor=S.click2.c;C2.style.transform=`translate(${X}px,${Y}px) scale(${S.click2.k*k})`;C2.style.opacity=S.click2.a}else C2.style.display='none';
 const W=$('wash');W.style.display=S.wash>0&&!S.feed?'block':'none';if(S.wash>0)W.style.opacity=S.wash;
 const Fl=$('fly');if(S.fly&&!S.feed){const f=S.fly;Fl.style.display='block';put(Fl,thumb(S.flyT,'fly'));Fl.style.transform=`translate(${f.x-640}px,${f.y-360}px) rotateX(${f.rx}deg) rotateY(${f.ry}deg) rotateZ(${f.rz}deg) scale(${f.s})`;Fl.style.borderRadius=16*f.e+'px';Fl.style.boxShadow=`0 ${26*f.e}px ${50*f.e}px rgba(0,0,0,${.2*f.l})`}else Fl.style.display='none';
 const R=$('click');if(S.click&&!S.feed){const X=960+(S.click[0]-cx)*s,Y=540+(S.click[1]-cy)*s;R.style.display='block';R.style.transform=`translate(${X}px,${Y}px) scale(${k*(S.clickK||1)})`;R.style.opacity=S.clickA==null?.85:S.clickA}else R.style.display='none';
}
function paintFeed(S){const F=S.feed;
 put($('feedArt'),thumb(F.T));
 $('feedCard').style.transform=`translate(240px,${F.y==null?46:F.y}px) scale(${1440/1280})`;
 put($('feedMeta'),`<span class="av">${ic('<circle cx="12" cy="9" r="4.2" fill="#fff" stroke="none"/><path d="M4 22c1-6 4-8 8-8s7 2 8 8" fill="#fff" stroke="none"/>','#fff')}</span><div><b>${F.title?'O Claude fez isso':''}</b><small style="opacity:${F.vA==null?1:F.vA}">Seu canal · ${F.views} visualizações</small></div>`);
 $('feedMeta').style.opacity=F.mA==null?1:F.mA;
 const ng=F.ng==null?1:F.ng;document.querySelectorAll('.ng').forEach((n,i)=>{n.style.opacity=ng;n.style.transform=`translateX(${(1-ng)*(i?90:-90)}px)`});document.querySelector('.ngm').style.opacity=clamp(F.mA==null?1:F.mA);
 $('feed').style.transform=`scale(${F.push||1})`;
 $('feedMeta').style.top=(F.y==null?46:F.y)+810+26+'px';
 $('feedDur').style.display=F.dur?'block':'none';$('feedDur').style.transform=`scale(${F.dur||1})`;$('feedClock').style.display=F.hover?'flex':'none';$('feedClock').style.transform=`scale(${F.hover||1})`;
}
