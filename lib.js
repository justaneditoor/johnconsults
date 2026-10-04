const $=id=>document.getElementById(id);
const el=(t,c)=>{const e=document.createElement(t);if(c)e.className=c;return e};
const fmt=s=>{s=Math.max(0,s|0);return(s/60|0)+":"+String(s%60).padStart(2,"0")};
const natural=a=>[...a].sort((x,y)=>x.localeCompare(y,undefined,{numeric:true}));
const pretty=n=>{const s=n.replace(/^\d+[-_ ]*/,"").replace(/[-_]+/g," ").trim();return s?s.replace(/\b\w/g,c=>c.toUpperCase()):n};
const numOf=(n,i)=>String((n.match(/^(\d+)/)||[0,i+1])[1]).padStart(2,"0");
function repo(){const h=location.hostname;
 return h.endsWith(".github.io")?{o:h.split(".")[0],r:location.pathname.split("/")[1]}:{o:"justaneditoor",r:"video-scripts"}}
async function listDirs(dir){
 const {o,r}=repo(),key="dirs:"+dir;
 try{
  const res=await fetch("https://api.github.com/repos/"+o+"/"+r+"/contents/"+dir);
  if(res.status===404)return[];
  if(!res.ok)throw 0;
  const names=(await res.json()).filter(x=>x.type==="dir").map(x=>x.name);
  try{localStorage.setItem(key,JSON.stringify(names))}catch(e){}
  return natural(names);
 }catch(e){
  try{const c=JSON.parse(localStorage.getItem(key));if(c)return natural(c)}catch(_){}
  throw e;
 }
}
function parseInfo(t){
 const o={};
 t.replace(/^\uFEFF/,"").split(/\r?\n/).forEach(l=>{
  const i=l.indexOf(":");if(i<1||l.trim()[0]==="#")return;
  const k=l.slice(0,i).trim().toLowerCase(),v=l.slice(i+1).trim();if(v)o[k]=v});
 const link=o.video||o.link||o.drive||o.instagram||o.url||"",dl=o.download||"";
 return{title:o.title,video:/^https?:\/\//i.test(link)?link:"",download:/^https?:\/\//i.test(dl)?dl:"",wide:/wide|16/i.test(o.shape||"")};
}
async function readInfo(dir,name){
 let o={};
 try{const r=await fetch(dir+"/"+encodeURIComponent(name)+"/info.txt?"+Date.now());if(r.ok)o=parseInfo(await r.text())}catch(e){}
 o.title=o.title||pretty(name);return o;
}
const driveId=u=>{const m=u.match(/drive\.google\.com\/file\/d\/([\w-]+)/)||u.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/);return m?m[1]:null};
const driveDownload=u=>{const id=driveId(u);return id?"https://drive.usercontent.google.com/download?id="+id+"&export=download&confirm=t":null};
function embedInfo(u){
 let m;
 if(m=u.match(/instagram\.com\/(?:[^\/?]+\/)?(p|reels?|tv)\/([\w-]+)/))return{src:"https://www.instagram.com/"+(m[1]==="reels"?"reel":m[1])+"/"+m[2]+"/embed/",type:"ig"};
 if(/\.mp4(\?|#|$)/i.test(u))return{src:u,type:"mp4"};
 if(m=driveId(u))return{src:"https://drive.google.com/file/d/"+m+"/preview",type:"drive"};
 if(m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/))([\w-]{11})/))return{src:"https://www.youtube-nocookie.com/embed/"+m[1]+"?playsinline=1&rel=0&modestbranding=1&iv_load_policy=3",type:"yt"};
 return null;
}
function buildEmbed(url,wide,showOpen){
 const i=embedInfo(url),w=el("div","vid");
 if(i){const fr=el("div","frame "+(i.type==="ig"?"ig":wide?"w":"v")),f=el(i.type==="mp4"?"video":"iframe");
  f.src=i.src;
  if(i.type==="mp4"){f.controls=true;f.playsInline=true;f.preload="metadata"}
  else{f.title="Video";f.loading="lazy";f.allowFullscreen=true;f.allow="autoplay; fullscreen; picture-in-picture; encrypted-media"}
  fr.append(f);w.append(fr)}
 if(showOpen||!i){const a=el("a","btn");a.href=url;a.target="_blank";a.rel="noopener";
  a.textContent=!i?"Open the video":i.type==="ig"?"Open on Instagram":i.type==="drive"?"Open in Google Drive":"Open on YouTube";w.append(a)}
 return w;
}
const msg=t=>{const d=el("div","card msg");d.textContent=t;return d};
const FOLDER='<svg viewBox="0 0 24 24" fill="none" stroke="#0b0b0b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H9l2 2.5h7.5A2.5 2.5 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/></svg>';
const COLORS=["#2ee84f","#f5b800"];
async function folderList(dir,kind){
 const box=$("list");box.className="list"+(kind==="video"?" grid":"");
 try{
  const names=await listDirs(dir);
  if(!names.length){box.className="list";box.innerHTML="";
   box.append(msg(kind==="video"?"No videos yet. On GitHub, create a folder like videos/01-my-topic/ with an info.txt inside it.":"No scripts yet. On GitHub, create a folder like scripts/01-my-topic/ with audio.mp3, script.txt and info.txt inside it."));return}
  const infos=await Promise.all(names.map(n=>readInfo(dir,n)));
  box.innerHTML="";
  names.map((n,i)=>({n,i,info:infos[i]})).reverse().forEach(({n,i,info})=>{
   const num=numOf(n,i);
   if(kind==="video"){
    const a=el("a","fold");a.href="video.html?f="+encodeURIComponent(n);a.style.setProperty("--c",COLORS[i%COLORS.length]);
    const body=el("div","card body"),ico=el("span","ico"),meta=el("span","meta px"),t=el("b","ttl2");
    ico.innerHTML=FOLDER;meta.textContent="Video "+num;t.textContent=info.title;
    body.append(ico,meta,t);a.append(el("i","tab"),body);box.append(a);
   }else{
    const a=el("a","card row");a.href="player.html?s="+encodeURIComponent(n);
    const s=el("span","num"),t=el("span","ttl");s.textContent=num;t.textContent=info.title;a.append(s,t);box.append(a);
   }
  });
 }catch(e){box.className="list";box.innerHTML="";
  box.append(msg("Could not load the list. Open this page from your live GitHub link and check your internet. If you refreshed many times in one hour, GitHub may pause the list for a while."))}
}

const SUN='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM4.2 5.6l1.4-1.4 2.8 2.8-1.4 1.4zM15.6 17l1.4-1.4 2.8 2.8-1.4 1.4zM4.2 18.4l2.8-2.8 1.4 1.4-2.8 2.8zM15.6 7l2.8-2.8 1.4 1.4L17 8.4z"/></svg>';
const MOON='<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/></svg>';
function initTheme(){
 const root=document.documentElement,b=el("button","theme");b.type="button";
 const paint=()=>{const d=root.dataset.theme==="dark";b.innerHTML=(d?SUN+"Light":MOON+"Dark");b.setAttribute("aria-label",d?"Switch to light mode":"Switch to dark mode")};
 b.onclick=()=>{const t=root.dataset.theme==="dark"?"light":"dark";root.dataset.theme=t;try{localStorage.setItem("theme",t)}catch(e){}paint();dispatchEvent(new Event("themechange"))};
 paint();document.body.append(b);
}
function initFX(){
 const c=el("canvas");c.id="fx";c.setAttribute("aria-hidden","true");document.body.prepend(c);
 const g=c.getContext("2d"),still=matchMedia("(prefers-reduced-motion:reduce)").matches,U=4;
 const SH={plus:[[0,0],[1,0],[-1,0],[0,1],[0,-1]],dot:[[0,0]],x:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],sq:[[0,0],[1,0],[0,1],[1,1]],chev:[[0,0],[1,1],[2,2],[1,3],[0,4]]};
 const K=Object.keys(SH),rnd=(a,b)=>a+Math.random()*(b-a);let W=0,H=0,d=1,P=[],last=performance.now();
 const mk=init=>({x:rnd(0,W),y:init?rnd(0,H):H+20,s:SH[K[Math.random()*K.length|0]],vx:rnd(-6,6),vy:-rnd(5,18),ph:rnd(0,6.28),tw:rnd(1,3),g:Math.random()<.28,z:Math.random()<.2?2:1});
 function size(){const w=innerWidth,h=innerHeight;if(w===W&&Math.abs(h-H)<140)return;
  d=Math.min(devicePixelRatio||1,2);W=w;H=h;c.width=W*d;c.height=H*d;P=Array.from({length:Math.round(W*H/16000)},()=>mk(true))}
 function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,W,H);
  const base=document.documentElement.dataset.theme==="dark"?"255,255,255":"16,16,16";
  P.forEach(p=>{
   if(!still){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y<-24||p.x<-24||p.x>W+24)Object.assign(p,mk(false))}
   const a=still?.5:.25+.6*Math.abs(Math.sin(now/1000*p.tw+p.ph));
   g.fillStyle=p.g?"rgba(46,232,79,"+a+")":"rgba("+base+","+(a*.5)+")";
   const u=U*p.z,X=Math.round(p.x/U)*U,Y=Math.round(p.y/U)*U;p.s.forEach(([dx,dy])=>g.fillRect(X+dx*u,Y+dy*u,u,u))});
  if(!still)requestAnimationFrame(frame)}
 size();addEventListener("resize",size);addEventListener("themechange",()=>{if(still)requestAnimationFrame(frame)});requestAnimationFrame(frame);
}
if(typeof document!=="undefined"){initTheme();initFX()}
if(typeof module!=="undefined")module.exports={embedInfo,parseInfo,pretty,numOf,natural,driveDownload};
