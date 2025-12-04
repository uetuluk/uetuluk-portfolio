import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toContain('active');
    expect(result).toContain('base');
  });

  it('handles false/undefined/null values', () => {
    const result = cn('base', false, undefined, null, 'end');
    expect(result).toBe('base end');
  });

  it('merges tailwind conflicts correctly - takes the last class', () => {
    const result = cn('px-4', 'px-8');
    expect(result).toBe('px-8');
  });

  it('merges more complex tailwind conflicts', () => {
    const result = cn('p-4', 'p-6');
    expect(result).toBe('p-6');

    const result2 = cn('text-sm', 'text-lg');
    expect(result2).toBe('text-lg');
  });

  it('handles arrays of classes', () => {
    const result = cn(['text-sm', 'font-bold']);
    expect(result).toContain('text-sm');
    expect(result).toContain('font-bold');
  });

  it('handles object syntax', () => {
    const result = cn({ 'text-red-500': true, 'text-blue-500': false });
    expect(result).toBe('text-red-500');
  });

  it('handles mixed inputs', () => {
    const result = cn('base', ['array-class'], { 'object-class': true });
    expect(result).toContain('base');
    expect(result).toContain('array-class');
    expect(result).toContain('object-class');
  });

  it('returns empty string for no inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('returns empty string for only falsy values', () => {
    const result = cn(false, null, undefined, '');
    expect(result).toBe('');
  });
});
