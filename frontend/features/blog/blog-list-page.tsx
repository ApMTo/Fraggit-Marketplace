import { getLocale, getTranslations } from 'next-intl/server';
import { EmptyState } from '@/components/ui/empty-state';
import { BlogManageNewLink } from '@/features/blog/components/blog-manage-new-link';
import { BlogPagination } from '@/features/blog/components/blog-pagination';
import { BlogPostCardView } from '@/features/blog/components/blog-post-card';
import { formatBlogDate } from '@/features/blog/lib/format-blog-date';
import type { BlogPostListResult } from '@/types/blog';

type BlogListPageProps = {
  posts: BlogPostListResult;
};

export async function BlogListPage({ posts }: BlogListPageProps) {
  const t = await getTranslations('blog');
  const locale = await getLocale();
  const totalPages = Math.max(1, Math.ceil(posts.total / posts.limit));

  return (
    <div className="mx-auto w-full max-w-site px-5 py-10 sm:py-14">
      <header className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-3">
          <h1 className="page-title text-3xl sm:text-4xl">{t('title')}</h1>
          <p className="text-base text-muted sm:text-lg">{t('subtitle')}</p>
        </div>

        <BlogManageNewLink label={t('newPost')} />
      </header>

      {posts.items.length === 0 ? (
        <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.items.map((post) => (
              <BlogPostCardView
                key={post.id}
                post={post}
                readLabel={t('readMore')}
                formatDate={(iso) => formatBlogDate(iso, locale)}
              />
            ))}
          </div>

          <BlogPagination
            page={posts.page}
            totalPages={totalPages}
            prevLabel={t('pagination.prev')}
            nextLabel={t('pagination.next')}
            pageLabel={(page, total) => t('pagination.page', { page, total })}
          />
        </>
      )}
    </div>
  );
}
