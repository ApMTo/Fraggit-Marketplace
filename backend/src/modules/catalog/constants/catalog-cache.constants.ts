export const CATALOG_CACHE_TTL_SECONDS = 5 * 60;

export const CATALOG_CACHE_KEYS = {
  categories: () => 'catalog:categories:v1',
  subcategories: (categoryId: string) =>
    `catalog:subcategories:${categoryId}:v1`,
  filterableAttributes: (subcategoryId: string) =>
    `catalog:filter-attrs:${subcategoryId}:validation:v1`,
  filterableAttributesPublic: (subcategoryId: string) =>
    `catalog:filter-attrs:${subcategoryId}:public:v1`,
  slugResolution: (categorySlug: string, subcategorySlug: string) =>
    `catalog:slugs:${categorySlug}:${subcategorySlug}:v1`,
} as const;

export const CATALOG_CACHE_PATTERNS = {
  filterableAttributes: 'catalog:filter-attrs:*',
  slugResolutions: 'catalog:slugs:*',
} as const;
