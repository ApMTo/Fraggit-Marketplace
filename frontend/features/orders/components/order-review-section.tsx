'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReview, useOrderReview } from '@/hooks';
import { resolveApiError } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import type { ReviewDetail } from '@/types/review';

type OrderReviewSectionProps = {
  orderId: string;
  canWrite: boolean;
};

function ReviewStars({
  value,
  onChange,
  interactive = false,
  size = 'md',
}: {
  value: number;
  onChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md';
}) {
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-6';

  return (
    <div
      className="flex items-center gap-1"
      role={interactive ? 'radiogroup' : undefined}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1;
        const filled = rating <= value;

        if (!interactive) {
          return (
            <Star
              key={rating}
              className={cn(
                iconClass,
                filled
                  ? 'fill-current text-[var(--warning)]'
                  : 'fill-transparent text-subtle opacity-40',
              )}
              aria-hidden="true"
            />
          );
        }

        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={String(rating)}
            onClick={() => onChange?.(rating)}
            className="rounded-[var(--radius-sm)] p-0.5 text-[var(--warning)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          >
            <Star
              className={cn(
                iconClass,
                filled ? 'fill-current' : 'fill-transparent opacity-40',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function SubmittedReview({ review }: { review: ReviewDetail }) {
  const t = useTranslations('orders.review');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t('submittedTitle')}
        </h2>
        <ReviewStars value={review.rating} size="sm" />
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
        {review.text}
      </p>
    </div>
  );
}

export function OrderReviewSection({
  orderId,
  canWrite,
}: OrderReviewSectionProps) {
  const t = useTranslations('orders.review');
  const tErrors = useTranslations('errors');
  const { data: review, isLoading } = useOrderReview(orderId);
  const createReview = useCreateReview();

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="flex justify-center rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <Spinner size="md" />
      </section>
    );
  }

  if (review) {
    return (
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <SubmittedReview review={review} />
      </section>
    );
  }

  if (!canWrite) {
    return null;
  }

  async function handleSubmit() {
    if (rating < 1) {
      setFormError(t('ratingRequired'));
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      setFormError(t('textRequired'));
      return;
    }

    setFormError(null);

    try {
      await createReview.mutateAsync({
        orderId,
        rating,
        text: trimmed,
      });
      toast.success(t('success'));
    } catch (error) {
      const resolved = resolveApiError(error);
      setFormError(tErrors(resolved.key, resolved.values));
    }
  }

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {t('title')}
        </h2>
        <p className="text-sm text-muted">{t('hint')}</p>
      </div>

      <div className="space-y-2">
        <Label>{t('ratingLabel')}</Label>
        <ReviewStars value={rating} onChange={setRating} interactive />
      </div>

      <div className="space-y-2">
        <Label htmlFor="order-review-text">{t('textLabel')}</Label>
        <Textarea
          id="order-review-text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (formError) {
              setFormError(null);
            }
          }}
          placeholder={t('textPlaceholder')}
          rows={4}
          maxLength={2000}
          hasError={Boolean(formError)}
          disabled={createReview.isPending}
        />
        {formError ? <FormError>{formError}</FormError> : null}
      </div>

      <Button
        type="button"
        className="w-full sm:w-auto"
        isLoading={createReview.isPending}
        onClick={() => void handleSubmit()}
      >
        {t('submit')}
      </Button>
    </section>
  );
}
