/**
 * api/_lib/kv.js — tiny Upstash / Vercel KV REST client (zero dependencies).
 *
 * Production storage (first match wins):
 *   KV_REST_API_URL      + KV_REST_API_TOKEN            (Vercel KV integration)
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN   (manual Upstash)
 *
 * Local development only:
 *   TP_KV_FILE=/abs/path/kv.json   (set automatically by tools/dev-api-plugin.mjs)
 */

import fs from "node:fs";

const devFile = () => (process.env.TP_KV_FILE ? process.env.TP_KV_FILE : null);

function readDevFile() {
  try {
    return JSON.parse(fs.readFileSync(devFile(), "utf8")) || {};
  } catch {
    return {};
  }
}
function writeDevFile(obj) {
  fs.writeFileSync(devFile(), JSON.stringify(obj, null, 2));
}

export function kvEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;
  return { url: String(url).replace(/\/+$/, ""), token: String(token) };
}

async function call(env, path, init = {}) {
  const res = await fetch(`${env.url}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.token}`,
      ...(init.headers || {})
    },
    cache: "no-store"
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`KV ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json().catch(() => ({}));
}

/** @returns {Promise<string|null>} raw string value */
export async function kvGetRaw(env, key) {
  const file = devFile();
  if (file) {
    const db = readDevFile();
    return Object.prototype.hasOwnProperty.call(db, key) ? db[key] : null;
  }
  if (!env) throw new Error("KV not configured");
  const j = await call(env, `get/${encodeURIComponent(key)}`);
  if (!j || j.result === null || j.result === undefined) return null;
  return typeof j.result === "string" ? j.result : JSON.stringify(j.result);
}

/** JSON value helper — tolerates legacy values stored as objects */
export async function kvGetJson(env, key) {
  const raw = await kvGetRaw(env, key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** write several keys in one round trip (Upstash pipeline) */
export async function kvSetMany(env, entries) {
  const file = devFile();
  if (file) {
    const db = readDevFile();
    for (const [key, value] of entries) db[key] = typeof value === "string" ? value : JSON.stringify(value);
    writeDevFile(db);
    return true;
  }
  if (!env) throw new Error("KV not configured");
  const commands = entries.map(([key, value]) => ["SET", key, typeof value === "string" ? value : JSON.stringify(value)]);
  const j = await call(env, "pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(commands)
  });
  if (Array.isArray(j)) {
    const bad = j.find((x) => x && x.error);
    if (bad) throw new Error(`KV pipeline error: ${String(bad.error).slice(0, 120)}`);
  }
  return true;
}

export async function kvDel(env, keys) {
  const file = devFile();
  if (file) {
    const db = readDevFile();
    for (const key of keys) delete db[key];
    writeDevFile(db);
    return true;
  }
  if (!env) throw new Error("KV not configured");
  const commands = keys.map((key) => ["DEL", key]);
  const j = await call(env, "pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(commands)
  });
  if (Array.isArray(j)) {
    const bad = j.find((x) => x && x.error);
    if (bad) throw new Error(`KV pipeline error: ${String(bad.error).slice(0, 120)}`);
  }
  return true;
}

export function kvStorageConfigured() {
  return !!devFile() || !!kvEnv();
}

/* ───────────────────────── diagnostics ───────────────────────── */

const URL_VARS = ["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "KV_URL", "REDIS_URL"];
const TOKEN_VARS = ["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_READ_ONLY_TOKEN"];

/**
 * Safe, secret-free report of what the deployment actually received.
 * Variable NAMES and booleans only — never a token or a full URL.
 */
export function kvDiagnostics() {
  const present = (name) => {
    const v = process.env[name];
    return typeof v === "string" && v.trim().length > 0;
  };

  const urlVars = URL_VARS.filter(present);
  const tokenVars = TOKEN_VARS.filter(present);
  const restUrl = ["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"].find(present) || null;
  const restToken = ["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"].find(present) || null;
  const file = devFile();

  let provider = "none";
  if (file) provider = "file";
  else if (restUrl && restToken) provider = restUrl.startsWith("UPSTASH") ? "upstash" : "vercel-kv";

  // A "redis://" style URL (KV_URL / REDIS_URL) is NOT a REST url — flag it.
  const onlyTcpUrl = !restUrl && urlVars.length > 0;

  const missing = [];
  if (!file && !restUrl) missing.push("KV_REST_API_URL (ya UPSTASH_REDIS_REST_URL)");
  if (!file && !restToken) missing.push("KV_REST_API_TOKEN (ya UPSTASH_REDIS_REST_TOKEN)");

  let hint = "";
  if (provider === "none") {
    if (onlyTcpUrl) {
      hint = `${urlVars[0]} mila, par ye TCP url hai — is app ko REST url chahiye. Vercel → Storage se Upstash Redis connect karo (KV_REST_API_URL / KV_REST_API_TOKEN).`;
    } else if (urlVars.length || tokenVars.length) {
      hint = "Aadhe variables mile hain — URL aur TOKEN dono chahiye. Vercel → Settings → Environment Variables check karo, phir Redeploy.";
    } else {
      hint = "Koi KV variable hi nahi mila. Vercel → Storage → Upstash Redis → Connect to Project, phir Redeploy (env vars sirf naye deployment par lagte hain).";
    }
  }

  return {
    configured: !!file || !!(restUrl && restToken),
    provider,
    urlVar: restUrl,
    tokenVar: restToken,
    presentVars: [...urlVars, ...tokenVars],
    missing,
    needsRedeployLikely: !file && urlVars.length === 0 && tokenVars.length === 0,
    hint,
    envKeysSeen: Object.keys(process.env).filter((k) => /KV|UPSTASH|REDIS/i.test(k)).length
  };
}
