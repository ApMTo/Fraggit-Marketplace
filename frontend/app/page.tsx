import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HomePage } from '@/features/home';
import { getSessionUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing');
  const tPages = await getTranslations('pages');

  return {
    title: `${tPages('home')} | Fraggit`,
    description: t('meta.description'),
  };
}

export default async function Page() {
  const user = await getSessionUser();

  return (
    <HomePage
      isAuthenticated={Boolean(user)}
      userDisplayName={user?.displayName}
    />
  );
}
