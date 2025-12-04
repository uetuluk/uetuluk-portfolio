import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionId } from './useSessionId';

describe('useSessionId', () => {
  let mockSessionStorage: Record<string, string>;
  const mockUUID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    mockSessionStorage = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key) => mockSessionStorage[key] ?? null,
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockSessionStorage[key] = value;
    });

    // Mock crypto.randomUUID
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);
  });

  it('generates a new session ID when none exists', () => {
    const { result } = renderHook(() => useSessionId());

    expect(result.current).toBe(mockUUID);
  });

  it('stores the session ID in sessionStorage', () => {
    renderHook(() => useSessionId());

    expect(mockSessionStorage['portfolio_session_id']).toBe(mockUUID);
  });

  it('returns existing session ID from sessionStorage', () => {
    const existingId = 'existing-session-id-12345';
    mockSessionStorage['portfolio_session_id'] = existingId;

    const { result } = renderHook(() => useSessionId());

    expect(result.current).toBe(existingId);
  });

  it('does not generate new ID when one exists', () => {
    const existingId = 'existing-session-id';
    mockSessionStorage['portfolio_session_id'] = existingId;

    // Clear any previous calls from setup
    vi.mocked(crypto.randomUUID).mockClear();

    renderHook(() => useSessionId());

    expect(crypto.randomUUID).not.toHaveBeenCalled();
  });

  it('returns consistent ID across multiple renders', () => {
    const { result, rerender } = renderHook(() => useSessionId());
    const firstId = result.current;

    rerender();

    expect(result.current).toBe(firstId);
  });
});
