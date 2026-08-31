import { requireAdmin } from "./auth.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "GITHUB_TOKEN is not configured in Vercel."
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const blog = body?.blog;
    const blogPosts = body?.blogPosts;
    const hero = body?.hero;
    const events = body?.events;

    if (!blog && !hero && !Array.isArray(events)) {
      return res.status(400).json({ error: "Missing content to save." });
    }

    const githubUrl =
      "https://api.github.com/repos/Emargalus1/WilcoWelding/contents/content.json?ref=main";

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Wilco-Welding-Admin"
    };

    const currentResponse = await fetch(githubUrl, {
      headers
    });

    if (!currentResponse.ok) {
      return res.status(currentResponse.status).json({
        error: "Could not read content.json from GitHub."
      });
    }

    const currentFile = await currentResponse.json();

    const currentContent = Buffer.from(
      currentFile.content,
      "base64"
    ).toString("utf8");

    const content = JSON.parse(currentContent);

    if (blog) {
      const cleanPost = (post) => ({
        eyebrow: String(post?.eyebrow || ""),
        title: String(post?.title || ""),
        description: String(post?.description || ""),
        button: String(post?.button || ""),
        image: String(post?.image || ""),
        link: String(post?.link || "#")
      });

      const latestPost = cleanPost(blog);
      const suppliedPosts = Array.isArray(blogPosts)
        ? blogPosts.map(cleanPost).filter((post) =>
            post.title || post.description || post.image
          ).slice(0, 5)
        : [];

      const existingPosts = Array.isArray(content.blog?.posts)
        ? content.blog.posts.map(cleanPost)
        : [];

      const posts = suppliedPosts.length
        ? suppliedPosts
        : [latestPost, ...existingPosts.slice(1)].slice(0, 5);

      content.blog = {
        ...content.blog,
        ...latestPost,
        posts
      };
    }

    if (Array.isArray(events)) {
      content.events = events
        .map((event) => [
          String(Array.isArray(event) ? event[0] || "" : event?.title || "").trim(),
          String(Array.isArray(event) ? event[1] || "" : event?.date || "").trim()
        ])
        .filter(([title, date]) => title || date)
        .slice(0, 20);
    }

    if (hero) {
      content.hero = {
        ...content.hero,
        eyebrow: String(hero.eyebrow || ""),
        title: String(hero.title || ""),
        description: String(hero.description || ""),
        button: String(hero.button || ""),
        image: String(hero.image || ""),
        slides: Array.isArray(hero.slides)
          ? hero.slides.map((url) => String(url || "").trim()).filter(Boolean).slice(0, 8)
          : (Array.isArray(content.hero?.slides) ? content.hero.slides : [])
      };
    }

    const updatedContent =
      JSON.stringify(content, null, 2) + "\n";

    const updateResponse = await fetch(githubUrl, {
      method: "PUT",

      headers: {
        ...headers,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: "Update homepage content from Wilco Welding Admin",

        content: Buffer.from(
          updatedContent,
          "utf8"
        ).toString("base64"),

        sha: currentFile.sha,

        branch: "main"
      })
    });

    const updateResult =
      await updateResponse.json();

    if (!updateResponse.ok) {
      console.error(
        "GitHub update failed:",
        updateResult
      );

      return res.status(updateResponse.status).json({
        error: "GitHub could not save the changes."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Website content saved to GitHub.",
      commit: updateResult.commit?.sha || null
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Unexpected server error while saving website content."
    });
  }
}
