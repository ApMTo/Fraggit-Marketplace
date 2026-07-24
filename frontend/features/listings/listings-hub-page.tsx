'use client';

import Link from 'next/link';
import { FolderOpen, Gamepad2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { CategoryBrowseCard } from '@/features/listings/components/category-browse-card';
import { useAuth, useCategories } from '@/hooks';

export function ListingsHubPage() {
  const t = useTranslations('listings');
  const { isAuthenticated } = useAuth();
  const { data: categories, isLoading, isError } = useCategories();

  return (
    <div className="relative mx-auto flex w-full max-w-site flex-col gap-10 px-5 py-8 sm:gap-12 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-8 h-56 bg-[radial-gradient(ellipse_at_top,var(--blue-a12),transparent_70%)]"
      />

      <header className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <p className="max-w-xl font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t('slogan')}
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            {t('subtitle')}
          </p>
        </div>

        {isAuthenticated ? (
          <Link
            href="/listings/new"
            className="btn-primary inline-flex h-11 shrink-0 items-center gap-2 px-5 text-sm"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('createLot')}
          </Link>
        ) : null}
      </header>

      <section
        className="relative flex flex-col gap-5"
        aria-labelledby="listings-categories-heading"
      >
        <div className="flex items-center gap-2.5">
          <Gamepad2
            className="size-6 shrink-0 text-brand-cyan sm:size-7"
            aria-hidden="true"
          />
          <h1
            id="listings-categories-heading"
            className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            {t('categoriesHeading')}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : null}

        {isError ? (
          <EmptyState
            icon={FolderOpen}
            title={t('loadErrorTitle')}
            description={t('loadErrorDescription')}
          />
        ) : null}

        {!isLoading && !isError && categories?.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={t('emptyCategoriesTitle')}
            description={t('emptyCategoriesDescription')}
          />
        ) : null}

        {!isLoading && !isError && categories && categories.length > 0 ? (
          <div className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-6 sm:gap-x-4 sm:gap-y-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
            {categories.map((category) => (
              <CategoryBrowseCard key={category.id} category={category} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
