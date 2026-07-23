import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ModerationOverviewPage } from '@/features/moderation';
import { requireModeratorUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');
  return { title: `${t('moderation')} | Fraggit` };
}

export default async function Page() {
  await requireModeratorUser();
  const t = await getTranslations('pages');
  return <ModerationOverviewPage title={t('moderation')} />;
}
