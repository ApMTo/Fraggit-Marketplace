import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { MediaUrlService } from '../cloudinary/media-url.service.js';

export interface CloudinaryUploadResult {
  path: string;
  url: string;
  public_id: string;
}

@Injectable()
export class FilesService {
  constructor(private readonly mediaUrl: MediaUrlService) {}

  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          unique_filename: true,
          overwrite: false,
        },
        (error: Error | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            reject(new InternalServerErrorException('upload_failed'));
            return;
          }

          const path = result.public_id;
          resolve({
            path,
            public_id: path,
            url: this.mediaUrl.resolve(path) ?? path,
          });
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder = 'uploads',
  ): Promise<CloudinaryUploadResult[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }
}
