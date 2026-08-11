import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HomePage } from '@/features/home';
import { getSessionUser } from '@/lib/auth.server';
import { serverGet } from '@/lib/api-server';
import type { BlogPostCard } from '@/types/blog';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing');
  const tPages = await getTranslations('pages');

  return {
    title: `${tPages('home')} | Fraggit`,
    description: t('meta.description'),
  };
}

export default async function Page() {
  const [user, latest] = await Promise.all([
    getSessionUser(),
    serverGet<BlogPostCard[]>('/blog/latest'),
  ]);

  return (
    <HomePage
      isAuthenticated={Boolean(user)}
      latestPosts={latest.data ?? []}
    />
  );
}
