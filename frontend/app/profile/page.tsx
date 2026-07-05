import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ProfilePage } from '@/features/profile';
import { getSessionUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');

  return {
    title: `${t('profile')} | Fraggit`,
  };
}

export default async function Page() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const t = await getTranslations('pages');
  const tAuth = await getTranslations('auth.fields');

  return (
    <ProfilePage
      title={t('profile')}
      fields={[
        { label: tAuth('displayName'), value: user.displayName },
        { label: tAuth('username'), value: user.username },
        { label: tAuth('email'), value: user.email },
      ]}
    />
  );
}
