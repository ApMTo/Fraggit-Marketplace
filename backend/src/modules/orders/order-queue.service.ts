import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  ORDER_JOB_PROCESS_EXPIRED,
  ORDER_QUEUE,
} from './constants/order.constants';

@Injectable()
export class OrderQueueService {
  constructor(@InjectQueue(ORDER_QUEUE) private readonly orderQueue: Queue) {}

  async enqueueExpiredOrdersCheck(): Promise<void> {
    const hourBucket = new Date().toISOString().slice(0, 13);

    await this.orderQueue.add(ORDER_JOB_PROCESS_EXPIRED, {}, {
      jobId: `expired-orders-${hourBucket}`,
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: { type: 'fixed', delay: 60_000 },
    });
  }
}
