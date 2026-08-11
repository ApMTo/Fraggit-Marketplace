import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { BlogPostCardView } from '@/features/blog/components/blog-post-card';
import { formatBlogDate } from '@/features/blog/lib/format-blog-date';
import { LandingSection } from '@/features/home/components/landing-section';
import { SectionHeader } from '@/features/home/components/section-header';
import type { BlogPostCard } from '@/types/blog';

type LatestBlogSectionProps = {
  posts: BlogPostCard[];
};

export async function LatestBlogSection({ posts }: LatestBlogSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  const t = await getTranslations('landing.blog');
  const locale = await getLocale();

  const gridClass =
    posts.length === 1
      ? 'mx-auto max-w-md grid gap-6'
      : posts.length === 2
        ? 'mx-auto max-w-3xl grid gap-6 sm:grid-cols-2'
        : posts.length === 3
          ? 'mx-auto max-w-5xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <LandingSection id="blog">
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />

      <div className={gridClass}>
        {posts.map((post) => (
          <BlogPostCardView
            key={post.id}
            post={post}
            readLabel={t('readMore')}
            formatDate={(iso) => formatBlogDate(iso, locale)}
          />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/blog"
          className="text-sm font-medium text-accent-foreground underline-offset-4 hover:underline"
        >
          {t('viewAll')}
        </Link>
      </div>
    </LandingSection>
  );
}
