import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ForgotPasswordPage } from '@/features/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.forgot');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
    robots: { index: false, follow: false },
  };
}

export default function Page() {
  return <ForgotPasswordPage />;
}
