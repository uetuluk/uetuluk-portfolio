import { describe, it, expect } from 'vitest';
import {
  extractLayoutLinks,
  isRenderableLayout,
  parseLayout,
  readCompletionDeltas,
} from './genui-stream';
import { createCompletionResponse, type CompletionChunk } from './mocks/ai-gateway';

async function collect(chunks: CompletionChunk[]): Promise<string[]> {
  const out: string[] = [];
  for await (const text of readCompletionDeltas(createCompletionResponse(chunks).body!)) {
    out.push(text);
  }
  return out;
}

function streamOf(raw: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      raw.forEach((part) => controller.enqueue(encoder.encode(part)));
      controller.close();
    },
  });
}

describe('readCompletionDeltas', () => {
  it('yields only delta content, in order', async () => {
    expect(await collect(['root = ', 'PortfolioPage(', '...)'])).toEqual([
      'root = ',
      'PortfolioPage(',
      '...)',
    ]);
  });

  it('drops role, reasoning and empty deltas', async () => {
    const chunks: CompletionChunk[] = [
      { choices: [{ delta: { role: 'assistant' } }] },
      { choices: [{ delta: { reasoning: 'thinking...' } }] },
      { choices: [{ delta: { content: '' } }] },
      'visible',
    ];
    expect(await collect(chunks)).toEqual(['visible']);
  });

  it('handles SSE lines split across network chunks', async () => {
    const line = `data: ${JSON.stringify({ choices: [{ delta: { content: 'split' } }] })}\n\n`;
    const out: string[] = [];
    for await (const text of readCompletionDeltas(
      streamOf([line.slice(0, 17), line.slice(17), 'data: [DONE]\n\n']),
    )) {
      out.push(text);
    }
    expect(out).toEqual(['split']);
  });

  it('ignores keep-alive comments and malformed lines', async () => {
    const good = `data: ${JSON.stringify({ choices: [{ delta: { content: 'ok' } }] })}\n`;
    const out: string[] = [];
    for await (const text of readCompletionDeltas(
      streamOf([': OPENROUTER PROCESSING\n', 'data: {not json\n', good]),
    )) {
      out.push(text);
    }
    expect(out).toEqual(['ok']);
  });

  it('throws on an explicit upstream error chunk', async () => {
    await expect(collect(['partial', { error: { message: 'overloaded' } }])).rejects.toThrow(
      'Upstream stream error: overloaded',
    );
  });
});

describe('extractLayoutLinks', () => {
  it('finds hrefs anywhere in the layout, not just Hero CTAs', () => {
    const parsed = parseLayout(
      [
        'root = PortfolioPage("single-column", "blue", [hero, note])',
        'hero = Hero("Hi", "There", "/assets/profile.png", {text: "CV", href: "https://example.com/cv"})',
        'note = Callout("Open to work", "Say hello", "info")',
      ].join('\n'),
    );
    expect(extractLayoutLinks(parsed)).toEqual(['https://example.com/cv']);
  });

  it('de-duplicates links', () => {
    const parsed = parseLayout(
      [
        'root = PortfolioPage("single-column", "blue", [a, b])',
        'a = Hero("A", "a", "/assets/a.png", {text: "x", href: "https://example.com"})',
        'b = Hero("B", "b", "/assets/b.png", {text: "y", href: "https://example.com"})',
      ].join('\n'),
    );
    expect(extractLayoutLinks(parsed)).toEqual(['https://example.com']);
  });

  it('returns nothing for a layout without links', () => {
    const parsed = parseLayout('root = PortfolioPage("single-column", "blue", [Timeline("Work")])');
    expect(extractLayoutLinks(parsed)).toEqual([]);
  });
});

describe('isRenderableLayout', () => {
  it('accepts a root with at least one section', () => {
    expect(
      isRenderableLayout(
        parseLayout('root = PortfolioPage("single-column", "blue", [Timeline("Work")])'),
      ),
    ).toBe(true);
  });

  it.each([
    ['plain prose', 'Here is your layout!'],
    ['no sections', 'root = PortfolioPage("single-column", "blue", [])'],
    ['only unresolved references', 'root = PortfolioPage("single-column", "blue", [missing])'],
    ['unknown components only', 'root = PortfolioPage("single-column", "blue", [Bogus("x")])'],
  ])('rejects %s', (_, lang) => {
    expect(isRenderableLayout(parseLayout(lang))).toBe(false);
  });
});
