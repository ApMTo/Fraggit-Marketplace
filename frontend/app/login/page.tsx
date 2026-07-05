import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LoginPage } from '@/features/auth';
import { getSafeRedirectPath } from '@/lib/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.login');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
  };
}

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return <LoginPage redirectTo={getSafeRedirectPath(next)} />;
}
