import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LotDetailPage } from '@/features/listings/lot-detail-page';

type PageProps = {
  params: Promise<{
    categorySlug: string;
    subcategorySlug: string;
    lotId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('listings');

  return {
    title: `${t('lotDetails')} | Fraggit`,
    description: t('categorySubtitle'),
  };
}

export default async function Page({ params }: PageProps) {
  const { categorySlug, subcategorySlug, lotId } = await params;

  return (
    <LotDetailPage
      lotId={lotId}
      categorySlug={categorySlug}
      subcategorySlug={subcategorySlug}
    />
  );
}
