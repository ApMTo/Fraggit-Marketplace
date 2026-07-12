import { describe, expect, it } from 'vitest';
import { formatLotPrice } from './format-lot-price';

describe('formatLotPrice', () => {
  it('formats numeric and string prices', () => {
    expect(formatLotPrice(49.99, 'en')).toBe('AMD 49.99');
    expect(formatLotPrice('12.5', 'en')).toBe('AMD 12.50');
  });

  it('returns raw value when not finite', () => {
    expect(formatLotPrice('n/a', 'en')).toBe('n/a');
  });
});
