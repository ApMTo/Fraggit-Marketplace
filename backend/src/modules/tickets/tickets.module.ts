import { Module } from '@nestjs/common';
import { ModerationModule } from '../moderation/moderation.module';
import { TicketsController } from './tickets.controller';

@Module({
  imports: [ModerationModule],
  controllers: [TicketsController],
})
export class TicketsModule {}
