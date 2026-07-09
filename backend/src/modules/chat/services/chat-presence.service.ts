import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../database/redis.service';
import {
  CHAT_ONLINE_KEY_PREFIX,
  CHAT_ONLINE_TTL_SECONDS,
} from '../constants/chat.constants';

@Injectable()
export class ChatPresenceService {
  constructor(private readonly redis: RedisService) {}

  private buildKey(userId: string): string {
    return `${CHAT_ONLINE_KEY_PREFIX}${userId}`;
  }

  async setOnline(userId: string): Promise<void> {
    await this.redis.set(this.buildKey(userId), '1', CHAT_ONLINE_TTL_SECONDS);
  }

  async refreshOnline(userId: string): Promise<void> {
    await this.setOnline(userId);
  }

  async setOffline(userId: string): Promise<void> {
    await this.redis.del(this.buildKey(userId));
  }

  async isOnline(userId: string): Promise<boolean> {
    const value = await this.redis.get(this.buildKey(userId));
    return value === '1';
  }
}
