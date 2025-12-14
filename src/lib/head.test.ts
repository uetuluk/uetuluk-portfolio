import { describe, it, expect } from 'vitest';
import { head } from './head';

describe('head', () => {
  it('exports a createHead instance', () => {
    expect(head).toBeDefined();
    expect(typeof head).toBe('object');
  });
});
