import { HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../../database/redis.service';
import {
  CHAT_RATE_LIMIT_KEY_PREFIX,
  CHAT_RATE_LIMIT_MAX_MESSAGES,
  CHAT_RATE_LIMIT_WINDOW_SECONDS,
} from '../constants/chat.constants';
import { ChatRateLimitService } from './chat-rate-limit.service';

describe('ChatRateLimitService', () => {
  let service: ChatRateLimitService;
  let client: {
    incr: jest.Mock;
    expire: jest.Mock;
  };

  beforeEach(() => {
    client = {
      incr: jest.fn(),
      expire: jest.fn().mockResolvedValue(1),
    };

    const redis = {
      getClient: () => client,
    };

    service = new ChatRateLimitService(redis as unknown as RedisService);
  });

  it('allows first message and sets expire window', async () => {
    client.incr.mockResolvedValue(1);

    await expect(
      service.assertCanSendMessage('user-1'),
    ).resolves.toBeUndefined();

    expect(client.incr).toHaveBeenCalledWith(
      `${CHAT_RATE_LIMIT_KEY_PREFIX}user-1`,
    );
    expect(client.expire).toHaveBeenCalledWith(
      `${CHAT_RATE_LIMIT_KEY_PREFIX}user-1`,
      CHAT_RATE_LIMIT_WINDOW_SECONDS,
    );
  });

  it('allows messages within the limit without resetting expire', async () => {
    client.incr.mockResolvedValue(CHAT_RATE_LIMIT_MAX_MESSAGES);

    await expect(
      service.assertCanSendMessage('user-1'),
    ).resolves.toBeUndefined();
    expect(client.expire).not.toHaveBeenCalled();
  });

  it('throws 429 when limit is exceeded', async () => {
    client.incr.mockResolvedValue(CHAT_RATE_LIMIT_MAX_MESSAGES + 1);

    await expect(service.assertCanSendMessage('user-1')).rejects.toMatchObject({
      response: 'chat_rate_limit_exceeded',
      status: HttpStatus.TOO_MANY_REQUESTS,
    } satisfies Partial<HttpException>);
  });
});
