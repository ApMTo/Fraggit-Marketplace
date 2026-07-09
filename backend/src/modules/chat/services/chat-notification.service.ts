import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailQueueService } from '../../mail/mail-queue.service';
import { buildMessagePreviewText } from '../constants/chat.select';
import { ChatMessage } from '../constants/chat.select';
import { ChatNotificationQueueService } from './chat-notification-queue.service';
import { ChatPresenceService } from './chat-presence.service';
import { MessageService } from './message.service';

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

    const chatUrl = `${frontendUrl}/chat/${data.conversationId}`;
    const preview = data.messagePreview || 'Новое сообщение';

    const subject = `Новое сообщение от ${data.senderDisplayName}`;
    const html = `
      <p><strong>${escapeHtml(data.senderDisplayName)}</strong> отправил(а) вам сообщение:</p>
      <p>${escapeHtml(preview)}</p>
      <p><a href="${escapeHtml(chatUrl)}">Открыть чат</a></p>
    `;

    await this.mailQueue.enqueue({
      to: data.recipientEmail,
      subject,
      html,
      type: 'chat_notification',
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
