import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthLoginService } from './auth-login.service';
import { AuthPasswordResetService } from './auth-password-reset.service';
import { UserAuthCacheService } from './user-auth-cache.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { SessionsModule } from '../sessions/sessions.module';
import { TokenModule } from '../token/token.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    SessionsModule,
    TokenModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSessionService,
    AuthRegistrationService,
    AuthLoginService,
    AuthPasswordResetService,
    UserAuthCacheService,
    JwtStrategy,
    RolesGuard,
    CsrfGuard,
    JwtAuthGuard,
  ],
  exports: [
    AuthService,
    RolesGuard,
    CsrfGuard,
    JwtAuthGuard,
    UserAuthCacheService,
  ],
})
export class AuthModule {}
