import { timingSafeEqual } from "node:crypto";

function unauthorized(res) {
  res.setHeader("WWW-Authenticate", 'Basic realm="Wilco Welding Admin", charset="UTF-8"');
  return res.status(401).json({ error: "Admin authentication is required." });
}

export function requireAdmin(req, res) {
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return res.status(500).json({ error: "ADMIN_PASSWORD is not configured." });
  }

  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Basic ")) {
    unauthorized(res);
    return false;
  }

  let credentials;
  try {
    credentials = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  } catch {
    unauthorized(res);
    return false;
  }

  const separator = credentials.indexOf(":");
  const username = separator >= 0 ? credentials.slice(0, separator) : "";
  const password = separator >= 0 ? credentials.slice(separator + 1) : "";
  const supplied = Buffer.from(`${username}:${password}`);
  const expected = Buffer.from(`admin:${expectedPassword}`);

  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    unauthorized(res);
    return false;
  }

  return true;
}
