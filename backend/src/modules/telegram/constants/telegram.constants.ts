export const TELEGRAM_LINK_CODE_KEY_PREFIX = 'telegram:link:';
export const TELEGRAM_DEFAULT_LOCALE = 'en' as const;
export const TELEGRAM_LOCALES = ['en', 'ru'] as const;

export type TelegramLocale = (typeof TELEGRAM_LOCALES)[number];

export function isTelegramLocale(value: string): value is TelegramLocale {
  return (TELEGRAM_LOCALES as readonly string[]).includes(value);
}
