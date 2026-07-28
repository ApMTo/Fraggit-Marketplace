import type { AccountRestriction } from '@/types/auth';
import { isApiError } from '@/lib/api-error';

function getErrorMessageObject(
  error: unknown,
): Record<string, unknown> | null {
  if (!isApiError(error)) {
    return null;
  }

  const message = error.response?.data?.error?.message;

  if (
    typeof message === 'object' &&
    message !== null &&
    !Array.isArray(message)
  ) {
    return message as Record<string, unknown>;
  }

  return null;
}

export function getAccountRestrictionFromError(
  error: unknown,
): AccountRestriction | null {
  const payload = getErrorMessageObject(error);
  const raw = payload?.restriction;

  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const restriction = raw as Record<string, unknown>;
  const status = restriction.status;

  if (status !== 'BANNED' && status !== 'SUSPENDED') {
    return null;
  }

  return {
    status,
    publicMessage:
      typeof restriction.publicMessage === 'string'
        ? restriction.publicMessage
        : null,
    caseId:
      typeof restriction.caseId === 'string' ? restriction.caseId : null,
    suspendedUntil:
      typeof restriction.suspendedUntil === 'string'
        ? restriction.suspendedUntil
        : null,
  };
}

export function isAccountRestrictionError(error: unknown): boolean {
  return getAccountRestrictionFromError(error) !== null;
}
