import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HomePage } from '@/features/home';
import { getSessionUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');

  return {
    title: `${t('home')} | Fraggit`,
  };
}

export default async function Page() {
  const t = await getTranslations('pages');
  const tAuth = await getTranslations('auth');
  const user = await getSessionUser();

  return (
    <HomePage
      subtitle={
        user
          ? `${tAuth('welcomeBack')}, ${user.displayName}`
          : tAuth('homeDescription')
      }
      dashboardLabel={t('dashboard')}
      registerLabel={tAuth('register.submit')}
      loginLabel={tAuth('login.submit')}
      isAuthenticated={Boolean(user)}
    />
  );
}
