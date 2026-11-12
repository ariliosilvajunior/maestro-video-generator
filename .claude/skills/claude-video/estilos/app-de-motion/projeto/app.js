// O app inteiro desenhado a partir de um estado. paint(S) não guarda nada entre quadros: mesmo S, mesma imagem.
const CLAY='#D97757';
function rng(a){return()=>{a|=0;a=a+0x6d2b79f5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x;
const lerp=(a,b,e)=>a+(b-a)*e;
const spark=(c=CLAY,w=9)=>{let d='';for(let i=0;i<12;i++){const a=i*Math.PI/6,l=i%2?44:50;d+=`M${50+Math.cos(a)*7} ${50+Math.sin(a)*7}L${50+Math.cos(a)*l} ${50+Math.sin(a)*l}`}return `<svg viewBox="0 0 100 100"><path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/></svg>`};
const ic=(d,c='#CFCFCF',w=2)=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I={cursor:'<path d="M5 3l15 9-7 1.5L10 20z" fill="#EDEDED"/>',hand:'<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v9c0 4-3 6-6 6-4 0-5-3-8-8 1-1 3-1 5 1z"/>',zoom:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',orbit:'<path d="M4 12a8 8 0 1 1 3 6M4 19v-5h5"/>',cam:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 11 5-3v8l-5-3"/>',anchor:'<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="3"/>',rect:'<rect x="4" y="5" width="16" height="14" rx="1"/>',pen:'<path d="M12 3 5 20M12 3l7 17"/><circle cx="12" cy="3" r="1.5"/>',T:'<path d="M5 6h14M12 6v14"/>',line:'<path d="m5 19 14-14"/>',arrow:'<path d="M5 19 19 5M10 5h9v9"/>',erase:'<path d="m4 15 8-9 8 7-6 6H8z"/>',pin:'<circle cx="8" cy="8" r="3"/><path d="M12 12c4 0 5 3 8 8"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',clock:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>',curve:'<path d="M3 20C12 20 12 4 21 4"/>',tri:'<path d="M12 5 21 19H3z"/>',circle:'<circle cx="12" cy="12" r="8"/>',square:'<rect x="5" y="5" width="14" height="14"/>',target:'<circle cx="12" cy="12" r="6"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',low:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15h10"/>',play:'<path d="M6 4l14 8-14 8z" fill="#EDEDED" stroke="none"/>',playO:'<path d="M6 4l14 8-14 8z"/>',check:'<path d="M5 12.5 10 17 19 7"/>',up:'<path d="M12 19V5M6 11l6-6 6 6"/>',folder:'<path d="M3 6h7l2 2h9v11H3z"/>',walk:'<circle cx="13" cy="4.5" r="2.2" fill="#D97757" stroke="none"/><path d="M13 9v6M13 15l-3 6M13 15l3 6M13 10l-4 4M13 10l4 3"/>'};
const STEPS=[['Keyframes do título','T'],['Suavizar a curva','curve'],['Rastrear e fixar','target'],['Terço inferior','low'],['Prévia','playO']];
const uri=s=>`url('data:image/svg+xml,${encodeURIComponent(s).replace(/'/g,'%27')}')`;

// ---------- o plano: 1280 x 720, nada de foto. Só o corredor e os gráficos dependem do tempo do plano ----------
const SCENE=(()=>{let s=`<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg"><defs>
 <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#b57a4c"/><stop offset=".62" stop-color="#e9b47c"/></linearGradient>
 <radialGradient id="sun" gradientUnits="userSpaceOnUse" cx="640" cy="400" r="560"><stop offset="0" stop-color="#fff0c8"/><stop offset=".3" stop-color="#ffd9a0" stop-opacity=".8"/><stop offset="1" stop-color="#e9b47c" stop-opacity="0"/></radialGradient>
 <linearGradient id="fl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e2b27a"/><stop offset="1" stop-color="#8d6039"/></linearGradient>
 <linearGradient id="pane" x1="0" x2="1"><stop offset="0" stop-color="#b98a58"/><stop offset="1" stop-color="#7a5230"/></linearGradient></defs>
 <rect width="1280" height="460" fill="url(#sky)"/><rect width="1280" height="720" fill="url(#sun)"/>`;
 // raios
 for(let i=0;i<16;i++){const a=Math.PI+i*Math.PI/15.5,b=a+.055,R=1100;s+=`<path d="M640 400L${640+Math.cos(a)*R} ${400+Math.sin(a)*R}L${640+Math.cos(b)*R} ${400+Math.sin(b)*R}Z" fill="#fff0cf" opacity="${i%2?.17:.09}"/>`}
 // prédios ao fundo, sem contraste forte
 s+=`<rect x="262" y="250" width="150" height="205" fill="#d5a06c" opacity=".7"/><rect x="418" y="212" width="46" height="243" fill="#e3b482" opacity=".6"/><rect x="480" y="280" width="80" height="175" fill="#dfae7a" opacity=".55"/>`;
 for(let i=0;i<6;i++)for(let j=0;j<9;j++)s+=`<rect x="${280+i*20}" y="${268+j*20}" width="8" height="9" fill="#a8743f" opacity=".42"/>`;
 // chão
 s+=`<path d="M0 450H1280V720H0Z" fill="url(#fl)"/>`;
 for(let i=-14;i<=14;i++)s+=`<path d="M640 448L${640+i*150} 720" stroke="#6d4526" stroke-width="1.5" opacity=".28"/>`;
 for(let i=1;i<10;i++){const y=448+Math.pow(i/9,2)*272;s+=`<path d="M0 ${y}H1280" stroke="#6d4526" stroke-width="1.4" opacity=".24"/>`}
 // árvores
 const tree=(x,cy,r,base,seed)=>{const q=rng(seed);let c='';c+=`<path d="M${x-r*1.5-40} ${base+Math.min(70,r)}L${x-4} ${base}L${x+4} ${base}L${x-r*1.5+6} ${base+Math.min(70,r)}Z" fill="#5a3a1f" opacity=".28"/>`;c+=`<rect x="${x-Math.max(2,r*.055)}" y="${cy}" width="${Math.max(4,r*.11)}" height="${base-cy}" fill="#2b241a"/>`;for(let i=0;i<9;i++){const a=i/9*6.283,d=r*(.52+q()*.2);c+=`<circle cx="${x+Math.cos(a)*d}" cy="${cy+Math.sin(a)*d*.78}" r="${r*(.36+q()*.14)}" fill="#37321f"/>`}c+=`<circle cx="${x}" cy="${cy}" r="${r*.7}" fill="#37321f"/>`;return c};
 s+=tree(82,152,108,520,1)+tree(268,224,88,490,2)+tree(424,286,58,470,3)+tree(502,324,28,454,4);
 s+=`<rect x="556" y="350" width="3" height="100" fill="#2b241a"/><rect x="572" y="360" width="3" height="90" fill="#2b241a"/>`;
 // fachada de vidro em perspectiva
 const top=x=>197-.486*(x-765),bot=x=>485+.316*(x-765);
 s+=`<path d="M765 ${top(765)}L1400 ${top(1400)}V${bot(1400)}L765 ${bot(765)}Z" fill="url(#pane)"/>`;
 const r2=rng(11);const xs=[];for(let i=0;i<11;i++)xs.push(640+125*(1+i*.34));
 for(let i=0;i<xs.length-1;i++){if(r2()<.72){const a=xs[i]+(xs[i+1]-xs[i])*.1,b=a+(xs[i+1]-xs[i])*.34,y0=top(a),y1=bot(a);s+=`<path d="M${a+24} ${y0}L${b+24} ${top(b)}L${b-8} ${bot(b)}L${a-8} ${y1}Z" fill="#f4dcb8" opacity="${.22+r2()*.2}"/>`}}
 xs.forEach((x,i)=>{s+=`<path d="M${x} ${top(x)}V${bot(x)}" stroke="#2b1a0e" stroke-width="${3+i*.75}"/>`});
 for(let j=0;j<=8;j++){const f=j/8;s+=`<path d="M765 ${lerp(top(765),bot(765),f)}L1400 ${lerp(top(1400),bot(1400),f)}" stroke="#2b1a0e" stroke-width="${2+Math.abs(f-.5)*2.5}"/>`}
 s+=`<path d="M765 ${bot(765)}L1400 ${bot(1400)}V${bot(1400)+40}L765 ${bot(765)+8}Z" fill="#3c2616"/>`;
 return s+'</svg>'})();
// caminhante de frente: o personagem do 01-editor, com moletom, capuz caído, cordões, cabelo com gel e alças da mochila
const walkPh=ct=>ct*Math.PI*2; // um ciclo por segundo: 120 passos por minuto
const walkY=ct=>Math.abs(Math.sin(walkPh(ct)))*4;
function walker(ct){const f=walkPh(ct),sn=Math.sin(f),a=Math.max(0,sn),b=Math.max(0,-sn),y=walkY(ct),C='#1b120d',F='#33221a',P='#2a1c13',RL='#c88356',RR='#b9c2a0';
 const leg=(hx,fx,e)=>`<path d="M${hx} 470L${hx+(fx-hx)*.4} ${568-e*5}L${fx} ${668-e*46}" fill="none" stroke="${C}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/><path d="M${fx-17} ${668-e*46}h34v12a17 13 0 0 1-34 0z" fill="${C}"/>`;
 // braços soltos, balançando ao contrário das pernas
 const arm=(sx,ex,hx,hy)=>`<path d="M${sx} 342L${ex} 412L${hx} ${hy}" fill="none" stroke="${C}" stroke-width="33" stroke-linecap="round" stroke-linejoin="round"/>`;
 const strap=d=>`<path d="${d}" fill="none" stroke="${P}" stroke-width="15" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${RL}" stroke-width="1.6" opacity=".4"/>`;
 return `<svg viewBox="0 0 1280 720" style="position:absolute;inset:0;width:1280px;height:720px;filter:drop-shadow(0 0 2.5px #ffe6bd) drop-shadow(0 0 16px rgba(255,205,140,.8))" xmlns="http://www.w3.org/2000/svg">
 <g transform="translate(0 ${-y})">${leg(616,612,a)}${leg(664,668,b)}
 ${arm(564,546,548+sn*6,484-sn*10)}${arm(716,734,732+sn*6,484+sn*10)}
 <path d="M640 304C602 304 566 312 548 336C560 376 574 430 576 490C618 504 662 504 704 490C706 430 720 376 732 336C714 312 678 304 640 304Z" fill="${C}"/>
 <path d="M578 478C620 492 660 492 702 478" fill="none" stroke="${RL}" stroke-width="2" opacity=".5"/>
 ${strap('M592 322C586 360 588 408 594 448')}${strap('M688 322C694 360 692 408 686 448')}
 <g transform="translate(371.5 116) scale(.3)">
  <path d="M690 770C690 680 770 640 830 668H960C1020 640 1100 680 1100 770C1020 830 770 830 690 770Z" fill="${C}"/><path d="M690 770C690 680 770 640 830 668" fill="none" stroke="${RL}" stroke-width="5"/><path d="M960 668C1020 640 1100 680 1100 770" fill="none" stroke="${RR}" stroke-width="4"/>
  <path d="M822 620H968V740C940 790 850 790 822 740Z" fill="${F}"/>
  <ellipse cx="768" cy="512" rx="15" ry="36" fill="${F}"/><ellipse cx="1022" cy="512" rx="15" ry="36" fill="${F}"/>
  <path d="M895 340C800 340 772 420 776 510C784 630 840 712 895 712S1006 630 1014 510C1018 420 990 340 895 340Z" fill="${F}"/><path d="M776 510C784 630 840 712 895 712" fill="none" stroke="${RL}" stroke-width="4" opacity=".85"/><path d="M1014 510C1006 630 950 712 895 712" fill="none" stroke="${RR}" stroke-width="3" opacity=".7"/>
  <path d="M772 490C756 440 752 390 764 340C768 308 786 292 806 284Q818 274 828 258Q842 270 854 274Q870 250 892 240Q906 256 920 260Q942 240 970 242Q976 260 980 274Q1004 280 1022 302C1038 332 1036 410 1018 490C1010 440 992 410 950 400C890 388 826 396 800 430C786 448 778 468 772 490Z" fill="${C}"/><path d="M772 490C756 440 752 390 764 340C768 308 786 292 806 284Q818 274 828 258Q842 270 854 274Q870 250 892 240" fill="none" stroke="${RL}" stroke-width="4" stroke-linejoin="round"/><path d="M892 240Q906 256 920 260Q942 240 970 242Q976 260 980 274Q1004 280 1022 302C1038 332 1036 410 1018 490" fill="none" stroke="${RR}" stroke-width="3" stroke-linejoin="round"/><path d="M814 392Q830 346 866 322M868 384Q888 342 930 316M932 388Q952 352 988 336" fill="none" stroke="${RR}" stroke-width="3" stroke-linecap="round" opacity=".32"/>
  <path d="M720 778C800 830 990 830 1070 778L1000 720C960 800 830 800 790 720Z" fill="${C}"/><path d="M790 720C830 800 960 800 1000 720" fill="none" stroke="${RR}" stroke-width="3" opacity=".5"/>
  <path d="M856 792C852 832 858 872 852 930M934 792C938 832 932 872 938 930" fill="none" stroke="${RR}" stroke-width="5" stroke-linecap="round" opacity=".6"/>
 </g></g></svg>`}
const shadowR=`<svg viewBox="0 0 1280 720" style="position:absolute;inset:0;width:1280px;height:720px" xmlns="http://www.w3.org/2000/svg"><path d="M610 678H672L730 720H575Z" fill="#3a2413" opacity=".6"/></svg>`;

// a mesma curva move o título, os pontos e o gráfico
function bez1(a,b,u){const q=1-u;return 3*q*q*u*a+3*q*u*u*b+u*u*u}
function easeOf(c,x){if(x<=0)return 0;if(x>=1)return 1;let lo=0,hi=1;for(let i=0;i<30;i++){const u=(lo+hi)/2;if(bez1(c[0],c[2],u)<x)lo=u;else hi=u}return bez1(c[1],c[3],(lo+hi)/2)}
const LIN=[1/3,1/3,2/3,2/3],EASE=[.8,0,.2,1];
const TX0=-280,TX1=64,TDUR=19/24; // o título entra em 19 quadros
const TRK=[689,368]; // ponto rastreado, na alça da mochila
function compDyn(S){const C=S.comp||{},ct=C.ct||0;let h=shadowR;
 const u=C.curve||LIN,tt=C.tt==null?ct:C.tt,e=easeOf(u,tt/TDUR);
 h+=walker(ct);
 // título
 if(C.typed>0){const tx=C.keyed?lerp(TX0,TX1,e):TX1,sc=C.keyed?lerp(.94,1,e):1,o=C.keyed?clamp(lerp(.6,1,e)):1,w=['Feito com','Claude'],n=C.typed;
  const l1=w[0].slice(0,n),l2=n>9?w[1].slice(0,n-9):'';
  h+=`<div style="position:absolute;left:${tx}px;top:52px;opacity:${o};transform:scale(${sc});transform-origin:0 50%;font:800 96px/1 Switzer,sans-serif;letter-spacing:-.03em;color:#fff;white-space:pre;text-shadow:0 4px 18px rgba(50,25,8,.4)">${l1}${n>9?`<br><span style="font:italic 400 118px/.86 'Instrument Serif',serif;letter-spacing:-.01em;color:${CLAY};-webkit-text-stroke:1.5px ${CLAY}">${l2}</span>`:''}${C.caret?`<span style="display:inline-block;width:5px;height:82px;margin-left:6px;background:#fff;vertical-align:-6px"></span>`:''}</div>`;
  if(C.tsel){const X=tx-10,W=470,H=204,Y=48;h+=`<div style="position:absolute;left:${X}px;top:${Y}px;width:${W}px;height:${H}px;border:2px solid ${CLAY}"></div>`+[[0,0],[1,0],[0,1],[1,1]].map(([a,b])=>`<i style="position:absolute;left:${X+a*W-6}px;top:${Y+b*H-6}px;width:12px;height:12px;background:#fff;border:2px solid ${CLAY}"></i>`).join('')}
 }
 // caminho do título
 if(C.dots){const n=20;for(let i=0;i<n;i++){const x=lerp(TX0+215,TX1+215,easeOf(u,i/(n-1)));h+=`<i style="position:absolute;left:${x-3}px;top:113px;width:6px;height:6px;border-radius:50%;background:#fff"></i>`}
  h+=`<i style="position:absolute;left:${TX0+215-7}px;top:109px;width:14px;height:14px;background:${CLAY};border:2px solid #fff"></i><i style="position:absolute;left:${TX1+215-7}px;top:109px;width:14px;height:14px;background:${CLAY};border:2px solid #fff"></i>`}
 // rastreador e legenda
 const by=walkY(ct),tx=TRK[0],ty=TRK[1]-by;
 if(C.spark){h+=`<div style="position:absolute;left:${tx-34}px;top:${ty-66}px;width:92px;height:92px;opacity:${C.spark}">${spark(CLAY,7)}</div>`}
 if(C.track){
  const n=C.trail||0;for(let i=0;i<n;i++){const q=ct-i*(2/24),yy=TRK[1]-walkY(q);h+=`<i style="position:absolute;left:${tx-2}px;top:${yy+(i*2.2)-2}px;width:4px;height:4px;border-radius:50%;background:${CLAY};opacity:${1-i/n}"></i>`}
  h+=`<div style="position:absolute;left:${tx-22}px;top:${ty-22}px;width:44px;height:44px;border:3px solid ${CLAY}"></div><div style="position:absolute;left:${tx-48}px;top:${ty-48}px;width:96px;height:112px;border:1.5px dashed #fff"></div><div style="position:absolute;left:${tx-10}px;top:${ty-1}px;width:20px;height:2px;background:#fff"></div><div style="position:absolute;left:${tx-1}px;top:${ty-10}px;width:2px;height:20px;background:#fff"></div>
  <div style="position:absolute;left:${tx-38}px;top:${ty+74}px;padding:5px 12px;background:rgba(20,14,10,.92);border-radius:4px;font:700 15px Switzer,sans-serif;color:#fff;white-space:nowrap">Ponto 1</div>`}
 if(C.call>0){const cx=tx+128,cy=ty-68,e2=C.call,bx=lerp(tx,cx,e2),by2=lerp(ty,cy,e2);
  h+=`<svg viewBox="0 0 1280 720" style="position:absolute;inset:0;width:1280px;height:720px"><path d="M${tx} ${ty}L${lerp(tx,tx+62,e2)} ${lerp(ty,cy,e2)}H${bx}" stroke="#fff" stroke-width="2.5" fill="none"/><circle cx="${tx}" cy="${ty}" r="7" fill="${CLAY}" stroke="#fff" stroke-width="2.5"/></svg>
  <div style="position:absolute;left:${cx}px;top:${cy-32}px;opacity:${clamp(e2*2)};transform:scale(${.85+.15*e2});transform-origin:0 50%;display:flex;gap:12px;align-items:center;padding:11px 18px;background:rgba(24,17,12,.95);border-radius:9px;color:#fff"><span style="width:28px;height:28px;display:block">${ic(I.walk,CLAY,2)}</span><b style="font:800 34px Switzer,sans-serif;letter-spacing:-.02em;font-variant-numeric:tabular-nums">5,2</b><span style="font:500 19px Switzer,sans-serif;color:#b9b0a6">km/h</span></div>`}
 // nome
 if(C.low>0){const e3=C.low;h+=`<div style="position:absolute;left:${lerp(-40,62,e3)}px;top:594px;height:82px;width:372px;opacity:${clamp(e3*2)};background:rgba(24,17,12,.95);border-left:9px solid ${CLAY};clip-path:inset(0 ${(1-e3)*100}% 0 0);display:flex;align-items:center;padding-left:28px;font:800 50px Switzer,sans-serif;letter-spacing:-.025em;color:#fff;white-space:nowrap">Seu Nome</div>`}
 return h}

// ---------- montagem do app ----------
const $=id=>document.getElementById(id);
const memo=new Map();function put(el,s){if(memo.get(el)!==s){memo.set(el,s);el.innerHTML=s}}
const scoped=(h,k)=>h.replace(/id="(\w+)"/g,`id="$1${k}"`).replace(/url\(#(\w+)\)/g,`url(#$1${k})`);
const THUMB=uri(SCENE),THDONE=THUMB;
const NIGHT=uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect width="160" height="90" fill="#154a58"/><circle cx="60" cy="46" r="42" fill="#3b7f8a" opacity=".6"/><circle cx="16" cy="16" r="9" fill="none" stroke="#c9b28a" stroke-width="1.5"/><path d="M38 90c2-22 14-30 24-30s22 8 24 30z" fill="#08242b"/><circle cx="62" cy="46" r="13" fill="#08242b"/><rect x="104" y="14" width="44" height="44" fill="#5aa6ad"/><path d="M104 46l14-12 12 8 20-14" stroke="#08242b" fill="none" stroke-width="2"/></svg>`);
const tc=t=>{const f=Math.floor(t*24+.001);return `0:00:${String(Math.floor(f/24)).padStart(2,'0')}:${String(f%24).padStart(2,'0')}`};
const TLX=603,PX=198; // zero da régua em x do app; pixels por segundo
const RL=x=>TLX-66+x*PX; // dentro do painel
const CH={run:'#4E7380',grade:'#6D6A55',title:'#7A6F9E',low:'#5F7A55',call:'#86796A'};
function rowsHTML(S){const R=S.rows||[];let y=78,h='';
 R.forEach((r,i)=>{const n=i+1;
  h+=`<div class="row ${r.sel?'sel':''}" style="top:${y}px;opacity:${r.a==null?1:r.a}"><span class="ey">${ic(I.eye,'#8a8a8a')}</span><span class="chip" style="background:${CH[r.c]}"></span><span class="n">${n}</span><span class="tw">${r.open?'▼':'▶'}</span><span class="nm">${r.t?'<span style="color:#CFCFCF;margin-right:6px">T</span>':''}${r.n}</span><span class="md">Normal</span><span class="pa">Nenhum</span>
  <span class="barc" style="left:${RL(r.bar?r.bar[0]:0)}px;width:${(r.bar?r.bar[1]-r.bar[0]:4.02)*PX}px;background:${CH[r.c]}"></span>${(r.keys||[]).map(k=>`<i class="${r.hour?'kfh':'kf'}" style="left:${RL(k)}px"></i>`).join('')}</div>`;y+=28;
  (r.subs||[]).forEach(q=>{h+=`<div class="row sub" style="top:${y}px;opacity:${q.a==null?1:q.a}"><span class="sw">${ic(I.clock,q.on?CLAY:'#8a8a8a')}</span><span class="nm">${q.n}</span><span class="val">${q.v||''}</span>${(q.keys||[]).map(k=>`<i class="kf" style="left:${RL(k[0])}px;transform:rotate(45deg) scale(${k[1]==null?1:k[1]})"></i>`).join('')}${q.track?Array.from({length:q.track},(_, j)=>`<i class="ad ${j>q.track-14?'c':''}" style="left:${RL(j*(2/24))}px"></i>`).join(''):''}</div>`;y+=28})});
 return h}
function tlHTML(S){const ct=S.ph||0;
 let rul='';for(let i=0;i<=4;i++)rul+=`<b style="left:${i*PX+3}px">0${i}s</b><i style="left:${i*PX}px"></i>`;
 return `<div class="tlh">Hora Dourada</div><div class="bigtc">${tc(ct)}</div><div class="tset">${String(Math.floor(ct*24)).padStart(5,'0')} (24,00 qps)</div><span class="colh" style="left:58px">#</span><span class="colh" style="left:112px">Nome da camada</span><span class="colh" style="left:372px">Modo</span><span class="colh" style="left:440px">Pai</span>
 <div class="tlic">${[I.square,I.circle,I.tri,I.curve].map((d,i)=>`<span style="${i===3&&S.graph?'background:#3a2a22;border-radius:4px':''}">${ic(d,i===3&&S.graph?CLAY:'#9A9A9A')}</span>`).join('')}</div>
 <div class="ruler" style="${S.graph?'display:none':''}">${rul}</div><div class="track" style="${S.graph?'display:none':''}"><u style="width:${(S.cache||0)*100}%"></u></div>
 ${S.graph?'':rowsHTML(S)}${S.graph?'':`<div class="ph" style="left:${RL(ct)}px"></div>`}`}
function graphHTML(G){const L=[610,960],R=[1119,760],dx=R[0]-L[0],dy=R[1]-L[1];const c=G.c;
 const P1=[L[0]+c[0]*dx,L[1]+c[1]*dy],P2=[L[0]+c[2]*dx,L[1]+c[3]*dy];
 let g='';const fx=dx/19;
 [0,6,12,18,24].forEach((f,i)=>{const x=L[0]+f*fx;g+=`<path d="M${x} 716V1040" stroke="#fff" opacity=".05"/><text x="${x+2}" y="704" fill="#9A9A9A" font-size="7.5" font-family="Switzer">${['0:00f','0:06f','0:12f','0:18f','1:00f'][i]}</text><path d="M${x} 708V716" stroke="#555"/>`});
 [[430,760],[350,827],[270,893],[190,960-0],[110,960+66]].forEach(([v,y])=>{g+=`<path d="M603 ${y}H1404" stroke="#fff" opacity=".05"/><text x="1302" y="${y-3}" fill="#6a6a6a" font-size="7" font-family="Switzer">${v}</text>`});
 g+=`<rect x="603" y="710" width="720" height="4" fill="#333"/>`;
 g+=`<path d="M${L[0]} ${L[1]}L${R[0]} ${R[1]}" stroke="#8a8a8a" stroke-dasharray="5 4" stroke-width="1.1"/>`;
 g+=`<path d="M${L[0]} ${L[1]}C${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]} ${R[0]} ${R[1]}" stroke="#F2F2F2" stroke-width="2" fill="none"/>`;
 g+=`<path d="M${L[0]} ${L[1]}L${P1[0]} ${P1[1]}M${R[0]} ${R[1]}L${P2[0]} ${P2[1]}" stroke="${CLAY}" stroke-width="1.1"/><circle cx="${P1[0]}" cy="${P1[1]}" r="4.5" fill="${CLAY}"/><circle cx="${P2[0]}" cy="${P2[1]}" r="4.5" fill="${CLAY}"/>`;
 g+=`<path d="M${R[0]} 700V1040" stroke="#EDEDED" stroke-width="1.2"/><path d="M${R[0]-4} 698h8v6l-4 5-4-5z" fill="#EDEDED"/><path d="M${R[0]} ${R[1]}H1404" stroke="#CFCFCF" stroke-width=".8"/>`;
 [L,R].forEach(k=>g+=`<rect x="${k[0]-4}" y="${k[1]-4}" width="8" height="8" fill="#fff" stroke="${CLAY}" stroke-width="1.4"/>`);
 if(G.tag){const a=G.tagAt;g+=`<g transform="translate(${a[0]} ${a[1]})"><rect width="72" height="17" rx="4" fill="#1F1F1F" stroke="${CLAY}"/><text x="36" y="12" fill="#fff" font-size="9" font-weight="700" text-anchor="middle" font-family="Switzer">${G.tag}</text></g>`}
 return `<clipPath id="gc"><rect x="603" y="672" width="801" height="368"/></clipPath><rect x="603" y="672" width="801" height="368" fill="#1D1D1D"/><g clip-path="url(#gc)">${g}</g>`}
function aiHTML(S){const P=S.plan||{},rev=P.rev||0,done=P.done||0;
 return `<div class="who" style="opacity:${P.who==null?1:P.who}">${spark()}<b>Claude</b></div>${P.ask?`<div class="ask" style="opacity:${clamp(P.ask*2)};transform:translateY(${(1-P.ask)*12}px) scale(${.9+.1*P.ask})">Anima esse plano</div>`:''}
 ${STEPS.map(([n,k],i)=>{const e=clamp(rev-i);if(e<=0)return '';const ok=i<done,run=i===done&&P.on;return `<div class="st ${ok?'ok':run?'run':''}" style="opacity:${e};transform:translateY(${(1-e)*14}px)"><span class="si">${ic(I[k],ok||run?'#EDEDED':'#7A7A7A')}</span>${n}<b style="${run?`transform:rotate(${P.spin||0}deg)`:''}">${ok?ic(I.check,'#fff',3):''}</b></div>`}).join('')}`}
function binHTML(S){
 if(S.left==='fx'){const rows=[['Predefinições de animação',0,0],['Títulos',30,44],['Terço inferior',60,88,1],['Transições',30,132],['Desfoque e nitidez',0,176],['Correção de cor',0,220],['Distorcer',0,264],['Gerar',0,308],['Chave',0,352]];
  return `<div class="ptabs"><span>Projeto</span><span class="on">Efeitos</span></div><div class="srch" style="top:44px">${ic(I.search,'#9A9A9A')}Terço</div>${rows.map(([n,d,y,sel])=>sel?`<div class="fxl sel" style="top:${86+y}px">${ic(I.low,'#CFCFCF')}${n}</div>`:`<div class="fxl" style="top:${86+y}px;left:${18+d}px">${ic(I.folder,'#7A7A7A')}${n}</div>`).join('')}`}
 const t=[['caminhada.mp4',THUMB,14,184],['caminhada-1198.mp4',NIGHT,190,184],['caminhada-600.mp4',NIGHT,14,330],['Hora Dourada',THDONE,190,330]];
 return `<div class="ptabs"><span class="on">Projeto</span><span>Efeitos</span></div><div class="srcTh" style="background-image:${THUMB}"></div><div class="srcT">caminhada.mp4<small>1920 x 1080, 24 qps</small><small>0:00:06:01</small></div><div class="srch"> ${ic(I.search,'#9A9A9A')}</div>${t.map(([n,b,x,y])=>`<div class="th" style="left:${x}px;top:${y}px;background-image:${b}"></div><div class="thL" style="left:${x}px;top:${y+100}px">${n}</div>`).join('')}`}
function arrowSVG(c){return `<svg viewBox="0 0 40 48"><path d="M3 3 L3 37 L13 28 L20 44 L27 41 L20 25 L34 25 Z" fill="${c}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>`}
const FOC={ai:[1419,81,438,959],tl:[66,648,1344,392],view:[450,126,960,519]};

function paint(S){
 const[s,cx,cy]=S.cam,[rx,ry]=S.tilt||[0,0];
 $('cam').style.transform=rx||ry?`translate(960px,540px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s}) translate(${-cx}px,${-cy}px)`:`translate(${960-cx*s}px,${540-cy*s}px) scale(${s})`;
 put($('wtabs'),['Animar','Rastrear','Renderizar'].map((n,i)=>`<span class="${i===(S.tab||0)?'on':''}">${n}</span>`).join(''));
 put($('tools'),[I.cursor,I.hand,I.zoom,I.orbit,I.cam,I.anchor,I.rect,I.pen,I.T,I.line,I.arrow,I.erase,I.pin].map((d,i)=>`<span class="${i===8&&S.tool==='T'?'on':''}">${ic(d,i===8&&S.tool==='T'?'#fff':'#CFCFCF')}</span>`).join('')+`<em><i></i>Encaixe</em>`);
 put($('binP'),binHTML(S));
 put($('vtc'),tc(S.ph||0));
 put($('lane'),tlHTML(S));
 const G=$('graph');if(S.graph){G.style.display='block';put(G,graphHTML(S.graph))}else G.style.display='none';
 put($('aiBody'),aiHTML(S));
 // o plano no visor e na tela cheia
 const dyn=compDyn(S);
 if(S.full){$('full').style.display='block';$('fullC').style.transform=`scale(${1.5*S.full})`;$('fullC').style.left=`${960-960*S.full}px`;$('fullC').style.top=`${540-540*S.full}px`;put($('fullD'),dyn)}
 else{$('full').style.display='none';put($('viewD'),dyn)}
 const F=$('focus');if(S.focus&&FOC[S.focus]){const f=S.focus==='mix'?S.focusR:FOC[S.focus];F.style.display='block';F.style.left=f[0]+'px';F.style.top=f[1]+'px';F.style.width=f[2]+'px';F.style.height=f[3]+'px'}else if(S.focusR){const f=S.focusR;F.style.display='block';F.style.left=f[0]+'px';F.style.top=f[1]+'px';F.style.width=f[2]+'px';F.style.height=f[3]+'px'}else F.style.display='none';
 // painéis: entrada e desmonte
 const P=S.pn||{};for(const id of['binP','viewP','aiP','tools','tlP']){const el=$(id),e=P[id]==null?1:P[id],pl=(S.peel||{})[id];
  if(pl){el.style.transform=`perspective(1700px) translate3d(${pl.x}px,${pl.y}px,${pl.z}px) rotateY(${pl.ry}deg) rotateX(${pl.rx}deg)`;el.style.transformOrigin=pl.o;el.style.filter=`blur(${pl.b}px)`;el.style.opacity=pl.a}
  else{el.style.transform=`translateY(${(1-e)*26}px) scale(${.975+.025*e})`;el.style.transformOrigin='50% 50%';el.style.filter='';el.style.opacity=e}}
 $('winBg').style.opacity=S.winA==null?1:S.winA;
 $('barWrap').style.opacity=S.barA==null?1:S.barA;
 $('dim').style.opacity=S.dim||0;
 $('view').style.filter=S.viewB<1?`brightness(${S.viewB})`:'';
 const Gh=$('ghost');if(S.ghost){Gh.style.display='flex';Gh.style.left=S.ghost[0]+'px';Gh.style.top=S.ghost[1]+'px'}else Gh.style.display='none';
 // cursor
 const k=clamp(.58*Math.sqrt(s),.5,1.05),c=$('cAI');
 if(S.ai&&!S.full&&(S.aiA==null||S.aiA>0)){c.style.display='block';c.style.opacity=S.aiA==null?1:S.aiA;c.style.transform=`translate(${960+(S.ai[0]-cx)*s}px,${540+(S.ai[1]-cy)*s}px) scale(${k})`}else c.style.display='none';
 const R=$('click');if(S.click&&!S.full){R.style.display='block';R.style.transform=`translate(${960+(S.click[0]-cx)*s}px,${540+(S.click[1]-cy)*s}px) scale(${k*(S.clickK||1)})`;R.style.opacity=S.clickA==null?.85:S.clickA}else R.style.display='none';
 const Fl=$('flash');Fl.style.display=S.flash>0?'block':'none';if(S.flash>0)Fl.style.opacity=S.flash;
}
