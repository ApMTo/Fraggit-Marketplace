import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { UserStatus } from '@prisma/client';
import { AuthSessionService } from './auth-session.service';
import { AuthTwoFactorService } from './auth-two-factor.service';
import { LoginUserDto } from './dto/login-user.dto';
import {
  checkLoginBlocked,
  clearFailedLoginAttempts,
  registerFailedLoginAttempt,
} from './utils/login-attempts.util';
import { verifyPassword } from './utils/password-policy.util';
import { throwIfAccountRestricted } from './utils/account-restriction.util';

@Injectable()
export class AuthLoginService {
  private readonly logger = new Logger(AuthLoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly authSession: AuthSessionService,
    private readonly authTwoFactor: AuthTwoFactorService,
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
        twoFactorEnabled: true,
        statusPublicMessage: true,
        statusCaseId: true,
        suspendedUntil: true,
      },
    });

    if (!user || !user.passwordHash) {
      await registerFailedLoginAttempt(this.redis, email);
      throw new UnauthorizedException({ code: 'invalid_credentials' });
    }

    const isValid = await verifyPassword(user.passwordHash, dto.password);
    if (!isValid) {
      await registerFailedLoginAttempt(this.redis, email);
      throw new UnauthorizedException({ code: 'invalid_credentials' });
    }

    throwIfAccountRestricted(user);

    if (
      !user.emailVerified ||
      user.status === UserStatus.PENDING_VERIFICATION
    ) {
      throw new UnauthorizedException({ code: 'email_not_verified' });
    }

    await clearFailedLoginAttempts(this.redis, email);
    this.logger.log(`auth.login_success user=${user.id}`);

    if (user.twoFactorEnabled) {
      return this.authTwoFactor.issueLoginChallenge(user);
    }

    return this.authSession.createSession(user, req);
  }
}
