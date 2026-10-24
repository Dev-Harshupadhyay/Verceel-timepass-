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
