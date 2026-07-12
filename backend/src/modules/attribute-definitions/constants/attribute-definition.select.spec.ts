import {
  applicableAttributesWhere,
  filterableAttributesWhere,
  parseAttributeOptions,
} from './attribute-definition.select';

describe('attribute-definition.select helpers', () => {
  describe('parseAttributeOptions', () => {
    it('returns parsed string options', () => {
      expect(parseAttributeOptions(['PC', 'XBOX', ''])).toEqual(['PC', 'XBOX']);
    });

    it('returns null for invalid options', () => {
      expect(parseAttributeOptions(null)).toBeNull();
      expect(parseAttributeOptions(['', 123])).toBeNull();
    });
  });

  describe('applicableAttributesWhere', () => {
    it('builds OR filter for subcategory and linked global attributes', () => {
      expect(applicableAttributesWhere('cat-1', 'sub-1')).toEqual({
        OR: [
          { isGlobal: false, subcategoryId: 'sub-1' },
          {
            isGlobal: true,
            categoryId: 'cat-1',
            subcategoryLinks: { some: { subcategoryId: 'sub-1' } },
          },
        ],
      });
    });
  });

  describe('filterableAttributesWhere', () => {
    it('includes subcategory attrs and all category globals', () => {
      expect(filterableAttributesWhere('cat-1', 'sub-1')).toEqual({
        OR: [
          { isGlobal: false, subcategoryId: 'sub-1' },
          { isGlobal: true, categoryId: 'cat-1' },
        ],
      });
    });
  });
});
