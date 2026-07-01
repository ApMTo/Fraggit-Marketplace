import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(HttpExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const body: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (typeof exceptionResponse === 'string') {
      body.message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const payload = exceptionResponse as {
        message?: string | string[];
        code?: string;
      };

      if (payload.code !== undefined) {
        body.code = payload.code;
      }

      if (payload.message !== undefined) {
        body.message = payload.message;
      } else if (payload.code !== undefined) {
        body.message = payload.code;
      }
    }

    if (body.message === undefined) {
      body.message =
        status >= 500 ? 'Internal server error' : 'Bad request';
    }

    if (status >= 500) {
      this.logger.error(
        { err: exception, path: request.url },
        'Unhandled exception',
      );
    }

    response.status(status).json(body);
  }
}
