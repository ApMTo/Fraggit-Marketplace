'use client';

import Link from 'next/link';
import { Package, Star, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import type { LotListItem } from '@/types/lot';
import { formatLotPrice } from '../lib/format-lot-price';

type LotTableProps = {
  lots: LotListItem[];
  categorySlug: string;
  subcategorySlug: string;
};

export function LotTable({
  lots,
  categorySlug,
  subcategorySlug,
}: LotTableProps) {
  const t = useTranslations('listings');

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="hidden grid-cols-[minmax(110px,0.85fr)_minmax(160px,1.2fr)_minmax(0,1.4fr)_88px_110px] gap-4 border-b border-border px-5 py-3 text-xs font-semibold tracking-wide text-subtle uppercase md:grid">
        <span>{t('table.attributes')}</span>
        <span>{t('table.seller')}</span>
        <span>{t('table.offer')}</span>
        <span className="text-right">{t('table.stock')}</span>
        <span className="text-right">{t('table.price')}</span>
      </div>

      <ul className="divide-y divide-border">
        {lots.map((lot) => (
          <LotTableRow
            key={lot.id}
            lot={lot}
            href={`/listings/${categorySlug}/${subcategorySlug}/lot/${lot.id}`}
          />
        ))}
      </ul>
    </div>
  );
}

type LotTableRowProps = {
  lot: LotListItem;
  href: string;
};

function LotTableRow({ lot, href }: LotTableRowProps) {
  const t = useTranslations('listings');
  const locale = useLocale();
  const primaryAttributes = lot.attributes.slice(0, 2);
  const ratingLabel = Number(lot.seller.rating).toFixed(1);

  return (
    <li>
      <Link
        href={href}
        className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-surface-elevated md:grid-cols-[minmax(110px,0.85fr)_minmax(160px,1.2fr)_minmax(0,1.4fr)_88px_110px] md:items-center md:gap-4"
      >
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase md:hidden">
            {t('table.attributes')}
          </p>
          {primaryAttributes.length > 0 ? (
            <div className="space-y-1">
              {primaryAttributes.map((attribute) => (
                <p key={attribute.key} className="text-sm text-foreground">
                  <span className="text-muted">{attribute.label}: </span>
                  <span className="font-medium">{attribute.value}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-subtle">—</p>
          )}
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium tracking-wide text-subtle uppercase md:hidden">
            {t('table.seller')}
          </p>
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-surface-elevated">
              {lot.seller.avatarUrl ? (
                <AppImage
                  src={lot.seller.avatarUrl}
                  alt=""
                  fill
                  sizes="40px"
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
                <span className="tabular-nums">{ratingLabel}</span>
                <span className="text-subtle">
                  ({t('table.reviews', { count: lot.seller.ratingCount })})
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase md:hidden">
            {t('table.offer')}
          </p>
          <div className="flex items-start gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-surface-elevated">
              {lot.previewUrl ? (
                <AppImage
                  src={lot.previewUrl}
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
            <div className="min-w-0 space-y-1">
              <p className="line-clamp-1 font-display text-base font-semibold text-foreground">
                {lot.title}
              </p>
              {lot.description ? (
                <p className="line-clamp-1 text-sm text-muted">
                  {lot.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:block md:text-right">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase md:hidden">
            {t('table.stock')}
          </p>
          <p className="font-medium text-foreground tabular-nums">
            {lot.stock}
          </p>
        </div>

        <div className="flex items-center justify-between md:block md:text-right">
          <p className="text-xs font-medium tracking-wide text-subtle uppercase md:hidden">
            {t('table.price')}
          </p>
          <p className="font-display text-base font-semibold text-foreground tabular-nums">
            {formatLotPrice(lot.price, locale)}
          </p>
        </div>
      </Link>
    </li>
  );
}
