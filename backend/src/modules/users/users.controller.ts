import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { Public } from '../../decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UserProfileResponseDto,
  UserPublicProfileResponseDto,
} from './responses/user.response';
import { UserSecurityService } from './user-security.service';
import { UsersService } from './users.service';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

const avatarValidationPipe = new FileValidationPipe({
  maxSizeInBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  optional: true,
});

const storageOptions = { storage: memoryStorage() };

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userSecurityService: UserSecurityService,
  ) {}

  @Get('me')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  async getProfile(@CurrentUser() user: AuthUser) {
    const profile = await this.usersService.getProfile(user.id);

    return {
      message: { code: 'messages.profile_data' },
      user: profile,
    };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Accepts multipart form fields: displayName, bio (optional), avatar (optional image file). Username and email are changed via security endpoints.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['displayName'],
      properties: {
        displayName: { type: 'string', example: 'Cool Seller' },
        bio: { type: 'string', example: 'CS2 skins trader', nullable: true },
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @UseInterceptors(FileInterceptor('avatar', storageOptions))
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
    @UploadedFile(avatarValidationPipe) avatar?: Express.Multer.File,
  ) {
    const profile = await this.usersService.updateProfile(user.id, dto, avatar);

    return {
      message: { code: 'messages.profile_updated' },
      user: profile,
    };
  }

  @Post('me/email/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Request email change',
    description:
      'Sends a 6-digit code to the current email. Email can be changed once every 14 days.',
  })
  @ApiResponse({ status: 200 })
  async requestEmailChange(
    @CurrentUser() user: AuthUser,
    @Body() dto: RequestEmailChangeDto,
  ) {
    return this.userSecurityService.requestEmailChange(user.id, dto);
  }

  @Post('me/email/confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Confirm email change',
    description:
      'Verifies the code sent to the current email and updates to the new address if available.',
  })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  async confirmEmailChange(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfirmEmailChangeDto,
    @Req() req: Request,
  ) {
    return this.userSecurityService.confirmEmailChange(user.id, dto, req);
  }

  @Post('me/username')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Change username',
    description: 'Username can be changed once every 14 days.',
  })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  async changeUsername(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangeUsernameDto,
  ) {
    return this.userSecurityService.changeUsername(user.id, dto);
  }

  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Change password',
    description:
      'Requires current password, new password, and confirmation. Other sessions are revoked.',
  })
  @ApiResponse({ status: 200 })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.userSecurityService.changePassword(user.id, dto, req);
  }

  @Get(':username')
  @Public()
  @ApiOperation({ summary: 'Get public user profile by username' })
  @ApiParam({ name: 'username', example: 'cool_seller' })
  @ApiResponse({ status: 200, type: UserPublicProfileResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getByUsername(@Param('username') username: string) {
    const user = await this.usersService.getPublicByUsername(username);

    return {
      message: { code: 'messages.profile_data' },
      user,
    };
  }
}
