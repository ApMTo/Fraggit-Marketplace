import { generateOrderNumber } from './generate-order-number.util';

describe('generateOrderNumber', () => {
  it('formats sequence value with FR prefix and padding', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ nextval: BigInt(42) }]),
    };

    await expect(generateOrderNumber(prisma as never)).resolves.toBe(
      'FR-00042',
    );
  });

  it('handles missing sequence value', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{}]),
    };

    await expect(generateOrderNumber(prisma as never)).resolves.toBe(
      'FR-00000',
    );
  });
});
