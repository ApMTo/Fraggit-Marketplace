import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { AppImage } from '@/components/ui/app-image';
import { BlogPostEditLink } from '@/features/blog/components/blog-post-edit-link';
import { BlogMarkdown } from '@/features/blog/components/blog-markdown';
import { formatBlogDate } from '@/features/blog/lib/format-blog-date';
import type { BlogPostDetail } from '@/types/blog';

type BlogPostPageProps = {
  post: BlogPostDetail;
};

export async function BlogPostPage({ post }: BlogPostPageProps) {
  const t = await getTranslations('blog');
  const locale = await getLocale();

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
      <Link
        href="/blog"
        className="mb-8 inline-block text-sm text-muted hover:text-foreground"
      >
        ← {t('backToList')}
      </Link>

      <header className="space-y-4">
        <time
          dateTime={post.publishedAt}
          className="text-xs font-medium uppercase tracking-wide text-muted"
        >
          {formatBlogDate(post.publishedAt, locale)}
        </time>
        <h1 className="page-title text-3xl sm:text-5xl">{post.title}</h1>
        <p className="text-sm text-muted">
          {t('byAuthor', { name: post.author.displayName })}
        </p>

        <BlogPostEditLink slug={post.slug} label={t('editPost')} />
      </header>

      <div className="relative my-8 aspect-[16/9] overflow-hidden rounded-[var(--radius-lg)] bg-surface-elevated sm:my-10">
        <AppImage
          src={post.coverUrl}
          alt={post.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      </div>

      <BlogMarkdown content={post.content} />
    </article>
  );
}
