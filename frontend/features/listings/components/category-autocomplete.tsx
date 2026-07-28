'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { FolderOpen, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { Input } from '@/components/ui/input';
import { useCategories, useCategorySearch, useDebouncedValue } from '@/hooks';
import { cn } from '@/lib/utils';
import type { CategoryPublic } from '@/types/category';

const DEBOUNCE_MS = 300;
const INITIAL_CATEGORIES_LIMIT = 15;

type CategoryAutocompleteProps = {
  id?: string;
  value: string;
  selectedCategory: CategoryPublic | null;
  onSelect: (category: CategoryPublic | null) => void;
  onBlur?: () => void;
  hasError?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function CategoryAutocomplete({
  id,
  value,
  selectedCategory,
  onSelect,
  onBlur,
  hasError = false,
  disabled = false,
  placeholder,
}: CategoryAutocompleteProps) {
  const t = useTranslations('common.search');
  const tCreate = useTranslations('listings.create');
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(selectedCategory?.name ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const [prevDebouncedQuery, setPrevDebouncedQuery] = useState(debouncedQuery);
  const [prevSelectedId, setPrevSelectedId] = useState(
    selectedCategory?.id ?? null,
  );
  const trimmedQuery = query.trim();
  const trimmedDebounced = debouncedQuery.trim();
  const isSearching = trimmedDebounced.length > 0;
  const isPending = trimmedQuery !== trimmedDebounced;

  if (debouncedQuery !== prevDebouncedQuery) {
    setPrevDebouncedQuery(debouncedQuery);
    setActiveIndex(-1);
  }

  if ((selectedCategory?.id ?? null) !== prevSelectedId) {
    setPrevSelectedId(selectedCategory?.id ?? null);
    if (selectedCategory) {
      setQuery(selectedCategory.name);
    } else if (!value) {
      setQuery('');
    }
  }

  const { data: allCategories = [], isLoading: categoriesLoading } =
    useCategories();

  const {
    data: searchResults = [],
    isFetching,
    isFetched,
  } = useCategorySearch(debouncedQuery);

  const results = useMemo(() => {
    if (isSearching) {
      return searchResults;
    }
    return allCategories.slice(0, INITIAL_CATEGORIES_LIMIT);
  }, [allCategories, isSearching, searchResults]);

  const showPanel = open && !disabled;
  const showSearching = isSearching
    ? isPending || (isFetching && !isFetched)
    : categoriesLoading;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function pickCategory(category: CategoryPublic) {
    setQuery(category.name);
    setOpen(false);
    onSelect(category);
  }

  function clearSelection() {
    setQuery('');
    setOpen(true);
    onSelect(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showPanel) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) =>
        Math.min(index + 1, Math.max(results.length - 1, 0)),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      pickCategory(results[activeIndex]);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        {selectedCategory ? (
          <div className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2">
            <CategoryThumb category={selectedCategory} size="sm" />
          </div>
        ) : (
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
        )}
        <Input
          id={id}
          value={query}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            if (selectedCategory && next !== selectedCategory.name) {
              onSelect(null);
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? tCreate('searchCategory')}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showPanel}
          role="combobox"
          autoComplete="off"
          hasError={hasError}
          className={cn('h-11 pr-10', selectedCategory ? 'pl-11' : 'pl-10')}
        />
        {query ? (
          <button
            type="button"
            onClick={clearSelection}
            disabled={disabled}
            className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-[var(--radius-xs)] text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none"
            aria-label={tCreate('clearCategory')}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          className="dropdown-panel absolute top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden p-1.5"
        >
          {showSearching ? (
            <p className="px-3 py-2 text-sm text-subtle">{t('searching')}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-subtle">{t('empty')}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((category, index) => {
                const isActive = index === activeIndex;

                return (
                  <li key={category.id} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      onClick={() => pickCategory(category)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground hover:bg-surface-hover',
                      )}
                    >
                      <CategoryThumb category={category} />
                      <span className="truncate font-medium">
                        {category.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CategoryThumb({
  category,
  size = 'md',
}: {
  category: CategoryPublic;
  size?: 'sm' | 'md';
}) {
  const mediaUrl = category.iconUrl ?? category.previewUrl;
  const boxClass = size === 'sm' ? 'size-6' : 'size-8';
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4';

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-surface-elevated',
        boxClass,
      )}
    >
      {mediaUrl ? (
        <AppImage
          src={mediaUrl}
          alt=""
          fill
          sizes={size === 'sm' ? '24px' : '32px'}
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-subtle">
          <FolderOpen className={iconClass} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
