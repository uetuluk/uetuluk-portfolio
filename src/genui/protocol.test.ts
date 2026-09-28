import { describe, it, expect } from 'vitest';
import { encodeEvent, readEvents, type GenerateEvent } from './protocol';

function streamOf(parts: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      parts.forEach((p) => controller.enqueue(encoder.encode(p)));
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<GenerateEvent[]> {
  const events: GenerateEvent[] = [];
  for await (const event of readEvents(stream)) events.push(event);
  return events;
}

const EVENTS: GenerateEvent[] = [
  { event: 'meta', data: { source: 'ai', layoutToken: 't' } },
  { event: 'delta', data: { text: 'root = PortfolioPage("a",\n"b", [])' } },
  { event: 'replace', data: { text: 'root = PortfolioPage("c", "d", [])' } },
  { event: 'error', data: { message: 'cut' } },
  { event: 'done', data: {} },
];

describe('generate event protocol', () => {
  it('round-trips events, including text with newlines', async () => {
    expect(await collect(streamOf([EVENTS.map(encodeEvent).join('')]))).toEqual(EVENTS);
  });

  it('reassembles events split across network chunks at any point', async () => {
    const wire = EVENTS.map(encodeEvent).join('');
    for (const cut of [1, 7, 15, wire.length - 3]) {
      expect(await collect(streamOf([wire.slice(0, cut), wire.slice(cut)]))).toEqual(EVENTS);
    }
  });

  it('decodes multi-byte characters split across chunks', async () => {
    const bytes = new TextEncoder().encode(
      encodeEvent({ event: 'delta', data: { text: '日本語 ✓' } }),
    );
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 30));
        controller.enqueue(bytes.slice(30));
        controller.close();
      },
    });
    expect(await collect(stream)).toEqual([{ event: 'delta', data: { text: '日本語 ✓' } }]);
  });

  it('skips unknown and malformed events', async () => {
    const events = await collect(
      streamOf([
        'event: ping\ndata: {}\n\n',
        'event: delta\ndata: {broken\n\n',
        encodeEvent({ event: 'done', data: {} }),
      ]),
    );
    expect(events).toEqual([{ event: 'done', data: {} }]);
  });
});
