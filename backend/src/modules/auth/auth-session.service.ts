import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import { TokenService } from '../token/token.service';
import { createUserPayload } from './utils/create-user-payload.util';
import { clearAuthCookies, setAuthCookies } from './utils/auth-cookies.util';

@Injectable()
export class AuthSessionService {
  private readonly logger = new Logger(AuthSessionService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: TokenService,
  ) {}

  async createSession(
    user: {
      id: string;
      email: string;
      role: string;
      username: string;
      displayName: string;
    },
    req: Request,
  ) {
    const tokens = await this.jwtService.generateTokens(
      createUserPayload(user.id, user),
    );
    const deviceId = uuidv4();
    const csrfToken = uuidv4();
    const userAgent = req.headers['user-agent'] || '';
    const sessionId = await this.sessionsService.saveSession(
      user.id,
      tokens.refreshTokenId,
      deviceId,
      userAgent,
      csrfToken,
    );

    setAuthCookies(
      req,
      tokens.accessToken,
      tokens.refreshToken,
      deviceId,
      sessionId,
      csrfToken,
    );

    this.logger.log(
      `auth.session_created user=${user.id} session=${sessionId}`,
    );

    return {
      accessToken: tokens.accessToken,
      sessionToken: sessionId,
      csrfToken,
    };
  }

  async refresh(sessionId: string, deviceId: string, req: Request) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException({ code: 'errors.invalid_refresh_token' });
    }

    const csrfToken = req.headers['x-csrf-token'];
    if (typeof csrfToken !== 'string' || !csrfToken.trim()) {
      throw new UnauthorizedException({ code: 'errors.invalid_csrf_token' });
    }

    const refreshPayload =
      await this.jwtService.verifyRefreshToken(refreshToken);
    const userAgent = req.headers['user-agent'] || '';
    const userId = await this.sessionsService.validateSession(
      sessionId,
      deviceId,
      userAgent,
      refreshPayload.jti,
      csrfToken,
    );

    if (!userId) {
      throw new ConflictException({ code: 'errors.session_not_found' });
    }

    const user = await this.prismaService.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        username: true,
        displayName: true,
        status: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({ code: 'errors.unauthorized' });
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException({ code: 'errors.account_deactivated' });
    }

    if (user.status === 'BANNED') {
      throw new ForbiddenException({ code: 'errors.account_blocked' });
    }

    const newTokens = await this.jwtService.generateTokens(
      createUserPayload(user.id, user),
    );
    const newCsrfToken = uuidv4();

    await this.sessionsService.saveSession(
      user.id,
      newTokens.refreshTokenId,
      deviceId,
      userAgent,
      newCsrfToken,
      sessionId,
    );

    setAuthCookies(
      req,
      newTokens.accessToken,
      newTokens.refreshToken,
      deviceId,
      sessionId,
      newCsrfToken,
    );

    this.logger.log(
      `auth.refresh_success user=${user.id} session=${sessionId}`,
    );

    return {
      accessToken: newTokens.accessToken,
      sessionToken: sessionId,
      csrfToken: newCsrfToken,
    };
  }

  async logoutCurrentSession(userId: string, sessionId: string, req: Request) {
    const csrfToken = req.headers['x-csrf-token'];
    if (typeof csrfToken !== 'string' || !csrfToken.trim()) {
      throw new UnauthorizedException({ code: 'errors.invalid_csrf_token' });
    }

    const session = await this.sessionsService.getSession(sessionId);
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException({ code: 'errors.session_not_found' });
    }

    if (session.csrfToken !== csrfToken) {
      throw new UnauthorizedException({ code: 'errors.invalid_csrf_token' });
    }

    await this.sessionsService.revokeSession(
      userId,
      sessionId,
      session.deviceId,
    );
    clearAuthCookies(req);
    this.logger.log(`auth.logout_current user=${userId} session=${sessionId}`);

    return { message: { code: 'messages.logout_success' } };
  }

  async logoutAllSessions(userId: string, req: Request) {
    const csrfToken = req.headers['x-csrf-token'];
    if (typeof csrfToken !== 'string' || !csrfToken.trim()) {
      throw new UnauthorizedException({ code: 'errors.invalid_csrf_token' });
    }

    const sessionId = req.cookies?.sessionId as string | undefined;
    if (sessionId) {
      const session = await this.sessionsService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        throw new UnauthorizedException({ code: 'errors.session_not_found' });
      }
      if (session.csrfToken !== csrfToken) {
        throw new UnauthorizedException({ code: 'errors.invalid_csrf_token' });
      }
    }

    const revoked = await this.sessionsService.revokeAllSessions(userId);
    clearAuthCookies(req);
    this.logger.log(`auth.logout_all user=${userId} revoked=${revoked}`);

    return {
      message: { code: 'messages.logout_all_success' },
      revokedSessions: revoked,
    };
  }
}
