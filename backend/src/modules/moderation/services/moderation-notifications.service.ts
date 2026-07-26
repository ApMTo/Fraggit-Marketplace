import { Injectable } from '@nestjs/common';
import {
  NotificationType,
  ReportStatus,
  TicketResolution,
} from '@prisma/client';
import { ChatGateway } from '../../chat/chat.gateway';
import { ChatNotificationService } from '../../chat/services/chat-notification.service';
import { NOTIFICATION_KEYS } from '../../notifications/constants/notification-i18n';
import { NotificationItem } from '../../notifications/constants/notification.select';
import {
  CreateNotificationInput,
  NotificationsService,
} from '../../notifications/notifications.service';

@Injectable()
export class ModerationNotificationsService {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly chatGateway: ChatGateway,
    private readonly chatNotificationService: ChatNotificationService,
  ) {}

  async notifyReportStatus(params: {
    reporterId: string;
    reportId: string;
    status: typeof ReportStatus.RESOLVED | typeof ReportStatus.DISMISSED;
    note?: string | null;
  }): Promise<void> {
    const keys =
      params.status === ReportStatus.RESOLVED
        ? NOTIFICATION_KEYS.reportStatus.resolved
        : NOTIFICATION_KEYS.reportStatus.dismissed;

    const note = params.note?.trim() || '';

    await this.deliver([
      {
        userId: params.reporterId,
        type: NotificationType.REPORT_STATUS,
        title: keys.title,
        body: keys.body,
        entityType: 'report',
        entityId: params.reportId,
        href: '/reports',
        metadata: {
          status: params.status,
          note,
        },
      },
    ]);
  }

  async notifyTicketResolved(params: {
    recipientIds: string[];
    ticketId: string;
    orderId?: string | null;
    orderNumber?: string | null;
    listingTitle?: string | null;
    resolution: Exclude<TicketResolution, 'NONE'>;
    note?: string | null;
  }): Promise<void> {
    const keys = (() => {
      switch (params.resolution) {
        case TicketResolution.BUYER_FAVOR:
          return NOTIFICATION_KEYS.ticketResolved.buyerFavor;
        case TicketResolution.SELLER_FAVOR:
          return NOTIFICATION_KEYS.ticketResolved.sellerFavor;
        default:
          return NOTIFICATION_KEYS.ticketResolved.noAction;
      }
    })();

    const note = params.note?.trim() || '';
    const href = params.orderId ? `/orders/${params.orderId}` : undefined;
    const uniqueRecipients = [...new Set(params.recipientIds)];

    await this.deliver(
      uniqueRecipients.map((userId): CreateNotificationInput => ({
        userId,
        type: NotificationType.TICKET_RESOLVED,
        title: keys.title,
        body: keys.body,
        href,
        entityType: 'ticket',
        entityId: params.ticketId,
        metadata: {
          ticketId: params.ticketId,
          orderId: params.orderId ?? undefined,
          orderNumber: params.orderNumber ?? undefined,
          listingTitle: params.listingTitle ?? undefined,
          resolution: params.resolution,
          note,
        },
      })),
    );
  }

  private async deliver(inputs: CreateNotificationInput[]): Promise<void> {
    const notifications = await this.notificationsService.createMany(inputs);

    for (const notification of notifications) {
      await this.emit(notification);
    }
  }

  private async emit(notification: NotificationItem): Promise<void> {
    this.chatGateway.emitNotificationToUser(notification.userId, notification);
    await this.chatNotificationService.notifyOfflineAboutOrderNotification(
      notification,
    );
  }
}
