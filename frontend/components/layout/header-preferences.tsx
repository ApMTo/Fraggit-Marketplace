import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { ThemeSwitcher } from '@/components/layout/theme-switcher';

export function HeaderPreferences() {
  return (
    <div className="flex items-center gap-1">
      <LocaleSwitcher />
      <ThemeSwitcher />
    </div>
  );
}
