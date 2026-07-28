import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  UserRole,
  UserStatus,
  type AttributeDefinition,
  type Category,
  type Subcategory,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { Pool } from 'pg';
import { assertDevOnly } from '../src/database/assert-dev-only';

const LOT_PHOTO_URL =
  'https://sm.ign.com/ign_za/review/p/pubg-battl/pubg-battlegrounds-free-to-play-review-2022_2n1n.jpg';

const PUBG_ICON_URL =
  'https://media.sketchfab.com/models/5848769ca37f442eb9d100374d02be4b/thumbnails/18ac83c88c7642acb4c76f900b9d152e/6b46efc4de46443aa067a74d63f4a4c9.jpeg';

const PUBG_PREVIEW_URL = LOT_PHOTO_URL;

const SEED_SELLER = {
  email: 'seed-seller@fraggit.local',
  username: 'pubg_seller',
  displayName: 'PUBG Seller',
  password: 'SeedSeller123!',
};

function sellerExcludeEmail(): string | undefined {
  const fromEnv = process.env.SEED_EXCLUDE_SELLER_EMAIL?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  const flagIndex = process.argv.indexOf('--exclude-seller-email');
  if (flagIndex >= 0) {
    return process.argv[flagIndex + 1]?.trim() || undefined;
  }
  return undefined;
}

async function resolveSeller(prisma: PrismaClient) {
  const excludeEmail = sellerExcludeEmail();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: SEED_SELLER.email }, { username: SEED_SELLER.username }],
    },
    select: { id: true, username: true, email: true },
  });

  if (existing) {
    if (excludeEmail && existing.email === excludeEmail) {
      throw new Error(
        `Seed seller account matches SEED_EXCLUDE_SELLER_EMAIL (${excludeEmail}). Use another exclude email or a different seed seller.`,
      );
    }
    return existing;
  }

  const passwordHash = await argon2.hash(SEED_SELLER.password, {
    type: argon2.argon2id,
  });

  return prisma.user.create({
    data: {
      email: SEED_SELLER.email,
      username: SEED_SELLER.username,
      displayName: SEED_SELLER.displayName,
      passwordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      rating: 4.8,
      ratingCount: 24,
      successfulSales: 18,
    },
    select: { id: true, username: true, email: true },
  });
}

/** Active users except the excluded email; falls back to dedicated seed seller. */
async function resolveLotSellers(prisma: PrismaClient) {
  const excludeEmail = sellerExcludeEmail();

  const others = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      ...(excludeEmail ? { email: { not: excludeEmail } } : {}),
      NOT: {
        OR: [{ email: SEED_SELLER.email }, { username: SEED_SELLER.username }],
      },
    },
    select: { id: true, username: true },
    orderBy: { createdAt: 'asc' },
  });

  if (others.length > 0) {
    return others;
  }

  const seed = await resolveSeller(prisma);
  return [{ id: seed.id, username: seed.username }];
}

async function ensureSubcategory(
  prisma: PrismaClient,
  categoryId: string,
  slug: string,
  name: { en: string; ru: string },
): Promise<Subcategory> {
  const existing = await prisma.subcategory.findUnique({
    where: { categoryId_slug: { categoryId, slug } },
  });

  if (existing) {
    return prisma.subcategory.update({
      where: { id: existing.id },
      data: { name },
    });
  }

  return prisma.subcategory.create({
    data: { categoryId, slug, name },
  });
}

async function ensureAttribute(
  prisma: PrismaClient,
  data: {
    categoryId: string;
    subcategoryId: string | null;
    isGlobal: boolean;
    key: string;
    label: string;
    type: AttributeDefinition['type'];
    required: boolean;
    options?: string[];
    sortOrder: number;
  },
): Promise<AttributeDefinition> {
  const existing = await prisma.attributeDefinition.findFirst({
    where: {
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      key: data.key,
      isGlobal: data.isGlobal,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.attributeDefinition.create({
    data: {
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      isGlobal: data.isGlobal,
      key: data.key,
      label: data.label,
      type: data.type,
      required: data.required,
      options: data.options ?? undefined,
      sortOrder: data.sortOrder,
    },
  });
}

async function ensurePubgMock(prisma: PrismaClient) {
  const sellers = await resolveLotSellers(prisma);
  console.log(`Lot sellers: ${sellers.map((s) => s.username).join(', ')}`);

  let category: Category | null = await prisma.category.findUnique({
    where: { slug: 'pubg' },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'PUBG',
        slug: 'pubg',
        iconUrl: PUBG_ICON_URL,
        previewUrl: PUBG_PREVIEW_URL,
      },
    });
    console.log('Created category PUBG');
  } else {
    category = await prisma.category.update({
      where: { id: category.id },
      data: {
        iconUrl: PUBG_ICON_URL,
        previewUrl: PUBG_PREVIEW_URL,
      },
    });
    console.log('Updated PUBG icon/preview');
  }

  const accounts = await ensureSubcategory(prisma, category.id, 'accounts', {
    en: 'Accounts',
    ru: 'Аккаунты',
  });
  const uc = await ensureSubcategory(prisma, category.id, 'uc', {
    en: 'UC',
    ru: 'UC',
  });
  const items = await ensureSubcategory(prisma, category.id, 'items', {
    en: 'Items',
    ru: 'Предметы',
  });

  const platformAttr = await ensureAttribute(prisma, {
    categoryId: category.id,
    subcategoryId: null,
    isGlobal: true,
    key: 'platform',
    label: 'Platform',
    type: 'SELECT',
    required: true,
    options: ['Steam', 'Kakao', 'Console'],
    sortOrder: 0,
  });

  const rankAttr = await ensureAttribute(prisma, {
    categoryId: category.id,
    subcategoryId: accounts.id,
    isGlobal: false,
    key: 'rank',
    label: 'Rank',
    type: 'SELECT',
    required: false,
    options: [
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Diamond',
      'Master',
      'Predator',
    ],
    sortOrder: 1,
  });

  const levelAttr = await ensureAttribute(prisma, {
    categoryId: category.id,
    subcategoryId: accounts.id,
    isGlobal: false,
    key: 'level',
    label: 'Level',
    type: 'NUMBER',
    required: false,
    sortOrder: 2,
  });

  const amountAttr = await ensureAttribute(prisma, {
    categoryId: category.id,
    subcategoryId: uc.id,
    isGlobal: false,
    key: 'amount',
    label: 'UC amount',
    type: 'NUMBER',
    required: true,
    sortOrder: 1,
  });

  for (const subcategoryId of [accounts.id, uc.id, items.id]) {
    await prisma.subcategoryGlobalAttribute.upsert({
      where: {
        subcategoryId_attributeDefinitionId: {
          subcategoryId,
          attributeDefinitionId: platformAttr.id,
        },
      },
      create: {
        subcategoryId,
        attributeDefinitionId: platformAttr.id,
      },
      update: {},
    });
  }

  const existingLots = await prisma.lot.count({
    where: { categoryId: category.id },
  });

  await prisma.lot.updateMany({
    where: { categoryId: category.id, previewUrl: null },
    data: { previewUrl: category.previewUrl },
  });

  if (existingLots > 0) {
    console.log(
      `PUBG already has ${existingLots} lot(s) — backfilled previewUrl, skipping lot insert.`,
    );
    return;
  }

  const lotPhotos = Array.from({ length: 5 }, (_, sortOrder) => ({
    url: LOT_PHOTO_URL,
    sortOrder,
  }));

  const lots = [
    {
      title: 'Steam Survivor account — Ace Domination',
      description:
        'Well-maintained Steam PUBG account with Ace Domination rank, 40+ legendary outfits, and full season pass rewards. Instant delivery after payment.',
      price: 89.99,
      stock: 1,
      subcategoryId: accounts.id,
      attributes: [
        { attributeId: platformAttr.id, value: 'Steam' },
        { attributeId: rankAttr.id, value: 'Master' },
        { attributeId: levelAttr.id, value: '62' },
      ],
    },
    {
      title: 'Kakao Conqueror account with skins',
      description:
        'Rare Kakao region account pushed to Conqueror last season. Includes Mythic sets, gliders, and clean ban history. Email change supported.',
      price: 149.5,
      stock: 1,
      subcategoryId: accounts.id,
      attributes: [
        { attributeId: platformAttr.id, value: 'Kakao' },
        { attributeId: rankAttr.id, value: 'Predator' },
        { attributeId: levelAttr.id, value: '78' },
      ],
    },
    {
      title: 'Fresh Steam starter — level 25',
      description:
        'Budget-friendly Steam starter account. Level 25, unlocked progressive pass, a few crates opened. Perfect if you want to climb yourself.',
      price: 24.0,
      stock: 3,
      subcategoryId: accounts.id,
      attributes: [
        { attributeId: platformAttr.id, value: 'Steam' },
        { attributeId: rankAttr.id, value: 'Gold' },
        { attributeId: levelAttr.id, value: '25' },
      ],
    },
    {
      title: '8100 UC top-up (Steam)',
      description:
        'Fast UC top-up for Steam PUBG. 8100 UC credited to your account within minutes. Provide nickname after checkout.',
      price: 79.99,
      stock: 10,
      subcategoryId: uc.id,
      attributes: [
        { attributeId: platformAttr.id, value: 'Steam' },
        { attributeId: amountAttr.id, value: '8100' },
      ],
    },
    {
      title: 'Premium crate bundle + outfit pack',
      description:
        'Digital item pack: premium crate keys and a random legendary outfit code. Redeemable on Steam. Screenshots included in gallery.',
      price: 34.99,
      stock: 5,
      subcategoryId: items.id,
      attributes: [{ attributeId: platformAttr.id, value: 'Steam' }],
    },
  ];

  for (let i = 0; i < lots.length; i++) {
    const lot = lots[i];
    const seller = sellers[i % sellers.length];
    await prisma.lot.create({
      data: {
        title: lot.title,
        description: lot.description,
        previewUrl: category.previewUrl,
        price: lot.price,
        stock: lot.stock,
        status: 'OPEN',
        sellerId: seller.id,
        categoryId: category.id,
        subcategoryId: lot.subcategoryId,
        attributes: { create: lot.attributes },
        images: { create: lotPhotos },
      },
    });
  }

  console.log(
    `Seeded ${lots.length} PUBG lots (5 photos each) across accounts / uc / items.`,
  );
}

async function main() {
  assertDevOnly('prisma/seed');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await ensurePubgMock(prisma);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
