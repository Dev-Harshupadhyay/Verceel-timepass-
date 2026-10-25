// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import handler from "../api/pricing.js";
import { DEFAULT_CONFIG } from "../api/_lib/defaults.js";
import { normalizeConfig } from "../api/_lib/config-schema.js";

let dir = "";
let kvFile = "";
/* generated per run — no credential-shaped literal in the repo */
const PASSWORD = `fixture-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function makeRes() {
  const res: any = { statusCode: 200, headers: {} as Record<string, string>, body: undefined };
  res.setHeader = (k: string, v: string) => {
    res.headers[k.toLowerCase()] = v;
    return res;
  };
  res.status = (c: number) => {
    res.statusCode = c;
    return res;
  };
  res.json = (o: unknown) => {
    res.body = o;
    return res;
  };
  return res;
}

async function call(method: string, body: unknown = undefined) {
  const res = makeRes();
  await handler({ method, body, headers: {} } as any, res as any);
  return res;
}

const valid = () => normalizeConfig(DEFAULT_CONFIG).config;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "tp-kv-"));
  kvFile = path.join(dir, "kv.json");
  fs.writeFileSync(kvFile, "{}");
  process.env.TP_KV_FILE = kvFile;
  process.env.ADMIN_PASSWORD = PASSWORD;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

afterEach(() => {
  delete process.env.TP_KV_FILE;
  delete process.env.ADMIN_PASSWORD;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe("GET /api/pricing", () => {
  it("returns no-store headers", async () => {
    const res = await call("GET");
    expect(res.statusCode).toBe(200);
    expect(res.headers["cache-control"]).toContain("no-store");
  });

  it("reports configured:false when there is no storage at all", async () => {
    delete process.env.TP_KV_FILE;
    const res = await call("GET");
    expect(res.statusCode).toBe(200);
    expect(res.body.configured).toBe(false);
    expect(res.body.data).toBeNull();
  });

  it("returns null data before anything is published", async () => {
    const res = await call("GET");
    expect(res.body.configured).toBe(true);
    expect(res.body.data).toBeNull();
  });

  it("never leaks the admin password", async () => {
    await call("POST", { password: PASSWORD, action: "publish", config: valid() });
    const res = await call("GET");
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain(PASSWORD);
    expect(raw).not.toContain("ADMIN_PASSWORD");
  });
});

describe("POST auth", () => {
  it("rejects a missing password", async () => {
    const res = await call("POST", { action: "publish", config: valid() });
    expect(res.statusCode).toBe(401);
    expect(res.body.ok).toBeUndefined();
  });

  it("rejects a wrong password", async () => {
    const res = await call("POST", { password: "nope", action: "publish", config: valid() });
    expect(res.statusCode).toBe(401);
  });

  it("requires auth for history / restore / reset", async () => {
    for (const action of ["history", "restore", "reset"]) {
      const res = await call("POST", { action, id: 1 });
      expect(res.statusCode).toBe(401);
    }
  });

  it("fails closed when ADMIN_PASSWORD is missing", async () => {
    delete process.env.ADMIN_PASSWORD;
    const res = await call("POST", { password: "wrong-value", action: "publish", config: valid() });
    expect(res.statusCode).toBe(500);
  });
});

describe("POST publish", () => {
  it("rejects invalid config with details", async () => {
    const cfg: any = JSON.parse(JSON.stringify(valid()));
    cfg.hero.image = "javascript:alert(1)";
    const res = await call("POST", { password: PASSWORD, action: "publish", config: cfg });
    expect(res.statusCode).toBe(422);
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it("publishes and bumps revision", async () => {
    const res = await call("POST", { password: PASSWORD, action: "publish", config: valid() });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.revision).toBe(1);
    expect(res.body.data.packs.movies.plans[0].price).toBe(50);
  });

  it("stores history and lets the admin read it", async () => {
    await call("POST", { password: PASSWORD, action: "publish", config: valid() });
    const cfg = valid();
    cfg.hero.tagline = "Second publish";
    await call("POST", { password: PASSWORD, action: "publish", config: cfg });

    const res = await call("POST", { password: PASSWORD, action: "history" });
    expect(res.statusCode).toBe(200);
    expect(res.body.revisions.length).toBe(2);
    expect(res.body.revisions[0].id).toBe(2);
    expect(res.body.current.revision).toBe(2);
  });

  it("restores an older revision as a new one", async () => {
    await call("POST", { password: PASSWORD, action: "publish", config: valid() });
    const cfg = valid();
    cfg.hero.tagline = "changed";
    await call("POST", { password: PASSWORD, action: "publish", config: cfg });

    const res = await call("POST", { password: PASSWORD, action: "restore", id: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body.revision).toBe(3);
    expect(res.body.data.hero.tagline).toBe(DEFAULT_CONFIG.hero.tagline);
    expect(res.body.data.restoredFrom).toBe(1);
  });

  it("rejects restoring an unknown revision", async () => {
    const res = await call("POST", { password: PASSWORD, action: "restore", id: 99 });
    expect(res.statusCode).toBe(404);
  });

  it("accepts the legacy v1 body shape", async () => {
    const res = await call("POST", {
      password: PASSWORD,
      pricing: { movies: { plans: [{ n: "1 Month", p: 55, b: "" }] } },
      site: { upi: "legacy@okhdfcbank" }
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.packs.movies.plans[0].price).toBe(55);
    expect(res.body.data.links.upi).toBe("legacy@okhdfcbank");
  });

  it("rejects oversized payloads", async () => {
    const res = await call("POST", {
      password: PASSWORD,
      action: "publish",
      config: { ...valid(), hero: { ...valid().hero, tagline: "x".repeat(500_000) } }
    });
    expect([413, 422, 200]).toContain(res.statusCode);
    if (res.statusCode === 200) expect(res.body.data.hero.tagline.length).toBeLessThanOrEqual(80);
  });
});

describe("reset + methods", () => {
  it("resets to code defaults", async () => {
    await call("POST", { password: PASSWORD, action: "publish", config: valid() });
    const reset = await call("POST", { password: PASSWORD, action: "reset" });
    expect(reset.statusCode).toBe(200);
    expect(reset.body.reset).toBe(true);

    const after = await call("GET");
    expect(after.body.data).toBeNull();
  });

  it("rejects unsupported methods", async () => {
    const res = await call("DELETE");
    expect(res.statusCode).toBe(405);
  });

  it("returns 501 when publishing without storage", async () => {
    delete process.env.TP_KV_FILE;
    const res = await call("POST", { password: PASSWORD, action: "publish", config: valid() });
    expect(res.statusCode).toBe(501);
    expect(res.body.hint).toBeTruthy();
  });
});

/* ───────────────────────── storage diagnostics ───────────────────────── */

describe("storage diagnostics", () => {
  it("status action reports the file provider in dev", async () => {
    const res = await call("POST", { password: PASSWORD, action: "status" });
    expect(res.statusCode).toBe(200);
    expect(res.body.storage.provider).toBe("file");
    expect(res.body.storage.configured).toBe(true);
    expect(res.body.storage.missing).toEqual([]);
    expect(res.body.ping).toBe("ok");
  });

  it("status action needs a password", async () => {
    const res = await call("POST", { password: "wrong", action: "status" });
    expect(res.statusCode).toBe(401);
    expect(res.body.storage).toBeUndefined();
  });

  it("detects the Upstash integration variable pair", async () => {
    delete process.env.TP_KV_FILE;
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "not-a-real-token";
    const res = await call("POST", { password: PASSWORD, action: "status" });
    expect(res.body.storage.provider).toBe("upstash");
    expect(res.body.storage.presentVars).toContain("UPSTASH_REDIS_REST_TOKEN");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("names the missing token when only the url is present", async () => {
    delete process.env.TP_KV_FILE;
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    const res = await call("POST", { password: PASSWORD, action: "status" });
    expect(res.body.storage.configured).toBe(false);
    expect(res.body.storage.missing.join(" ")).toContain("TOKEN");
    expect(res.body.storage.needsRedeployLikely).toBe(false);
    delete process.env.KV_REST_API_URL;
  });

  it("flags a redeploy hint when nothing is set", async () => {
    delete process.env.TP_KV_FILE;
    const res = await call("POST", { password: PASSWORD, action: "status" });
    expect(res.body.storage.configured).toBe(false);
    expect(res.body.storage.needsRedeployLikely).toBe(true);
    expect(res.body.storage.hint).toContain("Redeploy");
  });

  it("warns when only a TCP redis url is configured", async () => {
    delete process.env.TP_KV_FILE;
    process.env.KV_URL = "redis://default:pw@example:6379";
    const res = await call("POST", { password: PASSWORD, action: "status" });
    expect(res.body.storage.configured).toBe(false);
    expect(res.body.storage.hint.toLowerCase()).toContain("tcp");
    delete process.env.KV_URL;
  });

  it("publish 501 explains exactly what is missing", async () => {
    delete process.env.TP_KV_FILE;
    const res = await call("POST", { password: PASSWORD, action: "publish", config: valid() });
    expect(res.statusCode).toBe(501);
    expect(res.body.storage.missing.length).toBe(2);
    expect(res.body.hint).toBeTruthy();
  });

  it("public GET exposes storage state without secrets", async () => {
    delete process.env.TP_KV_FILE;
    const res = await call("GET");
    expect(res.body.configured).toBe(false);
    expect(res.body.storage.provider).toBe("none");
    expect(JSON.stringify(res.body)).not.toContain("not-a-real-token");
    expect(res.body.storage.urlVar).toBeUndefined(); // public GET stays minimal
  });
});
