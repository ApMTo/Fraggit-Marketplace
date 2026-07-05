import { getServerApiBaseUrl } from '@/lib/api-base';
import { unwrapApiResponse } from '@/lib/api-response';

type ServerFetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function serverFetch<T>(
  path: string,
  cookieHeader: string,
  options: ServerFetchOptions = {},
): Promise<{ data: T | null; status: number }> {
  const { body, headers, ...rest } = options;
  const apiBase = await getServerApiBaseUrl();

  const response = await fetch(`${apiBase}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
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
}
