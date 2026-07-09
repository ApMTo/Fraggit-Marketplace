import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserAuthCacheService } from '../../auth/user-auth-cache.service';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../auth/enums/roles.enum';
import { ROLE_VALUES } from '../../auth/enums/roles.enum';

@Injectable()
export class ChatAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userAuthCache: UserAuthCacheService,
  ) {}

  async authenticateHandshake(cookieHeader?: string): Promise<AuthUser> {
    const token = cookieHeader
      ? parseCookieHeader(cookieHeader).access_token
      : undefined;

    if (!token) {
      throw new UnauthorizedException('chat_auth_token_missing');
    }

    let payload: {
      userId?: string;
      email?: string;
      role?: unknown;
      username?: string;
      displayName?: string;
    };

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('chat_auth_token_invalid');
    }

    if (!payload.userId || !payload.email) {
      throw new UnauthorizedException('chat_auth_token_invalid');
    }

    const entry = await this.userAuthCache.getActiveUser(payload.userId);

    if (entry.status !== 'active') {
      throw new UnauthorizedException('chat_auth_user_inactive');
    }

    const { user } = entry;

    if (user.email !== payload.email) {
      await this.userAuthCache.invalidate(payload.userId);
      throw new UnauthorizedException('chat_auth_token_invalid');
    }

    const role =
      typeof user.role === 'string' && ROLE_VALUES.has(user.role)
        ? (user.role as UserRole)
        : UserRole.USER;

    return {
      id: user.id,
      email: user.email,
      role,
      username: user.username,
      displayName: user.displayName,
    };
  }

  assertNotSelf(userId: string, otherUserId: string): void {
    if (userId === otherUserId) {
      throw new BadRequestException('chat_cannot_message_self');
    }
  }

  async assertParticipant(
    conversationId: string,
    userId: string,
    participantUserIds: string[],
  ): Promise<void> {
    if (!participantUserIds.includes(userId)) {
      throw new ForbiddenException('chat_forbidden');
    }

    if (participantUserIds.length === 0) {
      throw new NotFoundException('chat_not_found');
    }

    void conversationId;
  }
}

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rawValue.join('='));
    return acc;
  }, {});
}
