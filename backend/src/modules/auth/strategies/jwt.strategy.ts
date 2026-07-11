import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { UserRole, ROLE_VALUES } from '../enums/roles.enum';
import { UserAuthCacheService } from '../user-auth-cache.service';

function parseRole(value: unknown): UserRole {
  if (typeof value !== 'string' || !ROLE_VALUES.has(value)) {
    throw new UnauthorizedException({ code: 'errors.invalid_token' });
  }
  return value as UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userAuthCache: UserAuthCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.access_token as string | undefined,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: {
    userId?: string;
    email?: string;
    role?: unknown;
    username?: string;
    displayName?: string;
  }) {
    if (!payload.userId || !payload.email) {
      throw new UnauthorizedException({ code: 'errors.invalid_token' });
    }

    const entry = await this.userAuthCache.getActiveUser(payload.userId);

    if (entry.status === 'missing') {
      throw new UnauthorizedException({ code: 'errors.invalid_token' });
    }

    if (entry.status === 'deactivated') {
      throw new UnauthorizedException({ code: 'errors.account_deactivated' });
    }

    if (entry.status === 'blocked') {
      throw new UnauthorizedException({ code: 'errors.account_blocked' });
    }

    const { user } = entry;

    if (user.email !== payload.email) {
      await this.userAuthCache.invalidate(payload.userId);
      throw new UnauthorizedException({ code: 'errors.invalid_token' });
    }

    return {
      id: user.id,
      email: user.email,
      role: parseRole(user.role ?? payload.role),
      username: user.username,
      displayName: user.displayName,
    };
  }
}
