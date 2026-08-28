import { handleUpload } from "@vercel/blob/client";
import { requireAdmin, validAdminToken } from "./auth.js";

function payload(req) {
  try { return (typeof req.body === "string" ? JSON.parse(req.body) : req.body)?.clientPayload || ""; } catch { return ""; }
}

export default async function handler(req, res) {
  if (!validAdminToken(payload(req)) && !requireAdmin(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const json = await handleUpload({
      body: req.body, request: req,
      onBeforeGenerateToken: async () => ({ allowedContentTypes:["image/jpeg","image/png","image/webp","image/gif"], maximumSizeInBytes:10485760, addRandomSuffix:true })
    });
    return res.status(200).json(json);
  } catch (error) {
    console.error(error); return res.status(400).json({ error: "Could not authorize the image upload." });
  }
}
