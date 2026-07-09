import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage } from '../constants/chat.select';
import { buildOrderCreatedMetadata } from '../utils/system-message-metadata.util';
import { ChatGateway } from '../chat.gateway';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

export type OrderCreatedChatParams = {
  orderId: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  listingTitle: string;
};

@Injectable()
export class ChatOrderService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly configService: ConfigService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Called after a successful purchase.
   * Reuses an existing buyer↔seller chat or creates one, then appends a SYSTEM message.
   */
  async onOrderCreated(params: OrderCreatedChatParams): Promise<ChatMessage> {
    const { id: conversationId } =
      await this.conversationService.findOrCreateDirectConversation(
        params.buyerId,
        params.sellerId,
      );

    const frontendUrl = this.configService.get<string>(
      'frontendUrl',
      'http://localhost:3000',
    );

    const metadata = buildOrderCreatedMetadata({
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      listingId: params.listingId,
      listingTitle: params.listingTitle,
      frontendUrl,
    });

    const message = await this.messageService.sendSystemMessage({
      conversationId,
      metadata: {
        ...metadata,
        body: `Заказ #${params.orderNumber} создан.`,
      },
    });

    const participantIds =
      await this.conversationService.getConversationParticipantIds(
        conversationId,
      );

    this.chatGateway.emitMessageToParticipants(participantIds, message);

    return message;
  }
}
