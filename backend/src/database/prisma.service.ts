import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool, type PoolConfig } from 'pg';

/**
 * Prisma 7 uses node-pg via adapter. Managed Postgres (Railway, Neon, etc.)
 * often needs TLS with a non-public CA; `sslmode=require` in the URL alone is
 * not enough — node rejects the cert unless rejectUnauthorized is false.
 */
function buildPoolConfig(connectionString: string | undefined): PoolConfig {
  if (!connectionString) {
    return { connectionString };
  }

  let hostname = '';
  let sslMode: string | null = null;

  try {
    const url = new URL(connectionString.replace(/^postgresql:/i, 'postgres:'));
    hostname = url.hostname;
    sslMode = url.searchParams.get('sslmode');
  } catch {
    return { connectionString };
  }

  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocal || sslMode === 'disable') {
    return { connectionString };
  }

  return {
    connectionString,
    ssl: { rejectUnauthorized: false },
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const pool = new Pool(
      buildPoolConfig(configService.get<string>('database.url')),
    );
    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
