'use client';

import { useTranslations } from 'next-intl';
import type { AccountRestriction } from '@/types/auth';

type Props = {
  restriction: AccountRestriction;
};

export function AccountRestrictionPanel({ restriction }: Props) {
  const t = useTranslations('auth.restriction');

  return (
    <div
      className="space-y-3 rounded-lg border border-[var(--warning)]/35 bg-[var(--warning)]/10 p-4 text-sm"
      role="alert"
    >
      <p className="font-semibold text-foreground">
        {restriction.status === 'BANNED' ? t('bannedTitle') : t('suspendedTitle')}
      </p>

      {restriction.publicMessage ? (
        <p className="whitespace-pre-wrap text-muted-foreground">
          {restriction.publicMessage}
        </p>
      ) : (
        <p className="text-muted-foreground">{t('noMessage')}</p>
      )}

      {restriction.caseId ? (
        <p className="text-xs text-muted-foreground">
          {t('caseId', { id: restriction.caseId })}
        </p>
      ) : null}

      {restriction.suspendedUntil ? (
        <p className="text-xs text-muted-foreground">
          {t('until', {
            date: new Date(restriction.suspendedUntil).toLocaleString(),
          })}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">{t('appealHint')}</p>
    </div>
  );
}
