import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RegisterPage } from '@/features/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.register');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
  };
}

export default async function Page() {
  return <RegisterPage />;
}
