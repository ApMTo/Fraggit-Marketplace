import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  MAIL_JOB_SEND,
  MAIL_QUEUE,
  SendMailJobData,
} from './constants/mail.constants';

@Injectable()
export class MailQueueService {
  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async enqueue(data: SendMailJobData): Promise<void> {
    const attempts = this.configService.get<number>('mail.queue.attempts', 5);
    const retryDelayMs = this.configService.get<number>(
      'mail.queue.retryDelayMs',
      60_000,
    );

    await this.mailQueue.add(MAIL_JOB_SEND, data, {
      attempts,
      backoff: { type: 'fixed', delay: retryDelayMs },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
