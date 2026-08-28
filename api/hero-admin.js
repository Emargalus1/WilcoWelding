import { requireAdmin } from "./auth.js";

export default function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(String.raw`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Edit Homepage Hero</title>
<style>
body{margin:0;background:#f4f6f9;font:16px system-ui;color:#172031}.bar{background:#111827;color:#fff;padding:20px}.wrap{max-width:800px;margin:32px auto;padding:0 18px}.card,.slide{background:#fff;border:1px solid #d8dee8;border-radius:14px;padding:28px}.slide{margin-top:14px;padding:18px;background:#fbfcfe}.row{display:flex;align-items:center;justify-content:space-between;gap:12px}label{display:block;font-weight:700;margin:16px 0 7px}input,textarea{box-sizing:border-box;width:100%;padding:11px;border:1px solid #b9c2d0;border-radius:8px;font:inherit}textarea{min-height:110px}button{margin-top:18px;padding:11px 16px;border:0;border-radius:8px;font-weight:800;cursor:pointer;background:#d97706;color:#fff}.secondary{background:#e8edf3;color:#172031;margin-left:8px}.remove{background:#fee2e2;color:#991b1b;margin:0}.upload{margin-top:10px}.preview{display:none;max-width:190px;max-height:110px;object-fit:cover;border-radius:7px;margin-top:12px}#status{margin-left:12px}.help{color:#596579;line-height:1.45}
</style>
<div class="bar"><b>Wilco Welding Admin</b> · Edit homepage hero</div>
<main class="wrap"><a href="/admin">← Back to blog editor</a><section class="card">
<h1>Homepage Hero</h1><p class="help">Upload as many as eight photos. Visitors can move through them with the arrows on the homepage.</p>
<label>Small heading<input id="eyebrow"></label><label>Main heading<input id="title"></label><label>Description<textarea id="description"></textarea></label><label>Button text<input id="button"></label>
<h2>Hero photos</h2><div id="slides"></div><button id="add" class="secondary">+ Add another photo</button><br><button id="save">Save hero</button><span id="status"></span>
</section></main>
<script type="module">
import { upload } from "https://esm.sh/@vercel/blob@2.0.0/client";
const g=id=>document.getElementById(id),s=text=>g("status").textContent=text;
const keys=["eyebrow","title","description","button"];let hero={};
function addSlide(value=""){
 const card=document.createElement("article");card.className="slide";
 card.innerHTML='<div class="row"><b>Hero photo</b><button type="button" class="remove">Remove</button></div><label>Image URL<input data-url></label><label>Upload a photo<input data-file type="file" accept="image/*"></label><button type="button" class="secondary upload">Upload selected photo</button><img class="preview" alt="Hero preview">';
 const url=card.querySelector("[data-url]"),file=card.querySelector("[data-file]"),preview=card.querySelector(".preview");
 const refresh=()=>{preview.style.display=url.value.trim()?"block":"none";preview.src=url.value.trim();};
 url.value=value;refresh();url.oninput=refresh;
 card.querySelector(".remove").onclick=()=>{if(g("slides").children.length>1)card.remove();else s("Keep at least one hero photo.");};
 card.querySelector(".upload").onclick=async()=>{const selected=file.files[0];if(!selected)return s("Choose a photo first.");s("Uploading…");try{const result=await upload("uploads/"+selected.name,selected,{access:"public",handleUploadUrl:"/api/upload"});url.value=result.url;refresh();s("Uploaded — save the hero when ready.");}catch(error){s("Upload error: "+error.message);}};
 g("slides").appendChild(card);
}
try{const data=await (await fetch("/content.json",{cache:"no-store"})).json();hero=data.hero||{};keys.forEach(key=>g(key).value=hero[key]||"");const slides=Array.isArray(hero.slides)&&hero.slides.length?hero.slides:[hero.image||""];slides.forEach(addSlide);s("Loaded");}catch(error){addSlide();s(error.message);}
g("add").onclick=()=>addSlide();g("save").onclick=async()=>{keys.forEach(key=>hero[key]=g(key).value.trim());const slides=Array.from(document.querySelectorAll("[data-url]")).map(input=>input.value.trim()).filter(Boolean);if(!slides.length)return s("Add at least one hero photo.");hero.slides=slides;hero.image=slides[0];s("Saving…");try{const response=await fetch("/api/update-content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({hero})});if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"Save failed.");}s("Saved! The homepage arrows now use your photos.");}catch(error){s(error.message);}};
</script>`); 
}