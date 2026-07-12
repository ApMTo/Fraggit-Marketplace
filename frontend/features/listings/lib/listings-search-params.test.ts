import { describe, expect, it } from 'vitest';
import {
  listingsHref,
  parseListingsSearchParams,
  toListingsSearchParams,
} from './listings-search-params';

describe('listings search params', () => {
  it('parses defaults', () => {
    expect(parseListingsSearchParams(new URLSearchParams())).toEqual({
      search: '',
      sort: 'default',
      page: 1,
      filters: {},
    });
  });

  it('parses valid query values', () => {
    const params = new URLSearchParams({
      search: ' diamond ',
      sort: 'price_asc',
      page: '3',
      filters: JSON.stringify({ platform: 'XBOX', rank: 'Diamond' }),
    });

    expect(parseListingsSearchParams(params)).toEqual({
      search: 'diamond',
      sort: 'price_asc',
      page: 3,
      filters: { platform: 'XBOX', rank: 'Diamond' },
    });
  });

  it('falls back on invalid values', () => {
    const params = new URLSearchParams({
      sort: 'nope',
      page: '-2',
      filters: 'not-json',
    });

    expect(parseListingsSearchParams(params)).toEqual({
      search: '',
      sort: 'default',
      page: 1,
      filters: {},
    });
  });

  it('serializes only meaningful params', () => {
    expect(
      toListingsSearchParams({
        search: '',
        sort: 'default',
        page: 1,
        filters: {},
      }).toString(),
    ).toBe('');

    expect(
      toListingsSearchParams({
        search: 'xbox',
        sort: 'newest',
        page: 2,
        filters: { platform: 'PC' },
      }).toString(),
    ).toBe(
      `search=xbox&sort=newest&page=2&filters=${encodeURIComponent('{"platform":"PC"}')}`,
    );
  });

  it('builds browse hrefs', () => {
    expect(listingsHref('pubg')).toBe('/listings/pubg');
    expect(listingsHref('pubg', 'accounts')).toBe('/listings/pubg/accounts');
    expect(
      listingsHref('pubg', 'accounts', {
        search: 'rank',
        sort: 'price_desc',
        page: 2,
        filters: { platform: 'XBOX' },
      }),
    ).toBe(
      `/listings/pubg/accounts?search=rank&sort=price_desc&page=2&filters=${encodeURIComponent('{"platform":"XBOX"}')}`,
    );
  });
});
