'use client';

import Link from 'next/link';
import type { CategoryPublic } from '@/types/category';
import { FolderOpen } from 'lucide-react';

type CategoryBrowseCardProps = {
  category: CategoryPublic;
};

export function CategoryBrowseCard({ category }: CategoryBrowseCardProps) {
  const mediaUrl = category.previewUrl ?? category.iconUrl;

  return (
    <Link
      href={`/listings/${category.slug}`}
      className="landing-card-hover group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        {mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--blue-a12)] to-[var(--purple-a20)] text-subtle">
            <FolderOpen className="size-10" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 p-4">
        {category.iconUrl && category.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.iconUrl}
            alt=""
            className="size-10 shrink-0 rounded-[var(--radius-sm)] object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <h2 className="font-display text-base font-semibold text-foreground">
          {category.name}
        </h2>
      </div>
    </Link>
  );
}
