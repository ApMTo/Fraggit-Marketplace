'use client';

import Link from 'next/link';
import { Star, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useSellerReviews } from '@/hooks';
import { userProfileHref } from '@/lib/app-nav';
import { cn } from '@/lib/utils';

type ProfileReviewsSectionProps = {
  sellerId: string;
};

function formatReviewDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function ProfileReviewsSection({
  sellerId,
}: ProfileReviewsSectionProps) {
  const t = useTranslations('profile.reviews');
  const locale = useLocale();
  const { data, isLoading, isError } = useSellerReviews({
    sellerId,
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
        <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          {data.items.map((review) => {
            const reviewerName =
              review.reviewer.displayName || review.reviewer.username;

            return (
              <li key={review.id} className="space-y-3 px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={userProfileHref(review.reviewer.username)}
                    className="flex min-w-0 items-center gap-3 transition-colors hover:text-foreground"
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-surface-elevated">
                      {review.reviewer.avatarUrl ? (
                        <AppImage
                          src={review.reviewer.avatarUrl}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-subtle">
                          <UserRound className="size-4" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {reviewerName}
                      </p>
                      <p className="text-xs text-muted">
                        {formatReviewDate(review.createdAt, locale)}
                      </p>
                    </div>
                  </Link>

                  <div
                    className="flex shrink-0 items-center gap-0.5 text-[var(--warning)]"
                    aria-label={t('ratingAria', { rating: review.rating })}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={cn(
                          'size-3.5',
                          index < review.rating
                            ? 'fill-current'
                            : 'fill-transparent opacity-40',
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {review.text}
                </p>

                <p className="text-xs text-subtle">
                  {t('aboutLot', { title: review.order.lot.title })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
