import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ORDER_QUEUE } from '../constants/order.constants';
import { OrdersService } from '../orders.service';

@Processor(ORDER_QUEUE)
export class OrderAutoApprovalProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderAutoApprovalProcessor.name);

  constructor(private readonly ordersService: OrdersService) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const processed = await this.ordersService.processExpiredOrders();

    if (processed > 0) {
      this.logger.log(`Auto-approved ${processed} order(s)`);
    }
  }
}
