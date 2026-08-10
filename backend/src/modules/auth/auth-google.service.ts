import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider, UserRole, UserStatus } from '@prisma/client';
import type { Request } from 'express';
import { randomBytes } from 'crypto';
import { LEGAL_VERSION } from '../../common/constants/legal.constants';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { AuthSessionService } from './auth-session.service';
import { AuthTwoFactorService } from './auth-two-factor.service';
import { CompleteGoogleDto } from './dto/complete-google.dto';
import type { GoogleAuthProfile } from './strategies/google.strategy';
import { throwIfAccountRestricted } from './utils/account-restriction.util';

type PendingGoogleRegistration = {
  providerId: string;
  email: string;
  suggestedDisplayName: string;
  avatarUrl: string | null;
};

const GOOGLE_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  username: true,
  displayName: true,
  status: true,
  emailVerified: true,
  twoFactorEnabled: true,
  statusPublicMessage: true,
  statusCaseId: true,
  suspendedUntil: true,
  avatarUrl: true,
} as const;

export type GoogleCallbackOutcome =
  | { kind: 'session' }
  | { kind: 'complete'; token: string }
  | {
      kind: 'two_factor';
      challengeId: string;
      resendAvailableInSeconds: number;
    }
  | { kind: 'error'; code: string };

@Injectable()
export class AuthGoogleService {
  private readonly logger = new Logger(AuthGoogleService.name);
  private readonly PENDING_TTL = 60 * 15;
  private readonly PENDING_PREFIX = 'oauth:google:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly authSession: AuthSessionService,
    private readonly authTwoFactor: AuthTwoFactorService,
    private readonly configService: ConfigService,
  ) {}

  assertConfigured() {
    const clientId = this.configService.get<string>('google.clientId');
    if (!clientId) {
      throw new UnauthorizedException({
        code: 'errors.google_oauth_not_configured',
      });
    }
  }

  async handleCallback(
    profile: GoogleAuthProfile,
    req: Request,
  ): Promise<GoogleCallbackOutcome> {
    this.assertConfigured();

    const existingByProvider = await this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider: AuthProvider.GOOGLE,
          providerId: profile.providerId,
        },
      },
      select: GOOGLE_USER_SELECT,
    });

    if (existingByProvider) {
      return this.signInExisting(existingByProvider, req, profile);
    }

    const emailOwner = await this.prisma.user.findUnique({
      where: { email: profile.email },
      select: { id: true },
    });

    if (emailOwner) {
      return { kind: 'error', code: 'email_already_exists' };
    }

    const token = randomBytes(32).toString('hex');
    const pending: PendingGoogleRegistration = {
      providerId: profile.providerId,
      email: profile.email,
      suggestedDisplayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    };

    const stored = await this.redis.set(
      this.pendingKey(token),
      JSON.stringify(pending),
      this.PENDING_TTL,
    );
    if (!stored) {
      throw new InternalServerErrorException('invalid_registration_payload');
    }

    this.logger.log('auth.google_pending');
    return { kind: 'complete', token };
  }

  async getPending(token: string) {
    const pending = await this.peekPending(token);
    return {
      email: pending.email,
      suggestedDisplayName: pending.suggestedDisplayName,
      expiresInSeconds: this.PENDING_TTL,
    };
  }

  async completeRegistration(dto: CompleteGoogleDto, req: Request) {
    const pending = await this.consumePending(dto.token);
    const username = dto.username.toLowerCase().trim();
    const displayName = dto.displayName.trim();

    let user: {
      id: string;
      username: string;
      displayName: string;
      email: string;
      role: string;
    };

    try {
      const [usernameOwner, pendingRegUsername, emailTaken, providerTaken] =
        await Promise.all([
          this.prisma.user.findUnique({
            where: { username },
            select: { id: true },
          }),
          this.redis.get(`reg:username:${username}`),
          this.prisma.user.findUnique({
            where: { email: pending.email },
            select: { id: true },
          }),
          this.prisma.user.findUnique({
            where: {
              provider_providerId: {
                provider: AuthProvider.GOOGLE,
                providerId: pending.providerId,
              },
            },
            select: { id: true },
          }),
        ]);

      if (usernameOwner) {
        throw new ConflictException({ code: 'username_already_exists' });
      }
      if (pendingRegUsername) {
        throw new ConflictException({ code: 'verification_already_sent' });
      }
      if (emailTaken) {
        throw new ConflictException({ code: 'email_already_exists' });
      }
      if (providerTaken) {
        throw new ConflictException({ code: 'user_already_exists' });
      }

      const now = new Date();
      user = await this.prisma.user.create({
        data: {
          email: pending.email,
          username,
          displayName,
          passwordHash: null,
          provider: AuthProvider.GOOGLE,
          providerId: pending.providerId,
          avatarUrl: pending.avatarUrl,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          acceptedTermsVersion: LEGAL_VERSION,
          acceptedTermsAt: now,
          acceptedPrivacyVersion: LEGAL_VERSION,
          acceptedPrivacyAt: now,
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          role: true,
        },
      });
    } catch (error) {
      // Only restore when account was not created (validation / unique races).
      await this.redis.set(
        this.pendingKey(dto.token),
        JSON.stringify(pending),
        this.PENDING_TTL,
      );
      throw error;
    }

    await this.authSession.createSession(user, req);
    this.logger.log(`auth.google_registered user=${user.id}`);

    return {
      message: 'user_verified',
      user,
    };
  }

  private async signInExisting(
    user: {
      id: string;
      email: string;
      role: string;
      username: string;
      displayName: string;
      status: UserStatus;
      emailVerified: boolean;
      twoFactorEnabled: boolean;
      statusPublicMessage: string | null;
      statusCaseId: string | null;
      suspendedUntil: Date | null;
      avatarUrl: string | null;
    },
    req: Request,
    profile: GoogleAuthProfile,
  ): Promise<GoogleCallbackOutcome> {
    try {
      throwIfAccountRestricted(user);
    } catch {
      if (user.status === UserStatus.BANNED) {
        return { kind: 'error', code: 'account_blocked' };
      }
      if (user.status === UserStatus.SUSPENDED) {
        return { kind: 'error', code: 'account_deactivated' };
      }
      return { kind: 'error', code: 'google_auth_failed' };
    }

    if (
      !user.emailVerified ||
      user.status === UserStatus.PENDING_VERIFICATION
    ) {
      return { kind: 'error', code: 'email_not_verified' };
    }

    // Fire avatar backfill without blocking login latency.
    if (!user.avatarUrl && profile.avatarUrl) {
      void this.prisma.user
        .update({
          where: { id: user.id },
          data: { avatarUrl: profile.avatarUrl },
        })
        .catch((error: Error) => {
          this.logger.warn(
            `auth.google_avatar_update_failed user=${user.id}: ${error.message}`,
          );
        });
    }

    if (user.twoFactorEnabled) {
      const challenge = await this.authTwoFactor.issueLoginChallenge(user);
      return {
        kind: 'two_factor',
        challengeId: challenge.challengeId,
        resendAvailableInSeconds: challenge.resendAvailableInSeconds,
      };
    }

    await this.authSession.createSession(user, req);
    this.logger.log(`auth.google_login_success user=${user.id}`);
    return { kind: 'session' };
  }

  private pendingKey(token: string) {
    return `${this.PENDING_PREFIX}${token}`;
  }

  private async peekPending(token: string): Promise<PendingGoogleRegistration> {
    const raw = await this.redis.get(this.pendingKey(token));
    if (!raw) {
      throw new BadRequestException('invalid_or_expired_token');
    }
    return this.parsePending(raw);
  }

  /** One-time claim — prevents parallel complete races. */
  private async consumePending(
    token: string,
  ): Promise<PendingGoogleRegistration> {
    const raw = await this.redis.getdel(this.pendingKey(token));
    if (!raw) {
      throw new BadRequestException('invalid_or_expired_token');
    }
    return this.parsePending(raw);
  }

  private parsePending(raw: string): PendingGoogleRegistration {
    try {
      const data = JSON.parse(raw) as PendingGoogleRegistration;
      if (!data?.providerId || !data?.email) {
        throw new Error('invalid_shape');
      }
      return data;
    } catch {
      throw new InternalServerErrorException('invalid_registration_payload');
    }
  }
}
