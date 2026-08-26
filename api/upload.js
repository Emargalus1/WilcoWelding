import { handleUpload } from "@vercel/blob/client";
import { requireAdmin } from "./auth.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log("Blob upload completed", { pathname: blob.pathname });
      }
    });

    return res.status(200).json(json);
  } catch (error) {
    console.error("Blob upload authorization failed:", error);
    return res.status(400).json({ error: "Could not authorize the image upload." });
  }
}
