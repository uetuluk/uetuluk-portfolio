import type { Env, CategorizationResult } from '../../worker/types';

/**
 * Promptfoo provider response type
 */
export interface ProviderResponse {
  output: string;
  tokenUsage?: {
    total: number;
    prompt: number;
    completion: number;
  };
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Test context passed to provider
 */
export interface ProviderContext {
  vars?: {
    visitorTag?: string;
    customIntent?: string;
    portfolioContent?: any;
  };
  prompt?: string;
}

/**
 * Wrangler platform proxy type
 */
export interface PlatformProxy {
  env: {
    AI: Ai;
    KV?: KVNamespace;
    AI_GATEWAY_ID: string;
  };
  dispose: () => Promise<void>;
}

/**
 * Worker module type
 */
export interface WorkerModule {
  default: {
    fetch: (request: Request, env: Env, _ctx?: ExecutionContext) => Promise<Response>;
  };
  categorizeIntent: (customIntent: string, env: Env) => Promise<CategorizationResult>;
}

/**
 * Provider class interface
 */
export interface IProvider {
  id(): string;
  callApi(prompt: string, context: ProviderContext): Promise<ProviderResponse>;
  cleanup?(): Promise<void>;
}
