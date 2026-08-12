export const CACHE_TTL = {
  /** Categories, subcategories, filterable attribute definitions. */
  catalog: 300,
  /** Paginated lot lists within a subcategory. */
  listings: 30,
  /** Single lot detail payload. */
  lotDetail: 60,
  /** Blog list and post detail. */
  blog: 120,
  /** Homepage latest posts strip. */
  blogLatest: 120,
  /** Legal documents (in-module content). */
  legal: 86_400,
} as const;

export const CACHE_TAGS = {
  categories: 'categories',
  subcategories: (categoryId: string) => `subcategories:${categoryId}`,
  filterAttributes: (subcategoryId: string) =>
    `filter-attributes:${subcategoryId}`,
  listings: (categorySlug: string, subcategorySlug: string) =>
    `listings:${categorySlug}:${subcategorySlug}`,
  lot: (lotId: string) => `lot:${lotId}`,
  blog: 'blog',
  blogLatest: 'blog:latest',
  blogPost: (slug: string) => `blog:${slug}`,
} as const;
