import { cookies } from 'next/headers';
import { defaultTheme, isTheme, themeCookieName } from '@/lib/theme';

export async function getTheme() {
  const cookieStore = await cookies();
  const value = cookieStore.get(themeCookieName)?.value;

  if (value && isTheme(value)) {
    return value;
  }

  return defaultTheme;
}
