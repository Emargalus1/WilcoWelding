import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_SECONDS = 8 * 60 * 60;
const TOKEN_RE = /^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/;

function deny(res) {
  res.setHeader("WWW-Authenticate", 'Basic realm="Wilco Welding Admin", charset="UTF-8"');
  res.status(401).json({ error: "Admin authentication is required." });
  return false;
}

function getCookie(req) {
  return (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("wilco_admin="))
    ?.slice(12) || "";
}

function sign(payload, password) {
  return createHmac("sha256", password).update(payload).digest("hex");
}

function safeEqualText(a, b) {
  const left = Buffer.from(String(a), "utf8");
  const right = Buffer.from(String(b), "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function adminToken(now = Date.now()) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return "";
  const expires = Math.floor(now / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ exp: expires }), "utf8").toString("base64url");
  return `${payload}.${sign(payload, password)}`;
}

export function validAdminToken(value, now = Date.now()) {
  try {
    const password = process.env.ADMIN_PASSWORD;
    if (!password || !value || !TOKEN_RE.test(String(value))) return false;
    const [payload, suppliedSignature] = String(value).split(".");
    const expectedSignature = sign(payload, password);
    if (!safeEqualText(suppliedSignature, expectedSignature)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const exp = Number(data?.exp);
    return Number.isFinite(exp) && exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function clearAdminSession(res) {
  res.setHeader("Set-Cookie", "wilco_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
}

export function requireAdmin(req, res) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    res.status(500).json({ error: "ADMIN_PASSWORD is not configured." });
    return false;
  }

  if (validAdminToken(getCookie(req))) return true;

  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return deny(res);

  try {
    const credentials = Buffer.from(header.slice(6), "base64").toString("utf8");
    if (!safeEqualText(credentials, `admin:${password}`)) return deny(res);
  } catch {
    return deny(res);
  }

  const token = adminToken();
  res.setHeader("Set-Cookie", `wilco_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`);
  return true;
}
