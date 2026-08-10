import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const clientId = this.configService.get<string>('google.clientId');
    if (!clientId) {
      throw new UnauthorizedException({
        code: 'errors.google_oauth_not_configured',
      });
    }

    return super.canActivate(context);
  }

  getAuthenticateOptions() {
    return { session: false };
  }
}
