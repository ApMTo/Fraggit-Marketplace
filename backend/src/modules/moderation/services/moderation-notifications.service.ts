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

  async notifyTicketVerdictRequested(params: {
    recipientIds: string[];
    ticketId: string;
    subject: string;
    summary: string;
    moderatorId: string;
  }): Promise<void> {
    const keys = NOTIFICATION_KEYS.ticketVerdictRequested;
    const note = params.summary.trim();
    const href = `/moderation/tickets/${params.ticketId}`;
    const uniqueRecipients = [...new Set(params.recipientIds)].filter(
      (id) => id !== params.moderatorId,
    );

    if (uniqueRecipients.length === 0) {
      return;
    }

    await this.deliver(
      uniqueRecipients.map((userId): CreateNotificationInput => ({
        userId,
        type: NotificationType.TICKET_VERDICT_REQUESTED,
        title: keys.title,
        body: keys.body,
        href,
        entityType: 'ticket',
        entityId: params.ticketId,
        metadata: {
          ticketId: params.ticketId,
          subject: params.subject,
          note,
          moderatorId: params.moderatorId,
        },
      })),
    );
  }

  async notifyReportVerdictRequested(params: {
    recipientIds: string[];
    reportId: string;
    targetUsername: string;
    reporterUsername: string;
    summary: string;
    moderatorId: string;
  }): Promise<void> {
    const keys = NOTIFICATION_KEYS.reportVerdictRequested;
    const note = params.summary.trim();
    const href = `/moderation/reports/users?report=${params.reportId}`;
    const uniqueRecipients = [...new Set(params.recipientIds)].filter(
      (id) => id !== params.moderatorId,
    );

    if (uniqueRecipients.length === 0) {
      return;
    }

    await this.deliver(
      uniqueRecipients.map((userId): CreateNotificationInput => ({
        userId,
        type: NotificationType.REPORT_VERDICT_REQUESTED,
        title: keys.title,
        body: keys.body,
        href,
        entityType: 'report',
        entityId: params.reportId,
        metadata: {
          reportId: params.reportId,
          targetUsername: params.targetUsername,
          reporterUsername: params.reporterUsername,
          note,
          moderatorId: params.moderatorId,
        },
      })),
    );
  }

  async notifyLotDisputeMessage(params: {
    recipientIds: string[];
    roomId: string;
    lotId: string;
    lotTitle: string;
    reportId?: string;
    authorUsername?: string;
    preview?: string;
    href: string;
  }): Promise<void> {
    const keys = NOTIFICATION_KEYS.lotDisputeMessage;
    const uniqueRecipients = [...new Set(params.recipientIds)];
    const preview = params.preview?.trim() ? ` ${params.preview.trim()}` : '';

    await this.deliver(
      uniqueRecipients.map((userId): CreateNotificationInput => ({
        userId,
        type: NotificationType.LOT_DISPUTE_MESSAGE,
        title: keys.title,
        body: keys.body,
        href: params.href,
        entityType: 'lot_dispute_room',
        entityId: params.roomId,
        metadata: {
          lotId: params.lotId,
          listingTitle: params.lotTitle,
          reportId: params.reportId,
          authorUsername: params.authorUsername,
          preview,
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
