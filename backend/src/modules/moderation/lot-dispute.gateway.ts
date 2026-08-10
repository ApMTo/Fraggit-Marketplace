import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Socket } from 'socket.io';
import type { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { CHAT_WS_EVENTS } from '../chat/constants/chat.constants';
import { WsSendLotDisputeMessageDto } from '../chat/dto/chat.dto';
import { ModerationLotDisputeService } from './services/moderation-lot-dispute.service';

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
export class LotDisputeGateway {
  constructor(private readonly lotDisputes: ModerationLotDisputeService) {}

  private requireUser(client: AuthenticatedSocket): AuthUser {
    const user = client.data.user;
    if (!user) {
      client.emit(CHAT_WS_EVENTS.ERROR, { code: 'chat_auth_failed' });
      client.disconnect(true);
      throw new Error('Unauthenticated socket');
    }
    return user;
  }

  @SubscribeMessage(CHAT_WS_EVENTS.DISPUTE_MESSAGE_SEND)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleDisputeMessageSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsSendLotDisputeMessageDto,
  ) {
    const user = this.requireUser(client);

    const { message } = await this.lotDisputes.addMessage(
      dto.roomId,
      user.id,
      user.role,
      {
        body: dto.body,
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size,
        width: dto.width,
        height: dto.height,
      },
    );

    return { message };
  }
}
