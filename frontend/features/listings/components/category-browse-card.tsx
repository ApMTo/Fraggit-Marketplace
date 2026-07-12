'use client';

import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';
import type { CategoryPublic } from '@/types/category';

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
          <AppImage
            src={mediaUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--blue-a12)] to-[var(--purple-a20)] text-subtle">
            <FolderOpen className="size-10" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 p-4">
        {category.iconUrl && category.previewUrl ? (
          <AppImage
            src={category.iconUrl}
            alt=""
            width={40}
            height={40}
            sizes="40px"
            className="size-10 shrink-0 rounded-[var(--radius-sm)] object-cover"
          />
        ) : null}
        <h2 className="font-display text-base font-semibold text-foreground">
          {category.name}
        </h2>
      </div>
    </Link>
  );
}
