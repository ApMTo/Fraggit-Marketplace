import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { LoginPage } from '@/features/auth';
import { getSessionUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.login');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
  };
}

export default async function Page() {
  const user = await getSessionUser();

  if (user) {
    redirect('/dashboard');
  }

  return <LoginPage />;
}
