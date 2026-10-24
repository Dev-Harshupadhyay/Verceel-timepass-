import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { devApiPlugin } from "./tools/dev-api-plugin.mjs";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  plugins: [react(), devApiPlugin() as PluginOption],
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("./api/_lib", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    fs: { allow: [root] }
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020"
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
    restoreMocks: true
  }
});
