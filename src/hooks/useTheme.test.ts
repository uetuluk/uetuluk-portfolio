import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  let mockLocalStorage: Record<string, string>;
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void>;

  beforeEach(() => {
    mockLocalStorage = {};
    mediaQueryListeners = [];

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
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaQueryListeners.push(listener);
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia as typeof window.matchMedia;

    // Clean up document classes before each test
    document.documentElement.classList.remove('light', 'dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove('light', 'dark');
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

  // NEW TESTS: Real DOM manipulation verification

  it('applies dark class to document.documentElement when theme is dark', () => {
    mockLocalStorage['theme-preference'] = 'dark';

    renderHook(() => useTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('applies light class to document.documentElement when theme is light', () => {
    mockLocalStorage['theme-preference'] = 'light';

    renderHook(() => useTheme());

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggleTheme actually changes DOM classes', () => {
    // Start with system preference (light)
    const { result } = renderHook(() => useTheme());

    // Initial state: system=light, so light class should be applied
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Toggle to dark
    act(() => {
      result.current.toggleTheme();
    });

    // DOM should now have dark class
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('multiple toggles correctly update DOM classes', () => {
    const { result } = renderHook(() => useTheme());

    // Initial: system (light)
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(result.current.preference).toBe('system');

    // First toggle: system -> dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(result.current.preference).toBe('dark');

    // Second toggle: dark -> system (light)
    act(() => {
      result.current.toggleTheme();
    });
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(result.current.preference).toBe('system');

    // Third toggle: system -> dark again
    act(() => {
      result.current.toggleTheme();
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(result.current.preference).toBe('dark');
  });

  it('setTheme actually changes DOM classes', () => {
    const { result } = renderHook(() => useTheme());

    // Set to dark
    act(() => {
      result.current.setTheme('dark');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Set to light
    act(() => {
      result.current.setTheme('light');
    });
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Set back to system (which is light)
    act(() => {
      result.current.setTheme('system');
    });
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('responds to system theme changes when preference is system', () => {
    const { result } = renderHook(() => useTheme());

    // Initially light (system preference)
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Simulate system theme change to dark
    act(() => {
      mediaQueryListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    // Theme should update to dark
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('ignores system theme changes when explicit preference is set', () => {
    mockLocalStorage['theme-preference'] = 'light';

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(result.current.preference).toBe('light');

    // Simulate system theme change to dark
    act(() => {
      mediaQueryListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    // Theme should remain light because explicit preference overrides system
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('returns system preference when localStorage throws an error', () => {
    // Mock localStorage.getItem to throw an error
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage is not available');
    });

    const { result } = renderHook(() => useTheme());

    // Should fall back to system preference when localStorage throws
    expect(result.current.preference).toBe('system');
    expect(result.current.isSystem).toBe(true);
  });

  // Tests for uncovered branches (lines 44, 68)

  it('responds to system theme change back to light via callback', () => {
    // Start with system preference in dark mode
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaQueryListeners.push(listener);
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useTheme());

    // Initially dark (system preference)
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Simulate system theme change back to light (covers line 44 light branch)
    act(() => {
      mediaQueryListeners.forEach((listener) => {
        listener({ matches: false } as MediaQueryListEvent);
      });
    });

    // Theme should update to light
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('toggleTheme toggles to light when system preference is dark', () => {
    // Set system to dark mode
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaQueryListeners.push(listener);
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useTheme());

    // System is dark, preference is system
    expect(result.current.preference).toBe('system');
    expect(result.current.theme).toBe('dark');

    // Toggle should go to opposite of system (dark -> light) - covers line 68
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.preference).toBe('light');
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});
