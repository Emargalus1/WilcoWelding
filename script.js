
async function loadContent(){
  const data = await fetch('content.json').then(r => r.json());

  document.querySelectorAll('[data-content]').forEach(el => {
    const path = el.dataset.content.split('.');
    let value = data;
    for (const key of path) value = value[key];
    el.textContent = value;
  });

  const features = document.getElementById('feature-grid');
  features.innerHTML = data.program.items.map((item, i) => `
    <div class="feature">
      <div class="icon" aria-hidden="true"></div>
      <div><h3>${item[0]}</h3><p>${item[1]}</p></div>
    </div>
  `).join('');

  document.getElementById('news-list').innerHTML = data.news.map(row => `
    <div class="list-row"><span>${row[0]}</span><span>${row[1]}</span></div>
  `).join('');

  document.getElementById('events-list').innerHTML = data.events.map(row => `
    <div class="event-row"><div class="calendar">▦</div><div><strong>${row[0]}</strong><small>${row[1]}</small></div></div>
  `).join('');

  document.getElementById('partner-grid').innerHTML = data.partners.map(name =>
    `<div class="partner">${name}</div>`
  ).join('');
}

document.querySelector('.menu-toggle').addEventListener('click', () => {
  document.querySelector('.nav').classList.toggle('open');
});

loadContent();
