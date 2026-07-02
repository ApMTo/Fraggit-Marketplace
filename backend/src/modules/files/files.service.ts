import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
}

@Injectable()
export class FilesService {
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
          resolve({ url: result.secure_url, public_id: result.public_id });
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
