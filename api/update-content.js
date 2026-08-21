export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "GITHUB_TOKEN is not configured in Vercel."
    });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const hero = body?.hero;

    if (!hero) {
      return res.status(400).json({
        error: "Missing hero content."
      });
    }

    const githubUrl =
      "https://api.github.com/repos/Emargalus1/WilcoWelding/contents/content.json?ref=working-homepage";

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Wilco-Welding-Admin"
    };

    const currentResponse = await fetch(githubUrl, { headers });

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

    content.hero = {
      ...content.hero,
      eyebrow: String(hero.eyebrow || ""),
      title: String(hero.title || ""),
      description: String(hero.description || ""),
      button: String(hero.button || ""),
      image: String(hero.image || "")
    };

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
        branch: "working-homepage"
      })
    });

    const updateResult = await updateResponse.json();

    if (!updateResponse.ok) {
      return res.status(updateResponse.status).json({
        error: "GitHub could not save the changes."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Homepage content saved to GitHub.",
      commit: updateResult.commit?.sha || null
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Unexpected server error while saving homepage content."
    });
  }
}
