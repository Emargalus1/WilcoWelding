import { requireAdmin } from "../lib/auth.js";

const LIMITS = { events: 20, partners: 30, slides: 8, posts: 50, programs: 60 };
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
const text = (value) => String(value ?? "").trim();

function safeUrl(value, { allowHash = true, allowRelative = true } = {}) {
  const raw = text(value);
  if (!raw) return "";
  if (allowHash && raw.startsWith("#")) return raw;
  if (allowRelative && /^(?:\.?\.?\/|[A-Za-z0-9_-]+\.html(?:[?#].*)?$)/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? raw : "";
  } catch {
    return "";
  }
}

function field(incoming, previous, key) {
  return own(incoming, key) ? text(incoming[key]) : text(previous?.[key]);
}

function urlField(incoming, previous, key, options) {
  const value = own(incoming, key) ? incoming[key] : previous?.[key];
  const raw = text(value);
  if (!raw) return "";
  const clean = safeUrl(raw, options);
  if (!clean) throw new Error(`Invalid URL in ${key}. Only http, https, approved relative links, and anchors are allowed.`);
  return clean;
}

function ensureLimit(name, array, max) {
  if (Array.isArray(array) && array.length > max) throw new Error(`${name} allows a maximum of ${max} items. Remove extra items before saving.`);
}

function slug(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";
}

function postId(post, index = 0) {
  return text(post?.id) || `post-${slug(post?.title)}-${text(post?.eventDate || index)}`;
}

function cleanPost(post, index = 0) {
  const linkRaw = text(post?.link || "#");
  const imageRaw = text(post?.image || "");
  const link = safeUrl(linkRaw) || "#";
  const image = imageRaw ? safeUrl(imageRaw) : "";
  if (imageRaw && !image) throw new Error("A blog image URL is invalid.");
  if (linkRaw && linkRaw !== "#" && link === "#") throw new Error("A blog link is invalid.");
  return {
    id: postId(post, index),
    eyebrow: text(post?.eyebrow),
    title: text(post?.title),
    description: text(post?.description),
    button: text(post?.button),
    image,
    eventDate: text(post?.eventDate),
    link
  };
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Wilco-Welding-Admin"
  };
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: "GITHUB_TOKEN is not configured in Vercel." });

  const githubUrl = "https://api.github.com/repos/Emargalus1/WilcoWelding/contents/content.json?ref=main";
  const headers = githubHeaders(token);

  try {
    const currentResponse = await fetch(githubUrl, { headers, cache: "no-store" });
    if (!currentResponse.ok) return res.status(currentResponse.status).json({ error: "Could not read content.json from GitHub." });
    const currentFile = await currentResponse.json();
    const content = JSON.parse(Buffer.from(currentFile.content, "base64").toString("utf8"));

    if (req.method === "GET") return res.status(200).json({ ...content, __sha: currentFile.sha });
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const expectedSha = text(body.sha || body.revision);
    if (expectedSha && expectedSha !== currentFile.sha) {
      return res.status(409).json({ error: "Website content changed after this editor loaded. Reload before saving so newer work is not overwritten.", currentSha: currentFile.sha });
    }

    const blog = body.blog;
    const blogPosts = body.blogPosts;
    const deleteBlogPostId = text(body.deleteBlogPostId);
    const hero = body.hero;
    const events = body.events;
    const partners = body.partners;
    const resources = body.resources;
    const pageHeroes = body.pageHeroes;
    const awsHero = body.awsHero;
    const wilco = body.wilco;

    if (!blog && !deleteBlogPostId && !hero && !Array.isArray(events) && !Array.isArray(partners) && !resources && !pageHeroes && !awsHero && !wilco) {
      return res.status(400).json({ error: "Missing content to save." });
    }

    ensureLimit("Blog posts", blogPosts, LIMITS.posts);
    ensureLimit("Events", events, LIMITS.events);
    ensureLimit("Partners", partners, LIMITS.partners);
    ensureLimit("AWS hero slides", awsHero?.slides, LIMITS.slides);
    ensureLimit("Home hero slides", hero?.slides, LIMITS.slides);

    if (deleteBlogPostId) {
      const existingPosts = Array.isArray(content.blog?.posts) ? content.blog.posts.map(cleanPost) : [];
      if (!existingPosts.length) throw new Error("There are no saved blog posts to delete.");
      if (existingPosts[0].id === deleteBlogPostId) throw new Error("The current blog post cannot be deleted. Only archived posts can be removed.");
      const matches = existingPosts.reduce((count, post, index) => count + (index > 0 && post.id === deleteBlogPostId ? 1 : 0), 0);
      if (matches !== 1) throw new Error(matches ? "That archived post is not uniquely identified and was not deleted." : "That archived post no longer exists. Reload the admin page.");
      content.blog = { ...content.blog, posts: existingPosts.filter((post, index) => index === 0 || post.id !== deleteBlogPostId) };
    }

    if (blog) {
      const latest = cleanPost(blog, 0);
      if (!latest.title && !latest.description) throw new Error("A blog post needs a title or description.");
      const existingPosts = Array.isArray(content.blog?.posts) ? content.blog.posts.map(cleanPost) : [];
      const supplied = Array.isArray(blogPosts) ? blogPosts.map(cleanPost).filter((p) => p.title || p.description || p.image) : [];
      if (supplied.length) {
        const suppliedIds = new Set(supplied.map((p) => p.id));
        const preserved = existingPosts.filter((p) => !suppliedIds.has(p.id));
        content.blog = { ...content.blog, ...latest, posts: [...supplied, ...preserved].slice(0, LIMITS.posts) };
      } else {
        content.blog = { ...content.blog, ...latest, posts: [latest, ...existingPosts.slice(1)] };
      }
    }

    if (pageHeroes) {
      const pages = ["program", "resources", "partners", "events", "contact"];
      const existing = content.pageHeroes || {};
      content.pageHeroes = { ...existing };
      for (const page of pages) {
        if (!pageHeroes[page]) continue;
        const incoming = pageHeroes[page];
        const previous = existing[page] || {};
        const imageRaw = field(incoming, previous, "image");
        const image = imageRaw ? safeUrl(imageRaw) : "";
        if (imageRaw && !image) throw new Error(`Invalid image URL for ${page} page hero.`);
        content.pageHeroes[page] = {
          eyebrow: field(incoming, previous, "eyebrow"),
          title: field(incoming, previous, "title"),
          description: field(incoming, previous, "description"),
          image
        };
      }
    }

    if (resources) {
      const existing = content.resources || {};
      const next = { ...existing };
      if (own(resources, "heading")) next.heading = text(resources.heading);
      if (own(resources, "lead")) next.lead = text(resources.lead);
      if (Array.isArray(resources.cards)) {
        if (resources.cards.length > 3) throw new Error("Student Resources supports exactly three resource cards.");
        next.cards = resources.cards.map((card, index) => {
          const prev = existing.cards?.[index] || {};
          const rawLink = field(card, prev, "link") || "#";
          const link = safeUrl(rawLink);
          if (!link) throw new Error(`Invalid link in resource card ${index + 1}.`);
          return {
            title: field(card, prev, "title"),
            description: field(card, prev, "description"),
            action: field(card, prev, "action"),
            link
          };
        });
      }
      if (resources.syllabi) {
        next.syllabi = { ...(existing.syllabi || {}) };
        for (const key of ["welding1", "welding2"]) {
          if (!own(resources.syllabi, key)) continue;
          const raw = text(resources.syllabi[key]);
          if (!raw) next.syllabi[key] = "";
          else {
            const url = safeUrl(raw);
            if (!url) throw new Error(`Invalid syllabus URL for ${key}.`);
            next.syllabi[key] = url;
          }
        }
      }
      content.resources = next;
    }

    if (Array.isArray(partners)) {
      content.partners = partners.map((partner) => {
        const imageRaw = text(partner?.image);
        const linkRaw = text(partner?.link);
        const image = imageRaw ? safeUrl(imageRaw) : "";
        const link = linkRaw ? safeUrl(linkRaw) : "";
        if (imageRaw && !image) throw new Error(`Invalid partner image URL for ${text(partner?.name) || "partner"}.`);
        if (linkRaw && !link) throw new Error(`Invalid partner link for ${text(partner?.name) || "partner"}.`);
        return { name: text(partner?.name), image, link };
      }).filter((p) => p.name || p.image);
    }

    if (Array.isArray(events)) {
      content.events = events.map((event) => [
        text(Array.isArray(event) ? event[0] : event?.title),
        text(Array.isArray(event) ? event[1] : event?.date)
      ]).filter(([title, date]) => title || date);
    }

    if (awsHero) {
      const slides = own(awsHero, "slides") ? awsHero.slides : content.awsHero?.slides;
      if (!Array.isArray(slides)) throw new Error("AWS hero slides must be a list.");
      content.awsHero = { ...content.awsHero, slides: slides.map((u) => {
        const raw = text(u); if (!raw) return ""; const url = safeUrl(raw); if (!url) throw new Error("An AWS hero image URL is invalid."); return url;
      }).filter(Boolean) };
    }

    if (hero) {
      const previous = content.hero || {};
      const next = { ...previous };
      for (const key of ["eyebrow", "title", "description", "button"]) if (own(hero, key)) next[key] = text(hero[key]);
      if (own(hero, "image")) {
        const raw = text(hero.image); next.image = raw ? safeUrl(raw) : ""; if (raw && !next.image) throw new Error("The home hero image URL is invalid.");
      }
      if (own(hero, "slides")) {
        if (!Array.isArray(hero.slides)) throw new Error("Home hero slides must be a list.");
        next.slides = hero.slides.map((u) => { const raw=text(u); if(!raw) return ""; const url=safeUrl(raw); if(!url) throw new Error("A home hero slide URL is invalid."); return url; }).filter(Boolean);
      }
      if (!text(next.title) || !text(next.description)) throw new Error("The home hero requires both a title and description.");
      content.hero = next;
    }

    if (wilco) {
      const existing = content.wilco || {};
      const cleanLines = (value, fallback = []) => {
        if (!Array.isArray(value)) return fallback;
        ensureLimit("Wilco list", value, LIMITS.programs);
        return value.map(text).filter(Boolean);
      };
      const section = (incoming, previous = {}) => ({
        title: field(incoming, previous, "title"),
        description: field(incoming, previous, "description"),
        link: own(incoming, "link") ? urlField(incoming, previous, "link") : text(previous.link)
      });
      content.wilco = {
        ...existing,
        hero: wilco.hero ? {
          eyebrow: field(wilco.hero, existing.hero, "eyebrow"),
          title: field(wilco.hero, existing.hero, "title"),
          image: urlField(wilco.hero, existing.hero, "image")
        } : existing.hero,
        about: wilco.about ? section(wilco.about, existing.about) : existing.about,
        programs: own(wilco, "programs") ? cleanLines(wilco.programs) : existing.programs,
        scholarship: wilco.scholarship ? section(wilco.scholarship, existing.scholarship) : existing.scholarship,
        handbook: wilco.handbook ? section(wilco.handbook, existing.handbook) : existing.handbook,
        schools: wilco.schools ? { ...section(wilco.schools, existing.schools), items: own(wilco.schools, "items") ? cleanLines(wilco.schools.items) : existing.schools?.items } : existing.schools,
        contact: wilco.contact ? {
          title: field(wilco.contact, existing.contact, "title"),
          address: field(wilco.contact, existing.contact, "address"),
          phone: field(wilco.contact, existing.contact, "phone"),
          hours: field(wilco.contact, existing.contact, "hours"),
          link: urlField(wilco.contact, existing.contact, "link")
        } : existing.contact,
        media: wilco.media ? {
          title: field(wilco.media, existing.media, "title"),
          description: field(wilco.media, existing.media, "description"),
          facebook: urlField(wilco.media, existing.media, "facebook"),
          linkedin: urlField(wilco.media, existing.media, "linkedin")
        } : existing.media
      };
    }

    const updatedContent = JSON.stringify(content, null, 2) + "\n";
    const updateResponse = await fetch(githubUrl.replace("?ref=main", ""), {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Update website content from Wilco Welding Admin",
        content: Buffer.from(updatedContent, "utf8").toString("base64"),
        sha: currentFile.sha,
        branch: "main"
      })
    });
    const updateResult = await updateResponse.json();
    if (!updateResponse.ok) return res.status(updateResponse.status).json({ error: updateResult?.message || "GitHub could not save the changes." });

    return res.status(200).json({
      success: true,
      message: "Saved to GitHub. Vercel deployment happens separately.",
      commit: updateResult.commit?.sha || null,
      sha: updateResult.content?.sha || null
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unexpected server error while saving website content.";
    return res.status(400).json({ error: message });
  }
}
