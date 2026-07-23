'use client';

import { useTranslations } from 'next-intl';
import { AuditLog } from '@/features/moderation/components/audit-log';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';

type Props = { title: string };

export function ModerationAuditPage({ title }: Props) {
  const t = useTranslations('moderation.audit');

  return (
    <ModerationShell title={title}>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        {t('hint')}
      </p>
      <AuditLog limit={40} />
    </ModerationShell>
  );
}
