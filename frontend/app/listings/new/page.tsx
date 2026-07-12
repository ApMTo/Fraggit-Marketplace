import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Spinner } from '@/components/ui/spinner';
import { CreateLotPage } from '@/features/listings/create-lot-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('listings.create');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
  };
}

function CreateLotFallback() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] justify-center px-5 py-20">
      <Spinner size="lg" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<CreateLotFallback />}>
      <CreateLotPage />
    </Suspense>
  );
}
