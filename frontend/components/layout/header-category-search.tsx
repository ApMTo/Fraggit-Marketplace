'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderOpen, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { Input } from '@/components/ui/input';
import { useCategorySearch, useDebouncedValue } from '@/hooks';
import { cn } from '@/lib/utils';
import type { CategoryPublic } from '@/types/category';

const DEBOUNCE_MS = 500;

type HeaderCategorySearchProps = {
  id?: string;
  className?: string;
};

export function HeaderCategorySearch({
  id,
  className,
}: HeaderCategorySearchProps) {
  const t = useTranslations('common.search');
  const router = useRouter();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const [prevDebouncedQuery, setPrevDebouncedQuery] = useState(debouncedQuery);
  const isPending = query.trim() !== debouncedQuery.trim();

  if (debouncedQuery !== prevDebouncedQuery) {
    setPrevDebouncedQuery(debouncedQuery);
    setActiveIndex(-1);
  }

  const {
    data: results = [],
    isFetching,
    isFetched,
  } = useCategorySearch(debouncedQuery);

  const showPanel = open && debouncedQuery.trim().length > 0;
  const showSearching = isPending || (isFetching && !isFetched);

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

  function goToCategory(category: CategoryPublic) {
    setQuery(category.name);
    setOpen(false);
    router.push(`/listings/${category.slug}`);
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
      goToCategory(results[activeIndex]);
    }
  }

  return (
    <div
      ref={rootRef}
      id={id}
      className={cn('relative w-full max-w-xl min-w-0 flex-1 lg:max-w-2xl', className)}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showPanel}
          role="combobox"
          autoComplete="off"
          className="h-10 rounded-full border-border bg-surface-elevated pl-10 shadow-none focus-visible:shadow-[0_0_0_3px_var(--blue-a24)]"
        />
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
                const mediaUrl = category.iconUrl ?? category.previewUrl;
                const isActive = index === activeIndex;

                return (
                  <li key={category.id} role="option" aria-selected={isActive}>
                    <Link
                      href={`/listings/${category.slug}`}
                      onClick={() => {
                        setQuery(category.name);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground hover:bg-surface-hover'
                      }`}
                    >
                      <div className="relative size-8 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-surface-elevated">
                        {mediaUrl ? (
                          <AppImage
                            src={mediaUrl}
                            alt=""
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-subtle">
                            <FolderOpen
                              className="size-4"
                              aria-hidden="true"
                            />
                          </div>
                        )}
                      </div>
                      <span className="truncate font-medium">{category.name}</span>
                    </Link>
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
