import { defaultLocale, locales, type Locale } from '@/i18n/config';
import { getServerApiBaseUrl } from '@/lib/api-base';
import { unwrapApiResponse } from '@/lib/api-response';

type PublicFetchOptions = Omit<RequestInit, 'body'> & {
  locale?: string;
  query?: Record<string, string | undefined>;
  revalidate?: number;
  tags?: string[];
};

function resolveLocale(locale?: string): Locale {
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
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

/**
 * Public backend fetch without cookies. Uses Next.js Data Cache with TTL/tags.
 */
export async function serverFetchPublic<T>(
  path: string,
  options: PublicFetchOptions = {},
): Promise<{ data: T | null; status: number }> {
  const {
    locale,
    query,
    revalidate = 60,
    tags,
    headers,
    ...rest
  } = options;
  const apiBase = await getServerApiBaseUrl();

  try {
    const response = await fetch(`${apiBase}${appendQuery(path, query)}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': resolveLocale(locale),
        ...headers,
      },
      next: {
        revalidate,
        ...(tags?.length ? { tags } : {}),
      },
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
