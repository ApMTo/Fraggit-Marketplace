import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client!: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RedisService.name);
  }

  onModuleInit(): void {
    const password =
      this.configService.get<string>('redis.password') || undefined;
    const username =
      this.configService.get<string>('redis.username') || undefined;
    const useTls = this.configService.get<boolean>('redis.tls') === true;

    this.client = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password,
      username,
      ...(useTls ? { tls: {} } : {}),
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    this.client.on('connect', () => {
      this.logger.info('Redis connected');
    });

    this.client.on('error', (error: Error) => {
      this.logger.warn(`Redis connection error: ${error.message}`);
    });

    void this.client.connect().catch((error: Error) => {
      this.logger.warn(`Redis unavailable: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.status !== 'end') {
      await this.client.quit();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!key) return null;
    try {
      return await this.client.get(key);
    } catch (err) {
      this.logger.error(`Failed to GET key "${key}"`, err);
      return null;
    }
  }

  /** Atomic GET + DEL (one-time tokens). Falls back to GET/DEL if GETDEL unavailable. */
  async getdel(key: string): Promise<string | null> {
    if (!key) return null;
    try {
      return await this.client.getdel(key);
    } catch (err) {
      this.logger.error(`Failed to GETDEL key "${key}"`, err);
      try {
        const value = await this.client.get(key);
        if (value !== null) {
          await this.client.del(key);
        }
        return value;
      } catch (fallbackErr) {
        this.logger.error(`Failed GET/DEL fallback for "${key}"`, fallbackErr);
        return null;
      }
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK' | null> {
    if (!key || value === undefined) {
      this.logger.warn(`Invalid Redis set call: key="${key}"`);
      return null;
    }

    try {
      if (ttl && typeof ttl === 'number') {
        return await this.client.set(key, value, 'EX', ttl);
      }
      return await this.client.set(key, value);
    } catch (err) {
      this.logger.error(`Failed to SET key "${key}"`, err);
      return null;
    }
  }
  async setIfNotExists(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<boolean | null> {
    if (!key || value === undefined) {
      this.logger.warn(`Invalid Redis setIfNotExists call: key="${key}"`);
      return null;
    }

    try {
      const result =
        ttlSeconds && typeof ttlSeconds === 'number'
          ? await this.client.set(key, value, 'EX', ttlSeconds, 'NX')
          : await this.client.set(key, value, 'NX');
      return result === 'OK';
    } catch (err) {
      this.logger.error(`Failed to SET NX key "${key}"`, err);
      return null;
    }
  }

  async del(key: string): Promise<number | null> {
    if (!key) return null;
    try {
      return await this.client.del(key);
    } catch (err) {
      this.logger.error(`Failed to DEL key "${key}"`, err);
      return null;
    }
  }

  async delByPattern(pattern: string): Promise<number> {
    if (!pattern) return 0;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.client.del(...keys);
    } catch (err) {
      this.logger.error(`Failed to DEL keys by pattern "${pattern}"`, err);
      return 0;
    }
  }
}
