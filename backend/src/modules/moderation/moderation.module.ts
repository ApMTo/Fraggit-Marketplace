import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ModerationController } from './moderation.controller';
import { ModerationAuditService } from './services/moderation-audit.service';
import { ModerationChatService } from './services/moderation-chat.service';
import { ModerationLotDisputeService } from './services/moderation-lot-dispute.service';
import { ModerationLotsService } from './services/moderation-lots.service';
import { ModerationNotificationsService } from './services/moderation-notifications.service';
import { ModerationReportsService } from './services/moderation-reports.service';
import { ModerationReviewsService } from './services/moderation-reviews.service';
import { ModerationTicketsService } from './services/moderation-tickets.service';
import { ModerationUsersService } from './services/moderation-users.service';

@Module({
  imports: [
    AuthModule,
    SessionsModule,
    OrdersModule,
    NotificationsModule,
    ChatModule,
  ],
  controllers: [ModerationController],
  providers: [
    ModerationAuditService,
    ModerationChatService,
    ModerationLotDisputeService,
    ModerationNotificationsService,
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
