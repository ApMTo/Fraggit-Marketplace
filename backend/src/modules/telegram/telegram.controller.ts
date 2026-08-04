import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
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
import { TelegramService } from './telegram.service';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('status')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get Telegram link status for current user' })
  @ApiResponse({ status: 200, description: 'Telegram link status' })
  getStatus(@CurrentUser() user: AuthUser) {
    return this.telegramService.getStatus(user.id);
  }

  @Post('link')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Create a Telegram deep-link to bind account' })
  @ApiResponse({ status: 200, description: 'Deep link created' })
  @ApiResponse({ status: 503, description: 'Telegram bot unavailable' })
  createLink(@CurrentUser() user: AuthUser) {
    return this.telegramService.createLinkCode(user.id);
  }

  @Delete('link')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Unlink Telegram from current account' })
  @ApiResponse({ status: 200, description: 'Telegram unlinked' })
  async unlink(@CurrentUser() user: AuthUser) {
    await this.telegramService.unlink(user.id);
    return { message: { code: 'telegram_unlinked' } };
  }
}
