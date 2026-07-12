'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type ListingsPaginationProps = {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
};

export function ListingsPagination({
  page,
  total,
  limit,
  onPageChange,
}: ListingsPaginationProps) {
  const t = useTranslations('listings');
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-sm text-subtle">
        {t('pageOf', { page, totalPages })}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('prevPage')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('nextPage')}
        </Button>
      </div>
    </div>
  );
}
