import type { AxiosError } from 'axios';
import type { ApiErrorBody } from '@/types/auth';

export function isApiError(error: unknown): error is AxiosError<ApiErrorBody> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

export function getApiErrorCode(error: unknown): string | null {
  if (!isApiError(error) || !error.response?.data?.error?.message) {
    return null;
  }

  const message = error.response.data.error.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message[0] ?? null;
  }

  if (typeof message === 'object' && 'code' in message) {
    return message.code;
  }

  return null;
}
