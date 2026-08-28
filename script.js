async function start() {
  try {
    const response = await fetch(`./content.json?ts=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Could not load content.json (${response.status})`);
    }

    const d = await response.json();

    // Load all editable content
    document.querySelectorAll("[data-c]").forEach((element) => {
      let value = d;

      for (const key of element.dataset.c.split(".")) {
        value = value?.[key];
      }

      if (element.tagName === "IMG") {
        if (value) element.src = value;
      } else {
        element.textContent = value ?? "";
      }
    });

    // Hero image
    const heroPhoto = document.querySelector(".hero-photo");

    if (heroPhoto && d.hero?.image) {
      heroPhoto.style.backgroundImage =
        `url("${d.hero.image}")`;
    }

    // Blog image — portrait photos use a narrower box so the whole image is visible.
    const blogImage = document.querySelector(".blog-image img");
    const blogContent = document.querySelector(".blog-content");

    if (blogImage && d.blog?.image) {
      const setBlogImageLayout = () => {
        const isPortrait = blogImage.naturalHeight > blogImage.naturalWidth;
        blogContent?.classList.toggle("has-portrait-blog", isPortrait);
      };

      blogImage.addEventListener("load", setBlogImageLayout, { once: true });
      blogImage.src = d.blog.image;
      if (blogImage.complete) setBlogImageLayout();
    }

    // Program features
    const features = document.querySelector("#features");

    if (features && Array.isArray(d.program?.features)) {
      features.innerHTML = d.program.features
        .map(
          (x) => `
            <div class="feature">
              <div class="icon"></div>
              <div>
                <h3>${x[0] ?? ""}</h3>
                <p>${x[1] ?? ""}</p>
              </div>
            </div>
          `
        )
        .join("");
    }

    // Latest news
    const newsRows = document.querySelector("#newsRows");

    if (newsRows && Array.isArray(d.news)) {
      newsRows.innerHTML = d.news
        .map(
          (x) => `
            <div class="newsrow">
              <span>${x[0] ?? ""}</span>
              <span>${x[1] ?? ""}</span>
            </div>
          `
        )
        .join("");
    }

    // Upcoming events
    const eventRows = document.querySelector("#eventRows");

    if (eventRows && Array.isArray(d.events)) {
      eventRows.innerHTML = d.events
        .map(
          (x) => `
            <div class="eventrow">
              <div class="cal">▦</div>
              <div>
                <b>${x[0] ?? ""}</b>
                <small>${x[1] ?? ""}</small>
              </div>
            </div>
          `
        )
        .join("");
    }

    // Mobile menu
    const hamburger = document.querySelector(".hamburger");
    const nav = document.querySelector("nav");

    if (hamburger && nav) {
      hamburger.onclick = () => {
        nav.classList.toggle("open");
      };
    }

  } catch (error) {
    console.error("Wilco Welding content error:", error);
  }
}

start();
