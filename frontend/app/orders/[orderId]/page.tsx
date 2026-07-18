import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OrderDetailPage } from '@/features/orders/order-detail-page';

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('orders');

  return {
    title: `${t('detailTitle')} | Fraggit`,
    description: t('subtitle'),
  };
}

export default async function Page({ params }: PageProps) {
  const { orderId } = await params;

  return <OrderDetailPage orderId={orderId} />;
}
