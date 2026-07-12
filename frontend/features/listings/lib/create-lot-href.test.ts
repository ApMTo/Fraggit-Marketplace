import { describe, expect, it } from 'vitest';
import { createLotHref } from './create-lot-href';

describe('createLotHref', () => {
  it('returns base path without ids', () => {
    expect(createLotHref()).toBe('/listings/new');
    expect(createLotHref({})).toBe('/listings/new');
  });

  it('includes category and subcategory ids', () => {
    expect(createLotHref({ categoryId: 'cat-1' })).toBe(
      '/listings/new?categoryId=cat-1',
    );
    expect(
      createLotHref({ categoryId: 'cat-1', subcategoryId: 'sub-1' }),
    ).toBe('/listings/new?categoryId=cat-1&subcategoryId=sub-1');
  });
});
