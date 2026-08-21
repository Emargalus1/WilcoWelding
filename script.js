async function start() {
  try {
    const response = await fetch('./content.json');

    if (!response.ok) {
      throw new Error('Could not load content.json');
    }

    const d = await response.json();

    // Fill all data-c fields
    document.querySelectorAll('[data-c]').forEach((e) => {
      let value = d;

      for (const key of e.dataset.c.split('.')) {
        value = value?.[key];
      }

      e.textContent = value ?? '';
    });

    // Hero background image
    const heroPhoto = document.querySelector('.hero-photo');

    if (heroPhoto && d.hero?.image) {
      heroPhoto.style.backgroundImage = `url('${d.hero.image}')`;
    }

    // Blog image
    const blogImage = document.querySelector('.blog-image img');

    if (blogImage && d.blog?.image) {
      blogImage.src = d.blog.image;
    }

    // Program features
    const features = document.querySelector('#features');

    if (features && Array.isArray(d.program?.features)) {
      features.innerHTML = d.program.features
        .map(
          (x) => `
            <div class="feature">
              <div class="icon"></div>
              <div>
                <h3>${x[0] ?? ''}</h3>
                <p>${x[1] ?? ''}</p>
              </div>
            </div>
          `
        )
        .join('');
    }

    // Latest news
    const newsRows = document.querySelector('#newsRows');

    if (newsRows && Array.isArray(d.news)) {
      newsRows.innerHTML = d.news
        .map(
          (x) => `
            <div class="newsrow">
              <span>${x[0] ?? ''}</span>
              <span>${x[1] ?? ''}</span>
            </div>
          `
        )
        .join('');
    }

    // Upcoming events
    const eventRows = document.querySelector('#eventRows');

    if (eventRows && Array.isArray(d.events)) {
      eventRows.innerHTML = d.events
        .map(
          (x) => `
            <div class="eventrow">
              <div class="cal">▦</div>
              <div>
                <b>${x[0] ?? ''}</b>
                <small>${x[1] ?? ''}</small>
              </div>
            </div>
          `
        )
        .join('');
    }

    // Mobile menu
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');

    if (hamburger && nav) {
      hamburger.onclick = () => {
        nav.classList.toggle('open');
      };
    }

  } catch (error) {
    console.error('Wilco Welding content error:', error);
  }
}

start();
