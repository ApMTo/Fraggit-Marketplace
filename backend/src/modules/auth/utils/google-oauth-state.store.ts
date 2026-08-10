import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Request } from 'express';
import { RedisService } from '../../../database/redis.service';

type StoreCallback = (err: Error | null, state?: string) => void;
type VerifyCallback = (err: Error | null, ok?: boolean, state?: string) => void;

/**
 * Redis-backed OAuth state store for passport-google-oauth20.
 * Prevents CSRF login attacks without express-session.
 */
@Injectable()
export class GoogleOAuthStateStore {
  private readonly TTL_SECONDS = 600;
  private readonly PREFIX = 'oauth:google:state:';

  constructor(private readonly redis: RedisService) {}

  store(req: Request, callback: StoreCallback): void;
  store(req: Request, meta: unknown, callback: StoreCallback): void;
  store(
    _req: Request,
    metaOrCallback: unknown,
    maybeCallback?: StoreCallback,
  ): void {
    const callback = (
      typeof metaOrCallback === 'function' ? metaOrCallback : maybeCallback
    ) as StoreCallback;

    const state = randomBytes(24).toString('hex');
    void this.redis
      .set(`${this.PREFIX}${state}`, '1', this.TTL_SECONDS)
      .then((result) => {
        if (!result) {
          callback(new Error('failed_to_store_oauth_state'));
          return;
        }
        callback(null, state);
      })
      .catch((error: Error) => callback(error));
  }

  verify(req: Request, state: string, callback: VerifyCallback): void;
  verify(
    req: Request,
    state: string,
    meta: unknown,
    callback: VerifyCallback,
  ): void;
  verify(
    _req: Request,
    state: string,
    metaOrCallback: unknown,
    maybeCallback?: VerifyCallback,
  ): void {
    const callback = (
      typeof metaOrCallback === 'function' ? metaOrCallback : maybeCallback
    ) as VerifyCallback;

    if (!state || typeof state !== 'string') {
      callback(null, false);
      return;
    }

    void this.redis
      .getdel(`${this.PREFIX}${state}`)
      .then((value) => {
        callback(null, Boolean(value), state);
      })
      .catch((error: Error) => callback(error));
  }
}
