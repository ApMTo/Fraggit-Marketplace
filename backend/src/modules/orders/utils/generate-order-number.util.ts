import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Generates a unique human-readable order number: FR-10234.
 * Uses a PostgreSQL sequence to stay safe under concurrent purchases.
 */
export async function generateOrderNumber(
  prisma: PrismaService | Prisma.TransactionClient,
): Promise<string> {
  const rows = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('order_number_seq') AS nextval
  `;

  const sequenceValue = Number(rows[0]?.nextval ?? 0);

  return `FR-${String(sequenceValue).padStart(5, '0')}`;
}
