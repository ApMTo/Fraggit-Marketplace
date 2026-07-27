import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ModerationLotsPage } from '@/features/moderation';
import { requireAdminUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('moderation.lots');
  return { title: `${t('title')} | Fraggit` };
}

export default async function Page() {
  await requireAdminUser();
  const t = await getTranslations('moderation.lots');
  return <ModerationLotsPage title={t('title')} />;
}
