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
 const link=o.video||o.link||o.drive||o.instagram||o.url||"";
 return{title:o.title,video:/^https?:\/\//i.test(link)?link:"",wide:/wide|16/i.test(o.shape||"")};
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
 if(m=driveId(u))return{src:"https://drive.google.com/file/d/"+m+"/preview",type:"drive"};
 if(m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/))([\w-]{11})/))return{src:"https://www.youtube-nocookie.com/embed/"+m[1],type:"yt"};
 return null;
}
function buildEmbed(url,wide,showOpen){
 const i=embedInfo(url),w=el("div","vid");
 if(i){const fr=el("div","frame "+(i.type==="ig"?"ig":wide?"w":"v")),f=el("iframe");
  f.src=i.src;f.title="Video";f.loading="lazy";f.allowFullscreen=true;
  f.allow="autoplay; fullscreen; picture-in-picture; encrypted-media";fr.append(f);w.append(fr)}
 if(showOpen||!i){const a=el("a","btn");a.href=url;a.target="_blank";a.rel="noopener";
  a.textContent=!i?"Open the video":i.type==="ig"?"Open on Instagram":i.type==="drive"?"Open in Google Drive":"Open on YouTube";w.append(a)}
 return w;
}
const msg=t=>{const d=el("div","card msg");d.textContent=t;return d};
const FOLDER='<svg viewBox="0 0 24 24" fill="none" stroke="#0b1033" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H9l2 2.5h7.5A2.5 2.5 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/></svg>';
const COLORS=["#ff7a29","#6fa8ff","#ffd23f","#7be0b0"];
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
    const body=el("div","card body"),ico=el("span","ico"),meta=el("span","meta"),t=el("b","ttl2");
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
if(typeof module!=="undefined")module.exports={embedInfo,parseInfo,pretty,numOf,natural,driveDownload};
