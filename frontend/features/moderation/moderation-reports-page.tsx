'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';
import { ReasonActionDialog } from '@/features/moderation/components/reason-action-dialog';
import { useModerationMutations, useModReports } from '@/hooks/use-moderation';
import { userProfileHref } from '@/lib/app-nav';
import type {
  LotStatus,
  ModReport,
  ReportStatus,
  ReportTargetType,
} from '@/types/moderation';

type Props = { title: string };

type ReportAction = {
  id: string;
  status: Extract<ReportStatus, 'RESOLVED' | 'DISMISSED' | 'IN_REVIEW'>;
};

type LotAction = {
  kind: 'under-review' | 'remove';
  lotId: string;
};

const STATUS_FILTERS: Array<ReportStatus | 'ALL'> = [
  'ALL',
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'DISMISSED',
];

const TARGET_FILTERS: Array<ReportTargetType | 'ALL'> = [
  'ALL',
  'LOT',
  'USER',
  'REVIEW',
  'MESSAGE',
];

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
): target is {
  id: string;
  username: string;
  displayName: string;
  status: string;
} {
  return Boolean(target && 'username' in target && !('title' in target));
}

export function ModerationReportsPage({ title }: Props) {
  const t = useTranslations('moderation.reports');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>(
    'OPEN',
  );
  const [targetFilter, setTargetFilter] = useState<ReportTargetType | 'ALL'>(
    'ALL',
  );
  const { data, isLoading, isError } = useModReports({
    limit: 40,
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(targetFilter !== 'ALL' ? { targetType: targetFilter } : {}),
  });
  const { updateReport, underReviewLot, removeLot } = useModerationMutations();
  const [action, setAction] = useState<ReportAction | null>(null);
  const [lotAction, setLotAction] = useState<LotAction | null>(null);

  return (
    <ModerationShell title={title}>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={statusFilter === status ? 'default' : 'secondary'}
            onClick={() => setStatusFilter(status)}
          >
            {t(`filters.status.${status}`)}
          </Button>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {TARGET_FILTERS.map((target) => (
          <Button
            key={target}
            type="button"
            size="sm"
            variant={targetFilter === target ? 'default' : 'secondary'}
            onClick={() => setTargetFilter(target)}
          >
            {t(`filters.target.${target}`)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <EmptyState title={t('error')} />
      ) : data.items.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <div className="surface-card overflow-x-auto rounded-lg">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">{t('columns.target')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.reason')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.status')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((report) => {
                const lotTarget = isLotTarget(report.target)
                  ? report.target
                  : null;
                const userTarget = isUserTarget(report.target)
                  ? report.target
                  : null;

                return (
                  <tr key={report.id} className="border-b border-border/60">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {report.targetType}
                        {lotTarget ? ` · ${lotTarget.title}` : null}
                        {userTarget ? ` · @${userTarget.username}` : null}
                        {!lotTarget && !userTarget
                          ? ` · ${report.targetId.slice(0, 8)}…`
                          : null}
                      </p>
                      {report.details ? (
                        <p className="mt-1 max-w-md text-xs text-muted-foreground">
                          {report.details}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        @{report.reporter.username}
                        {lotTarget ? (
                          <>
                            {' · '}
                            <Link
                              href="/moderation/lots"
                              className="underline-offset-2 hover:underline"
                            >
                              {t('openLots')}
                            </Link>
                            {' · '}
                            <Link
                              href={userProfileHref(lotTarget.seller.username)}
                              className="underline-offset-2 hover:underline"
                            >
                              @{lotTarget.seller.username}
                            </Link>
                          </>
                        ) : null}
                        {userTarget ? (
                          <>
                            {' · '}
                            <Link
                              href={`/moderation/users/${userTarget.id}`}
                              className="underline-offset-2 hover:underline"
                            >
                              {t('openUser')}
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </td>
                    <td className="px-4 py-3">{report.reason}</td>
                    <td className="px-4 py-3">
                      <span>{report.status}</span>
                      {lotTarget ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('lotStatus', { status: lotTarget.status })}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {report.status === 'OPEN' ||
                        report.status === 'IN_REVIEW' ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setAction({
                                  id: report.id,
                                  status: 'IN_REVIEW',
                                })
                              }
                            >
                              {t('actions.review')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setAction({
                                  id: report.id,
                                  status: 'RESOLVED',
                                })
                              }
                            >
                              {t('actions.resolve')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setAction({
                                  id: report.id,
                                  status: 'DISMISSED',
                                })
                              }
                            >
                              {t('actions.dismiss')}
                            </Button>
                          </>
                        ) : null}
                        {lotTarget && lotTarget.status !== 'UNDER_REVIEW' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setLotAction({
                                kind: 'under-review',
                                lotId: lotTarget.id,
                              })
                            }
                          >
                            {t('actions.lotUnderReview')}
                          </Button>
                        ) : null}
                        {lotTarget && lotTarget.status !== 'REMOVED' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setLotAction({
                                kind: 'remove',
                                lotId: lotTarget.id,
                              })
                            }
                          >
                            {t('actions.lotRemove')}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
              payload: { status: action.status, reason },
            });
            toast.success(t('actionSuccess'));
            setAction(null);
          } catch {
            toast.error(t('actionError'));
          }
        }}
      />

      <ReasonActionDialog
        open={Boolean(lotAction)}
        title={
          lotAction?.kind === 'remove'
            ? t('lotRemoveTitle')
            : t('lotUnderReviewTitle')
        }
        onClose={() => setLotAction(null)}
        onConfirm={async (reason) => {
          if (!lotAction) return;
          try {
            if (lotAction.kind === 'remove') {
              await removeLot.mutateAsync({
                id: lotAction.lotId,
                payload: { reason },
              });
            } else {
              await underReviewLot.mutateAsync({
                id: lotAction.lotId,
                payload: { reason },
              });
            }
            toast.success(t('lotActionSuccess'));
            setLotAction(null);
          } catch {
            toast.error(t('actionError'));
          }
        }}
      />
    </ModerationShell>
  );
}
