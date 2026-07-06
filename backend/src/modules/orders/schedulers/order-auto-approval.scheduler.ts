import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrdersService } from '../orders.service';

@Injectable()
export class OrderAutoApprovalScheduler {
  private readonly logger = new Logger(OrderAutoApprovalScheduler.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Cron('0 */15 * * * *')
  async handleExpiredOrders(): Promise<void> {
    const processed = await this.ordersService.processExpiredOrders();

    if (processed > 0) {
      this.logger.log(`Auto-approved ${processed} order(s)`);
    }
  }
}
