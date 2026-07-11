import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { UserStatus } from '@prisma/client';
import { AuthSessionService } from './auth-session.service';
import { LoginUserDto } from './dto/login-user.dto';
import {
  checkLoginBlocked,
  clearFailedLoginAttempts,
  registerFailedLoginAttempt,
} from './utils/login-attempts.util';
import { verifyPassword } from './utils/password-policy.util';

@Injectable()
export class AuthLoginService {
  private readonly logger = new Logger(AuthLoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly authSession: AuthSessionService,
  ) {}

  async login(dto: LoginUserDto, req: Request) {
    const email = dto.email.toLowerCase().trim();

    await checkLoginBlocked(this.redis, email);

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        username: true,
        displayName: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user) {
      await registerFailedLoginAttempt(this.redis, email);
      throw new UnauthorizedException({ code: 'invalid_credentials' });
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({ code: 'account_deactivated' });
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException({ code: 'account_blocked' });
    }

    if (
      !user.emailVerified ||
      user.status === UserStatus.PENDING_VERIFICATION
    ) {
      throw new UnauthorizedException({ code: 'email_not_verified' });
    }

    const isValid = await verifyPassword(user.passwordHash, dto.password);
    if (!isValid) {
      await registerFailedLoginAttempt(this.redis, email);
      throw new UnauthorizedException({ code: 'invalid_credentials' });
    }

    await clearFailedLoginAttempts(this.redis, email);
    this.logger.log(`auth.login_success user=${user.id}`);

    return this.authSession.createSession(user, req);
  }
}
