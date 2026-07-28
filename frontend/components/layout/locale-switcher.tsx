'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { setLocalePreference } from '@/app/actions/preferences';
import { locales, type Locale } from '@/i18n/config';
import { localeLabels, localeShortLabels } from '@/lib/theme';
import { DropdownItem, DropdownMenu } from '@/components/ui/dropdown-menu';

export function LocaleSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();

  async function handleSelect(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }

    await setLocalePreference(nextLocale);
    router.refresh();
  }

  return (
    <DropdownMenu
      size="sm"
      align="end"
      trigger={
        <span className="font-medium tracking-wide" aria-label={t('language')}>
          {localeShortLabels[locale]}
        </span>
      }
    >
      {locales.map((item) => (
        <DropdownItem
          key={item}
          isActive={item === locale}
          onSelect={() => void handleSelect(item)}
        >
          <span className="w-7 font-medium tracking-wide">
            {localeShortLabels[item]}
          </span>
          <span className="text-muted">{localeLabels[item]}</span>
        </DropdownItem>
      ))}
    </DropdownMenu>
  );
}
