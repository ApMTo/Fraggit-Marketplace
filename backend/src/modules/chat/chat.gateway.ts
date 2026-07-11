import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import type { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { PinoLogger } from 'nestjs-pino';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { CHAT_WS_EVENTS } from './constants/chat.constants';
import { ChatMessage } from './constants/chat.select';
import { WsMarkReadDto, WsSendTextMessageDto } from './dto/chat.dto';
import { ChatAuthService } from './services/chat-auth.service';
import { ChatPresenceService } from './services/chat-presence.service';
import { ChatReadService } from './services/chat-read.service';
import { ChatNotificationService } from './services/chat-notification.service';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';

type AuthenticatedSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  { user?: AuthUser }
>;

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatAuthService: ChatAuthService,
    private readonly chatPresenceService: ChatPresenceService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly chatReadService: ChatReadService,
    private readonly chatNotificationService: ChatNotificationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChatGateway.name);
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const user = await this.chatAuthService.authenticateHandshake(
        client.handshake.headers.cookie,
      );

      client.data.user = user;
      await client.join(this.userRoom(user.id));
      await this.chatPresenceService.setOnline(user.id);

      this.server
        .to(this.userRoom(user.id))
        .emit(CHAT_WS_EVENTS.PRESENCE_UPDATE, {
          userId: user.id,
          online: true,
        });

      this.logger.info(
        { userId: user.id, socketId: client.id },
        'Chat connected',
      );
    } catch (error: unknown) {
      this.logger.warn(
        {
          socketId: client.id,
          err: error instanceof Error ? error.message : String(error),
        },
        'Chat connection rejected',
      );
      client.emit(CHAT_WS_EVENTS.ERROR, { code: 'chat_auth_failed' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const user = client.data?.user;
    if (!user) {
      return;
    }

    const room = this.userRoom(user.id);
    const sockets = await this.server.in(room).fetchSockets();

    const hasOtherConnections = sockets.some(
      (socket) => socket.id !== client.id,
    );

    if (!hasOtherConnections) {
      await this.chatPresenceService.setOffline(user.id);
      this.server.to(room).emit(CHAT_WS_EVENTS.PRESENCE_UPDATE, {
        userId: user.id,
        online: false,
      });
    }

    this.logger.info(
      { userId: user.id, socketId: client.id },
      'Chat disconnected',
    );
  }

  private requireUser(client: AuthenticatedSocket): AuthUser {
    const user = client.data.user;
    if (!user) {
      client.emit(CHAT_WS_EVENTS.ERROR, { code: 'chat_auth_failed' });
      client.disconnect(true);
      throw new Error('Unauthenticated socket');
    }
    return user;
  }

  @SubscribeMessage(CHAT_WS_EVENTS.HEARTBEAT)
  async handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = this.requireUser(client);
    await this.chatPresenceService.refreshOnline(user.id);
    return { ok: true, userId: user.id };
  }

  @SubscribeMessage(CHAT_WS_EVENTS.MESSAGE_SEND)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleMessageSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsSendTextMessageDto,
  ) {
    const user = this.requireUser(client);

    const message = await this.messageService.sendTextMessage({
      senderId: user.id,
      conversationId: dto.conversationId,
      content: dto.content,
    });

    const participantIds =
      await this.conversationService.getConversationParticipantIds(
        dto.conversationId,
      );

    for (const participantId of participantIds) {
      this.server
        .to(this.userRoom(participantId))
        .emit(CHAT_WS_EVENTS.MESSAGE_NEW, { message });
    }

    client.emit(CHAT_WS_EVENTS.MESSAGE_SENT, { message });

    await this.chatNotificationService.notifyAboutNewMessage(
      message,
      user.displayName,
    );

    return { message };
  }

  @SubscribeMessage(CHAT_WS_EVENTS.MESSAGE_READ)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsMarkReadDto,
  ) {
    const user = this.requireUser(client);

    const result = await this.chatReadService.markAsRead(
      user.id,
      dto.conversationId,
      dto.lastReadMessageId,
    );

    const participantIds =
      await this.conversationService.getConversationParticipantIds(
        dto.conversationId,
      );

    const otherParticipantId = participantIds.find((id) => id !== user.id);

    if (otherParticipantId) {
      this.server
        .to(this.userRoom(otherParticipantId))
        .emit(CHAT_WS_EVENTS.MESSAGE_READ_ACK, {
          conversationId: dto.conversationId,
          readerUserId: user.id,
          lastReadMessageId: result.lastReadMessageId,
          lastReadAt: result.lastReadAt,
        });
    }

    client.emit(CHAT_WS_EVENTS.MESSAGE_READ_ACK, result);

    return result;
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  emitMessageToParticipants(
    participantIds: string[],
    message: ChatMessage,
  ): void {
    for (const participantId of participantIds) {
      this.server
        .to(this.userRoom(participantId))
        .emit(CHAT_WS_EVENTS.MESSAGE_NEW, { message });
    }
  }
}
