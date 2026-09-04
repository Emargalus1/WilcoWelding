import { handleUpload } from "@vercel/blob/client";
import { requireAdmin } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return null; } })() : req.body;
  const eventType = body?.type;

  // Token requests are admin-only. Completion callbacks are authenticated by the Blob SDK signature.
  if (eventType === "blob.generate-client-token" && !requireAdmin(req, res)) return;

  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ source: "wilco-admin" })
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log("Wilco Welding image upload completed:", blob?.url || "unknown URL");
      }
    });
    return res.status(200).json(json);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: "Could not authorize or complete the image upload." });
  }
}
