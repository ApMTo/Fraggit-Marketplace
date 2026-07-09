import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import {
  CHAT_JOB_NOTIFY_OFFLINE,
  CHAT_QUEUE,
  ChatNotifyOfflineJobData,
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

  async process(job: Job<ChatNotifyOfflineJobData>): Promise<void> {
    if (job.name !== CHAT_JOB_NOTIFY_OFFLINE) {
      return;
    }

    const { recipientUserId, recipientEmail, senderDisplayName, conversationId } =
      job.data;

    const isOnline = await this.chatPresence.isOnline(recipientUserId);

    if (isOnline) {
      this.logger.info(
        { jobId: job.id, recipientUserId, conversationId },
        'Skipping offline email — user is online now',
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
      'Sending offline chat notification email',
    );

    await this.chatNotificationService.sendOfflineEmail({
      recipientEmail,
      senderDisplayName,
      conversationId,
      messagePreview: job.data.messagePreview,
    });
  }
}
