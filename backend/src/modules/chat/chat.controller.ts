import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
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
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import {
  FindConversationsQueryDto,
  FindMessagesQueryDto,
  MarkReadDto,
  SendImageMessageDto,
  SendTextMessageDto,
  StartConversationDto,
} from './dto/chat.dto';

const CSRF_HEADER = {
  name: 'x-csrf-token',
  description:
    'CSRF token from login/verify response or XSRF-TOKEN cookie. Required when sessionId cookie is present.',
  required: true,
};

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'List conversations for the current user',
    description:
      'Returns last message, unread count, and other participant. Sorted by last activity.',
  })
  @ApiResponse({ status: 200, description: 'Paginated conversation list' })
  listConversations(
    @CurrentUser() user: AuthUser,
    @Query() query: FindConversationsQueryDto,
  ) {
    return this.chatService.listConversations(user, query);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Open or create a direct conversation with another user',
  })
  @ApiResponse({ status: 201, description: 'Conversation id returned' })
  startConversation(
    @CurrentUser() user: AuthUser,
    @Body() dto: StartConversationDto,
  ) {
    return this.chatService.startConversation(user, dto);
  }

  @Get('conversations/:conversationId/messages')
  @ApiCookieAuth('access_token')
  @ApiOperation({
    summary: 'Get message history (cursor pagination, oldest first in page)',
  })
  @ApiParam({ name: 'conversationId', description: 'Conversation id' })
  @ApiResponse({ status: 200, description: 'Message page returned' })
  listMessages(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Query() query: FindMessagesQueryDto,
  ) {
    return this.chatService.listMessages(user, conversationId, query);
  }

  @Post('conversations/:conversationId/messages/text')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({ summary: 'Send a text message (REST fallback)' })
  @ApiParam({ name: 'conversationId', description: 'Conversation id' })
  @ApiResponse({ status: 201, description: 'Message created' })
  sendTextMessage(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendTextMessageDto,
  ) {
    return this.chatService.sendTextMessage(user, conversationId, dto);
  }

  @Post('conversations/:conversationId/messages/image')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Send an image message (upload file via /files first)',
  })
  @ApiParam({ name: 'conversationId', description: 'Conversation id' })
  @ApiResponse({ status: 201, description: 'Image message created' })
  sendImageMessage(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendImageMessageDto,
  ) {
    return this.chatService.sendImageMessage(user, conversationId, dto);
  }

  @Post('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiHeader(CSRF_HEADER)
  @ApiOperation({
    summary: 'Mark messages as read up to lastReadMessageId',
  })
  @ApiParam({ name: 'conversationId', description: 'Conversation id' })
  @ApiResponse({ status: 200, description: 'Read cursor updated' })
  markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: MarkReadDto,
  ) {
    return this.chatService.markAsRead(user, conversationId, dto);
  }
}
