import { describe, it, expect, vi } from 'vitest';
import { parseGuardVerdict, StreamModerator, visibleText, type Verdict } from './moderation';

describe('parseGuardVerdict', () => {
  it('reads safe and unsafe replies, including the categories', () => {
    expect(parseGuardVerdict('\n\nsafe')).toEqual({ safe: true });
    expect(parseGuardVerdict('\n\nunsafe\nS1,S10')).toEqual({
      safe: false,
      categories: ['S1', 'S10'],
    });
  });

  it('returns null for anything else', () => {
    expect(parseGuardVerdict('')).toBeNull();
    expect(parseGuardVerdict('I cannot help with that')).toBeNull();
  });
});

describe('visibleText', () => {
  it('extracts the strings a visitor would read', () => {
    expect(visibleText('s0 = Callout("Hello \\"there\\"", "Line two", "info")')).toBe(
      'Hello "there"\nLine two\ninfo',
    );
  });

  it('skips links and asset paths', () => {
    expect(
      visibleText(
        'hero = Hero("Jane", "Engineer", "/assets/profile.png", {text: "CV", href: "https://example.com/cv.pdf"})',
      ),
    ).toBe('Jane\nEngineer\nCV');
  });

  it('is empty for statements without text', () => {
    expect(visibleText('root = PortfolioPage("single-column", "blue", [s0])')).toBe(
      'single-column\nblue',
    );
    expect(visibleText('s1 = CardGrid(3)')).toBe('');
  });
});

describe('StreamModerator', () => {
  const safe = (): Promise<Verdict> => Promise.resolve({ safe: true });

  it('checks each statement once, as soon as its line is complete', async () => {
    const check = vi.fn((_text: string) => safe());
    const moderator = new StreamModerator(check);

    moderator.push('s0 = TextBlock("One"');
    expect(check).not.toHaveBeenCalled();
    moderator.push('s0 = TextBlock("One")\ns1 = TextBlock("Tw');
    expect(check).toHaveBeenCalledTimes(1);
    moderator.push('s0 = TextBlock("One")\ns1 = TextBlock("Tw');
    expect(check).toHaveBeenCalledTimes(1);

    await expect(moderator.finish('s0 = TextBlock("One")\ns1 = TextBlock("Two")')).resolves.toBe(
      'safe',
    );
    expect(check.mock.calls.map(([text]) => text)).toEqual(['One', 'Two']);
  });

  it('reports unsafe and sets flagged when any statement is flagged', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const moderator = new StreamModerator(async (text) =>
      text === 'Bad' ? { safe: false, categories: ['S1'] } : { safe: true },
    );

    await expect(moderator.finish('s0 = TextBlock("Good")\ns1 = TextBlock("Bad")')).resolves.toBe(
      'unsafe',
    );
    expect(moderator.flagged).toBe(true);
  });

  it('reports unchecked, not unsafe, when the guard fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const moderator = new StreamModerator(() => Promise.reject(new Error('down')));

    await expect(moderator.finish('s0 = TextBlock("Text")')).resolves.toBe('unchecked');
    expect(moderator.flagged).toBe(false);
  });
});
