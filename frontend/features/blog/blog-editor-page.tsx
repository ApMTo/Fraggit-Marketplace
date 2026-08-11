import { getTranslations } from 'next-intl/server';
import { BlogPostForm } from '@/features/blog/components/blog-post-form';
import type { BlogPostEditorDetail } from '@/types/blog';

type BlogEditorPageProps = {
  mode: 'create' | 'edit';
  post?: BlogPostEditorDetail;
};

export async function BlogEditorPage({ mode, post }: BlogEditorPageProps) {
  const t = await getTranslations('blog.editor');

  return (
    <div className="mx-auto w-full max-w-site px-5 py-10 sm:py-14">
      <header className="mb-8 max-w-3xl space-y-2">
        <h1 className="page-title text-3xl">
          {mode === 'create' ? t('createTitle') : t('editTitle')}
        </h1>
        <p className="text-muted">{t('subtitle')}</p>
      </header>

      <BlogPostForm mode={mode} post={post} />
    </div>
  );
}
