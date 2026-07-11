export function calculateUpdatedRating(
  currentRating: number,
  currentCount: number,
  newRating: number,
): { rating: number; ratingCount: number } {
  const ratingCount = currentCount + 1;
  const rating =
    Math.round(
      ((currentRating * currentCount + newRating) / ratingCount) * 100,
    ) / 100;

  return { rating, ratingCount };
}
