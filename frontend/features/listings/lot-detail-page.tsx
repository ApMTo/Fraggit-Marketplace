'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { AppImage } from '@/components/ui/app-image';
import { Spinner } from '@/components/ui/spinner';
import { formatLotPrice } from '@/features/listings/lib/format-lot-price';
import { useLot } from '@/hooks';
import { userProfileHref } from '@/lib/app-nav';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

const DESCRIPTION_COLLAPSE_AT = 320;

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
  const { user } = useAuth();
  const { data: lot, isLoading, isError } = useLot(lotId);
  const backHref = `/listings/${categorySlug}/${subcategorySlug}`;
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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

  const galleryImages =
    lot.images.length > 0
      ? lot.images
      : lot.previewUrl
        ? [{ id: 'preview', url: lot.previewUrl, sortOrder: 0 }]
        : [];
  const activeImage =
    galleryImages.find((image) => image.id === activeImageId) ??
    galleryImages[0] ??
    null;
  const coverUrl = activeImage?.url ?? null;
  const sellerName = lot.seller.displayName || lot.seller.username;
  const rating = Number(lot.seller.rating) || 0;
  const isOwnLot = Boolean(user && user.id === lot.sellerId);
  const description = lot.description?.trim() ?? '';
  const descriptionCollapsible = description.length > DESCRIPTION_COLLAPSE_AT;
  const visibleDescription =
    descriptionCollapsible && !descriptionExpanded
      ? `${description.slice(0, DESCRIPTION_COLLAPSE_AT).trimEnd()}…`
      : description;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-5 py-10">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('backToListings')}
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="space-y-3">
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
              <div className="relative aspect-[16/10] bg-surface-elevated">
                {coverUrl ? (
                  <AppImage
                    src={coverUrl}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-subtle">
                    <Package className="size-12" aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>

            {galleryImages.length > 1 ? (
              <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {galleryImages.map((image) => {
                  const isActive = image.id === (activeImage?.id ?? null);
                  return (
                    <li key={image.id}>
                      <button
                        type="button"
                        onClick={() => setActiveImageId(image.id)}
                        aria-pressed={isActive}
                        className={cn(
                          'relative aspect-square w-full overflow-hidden rounded-[var(--radius-sm)] border transition-colors',
                          isActive
                            ? 'border-[var(--focus)] ring-1 ring-[var(--focus)]'
                            : 'border-border hover:border-border-strong',
                        )}
                      >
                        <AppImage
                          src={image.url}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 25vw, 120px"
                          className="object-cover"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>

          {description ? (
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {t('description')}
              </h2>
              <p className="whitespace-pre-wrap text-md leading-relaxed text-muted">
                {visibleDescription}
              </p>
              {descriptionCollapsible ? (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((open) => !open)}
                  className="text-sm font-medium text-[var(--link)] transition-colors hover:text-foreground"
                >
                  {descriptionExpanded
                    ? t('descriptionCollapse')
                    : t('descriptionExpand')}
                </button>
              ) : null}
            </section>
          ) : null}

          {lot.attributes.length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {t('attributes')}
              </h2>
              <dl className="divide-y divide-border overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
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
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t('seller')}
            </h2>
            <Link
              href={userProfileHref(lot.seller.username)}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-elevated"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border bg-surface-elevated">
                {lot.seller.avatarUrl ? (
                  <AppImage
                    src={lot.seller.avatarUrl}
                    alt=""
                    fill
                    sizes="48px"
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
                  {sellerName}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  <Star
                    className="size-3.5 fill-current text-[var(--warning)]"
                    aria-hidden="true"
                  />
                  <span className="tabular-nums">{rating.toFixed(1)}</span>
                  <span className="text-subtle">
                    {t('table.reviews', { count: lot.seller.ratingCount })}
                  </span>
                </p>
              </div>
            </Link>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-md)]">
            <div className="space-y-1">
              <p className="font-display text-3xl font-semibold tabular-nums text-success">
                {formatLotPrice(lot.price, locale)}
              </p>
              {lot.stock > 1 ? (
                <p className="text-sm text-muted">
                  {t('stock', { count: lot.stock })}
                </p>
              ) : null}
            </div>

            <h1 className="page-title text-xl leading-snug sm:text-2xl">
              {lot.title}
            </h1>

            <div className="flex items-center gap-1.5 text-sm text-muted">
              <div
                className="flex items-center gap-0.5 text-[var(--warning)]"
                aria-hidden="true"
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      'size-3.5',
                      index < Math.round(rating)
                        ? 'fill-current'
                        : 'fill-transparent opacity-40',
                    )}
                  />
                ))}
              </div>
              <span className="tabular-nums text-foreground">
                {rating.toFixed(1)}
              </span>
              <span className="text-subtle">·</span>
              <span>
                {t('table.reviews', { count: lot.seller.ratingCount })}
              </span>
            </div>

            {!isOwnLot ? (
              <button type="button" className="btn-primary h-12 w-full text-base">
                {t('buy')}
              </button>
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
    </div>
  );
}
