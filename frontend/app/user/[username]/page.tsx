import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProfilePage } from '@/features/profile';

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const t = await getTranslations('profile');

  return {
    title: `${t('userTitle', { username })} | Fraggit`,
    description: t('subtitle'),
  };
}

export default async function Page({ params }: PageProps) {
  const { username } = await params;

  return <ProfilePage username={username} />;
}
