'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { AuditLog } from '@/features/moderation/components/audit-log';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';
import { ReasonActionDialog } from '@/features/moderation/components/reason-action-dialog';
import { useDebouncedValue } from '@/hooks';
import { useModerationMutations, useModLots } from '@/hooks/use-moderation';
import { cn } from '@/lib/utils';
import type { LotStatus } from '@/types/moderation';

type Props = { title: string };

type LotAction =
  | { type: 'remove'; id: string }
  | { type: 'restore'; id: string }
  | { type: 'underReview'; id: string };

type StatusFilter = 'ALL' | 'UNDER_REVIEW' | 'REMOVED' | 'OPEN';

const FILTERS: StatusFilter[] = ['ALL', 'UNDER_REVIEW', 'OPEN', 'REMOVED'];

export function ModerationLotsPage({ title }: Props) {
  const t = useTranslations('moderation.lots');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('UNDER_REVIEW');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const debounced = useDebouncedValue(search, 300);
  const { data, isLoading, isError } = useModLots({
    search: debounced || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: 30,
  });
  const mutations = useModerationMutations();
  const [action, setAction] = useState<LotAction | null>(null);

  const runAction = async (reason: string) => {
    if (!action) return;
    try {
      if (action.type === 'remove') {
        await mutations.removeLot.mutateAsync({
          id: action.id,
          payload: { reason },
        });
      } else if (action.type === 'restore') {
        await mutations.restoreLot.mutateAsync({
          id: action.id,
          payload: { reason },
        });
      } else {
        await mutations.underReviewLot.mutateAsync({
          id: action.id,
          payload: { reason },
        });
      }
      toast.success(t('actionSuccess'));
      setSelectedLotId(action.id);
      setAction(null);
    } catch {
      toast.error(t('actionError'));
    }
  };

  return (
    <ModerationShell title={title}>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{t('workflow')}</p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                statusFilter === filter
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`filters.${filter}`)}
            </button>
          ))}
        </div>
        <div className="max-w-sm flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
          />
        </div>
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
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="surface-card overflow-x-auto rounded-lg">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('columns.title')}</th>
                  <th className="px-4 py-3 font-medium">{t('columns.seller')}</th>
                  <th className="px-4 py-3 font-medium">{t('columns.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((lot) => (
                  <tr
                    key={lot.id}
                    className={cn(
                      'border-b border-border/60',
                      selectedLotId === lot.id && 'bg-muted/30',
                    )}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left font-medium hover:underline"
                        onClick={() => setSelectedLotId(lot.id)}
                      >
                        {lot.title}
                      </button>
                      <p className="text-xs text-muted-foreground">{lot.price}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/moderation/users/${lot.sellerId}`}
                        className="hover:underline"
                      >
                        @{lot.seller.username}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{t(`status.${lot.status}` as never)}</td>
                    <td className="px-4 py-3">
                      <LotActions
                        status={lot.status}
                        onRemove={() => setAction({ type: 'remove', id: lot.id })}
                        onUnderReview={() =>
                          setAction({ type: 'underReview', id: lot.id })
                        }
                        onRestore={() =>
                          setAction({ type: 'restore', id: lot.id })
                        }
                        onHistory={() => setSelectedLotId(lot.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedLotId ? (
            <AuditLog
              targetType="LOT"
              targetId={selectedLotId}
              limit={15}
              title={t('historyTitle')}
            />
          ) : (
            <div className="surface-card rounded-lg p-5 text-sm text-muted-foreground">
              {t('selectForHistory')}
            </div>
          )}
        </div>
      )}

      <ReasonActionDialog
        open={Boolean(action)}
        title={t('reasonTitle')}
        onClose={() => setAction(null)}
        onConfirm={runAction}
      />
    </ModerationShell>
  );
}

function LotActions({
  status,
  onRemove,
  onUnderReview,
  onRestore,
  onHistory,
}: {
  status: LotStatus;
  onRemove: () => void;
  onUnderReview: () => void;
  onRestore: () => void;
  onHistory: () => void;
}) {
  const t = useTranslations('moderation.lots');

  return (
    <div className="flex flex-wrap gap-1">
      {status === 'OPEN' || status === 'CLOSED' || status === 'ARCHIVED' ? (
        <>
          <Button type="button" size="sm" variant="secondary" onClick={onUnderReview}>
            {t('actions.underReview')}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={onRemove}>
            {t('actions.remove')}
          </Button>
        </>
      ) : null}

      {status === 'UNDER_REVIEW' ? (
        <>
          <Button type="button" size="sm" variant="secondary" onClick={onRestore}>
            {t('actions.approve')}
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={onRemove}>
            {t('actions.reject')}
          </Button>
        </>
      ) : null}

      {status === 'REMOVED' ? (
        <Button type="button" size="sm" variant="secondary" onClick={onRestore}>
          {t('actions.restore')}
        </Button>
      ) : null}

      <Button type="button" size="sm" variant="ghost" onClick={onHistory}>
        {t('actions.history')}
      </Button>
    </div>
  );
}
