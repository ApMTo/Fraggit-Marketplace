import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthMessageResponseDto {
  @ApiProperty({ example: 'verification_email_sent' })
  message!: string;
}

export class ResetPasswordTokenResponseDto {
  @ApiProperty({ example: true })
  valid!: boolean;

  @ApiProperty({ example: 900 })
  expiresInSeconds!: number;
}

export class AuthSessionResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  sessionToken!: string;

  @ApiProperty()
  csrfToken!: string;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;
}

export class VerifyUserResponseDto {
  @ApiProperty({ example: 'user_verified' })
  message!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}

export class AuthProfileResponseDto {
  @ApiProperty({ example: { code: 'messages.profile_data' } })
  message!: { code: string };

  @ApiProperty()
  user!: AuthUserDto;
}

export class LogoutResponseDto {
  @ApiProperty({ example: { code: 'messages.logout_success' } })
  message!: { code: string };
}

export class LogoutAllResponseDto {
  @ApiProperty({ example: { code: 'messages.logout_all_success' } })
  message!: { code: string };

  @ApiProperty({ example: 3 })
  revokedSessions!: number;
}

export class AuthErrorResponseDto {
  @ApiProperty({ example: 'error' })
  status!: string;

  @ApiProperty()
  error!: {
    message: unknown;
    code: number;
  };
}
