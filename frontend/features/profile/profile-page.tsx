'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { ProfileLotsSection } from '@/features/profile/components/profile-lots-section';
import { ProfileReviewsSection } from '@/features/profile/components/profile-reviews-section';
import { PublicProfileHeader } from '@/features/profile/components/public-profile-header';
import { usePublicUser } from '@/hooks/use-users';
import { useAuth } from '@/providers/AuthProvider';

type ProfilePageProps = {
  username: string;
};

export function ProfilePage({ username }: ProfilePageProps) {
  const t = useTranslations('profile');
  const router = useRouter();
  const { user: authUser } = useAuth();
  const normalized = username.trim().toLowerCase();
  const isOwn =
    Boolean(authUser) && authUser!.username.toLowerCase() === normalized;

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = usePublicUser(normalized);

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-10 px-5 py-10">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : isError || !profile ? (
        <div className="space-y-4 py-8 text-center">
          <h1 className="page-title text-3xl">{t('notFoundTitle')}</h1>
          <p className="text-sm text-muted">{t('notFoundDescription')}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            {t('retry')}
          </button>
        </div>
      ) : (
        <>
          {isOwn && authUser ? (
            <>
              <div className="space-y-1">
                <h1 className="page-title text-3xl">{t('title')}</h1>
                <p className="text-muted">{t('subtitle')}</p>
              </div>
              <div className="surface-card p-6 sm:p-8">
                <ProfileForm
                  profile={profile}
                  email={authUser.email}
                  onUsernameChange={(nextUsername) => {
                    router.replace(`/user/${nextUsername}`);
                  }}
                />
              </div>
            </>
          ) : (
            <PublicProfileHeader profile={profile} />
          )}

          <ProfileReviewsSection sellerId={profile.id} />
          <ProfileLotsSection username={profile.username} />
        </>
      )}
    </div>
  );
}
