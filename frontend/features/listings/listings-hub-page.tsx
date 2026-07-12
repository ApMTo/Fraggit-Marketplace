'use client';

import Link from 'next/link';
import { FolderOpen, Plus } from 'lucide-react';
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
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="page-title text-3xl">{t('title')}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-subtle">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryBrowseCard key={category.id} category={category} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
