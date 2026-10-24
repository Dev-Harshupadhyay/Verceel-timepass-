import { createHash, timingSafeEqual } from "node:crypto";

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

const attempts = new Map();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 25;

function throttled(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    attempts.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const password = body.password;
    const expected = process.env.ADMIN_PASSWORD;

    const ip = String((req.headers && (req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) || "unknown")
      .split(",")[0]
      .trim();

    if (throttled(ip)) return res.status(429).json({ ok: false, error: "Too many attempts" });

    if (!expected) {
      return res.status(500).json({ ok: false, error: "ADMIN_PASSWORD env var set nahi hai" });
    }

    const ok = safeEqual(password, expected);
    return res.status(ok ? 200 : 401).json({ ok });
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid request" });
  }
}
