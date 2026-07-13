'use client';

import Link from 'next/link';
import { Package, Star, UserRound } from 'lucide-react';
import { useLocale } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { userProfileHref } from '@/lib/app-nav';
import type { LotListItem } from '@/types/lot';
import { formatLotPrice } from '../lib/format-lot-price';

type LotCardProps = {
  lot: LotListItem;
  categorySlug: string;
  subcategorySlug: string;
};

export function LotCard({ lot, categorySlug, subcategorySlug }: LotCardProps) {
  const locale = useLocale();
  const href = `/listings/${categorySlug}/${subcategorySlug}/lot/${lot.id}`;
  const sellerName = lot.seller.displayName || lot.seller.username;
  const rating = Number(lot.seller.rating) || 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-[var(--radius-md)] bg-surface ring-1 ring-border">
      <Link
        href={href}
        className="group flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-inset"
      >
        <div className="relative aspect-[16/11] bg-surface-elevated">
          {lot.previewUrl ? (
            <AppImage
              src={lot.previewUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-subtle">
              <Package className="size-8" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3 pb-2">
          <p className="font-display text-base font-semibold tabular-nums text-success">
            {formatLotPrice(lot.price, locale)}
          </p>

          <h3 className="line-clamp-2 text-sm leading-snug text-foreground">
            {lot.title}
          </h3>
        </div>
      </Link>

      <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
        <Link
          href={userProfileHref(lot.seller.username)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-sm)] outline-none transition-colors hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-border bg-surface-elevated">
            {lot.seller.avatarUrl ? (
              <AppImage
                src={lot.seller.avatarUrl}
                alt=""
                fill
                sizes="28px"
                className="object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-subtle">
                <UserRound className="size-3.5" aria-hidden="true" />
              </span>
            )}
          </div>
          <span className="truncate text-xs font-medium text-foreground">
            {sellerName}
          </span>
        </Link>

        <div
          className="flex shrink-0 items-center gap-1"
          title={`${rating.toFixed(1)} · ${lot.seller.ratingCount}`}
        >
          <Star
            className="size-3 fill-brand-cyan text-brand-cyan"
            aria-hidden="true"
          />
          <span className="text-xs tabular-nums text-subtle">
            {lot.seller.ratingCount > 0 ? rating.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </article>
  );
}
