import { useCallback, useEffect, useRef, useState } from 'react';
import { readEvents, type GenerateMeta } from './protocol';

export interface GenerateRequestBody {
  visitorTag: string;
  customIntent?: string;
  portfolioContent: unknown;
}

export interface GeneratedLayoutState {
  /** OpenUI Lang received so far. */
  lang: string;
  isStreaming: boolean;
  meta: GenerateMeta | null;
  error: string | null;
}

const INITIAL_STATE: GeneratedLayoutState = {
  lang: '',
  isStreaming: false,
  meta: null,
  error: null,
};

/**
 * Stream a personalized layout from POST /api/generate.
 *
 * `lang` grows as deltas arrive so the page renders progressively. If the request fails before
 * any content arrives, `fallback()` supplies a complete default page and `error` is set.
 * Starting a new request or unmounting aborts the one in flight.
 */
export function useGeneratedLayout() {
  const [state, setState] = useState<GeneratedLayoutState>(INITIAL_STATE);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const generate = useCallback(
    async (
      body: GenerateRequestBody,
      options: {
        fallback: () => string | Promise<string>;
        failureMessage: string;
        /** Called as soon as the meta event arrives, before any content streams in. */
        onMeta?: (meta: GenerateMeta) => void;
      },
    ): Promise<GenerateMeta | null> => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setState({ ...INITIAL_STATE, isStreaming: true });

      let meta: GenerateMeta | null = null;
      let received = false;
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error(options.failureMessage);

        for await (const event of readEvents(response.body)) {
          if (controller.signal.aborted) return meta;
          switch (event.event) {
            case 'meta':
              meta = event.data;
              setState((s) => ({ ...s, meta: event.data }));
              options.onMeta?.(event.data);
              break;
            case 'delta':
              received = true;
              setState((s) => ({ ...s, lang: s.lang + event.data.text }));
              break;
            case 'error':
              // Content already rendered stays; the page is just incomplete.
              console.warn('Layout generation interrupted:', event.data.message);
              break;
            case 'done':
              break;
          }
        }
        if (!received) throw new Error(options.failureMessage);
        setState((s) => ({ ...s, isStreaming: false }));
      } catch (err) {
        if (controller.signal.aborted) return meta;
        console.error('Generation error:', err);
        // Keep partial output if some arrived; otherwise show the default page.
        const fallback = received ? null : await options.fallback();
        if (controller.signal.aborted) return meta;
        setState((s) => ({
          ...s,
          lang: fallback ?? s.lang,
          isStreaming: false,
          error: err instanceof Error ? err.message : options.failureMessage,
        }));
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
      return meta;
    },
    [],
  );

  return { ...state, generate, reset };
}
