import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
}

type FilesObject = Record<string, UploadedFile[]>;

interface FileValidationOptions {
  maxSizeInBytes: number;
  allowedMimeTypes: string[];
  optional?: boolean;
  maxFiles?: number;
}

@Injectable()
export class FileValidationPipe implements PipeTransform<
  UploadedFile | UploadedFile[] | FilesObject
> {
  constructor(private options: FileValidationOptions) {}

  transform(
    value: UploadedFile | UploadedFile[] | FilesObject | undefined,
    _metadata: ArgumentMetadata,
  ) {
    if (!value) {
      if (this.options.optional) return undefined;
      throw new BadRequestException('file_required');
    }

    const maxFiles = this.options.maxFiles ?? 1;

    if (Array.isArray(value)) {
      if (value.length > maxFiles) {
        throw new BadRequestException('too_many_files');
      }

      value.forEach((file) => this.validateFile(file));
      return value;
    }

    if (this.isFilesObject(value)) {
      for (const [field, files] of Object.entries(value)) {
        if (files.length > maxFiles) {
          throw new BadRequestException('field_too_many_files');
        }

        files.forEach((file) => this.validateFile(file, field));
      }
      return value;
    }

    this.validateFile(value);
    return value;
  }

  private isFilesObject(
    value: UploadedFile | UploadedFile[] | FilesObject,
  ): value is FilesObject {
    return (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !('mimetype' in value)
    );
  }

  private validateFile(file: UploadedFile, _fieldName?: string) {
    if (file.size > this.options.maxSizeInBytes) {
      throw new BadRequestException('file_size_exceeded');
    }

    if (!this.options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('invalid_file_type');
    }
  }
}
