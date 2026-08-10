import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { MailQueueService } from '../mail/mail-queue.service';
import { SessionsService } from '../sessions/sessions.service';
import { UserStatus } from '@prisma/client';
import { UserAuthCacheService } from './user-auth-cache.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  enforcePasswordPolicy,
  hashPassword,
} from './utils/password-policy.util';
import { clearFailedLoginAttempts } from './utils/login-attempts.util';
import { EmailRenderer } from './utils/email.renderer';

type PendingPasswordReset = {
  userId: string;
  email: string;
  displayName: string;
};

@Injectable()
export class AuthPasswordResetService {
  private readonly logger = new Logger(AuthPasswordResetService.name);
  private readonly RESET_TTL = 60 * 15;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mailQueue: MailQueueService,
    private readonly sessionsService: SessionsService,
    private readonly userAuthCache: UserAuthCacheService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('frontendUrl') ?? 'http://localhost:3000';
  }

  /**
   * Always returns the same success payload, whether or not an eligible
   * account exists — prevents email enumeration.
   */
  async requestReset(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          displayName: true,
          status: true,
          emailVerified: true,
          passwordHash: true,
        },
      });

      if (
        user &&
        user.passwordHash &&
        user.emailVerified &&
        user.status !== UserStatus.BANNED &&
        user.status !== UserStatus.SUSPENDED
      ) {
        await this.issueResetToken(user);
      }
    } catch (error) {
      this.logger.error(
        `auth.password_reset_request_failed email=${email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return { message: 'password_reset_email_sent' };
  }

  async validateResetToken(token: string) {
    const pending = await this.loadPending(token);
    if (!pending) {
      throw new BadRequestException('invalid_or_expired_token');
    }

    await this.refreshPendingTtl(token, pending.email);
    return { valid: true, expiresInSeconds: this.RESET_TTL };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({ code: 'validation.password_mismatch' });
    }

    const pending = await this.loadPending(dto.token);
    if (!pending) {
      throw new BadRequestException('invalid_or_expired_token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: pending.userId },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (
      !user ||
      user.status === UserStatus.BANNED ||
      user.status === UserStatus.SUSPENDED
    ) {
      await this.clearPending(dto.token, pending.email);
      throw new NotFoundException({ code: 'errors.user_not_found' });
    }

    enforcePasswordPolicy(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(dto.password) },
    });

    await Promise.all([
      this.clearPending(dto.token, pending.email),
      this.sessionsService.revokeAllSessions(user.id),
      clearFailedLoginAttempts(this.redis, user.email),
      this.userAuthCache.invalidate(user.id),
    ]);

    this.logger.log(`auth.password_reset_success user=${user.id}`);
    return { message: 'password_reset_success' };
  }

  private async issueResetToken(user: {
    id: string;
    email: string;
    displayName: string;
  }) {
    const existingToken = await this.redis.get(`pwd:email:${user.email}`);
    if (existingToken) {
      await this.redis.del(`pwd:${existingToken}`);
    }

    const token = uuidv4();
    const payload: PendingPasswordReset = {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
    };

    await Promise.all([
      this.redis.set(`pwd:${token}`, JSON.stringify(payload), this.RESET_TTL),
      this.redis.set(`pwd:email:${user.email}`, token, this.RESET_TTL),
    ]);

    await this.mailQueue.enqueue({
      to: user.email,
      subject: 'Reset your Fraggit password',
      html: EmailRenderer.renderPasswordResetEmail(
        user.displayName,
        token,
        this.frontendUrl,
      ),
      type: 'password_reset',
    });

    this.logger.log(`auth.password_reset_requested user=${user.id}`);
  }

  private async loadPending(
    token: string,
  ): Promise<PendingPasswordReset | null> {
    const raw = await this.redis.get(`pwd:${token}`);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as PendingPasswordReset;
    } catch {
      await this.redis.del(`pwd:${token}`);
      return null;
    }
  }

  private async refreshPendingTtl(token: string, email: string) {
    await this.redis.client
      .multi()
      .expire(`pwd:${token}`, this.RESET_TTL)
      .expire(`pwd:email:${email}`, this.RESET_TTL)
      .exec();
  }

  private async clearPending(token: string, email: string) {
    await Promise.all([
      this.redis.del(`pwd:${token}`),
      this.redis.del(`pwd:email:${email}`),
    ]);
  }
}
