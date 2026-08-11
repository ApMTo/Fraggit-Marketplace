import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BlogPostPage } from '@/features/blog';
import { getSessionUser } from '@/lib/auth.server';
import { serverGet } from '@/lib/api-server';
import { isMediaRole } from '@/lib/media';
import type { BlogPostDetail } from '@/types/blog';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await serverGet<BlogPostDetail>(`/blog/${slug}`);
  const t = await getTranslations('blog');

  if (!data) {
    return { title: `${t('title')} | Fraggit` };
  }

  return {
    title: `${data.title} | Fraggit`,
    description: t('subtitle'),
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  const { data } = await serverGet<BlogPostDetail>(`/blog/${slug}`);

  if (!data) {
    notFound();
  }

  return (
    <BlogPostPage post={data} canManage={isMediaRole(user?.role)} />
  );
}
