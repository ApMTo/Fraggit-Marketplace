import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BlogListPage } from '@/features/blog';
import { fetchBlogList } from '@/features/blog/lib/blog.server';

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
  };
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const posts = await fetchBlogList(page);

  return <BlogListPage posts={posts} />;
}
