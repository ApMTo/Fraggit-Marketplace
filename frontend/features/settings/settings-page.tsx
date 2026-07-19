'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { ChangeEmailForm } from '@/features/settings/components/change-email-form';
import { ChangePasswordForm } from '@/features/settings/components/change-password-form';
import { ChangeUsernameForm } from '@/features/settings/components/change-username-form';
import { useUserProfile } from '@/hooks/use-users';
import { userProfileHref } from '@/lib/app-nav';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

export type SettingsSectionId = 'security';

const SECTIONS: {
  id: SettingsSectionId;
  icon: typeof Shield;
}[] = [{ id: 'security', icon: Shield }];

function SecuritySection() {
  const t = useTranslations('settings.security');
  const { data: profile, isLoading, isError, refetch, isFetching } =
    useUserProfile();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="space-y-3 py-6 text-center">
        <p className="text-sm text-muted">{t('loadError')}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{t('subtitle')}</p>
      <div className="space-y-6">
        <div className="surface-card space-y-4 p-6 sm:p-8">
          <ChangeEmailForm profile={profile} />
        </div>
        <div className="surface-card space-y-4 p-6 sm:p-8">
          <ChangeUsernameForm profile={profile} />
        </div>
        <div className="surface-card space-y-4 p-6 sm:p-8">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const t = useTranslations('settings');
  const { user } = useAuth();
  const [section, setSection] = useState<SettingsSectionId>('security');
  const profileHref = user ? userProfileHref(user.username) : '/profile';

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-5 py-10">
      <div className="space-y-4">
        <Link
          href={profileHref}
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('backToProfile')}
        </Link>
        <h1 className="page-title text-3xl">{t('title')}</h1>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <nav
          aria-label={t('title')}
          className="flex shrink-0 gap-1 overflow-x-auto sm:w-44 sm:flex-col sm:overflow-visible"
        >
          {SECTIONS.map(({ id, icon: Icon }) => {
            const isActive = section === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted hover:bg-surface-hover hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {t(`sections.${id}`)}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1">
          {section === 'security' ? <SecuritySection /> : null}
        </div>
      </div>
    </div>
  );
}
