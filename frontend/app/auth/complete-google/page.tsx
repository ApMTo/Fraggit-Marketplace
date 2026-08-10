import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CompleteGooglePage } from '@/features/auth';

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.completeGoogle');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
    robots: { index: false, follow: false },
  };
}

export default async function Page({ searchParams }: PageProps) {
  const { token = '' } = await searchParams;

  return <CompleteGooglePage token={token} />;
}
