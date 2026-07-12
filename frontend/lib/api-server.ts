import { cache } from 'react';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from '@/i18n/config';
import { getServerApiBaseUrl } from '@/lib/api-base';
import { unwrapApiResponse } from '@/lib/api-response';

type ServerFetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  locale?: string;
  query?: Record<string, string | undefined>;
};

function resolveServerLocale(
  cookieHeader: string,
  locale?: string,
): Locale {
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }

  const match = cookieHeader.match(/(?:^|;\s*)locale=([^;]*)/);
  const cookieLocale = match?.[1] ? decodeURIComponent(match[1]) : null;

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  return defaultLocale;
}

function appendQuery(
  path: string,
  query?: Record<string, string | undefined>,
): string {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export const getRequestCookieHeader = cache(async (): Promise<string> => {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
});

export async function serverFetch<T>(
  path: string,
  cookieHeader: string,
  options: ServerFetchOptions = {},
): Promise<{ data: T | null; status: number }> {
  const { body, headers, locale, query, ...rest } = options;
  const apiBase = await getServerApiBaseUrl();

  try {
    const response = await fetch(`${apiBase}${appendQuery(path, query)}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
        'Accept-Language': resolveServerLocale(cookieHeader, locale),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    if (!response.ok) {
      return { data: null, status: response.status };
    }

    const json: unknown = await response.json();
    const data = unwrapApiResponse<T>(json);

    return { data, status: response.status };
  } catch {
    return { data: null, status: 0 };
  }
}

export async function serverGet<T>(
  path: string,
  options: Pick<ServerFetchOptions, 'locale' | 'query'> = {},
): Promise<{ data: T | null; status: number }> {
  const cookieHeader = await getRequestCookieHeader();
  return serverFetch<T>(path, cookieHeader, options);
}
