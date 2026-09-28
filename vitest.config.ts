import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  test: {
    projects: [
      // React/Frontend tests (jsdom environment)
      {
        plugins: [react()],
        resolve: {
          alias: {
            '@': path.resolve(import.meta.dirname, './src'),
          },
        },
        test: {
          name: 'frontend',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          globals: true,
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['node_modules', 'dist', '.wrangler'],
          // @openuidev/react-ui ships ESM with extensionless relative imports, which Vite
          // resolves but Node's ESM loader does not; let Vite transform it in tests.
          server: { deps: { inline: [/@openuidev\/react-ui/] } },
        },
      },
      // Cloudflare Worker tests (Workers runtime via Miniflare)
      // Uses the "test" environment from wrangler.jsonc. Remote bindings are disabled so the
      // AI binding never opens an authenticated remote session; tests mock the gateway.
      {
        plugins: [
          cloudflareTest({
            remoteBindings: false,
            wrangler: {
              configPath: './wrangler.jsonc',
              environment: 'test',
            },
            miniflare: {
              kvNamespaces: ['UI_CACHE'],
              r2Buckets: ['ASSETS'],
            },
          }),
        ],
        test: {
          name: 'worker',
          include: ['worker/**/*.{test,spec}.ts'],
        },
      },
    ],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/**/*.ts',
        'src/hooks/**/*.ts',
        'src/genui/**/*.{ts,tsx}',
        'worker/**/*.ts',
      ],
      exclude: ['worker/prompts.ts', '**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});
