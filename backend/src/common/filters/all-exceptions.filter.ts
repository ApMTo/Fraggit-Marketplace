import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<{ method?: string; url?: string }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (status >= 500) {
      const detail =
        exception instanceof Error
          ? `${exception.name}: ${exception.message}`
          : String(exception);

      this.logger.error(
        `${request.method ?? 'UNKNOWN'} ${request.url ?? '/'} -> ${status} (${detail})`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      status: 'error',
      error: {
        message,
        code: status,
      },
    });
  }
}
