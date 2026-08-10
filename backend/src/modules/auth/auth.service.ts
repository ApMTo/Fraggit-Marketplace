import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGoogleService } from './auth-google.service';
import { AuthLoginService } from './auth-login.service';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthSessionService } from './auth-session.service';
import { AuthPasswordResetService } from './auth-password-reset.service';
import { AuthTwoFactorService } from './auth-two-factor.service';
import { CompleteGoogleDto } from './dto/complete-google.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendTwoFactorDto } from './dto/resend-two-factor.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import type { GoogleAuthProfile } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly registrationService: AuthRegistrationService,
    private readonly authLoginService: AuthLoginService,
    private readonly authSessionService: AuthSessionService,
    private readonly passwordResetService: AuthPasswordResetService,
    private readonly authTwoFactorService: AuthTwoFactorService,
    private readonly authGoogleService: AuthGoogleService,
  ) {}

  register(data: RegisterUserDto) {
    return this.registrationService.register(data);
  }

  verifyUser(token: string, req: Request) {
    return this.registrationService.verifyRegistrationToken(token, req);
  }

  login(data: LoginUserDto, req: Request) {
    return this.authLoginService.login(data, req);
  }

  verifyTwoFactor(dto: VerifyTwoFactorDto, req: Request) {
    return this.authTwoFactorService.verifyLoginChallenge(dto, req);
  }

  resendTwoFactor(dto: ResendTwoFactorDto) {
    return this.authTwoFactorService.resendLoginChallenge(dto);
  }

  refresh(sessionId: string, deviceId: string, req: Request) {
    return this.authSessionService.refresh(sessionId, deviceId, req);
  }

  logoutCurrentSession(userId: string, sessionId: string, req: Request) {
    return this.authSessionService.logoutCurrentSession(userId, sessionId, req);
  }

  logoutAllSessions(userId: string, req: Request) {
    return this.authSessionService.logoutAllSessions(userId, req);
  }

  forgotPassword(dto: ForgotPasswordDto) {
    return this.passwordResetService.requestReset(dto);
  }

  validateResetToken(token: string) {
    return this.passwordResetService.validateResetToken(token);
  }

  resetPassword(dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto);
  }

  handleGoogleCallback(profile: GoogleAuthProfile, req: Request) {
    return this.authGoogleService.handleCallback(profile, req);
  }

  getGooglePending(token: string) {
    return this.authGoogleService.getPending(token);
  }

  completeGoogleRegistration(dto: CompleteGoogleDto, req: Request) {
    return this.authGoogleService.completeRegistration(dto, req);
  }
}
