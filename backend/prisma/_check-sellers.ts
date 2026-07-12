import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const lots = await prisma.lot.findMany({
      where: { category: { slug: 'pubg' } },
      select: {
        title: true,
        seller: {
          select: { id: true, username: true, email: true, displayName: true },
        },
      },
    });
    console.log(JSON.stringify(lots, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
