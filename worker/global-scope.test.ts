import { afterEach, describe, expect, it, vi } from 'vitest';

describe('worker global scope', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Workers reject a script that generates random values at load time (error 10021), and
  // neither workerd in tests nor `wrangler dev` enforces it, so assert it directly.
  it('does not generate random values while loading the module', async () => {
    const randomUUID = vi.spyOn(crypto, 'randomUUID');
    const getRandomValues = vi.spyOn(crypto, 'getRandomValues');
    const random = vi.spyOn(Math, 'random');
    vi.resetModules();

    await import('./index');

    expect(randomUUID).not.toHaveBeenCalled();
    expect(getRandomValues).not.toHaveBeenCalled();
    expect(random).not.toHaveBeenCalled();
  });
});
