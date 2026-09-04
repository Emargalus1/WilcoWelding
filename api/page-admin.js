import { requireAdmin } from "../lib/auth.js";

export default function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "GET") return res.status(405).send("Method not allowed");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Full Page Editor | Wilco Welding Admin</title>
<style>
:root{--ink:#172031;--muted:#667085;--line:#d8dee8;--paper:#fff;--canvas:#f4f6f9;--accent:#d97706;--accent-dark:#a95005;--success:#087443;--danger:#bd2424}*{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.topbar{background:#111827;color:#fff;border-bottom:4px solid var(--accent)}.topbar-inner{width:min(100% - 32px,1100px);margin:auto;padding:18px 0;display:flex;gap:12px;align-items:center}.mark{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:var(--accent);font-weight:900}.topbar h1{font-size:1.15rem;margin:0}.topbar p{margin:3px 0 0;color:#d1d5db;font-size:.86rem}main{width:min(100% - 32px,1100px);margin:28px auto 60px}.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;box-shadow:0 12px 30px rgba(16,24,40,.06);margin-bottom:18px}.toolbar{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:end}.field{display:flex;flex-direction:column;gap:7px}label{font-size:.88rem;font-weight:800}.hint,.muted{color:var(--muted);font-size:.82rem;line-height:1.45}select,input,textarea{width:100%;border:1px solid #b9c2d0;border-radius:9px;background:#fff;color:var(--ink);padding:11px 12px;font:inherit;outline:none}select:focus,input:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(217,119,6,.15)}button,.btn{appearance:none;border:0;border-radius:9px;padding:11px 15px;font:inherit;font-weight:800;cursor:pointer;text-decoration:none;text-align:center}.primary{background:var(--accent);color:#fff}.secondary{background:#edf1f6;color:#263244}.danger{background:#fff0f0;color:#a61b1b;border:1px solid #efcaca}button:disabled{opacity:.6;cursor:wait}.status{min-height:1.4em;margin:10px 0 0;color:var(--muted);font-size:.88rem}.status.success{color:var(--success)}.status.error{color:var(--danger)}.section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.section-head h2{margin:0;font-size:1.15rem}.section-head p{margin:4px 0 0}.list{display:grid;gap:10px}.edit-row{display:grid;grid-template-columns:180px 1fr;gap:10px;align-items:start;padding:12px;border:1px solid var(--line);border-radius:10px;background:#fbfcfe}.edit-row b{font-size:.82rem}.edit-row textarea{min-height:72px;resize:vertical}.image-row{display:grid;grid-template-columns:150px 1fr auto;gap:10px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:10px;background:#fbfcfe}.image-row input{min-width:0}.upload-panel{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px;padding:14px;border:1px dashed #b9c2d0;border-radius:10px;background:#fbfcfe}.upload-panel input[type=file]{max-width:360px}.advanced textarea{min-height:380px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.82rem;line-height:1.4}.actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.page-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.page-links a{display:block;padding:10px 12px;border:1px solid var(--line);border-radius:8px;text-decoration:none;color:var(--ink);font-weight:750;font-size:.82rem;background:#fff}.page-links a:hover{border-color:var(--accent);background:#fff7ed}.hidden{display:none!important}@media(max-width:760px){.toolbar{grid-template-columns:1fr}.edit-row,.image-row{grid-template-columns:1fr}.page-links{grid-template-columns:1fr}.actions{align-items:stretch;flex-direction:column}.actions>*{width:100%}}
</style>
</head>
<body>
<header class="topbar"><div class="topbar-inner"><div class="mark">W</div><div><h1>Full Page Editor</h1><p>Edit text and pictures on every Wilco Welding page.</p></div></div></header>
<main>
<section class="card">
  <div class="toolbar">
    <div class="field"><label for="page">Choose page</label><select id="page"></select></div>
    <button class="secondary" id="load">Load page</button>
    <a class="btn secondary" id="openPage" target="_blank" rel="noopener">Open live page ↗</a>
  </div>
  <p id="status" class="status">Choose a page to begin.</p>
</section>
<section class="card">
  <div class="section-head"><div><h2>Page admin links</h2><p class="muted">Each page has its own direct admin link, all powered by this editor.</p></div><a class="btn secondary" href="/admin">Admin Hub</a></div>
  <div class="page-links" id="pageLinks"></div>
</section>
<section class="card" id="textCard">
  <div class="section-head"><div><h2>Text on this page</h2><p class="muted">Edit simple headings, paragraphs, buttons, navigation labels, and other visible text. Advanced HTML below covers anything not listed here.</p></div></div>
  <div class="list" id="textList"></div>
</section>
<section class="card" id="imageCard">
  <div class="section-head"><div><h2>Pictures on this page</h2><p class="muted">Replace image and background-image addresses. You can also upload a new picture and place its address into any image field.</p></div></div>
  <div class="list" id="imageList"></div>
  <div class="upload-panel"><input id="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><button class="secondary" id="upload">Upload picture</button><span class="muted" id="uploadResult">No picture uploaded yet.</span></div>
</section>
<section class="card advanced">
  <div class="section-head"><div><h2>Advanced full-page HTML</h2><p class="muted">This gives complete control of the page, including text or image areas the quick editor cannot detect. Only edit this if needed.</p></div><button class="secondary" id="refreshQuick">Refresh quick fields from HTML</button></div>
  <textarea id="html" spellcheck="false"></textarea>
</section>
<section class="card"><div class="actions"><button class="primary" id="save">Save page changes</button><button class="secondary" id="reload">Discard changes & reload</button><span class="muted">Saving commits the page to GitHub and Vercel can deploy it automatically.</span></div></section>
</main>
<script type="module">
import { upload } from "https://esm.sh/@vercel/blob@2.0.0/client";

const pages = [
  ["Home","index.html"],["Welding Program","welding-program.html"],["Student Resources","student-resources.html"],["AWS","aws.html"],["Wilco Career Center","wilco-area-career-center.html"],["Employers & Partners","employers-partners.html"],["Blog","blog.html"],["Blog Archive","blog-archive.html"],["Events","events.html"],["Contact","contact.html"],["Syllabi","syllabi.html"]
];
const $ = (id) => document.getElementById(id);
const pageSelect = $("page");
const status = $("status");
let originalHtml = "";
let loadedPage = "";
let loadedSha = "";
let loadOk = false;
let textItems = [];
let imageItems = [];
let uploadedUrl = "";

function setStatus(message, kind="") { status.textContent = message; status.className = "status " + kind; }
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function escapeRegExp(value){return value.replace(/[.*+?^$()|[\]\\]/g,"\\$&").replace(/\{/g,"\\{").replace(/\}/g,"\\}");}
function pageFromUrl(){const p=new URLSearchParams(location.search).get("page");return pages.some(([,f])=>f===p)?p:"index.html";}

pages.forEach(([label,file])=>{const o=document.createElement("option");o.value=file;o.textContent=label+" — "+file;pageSelect.appendChild(o);});
pageSelect.value = pageFromUrl();
$("pageLinks").innerHTML = pages.map(([label,file])=>'<a href="/page-admin?page='+encodeURIComponent(file)+'">'+escapeHtml(label)+' Admin</a>').join("");

function extractQuickFields(){
  const html = $("html").value;
  textItems = [];
  imageItems = [];
  const textRegex = /<(h[1-6]|p|button|a|li|label|small|strong|em|span)([^>]*)>([^<>]{1,500})<\/\1>/gi;
  let m; let index=0;
  while((m=textRegex.exec(html))){
    const value=m[3];
    const plain=value.replace(/&nbsp;/g," ").trim();
    if(!plain || /^https?:\/\//i.test(plain)) continue;
    textItems.push({id:index++,tag:m[1].toLowerCase(),old:value,value});
    if(textItems.length>=250) break;
  }
  const seen=new Set();
  const attrRegex=/(?:<img\b[^>]*\bsrc|<source\b[^>]*\bsrc|<video\b[^>]*\bposter)\s*=\s*(["'])(.*?)\1/gi;
  while((m=attrRegex.exec(html))){const url=m[2];if(url&&!seen.has(url)){seen.add(url);imageItems.push({old:url,value:url,type:"image"});}}
  const cssRegex=/url\(\s*(["']?)(.*?)\1\s*\)/gi;
  while((m=cssRegex.exec(html))){const url=m[2];if(url&&!seen.has(url)&&!url.startsWith("data:font")){seen.add(url);imageItems.push({old:url,value:url,type:"background"});}}
  renderText(); renderImages();
}

function renderText(){
  const list=$("textList");
  if(!textItems.length){list.innerHTML='<p class="muted">No simple text fields were detected. Use the Advanced full-page HTML editor below.</p>';return;}
  list.innerHTML=textItems.map((item,i)=>'<div class="edit-row"><b>'+escapeHtml(item.tag.toUpperCase())+' '+(i+1)+'</b><textarea data-text-index="'+i+'">'+escapeHtml(item.value)+'</textarea></div>').join("");
  list.querySelectorAll("textarea[data-text-index]").forEach(el=>el.addEventListener("input",()=>{textItems[Number(el.dataset.textIndex)].value=el.value;}));
}
function displayImageUrl(url){return url.startsWith("data:image")?"[Embedded image — upload or paste a new image URL to replace it]":url;}
function renderImages(){
  const list=$("imageList");
  if(!imageItems.length){list.innerHTML='<p class="muted">No image addresses were detected on this page.</p>';return;}
  list.innerHTML=imageItems.map((item,i)=>'<div class="image-row"><b>'+escapeHtml(item.type.toUpperCase())+' '+(i+1)+'</b><input data-image-index="'+i+'" value="'+escapeHtml(displayImageUrl(item.value))+'"><button class="secondary use-upload" data-image-index="'+i+'">Use uploaded</button></div>').join("");
  list.querySelectorAll("input[data-image-index]").forEach(el=>el.addEventListener("input",()=>{imageItems[Number(el.dataset.imageIndex)].value=el.value;}));
  list.querySelectorAll(".use-upload").forEach(btn=>btn.addEventListener("click",()=>{if(!uploadedUrl)return setStatus("Upload a picture first.","error");const i=Number(btn.dataset.imageIndex);imageItems[i].value=uploadedUrl;renderImages();setStatus("Uploaded picture placed into that image field. Save the page to publish it.","success");}));
}

function applyQuickChanges(){
  let html=$("html").value;
  for(const item of textItems){
    if(item.value===item.old) continue;
    const pattern=new RegExp("(<"+item.tag+"[^>]*>)"+escapeRegExp(item.old)+"(</"+item.tag+">)","i");
    html=html.replace(pattern,(full,a,b)=>a+item.value+b);
  }
  for(const item of imageItems){
    let value=item.value;
    if(value.startsWith("[Embedded image")) value=item.old;
    if(value===item.old) continue;
    html=html.split(item.old).join(value);
  }
  $("html").value=html;
}

async function loadPage(){
  const page=pageSelect.value;
  history.replaceState(null,"","/page-admin?page="+encodeURIComponent(page));
  $("openPage").href="/"+page;
  loadOk=false; loadedPage=""; loadedSha=""; $("save").disabled=true; setStatus("Loading "+page+"…");
  try{
    const r=await fetch("/api/page-file?page="+encodeURIComponent(page),{cache:"no-store"});
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||"Could not load page.");
    originalHtml=data.html; loadedPage=data.page; loadedSha=data.sha; loadOk=true; $("html").value=data.html; extractQuickFields(); $("save").disabled=false;
    setStatus("Loaded "+page+". Edit text or pictures, then save.","success");
  }catch(e){setStatus("Load error: "+e.message,"error");}
}

$("load").addEventListener("click",loadPage);
pageSelect.addEventListener("change",loadPage);
$("reload").addEventListener("click",()=>{$("html").value=originalHtml;extractQuickFields();setStatus("Unsaved changes discarded.","success");});
$("refreshQuick").addEventListener("click",()=>{extractQuickFields();setStatus("Quick text and picture fields refreshed from the HTML.","success");});
$("upload").addEventListener("click",async()=>{
  const file=$("file").files[0]; if(!file)return setStatus("Choose a picture first.","error");
  if(file.size>10*1024*1024)return setStatus("That picture is larger than 10 MB.","error");
  const btn=$("upload");btn.disabled=true;setStatus("Uploading picture…");
  try{const blob=await upload("uploads/"+file.name,file,{access:"public",handleUploadUrl:"/api/upload"});uploadedUrl=blob.url;$("uploadResult").textContent=blob.url;setStatus("Picture uploaded. Press Use uploaded beside the picture you want to replace.","success");}
  catch(e){setStatus("Upload error: "+e.message,"error");}finally{btn.disabled=false;}
});
$("save").addEventListener("click",async()=>{
  const btn=$("save"); if(!loadOk || !loadedSha || loadedPage!==pageSelect.value) return setStatus("Reload this page before saving. The selected page is not the successfully loaded page.","error"); btn.disabled=true;applyQuickChanges();setStatus("Saving "+loadedPage+"…");
  try{
    const r=await fetch("/api/page-file",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page:loadedPage,html:$("html").value,sha:loadedSha})});
    const data=await r.json(); if(!r.ok)throw new Error(data.error||"Could not save page.");
    loadedSha=data.sha||loadedSha; originalHtml=$("html").value; extractQuickFields(); setStatus("Saved! "+pageSelect.value+" was updated in GitHub.","success");
  }catch(e){setStatus("Save error: "+e.message,"error");}finally{btn.disabled=false;}
});
loadPage();
</script>
</body>
</html>`);
}
