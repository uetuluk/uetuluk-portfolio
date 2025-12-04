import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "worker/**/*.{test,spec}.ts"],
    exclude: ["node_modules", "dist", ".wrangler"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/lib/**/*.ts",
        "src/hooks/**/*.ts",
        "src/components/ComponentMapper.tsx",
        "worker/**/*.ts",
      ],
      exclude: ["worker/prompts.ts", "**/*.d.ts", "**/*.test.ts", "**/*.spec.ts"],
    },
  },
});
