import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  let mockLocalStorage: Record<string, string>;
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLocalStorage = {};

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key) => mockLocalStorage[key] ?? null,
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockLocalStorage[key] = value;
    });

    // Mock matchMedia - default to light mode
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia as typeof window.matchMedia;

    // Mock document.documentElement.classList
    vi.spyOn(document.documentElement.classList, 'add').mockImplementation(() => undefined);
    vi.spyOn(document.documentElement.classList, 'remove').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default system preference when no stored value', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('system');
    expect(result.current.isSystem).toBe(true);
  });

  it('respects stored dark theme preference', () => {
    mockLocalStorage['theme-preference'] = 'dark';

    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(result.current.isLight).toBe(false);
  });

  it('respects stored light theme preference', () => {
    mockLocalStorage['theme-preference'] = 'light';

    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('light');
    expect(result.current.isLight).toBe(true);
    expect(result.current.isDark).toBe(false);
  });

  it('toggleTheme toggles from system to opposite of system preference', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('system');

    act(() => {
      result.current.toggleTheme();
    });

    // System was light (matches: false), so toggle should go to dark
    expect(result.current.preference).toBe('dark');
  });

  it('toggleTheme toggles back to system from explicit theme', () => {
    mockLocalStorage['theme-preference'] = 'dark';

    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.preference).toBe('system');
  });

  it('setTheme updates preference correctly', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.preference).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(mockLocalStorage['theme-preference']).toBe('dark');
  });

  it('detects system dark mode preference', () => {
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('returns correct boolean flags for light theme', () => {
    mockLocalStorage['theme-preference'] = 'light';

    const { result } = renderHook(() => useTheme());

    expect(result.current.isLight).toBe(true);
    expect(result.current.isDark).toBe(false);
    expect(result.current.isSystem).toBe(false);
  });

  it('applies theme class to document', () => {
    const addSpy = vi.spyOn(document.documentElement.classList, 'add');

    renderHook(() => useTheme());

    expect(addSpy).toHaveBeenCalled();
  });
});
