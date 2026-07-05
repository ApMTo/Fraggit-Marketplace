'use server';

import { cookies } from 'next/headers';
import { locales, type Locale } from '@/i18n/config';
import { isTheme, themeCookieName, type Theme } from '@/lib/theme';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocalePreference(locale: Locale) {
  if (!locales.includes(locale)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set('locale', locale, {
    path: '/',
    maxAge: ONE_YEAR,
    sameSite: 'lax',
  });
}

export async function setThemePreference(theme: Theme) {
  if (!isTheme(theme)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(themeCookieName, theme, {
    path: '/',
    maxAge: ONE_YEAR,
    sameSite: 'lax',
  });
}
