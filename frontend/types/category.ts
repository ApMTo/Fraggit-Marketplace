export type AttributeType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTISELECT';

export type CategoryPublic = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  previewUrl: string | null;
};

export type CategoryAdmin = CategoryPublic & {
  createdAt: string;
  updatedAt: string;
};

export type SubcategoryPublic = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
};

export type SubcategoryAdmin = SubcategoryPublic & {
  createdAt: string;
  updatedAt: string;
  globalAttributeIds: string[];
};

export type AttributeDefinitionPublic = {
  id: string;
  categoryId: string;
  subcategoryId: string | null;
  isGlobal: boolean;
  key: string;
  label: string;
  type: AttributeType;
  required: boolean;
  options: string[] | null;
  sortOrder: number;
};

export type AttributeDefinitionAdmin = AttributeDefinitionPublic & {
  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryPayload = {
  name: string;
  slug?: string;
  icon?: File | null;
  preview?: File | null;
};

export type UpdateCategoryPayload = {
  name?: string;
  slug?: string;
  icon?: File | null;
  preview?: File | null;
};

export type CreateSubcategoryPayload = {
  name: string;
  slug?: string;
  globalAttributeIds?: string[];
};

export type UpdateSubcategoryPayload = {
  name?: string;
  slug?: string;
  globalAttributeIds?: string[];
};

export type CreateAttributeDefinitionPayload = {
  key: string;
  label: string;
  type: AttributeType;
  required?: boolean;
  options?: string[];
  sortOrder?: number;
};

export type UpdateAttributeDefinitionPayload = {
  key?: string;
  label?: string;
  type?: AttributeType;
  required?: boolean;
  options?: string[];
  sortOrder?: number;
};

export const ATTRIBUTE_TYPES: AttributeType[] = [
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'BOOLEAN',
  'SELECT',
  'MULTISELECT',
];

export const OPTION_ATTRIBUTE_TYPES = new Set<AttributeType>([
  'SELECT',
  'MULTISELECT',
]);
