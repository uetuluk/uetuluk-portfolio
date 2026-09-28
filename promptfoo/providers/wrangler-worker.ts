import type {
  IProvider,
  ProviderContext,
  ProviderResponse,
  PlatformProxy,
  WorkerModule,
} from '../types/provider';
import type { Env, GenerateRequest } from '../../worker/types';
import type { ElementNode } from '@openuidev/lang-core';
import portfolio from '../../src/content/portfolio.json';
import { readEvents, type GenerateMeta } from '../../src/genui/protocol';
import { parseLayout } from '../../worker/genui-stream';

// Declare module for CJS compatibility
declare const module:
  | {
      exports: Record<string, unknown>;
    }
  | undefined;

// Evaluate against the real portfolio so project and experience ID assertions are meaningful.
const DEFAULT_PORTFOLIO = portfolio;

function hasContent(value: unknown): boolean {
  return typeof value === 'object' && value !== null && Object.keys(value).length > 0;
}

/**
 * The worker streams OpenUI Lang. Read the event stream, parse the layout, and return the JSON
 * view the eval assertions are written against: { layout, theme, sections: [{ type, props }] },
 * plus the raw OpenUI Lang and parser errors for debugging.
 */
async function readLayout(response: Response) {
  let meta: GenerateMeta | undefined;
  let lang = '';
  let streamError: string | undefined;
  for await (const event of readEvents(response.body!)) {
    if (event.event === 'meta') meta = event.data;
    else if (event.event === 'delta') lang += event.data.text;
    // The worker swapped unrenderable model output for the fallback page
    else if (event.event === 'replace') streamError = `Model output was not renderable:\n${lang}`;
    else if (event.event === 'error') streamError = event.data.message;
  }

  const parsed = parseLayout(lang);
  const root = parsed.root?.props as
    { layout?: string; accent?: string; sections?: Array<ElementNode | null> } | undefined;
  return {
    meta,
    streamError,
    view: {
      layout: root?.layout,
      theme: { accent: root?.accent },
      sections: (root?.sections ?? [])
        .filter((s): s is ElementNode => Boolean(s))
        .map((s) => ({ type: s.typeName, props: s.props })),
      _categorization: meta?.categorization,
      _lang: lang,
      _parseErrors: parsed.meta.errors.map((e) => e.message),
      _unresolved: parsed.meta.unresolved,
    },
  };
}

/**
 * Custom Promptfoo provider for testing via Wrangler Worker
 * Invokes the worker programmatically using wrangler's getPlatformProxy()
 * This provides true integration testing of the production code path
 */
export default class WranglerWorkerProvider implements IProvider {
  protected workerModule: WorkerModule | null = null;
  protected platformProxy: PlatformProxy | null = null;

  /**
   * Provider identifier
   */
  id(): string {
    return 'wrangler-worker';
  }

  /**
   * Call the worker API with the given prompt and context
   */
  async callApi(_prompt: string, context: ProviderContext): Promise<ProviderResponse> {
    try {
      // Lazy load the worker module (it's an ES module)
      if (!this.workerModule) {
        this.workerModule = (await import('../../worker/index.js')) as WorkerModule;
      }

      // Get platform proxy for Cloudflare bindings
      if (!this.platformProxy) {
        const { getPlatformProxy } = await import('wrangler');
        this.platformProxy = (await getPlatformProxy({
          environment: 'test', // Use env.test from wrangler.jsonc
        })) as PlatformProxy;
      }

      const { env } = this.platformProxy;

      // Build request to /api/generate
      // For categorization-only tests, visitorTag might not be provided
      const requestBody: GenerateRequest = {
        visitorTag: (context.vars?.visitorTag as string) || 'friend',
        customIntent: context.vars?.customIntent,
        portfolioContent: hasContent(context.vars?.portfolioContent)
          ? (context.vars?.portfolioContent as GenerateRequest['portfolioContent'])
          : (DEFAULT_PORTFOLIO as unknown as GenerateRequest['portfolioContent']),
      };

      const request = new Request('http://localhost/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // The worker rate limits per client IP and rejects requests without one
          'CF-Connecting-IP': `198.51.100.${Math.floor(Math.random() * 250) + 1}`,
        },
        body: JSON.stringify(requestBody),
      });

      // Create environment object
      const workerEnv: Env = {
        AI: env.AI,
        AI_GATEWAY_ID: env.AI_GATEWAY_ID, // Use value from wrangler.jsonc env.test
        UI_CACHE: env.KV as KVNamespace, // Optional - may be undefined
        ASSETS: undefined as unknown as R2Bucket, // Not needed for API routes
        FEEDBACK: undefined as unknown as AnalyticsEngineDataset, // Not needed for prompt tests
      };

      // Invoke worker
      const worker = this.workerModule.default;
      const response = await worker.fetch(request, workerEnv);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Worker returned ${response.status}: ${errorText}`);
      }

      const { meta, streamError, view } = await readLayout(response);

      // A fallback is a valid layout, so it would pass every assertion without the model ever
      // running. Only grade layouts the model actually produced.
      if (meta?.source !== 'ai') {
        throw new Error(
          `Expected an AI-generated layout but got source "${meta?.source ?? 'none'}"` +
            (meta?.rateLimited ? ' (rate limited)' : ''),
        );
      }
      if (streamError) throw new Error(`Generation stream failed: ${streamError}`);

      return { output: JSON.stringify(view) };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        error: `Worker invocation error: ${errorMessage}`,
        output: '',
      };
    }
  }

  /**
   * Cleanup method (called by promptfoo after tests complete)
   */
  async cleanup(): Promise<void> {
    if (this.platformProxy?.dispose) {
      await this.platformProxy.dispose();
      this.platformProxy = null;
    }
  }
}

/**
 * Layout-specific provider - always returns full layout object
 * Used by layout generation tests
 */
class WranglerWorkerProviderLayout extends WranglerWorkerProvider {
  id(): string {
    return 'wrangler-worker-layout';
  }

  async callApi(prompt: string, context: ProviderContext): Promise<ProviderResponse> {
    const response = await super.callApi(prompt, context);

    // Parse and ensure we return the full layout object
    const data = JSON.parse(response.output);
    if (data.layout) {
      // Layout test: return full object (includes _categorization as metadata)
      return response;
    }

    throw new Error('Expected layout object but got: ' + response.output);
  }
}

/**
 * Categorization-specific provider - calls categorizeIntent() directly
 * Used by intent categorization tests
 */
class WranglerWorkerProviderCategorization extends WranglerWorkerProvider {
  id(): string {
    return 'wrangler-worker-categorization';
  }

  async callApi(_prompt: string, context: ProviderContext): Promise<ProviderResponse> {
    try {
      // Lazy load the worker module to get categorizeIntent function
      if (!this.workerModule) {
        this.workerModule = (await import('../../worker/index.js')) as WorkerModule;
      }

      // Get platform proxy for Cloudflare bindings
      if (!this.platformProxy) {
        const { getPlatformProxy } = await import('wrangler');
        this.platformProxy = (await getPlatformProxy({
          environment: 'test',
        })) as PlatformProxy;
      }

      const { env } = this.platformProxy;
      const workerEnv: Env = {
        AI: env.AI,
        AI_GATEWAY_ID: env.AI_GATEWAY_ID,
        UI_CACHE: env.KV as KVNamespace,
        ASSETS: undefined as unknown as R2Bucket,
        FEEDBACK: undefined as unknown as AnalyticsEngineDataset,
      };

      // Call categorizeIntent directly
      const customIntent = context.vars?.customIntent || '';
      const { categorizeIntent } = this.workerModule;
      const result = await categorizeIntent(customIntent, workerEnv);

      return {
        output: JSON.stringify(result),
        tokenUsage: {
          total: 0,
          prompt: 0,
          completion: 0,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        error: `Categorization error: ${errorMessage}`,
        output: '',
      };
    }
  }
}

// ES module exports
export { WranglerWorkerProviderLayout, WranglerWorkerProviderCategorization };

// CJS compatibility for promptfoo
if (typeof module !== 'undefined' && module?.exports) {
  (module.exports as Record<string, unknown>)['default'] = WranglerWorkerProvider;
  (module.exports as Record<string, unknown>)['WranglerWorkerProviderLayout'] =
    WranglerWorkerProviderLayout;
  (module.exports as Record<string, unknown>)['WranglerWorkerProviderCategorization'] =
    WranglerWorkerProviderCategorization;
}
