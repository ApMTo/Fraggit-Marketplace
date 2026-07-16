'use client';

import { MessageCircle, Star, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { AppImage } from '@/components/ui/app-image';
import { Button } from '@/components/ui/button';
import { useStartConversation } from '@/hooks/use-chat';
import { resolveApiErrorKey } from '@/lib/api-errors';
import { useAuth } from '@/providers/AuthProvider';
import type { UserPublicProfile } from '@/types/user';

type PublicProfileHeaderProps = {
  profile: UserPublicProfile;
};

export function PublicProfileHeader({ profile }: PublicProfileHeaderProps) {
  const t = useTranslations('profile');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const startConversation = useStartConversation();

  const ratingLabel =
    profile.ratingCount > 0
      ? t('stats.ratingValue', {
          rating: profile.rating.toFixed(1),
          count: profile.ratingCount,
        })
      : t('stats.noRating');

  async function handleMessage() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/user/${profile.username}`)}`);
      return;
    }

    try {
      const result = await startConversation.mutateAsync(profile.id);
      router.push(`/chat/${result.id}`);
    } catch (error) {
      toast.error(tErrors(resolveApiErrorKey(error)));
    }
  }

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

        <div className="flex justify-center sm:justify-start">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleMessage()}
            isLoading={startConversation.isPending}
          >
            <MessageCircle className="size-4" />
            {t('message')}
          </Button>
        </div>
      </div>
    </div>
  );
}
