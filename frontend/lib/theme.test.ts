import { describe, expect, it } from 'vitest';
import { defaultTheme, isTheme, themeCookieName, themes } from './theme';

describe('theme helpers', () => {
  it('exposes supported themes', () => {
    expect(themes).toEqual(['dark', 'light']);
    expect(defaultTheme).toBe('dark');
    expect(themeCookieName).toBe('theme');
  });

  it('validates theme values', () => {
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('light')).toBe(true);
    expect(isTheme('system')).toBe(false);
  });
});
