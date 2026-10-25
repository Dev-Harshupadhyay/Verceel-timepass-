/**
 * /api/pricing — public config read + authenticated Live Studio actions.
 *
 *  GET                                  → public config (no secrets, no-store)
 *  POST { password, action:"publish",  config }   → publish a new revision
 *  POST { password, action:"history" }            → last N revisions (metadata)
 *  POST { password, action:"revision", id }       → full config of a revision
 *  POST { password, action:"restore",  id }       → restore + publish
 *  POST { password, action:"reset" }              → delete live config (code defaults)
 *  POST { pricing, site }                         → legacy v1 save (migrated)
 *
 * Env: ADMIN_PASSWORD, KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN
 */

import { createHash, timingSafeEqual } from "node:crypto";
import {
  CONFIG_VERSION,
  CONFIG_KEY,
  HISTORY_KEY,
  MAX_REVISIONS,
  MAX_HISTORY_BYTES,
  MAX_BODY_BYTES,
  normalizeAny,
  summarizeChanges,
  deepClone,
  isPlainObject
} from "./_lib/config-schema.js";
import { DEFAULT_CONFIG } from "./_lib/defaults.js";
import { kvGetJson, kvSetMany, kvDel, kvEnv, kvStorageConfigured, kvDiagnostics } from "./_lib/kv.js";

/* ─────────────────────────── helpers ─────────────────────────── */

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.setHeader("Pragma", "no-cache");
}

function parseBody(req) {
  const raw = typeof req.body === "string" ? req.body : null;
  if (raw !== null) {
    if (raw.length > MAX_BODY_BYTES) return { error: "payload_too_large" };
    try {
      return { body: JSON.parse(raw || "{}") };
    } catch {
      return { error: "invalid_json" };
    }
  }
  if (req.body && typeof req.body === "object") {
    try {
      if (JSON.stringify(req.body).length > MAX_BODY_BYTES) return { error: "payload_too_large" };
    } catch {
      return { error: "invalid_json" };
    }
    return { body: req.body };
  }
  return { body: {} };
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

/* very small best-effort throttle (per warm instance) */
const attempts = new Map();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 25;

/** Is this IP over the failure budget? (only wrong passwords are counted) */
function throttled(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) return false;
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailure(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    attempts.set(ip, { start: now, count: 1 });
    return;
  }
  rec.count += 1;
}

function clientIp(req) {
  const h = (req.headers && (req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) || "";
  return String(h).split(",")[0].trim() || "unknown";
}

function authorize(req, body, res) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    res.status(500).json({ error: "ADMIN_PASSWORD env var set nahi hai", hint: "Vercel → Settings → Environment Variables" });
    return false;
  }
  const ip = clientIp(req);
  if (throttled(ip)) {
    res.status(429).json({ error: "Bahut zyada attempts — 5 minute baad try karo" });
    return false;
  }
  if (!safeEqual(body.password, expected)) {
    recordFailure(ip);
    res.status(401).json({ error: "Galat password" });
    return false;
  }
  return true;
}

function publicPayload(config) {
  return {
    v: CONFIG_VERSION,
    revision: config.revision || 0,
    updatedAt: config.updatedAt || null,
    source: "kv"
  };
}

function trimHistory(items) {
  let list = items.slice(0, MAX_REVISIONS);
  while (list.length > 1 && JSON.stringify(list).length > MAX_HISTORY_BYTES) list = list.slice(0, list.length - 1);
  return list;
}

function revisionList(history) {
  return (Array.isArray(history) ? history : []).map((h) => ({
    id: h.id,
    at: h.at,
    sections: h.summary && Array.isArray(h.summary.sections) ? h.summary.sections : [],
    prices: h.summary && Array.isArray(h.summary.prices) ? h.summary.prices : [],
    source: h.source || "publish",
    restoredFrom: h.restoredFrom || null
  }));
}

/** Validation that tolerates empty optional fields but rejects anything unsafe. */
function validate(input) {
  const { config, errors } = normalizeAny(input);
  return { config, errors };
}

async function loadCurrent(env) {
  const raw = await kvGetJson(env, CONFIG_KEY);
  if (!raw) return { config: deepClone(DEFAULT_CONFIG), raw: null };
  const { config } = normalizeAny(raw);
  return { config, raw };
}

/* ─────────────────────────── handler ─────────────────────────── */

export default async function handler(req, res) {
  noStore(res);

  const configured = kvStorageConfigured();
  const env = kvEnv();

  /* ───────────── READ (public) ───────────── */
  if (req.method === "GET" || req.method === "HEAD") {
    if (!configured) {
      const diag = kvDiagnostics();
      return res.status(200).json({
        ok: true,
        configured: false,
        data: null,
        revision: 0,
        updatedAt: null,
        storage: { configured: false, provider: diag.provider, missing: diag.missing, hint: diag.hint }
      });
    }
    try {
      const stored = await kvGetJson(env, CONFIG_KEY);
      if (!stored) {
        return res.status(200).json({
          ok: true,
          configured: true,
          data: null,
          revision: 0,
          updatedAt: null,
          defaultsRevision: 1
        });
      }
      const { config } = normalizeAny(stored);
      return res.status(200).json({
        ok: true,
        configured: true,
        data: config,
        ...publicPayload(config),
        migrated: Number(stored.v) < 2
      });
    } catch (e) {
      // KV down → the website must keep working with code defaults.
      return res.status(200).json({
        ok: true,
        configured: true,
        data: null,
        error: "read_failed",
        message: "Live data abhi read nahi ho paya — code defaults use ho rahe hain."
      });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  /* ───────────── WRITE ───────────── */
  const parsed = parseBody(req);
  if (parsed.error === "payload_too_large") return res.status(413).json({ error: "Config bahut bada hai" });
  if (parsed.error === "invalid_json") return res.status(400).json({ error: "Invalid JSON" });

  const body = parsed.body || {};
  if (!authorize(req, body, res)) return;

  const action = typeof body.action === "string" ? body.action : "publish";

  if (!configured) {
    const diag = kvDiagnostics();
    return res.status(501).json({
      error: "KV storage configured nahi hai",
      hint: diag.hint,
      storage: diag
    });
  }

  try {
    /* ── storage diagnostics (auth) ── */
    if (action === "status") {
      const diag = kvDiagnostics();
      let ping = null;
      if (diag.configured) {
        try {
          await kvGetJson(kvEnv(), CONFIG_KEY);
          ping = "ok";
        } catch (e) {
          ping = `failed: ${String((e && e.message) || e).slice(0, 140)}`;
        }
      }
      return res.status(200).json({ ok: true, storage: diag, ping });
    }

    /* ── history / revision are reads but need auth ── */
    if (action === "history") {
      const history = await kvGetJson(env, HISTORY_KEY);
      const current = await loadCurrent(env);
      return res.status(200).json({
        ok: true,
        revisions: revisionList(history),
        current: { revision: current.config.revision || 0, updatedAt: current.config.updatedAt || null },
        max: MAX_REVISIONS
      });
    }

    if (action === "revision") {
      const id = Number(body.id);
      const history = await kvGetJson(env, HISTORY_KEY);
      const hit = (Array.isArray(history) ? history : []).find((h) => Number(h.id) === id);
      if (!hit) return res.status(404).json({ error: "Revision nahi mila" });
      const { config } = normalizeAny(hit.config);
      return res.status(200).json({ ok: true, id, at: hit.at, data: config });
    }

    /* ── reset ── */
    if (action === "reset") {
      await kvDel(env, [CONFIG_KEY]);
      return res.status(200).json({
        ok: true,
        reset: true,
        data: deepClone(DEFAULT_CONFIG),
        revision: 0,
        updatedAt: null,
        message: "Live config delete ho gaya — site ab code defaults par hai."
      });
    }

    /* ── restore ── */
    if (action === "restore") {
      const id = Number(body.id);
      const history = await kvGetJson(env, HISTORY_KEY);
      const hit = (Array.isArray(history) ? history : []).find((h) => Number(h.id) === id);
      if (!hit) return res.status(404).json({ error: "Revision nahi mila" });

      const { config: restored, errors } = validate(hit.config);
      if (errors.length) {
        return res.status(422).json({ error: "Purani revision valid nahi hai", details: errors.slice(0, 20) });
      }
      return publish(env, restored, history, { source: "restore", restoredFrom: id, res });
    }

    /* ── publish (and legacy v1 shape) ── */
    const payload = isPlainObject(body.config) ? body.config : body;
    const { config: next, errors } = validate(payload);

    if (errors.length) {
      return res.status(422).json({
        error: "Config valid nahi hai",
        details: errors.slice(0, 20),
        hint: "Neeche diye fields theek karo (URL, UPI id, Telegram username, price)."
      });
    }

    const history = await kvGetJson(env, HISTORY_KEY);
    return publish(env, next, history, { source: body.restoredFrom ? "publish" : "publish", res });
  } catch (e) {
    return res.status(500).json({
      error: "Server error",
      message: String((e && e.message) || e).slice(0, 200)
    });
  }
}

async function publish(env, next, historyIn, { source = "publish", restoredFrom = null, res }) {
  const current = await loadCurrent(env);
  const summary = summarizeChanges(current.config, next);

  const revision = Math.max(
    Number(current.config.revision) || 0,
    ...(Array.isArray(historyIn) ? historyIn.map((h) => Number(h.id) || 0) : [0])
  ) + 1;

  const now = new Date().toISOString();
  const finalConfig = {
    ...deepClone(next),
    v: CONFIG_VERSION,
    revision,
    updatedAt: now
  };
  if (restoredFrom != null) finalConfig.restoredFrom = restoredFrom;

  const entry = {
    id: revision,
    at: now,
    summary,
    source,
    restoredFrom,
    config: finalConfig
  };

  const history = trimHistory([entry, ...(Array.isArray(historyIn) ? historyIn : [])]);

  await kvSetMany(env, [
    [CONFIG_KEY, JSON.stringify(finalConfig)],
    [HISTORY_KEY, JSON.stringify(history)]
  ]);

  return res.status(200).json({
    ok: true,
    data: finalConfig,
    revision,
    updatedAt: now,
    summary,
    live: true
  });
}
