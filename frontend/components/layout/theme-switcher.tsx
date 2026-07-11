'use client';

import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { type Theme } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { Switch } from '@/components/ui/switch';

export function ThemeSwitcher() {
  const t = useTranslations('common');
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  function handleCheckedChange(checked: boolean) {
    const nextTheme: Theme = checked ? 'dark' : 'light';

    if (nextTheme === theme) {
      return;
    }

    setTheme(nextTheme);
  }

  return (
    <div className="dropdown-trigger inline-flex items-center gap-2 px-3 py-2">
      <Sun
        className={`size-4 transition-colors duration-300 ${!isDark ? 'text-brand-cyan' : 'text-muted'}`}
        aria-hidden
      />
      <Switch
        checked={isDark}
        onCheckedChange={handleCheckedChange}
        aria-label={t('theme.label')}
      />
      <Moon
        className={`size-4 transition-colors duration-300 ${isDark ? 'text-brand-cyan' : 'text-muted'}`}
        aria-hidden
      />
    </div>
  );
}
