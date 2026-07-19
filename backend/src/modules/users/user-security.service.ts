import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { MailQueueService } from '../mail/mail-queue.service';
import { SessionsService } from '../sessions/sessions.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { UserAuthCacheService } from '../auth/user-auth-cache.service';
import { EmailRenderer } from '../auth/utils/email.renderer';
import {
  enforcePasswordPolicy,
  hashPassword,
  verifyPassword,
} from '../auth/utils/password-policy.util';
import { clearFailedLoginAttempts } from '../auth/utils/login-attempts.util';
import {
  EMAIL_CHANGE_CODE_TTL_SECONDS,
  EMAIL_CHANGE_MAX_ATTEMPTS,
  IDENTITY_CHANGE_COOLDOWN_MS,
} from './constants/identity-change.constants';
import {
  USER_PROFILE_SELECT,
  UserProfile,
} from './constants/user-profile.select';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';

type PendingEmailChange = {
  newEmail: string;
  codeHash: string;
  attempts: number;
};

@Injectable()
export class UserSecurityService {
  private readonly logger = new Logger(UserSecurityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mailQueue: MailQueueService,
    private readonly sessionsService: SessionsService,
    private readonly authSession: AuthSessionService,
    private readonly userAuthCache: UserAuthCacheService,
  ) {}

  async requestEmailChange(userId: string, dto: RequestEmailChangeDto) {
    const newEmail = dto.newEmail;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        emailChangedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ code: 'errors.user_not_found' });
    }

    this.assertCooldownPassed(user.emailChangedAt, 'email_change_cooldown');

    if (newEmail === user.email) {
      throw new BadRequestException({ code: 'errors.email_unchanged' });
    }

    await this.assertEmailAvailable(newEmail, userId);

    const existing = await this.loadPendingEmailChange(userId);
    if (existing) {
      await this.clearPendingEmailChange(userId, existing.newEmail);
    }

    const code = String(randomInt(100_000, 1_000_000));
    const payload: PendingEmailChange = {
      newEmail,
      codeHash: this.hashCode(code),
      attempts: 0,
    };

    await Promise.all([
      this.redis.set(
        this.pendingKey(userId),
        JSON.stringify(payload),
        EMAIL_CHANGE_CODE_TTL_SECONDS,
      ),
      this.redis.set(
        this.pendingEmailKey(newEmail),
        userId,
        EMAIL_CHANGE_CODE_TTL_SECONDS,
      ),
    ]);

    await this.mailQueue.enqueue({
      to: user.email,
      subject: 'Confirm your Fraggit email change',
      html: EmailRenderer.renderEmailChangeCodeEmail(
        user.displayName,
        code,
        newEmail,
      ),
      type: 'email_change',
    });

    this.logger.log(`user.email_change_requested user=${userId}`);

    return {
      message: { code: 'messages.email_change_code_sent' },
      expiresInSeconds: EMAIL_CHANGE_CODE_TTL_SECONDS,
    };
  }

  async confirmEmailChange(
    userId: string,
    dto: ConfirmEmailChangeDto,
    req: Request,
  ) {
    const pending = await this.loadPendingEmailChange(userId);
    if (!pending) {
      throw new BadRequestException({ code: 'errors.invalid_or_expired_code' });
    }

    if (pending.attempts >= EMAIL_CHANGE_MAX_ATTEMPTS) {
      await this.clearPendingEmailChange(userId, pending.newEmail);
      throw new BadRequestException({ code: 'errors.too_many_code_attempts' });
    }

    if (pending.codeHash !== this.hashCode(dto.code)) {
      pending.attempts += 1;
      if (pending.attempts >= EMAIL_CHANGE_MAX_ATTEMPTS) {
        await this.clearPendingEmailChange(userId, pending.newEmail);
        throw new BadRequestException({
          code: 'errors.too_many_code_attempts',
        });
      }

      await this.redis.set(
        this.pendingKey(userId),
        JSON.stringify(pending),
        EMAIL_CHANGE_CODE_TTL_SECONDS,
      );
      throw new BadRequestException({ code: 'errors.invalid_or_expired_code' });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailChangedAt: true,
        role: true,
        username: true,
        displayName: true,
      },
    });

    if (!user) {
      await this.clearPendingEmailChange(userId, pending.newEmail);
      throw new NotFoundException({ code: 'errors.user_not_found' });
    }

    this.assertCooldownPassed(user.emailChangedAt, 'email_change_cooldown');
    await this.assertEmailAvailable(pending.newEmail, userId);

    const oldEmail = user.email;
    const now = new Date();

    const profile = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: pending.newEmail,
        emailChangedAt: now,
        emailVerified: true,
      },
      select: USER_PROFILE_SELECT,
    });

    await Promise.all([
      this.clearPendingEmailChange(userId, pending.newEmail),
      this.sessionsService.revokeAllSessions(userId),
      clearFailedLoginAttempts(this.redis, oldEmail),
      this.userAuthCache.invalidate(userId),
    ]);

    await this.authSession.createSession(
      {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        username: profile.username,
        displayName: profile.displayName,
      },
      req,
    );

    this.logger.log(`user.email_changed user=${userId}`);

    return {
      message: { code: 'messages.email_changed' },
      user: profile,
    };
  }

  async changeUsername(
    userId: string,
    dto: ChangeUsernameDto,
  ): Promise<{ message: { code: string }; user: UserProfile }> {
    const username = dto.username;

    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, usernameChangedAt: true },
    });

    if (!current) {
      throw new NotFoundException({ code: 'errors.user_not_found' });
    }

    if (username === current.username) {
      throw new BadRequestException({ code: 'errors.username_unchanged' });
    }

    this.assertCooldownPassed(
      current.usernameChangedAt,
      'username_change_cooldown',
    );
    await this.assertUsernameAvailable(username, userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username,
        usernameChangedAt: new Date(),
      },
      select: USER_PROFILE_SELECT,
    });

    await this.userAuthCache.invalidate(userId);

    this.logger.log(`user.username_changed user=${userId}`);

    return {
      message: { code: 'messages.username_changed' },
      user,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto, req: Request) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException({ code: 'validation.password_mismatch' });
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException({ code: 'errors.password_unchanged' });
    }

    enforcePasswordPolicy(dto.newPassword);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        username: true,
        displayName: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ code: 'errors.user_not_found' });
    }

    const currentOk = await verifyPassword(
      user.passwordHash,
      dto.currentPassword,
    );
    if (!currentOk) {
      throw new BadRequestException({
        code: 'errors.invalid_current_password',
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(dto.newPassword) },
    });

    await Promise.all([
      this.sessionsService.revokeAllSessions(userId),
      clearFailedLoginAttempts(this.redis, user.email),
      this.userAuthCache.invalidate(userId),
    ]);

    await this.authSession.createSession(user, req);

    this.logger.log(`user.password_changed user=${userId}`);

    return { message: { code: 'messages.password_changed' } };
  }

  private assertCooldownPassed(
    changedAt: Date | null | undefined,
    errorCode: string,
  ): void {
    if (!changedAt) {
      return;
    }

    const endsAt = changedAt.getTime() + IDENTITY_CHANGE_COOLDOWN_MS;
    if (Date.now() < endsAt) {
      throw new ConflictException({ code: `errors.${errorCode}` });
    }
  }

  private async assertEmailAvailable(
    email: string,
    excludeUserId: string,
  ): Promise<void> {
    const taken = await this.prisma.user.findFirst({
      where: { email, NOT: { id: excludeUserId } },
      select: { id: true },
    });

    if (taken) {
      throw new ConflictException({ code: 'errors.email_already_exists' });
    }

    if (await this.redis.get(`reg:email:${email}`)) {
      throw new ConflictException({ code: 'errors.email_already_exists' });
    }

    const pendingOwner = await this.redis.get(this.pendingEmailKey(email));
    if (pendingOwner && pendingOwner !== excludeUserId) {
      throw new ConflictException({ code: 'errors.email_already_exists' });
    }
  }

  private async assertUsernameAvailable(
    username: string,
    excludeUserId: string,
  ): Promise<void> {
    const taken = await this.prisma.user.findFirst({
      where: { username, NOT: { id: excludeUserId } },
      select: { id: true },
    });

    if (taken) {
      throw new ConflictException({ code: 'errors.username_already_exists' });
    }

    if (await this.redis.get(`reg:username:${username}`)) {
      throw new ConflictException({ code: 'errors.username_already_exists' });
    }
  }

  private pendingKey(userId: string) {
    return `email-change:${userId}`;
  }

  private pendingEmailKey(email: string) {
    return `email-change:email:${email}`;
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private async loadPendingEmailChange(
    userId: string,
  ): Promise<PendingEmailChange | null> {
    const raw = await this.redis.get(this.pendingKey(userId));
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as PendingEmailChange;
    } catch {
      await this.redis.del(this.pendingKey(userId));
      return null;
    }
  }

  private async clearPendingEmailChange(userId: string, newEmail: string) {
    await Promise.all([
      this.redis.del(this.pendingKey(userId)),
      this.redis.del(this.pendingEmailKey(newEmail)),
    ]);
  }
}
