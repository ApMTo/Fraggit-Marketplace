import { calculateUpdatedRating } from './calculate-updated-rating';

describe('calculateUpdatedRating', () => {
  it('calculates average for first review', () => {
    expect(calculateUpdatedRating(0, 0, 5)).toEqual({
      rating: 5,
      ratingCount: 1,
    });
  });

  it('updates rolling average', () => {
    expect(calculateUpdatedRating(4, 2, 5)).toEqual({
      rating: 4.33,
      ratingCount: 3,
    });
  });

  it('rounds to two decimal places', () => {
    const result = calculateUpdatedRating(3.33, 3, 4);

    expect(result.ratingCount).toBe(4);
    expect(result.rating).toBe(3.5);
  });
});
