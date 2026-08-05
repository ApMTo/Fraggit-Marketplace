'use client';

import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';
import type { CategoryPublic } from '@/types/category';

type CategoryBrowseCardProps = {
  category: CategoryPublic;
};

export function CategoryBrowseCard({ category }: CategoryBrowseCardProps) {
  return (
    <Link
      href={`/listings/${category.slug}`}
      className="group relative flex aspect-[4/5] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface outline-none transition-[border-color,box-shadow] duration-300 hover:border-border-strong hover:shadow-[var(--shadow-md)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
    >
      <div className="absolute inset-0">
        {category.previewUrl ? (
          <AppImage
            src={category.previewUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="size-full bg-[radial-gradient(ellipse_at_top,var(--blue-a24),transparent_60%),var(--surface-elevated)]"
          />
        )}
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10"
      />

      <div className="relative mt-auto flex flex-col items-center gap-2.5 p-3 pb-3.5 text-center sm:gap-3 sm:p-4">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl bg-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/25 backdrop-blur-md sm:size-14">
          {category.iconUrl ? (
            <AppImage
              src={category.iconUrl}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-white/70">
              <FolderOpen className="size-6" aria-hidden="true" />
            </div>
          )}
        </div>

        <h2 className="line-clamp-2 w-full px-0.5 font-display text-sm font-semibold leading-snug tracking-tight text-white drop-shadow-sm sm:text-base">
          {category.name}
        </h2>
      </div>
    </Link>
  );
}
