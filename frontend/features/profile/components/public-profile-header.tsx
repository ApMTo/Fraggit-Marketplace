'use client';

import { Star, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppImage } from '@/components/ui/app-image';
import type { UserPublicProfile } from '@/types/user';

type PublicProfileHeaderProps = {
  profile: UserPublicProfile;
};

export function PublicProfileHeader({ profile }: PublicProfileHeaderProps) {
  const t = useTranslations('profile');
  const ratingLabel =
    profile.ratingCount > 0
      ? t('stats.ratingValue', {
          rating: profile.rating.toFixed(1),
          count: profile.ratingCount,
        })
      : t('stats.noRating');

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="relative mx-auto size-28 shrink-0 overflow-hidden rounded-full border border-border bg-surface-elevated sm:mx-0">
        {profile.avatarUrl ? (
          <AppImage
            src={profile.avatarUrl}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-subtle">
            <UserRound className="size-10" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left">
        <div className="space-y-1">
          <h1 className="page-title text-3xl">{profile.displayName}</h1>
          <p className="text-muted">@{profile.username}</p>
        </div>

        {profile.bio ? (
          <p className="max-w-2xl text-sm leading-relaxed text-foreground">
            {profile.bio}
          </p>
        ) : null}

        <dl className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm sm:justify-start">
          <div className="inline-flex items-center gap-1.5">
            <dt className="text-muted">{t('stats.rating')}</dt>
            <dd className="inline-flex items-center gap-1 font-medium text-foreground">
              <Star className="size-3.5 fill-current text-brand-cyan" />
              {ratingLabel}
            </dd>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <dt className="text-muted">{t('stats.sales')}</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {profile.successfulSales}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
