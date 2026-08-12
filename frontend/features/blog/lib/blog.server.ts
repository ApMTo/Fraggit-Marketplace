import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { CACHE_TAGS, CACHE_TTL } from '@/lib/cache-config';
import { serverFetchPublic } from '@/lib/api-server-public';
import { BLOG_PAGE_SIZE, type BlogPostCard, type BlogPostDetail, type BlogPostListResult } from '@/types/blog';

export const fetchBlogLatest = cache(
  async (locale?: string): Promise<BlogPostCard[]> => {
    const resolvedLocale = locale ?? (await getLocale());
    const { data } = await serverFetchPublic<BlogPostCard[]>('/blog/latest', {
      locale: resolvedLocale,
      revalidate: CACHE_TTL.blogLatest,
      tags: [CACHE_TAGS.blogLatest, CACHE_TAGS.blog],
    });

    return data ?? [];
  },
);

export const fetchBlogPostBySlug = cache(
  async (slug: string, locale?: string): Promise<BlogPostDetail | null> => {
    const resolvedLocale = locale ?? (await getLocale());
    const { data } = await serverFetchPublic<BlogPostDetail>(`/blog/${slug}`, {
      locale: resolvedLocale,
      revalidate: CACHE_TTL.blog,
      tags: [CACHE_TAGS.blogPost(slug), CACHE_TAGS.blog],
    });

    return data;
  },
);

export const fetchBlogList = cache(
  async (
    page: number,
    locale?: string,
  ): Promise<BlogPostListResult> => {
    const resolvedLocale = locale ?? (await getLocale());
    const { data } = await serverFetchPublic<BlogPostListResult>('/blog', {
      locale: resolvedLocale,
      query: {
        page: String(page),
        limit: String(BLOG_PAGE_SIZE),
      },
      revalidate: CACHE_TTL.blog,
      tags: [CACHE_TAGS.blog],
    });

    return (
      data ?? {
        items: [],
        total: 0,
        page,
        limit: BLOG_PAGE_SIZE,
      }
    );
  },
);
