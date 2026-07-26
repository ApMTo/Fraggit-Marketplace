'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';
import { useModOverview } from '@/hooks/use-moderation';

type Props = { title: string };

export function ModerationOverviewPage({ title }: Props) {
  const t = useTranslations('moderation.overview');
  const { data, isLoading, isError } = useModOverview();

  return (
    <ModerationShell title={title}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <EmptyState title={t('error')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/moderation/reports/lots"
            className="surface-card block rounded-lg p-5 transition-colors hover:bg-muted/40"
          >
            <p className="text-sm text-muted-foreground">{t('openReports')}</p>
            <p className="mt-2 text-3xl font-semibold">{data.openReports}</p>
          </Link>
          <Link
            href="/moderation/tickets"
            className="surface-card block rounded-lg p-5 transition-colors hover:bg-muted/40"
          >
            <p className="text-sm text-muted-foreground">{t('openTickets')}</p>
            <p className="mt-2 text-3xl font-semibold">{data.openTickets}</p>
          </Link>
        </div>
      )}
    </ModerationShell>
  );
}
