import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import {
  CHAT_JOB_NOTIFY_OFFLINE,
  CHAT_JOB_NOTIFY_OFFLINE_ORDER,
  CHAT_QUEUE,
  ChatNotifyOfflineJobData,
  OrderNotifyOfflineJobData,
} from '../constants/chat.constants';
import { ChatNotificationService } from '../services/chat-notification.service';
import { ChatPresenceService } from '../services/chat-presence.service';

@Processor(CHAT_QUEUE)
export class ChatNotificationProcessor extends WorkerHost {
  constructor(
    private readonly chatNotificationService: ChatNotificationService,
    private readonly chatPresence: ChatPresenceService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(ChatNotificationProcessor.name);
  }

  async process(
    job: Job<ChatNotifyOfflineJobData | OrderNotifyOfflineJobData>,
  ): Promise<void> {
    if (job.name === CHAT_JOB_NOTIFY_OFFLINE) {
      await this.processChatOffline(job as Job<ChatNotifyOfflineJobData>);
      return;
    }

    if (job.name === CHAT_JOB_NOTIFY_OFFLINE_ORDER) {
      await this.processOrderOffline(job as Job<OrderNotifyOfflineJobData>);
    }
  }

  private async processChatOffline(
    job: Job<ChatNotifyOfflineJobData>,
  ): Promise<void> {
    const {
      recipientUserId,
      recipientEmail,
      senderDisplayName,
      conversationId,
    } = job.data;

    const isOnline = await this.chatPresence.isOnline(recipientUserId);

    if (isOnline) {
      this.logger.info(
        { jobId: job.id, recipientUserId, conversationId },
        'Skipping offline notification — user is online now',
      );
      return;
    }

    this.logger.info(
      {
        jobId: job.id,
        recipientUserId,
        conversationId,
        attempt: job.attemptsMade + 1,
      },
      'Delivering offline chat notification',
    );

    await this.chatNotificationService.deliverOfflineChat({
      recipientUserId,
      recipientEmail,
      senderDisplayName,
      conversationId,
      messagePreview: job.data.messagePreview,
    });
  }

  private async processOrderOffline(
    job: Job<OrderNotifyOfflineJobData>,
  ): Promise<void> {
    const data = job.data;

    const isOnline = await this.chatPresence.isOnline(data.recipientUserId);

    if (isOnline) {
      this.logger.info(
        { jobId: job.id, recipientUserId: data.recipientUserId },
        'Skipping offline order notification — user is online now',
      );
      return;
    }

    this.logger.info(
      {
        jobId: job.id,
        recipientUserId: data.recipientUserId,
        attempt: job.attemptsMade + 1,
      },
      'Delivering offline order notification',
    );

    await this.chatNotificationService.deliverOfflineOrder(data);
  }
}
