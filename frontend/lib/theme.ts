export const themes = ['dark', 'light'] as const;

export type Theme = (typeof themes)[number];

export const defaultTheme: Theme = 'dark';

export const themeCookieName = 'theme';

export const themeCookieMaxAge = 60 * 60 * 24 * 365;

export function setThemeCookie(theme: Theme) {
  document.cookie = `${themeCookieName}=${theme}; path=/; max-age=${themeCookieMaxAge}; samesite=lax`;
}

export function isTheme(value: string): value is Theme {
  return themes.includes(value as Theme);
}

export const localeLabels: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
};

export const localeShortLabels: Record<string, string> = {
  en: 'EN',
  ru: 'RU',
};
