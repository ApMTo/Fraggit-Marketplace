import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
} from '../moderation/dto/moderation-tickets.dto';
import { ModerationTicketsService } from '../moderation/services/moderation-tickets.service';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

/** Thin alias over moderation tickets — keeps /tickets URL for clients. */
@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
export class TicketsController {
  constructor(private readonly tickets: ModerationTicketsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader(CSRF_HEADER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTicketDto) {
    return this.tickets.create(user.id, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tickets.findById(id, user.id, user.role);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader(CSRF_HEADER)
  addMessage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTicketMessageDto,
  ) {
    return this.tickets.addMessage(user.id, user.role, id, dto);
  }
}
