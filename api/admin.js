import { requireAdmin } from "./auth.js";

export default function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "GET") return res.status(405).send("Method not allowed");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Wilco Welding Admin</title>
  <style>
    :root { --ink:#172031; --muted:#667085; --line:#d8dee8; --paper:#fff; --canvas:#f4f6f9; --accent:#d97706; --accent-dark:#a95005; --success:#087443; --danger:#bd2424; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); background:var(--canvas); font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
    .topbar { background:#111827; color:#fff; border-bottom:4px solid var(--accent); }
    .topbar-inner { width:min(100% - 32px,920px); margin:auto; padding:20px 0; display:flex; align-items:center; gap:12px; }
    .mark { width:38px; height:38px; display:grid; place-items:center; border-radius:10px; background:var(--accent); font-weight:900; }
    .topbar h1 { margin:0; font-size:1.16rem; }.topbar p { margin:3px 0 0; color:#d1d5db; font-size:.86rem; }
    main { width:min(100% - 32px,920px); margin:32px auto 56px; }.intro { margin-bottom:18px; }.intro h2 { margin:0 0 7px; font-size:1.65rem; }.intro p { margin:0; color:var(--muted); line-height:1.5; }
    .card { background:var(--paper); border:1px solid var(--line); border-radius:16px; padding:clamp(20px,4vw,34px); box-shadow:0 12px 30px rgba(16,24,40,.06); }
    .section-title { margin:0 0 4px; font-size:1.08rem; }.section-copy { margin:0 0 24px; color:var(--muted); font-size:.92rem; }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }.field { display:flex; flex-direction:column; gap:7px; }.field.wide { grid-column:1 / -1; }
    label { font-size:.9rem; font-weight:700; }.hint { margin:0; color:var(--muted); font-size:.78rem; line-height:1.35; }
    input,textarea { width:100%; border:1px solid #b9c2d0; border-radius:9px; background:#fff; color:var(--ink); padding:11px 12px; font:inherit; outline:none; transition:border-color .15s,box-shadow .15s; }
    input:focus,textarea:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(217,119,6,.15); } textarea { min-height:120px; resize:vertical; line-height:1.45; }
    .upload-box { margin-top:26px; padding:18px; border:1px dashed #b9c2d0; border-radius:12px; background:#fbfcfe; }.upload-box h3 { margin:0 0 5px; font-size:1rem; }.upload-row { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-top:14px; }input[type="file"] { max-width:330px; padding:8px; background:#fff; }
    button { appearance:none; border:0; border-radius:9px; padding:11px 16px; font:inherit; font-weight:750; cursor:pointer; }.primary { background:var(--accent); color:#fff; }.primary:hover { background:var(--accent-dark); }.secondary { background:#edf1f6; color:#263244; }.secondary:hover { background:#e2e8f0; }button:disabled { cursor:wait; opacity:.65; }
    .footer-actions { margin-top:26px; padding-top:22px; border-top:1px solid var(--line); display:flex; flex-wrap:wrap; align-items:center; gap:14px; }#status { margin:0; min-height:1.4em; color:var(--muted); font-size:.9rem; }.history { margin-top:26px; padding-top:22px; border-top:1px solid var(--line); }.history h3 { margin:0 0 5px; }.history-copy { margin:0 0 13px; color:var(--muted); font-size:.88rem; }.history-list { display:grid; gap:9px; }.history-item { padding:12px 14px; border:1px solid var(--line); border-radius:9px; background:#fbfcfe; }.history-item b { display:block; }.history-item span { color:var(--muted); font-size:.84rem; }#status[data-kind="success"] { color:var(--success); }#status[data-kind="error"] { color:var(--danger); }
    .admin-hub{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}.hub-link{display:block;padding:13px 14px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--ink);font-size:.86rem;font-weight:800;text-decoration:none}.hub-link:hover,.active-hub{border-color:var(--accent);background:#fff4e8;color:var(--accent-dark)}@media (max-width:640px) { .grid { grid-template-columns:1fr; }.topbar-inner { padding:16px 0; }main { margin-top:24px; }.footer-actions { align-items:stretch; flex-direction:column; }.footer-actions button { width:100%; } }
  </style>
</head>
<body>
  <header class="topbar"><div class="topbar-inner"><div class="mark">W</div><div><h1>Wilco Welding Admin</h1><p>Publish new posts and keep your complete blog history.</p></div></div></header>
  <main>
    <div class="intro"><h2>Admin Hub</h2><p>Choose the part of the website you want to update.</p><div class="admin-hub"><a class="hub-link active-hub" href="/admin">BLOG POSTS</a><a class="hub-link" href="/hero-admin">HOME HERO</a><a class="hub-link" href="/aws-admin">AWS PAGE</a><a class="hub-link" href="/wilco-admin">WILCO PAGE</a><a class="hub-link" href="/events-admin">UPCOMING EVENTS</a><a class="hub-link" href="/partners-admin">PARTNERS &amp; EMPLOYERS</a><a class="hub-link" href="/resources-admin">STUDENT RESOURCES</a><a class="hub-link" href="/page-heroes-admin">PAGE HEROES</a></div></div>    <div class="intro"><h2>Blog posts</h2><p>Publish a new post or update the newest post. Every post is saved. The newest five appear on the Blog page, and the full history is available in the Blog Archive.</p></div>
    <section class="card">
      <h3 class="section-title">Current blog post</h3><p class="section-copy">The newest post is featured on the Home page. Older posts remain below it.</p>
      <div class="grid">
        <div class="field"><label for="eyebrow">Small heading</label><input id="eyebrow" placeholder="Example: Wilco Welding"></div>
        <div class="field"><label for="button">Button text</label><input id="button" placeholder="Example: Get a quote"></div>
        <div class="field wide"><label for="title">Main heading</label><input id="title" placeholder="Your main homepage message"></div>
        <div class="field wide"><label for="description">Description</label><textarea id="description" placeholder="Tell visitors about your work."></textarea></div>
        <div class="field wide"><label for="image">Photo web address</label><input id="image" type="url" placeholder="This fills in after a photo upload."><p class="hint">You can paste an image address, or upload a photo below.</p></div><div class="field"><label for="eventDate">Event date (optional)</label><input id="eventDate" type="date"><p class="hint">Add a date to automatically include this post in Upcoming Events.</p></div>
      </div>
      <div class="upload-box"><h3>Upload a photo</h3><p class="hint">JPG, PNG, WebP, or GIF, up to 10 MB. Uploading places the photo online; then press Save to show it on the website.</p><div class="upload-row"><input id="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><button class="secondary" id="up" type="button">Upload photo</button></div></div>
      <div class="history"><h3>Saved posts</h3><p class="history-copy">Every post is saved. The newest five appear on the Blog page; older posts remain available in the <a href="/blog-archive.html" target="_blank" rel="noopener noreferrer">Blog Archive ↗</a>.</p><div class="history-list" id="historyList"></div></div><div class="footer-actions"><button class="secondary" id="newPost" type="button">Create new post</button><button class="primary" id="save" type="button">Save changes</button><p id="status" aria-live="polite">Loading current content…</p></div>
    </section>
  </main>
  <script type="module">
    import { upload } from "https://esm.sh/@vercel/blob@2.0.0/client";
    const fields = ["eyebrow","title","description","button","image","eventDate"];
    const get = (id) => document.getElementById(id);
    const status = get("status");
    let blog = {};
    let blogPosts = [];
    let creatingNew = false;
    function setStatus(message,kind) { status.textContent = message; status.dataset.kind = kind || ""; }
    function readForm() {
      const post = {};
      for (const key of fields) post[key] = get(key).value.trim();
      return post;
    }
    function fillForm(post) {
      for (const key of fields) get(key).value = post?.[key] || "";
    }
    function renderHistory() {
      const list = get("historyList");
      const previous = blogPosts.slice(1);
      list.innerHTML = previous.length
        ? previous.map((post, index) => '<div class="history-item"><b>' + (post.title || "Untitled post") + '</b><span>Previous post ' + (index + 1) + '</span></div>').join("")
        : '<div class="history-item"><span>No previous posts yet. New posts will be saved here automatically.</span></div>';
    }
    async function loadContent() {
      try {
        const response = await fetch("/content.json",{cache:"no-store"});
        if (!response.ok) throw new Error("Could not load the current content.");
        const content = await response.json();
        const current = content.blog || {};
        blogPosts = Array.isArray(current.posts) && current.posts.length ? current.posts : [current];
        blog = blogPosts[0] || {};
        fillForm(blog);
        renderHistory();
        setStatus("Current post loaded.","success");
      } catch (error) { setStatus("Error: " + error.message,"error"); }
    }
    get("newPost").addEventListener("click", () => {
      creatingNew = true;
      fillForm({ eyebrow:"WILCO WELDING NEWS", button:"READ MORE" });
      get("title").focus();
      setStatus("New post ready. Add your details, then press Save changes.","success");
    });
    get("up").addEventListener("click",async () => {
      const file = get("file").files[0];
      if (!file) return setStatus("Choose a photo before uploading.","error");
      if (file.size > 10 * 1024 * 1024) return setStatus("That photo is larger than 10 MB.","error");
      const button = get("up"); button.disabled = true; setStatus("Uploading photo…");
      try {
        const blob = await upload("uploads/" + file.name,file,{access:"public",handleUploadUrl:"/api/upload"});
        get("image").value = blob.url;
        setStatus("Photo uploaded. Press Save changes to publish it.","success");
      } catch (error) { setStatus("Upload error: " + error.message,"error"); }
      finally { button.disabled = false; }
    });
    get("save").addEventListener("click",async () => {
      const button = get("save"); button.disabled = true;
      blog = readForm();
      if (creatingNew) {
        blogPosts = [blog, ...blogPosts];
      } else {
        blogPosts = [blog, ...blogPosts.slice(1)];
      }
      setStatus("Saving changes…");
      try {
        const response = await fetch("/api/update-content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({blog,blogPosts})});
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Could not save your changes.");
        creatingNew = false;
        renderHistory();
        setStatus("Saved! Your website has been updated.","success");
      } catch (error) { setStatus("Save error: " + error.message,"error"); }
      finally { button.disabled = false; }
    });
    loadContent();
  </script>
</body>
</html>`);
}
