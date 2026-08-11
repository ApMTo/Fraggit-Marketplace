import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildCloudinaryBaseUrl,
  resolveMediaUrl,
  resolveMediaUrlsInTree,
} from '../../common/utils/media-url.util';

@Injectable()
export class MediaUrlService {
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    const configured = config.get<string>('cloudinary.baseUrl')?.trim();
    const cloudName = config.get<string>('cloudinary.cloudName')?.trim();

    this.baseUrl =
      configured || (cloudName ? buildCloudinaryBaseUrl(cloudName) : '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  resolve(value: string | null | undefined): string | null {
    return resolveMediaUrl(value, this.baseUrl);
  }

  resolveInTree<T>(value: T): T {
    if (!this.baseUrl) {
      return value;
    }
    return resolveMediaUrlsInTree(value, this.baseUrl);
  }
}
