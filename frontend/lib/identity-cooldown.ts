import { IDENTITY_CHANGE_COOLDOWN_DAYS } from '@/types/user';

const COOLDOWN_MS = IDENTITY_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export function getIdentityCooldownEndsAt(
  changedAt: string | null | undefined,
): Date | null {
  if (!changedAt) {
    return null;
  }

  const endsAt = new Date(changedAt).getTime() + COOLDOWN_MS;
  if (Number.isNaN(endsAt) || Date.now() >= endsAt) {
    return null;
  }

  return new Date(endsAt);
}

export function formatCooldownDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
