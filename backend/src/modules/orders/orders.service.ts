import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LotStatus, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ORDER_AUTO_APPROVAL_MS,
} from './constants/order.constants';
import {
  ORDER_DETAIL_SELECT,
  ORDER_LIST_SELECT,
  OrderDetail,
  OrderListItem,
} from './constants/order.select';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto, OrderRole } from './dto/find-orders.query.dto';
import { SubmitCredentialsDto } from './dto/submit-credentials.dto';
import { OrderCompletionService } from './services/order-completion.service';
import { OrderPaymentService } from './services/order-payment.service';
import { ChatService } from '../chat/chat.service';
import { generateOrderNumber } from './utils/generate-order-number.util';

export type OrderListResult = {
  items: OrderListItem[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderPaymentService: OrderPaymentService,
    private readonly orderCompletionService: OrderCompletionService,
    private readonly chatService: ChatService,
  ) {}

  async createOrder(buyerId: string, dto: CreateOrderDto): Promise<OrderDetail> {
    const lot = await this.prisma.lot.findUnique({
      where: { id: dto.lotId },
      select: {
        id: true,
        title: true,
        sellerId: true,
        price: true,
        stock: true,
        status: true,
      },
    });

    if (!lot) {
      throw new NotFoundException('lot_not_found');
    }

    if (lot.sellerId === buyerId) {
      throw new BadRequestException('order_cannot_buy_own_lot');
    }

    if (lot.status !== LotStatus.OPEN) {
      throw new ConflictException('lot_not_available');
    }

    if (lot.stock < 1) {
      throw new ConflictException('insufficient_stock');
    }

    const payment = await this.orderPaymentService.processPayment(
      buyerId,
      lot.id,
      lot.price,
    );

    if (!payment.success) {
      throw new ConflictException(payment.reason);
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const currentLot = await tx.lot.findUnique({
        where: { id: lot.id },
        select: { stock: true, status: true, price: true },
      });

      if (
        !currentLot ||
        currentLot.status !== LotStatus.OPEN ||
        currentLot.stock < 1
      ) {
        throw new ConflictException('insufficient_stock');
      }

      const newStock = currentLot.stock - 1;
      const orderNumber = await generateOrderNumber(tx);

      await tx.lot.update({
        where: { id: lot.id },
        data: {
          stock: newStock,
          ...(newStock === 0 ? { status: LotStatus.ARCHIVED } : {}),
        },
      });

      return tx.order.create({
        data: {
          orderNumber,
          lotId: lot.id,
          buyerId,
          sellerId: lot.sellerId,
          price: currentLot.price,
          status: OrderStatus.PENDING,
        },
        select: ORDER_DETAIL_SELECT,
      });
    });

    await this.chatService.onOrderCreated({
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      listingId: lot.id,
      listingTitle: lot.title,
    });

    return order;
  }

  async findOrders(
    userId: string,
    query: FindOrdersQueryDto,
  ): Promise<OrderListResult> {
    const where: Prisma.OrderWhereInput = {};

    if (query.role === OrderRole.BUYER) {
      where.buyerId = userId;
    } else if (query.role === OrderRole.SELLER) {
      where.sellerId = userId;
    } else {
      where.OR = [{ buyerId: userId }, { sellerId: userId }];
    }

    if (query.status) {
      where.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        select: ORDER_LIST_SELECT,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(userId: string, orderId: string): Promise<OrderDetail> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: ORDER_DETAIL_SELECT,
    });

    if (!order) {
      throw new NotFoundException('order_not_found');
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('order_forbidden');
    }

    return order;
  }

  async submitCredentials(
    sellerId: string,
    orderId: string,
    dto: SubmitCredentialsDto,
  ): Promise<OrderDetail> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        sellerId: true,
        status: true,
      },
    });

    if (!order) {
      throw new NotFoundException('order_not_found');
    }

    if (order.sellerId !== sellerId) {
      throw new ForbiddenException('order_forbidden');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException('order_credentials_not_allowed');
    }

    const now = new Date();
    const autoApproveAt = new Date(now.getTime() + ORDER_AUTO_APPROVAL_MS);

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        credentials: dto.credentials.trim(),
        credentialsProvidedAt: now,
        autoApproveAt,
        status: OrderStatus.AWAITING_BUYER_CONFIRMATION,
      },
      select: ORDER_DETAIL_SELECT,
    });
  }

  async confirmByBuyer(
    buyerId: string,
    orderId: string,
  ): Promise<OrderDetail> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        buyerId: true,
        status: true,
      },
    });

    if (!order) {
      throw new NotFoundException('order_not_found');
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('order_forbidden');
    }

    if (order.status !== OrderStatus.AWAITING_BUYER_CONFIRMATION) {
      throw new ConflictException('order_confirm_not_allowed');
    }

    const approved = await this.orderCompletionService.approveOrder(orderId);

    if (!approved) {
      throw new ConflictException('order_confirm_not_allowed');
    }

    return approved;
  }

  async processExpiredOrders(): Promise<number> {
    const now = new Date();

    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.AWAITING_BUYER_CONFIRMATION,
        autoApproveAt: { lte: now },
      },
      select: { id: true },
      take: 100,
    });

    let processed = 0;

    for (const order of expiredOrders) {
      const result = await this.orderCompletionService.approveOrder(order.id);
      if (result) {
        processed += 1;
      }
    }

    return processed;
  }
}
