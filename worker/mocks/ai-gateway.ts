/**
 * Mock AI Gateway for testing Cloudflare Workers AI calls
 *
 * This module provides configurable mock factories to simulate AI Gateway
 * responses for testing categorization and layout generation code paths.
 */

import type { AIGatewayResponse, CategorizationResult } from '../types';
import { GUARD_MODEL } from '../moderation';

/**
 * How the mocked Llama Guard answers layout moderation calls: a fixed verdict, 'error' for a
 * failed call, or a function of the text being checked.
 */
export type GuardMock = 'safe' | 'unsafe' | 'error' | ((text: string) => 'safe' | 'unsafe');

function isGuardCall(options: unknown): boolean {
  return (options as { query?: { model?: string } })?.query?.model === GUARD_MODEL;
}

/** Answer a moderation call the way Llama Guard does ("safe", or "unsafe" plus categories). */
function guardResponse(options: unknown, guard: GuardMock = 'safe'): Response {
  if (guard === 'error') return new Response('upstream error', { status: 502 });
  const { messages } = (options as { query: { messages: Array<{ content: string }> } }).query;
  const verdict = typeof guard === 'function' ? guard(messages.at(-1)!.content) : guard;
  const content = verdict === 'safe' ? '\n\nsafe' : '\n\nunsafe\nS1';
  return Response.json({ choices: [{ message: { content } }] });
}

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
  /** Called with the options passed to .run(), for asserting on the outgoing request */
  onRun?: (options: unknown) => void;
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
  const { ok = true, status = 200, response, responseText, throwError, onRun } = config;

  return {
    gateway: (_gatewayId: string) => ({
      run: async (options: unknown) => {
        onRun?.(options);
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
 * Helper to create an env object with mock AI for testing
 *
 * @example
 * ```ts
 * const testEnv = createEnvWithMockAI(baseEnv, createMockCategorizationAI(result));
 * ```
 */
export function createEnvWithMockAI<T extends object>(
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

/**
 * Creates a mock AI that returns different responses for sequential calls.
 * Useful for testing flows that make multiple AI calls (e.g., categorization then layout).
 * Pass `{ stream: [...] }` for a call answered with a streamed completion.
 *
 * @example
 * ```ts
 * const mockAI = createSequentialMockAI([
 *   createAIResponse(JSON.stringify(categorizationResult)),
 *   { stream: ['root = PortfolioPage(...)'] },
 * ]);
 * ```
 */
export function createSequentialMockAI(
  responses: Array<AIGatewayResponse | { stream: CompletionChunk[] }>,
  onRun?: (options: unknown) => void,
  guard?: GuardMock,
): Ai {
  let callIndex = 0;

  return {
    gateway: (_gatewayId: string) => ({
      run: async (options: unknown) => {
        // Moderation calls are answered separately so they don't consume the sequence.
        if (isGuardCall(options)) return guardResponse(options, guard);
        onRun?.(options);
        const response = responses[callIndex] ?? responses[responses.length - 1];
        callIndex++;

        if ('stream' in response) return createCompletionResponse(response.stream);
        return {
          ok: true,
          status: 200,
          json: async () => response,
          text: async () => JSON.stringify(response),
        } as Response;
      },
    }),
  } as Ai;
}

/**
 * A streamed completion chunk: a string becomes `choices[0].delta.content`; an object is sent
 * verbatim (e.g. a reasoning delta or an upstream `{ error }` chunk).
 */
export type CompletionChunk = string | Record<string, unknown>;

/**
 * Encode chunks as an OpenAI-compatible chat completion SSE stream, ending with [DONE]. With
 * `delayMs`, chunks arrive over time like a real model's instead of all at once.
 */
export function createCompletionResponse(chunks: CompletionChunk[], delayMs = 0): Response {
  const encoder = new TextEncoder();
  const frames = chunks.map((chunk) => {
    const payload =
      typeof chunk === 'string' ? { choices: [{ index: 0, delta: { content: chunk } }] } : chunk;
    return `data: ${JSON.stringify(payload)}\n\n`;
  });
  frames.push('data: [DONE]\n\n');
  let index = 0;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (delayMs && index > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      if (index < frames.length) controller.enqueue(encoder.encode(frames[index++]));
      else controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

/** Split OpenUI Lang into small chunks, the way a model streams it. */
export function chunkText(text: string, size = 12): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

/**
 * Creates a mock AI whose layout call streams the given OpenUI Lang.
 *
 * @example
 * ```ts
 * const mockAI = createMockStreamingLayoutAI('root = PortfolioPage("single-column", "blue", [])');
 * ```
 */
export function createMockStreamingLayoutAI(
  lang: string,
  options: {
    extraChunks?: CompletionChunk[];
    onRun?: (options: unknown) => void;
    guard?: GuardMock;
    /** Delay between streamed chunks, for tests that depend on timing. */
    chunkDelayMs?: number;
  } = {},
): Ai {
  return {
    gateway: (_gatewayId: string) => ({
      run: async (runOptions: unknown) => {
        if (isGuardCall(runOptions)) return guardResponse(runOptions, options.guard);
        options.onRun?.(runOptions);
        return createCompletionResponse(
          [...(options.extraChunks ?? []), ...chunkText(lang)],
          options.chunkDelayMs,
        );
      },
    }),
  } as Ai;
}
