/**
 * Output moderation for generated layouts, so the layout stream can stay a stream.
 *
 * AI Gateway's response Guardrails buffer the whole completion before releasing it, which
 * defeats streaming. Instead, sections stream to the visitor as the model writes them and each
 * completed statement is classified by Llama Guard in the background. If any is flagged, the
 * Worker replaces the page with the default layout and doesn't cache it.
 */
import type { Env } from './types';

export const GUARD_MODEL = 'meta-llama/llama-guard-4-12b';
const GUARD_TIMEOUT_MS = 8000;

// Llama Guard classifies the assistant turn of a conversation; this stands in for the request.
const GUARD_USER_TURN = 'Show me a personalized portfolio page.';

export type Verdict = { safe: true } | { safe: false; categories: string[] };
export type ModerationOutcome = 'safe' | 'unsafe' | 'unchecked';

/** Parse Llama Guard's reply: "safe", or "unsafe" followed by a line of category codes. */
export function parseGuardVerdict(content: string): Verdict | null {
  const [first, second = ''] = content.trim().split('\n');
  if (first?.trim() === 'safe') return { safe: true };
  if (first?.trim() === 'unsafe') {
    return {
      safe: false,
      categories: second
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    };
  }
  return null;
}

/**
 * The visitor-visible text of an OpenUI Lang statement: its string literals, minus links and
 * asset paths. Returns '' for statements with nothing to read, such as the root.
 */
export function visibleText(statement: string): string {
  const strings: string[] = [];
  for (const [literal] of statement.matchAll(/"(?:[^"\\]|\\.)*"/g)) {
    try {
      const value = JSON.parse(literal) as string;
      if (value.trim() && !/^(\/|https?:|mailto:)/i.test(value)) strings.push(value);
    } catch {
      // A malformed literal can't render either; skip it.
    }
  }
  return strings.join('\n');
}

/** Classify text with Llama Guard through AI Gateway. Throws if no verdict is available. */
export async function moderateText(env: Env, text: string): Promise<Verdict> {
  const gateway = env.AI.gateway(env.AI_GATEWAY_ID);
  const request = gateway
    .run({
      provider: 'openrouter',
      endpoint: 'chat/completions',
      headers: { 'Content-Type': 'application/json' },
      query: {
        model: GUARD_MODEL,
        temperature: 0,
        max_tokens: 20,
        messages: [
          { role: 'user', content: GUARD_USER_TURN },
          { role: 'assistant', content: text },
        ],
      },
    })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Guard returned ${response.status}`);
      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const verdict = parseGuardVerdict(body.choices?.[0]?.message?.content ?? '');
      if (!verdict) throw new Error('Guard returned no verdict');
      return verdict;
    });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Guard timed out')), GUARD_TIMEOUT_MS);
  });
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Moderates a layout as it streams. `push` is given the text so far and starts a check for each
 * newly completed line (OpenUI Lang has one statement per line); `finish` checks the rest and
 * settles the outcome. `flagged` turns true as soon as any check comes back unsafe.
 */
export class StreamModerator {
  flagged = false;
  private checked = 0;
  private readonly checks: Array<Promise<ModerationOutcome>> = [];

  constructor(private readonly check: (text: string) => Promise<Verdict>) {}

  push(lang: string): void {
    const end = lang.lastIndexOf('\n');
    if (end < this.checked) return;
    for (const line of lang.slice(this.checked, end).split('\n')) this.checkStatement(line);
    this.checked = end + 1;
  }

  async finish(lang: string): Promise<ModerationOutcome> {
    this.push(lang);
    this.checkStatement(lang.slice(this.checked));
    this.checked = lang.length;
    const outcomes = await Promise.all(this.checks);
    if (outcomes.includes('unsafe')) return 'unsafe';
    return outcomes.includes('unchecked') ? 'unchecked' : 'safe';
  }

  private checkStatement(statement: string): void {
    const text = visibleText(statement);
    if (!text) return;
    this.checks.push(
      this.check(text).then(
        (verdict) => {
          if (verdict.safe) return 'safe';
          console.warn('Generated layout flagged by guard:', verdict.categories);
          this.flagged = true;
          return 'unsafe';
        },
        (error: unknown) => {
          console.error('Layout moderation failed:', error);
          return 'unchecked';
        },
      ),
    );
  }
}
