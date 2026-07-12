export function createLotHref(options?: {
  categoryId?: string | null;
  subcategoryId?: string | null;
}): string {
  if (!options?.categoryId) {
    return '/listings/new';
  }

  const params = new URLSearchParams();
  params.set('categoryId', options.categoryId);

  if (options.subcategoryId) {
    params.set('subcategoryId', options.subcategoryId);
  }

  return `/listings/new?${params.toString()}`;
}
