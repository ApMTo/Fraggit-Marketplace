import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { BlogLatestCache } from './blog-latest.cache';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [AuthModule, FilesModule],
  controllers: [BlogController],
  providers: [BlogService, BlogLatestCache],
  exports: [BlogService],
})
export class BlogModule {}
