import { createContext, useContext, useEffect, useState } from 'react';

// ============================================================
// ThemeProvider — lightweight class-based dark mode (like the
// original alumni app's next-themes setup, without the dep).
// Persists the choice and follows the system preference when
// set to 'system'.
// ============================================================
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolved: 'light',
  setTheme: () => {},
});

const STORAGE_KEY = 'unleashified_theme';

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (window.localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
    } catch {
      return 'system';
    }
  });
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme
  );

  useEffect(() => {
    const apply = () => {
      const next = theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;
      setResolved(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    };
    apply();
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, resolved, setTheme: setThemeState }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
