import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { MailModule } from '../mail/mail.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UserSecurityService } from './user-security.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [FilesModule, AuthModule, MailModule, SessionsModule],
  controllers: [UsersController],
  providers: [UsersService, UserSecurityService],
  exports: [UsersService],
})
export class UsersModule {}
