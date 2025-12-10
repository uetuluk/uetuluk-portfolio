/**
 * Mock AI Gateway for testing Cloudflare Workers AI calls
 *
 * This module provides configurable mock factories to simulate AI Gateway
 * responses for testing categorization and layout generation code paths.
 */

import type { AIGatewayResponse, CategorizationResult, GeneratedLayout } from '../types';

/**
 * Configuration for creating a mock AI Gateway
 */
export interface MockAIConfig {
  /** Whether the response is successful (default: true) */
  ok?: boolean;
  /** HTTP status code (default: 200) */
  status?: number;
  /** AI Gateway response body */
  response?: AIGatewayResponse;
  /** Raw text response (for error cases) */
  responseText?: string;
  /** Error to throw when .run() is called */
  throwError?: Error;
}

/**
 * Creates a mock AI binding that simulates the Cloudflare AI Gateway
 *
 * @example
 * ```ts
 * const mockAI = createMockAI({
 *   ok: true,
 *   response: {
 *     choices: [{ message: { content: JSON.stringify(result) } }]
 *   }
 * });
 *
 * const envWithMockAI = { ...env, AI: mockAI, AI_GATEWAY_ID: "test-gateway" };
 * ```
 */
export function createMockAI(config: MockAIConfig = {}): Ai {
  const { ok = true, status = 200, response, responseText, throwError } = config;

  return {
    gateway: (_gatewayId: string) => ({
      run: async (_options: unknown) => {
        if (throwError) {
          throw throwError;
        }

        return {
          ok,
          status,
          json: async () => response,
          text: async () => responseText ?? (response ? JSON.stringify(response) : ''),
        } as Response;
      },
    }),
  } as Ai;
}

/**
 * Creates an AI Gateway response with the given content
 */
export function createAIResponse(content: string): AIGatewayResponse {
  return {
    choices: [
      {
        message: {
          content,
        },
      },
    ],
  };
}

/**
 * Creates a mock AI that returns a successful categorization result
 *
 * @example
 * ```ts
 * const mockAI = createMockCategorizationAI({
 *   status: "matched",
 *   tagName: "developer",
 *   displayName: "Developer",
 *   guidelines: "Show technical projects",
 *   confidence: 0.95,
 * });
 * ```
 */
export function createMockCategorizationAI(result: CategorizationResult): Ai {
  return createMockAI({
    ok: true,
    status: 200,
    response: createAIResponse(JSON.stringify(result)),
  });
}

/**
 * Creates a mock AI that returns a successful layout generation result
 *
 * @example
 * ```ts
 * const mockAI = createMockLayoutAI({
 *   layout: "two-column",
 *   theme: { accent: "blue" },
 *   sections: [{ type: "hero", props: { title: "Welcome" } }],
 * });
 * ```
 */
export function createMockLayoutAI(layout: GeneratedLayout): Ai {
  return createMockAI({
    ok: true,
    status: 200,
    response: createAIResponse(JSON.stringify(layout)),
  });
}

/**
 * Creates a mock AI that returns an error response (non-ok)
 *
 * @example
 * ```ts
 * const mockAI = createMockErrorAI(500, "Internal server error");
 * ```
 */
export function createMockErrorAI(status: number, message: string): Ai {
  return createMockAI({
    ok: false,
    status,
    responseText: message,
    response: {
      error: { message },
    },
  });
}

/**
 * Creates a mock AI that returns an empty response (no content)
 *
 * This simulates cases where the AI returns an empty choices array
 * or missing message content.
 */
export function createMockNoContentAI(): Ai {
  return createMockAI({
    ok: true,
    status: 200,
    response: {
      choices: [],
    },
  });
}

/**
 * Creates a mock AI that returns invalid JSON in the content field
 *
 * This simulates cases where the AI returns malformed JSON that
 * can't be parsed, triggering error handling paths.
 */
export function createMockInvalidJsonAI(): Ai {
  return createMockAI({
    ok: true,
    status: 200,
    response: createAIResponse('{ invalid json }'),
  });
}

/**
 * Creates a mock AI that throws an error when .run() is called
 *
 * @example
 * ```ts
 * const mockAI = createMockThrowingAI(new Error("Network error"));
 * ```
 */
export function createMockThrowingAI(error: Error): Ai {
  return createMockAI({
    throwError: error,
  });
}

/**
 * Creates a mock AI that returns a layout missing required fields
 *
 * This simulates cases where the AI returns an object that doesn't
 * match the expected GeneratedLayout structure.
 */
export function createMockInvalidLayoutAI(): Ai {
  return createMockAI({
    ok: true,
    status: 200,
    response: createAIResponse(
      JSON.stringify({
        theme: { accent: 'blue' },
        // Missing 'layout' and 'sections' fields
      }),
    ),
  });
}

/**
 * Helper to create an env object with mock AI for testing
 *
 * @example
 * ```ts
 * const testEnv = createEnvWithMockAI(baseEnv, createMockCategorizationAI(result));
 * ```
 */
export function createEnvWithMockAI<T extends { AI?: Ai; AI_GATEWAY_ID?: string }>(
  baseEnv: T,
  mockAI: Ai,
  gatewayId: string = 'test-gateway',
): T & { AI: Ai; AI_GATEWAY_ID: string } {
  return {
    ...baseEnv,
    AI: mockAI,
    AI_GATEWAY_ID: gatewayId,
  };
}
