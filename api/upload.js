import { put } from "@vercel/blob";
import { requireAdmin } from "./auth.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
};

function cleanFilename(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120) || "photo";
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const contentType = String(req.headers["content-type"] || "").split(";")[0];
  if (!contentType.startsWith("image/")) {
    return res.status(400).json({ error: "Only image uploads are allowed." });
  }

  if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: "Image data is required." });
  }

  const rawFilename = decodeURIComponent(String(req.headers["x-filename"] || "photo"));
  const pathname = `uploads/${Date.now()}-${cleanFilename(rawFilename)}`;

  try {
    const blob = await put(pathname, req.body, {
      access: "public",
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return res.status(201).json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    console.error("Blob upload failed:", error);
    return res.status(500).json({ error: "Could not upload the image." });
  }
}
