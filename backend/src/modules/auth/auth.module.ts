import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthLoginService } from './auth-login.service';
import { AuthPasswordResetService } from './auth-password-reset.service';
import { AuthTwoFactorService } from './auth-two-factor.service';
import { AuthGoogleService } from './auth-google.service';
import { UserAuthCacheService } from './user-auth-cache.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleOAuthStateStore } from './utils/google-oauth-state.store';
import { RolesGuard } from './guards/roles.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
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
    AuthTwoFactorService,
    AuthGoogleService,
    UserAuthCacheService,
    JwtStrategy,
    GoogleOAuthStateStore,
    GoogleStrategy,
    RolesGuard,
    CsrfGuard,
    JwtAuthGuard,
    GoogleAuthGuard,
  ],
  exports: [
    AuthService,
    AuthSessionService,
    AuthTwoFactorService,
    RolesGuard,
    CsrfGuard,
    JwtAuthGuard,
    UserAuthCacheService,
  ],
})
export class AuthModule {}
