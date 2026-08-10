import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../decorators/public.decorator';
import { AuthService } from './auth.service';
import { clearAuthCookies } from './utils/auth-cookies.util';
import { JwtAuthGuard } from './guards/jwt.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleOAuthExceptionFilter } from './filters/google-oauth-exception.filter';
import { CompleteGoogleDto } from './dto/complete-google.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendTwoFactorDto } from './dto/resend-two-factor.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import type { GoogleAuthProfile } from './strategies/google.strategy';
import {
  AuthErrorResponseDto,
  AuthMessageResponseDto,
  AuthProfileResponseDto,
  AuthSessionResponseDto,
  LogoutAllResponseDto,
  LogoutResponseDto,
  ResetPasswordTokenResponseDto,
  TwoFactorChallengeResponseDto,
  VerifyUserResponseDto,
} from './responses/auth.response';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('frontendUrl') ?? 'http://localhost:3000';
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Sends a verification email. User is created after GET /auth/verify/:token.',
  })
  @ApiResponse({ status: 201, type: AuthMessageResponseDto })
  @ApiResponse({ status: 409, type: AuthErrorResponseDto })
  register(@Body() data: RegisterUserDto) {
    return this.authService.register(data);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Sets httpOnly cookies: access_token, refresh_token, sessionId, deviceId. ' +
      'Also returns csrfToken for x-csrf-token header.',
  })
  @ApiResponse({ status: 201, type: AuthSessionResponseDto })
  @ApiResponse({ status: 201, type: TwoFactorChallengeResponseDto })
  @ApiResponse({ status: 401, type: AuthErrorResponseDto })
  login(@Body() data: LoginUserDto, @Req() req: Request) {
    return this.authService.login(data, req);
  }

  @Post('2fa/verify')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Verify login two-factor code',
    description:
      'Completes login after email 2FA. Sets the same session cookies as login.',
  })
  @ApiResponse({ status: 201, type: AuthSessionResponseDto })
  @ApiResponse({ status: 400, type: AuthErrorResponseDto })
  verifyTwoFactor(@Body() data: VerifyTwoFactorDto, @Req() req: Request) {
    return this.authService.verifyTwoFactor(data, req);
  }

  @Post('2fa/resend')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Resend login two-factor code',
    description: 'Available once every 30 seconds per challenge.',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, type: AuthErrorResponseDto })
  resendTwoFactor(@Body() data: ResendTwoFactorDto) {
    return this.authService.resendTwoFactor(data);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Request a password reset email',
    description:
      'Always returns the same success response. If an eligible account exists for the email, a reset link is sent; otherwise nothing is sent. This prevents email enumeration.',
  })
  @ApiResponse({ status: 200, type: AuthMessageResponseDto })
  forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.authService.forgotPassword(data);
  }

  @Get('reset-password/:token')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Validate password reset token' })
  @ApiParam({ name: 'token', description: 'Token from password reset email' })
  @ApiResponse({ status: 200, type: ResetPasswordTokenResponseDto })
  validateResetToken(@Param('token') token: string) {
    return this.authService.validateResetToken(token);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Set a new password using reset token' })
  @ApiResponse({ status: 200, type: AuthMessageResponseDto })
  resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
  }

  @Get('verify/:token')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Verify registration email',
    description:
      'Activates the account and starts a session (same cookies as login).',
  })
  @ApiParam({ name: 'token', description: 'Verification token from email' })
  @ApiResponse({ status: 200, type: VerifyUserResponseDto })
  verify(@Param('token') token: string, @Req() req: Request) {
    return this.authService.verifyUser(token, req);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: AuthProfileResponseDto })
  getProfile(@Req() req: Request & { user: Record<string, unknown> }) {
    return {
      message: { code: 'messages.profile_data' },
      user: req.user,
    };
  }

  @Get('ws-token')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Issue access token for Socket.IO handshake',
    description:
      'Returns the current access_token for cross-origin WebSocket auth ' +
      '(browser cookies on the frontend host are not sent to the API host).',
  })
  getWsToken(@Req() req: Request) {
    const token = req.cookies?.access_token as string | undefined;
    if (!token) {
      throw new UnauthorizedException({ code: 'errors.unauthorized' });
    }
    return { token };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 201, type: AuthSessionResponseDto })
  async refresh(@Req() req: Request) {
    const { deviceId, sessionId } = req.cookies as {
      deviceId?: string;
      sessionId?: string;
    };
    if (!deviceId || !sessionId) {
      clearAuthCookies(req);
      throw new UnauthorizedException({ code: 'errors.no_session_found' });
    }

    try {
      return await this.authService.refresh(sessionId, deviceId, req);
    } catch (error) {
      clearAuthCookies(req);
      throw error;
    }
  }

  @Post('clear-session')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Clear auth cookies without a valid session (stale/expired tokens)',
  })
  @ApiResponse({ status: 204, description: 'Auth cookies cleared' })
  clearSession(@Req() req: Request): void {
    clearAuthCookies(req);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, type: LogoutResponseDto })
  logout(@Req() req: Request & { user: { id: string } }) {
    const { sessionId } = req.cookies as { sessionId?: string };
    if (!sessionId) {
      throw new UnauthorizedException({ code: 'errors.no_session_found' });
    }
    return this.authService.logoutCurrentSession(req.user.id, sessionId, req);
  }

  @Post('logout/all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, type: LogoutAllResponseDto })
  logoutAll(@Req() req: Request & { user: { id: string } }) {
    return this.authService.logoutAllSessions(req.user.id, req);
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @UseFilters(GoogleOAuthExceptionFilter)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Start Google OAuth',
    description: 'Redirects the browser to Google consent screen.',
  })
  @ApiResponse({ status: 302, description: 'Redirect to Google' })
  googleAuth(): void {
    // Passport GoogleAuthGuard handles the redirect.
  }

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @UseFilters(GoogleOAuthExceptionFilter)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Existing Google users are signed in. New users are redirected to complete username/displayName.',
  })
  @ApiResponse({ status: 302, description: 'Redirect to frontend' })
  async googleCallback(
    @Req() req: Request & { user: GoogleAuthProfile },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const outcome = await this.authService.handleGoogleCallback(
        req.user,
        req,
      );

      if (outcome.kind === 'complete') {
        res.redirect(
          `${this.frontendUrl}/auth/complete-google?token=${encodeURIComponent(outcome.token)}`,
        );
        return;
      }

      if (outcome.kind === 'two_factor') {
        res.redirect(
          `${this.frontendUrl}/login?twoFactorChallenge=${encodeURIComponent(outcome.challengeId)}`,
        );
        return;
      }

      if (outcome.kind === 'error') {
        res.redirect(
          `${this.frontendUrl}/login?error=${encodeURIComponent(outcome.code)}`,
        );
        return;
      }

      res.redirect(`${this.frontendUrl}/`);
    } catch {
      res.redirect(`${this.frontendUrl}/login?error=google_auth_failed`);
    }
  }

  @Get('google/pending/:token')
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get pending Google registration profile' })
  @ApiParam({ name: 'token', description: 'Pending signup token' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, type: AuthErrorResponseDto })
  getGooglePending(@Param('token') token: string) {
    return this.authService.getGooglePending(token);
  }

  @Post('google/complete')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Complete Google registration',
    description:
      'Creates the account from a pending Google OAuth profile using username and displayName.',
  })
  @ApiResponse({ status: 201, type: VerifyUserResponseDto })
  @ApiResponse({ status: 400, type: AuthErrorResponseDto })
  @ApiResponse({ status: 409, type: AuthErrorResponseDto })
  completeGoogle(@Body() data: CompleteGoogleDto, @Req() req: Request) {
    return this.authService.completeGoogleRegistration(data, req);
  }
}
