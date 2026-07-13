'use client';

import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { LotGrid } from '@/features/listings/components/lot-grid';
import { useSellerLots } from '@/hooks/use-lots';

type ProfileLotsSectionProps = {
  username: string;
};

export function ProfileLotsSection({ username }: ProfileLotsSectionProps) {
  const t = useTranslations('profile.lots');
  const { data, isLoading, isError } = useSellerLots({
    sellerUsername: username,
    limit: 20,
  });

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t('title')}
        </h2>
        {data ? (
          <p className="text-sm text-subtle">
            {t('count', { count: data.total })}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : isError ? (
        <p className="text-sm text-muted">{t('loadError')}</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <LotGrid lots={data.items} />
      )}
    </section>
  );
}
