async function start(){
 const d=await fetch('content.json').then(r=>r.json());
 document.querySelectorAll('[data-c]').forEach(e=>{
   let v=d; for(const k of e.dataset.c.split('.')) v=v[k]; e.textContent=v;
 });
 document.querySelector('#features').innerHTML=d.program.features.map((x,i)=>`
   <div class="feature"><div class="icon"></div><div><h3>${x[0]}</h3><p>${x[1]}</p></div></div>`).join('');
 document.querySelector('#newsRows').innerHTML=d.news.map(x=>`<div class="newsrow"><span>${x[0]}</span><span>${x[1]}</span></div>`).join('');
 document.querySelector('#eventRows').innerHTML=d.events.map(x=>`<div class="eventrow"><div class="cal">▦</div><div><b>${x[0]}</b><small>${x[1]}</small></div></div>`).join('');
 document.querySelector('.hamburger').onclick=()=>document.querySelector('nav').classList.toggle('open');
}
start();
