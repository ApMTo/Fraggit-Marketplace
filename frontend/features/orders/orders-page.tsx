'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { formatLotPrice } from '@/features/listings/lib/format-lot-price';
import { useOrders } from '@/hooks';
import { useAuth } from '@/providers/AuthProvider';
import type { OrderStatus } from '@/types/order';

function statusTone(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]';
    case 'AWAITING_BUYER_CONFIRMATION':
      return 'border-[var(--blue-a24)] bg-[var(--blue-a12)] text-[var(--link)]';
    case 'APPROVED':
      return 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]';
    default:
      return 'border-border bg-surface-elevated text-muted';
  }
}

export function OrdersPage() {
  const t = useTranslations('orders');
  const locale = useLocale();
  const { user } = useAuth();
  const { data, isLoading, isError } = useOrders({ limit: 50 });

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[960px] justify-center px-5 py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[960px] px-5 py-10">
        <EmptyState
          icon={Package}
          title={t('loadErrorTitle')}
          description={t('loadErrorDescription')}
        />
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-5 py-10">
      <header className="space-y-1">
        <h1 className="page-title text-3xl">{t('title')}</h1>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Link
              href="/listings"
              className="btn-secondary inline-flex h-11 items-center px-6 text-sm"
            >
              {t('browseListings')}
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          {items.map((order) => {
            const coverUrl =
              order.lot.previewUrl ?? order.lot.images[0]?.url ?? null;
            const isBuyer = user?.id === order.buyerId;
            const roleLabel = isBuyer ? t('roleBuyer') : t('roleSeller');

            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface-elevated sm:px-5"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-surface-elevated">
                    {coverUrl ? (
                      <AppImage
                        src={coverUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-subtle">
                        <Package className="size-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-foreground">
                        {order.lot.title}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-[11px] font-semibold ${statusTone(order.status)}`}
                      >
                        {t(`status.${order.status}`)}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {t('orderNumber', { number: order.orderNumber })} ·{' '}
                      {roleLabel}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold tabular-nums text-success">
                    {formatLotPrice(order.price, locale)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
