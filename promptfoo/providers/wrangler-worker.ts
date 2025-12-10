import type {
  IProvider,
  ProviderContext,
  ProviderResponse,
  PlatformProxy,
  WorkerModule,
} from '../types/provider';
import type { Env, GenerateRequest } from '../../worker/types';
import { KVNamespace } from '@cloudflare/workers-types/experimental/index.js';

// Declare module for CJS compatibility
declare const module: any;

// Minimal portfolio content for testing
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
      github: 'https://github.com/test',
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
  private workerModule: WorkerModule | null = null;
  private platformProxy: PlatformProxy | null = null;

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
        this.platformProxy = (await getPlatformProxy()) as PlatformProxy;
      }

      const { env } = this.platformProxy;

      // Build request to /api/generate
      const requestBody: GenerateRequest = {
        visitorTag: context.vars?.visitorTag || 'friend',
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
        AI_GATEWAY_ID: 'personal-website-test',
        UI_CACHE: env.KV as KVNamespace, // Optional - may be undefined
        ASSETS: undefined as any, // Not needed for API routes
        FEEDBACK: undefined as any, // Not needed for prompt tests
      };

      // Invoke worker
      const worker = this.workerModule.default;
      const response = await worker.fetch(request, workerEnv);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Worker returned ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as any;

      // Extract appropriate field based on what's present
      let output: any;
      if (data._categorization) {
        // For categorization tests, return just the _categorization field
        // This matches what the test assertions expect
        output = data._categorization;
      } else if (data.layout) {
        // For layout tests, return just the layout field
        output = data.layout;
      } else {
        // Fallback - return whole response
        output = data;
      }

      return {
        output: JSON.stringify(output),
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

// CJS compatibility for promptfoo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WranglerWorkerProvider;
}
