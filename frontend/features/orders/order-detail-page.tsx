'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { AppImage } from '@/components/ui/app-image';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FormError } from '@/components/ui/form-error';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatLotPrice } from '@/features/listings/lib/format-lot-price';
import { OrderReviewSection } from '@/features/orders/components/order-review-section';
import {
  useConfirmOrder,
  useOrder,
  useSubmitOrderCredentials,
} from '@/hooks';
import { resolveApiError } from '@/lib/api-errors';
import { userProfileHref } from '@/lib/app-nav';
import { useAuth } from '@/providers/AuthProvider';
import type { OrderStatus } from '@/types/order';

type OrderDetailPageProps = {
  orderId: string;
};

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

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const t = useTranslations('orders');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const { user } = useAuth();
  const { data: order, isLoading, isError } = useOrder(orderId);
  const submitCredentials = useSubmitOrderCredentials(orderId);
  const confirmOrder = useConfirmOrder(orderId);

  const [credentialsDraft, setCredentialsDraft] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[960px] justify-center px-5 py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !order || !user) {
    return (
      <div className="mx-auto w-full max-w-[960px] px-5 py-10">
        <EmptyState
          icon={Package}
          title={t('notFoundTitle')}
          description={t('notFoundDescription')}
          action={
            <Link
              href="/orders"
              className="btn-secondary inline-flex h-11 items-center px-6 text-sm"
            >
              {t('backToOrders')}
            </Link>
          }
        />
      </div>
    );
  }

  const isBuyer = user.id === order.buyerId;
  const isSeller = user.id === order.sellerId;
  const coverUrl = order.lot.previewUrl ?? order.lot.images[0]?.url ?? null;
  const counterparty = isBuyer ? order.seller : order.buyer;
  const counterpartyName =
    counterparty.displayName || counterparty.username;
  const canSubmitCredentials =
    isSeller && order.status === 'PENDING';
  const canConfirm =
    isBuyer && order.status === 'AWAITING_BUYER_CONFIRMATION';
  const showCredentials =
    Boolean(order.credentials) || canSubmitCredentials;

  async function handleSubmitCredentials() {
    const trimmed = credentialsDraft.trim();
    if (!trimmed) {
      setFormError(t('credentialsRequired'));
      return;
    }

    setFormError(null);

    try {
      await submitCredentials.mutateAsync({ credentials: trimmed });
      setCredentialsDraft('');
      toast.success(t('credentialsSubmitted'));
    } catch (error) {
      const resolved = resolveApiError(error);
      setFormError(tErrors(resolved.key, resolved.values));
    }
  }

  async function handleConfirmOrder() {
    try {
      await confirmOrder.mutateAsync();
      setConfirmOpen(false);
      toast.success(t('confirmSuccess'));
    } catch (error) {
      const resolved = resolveApiError(error);
      toast.error(tErrors(resolved.key, resolved.values));
      setConfirmOpen(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-5 py-10">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('backToOrders')}
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted">
            {t('orderNumber', { number: order.orderNumber })}
          </p>
          <h1 className="page-title text-2xl sm:text-3xl">
            {order.lot.title}
          </h1>
        </div>
        <span
          className={`inline-flex w-fit shrink-0 items-center rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold ${statusTone(order.status)}`}
        >
          {t(`status.${order.status}`)}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
            <div className="relative aspect-[16/10] bg-surface-elevated">
              {coverUrl ? (
                <AppImage
                  src={coverUrl}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-subtle">
                  <Package className="size-12" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="space-y-2 border-t border-border p-5">
              <p className="font-display text-2xl font-semibold tabular-nums text-success">
                {formatLotPrice(order.price, locale)}
              </p>
              <p className="text-sm text-muted">{t('lotSummary')}</p>
            </div>
          </section>

          {showCredentials ? (
            <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t('credentialsTitle')}
                </h2>
                <p className="text-sm text-muted">
                  {isSeller
                    ? t('credentialsSellerHint')
                    : t('credentialsBuyerHint')}
                </p>
              </div>

              {canSubmitCredentials ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="order-credentials">
                      {t('credentialsLabel')}
                    </Label>
                    <Textarea
                      id="order-credentials"
                      value={credentialsDraft}
                      onChange={(event) => {
                        setCredentialsDraft(event.target.value);
                        if (formError) {
                          setFormError(null);
                        }
                      }}
                      placeholder={t('credentialsPlaceholder')}
                      rows={6}
                      hasError={Boolean(formError)}
                      disabled={submitCredentials.isPending}
                    />
                    {formError ? <FormError>{formError}</FormError> : null}
                  </div>
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    isLoading={submitCredentials.isPending}
                    onClick={() => void handleSubmitCredentials()}
                  >
                    {t('submitCredentials')}
                  </Button>
                </div>
              ) : order.credentials ? (
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-[var(--radius-sm)] border border-border bg-surface-elevated px-4 py-3 font-mono text-sm text-foreground">
                  {order.credentials}
                </pre>
              ) : (
                <p className="text-sm text-muted">{t('credentialsWaiting')}</p>
              )}
            </section>
          ) : isBuyer && order.status === 'PENDING' ? (
            <section className="space-y-2 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {t('credentialsTitle')}
              </h2>
              <p className="text-sm text-muted">{t('credentialsWaiting')}</p>
            </section>
          ) : null}

          {order.status === 'APPROVED' ? (
            <OrderReviewSection orderId={order.id} canWrite={isBuyer} />
          ) : null}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-md)]">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-subtle">
                {isBuyer ? t('roleBuyer') : t('roleSeller')}
              </p>
              <p className="text-sm text-muted">
                {isBuyer ? t('buyerStatusHint') : t('sellerStatusHint')}
              </p>
            </div>

            <Link
              href={userProfileHref(counterparty.username)}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface-elevated px-3 py-2.5 transition-colors hover:border-border-strong"
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
                {counterparty.avatarUrl ? (
                  <AppImage
                    src={counterparty.avatarUrl}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-subtle">
                    <UserRound className="size-4" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted">
                  {isBuyer ? t('seller') : t('buyer')}
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {counterpartyName}
                </p>
              </div>
            </Link>

            {isBuyer && order.status !== 'APPROVED' ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  className="w-full"
                  disabled={!canConfirm}
                  onClick={() => setConfirmOpen(true)}
                >
                  {t('confirmOrder')}
                </Button>
                {!canConfirm && order.status === 'PENDING' ? (
                  <p className="text-center text-xs text-muted">
                    {t('confirmBlockedUntilData')}
                  </p>
                ) : null}
              </div>
            ) : null}

            {order.status === 'APPROVED' ? (
              <p className="text-center text-xs text-success">
                {t('orderCompleted')}
              </p>
            ) : null}

            {isSeller && order.status === 'AWAITING_BUYER_CONFIRMATION' ? (
              <p className="text-center text-xs text-muted">
                {t('waitingBuyerConfirm')}
              </p>
            ) : null}

            <p className="inline-flex items-center justify-center gap-1.5 text-xs text-muted">
              <ShieldCheck
                className="size-3.5 text-[var(--success)]"
                aria-hidden="true"
              />
              {t('guarantee')}
            </p>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirmOrder()}
        title={t('confirmDialog.title')}
        description={t('confirmDialog.description')}
        confirmLabel={t('confirmDialog.confirm')}
        cancelLabel={t('confirmDialog.cancel')}
        isLoading={confirmOrder.isPending}
        variant="primary"
      />
    </div>
  );
}
