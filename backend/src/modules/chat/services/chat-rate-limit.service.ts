import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from '../../../database/redis.service';
import {
  CHAT_RATE_LIMIT_KEY_PREFIX,
  CHAT_RATE_LIMIT_MAX_MESSAGES,
  CHAT_RATE_LIMIT_WINDOW_SECONDS,
} from '../constants/chat.constants';

@Injectable()
export class ChatRateLimitService {
  constructor(private readonly redis: RedisService) {}

  async assertCanSendMessage(userId: string): Promise<void> {
    const key = `${CHAT_RATE_LIMIT_KEY_PREFIX}${userId}`;
    const client = this.redis.getClient();

    const count = await client.incr(key);

    if (count === 1) {
      await client.expire(key, CHAT_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > CHAT_RATE_LIMIT_MAX_MESSAGES) {
      throw new HttpException(
        'chat_rate_limit_exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
