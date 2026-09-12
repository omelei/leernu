
const INK='#1A201B',PAPER='#FBFAF6',ACCENT='#327F48';
const R=n=>Math.round(n*100)/100;
function cr(pts){const p=pts,n=p.length,g=i=>p[Math.max(0,Math.min(n-1,i))];
  let d='M'+R(p[0][0])+','+R(p[0][1]);
  for(let i=0;i<n-1;i++){const p0=g(i-1),p1=g(i),p2=g(i+1),p3=g(i+2);
    d+=' C'+R(p1[0]+(p2[0]-p0[0])/6)+','+R(p1[1]+(p2[1]-p0[1])/6)+' '+R(p2[0]-(p3[0]-p1[0])/6)+','+R(p2[1]-(p3[1]-p1[1])/6)+' '+R(p2[0])+','+R(p2[1]);}
  return d;}
const NEXP=2.3,M=2/NEXP,P2=Math.PI;
const sp=(cx,cy,a,b,t)=>{const c=Math.cos(t),s=Math.sin(t);return[cx+Math.sign(c)*a*Math.abs(c)**M,cy+Math.sign(s)*b*Math.abs(s)**M];};
const seArc=(cx,cy,a,b,t0,t1,st)=>{const o=[];for(let i=0;i<=st;i++)o.push(sp(cx,cy,a,b,t0+(t1-t0)*i/st));return o;};
const tAtY=(b,dy)=>Math.asin(Math.sign(dy)*Math.abs(dy/b)**(NEXP/2));
const xAtY=(a,b,dy)=>a*(1-Math.abs(dy/b)**NEXP)**(1/NEXP);
const tAtX=(a,dx)=>Math.acos(Math.abs(dx/a)**(1/M));
const tail=s=>s.replace(/^M[^C]*C/,'C');
function ruit(cx,cy,h,d){const T=[[cx,cy-h],[cx+h,cy],[cx,cy+h],[cx-h,cy]];
  const u=(p,q)=>{const dx=q[0]-p[0],dy=q[1]-p[1],l=Math.hypot(dx,dy);return[dx/l,dy/l];};let s='';
  for(let i=0;i<4;i++){const t=T[i],up=u(t,T[(i+3)%4]),un=u(t,T[(i+1)%4]);
    const A2=[t[0]+up[0]*d,t[1]+up[1]*d],Bp=[t[0]+un[0]*d,t[1]+un[1]*d];
    s+=(i?'L'+R(A2[0])+','+R(A2[1]):'M'+R(A2[0])+','+R(A2[1]))+' Q'+R(t[0])+','+R(t[1])+' '+R(Bp[0])+','+R(Bp[1]);}
  return s+' Z';}
let uid=0;
function vat(cx,cy,h,o){const hin=h-o.wall*Math.SQRT2,hf=hin-o.gap*Math.SQRT2,id='peil'+(++uid),w=h*2.4;
  return {defs:'<clipPath id="'+id+'"><rect x="'+R(cx-w/2)+'" y="'+R(cy)+'" width="'+R(w)+'" height="'+R(w)+'"/></clipPath>',
    body:'<g fill="'+o.fill+'"><path fill-rule="evenodd" d="'+ruit(cx,cy,h,o.tip)+' '+ruit(cx,cy,hin,o.tip*hin/h)+'"/>'+
      '<path d="'+ruit(cx,cy,hf,o.tip*hf/h)+'" clip-path="url(#'+id+')"/></g>'};}
const MARK={wall:6,gap:3,tip:8}, solid=ruit(48,48,40,8);
const BL=140,XT=40,ST=23,HB=20,CY=90,A=48,Bb=52,ai=A-ST,bi=Bb-HB,IA=46-ST;
const gE=()=>{const bb=CY+5,iy=CY+24;
  const out=seArc(A,CY,A,Bb,tAtY(Bb,5),tAtY(Bb,36)-2*P2,46);
  const ins=seArc(A,CY,ai,bi,tAtY(bi,24),P2-tAtY(bi,5),18);
  const eye=seArc(A,CY,ai,bi,-P2+tAtY(bi,11),-tAtY(bi,11),18);
  return{w:2*A,d:cr(out)+' L'+R(A+xAtY(ai,bi,24))+','+iy+' '+tail(cr(ins))+' L'+R(A+xAtY(A,Bb,5))+','+bb+' Z '+cr(eye)+' Z'};};
const g={l:{w:ST,d:'M0,0 H'+ST+' V'+BL+' H0 Z'},e:gE(),
 r:(()=>{const cx=46,xo=71,xi=63,o=seArc(cx,CY,46,Bb,P2,2*P2-tAtX(46,xo-cx),24),i2=seArc(cx,CY,IA,bi,2*P2-tAtX(IA,xi-cx),P2,16);
   return{w:xo,d:'M0,'+BL+' L0,'+CY+' '+tail(cr(o))+' L'+R(i2[0][0])+','+R(i2[0][1])+' '+tail(cr(i2))+' L'+ST+','+BL+' Z'};})(),
 n:{w:92,d:'M0,'+BL+' L0,'+CY+' '+tail(cr(seArc(46,CY,46,Bb,P2,2*P2,30)))+' L92,'+BL+' L'+(92-ST)+','+BL+' L'+(92-ST)+','+CY+' '+tail(cr(seArc(46,CY,IA,bi,2*P2,P2,22)))+' L'+ST+','+BL+' Z'},
 u:{w:92,d:'M0,'+XT+' L0,'+CY+' '+tail(cr(seArc(46,CY,46,Bb,P2,0,30)))+' L92,'+XT+' L'+(92-ST)+','+XT+' L'+(92-ST)+','+CY+' '+tail(cr(seArc(46,CY,IA,bi,0,P2,22)))+' L'+ST+','+XT+' Z'}};
const MH=40, INLINE={wall:11,gap:4,tip:8};
function woord(f,opt){const inlineMark=!opt||opt.inlineMark!==false;
  let x=0,letters=[],defs=[],extra=[];
  for(const kv of [['l',17],['e',15],['e',15],['r',14]]){letters.push('<path transform="translate('+R(x)+',0)" d="'+g[kv[0]].d+'"/>');x+=g[kv[0]].w+kv[1];}
  if(inlineMark){const v=vat(x+MH,BL-MH,MH,Object.assign({},INLINE,{fill:f}));defs.push(v.defs);extra.push(v.body);x+=2*MH+14;}
  else {letters.push('<path d="'+ruit(x+18,BL-18,18,7)+'"/>');x+=36+16;}
  for(const kv of [['n',17],['u',0]]){letters.push('<path transform="translate('+R(x)+',0)" d="'+g[kv[0]].d+'"/>');x+=g[kv[0]].w+kv[1];}
  return {w:Math.round(x),h:BL,defs:defs,body:'<g fill="'+f+'">\n  '+letters.join('\n  ')+'\n</g>\n'+extra.join('\n')};}
const head=(w,h,vb,l)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+vb+'" width="'+w+'" height="'+h+'" role="img" aria-label="'+l+'">\n<title>'+l+'</title>';
const wrapDefs=d=>d.length?'<defs>'+d.join('')+'</defs>\n':'';
const fWoord=f=>{const W=woord(f);return head(W.w,W.h,'0 0 '+W.w+' '+W.h,'leer.nu')+'\n'+wrapDefs(W.defs)+W.body+'\n</svg>\n';};
const fStack=f=>{const m=172,gp=44,s=m/96,H2=m+gp+BL,W=woord(f,{inlineMark:false}),v=vat(48,48,40,Object.assign({},MARK,{fill:f}));
  return head(W.w,H2,'0 0 '+W.w+' '+H2,'leer.nu')+'\n<defs>'+v.defs+'</defs>\n<g transform="translate('+R((W.w-m)/2)+',0) scale('+R(s)+')">'+v.body+'</g>\n<g transform="translate(0,'+(m+gp)+')">'+W.body+'</g>\n</svg>\n';};
const fMerk=f=>{const v=vat(48,48,40,Object.assign({},MARK,{fill:f}));return head(96,96,'0 0 96 96','leer.nu merkteken')+'\n<defs>'+v.defs+'</defs>\n'+v.body+'\n</svg>\n';};
const fKlein=f=>head(96,96,'0 0 96 96','leer.nu merkteken')+'\n<path fill="'+f+'" d="'+solid+'"/>\n</svg>\n';
const squircle=(s,r)=>'M0,'+r+' C0,'+R(r*.22)+' '+R(r*.22)+',0 '+r+',0 H'+(s-r)+' C'+R(s-r*.22)+',0 '+s+','+R(r*.22)+' '+s+','+r+' V'+(s-r)+' C'+s+','+R(s-r*.22)+' '+R(s-r*.22)+','+s+' '+(s-r)+','+s+' H'+r+' C'+R(r*.22)+','+s+' 0,'+R(s-r*.22)+' 0,'+(s-r)+' Z';
const fIcon=o=>{const size=o.size||1024,bg=o.bg||INK,fg=o.fg||PAPER,frac=o.frac||.54,rounded=o.rounded!==false;
  const m=size*frac,s=m/96,off=(size-m)/2,v=vat(48,48,40,Object.assign({},MARK,{fill:fg}));
  const b=rounded?'<path fill="'+bg+'" d="'+squircle(size,size*.2237)+'"/>':'<rect width="'+size+'" height="'+size+'" fill="'+bg+'"/>';
  return head(size,size,'0 0 '+size+' '+size,'leer.nu app-icoon')+'\n<defs>'+v.defs+'</defs>\n'+b+'\n<g transform="translate('+R(off)+','+R(off)+') scale('+R(s)+')">'+v.body+'</g>\n</svg>\n';};
const fFav=()=>head(96,96,'0 0 96 96','leer.nu')+'\n<style>path{fill:'+INK+'}@media (prefers-color-scheme:dark){path{fill:'+PAPER+'}}</style>\n<path d="'+solid+'"/>\n</svg>\n';
const fSocial=()=>{const W=1200,H2=630,k=.72,w=woord(INK),x=(W-w.w*k)/2,y=(H2-BL*k)/2;
  return head(W,H2,'0 0 '+W+' '+H2,'leer.nu')+'\n'+wrapDefs(w.defs)+'<rect width="'+W+'" height="'+H2+'" fill="'+PAPER+'"/>\n<g transform="translate('+R(x)+','+R(y)+') scale('+k+')">'+w.body+'</g>\n</svg>\n';};
FILES = {
 'logo/svg/merkteken-inkt.svg':fMerk(INK),'logo/svg/merkteken-papier.svg':fMerk(PAPER),
 'logo/svg/merkteken-accent.svg':fMerk(ACCENT),
 'logo/svg/merkteken-klein-inkt.svg':fKlein(INK),'logo/svg/merkteken-klein-papier.svg':fKlein(PAPER),
 'logo/svg/woordbeeld-inkt.svg':fWoord(INK),'logo/svg/woordbeeld-papier.svg':fWoord(PAPER),
 'logo/svg/lockup-inkt.svg':fWoord(INK),'logo/svg/lockup-papier.svg':fWoord(PAPER),
 'logo/svg/lockup-gestapeld-inkt.svg':fStack(INK),'logo/svg/lockup-gestapeld-papier.svg':fStack(PAPER),
 'logo/svg/favicon.svg':fFav(),'logo/svg/app-icoon.svg':fIcon({}),
 'logo/svg/app-icoon-maskable.svg':fIcon({frac:.42,rounded:false}),
 'logo/svg/app-icoon-licht.svg':fIcon({bg:PAPER,fg:INK}),'logo/svg/social-kaart.svg':fSocial()};
