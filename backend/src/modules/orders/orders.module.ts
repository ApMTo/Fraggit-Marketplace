import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { ORDER_QUEUE } from './constants/order.constants';
import { OrderQueueService } from './order-queue.service';
import { OrderAutoApprovalProcessor } from './processors/order-auto-approval.processor';
import { OrderAutoApprovalScheduler } from './schedulers/order-auto-approval.scheduler';
import { OrderCompletionService } from './services/order-completion.service';
import { OrderPaymentService } from './services/order-payment.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [BullModule.registerQueue({ name: ORDER_QUEUE }), ChatModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderPaymentService,
    OrderCompletionService,
    OrderQueueService,
    OrderAutoApprovalProcessor,
    OrderAutoApprovalScheduler,
  ],
  exports: [OrdersService, OrderPaymentService],
})
export class OrdersModule {}
