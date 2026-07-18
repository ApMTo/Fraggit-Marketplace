import {
  DEFAULT_LOCALE,
  normalizeLocale,
  parseAcceptLanguageHeader,
  parseLocalizedName,
  resolveLocalizedName,
  toLocalizedNameInput,
} from './locale';

describe('locale i18n helpers', () => {
  it('normalizes unknown locales to en', () => {
    expect(normalizeLocale('ru')).toBe('ru');
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('de')).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
  });

  it('parses Accept-Language header with en fallback', () => {
    expect(parseAcceptLanguageHeader('ru')).toBe('ru');
    expect(parseAcceptLanguageHeader('ru-RU,ru;q=0.9,en;q=0.8')).toBe('ru');
    expect(parseAcceptLanguageHeader('en-US')).toBe('en');
    expect(parseAcceptLanguageHeader('de-DE,de;q=0.9')).toBe(DEFAULT_LOCALE);
    expect(parseAcceptLanguageHeader(undefined)).toBe(DEFAULT_LOCALE);
  });

  it('parses string and object names', () => {
    expect(parseLocalizedName('Accounts')).toEqual({ en: 'Accounts' });
    expect(parseLocalizedName({ en: 'Accounts', ru: 'Аккаунты' })).toEqual({
      en: 'Accounts',
      ru: 'Аккаунты',
    });
  });

  it('unwraps double-encoded localized names', () => {
    const encoded = JSON.stringify({ en: 'Accounts', ru: 'Аккаунты' });

    expect(parseLocalizedName(encoded)).toEqual({
      en: 'Accounts',
      ru: 'Аккаунты',
    });
    expect(parseLocalizedName({ en: encoded })).toEqual({
      en: 'Accounts',
      ru: 'Аккаунты',
    });
    expect(resolveLocalizedName({ en: encoded }, 'ru')).toBe('Аккаунты');
  });

  it('resolves locale with en fallback', () => {
    const name = { en: 'Accounts', ru: 'Аккаунты' };

    expect(resolveLocalizedName(name, 'ru')).toBe('Аккаунты');
    expect(resolveLocalizedName(name, 'en')).toBe('Accounts');
    expect(resolveLocalizedName(name, 'de')).toBe('Accounts');
    expect(resolveLocalizedName({ en: 'Accounts' }, 'ru')).toBe('Accounts');
  });

  it('trims localized name input', () => {
    expect(
      toLocalizedNameInput({ en: '  Accounts  ', ru: '  Аккаунты  ' }),
    ).toEqual({ en: 'Accounts', ru: 'Аккаунты' });
  });
});
