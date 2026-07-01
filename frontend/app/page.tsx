import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('pages');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">{t('home')}</h1>
    </main>
  );
}
