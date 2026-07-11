import { describe, expect, it } from 'vitest';
import { defaultLocale, locales } from './config';

describe('i18n config', () => {
  it('defines supported locales', () => {
    expect(locales).toEqual(['en', 'ru']);
    expect(defaultLocale).toBe('en');
  });
});
