import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  REVIEW_DETAIL_SELECT,
  REVIEW_LIST_SELECT,
  ReviewDetail,
  ReviewListItem,
} from './constants/review.select';
import { CreateReviewDto } from './dto/create-review.dto';
import { FindReviewsQueryDto } from './dto/find-reviews.query.dto';
import { calculateUpdatedRating } from './utils/calculate-updated-rating';

export type ReviewListResult = {
  items: ReviewListItem[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(
    buyerId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDetail> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: {
        buyerId: true,
        sellerId: true,
        status: true,
        review: { select: { id: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('order_not_found');
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('review_forbidden');
    }

    if (order.status !== OrderStatus.APPROVED) {
      throw new ConflictException('review_order_not_approved');
    }

    if (order.review) {
      throw new ConflictException('review_already_exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const seller = await tx.user.findUnique({
        where: { id: order.sellerId },
        select: { rating: true, ratingCount: true },
      });

      if (!seller) {
        throw new NotFoundException('user_not_found');
      }

      const review = await tx.review.create({
        data: {
          orderId: dto.orderId,
          reviewerId: buyerId,
          revieweeId: order.sellerId,
          rating: dto.rating,
          text: dto.text.trim(),
        },
        select: REVIEW_DETAIL_SELECT,
      });

      const updated = calculateUpdatedRating(
        seller.rating,
        seller.ratingCount,
        dto.rating,
      );

      await tx.user.update({
        where: { id: order.sellerId },
        data: updated,
      });

      return review;
    });
  }

  async findReviews(query: FindReviewsQueryDto): Promise<ReviewListResult> {
    if (!query.sellerId) {
      throw new NotFoundException('seller_id_required');
    }

    const seller = await this.prisma.user.findUnique({
      where: { id: query.sellerId },
      select: { id: true },
    });

    if (!seller) {
      throw new NotFoundException('user_not_found');
    }

    const where = { revieweeId: query.sellerId };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        select: REVIEW_LIST_SELECT,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(reviewId: string): Promise<ReviewDetail> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: REVIEW_DETAIL_SELECT,
    });

    if (!review) {
      throw new NotFoundException('review_not_found');
    }

    return review;
  }

  async findByOrderId(
    userId: string,
    orderId: string,
  ): Promise<ReviewDetail | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        buyerId: true,
        sellerId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('order_not_found');
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('review_forbidden');
    }

    return this.prisma.review.findUnique({
      where: { orderId },
      select: REVIEW_DETAIL_SELECT,
    });
  }
}
