import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { UserRole } from './enums/roles.enum';
import { UserStatus } from '@prisma/client';

export interface ActiveAuthUser {
  id: string;
  email: string;
  role: UserRole;
  username: string;
  displayName: string;
}

type UserAuthCacheEntry =
  | { status: 'active'; user: ActiveAuthUser }
  | { status: 'blocked' }
  | { status: 'deactivated' }
  | { status: 'missing' };

const CACHE_PREFIX = 'auth:user:';
const CACHE_TTL_SECONDS = 60;

@Injectable()
export class UserAuthCacheService {
  private readonly logger = new Logger(UserAuthCacheService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getActiveUser(userId: string): Promise<UserAuthCacheEntry> {
    const cacheKey = `${CACHE_PREFIX}${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      try {
        return JSON.parse(cached) as UserAuthCacheEntry;
      } catch {
        await this.redis.del(cacheKey);
      }
    }

    const entry = await this.loadFromDb(userId);
    await this.redis.set(cacheKey, JSON.stringify(entry), CACHE_TTL_SECONDS);
    return entry;
  }

  async invalidate(userId: string): Promise<void> {
    await this.redis.del(`${CACHE_PREFIX}${userId}`);
  }

  private async loadFromDb(userId: string): Promise<UserAuthCacheEntry> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        username: true,
        displayName: true,
        status: true,
      },
    });

    if (!user) {
      return { status: 'missing' };
    }

    if (user.status === UserStatus.SUSPENDED) {
      return { status: 'deactivated' };
    }

    if (user.status === UserStatus.BANNED) {
      return { status: 'blocked' };
    }

    return {
      status: 'active',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        displayName: user.displayName,
      },
    };
  }
}
