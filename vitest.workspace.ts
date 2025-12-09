import { defineWorkspace } from "vitest/config";
import { defineWorkersProject } from "@cloudflare/vitest-pool-workers/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineWorkspace([
  // React/Frontend tests (jsdom environment)
  {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      name: "frontend",
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      globals: true,
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["node_modules", "dist", ".wrangler"],
    },
  },
  // Cloudflare Worker tests (Workers runtime via Miniflare)
  defineWorkersProject({
    test: {
      name: "worker",
      include: ["worker/**/*.{test,spec}.ts"],
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.jsonc" },
          miniflare: {
            kvNamespaces: ["UI_CACHE"],
            r2Buckets: ["ASSETS"],
          },
        },
      },
    },
  }),
]);
