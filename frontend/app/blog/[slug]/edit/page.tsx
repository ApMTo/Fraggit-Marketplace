import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { BlogEditorPage } from '@/features/blog';
import { getSessionUser } from '@/lib/auth.server';
import { serverGet } from '@/lib/api-server';
import { isMediaRole } from '@/lib/media';
import type { BlogPostEditorDetail } from '@/types/blog';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const t = await getTranslations('blog.editor');
  const { slug } = await params;
  const { data } = await serverGet<BlogPostEditorDetail>(
    `/blog/${slug}/editor`,
  );

  return {
    title: `${t('editTitle')}${data ? `: ${data.title}` : ''} | Fraggit`,
    description: t('subtitle'),
  };
}

export default async function Page({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (!isMediaRole(user.role)) {
    notFound();
  }

  const { slug } = await params;
  const { data } = await serverGet<BlogPostEditorDetail>(
    `/blog/${slug}/editor`,
  );

  if (!data) {
    notFound();
  }

  return <BlogEditorPage mode="edit" post={data} />;
}
