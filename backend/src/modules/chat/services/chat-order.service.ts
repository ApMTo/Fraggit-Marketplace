import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import { NOTIFICATION_KEYS } from '../../notifications/constants/notification-i18n';
import { NotificationItem } from '../../notifications/constants/notification.select';
import { NotificationsService } from '../../notifications/notifications.service';
import { ChatMessage } from '../constants/chat.select';
import {
  buildOrderApprovedMetadata,
  buildOrderCreatedMetadata,
  buildOrderCredentialsMetadata,
  buildOrderDisputedMetadata,
  buildOrderServiceCompletedMetadata,
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

    const message = await this.appendSystemMessage(params, {
      content: metadata.messageKey,
      metadata,
    });

    const keys = NOTIFICATION_KEYS.orderCreated;
    const sharedMeta = {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      listingTitle: params.listingTitle,
    };

    const notifications = await this.notificationsService.createMany([
      {
        userId: params.sellerId,
        type: NotificationType.ORDER_CREATED,
        title: keys.seller.title,
        body: keys.seller.body,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: { ...sharedMeta, role: 'seller' },
      },
      {
        userId: params.buyerId,
        type: NotificationType.ORDER_CREATED,
        title: keys.buyer.title,
        body: keys.buyer.body,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: { ...sharedMeta, role: 'buyer' },
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

    const message = await this.appendSystemMessage(params, {
      content: metadata.messageKey,
      metadata,
    });

    const keys = NOTIFICATION_KEYS.orderCredentials.buyer;
    const notifications = await this.notificationsService.createMany([
      {
        userId: params.buyerId,
        type: NotificationType.ORDER_CREDENTIALS,
        title: keys.title,
        body: keys.body,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          listingTitle: params.listingTitle,
          role: 'buyer',
          variant: 'credentials',
        },
      },
    ]);

    await this.deliverNotifications(notifications);

    return message;
  }

  async onOrderServiceCompleted(
    params: OrderChatEventParams,
  ): Promise<ChatMessage> {
    const frontendUrl = this.getFrontendUrl();
    const metadata = buildOrderServiceCompletedMetadata({
      ...params,
      frontendUrl,
    });

    const message = await this.appendSystemMessage(params, {
      content: metadata.messageKey,
      metadata,
    });

    const keys = NOTIFICATION_KEYS.orderServiceCompleted.buyer;
    const notifications = await this.notificationsService.createMany([
      {
        userId: params.buyerId,
        type: NotificationType.ORDER_CREDENTIALS,
        title: keys.title,
        body: keys.body,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          listingTitle: params.listingTitle,
          role: 'buyer',
          variant: 'service_completed',
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

    const message = await this.appendSystemMessage(params, {
      content: metadata.messageKey,
      metadata,
    });

    const keys = NOTIFICATION_KEYS.orderApproved;
    const sharedMeta = {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      listingTitle: params.listingTitle,
    };

    const notifications = await this.notificationsService.createMany([
      {
        userId: params.sellerId,
        type: NotificationType.ORDER_APPROVED,
        title: keys.seller.title,
        body: keys.seller.body,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: { ...sharedMeta, role: 'seller' },
      },
      {
        userId: params.buyerId,
        type: NotificationType.ORDER_APPROVED,
        title: keys.buyer.title,
        body: keys.buyer.body,
        href: `/orders/${params.orderId}`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: { ...sharedMeta, role: 'buyer' },
      },
    ]);

    await this.deliverNotifications(notifications);

    return message;
  }

  async onOrderDisputed(
    params: OrderChatEventParams & {
      reporterId: string;
    },
  ): Promise<ChatMessage> {
    const frontendUrl = this.getFrontendUrl();
    const metadata = buildOrderDisputedMetadata({
      ...params,
      frontendUrl,
    });

    const message = await this.appendSystemMessage(params, {
      content: metadata.messageKey,
      metadata,
    });

    const keys = NOTIFICATION_KEYS.orderDisputed;
    const sharedMeta = {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      listingTitle: params.listingTitle,
    };

    const otherPartyId =
      params.reporterId === params.buyerId ? params.sellerId : params.buyerId;

    const notifications = await this.notificationsService.createMany([
      {
        userId: otherPartyId,
        type: NotificationType.LOT_DISPUTE_MESSAGE,
        title: keys.counterparty.title,
        body: keys.counterparty.body,
        href: `/orders/${params.orderId}#order-dispute`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: {
          ...sharedMeta,
          role: otherPartyId === params.sellerId ? 'seller' : 'buyer',
        },
      },
      {
        userId: params.reporterId,
        type: NotificationType.LOT_DISPUTE_MESSAGE,
        title: keys.reporter.title,
        body: keys.reporter.body,
        href: `/orders/${params.orderId}#order-dispute`,
        entityType: 'order',
        entityId: params.orderId,
        metadata: {
          ...sharedMeta,
          role: params.reporterId === params.sellerId ? 'seller' : 'buyer',
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
      metadata: OrderSystemMetadata;
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
