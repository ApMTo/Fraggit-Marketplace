'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { cn } from '@/lib/utils';
import type { LotListItem } from '@/types/lot';
import { formatLotPrice } from '../lib/format-lot-price';

type LotCardProps = {
  lot: LotListItem;
  categorySlug: string;
  subcategorySlug: string;
};

export function LotCard({ lot, categorySlug, subcategorySlug }: LotCardProps) {
  const t = useTranslations('listings');
  const locale = useLocale();
  const previewAttributes = lot.attributes.slice(0, 3);
  const href = `/listings/${categorySlug}/${subcategorySlug}/lot/${lot.id}`;

  return (
    <Link
      href={href}
      className="landing-card-hover group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        {lot.previewUrl ? (
          <AppImage
            src={lot.previewUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-subtle">
            <Package className="size-10" aria-hidden="true" />
          </div>
        )}
        {lot.stock > 1 ? (
          <span className="absolute right-3 top-3 rounded-[var(--radius-xs)] bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            {t('stock', { count: lot.stock })}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 font-display text-base font-semibold text-foreground">
            {lot.title}
          </h3>
          {lot.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted">
              {lot.description}
            </p>
          ) : null}
        </div>

        {previewAttributes.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {previewAttributes.map((attribute) => (
              <li
                key={attribute.key}
                className={cn(
                  'rounded-[var(--radius-xs)] border border-border bg-surface-elevated px-2 py-0.5',
                  'text-xs text-muted',
                )}
              >
                {attribute.value}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-auto font-display text-lg font-semibold text-foreground">
          {formatLotPrice(lot.price, locale)}
        </p>
      </div>
    </Link>
  );
}
