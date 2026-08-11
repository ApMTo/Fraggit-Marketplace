import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { MediaUrlService } from '../../modules/cloudinary/media-url.service';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly mediaUrl?: MediaUrlService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data: unknown) => ({
        status: 'success',
        result: this.mediaUrl ? this.mediaUrl.resolveInTree(data) : data,
      })),
    );
  }
}
