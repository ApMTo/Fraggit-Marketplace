import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe.js';
import { FilesService } from './files.service.js';

const imageValidationPipe = new FileValidationPipe({
  maxSizeInBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
});

const storageOptions = { storage: memoryStorage() };

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', storageOptions))
  async upload(@UploadedFile(imageValidationPipe) file: Express.Multer.File) {
    return this.filesService.uploadFile(file);
  }

  @Post('upload-multiple')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FilesInterceptor('files', 10, storageOptions))
  async uploadMultiple(
    @UploadedFiles(imageValidationPipe) files: Express.Multer.File[],
  ) {
    return this.filesService.uploadMultiple(files);
  }
}
