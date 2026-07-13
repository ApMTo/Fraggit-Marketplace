'use client';

import Link from 'next/link';
import { Package, Star } from 'lucide-react';
import { useLocale } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import type { LotListItem } from '@/types/lot';
import { formatLotPrice } from '../lib/format-lot-price';

const STAR_COUNT = 5;

type LotCardProps = {
  lot: LotListItem;
  categorySlug: string;
  subcategorySlug: string;
};

export function LotCard({ lot, categorySlug, subcategorySlug }: LotCardProps) {
  const locale = useLocale();
  const href = `/listings/${categorySlug}/${subcategorySlug}/lot/${lot.id}`;
  const filledStars = Math.round(
    Math.min(STAR_COUNT, Math.max(0, Number(lot.seller.rating) || 0)),
  );

  return (
    <Link
      href={href}
      className="flex flex-col overflow-hidden rounded-[var(--radius-md)] bg-surface ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
    >
      <div className="relative aspect-[16/11] bg-surface-elevated">
        {lot.previewUrl ? (
          <AppImage
            src={lot.previewUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-subtle">
            <Package className="size-8" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="font-display text-base font-semibold tabular-nums text-success">
          {formatLotPrice(lot.price, locale)}
        </p>

        <h3 className="line-clamp-2 text-sm leading-snug text-foreground">
          {lot.title}
        </h3>

        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <div className="flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: STAR_COUNT }, (_, index) => (
              <Star
                key={index}
                className={
                  index < filledStars
                    ? 'size-3 fill-brand-cyan text-brand-cyan'
                    : 'size-3 text-border-strong'
                }
              />
            ))}
          </div>
          <span className="text-xs tabular-nums text-subtle">
            {lot.seller.ratingCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
