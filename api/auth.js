import { createHmac, timingSafeEqual } from "node:crypto";

function deny(res) {
  res.setHeader("WWW-Authenticate", 'Basic realm="Wilco Welding Admin", charset="UTF-8"');
  return res.status(401).json({ error: "Admin authentication is required." });
}

function cookie(req) {
  return (req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith("wilco_admin="))?.slice(12) || "";
}

export function adminToken() {
  const password = process.env.ADMIN_PASSWORD;
  return password ? createHmac("sha256", password).update("wilco-admin").digest("hex") : "";
}

export function validAdminToken(value) {
  const token = adminToken();
  return Boolean(value) && value.length === token.length && timingSafeEqual(Buffer.from(value), Buffer.from(token));
}

export function requireAdmin(req, res) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return res.status(500).json({ error: "ADMIN_PASSWORD is not configured." });
  const token = adminToken();
  if (validAdminToken(cookie(req))) return true;
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return deny(res), false;
  const credentials = Buffer.from(header.slice(6), "base64").toString("utf8");
  const supplied = Buffer.from(credentials);
  const expected = Buffer.from("admin:" + password);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return deny(res), false;
  res.setHeader("Set-Cookie", "wilco_admin=" + token + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800");
  return true;
}
