'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { setThemePreference } from '@/app/actions/preferences';
import { themes, type Theme } from '@/lib/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { DropdownItem, DropdownMenu } from '@/components/ui/dropdown-menu';

const themeIcons: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
};

export function ThemeSwitcher() {
  const t = useTranslations('common');
  const { theme } = useTheme();
  const router = useRouter();
  const Icon = themeIcons[theme];

  async function handleSelect(nextTheme: Theme) {
    if (nextTheme === theme) {
      return;
    }

    await setThemePreference(nextTheme);
    router.refresh();
  }

  return (
    <DropdownMenu
      trigger={
        <>
          <Icon className="size-4 text-brand-cyan" />
          <span className="hidden sm:inline">{t(`theme.${theme}`)}</span>
        </>
      }
    >
      {themes.map((item) => {
        const ItemIcon = themeIcons[item];

        return (
          <DropdownItem
            key={item}
            isActive={item === theme}
            onSelect={() => void handleSelect(item)}
          >
            <ItemIcon className="size-4" />
            {t(`theme.${item}`)}
          </DropdownItem>
        );
      })}
    </DropdownMenu>
  );
}
