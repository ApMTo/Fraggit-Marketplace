import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { TokenModule } from '../token/token.module';
import { CHAT_QUEUE } from './constants/chat.constants';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatNotificationProcessor } from './processors/chat-notification.processor';
import { ChatAuthService } from './services/chat-auth.service';
import { ChatNotificationQueueService } from './services/chat-notification-queue.service';
import { ChatNotificationService } from './services/chat-notification.service';
import { ChatOrderService } from './services/chat-order.service';
import { ChatPresenceService } from './services/chat-presence.service';
import { ChatRateLimitService } from './services/chat-rate-limit.service';
import { ChatReadService } from './services/chat-read.service';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';

@Module({
  imports: [
    AuthModule,
    TokenModule,
    MailModule,
    BullModule.registerQueue({ name: CHAT_QUEUE }),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    ConversationService,
    MessageService,
    ChatReadService,
    ChatPresenceService,
    ChatRateLimitService,
    ChatAuthService,
    ChatNotificationService,
    ChatNotificationQueueService,
    ChatNotificationProcessor,
    ChatOrderService,
  ],
  exports: [ChatService, ChatOrderService],
})
export class ChatModule {}
