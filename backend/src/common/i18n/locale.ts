export const APP_LOCALES = ['en', 'ru'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

export type LocalizedName = {
  en: string;
  ru?: string;
};

export function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(locale?: string | null): AppLocale {
  if (locale && isAppLocale(locale)) {
    return locale;
  }

  return DEFAULT_LOCALE;
}

export function parseAcceptLanguageHeader(
  header?: string | string[] | null,
): AppLocale {
  const raw = Array.isArray(header) ? header[0] : header;

  if (!raw?.trim()) {
    return DEFAULT_LOCALE;
  }

  const primary = raw.split(',')[0]?.trim().split(';')[0]?.trim().toLowerCase();
  const language = primary?.split('-')[0];

  return normalizeLocale(language);
}

export function parseLocalizedName(value: unknown): LocalizedName {
  if (typeof value === 'string') {
    return { en: value };
  }

  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as { en?: unknown }).en === 'string'
  ) {
    const record = value as { en: string; ru?: unknown };
    const parsed: LocalizedName = { en: record.en };

    if (typeof record.ru === 'string' && record.ru.trim()) {
      parsed.ru = record.ru;
    }

    return parsed;
  }

  return { en: '' };
}

export function resolveLocalizedName(
  value: unknown,
  locale?: string | null,
): string {
  const translations = parseLocalizedName(value);
  const requested = normalizeLocale(locale);
  const resolved = translations[requested] ?? translations[DEFAULT_LOCALE];

  return resolved?.trim() ? resolved : translations.en;
}

export function toLocalizedNameInput(name: LocalizedName): LocalizedName {
  const result: LocalizedName = { en: name.en.trim() };

  if (name.ru?.trim()) {
    result.ru = name.ru.trim();
  }

  return result;
}
