'use client';

import Link from 'next/link';
import { ArrowLeft, Package, Star, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { AppImage } from '@/components/ui/app-image';
import { Spinner } from '@/components/ui/spinner';
import { formatLotPrice } from '@/features/listings/lib/format-lot-price';
import { useLot } from '@/hooks';
import { userProfileHref } from '@/lib/app-nav';

type LotDetailPageProps = {
  lotId: string;
  categorySlug: string;
  subcategorySlug: string;
};

export function LotDetailPage({
  lotId,
  categorySlug,
  subcategorySlug,
}: LotDetailPageProps) {
  const t = useTranslations('listings');
  const locale = useLocale();
  const { data: lot, isLoading, isError } = useLot(lotId);
  const backHref = `/listings/${categorySlug}/${subcategorySlug}`;

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1240px] justify-center px-5 py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !lot) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-5 py-10">
        <EmptyState
          icon={Package}
          title={t('lotNotFoundTitle')}
          description={t('lotNotFoundDescription')}
          action={
            <Link
              href={backHref}
              className="btn-secondary inline-flex h-11 items-center px-6 text-sm"
            >
              {t('backToListings')}
            </Link>
          }
        />
      </div>
    );
  }

  const coverUrl = lot.previewUrl ?? lot.images[0]?.url ?? null;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-5 py-10">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('backToListings')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
            <div className="relative aspect-[16/10] bg-surface-elevated">
              {coverUrl ? (
                <AppImage
                  src={coverUrl}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-subtle">
                  <Package className="size-12" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>

          {lot.images.length > 1 ? (
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {lot.images.map((image) => (
                <li
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-border"
                >
                  <AppImage
                    src={image.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 25vw, 120px"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="page-title text-3xl">{lot.title}</h1>
            <p className="font-display text-2xl font-semibold text-foreground">
              {formatLotPrice(lot.price, locale)}
            </p>
            {lot.stock > 1 ? (
              <p className="text-sm text-muted">
                {t('stock', { count: lot.stock })}
              </p>
            ) : null}
          </div>

          <Link
            href={userProfileHref(lot.seller.username)}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface-elevated px-4 py-3 transition-colors hover:border-border-strong"
          >
            <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
              {lot.seller.avatarUrl ? (
                <AppImage
                  src={lot.seller.avatarUrl}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-subtle">
                  <UserRound className="size-5" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {lot.seller.displayName || lot.seller.username}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Star
                  className="size-3.5 fill-current text-[var(--warning)]"
                  aria-hidden="true"
                />
                <span className="tabular-nums">
                  {Number(lot.seller.rating).toFixed(1)}
                </span>
                <span className="text-subtle">
                  ({t('table.reviews', { count: lot.seller.ratingCount })})
                </span>
              </p>
            </div>
          </Link>

          {lot.description ? (
            <div className="space-y-2">
              <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
                {t('description')}
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {lot.description}
              </p>
            </div>
          ) : null}

          {lot.attributes.length > 0 ? (
            <div className="space-y-3">
              <h2 className="font-display text-sm font-semibold tracking-wide text-muted uppercase">
                {t('attributes')}
              </h2>
              <dl className="surface-card divide-y divide-border overflow-hidden rounded-[var(--radius-md)]">
                {lot.attributes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                  >
                    <dt className="text-sm text-muted">{item.attribute.label}</dt>
                    <dd className="text-right text-sm font-medium text-foreground">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
