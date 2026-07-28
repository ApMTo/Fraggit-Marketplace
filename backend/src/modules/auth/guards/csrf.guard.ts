import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../decorators/public.decorator';
import { SessionsService } from '../../sessions/sessions.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionsService: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const sessionId = request.cookies?.sessionId as string | undefined;
    const accessToken = request.cookies?.access_token as string | undefined;

    if (!sessionId) {
      if (accessToken) {
        throw new UnauthorizedException({ code: 'errors.invalid_csrf_token' });
      }
      return true;
    }

    const csrfToken = request.headers['x-csrf-token'];
    if (typeof csrfToken !== 'string' || !csrfToken.trim()) {
      throw new UnauthorizedException({ code: 'errors.invalid_csrf_token' });
    }

    const session = await this.sessionsService.getSession(sessionId);
    if (!session || session.csrfToken !== csrfToken) {
      throw new UnauthorizedException({ code: 'errors.invalid_csrf_token' });
    }

    return true;
  }
}
