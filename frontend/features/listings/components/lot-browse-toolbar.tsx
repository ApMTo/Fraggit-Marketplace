'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DropdownItem, DropdownMenu } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { AttributeDefinitionPublic } from '@/types/category';
import type { LotSort } from '@/types/lot';
import { LOT_SORT_OPTIONS } from '@/types/lot';
import type { LotFilters } from '../lib/listings-search-params';

type LotBrowseToolbarProps = {
  attributes: AttributeDefinitionPublic[] | undefined;
  attributesLoading: boolean;
  filters: LotFilters;
  search: string;
  sort: LotSort;
  total: number;
  onFiltersChange: (filters: LotFilters) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: LotSort) => void;
};

export function LotBrowseToolbar({
  attributes,
  attributesLoading,
  filters,
  search,
  sort,
  total,
  onFiltersChange,
  onSearchChange,
  onSortChange,
}: LotBrowseToolbarProps) {
  const t = useTranslations('listings');
  const [draft, setDraft] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  if (search !== prevSearch) {
    setPrevSearch(search);
    setDraft(search);
  }

  useEffect(() => {
    const trimmed = draft.trim();
    if (trimmed === search) {
      return;
    }

    const timer = window.setTimeout(() => {
      onSearchChange(trimmed);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [draft, search, onSearchChange]);

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

  function clearFilters() {
    onFiltersChange({});
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchChange(draft.trim());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {attributesLoading ? <Spinner size="sm" /> : null}

          {!attributesLoading
            ? filterableAttributes.map((attribute) => {
                const selected = filters[attribute.key] ?? '';
                const options =
                  attribute.type === 'BOOLEAN'
                    ? [
                        { value: 'true', label: t('filterYes') },
                        { value: 'false', label: t('filterNo') },
                      ]
                    : (attribute.options ?? []).map((option) => ({
                        value: option,
                        label: option,
                      }));

                const selectedLabel = options.find(
                  (option) => option.value === selected,
                )?.label;

                return (
                  <DropdownMenu
                    key={attribute.id}
                    align="start"
                    trigger={
                      <span>
                        {selected && selectedLabel
                          ? `${attribute.label}: ${selectedLabel}`
                          : attribute.label}
                      </span>
                    }
                  >
                    <DropdownItem
                      isActive={!selected}
                      onSelect={() => setFilter(attribute.key, '')}
                    >
                      {t('filterAny')}
                    </DropdownItem>
                    {options.map((option) => (
                      <DropdownItem
                        key={option.value}
                        isActive={selected === option.value}
                        onSelect={() =>
                          setFilter(attribute.key, option.value)
                        }
                      >
                        {option.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                );
              })
            : null}

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10"
            >
              {t('clearFilters')}
            </Button>
          ) : null}
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full shrink-0 lg:max-w-sm"
        >
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="h-10 pl-10"
          />
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-subtle">{t('resultsCount', { count: total })}</p>

        <DropdownMenu
          align="end"
          trigger={<span>{t(`sort.${sort}`)}</span>}
        >
          {LOT_SORT_OPTIONS.map((option) => (
            <DropdownItem
              key={option}
              isActive={sort === option}
              onSelect={() => onSortChange(option)}
            >
              {t(`sort.${option}`)}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </div>
    </div>
  );
}
