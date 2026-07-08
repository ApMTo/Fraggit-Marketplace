import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { MailQueueService } from '../mail/mail-queue.service';
import { UserRole, UserStatus } from '@prisma/client';
import { AuthSessionService } from './auth-session.service';
import { RegisterUserDto } from './dto/register-user.dto';
import {
  enforcePasswordPolicy,
  hashPassword,
} from './utils/password-policy.util';
import { EmailRenderer } from './utils/email.renderer';

type PendingRegistration = {
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
};

@Injectable()
export class AuthRegistrationService {
  private readonly logger = new Logger(AuthRegistrationService.name);
  private readonly REGISTRATION_TTL = 60 * 15;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mailQueue: MailQueueService,
    private readonly authSession: AuthSessionService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('frontendUrl') ??
      'http://localhost:3000';
  }

  async register(dto: RegisterUserDto) {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.toLowerCase().trim();

    enforcePasswordPolicy(dto.password);
    await this.assertEmailAvailable(email);
    await this.assertUsernameAvailable(username);

    const token = uuidv4();
    const payload: PendingRegistration = {
      username,
      displayName: dto.displayName.trim(),
      email,
      passwordHash: await hashPassword(dto.password),
    };

    await this.savePending(token, email, username, payload);

    await this.mailQueue.enqueue({
      to: email,
      subject: 'Verify your Fraggit account',
      html: EmailRenderer.renderInvitationEmail(
        payload.displayName,
        token,
        this.frontendUrl,
      ),
      type: 'registration',
    });

    return { message: 'verification_email_sent' };
  }

  async verifyRegistrationToken(token: string, req: Request) {
    const raw = await this.redis.get(`reg:${token}`);
    if (!raw) {
      throw new BadRequestException('invalid_or_expired_token');
    }

    let data: PendingRegistration;
    try {
      data = JSON.parse(raw) as PendingRegistration;
    } catch {
      throw new InternalServerErrorException('invalid_registration_payload');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('user_already_exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        passwordHash: data.passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    await Promise.all([
      this.redis.del(`reg:${token}`),
      this.redis.del(`reg:email:${data.email}`),
      this.redis.del(`reg:username:${data.username}`),
    ]);

    await this.authSession.createSession(user, req);

    return {
      message: 'user_verified',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async assertEmailAvailable(email: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('email_already_exists');
    }

    if (await this.redis.get(`reg:email:${email}`)) {
      throw new ConflictException('verification_already_sent');
    }
  }

  private async assertUsernameAvailable(username: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('username_already_exists');
    }

    if (await this.redis.get(`reg:username:${username}`)) {
      throw new ConflictException('verification_already_sent');
    }
  }

  private async savePending(
    token: string,
    email: string,
    username: string,
    payload: PendingRegistration,
  ) {
    await Promise.all([
      this.redis.set(
        `reg:${token}`,
        JSON.stringify(payload),
        this.REGISTRATION_TTL,
      ),
      this.redis.set(`reg:email:${email}`, token, this.REGISTRATION_TTL),
      this.redis.set(`reg:username:${username}`, token, this.REGISTRATION_TTL),
    ]);
  }
}
