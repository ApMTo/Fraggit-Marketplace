'use client';

import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';
import type { CategoryPublic } from '@/types/category';

type CategoryBrowseCardProps = {
  category: CategoryPublic;
};

export function CategoryBrowseCard({ category }: CategoryBrowseCardProps) {
  const mediaUrl = category.iconUrl ?? category.previewUrl;

  return (
    <Link
      href={`/listings/${category.slug}`}
      className="flex flex-col items-center gap-2 text-center outline-none focus-visible:rounded-[var(--radius-sm)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-md)] bg-surface-elevated ring-1 ring-border">
        {mediaUrl ? (
          <AppImage
            src={mediaUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 20vw, (max-width: 1024px) 12vw, 96px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[var(--gradient-brand-soft)] text-subtle">
            <FolderOpen className="size-7 sm:size-8" aria-hidden="true" />
          </div>
        )}
      </div>

      <h2 className="line-clamp-2 w-full px-0.5 text-[11px] font-medium leading-tight text-foreground sm:text-xs">
        {category.name}
      </h2>
    </Link>
  );
}
