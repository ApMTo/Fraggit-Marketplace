import { Prisma } from '@prisma/client';
import type { AppLocale, LocalizedText } from '../../../common/i18n/locale';
import {
  parseLocalizedText,
  resolveLocalizedName,
} from '../../../common/i18n/locale';

const BLOG_AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
} satisfies Prisma.UserSelect;

export const BLOG_POST_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  coverUrl: true,
  publishedAt: true,
} satisfies Prisma.BlogPostSelect;

export const BLOG_POST_DETAIL_SELECT = {
  ...BLOG_POST_CARD_SELECT,
  content: true,
  createdAt: true,
  updatedAt: true,
  author: { select: BLOG_AUTHOR_SELECT },
} satisfies Prisma.BlogPostSelect;

export type BlogPostCardRecord = Prisma.BlogPostGetPayload<{
  select: typeof BLOG_POST_CARD_SELECT;
}>;

export type BlogPostDetailRecord = Prisma.BlogPostGetPayload<{
  select: typeof BLOG_POST_DETAIL_SELECT;
}>;

export type BlogPostAuthor = {
  id: string;
  username: string;
  displayName: string;
};

export type BlogPostCard = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  publishedAt: Date;
};

export type BlogPostDetail = BlogPostCard & {
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: BlogPostAuthor;
};

export type BlogPostTranslations = {
  title: LocalizedText;
  content: LocalizedText;
};

export type BlogPostEditorDetail = BlogPostDetail & {
  translations: BlogPostTranslations;
};

export function formatBlogPostCard(
  post: BlogPostCardRecord,
  locale?: AppLocale | null,
): BlogPostCard {
  return {
    id: post.id,
    title: resolveLocalizedName(post.title, locale),
    slug: post.slug,
    coverUrl: post.coverUrl,
    publishedAt: post.publishedAt,
  };
}

export function formatBlogPostDetail(
  post: BlogPostDetailRecord,
  locale?: AppLocale | null,
): BlogPostDetail {
  return {
    ...formatBlogPostCard(post, locale),
    content: resolveLocalizedName(post.content, locale),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author,
  };
}

export function formatBlogPostEditor(
  post: BlogPostDetailRecord,
  locale?: AppLocale | null,
): BlogPostEditorDetail {
  return {
    ...formatBlogPostDetail(post, locale),
    translations: {
      title: parseLocalizedText(post.title),
      content: parseLocalizedText(post.content),
    },
  };
}
