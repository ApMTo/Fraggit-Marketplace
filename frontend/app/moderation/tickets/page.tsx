import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ModerationTicketsPage } from '@/features/moderation';
import { requireModeratorUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('moderation.tickets');
  return { title: `${t('title')} | Fraggit` };
}

export default async function Page() {
  await requireModeratorUser();
  const t = await getTranslations('moderation.tickets');
  return <ModerationTicketsPage title={t('title')} />;
}
