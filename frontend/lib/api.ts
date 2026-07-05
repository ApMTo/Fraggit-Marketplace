import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getClientApiBaseUrl } from '@/lib/api-base';
import { unwrapApiResponse } from '@/lib/api-response';
import { clearCsrfToken, getCsrfToken, setCsrfToken } from '@/lib/csrf';
import type { AuthSessionResponse } from '@/types/auth';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

export const api = axios.create({
  baseURL: getClientApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const AUTH_SKIP_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/verify/',
];

function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  return AUTH_SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

function attachCsrfHeader(config: InternalAxiosRequestConfig): void {
  const method = config.method?.toUpperCase();

  if (!method || !MUTATING_METHODS.has(method)) {
    return;
  }

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers.set('x-csrf-token', csrfToken);
  }
}

let refreshPromise: Promise<AuthSessionResponse | null> | null = null;

async function refreshSession(): Promise<AuthSessionResponse | null> {
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    return null;
  }

  try {
    const { data } = await api.post<AuthSessionResponse>(
      '/auth/refresh',
      {},
      {
        skipAuthRefresh: true,
        headers: { 'x-csrf-token': csrfToken },
      } as unknown as RetryableRequestConfig,
    );

    setCsrfToken(data.csrfToken);
    return data;
  } catch {
    clearCsrfToken();
    return null;
  }
}

function getRefreshPromise(): Promise<AuthSessionResponse | null> {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  attachCsrfHeader(config);
  return config;
});

api.interceptors.response.use(
  (response) => {
    response.data = unwrapApiResponse(response.data);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshed = await getRefreshPromise();
    if (!refreshed) {
      return Promise.reject(error);
    }

    attachCsrfHeader(originalRequest);
    return api(originalRequest);
  },
);

export default api;
