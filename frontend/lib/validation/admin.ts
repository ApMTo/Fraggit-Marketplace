import type { AttributeType } from '@/types/category';
import { OPTION_ATTRIBUTE_TYPES } from '@/types/category';

const NAME_MIN = 2;
const NAME_MAX = 100;
const SLUG_MAX = 100;
const KEY_MIN = 2;
const KEY_MAX = 50;
const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const LABEL_MIN = 2;
const LABEL_MAX = 100;

export function validateCategoryName(name: string): string | undefined {
  const trimmed = name.trim();

  if (!trimmed) {
    return 'nameRequired';
  }

  if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
    return 'nameLength';
  }

  return undefined;
}

export function validateCategorySlug(slug: string): string | undefined {
  const trimmed = slug.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length > SLUG_MAX) {
    return 'slugLength';
  }

  return undefined;
}

export function validateSubcategoryName(name: string): string | undefined {
  return validateCategoryName(name);
}

export function validateSubcategorySlug(slug: string): string | undefined {
  return validateCategorySlug(slug);
}

export function validateAttributeKey(key: string): string | undefined {
  const trimmed = key.trim().toLowerCase();

  if (!trimmed) {
    return 'keyRequired';
  }

  if (trimmed.length < KEY_MIN || trimmed.length > KEY_MAX) {
    return 'keyLength';
  }

  if (!KEY_PATTERN.test(trimmed)) {
    return 'keyFormat';
  }

  return undefined;
}

export function validateAttributeLabel(label: string): string | undefined {
  const trimmed = label.trim();

  if (!trimmed) {
    return 'labelRequired';
  }

  if (trimmed.length < LABEL_MIN || trimmed.length > LABEL_MAX) {
    return 'labelLength';
  }

  return undefined;
}

export function validateAttributeOptions(
  type: AttributeType,
  options: string[],
): string | undefined {
  if (!OPTION_ATTRIBUTE_TYPES.has(type)) {
    return undefined;
  }

  const filtered = options.map((option) => option.trim()).filter(Boolean);

  if (filtered.length === 0) {
    return 'optionsRequired';
  }

  return undefined;
}

export function validateSortOrder(value: string): string | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return 'sortOrderInvalid';
  }

  return undefined;
}

export function parseOptionsInput(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formatOptionsForInput(options: string[] | null): string {
  return options?.join('\n') ?? '';
}
