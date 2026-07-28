import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ method?: string; url?: string }>();

    let httpException: HttpException;

    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target as string[] | undefined;

        if (target?.includes('name')) {
          httpException = new ConflictException(
            'organization_name_already_exists',
          );
        } else if (target?.includes('ownerId')) {
          httpException = new ConflictException(
            'user_already_owns_organization',
          );
        } else if (target?.includes('userId') && target?.includes('jobId')) {
          httpException = new ConflictException('already_applied_to_job');
        } else {
          httpException = new ConflictException('unique_constraint_failed');
        }
        break;
      }

      case 'P2003':
        httpException = new NotFoundException('referenced_record_not_found');
        break;

      case 'P2025':
        httpException = new NotFoundException('record_not_found');
        break;

      default:
        this.logger.error(
          `Prisma ${exception.code} on ${request.method ?? 'UNKNOWN'} ${request.url ?? '/'}: ${exception.message}`,
          JSON.stringify(exception.meta),
        );
        httpException = new InternalServerErrorException({
          message: 'database_error',
          prismaCode: exception.code,
        });
    }

    const status = httpException.getStatus();
    const message = httpException.getResponse();

    response.status(status).json({
      status: 'error',
      error: {
        message,
        code: status,
      },
    });
  }
}
