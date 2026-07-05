import { getApiErrorCode } from '@/lib/api-error';

const KNOWN_ERROR_CODES = new Set([
  'email_already_exists',
  'username_already_exists',
  'verification_already_sent',
  'user_already_exists',
  'invalid_or_expired_token',
  'invalid_registration_payload',
  'weak_password',
  'invalid_credentials',
  'email_not_verified',
  'account_deactivated',
  'account_blocked',
  'too_many_attempts',
  'unauthorized',
  'invalid_csrf_token',
  'invalid_refresh_token',
  'no_session_found',
  'session_not_found',
  'invalid_token',
]);

export function resolveAuthErrorKey(error: unknown): string {
  const code = getApiErrorCode(error);

  if (!code) {
    return 'generic';
  }

  const normalized = code.replace(/^errors\./, '');

  if (KNOWN_ERROR_CODES.has(normalized)) {
    return normalized;
  }

  return 'generic';
}
