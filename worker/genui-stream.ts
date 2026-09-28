import { createParser, type ParseResult } from '@openuidev/lang-core';
import { getContractLibrary, ROOT_COMPONENT } from '../src/genui/schema';

let layoutParser: ReturnType<typeof createParser> | undefined;

export function parseLayout(lang: string): ParseResult {
  // Created lazily: the contract library can't be built in Worker global scope.
  layoutParser ??= createParser(getContractLibrary().toJSONSchema(), ROOT_COMPONENT);
  return layoutParser.parse(lang);
}

/**
 * Yield the text content of an OpenAI-compatible chat completion SSE stream.
 *
 * Only `choices[0].delta.content` is forwarded. Reasoning, tool calls and provider metadata are
 * dropped here so they can never reach the page renderer.
 */
export async function* readCompletionDeltas(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        const text = contentOf(line);
        if (text) yield text;
      }
      if (done) {
        const text = contentOf(buffer.trim());
        if (text) yield text;
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function contentOf(line: string): string | undefined {
  if (!line.startsWith('data:')) return undefined;
  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') return undefined;
  let chunk: {
    choices?: Array<{ delta?: { content?: unknown } }>;
    error?: { message?: string };
  };
  try {
    chunk = JSON.parse(payload);
  } catch {
    // A malformed keep-alive or comment line is not fatal; an explicit upstream error is.
    return undefined;
  }
  if (chunk.error) throw new Error(`Upstream stream error: ${chunk.error.message ?? 'unknown'}`);
  const content = chunk.choices?.[0]?.delta?.content;
  return typeof content === 'string' ? content : undefined;
}

/** Every `href` anywhere in the parsed layout, so all links are validated, not just Hero CTAs. */
export function extractLayoutLinks(result: ParseResult): string[] {
  const links = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (key === 'href' && typeof child === 'string') links.add(child);
        else visit(child);
      }
    }
  };
  visit(result.root);
  return [...links];
}

/** A layout is worth caching only if it produced a root with at least one section. */
export function isRenderableLayout(result: ParseResult): boolean {
  const sections = (result.root?.props as { sections?: unknown[] } | undefined)?.sections;
  return result.root?.typeName === ROOT_COMPONENT && Array.isArray(sections)
    ? sections.some(Boolean)
    : false;
}
