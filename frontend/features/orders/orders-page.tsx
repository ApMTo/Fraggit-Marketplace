'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { formatLotPrice } from '@/features/listings/lib/format-lot-price';
import { useOrders } from '@/hooks';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import type { OrderListItem, OrderRole, OrderStatus } from '@/types/order';

type MainTab = 'purchases' | 'sales' | 'active';
type ActiveSubTab = 'buying' | 'selling';

const ACTIVE_STATUSES: OrderStatus[] = [
  'PENDING',
  'AWAITING_BUYER_CONFIRMATION',
  'DISPUTED',
];

function statusTone(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]';
    case 'AWAITING_BUYER_CONFIRMATION':
      return 'border-[var(--blue-a24)] bg-[var(--blue-a12)] text-[var(--link)]';
    case 'DISPUTED':
      return 'border-destructive/30 bg-destructive/10 text-destructive';
    case 'APPROVED':
      return 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]';
    default:
      return 'border-border bg-surface-elevated text-muted';
  }
}

function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function OrdersPage() {
  const t = useTranslations('orders');
  const locale = useLocale();
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('active');
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>('buying');

  const listRole: OrderRole | undefined =
    mainTab === 'purchases'
      ? 'buyer'
      : mainTab === 'sales'
        ? 'seller'
        : undefined;

  const { data, isLoading, isError } = useOrders({
    role: listRole,
    limit: 50,
  });

  const items = useMemo(() => {
    const all = data?.items ?? [];

    if (mainTab === 'active') {
      const active = all.filter((order) => isActiveStatus(order.status));
      if (!user) {
        return active;
      }
      return active.filter((order) =>
        activeSubTab === 'buying'
          ? order.buyerId === user.id
          : order.sellerId === user.id,
      );
    }

    return all;
  }, [activeSubTab, data?.items, mainTab, user]);

  const activeCounts = useMemo(() => {
    const all = data?.items ?? [];
    const active = all.filter((order) => isActiveStatus(order.status));
    if (!user) {
      return { buying: 0, selling: 0 };
    }
    return {
      buying: active.filter((order) => order.buyerId === user.id).length,
      selling: active.filter((order) => order.sellerId === user.id).length,
    };
  }, [data?.items, user]);

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

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-5 py-10">
      <header className="space-y-1">
        <h1 className="page-title text-3xl">{t('title')}</h1>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </header>

      <div
        role="tablist"
        aria-label={t('tabsLabel')}
        className="flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1"
      >
        {(
          [
            ['active', t('tabs.active')],
            ['purchases', t('tabs.purchases')],
            ['sales', t('tabs.sales')],
          ] as const
        ).map(([id, label]) => {
          const selected = mainTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setMainTab(id)}
              className={cn(
                'min-h-10 flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
                selected
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted hover:bg-surface-hover hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {mainTab === 'active' ? (
        <div
          role="tablist"
          aria-label={t('activeTabsLabel')}
          className="flex gap-1"
        >
          {(
            [
              ['buying', t('tabs.buying'), activeCounts.buying],
              ['selling', t('tabs.selling'), activeCounts.selling],
            ] as const
          ).map(([id, label, count]) => {
            const selected = activeSubTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveSubTab(id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium transition-colors',
                  selected
                    ? 'border-border-strong bg-surface-elevated text-foreground'
                    : 'border-transparent text-muted hover:bg-surface-hover hover:text-foreground',
                )}
              >
                {label}
                <span
                  className={cn(
                    'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                    selected
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-surface-elevated text-subtle',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t(`empty.${mainTab}Title`)}
          description={t(`empty.${mainTab}Description`)}
          action={
            mainTab === 'purchases' ||
            (mainTab === 'active' && activeSubTab === 'buying') ? (
              <Link
                href="/listings"
                className="btn-secondary inline-flex h-11 items-center px-6 text-sm"
              >
                {t('browseListings')}
              </Link>
            ) : null
          }
        />
      ) : (
        <OrderList items={items} userId={user?.id} locale={locale} />
      )}
    </div>
  );
}

function OrderList({
  items,
  userId,
  locale,
}: {
  items: OrderListItem[];
  userId?: string;
  locale: string;
}) {
  const t = useTranslations('orders');

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      {items.map((order) => {
        const coverUrl =
          order.lot.previewUrl ?? order.lot.images[0]?.url ?? null;
        const isBuyer = userId === order.buyerId;
        const roleLabel = isBuyer ? t('roleBuyer') : t('roleSeller');
        const statusLabel =
          order.lot.type === 'SERVICE' && order.status === 'PENDING'
            ? t('status.PENDING_SERVICE')
            : t(`status.${order.status}`);

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
                    {statusLabel}
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
  );
}
