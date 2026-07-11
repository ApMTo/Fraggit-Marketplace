import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type PaymentResult =
  { success: true } | { success: false; reason: string };

/**
 * Payment abstraction for order creation.
 * MVP: payment succeeds immediately.
 * Future: integrate a real payment provider and return pending state.
 */
@Injectable()
export class OrderPaymentService {
  processPayment(
    _buyerId: string,
    _lotId: string,
    _amount: Prisma.Decimal,
  ): Promise<PaymentResult> {
    return Promise.resolve({ success: true });
  }
}
