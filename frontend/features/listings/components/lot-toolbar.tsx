'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { LotSort } from '@/types/lot';
import { LOT_SORT_OPTIONS } from '@/types/lot';

type LotToolbarProps = {
  search: string;
  sort: LotSort;
  total: number;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: LotSort) => void;
};

export function LotToolbar({
  search,
  sort,
  total,
  onSearchChange,
  onSortChange,
}: LotToolbarProps) {
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchChange(draft.trim());
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-subtle">
        {t('resultsCount', { count: total })}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSubmit} className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="pl-10"
          />
        </form>

        <Select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as LotSort)}
          aria-label={t('sortLabel')}
          className="sm:w-[200px]"
        >
          {LOT_SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`sort.${option}`)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
