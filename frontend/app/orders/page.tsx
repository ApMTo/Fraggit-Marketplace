import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OrdersPage } from '@/features/orders/orders-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');

  return {
    title: `${t('orders')} | Fraggit`,
  };
}

export default async function Page() {
  const t = await getTranslations('pages');

  return <OrdersPage title={t('orders')} />;
}
