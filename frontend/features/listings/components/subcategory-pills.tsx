'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { SubcategoryPublic } from '@/types/category';
import { listingsHref } from '../lib/listings-search-params';

type SubcategoryPillsProps = {
  categorySlug: string;
  subcategories: SubcategoryPublic[];
  activeSlug: string;
};

export function SubcategoryPills({
  categorySlug,
  subcategories,
  activeSlug,
}: SubcategoryPillsProps) {
  const t = useTranslations('listings');

  if (subcategories.length === 0) {
    return null;
  }

  return (
    <nav aria-label={t('subcategoriesLabel')} className="-mx-1 overflow-x-auto">
      <ul className="flex w-max gap-2 px-1 pb-1">
        {subcategories.map((subcategory) => {
          const isActive = subcategory.slug === activeSlug;

          return (
            <li key={subcategory.id}>
              <Link
                href={listingsHref(categorySlug, subcategory.slug)}
                className={cn(
                  'inline-flex h-9 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-brand-cyan text-white'
                    : 'bg-surface-elevated text-muted hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {subcategory.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
