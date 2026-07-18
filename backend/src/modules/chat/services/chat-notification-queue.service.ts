import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  CHAT_JOB_NOTIFY_OFFLINE,
  CHAT_JOB_NOTIFY_OFFLINE_ORDER,
  CHAT_QUEUE,
  ChatNotifyOfflineJobData,
  OrderNotifyOfflineJobData,
} from '../constants/chat.constants';

@Injectable()
export class ChatNotificationQueueService {
  constructor(
    @InjectQueue(CHAT_QUEUE) private readonly chatQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async enqueueOfflineNotification(
    data: ChatNotifyOfflineJobData,
  ): Promise<void> {
    const { attempts, retryDelayMs } = this.queueOptions();

    await this.chatQueue.add(CHAT_JOB_NOTIFY_OFFLINE, data, {
      attempts,
      backoff: { type: 'fixed', delay: retryDelayMs },
      removeOnComplete: true,
      removeOnFail: false,
      jobId: `chat-notify-${data.conversationId}-${data.recipientUserId}-${Date.now()}`,
    });
  }

  async enqueueOfflineOrderNotification(
    data: OrderNotifyOfflineJobData,
  ): Promise<void> {
    const { attempts, retryDelayMs } = this.queueOptions();

    await this.chatQueue.add(CHAT_JOB_NOTIFY_OFFLINE_ORDER, data, {
      attempts,
      backoff: { type: 'fixed', delay: retryDelayMs },
      removeOnComplete: true,
      removeOnFail: false,
      jobId: `order-notify-${data.recipientUserId}-${Date.now()}`,
    });
  }

  private queueOptions() {
    const attempts = this.configService.get<number>('mail.queue.attempts', 5);
    const retryDelayMs = this.configService.get<number>(
      'mail.queue.retryDelayMs',
      60_000,
    );

    return { attempts, retryDelayMs };
  }
}
