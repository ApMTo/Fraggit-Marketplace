'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks';
import type { AttributeDefinitionPublic } from '@/types/category';
import type { LotSort } from '@/types/lot';
import { LOT_SORT_OPTIONS } from '@/types/lot';
import type { LotFilters } from '../lib/listings-search-params';

type LotBrowseToolbarProps = {
  attributes: AttributeDefinitionPublic[] | undefined;
  attributesLoading: boolean;
  filters: LotFilters;
  sort: LotSort;
  createHref: string;
  onFiltersChange: (filters: LotFilters) => void;
  onSortChange: (sort: LotSort) => void;
};

export function LotBrowseToolbar({
  attributes,
  attributesLoading,
  filters,
  sort,
  createHref,
  onFiltersChange,
  onSortChange,
}: LotBrowseToolbarProps) {
  const t = useTranslations('listings');
  const { isAuthenticated } = useAuth();
  const hasFilters = Object.keys(filters).length > 0;

  const filterableAttributes = (attributes ?? []).filter(
    (attribute) =>
      attribute.type === 'SELECT' ||
      attribute.type === 'MULTISELECT' ||
      attribute.type === 'BOOLEAN',
  );

  function setFilter(key: string, value: string) {
    const next = { ...filters };
    if (!value.trim()) {
      delete next[key];
    } else {
      next[key] = value.trim();
    }
    onFiltersChange(next);
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {attributesLoading ? <Spinner size="sm" /> : null}

        {!attributesLoading
          ? filterableAttributes.map((attribute) => (
              <Select
                key={attribute.id}
                value={filters[attribute.key] ?? ''}
                onChange={(event) =>
                  setFilter(attribute.key, event.target.value)
                }
                aria-label={attribute.label}
                className="h-10 w-auto min-w-[140px] max-w-[200px]"
              >
                <option value="">
                  {attribute.label}: {t('filterAny')}
                </option>
                {attribute.type === 'BOOLEAN' ? (
                  <>
                    <option value="true">{t('filterYes')}</option>
                    <option value="false">{t('filterNo')}</option>
                  </>
                ) : (
                  (attribute.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))
                )}
              </Select>
            ))
          : null}

        <Select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as LotSort)}
          aria-label={t('sortLabel')}
          className="h-10 w-auto min-w-[160px]"
        >
          {LOT_SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`sort.${option}`)}
            </option>
          ))}
        </Select>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({})}
            className="h-10"
          >
            {t('clearFilters')}
          </Button>
        ) : null}
      </div>

      {isAuthenticated ? (
        <Link
          href={createHref}
          className="btn-secondary inline-flex h-10 shrink-0 items-center gap-2 px-4 text-sm"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('createLot')}
        </Link>
      ) : null}
    </div>
  );
}
