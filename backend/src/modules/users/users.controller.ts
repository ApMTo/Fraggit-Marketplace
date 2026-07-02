import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UserProfileResponseDto,
} from './responses/user.response';
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
  constructor(private readonly usersService: UsersService) {}

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
      'Accepts multipart form fields: username, displayName, bio (optional), avatar (optional image file).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['username', 'displayName'],
      properties: {
        username: { type: 'string', example: 'cool_seller' },
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
    const profile = await this.usersService.updateProfile(
      user.id,
      dto,
      avatar,
    );

    return {
      message: { code: 'messages.profile_updated' },
      user: profile,
    };
  }
}
