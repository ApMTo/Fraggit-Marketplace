import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  FindConversationsQueryDto,
  FindMessagesQueryDto,
  MarkReadDto,
  SendImageMessageDto,
  SendTextMessageDto,
  StartConversationDto,
} from './dto/chat.dto';
import { ChatMessage } from './constants/chat.select';
import { ChatOrderService } from './services/chat-order.service';
import { ChatReadService } from './services/chat-read.service';
import {
  ConversationListResult,
  ConversationService,
} from './services/conversation.service';
import { MessageListResult, MessageService } from './services/message.service';
import { ChatNotificationService } from './services/chat-notification.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly chatReadService: ChatReadService,
    private readonly chatNotificationService: ChatNotificationService,
    private readonly chatOrderService: ChatOrderService,
  ) {}

  listConversations(
    user: AuthUser,
    query: FindConversationsQueryDto,
  ): Promise<ConversationListResult> {
    return this.conversationService.listConversations(user.id, query);
  }

  async startConversation(user: AuthUser, dto: StartConversationDto) {
    const result = await this.conversationService.findOrCreateDirectConversation(
      user.id,
      dto.participantUserId,
    );

    return result;
  }

  listMessages(
    user: AuthUser,
    conversationId: string,
    query: FindMessagesQueryDto,
  ): Promise<MessageListResult> {
    return this.messageService.listMessages(user.id, conversationId, query);
  }

  async sendTextMessage(
    user: AuthUser,
    conversationId: string,
    dto: SendTextMessageDto,
  ): Promise<ChatMessage> {
    const message = await this.messageService.sendTextMessage({
      senderId: user.id,
      conversationId,
      content: dto.content,
    });

    await this.chatNotificationService.notifyAboutNewMessage(
      message,
      user.displayName,
    );

    return message;
  }

  async sendImageMessage(
    user: AuthUser,
    conversationId: string,
    dto: SendImageMessageDto,
  ): Promise<ChatMessage> {
    const message = await this.messageService.sendImageMessage({
      senderId: user.id,
      conversationId,
      url: dto.url,
      mimeType: dto.mimeType,
      size: dto.size,
      width: dto.width,
      height: dto.height,
    });

    await this.chatNotificationService.notifyAboutNewMessage(
      message,
      user.displayName,
    );

    return message;
  }

  markAsRead(user: AuthUser, conversationId: string, dto: MarkReadDto) {
    return this.chatReadService.markAsRead(
      user.id,
      conversationId,
      dto.lastReadMessageId,
    );
  }

  onOrderCreated(
    params: Parameters<ChatOrderService['onOrderCreated']>[0],
  ) {
    return this.chatOrderService.onOrderCreated(params);
  }
}
