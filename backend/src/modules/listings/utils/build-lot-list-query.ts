import { AttributeType, LotStatus, Prisma } from '@prisma/client';
import { AttributeDefinitionForValidation } from '../../attribute-definitions/constants/attribute-definition.select';
import { LotSort } from '../dto/find-lots.query.dto';

export type ResolvedAttributeFilter = {
  attributeId: string;
  value: string;
  multiselect: boolean;
};

export function normalizeFilterValue(
  definition: AttributeDefinitionForValidation,
  rawValue: string | number | boolean,
): string {
  switch (definition.type) {
    case AttributeType.TEXT:
    case AttributeType.TEXTAREA:
    case AttributeType.SELECT:
      if (typeof rawValue !== 'string' || !rawValue.trim()) {
        throw new Error(`invalid_filter_value:${definition.key}`);
      }
      return rawValue.trim();

    case AttributeType.NUMBER: {
      const numeric =
        typeof rawValue === 'number'
          ? rawValue
          : typeof rawValue === 'string'
            ? Number(rawValue.trim())
            : Number.NaN;

      if (!Number.isFinite(numeric)) {
        throw new Error(`invalid_filter_value:${definition.key}`);
      }
      return String(numeric);
    }

    case AttributeType.BOOLEAN:
      if (typeof rawValue === 'boolean') {
        return rawValue ? 'true' : 'false';
      }
      if (typeof rawValue === 'string') {
        const normalized = rawValue.trim().toLowerCase();
        if (normalized === 'true' || normalized === 'false') {
          return normalized;
        }
      }
      throw new Error(`invalid_filter_value:${definition.key}`);

    case AttributeType.MULTISELECT:
      if (typeof rawValue !== 'string' || !rawValue.trim()) {
        throw new Error(`invalid_filter_value:${definition.key}`);
      }
      return rawValue.trim();

    default:
      throw new Error(`unsupported_filter_type:${definition.key}`);
  }
}

export function buildLotListWhere(
  subcategoryId: string,
  search: string | undefined,
  attributeFilters: ResolvedAttributeFilter[],
): Prisma.LotWhereInput {
  const conditions: Prisma.LotWhereInput[] = [
    { subcategoryId },
    { status: LotStatus.OPEN },
    { stock: { gt: 0 } },
  ];

  if (search) {
    conditions.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          attributes: {
            some: { value: { contains: search, mode: 'insensitive' } },
          },
        },
      ],
    });
  }

  for (const filter of attributeFilters) {
    conditions.push({
      attributes: {
        some: {
          attributeId: filter.attributeId,
          value: filter.multiselect
            ? { contains: `"${filter.value}"` }
            : filter.value,
        },
      },
    });
  }

  return { AND: conditions };
}

export function buildSellerLotListWhere(
  sellerId: string,
  search?: string,
): Prisma.LotWhereInput {
  const conditions: Prisma.LotWhereInput[] = [
    { sellerId },
    { status: LotStatus.OPEN },
    { stock: { gt: 0 } },
  ];

  if (search) {
    conditions.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          attributes: {
            some: { value: { contains: search, mode: 'insensitive' } },
          },
        },
      ],
    });
  }

  return { AND: conditions };
}

export function buildLotListOrderBy(
  sort: LotSort,
): Prisma.LotOrderByWithRelationInput {
  switch (sort) {
    case LotSort.PRICE_ASC:
      return { price: 'asc' };
    case LotSort.PRICE_DESC:
      return { price: 'desc' };
    case LotSort.NEWEST:
    case LotSort.DEFAULT:
    default:
      return { createdAt: 'desc' };
  }
}
