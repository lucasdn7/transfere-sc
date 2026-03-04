
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type LayoutPosition = 'sidebar' | 'top';
type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  theme: Theme;
  layoutPosition: LayoutPosition;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setLayoutPosition: (position: LayoutPosition) => void;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [layoutPosition, setLayoutPosition] = useState<LayoutPosition>('sidebar');
  const [fontSize, setFontSize] = useState<FontSize>('medium');

  useEffect(() => {
    // Aplicar tema
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    // Aplicar tamanho da fonte
    const root = window.document.documentElement;
    root.classList.remove('text-small', 'text-medium', 'text-large');
    root.classList.add(`text-${fontSize}`);
  }, [fontSize]);

  const value = {
    theme,
    layoutPosition,
    fontSize,
    setTheme,
    setLayoutPosition,
    setFontSize,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
