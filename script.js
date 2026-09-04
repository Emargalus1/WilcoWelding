function safeUrl(value, { allowRelative = true } = {}) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, location.href);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return allowRelative && url.origin === location.origin ? raw : url.href;
  } catch {
    return "";
  }
}

function initMobileMenu() {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector("nav");
  if (!hamburger || !nav) return;
  hamburger.setAttribute("aria-label", hamburger.getAttribute("aria-label") || "Open navigation menu");
  hamburger.setAttribute("aria-controls", nav.id || "site-navigation");
  if (!nav.id) nav.id = "site-navigation";
  hamburger.setAttribute("aria-expanded", "false");
  hamburger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  });
}

function appendTextRow(container, className, first, second, firstTag = "span", secondTag = "span") {
  const row = document.createElement("div");
  row.className = className;
  const a = document.createElement(firstTag);
  const b = document.createElement(secondTag);
  a.textContent = first ?? "";
  b.textContent = second ?? "";
  row.append(a, b);
  container.appendChild(row);
}

function parseEventDate(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T12:00:00` : text;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isUpcomingEvent(value) {
  const date = parseEventDate(value);
  if (!date) return true;
  if (!/^\d{4}/.test(String(value || "").trim())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

async function start() {
  initMobileMenu();

  try {
    const response = await fetch(`./content.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load content.json (${response.status})`);

    const d = await response.json();
    const blogPosts = Array.isArray(d.blog?.posts) && d.blog.posts.length
      ? d.blog.posts.slice(0, 5)
      : (d.blog?.title || d.blog?.description || d.blog?.image ? [d.blog] : []);

    const blogFeature = document.querySelector(".blog-feature");
    if (blogFeature && blogPosts.length === 0) blogFeature.hidden = true;

    document.querySelectorAll("[data-c]").forEach((element) => {
      let value = d;
      for (const key of element.dataset.c.split(".")) value = value?.[key];
      if (element.tagName === "IMG") {
        const url = safeUrl(value);
        if (url) element.src = url;
      } else if (element.tagName === "A" && element.dataset.c.endsWith("link")) {
        const url = safeUrl(value);
        if (url) element.href = url;
      } else {
        element.textContent = value ?? "";
      }
    });

    const heroPhoto = document.querySelector(".hero-photo");
    const heroForeground = document.querySelector(".hero-photo-foreground");
    const heroSection = document.querySelector(".hero");
    const previousHero = document.querySelector(".hero .arrow.left");
    const nextHero = document.querySelector(".hero .arrow.right");
    const heroDots = document.querySelector(".hero .slider-dots");
    const heroSlides = Array.isArray(d.hero?.slides) ? d.hero.slides.map((x) => safeUrl(x)).filter(Boolean) : [];
    const fallbackHero = safeUrl(d.hero?.image);
    if (!heroSlides.length && fallbackHero) heroSlides.push(fallbackHero);

    if (previousHero) previousHero.setAttribute("aria-label", "Previous hero photo");
    if (nextHero) nextHero.setAttribute("aria-label", "Next hero photo");

    if (heroPhoto && heroSlides.length) {
      let currentHeroSlide = 0;
      const showHeroSlide = (index) => {
        currentHeroSlide = (index + heroSlides.length) % heroSlides.length;
        const imageUrl = heroSlides[currentHeroSlide].replaceAll('"', "%22");
        heroPhoto.style.backgroundImage = `url("${imageUrl}")`;
        if (heroForeground) heroForeground.style.backgroundImage = `url("${imageUrl}")`;
        if (heroDots) {
          heroDots.replaceChildren();
          heroSlides.forEach((_, dotIndex) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = dotIndex === currentHeroSlide ? "on" : "";
            dot.setAttribute("aria-label", `Show hero photo ${dotIndex + 1}`);
            dot.setAttribute("aria-current", dotIndex === currentHeroSlide ? "true" : "false");
            dot.addEventListener("click", () => showHeroSlide(dotIndex));
            heroDots.appendChild(dot);
          });
        }
      };
      showHeroSlide(0);
      previousHero?.addEventListener("click", () => showHeroSlide(currentHeroSlide - 1));
      nextHero?.addEventListener("click", () => showHeroSlide(currentHeroSlide + 1));
      if (heroSlides.length < 2) {
        if (previousHero) previousHero.hidden = true;
        if (nextHero) nextHero.hidden = true;
        if (heroDots) heroDots.hidden = true;
      } else {
        heroSection?.classList.add("has-hero-slider");
      }
    }

    const blogImage = document.querySelector(".blog-image img");
    const blogContent = document.querySelector(".blog-content");
    const blogImageUrl = safeUrl(d.blog?.image);
    if (blogImage && blogImageUrl) {
      const setBlogImageLayout = () => blogContent?.classList.toggle("has-portrait-blog", blogImage.naturalHeight > blogImage.naturalWidth);
      blogImage.addEventListener("load", setBlogImageLayout, { once: true });
      blogImage.src = blogImageUrl;
      if (blogImage.complete) setBlogImageLayout();
    }

    const blogHistory = document.querySelector("#blogHistory");
    const blogHistoryGrid = document.querySelector(".blog-history-grid");
    if (blogHistory && blogHistoryGrid) {
      const olderPosts = blogPosts.slice(1, 5);
      blogHistory.hidden = olderPosts.length === 0;
      blogHistoryGrid.replaceChildren();
      olderPosts.forEach((post) => {
        const card = document.createElement("article");
        card.className = "blog-history-card";
        const postImage = safeUrl(post.image);
        if (postImage) {
          const image = document.createElement("img");
          image.src = postImage;
          image.alt = post.title || "Wilco Welding blog post";
          card.appendChild(image);
        }
        const text = document.createElement("div");
        text.className = "blog-history-card-text";
        const eyebrow = document.createElement("div");
        eyebrow.className = "blog-eyebrow";
        eyebrow.textContent = post.eyebrow || "WILCO WELDING NEWS";
        const title = document.createElement("h3");
        title.textContent = post.title || "Untitled post";
        const description = document.createElement("p");
        description.textContent = post.description || "";
        text.append(eyebrow, title, description);
        card.appendChild(text);
        blogHistoryGrid.appendChild(card);
      });
    }

    const features = document.querySelector("#features");
    if (features && Array.isArray(d.program?.features)) {
      features.replaceChildren();
      d.program.features.forEach((item) => {
        const feature = document.createElement("div");
        feature.className = "feature";
        const icon = document.createElement("div");
        icon.className = "icon";
        icon.setAttribute("aria-hidden", "true");
        const text = document.createElement("div");
        const heading = document.createElement("h3");
        const paragraph = document.createElement("p");
        heading.textContent = item?.[0] ?? "";
        paragraph.textContent = item?.[1] ?? "";
        text.append(heading, paragraph);
        feature.append(icon, text);
        features.appendChild(feature);
      });
    }

    const newsRows = document.querySelector("#newsRows");
    if (newsRows && Array.isArray(d.news)) {
      newsRows.replaceChildren();
      d.news.forEach((x) => appendTextRow(newsRows, "newsrow", x?.[0], x?.[1]));
    }

    const eventRows = document.querySelector("#eventRows");
    if (eventRows) {
      const formatEventDate = (value) => {
        const date = parseEventDate(value);
        return date && /^\d{4}/.test(String(value || "").trim())
          ? date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
          : String(value || "");
      };
      const blogEvents = Array.isArray(d.blog?.posts)
        ? d.blog.posts.filter((post) => post?.eventDate && isUpcomingEvent(post.eventDate)).map((post) => [post.title || "Untitled event", formatEventDate(post.eventDate)])
        : [];
      const configuredEvents = (Array.isArray(d.events) ? d.events : []).filter((event) => isUpcomingEvent(Array.isArray(event) ? event[1] : event?.date));
      const events = [...blogEvents, ...configuredEvents];
      eventRows.replaceChildren();
      events.forEach((x) => {
        const row = document.createElement("div");
        row.className = "eventrow";
        const cal = document.createElement("div");
        cal.className = "cal";
        cal.setAttribute("aria-hidden", "true");
        cal.textContent = "▦";
        const text = document.createElement("div");
        const title = document.createElement("b");
        const date = document.createElement("small");
        title.textContent = Array.isArray(x) ? x[0] ?? "" : x?.title ?? "";
        date.textContent = Array.isArray(x) ? x[1] ?? "" : x?.date ?? "";
        text.append(title, date);
        row.append(cal, text);
        eventRows.appendChild(row);
      });
    }

    const partnerLogos = document.querySelector(".partner-logos");
    if (partnerLogos && Array.isArray(d.partners)) {
      partnerLogos.replaceChildren();
      d.partners.forEach((partner) => {
        const card = document.createElement("div");
        card.className = "partner-logo";
        const imageUrl = safeUrl(partner?.image);
        if (imageUrl) {
          const image = document.createElement("img");
          image.src = imageUrl;
          image.alt = partner.name || "Wilco Welding partner";
          image.loading = "lazy";
          card.appendChild(image);
        } else {
          card.textContent = partner?.name || "Partner";
        }
        const linkUrl = safeUrl(partner?.link);
        if (linkUrl) {
          const link = document.createElement("a");
          link.href = linkUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.setAttribute("aria-label", `Visit ${partner.name || "partner website"}`);
          link.appendChild(card);
          partnerLogos.appendChild(link);
        } else {
          partnerLogos.appendChild(card);
        }
      });
    }
  } catch (error) {
    console.error("Wilco Welding content error:", error);
    document.documentElement.classList.add("content-load-failed");
  }
}

start();
