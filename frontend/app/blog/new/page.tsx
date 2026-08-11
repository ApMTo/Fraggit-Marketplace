import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { BlogEditorPage } from '@/features/blog';
import { getSessionUser } from '@/lib/auth.server';
import { isMediaRole } from '@/lib/media';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog.editor');

  return {
    title: `${t('createTitle')} | Fraggit`,
    description: t('subtitle'),
  };
}

export default async function Page() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (!isMediaRole(user.role)) {
    notFound();
  }

  return <BlogEditorPage mode="create" />;
}
