import { Injectable, NotFoundException } from '@nestjs/common';
import { ModerationActionType, ModerationTargetType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { REVIEW_DETAIL_SELECT } from '../../reviews/constants/review.select';
import { ModerationAuditService } from './moderation-audit.service';

@Injectable()
export class ModerationReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ModerationAuditService,
  ) {}

  async hide(actorId: string, reviewId: string, reason: string) {
    const review = await this.requireReview(reviewId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          hiddenAt: new Date(),
          hiddenById: actorId,
        },
        select: REVIEW_DETAIL_SELECT,
      });

      await this.audit.append(
        {
          actorId,
          actionType: ModerationActionType.REVIEW_HIDE,
          targetType: ModerationTargetType.REVIEW,
          targetId: reviewId,
          reason,
          before: { hiddenAt: review.hiddenAt },
          after: { hiddenAt: updated.hiddenAt },
        },
        tx,
      );

      return { review: updated };
    });
  }

  async unhide(actorId: string, reviewId: string, reason: string) {
    const review = await this.requireReview(reviewId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          hiddenAt: null,
          hiddenById: null,
        },
        select: REVIEW_DETAIL_SELECT,
      });

      await this.audit.append(
        {
          actorId,
          actionType: ModerationActionType.REVIEW_UNHIDE,
          targetType: ModerationTargetType.REVIEW,
          targetId: reviewId,
          reason,
          before: { hiddenAt: review.hiddenAt },
          after: { hiddenAt: null },
        },
        tx,
      );

      return { review: updated };
    });
  }

  private async requireReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, hiddenAt: true },
    });

    if (!review) {
      throw new NotFoundException({ code: 'errors.review_not_found' });
    }

    return review;
  }
}
