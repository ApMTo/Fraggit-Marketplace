import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderQueueService } from '../order-queue.service';

@Injectable()
export class OrderAutoApprovalScheduler {
  private readonly logger = new Logger(OrderAutoApprovalScheduler.name);

  constructor(private readonly orderQueueService: OrderQueueService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleExpiredOrdersCheck(): Promise<void> {
    await this.orderQueueService.enqueueExpiredOrdersCheck();
    this.logger.debug('Enqueued expired orders check job');
  }
}
