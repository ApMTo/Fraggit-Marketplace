import type { Locale } from '@/i18n/config';

export type LocalizedBlogText = Record<Locale, string>;

export type BlogPostCard = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  publishedAt: string;
};

export type BlogPostAuthor = {
  id: string;
  username: string;
  displayName: string;
};

export type BlogPostDetail = BlogPostCard & {
  content: string;
  createdAt: string;
  updatedAt: string;
  author: BlogPostAuthor;
};

export type BlogPostTranslations = {
  title: LocalizedBlogText;
  content: LocalizedBlogText;
};

export type BlogPostEditorDetail = BlogPostDetail & {
  translations: BlogPostTranslations;
};

export type BlogPostListResult = {
  items: BlogPostCard[];
  total: number;
  page: number;
  limit: number;
};

export type FindBlogPostsParams = {
  page?: number;
  limit?: number;
};

export type CreateBlogPostPayload = {
  title: LocalizedBlogText;
  content: LocalizedBlogText;
  slug?: string;
  cover: File;
};

export type UpdateBlogPostPayload = {
  title?: LocalizedBlogText;
  content?: LocalizedBlogText;
  slug?: string;
  cover?: File | null;
};

export const BLOG_PAGE_SIZE = 15;
export const BLOG_LATEST_LIMIT = 4;
export const BLOG_COVER_ACCEPT = 'image/jpeg,image/png,image/webp';
export const BLOG_COVER_MAX_BYTES = 5 * 1024 * 1024;

export function emptyLocalizedBlogText(): LocalizedBlogText {
  return { en: '', ru: '' };
}
