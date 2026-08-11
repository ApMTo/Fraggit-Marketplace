import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BlogListPage } from '@/features/blog';
import { getSessionUser } from '@/lib/auth.server';
import { serverGet } from '@/lib/api-server';
import { isMediaRole } from '@/lib/media';
import { BLOG_PAGE_SIZE, type BlogPostListResult } from '@/types/blog';

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
  const user = await getSessionUser();

  const { data } = await serverGet<BlogPostListResult>('/blog', {
    query: {
      page: String(page),
      limit: String(BLOG_PAGE_SIZE),
    },
  });

  const posts: BlogPostListResult = data ?? {
    items: [],
    total: 0,
    page,
    limit: BLOG_PAGE_SIZE,
  };

  return (
    <BlogListPage posts={posts} canManage={isMediaRole(user?.role)} />
  );
}
