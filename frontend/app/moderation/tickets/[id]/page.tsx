import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ModerationTicketDetailPage } from '@/features/moderation';
import { requireModeratorUser } from '@/lib/auth.server';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('moderation.tickets');
  return { title: `${t('detailTitle')} | Fraggit` };
}

export default async function Page({ params }: Props) {
  await requireModeratorUser();
  const { id } = await params;
  const t = await getTranslations('moderation.tickets');
  return <ModerationTicketDetailPage title={t('detailTitle')} ticketId={id} />;
}
