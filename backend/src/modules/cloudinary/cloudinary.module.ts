import { Global, Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider.js';
import { MediaUrlService } from './media-url.service.js';

@Global()
@Module({
  providers: [CloudinaryProvider, MediaUrlService],
  exports: [CloudinaryProvider, MediaUrlService],
})
export class CloudinaryModule {}
