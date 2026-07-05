'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { setLocalePreference } from '@/app/actions/preferences';
import { locales, type Locale } from '@/i18n/config';
import { localeLabels } from '@/lib/theme';
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
      trigger={
        <>
          <Globe className="size-4 text-brand-cyan" />
          <span className="hidden sm:inline">{localeLabels[locale]}</span>
        </>
      }
    >
      {locales.map((item) => (
        <DropdownItem
          key={item}
          isActive={item === locale}
          onSelect={() => void handleSelect(item)}
        >
          {localeLabels[item]}
        </DropdownItem>
      ))}
      <span className="sr-only">{t('language')}</span>
    </DropdownMenu>
  );
}
