/**
 * Wire format for POST /api/generate, shared by the Worker and the browser.
 *
 * The response is a server-sent event stream:
 *   event: meta   — GenerateMeta, always first
 *   event: delta  — { text }, OpenUI Lang to append (a cache hit or fallback arrives as one delta)
 *   event: replace — { text }, discard everything received so far and render this instead (sent
 *                   when the model's output turned out to be unrenderable)
 *   event: error  — { message }, generation failed after content was sent; keep what rendered
 *   event: done   — {}, always last
 */

export type LayoutSource = 'ai' | 'cache' | 'fallback';

export interface GenerateMeta {
  source: LayoutSource;
  /** Opaque token the client sends back with a dislike to invalidate this cached layout. */
  layoutToken?: string;
  categorization?: {
    status?: string;
    tagName?: string;
    displayName?: string;
    confidence?: number;
  };
  visitorContext?: {
    geo?: { country?: string; city?: string };
    device?: { type?: 'mobile' | 'tablet' | 'desktop' };
    time?: { timeOfDay?: string };
  };
  uiHints?: {
    suggestedTheme?: 'light' | 'dark' | 'system';
    preferCompactLayout?: boolean;
  };
  rateLimited?: boolean;
  retryAfter?: number;
}

export type GenerateEvent =
  | { event: 'meta'; data: GenerateMeta }
  | { event: 'delta'; data: { text: string } }
  | { event: 'replace'; data: { text: string } }
  | { event: 'error'; data: { message: string } }
  | { event: 'done'; data: Record<string, never> };

export const EVENT_STREAM_CONTENT_TYPE = 'text/event-stream; charset=utf-8';

export function encodeEvent(event: GenerateEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

/** Parse a server-sent event stream into GenerateEvents. Unknown or malformed events are skipped. */
export async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<GenerateEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = parseBlock(block);
        if (parsed) yield parsed;
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseBlock(block: string): GenerateEvent | null {
  let event = '';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  if (!['meta', 'delta', 'replace', 'error', 'done'].includes(event)) return null;
  try {
    return { event, data: JSON.parse(data.join('\n')) } as GenerateEvent;
  } catch {
    return null;
  }
}
