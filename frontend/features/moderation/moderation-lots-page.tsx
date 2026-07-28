'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
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
import type { LotStatus, ModLot } from '@/types/moderation';

type Props = { title: string };

type LotAction =
  | { type: 'remove'; id: string }
  | { type: 'restore'; id: string }
  | { type: 'underReview'; id: string };

function statusTone(status: LotStatus): string {
  switch (status) {
    case 'UNDER_REVIEW':
      return 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]';
    case 'OPEN':
      return 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]';
    case 'REMOVED':
      return 'border-border bg-surface-elevated text-muted';
    default:
      return 'border-border bg-surface-elevated text-muted';
  }
}

export function ModerationLotsPage({ title }: Props) {
  const t = useTranslations('moderation.lots');
  const [search, setSearch] = useState('');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const debounced = useDebouncedValue(search, 300);
  const { data, isLoading, isError } = useModLots({
    search: debounced || undefined,
    limit: 50,
  });
  const mutations = useModerationMutations();
  const [action, setAction] = useState<LotAction | null>(null);

  const lots = data?.items ?? [];
  const selected = lots.find((lot) => lot.id === selectedLotId) ?? null;

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
      {isLoading && !data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <EmptyState title={t('error')} />
      ) : (
        <div className="grid min-h-[560px] gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
          <aside
            className={cn(
              'surface-card flex min-h-0 flex-col overflow-hidden rounded-lg',
              selectedLotId ? 'hidden lg:flex' : 'flex',
            )}
          >
            <div className="shrink-0 space-y-3 border-b border-border px-3 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('listTitle')}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('listCount', { count: lots.length })}
                </p>
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
              />
            </div>
            {lots.length === 0 ? (
              <div className="p-3">
                <EmptyState title={t('empty')} />
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto p-1">
                {lots.map((lot) => {
                  const isSelected = lot.id === selectedLotId;
                  return (
                    <li key={lot.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLotId(lot.id)}
                        className={cn(
                          'flex w-full flex-col gap-1 rounded-md px-3 py-2.5 text-left transition-colors',
                          isSelected
                            ? 'bg-foreground text-background'
                            : 'hover:bg-muted',
                        )}
                      >
                        <span className="line-clamp-1 text-sm font-medium">
                          {lot.title}
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
                              'inline-flex rounded-[var(--radius-sm)] border px-1.5 py-0.5 text-[10px] font-semibold',
                              isSelected
                                ? 'border-background/30 bg-background/15 text-background'
                                : statusTone(lot.status),
                            )}
                          >
                            {t(`status.${lot.status}` as never)}
                          </span>
                          <span>@{lot.seller.username}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <main
            className={cn(
              'surface-card flex min-h-0 flex-col overflow-hidden rounded-lg',
              selectedLotId ? 'flex' : 'hidden lg:flex',
            )}
          >
            {selected ? (
              <LotDetail
                lot={selected}
                onBack={() => setSelectedLotId(null)}
                onRemove={() =>
                  setAction({ type: 'remove', id: selected.id })
                }
                onUnderReview={() =>
                  setAction({ type: 'underReview', id: selected.id })
                }
                onRestore={() =>
                  setAction({ type: 'restore', id: selected.id })
                }
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                  icon={Package}
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
        onConfirm={runAction}
      />
    </ModerationShell>
  );
}

function LotDetail({
  lot,
  onBack,
  onRemove,
  onUnderReview,
  onRestore,
}: {
  lot: ModLot;
  onBack: () => void;
  onRemove: () => void;
  onUnderReview: () => void;
  onRestore: () => void;
}) {
  const t = useTranslations('moderation.lots');

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
            <h2 className="text-lg font-semibold tracking-tight">{lot.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {lot.price}
              {' · '}
              <Link
                href={`/moderation/users/${lot.sellerId}`}
                className="underline-offset-2 hover:underline"
              >
                @{lot.seller.username}
              </Link>
            </p>
          </div>
          <span
            className={`inline-flex rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-semibold ${statusTone(lot.status)}`}
          >
            {t(`status.${lot.status}` as never)}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('columns.actions')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {lot.status === 'OPEN' ||
            lot.status === 'CLOSED' ||
            lot.status === 'ARCHIVED' ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={onUnderReview}
                >
                  {t('actions.underReview')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={onRemove}
                >
                  {t('actions.remove')}
                </Button>
              </>
            ) : null}
            {lot.status === 'UNDER_REVIEW' ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={onRestore}
                >
                  {t('actions.approve')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={onRemove}
                >
                  {t('actions.reject')}
                </Button>
              </>
            ) : null}
            {lot.status === 'REMOVED' ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onRestore}
              >
                {t('actions.restore')}
              </Button>
            ) : null}
          </div>
        </section>

        <AuditLog
          targetType="LOT"
          targetId={lot.id}
          limit={15}
          title={t('historyTitle')}
        />
      </div>
    </div>
  );
}
