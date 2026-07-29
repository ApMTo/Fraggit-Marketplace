'use client';

import { Flag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useMyReports } from '@/hooks/use-moderation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import type { LotStatus, ModReport, ReportStatus } from '@/types/moderation';

function statusTone(status: ReportStatus): string {
  switch (status) {
    case 'OPEN':
      return 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]';
    case 'IN_REVIEW':
      return 'border-[var(--blue-a24)] bg-[var(--blue-a12)] text-[var(--link)]';
    case 'RESOLVED':
      return 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]';
    case 'DISMISSED':
      return 'border-border bg-surface-elevated text-muted';
    default:
      return 'border-border bg-surface-elevated text-muted';
  }
}

function isLotTarget(
  target: ModReport['target'],
): target is {
  id: string;
  title: string;
  status: LotStatus;
  seller: { id: string; username: string };
} {
  return Boolean(target && 'title' in target);
}

function isUserTarget(
  target: ModReport['target'],
): target is Extract<NonNullable<ModReport['target']>, { username: string }> {
  return Boolean(target && 'username' in target && !('title' in target));
}

function targetLabel(
  report: ModReport,
  t: (key: string) => string,
): string {
  const lotTarget = isLotTarget(report.target) ? report.target : null;
  const userTarget = isUserTarget(report.target) ? report.target : null;

  if (lotTarget) {
    return `${t(`targetLabels.${report.targetType}`)} · ${lotTarget.title}`;
  }
  if (userTarget) {
    return `${t(`targetLabels.${report.targetType}`)} · @${userTarget.username}`;
  }
  return `${t(`targetLabels.${report.targetType}`)} · ${report.targetId.slice(0, 8)}…`;
}

type Props = { title: string };

export function MyReportsPage({ title }: Props) {
  const t = useTranslations('myReports');
  const tReport = useTranslations('moderation.report');
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useMyReports({
    limit: 50,
    enabled: isAuthenticated,
  });

  const reports = data?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-site flex-col gap-6 px-5 py-8 sm:py-10">
      <div>
        <h1 className="page-title text-2xl sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <EmptyState title={t('error')} />
      ) : reports.length === 0 ? (
        <EmptyState icon={Flag} title={t('empty')} description={t('emptyHint')} />
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => {
            const closed =
              report.status === 'RESOLVED' || report.status === 'DISMISSED';

            return (
              <li key={report.id} className="surface-card rounded-lg p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{targetLabel(report, t)}</p>
                    <p className="text-sm text-muted-foreground">
                      {tReport(`reasons.${report.reason}`)}
                      {' · '}
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 rounded-sm border px-2.5 py-1 text-xs font-semibold',
                      statusTone(report.status),
                    )}
                  >
                    {t(`statusLabels.${report.status}`)}
                  </span>
                </div>

                {report.details ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {report.details}
                  </p>
                ) : null}

                {closed ? (
                  <div className="mt-4 rounded-md border border-border/70 bg-muted/30 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t('moderatorReply')}
                    </p>
                    {report.resolutionNote ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {report.resolutionNote}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('noReply')}
                      </p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
