import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OrdersPage } from '@/features/orders/orders-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('orders');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
  };
}

export default function Page() {
  return <OrdersPage />;
}
