import { AttributeType } from '@prisma/client';
import { AttributeDefinitionForValidation } from '../../attribute-definitions/constants/attribute-definition.select';
import { LotSort } from '../dto/find-lots.query.dto';
import {
  buildLotListOrderBy,
  buildLotListWhere,
  normalizeFilterValue,
} from './build-lot-list-query';

const definition = (
  overrides: Partial<AttributeDefinitionForValidation>,
): AttributeDefinitionForValidation => ({
  id: 'attr-1',
  key: 'platform',
  type: AttributeType.SELECT,
  required: false,
  options: ['PC', 'XBOX'],
  ...overrides,
});

describe('build-lot-list-query', () => {
  describe('normalizeFilterValue', () => {
    it('normalizes select filter', () => {
      expect(normalizeFilterValue(definition({}), ' PC ')).toBe('PC');
    });

    it('normalizes number filter', () => {
      expect(
        normalizeFilterValue(
          definition({ key: 'level', type: AttributeType.NUMBER, options: null }),
          '15',
        ),
      ).toBe('15');
    });

    it('throws for invalid filter value', () => {
      expect(() => normalizeFilterValue(definition({}), '   ')).toThrow(
        'invalid_filter_value:platform',
      );
    });
  });

  describe('buildLotListWhere', () => {
    it('builds base filters with search and attributes', () => {
      const where = buildLotListWhere('sub-1', 'rocket', [
        { attributeId: 'attr-1', value: 'PC', multiselect: false },
        { attributeId: 'attr-2', value: 'Ranked', multiselect: true },
      ]);

      expect(where).toEqual({
        AND: [
          { subcategoryId: 'sub-1' },
          { status: 'OPEN' },
          { stock: { gt: 0 } },
          {
            OR: [
              { title: { contains: 'rocket', mode: 'insensitive' } },
              { description: { contains: 'rocket', mode: 'insensitive' } },
              {
                attributes: {
                  some: { value: { contains: 'rocket', mode: 'insensitive' } },
                },
              },
            ],
          },
          {
            attributes: {
              some: { attributeId: 'attr-1', value: 'PC' },
            },
          },
          {
            attributes: {
              some: { attributeId: 'attr-2', value: { contains: '"Ranked"' } },
            },
          },
        ],
      });
    });
  });

  describe('buildLotListOrderBy', () => {
    it('maps sort options to prisma order', () => {
      expect(buildLotListOrderBy(LotSort.PRICE_ASC)).toEqual({ price: 'asc' });
      expect(buildLotListOrderBy(LotSort.PRICE_DESC)).toEqual({ price: 'desc' });
      expect(buildLotListOrderBy(LotSort.DEFAULT)).toEqual({ createdAt: 'desc' });
    });
  });
});
