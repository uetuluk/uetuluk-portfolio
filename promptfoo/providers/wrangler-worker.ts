import type {
  IProvider,
  ProviderContext,
  ProviderResponse,
  PlatformProxy,
  WorkerModule,
} from '../types/provider';
import type { Env, GenerateRequest } from '../../worker/types';

// Declare module for CJS compatibility
declare const module:
  | {
      exports: Record<string, unknown>;
    }
  | undefined;

// Minimal portfolio content for testing
// Uses real GitHub user to ensure GitHub data is available for tests
const DUMMY_PORTFOLIO = {
  name: 'Test Portfolio',
  projects: [],
  experience: [],
  skills: [],
  personal: {
    name: 'Test User',
    title: 'Software Developer',
    bio: 'Test bio',
    contact: {
      email: 'test@example.com',
      linkedin: 'https://linkedin.com/in/test',
      github: 'https://github.com/uetuluk', // Real user with GitHub activity
    },
  },
  education: [],
};

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
        portfolioContent: context.vars?.portfolioContent || DUMMY_PORTFOLIO,
      };

      const request = new Request('http://localhost/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      const data = (await response.json()) as Record<string, unknown> & {
        _tokenUsage?: { total?: number; prompt?: number; completion?: number };
        layout?: unknown;
      };

      // Base provider returns raw worker response
      // Specialized subclasses will extract what they need
      return {
        output: JSON.stringify(data),
        tokenUsage: {
          total: data._tokenUsage?.total || 0,
          prompt: data._tokenUsage?.prompt || 0,
          completion: data._tokenUsage?.completion || 0,
        },
      };
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
