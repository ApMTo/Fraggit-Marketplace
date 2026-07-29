import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ModerationReportsPage } from '@/features/moderation';
import { requireAdminUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('moderation.reports');
  return { title: `${t('sections.MESSAGE')} | Fraggit` };
}

export default async function Page() {
  await requireAdminUser();
  const t = await getTranslations('moderation.reports');
  return (
    <ModerationReportsPage
      title={t('sections.MESSAGE')}
      targetType="MESSAGE"
    />
  );
}
