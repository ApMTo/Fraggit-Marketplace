import { getApiErrorCode } from '@/lib/api-error';

const ADMIN_ERROR_KEYS: Record<string, string> = {
  category_not_found: 'categoryNotFound',
  category_name_already_exists: 'categoryNameExists',
  category_slug_already_exists: 'categorySlugExists',
  category_has_lots: 'categoryHasLots',
  invalid_slug: 'invalidSlug',
  subcategory_not_found: 'subcategoryNotFound',
  subcategory_slug_already_exists: 'subcategorySlugExists',
  subcategory_has_lots: 'subcategoryHasLots',
  invalid_global_attribute_ids: 'invalidGlobalAttributeIds',
  attribute_definition_not_found: 'attributeNotFound',
  attribute_key_already_exists: 'attributeKeyExists',
  attribute_key_conflicts_with_global: 'attributeKeyConflictsWithGlobal',
  attribute_options_required: 'attributeOptionsRequired',
  attribute_options_not_allowed: 'attributeOptionsNotAllowed',
  'errors.insufficient_role': 'insufficientRole',
};

export function resolveAdminErrorKey(error: unknown): string {
  const code = getApiErrorCode(error);

  if (code && ADMIN_ERROR_KEYS[code]) {
    return ADMIN_ERROR_KEYS[code];
  }

  return 'generic';
}
