import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import { NotificationItem } from '../../notifications/constants/notification.select';
import { NotificationsService } from '../../notifications/notifications.service';
import { ChatMessage } from '../constants/chat.select';
import {
  buildOrderApprovedMetadata,
  buildOrderCreatedMetadata,
  buildOrderCredentialsMetadata,
  OrderSystemMetadata,
} from '../utils/system-message-metadata.util';
import { ChatGateway } from '../chat.gateway';
import { ChatNotificationService } from './chat-notification.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

export type OrderChatEventParams = {
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
    private readonly notificationsService: NotificationsService,
    private readonly chatNotificationService: ChatNotificationService,
  ) {}

  async onOrderCreated(params: OrderChatEventParams): Promise<ChatMessage> {
    const frontendUrl = this.getFrontendUrl();
    const metadata = buildOrderCreatedMetadata({
      ...params,
      frontendUrl,
    });
    const body = `Заказ #${params.orderNumber} создан.`;

    const message = await this.appendSystemMessage(params, {
      content: body,
      metadata: { ...metadata, body },
    });

    const notifications = await this.notificationsService.createMany([
      {
        userId: params.sellerId,
        type: NotificationType.ORDER_CREATED,
        title: 'Новый заказ',
        body: `Покупатель оформил заказ #${params.orderNumber} (${params.listingTitle}).`,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          role: 'seller',
        },
      },
      {
        userId: params.buyerId,
        type: NotificationType.ORDER_CREATED,
        title: 'Заказ оформлен',
        body: `Заказ #${params.orderNumber} успешно создан.`,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          role: 'buyer',
        },
      },
    ]);

    await this.deliverNotifications(notifications);

    return message;
  }

  async onOrderCredentialsSubmitted(
    params: OrderChatEventParams,
  ): Promise<ChatMessage> {
    const frontendUrl = this.getFrontendUrl();
    const metadata = buildOrderCredentialsMetadata({
      ...params,
      frontendUrl,
    });
    const body = `Продавец передал данные по заказу #${params.orderNumber}.`;

    const message = await this.appendSystemMessage(params, {
      content: body,
      metadata: { ...metadata, body },
    });

    const notifications = await this.notificationsService.createMany([
      {
        userId: params.buyerId,
        type: NotificationType.ORDER_CREDENTIALS,
        title: 'Данные по заказу',
        body: `Продавец передал данные для заказа #${params.orderNumber}.`,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          role: 'buyer',
        },
      },
    ]);

    await this.deliverNotifications(notifications);

    return message;
  }

  async onOrderApproved(params: OrderChatEventParams): Promise<ChatMessage> {
    const frontendUrl = this.getFrontendUrl();
    const metadata = buildOrderApprovedMetadata({
      ...params,
      frontendUrl,
    });
    const body = `Заказ #${params.orderNumber} завершён.`;

    const message = await this.appendSystemMessage(params, {
      content: body,
      metadata: { ...metadata, body },
    });

    const notifications = await this.notificationsService.createMany([
      {
        userId: params.sellerId,
        type: NotificationType.ORDER_APPROVED,
        title: 'Заказ завершён',
        body: `Заказ #${params.orderNumber} подтверждён покупателем.`,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          role: 'seller',
        },
      },
      {
        userId: params.buyerId,
        type: NotificationType.ORDER_APPROVED,
        title: 'Заказ завершён',
        body: `Заказ #${params.orderNumber} успешно завершён.`,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          role: 'buyer',
        },
      },
    ]);

    await this.deliverNotifications(notifications);

    return message;
  }

  private async appendSystemMessage(
    params: OrderChatEventParams,
    payload: {
      content: string;
      metadata: OrderSystemMetadata & { body: string };
    },
  ): Promise<ChatMessage> {
    const { id: conversationId } =
      await this.conversationService.findOrCreateDirectConversation(
        params.buyerId,
        params.sellerId,
      );

    const message = await this.messageService.sendSystemMessage({
      conversationId,
      content: payload.content,
      metadata: payload.metadata,
    });

    const participantIds =
      await this.conversationService.getConversationParticipantIds(
        conversationId,
      );

    this.chatGateway.emitMessageToParticipants(participantIds, message);

    return message;
  }

  private async deliverNotifications(
    notifications: NotificationItem[],
  ): Promise<void> {
    for (const notification of notifications) {
      this.chatGateway.emitNotificationToUser(
        notification.userId,
        notification,
      );

      await this.chatNotificationService.notifyOfflineAboutOrderNotification(
        notification,
      );
    }
  }

  private getFrontendUrl(): string {
    return this.configService.get<string>(
      'frontendUrl',
      'http://localhost:3000',
    );
  }
}
