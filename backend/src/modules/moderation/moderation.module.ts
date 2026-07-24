import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ModerationController } from './moderation.controller';
import { ModerationAuditService } from './services/moderation-audit.service';
import { ModerationLotsService } from './services/moderation-lots.service';
import { ModerationReportsService } from './services/moderation-reports.service';
import { ModerationReviewsService } from './services/moderation-reviews.service';
import { ModerationTicketsService } from './services/moderation-tickets.service';
import { ModerationUsersService } from './services/moderation-users.service';

@Module({
  imports: [AuthModule, SessionsModule, OrdersModule],
  controllers: [ModerationController],
  providers: [
    ModerationAuditService,
    ModerationUsersService,
    ModerationLotsService,
    ModerationReviewsService,
    ModerationReportsService,
    ModerationTicketsService,
  ],
  exports: [
    ModerationTicketsService,
    ModerationReportsService,
    ModerationUsersService,
  ],
})
export class ModerationModule {}
