import { requireAdmin } from "./auth.js";

const ALLOWED_PAGES = new Set([
  "index.html",
  "welding-program.html",
  "student-resources.html",
  "aws.html",
  "wilco-area-career-center.html",
  "employers-partners.html",
  "blog.html",
  "blog-archive.html",
  "events.html",
  "contact.html",
  "syllabi.html"
]);

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

  const page = String(req.method === "GET" ? req.query?.page || "" : req.body?.page || "").trim();
  if (!ALLOWED_PAGES.has(page)) return res.status(400).json({ error: "That page is not available in the page editor." });

  const githubUrl = `https://api.github.com/repos/Emargalus1/WilcoWelding/contents/${encodeURIComponent(page)}?ref=main`;
  const headers = githubHeaders(token);

  try {
    if (req.method === "GET") {
      const response = await fetch(githubUrl, { headers });
      const file = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: "Could not load the page from GitHub." });
      const html = Buffer.from(file.content, "base64").toString("utf8");
      return res.status(200).json({ page, html, sha: file.sha });
    }

    if (req.method === "POST") {
      const html = String(req.body?.html || "");
      if (!html || html.length < 100) return res.status(400).json({ error: "The page content is empty or incomplete." });

      const currentResponse = await fetch(githubUrl, { headers });
      const currentFile = await currentResponse.json();
      if (!currentResponse.ok) return res.status(currentResponse.status).json({ error: "Could not read the current page from GitHub." });

      const updateResponse = await fetch(githubUrl.replace("?ref=main", ""), {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Update ${page} from full page admin`,
          content: Buffer.from(html, "utf8").toString("base64"),
          sha: currentFile.sha,
          branch: "main"
        })
      });
      const result = await updateResponse.json();
      if (!updateResponse.ok) return res.status(updateResponse.status).json({ error: result?.message || "GitHub could not save the page." });
      return res.status(200).json({ success: true, commit: result.commit?.sha || null });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unexpected error while editing the page." });
  }
}
