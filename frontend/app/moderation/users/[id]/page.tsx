import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ModerationUserDetailPage } from '@/features/moderation';
import { requireModeratorUser } from '@/lib/auth.server';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('moderation.users');
  return { title: `${t('detailTitle')} | Fraggit` };
}

export default async function Page({ params }: Props) {
  await requireModeratorUser();
  const { id } = await params;
  const t = await getTranslations('moderation.users');
  return <ModerationUserDetailPage title={t('detailTitle')} userId={id} />;
}
