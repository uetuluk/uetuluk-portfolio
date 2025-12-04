import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';
type ThemePreference = Theme | 'system';

const STORAGE_KEY = 'theme-preference';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredPreference(): ThemePreference | null {
  try {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    return getStoredPreference() ?? 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => {
    const stored = getStoredPreference();
    if (stored === 'light' || stored === 'dark') return stored;
    return getSystemTheme();
  });

  const applyTheme = useCallback((theme: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    setResolvedTheme(theme);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // localStorage not available
    }

    if (preference === 'system') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(preference);
    }
  }, [preference, applyTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (preference === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preference, applyTheme]);

  const toggleTheme = useCallback(() => {
    setPreference((current) => {
      if (current === 'system') {
        // Toggle to opposite of system preference
        return getSystemTheme() === 'dark' ? 'light' : 'dark';
      }
      // Go back to system preference
      return 'system';
    });
  }, []);

  const setTheme = useCallback((newPreference: ThemePreference) => {
    setPreference(newPreference);
  }, []);

  return {
    theme: resolvedTheme,
    preference,
    toggleTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: preference === 'system',
  };
}
