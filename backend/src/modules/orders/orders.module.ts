import { Module } from '@nestjs/common';
import { OrderAutoApprovalScheduler } from './schedulers/order-auto-approval.scheduler';
import { OrderCompletionService } from './services/order-completion.service';
import { OrderPaymentService } from './services/order-payment.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderPaymentService,
    OrderCompletionService,
    OrderAutoApprovalScheduler,
  ],
  exports: [OrdersService, OrderPaymentService],
})
export class OrdersModule {}
