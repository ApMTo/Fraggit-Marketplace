import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveNotificationEmailText } from '../../notifications/constants/notification-i18n';
import { NotificationItem } from '../../notifications/constants/notification.select';
import { MailQueueService } from '../../mail/mail-queue.service';
import { EmailTemplates } from '../../mail/utils/email-templates';
import { buildMessagePreviewText } from '../constants/chat.select';
import { ChatMessage } from '../constants/chat.select';
import { ChatNotificationQueueService } from './chat-notification-queue.service';
import { ChatPresenceService } from './chat-presence.service';
import { MessageService } from './message.service';

function notificationParams(
  metadata: NotificationItem['metadata'],
): Record<string, string> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const record = metadata as Record<string, unknown>;
  const params: Record<string, string> = {};

  for (const key of ['orderNumber', 'listingTitle', 'note'] as const) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') {
      params[key] = String(value);
    }
  }

  return params;
}

@Injectable()
export class ChatNotificationService {
  constructor(
    private readonly chatPresence: ChatPresenceService,
    private readonly chatNotificationQueue: ChatNotificationQueueService,
    private readonly messageService: MessageService,
    private readonly mailQueue: MailQueueService,
    private readonly configService: ConfigService,
  ) {}

  async notifyAboutNewMessage(
    message: ChatMessage,
    senderDisplayName: string,
  ): Promise<void> {
    if (!message.senderId) {
      return;
    }

    const recipientId = await this.messageService.getOtherParticipantId(
      message.conversationId,
      message.senderId,
    );

    const isOnline = await this.chatPresence.isOnline(recipientId);

    if (isOnline) {
      return;
    }

    const recipientEmail = await this.messageService.getUserEmail(recipientId);
    const preview = buildMessagePreviewText(message.type, message.content);

    await this.chatNotificationQueue.enqueueOfflineNotification({
      recipientUserId: recipientId,
      recipientEmail,
      senderDisplayName,
      conversationId: message.conversationId,
      messagePreview: preview,
    });
  }

  async notifyOfflineAboutOrderNotification(
    notification: NotificationItem,
  ): Promise<void> {
    const isOnline = await this.chatPresence.isOnline(notification.userId);

    if (isOnline) {
      return;
    }

    const recipientEmail = await this.messageService.getUserEmail(
      notification.userId,
    );
    const frontendUrl = this.configService.get<string>(
      'frontendUrl',
      'http://localhost:3000',
    );
    const href = notification.href
      ? `${frontendUrl}${notification.href.startsWith('/') ? '' : '/'}${notification.href}`
      : frontendUrl;

    const params = notificationParams(notification.metadata);
    const title = resolveNotificationEmailText(notification.title, params);
    const body = notification.body
      ? resolveNotificationEmailText(notification.body, params)
      : '';

    await this.chatNotificationQueue.enqueueOfflineOrderNotification({
      recipientUserId: notification.userId,
      recipientEmail,
      subject: title,
      title,
      body,
      href,
    });
  }

  async sendOfflineEmail(data: {
    recipientEmail: string;
    senderDisplayName: string;
    conversationId: string;
    messagePreview: string;
  }): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'frontendUrl',
      'http://localhost:3000',
    );

    const preview = data.messagePreview || 'New message';
    const subject = `New message from ${data.senderDisplayName}`;
    const html = EmailTemplates.renderChatNotificationEmail({
      frontendUrl,
      senderDisplayName: data.senderDisplayName,
      conversationId: data.conversationId,
      messagePreview: preview,
    });

    await this.mailQueue.enqueue({
      to: data.recipientEmail,
      subject,
      html,
      type: 'chat_notification',
    });
  }

  async sendOfflineOrderEmail(data: {
    recipientEmail: string;
    subject: string;
    title: string;
    body: string;
    href: string;
  }): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'frontendUrl',
      'http://localhost:3000',
    );

    const html = EmailTemplates.renderOrderNotificationEmail({
      frontendUrl,
      title: data.title,
      body: data.body,
      href: data.href,
    });

    await this.mailQueue.enqueue({
      to: data.recipientEmail,
      subject: data.subject,
      html,
      type: 'order_notification',
    });
  }
}
