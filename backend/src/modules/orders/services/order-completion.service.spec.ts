import { OrderStatus } from '@prisma/client';
import { OrderCompletionService } from './order-completion.service';

describe('OrderCompletionService', () => {
  let service: OrderCompletionService;
  let tx: {
    order: {
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
    };
    user: { update: jest.Mock };
  };

  beforeEach(() => {
    tx = {
      order: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      user: { update: jest.fn() },
    };

    const prisma = {
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    service = new OrderCompletionService(prisma as never);
  });

  it('returns null when order is missing', async () => {
    tx.order.findUnique.mockResolvedValue(null);

    await expect(service.approveOrder('order-1')).resolves.toBeNull();
  });

  it('returns null when order is already approved', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.APPROVED,
      sellerId: 'seller-1',
    });

    await expect(service.approveOrder('order-1')).resolves.toBeNull();
  });

  it('returns null for invalid status transition', async () => {
    tx.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.PENDING,
      sellerId: 'seller-1',
    });

    await expect(service.approveOrder('order-1')).resolves.toBeNull();
  });

  it('approves order and increments seller sales', async () => {
    const approvedOrder = { id: 'order-1', status: OrderStatus.APPROVED };

    tx.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.AWAITING_BUYER_CONFIRMATION,
      sellerId: 'seller-1',
    });
    tx.order.findUniqueOrThrow.mockResolvedValue(approvedOrder);

    await expect(service.approveOrder('order-1')).resolves.toEqual(
      approvedOrder,
    );

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: expect.objectContaining({
        status: OrderStatus.APPROVED,
        autoApproveAt: null,
        disputePausedFromStatus: null,
        autoApproveRemainingMs: null,
      }),
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'seller-1' },
      data: { successfulSales: { increment: 1 } },
    });
  });
});
