'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';
import { ReasonActionDialog } from '@/features/moderation/components/reason-action-dialog';
import { ReportedConversation } from '@/features/moderation/components/reported-conversation';
import { useModerationMutations, useModReports } from '@/hooks/use-moderation';
import { userProfileHref } from '@/lib/app-nav';
import { cn } from '@/lib/utils';
import type {
  LotStatus,
  ModReport,
  ReportStatus,
  ReportTargetType,
} from '@/types/moderation';

type Props = {
  title: string;
  targetType: ReportTargetType;
};

type ReportAction = {
  id: string;
  status: Extract<ReportStatus, 'RESOLVED' | 'DISMISSED' | 'IN_REVIEW'>;
};

type LotAction = {
  kind: 'under-review' | 'remove' | 'reject' | 'approve' | 'restore';
  lotId: string;
  reportId: string;
};

function lotActionTitle(
  kind: LotAction['kind'],
  t: (key: string) => string,
): string {
  switch (kind) {
    case 'approve':
      return t('lotApproveTitle');
    case 'restore':
      return t('lotRestoreTitle');
    case 'reject':
      return t('lotRejectTitle');
    case 'remove':
      return t('lotRemoveTitle');
    default:
      return t('lotUnderReviewTitle');
  }
}

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

function reportLabel(report: ModReport): string {
  const lotTarget = isLotTarget(report.target) ? report.target : null;
  const userTarget = isUserTarget(report.target) ? report.target : null;

  if (lotTarget) return lotTarget.title;
  if (userTarget) return `@${userTarget.username}`;
  return `${report.targetId.slice(0, 8)}…`;
}

export function ModerationReportsPage({ title, targetType }: Props) {
  const t = useTranslations('moderation.reports');
  const tReport = useTranslations('moderation.report');
  const { data, isLoading, isError } = useModReports({
    limit: 50,
    targetType,
  });
  const { updateReport, underReviewLot, removeLot, restoreLot } =
    useModerationMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<ReportAction | null>(null);
  const [lotAction, setLotAction] = useState<LotAction | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const allReports = data?.items ?? [];
  const activeReports = allReports.filter(
    (report) => report.status === 'OPEN' || report.status === 'IN_REVIEW',
  );
  const closedReports = allReports.filter(
    (report) => report.status === 'RESOLVED' || report.status === 'DISMISSED',
  );
  const reports = showClosed
    ? [...activeReports, ...closedReports]
    : activeReports;
  const selected =
    reports.find((report) => report.id === selectedId) ?? null;

  return (
    <ModerationShell title={title}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <EmptyState title={t('error')} />
      ) : allReports.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <div className="grid min-h-140 gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
          <aside
            className={cn(
              'surface-card flex min-h-0 flex-col overflow-hidden rounded-lg',
              selectedId ? 'hidden lg:flex' : 'flex',
            )}
          >
            <div className="shrink-0 border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`sections.${targetType}`)}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('listCount', { count: activeReports.length })}
              </p>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto p-1">
              {activeReports.length === 0 ? (
                <li className="px-3 py-4 text-sm text-muted-foreground">
                  {t('noActive')}
                </li>
              ) : null}
              {reports.map((report) => {
                const isSelected = report.id === selectedId;
                return (
                  <li key={report.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(report.id)}
                      className={cn(
                        'flex w-full flex-col gap-1 rounded-md px-3 py-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-foreground text-background'
                          : 'hover:bg-muted',
                      )}
                    >
                      <span className="line-clamp-1 text-sm font-medium">
                        {reportLabel(report)}
                      </span>
                      <span
                        className={cn(
                          'flex flex-wrap items-center gap-2 text-xs',
                          isSelected
                            ? 'text-background/70'
                            : 'text-muted-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'inline-flex rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold',
                            isSelected
                              ? 'border-background/30 bg-background/15 text-background'
                              : statusTone(report.status),
                          )}
                        >
                          {t(`statusLabels.${report.status}`)}
                        </span>
                        <span>{tReport(`reasons.${report.reason}`)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {closedReports.length > 0 ? (
              <div className="shrink-0 border-t border-border p-2">
                <button
                  type="button"
                  onClick={() => setShowClosed((prev) => !prev)}
                  className="w-full rounded-md px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showClosed
                    ? t('hideClosed')
                    : t('showClosed', { count: closedReports.length })}
                </button>
              </div>
            ) : null}
          </aside>

          <main
            className={cn(
              'surface-card flex min-h-0 flex-col overflow-hidden rounded-lg',
              selectedId ? 'flex' : 'hidden lg:flex',
            )}
          >
            {selected ? (
              <ReportDetail
                report={selected}
                onBack={() => setSelectedId(null)}
                onAction={setAction}
                onLotAction={setLotAction}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                  icon={Flag}
                  title={t('selectTitle')}
                  description={t('selectDescription')}
                />
              </div>
            )}
          </main>
        </div>
      )}

      <ReasonActionDialog
        open={Boolean(action)}
        title={t('reasonTitle')}
        onClose={() => setAction(null)}
        onConfirm={async (reason) => {
          if (!action) return;
          try {
            await updateReport.mutateAsync({
              id: action.id,
              payload: {
                status: action.status,
                reason,
                ...(action.status === 'RESOLVED' ||
                action.status === 'DISMISSED'
                  ? { resolutionNote: reason }
                  : {}),
              },
            });
            toast.success(t('actionSuccess'));
            if (
              (action.status === 'RESOLVED' ||
                action.status === 'DISMISSED') &&
              !showClosed
            ) {
              setSelectedId(null);
            }
            setAction(null);
          } catch {
            toast.error(t('actionError'));
          }
        }}
      />

      <ReasonActionDialog
        open={Boolean(lotAction)}
        title={lotAction ? lotActionTitle(lotAction.kind, t) : ''}
        onClose={() => setLotAction(null)}
        onConfirm={async (reason) => {
          if (!lotAction) return;
          try {
            if (lotAction.kind === 'remove' || lotAction.kind === 'reject') {
              await removeLot.mutateAsync({
                id: lotAction.lotId,
                payload: { reason },
              });
            } else if (
              lotAction.kind === 'approve' ||
              lotAction.kind === 'restore'
            ) {
              await restoreLot.mutateAsync({
                id: lotAction.lotId,
                payload: { reason },
              });
            } else {
              await underReviewLot.mutateAsync({
                id: lotAction.lotId,
                payload: { reason },
              });
            }

            await updateReport.mutateAsync({
              id: lotAction.reportId,
              payload: {
                status:
                  lotAction.kind === 'under-review'
                    ? 'IN_REVIEW'
                    : lotAction.kind === 'remove' ||
                        lotAction.kind === 'reject'
                      ? 'RESOLVED'
                      : 'DISMISSED',
                reason,
                ...(lotAction.kind !== 'under-review'
                  ? { resolutionNote: reason }
                  : {}),
              },
            });

            toast.success(t('lotActionSuccess'));
            if (lotAction.kind !== 'under-review' && !showClosed) {
              setSelectedId(null);
            }
            setLotAction(null);
          } catch {
            toast.error(t('actionError'));
          }
        }}
      />
    </ModerationShell>
  );
}

function ReportDetail({
  report,
  onBack,
  onAction,
  onLotAction,
}: {
  report: ModReport;
  onBack: () => void;
  onAction: (action: ReportAction) => void;
  onLotAction: (action: LotAction) => void;
}) {
  const t = useTranslations('moderation.reports');
  const tReport = useTranslations('moderation.report');
  const tLotStatus = useTranslations('moderation.lots.status');
  const lotTarget = isLotTarget(report.target) ? report.target : null;
  const userTarget = isUserTarget(report.target) ? report.target : null;
  const canAct =
    report.status === 'OPEN' || report.status === 'IN_REVIEW';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 text-sm text-muted-foreground hover:text-foreground lg:hidden"
        >
          ← {t('backToList')}
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {t(`targetLabels.${report.targetType}`)} · {reportLabel(report)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('reporter')}: @{report.reporter.username}
              {' · '}
              {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`inline-flex rounded-sm border px-2.5 py-1 text-xs font-semibold ${statusTone(report.status)}`}
          >
            {t(`statusLabels.${report.status}`)}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <section className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('columns.reason')}
          </h3>
          <p className="text-sm">{tReport(`reasons.${report.reason}`)}</p>
          {report.details ? (
            <p className="text-sm text-muted-foreground">{report.details}</p>
          ) : null}
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('columns.target')}
          </h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {lotTarget ? (
              <>
                <Link
                  href="/moderation/lots"
                  className="underline-offset-2 hover:underline"
                >
                  {t('openLots')}
                </Link>
                <span className="text-muted-foreground">·</span>
                <Link
                  href={userProfileHref(lotTarget.seller.username)}
                  className="underline-offset-2 hover:underline"
                >
                  @{lotTarget.seller.username}
                </Link>
                <span className="text-muted-foreground">
                  {t('lotStatus', {
                    status: tLotStatus(lotTarget.status),
                  })}
                </span>
              </>
            ) : null}
            {userTarget ? (
              <Link
                href={`/moderation/users/${userTarget.id}`}
                className="underline-offset-2 hover:underline"
              >
                {t('openUser')} · @{userTarget.username}
              </Link>
            ) : null}
            {!lotTarget && !userTarget ? (
              <p className="text-muted-foreground">{report.targetId}</p>
            ) : null}
          </div>
        </section>

        {report.targetType === 'MESSAGE' ? (
          <ReportedConversation key={report.id} reportId={report.id} />
        ) : null}

        {report.targetType === 'LOT' ? (
          <ReportedConversation
            key={`${report.id}-private`}
            reportId={report.id}
            privateParties
          />
        ) : null}

        {report.resolutionNote ? (
          <section className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('resolutionNote')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {report.resolutionNote}
            </p>
          </section>
        ) : null}

        {canAct || lotTarget ? (
          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('columns.actions')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.status === 'OPEN' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onAction({ id: report.id, status: 'IN_REVIEW' })
                  }
                >
                  {t('actions.review')}
                </Button>
              ) : null}
              {canAct ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      onAction({ id: report.id, status: 'RESOLVED' })
                    }
                  >
                    {t('actions.resolve')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      onAction({ id: report.id, status: 'DISMISSED' })
                    }
                  >
                    {t('actions.dismiss')}
                  </Button>
                </>
              ) : null}
              {lotTarget &&
              (lotTarget.status === 'OPEN' ||
                lotTarget.status === 'CLOSED' ||
                lotTarget.status === 'ARCHIVED') ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      onLotAction({
                        kind: 'under-review',
                        lotId: lotTarget.id,
                        reportId: report.id,
                      })
                    }
                  >
                    {t('actions.lotUnderReview')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      onLotAction({
                        kind: 'remove',
                        lotId: lotTarget.id,
                        reportId: report.id,
                      })
                    }
                  >
                    {t('actions.lotRemove')}
                  </Button>
                </>
              ) : null}
              {lotTarget && lotTarget.status === 'UNDER_REVIEW' ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      onLotAction({
                        kind: 'approve',
                        lotId: lotTarget.id,
                        reportId: report.id,
                      })
                    }
                  >
                    {t('actions.lotApprove')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      onLotAction({
                        kind: 'reject',
                        lotId: lotTarget.id,
                        reportId: report.id,
                      })
                    }
                  >
                    {t('actions.lotReject')}
                  </Button>
                </>
              ) : null}
              {lotTarget && lotTarget.status === 'REMOVED' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onLotAction({
                      kind: 'restore',
                      lotId: lotTarget.id,
                      reportId: report.id,
                    })
                  }
                >
                  {t('actions.lotRestore')}
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
