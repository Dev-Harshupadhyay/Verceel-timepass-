/**
 * /api/pricing  —  live pricing + site settings store
 *
 *  GET   → saved config return karta hai  ({} agar kuch save nahi hai)
 *  POST  → config save karta hai (admin password chahiye)
 *
 *  Storage: Upstash Redis REST API (Vercel KV integration ise auto-provide karta hai).
 *  Koi npm package nahi chahiye — plain fetch use hota hai.
 *
 *  Required env vars:
 *    ADMIN_PASSWORD      — admin panel ka password
 *    KV_REST_API_URL     — Upstash/Vercel KV REST URL
 *    KV_REST_API_TOKEN   — Upstash/Vercel KV REST token
 *
 *  Agar KV env vars set nahi hain to GET {configured:false} deta hai aur
 *  POST 501 deta hai — website tab bhi normal chalti rahegi (code wali
 *  default prices use hongi), bas "SAVE LIVE" kaam nahi karega.
 */

const KEY = "timepass:config";

function kvEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function kvGet(env) {
  const r = await fetch(`${env.url}/get/${encodeURIComponent(KEY)}`, {
    headers: { Authorization: `Bearer ${env.token}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`KV get failed: ${r.status}`);
  const j = await r.json();
  if (!j || j.result == null) return null;
  try {
    return typeof j.result === "string" ? JSON.parse(j.result) : j.result;
  } catch {
    return null;
  }
}

async function kvSet(env, value) {
  const r = await fetch(`${env.url}/set/${encodeURIComponent(KEY)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.token}`,
      "Content-Type": "text/plain",
    },
    body: JSON.stringify(value),
  });
  if (!r.ok) throw new Error(`KV set failed: ${r.status}`);
  return true;
}

/* ---------- validation: sirf expected shape hi save hogi ---------- */
const PACKS = ["movies", "adult", "combo"];

function clean(payload) {
  const out = { pricing: {}, site: {}, updatedAt: new Date().toISOString() };

  const p = payload && payload.pricing;
  if (p && typeof p === "object") {
    for (const k of PACKS) {
      const pack = p[k];
      if (!pack || !Array.isArray(pack.plans)) continue;
      const plans = pack.plans.slice(0, 4).map((x) => ({
        n: String(x.n || "").slice(0, 24),
        p: Math.max(0, Math.min(999999, Math.round(Number(x.p) || 0))),
        b: /^pl_[A-Za-z0-9]{6,32}$/.test(String(x.b || "")) ? String(x.b) : "",
      }));
      if (plans.length) out.pricing[k] = { plans };
    }
  }

  const s = payload && payload.site;
  if (s && typeof s === "object") {
    const str = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : undefined);
    const fields = {
      upi: 80, tagline: 80, telegram: 40, channel: 60, bot: 40, razorpay: 60, email: 80,
    };
    for (const [key, max] of Object.entries(fields)) {
      const v = str(s[key], max);
      if (v !== undefined && v !== "") out.site[key] = v;
    }
  }

  return out;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const env = kvEnv();

  /* ─────────── READ ─────────── */
  if (req.method === "GET") {
    if (!env) return res.status(200).json({ configured: false, data: null });
    try {
      const data = await kvGet(env);
      return res.status(200).json({ configured: true, data });
    } catch (e) {
      return res.status(200).json({ configured: true, data: null, error: "read_failed" });
    }
  }

  /* ─────────── WRITE ─────────── */
  if (req.method === "POST") {
    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }

    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) return res.status(500).json({ error: "ADMIN_PASSWORD env var set nahi hai" });
    if (typeof body.password !== "string" || body.password !== expected) {
      return res.status(401).json({ error: "Galat password" });
    }

    if (!env) {
      return res.status(501).json({
        error: "KV storage configured nahi hai",
        hint: "Vercel → Storage → KV create karo, ya code mein PRICING edit karke push karo.",
      });
    }

    try {
      const value = clean(body);
      await kvSet(env, value);
      return res.status(200).json({ ok: true, data: value });
    } catch (e) {
      return res.status(500).json({ error: "Save fail ho gaya" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
