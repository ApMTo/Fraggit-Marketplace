import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../database/redis.service';
import { resolveNotificationEmailText } from '../../notifications/constants/notification-i18n';
import { NotificationItem } from '../../notifications/constants/notification.select';
import { MailQueueService } from '../../mail/mail-queue.service';
import { EmailTemplates } from '../../mail/utils/email-templates';
import { TelegramService } from '../../telegram/telegram.service';
import {
  CHAT_NOTIFY_COOLDOWN_KEY_PREFIX,
  CHAT_NOTIFY_COOLDOWN_SECONDS,
} from '../constants/chat.constants';
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

  for (const key of [
    'orderNumber',
    'listingTitle',
    'note',
    'subject',
    'targetUsername',
    'reporterUsername',
    'preview',
  ] as const) {
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
    private readonly telegramService: TelegramService,
    private readonly redis: RedisService,
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

    const allowed = await this.claimChatNotifyCooldown(
      recipientId,
      message.senderId,
    );
    if (!allowed) {
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

  private async claimChatNotifyCooldown(
    recipientUserId: string,
    senderUserId: string,
  ): Promise<boolean> {
    const key = `${CHAT_NOTIFY_COOLDOWN_KEY_PREFIX}${recipientUserId}:${senderUserId}`;
    const claimed = await this.redis.setIfNotExists(
      key,
      '1',
      CHAT_NOTIFY_COOLDOWN_SECONDS,
    );
    return claimed !== false;
  }

  async notifyOfflineAboutOrderNotification(
    notification: NotificationItem,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'frontendUrl',
      'http://localhost:3000',
    );
    const href = notification.href
      ? `${frontendUrl}${notification.href.startsWith('/') ? '' : '/'}${notification.href}`
      : frontendUrl;
    const params = notificationParams(notification.metadata);

    const isOnline = await this.chatPresence.isOnline(notification.userId);

    if (isOnline) {
      await this.telegramService.tryNotifyOfflineOrder({
        recipientUserId: notification.userId,
        titleKey: notification.title,
        bodyKey: notification.body,
        notificationParams: params,
        href,
      });
      return;
    }

    const recipientEmail = await this.messageService.getUserEmail(
      notification.userId,
    );
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
      titleKey: notification.title,
      bodyKey: notification.body,
      notificationParams: params,
    });
  }

  async deliverOfflineChat(data: {
    recipientUserId: string;
    recipientEmail: string;
    senderDisplayName: string;
    conversationId: string;
    messagePreview: string;
  }): Promise<void> {
    const viaTelegram = await this.telegramService.tryNotifyOfflineChat({
      recipientUserId: data.recipientUserId,
      senderDisplayName: data.senderDisplayName,
      conversationId: data.conversationId,
      messagePreview: data.messagePreview,
    });

    if (viaTelegram) {
      return;
    }

    await this.sendOfflineEmail(data);
  }

  async deliverOfflineOrder(data: {
    recipientUserId: string;
    recipientEmail: string;
    subject: string;
    title: string;
    body: string;
    href: string;
    titleKey: string;
    bodyKey?: string | null;
    notificationParams: Record<string, string>;
  }): Promise<void> {
    const viaTelegram = await this.telegramService.tryNotifyOfflineOrder({
      recipientUserId: data.recipientUserId,
      titleKey: data.titleKey,
      bodyKey: data.bodyKey,
      notificationParams: data.notificationParams,
      href: data.href,
    });

    if (viaTelegram) {
      return;
    }

    await this.sendOfflineOrderEmail(data);
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
