import { RedisService } from '../../../database/redis.service';
import {
  CHAT_ONLINE_KEY_PREFIX,
  CHAT_ONLINE_TTL_SECONDS,
} from '../constants/chat.constants';
import { ChatPresenceService } from './chat-presence.service';

describe('ChatPresenceService', () => {
  let service: ChatPresenceService;
  let redis: {
    set: jest.Mock;
    del: jest.Mock;
    get: jest.Mock;
  };

  beforeEach(() => {
    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      get: jest.fn(),
    };

    service = new ChatPresenceService(redis as unknown as RedisService);
  });

  it('marks user online with TTL', async () => {
    await service.setOnline('user-1');

    expect(redis.set).toHaveBeenCalledWith(
      `${CHAT_ONLINE_KEY_PREFIX}user-1`,
      '1',
      CHAT_ONLINE_TTL_SECONDS,
    );
  });

  it('refreshOnline reuses setOnline', async () => {
    await service.refreshOnline('user-1');

    expect(redis.set).toHaveBeenCalledWith(
      `${CHAT_ONLINE_KEY_PREFIX}user-1`,
      '1',
      CHAT_ONLINE_TTL_SECONDS,
    );
  });

  it('marks user offline by deleting key', async () => {
    await service.setOffline('user-1');

    expect(redis.del).toHaveBeenCalledWith(`${CHAT_ONLINE_KEY_PREFIX}user-1`);
  });

  it('returns true when online key is present', async () => {
    redis.get.mockResolvedValue('1');

    await expect(service.isOnline('user-1')).resolves.toBe(true);
  });

  it('returns false when online key is missing', async () => {
    redis.get.mockResolvedValue(null);

    await expect(service.isOnline('user-1')).resolves.toBe(false);
  });
});
