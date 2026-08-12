import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HomePage } from '@/features/home';
import { fetchBlogLatest } from '@/features/blog/lib/blog.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing');
  const tPages = await getTranslations('pages');

  return {
    title: `${tPages('home')} | Fraggit`,
    description: t('meta.description'),
  };
}

export default async function Page() {
  const latestPosts = await fetchBlogLatest();

  return <HomePage latestPosts={latestPosts} />;
}
