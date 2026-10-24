/**
 * Dev-only middleware that mounts the real Vercel handlers at /api/*
 * so `npm run dev` is a complete local stack (publish, history, restore).
 *
 * Storage is a JSON file (dev-data/kv.json) instead of Upstash.
 * Only active while running Vite in dev mode.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function devApiPlugin() {
  return {
    name: "timepass-dev-api",
    apply: "serve",
    /** @param {import("vite").ViteDevServer} server */
    configureServer(server) {
      const kvFile = path.resolve(process.cwd(), "dev-data/kv.json");
      fs.mkdirSync(path.dirname(kvFile), { recursive: true });
      if (!fs.existsSync(kvFile)) fs.writeFileSync(kvFile, "{}");

      process.env.TP_KV_FILE = kvFile;

      /*
       * The dev admin password is NEVER committed: it comes from the shell env,
       * or is generated once per machine and stored in the gitignored
       * dev-data/dev-admin.txt file.
       */
      let passwordSource = "ADMIN_PASSWORD env var";
      if (!process.env.ADMIN_PASSWORD) {
        const pwFile = path.resolve(process.cwd(), "dev-data/dev-admin.txt");
        if (fs.existsSync(pwFile)) {
          process.env.ADMIN_PASSWORD = fs.readFileSync(pwFile, "utf8").trim();
          passwordSource = "dev-data/dev-admin.txt";
        } else {
          process.env.ADMIN_PASSWORD = crypto.randomBytes(12).toString("base64url");
          fs.writeFileSync(pwFile, process.env.ADMIN_PASSWORD, { mode: 0o600 });
          passwordSource = "new random password saved in dev-data/dev-admin.txt";
        }
      }

      server.config.logger.info(`  ➜  Dev API ready. Admin password from ${passwordSource}`);

      server.middlewares.use("/api", async (req, res, next) => {
        const url = new URL(req.url || "/", "http://localhost");
        const name = url.pathname.replace(/^\/+/, "").split("/")[0];
        if (!name) return next();

        let mod;
        try {
          mod = await import(`../api/${name}.js`);
        } catch {
          return next();
        }
        const handler = mod.default;
        if (typeof handler !== "function") return next();

        const chunks = [];
        for await (const c of req) chunks.push(c);
        const raw = Buffer.concat(chunks).toString("utf8");
        let body = {};
        if (raw) {
          try {
            body = JSON.parse(raw);
          } catch {
            body = raw;
          }
        }

        const vReq = { method: req.method, url: req.url, body, headers: req.headers, query: Object.fromEntries(url.searchParams) };
        const vRes = {
          statusCode: 200,
          _headers: {},
          setHeader(k, v) {
            this._headers[k] = v;
            return this;
          },
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(obj) {
            res.writeHead(this.statusCode, { "Content-Type": "application/json; charset=utf-8", ...this._headers });
            res.end(JSON.stringify(obj));
            return this;
          },
          send(v) {
            res.writeHead(this.statusCode, { "Content-Type": "text/plain; charset=utf-8", ...this._headers });
            res.end(typeof v === "string" ? v : JSON.stringify(v));
            return this;
          },
          end(v) {
            res.writeHead(this.statusCode, this._headers);
            res.end(v);
          }
        };

        try {
          await handler(vReq, vRes);
        } catch (e) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e && e.message ? e.message : e) }));
        }
      });
    }
  };
}
