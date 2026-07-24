import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ORDER_DETAIL_SELECT, OrderDetail } from '../constants/order.select';

type ApproveOptions = {
  /** Statuses from which approval is allowed. Default: AWAITING_BUYER_CONFIRMATION. */
  fromStatuses?: OrderStatus[];
  tx?: Prisma.TransactionClient;
};

@Injectable()
export class OrderCompletionService {
  constructor(private readonly prisma: PrismaService) {}

  async approveOrder(
    orderId: string,
    options?: ApproveOptions,
  ): Promise<OrderDetail | null> {
    const fromStatuses = options?.fromStatuses ?? [
      OrderStatus.AWAITING_BUYER_CONFIRMATION,
    ];
    const run = async (tx: Prisma.TransactionClient) => {
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

      if (!fromStatuses.includes(order.status)) {
        return null;
      }

      const now = new Date();

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.APPROVED,
          approvedAt: now,
          autoApproveAt: null,
          disputePausedFromStatus: null,
          autoApproveRemainingMs: null,
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
    };

    if (options?.tx) {
      return run(options.tx);
    }

    return this.prisma.$transaction(run);
  }
}
