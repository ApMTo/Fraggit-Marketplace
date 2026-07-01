import { Injectable, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../../database/redis.service';
import { getSubnet } from '../auth/utils/get-subnet.util';

type SessionRecord = {
  userId: string;
  refreshTokenId: string;
  deviceId: string;
  subnet: string;
  userAgent: string;
  csrfToken: string;
};

@Injectable()
export class SessionsService {
  private readonly SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

  constructor(private readonly redisService: RedisService) {}

  private sessionKey(sessionId: string) {
    return `s:${sessionId}`;
  }

  private userSessionsKey(userId: string) {
    return `us:${userId}`;
  }

  private userDeviceKey(userId: string, deviceId: string) {
    return `ud:${userId}:${deviceId}`;
  }

  async saveSession(
    userId: string,
    refreshTokenId: string,
    deviceId: string,
    ip: string,
    userAgent: string,
    csrfToken: string,
    sessionId?: string,
  ): Promise<string> {
    const token = sessionId ?? uuidv4();
    const subnet = getSubnet(ip);
    const sessionKey = this.sessionKey(token);
    const userSessionsKey = this.userSessionsKey(userId);
    const userDeviceKey = this.userDeviceKey(userId, deviceId);

    await this.redisService.set(
      sessionKey,
      JSON.stringify({
        userId,
        refreshTokenId,
        deviceId,
        subnet,
        userAgent,
        csrfToken,
      }),
      this.SESSION_TTL_SECONDS,
    );

    await this.redisService.client
      .multi()
      .sadd(userSessionsKey, token)
      .expire(userSessionsKey, this.SESSION_TTL_SECONDS)
      .set(userDeviceKey, token, 'EX', this.SESSION_TTL_SECONDS)
      .exec();

    return token;
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    const raw = await this.redisService.get(this.sessionKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as SessionRecord;
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    deviceId?: string,
  ): Promise<void> {
    const existing = await this.getSession(sessionId);
    const resolvedDeviceId = deviceId ?? existing?.deviceId;

    await this.redisService.del(this.sessionKey(sessionId));
    await this.redisService.client.srem(
      this.userSessionsKey(userId),
      sessionId,
    );
    if (resolvedDeviceId) {
      await this.redisService.del(this.userDeviceKey(userId, resolvedDeviceId));
    }
  }

  async revokeAllSessions(userId: string): Promise<number> {
    const userSessionsKey = this.userSessionsKey(userId);
    const sessionIds = await this.redisService.client.smembers(userSessionsKey);
    if (sessionIds.length === 0) return 0;

    const pipeline = this.redisService.client.multi();
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      pipeline.del(this.sessionKey(sessionId));
      if (session?.deviceId) {
        pipeline.del(this.userDeviceKey(userId, session.deviceId));
      }
    }
    pipeline.del(userSessionsKey);
    await pipeline.exec();

    return sessionIds.length;
  }

  async validateSession(
    sessionId: string,
    deviceId: string,
    ip: string,
    userAgent: string,
    refreshTokenId?: string,
    csrfToken?: string,
  ) {
    const sessionRaw = await this.redisService.get(this.sessionKey(sessionId));
    if (!sessionRaw) {
      throw new UnauthorizedException({ code: 'errors.session_not_found' });
    }

    const session = JSON.parse(sessionRaw) as SessionRecord;

    if (session.deviceId !== deviceId) {
      throw new UnauthorizedException({ code: 'errors.invalid_device' });
    }

    const subnet = getSubnet(ip);
    if (session.subnet !== subnet) {
      throw new UnauthorizedException({ code: 'errors.ip_mismatch' });
    }

    if (session.userAgent !== userAgent) {
      throw new UnauthorizedException({ code: 'errors.ua_mismatch' });
    }

    if (refreshTokenId && session.refreshTokenId !== refreshTokenId) {
      throw new UnauthorizedException({ code: 'errors.invalid_refresh_token' });
    }

    if (csrfToken && session.csrfToken !== csrfToken) {
      throw new UnauthorizedException({ code: 'errors.invalid_csrf_token' });
    }

    await this.redisService.client.expire(
      this.sessionKey(sessionId),
      this.SESSION_TTL_SECONDS,
    );
    await this.redisService.client.expire(
      this.userSessionsKey(session.userId),
      this.SESSION_TTL_SECONDS,
    );
    await this.redisService.client.expire(
      this.userDeviceKey(session.userId, session.deviceId),
      this.SESSION_TTL_SECONDS,
    );

    return session.userId;
  }
}
