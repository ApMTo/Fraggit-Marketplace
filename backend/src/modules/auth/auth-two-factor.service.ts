import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';
import type { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { MailQueueService } from '../mail/mail-queue.service';
import { EmailTemplates } from '../mail/utils/email-templates';
import {
  TWO_FACTOR_CODE_TTL_SECONDS,
  TWO_FACTOR_MAX_ATTEMPTS,
  TWO_FACTOR_RESEND_COOLDOWN_SECONDS,
} from './constants/two-factor.constants';
import { AuthSessionService } from './auth-session.service';
import { throwIfAccountRestricted } from './utils/account-restriction.util';
import { ResendTwoFactorDto } from './dto/resend-two-factor.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';

type LoginChallenge = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  username: string;
  codeHash: string;
  attempts: number;
};

@Injectable()
export class AuthTwoFactorService {
  private readonly logger = new Logger(AuthTwoFactorService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mailQueue: MailQueueService,
    private readonly authSession: AuthSessionService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('frontendUrl') ?? 'http://localhost:3000';
  }

  async issueLoginChallenge(user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    username: string;
  }) {
    const existingChallengeId = await this.redis.get(this.userKey(user.id));
    if (existingChallengeId) {
      await this.clearChallenge(existingChallengeId, user.id);
    }

    const challengeId = uuidv4();
    const code = this.generateCode();
    const payload: LoginChallenge = {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      username: user.username,
      codeHash: this.hashCode(code),
      attempts: 0,
    };

    await Promise.all([
      this.redis.set(
        this.challengeKey(challengeId),
        JSON.stringify(payload),
        TWO_FACTOR_CODE_TTL_SECONDS,
      ),
      this.redis.set(
        this.userKey(user.id),
        challengeId,
        TWO_FACTOR_CODE_TTL_SECONDS,
      ),
      this.redis.set(
        this.resendKey(challengeId),
        '1',
        TWO_FACTOR_RESEND_COOLDOWN_SECONDS,
      ),
    ]);

    await this.sendCodeEmail(user.email, user.displayName, code, 'login');

    this.logger.log(`auth.two_factor_challenge_issued user=${user.id}`);

    return {
      requiresTwoFactor: true as const,
      challengeId,
      expiresInSeconds: TWO_FACTOR_CODE_TTL_SECONDS,
      resendAvailableInSeconds: TWO_FACTOR_RESEND_COOLDOWN_SECONDS,
      message: { code: 'messages.two_factor_code_sent' },
    };
  }

  async verifyLoginChallenge(dto: VerifyTwoFactorDto, req: Request) {
    const pending = await this.loadChallenge(dto.challengeId);
    if (!pending) {
      throw new BadRequestException({
        code: 'errors.invalid_or_expired_challenge',
      });
    }

    if (pending.attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
      await this.clearChallenge(dto.challengeId, pending.userId);
      throw new BadRequestException({
        code: 'errors.too_many_code_attempts',
      });
    }

    if (pending.codeHash !== this.hashCode(dto.code)) {
      pending.attempts += 1;
      if (pending.attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
        await this.clearChallenge(dto.challengeId, pending.userId);
        throw new BadRequestException({
          code: 'errors.too_many_code_attempts',
        });
      }

      await this.redis.set(
        this.challengeKey(dto.challengeId),
        JSON.stringify(pending),
        TWO_FACTOR_CODE_TTL_SECONDS,
      );
      throw new BadRequestException({
        code: 'errors.invalid_or_expired_code',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: pending.userId },
      select: {
        id: true,
        email: true,
        role: true,
        username: true,
        displayName: true,
        status: true,
        twoFactorEnabled: true,
        statusPublicMessage: true,
        statusCaseId: true,
        suspendedUntil: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      await this.clearChallenge(dto.challengeId, pending.userId);
      throw new UnauthorizedException({ code: 'invalid_credentials' });
    }

    try {
      throwIfAccountRestricted(user);
    } catch (error) {
      await this.clearChallenge(dto.challengeId, pending.userId);
      throw error;
    }

    await this.clearChallenge(dto.challengeId, pending.userId);
    this.logger.log(`auth.two_factor_verified user=${user.id}`);

    return this.authSession.createSession(user, req);
  }

  async resendLoginChallenge(dto: ResendTwoFactorDto) {
    const pending = await this.loadChallenge(dto.challengeId);
    if (!pending) {
      throw new BadRequestException({
        code: 'errors.invalid_or_expired_challenge',
      });
    }

    const cooldownTtl = await this.redis.client.ttl(
      this.resendKey(dto.challengeId),
    );
    if (cooldownTtl > 0) {
      throw new BadRequestException({
        code: 'errors.two_factor_resend_cooldown',
        resendAvailableInSeconds: cooldownTtl,
      });
    }

    const code = this.generateCode();
    pending.codeHash = this.hashCode(code);
    pending.attempts = 0;

    await Promise.all([
      this.redis.set(
        this.challengeKey(dto.challengeId),
        JSON.stringify(pending),
        TWO_FACTOR_CODE_TTL_SECONDS,
      ),
      this.redis.set(
        this.resendKey(dto.challengeId),
        '1',
        TWO_FACTOR_RESEND_COOLDOWN_SECONDS,
      ),
    ]);

    await this.sendCodeEmail(pending.email, pending.displayName, code, 'login');

    this.logger.log(`auth.two_factor_challenge_resent user=${pending.userId}`);

    return {
      message: { code: 'messages.two_factor_code_sent' },
      expiresInSeconds: TWO_FACTOR_CODE_TTL_SECONDS,
      resendAvailableInSeconds: TWO_FACTOR_RESEND_COOLDOWN_SECONDS,
    };
  }

  async sendCodeEmail(
    email: string,
    displayName: string,
    code: string,
    purpose: 'login' | 'enable',
  ) {
    const subject =
      purpose === 'login'
        ? 'Your Fraggit login code'
        : 'Enable two-factor authentication';

    await this.mailQueue.enqueue({
      to: email,
      subject,
      html: EmailTemplates.renderTwoFactorCodeEmail(
        displayName,
        code,
        this.frontendUrl,
        purpose,
      ),
      type: 'two_factor',
    });
  }

  generateCode(): string {
    return String(randomInt(100_000, 1_000_000));
  }

  hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private challengeKey(challengeId: string) {
    return `2fa:login:${challengeId}`;
  }

  private userKey(userId: string) {
    return `2fa:login:user:${userId}`;
  }

  private resendKey(challengeId: string) {
    return `2fa:login:resend:${challengeId}`;
  }

  private async loadChallenge(
    challengeId: string,
  ): Promise<LoginChallenge | null> {
    const raw = await this.redis.get(this.challengeKey(challengeId));
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as LoginChallenge;
    } catch {
      await this.redis.del(this.challengeKey(challengeId));
      return null;
    }
  }

  private async clearChallenge(challengeId: string, userId: string) {
    await Promise.all([
      this.redis.del(this.challengeKey(challengeId)),
      this.redis.del(this.userKey(userId)),
      this.redis.del(this.resendKey(challengeId)),
    ]);
  }
}
