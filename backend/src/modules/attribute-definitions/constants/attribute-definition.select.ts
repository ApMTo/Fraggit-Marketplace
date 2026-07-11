import { Prisma } from '@prisma/client';

export const ATTRIBUTE_DEFINITION_PUBLIC_SELECT = {
  id: true,
  categoryId: true,
  subcategoryId: true,
  isGlobal: true,
  key: true,
  label: true,
  type: true,
  required: true,
  options: true,
  sortOrder: true,
} satisfies Prisma.AttributeDefinitionSelect;

export const ATTRIBUTE_DEFINITION_ADMIN_SELECT = {
  ...ATTRIBUTE_DEFINITION_PUBLIC_SELECT,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AttributeDefinitionSelect;

export const ATTRIBUTE_DEFINITION_VALIDATION_SELECT = {
  id: true,
  key: true,
  type: true,
  required: true,
  options: true,
} satisfies Prisma.AttributeDefinitionSelect;

export type AttributeDefinitionPublic = Prisma.AttributeDefinitionGetPayload<{
  select: typeof ATTRIBUTE_DEFINITION_PUBLIC_SELECT;
}>;

export type AttributeDefinitionAdmin = Prisma.AttributeDefinitionGetPayload<{
  select: typeof ATTRIBUTE_DEFINITION_ADMIN_SELECT;
}>;

export type AttributeDefinitionForValidation =
  Prisma.AttributeDefinitionGetPayload<{
    select: typeof ATTRIBUTE_DEFINITION_VALIDATION_SELECT;
  }>;

export function parseAttributeOptions(
  options: Prisma.JsonValue,
): string[] | null {
  if (!Array.isArray(options)) {
    return null;
  }

  const parsed = options.filter(
    (item): item is string => typeof item === 'string' && item.length > 0,
  );

  return parsed.length > 0 ? parsed : null;
}

export function applicableAttributesWhere(
  categoryId: string,
  subcategoryId: string,
): Prisma.AttributeDefinitionWhereInput {
  return {
    OR: [
      { isGlobal: false, subcategoryId },
      {
        isGlobal: true,
        categoryId,
        subcategoryLinks: { some: { subcategoryId } },
      },
    ],
  };
}
