'use client';

import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { type Theme } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';

export function ThemeSwitcher() {
  const t = useTranslations('common');
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  function toggleTheme() {
    const nextTheme: Theme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t('theme.label')}
      className="dropdown-trigger inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground"
    >
      {isDark ? (
        <Moon className="size-4 text-muted" aria-hidden />
      ) : (
        <Sun className="size-4 text-muted" aria-hidden />
      )}
    </button>
  );
}
