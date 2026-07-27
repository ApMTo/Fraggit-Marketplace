'use client';

import Link from 'next/link';
import { ArrowLeft, FolderOpen, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { useAuth } from '@/hooks';
import { isStaffRole } from '@/lib/staff';
import type { CategoryPublic } from '@/types/category';

type CategoryBrowseHeroProps = {
  category: CategoryPublic;
  createHref?: string;
};

export function CategoryBrowseHero({
  category,
  createHref,
}: CategoryBrowseHeroProps) {
  const t = useTranslations('listings');
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="space-y-3">
      <Link
        href="/listings"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('backToCategories')}
      </Link>

      <div className="relative aspect-[21/7] overflow-hidden rounded-[var(--radius-lg)] bg-surface-elevated sm:aspect-[21/6]">
        {category.previewUrl ? (
          <AppImage
            src={category.previewUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 1520px) 100vw, 1520px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--gradient-brand-soft)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:gap-4 sm:p-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface ring-1 ring-white/15 sm:size-14">
              {category.iconUrl ? (
                <AppImage
                  src={category.iconUrl}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-subtle">
                  <FolderOpen className="size-6" aria-hidden="true" />
                </div>
              )}
            </div>

            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {category.name}
            </h1>
          </div>

          {isAuthenticated && createHref && !isStaffRole(user?.role) ? (
            <Link
              href={createHref}
              className="btn-primary inline-flex h-10 shrink-0 items-center gap-2 px-4 text-sm sm:h-11 sm:px-5"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t('createLot')}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
