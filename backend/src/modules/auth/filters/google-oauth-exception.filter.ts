import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(UnauthorizedException)
export class GoogleOAuthExceptionFilter implements ExceptionFilter {
  catch(_exception: UnauthorizedException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (!res.headersSent) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }
}
