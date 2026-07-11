import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ORDER_DETAIL_SELECT, OrderDetail } from '../constants/order.select';

@Injectable()
export class OrderCompletionService {
  constructor(private readonly prisma: PrismaService) {}

  async approveOrder(orderId: string): Promise<OrderDetail | null> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          sellerId: true,
        },
      });

      if (!order || order.status === OrderStatus.APPROVED) {
        return null;
      }

      if (order.status !== OrderStatus.AWAITING_BUYER_CONFIRMATION) {
        return null;
      }

      const now = new Date();

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.APPROVED,
          approvedAt: now,
          autoApproveAt: null,
        },
      });

      await tx.user.update({
        where: { id: order.sellerId },
        data: { successfulSales: { increment: 1 } },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        select: ORDER_DETAIL_SELECT,
      });
    });
  }
}
