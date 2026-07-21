import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ResetPasswordPage } from '@/features/auth';

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.reset');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: PageProps) {
  const { token } = await params;

  return <ResetPasswordPage token={token} />;
}
